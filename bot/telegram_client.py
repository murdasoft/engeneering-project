"""
Thin Telegram Bot API client via httpx.
Handles sending messages and registering webhooks.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.bot.config import settings

logger = logging.getLogger(__name__)

_BASE_URL = f"https://api.telegram.org/bot{settings.telegram_bot_token}"


async def _request(method: str, **kwargs: Any) -> dict:
    """Make a request to Telegram Bot API."""
    url = f"{_BASE_URL}/{method}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=kwargs)
        data = resp.json()
        if not data.get("ok"):
            logger.error("Telegram API error: %s %s", method, data)
        return data


async def send_message(
    chat_id: int,
    text: str,
    reply_markup: dict | None = None,
    parse_mode: str | None = None,
) -> dict:
    """Send a text message to a chat."""
    params: dict[str, Any] = {"chat_id": chat_id, "text": text}
    if reply_markup:
        params["reply_markup"] = reply_markup
    if parse_mode:
        params["parse_mode"] = parse_mode
    return await _request("sendMessage", **params)


async def send_chat_action(chat_id: int, action: str = "typing") -> dict:
    """Send chat action (typing indicator)."""
    return await _request("sendChatAction", chat_id=chat_id, action=action)


async def register_webhook() -> dict:
    """Register webhook with Telegram."""
    url = f"{settings.webhook_base_url}/webhook/telegram"
    return await _request(
        "setWebhook",
        url=url,
        secret_token=settings.telegram_webhook_secret,
        allowed_updates=["message", "callback_query"],
    )


async def get_file_url(file_id: str) -> str | None:
    """Get download URL for a file by file_id."""
    data = await _request("getFile", file_id=file_id)
    if data.get("ok"):
        file_path = data["result"]["file_path"]
        return f"https://api.telegram.org/file/bot{settings.telegram_bot_token}/{file_path}"
    return None
