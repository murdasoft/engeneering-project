---
title: InspectAI ML
emoji: 🔍
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# InspectAI ML Service

YOLOv8 ensemble-based crack and defect detection API for concrete, infrastructure, and road surfaces.

## Models

1. **keremberke/yolov8s-surface-crack-detection** — concrete surface cracks
2. **keremberke/yolov8n-surface-crack-detection** — lightweight concrete cracks
3. **cazzz307/yolov8-crack-detection** — infrastructure (walls, roads, bridges)

## Endpoints

- `GET /health` — service health check
- `POST /predict` — basic prediction
- `POST /predict/detailed` — detailed prediction with engineering analysis
- `POST /report` — PDF report generation
