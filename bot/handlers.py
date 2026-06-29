"""
Main message handler — orchestrates the conversation flow.
Wizard → Menu → FAQ/AI → Handoff.
"""

from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timezone, timedelta

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
    PDF_FILES,
    PRESENTATION_OFFER,
    PRESENTATION_SENT,
    PRESENTATION_NOT_FOUND,
)
from bot.lang_detect import detect_language
from bot.telegram_client import send_message, send_chat_action, send_document
from bot.ai_agent import ai_respond, ai_chat, detect_intent, detect_product_intent
from bot.crm import create_lead
from bot.config import settings

logger = logging.getLogger(__name__)

# Default language for initial greeting (bilingual)
_DEFAULT_LANG = Lang.RU

# Kazakhstan timezone (UTC+5)
_KZ_TZ = timezone(timedelta(hours=5))

# Product key mapping (digit / keyword → PDF key)
_PRODUCT_PDF_MAP = {
    "1": "greenlam",  # HPL фасад
    "2": "greenlam",  # HPL интерьер
    "3": "kmew",      # KMEW
    "4": "3mm",       # керамогранит
    "5": None,        # связаться с менеджером — нет PDF
}


def _resolve_pdf_path(product_key: str) -> str | None:
    """
    Return file path or file_id for a product.
    Priority: env file_id > local file path.
    """
    env_map = {
        "greenlam": getattr(settings, "pdf_greenlam_file_id", ""),
        "kmew": getattr(settings, "pdf_kmew_file_id", ""),
        "3mm": getattr(settings, "pdf_3mm_file_id", ""),
    }
    file_id = env_map.get(product_key, "")
    if file_id:
        return file_id
    path = PDF_FILES.get(product_key)
    return path


def _is_off_hours() -> bool:
    """Check if current time is outside working hours (Mon-Fri 09:00-18:00 KZ time)."""
    now = datetime.now(_KZ_TZ)
    # Weekend
    if now.weekday() >= 5:
        return True
    # Before 9:00 or after 18:00
    if now.hour < 9 or now.hour >= 18:
        return True
    return False


async def handle_message(chat_id: int, text: str) -> None:
    """
    Main entry point for processing a text message.
    Routes through wizard states, menu, and free-text handling.
    """
    session = await get_session(chat_id)
    text = text.strip()

    # --- Handoff active: check for return keyword ---
    if session.state == BotState.HANDOFF:
        if text.lower() in ("бот", "bot"):
            session.state = BotState.IDLE
            session.handoff_until = 0
            await save_session(chat_id, session)
            lang = session.lang or _DEFAULT_LANG
            await send_message(chat_id, HANDOFF_RETURN_MSG[lang])
            await send_message(chat_id, MAIN_MENU[lang])
            return
        # Check timeout
        if session.handoff_until and time.time() > session.handoff_until:
            session.state = BotState.IDLE
            session.handoff_until = 0
            await save_session(chat_id, session)
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
        await save_session(chat_id, session)
        await send_message(chat_id, GREETING[_DEFAULT_LANG])
        return

    if text == "98":
        session.state = BotState.SELECTING_CITY
        session.city = None
        session.city_confirmed = False
        await save_session(chat_id, session)
        lang = session.lang or _DEFAULT_LANG
        await send_message(chat_id, CITY_SELECT[lang])
        return

    if text == "0":
        if session.state == BotState.IN_FLOW:
            session.state = BotState.IDLE
            session.flow_step = None
            session.product = None
            await save_session(chat_id, session)
        lang = session.lang or _DEFAULT_LANG
        await send_message(chat_id, MAIN_MENU[lang])
        return

    # --- Wizard: Language selection ---
    if session.state == BotState.SELECTING_LANG:
        # If free text (not "1" or "2") — auto-detect language and skip wizard
        # This handles serverless resets where session is lost between requests
        if text not in ("1", "2"):
            detected = detect_language(text)
            session.lang = detected or _DEFAULT_LANG
            session.lang_locked = True
            session.state = BotState.IDLE
            await save_session(chat_id, session)
            await _handle_menu(chat_id, text, session)
            return
        await _handle_lang_selection(chat_id, text, session)
        return

    # --- Wizard: City selection ---
    if session.state == BotState.SELECTING_CITY:
        # If free text (not "1" or "2") — skip city, use default and answer
        if text not in ("1", "2"):
            session.state = BotState.IDLE
            await save_session(chat_id, session)
            await _handle_menu(chat_id, text, session)
            return
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
    await reset_session(chat_id)
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
    await save_session(chat_id, session)
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
    await save_session(chat_id, session)

    # Show office info + menu
    office = OFFICE_INFO[city][lang]
    await send_message(chat_id, f"{office}\n\n{MAIN_MENU[lang]}")


