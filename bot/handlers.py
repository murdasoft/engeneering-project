"""
Main message handler — orchestrates the conversation flow.
Wizard → Menu → FAQ/AI → Handoff.
"""

from __future__ import annotations

import logging
import time

from bot.models import BotState, City, Lang, Session
from bot.sessions import get_session, save_session, reset_session
from bot.content import (
    GREETING,
    CITY_SELECT,
    MAIN_MENU,
    OFFICE_INFO,
    HANDOFF_MSG,
    HANDOFF_RETURN_MSG,
    UNKNOWN_INPUT,
)
from bot.lang_detect import detect_language
from bot.telegram_client import send_message, send_chat_action

logger = logging.getLogger(__name__)

# Default language for initial greeting (bilingual)
_DEFAULT_LANG = Lang.RU


async def handle_message(chat_id: int, text: str) -> None:
    """
    Main entry point for processing a text message.
    Routes through wizard states, menu, and free-text handling.
    """
    session = get_session(chat_id)
    text = text.strip()

    # --- Handoff active: check for return keyword ---
    if session.state == BotState.HANDOFF:
        if text.lower() in ("бот", "bot"):
            session.state = BotState.IDLE
            session.handoff_until = 0
            save_session(chat_id, session)
            lang = session.lang or _DEFAULT_LANG
            await send_message(chat_id, HANDOFF_RETURN_MSG[lang])
            await send_message(chat_id, MAIN_MENU[lang])
            return
        # Check timeout
        if session.handoff_until and time.time() > session.handoff_until:
            session.state = BotState.IDLE
            session.handoff_until = 0
            save_session(chat_id, session)
            lang = session.lang or _DEFAULT_LANG
            await send_message(chat_id, HANDOFF_RETURN_MSG[lang])
            await send_message(chat_id, MAIN_MENU[lang])
            return
        # In handoff — bot stays silent
        return

    # --- Global navigation codes ---
    if text == "99":
        session.state = BotState.SELECTING_LANG
        session.lang = None
        session.lang_locked = False
        save_session(chat_id, session)
        await send_message(chat_id, GREETING[_DEFAULT_LANG])
        return

    if text == "98":
        session.state = BotState.SELECTING_CITY
        session.city = None
        session.city_confirmed = False
        save_session(chat_id, session)
        lang = session.lang or _DEFAULT_LANG
        await send_message(chat_id, CITY_SELECT[lang])
        return

    if text == "0":
        if session.state == BotState.IN_FLOW:
            session.state = BotState.IDLE
            session.flow_step = None
            session.product = None
            save_session(chat_id, session)
        lang = session.lang or _DEFAULT_LANG
        await send_message(chat_id, MAIN_MENU[lang])
        return

    # --- Wizard: Language selection ---
    if session.state == BotState.SELECTING_LANG:
        await _handle_lang_selection(chat_id, text, session)
        return

    # --- Wizard: City selection ---
    if session.state == BotState.SELECTING_CITY:
        await _handle_city_selection(chat_id, text, session)
        return

    # --- Idle / Menu: route by digit or free text ---
    if session.state in (BotState.IDLE, BotState.IN_MENU):
        await _handle_menu(chat_id, text, session)
        return

    # --- In flow (product flow) ---
    if session.state == BotState.IN_FLOW:
        await _handle_flow(chat_id, text, session)
        return

    # Fallback
    lang = session.lang or _DEFAULT_LANG
    await send_message(chat_id, UNKNOWN_INPUT[lang])


async def handle_start(chat_id: int) -> None:
    """Handle /start command — reset session and show greeting."""
    reset_session(chat_id)
    # Send bilingual greeting
    await send_message(chat_id, GREETING[_DEFAULT_LANG])


# =============================================================================
# PRIVATE HANDLERS
# =============================================================================


async def _handle_lang_selection(chat_id: int, text: str, session: Session) -> None:
    """Process language selection step."""
    lang: Lang | None = None

    if text == "1":
        lang = Lang.RU
    elif text == "2":
        lang = Lang.KK
    else:
        # Try auto-detect from free text
        detected = detect_language(text)
        if detected:
            lang = detected

    if lang is None:
        # Could not determine — ask again (bilingual)
        await send_message(chat_id, GREETING[_DEFAULT_LANG])
        return

    session.lang = lang
    session.lang_locked = True
    session.state = BotState.SELECTING_CITY
    save_session(chat_id, session)
    await send_message(chat_id, CITY_SELECT[lang])


