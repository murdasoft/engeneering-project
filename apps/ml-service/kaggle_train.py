"""
Kaggle training script for YOLOv8 crack segmentation.

Usage:
1. Create a new Kaggle notebook.
2. Enable Internet in the notebook settings.
3. Add a Kaggle Secret named `HF_TOKEN` with your HuggingFace write token.
4. Copy this entire script into a code cell and run.
5. The best model is saved to /kaggle/working/best.pt and pushed to HF Hub.

Recommended Kaggle GPU: T4 (free, 16 GB VRAM).
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

os.environ.setdefault("WANDB_DISABLED", "true")

print("Installing dependencies...")
subprocess.check_call(
    [sys.executable, "-m", "pip", "install", "--no-cache-dir", "--quiet",
     "ultralytics", "datasets", "huggingface_hub", "Pillow", "pyyaml"]
)

from datasets import load_dataset
from huggingface_hub import HfApi, create_repo
from ultralytics import YOLO, settings
import yaml

# Kaggle stores secrets via UserSecretsClient; make HF_TOKEN available to os.environ
try:
    from kaggle_secrets import UserSecretsClient
    _token = UserSecretsClient().get_secret("HF_TOKEN")
    if _token:
        os.environ["HF_TOKEN"] = _token
except Exception:
    pass

HF_TOKEN = os.environ.get("HF_TOKEN", "")
BASE = Path("/kaggle/working")
DATASETS = BASE / "datasets"
RUNS = BASE / "runs"
DATASETS.mkdir(parents=True, exist_ok=True)
RUNS.mkdir(parents=True, exist_ok=True)

settings.update({"datasets_dir": str(DATASETS)})


def download_crack_seg() -> Path:
    from ultralytics.data.utils import check_det_dataset
    info = check_det_dataset("crack-seg.yaml")
    return Path(info["path"]) / "crack-seg.yaml"


def prepare_cif() -> Path:
    """Download IBM CIF and convert bbox annotations to YOLO segmentation format."""
    print("Loading IBM CIF dataset...")
    ds = load_dataset("ibm-research/cif-dataset", "default", token=HF_TOKEN or None)
    cif_root = DATASETS / "cif-yolo"
    (cif_root / "images" / "train").mkdir(parents=True, exist_ok=True)
    (cif_root / "images" / "val").mkdir(parents=True, exist_ok=True)
    (cif_root / "labels" / "train").mkdir(parents=True, exist_ok=True)
    (cif_root / "labels" / "val").mkdir(parents=True, exist_ok=True)

    from PIL import Image

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
                    xc = (x + bw / 2) / w
                    yc = (y + bh / 2) / h
                    bw = max(bw / w, 1e-6)
                    bh = max(bh / h, 1e-6)
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
    if not HF_TOKEN:
        print("HF_TOKEN not set, skip upload")
        return
    create_repo(repo_id=repo_id, repo_type="model", private=False, token=HF_TOKEN, exist_ok=True)
    api = HfApi(token=HF_TOKEN)
    api.upload_file(path_or_fileobj=str(model_path), path_in_repo="best.pt", repo_id=repo_id, repo_type="model")
    print(f"Uploaded to https://huggingface.co/{repo_id}")


def main():
    data_paths = [download_crack_seg()]
    try:
        data_paths.append(prepare_cif())
    except Exception as e:
        print(f"CIF download/convert failed: {e}")

    data_yaml = build_combined(data_paths) if len(data_paths) > 1 else data_paths[0]

    model = YOLO("yolov8s-seg.pt")
    # T4 16GB: batch 8 is usually fine for yolov8s-seg @ 640
    batch = int(os.environ.get("BATCH_SIZE", "8"))
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
        device=0,
        cache=True,
    )

    best = RUNS / "train" / "weights" / "best.pt"
    target = BASE / "best.pt"
    shutil.copy(best, target)
    print(f"Saved best.pt to {target}")

    push_to_hf(target, os.environ.get("HF_MODEL_REPO", "alllxndr/inspectai-crack-seg"))


if __name__ == "__main__":
    main()
