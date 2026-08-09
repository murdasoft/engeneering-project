#!/usr/bin/env python3
"""Acceptance eval for InspectAI crack ensemble (local weights or live ML API).

Examples:
  # Live Space after Kaggle upload + reboot
  python3 eval_ensemble.py --url https://alllxndr-inspectai-ml.hf.space

  # Local best.pt via run_ensemble (needs deps)
  python3 eval_ensemble.py --local

  # Custom images + min confidence gate
  python3 eval_ensemble.py --url https://alllxndr-inspectai-ml.hf.space \\
      --images datasets/crack-seg/images/val/*.jpg test_crack_ui.png \\
      --min-conf 0.55 --max-blob-area-ratio 0.08
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent
DEFAULT_IMAGES = [
    ROOT / "datasets/crack-seg/images/val/1604.rf.7229a9adfa1c9ec285d55c965172ea32.jpg",
    ROOT / "datasets/crack-seg/images/val/1605.rf.53a5ea427ceda0b3d6abbc79c64efc36.jpg",
    ROOT / "datasets/crack-seg/images/val/1610.rf.3271e8c1058a3a701de2d96b621e9080.jpg",
    ROOT / "test_crack_ui.png",
]


def _multipart(path: Path, field: str = "file") -> Tuple[bytes, str]:
    boundary = "----inspectaiEvalBoundary"
    data = path.read_bytes()
    ctype = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field}"; filename="{path.name}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n"
    ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
    return body, boundary


def predict_live(
    url: str,
    image: Path,
    threshold: float,
    api_key: str = "",
) -> Dict[str, Any]:
    body, boundary = _multipart(image)
    endpoint = f"{url.rstrip('/')}/predict?threshold={threshold}"
    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    if api_key:
        headers["X-API-Key"] = api_key
    req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=300) as resp:
        return json.loads(resp.read().decode())


def predict_local(image: Path, threshold: float) -> Dict[str, Any]:
    import numpy as np
    from PIL import Image

    # Import after path setup so local best.pt resolves from ml-service cwd
    os.chdir(ROOT)
    from main import MODEL_VERSION, run_ensemble

    arr = np.array(Image.open(image).convert("RGB"))
    h, w = arr.shape[:2]
    boxes, confs, names, _ = run_ensemble(arr, threshold)
    detections = []
    for box, conf, name in zip(boxes, confs, names):
        x1, y1, x2, y2 = box
        detections.append(
            {
                "class": name,
                "confidence": float(conf),
                "bbox": {
                    "x": float(x1),
                    "y": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1),
                },
            }
        )
    return {
        "model_version": MODEL_VERSION,
        "image_width": w,
        "image_height": h,
        "detections": detections,
        "processing_time": None,
    }


def crack_dets(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    return [d for d in payload.get("detections", []) if str(d.get("class", "")).lower() == "crack"]


def area_ratio(det: Dict[str, Any], img_w: int, img_h: int) -> float:
    b = det.get("bbox") or {}
    area = float(b.get("width", 0)) * float(b.get("height", 0))
    total = max(1, img_w * img_h)
    return area / total


def aspect(det: Dict[str, Any]) -> float:
    b = det.get("bbox") or {}
    w = max(1e-6, float(b.get("width", 0)))
    h = max(1e-6, float(b.get("height", 0)))
    return min(w, h) / max(w, h)


def evaluate_image(
    payload: Dict[str, Any],
    min_conf: float,
    max_blob_area_ratio: float,
) -> Dict[str, Any]:
    cracks = crack_dets(payload)
    img_w = int(payload.get("image_width") or 1)
    img_h = int(payload.get("image_height") or 1)
    max_conf = max((float(d["confidence"]) for d in cracks), default=0.0)
    blobs = [
        d
        for d in cracks
        if float(d["confidence"]) < 0.35
        and area_ratio(d, img_w, img_h) > max_blob_area_ratio
        and aspect(d) > 0.55
    ]
    top = sorted(cracks, key=lambda d: float(d["confidence"]), reverse=True)[:3]
    passed = bool(cracks) and max_conf >= min_conf and len(blobs) == 0
    return {
        "passed": passed,
        "n_cracks": len(cracks),
        "max_conf": max_conf,
        "blob_fps": len(blobs),
        "top": [
            {
                "confidence": round(float(d["confidence"]), 3),
                "w": round(float(d["bbox"]["width"]), 1),
                "h": round(float(d["bbox"]["height"]), 1),
                "area_ratio": round(area_ratio(d, img_w, img_h), 4),
            }
            for d in top
        ],
        "model_version": payload.get("model_version"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="InspectAI ensemble acceptance eval")
    parser.add_argument("--url", default="", help="Live ML API base URL")
    parser.add_argument("--local", action="store_true", help="Use local run_ensemble + best.pt")
    parser.add_argument("--threshold", type=float, default=0.15)
    parser.add_argument("--min-conf", type=float, default=0.55, help="Pass if max crack conf >= this")
    parser.add_argument("--max-blob-area-ratio", type=float, default=0.08)
    parser.add_argument("--api-key", default=os.getenv("ML_API_KEY", ""))
    parser.add_argument("--images", nargs="*", default=[])
    args = parser.parse_args()

    if not args.local and not args.url:
        args.url = os.getenv("ML_API_URL", "https://alllxndr-inspectai-ml.hf.space")

    images: List[Path] = []
    for pattern in args.images or [str(p) for p in DEFAULT_IMAGES]:
        matches = sorted(Path().glob(pattern)) if any(ch in pattern for ch in "*?[") else [Path(pattern)]
        for p in matches:
            if p.is_file():
                images.append(p.resolve())
    # Also try defaults relative to ROOT when CWD differs
    if not images:
        images = [p for p in DEFAULT_IMAGES if p.is_file()]

    if not images:
        print("No images found to evaluate.", file=sys.stderr)
        return 2

    print(f"mode={'local' if args.local else 'live'} threshold={args.threshold} min_conf={args.min_conf}")
    if args.url and not args.local:
        print(f"url={args.url}")

    results = []
    for image in images:
        try:
            if args.local:
                payload = predict_local(image, args.threshold)
            else:
                payload = predict_live(args.url, image, args.threshold, args.api_key)
            summary = evaluate_image(payload, args.min_conf, args.max_blob_area_ratio)
            summary["image"] = str(image)
            results.append(summary)
            status = "PASS" if summary["passed"] else "FAIL"
            print(
                f"[{status}] {image.name}: cracks={summary['n_cracks']} "
                f"max_conf={summary['max_conf']:.3f} blobs={summary['blob_fps']} "
                f"model={summary.get('model_version')}"
            )
            for i, t in enumerate(summary["top"], 1):
                print(f"       {i}. conf={t['confidence']} {t['w']}x{t['h']} area_r={t['area_ratio']}")
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:300]
            print(f"[ERROR] {image.name}: HTTP {e.code} {body}", file=sys.stderr)
            results.append({"image": str(image), "passed": False, "error": f"HTTP {e.code}"})
        except Exception as e:
            print(f"[ERROR] {image.name}: {e}", file=sys.stderr)
            results.append({"image": str(image), "passed": False, "error": str(e)})

    passed = sum(1 for r in results if r.get("passed"))
    print(f"\nSummary: {passed}/{len(results)} passed")
    out = ROOT / "eval_results.json"
    out.write_text(json.dumps(results, indent=2))
    print(f"Wrote {out}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
