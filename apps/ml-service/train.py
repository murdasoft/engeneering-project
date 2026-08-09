"""Train a YOLOv8-seg model on public crack datasets.

Usage:
    HF_TOKEN=... python3 apps/ml-service/train.py

This script:
1. Downloads the Ultralytics Crack-Seg dataset (built-in, ~92 MB).
2. Optionally downloads and converts the IBM CIF (Cracks in the Foundation) dataset.
3. Trains a YOLOv8-seg model.
4. Copies the best checkpoint to apps/ml-service/best.pt.
"""

import os
import shutil
from pathlib import Path
from typing import Optional

import yaml
from ultralytics import YOLO, settings

HF_TOKEN = os.getenv("HF_TOKEN", "")
BASE_DIR = Path(__file__).parent.resolve()
DATASETS_DIR = BASE_DIR / "datasets"
RUNS_DIR = BASE_DIR / "runs"

def download_crack_seg() -> Path:
    """Use Ultralytics built-in crack-seg dataset. It downloads on first use."""
    from ultralytics.data.utils import check_det_dataset
    settings.update({"datasets_dir": str(DATASETS_DIR)})
    print("Downloading/verifying Ultralytics Crack-Seg dataset...")
    info = check_det_dataset("crack-seg.yaml")  # auto-downloads if missing
    return Path(info["path"]) / "crack-seg.yaml"


def try_prepare_cif() -> Optional[Path]:
    """Download IBM CIF dataset from HuggingFace and convert to YOLO if possible."""
    try:
        from datasets import load_dataset
    except ImportError:
        print("huggingface/datasets not installed, skipping IBM CIF.")
        return None

    cif_dir = DATASETS_DIR / "cif-yolo"
    if (cif_dir / "data.yaml").exists():
        return cif_dir / "data.yaml"

    print("Downloading IBM CIF dataset from HuggingFace...")
    ds = load_dataset("ibm-research/cif-dataset", "train_tiled", split="train", token=HF_TOKEN or None)

    # CIF classes: 1=Algae, 2=Crack, 3=Crack(net), 4=Crack+precipitation, 5=Rust, 6=Spalling
    # We keep: crack, net-crack, crack-precipitation, rust, spalling
    kept = {2: "crack", 3: "net-crack", 4: "crack-precip", 5: "rust", 6: "spalling"}
    class_names = list(kept.values())

    (cif_dir / "images" / "train").mkdir(parents=True, exist_ok=True)
    (cif_dir / "labels" / "train").mkdir(parents=True, exist_ok=True)

    for i, sample in enumerate(ds):
        img = sample["image"]
        w, h = img.size
        img_path = cif_dir / "images" / "train" / f"cif_{i}.jpg"
        img.save(img_path)

        label_path = cif_dir / "labels" / "train" / f"cif_{i}.txt"
        lines = []
        obj = sample["objects"]
        for j, cid in enumerate(obj["category_id"]):
            if cid not in kept:
                continue
            x, y, bw, bh = obj["bbox"][j]
            # COCO bbox is x, y, w, h in absolute pixels
            xc = (x + bw / 2) / w
            yc = (y + bh / 2) / h
            nw = bw / w
            nh = bh / h
            cls_idx = class_names.index(kept[cid])
            # For segmentation, use the first polygon if present
            poly = obj["segmentation"][j]
            if poly and len(poly) > 0 and len(poly[0]) >= 6:
                pts = [float(v) for v in poly[0]]
                norm = []
                for k in range(0, len(pts), 2):
                    norm.append(pts[k] / w)
                    norm.append(pts[k + 1] / h)
                line = f"{cls_idx} " + " ".join(str(round(v, 6)) for v in norm)
            else:
                line = f"{cls_idx} {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}"
            lines.append(line)

        with open(label_path, "w") as f:
            f.write("\n".join(lines))

    yaml_path = cif_dir / "data.yaml"
    yaml.safe_dump(
        {
            "path": str(cif_dir),
            "train": "images/train",
            "val": "images/train",
            "names": {i: n for i, n in enumerate(class_names)},
            "task": "segment",
            "mode": "train",
        },
        yaml_path.open("w"),
        sort_keys=False,
    )
    return yaml_path


