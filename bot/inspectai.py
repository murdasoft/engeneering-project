"""
InspectAI integration for Telegram Bot.
Handles photo analysis and PDF report generation.
"""

from __future__ import annotations

import io
import logging
from datetime import datetime

import httpx

from bot.telegram_client import send_message, send_document, send_chat_action
from bot.config import settings

logger = logging.getLogger(__name__)

_ML_API_URL = settings.ml_api_url.rstrip("/")
_ML_API_KEY = settings.ml_api_key


async def analyze_photo(chat_id: int, photo_url: str) -> None:
    """Download photo, send to ML service, return results + PDF."""
    await send_chat_action(chat_id, "typing")

    try:
        # Download photo
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(photo_url)
            if resp.status_code != 200:
                await send_message(chat_id, "Не удалось загрузить фотографию.")
                return
            photo_bytes = resp.content
    except Exception as e:
        logger.error("Error downloading photo: %s", e)
        await send_message(chat_id, "Ошибка загрузки фотографии.")
        return

    # Send to ML service for detailed analysis
    try:
        await send_chat_action(chat_id, "typing")
        async with httpx.AsyncClient(timeout=120) as client:
            files = {"file": ("photo.jpg", io.BytesIO(photo_bytes), "image/jpeg")}
            params = {"environment": "atmospheric", "aggression": "normal"}
            headers = {}
            if _ML_API_KEY:
                headers["X-API-Key"] = _ML_API_KEY

            det_resp = await client.post(
                f"{_ML_API_URL}/predict/detailed",
                files=files,
                params=params,
                headers=headers,
            )

            if det_resp.status_code != 200:
                await send_message(
                    chat_id,
                    f"Ошибка анализа: {det_resp.status_code}\n{det_resp.text[:200]}",
                )
                return

            result = det_resp.json()

        # Build summary message
        summary = result.get("summary", {})
        all_detections = result.get("detections_detailed", [])

        # Filter out background / wall / concrete classes client-side as extra guard
        _rejected = {"background", "wall", "concrete", "surface", "normal", "good"}
        detections = [
            d for d in all_detections
            if not any(r in d.get("class", "").lower() for r in _rejected)
        ]

        msg_parts = ["📋 <b>Результат анализа InspectAI</b>"]
        msg_parts.append(f"Всего дефектов: {len(detections)}")
        msg_parts.append(f"🔴 Критических: {summary.get('high', 0)}")
        msg_parts.append(f"🟡 Значительных: {summary.get('medium', 0)}")
        msg_parts.append(f"🟢 Незначительных: {summary.get('low', 0)}")

        if detections:
            msg_parts.append("\n<b>Обнаруженные дефекты:</b>")
            for idx, det in enumerate(detections[:5], 1):
                eng = det.get("engineering", {})
                sev = det.get("severity", "low")
                sev_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(sev, "⚪")
                name = eng.get("ru_name", det.get("class", "Unknown"))
                conf = det.get("confidence", 0)
                width_mm = eng.get("estimated_width_mm", 0)
                msg_parts.append(
                    f"{idx}. {sev_emoji} {name} — {conf:.0%}"
                    f"{' | ширина: ' + f'{width_mm:.2f} мм' if width_mm else ''}"
                )
            if len(detections) > 5:
                msg_parts.append(f"\n<i>...и ещё {len(detections) - 5} дефект(ов)</i>")

        overall = summary.get("overall_condition", "NORMAL")
        condition_map = {
            "INADMISSIBLE": "❌ НЕДОПУСТИМОЕ — требуется немедленное вмешательство",
            "LIMITED": "⚠️ ОГРАНИЧЕННО ПРИГОДНОЕ — требуется ремонт",
            "SERVICEABLE": "✅ ПРИГОДНОЕ — мониторинг",
            "NORMAL": "✅ НОРМАЛЬНОЕ",
        }
        msg_parts.append(f"\n<b>Состояние:</b> {condition_map.get(overall, overall)}")
        msg_parts.append(
            "\n⚠️ <i>Предварительная визуальная оценка. "
            "Не заменяет полное инструментальное обследование по ГОСТ 31937-2011.</i>"
        )

        await send_message(chat_id, "\n".join(msg_parts))

        # Generate and send PDF report
        await send_chat_action(chat_id, "upload_document")
        async with httpx.AsyncClient(timeout=120) as client:
            files = {"file": ("photo.jpg", io.BytesIO(photo_bytes), "image/jpeg")}
            params = {
                "project_name": f"Telegram_{chat_id}",
                "inspector": "InspectAI Telegram Bot",
                "location": "Telegram",
                "environment": "atmospheric",
                "aggression": "normal",
            }
            headers = {}
            if _ML_API_KEY:
                headers["X-API-Key"] = _ML_API_KEY

            pdf_resp = await client.post(
                f"{_ML_API_URL}/report",
                files=files,
                params=params,
                headers=headers,
            )

            if pdf_resp.status_code == 200:
                pdf_bytes = pdf_resp.content
                tmp_path = f"/tmp/inspectai_report_{chat_id}.pdf"
                with open(tmp_path, "wb") as f:
                    f.write(pdf_bytes)
                await send_document(
                    chat_id,
                    tmp_path,
                    caption="📄 Полный инженерный отчёт InspectAI",
                )
            else:
                await send_message(chat_id, "Не удалось сгенерировать PDF отчёт.")

    except Exception as e:
        logger.error("Error in analyze_photo: %s", e)
        await send_message(chat_id, f"Ошибка анализа: {str(e)[:200]}")