async def _handle_city_selection(chat_id: int, text: str, session: Session) -> None:
    """Process city selection step."""
    lang = session.lang or _DEFAULT_LANG
    city: City | None = None

    if text == "1":
        city = City.ASTANA
    elif text == "2":
        city = City.ALMATY
    else:
        lower = text.lower()
        if "астана" in lower or "astana" in lower:
            city = City.ASTANA
        elif "алматы" in lower or "almaty" in lower:
            city = City.ALMATY

    if city is None:
        await send_message(chat_id, CITY_SELECT[lang])
        return

    session.city = city
    session.city_confirmed = True
    session.state = BotState.IDLE
    save_session(chat_id, session)

    # Show office info + menu
    office = OFFICE_INFO[city][lang]
    await send_message(chat_id, f"{office}\n\n{MAIN_MENU[lang]}")


async def _handle_menu(chat_id: int, text: str, session: Session) -> None:
    """Route menu selection or free-text question."""
    lang = session.lang or _DEFAULT_LANG

    # Digit menu
    if text in ("1", "2", "3", "4", "5"):
        # Product info (stub — will be expanded with KB)
        product_names = {
            "1": "HPL-панели GREENLAM" if lang == Lang.RU else "HPL-панельдер GREENLAM",
            "2": "Фиброцементные панели KMEW" if lang == Lang.RU else "KMEW фиброцемент панельдері",
            "3": "Композитная черепица" if lang == Lang.RU else "Композитті жабынтақ",
            "4": "Интерьерные материалы" if lang == Lang.RU else "Интерьер материалдары",
            "5": "Услуги под ключ / монтаж" if lang == Lang.RU else "Кешенді қызметтер / монтаж",
        }
        product = product_names[text]
        session.product = product
        save_session(chat_id, session)

        if lang == Lang.RU:
            msg = (
                f"Вы выбрали: {product}\n\n"
                f"Я могу рассказать подробнее о характеристиках, показать доступные цвета "
                f"или записать вас на консультацию.\n\n"
                f"Что вас интересует? Или напишите «0» чтобы вернуться в меню."
            )
        else:
            msg = (
                f"Сіз таңдадыңыз: {product}\n\n"
                f"Мен сипаттамалары туралы толығырақ айтып, қолжетімді түстерді "
                f"көрсете аламын немесе сізді кеңесшіге жаза аламын.\n\n"
                f"Сізді не қызықтырады? Немесе мәзірге оралу үшін «0» жазыңыз."
            )
        await send_message(chat_id, msg)
        return

    if text == "6":
        # Start consultation booking flow
        session.state = BotState.IN_FLOW
        session.flow_step = "ask_name"
        save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(chat_id, "Отлично! Давайте запишем вас на консультацию.\nКак вас зовут?")
        else:
            await send_message(chat_id, "Тамаша! Сізді кеңесшіге жазайық.\nСіздің атыңыз?")
        return

    if text == "7":
        # FAQ — for now just a stub
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "Задайте ваш вопрос, и я постараюсь ответить на основе нашей базы знаний.\n"
                "Или напишите «0» для возврата в меню.",
            )
        else:
            await send_message(
                chat_id,
                "Сұрағыңызды қойыңыз, мен білім базамыз негізінде жауап беруге тырысамын.\n"
                "Немесе мәзірге оралу үшін «0» жазыңыз.",
            )
        return

    if text == "8":
        # Handoff to manager
        await _trigger_handoff(chat_id, session)
        return

    # Check for handoff keywords
    lower = text.lower()
    if any(kw in lower for kw in ("менеджер", "оператор", "operator", "manager")):
        await _trigger_handoff(chat_id, session)
        return

    # Free text → FAQ/AI (stub for now — will route to LLM agent)
    if lang == Lang.RU:
        await send_message(
            chat_id,
            "Спасибо за вопрос! Сейчас я работаю в режиме меню. "
            "Скоро смогу отвечать на свободные вопросы с помощью ИИ.\n\n"
            "Пока выберите пункт из меню или напишите «8» для связи с менеджером.",
        )
    else:
        await send_message(
            chat_id,
            "Сұрағыңыз үшін рахмет! Қазір мен мәзір режимінде жұмыс істеймін. "
            "Жақында ЖИ көмегімен еркін сұрақтарға жауап бере аламын.\n\n"
            "Әзірге мәзірден тармақ таңдаңыз немесе менеджермен байланысу үшін «8» жазыңыз.",
        )


