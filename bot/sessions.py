"""
Session store: MongoDB-backed for Vercel serverless persistence.
Falls back to in-memory if MONGODB_URI is not set.
"""

from __future__ import annotations

import logging
import time

from bot.models import Session

logger = logging.getLogger(__name__)

# Fallback in-memory store (used if MongoDB is not configured)
_sessions: dict[int, Session] = {}

_mongo_client = None
_mongo_db = None
_collection = None


def _get_collection():
    """Lazily init MongoDB connection."""
    global _mongo_client, _mongo_db, _collection
    if _collection is not None:
        return _collection

    try:
        import os
        uri = os.environ.get("MONGODB_URI", "")
        if not uri:
            return None

        from motor.motor_asyncio import AsyncIOMotorClient
        _mongo_client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        _mongo_db = _mongo_client.get_default_database()
        _collection = _mongo_db["bot_sessions"]
        logger.info("MongoDB session store initialized")
        return _collection
    except Exception as e:
        logger.warning("MongoDB init failed, using in-memory: %s", e)
        return None


async def get_session(chat_id: int) -> Session:
    """Get or create session for a chat_id."""
    col = _get_collection()
    if col is not None:
        try:
            doc = await col.find_one({"_id": str(chat_id)})
            if doc:
                data = doc.get("data", {})
                return Session(**data)
        except Exception as e:
            logger.warning("MongoDB get_session failed: %s", e)

    # Fallback to in-memory
    if chat_id not in _sessions:
        _sessions[chat_id] = Session()
    return _sessions[chat_id]


async def save_session(chat_id: int, session: Session) -> None:
    """Persist session to MongoDB (or in-memory fallback)."""
    col = _get_collection()
    if col is not None:
        try:
            await col.update_one(
                {"_id": str(chat_id)},
                {"$set": {"data": session.model_dump(), "updated_at": time.time()}},
                upsert=True,
            )
            return
        except Exception as e:
            logger.warning("MongoDB save_session failed: %s", e)

    _sessions[chat_id] = session


async def reset_session(chat_id: int) -> Session:
    """Reset session to initial state."""
    col = _get_collection()
    if col is not None:
        try:
            await col.delete_one({"_id": str(chat_id)})
        except Exception as e:
            logger.warning("MongoDB reset_session failed: %s", e)

    _sessions[chat_id] = Session()
    return _sessions[chat_id]
