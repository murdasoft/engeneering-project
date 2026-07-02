"""
FastAPI application — Telegram webhook entry point.
Endpoints: /webhook/telegram, /health, /setup
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import JSONResponse

from bot.config import settings
from bot.handlers import handle_message, handle_start
from bot.telegram_client import register_webhook, send_chat_action, send_message

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Agregator Bot",
    description="AI chatbot for TOO Agregator — facade materials",
    version="0.1.0",
)


# =============================================================================
# HEALTH CHECK
# =============================================================================


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "bot": "agregator"}


# =============================================================================
# WEBHOOK SETUP
# =============================================================================


@app.get("/setup")
async def setup():
    """Register Telegram webhook."""
    result = await register_webhook()
    return {"webhook_registered": result.get("ok", False), "details": result}


# =============================================================================
# TELEGRAM WEBHOOK
# =============================================================================


@app.post("/webhook/telegram")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(None),
):
    """
    Process incoming Telegram updates.
    Validates secret token for security.
    """
    # Verify webhook secret (skip if secret not configured or not sent)
    if settings.telegram_webhook_secret and x_telegram_bot_api_secret_token:
        if x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
            raise HTTPException(status_code=403, detail="Invalid secret token")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Extract message
    message = body.get("message")
    if not message:
        # Could be callback_query or other update — handle later
        return JSONResponse({"ok": True})

    chat_id = message["chat"]["id"]
    text = message.get("text", "")
    voice = message.get("voice")
    photo = message.get("photo")

    # Handle photo → InspectAI analysis
    if photo:
        await send_chat_action(chat_id, "typing")
        await handle_photo(chat_id, photo, message.get("caption", ""))
        return JSONResponse({"ok": True})

    # Handle /start
    if text == "/start":
        await handle_start(chat_id)
        return JSONResponse({"ok": True})

    # Handle voice messages → STT → same text router (ТЗ 3.9)
    if voice:
        await send_chat_action(chat_id, "typing")
        from bot.telegram_client import get_file_url
        from bot.stt import transcribe_voice

        file_id = voice.get("file_id")
        if file_id:
            audio_url = await get_file_url(file_id)
            if audio_url:
                transcribed = await transcribe_voice(audio_url)
                if transcribed:
                    # Route transcribed text through normal handler (don't show raw transcript)
                    await handle_message(chat_id, transcribed)
                    return JSONResponse({"ok": True})

        # Fallback if STT failed
        from bot.sessions import get_session
        from bot.models import Lang
        session = get_session(chat_id)
        lang = session.lang or Lang.RU
        if lang == Lang.RU:
            await send_message(chat_id, "Не удалось распознать голосовое сообщение. Попробуйте написать текстом.")
        else:
            await send_message(chat_id, "Дауыстық хабарламаны тану мүмкін болмады. Мәтін жазып көріңіз.")
        return JSONResponse({"ok": True})

    # Handle text messages
    if text:
        await send_chat_action(chat_id, "typing")
        await handle_message(chat_id, text)

    return JSONResponse({"ok": True})


# =============================================================================
# PHOTO → InspectAI ML Analysis
# =============================================================================

import httpx
import io

ML_API_URL = os.getenv("ML_API_URL", "https://alllxndr-inspectai-ml.hf.space")
ML_API_KEY = os.getenv("ML_API_KEY", "")


async def handle_photo(chat_id: int, photo_sizes: list, caption: str):
    """Download photo from Telegram, send to ML service, return engineering analysis."""
    # Get the largest photo
    largest = max(photo_sizes, key=lambda p: p.get("width", 0))
    file_id = largest["file_id"]

    await send_message(chat_id, "🔍 Анализирую изображение...")

    # Download file from Telegram
    from bot.telegram_client import get_file_url
    file_url = await get_file_url(file_id)
    if not file_url:
        await send_message(chat_id, "❌ Не удалось загрузить фото. Попробуйте ещё раз.")
        return

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            # Download image
            img_resp = await client.get(file_url)
            img_resp.raise_for_status()
            img_bytes = img_resp.content

            # Send to ML service for detailed analysis
            files = {"file": ("photo.jpg", img_bytes, "image/jpeg")}
            headers = {}
            if ML_API_KEY:
                headers["X-API-Key"] = ML_API_KEY

            ml_resp = await client.post(
                f"{ML_API_URL}/predict/detailed",
                files=files,
                headers=headers,
                timeout=60,
            )
            ml_resp.raise_for_status()
            result = ml_resp.json()

            # Format engineering report for Telegram
            detections = result.get("detections_detailed", [])
            summary = result.get("summary", {})

            if not detections:
                await send_message(chat_id,
                    "✅ Дефекты не обнаружены.\n\n"
                    "Конструкция в нормальном состоянии по визуальным признакам.\n"
                    "Метод: YOLOv8 | ГОСТ 31937-2011"
                )
                return

            # Build detailed message
            condition = summary.get("overall_condition", "NORMAL")
            cond_text = {
                "INADMISSIBLE": "🔴 НЕДОПУСТИМОЕ",
                "LIMITED": "🟡 ОГРАНИЧЕННО ПРИГОДНОЕ",
                "SERVICEABLE": "🟢 ПРИГОДНОЕ",
                "NORMAL": "🟢 НОРМАЛЬНОЕ",
            }.get(condition, condition)

            msg = f"📋 *Инженерный анализ*\n\n"
            msg += f"Общее состояние: *{cond_text}*\n"
            msg += f"Всего дефектов: {summary.get('total', 0)}\n"
            msg += f"🔴 Критических: {summary.get('high', 0)}\n"
            msg += f"🟡 Значительных: {summary.get('medium', 0)}\n"
            msg += f"🟢 Незначительных: {summary.get('low', 0)}\n\n"

            for i, det in enumerate(detections):
                eng = det.get("engineering", {})
                sev = det.get("severity", "low")
                sev_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(sev, "⚪")
                sev_label = {"high": "КРИТИЧЕСКИЙ", "medium": "ЗНАЧИТЕЛЬНЫЙ", "low": "НЕЗНАЧИТЕЛЬНЫЙ"}.get(sev, sev)

                msg += f"{sev_emoji} *Дефект #{i+1} — {eng.get('ru_name', det.get('class', '?'))}*\n"
                msg += f"Уверенность: {det.get('confidence', 0)*100:.0f}%\n"
                msg += f"Уровень: {sev_label}\n"
                msg += f"Ширина: {eng.get('estimated_width_mm', 0):.2f} мм ({eng.get('width_cm', 0):.2f} см)\n"
                msg += f"Длина: {eng.get('estimated_length_mm', 0):.2f} мм ({eng.get('length_cm', 0):.2f} см)\n"
                msg += f"Площадь: {eng.get('estimated_area_cm2', 0):.2f} см²\n"
                msg += f"Норматив: {eng.get('normative_limit', '—')}\n"
                msg += f"Критично: {'⚠️ ДА' if eng.get('is_critical') else '✅ НЕТ'}\n\n"

                msg += f"_{eng.get('category', '')}_\n\n"

                causes = eng.get("causes", [])
                if causes:
                    msg += "Причины:\n"
                    for c in causes[:3]:
                        msg += f"• {c}\n"
                    msg += "\n"

                msg += f"Опасность: {eng.get('danger_level', '—')}\n\n"

                actions = eng.get("recommended_actions", [])
                if actions:
                    msg += "Рекомендации:\n"
                    for a in actions[:4]:
                        msg += f"  {a}\n"
                    msg += "\n"

                norms = eng.get("norms", [])
                if norms:
                    msg += "Нормативы: " + ", ".join(norms[:3]) + "\n"

                msg += f"Арматура: {eng.get('rebar_impact', '—')[:100]}\n\n"
                msg += "─────────────────────\n\n"

            msg += "📄 Для полного PDF отчёта используйте веб-версию.\n"
            msg += "_Предварительная оценка ИИ (YOLOv8). Не заменяет инструментального обследования по ГОСТ 31937-2011._"

            # Send text (split if too long)
            if len(msg) > 4096:
                parts = [msg[i:i+4096] for i in range(0, len(msg), 4096)]
                for part in parts:
                    await send_message(chat_id, part, parse_mode="Markdown")
            else:
                await send_message(chat_id, msg, parse_mode="Markdown")

            # Now generate and send PDF report
            await send_chat_action(chat_id, "upload_document")
            await send_message(chat_id, "📄 Генерирую PDF отчёт...")

            pdf_resp = await client.post(
                f"{ML_API_URL}/report",
                files={"file": ("photo.jpg", img_bytes, "image/jpeg")},
                headers=headers,
                timeout=120,
            )
            if pdf_resp.status_code == 200:
                from bot.telegram_client import send_document
                await send_document(chat_id, pdf_resp.content, "InspectAI_Engineering_Report.pdf", "application/pdf", "Инженерный отчёт InspectAI")
            else:
                await send_message(chat_id, "⚠️ PDF отчёт временно недоступен. Используйте веб-версию.")

    except httpx.TimeoutException:
        await send_message(chat_id, "❌ Превышено время ожидания ML сервиса. Попробуйте позже.")
    except Exception as e:
        logger.error(f"Photo analysis error: {e}")
        await send_message(chat_id, f"❌ Ошибка анализа: {str(e)[:200]}")


# =============================================================================
# MANGUM ADAPTER (for Vercel serverless)
# =============================================================================

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = None