async def _show_product(chat_id: int, digit: str, session: Session) -> None:
    """Show product info for a given menu digit (reused by menu & intent)."""
    lang = session.lang or _DEFAULT_LANG
    product_names = {
        "1": "HPL-панели для фасада GREENLAM" if lang == Lang.RU else "GREENLAM HPL-фасад панельдері",
        "2": "HPL-панели для интерьера GREENLAM" if lang == Lang.RU else "GREENLAM HPL-интерьер панельдері",
        "3": "Фиброцементные панели KMEW" if lang == Lang.RU else "KMEW фиброцемент панельдері",
        "4": "Широкоформатный керамогранит 3MM" if lang == Lang.RU else "3MM кең пішімді керамогранит",
    }
    product = product_names[digit]
    session.product = product
    await save_session(chat_id, session)

    # Ask AI for a brief product overview
    await send_chat_action(chat_id, "typing")
    prompt = f"Расскажи кратко о {product}" if lang == Lang.RU else f"{product} туралы қысқаша айтып бер"
    ai_reply = await ai_respond(
        user_message=prompt,
        lang=lang,
        city=session.city,
        conversation_history=session.conversation_history,
    )

    if ai_reply:
        footer_ru = "\n\nЗадайте вопрос о продукте, «6» для записи на консультацию или «0» для возврата в меню."
        footer_kk = "\n\nӨнім туралы сұрақ қойыңыз, кеңесшіге жазылу үшін «6» немесе мәзірге оралу үшін «0» жазыңыз."
        footer = footer_ru if lang == Lang.RU else footer_kk
        # Offer PDF presentation if available for this product
        pdf_key = _PRODUCT_PDF_MAP.get(digit)
        if pdf_key and _resolve_pdf_path(pdf_key):
            footer += PRESENTATION_OFFER[lang]
        session.conversation_history.append({"role": "assistant", "content": ai_reply})
        if len(session.conversation_history) > 10:
            session.conversation_history = session.conversation_history[-10:]
        await save_session(chat_id, session)
        await send_message(chat_id, ai_reply + footer, parse_mode="Markdown")
    else:
        if lang == Lang.RU:
            await send_message(
                chat_id,
                f"Вы выбрали: {product}\n\n"
                "Задайте вопрос или напишите «0» для возврата в меню.",
            )
        else:
            await send_message(
                chat_id,
                f"Сіз таңдадыңыз: {product}\n\n"
                "Сұрақ қойыңыз немесе мәзірге оралу үшін «0» жазыңыз.",
            )


