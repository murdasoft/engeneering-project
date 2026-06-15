"""
Language detection from user text input.
Simple marker-based approach per BOT_OPERATIONS_GUIDEBOOK section 7.
"""

from app.bot.models import Lang

# Kazakh-specific characters (not present in Russian)
_KK_MARKERS = set("әіңғүұқөһ")  # unique Kazakh letters (lowercase)

# Ambiguous words that exist in both languages — do NOT use for detection
_AMBIGUOUS = {"кредит", "менеджер", "ипотека", "материал", "панель", "фасад", "монтаж", "офис"}


def detect_language(text: str, current_lang: Lang | None = None) -> Lang | None:
    """
    Detect language from text content.
    Returns Lang or None if ambiguous.
    Priority: explicit markers > current session lang > None.
    """
    lower = text.lower().strip()

    # Check for Kazakh-specific characters
    has_kk_markers = any(ch in _KK_MARKERS for ch in lower)

    if has_kk_markers:
        return Lang.KK

    # If text contains Cyrillic but no Kazakh markers → likely Russian
    has_cyrillic = any("\u0400" <= ch <= "\u04ff" for ch in lower)
    if has_cyrillic and not has_kk_markers:
        return Lang.RU

    # Latin text or numbers only — keep current language
    return current_lang
