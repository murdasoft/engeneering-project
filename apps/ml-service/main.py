import io
import os
import time
import base64
import math
import cv2
from typing import List, Optional, Dict, Any, Tuple
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from huggingface_hub import hf_hub_download, login as hf_login

app = FastAPI(
    title="InspectAI ML Service",
    description="YOLOv8-based concrete defect detection API with engineering analysis",
    version="4.1.0",
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_MODEL = os.getenv("HF_MODEL", "alllxndr/inspectai-crack-seg")
HF_MODEL_FILE = os.getenv("HF_MODEL_FILE", "best.pt")
HF_MODEL_FALLBACK = os.getenv("HF_MODEL_FALLBACK", "wjdqlscho/Crack_YOLO_Segmentation_model")
HF_MODEL_FALLBACK_FILE = os.getenv("HF_MODEL_FALLBACK_FILE", "best.pt")
HF_MODEL_SECONDARY = os.getenv("HF_MODEL_SECONDARY", "keremberke/yolov8s-surface-crack-detection")
HF_MODEL_SECONDARY_FILE = os.getenv("HF_MODEL_SECONDARY_FILE", "best.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.15"))
MIN_CRACK_AREA = 120          # allow thin, elongated small cracks
MIN_CRACK_MAX_DIM = 30        # but still require meaningful length
SMALL_CRACK_AREA_CUTOFF = 1500  # below this, NMS is more permissive
MODEL_VERSION = "ensemble-v4.1"
SERVICE_VERSION = "4.1.0"

# Non-crack object classes that cause false positives
NON_CRACK_OBJECTS = {
    "pipe", "pipes", "tube", "cable", "wire", "conduit",
    "door", "doorway", "door frame", "window", "frame",
    "outlet", "socket", "switch", "vent", "grille",
    "shadow", "stain", "watermark", "dirt", "mark",
    "joint", "seam", "gap", "expansion joint",
    "fence", "railing", "bar", "handle", "knob",
    "light", "lamp", "fixture", "conduit",
    "brick", "tile", "panel", "board",
}

# Authenticate with HuggingFace if token is available
if HF_TOKEN:
    hf_login(token=HF_TOKEN)
API_KEY = os.getenv("ML_API_KEY", "").strip()


