"""
Session model and enums.
Universal session structure per BOT_OPERATIONS_GUIDEBOOK.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class BotState(str, Enum):
    """Possible bot conversation states."""
    SELECTING_LANG = "selecting_lang"
    SELECTING_CITY = "selecting_city"
    IDLE = "idle"
    IN_MENU = "in_menu"
    IN_FLOW = "in_flow"
    HANDOFF = "handoff"


class Lang(str, Enum):
    """Supported languages."""
    RU = "ru"
    KK = "kk"


class City(str, Enum):
    """Available offices/cities."""
    ALMATY = "almaty"
    ASTANA = "astana"


CITY_DISPLAY = {
    Lang.RU: {City.ALMATY: "Алматы", City.ASTANA: "Астана"},
    Lang.KK: {City.ALMATY: "Алматы", City.ASTANA: "Астана"},
}


class Session(BaseModel):
    """User session — stored per chat_id."""
    state: BotState = BotState.SELECTING_LANG
    lang: Lang | None = None
    lang_locked: bool = False
    city: City | None = None
    city_confirmed: bool = False
    product: str | None = None
    flow_step: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)
    handoff_until: float = 0
    conversation_history: list[dict[str, str]] = Field(default_factory=list)
    platform: str = "telegram"
    from_voice: bool = False
    last_voice_raw: str = ""
