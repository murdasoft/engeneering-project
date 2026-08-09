# InspectAI — Документация для агента

> Полная техническая документация проекта InspectAI: ML-сервис обнаружения трещин, веб-приложение, обучение модели, деплой.

---

## 1. Обзор проекта

InspectAI — система автоматического обнаружения трещин и дефектов бетонных конструкций с помощью YOLOv8-seg. Проект состоит из двух частей:

- **ML Service** (`apps/ml-service/`) — FastAPI бэкенд с YOLOv8 ensemble, CV-валидацией, инженерным анализом и генерацией PDF-отчётов. Деплоится на HuggingFace Space.
- **Web App** (`apps/web/`) — Next.js 14 фронтенд с дашбордом, загрузкой фото, просмотром результатов и управлением проектами. Деплоится на Vercel.

---

## 2. Ключевые ссылки

| Ресурс | URL |
|---|---|
| **Web App (продакшн)** | https://inspectai-web-roan.vercel.app/ |
| **ML API (продакшн)** | https://alllxndr-inspectai-ml.hf.space |
| **GitHub репозиторий** | https://github.com/murdasoft/engeneering-project |
| **HF Model (обученная)** | https://huggingface.co/alllxndr/inspectai-crack-seg |
| **HF Space (ML)** | https://huggingface.co/spaces/alllxndr/inspectai-ml |
| **HF Fallback Model 1** | https://huggingface.co/wjdqlscho/Crack_YOLO_Segmentation_model |
| **HF Secondary Model 2** | https://huggingface.co/keremberke/yolov8s-surface-crack-detection |

---

## 3. Структура проекта

```
engeenering-ml-fasad/
├── apps/
│   ├── ml-service/              # ML бэкенд
│   │   ├── main.py              # FastAPI приложение (основной файл, ~1500 строк)
│   │   ├── report_generator.py  # Генерация PDF-отчётов (reportlab)
│   │   ├── requirements.txt     # Python зависимости
│   │   ├── Dockerfile           # Docker для HF Space
│   │   ├── best.pt              # Локальная копия обученной модели (23.8 MB)
│   │   ├── kaggle_train.py      # Скрипт обучения на Kaggle GPU
│   │   ├── train.py             # Локальный скрипт обучения
│   │   ├── test_model.py        # Скрипт тестирования модели
│   │   ├── hf_setup.py          # Скрипт настройки HF Space
│   │   ├── hf_space/            # Файлы для HF Space (Dockerfile, requirements, README)
│   │   └── datasets/            # Локальные датасеты (crack-seg)
│   └── web/                     # Next.js фронтенд
│       ├── app/                 # App Router структура
│       │   ├── page.tsx         # Лендинг
│       │   ├── dashboard/       # Дашборд (upload, projects, settings, analyses)
│       │   ├── api/             # API routes (ml/predict, ml/report, analyses/run)
│       │   └── components/      # React компоненты (ToolOverlay и др.)
│       ├── lib/                 # Утилиты (prisma, auth)
│       ├── prisma/              # Prisma schema и миграции
│       ├── package.json         # Node зависимости
│       ├── vercel.json          # Конфиг Vercel (ML_API_URL)
│       ├── tailwind.config.ts   # Tailwind конфиг
│       └── next.config.js       # Next.js конфиг
├── vercel.json                  # Корневой Vercel конфиг (редирект на API)
└── AGENT_DOCUMENTATION.md       # Этот файл
```

---

## 4. ML Service

### 4.1. Технологии

- **FastAPI** 0.111.0 — веб-фреймворк
- **Ultralytics YOLOv8** — модель сегментации
- **OpenCV** (`opencv-python-headless`) — CV-валидация
- **Pillow** — обработка изображений
- **ReportLab** — генерация PDF
- **HuggingFace Hub** — загрузка моделей
- **Python 3.10**
- **Docker** (на HF Space)

### 4.2. Модели (ensemble)

Приоритет загрузки моделей:

1. **Primary** — `alllxndr/inspectai-crack-seg` (`best.pt`) — наша обученная модель
   - Сначала ищется локальный файл `best.pt` или `models/best.pt`
   - Если нет — скачивается с HF Hub
   - Если и там нет — загружается `yolov8n.pt` (базовая)
2. **Secondary** — `keremberke/yolov8s-surface-crack-detection` — дополнительное покрытие
3. **Fallback** — `wjdqlscho/Crack_YOLO_Segmentation_model` — резервная модель

### 4.3. Конфигурация через переменные окружения

