"""
FastAPI application — Telegram webhook entry point.
Endpoints: /webhook/telegram, /health, /setup
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import JSONResponse

from app.bot.config import settings
from app.bot.handlers import handle_message, handle_start
from app.bot.telegram_client import register_webhook, send_chat_action

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
    # Verify webhook secret
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

    # Handle /start
    if text == "/start":
        await handle_start(chat_id)
        return JSONResponse({"ok": True})

    # Handle voice messages (STT placeholder)
    if voice:
        await send_chat_action(chat_id, "typing")
        # TODO: Download audio → STT ensemble → route as text
        # For now, send a placeholder response
        from app.bot.sessions import get_session
        from app.bot.models import Lang
        session = get_session(chat_id)
        lang = session.lang or Lang.RU
        if lang == Lang.RU:
            from app.bot.telegram_client import send_message as sm
            await sm(chat_id, "Я получил голосовое сообщение. Распознавание голоса скоро будет подключено.")
        else:
            from app.bot.telegram_client import send_message as sm
            await sm(chat_id, "Мен дауыстық хабарлама алдым. Дауысты тану жақында қосылады.")
        return JSONResponse({"ok": True})

    # Handle text messages
    if text:
        await send_chat_action(chat_id, "typing")
        await handle_message(chat_id, text)

    return JSONResponse({"ok": True})


# =============================================================================
# MANGUM ADAPTER (for Vercel serverless)
# =============================================================================

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = None
