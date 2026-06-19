"""
AI agent — supports Groq and Together APIs.
KB-grounded responses: only answers from knowledge base, no hallucinations.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from bot.config import settings
from bot.models import Lang, City

logger = logging.getLogger(__name__)

# Simple in-memory response cache: key=(message_normalized, lang) → reply
# TTL: 24h. Saves ~80% API calls for repeated questions.
_CACHE: dict[tuple[str, str], tuple[str, float]] = {}
_CACHE_TTL = 86400  # 24 hours


def _cache_key(message: str, lang: str) -> tuple[str, str]:
    """Normalize message for cache lookup."""
    return (" ".join(message.lower().split()), lang)


def _get_cached(message: str, lang: str) -> str | None:
    key = _cache_key(message, lang)
    entry = _CACHE.get(key)
    if entry and (time.time() - entry[1]) < _CACHE_TTL:
        return entry[0]
    if entry:
        del _CACHE[key]
    return None


def _set_cache(message: str, lang: str, reply: str) -> None:
    # Only cache messages without personal context (no history)
    _CACHE[_cache_key(message, lang)] = (reply, time.time())
    # Evict if cache grows too large
    if len(_CACHE) > 500:
        oldest = sorted(_CACHE.items(), key=lambda x: x[1][1])[:100]
        for k, _ in oldest:
            del _CACHE[k]


# Provider configs
_PROVIDERS = {
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "model": "llama-3.3-70b-versatile",
        "key_env": "groq_api_key",
    },
    "together": {
        "url": "https://api.together.xyz/v1/chat/completions",
        "model": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "key_env": "together_api_key",
    },
}

# --- Knowledge Base (will be extended with price lists, Google Sheets, etc.) ---

_KB = """
# ТОО «Агрегатор» — База знаний

## О компании
ТОО «Агрегатор» — более 10 лет на рынке фасадных решений в Казахстане.
Прямые поставки от производителя. Комплексные решения для фасадов и интерьера.

## Продукция

### 1. HPL-панели для фасада GREENLAM (Индия)
- Крупнейший производитель HPL в Азии, в тройке крупнейших в мире.
- Экстерьерные панели (Greenlam Clads):
  - Плотность ~1400 кг/м³.
  - Структура: запатентованная коэкструдированная УФ-защитная плёнка (ПВХ+ПММА) + экстерьерная декоративная бумага с УФ-пигментами (меламиновая смола) + длинноволокнистый крафт (фенольная смола).
  - 18 древесных декоров (SUNBURN OAK 9117, DEAGIO OAK 9119, MORGAN OAK 9118, EDEN OAK 9116, LAVA MORENO 9210, MOLTEN GREGIO 9211, FERROUS CEMENTO 9213, ROCK SALT 9212 и др.).
  - 13 абстрактных декоров (Choco Brown 9274, Rock Brown 9279, French Beige 9277, Sage 9278, Cane 9276, Marine Blue 9281, Mineral Yellow 9280, Vermilion Red 9275, Murky Grey 9273, Oyster 9272, Clear White 9271).
  - 11 фоновых декоров.
  - Преимущества: стойкость к УФ (1500 часов), EDF (EN 438-6) Exterior Heavy Duty Fire Retardant, любые погодные условия, высокая химическая стойкость, устойчивость к загрязнениям и царапинам, коррозии, антистатический эффект, морозостойкость от -50 до +80°C, анти-граффити эффект, устойчивость к химическим осадкам (3000 ч), лёгкость в уходе.
  - Гарантия: 10 лет.
- Проекты с Greenlam: Центр инновационного творчества г. Алматы (BI Group), Школа г. Алматы (BI Group), ЖК «Центральный сквер» г. Астана (Sensata Group), Жилой комплекс г. Москва, Аэропорт Балыкесир (Турция).

### 2. HPL-панели для интерьера GREENLAM (Индия)
- Более 70 декоров и 5 структур.
- Применение: здравоохранение, торговые центры, аэропорты, образовательные учреждения, коммерческие помещения, станции метро, железнодорожные станции, гостиницы.
- Те же производственные стандарты и качество, что и экстерьерные панели.

