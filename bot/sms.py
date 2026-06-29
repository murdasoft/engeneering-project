"""
SMS sending module via SMSC.kz (Kazakhstan) or Twilio (global fallback).

Usage:
    from bot.sms import send_sms
    await send_sms("+77011234567", "Заявка #123 создана")

Environment variables required:
    SMS_GATEWAY        -- "smsc" or "twilio" (default: smsc)
    SMSC_LOGIN         -- SMSC.kz account login
    SMSC_PASSWORD      -- SMSC.kz password or API key
    TWILIO_ACCOUNT_SID -- Twilio Account SID
    TWILIO_AUTH_TOKEN  -- Twilio Auth Token
    TWILIO_FROM_NUMBER -- Twilio sender phone number (e.g. +1234567890)
"""

from __future__ import annotations

import logging
import os
from urllib.parse import quote

import httpx

logger = logging.getLogger(__name__)

_GATEWAY = os.environ.get("SMS_GATEWAY", "smsc").lower().strip()

# SMSC.kz credentials
_SMSC_LOGIN = os.environ.get("SMSC_LOGIN", "")
_SMSC_PASSWORD = os.environ.get("SMSC_PASSWORD", "")

# Twilio credentials
_TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
_TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
_TWILIO_FROM = os.environ.get("TWILIO_FROM_NUMBER", "")


async def send_sms(phone: str, text: str) -> bool:
    """Send SMS. Returns True on success, False on failure."""
    if not phone or not text:
        logger.warning("send_sms called with empty phone or text")
        return False

    # normalize phone
    phone = phone.strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        phone = "+" + phone

    try:
        if _GATEWAY == "smsc":
            return await _send_smsc(phone, text)
        elif _GATEWAY == "twilio":
            return await _send_twilio(phone, text)
        else:
            logger.warning("Unknown SMS gateway: %s", _GATEWAY)
            return False
    except Exception as e:
        logger.error("SMS send error: %s", e)
        return False


async def _send_smsc(phone: str, text: str) -> bool:
    """Send via SMSC.kz HTTP API."""
    if not _SMSC_LOGIN or not _SMSC_PASSWORD:
        logger.warning("SMSC credentials not configured")
        return False

    url = (
        "https://smsc.kz/sys/send.php"
        f"?login={quote(_SMSC_LOGIN)}"
        f"&psw={quote(_SMSC_PASSWORD)}"
        f"&phones={quote(phone)}"
        f"&mes={quote(text)}"
        "&fmt=3"  # JSON response
        "&charset=utf-8"
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

        if "error" in data:
            logger.error("SMSC error: %s", data)
            return False

        logger.info("SMSC sent to %s, cnt=%s", phone, data.get("cnt", "?"))
        return True


async def _send_twilio(phone: str, text: str) -> bool:
    """Send via Twilio REST API."""
    if not _TWILIO_SID or not _TWILIO_TOKEN or not _TWILIO_FROM:
        logger.warning("Twilio credentials not configured")
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{_TWILIO_SID}/Messages.json"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            url,
            data={
                "From": _TWILIO_FROM,
                "To": phone,
                "Body": text,
            },
            auth=(_TWILIO_SID, _TWILIO_TOKEN),
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("error_code"):
            logger.error("Twilio error: %s", data)
            return False

        logger.info("Twilio sent to %s, sid=%s", phone, data.get("sid", "?"))
        return True


async def send_sms_bulk(phones: list[str], text: str) -> dict[str, bool]:
    """Send same text to multiple phones. Returns {phone: success}."""
    results: dict[str, bool] = {}
    for phone in phones:
        results[phone] = await send_sms(phone, text)
    return results
