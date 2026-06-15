"""
Session store: in-memory dict with interface ready for Supabase swap.
"""

from __future__ import annotations

from app.bot.models import Session

# In-memory session storage (will be replaced with Supabase in production)
_sessions: dict[int, Session] = {}


def get_session(chat_id: int) -> Session:
    """Get or create session for a chat_id."""
    if chat_id not in _sessions:
        _sessions[chat_id] = Session()
    return _sessions[chat_id]


def save_session(chat_id: int, session: Session) -> None:
    """Persist session (in-memory for now)."""
    _sessions[chat_id] = session


def reset_session(chat_id: int) -> Session:
    """Reset session to initial state."""
    _sessions[chat_id] = Session()
    return _sessions[chat_id]