async def _handle_menu(chat_id: int, text: str, session: Session) -> None:
    """Route menu selection or free-text question."""
    lang = session.lang or _DEFAULT_LANG

    # Digit menu
    if text in ("1", "2", "3", "4"):
        await _show_product(chat_id, text, session)
        return

    if text in ("5", "8"):
        # Handoff to manager
        await _trigger_handoff(chat_id, session)
        return

    if text == "6":
        # Start consultation booking flow
        session.state = BotState.IN_FLOW
        session.flow_step = "ask_name"
        await save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(chat_id, "Отлично! Давайте запишем вас на консультацию.\nКак вас зовут?\nНапример: Александр")
        else:
            await send_message(chat_id, "Тамаша! Сізді кеңесшіге жазайық.\nСіздің атыңыз?\nМысалы: Әлібек")
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

    # Quick intent detection (rule-based, before LLM)
    intent = detect_intent(text)
    if intent == "6":
        session.state = BotState.IN_FLOW
        session.flow_step = "ask_name"
        await save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(chat_id, "Отлично! Давайте запишем вас на консультацию.\nКак вас зовут?\nНапример: Александр")
        else:
            await send_message(chat_id, "Тамаша! Сізді кеңесшіге жазайық.\nСіздің атыңыз?\nМысалы: Әлібек")
        return

    if intent == "8":
        await _trigger_handoff(chat_id, session)
        return

    # Product intent (free text matched a product keyword)
    if intent in ("1", "2", "3", "4", "5"):
        await _show_product(chat_id, intent, session)
        return

    # --- Presentation request (when product already selected) ---
    lower = text.lower()
    presentation_kw = {"да", "презентация", "презентацию", "pdf", "файл", "жіберу", "презентация"}
    if session.product and any(kw in lower for kw in presentation_kw):
        # Find PDF key for current product
        pdf_key = None
        for digit, key in _PRODUCT_PDF_MAP.items():
            if key and session.product and key in session.product.lower().replace("-", ""):
                pdf_key = key
                break
        # Fallback: try to match by product content
        if not pdf_key:
            prod_lower = session.product.lower() if session.product else ""
            if "greenlam" in prod_lower or "hpl" in prod_lower:
                pdf_key = "greenlam"
            elif "kmew" in prod_lower or "фиброцемент" in prod_lower:
                pdf_key = "kmew"
            elif "3mm" in prod_lower or "керамогранит" in prod_lower:
                pdf_key = "3mm"

        if pdf_key:
            doc_path = _resolve_pdf_path(pdf_key)
            if doc_path:
                await send_message(chat_id, PRESENTATION_SENT[lang])
                await send_document(chat_id, doc_path)
                return
            else:
                await send_message(chat_id, PRESENTATION_NOT_FOUND[lang])
                return

    # --- Hybrid AI chat mode (free text) ---
    # Save user message to history
    session.conversation_history.append({"role": "user", "content": text})
    await save_session(chat_id, session)

    await send_chat_action(chat_id, "typing")
    result = await ai_chat(
        user_message=text,
        lang=lang,
        city=session.city,
        conversation_history=session.conversation_history,
    )

    if result["type"] == "text":
        reply = result["text"]
        session.conversation_history.append({"role": "assistant", "content": reply})
        if len(session.conversation_history) > 12:
            session.conversation_history = session.conversation_history[-12:]
        await save_session(chat_id, session)
        await send_message(chat_id, reply, parse_mode="Markdown")

    elif result["type"] == "action":
        action = result["action"]
        intro = result.get("intro", "")

        if action == "show_product":
            digit = result.get("digit", "1")
            if intro:
                await send_message(chat_id, intro, parse_mode="Markdown")
            session.conversation_history.append({"role": "assistant", "content": intro or f"Показываю продукт {digit}"})
            await save_session(chat_id, session)
            await _show_product(chat_id, digit, session)

        elif action == "start_consultation":
            if intro:
                await send_message(chat_id, intro, parse_mode="Markdown")
            session.state = BotState.IN_FLOW
            session.flow_step = "ask_name"
            await save_session(chat_id, session)
            if lang == Lang.RU:
                await send_message(chat_id, "Отлично! Давайте запишем вас на консультацию.\nКак вас зовут?\nНапример: Александр")
            else:
                await send_message(chat_id, "Тамаша! Сізді кеңесшіге жазайық.\nСіздің атыңыз?\nМысалы: Әлібек")

        elif action == "handoff":
            if intro:
                await send_message(chat_id, intro, parse_mode="Markdown")
            await _trigger_handoff(chat_id, session)

    else:
        # AI error fallback
        fallback_ru = (
            "Я пока не могу ответить на этот вопрос.\n\n"
            "Выберите номер из меню или напишите иначе.\n"
            "Если срочно — свяжитесь с менеджером: «8»."
        )
        fallback_kk = (
            "Мен әзірге бұл сұраққа жауап бере алмаймын.\n\n"
            "Мәзірден нөмір таңдаңыз немесе басқаша жазыңыз.\n"
            "Тез арада — менеджермен байланысыңыз: «8»."
        )
        await send_message(chat_id, fallback_ru if lang == Lang.RU else fallback_kk)