### 3. Фиброцементные панели KMEW (Япония)
- Официальный дистрибьютор в Казахстане. Производство только в Японии.
- Панели для облицовки многоэтажных и малоэтажных зданий. Высотность применения до 75 метров.
- Сейсмостойкость: пройдены вибродинамические испытания в КазНИИСА, применение в сейсмических зонах до 10 баллов.
- Размеры: длина 3000–3030 мм, высота 455 мм, толщина 14 / 16 / 18 / 21 мм.
- Вес: от 20 кг/шт или ~14.7 кг/м² (для 14 мм).
- Комплектующие: скрытая система крепления (шип-паз, специальные кляммеры/скобы за панелью — не видны на фасаде), фиброцементный уголок под цвет панели (для малоэтажки), металлический уголок окрашенный под цвет панели (для многоэтажки).
- Преимущества:
  - Долговечность: не деформируются от перепадов температуры и влажности, защитно-декоративный слой из керамики/фотокерамики нейтрализует УФ — цвет сохраняется до 30 лет.
  - Сейсмостойкость: разработаны в сейсмически активной Японии, отвечают требованиям по ветровой нагрузке.
  - Негорючесть: материал НГ, не плавится и не выделяет токсичных веществ при термическом воздействии.
  - Экологичность и самоочистка: в составе нет канцерогенов, загрязнения расщепляются дождевой водой, не накапливается статическое электричество.
  - Эстетичность: сотни текстур под дерево, кирпич, камень, штукатурку с богатой цветовой палитрой.
- Услуги: консультация, расчёты, шеф-монтаж — бесплатно.
- Проекты с KMEW: ЖК «Зеленый квартал» (Астана), ЖК «Элемент» (Алматы), Гостиница (Астана/Нур-Султан), ЖК «Комфорт Парк» (Минск), ЖК «Тринити» (Москва), ЖК «Дом на Тургенева» (Киров), Спортивный комплекс (Киров), Частный коттедж (Московская область).

### 4. Широкоформатный керамогранит 3MM
- Размер: 1200×3000×3 мм.
- Поверхности: матовая мелкозернистая, глянец, 5 уникальных текстур декора.
- Применение: кухонные фасады, столешницы, столы, ванные комнаты, фоновые стены, лестницы, шкафы, камины, холодильники, журнальные столики, ТВ-тумбы.
- Примеры артикулов: 1S03CD120300-1501S, 1503S, 1505S, 1901X–1906X, 1S03MD120300-1C02B, 7901X, 7902X, 4909S, 2901X, 2902X, 2906X, 2908X, 4901X, 4906X, 4907X, 1S03ZD120300-2010Z–2025Z, 1318S, 4902X, 1900X, 2909X, 2910X, SND1230A304.

## Услуги
- Подбор материалов под объект
- Расчёт необходимого количества
- Дизайн-визуализация фасада
- Проектирование подсистем
- Логистика и доставка
- Консультация, расчёты и шеф-монтаж для KMEW — бесплатно

## Команда
- Менеджеры по продажам — подбор материалов, консультация
- Дизайнеры — цветовые сочетания, визуализация
- Инженеры — расчёты, подсистемы
- Архитекторы — проектирование
- Логисты — доставка в срок

## Реализованные проекты (общие)
- ЖК «Зеленый квартал» (Астана)
- ЖК «АITYS»
- ЖК «Элемент» (Алматы)
- Средняя школа им. К. Токаева
- Центр инновационного творчества г. Алматы (BI Group)
- Школа г. Алматы (BI Group)
- ЖК «Центральный сквер» г. Астана (Sensata Group)

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

ТВОЯ ГЛАВНАЯ ЦЕЛЬ — помочь клиенту и ПОДВЕСТИ его к оформлению заявки на консультацию.

ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе базы знаний ниже. НЕ выдумывай информацию.
2. Если не знаешь ответа — скажи честно и предложи связаться с менеджером.
3. НЕ называй конкретные цены — они зависят от объёма и объекта. Вместо цены предлагай консультацию.
4. Стиль: деловой, но дружелюбный. Допустимы умеренные эмодзи.
5. Отвечай кратко — 2-4 предложения. Если нужны подробности — спроси.
6. Отвечай на языке клиента.

