"""
Typed application settings.
All secrets loaded from environment variables only — never hardcoded.
"""

from pathlib import Path

from pydantic_settings import BaseSettings
from pydantic import Field

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Application configuration. Values come from .env or system env vars."""

    # --- Telegram ---
    telegram_bot_token: str = Field(..., description="Telegram Bot API token")
    telegram_webhook_secret: str = Field("", description="Secret for webhook verification")
    webhook_base_url: str = Field("http://localhost:8000", description="Public URL for webhooks")

    # --- AI / LLM ---
    ai_provider: str = Field("groq", description="LLM provider: groq | together")
    groq_api_key: str = Field("", description="Groq API key")
    together_api_key: str = Field("", description="Together API key")

    # --- STT ---
    voice_stt_provider: str = Field("ensemble", description="STT provider: ensemble | groq | together")
    stt_llm_refine: bool = Field(False, description="Post-fix STT via LLM")

    # --- Database ---
    supabase_url: str = Field("", description="Supabase project URL")
    supabase_service_role_key: str = Field("", description="Supabase service role key")

    # --- CRM ---
    bitrix24_webhook_url: str = Field("", description="Bitrix24 webhook URL for creating leads")

    # --- Google Sheets ---
    google_sheets_id: str = Field("", description="Google Sheets document ID for stock data")
    google_service_account_json: str = Field("", description="Service account JSON (base64 or path)")

    # --- PDF Presentations (file_id for webhook / local path fallback) ---
    pdf_greenlam_file_id: str = Field("", description="Telegram file_id for Greenlam PDF")
    pdf_kmew_file_id: str = Field("", description="Telegram file_id for KMEW PDF")
    pdf_3mm_file_id: str = Field("", description="Telegram file_id for 3MM PDF")

    # --- Ops ---
    ops_alert_chat_id: str = Field("", description="Telegram chat ID for manager alerts")
    voice_debug_enabled: bool = Field(False)
    voice_debug_chat_id: str = Field("")

    # --- Feature flags ---
    hybrid_ai: bool = Field(True, description="Enable LLM in general flow")
    fast_faq: bool = Field(True, description="FAQ rules before LLM")
    faq_guide_llm: bool = Field(False, description="LLM-based clarifying questions")

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