async def _handle_flow(chat_id: int, text: str, session: Session) -> None:
    """Handle product/consultation flow steps."""
    lang = session.lang or _DEFAULT_LANG

    if session.flow_step == "ask_name":
        session.data["name"] = text
        session.flow_step = "ask_phone"
        await save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "Ваш номер телефона для связи?\n"
                "Например: +7 777 123 45 67",
            )
        else:
            await send_message(
                chat_id,
                "Байланыс үшін телефон нөміріңіз?\n"
                "Мысалы: +7 777 123 45 67",
            )
        return

    if session.flow_step == "ask_phone":
        # Validate phone: strip non-digits, check length
        digits = re.sub(r"\D", "", text)
        if len(digits) < 10:
            if lang == Lang.RU:
                await send_message(
                    chat_id,
                    "Пожалуйста, введите корректный номер телефона.\n"
                    "Например: +7 777 123 45 67 или 8 777 123 45 67",
                )
            else:
                await send_message(
                    chat_id,
                    "Дұрыс телефон нөмірін енгізіңіз.\n"
                    "Мысалы: +7 777 123 45 67 немесе 8 777 123 45 67",
                )
            return
        # Normalize: ensure starts with +7 for KZ numbers
        if digits.startswith("8") and len(digits) == 11:
            digits = "7" + digits[1:]
        elif digits.startswith("7") and len(digits) == 11:
            pass
        elif len(digits) == 10:
            digits = "7" + digits
        phone = "+" + digits
        session.data["phone"] = phone
        session.flow_step = "ask_object_type"
        await save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "Какой у вас тип объекта?\n"
                "1 — Многоэтажный дом\n"
                "2 — Частный дом\n"
                "3 — Коммерческое здание\n"
                "4 — Административное здание\n"
                "5 — Другое\n\n"
                "Например: 1",
            )
        else:
            await send_message(
                chat_id,
                "Объект түрі қандай?\n"
                "1 — Көп қабатты үй\n"
                "2 — Жеке үй\n"
                "3 — Коммерциялық ғимарат\n"
                "4 — Әкімшілік ғимарат\n"
                "5 — Басқа\n\n"
                "Мысалы: 1",
            )
        return

    if session.flow_step == "ask_object_type":
        _obj_types_ru = {
            "1": "Многоэтажный дом", "2": "Частный дом",
            "3": "Коммерческое здание", "4": "Административное здание", "5": "Другое",
        }
        _obj_types_kk = {
            "1": "Көп қабатты үй", "2": "Жеке үй",
            "3": "Коммерциялық ғимарат", "4": "Әкімшілік ғимарат", "5": "Басқа",
        }
        obj_map = _obj_types_ru if lang == Lang.RU else _obj_types_kk
        session.data["object_type"] = obj_map.get(text, text)
        session.flow_step = "ask_material_purpose"
        await save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "Назначение материала?\n"
                "1 — Фасад\n"
                "2 — Интерьер\n"
                "3 — Кровля\n"
                "4 — Не определился\n\n"
                "Например: 1",
            )
        else:
            await send_message(
                chat_id,
                "Материалдың мақсаты?\n"
                "1 — Қасбет (фасад)\n"
                "2 — Интерьер\n"
                "3 — Шатыр (кровля)\n"
                "4 — Анықталмаған\n\n"
                "Мысалы: 1",
            )
        return

    if session.flow_step == "ask_material_purpose":
        _mat_ru = {"1": "Фасад", "2": "Интерьер", "3": "Кровля", "4": "Не определился"}
        _mat_kk = {"1": "Қасбет", "2": "Интерьер", "3": "Шатыр", "4": "Анықталмаған"}
        mat_map = _mat_ru if lang == Lang.RU else _mat_kk
        session.data["material_purpose"] = mat_map.get(text, text)
        session.flow_step = "ask_visit_type"
        await save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "Как удобнее?\n"
                "1 — Консультация в офисе\n"
                "2 — Встреча на объекте\n\n"
                "Например: 1",
            )
        else:
            await send_message(
                chat_id,
                "Қалай ыңғайлы?\n"
                "1 — Кеңседе кеңес алу\n"
                "2 — Объектіде кездесу\n\n"
                "Мысалы: 1",
            )
        return

    if session.flow_step == "ask_visit_type":
        if text == "1":
            purpose = "Консультация в офисе" if lang == Lang.RU else "Кеңседе кеңес"
        elif text == "2":
            purpose = "Встреча на объекте" if lang == Lang.RU else "Объектіде кездесу"
        else:
            purpose = text
        session.data["visit_type"] = purpose
        session.flow_step = "ask_comment"
        await save_session(chat_id, session)
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "Есть ли комментарий или пожелание?\n"
                "Например: нужен расчёт на 500 м² или «нет»",
            )
        else:
            await send_message(
                chat_id,
                "Пікіріңіз немесе тілегіңіз бар ма?\n"
                "Мысалы: 500 м²-ге есеп керек немесе «жоқ»",
            )
        return

    if session.flow_step == "ask_comment":
        comment = text if text.lower() not in ("нет", "жоқ", "-") else ""
        session.data["comment"] = comment
        session.flow_step = None
        session.state = BotState.IDLE
        await save_session(chat_id, session)

        # Build summary
        city_name = "Астана" if session.city == City.ASTANA else "Алматы"
        d = session.data

        # Check working hours (Almaty/Astana = UTC+5, Mon-Fri 09:00-18:00)
        is_off_hours = _is_off_hours()
        off_hours_note_ru = "\n\n⏰ Заявка оставлена в нерабочее время. Менеджер свяжется в рабочие часы (пн–пт, 09:00–18:00)."
        off_hours_note_kk = "\n\n⏰ Өтінім жұмыс уақытынан тыс қалдырылды. Менеджер жұмыс уақытында хабарласады (дс–жм, 09:00–18:00)."

        if lang == Lang.RU:
            summary = (
                "✅ Заявка принята!\n\n"
                f"👤 Имя: {d.get('name', '—')}\n"
                f"📞 Телефон: {d.get('phone', '—')}\n"
                f"📍 Город: {city_name}\n"
                f"🏢 Тип объекта: {d.get('object_type', '—')}\n"
                f"🎯 Назначение: {d.get('material_purpose', '—')}\n"
                f"📋 Формат: {d.get('visit_type', '—')}\n"
                f"💬 Комментарий: {d.get('comment') or '—'}\n\n"
                "Менеджер свяжется с вами в ближайшее время."
            )
            if is_off_hours:
                summary += off_hours_note_ru
        else:
            summary = (
                "✅ Өтінім қабылданды!\n\n"
                f"👤 Аты: {d.get('name', '—')}\n"
                f"📞 Телефон: {d.get('phone', '—')}\n"
                f"📍 Қала: {city_name}\n"
                f"🏢 Объект түрі: {d.get('object_type', '—')}\n"
                f"🎯 Мақсаты: {d.get('material_purpose', '—')}\n"
                f"📋 Формат: {d.get('visit_type', '—')}\n"
                f"💬 Пікір: {d.get('comment') or '—'}\n\n"
                "Менеджер сізге жақын арада хабарласады."
            )
            if is_off_hours:
                summary += off_hours_note_kk

        await send_message(chat_id, summary)

        # Send lead to Bitrix24
        await create_lead(
            name=d.get("name", ""),
            phone=d.get("phone", ""),
            city=city_name,
            object_type=d.get("object_type"),
            material_purpose=d.get("material_purpose"),
            visit_type=d.get("visit_type"),
            comment=d.get("comment"),
            source="Telegram Bot",
            product=session.product,
        )

        logger.info(
            "Lead created: chat_id=%s city=%s off_hours=%s data=%s",
            chat_id, city_name, is_off_hours, d,
        )

        # Show menu again
        await send_message(chat_id, MAIN_MENU[lang])
        return

    # Unknown flow step — reset
    session.state = BotState.IDLE
    session.flow_step = None
    await save_session(chat_id, session)
    await send_message(chat_id, MAIN_MENU[lang])


