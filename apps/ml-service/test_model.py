"""Quick test of trained YOLOv8-seg crack detection model."""
import os
from pathlib import Path

os.environ.setdefault("HF_TOKEN", os.environ.get("HF_TOKEN", ""))

from ultralytics import YOLO
from ultralytics.data.utils import check_det_dataset

# Download crack-seg dataset (val images)
info = check_det_dataset("crack-seg.yaml")
print(f"Dataset path: {info['path']}")

val_dir = Path(info["path"]) / "images" / "val"
test_images = sorted(val_dir.glob("*.jpg"))[:5]
print(f"Found {len(test_images)} test images")

# Load trained model
model = YOLO("apps/ml-service/best.pt")

for img_path in test_images:
    results = model(str(img_path), conf=0.25, verbose=False)
    for r in results:
        boxes = r.boxes
        masks = r.masks if hasattr(r, "masks") and r.masks is not None else None
        n_det = len(boxes) if boxes is not None else 0
        print(f"\n{img_path.name}: {n_det} detections")
        if n_det > 0:
            for i in range(n_det):
                conf = float(boxes.conf[i].item())
                xyxy = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = map(lambda v: round(v, 1), xyxy)
                print(f"  det {i}: conf={conf:.3f} box=[{x1},{y1},{x2},{y2}]")
                if masks is not None:
                    polygon = masks.xy[i]
                    print(f"  mask points: {len(polygon)}")
        # Save annotated result
        r.save(filename=f"apps/ml-service/test_result_{img_path.name}")

print("\nDone! Results saved to apps/ml-service/test_result_*.jpg")