async def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Require X-API-Key when ML_API_KEY is configured; open access if unset."""
    if not API_KEY:
        return True
    if x_api_key and x_api_key == API_KEY:
        return True
    raise HTTPException(status_code=401, detail="Invalid or missing API key")


_models = {}


def _download_model(repo_id: str, filename: str) -> str:
    """Download model from HuggingFace with token support."""
    try:
        return hf_hub_download(repo_id=repo_id, filename=filename, token=HF_TOKEN or None)
    except Exception:
        return ""


def get_model(model_name: str = "primary"):
    global _models
    if model_name not in _models:
        from ultralytics import YOLO
        import torch
        _orig_load = torch.load
        torch.load = lambda *a, **kw: _orig_load(*a, **{**kw, "weights_only": False})
        try:
            if model_name == "primary":
                for path in ["best.pt", "models/best.pt"]:
                    if os.path.exists(path):
                        _models[model_name] = YOLO(path)
                        return _models[model_name]
                local_path = _download_model(HF_MODEL, HF_MODEL_FILE)
                if local_path and os.path.exists(local_path):
                    _models[model_name] = YOLO(local_path)
                else:
                    _models[model_name] = YOLO("yolov8n.pt")
            elif model_name == "fallback":
                local_path = _download_model(HF_MODEL_FALLBACK, HF_MODEL_FALLBACK_FILE)
                if local_path and os.path.exists(local_path):
                    _models[model_name] = YOLO(local_path)
                else:
                    _models[model_name] = None
            elif model_name == "secondary":
                local_path = _download_model(HF_MODEL_SECONDARY, HF_MODEL_SECONDARY_FILE)
                if local_path and os.path.exists(local_path):
                    _models[model_name] = YOLO(local_path)
                else:
                    _models[model_name] = None
            elif model_name == "general":
                _models[model_name] = YOLO("yolov8n.pt")
        finally:
            torch.load = _orig_load
    return _models.get(model_name)


def _is_crack_like(class_name: str) -> bool:
    """Accept crack and concrete-defect classes, reject background/non-defect labels."""
    name = (class_name or "").lower()
    allowed = {
        "crack", "cracks", "fissure", "fracture", "split", "break", "pothole",
        "damage", "defect", "hole", "spalling", "spall", "delamination",
        "rust", "rusting", "ruststain", "corrosion", "scaling", "efflorescence",
        "discoloration", "stain",
    }
    rejected = {"background", "bg", "wall", "concrete", "surface", "normal", "good", "ok", "none", "no crack"}
    if name in rejected or any(r in name for r in rejected):
        return False
    return name in allowed or any(a in name for a in allowed)


def _is_non_crack_object(class_name: str) -> bool:
    """Check if a detected class is a known non-crack object (pipe, door, outlet, etc.)."""
    name = (class_name or "").lower()
    return name in NON_CRACK_OBJECTS or any(n in name for n in NON_CRACK_OBJECTS)


def _edge_density_check(img_array: np.ndarray, box: list) -> float:
    """
    Compute edge density within a bounding box using Canny edges.
    Cracks produce high edge density along their length.
    Returns ratio of edge pixels to total pixels in the region.
    """
    x1, y1, x2, y2 = [int(v) for v in box]
    h, w = img_array.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return 0.0
    region = img_array[y1:y2, x1:x2]
    gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY) if len(region.shape) == 3 else region
    edges = cv2.Canny(gray, 50, 150)
    edge_count = np.count_nonzero(edges)
    total = (x2 - x1) * (y2 - y1)
    return edge_count / total if total > 0 else 0.0


def _directional_contrast_check(img_array: np.ndarray, box: list) -> float:
    """
    Cracks have high directional contrast: dark line on lighter background.
    Measure anisotropy of gradient — cracks have strong gradient in one direction
    and weak in the perpendicular direction.
    Returns anisotropy ratio (0-1, higher = more crack-like).
    """
    x1, y1, x2, y2 = [int(v) for v in box]
    h, w = img_array.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if x2 - x1 < 3 or y2 - y1 < 3:
        return 0.0
    region = img_array[y1:y2, x1:x2]
    gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY) if len(region.shape) == 3 else region
    # Pad very thin regions so Sobel has enough context to estimate anisotropy
    min_h, min_w = gray.shape[:2]
    top = bottom = left = right = 0
    if min_h < 10:
        pad = (10 - min_h + 1) // 2
        top = bottom = pad
    if min_w < 10:
        pad = (10 - min_w + 1) // 2
        left = right = pad
    if top or bottom or left or right:
        gray = cv2.copyMakeBorder(gray, top, bottom, left, right, cv2.BORDER_REPLICATE)
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_mag = np.sqrt(gx**2 + gy**2)
    grad_mean = np.mean(grad_mag)
    if grad_mean < 1e-6:
        return 0.0
    grad_x_mean = np.mean(np.abs(gx))
    grad_y_mean = np.mean(np.abs(gy))
    if grad_x_mean < 1e-6 or grad_y_mean < 1e-6:
        return 0.0
    ratio = min(grad_x_mean, grad_y_mean) / max(grad_x_mean, grad_y_mean)
    return 1.0 - ratio


def _local_contrast_check(img_array: np.ndarray, box: list) -> float:
    """
    Cracks are darker than surrounding surface. Check if the region has
    a bimodal intensity distribution (dark crack + light background).
    Returns contrast score (0-1, higher = more crack-like).
    """
    x1, y1, x2, y2 = [int(v) for v in box]
    h, w = img_array.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if x2 - x1 < 2 or y2 - y1 < 2:
        return 0.0
    region = img_array[y1:y2, x1:x2]
    gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY) if len(region.shape) == 3 else region
    hist = cv2.calcHist([gray], [0], None, [32], [0, 256])
    hist_norm = hist.flatten() / hist.sum()
    peaks = np.argsort(hist_norm)[-2:]
    peak_diff = abs(peaks[0] - peaks[1]) / 32.0
    return min(1.0, peak_diff)


def _validate_crack_region(img_array: np.ndarray, box: list) -> Tuple[bool, float]:
    """
    Combined CV validation for a detected crack region.
    Returns (is_valid, confidence_modifier).
    """
    edge_density = _edge_density_check(img_array, box)
    anisotropy = _directional_contrast_check(img_array, box)
    contrast = _local_contrast_check(img_array, box)

    score = (edge_density * 0.4 + anisotropy * 0.4 + contrast * 0.2)
    # Small/thin cracks can have weaker CV scores; relax the bar for them
    min_score = 0.12 if _box_area(box) < 400 else 0.15
    is_valid = score > min_score
    return is_valid, score


def _detect_non_crack_objects(img_array: np.ndarray) -> list:
    """
    Use a general-purpose YOLO model to detect common objects that cause false positives.
    Returns list of (box, confidence, class_name) tuples for non-crack objects.
    """
    objects = []
    try:
        model = get_model("general")
        if model is None:
            return objects
        results = model(img_array, conf=0.25, verbose=False)
        for result in results:
            if result.boxes is None:
                continue
            for i in range(len(result.boxes)):
                cls_name = get_class_name(model, int(result.boxes.cls[i].item()))
                conf = float(result.boxes.conf[i].item())
                xyxy = result.boxes.xyxy[i].cpu().numpy()
                box = [float(v) for v in xyxy]
                if _is_non_crack_object(cls_name) or cls_name.lower() in {"person", "animal", "vehicle"}:
                    objects.append((box, conf, cls_name))
    except Exception:
        pass
    return objects


def _boxes_overlap(box_a: list, box_b: list) -> float:
    """Compute IoU between two boxes."""
    return compute_iou(box_a, box_b)


def _aspect_ratio_ok(box: list) -> bool:
    """Cracks are elongated: one dimension must be at least 1.5x the other."""
    w = box[2] - box[0]
    h = box[3] - box[1]
    if w <= 0 or h <= 0:
        return False
    min_dim = min(w, h)
    max_dim = max(w, h)
    return (min_dim / max_dim) <= 0.85 and max_dim >= 20


def _box_area(box: list) -> float:
    return max(0, box[2] - box[0]) * max(0, box[3] - box[1])


def _box_max_dim(box: list) -> float:
    return max(box[2] - box[0], box[3] - box[1])


def _min_crack_size_ok(box: list) -> bool:
    """Accept normal cracks and very thin/small cracks, reject tiny blobs."""
    area = _box_area(box)
    if area >= 400:
        return True
    max_dim = _box_max_dim(box)
    return area >= MIN_CRACK_AREA and max_dim >= MIN_CRACK_MAX_DIM


def _box_area_ratio(box: list, img_array: np.ndarray) -> float:
    image_h, image_w = img_array.shape[:2]
    image_area = image_w * image_h
    return _box_area(box) / image_area if image_area > 0 else 1.0


def _box_aspect(box: list) -> float:
    """min/max dimension ratio; 1.0 = square, lower = more elongated."""
    w = max(0.0, box[2] - box[0])
    h = max(0.0, box[3] - box[1])
    if w <= 0 or h <= 0:
        return 1.0
    return min(w, h) / max(w, h)


def _adjust_confidence(conf: float, cv_score: float) -> float:
    """Rescale YOLO/CV confidence using CV validation (can boost above raw conf)."""
    return min(1.0, float(conf) * (0.95 + 0.25 * float(cv_score)))


def _is_blob_fp(box: list, img_array: np.ndarray, conf: float) -> bool:
    """Reject large, thick, low-confidence boxes typical of plaster texture FPs."""
    if conf >= 0.35:
        return False
    if _box_area_ratio(box, img_array) <= 0.08:
        return False
    return _box_aspect(box) > 0.55


def _agrees_with_primary(box: list, primary_detections: list, iou_thresh: float = 0.2) -> bool:
    for p_box, _, _, _ in primary_detections:
        if compute_iou(box, p_box) >= iou_thresh:
            return True
    return False


def _is_full_width_top_region(box: list, img_array: np.ndarray) -> bool:
    image_h, image_w = img_array.shape[:2]
    box_w = max(0, box[2] - box[0])
    box_h = max(0, box[3] - box[1])
    return box[1] <= image_h * 0.03 and box_w >= image_w * 0.90 and box_h <= image_h * 0.25


def _extract_crack_polygon(img_array: np.ndarray, box: list) -> Optional[list]:
    image_h, image_w = img_array.shape[:2]
    x1 = max(0, int(math.floor(box[0])))
    y1 = max(0, int(math.floor(box[1])))
    x2 = min(image_w, int(math.ceil(box[2])))
    y2 = min(image_h, int(math.ceil(box[3])))
    if x2 - x1 < 20 or y2 - y1 < 20:
        return None

    region = img_array[y1:y2, x1:x2]
    gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY) if len(region.shape) == 3 else region
    threshold = float(np.clip(np.percentile(gray, 8), 35, 90))
    dark_mask = (gray <= threshold).astype(np.uint8)
    component_count, labels, stats, centers = cv2.connectedComponentsWithStats(dark_mask, 8)
    if component_count <= 1:
        return None

    component_ids = sorted(
        range(1, component_count),
        key=lambda component_id: stats[component_id, cv2.CC_STAT_AREA],
        reverse=True,
    )
    seed_id = component_ids[0]
    min_seed_area = max(80, int(region.shape[0] * region.shape[1] * 0.002))
    if stats[seed_id, cv2.CC_STAT_AREA] < min_seed_area:
        return None

    seed_y, seed_x = np.where(labels == seed_id)
    seed_points = np.column_stack([seed_x, seed_y]).astype(np.float32)
    vx, vy, px, py = cv2.fitLine(seed_points, cv2.DIST_L2, 0, 0.01, 0.01).reshape(-1)
    diagonal = math.hypot(region.shape[1], region.shape[0])
    max_distance = max(16.0, diagonal * 0.035)

    selected_points = []
    for component_id in component_ids:
        if stats[component_id, cv2.CC_STAT_AREA] < 40:
            continue
        center_x, center_y = centers[component_id]
        distance = abs(vy * (center_x - px) - vx * (center_y - py))
        if distance > max_distance:
            continue
        component_y, component_x = np.where(labels == component_id)
        selected_points.append(np.column_stack([component_x + x1, component_y + y1]))

    if not selected_points:
        return None

    points = np.vstack(selected_points).astype(np.int32)
    if np.ptp(points[:, 0]) < (x2 - x1) * 0.25 and np.ptp(points[:, 1]) < (y2 - y1) * 0.25:
        return None

    hull = cv2.convexHull(points)
    hull_area = cv2.contourArea(hull)
    box_area = max(1, (x2 - x1) * (y2 - y1))
    if hull_area < box_area * 0.001 or hull_area > box_area * 0.35:
        return None

    polygon = cv2.approxPolyDP(hull, max(2.0, diagonal * 0.003), True)
    if len(polygon) < 3:
        return None
    return [[float(point[0][0]), float(point[0][1])] for point in polygon]


def _intersection_over_smaller(box_a: list, box_b: list) -> float:
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])
    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    smaller_area = min(_box_area(box_a), _box_area(box_b))
    return intersection / smaller_area if smaller_area > 0 else 0.0


def _center_distance(box_a: list, box_b: list) -> float:
    cx_a = (box_a[0] + box_a[2]) / 2
    cy_a = (box_a[1] + box_a[3]) / 2
    cx_b = (box_b[0] + box_b[2]) / 2
    cy_b = (box_b[1] + box_b[3]) / 2
    return math.hypot(cx_a - cx_b, cy_a - cy_b)


def _select_imgsz(img_array: np.ndarray, max_size: int = 1536) -> int:
    """Pick an inference size that preserves small cracks without blowing up memory."""
    max_dim = max(img_array.shape[:2])
    return max(640, min(max_size, ((max_dim + 31) // 32) * 32))


def _run_multiscale(model, img_array: np.ndarray, conf: float, imgsz: int, verbose: bool = False):
    """Run inference at multiple scales + TTA and merge detections.
    Returns list of (box, conf, cls_name, mask, result_obj, idx).
    """
    scales = [imgsz]
    if imgsz < 1280:
        scales.append(min(1280, ((max(img_array.shape[:2]) + 31) // 32) * 32))
    scales = sorted(set(scales), reverse=True)

    all_dets = []
    seen_boxes = []

    for sz in scales:
        try:
            results = model(img_array, conf=conf, imgsz=sz, augment=True, verbose=verbose)
        except Exception:
            try:
                results = model(img_array, conf=conf, imgsz=sz, verbose=verbose)
            except Exception:
                continue
        for result in results:
            if result.boxes is None:
                continue
            boxes = result.boxes
            for i in range(len(boxes)):
                cls_name = get_class_name(model, int(boxes.cls[i].item()))
                c = float(boxes.conf[i].item())
                xyxy = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = map(float, xyxy)
                box = [x1, y1, x2, y2]

                # Deduplicate across scales: skip if nearly identical box already found
                dup = False
                for sb in seen_boxes:
                    if compute_iou(box, sb) > 0.6:
                        dup = True
                        break
                if dup:
                    continue
                seen_boxes.append(box)

                mask = None
                if hasattr(result, 'masks') and result.masks is not None:
                    try:
                        polygon = result.masks.xy[i]
                        if polygon is not None and len(polygon) >= 3:
                            mask = [[float(point[0]), float(point[1])] for point in polygon]
                    except Exception:
                        pass

                all_dets.append((box, c, cls_name, mask))
    return all_dets


def _run_sahi(model, img_array: np.ndarray, conf: float, imgsz: int = 640, tile_size: int = 640, overlap: float = 0.25):
    """Slicing Aided Hyper Inference: split large image into overlapping tiles,
    run detection on each, and map detections back to original coordinates.
    Great for finding small/thin cracks in high-resolution images.
    """
    h, w = img_array.shape[:2]
    if h <= tile_size and w <= tile_size:
        return []

    stride = int(tile_size * (1 - overlap))
    all_dets = []
    seen_boxes = []

    for y0 in range(0, h, stride):
        for x0 in range(0, w, stride):
            x1_tile = min(x0 + tile_size, w)
            y1_tile = min(y0 + tile_size, h)
            tile = img_array[y0:y1_tile, x0:x1_tile]
            if tile.shape[0] < 64 or tile.shape[1] < 64:
                continue
            try:
                results = model(tile, conf=conf, imgsz=imgsz, verbose=False)
            except Exception:
                continue
            for result in results:
                if result.boxes is None:
                    continue
                boxes = result.boxes
                for i in range(len(boxes)):
                    cls_name = get_class_name(model, int(boxes.cls[i].item()))
                    c = float(boxes.conf[i].item())
                    xyxy = boxes.xyxy[i].cpu().numpy()
                    bx1, by1, bx2, by2 = map(float, xyxy)
                    # Map back to original image coordinates
                    box = [bx1 + x0, by1 + y0, bx2 + x0, by2 + y0]

                    # Deduplicate
                    dup = False
                    for sb in seen_boxes:
                        if compute_iou(box, sb) > 0.5:
                            dup = True
                            break
                    if dup:
                        continue
                    seen_boxes.append(box)

                    mask = None
                    if hasattr(result, 'masks') and result.masks is not None:
                        try:
                            polygon = result.masks.xy[i]
                            if polygon is not None and len(polygon) >= 3:
                                mask = [[float(p[0] + x0), float(p[1] + y0)] for p in polygon]
                        except Exception:
                            pass

                    all_dets.append((box, c, cls_name, mask))
    return all_dets


def _nms_suppress(box_a: list, box_b: list) -> bool:
    """Suppress overlapping detections while preserving dense small cracks."""
    iou = compute_iou(box_a, box_b)
    containment = _intersection_over_smaller(box_a, box_b)
    if iou > 0.45 or containment > 0.80:
        return True
    # For larger boxes, also suppress near-duplicate offset detections
    if _box_area(box_a) > SMALL_CRACK_AREA_CUTOFF or _box_area(box_b) > SMALL_CRACK_AREA_CUTOFF:
        c_dist = _center_distance(box_a, box_b)
        if c_dist < 30.0:
            return True
    return False


def _cv_dense_crack_candidates(img_array: np.ndarray) -> list:
    """Classical CV fallback for dense, small, thin cracks that YOLO may miss.

    Uses black-hat morphological transform to enhance dark, thin line structures,
    then extracts elongated connected components as crack candidates.
    Returns list of (box, confidence, class_name, mask) tuples.
    """
    h, w = img_array.shape[:2]
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

    # Downscale huge images to keep the morphological pass fast
    max_dim = max(h, w)
    scale = 1.0
    if max_dim > 1024:
        scale = 1024.0 / max_dim
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

    # Black-hat enhances dark thin cracks on a lighter background
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
    if blackhat.max() == 0:
        return []

    # Keep the strongest line-like responses
    threshold = float(np.percentile(blackhat, 95))
    _, binary = cv2.threshold(blackhat, threshold, 255, cv2.THRESH_BINARY)
    binary = binary.astype(np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8), iterations=1)

    component_count, labels, stats, centers = cv2.connectedComponentsWithStats(binary, 8)
    if component_count <= 1:
        return []

    work_h, work_w = gray.shape[:2]
    candidates = []
    for i in range(1, component_count):
        x, y, bw, bh, area = stats[i]
        # Ignore noise and huge blobs
        if area < 50 or area > 30000:
            continue
        maxd = max(bw, bh)
        mind = min(bw, bh)
        # Elongated, not blobby
        if maxd < 30 or mind / maxd > 0.85:
            continue
        # Reject components covering too much of the image
        if (bw * bh) / (work_h * work_w) > 0.5:
            continue

        box = [x, y, x + bw, y + bh]
        # Scale box back to original image coordinates if resized
        if scale != 1.0:
            box = [coord / scale for coord in box]

        is_valid, cv_score = _validate_crack_region(img_array, box)
        if not is_valid:
            continue

        # Base confidence for CV detections; rescale with CV score (can boost)
        adjusted_conf = _adjust_confidence(0.35, cv_score)
        if _is_blob_fp(box, img_array, adjusted_conf):
            continue
        candidates.append((box, adjusted_conf, "crack", None))
    return candidates


def run_ensemble(img_array: np.ndarray, threshold: float = CONFIDENCE_THRESHOLD):
    """Run models, filter noise, and merge detections with aggressive NMS.
    
    Multi-model ensemble approach:
    1. Primary model (YOLOv8-seg) — main crack detection with segmentation masks
    2. Secondary model (keremberke) — additional crack detection for coverage
    3. Fallback model — only if primary finds very few detections
    4. CV validation — edge density, directional contrast, local contrast
    5. Non-crack object filtering — reject detections overlapping known objects
    """
    all_boxes = []
    all_confs = []
    all_class_names = []
    all_masks = []

    # Use a higher resolution for high-res images so small cracks are preserved
    imgsz = _select_imgsz(img_array)
    # Allow secondary/fallback to consider weaker small-crack candidates
    small_crack_threshold = max(0.10, threshold - 0.05)

    # Detect non-crack objects first (pipes, doors, outlets, etc.)
    non_crack_objects = _detect_non_crack_objects(img_array)

    # Run primary model with multi-scale + TTA
    primary_detections = []
    model = get_model("primary")
    if model is not None:
        try:
            dets = _run_multiscale(model, img_array, conf=threshold, imgsz=imgsz)
            # Also run SAHI for high-res images to catch small cracks in tiles
            h, w = img_array.shape[:2]
            if h > 640 or w > 640:
                sahi_dets = _run_sahi(model, img_array, conf=threshold, imgsz=640)
                # Merge SAHI detections, deduplicate against multiscale
                for sd in sahi_dets:
                    dup = False
                    for md in dets:
                        if compute_iou(sd[0], md[0]) > 0.5:
                            dup = True
                            break
                    if not dup:
                        dets.append(sd)

            for box, conf, cls_name, mask in dets:
                if not _is_crack_like(cls_name):
                    continue
                if not _aspect_ratio_ok(box):
                    continue
                if not _min_crack_size_ok(box) or _box_area_ratio(box, img_array) > 0.90:
                    continue

                # Check overlap with non-crack objects
                overlaps_non_crack = False
                for nc_box, nc_conf, nc_name in non_crack_objects:
                    if compute_iou(box, nc_box) > 0.3:
                        overlaps_non_crack = True
                        break
                if overlaps_non_crack:
                    continue

                # CV validation — verify crack-like visual features
                is_valid, cv_score = _validate_crack_region(img_array, box)
                if not is_valid:
                    continue

                adjusted_conf = _adjust_confidence(conf, cv_score)
                if _is_blob_fp(box, img_array, adjusted_conf):
                    continue
                primary_detections.append((box, adjusted_conf, cls_name, mask))
        except Exception:
            pass

    # Run secondary model for additional coverage
    secondary_detections = []
    model = get_model("secondary")
    if model is not None:
        try:
            dets = _run_multiscale(model, img_array, conf=small_crack_threshold, imgsz=imgsz)
            for box, conf, cls_name, mask in dets:
                if not _is_crack_like(cls_name):
                    continue
                if not _aspect_ratio_ok(box):
                    continue
                if not _min_crack_size_ok(box) or _box_area_ratio(box, img_array) > 0.90:
                    continue

                # Check overlap with non-crack objects
                overlaps_non_crack = False
                for nc_box, nc_conf, nc_name in non_crack_objects:
                    if compute_iou(box, nc_box) > 0.3:
                        overlaps_non_crack = True
                        break
                if overlaps_non_crack:
                    continue

                # CV validation
                is_valid, cv_score = _validate_crack_region(img_array, box)
                if not is_valid:
                    continue

                # Low-conf secondary: require primary agreement or strong CV score
                if conf < threshold and not (
                    _agrees_with_primary(box, primary_detections) or cv_score >= 0.35
                ):
                    continue

                adjusted_conf = _adjust_confidence(conf, cv_score)
                if _is_blob_fp(box, img_array, adjusted_conf):
                    continue
                secondary_detections.append((box, adjusted_conf, cls_name, None))
        except Exception:
            pass

    # If primary found enough real cracks, don't use noisy fallback.
    if len(primary_detections) >= 3:
        all_entries = primary_detections + secondary_detections
    else:
        # Add fallback detections
        fallback_detections = []
        model = get_model("fallback")
        if model is not None:
            try:
                dets = _run_multiscale(model, img_array, conf=small_crack_threshold, imgsz=imgsz)
                for box, conf, cls_name, mask in dets:
                    if not _is_crack_like(cls_name):
                        continue
                    if not _aspect_ratio_ok(box):
                        continue
                    if not _min_crack_size_ok(box) or _is_full_width_top_region(box, img_array):
                        continue

                    overlaps_non_crack = False
                    for nc_box, nc_conf, nc_name in non_crack_objects:
                        if compute_iou(box, nc_box) > 0.3:
                            overlaps_non_crack = True
                            break
                    if overlaps_non_crack:
                        continue

                    is_valid, cv_score = _validate_crack_region(img_array, box)
                    if not is_valid:
                        continue

                    # Low-conf fallback: require primary agreement or strong CV score
                    if conf < threshold and not (
                        _agrees_with_primary(box, primary_detections) or cv_score >= 0.35
                    ):
                        continue

                    polygon = _extract_crack_polygon(img_array, box)
                    if _box_area_ratio(box, img_array) > 0.90 and polygon is None:
                        continue

                    adjusted_conf = _adjust_confidence(conf, cv_score)
                    if _is_blob_fp(box, img_array, adjusted_conf):
                        continue
                    fallback_detections.append((box, adjusted_conf, cls_name, polygon))
            except Exception:
                pass
        all_entries = primary_detections + secondary_detections + fallback_detections

    # If model ensemble still finds few cracks, use a classical-CV fallback tuned
    # for dense networks of very small/thin cracks (e.g. shrinkage cracks).
    if len(all_entries) < 3:
        try:
            cv_candidates = _cv_dense_crack_candidates(img_array)
            all_entries.extend(cv_candidates)
        except Exception:
            pass

    if len(all_entries) == 0:
        # Still return non-crack objects if no cracks found
        if non_crack_objects:
            pass
        else:
            return [], [], [], []

    # Sort crack detections by confidence descending for greedy NMS
    all_entries.sort(key=lambda x: x[1], reverse=True)
    all_boxes = [e[0] for e in all_entries]
    all_confs = [e[1] for e in all_entries]
    all_class_names = [e[2] for e in all_entries]
    all_masks = [e[3] for e in all_entries]

    # Greedy NMS with IoU and center-distance merge
    suppressed = [False] * len(all_boxes)

    for i in range(len(all_boxes)):
        if suppressed[i]:
            continue
        for j in range(i + 1, len(all_boxes)):
            if suppressed[j]:
                continue
            if _nms_suppress(all_boxes[i], all_boxes[j]):
                suppressed[j] = True

    merged = []
    for i in range(len(all_boxes)):
        if not suppressed[i]:
            merged.append({
                "bbox": all_boxes[i],
                "confidence": all_confs[i],
                "class_name": all_class_names[i],
                "mask": all_masks[i],
            })

    # Append non-crack objects as class "other" (no NMS against cracks)
    for nc_box, nc_conf, _ in non_crack_objects:
        merged.append({
            "bbox": nc_box,
            "confidence": nc_conf,
            "class_name": "other",
            "mask": None,
        })

    # Sort by confidence descending
    merged.sort(key=lambda x: x["confidence"], reverse=True)
    boxes_out = [m["bbox"] for m in merged]
    confs_out = [m["confidence"] for m in merged]
    names_out = [m["class_name"] for m in merged]
    masks_out = [m["mask"] for m in merged]
    return boxes_out, confs_out, names_out, masks_out


def compute_iou(box_a, box_b):
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0

CLASS_COLORS = {
    "crack": (196, 84, 61),
    "Crack": (196, 84, 61),
    "Spalling": (194, 138, 44),
    "spalling": (194, 138, 44),
    "Ruststrain": (123, 107, 138),
    "Scaling": (107, 123, 138),
}

DEFAULT_COLORS = [
    (196, 84, 61), (194, 138, 44), (123, 107, 138),
    (107, 123, 138), (62, 101, 125), (138, 148, 148),
]


def get_class_name(model, cls_id: int) -> str:
    try:
        names = model.names
        if isinstance(names, dict):
            return str(names.get(cls_id, f"class_{cls_id}"))
        elif isinstance(names, list):
            return str(names[cls_id]) if cls_id < len(names) else f"class_{cls_id}"
    except Exception:
        pass
    return f"class_{cls_id}"


def severity_from_confidence(conf: float) -> str:
    if conf >= 0.75:
        return "high"
    elif conf >= 0.45:
        return "medium"
    return "low"


def draw_annotations(img_array: np.ndarray, detections: list) -> np.ndarray:
    annotated = img_array.copy()
    pil_img = Image.fromarray(annotated)
    draw = ImageDraw.Draw(pil_img)
    h, w = img_array.shape[:2]
    font_size = max(16, int(min(w, h) * 0.025))

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    for det in detections:
        bbox = det["bbox"]
        x1, y1 = int(bbox["x"]), int(bbox["y"])
        x2, y2 = x1 + int(bbox["width"]), y1 + int(bbox["height"])
        cls = det["class"]
        conf = det["confidence"]
        sev = det.get("severity", severity_from_confidence(conf))

        if cls.lower() == "other":
            color = (148, 163, 184)
        elif sev == "high":
            color = (220, 38, 38)
        elif sev == "medium":
            color = (234, 88, 12)
        else:
            color = (22, 163, 74)

        thickness = max(2, int(min(w, h) * 0.003))
        draw.rectangle([x1, y1, x2, y2], outline=color, width=thickness)

        label = f"{cls} {conf:.0%} [{sev.upper()}]"
        try:
            bbox_text = draw.textbbox((x1, y1 - font_size - 4), label, font=font)
            draw.rectangle(bbox_text, fill=color)
        except Exception:
            pass
        draw.text((x1, y1 - font_size - 4), label, fill=(255, 255, 255), font=font)

    return np.array(pil_img)


# ── Engineering knowledge base ───────────────────────────────────────────────

DEFECT_ENGINEERING = {
    "Crack": {
        "ru_name": "Трещина",
        "en_name": "Crack",
        "category": "Механический дефект — нарушение монолитности",
        "causes": [
            "Превышение растягивающих напряжений над прочностью материала",
            "Неравномерная осадка фундамента",
            "Температурно-влажностные деформации (усадка, морозное пучение)",
            "Ударные и вибрационные нагрузки",
            "Коррозия арматуры с объёмным расширением продуктов коррозии",
            "Нарушение технологии бетонирования (преждевременное снятие опалубки)",
        ],
        "why_nn_detected": (
            "Нейронная сеть YOLOv8 обнаружила данный регион как трещину, потому что "
            "он содержит характерные визуальные признаки: тёмная линейная неоднородность "
            "с высоким контрастом относительно фона, вытянутая узкая форма, типичная "
            "ориентация. Модель обучена на тысячах аннотированных изображений трещин "
            "в бетонных и каменных конструкциях. Уверенность {conf}% означает, что "
            "визуальный паттерн {confidence_level} соответствует известным паттернам "
            "трещин в обучающей выборке."
        ),
        "norms": [
            "ГОСТ 31937-2011 — Здания и сооружения. Правила обследования",
            "СП 13-102-2003 — Правила обследования несущих конструкций",
            "СНиП 2.03.01-84* — Бетонные и железобетонные конструкции",
            "СП 63.13330.2018 — Бетонные и ж/б конструкции. Основные положения",
        ],
        "limits": {
            "normal": "Предельная ширина раскрытия трещин: 0.3 мм (нормальные условия)",
            "aggressive": "Предельная ширина: 0.1 мм (агрессивная среда, морская вода, химия)",
            "indoor": "Предельная ширина: 0.3 мм (закрытые помещения)",
        },
        "danger_levels": {
            "high": "КРИТИЧЕСКИЙ — трещина шириной > 0.3 мм. Признак потери несущей способности. Сквозные трещины требуют немедленного вмешательства конструктора. Возможна потеря монолитности сечения.",
            "medium": "ЗНАЧИТЕЛЬНЫЙ — трещина шириной 0.1–0.3 мм. Снижает долговечность, открывает доступ влаги к арматуре. Требует планового ремонта в течение 30 дней.",
            "low": "НЕЗНАЧИТЕЛЬНЫЙ — волосяная трещина < 0.1 мм. Не влияет на несущую способность. Рекомендуется мониторинг для исключения динамики развития.",
        },
        "actions": {
            "high": [
                "НЕМЕДЛЕННО: ограничить эксплуатационные нагрузки на конструкцию",
                "Установить гипсовые маяки (пластинки) для наблюдения за динамикой раскрытия",
                "Вызвать специалиста-конструктора для расчёта несущей способности",
                "Провести инструментальное обследование: щуп, трещиномер, ультразвук",
                "Подготовить акт дефектации с фотоматериалами",
                "При подтверждении — инъектирование эпоксидной смолой под давлением",
            ],
            "medium": [
                "Установить маяки для наблюдения за развитием трещины",
                "Провести измерение ширины раскрытия щупом/трещиномером",
                "Запланировать ремонт в течение 30 дней",
                "Инъектирование цементным молоком или полимерным составом",
                "Задокументировать в журнале технического состояния",
            ],
            "low": [
                "Нанести маркировку и установить контрольные маяки",
                "Осмотр при следующем плановом обследовании (через 6 мес.)",
                "При раскрытии > 0.1 мм — перейти к активным мерам",
                "Задокументировать в журнале ТО",
            ],
        },
        "concrete_grades_affected": "B15–B40 (М200–М500). Трещины наиболее опасны в конструкциях класса B15–B25 (меньший запас прочности).",
        "rebar_impact": "Трещины шириной > 0.3 мм открывают доступ влаги и CO2 к арматуре → карбонизация бетона → коррозия арматуры → дальнейшее раскрытие трещины (эффект домино).",
        "measurement_methods": [
            "Щуп (набор пластин разной толщины) — ГОСТ 31937-2011, п. 7.4",
            "Трещиномер (микроскоп) — точность до 0.01 мм",
            "Датчики раскрытия (DEMEC) — для длительного мониторинга",
            "Ультразвуковой метод — ГОСТ 17624-2012",
        ],
        "license_required": "Обследование проводится аттестованной лабораторией. Аттестат аккредитации Росаккредитации. Инженер-обследователь: профильное ВО + стаж 5+ лет.",
    },
    "crack": {
        "ru_name": "Трещина",
        "en_name": "Crack",
        "category": "Механический дефект — нарушение монолитности",
        "causes": [
            "Превышение растягивающих напряжений над прочностью материала",
            "Неравномерная осадка фундамента",
            "Температурно-влажностные деформации",
            "Ударные и вибрационные нагрузки",
            "Коррозия арматуры",
            "Усадка бетона при твердении",
        ],
        "why_nn_detected": (
            "Нейронная сеть YOLOv8 обнаружила данный регион как трещину по характерным "
            "визуальным признакам: тёмная линейная неоднородность, вытянутая узкая форма, "
            "высокий контраст. Уверенность {conf}% — паттерн {confidence_level} соответствует "
            "обучающей выборке."
        ),
        "norms": [
            "ГОСТ 31937-2011", "СП 13-102-2003", "СНиП 2.03.01-84*", "СП 63.13330.2018",
        ],
        "limits": {
            "normal": "Предельная ширина: 0.3 мм",
            "aggressive": "Предельная ширина: 0.1 мм",
            "indoor": "Предельная ширина: 0.3 мм",
        },
        "danger_levels": {
            "high": "КРИТИЧЕСКИЙ — ширина > 0.3 мм. Потеря несущей способности.",
            "medium": "ЗНАЧИТЕЛЬНЫЙ — 0.1–0.3 мм. Снижение долговечности.",
            "low": "НЕЗНАЧИТЕЛЬНЫЙ — < 0.1 мм. Мониторинг.",
        },
        "actions": {
            "high": [
                "Ограничить нагрузки немедленно",
                "Установить маяки",
                "Вызвать конструктора",
                "Инъектирование эпоксидной смолой",
            ],
            "medium": [
                "Установить маяки",
                "Измерить ширину щупом",
                "Ремонт в течение 30 дней",
                "Инъектирование цементным молоком",
            ],
            "low": [
                "Контрольные маяки",
                "Осмотр через 6 месяцев",
            ],
        },
        "concrete_grades_affected": "B15–B40 (М200–М500)",
        "rebar_impact": "Трещины > 0.3 мм → доступ влаги к арматуре → коррозия → дальнейшее раскрытие.",
        "measurement_methods": ["Щуп (ГОСТ 31937)", "Трещиномер (0.01 мм)", "DEMEC датчики", "УЗ-метод (ГОСТ 17624)"],
        "license_required": "Аттестованная лаборатория Росаккредитации. Инженер: ВО + 5 лет стажа.",
    },
    "Spalling": {
        "ru_name": "Скол / Отслоение",
        "en_name": "Spalling",
        "category": "Деструктивный дефект — потеря материала с поверхности",
        "causes": [
            "Коррозия арматуры с расширением продуктов коррозии (объём +200-400%)",
            "Циклическое замораживание-оттаивание (морозное разрушение)",
            "Механическое воздействие (удар, абразия)",
            "Карбонизация бетона (снижение pH < 9 → депассивация арматуры)",
            "Нарушение технологии укладки и уплотнения бетонной смеси",
            "Недостаточный защитный слой бетона над арматурой",
        ],
        "why_nn_detected": (
            "Модель идентифицировала скол по следующим визуальным признакам: "
            "отсутствие материала на участке поверхности, обнажённый заполнитель "
            "(щебень/гравий), неровная геометрия с резкими краями, контраст "
            "с окружающей неповреждённой поверхностью. Уверенность {conf}%."
        ),
        "norms": [
            "ГОСТ 31937-2011", "СП 13-102-2003", "СТО НОСТРОЙ 2.7.64-2012",
            "СП 28.13330.2017 — Защита от коррозии",
        ],
        "limits": {
            "normal": "Глубина скола > 20 мм или обнажение арматуры — критический дефект",
            "aggressive": "Любое отслоение с обнажением арматуры — критический",
            "indoor": "Глубина > 20 мм — критический, < 20 мм — значительный",
        },
        "danger_levels": {
            "high": "КРИТИЧЕСКИЙ — обнажена арматура или глубина > 20 мм. Активная коррозия. Снижение сечения элемента. При площади > 10% сечения — немедленная конструктивная оценка.",
            "medium": "ЗНАЧИТЕЛЬНЫЙ — shallow spall 5-20 мм без обнажения арматуры. Требует ремонта для предотвращения дальнейшего разрушения.",
            "low": "НЕЗНАЧИТЕЛЬНЫЙ — поверхностное отслоение < 5 мм. Косметический дефект.",
        },
        "actions": {
            "high": [
                "НЕМЕДЛЕННО: обнажить арматуру, определить глубину коррозии",
                "Механическая очистка арматуры до степени Sa 2.5 (ГОСТ ISO 8501-1)",
                "Нанесение преобразователя ржавчины + антикоррозийного состава",
                "Восстановление защитного слоя ремонтным составом (Emaco, Sika MonoTop)",
                "Расчёт остаточной несущей способности сечения",
                "При потере сечения арматуры > 5% — усиление конструкции",
            ],
            "medium": [
                "Очистить зону дефекта от рыхлого материала",
                "Заполнить ремонтным составом",
                "Нанести гидрофобизатор",
                "Плановый ремонт в течение 30 дней",
            ],
            "low": [
                "Зачистка поверхности",
                "Нанесение защитного покрытия",
                "Плановый ремонт при возможности",
            ],
        },
        "concrete_grades_affected": "Все классы. Особенно уязвим B15–B25 (низкая морозостойкость F50-F100).",
        "rebar_impact": "Обнажённая арматура: скорость коррозии 0.1–0.5 мм/год в атмосферных условиях. Потеря 15% сечения → снижение несущей способности на 30-50%.",
        "measurement_methods": [
            "Штангенциркуль — глубина скола",
            "Линейка — площадь отслоения",
            "Молоток Шмидта (ГОСТ 22690) — прочность поверхности",
            "Ультразвук (ГОСТ 17624) — глубина разрушения",
        ],
        "license_required": "Аттестованная лаборатория. Инженер-конструктор при обнажении арматуры.",
    },
    "default": {
        "ru_name": "Прочий дефект",
        "en_name": "Unknown defect",
        "category": "Поверхностная аномалия, обнаруженная нейросетью",
        "causes": ["Требуется детальное инструментальное обследование для определения причины."],
        "why_nn_detected": "Нейросеть отметила регион, отклоняющийся от нормальных паттернов поверхности. Требуется экспертная оценка.",
        "norms": ["ГОСТ 31937-2011", "СП 13-102-2003"],
        "limits": {"normal": "Определяется проектом", "aggressive": "Определяется проектом", "indoor": "Определяется проектом"},
        "danger_levels": {
            "high": "КРИТИЧЕСКИЙ — требует немедленной экспертной оценки",
            "medium": "ЗНАЧИТЕЛЬНЫЙ — плановое обследование",
            "low": "НЕЗНАЧИТЕЛЬНЫЙ — мониторинг",
        },
        "actions": {
            "high": ["Инструментальное обследование специалистом"],
            "medium": ["Плановое обследование"],
            "low": ["Мониторинг"],
        },
        "concrete_grades_affected": "Все классы",
        "rebar_impact": "Требуется оценка",
        "measurement_methods": ["Визуальный осмотр", "Инструментальное обследование"],
        "license_required": "Аттестованная лаборатория Росаккредитации.",
    },
}


def get_defect_info(class_name: str) -> dict:
    return DEFECT_ENGINEERING.get(class_name, DEFECT_ENGINEERING["default"])


def estimate_crack_width_mm(bbox: dict, image_w: int, image_h: int, pixel_scale_mm: Optional[float] = None) -> float:
    """Estimate crack width in mm based on bbox and pixel scale."""
    if pixel_scale_mm and pixel_scale_mm > 0:
        width_px = min(bbox.get("width", 0), bbox.get("height", 0))
        return width_px * pixel_scale_mm
    # Heuristic: assume average photo distance ~3m, sensor width ~6mm, focal ~4mm
    # width_mm ≈ (bbox_width_px / image_width) * 1000 (rough estimate for ~3m distance)
    if image_w > 0:
        min_dim_px = min(bbox.get("width", 0), bbox.get("height", 0))
        return round(min_dim_px / image_w * 500, 2)
    return 0.0


def estimate_crack_length_mm(bbox: dict, image_w: int, image_h: int, pixel_scale_mm: Optional[float] = None) -> float:
    """Estimate crack length in mm."""
    if pixel_scale_mm and pixel_scale_mm > 0:
        max_dim_px = max(bbox.get("width", 0), bbox.get("height", 0))
        return max_dim_px * pixel_scale_mm
    if image_w > 0:
        max_dim_px = max(bbox.get("width", 0), bbox.get("height", 0))
        return round(max_dim_px / image_w * 500, 2)
    return 0.0


def estimate_area_cm2(bbox: dict, image_w: int, image_h: int, pixel_scale_mm: Optional[float] = None) -> float:
    """Estimate defect area in cm²."""
    if pixel_scale_mm and pixel_scale_mm > 0:
        w_mm = bbox.get("width", 0) * pixel_scale_mm
        h_mm = bbox.get("height", 0) * pixel_scale_mm
        return round(w_mm * h_mm / 100, 2)
    if image_w > 0:
        w_mm = bbox.get("width", 0) / image_w * 500
        h_mm = bbox.get("height", 0) / image_h * 500
        return round(w_mm * h_mm / 100, 2)
    return 0.0


def build_engineering_analysis(det: dict, image_w: int, image_h: int, pixel_scale_mm: Optional[float], environment: str) -> dict:
    """Build full engineering analysis for a single detection."""
    cls = det.get("class", "unknown")
    conf = det.get("confidence", 0)
    bbox = det.get("bbox", {})
    sev = severity_from_confidence(conf)
    info = get_defect_info(cls)

    width_mm = estimate_crack_width_mm(bbox, image_w, image_h, pixel_scale_mm)
    length_mm = estimate_crack_length_mm(bbox, image_w, image_h, pixel_scale_mm)
    area_cm2 = estimate_area_cm2(bbox, image_w, image_h, pixel_scale_mm)

    env_key = environment if environment in info["limits"] else "normal"
    limit_text = info["limits"].get(env_key, info["limits"]["normal"])

    is_critical = width_mm > 0.3 if cls.lower() in ("crack",) else sev == "high"

    confidence_level = "высоко" if conf > 0.75 else "умеренно" if conf > 0.45 else "слабо"
    why_text = info["why_nn_detected"].format(conf=int(conf * 100), confidence_level=confidence_level)

    return {
        "class": cls,
        "confidence": conf,
        "severity": sev,
        "bbox": bbox,
        "engineering": {
            "ru_name": info["ru_name"],
            "en_name": info["en_name"],
            "category": info["category"],
            "estimated_width_mm": width_mm,
            "estimated_length_mm": length_mm,
            "estimated_area_cm2": area_cm2,
            "width_cm": round(width_mm / 10, 2),
            "length_cm": round(length_mm / 10, 2),
            "normative_limit": limit_text,
            "is_critical": is_critical,
            "why_nn_detected": why_text,
            "causes": info["causes"],
            "danger_level": info["danger_levels"].get(sev, ""),
            "recommended_actions": info["actions"].get(sev, []),
            "norms": info["norms"],
            "concrete_grades_affected": info.get("concrete_grades_affected", ""),
            "rebar_impact": info.get("rebar_impact", ""),
            "measurement_methods": info.get("measurement_methods", []),
            "license_required": info.get("license_required", ""),
        },
    }


# ── Pydantic models ──────────────────────────────────────────────────────────

class Detection(BaseModel):
    class_: str = Field(..., alias="class")
    confidence: float
    bbox: dict


class PredictionResponse(BaseModel):
    image_width: int
    image_height: int
    detections: List[Detection]
    annotated_image: str
    processing_time: float
    model_version: str


class DetailedDetection(Detection):
    severity: str
    engineering: dict = {}


class DetailedPredictionResponse(PredictionResponse):
    detections_detailed: List[DetailedDetection] = []
    summary: dict = {}


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": SERVICE_VERSION,
        "models": [HF_MODEL, HF_MODEL_FALLBACK, HF_MODEL_SECONDARY],
        "api_key_required": bool(API_KEY),
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    threshold: float = Query(CONFIDENCE_THRESHOLD, ge=0.0, le=1.0),
    _: bool = Depends(verify_api_key),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    img_array = np.array(image)
    h, w = img_array.shape[:2]

    start_time = time.time()
    try:
        all_boxes, all_confs, all_names, all_masks = run_ensemble(img_array, threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    detections = []
    for i in range(len(all_boxes)):
        conf = all_confs[i]
        x1, y1, x2, y2 = all_boxes[i]
        class_name = all_names[i]
        polygon = all_masks[i] if i < len(all_masks) and all_masks[i] else None
        detections.append({
            "class": class_name,
            "confidence": conf,
            "bbox": {
                "x": float(x1),
                "y": float(y1),
                "width": float(x2 - x1),
                "height": float(y2 - y1),
                "polygon": polygon,
            },
        })

    annotated = draw_annotations(img_array, detections)
    annotated_pil = Image.fromarray(annotated)
    buf = io.BytesIO()
    annotated_pil.save(buf, format="JPEG", quality=90)
    annotated_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    processing_time = time.time() - start_time

    return PredictionResponse(
        image_width=w,
        image_height=h,
        detections=detections,
        annotated_image=annotated_b64,
        processing_time=processing_time,
        model_version=MODEL_VERSION,
    )


@app.post("/predict/detailed", response_model=DetailedPredictionResponse)
async def predict_detailed(
    file: UploadFile = File(...),
    threshold: float = Query(CONFIDENCE_THRESHOLD, ge=0.0, le=1.0),
    _: bool = Depends(verify_api_key),
    pixel_scale_mm: Optional[float] = Query(None),
    environment: str = Query("atmospheric"),
    aggression: str = Query("normal"),
    structure_type: Optional[str] = Query(None),
    concrete_grade: Optional[str] = Query(None),
    rebar_class: Optional[str] = Query(None),
    structure_age: Optional[str] = Query(None),
    protective_layer_mm: Optional[float] = Query(None),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    img_array = np.array(image)
    h, w = img_array.shape[:2]

    start_time = time.time()
    try:
        all_boxes, all_confs, all_names, all_masks = run_ensemble(img_array, threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    detections = []
    detections_detailed = []
    class_counts = {}
    other_count = 0

    for i in range(len(all_boxes)):
        conf = all_confs[i]
        x1, y1, x2, y2 = all_boxes[i]
        class_name = all_names[i]
        is_other = class_name == "other"
        sev = severity_from_confidence(conf)

        det = {
            "class": class_name,
            "confidence": conf,
            "bbox": {
                "x": float(x1),
                "y": float(y1),
                "width": float(x2 - x1),
                "height": float(y2 - y1),
                "polygon": all_masks[i] if all_masks[i] else None,
            },
        }
        detections.append(det)

        if is_other:
            other_count += 1
            # Foreign objects get a minimal engineering entry and are not defects
            detections_detailed.append({
                **det,
                "severity": "low",
                "engineering": {
                    "ru_name": "Прочий объект",
                    "en_name": "Other object",
                    "category": "Not a structural defect",
                    "why_nn_detected": "Neural network identified a foreign object not related to a crack or defect.",
                    "recommended_actions": ["Verify on site; ignore if not a defect."],
                    "is_other": True,
                },
            })
        else:
            eng = build_engineering_analysis(det, w, h, pixel_scale_mm, environment)
            detections_detailed.append({**det, "severity": sev, "engineering": eng["engineering"]})

        class_counts[class_name] = class_counts.get(class_name, 0) + 1

    annotated = draw_annotations(img_array, detections)
    annotated_pil = Image.fromarray(annotated)
    buf = io.BytesIO()
    annotated_pil.save(buf, format="JPEG", quality=90)
    annotated_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    processing_time = time.time() - start_time

    defect_detailed = [d for d in detections_detailed if d["class"] != "other"]
    high_count = sum(1 for d in defect_detailed if d["severity"] == "high")
    medium_count = sum(1 for d in defect_detailed if d["severity"] == "medium")
    low_count = sum(1 for d in defect_detailed if d["severity"] == "low")

    summary = {
        "total": len(defect_detailed),
        "high": high_count,
        "medium": medium_count,
        "low": low_count,
        "other": other_count,
        "class_counts": class_counts,
        "overall_condition": "INADMISSIBLE" if high_count > 0 else "LIMITED" if medium_count > 0 else "SERVICEABLE" if low_count > 0 else "NORMAL",
    }

    return DetailedPredictionResponse(
        image_width=w,
        image_height=h,
        detections=detections,
        annotated_image=annotated_b64,
        processing_time=processing_time,
        model_version=MODEL_VERSION,
        detections_detailed=detections_detailed,
        summary=summary,
    )


@app.post("/report")
async def generate_report(
    file: UploadFile = File(...),
    _: bool = Depends(verify_api_key),
    threshold: float = Query(CONFIDENCE_THRESHOLD, ge=0.0, le=1.0),
    project_name: str = Query("Не указан"),
    inspector: str = Query("InspectAI Automated System"),
    location: str = Query("Не указан"),
    pixel_scale_mm: Optional[float] = Query(None),
    environment: str = Query("atmospheric"),
    aggression: str = Query("normal"),
    structure_type: Optional[str] = Query(None),
    concrete_grade: Optional[str] = Query(None),
    rebar_class: Optional[str] = Query(None),
    structure_age: Optional[str] = Query(None),
    protective_layer_mm: Optional[float] = Query(None),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    img_array = np.array(image)
    h, w = img_array.shape[:2]

    start_time = time.time()
    try:
        all_boxes, all_confs, all_names, all_masks = run_ensemble(img_array, threshold)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")

    detections = []
    detections_detailed = []

    for i in range(len(all_boxes)):
        conf = all_confs[i]
        x1, y1, x2, y2 = all_boxes[i]
        class_name = all_names[i]
        sev = severity_from_confidence(conf)

        det = {
            "class": class_name,
            "confidence": conf,
            "bbox": {
                "x": float(x1),
                "y": float(y1),
                "width": float(x2 - x1),
                "height": float(y2 - y1),
                "polygon": all_masks[i] if all_masks[i] else None,
            },
        }
        detections.append(det)

        if class_name == "other":
            detections_detailed.append({
                **det,
                "severity": "low",
                "engineering": {
                    "ru_name": "Прочий объект",
                    "en_name": "Other object",
                    "category": "Not a structural defect",
                    "why_nn_detected": "Neural network identified a foreign object not related to a crack or defect.",
                    "recommended_actions": ["Verify on site; ignore if not a defect."],
                    "is_other": True,
                },
            })
        else:
            eng = build_engineering_analysis(det, w, h, pixel_scale_mm, environment)
            detections_detailed.append({**det, "severity": sev, "engineering": eng["engineering"]})

    # PDF report shows only structural defects, not foreign objects
    report_detections = [d for d in detections_detailed if d.get("class") != "other"]
    report_boxes = [d for d in detections if d.get("class") != "other"]

    annotated = draw_annotations(img_array, report_boxes)
    annotated_pil = Image.fromarray(annotated)
    ann_buf = io.BytesIO()
    annotated_pil.save(ann_buf, format="JPEG", quality=90)
    annotated_b64 = base64.b64encode(ann_buf.getvalue()).decode("utf-8")

    orig_b64 = base64.b64encode(contents).decode("utf-8")
    processing_time = time.time() - start_time

    try:
        from report_generator import generate_pdf_report
        pdf_bytes = generate_pdf_report(
            detections=report_detections,
            annotated_image_b64=annotated_b64,
            original_image_b64=orig_b64,
            image_width=w,
            image_height=h,
            processing_time=processing_time,
            project_name=project_name,
            inspector=inspector,
            location=location,
            environment=environment,
            aggression=aggression,
            pixel_scale_mm=pixel_scale_mm,
            structure_type=structure_type,
            concrete_grade=concrete_grade,
            rebar_class=rebar_class,
            structure_age=structure_age,
            protective_layer_mm=protective_layer_mm,
        )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="InspectAI_Engineering_Report.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