| Переменная | Значение по умолчанию | Описание |
|---|---|---|
| `HF_TOKEN` | `""` | HuggingFace токен (для скачивания моделей) |
| `HF_MODEL` | `alllxndr/inspectai-crack-seg` | Primary модель |
| `HF_MODEL_FILE` | `best.pt` | Файл primary модели |
| `HF_MODEL_FALLBACK` | `wjdqlscho/Crack_YOLO_Segmentation_model` | Fallback модель |
| `HF_MODEL_FALLBACK_FILE` | `best.pt` | Файл fallback модели |
| `HF_MODEL_SECONDARY` | `keremberke/yolov8s-surface-crack-detection` | Secondary модель |
| `HF_MODEL_SECONDARY_FILE` | `best.pt` | Файл secondary модели |
| `CONFIDENCE_THRESHOLD` | `0.15` | Порог уверенности |
| `ML_API_KEY` | `""` | API ключ. Если задан — требуется заголовок `X-API-Key`. Если пуст — открытый доступ |
| `ALLOWED_ORIGINS` | `*` | CORS origins |

### 4.4. API эндпоинты

#### `GET /health`
Проверка статуса сервиса.
```bash
curl https://alllxndr-inspectai-ml.hf.space/health
```
Ответ:
```json
{"status":"ok","version":"4.1.0","models":["alllxndr/inspectai-crack-seg","wjdqlscho/Crack_YOLO_Segmentation_model","keremberke/yolov8s-surface-crack-detection"]}
```

#### `POST /predict`
Базовое предсказание — bounding boxes + annotated image.

```bash
curl -X POST https://alllxndr-inspectai-ml.hf.space/predict \
  -F "file=@image.jpg" \
  -F "threshold=0.15"
```

Параметры:
- `file` (required) — изображение (JPG/PNG, до 10MB)
- `threshold` (optional, default=0.15) — порог уверенности (0.0–1.0)

Ответ (`PredictionResponse`):
```json
{
  "image_width": 416,
  "image_height": 416,
  "detections": [
    {
      "class": "crack",
      "confidence": 0.57,
      "bbox": {"x": 194, "y": 0, "width": 34, "height": 416, "polygon": [[...]]}
    }
  ],
  "annotated_image": "base64...",
  "processing_time": 1.23,
  "model_version": "ensemble-v4.1"
}
```

#### `POST /predict/detailed`
Предсказание с инженерным анализом и классификацией серьёзности.

```bash
curl -X POST https://alllxndr-inspectai-ml.hf.space/predict/detailed \
  -F "file=@image.jpg" \
  -F "threshold=0.15" \
  -F "pixel_scale_mm=0.5" \
  -F "environment=atmospheric" \
  -F "aggression=normal" \
  -F "structure_type=residential" \
  -F "concrete_grade=B25" \
  -F "rebar_class=A500" \
  -F "structure_age=10-20years" \
  -F "protective_layer_mm=30"
```

Дополнительные параметры:
- `pixel_scale_mm` — масштаб пикселя в мм
- `environment` — `atmospheric` | `aggressive` | `moderate`
- `aggression` — `normal` | `high` | `extreme`
- `structure_type` — тип сооружения
- `concrete_grade` — класс бетона
- `rebar_class` — класс арматуры
- `structure_age` — возраст сооружения
- `protective_layer_mm` — толщина защитного слоя

Ответ (`DetailedPredictionResponse`): включает `detections_detailed` с инженерным анализом (ширина/длина трещины в мм, категории опасности, рекомендации по ГОСТ/СНиП) и `summary` с общим состоянием.

#### `POST /report`
Генерация PDF инженерного отчёта.

```bash
curl -X POST https://alllxndr-inspectai-ml.hf.space/report \
  -F "file=@image.jpg" \
  -F "project_name=Жилой дом" \
  -F "inspector=Иван Иванов" \
  -F "location=Москва, ул. Ленина 1" \
  -F "pixel_scale_mm=0.5" \
  -o report.pdf
```

Возвращает PDF-файл (`application/pdf`).

### 4.5. Pipeline обнаружения (`run_ensemble`)

