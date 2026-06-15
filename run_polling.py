"""
Local development: run bot via long-polling (no webhook/tunnel needed).
Usage: python run_polling.py
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add app dir to path so `bot.*` imports work
sys.path.insert(0, str(Path(__file__).resolve().parent))

from bot.config import settings
from bot.handlers import handle_message, handle_start
from bot.telegram_client import send_chat_action, send_message

import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

BASE_URL = f"https://api.telegram.org/bot{settings.telegram_bot_token}"


async def delete_webhook():
    """Remove webhook so polling works."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/deleteWebhook")
        logger.info("deleteWebhook: %s", resp.json())


async def get_updates(offset: int = 0, timeout: int = 30) -> list:
    """Long-poll for updates."""
    async with httpx.AsyncClient(timeout=timeout + 5) as client:
        resp = await client.get(
            f"{BASE_URL}/getUpdates",
            params={"offset": offset, "timeout": timeout, "allowed_updates": ["message"]},
        )
        data = resp.json()
        if data.get("ok"):
            return data.get("result", [])
        logger.error("getUpdates error: %s", data)
        return []


async def process_update(update: dict):
    """Process a single update."""
    message = update.get("message")
    if not message:
        return

    chat_id = message["chat"]["id"]
    text = message.get("text", "")
    voice = message.get("voice")

    if text == "/start":
        await handle_start(chat_id)
        return

    if voice:
        await send_chat_action(chat_id, "typing")
        from bot.sessions import get_session
        from bot.models import Lang
        session = get_session(chat_id)
        lang = session.lang or Lang.RU
        if lang == Lang.RU:
            await send_message(chat_id, "Я получил голосовое сообщение. Распознавание голоса скоро будет подключено.")
        else:
            await send_message(chat_id, "Мен дауыстық хабарлама алдым. Дауысты тану жақында қосылады.")
        return

    if text:
        await send_chat_action(chat_id, "typing")
        await handle_message(chat_id, text)


async def main():
    """Main polling loop."""
    logger.info("Starting bot in polling mode...")
    logger.info("Bot token: %s...%s", settings.telegram_bot_token[:10], settings.telegram_bot_token[-5:])

    await delete_webhook()

    offset = 0
    logger.info("Polling started. Send /start to the bot in Telegram.")

    while True:
        try:
            updates = await get_updates(offset=offset)
            for update in updates:
                offset = update["update_id"] + 1
                await process_update(update)
        except httpx.ReadTimeout:
            continue
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            break
        except Exception as e:
            logger.error("Error in polling loop: %s", e, exc_info=True)
            await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())
