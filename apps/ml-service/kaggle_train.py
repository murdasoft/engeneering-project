"""
Kaggle training script for YOLOv8 crack segmentation.

Usage:
1. Create a new Kaggle notebook (or Factory reset if disk error).
2. Enable Internet + GPU T4.
3. Add Secret HF_TOKEN (HuggingFace write token).
4. Paste this entire file into one code cell and Run.
5. best.pt is saved to /kaggle/working/best.pt and pushed to HF Hub.

Notes:
- Uses Ultralytics crack-seg only by default (~100 MB). IBM CIF is huge and
  overflows Kaggle disk outside /kaggle/working — enable with INCLUDE_CIF=1.
- All caches are forced under /kaggle/working.
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

# --- Force ALL caches into /kaggle/working BEFORE importing HF/ultralytics ---
BASE = Path("/kaggle/working")
CACHE = BASE / "cache"
TMP = BASE / "tmp"
DATASETS = BASE / "datasets"
RUNS = BASE / "runs"
for p in (CACHE, TMP, DATASETS, RUNS):
    p.mkdir(parents=True, exist_ok=True)

os.environ["HOME"] = str(BASE)
os.environ["TMPDIR"] = str(TMP)
os.environ["TEMP"] = str(TMP)
os.environ["TMP"] = str(TMP)
os.environ["HF_HOME"] = str(CACHE / "huggingface")
os.environ["HF_DATASETS_CACHE"] = str(CACHE / "huggingface" / "datasets")
os.environ["HUGGINGFACE_HUB_CACHE"] = str(CACHE / "huggingface" / "hub")
os.environ["TRANSFORMERS_CACHE"] = str(CACHE / "huggingface" / "transformers")
os.environ["XDG_CACHE_HOME"] = str(CACHE)
os.environ["YOLO_CONFIG_DIR"] = str(CACHE / "Ultralytics")
(CACHE / "Ultralytics").mkdir(parents=True, exist_ok=True)
os.environ.setdefault("WANDB_DISABLED", "true")
# Skip IBM CIF by default — 84 parquet shards blow Kaggle ephemeral disk
os.environ.setdefault("INCLUDE_CIF", "0")

print("Installing dependencies...")
subprocess.check_call(
    [sys.executable, "-m", "pip", "install", "--no-cache-dir", "--quiet",
     "ultralytics", "datasets", "huggingface_hub", "Pillow", "pyyaml"]
)

from huggingface_hub import HfApi, create_repo
from ultralytics import YOLO, settings
import yaml

# Kaggle stores secrets via UserSecretsClient; make HF_TOKEN available to os.environ
try:
    from kaggle_secrets import UserSecretsClient
    _token = UserSecretsClient().get_secret("HF_TOKEN")
    if _token:
        os.environ["HF_TOKEN"] = _token
        print("HF_TOKEN secret loaded OK")
    else:
        print("WARNING: HF_TOKEN secret is empty")
except Exception as e:
    print(f"WARNING: could not load HF_TOKEN secret: {e}")
    print("Attach secret: Add-ons → Secrets → HF_TOKEN → Attach to notebook")

HF_TOKEN = os.environ.get("HF_TOKEN", "")

settings.update({"datasets_dir": str(DATASETS)})


def download_crack_seg() -> Path:
    from ultralytics.data.utils import check_det_dataset
    info = check_det_dataset("crack-seg.yaml")
    return Path(info["path"]) / "crack-seg.yaml"


def prepare_cif() -> Path:
    """Download IBM CIF and convert bbox annotations to YOLO segmentation format."""
    from datasets import load_dataset
    from PIL import Image

    print("Loading IBM CIF dataset...")
    ds = load_dataset("ibm-research/cif-dataset", "default", token=HF_TOKEN or None)
    cif_root = DATASETS / "cif-yolo"
    (cif_root / "images" / "train").mkdir(parents=True, exist_ok=True)
    (cif_root / "images" / "val").mkdir(parents=True, exist_ok=True)
    (cif_root / "labels" / "train").mkdir(parents=True, exist_ok=True)
    (cif_root / "labels" / "val").mkdir(parents=True, exist_ok=True)

    def convert(split, dst_split):
        examples = ds[split]
        for i in range(len(examples)):
            ex = examples[i]
            image = ex["image"]
            filename = f"cif_{split}_{i:06d}.jpg"
            img_path = cif_root / "images" / dst_split / filename
            image.save(img_path)
            w, h = image.size

            if "objects" in ex and "bbox" in ex["objects"]:
                bboxes = ex["objects"]["bbox"]  # [x, y, width, height]
                categories = ex["objects"]["category"]
                label_lines = []
                for bbox, cat in zip(bboxes, categories):
                    if cat != 0:  # 0 = crack in CIF
                        continue
                    x, y, bw, bh = bbox
                    # Simplified: use bbox as 4-corner polygon
                    x1 = x / w
                    y1 = y / h
                    x2 = (x + bw) / w
                    y2 = (y + bh) / h
                    polygon = [x1, y1, x2, y1, x2, y2, x1, y2]
                    pts = " ".join(f"{p:.6f}" for p in polygon)
                    label_lines.append(f"0 {pts}")
                if label_lines:
                    (cif_root / "labels" / dst_split / f"cif_{split}_{i:06d}.txt").write_text("\n".join(label_lines))

    convert("train", "train")
    convert("validation", "val")

    yaml_path = cif_root / "cif.yaml"
    yaml.safe_dump(
        {
            "path": str(cif_root),
            "train": str(cif_root / "images" / "train"),
            "val": str(cif_root / "images" / "val"),
            "names": {0: "crack"},
            "nc": 1,
        },
        yaml_path.open("w"),
        sort_keys=False,
    )
    return yaml_path


def build_combined(data_paths: list[Path]) -> Path:
    combined = BASE / "datasets" / "combined"
    (combined / "images" / "train").mkdir(parents=True, exist_ok=True)
    (combined / "images" / "val").mkdir(parents=True, exist_ok=True)
    (combined / "labels" / "train").mkdir(parents=True, exist_ok=True)
    (combined / "labels" / "val").mkdir(parents=True, exist_ok=True)

    def link_split(split, y, target):
        img_src = Path(y["path"]) / "images" / split
        lbl_src = Path(y["path"]) / "labels" / split
        tgt_img = target / "images" / split
        tgt_lbl = target / "labels" / split
        for img_file in sorted(img_src.glob("*")):
            link = tgt_img / img_file.name
            if not link.exists():
                link.symlink_to(img_file)
            stem = img_file.stem
            for ext in [".txt"]:
                lbl = lbl_src / (stem + ext)
                if lbl.exists():
                    link = tgt_lbl / (stem + ext)
                    if not link.exists():
                        link.symlink_to(lbl)

    for p in data_paths:
        y = yaml.safe_load(p.read_text())
        for split in ["train", "val"]:
            if (Path(y["path"]) / "labels" / split).exists():
                link_split(split, y, combined)

    train_imgs = list((combined / "images" / "train").glob("*"))
    val_imgs = list((combined / "images" / "val").glob("*"))
    combined_yaml = combined / "combined.yaml"
    yaml.safe_dump(
        {
            "path": str(combined),
            "train": str(combined / "images" / "train"),
            "val": str(combined / "images" / "val"),
            "names": {0: "crack"},
            "nc": 1,
            "train_count": len(train_imgs),
            "val_count": len(val_imgs),
        },
        combined_yaml.open("w"),
        sort_keys=False,
    )
    print(f"Combined dataset: {len(train_imgs)} train, {len(val_imgs)} val images")
    return combined_yaml


def push_to_hf(model_path: Path, repo_id: str):
    token = os.environ.get("HF_TOKEN", "") or HF_TOKEN
    if not token:
        print("HF_TOKEN not set, skip upload")
        print("Fix: Add-ons → Secrets → attach HF_TOKEN, then re-run ONLY the upload cell.")
        return
    if not model_path.is_file():
        print(f"Missing weights file: {model_path}")
        return
    create_repo(repo_id=repo_id, repo_type="model", private=False, token=token, exist_ok=True)
    api = HfApi(token=token)
    api.upload_file(
        path_or_fileobj=str(model_path),
        path_in_repo="best.pt",
        repo_id=repo_id,
        repo_type="model",
    )
    print(f"Uploaded {model_path.stat().st_size / 1e6:.1f} MB → https://huggingface.co/{repo_id}")


def main():
    data_paths = [download_crack_seg()]

    include_cif = os.environ.get("INCLUDE_CIF", "0").lower() in ("1", "true", "yes")
    if include_cif:
        try:
            data_paths.append(prepare_cif())
        except Exception as e:
            print(f"CIF download/convert failed: {e}")
    else:
        print("Skipping IBM CIF (INCLUDE_CIF=0). crack-seg only — safe for Kaggle 20GB disk.")

    data_yaml = build_combined(data_paths) if len(data_paths) > 1 else data_paths[0]

    import torch
    if torch.cuda.is_available():
        device = 0
        print(f"GPU OK: {torch.cuda.get_device_name(0)}")
    else:
        raise RuntimeError(
            "No CUDA GPU. In Kaggle: Session options → Accelerator → GPU T4 → "
            "Save, then Restart session and Run again. "
            f"(torch={torch.__version__}, cuda_available={torch.cuda.is_available()})"
        )

    model = YOLO("yolov8s-seg.pt")
    # T4 16GB: batch 8 is usually fine for yolov8s-seg @ 640
    batch = int(os.environ.get("BATCH_SIZE", "8"))
    # cache='disk' stays under /kaggle/working; avoid RAM pressure
    cache_mode = os.environ.get("CACHE", "disk")
    if cache_mode in ("0", "false", "False", "none"):
        cache_mode = False
    results = model.train(
        data=str(data_yaml),
        epochs=int(os.environ.get("EPOCHS", "50")),
        imgsz=int(os.environ.get("IMGSZ", "640")),
        batch=batch,
        project=str(RUNS),
        name="train",
        exist_ok=True,
        patience=int(os.environ.get("PATIENCE", "15")),
        save=True,
        device=device,
        cache=cache_mode,
    )

    best = RUNS / "train" / "weights" / "best.pt"
    if not best.is_file():
        # fallback if ultralytics nested path differs
        found = list(RUNS.rglob("best.pt"))
        if not found:
            raise FileNotFoundError(f"Training finished but best.pt not found under {RUNS}")
        best = found[0]
        print(f"Using discovered weights: {best}")

    target = BASE / "best.pt"
    shutil.copy(best, target)
    print(f"Saved best.pt to {target} ({target.stat().st_size / 1e6:.1f} MB)")

    # Also keep a second copy under runs for safety within the session
    print(f"Do NOT restart session until upload finishes. Working copy: {target}")
    push_to_hf(target, os.environ.get("HF_MODEL_REPO", "alllxndr/inspectai-crack-seg"))


if __name__ == "__main__":
    main()