СТРАТЕГИЯ ВЕДЕНИЯ ДИАЛОГА:
- Выясни потребность: какой объект, для чего нужны материалы, объём.
- Дай краткую информацию по продукту из базы знаний.
- ЗАВЕРШАЙ каждый ответ призывом к действию:
  • Если клиент заинтересовался → предложи консультацию: «Давайте я запишу вас на консультацию. Напишите «6», и мы оформим заявку — менеджер подберёт материалы и рассчитает стоимость.»
  • Если клиент хочет купить/заказать → «Отлично! Чтобы оформить заказ, нужна консультация менеджера. Напишите «6» — я соберу ваши данные, и менеджер свяжется с вами.»
  • Если клиент хочет поговорить с человеком → «Напишите «8», чтобы связаться с менеджером напрямую.»
- ВСЕГДА веди к «6» (запись на консультацию) — это приоритетный путь.
- НЕ оставляй клиента без следующего шага. Каждый ответ должен заканчиваться вопросом или призывом.

БАЗА ЗНАНИЙ:
{_KB}

НАВИГАЦИЯ БОТА:
- 1 — HPL-панели для фасада GREENLAM
- 2 — HPL-панели для интерьера GREENLAM
- 3 — Фиброцементные панели KMEW
- 4 — Широкоформатный керамогранит 3MM
- 5 — связь с менеджером
- 6 — запись на консультацию
- 7 — FAQ
- 0 — назад в меню
- 98 — сменить город
- 99 — сменить язык"""

_SYSTEM_PROMPT_KK = f"""Сен «Агрегатор» компаниясының (ТОО «Агрегатор») виртуалды көмекшісісін.

СЕНІҢ БАС МАҚСАТЫҢ — клиентке көмектесу және оны КЕҢЕСІГЕ ЖАЗЫЛУҒA бастау.

ЕРЕЖЕЛЕР:
1. ТЕКСЕРІЗ білім базасы негізінде ғана жауап бер. Ақпаратты ОЙЛАП ШЫҒАРМА.
2. Жауапты білмесең — адал айт және менеджермен байланысуды ұсын.
3. Нақты бағаларды АЙТПА — олар көлемге және объектіге байланысты. Орнына кеңес ұсын.
4. Стиль: іскери, бірақ достық. Орташа эмодзи қолдануға болады.
5. Қысқа жауап бер — 2-4 сөйлем.
6. Клиенттің тілінде жауап бер.

ДИАЛОГТЫ ЖҮРГІЗУ СТРАТЕГИЯСЫ:
- Қажеттілікті анықта: қандай объект, не үшін материалдар, көлемі.
- Өнім туралы білім базасынан қысқа ақпарат бер.
- ӘР жауапты ӘРЕКЕТКЕ ШАҚЫРУМЕН аяқта:
  • Клиент қызықса → кеңес ұсын: «Кеңесшіге жазылайық. «6» жазыңыз — мен сіздің деректеріңізді жинаймын, менеджер материалдарды таңдап, бағаны есептейді.»
  • Клиент сатып алғысы келсе → «Тамаша! Тапсырыс беру үшін менеджер кеңесі қажет. «6» жазыңыз — мен деректерді жинаймын, менеджер сізбен байланысады.»
  • Клиент адаммен сөйлегісі келсе → «Менеджермен тікелей байланысу үшін «8» жазыңыз.»
- ӘРҚАШАН «6» (кеңесшіге жазылу) жақындату — бұл басым бағыт.
- Клиентті келесі қадамсыз қалдырма. Әр жауап сұрақпен немесе шақырумен аяқталуы тиіс.

БІЛІМ БАЗАСЫ:
{_KB}

