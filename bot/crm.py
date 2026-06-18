"""
Bitrix24 CRM integration — create leads via inbound webhook.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from bot.config import settings

logger = logging.getLogger(__name__)

# Strip trailing slash and append method path
_BASE = settings.bitrix24_webhook_url.rstrip("/")
_LEAD_ADD_URL = f"{_BASE}/crm.lead.add.json"


def _build_title(source: str, product: str | None = None) -> str:
    title = f"Заявка из {source}"
    if product:
        title += f" — {product}"
    return title


def _build_comment(
    city: str | None = None,
    object_type: str | None = None,
    material_purpose: str | None = None,
    visit_type: str | None = None,
    comment: str | None = None,
) -> str:
    parts = []
    if city:
        parts.append(f"Город: {city}")
    if object_type:
        parts.append(f"Тип объекта: {object_type}")
    if material_purpose:
        parts.append(f"Назначение: {material_purpose}")
    if visit_type:
        parts.append(f"Формат встречи: {visit_type}")
    if comment:
        parts.append(f"Комментарий: {comment}")
    return "\n".join(parts) if parts else ""


async def create_lead(
    name: str,
    phone: str,
    city: str | None = None,
    object_type: str | None = None,
    material_purpose: str | None = None,
    visit_type: str | None = None,
    comment: str | None = None,
    source: str = "Telegram Bot",
    product: str | None = None,
) -> dict[str, Any] | None:
    """
    Create a lead in Bitrix24 via REST webhook.
    Returns the API response or None on failure.
    """
    if not settings.bitrix24_webhook_url:
        logger.warning("Bitrix24 webhook URL is not configured, skipping lead creation")
        return None

    title = _build_title(source, product)
    full_comment = _build_comment(city, object_type, material_purpose, visit_type, comment)

    # Prepare payload
    fields: dict[str, Any] = {
        "TITLE": title,
        "NAME": name,
        "PHONE": [{"VALUE": phone, "VALUE_TYPE": "WORK"}],
        "SOURCE_ID": "SELF",
        "SOURCE_DESCRIPTION": source,
    }

    if city:
        fields["COMPANY_TITLE"] = city
    if full_comment:
        fields["COMMENTS"] = full_comment

    payload = {"fields": fields, "params": {"REGISTER_SONET_EVENT": "Y"}}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(_LEAD_ADD_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("error"):
                logger.error("Bitrix24 lead creation error: %s", data)
                return data
            lead_id = data.get("result", "?")
            logger.info("Bitrix24 lead created: id=%s name=%s", lead_id, name)
            return data
    except Exception as exc:
        logger.exception("Bitrix24 lead creation failed: %s", exc)
        return None