1. **Non-crack object detection** — YOLOv8n (general) находит трубы, двери, окна и т.д. для фильтрации ложных срабатываний
2. **Primary model** — multi-scale + TTA (Test Time Augmentation) + SAHI (Slicing Aided Hyper Inference) для тайлинга больших изображений
3. **Secondary model** — multi-scale + TTA для дополнительного покрытия
4. **Fallback model** — если primary нашла мало детекций
5. **CV dense crack candidates** — классический CV (black-hat morphological transform + connected components) для тонких трещин, которые YOLO может пропустить
6. **Фильтрация**:
   - `_is_crack_like()` — проверка имени класса
   - `_aspect_ratio_ok()` — удлинённость (min/max dim ratio <= 0.85, max dim >= 20)
   - `_min_crack_size_ok()` — минимальный размер (area >= 400 или area >= 120 и max_dim >= 30)
   - `_box_area_ratio()` — не больше 90% площади изображения
   - `_is_blob_fp()` — крупные «толстые» low-conf боксы (area > 8% image, aspect > 0.55, conf < 0.35)
   - Non-crack overlap — IoU > 0.3 с non-crack объектами → отброс
   - `_validate_crack_region()` — CV-валидация (edge density + directional contrast + local contrast)
   - Low-conf secondary/fallback — IoU ≥ 0.2 с primary **или** cv_score ≥ 0.35
7. **NMS** — greedy non-maximum suppression (IoU > 0.45 или containment > 0.80; center-distance < 30px для крупных)
8. **Confidence rescale** — `min(1.0, conf * (0.95 + cv_score * 0.25))` (может повышать score)

### 4.6. Ключевые функции в `main.py`

| Функция | Строка | Описание |
|---|---|---|
| `get_model()` | ~75 | Загрузка YOLO моделей (local → HF → fallback) |
| `_is_crack_like()` | ~112 | Проверка имени класса на принадлежность к трещинам |
| `_edge_density_check()` | ~133 | Canny edge density в регионе |
| `_directional_contrast_check()` | ~153 | Анизотропия градиента (Sobel) |
| `_local_contrast_check()` | ~193 | Бимодальное распределение яркости |
| `_validate_crack_region()` | ~214 | Комбинированная CV-валидация |
| `_detect_non_crack_objects()` | ~230 | YOLOv8n для фильтрации ложных срабатываний |
| `_aspect_ratio_ok()` | ~261 | Проверка удлинённости |
| `_extract_crack_polygon()` | ~302 | Извлечение полигона трещины (connected components + fitLine) |
| `_select_imgsz()` | ~383 | Адаптивный размер inference (до 1536) |
| `_run_multiscale()` | ~389 | Multi-scale + TTA inference |
| `_run_sahi()` | ~443 | SAHI tile slicing для больших изображений |
| `_nms_suppress()` | ~502 | NMS с preservation of small cracks |
| `_cv_dense_crack_candidates()` | ~799 | CV fallback для тонких трещин |
| `run_ensemble()` | ~856 | Главная функция оркестрации ensemble |
| `draw_annotations()` | ~1080 | Отрисовка bounding boxes и масок |
| `build_engineering_analysis()` | ~1100 | Инженерный анализ по ГОСТ/СНиП |

### 4.7. Текущая стабильная версия

**Версия: `ensemble-v4.1`**

Эта версия включает:
- Multi-scale inference (640 + 1280)
- TTA (Test Time Augmentation)
- SAHI tile slicing для изображений > 640px
- Relax filters (aspect ratio 0.85, area ratio 0.90)
- CV dense crack candidates fallback
- NMS с preservation of small cracks (IoU 0.45 / containment 0.80)
- Исправленный confidence rescale (может повышать score)
- Dual-agreement для low-conf secondary/fallback
- Blob FP filter для крупных low-conf детекций
- Primary: yolov8s-seg, 50 эпох на crack-seg

**Важно:** Эксперименты с merge crack segments (коммиты `82be5c4f`, `037ca296`, `559c5aa7`) были откачены — они ухудшали качество. Не возвращать merge-segments / «ensemble-v5».

---

## 5. Web Application

### 5.1. Технологии

- **Next.js** 14.2.3 (App Router)
- **React** 18.3.1
- **TypeScript** 5
- **Tailwind CSS** 3.4.17
- **Prisma** 5.22 + `@auth/prisma-adapter`
- **NextAuth** 4.24.7
- **Vercel Blob** для хранения файлов
- **Recharts** для графиков
- **Lucide React** для иконок

### 5.2. Переменные окружения

Файл `apps/web/.env` (gitignored):

```
ML_API_URL=https://alllxndr-inspectai-ml.hf.space
ML_API_KEY=
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://inspectai-web-roan.vercel.app
NEXT_PUBLIC_ML_API_URL=https://alllxndr-inspectai-ml.hf.space
# Prisma database URL
# Vercel Blob token
```

Также задано в `apps/web/vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "ML_API_URL": "https://alllxndr-inspectai-ml.hf.space"
  }
}
```

### 5.3. API Routes (Next.js)

