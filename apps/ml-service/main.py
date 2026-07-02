import io
import os
import time
import base64
import math
from typing import List, Optional, Dict, Any
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

app = FastAPI(
    title="InspectAI ML Service",
    description="YOLOv8-based concrete defect detection API with engineering analysis",
    version="2.0.0",
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_MODEL = os.getenv("HF_MODEL", "keremberke/yolov8s-surface-crack-detection")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))
API_KEY = os.getenv("ML_API_KEY", "")


async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    return True


_model = None

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


def get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        model_path = os.getenv("MODEL_PATH", "")
        if model_path and os.path.exists(model_path):
            _model = YOLO(model_path)
        else:
            _model = YOLO(HF_MODEL)
    return _model


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

        if sev == "high":
            color = (220, 38, 38)
        elif sev == "medium":
            color = (234, 88, 12)
        else:
            color = (22, 163, 74)

        thickness = max(2, int(min(w, h) * 0.003))
        draw.rectangle([x1, y1, x2, y2], outline=color, width=thickness)

        label = f"{cls} {conf:.0%} [{sev.upper()}]"
        bbox_text = draw.textbbox((x1, y1 - font_size - 4), label, font=font)
        draw.rectangle(bbox_text, fill=color)
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
    return {"status": "ok", "version": "2.0.0", "model": HF_MODEL}


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
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
    model = get_model()
    results = model(img_array, conf=CONFIDENCE_THRESHOLD, verbose=False)

    detections = []
    for result in results:
        boxes = result.boxes
        for i in range(len(boxes)):
            cls_id = int(boxes.cls[i].item())
            conf = float(boxes.conf[i].item())
            xyxy = boxes.xyxy[i].cpu().numpy()
            x1, y1, x2, y2 = xyxy
            class_name = get_class_name(model, cls_id)
            detections.append({
                "class": class_name,
                "confidence": conf,
                "bbox": {
                    "x": float(x1),
                    "y": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1),
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
        model_version="yolov8s-v2.0",
    )


@app.post("/predict/detailed", response_model=DetailedPredictionResponse)
async def predict_detailed(
    file: UploadFile = File(...),
    _: bool = Depends(verify_api_key),
    pixel_scale_mm: Optional[float] = Query(None),
    environment: str = Query("atmospheric"),
    aggression: str = Query("normal"),
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
    model = get_model()
    results = model(img_array, conf=CONFIDENCE_THRESHOLD, verbose=False)

    detections = []
    detections_detailed = []
    class_counts = {}

    for result in results:
        boxes = result.boxes
        for i in range(len(boxes)):
            cls_id = int(boxes.cls[i].item())
            conf = float(boxes.conf[i].item())
            xyxy = boxes.xyxy[i].cpu().numpy()
            x1, y1, x2, y2 = xyxy
            class_name = get_class_name(model, cls_id)
            sev = severity_from_confidence(conf)

            det = {
                "class": class_name,
                "confidence": conf,
                "bbox": {
                    "x": float(x1),
                    "y": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1),
                },
            }
            detections.append(det)

            eng = build_engineering_analysis(det, w, h, pixel_scale_mm, environment)
            detections_detailed.append({**det, "severity": sev, "engineering": eng["engineering"]})

            class_counts[class_name] = class_counts.get(class_name, 0) + 1

    annotated = draw_annotations(img_array, detections)
    annotated_pil = Image.fromarray(annotated)
    buf = io.BytesIO()
    annotated_pil.save(buf, format="JPEG", quality=90)
    annotated_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    processing_time = time.time() - start_time

    high_count = sum(1 for d in detections_detailed if d["severity"] == "high")
    medium_count = sum(1 for d in detections_detailed if d["severity"] == "medium")
    low_count = sum(1 for d in detections_detailed if d["severity"] == "low")

    summary = {
        "total": len(detections),
        "high": high_count,
        "medium": medium_count,
        "low": low_count,
        "class_counts": class_counts,
        "overall_condition": "INADMISSIBLE" if high_count > 0 else "LIMITED" if medium_count > 0 else "SERVICEABLE" if low_count > 0 else "NORMAL",
    }

    return DetailedPredictionResponse(
        image_width=w,
        image_height=h,
        detections=detections,
        annotated_image=annotated_b64,
        processing_time=processing_time,
        model_version="yolov8s-v2.0",
        detections_detailed=detections_detailed,
        summary=summary,
    )


@app.post("/report")
async def generate_report(
    file: UploadFile = File(...),
    _: bool = Depends(verify_api_key),
    project_name: str = Query("Не указан"),
    inspector: str = Query("InspectAI Automated System"),
    location: str = Query("Не указан"),
    pixel_scale_mm: Optional[float] = Query(None),
    environment: str = Query("atmospheric"),
    aggression: str = Query("normal"),
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
    model = get_model()
    results = model(img_array, conf=CONFIDENCE_THRESHOLD, verbose=False)

    detections = []
    detections_detailed = []

    for result in results:
        boxes = result.boxes
        for i in range(len(boxes)):
            cls_id = int(boxes.cls[i].item())
            conf = float(boxes.conf[i].item())
            xyxy = boxes.xyxy[i].cpu().numpy()
            x1, y1, x2, y2 = xyxy
            class_name = get_class_name(model, cls_id)
            sev = severity_from_confidence(conf)

            det = {
                "class": class_name,
                "confidence": conf,
                "bbox": {
                    "x": float(x1),
                    "y": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1),
                },
            }
            detections.append(det)
            eng = build_engineering_analysis(det, w, h, pixel_scale_mm, environment)
            detections_detailed.append({**det, "severity": sev, "engineering": eng["engineering"]})

    annotated = draw_annotations(img_array, detections)
    annotated_pil = Image.fromarray(annotated)
    ann_buf = io.BytesIO()
    annotated_pil.save(ann_buf, format="JPEG", quality=90)
    annotated_b64 = base64.b64encode(ann_buf.getvalue()).decode("utf-8")

    orig_b64 = base64.b64encode(contents).decode("utf-8")
    processing_time = time.time() - start_time

    try:
        from report_generator import generate_pdf_report
        pdf_bytes = generate_pdf_report(
            detections=detections_detailed,
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