def build_combined_yaml(paths: list[Path]) -> Path:
    """Build a combined YOLO dataset by symlinking images/labels."""
    combined_dir = DATASETS_DIR / "combined-crack"
    for split in ["train", "val"]:
        (combined_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (combined_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    # For simplicity use the first dataset as the source of truth for val.
    # This is a quick MVP; for production, split properly.
    for src_yaml in paths:
        src_root = src_yaml.parent
        src_images = src_root / "images"
        src_labels = src_root / "labels"
        for split in ["train", "val"]:
            imgs = src_images / split
            lbls = src_labels / split
            if not imgs.exists():
                continue
            for img in imgs.iterdir():
                name = img.stem
                lbl = lbls / f"{name}.txt"
                if not lbl.exists():
                    continue
                dst_img = combined_dir / "images" / split / img.name
                dst_lbl = combined_dir / "labels" / split / f"{name}.txt"
                if not dst_img.exists():
                    os.symlink(img.resolve(), dst_img)
                if not dst_lbl.exists():
                    os.symlink(lbl.resolve(), dst_lbl)

    # Determine class names from first dataset
    with open(paths[0]) as f:
        cfg = yaml.safe_load(f)
    names = cfg.get("names", {0: "crack"})
    if isinstance(names, dict):
        names = {int(k): v for k, v in names.items()}
    else:
        names = {i: n for i, n in enumerate(names)}

    combined_yaml = combined_dir / "data.yaml"
    yaml.safe_dump(
        {
            "path": str(combined_dir),
            "train": "images/train",
            "val": "images/val" if (combined_dir / "images/val").exists() else "images/train",
            "names": names,
            "task": "segment",
            "mode": "train",
        },
        combined_yaml.open("w"),
        sort_keys=False,
    )
    return combined_yaml


def train(data_yaml: Path, epochs: int = 10, imgsz: int = 640, model_size: str = "n"):
    """Run training and copy best checkpoint."""
    device = "mps" if shutil.which("system_profiler") else "cpu"
    # Try MPS on Apple Silicon, otherwise CPU
    import torch
    if torch.backends.mps.is_available():
        device = "mps"
    else:
        device = "cpu"

    model_name = f"yolov8{model_size}-seg.pt"
    print(f"Loading {model_name}...")
    model = YOLO(model_name)

    print(f"Training on {data_yaml} for {epochs} epochs, imgsz={imgsz}, device={device}")
    patience = int(os.getenv("PATIENCE", "15"))
    batch = int(os.getenv("BATCH_SIZE", "4"))
    use_cache = os.getenv("CACHE", "1") not in ("0", "false", "False")
    results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        project=str(RUNS_DIR),
        name="train",
        exist_ok=True,
        device=device,
        patience=patience,
        save=True,
        cache=use_cache,
    )

    best_path = Path(getattr(results, "best", "") or "")
    if not best_path.exists():
        best_path = RUNS_DIR / "train" / "weights" / "best.pt"
    if not best_path.exists():
        raise FileNotFoundError(f"Training finished but best.pt not found at {best_path}")
    target = BASE_DIR / "best.pt"
    shutil.copy(best_path, target)
    print(f"Best model saved to {target}")
    return target


def push_to_hf(model_path: Path, repo_id: str):
    from huggingface_hub import HfApi, create_repo
    token = os.getenv("HF_TOKEN", "")
    if not token:
        print("HF_TOKEN not set, skipping HF Hub upload.")
        return
    try:
        create_repo(repo_id=repo_id, repo_type="model", private=False, token=token, exist_ok=True)
    except Exception as e:
        print(f"HF repo create warning: {e}")
    api = HfApi(token=token)
    print(f"Uploading {model_path} to {repo_id}...")
    api.upload_file(
        path_or_fileobj=str(model_path),
        path_in_repo="best.pt",
        repo_id=repo_id,
        repo_type="model",
    )
    print(f"Uploaded to https://huggingface.co/{repo_id}")


def main():
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    RUNS_DIR.mkdir(parents=True, exist_ok=True)

    data_paths = []

    # 1. Ultralytics Crack-Seg
    crack_seg_yaml = download_crack_seg()
    data_paths.append(crack_seg_yaml)

    # 2. IBM CIF (optional)
    cif_yaml = try_prepare_cif()
    if cif_yaml:
        data_paths.append(cif_yaml)

    # Combine and train
    if len(data_paths) > 1:
        combined_yaml = build_combined_yaml(data_paths)
    else:
        combined_yaml = data_paths[0]

    # Allow configuration via environment
    epochs = int(os.getenv("EPOCHS", "50"))
    imgsz = int(os.getenv("IMGSZ", "640"))
    model_size = os.getenv("MODEL_SIZE", "s")  # n, s, m, l

    best_path = train(combined_yaml, epochs=epochs, imgsz=imgsz, model_size=model_size)

    repo_id = os.getenv("HF_MODEL_REPO", "alllxndr/inspectai-crack-seg")
    if repo_id:
        push_to_hf(best_path, repo_id)


if __name__ == "__main__":
    main()