| Route | Метод | Описание |
|---|---|---|
| `/api/ml/predict` | POST | Прокси к ML API `/predict/detailed` |
| `/api/ml/report` | POST | Прокси к ML API `/report` |
| `/api/analyses/run` | POST | Запуск анализа, сохранение в БД |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth аутентификация |

### 5.4. Страницы

| Путь | Описание |
|---|---|
| `/` | Лендинг |
| `/dashboard` | Главная дашборда |
| `/dashboard/upload` | Загрузка фото (drag&drop + Ctrl+V) |
| `/dashboard/projects` | Управление проектами |
| `/dashboard/analyses` | История анализов |
| `/dashboard/settings` | Настройки |

### 5.5. Загрузка фото (`/dashboard/upload`)

Поддерживает:
- Drag & Drop
- Click to browse
- **Ctrl+V** (вставка из буфера обмена)
- Выбор проекта
- Отображение результатов с bounding boxes
- ToolOverlay для рисования поверх результатов

---

## 6. Обучение модели

### 6.1. Kaggle (рекомендуется для GPU)

Файл: `apps/ml-service/kaggle_train.py`

Инструкция:
1. Создать Kaggle notebook
2. Включить Internet в настройках
3. Добавить Kaggle Secret `HF_TOKEN` с HuggingFace write-токеном
4. Скопировать содержимое `kaggle_train.py` в code cell
5. Запустить

Параметры обучения:
- Модель: `yolov8s-seg.pt`
- Epochs: 50
- Image size: 640
- Batch: 4
- Device: GPU (T4)
- Patience: 15

Датасеты:
- **crack-seg** (Roboflow, через Ultralytics) — основной
- **IBM CIF** (`ibm-research/cif-dataset`) — дополнительный, конвертация bbox → polygon

Результат: `best.pt` сохраняется в `/kaggle/working/best.pt` и пушится на HF Hub (`alllxndr/inspectai-crack-seg`).

### 6.2. Локальное обучение

Файл: `apps/ml-service/train.py`

```bash
cd apps/ml-service
python train.py
```

Параметры через переменные окружения:
- `EPOCHS` (default: 50)
- `MODEL_SIZE` (default: `s`)
- `HF_MODEL_REPO` (default: `alllxndr/inspectai-crack-seg`)
- `BATCH_SIZE` (default: 4)

### 6.3. Тестирование модели

Файл: `apps/ml-service/test_model.py`

```bash
cd apps/ml-service
python test_model.py
```

Тестирует модель на валидационных изображениях, сохраняет аннотированные результаты.

### 6.4. Acceptance eval (после Kaggle / деплоя)

Файл: `apps/ml-service/eval_ensemble.py`

```bash
cd apps/ml-service
# Live Space
python3 eval_ensemble.py --url https://alllxndr-inspectai-ml.hf.space --min-conf 0.55

# Local ensemble + best.pt
python3 eval_ensemble.py --local --min-conf 0.55
```

Критерий PASS: есть crack-детекции, max conf ≥ 0.55, нет крупных low-conf blob-FP.
Результат пишется в `eval_results.json`.

---

## 7. Деплой

### 7.1. ML Service → HuggingFace Space

**Space:** `alllxndr/inspectai-ml`
**URL:** https://huggingface.co/spaces/alllxndr/inspectai-ml
**Runtime:** Docker (Python 3.10 + PyTorch)
**Port:** 7860

Файлы на Space:
- `main.py` — основной код
- `report_generator.py` — генерация PDF
- `requirements.txt` — зависимости
- `Dockerfile` — Docker конфиг
- `README.md` — метаданные Space

Команда деплоя:
```bash
HF_TOKEN=<your_token> python3 -c "
from huggingface_hub import HfApi
api = HfApi(token='<your_token>')
api.upload_file(
    path_or_fileobj='apps/ml-service/main.py',
    path_in_repo='main.py',
    repo_id='alllxndr/inspectai-ml',
    repo_type='space'
)
api.restart_space(repo_id='alllxndr/inspectai-ml', factory_reboot=True)
"
```

**Важно:** `factory_reboot=True` полностью пересобирает Docker image. Без этого может кэшироваться старая версия.

Время пересборки: ~3-5 минут.

### 7.2. Web App → Vercel

**URL:** https://inspectai-web-roan.vercel.app/

Деплой через GitHub integration (push в `main` → auto-deploy) или:
```bash
cd apps/web
npx vercel --prod
```