async def _trigger_handoff(chat_id: int, session: Session) -> None:
    """Transfer conversation to human manager."""
    lang = session.lang or _DEFAULT_LANG
    session.state = BotState.HANDOFF
    session.handoff_until = time.time() + 4 * 3600  # 4 hours timeout
    await save_session(chat_id, session)
    await send_message(chat_id, HANDOFF_MSG[lang])

    # Warn if off-hours
    if _is_off_hours():
        if lang == Lang.RU:
            await send_message(
                chat_id,
                "⏰ Сейчас нерабочее время. Менеджер ответит в рабочие часы (пн–пт, 09:00–18:00).\n"
                "Ваше сообщение сохранено.",
            )
        else:
            await send_message(
                chat_id,
                "⏰ Қазір жұмыс уақытынан тыс. Менеджер жұмыс уақытында жауап береді (дс–жм, 09:00–18:00).\n"
                "Сіздің хабарламаңыз сақталды.",
            )

    # Create lead in Bitrix24 with available data
    city_name = "Астана" if session.city == City.ASTANA else "Алматы" if session.city else None
    await create_lead(
        name="Telegram пользователь",
        phone="",
        city=city_name,
        source="Telegram Bot — Запрос менеджера",
        product=session.product,
        comment="Пользователь запросил связь с менеджером через кнопку «8»",
    )

    # Notify ops chat if configured
    if settings.ops_alert_chat_id:
        notify_ru = (
            f"🔔 Запрос менеджера в Telegram-боте\n"
            f"Chat ID: {chat_id}\n"
            f"Город: {city_name or 'не указан'}\n"
            f"Продукт: {session.product or 'не указан'}\n"
            f"Время: {'нерабочее' if _is_off_hours() else 'рабочее'}"
        )
        await send_message(int(settings.ops_alert_chat_id), notify_ru)

    logger.info("Handoff triggered: chat_id=%s off_hours=%s lead_created", chat_id, _is_off_hours())