async def _handle_flow(chat_id: int, text: str, session: Session) -> None:
    """Handle product/consultation flow steps."""
    lang = session.lang or _DEFAULT_LANG

    if session.flow_step == "ask_name":
        session.data["name"] = text
        session.flow_step = "ask_phone"
        save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(chat_id, "Ваш номер телефона для связи?")
        else:
            await send_message(chat_id, "Байланыс үшін телефон нөміріңіз?")
        return

    if session.flow_step == "ask_phone":
        session.data["phone"] = text
        session.flow_step = "ask_purpose"
        save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "Что вас интересует?\n"
                "1 — Консультация в офисе\n"
                "2 — Встреча на объекте",
            )
        else:
            await send_message(
                chat_id,
                "Сізді не қызықтырады?\n"
                "1 — Кеңседе кеңес алу\n"
                "2 — Объектіде кездесу",
            )
        return

    if session.flow_step == "ask_purpose":
        if text == "1":
            purpose = "Консультация в офисе" if lang == Lang.RU else "Кеңседе кеңес"
        elif text == "2":
            purpose = "Встреча на объекте" if lang == Lang.RU else "Объектіде кездесу"
        else:
            purpose = text
        session.data["purpose"] = purpose
        session.flow_step = "ask_comment"
        save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(chat_id, "Есть ли комментарий или пожелание? (или напишите «нет»)")
        else:
            await send_message(chat_id, "Пікіріңіз немесе тілегіңіз бар ма? (немесе «жоқ» деп жазыңыз)")
        return

    if session.flow_step == "ask_comment":
        comment = text if text.lower() not in ("нет", "жоқ", "-") else ""
        session.data["comment"] = comment
        session.flow_step = None
        session.state = BotState.IDLE
        save_session(chat_id, session)

        # Build summary
        city_name = "Астана" if session.city == City.ASTANA else "Алматы"
        summary_data = session.data

        if lang == Lang.RU:
            summary = (
                "✅ Заявка принята!\n\n"
                f"Имя: {summary_data.get('name', '—')}\n"
                f"Телефон: {summary_data.get('phone', '—')}\n"
                f"Город: {city_name}\n"
                f"Цель: {summary_data.get('purpose', '—')}\n"
                f"Комментарий: {summary_data.get('comment') or '—'}\n\n"
                "Менеджер свяжется с вами в ближайшее время."
            )
        else:
            summary = (
                "✅ Өтінім қабылданды!\n\n"
                f"Аты: {summary_data.get('name', '—')}\n"
                f"Телефон: {summary_data.get('phone', '—')}\n"
                f"Қала: {city_name}\n"
                f"Мақсат: {summary_data.get('purpose', '—')}\n"
                f"Пікір: {summary_data.get('comment') or '—'}\n\n"
                "Менеджер сізге жақын арада хабарласады."
            )
        await send_message(chat_id, summary)

        # TODO: Send to Bitrix24 + alert manager via WhatsApp/Telegram ops chat
        logger.info("Lead created: chat_id=%s data=%s", chat_id, summary_data)

        # Show menu again
        await send_message(chat_id, MAIN_MENU[lang])
        return

    # Unknown flow step — reset
    session.state = BotState.IDLE
    session.flow_step = None
    save_session(chat_id, session)
    await send_message(chat_id, MAIN_MENU[lang])


async def _trigger_handoff(chat_id: int, session: Session) -> None:
    """Transfer conversation to human manager."""
    lang = session.lang or _DEFAULT_LANG
    session.state = BotState.HANDOFF
    session.handoff_until = time.time() + 4 * 3600  # 4 hours timeout
    save_session(chat_id, session)
    await send_message(chat_id, HANDOFF_MSG[lang])

    # TODO: Send notification to ops alert chat / manager WhatsApp
    logger.info("Handoff triggered: chat_id=%s", chat_id)
