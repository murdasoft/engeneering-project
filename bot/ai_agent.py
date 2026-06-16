"""
AI agent — Together API (Meta Llama 3.1 70B).
KB-grounded responses: only answers from knowledge base, no hallucinations.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from bot.config import settings
from bot.models import Lang, City

logger = logging.getLogger(__name__)

_TOGETHER_URL = "https://api.together.xyz/v1/chat/completions"
_MODEL = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"

# --- Knowledge Base (will be extended with price lists, Google Sheets, etc.) ---

_KB = """
# ТОО «Агрегатор» — База знаний

## О компании
ТОО «Агрегатор» — более 10 лет на рынке фасадных решений в Казахстане.
Прямые поставки от производителя. Комплексные решения для фасадов, кровли и интерьера.

## Продукция

### 1. HPL-панели GREENLAM
- Высокопрочные декоративные панели для фасадов и интерьера
- Широкий выбор цветов и фактур
- Устойчивы к UV, влаге, механическим повреждениям
- Применение: фасады, интерьеры, общественные здания

### 2. Фиброцементные панели KMEW (Япония)
- Панели для многоэтажных и частных домов
- Высокая огнестойкость, долговечность
- Различные текстуры: под камень, дерево, штукатурку
- Производство: Япония

### 3. Композитная черепица
- Кровельные решения
- Долговечность, эстетичный внешний вид
- Устойчивость к коррозии и выгоранию

### 4. Интерьерные материалы
- Декоративные панели для внутренней отделки
- HPL-панели GREENLAM для интерьера

## Услуги
- Подбор материалов под объект
- Расчёт необходимого количества
- Дизайн-визуализация фасада
- Проектирование подсистем
- Монтаж под ключ
- Логистика и доставка

## Команда
- Менеджеры по продажам — подбор материалов, консультация
- Дизайнеры — цветовые сочетания, визуализация
- Инженеры — расчёты, подсистемы, кровля
- Архитекторы — проектирование
- Логисты — доставка в срок

## Реализованные проекты
- ЖК «Зеленый квартал»
- ЖК «АITYS»
- ЖК «Элемент»
- Средняя школа им. К. Токаева

## Филиалы
- Астана: ул. Шарль де Голль, 1А, 2 этаж, +7 (771) 033-77-27, пн–пт 09:00–18:00
- Алматы: пр-кт Сейфуллина, 404/67, Корпус 1, офис 216, +7 (777) 310-96-85, пн–пт 09:00–18:00
- Email: info@afasad.kz
- Сайт: https://allfasad.kz/

## Преимущества
- Прямые поставки от производителя → доступные цены
- Индивидуальный подход под каждый объект
- Гибкая система цен
- Только сертифицированные материалы
- Гарантия качества
"""

_SYSTEM_PROMPT_RU = f"""Ты — виртуальный ассистент компании «Агрегатор» (ТОО «Агрегатор»).

ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе базы знаний ниже. НЕ выдумывай информацию.
2. Если не знаешь ответа — скажи честно и предложи связаться с менеджером (написать «8» или «менеджер»).
3. НЕ принимай заказы. НЕ обещай цены, сроки или доставку без менеджера.
4. НЕ называй конкретные цены, если они не указаны в базе знаний.
5. Стиль: деловой, но дружелюбный. Допустимы умеренные эмодзи.
6. Отвечай кратко — 2-4 предложения. Если нужны подробности — спроси.
7. Если клиент хочет записаться на консультацию — попроси написать «6» для записи.
8. Если клиент хочет связаться с менеджером — попроси написать «8».
9. Отвечай на языке клиента.

БАЗА ЗНАНИЙ:
{_KB}

НАВИГАЦИЯ БОТА:
- 1-5: категории продуктов
- 6: запись на консультацию
- 7: FAQ
- 8: связь с менеджером
- 0: назад в меню
- 98: сменить город
- 99: сменить язык"""

_SYSTEM_PROMPT_KK = f"""Сен «Агрегатор» компаниясының (ТОО «Агрегатор») виртуалды көмекшісісін.

ЕРЕЖЕЛЕР:
1. ТЕКСЕРІЗ білім базасы негізінде ғана жауап бер. Ақпаратты ОЙЛАП ШЫҒАРМА.
2. Жауапты білмесең — адал айт және менеджермен байланысуды ұсын («8» немесе «менеджер» деп жаз).
3. Тапсырыстарды қабылдама. Бағаларды, мерзімдерді немесе жеткізуді менеджерсіз уәде БЕРМЕ.
4. Білім базасында көрсетілмеген нақты бағаларды АЙТПА.
5. Стиль: іскери, бірақ достық. Орташа эмодзи қолдануға болады.
6. Қысқа жауап бер — 2-4 сөйлем.
7. Клиент кеңесшіге жазылғысы келсе — «6» жазуды сұра.
8. Клиент менеджермен байланысқысы келсе — «8» жазуды сұра.
9. Клиенттің тілінде жауап бер.

БІЛІМ БАЗАСЫ:
{_KB}

БОТ НАВИГАЦИЯСЫ:
- 1-5: өнім санаттары
- 6: кеңесшіге жазылу
- 7: FAQ
- 8: менеджермен байланыс
- 0: мәзірге оралу
- 98: қаланы ауыстыру
- 99: тілді ауыстыру"""


def _get_system_prompt(lang: Lang) -> str:
    """Get system prompt for the given language."""
    return _SYSTEM_PROMPT_KK if lang == Lang.KK else _SYSTEM_PROMPT_RU


async def ai_respond(
    user_message: str,
    lang: Lang,
    city: City | None = None,
    conversation_history: list[dict[str, str]] | None = None,
) -> str | None:
    """
    Get AI response from Together API.
    Returns response text or None if AI is unavailable.
    """
    if not settings.together_api_key:
        logger.warning("Together API key not configured")
        return None

    system_prompt = _get_system_prompt(lang)
    if city:
        city_name = "Астана" if city == City.ASTANA else "Алматы"
        system_prompt += f"\n\nГород клиента: {city_name}"

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 6 messages for context)
    if conversation_history:
        messages.extend(conversation_history[-6:])

    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                _TOGETHER_URL,
                headers={
                    "Authorization": f"Bearer {settings.together_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _MODEL,
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.3,
                    "stop": None,
                },
            )
            data = resp.json()

            if resp.status_code != 200:
                logger.error("Together API error: %s %s", resp.status_code, data)
                return None

            return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        logger.error("Together API exception: %s", e, exc_info=True)
        return None


def detect_intent(text: str) -> str | None:
    """
    Quick rule-based intent detection before calling LLM.
    Returns menu action code or None for free-text AI.
    """
    lower = text.lower().strip()

    # Consultation / booking keywords
    consultation_kw = [
        "записаться", "запиши", "консультац", "встреча", "встретиться",
        "приехать", "приду", "прийти", "визит", "кеңес", "жазылу",
    ]
    if any(kw in lower for kw in consultation_kw):
        return "6"

    # Manager / handoff keywords
    manager_kw = [
        "менеджер", "оператор", "человек", "живой", "manager", "operator",
        "адам", "маман",
    ]
    if any(kw in lower for kw in manager_kw):
        return "8"

    # Price keywords — redirect to AI but warn
    price_kw = ["цена", "стоимость", "сколько стоит", "прайс", "баға", "қанша"]
    if any(kw in lower for kw in price_kw):
        return None  # Let AI handle but it will say "contact manager for exact price"

    return None  # Free text → AI