Переменные окружения на Vercel:
- `ML_API_URL` = `https://alllxndr-inspectai-ml.hf.space`
- `ML_API_KEY` = (пусто)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` = `https://inspectai-web-roan.vercel.app`
- `DATABASE_URL` (Prisma)
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob)

### 7.3. Модель → HuggingFace Hub

**Repo:** `alllxndr/inspectai-crack-seg`
**URL:** https://huggingface.co/alllxndr/inspectai-crack-seg
**Файл:** `best.pt` (23.8 MB)

```bash
HF_TOKEN=<your_token> python3 -c "
from huggingface_hub import HfApi
api = HfApi(token='<your_token>')
api.upload_file(
    path_or_fileobj='apps/ml-service/best.pt',
    path_in_repo='best.pt',
    repo_id='alllxndr/inspectai-crack-seg',
    repo_type='model'
)
"
```

---

## 8. HuggingFace конфигурация

### 8.1. HF Space Settings

- **SDK:** Docker
- **App port:** 7860
- **Hardware:** CPU (free tier) или GPU
- **Secrets:**
  - `HF_TOKEN` — HuggingFace write token (для скачивания моделей)

### 8.2. HF Space Dockerfile

```dockerfile
FROM python:3.10
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 git ffmpeg && \
    rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision && \
    pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### 8.3. HF Space Requirements

```
fastapi==0.111.0
uvicorn[standard]==0.30.1
pillow==10.3.0
python-multipart==0.0.9
numpy==1.26.4
reportlab==4.2.2
ultralytics>=8.3.0
huggingface_hub
opencv-python-headless>=4.8.0
```

---

## 9. Известные проблемы и ограничения

1. **Неполное обнаружение трещин** — модель иногда находит только часть трещины. Эксперименты с merge segments (v5.0) ухудшили качество — откатились к v4.0. Решение: дообучение на большем датасете с полными аннотациями трещин.

2. **HF Space cold start** — после `factory_reboot` требуется 3-5 минут для пересборки. Health check: `curl https://alllxndr-inspectai-ml.hf.space/health`

3. **API key** — если `ML_API_KEY` задан на Space, запросы без `X-API-Key` получают 401. Web/Bot уже прокидывают ключ из env. Для продакшн задать один и тот же ключ в HF Space Secrets и Vercel `ML_API_KEY`.

4. **CORS** — `ALLOWED_ORIGINS=*` (открытый). Для продакшн ограничить.

5. **Модель хранится локально и на HF** — `best.pt` в `apps/ml-service/` и на `alllxndr/inspectai-crack-seg`. При обновлении модели нужно обновить оба места.

---

## 10. Команды для разработки

### Локальный запуск ML сервиса
```bash
cd apps/ml-service
pip install -r requirements.txt
python main.py
# Сервис доступен на http://localhost:8000
```

### Локальный запуск веб-приложения
```bash
cd apps/web
npm install
npm run dev
# Приложение на http://localhost:3000
```

### Тестирование API
```bash
# Health check
curl https://alllxndr-inspectai-ml.hf.space/health

# Predict
curl -X POST https://alllxndr-inspectai-ml.hf.space/predict \
  -F "file=@test.jpg" | python3 -m json.tool

# Detailed predict
curl -X POST https://alllxndr-inspectai-ml.hf.space/predict/detailed \
  -F "file=@test.jpg" | python3 -m json.tool

# PDF report
curl -X POST https://alllxndr-inspectai-ml.hf.space/report \
  -F "file=@test.jpg" \
  -F "project_name=Test" \
  -o report.pdf
```

### Git
```bash
# Текущая стабильная версия
git log --oneline -5

# Откат к стабильной версии
git checkout 89dc09bc -- apps/ml-service/main.py
```

---

## 11. Чеклист для агента

При работе с проектом:

1. **Не коммить HF токены** в Git — GitHub push protection заблокирует
2. **Использовать `factory_reboot=True`** при перезапуске HF Space
3. **Проверять health** после деплоя: `curl https://alllxndr-inspectai-ml.hf.space/health`
4. **Тестировать на реальных изображениях** после изменений в `main.py`
5. **Стабильная версия ML:** `ensemble-v4.1` (service `4.1.0`)
6. **Не включать merge crack segments** — эксперименты показали ухудшение качества
7. **Для улучшения обнаружения** — дообучать модель на новых данных, а не пост-процессингом
8. **Dockerfile на HF Space** использует Python 3.10 + PyTorch (не CUDA, CPU inference)
9. **Порт HF Space:** 7860
10. **Размер изображения:** до 10MB, inference до 1536px
11. **Не коммитить HF/Vercel токены** — после утечки в чат/логи ротировать