БОТ НАВИГАЦИЯСЫ:
- 1 — GREENLAM HPL-фасад панельдері
- 2 — GREENLAM HPL-интерьер панельдері
- 3 — KMEW фиброцемент панельдері
- 4 — 3MM кең пішімді керамогранит
- 5 — менеджермен байланыс
- 6 — кеңесшіге жазылу
- 7 — FAQ
- 0 — мәзірге оралу
- 98 — қаланы ауыстыру
- 99 — тілді ауыстыру"""


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
    Get AI response from configured provider (groq | together).
    Returns response text or None if AI is unavailable.
    """
    provider = settings.ai_provider.lower()
    if provider not in _PROVIDERS:
        logger.error("Unknown AI provider: %s", provider)
        return None

    cfg = _PROVIDERS[provider]
    api_key = getattr(settings, cfg["key_env"], "")
    if not api_key:
        logger.error("AI provider %s: missing API key (%s)", provider, cfg["key_env"])
        return None

    lang_str = lang.value if hasattr(lang, 'value') else str(lang)

    # Use cache only for first-message queries (no history = generic question)
    if not conversation_history:
        cached = _get_cached(user_message, lang_str)
        if cached:
            logger.info("Cache hit for: %.40s", user_message)
            return cached

    system_prompt = _get_system_prompt(lang)
    if city:
        city_name = "Астана" if city == City.ASTANA else "Алматы"
        system_prompt += f"\n\nГород клиента: {city_name}"

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

    # Keep only last 4 messages (2 exchanges) — enough for context, saves tokens
    if conversation_history:
        messages.extend(conversation_history[-4:])

    messages.append({"role": "user", "content": user_message})

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                cfg["url"],
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": cfg["model"],
                    "messages": messages,
                    "max_tokens": 350,
                    "temperature": 0.3,
                },
            )
            data = resp.json()

            if resp.status_code != 200:
                logger.error("%s API error %s: %s", provider, resp.status_code, data)
                return None

            if "choices" not in data or not data["choices"]:
                logger.error("%s API empty response: %s", provider, data)
                return None

            reply = data["choices"][0]["message"]["content"].strip()
            # Cache if no personal context
            if not conversation_history:
                _set_cache(user_message, lang_str, reply)
            return reply

    except Exception as e:
        logger.error("%s API exception: %s", provider, e, exc_info=True)
        return None


# --- Product intent keywords (ru + kk) ---
_PRODUCT_INTENTS: dict[str, list[str]] = {
    "1": [  # HPL для фасада
        "hpl", "greenlam", "гринлам", "грин", "панель", "панели", "фасадная панель",
        "фасад", "облицовка", "hpl панель", "ламинат", "компакт", "экстерьер",
        "фасадный", "наружная", "снаружи", "фасадқа", "сыртқы",
    ],
    "2": [  # HPL для интерьера
        "интерьер", "внутренняя", "внутри", "отделка", "стеновая", "декоративная",
        "перегородка", "потолок", "интерьерная панель", "внутренняя отделка",
        "интерьерлік", "ішкі", "интерьерный hpl", "hpl для интерьера",
    ],
    "3": [  # KMEW / фиброцемент
        "kmew", "кмеу", "кмеw", "фиброцемент", "фибро", "цемент", "керамическая панель",
        "японская панель", "облицовочная панель", "фасадная плита",
    ],
    "4": [  # 3MM керамогранит
        "3mm", "керамогранит", "керамика", "широкоформат", "столешница",
        "кухонный фасад", "фоновая стена", "лестница", "шкаф",
    ],
}


def detect_product_intent(text: str) -> str | None:
    """Return menu digit (1-5) if text matches a product, else None."""
    lower = text.lower().strip()
    for digit, kws in _PRODUCT_INTENTS.items():
        if any(kw in lower for kw in kws):
            return digit
    return None


def detect_intent(text: str) -> str | None:
    """
    Quick rule-based intent detection before calling LLM.
    Returns menu action code or None for free-text AI.
    """
    lower = text.lower().strip()

    # Product keywords
    prod = detect_product_intent(text)
    if prod:
        return prod

    # Consultation / booking keywords
    consultation_kw = [
        "записаться", "запиши", "консультац", "встреча", "встретиться",
        "приехать", "приду", "прийти", "визит", "кеңес", "жазылу",
        "офис", "встреча", "покажите", "посмотреть образцы", "образцы",
    ]
    if any(kw in lower for kw in consultation_kw):
        return "6"

    # Manager / handoff keywords
    manager_kw = [
        "менеджер", "оператор", "человек", "живой", "manager", "operator",
        "адам", "маман", "позвоните", "перезвоните", "свяжитесь",
    ]
    if any(kw in lower for kw in manager_kw):
        return "8"

    # FAQ keywords
    faq_kw = ["вопрос", "часто", "faq", "справка", "помощь", "как", "что такое"]
    if any(kw in lower for kw in faq_kw):
        return "7"

    return None  # Free text → AI
