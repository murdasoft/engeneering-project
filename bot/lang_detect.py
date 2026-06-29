"""
Language detection from user text input.
Simple marker-based approach per BOT_OPERATIONS_GUIDEBOOK section 7.
"""

import re

from bot.models import Lang

# Kazakh-specific characters (not present in Russian)
_KK_MARKERS = set("әіңғүұқөһ")  # unique Kazakh letters (lowercase)

# Common Kazakh words that DON'T contain unique letters but are clearly Kazakh.
# Sources: Apertium Kazakh corpus (udhr.tagged, kdt.tagged), manual curation.
_KK_WORDS = {
    # --- Greetings & politeness ---
    "сәлем", "салем", "сәлеметсіз", "сәлеметсізбе", "рахмет", "кешіріңіз",
    "саған", "мәселе", "түсіндір", "түсінбедім", "қайталау",

    # --- Questions & answers ---
    "қалайсыз", "қалай", "қандай", "қай", "қайда", "не", "неше", "қанша",
    "неге", "қайдан", "қашан", "кім", "қайсы", "жауап", "сұрақ",
    "білесіз", "білмеймін", "білемін", "түсіндім", "түсінбедім",

    # --- Common verbs & auxiliaries ---
    "бол", "болды", "болса", "болады", "болатын", "болған", "болып",
    "кел", "келеді", "келді", "келу", "бер", "беру", "берді", "береді",
    "жаса", "жасау", "жасады", "ал", "алу", "алды", "алады",
    "сал", "салу", "кет", "кету", "баста", "бастау", "бастады",
    "қал", "қалу", "қалады", "отыр", "отыру", "тұр", "тұру", "тұрады",
    "жүр", "жүру", "жүрді", "жатыр", "өт", "өту", "көр", "көрді",

    # --- Pronouns & determiners ---
    "мен", "сен", "ол", "біз", "сіз", "олар", "менің", "сіздің", "оның",
    "біздің", "олардың", "бұл", "осы", "сол", "ана", "мына", "әр", "барлық",
    "бәрі", "басқа", "өз", "өзім", "өзің", "өзінің", "біреу", "ешкім",
    "ешнәрсе", "бәрін", "көп", "аз", "бар", "жоқ", "барма", "жоқпа",

    # --- Common adjectives & adverbs ---
    "жақсы", "жаман", "үлкен", "кіші", "жаңа", "ескі", "ұзын",
    "ауыр", "жеңіл", "оңай", "тыс", "ішкі", "сырт", "жоғары",
    "төмен", "алдын", "артын", "бұрын", "кейін", "еш", "дәл",
    "тек", "жалпы", "ерте", "кеш", "жақын", "алыс",
    "жақсылап", "жақында", "баяу", "жылдам", "толық", "толығымен",

    # --- Business / product context ---
    "керек", "керекті", "беріңіз", "жазыңыз", "келіңіз",
    "көрсету", "көмек", "көмектес", "көмектесу", "хабарласу", "хабарлама",
    "телефон", "нөмір", "зат", "нәрсе", "бөлім", "бөліп", "жиынтық",
    "тізім", "есеп", "есептеу", "есептеген", "есепте", "баға", "бағасы",
    "сатып", "сату", "алу", "беру", "төлеу", "төлем", "шарт",
    "келісім", "тапсырыс", "тапсыру", "тапсырған", "жеткізу",
    "сапа", "өлшем", "метр", "шаршы", "аудан", "саны", "мерзім",
    "уақыт", "күн", "ай", "жыл", "таңертең", "бүгін", "ертең", "кешегі",
    "түн", "демалыс", "жұмыс", "кеңсе", "басшы",
    "клиент", "серіктес", "экономика", "өндіріс", "зауыт",
    "бөлшек", "дайын", "таза", "сұрау", "талап", "шешім",
    "дұрыс", "жөн", "оңай",

    # --- Construction / facade context ---
    "үй", "бөлме", "есік", "терезе", "еден", "шатыр",
    "орнату", "орнат", "жабдық", "жабдықтау", "айнал", "айнала",
    "бірдей", "бір", "екі", "төрт", "бес", "алты", "жеті", "сегіз", "тоғыз", "он",

    # --- Nation / identity ---
    "ел", "халық", "отан", "отбасы", "ата", "ана", "бала", "әке", "іні", "апа",

    # --- Corpus high-frequency words (no unique markers) ---
    "адам", "және", "немесе", "жеке", "бар", "бер", "ел", "кез",
    "осы", "жол", "отбасы", "мемлекет", "бойынша", "жалпы", "сол",
    "сал", "емес", "бала", "байланыс", "байланысты", "айыр", "айрыл",
    "шекара", "хат", "тыйым", "тиіс", "еркін", "негіз", "білім",
    "түр", "де", "сот", "сай", "бас", "ет", "сыз", "жаза", "баян",
    "айыпта", "жасырын", "алала", "ту", "тол", "рухани", "шектеу",
    "туында", "топ", "топта", "талап", "таны", "жария", "бастауыш",
    "алд", "ажыра", "шекте", "жар", "жарнама",
}

# Ambiguous words that exist in both languages — do NOT use for detection
_AMBIGUOUS = {"кредит", "менеджер", "ипотека", "материал", "панель", "фасад", "монтаж", "офис"}


def detect_language(text: str, current_lang: Lang | None = None) -> Lang | None:
    """
    Detect language from text content.
    Returns Lang or None if ambiguous.
    Priority: explicit markers > common words > current session lang > None.
    """
    lower = text.lower().strip()
    words = set(re.findall(r"[а-яәіңғүұқөһa-z0-9]+", lower))

    # Check for Kazakh-specific characters
    has_kk_markers = any(ch in _KK_MARKERS for ch in lower)
    if has_kk_markers:
        return Lang.KK

    # Check for common Kazakh words (without unique letters)
    if words & _KK_WORDS:
        return Lang.KK

    # If text contains Cyrillic but no Kazakh markers → likely Russian
    has_cyrillic = any("\u0400" <= ch <= "\u04ff" for ch in lower)
    if has_cyrillic and not has_kk_markers:
        return Lang.RU

    # Latin text or numbers only — keep current language
    return current_lang
