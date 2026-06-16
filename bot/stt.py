"""
Speech-to-Text: Together Whisper API.
Converts voice messages to text for the same text router.
Per ТЗ section 3.9: do NOT show raw transcript to user.
"""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path

import httpx

from bot.config import settings

logger = logging.getLogger(__name__)

_TOGETHER_STT_URL = "https://api.together.xyz/v1/audio/transcriptions"


async def transcribe_voice(audio_url: str) -> str | None:
    """
    Download audio from Telegram and transcribe via Together Whisper API.
    Returns transcribed text or None on failure.
    """
    if not settings.together_api_key:
        logger.warning("Together API key not set — cannot transcribe voice")
        return None

    try:
        # Download audio file from Telegram
        async with httpx.AsyncClient(timeout=30) as client:
            audio_resp = await client.get(audio_url)
            if audio_resp.status_code != 200:
                logger.error("Failed to download audio: %s", audio_resp.status_code)
                return None
            audio_bytes = audio_resp.content

        # Save to temp file (Together API needs a file upload)
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = Path(tmp.name)

        try:
            # Send to Together Whisper API
            async with httpx.AsyncClient(timeout=60) as client:
                with open(tmp_path, "rb") as f:
                    resp = await client.post(
                        _TOGETHER_STT_URL,
                        headers={
                            "Authorization": f"Bearer {settings.together_api_key}",
                        },
                        files={"file": ("voice.ogg", f, "audio/ogg")},
                        data={
                            "model": "whisper-large-v3",
                            "language": "ru",
                        },
                    )

                if resp.status_code != 200:
                    logger.error("Together STT error: %s %s", resp.status_code, resp.text)
                    return None

                data = resp.json()
                text = data.get("text", "").strip()
                logger.info("STT result: '%s'", text[:100])
                return text if text else None

        finally:
            # Clean up temp file
            tmp_path.unlink(missing_ok=True)

    except Exception as e:
        logger.error("STT exception: %s", e, exc_info=True)
        return None
