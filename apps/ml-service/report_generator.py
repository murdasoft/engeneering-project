"""
InspectAI — Генератор инженерных отчётов о дефектах строительных конструкций.
Формирует PDF-документ через ReportLab с полной технической информацией:
- Титульный лист
- Содержание
- Описание объекта и методики
- Результаты детекции с инженерным анализом
- Размеры дефектов (мм, см), нормативные пределы
- Марки бетона, влияние на арматуру
- Рекомендации по ремонту
- Нормативные ссылки
- Приложения
"""

import io
import base64
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Image as RLImage, KeepTogether, ListFlowable, ListItem, HRFlowable,
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Fonts ────────────────────────────────────────────────────────────────────
import os as _os
_FONT_DIR = _os.path.join(_os.path.dirname(__file__), "fonts")
try:
    pdfmetrics.registerFont(TTFont("DejaVu", _os.path.join(_FONT_DIR, "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("DejaVu-Bold", _os.path.join(_FONT_DIR, "DejaVuSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("DejaVu-Oblique", _os.path.join(_FONT_DIR, "DejaVuSans-Oblique.ttf")))
    FONT = "DejaVu"
    FONT_BOLD = "DejaVu-Bold"
    FONT_ITALIC = "DejaVu-Oblique"
except Exception:
    FONT = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"
    FONT_ITALIC = "Helvetica-Oblique"

# ── Colors ───────────────────────────────────────────────────────────────────
C_PRIMARY = HexColor("#1e3a5f")
C_ACCENT = HexColor("#0ea5e9")
C_DANGER = HexColor("#dc2626")
C_WARNING = HexColor("#f59e0b")
C_OK = HexColor("#22c55e")
C_LIGHT_BG = HexColor("#f1f5f9")
C_TABLE_HEADER = HexColor("#1e3a5f")
C_TABLE_ALT = HexColor("#f8fafc")
C_BORDER = HexColor("#cbd5e1")

# ── Styles ───────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

S_TITLE = ParagraphStyle("Title", parent=styles["Title"], fontName=FONT_BOLD, fontSize=24, textColor=C_PRIMARY, alignment=TA_CENTER, spaceAfter=10, leading=30)
S_SUBTITLE = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName=FONT, fontSize=14, textColor=grey, alignment=TA_CENTER, spaceAfter=6, leading=18)
S_H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName=FONT_BOLD, fontSize=18, textColor=C_PRIMARY, spaceBefore=20, spaceAfter=12, leading=24)
S_H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName=FONT_BOLD, fontSize=14, textColor=C_PRIMARY, spaceBefore=14, spaceAfter=8, leading=18)
S_H3 = ParagraphStyle("H3", parent=styles["Heading3"], fontName=FONT_BOLD, fontSize=12, textColor=C_ACCENT, spaceBefore=10, spaceAfter=6, leading=16)
S_BODY = ParagraphStyle("Body", parent=styles["Normal"], fontName=FONT, fontSize=10, leading=14, alignment=TA_JUSTIFY, spaceAfter=6)
S_BODY_C = ParagraphStyle("BodyC", parent=S_BODY, alignment=TA_CENTER)
S_SMALL = ParagraphStyle("Small", parent=styles["Normal"], fontName=FONT, fontSize=8, leading=11, textColor=grey)
S_TABLE_CELL = ParagraphStyle("TableCell", parent=styles["Normal"], fontName=FONT, fontSize=9, leading=12)
S_TABLE_CELL_C = ParagraphStyle("TableCellC", parent=S_TABLE_CELL, alignment=TA_CENTER)
S_TABLE_HEADER = ParagraphStyle("TableHeader", parent=styles["Normal"], fontName=FONT_BOLD, fontSize=9, leading=12, textColor=white, alignment=TA_CENTER)
S_DANGER = ParagraphStyle("Danger", parent=S_BODY, textColor=C_DANGER, fontName=FONT_BOLD)
S_WARNING = ParagraphStyle("Warning", parent=S_BODY, textColor=C_WARNING, fontName=FONT_BOLD)
S_OK = ParagraphStyle("OK", parent=S_BODY, textColor=C_OK, fontName=FONT_BOLD)
S_TOC = ParagraphStyle("TOC", parent=styles["Normal"], fontName=FONT, fontSize=11, leading=18, leftIndent=20)


class NumberedCanvas(canvas.Canvas):
    """Canvas with page numbers and footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_states = []

    def showPage(self):
        self._saved_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved_states)
        for state in self._saved_states:
            self.__dict__.update(state)
            self._draw_footer(total)
            super().showPage()
        super().save()

    def _draw_footer(self, total):
        page = self._pageNumber
        if page > 1:
            self.setFont(FONT, 8)
            self.setFillColor(grey)
            self.drawCentredString(A4[0] / 2, 15 * mm, f"Стр. {page} из {total}")
            self.drawString(20 * mm, 15 * mm, "InspectAI — Инженерный отчёт")
            self.drawRightString(A4[0] - 20 * mm, 15 * mm, datetime.now().strftime("%d.%m.%Y"))
            self.setStrokeColor(C_BORDER)
            self.line(20 * mm, 18 * mm, A4[0] - 20 * mm, 18 * mm)


def _img_from_b64(b64_str, max_width=170 * mm, max_height=120 * mm):
    """Decode base64 image and return RLImage scaled to fit."""
    try:
        img_data = base64.b64decode(b64_str)
        img = RLImage(io.BytesIO(img_data))
        iw, ih = img.imageWidth, img.imageHeight
        ratio = min(max_width / iw, max_height / ih, 1.0)
        img.drawWidth = iw * ratio
        img.drawHeight = ih * ratio
        return img
    except Exception:
        return Paragraph("[Изображение недоступно]", S_BODY_C)


def _severity_color(sev):
    return {"high": C_DANGER, "medium": C_WARNING, "low": C_OK}.get(sev, grey)


def _severity_label(sev):
    return {"high": "КРИТИЧЕСКИЙ", "medium": "ЗНАЧИТЕЛЬНЫЙ", "low": "НЕЗНАЧИТЕЛЬНЫЙ"}.get(sev, "НЕИЗВЕСТНО")


def _condition_label(cond):
    return {
        "INADMISSIBLE": "НЕДОПУСТИМОЕ (требуется немедленное вмешательство)",
        "LIMITED": "ОГРАНИЧЕННО ПРИГОДНОЕ (требуется плановый ремонт)",
        "SERVICEABLE": "ПРИГОДНОЕ (требуется мониторинг)",
        "NORMAL": "НОРМАЛЬНОЕ (дефектов не обнаружено)",
    }.get(cond, cond)


# ── Report sections ──────────────────────────────────────────────────────────

def title_page(story, meta):
    story.append(Spacer(1, 60 * mm))
    story.append(Paragraph("ИНЖЕНЕРНЫЙ ОТЧЁТ", S_TITLE))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("по результатам визуального обследования", S_SUBTITLE))
    story.append(Paragraph("строительных конструкций", S_SUBTITLE))
    story.append(Spacer(1, 20 * mm))

    info_data = [
        ["Объект:", meta.get("project_name", "Не указан")],
        ["Адрес:", meta.get("location", "Не указан")],
        ["Обследовал:", meta.get("inspector", "InspectAI Automated System")],
        ["Дата обследования:", datetime.now().strftime("%d.%m.%Y %H:%M")],
        ["Метод:", "Автоматизированный визуальный контроль (YOLOv8)"],
        ["Среда:", meta.get("environment", "atmospheric")],
    ]
    t = Table(info_data, colWidths=[50 * mm, 110 * mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), FONT_BOLD),
        ("FONTNAME", (1, 0), (1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TEXTCOLOR", (0, 0), (0, -1), C_PRIMARY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, C_BORDER),
    ]))
    story.append(t)
    story.append(Spacer(1, 30 * mm))

    story.append(HRFlowable(width="60%", thickness=1, color=C_BORDER))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("InspectAI © 2026 — Автоматизированная система инженерного анализа", S_SMALL))
    story.append(Paragraph("Отчёт сформирован нейросетевой моделью YOLOv8. Не заменяет полного инструментального обследования.", S_SMALL))
    story.append(PageBreak())


def toc_page(story):
    story.append(Paragraph("СОДЕРЖАНИЕ", S_H1))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_PRIMARY))
    story.append(Spacer(1, 10 * mm))
    toc_items = [
        "1. Введение и область применения",
        "2. Нормативная база",
        "3. Методика обследования",
        "4. Описание объекта",
        "5. Исходное изображение",
        "6. Результаты автоматизированной детекции",
        "7. Детальный инженерный анализ дефектов",
        "8. Сводная таблица дефектов",
        "9. Оценка технического состояния",
        "10. Рекомендации по ремонту",
        "11. Влияние на арматуру и бетон",
        "12. Методы измерения и инструментальный контроль",
        "13. Требования к квалификации и лицензированию",
        "14. Выводы",
        "15. Нормативные ссылки",
        "Приложение А. Классификация дефектов",
        "Приложение Б. Глоссарий терминов",
    ]
    for item in toc_items:
        story.append(Paragraph(item, S_TOC))
    story.append(PageBreak())


def intro_section(story):
    story.append(Paragraph("1. ВВЕДЕНИЕ И ОБЛАСТЬ ПРИМЕНЕНИЯ", S_H1))
    story.append(Paragraph(
        "Настоящий отчёт составлен по результатам автоматизированного визуального обследования строительных "
        "конструкций с применением нейросетевой модели детекции дефектов YOLOv8. Обследование проведено "
        "в соответствии с требованиями ГОСТ 31937-2011 «Здания и сооружения. Правила обследования и мониторинга "
        "технического состояния» и СП 13-102-2003 «Правила обследования несущих строительных конструкций зданий "
        "и сооружений».",
        S_BODY,
    ))
    story.append(Paragraph(
        "Цель обследования — выявление видимых дефектов на поверхности строительных конструкций (трещин, сколов, "
        "отслоений), оценка их геометрических параметров, классификация по уровню опасности и подготовка "
        "предварительных рекомендаций по дальнейшим действиям.",
        S_BODY,
    ))
    story.append(Paragraph(
        "Область применения: предварительная оценка технического состояния бетонных и железобетонных конструкций, "
        "фасадных систем, стеновых ограждений. Отчёт не заменяет полного инструментального обследования, "
        "проводимого аттестованной лабораторией.",
        S_BODY,
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "<b>Внимание:</b> Настоящий отчёт носит предварительный характер. Окончательная оценка технического "
        "состояния должна производиться квалифицированным инженером-конструктором с применением инструментальных "
        "методов контроля.",
        S_DANGER,
    ))
    story.append(PageBreak())


def norms_section(story):
    story.append(Paragraph("2. НОРМАТИВНАЯ БАЗА", S_H1))
    story.append(Paragraph("Обследование проведено с учётом требований следующих нормативных документов:", S_BODY))
    norms = [
        ("ГОСТ 31937-2011", "Здания и сооружения. Правила обследования и мониторинга технического состояния"),
        ("СП 13-102-2003", "Правила обследования несущих строительных конструкций зданий и сооружений"),
        ("СНиП 2.03.01-84*", "Бетонные и железобетонные конструкции. Основные положения"),
        ("СП 63.13330.2018", "Бетонные и железобетонные конструкции. Основные положения (актуализация)"),
        ("СП 28.13330.2017", "Защита строительных конструкций от коррозии"),
        ("ГОСТ 17624-2012", "Бетоны. Ультразвуковой метод определения прочности"),
        ("ГОСТ 22690-2015", "Бетоны. Определение прочности механическими методами неразрушающего контроля"),
        ("СТО НОСТРОЙ 2.7.64-2012", "Ремонт и восстановление бетонных и железобетонных конструкций"),
        ("ГОСТ ISO 8501-1", "Подготовка стальных поверхностей перед нанесением покрытий"),
    ]
    data = [[Paragraph("Документ", S_TABLE_HEADER), Paragraph("Наименование", S_TABLE_HEADER)]]
    for code, name in norms:
        data.append([Paragraph(code, S_TABLE_CELL), Paragraph(name, S_TABLE_CELL)])
    t = Table(data, colWidths=[45 * mm, 120 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(PageBreak())


def method_section(story, meta):
    story.append(Paragraph("3. МЕТОДИКА ОБСЛЕДОВАНИЯ", S_H1))
    story.append(Paragraph("3.1. Метод детекции", S_H2))
    story.append(Paragraph(
        "Для автоматизированного выявления дефектов применена нейросетевая модель YOLOv8 (You Only Look Once, "
        "версия 8) — современная архитектура глубокого обучения для задачи обнаружения объектов на изображениях. "
        "Модель обучена на датасетах аннотированных изображений дефектов строительных конструкций (трещины, сколы, "
        "отслоения защитного слоя, коррозионные пятна).",
        S_BODY,
    ))
    story.append(Paragraph("3.2. Параметры модели", S_H2))
    params = [
        ["Архитектура", "YOLOv8 (Single-stage detector)"],
        ["Разрешение входа", f"{meta.get('image_width', '?')} × {meta.get('image_height', '?')} px"],
        ["Порог уверенности", "≥ 25% (0.25)"],
        ["Время обработки", f"{meta.get('processing_time', 0):.2f} сек"],
        ["Версия модели", meta.get("model_version", "yolov8s-v2.0")],
        ["Среда эксплуатации", meta.get("environment", "atmospheric")],
        ["Уровень агрессивности", meta.get("aggression", "normal")],
    ]
    if meta.get("pixel_scale_mm"):
        params.append(["Масштаб (мм/пиксель)", str(meta["pixel_scale_mm"])])
    data = [[Paragraph("Параметр", S_TABLE_HEADER), Paragraph("Значение", S_TABLE_HEADER)]]
    for k, v in params:
        data.append([Paragraph(k, S_TABLE_CELL), Paragraph(v, S_TABLE_CELL)])
    t = Table(data, colWidths=[60 * mm, 105 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("3.3. Ограничения метода", S_H2))
    story.append(Paragraph(
        "1. Метод обнаруживает только видимые поверхностные дефекты. Скрытые дефекты (внутренние пустоты, "
        "расслоение, коррозия арматуры без поверхностных проявлений) не детектируются.<br/>"
        "2. Оценка размеров дефектов является приближённой и основана на геометрии bounding box. Точные размеры "
        "требуют инструментального измерения.<br/>"
        "3. Классификация дефектов основана на визуальных признаках. Окончательный тип дефекта определяется "
        "инженером при натурном обследовании.",
        S_BODY,
    ))
    story.append(PageBreak())


def object_section(story, meta):
    story.append(Paragraph("4. ОПИСАНИЕ ОБЪЕКТА", S_H1))
    structure_type_map = {
        "wall": "Стена", "column": "Колонна", "beam": "Балка",
        "slab": "Плита перекрытия", "foundation": "Фундамент", "other": "Прочее"
    }
    obj_data = [
        ["Наименование объекта:", meta.get("project_name", "Не указан")],
        ["Адрес / расположение:", meta.get("location", "Не указан")],
        ["Дата обследования:", datetime.now().strftime("%d.%m.%Y")],
        ["Исполнитель:", meta.get("inspector", "InspectAI Automated System")],
        ["Тип конструкции:", structure_type_map.get(meta.get("structure_type"), "Бетонная / железобетонная")],
        ["Класс бетона:", meta.get("concrete_grade", "Не указан")],
        ["Класс арматуры:", meta.get("rebar_class", "Не указан")],
        ["Возраст конструкции:", meta.get("structure_age", "Не указан") + " лет" if meta.get("structure_age") else "Не указан"],
        ["Защитный слой:", str(meta.get("protective_layer_mm", "Не указан")) + " мм" if meta.get("protective_layer_mm") else "Не указан"],
        ["Среда эксплуатации:", meta.get("environment", "atmospheric")],
        ["Уровень агрессивности:", meta.get("aggression", "normal")],
    ]
    data = [[Paragraph(k, S_TABLE_CELL), Paragraph(v, S_TABLE_CELL)] for k, v in obj_data]
    t = Table(data, colWidths=[55 * mm, 110 * mm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), FONT_BOLD),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [white, C_TABLE_ALT]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(PageBreak())


def image_section(story, original_b64, annotated_b64):
    story.append(Paragraph("5. ИСХОДНОЕ ИЗОБРАЖЕНИЕ", S_H1))
    story.append(Paragraph("Фотография обследуемого участка конструкции:", S_BODY))
    story.append(Spacer(1, 5 * mm))
    if original_b64:
        story.append(_img_from_b64(original_b64, max_width=170 * mm, max_height=130 * mm))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("5.1. Результат автоматизированной разметки", S_H2))
    story.append(Paragraph(
        "На изображении ниже показаны области, обнаруженные нейросетевой моделью как потенциальные дефекты. "
        "Цвет рамки соответствует уровню опасности: <font color='#dc2626'><b>красный</b></font> — критический, "
        "<font color='#f59e0b'><b>оранжевый</b></font> — значительный, "
        "<font color='#22c55e'><b>зелёный</b></font> — незначительный.",
        S_BODY,
    ))
    story.append(Spacer(1, 5 * mm))
    if annotated_b64:
        story.append(_img_from_b64(annotated_b64, max_width=170 * mm, max_height=130 * mm))
    story.append(PageBreak())


def detection_results_section(story, detections):
    story.append(Paragraph("6. РЕЗУЛЬТАТЫ АВТОМАТИЗИРОВАННОЙ ДЕТЕКЦИИ", S_H1))
    if not detections:
        story.append(Paragraph(
            "В результате анализа изображения дефекты не обнаружены. Конструкция оценивается как находящаяся "
            "в нормальном техническом состоянии по визуальным признакам.",
            S_OK,
        ))
        story.append(PageBreak())
        return

    story.append(Paragraph(f"Обнаружено дефектов: <b>{len(detections)}</b>", S_BODY))
    story.append(Spacer(1, 5 * mm))

    data = [[
        Paragraph("№", S_TABLE_HEADER),
        Paragraph("Тип", S_TABLE_HEADER),
        Paragraph("Увер.%", S_TABLE_HEADER),
        Paragraph("Уровень", S_TABLE_HEADER),
        Paragraph("Ширина, мм", S_TABLE_HEADER),
        Paragraph("Длина, мм", S_TABLE_HEADER),
        Paragraph("Площадь, см²", S_TABLE_HEADER),
    ]]
    for i, det in enumerate(detections):
        eng = det.get("engineering", {})
        sev = det.get("severity", "low")
        sev_label = _severity_label(sev)
        data.append([
            Paragraph(str(i + 1), S_TABLE_CELL_C),
            Paragraph(eng.get("ru_name", det.get("class", "?")), S_TABLE_CELL),
            Paragraph(f"{det.get('confidence', 0) * 100:.0f}", S_TABLE_CELL_C),
            Paragraph(sev_label, S_TABLE_CELL_C),
            Paragraph(f"{eng.get('estimated_width_mm', 0):.2f}", S_TABLE_CELL_C),
            Paragraph(f"{eng.get('estimated_length_mm', 0):.2f}", S_TABLE_CELL_C),
            Paragraph(f"{eng.get('estimated_area_cm2', 0):.2f}", S_TABLE_CELL_C),
        ])

    t = Table(data, colWidths=[10 * mm, 30 * mm, 18 * mm, 28 * mm, 25 * mm, 25 * mm, 25 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(PageBreak())


def detailed_analysis_section(story, detections):
    story.append(Paragraph("7. ДЕТАЛЬНЫЙ ИНЖЕНЕРНЫЙ АНАЛИЗ ДЕФЕКТОВ", S_H1))
    if not detections:
        story.append(Paragraph("Дефекты не обнаружены. Детальный анализ не требуется.", S_OK))
        story.append(PageBreak())
        return

    for i, det in enumerate(detections):
        eng = det.get("engineering", {})
        sev = det.get("severity", "low")
        sev_color = _severity_color(sev)
        sev_label = _severity_label(sev)

        story.append(Paragraph(f"7.{i + 1}. Дефект №{i + 1} — {eng.get('ru_name', det.get('class', '?'))}", S_H2))

        # Severity badge
        sev_style = ParagraphStyle("SevBadge", parent=S_BODY, textColor=sev_color, fontName=FONT_BOLD, fontSize=11)
        story.append(Paragraph(f"Уровень опасности: {sev_label} (уверенность {det.get('confidence', 0) * 100:.0f}%)", sev_style))
        story.append(Spacer(1, 4 * mm))

        # Category
        story.append(Paragraph(f"<b>Категория:</b> {eng.get('category', '')}", S_BODY))

        # Dimensions
        story.append(Paragraph("Геометрические параметры", S_H3))
        dim_data = [
            ["Параметр", "Значение", "Единица"],
            ["Ширина (оценка)", f"{eng.get('estimated_width_mm', 0):.2f}", "мм"],
            ["Ширина", f"{eng.get('width_cm', 0):.2f}", "см"],
            ["Длина (оценка)", f"{eng.get('estimated_length_mm', 0):.2f}", "мм"],
            ["Длина", f"{eng.get('length_cm', 0):.2f}", "см"],
            ["Площадь (оценка)", f"{eng.get('estimated_area_cm2', 0):.2f}", "см²"],
            ["Позиция (X, Y)", f"{int(det.get('bbox', {}).get('x', 0))}, {int(det.get('bbox', {}).get('y', 0))}", "px"],
            ["Размер бокса", f"{int(det.get('bbox', {}).get('width', 0))} × {int(det.get('bbox', {}).get('height', 0))}", "px"],
        ]
        dim_table = [[Paragraph(c, S_TABLE_HEADER if r == 0 else S_TABLE_CELL_C) for c in row] for r, row in enumerate(dim_data)]
        t = Table(dim_table, colWidths=[55 * mm, 55 * mm, 30 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
            ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 4 * mm))

        # Normative limit
        story.append(Paragraph("Нормативные пределы", S_H3))
        story.append(Paragraph(f"<b>Предел по нормам:</b> {eng.get('normative_limit', 'Не определён')}", S_BODY))
        story.append(Paragraph(f"<b>Превышение:</b> {'ДА — требуется немедленное вмешательство' if eng.get('is_critical') else 'НЕТ — в пределах допустимого'}", S_DANGER if eng.get("is_critical") else S_OK))
        story.append(Spacer(1, 4 * mm))

        # Why NN detected
        story.append(Paragraph("Почему нейросеть классифицировала этот регион как дефект", S_H3))
        story.append(Paragraph(eng.get("why_nn_detected", "Информация недоступна."), S_BODY))
        story.append(Spacer(1, 4 * mm))

        # Causes
        story.append(Paragraph("Возможные причины возникновения", S_H3))
        causes = eng.get("causes", [])
        if causes:
            items = [ListItem(Paragraph(c, S_BODY), value=i + 1) for i, c in enumerate(causes)]
            story.append(ListFlowable(items, bulletType="1", bulletFontName=FONT, bulletFontSize=10))
        story.append(Spacer(1, 4 * mm))

        # Danger
        story.append(Paragraph("Оценка опасности", S_H3))
        danger_style = ParagraphStyle("DangerText", parent=S_BODY, textColor=sev_color, fontName=FONT_BOLD)
        story.append(Paragraph(eng.get("danger_level", "Не определена."), danger_style))
        story.append(Spacer(1, 4 * mm))

        # Concrete grades
        story.append(Paragraph("Влияние на классы бетона", S_H3))
        story.append(Paragraph(eng.get("concrete_grades_affected", "Информация недоступна."), S_BODY))
        story.append(Spacer(1, 4 * mm))

        # Rebar impact
        story.append(Paragraph("Влияние на арматуру", S_H3))
        story.append(Paragraph(eng.get("rebar_impact", "Информация недоступна."), S_BODY))
        story.append(Spacer(1, 4 * mm))

        # Actions
        story.append(Paragraph("Рекомендуемые действия", S_H3))
        actions = eng.get("recommended_actions", [])
        if actions:
            items = [ListItem(Paragraph(a, S_BODY), value=i + 1) for i, a in enumerate(actions)]
            story.append(ListFlowable(items, bulletType="1", bulletFontName=FONT, bulletFontSize=10))
        story.append(Spacer(1, 4 * mm))

        # Norms for this defect
        story.append(Paragraph("Применимые нормативные документы", S_H3))
        norms = eng.get("norms", [])
        if norms:
            for n in norms:
                story.append(Paragraph(f"• {n}", S_BODY))
        story.append(Spacer(1, 4 * mm))

        # Measurement methods
        story.append(Paragraph("Методы инструментального измерения", S_H3))
        methods = eng.get("measurement_methods", [])
        if methods:
            for m in methods:
                story.append(Paragraph(f"• {m}", S_BODY))
        story.append(Spacer(1, 4 * mm))

        # License
        story.append(Paragraph("Требования к квалификации", S_H3))
        story.append(Paragraph(eng.get("license_required", "Информация недоступна."), S_BODY))

        story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
        story.append(Spacer(1, 8 * mm))

        if (i + 1) % 2 == 0 and i < len(detections) - 1:
            story.append(PageBreak())

    story.append(PageBreak())


def summary_table_section(story, detections, summary):
    story.append(Paragraph("8. СВОДНАЯ ТАБЛИЦА ДЕФЕКТОВ", S_H1))
    if not detections:
        story.append(Paragraph("Дефекты не обнаружены.", S_OK))
        story.append(PageBreak())
        return

    data = [[
        Paragraph("№", S_TABLE_HEADER),
        Paragraph("Тип дефекта", S_TABLE_HEADER),
        Paragraph("Уровень", S_TABLE_HEADER),
        Paragraph("Ширина, мм", S_TABLE_HEADER),
        Paragraph("Длина, мм", S_TABLE_HEADER),
        Paragraph("Площадь, см²", S_TABLE_HEADER),
        Paragraph("Критич.", S_TABLE_HEADER),
        Paragraph("Норматив", S_TABLE_HEADER),
    ]]
    for i, det in enumerate(detections):
        eng = det.get("engineering", {})
        sev = det.get("severity", "low")
        data.append([
            Paragraph(str(i + 1), S_TABLE_CELL_C),
            Paragraph(eng.get("ru_name", det.get("class", "?")), S_TABLE_CELL),
            Paragraph(_severity_label(sev), S_TABLE_CELL_C),
            Paragraph(f"{eng.get('estimated_width_mm', 0):.2f}", S_TABLE_CELL_C),
            Paragraph(f"{eng.get('estimated_length_mm', 0):.2f}", S_TABLE_CELL_C),
            Paragraph(f"{eng.get('estimated_area_cm2', 0):.2f}", S_TABLE_CELL_C),
            Paragraph("ДА" if eng.get("is_critical") else "НЕТ", S_TABLE_CELL_C),
            Paragraph(eng.get("normative_limit", "—")[:40], S_TABLE_CELL),
        ])

    t = Table(data, colWidths=[8 * mm, 25 * mm, 22 * mm, 20 * mm, 20 * mm, 20 * mm, 15 * mm, 40 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())


def condition_section(story, summary):
    story.append(Paragraph("9. ОЦЕНКА ТЕХНИЧЕСКОГО СОСТОЯНИЯ", S_H1))
    cond = summary.get("overall_condition", "NORMAL")
    cond_label = _condition_label(cond)

    cond_color = {"INADMISSIBLE": C_DANGER, "LIMITED": C_WARNING, "SERVICEABLE": C_OK, "NORMAL": C_OK}.get(cond, grey)
    cond_style = ParagraphStyle("CondStyle", parent=S_BODY, textColor=cond_color, fontName=FONT_BOLD, fontSize=14, alignment=TA_CENTER, spaceAfter=10)
    story.append(Paragraph(f"Общая оценка: {cond_label}", cond_style))
    story.append(Spacer(1, 6 * mm))

    stats_data = [
        ["Показатель", "Значение"],
        ["Всего дефектов", str(summary.get("total", 0))],
        ["Критических", str(summary.get("high", 0))],
        ["Значительных", str(summary.get("medium", 0))],
        ["Незначительных", str(summary.get("low", 0))],
    ]
    class_counts = summary.get("class_counts", {})
    for cls, cnt in class_counts.items():
        stats_data.append([f"Тип '{cls}'", str(cnt)])

    data = [[Paragraph(r[0], S_TABLE_HEADER if i == 0 else S_TABLE_CELL), Paragraph(r[1], S_TABLE_HEADER if i == 0 else S_TABLE_CELL_C)] for i, r in enumerate(stats_data)]
    t = Table(data, colWidths=[80 * mm, 50 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph("Классификация по ГОСТ 31937-2011:", S_H3))
    story.append(Paragraph(
        "<b>Категория 1 (Нормальное)</b> — дефекты отсутствуют. Конструкция пригодна к эксплуатации.<br/>"
        "<b>Категория 2 (Пригодное)</b> — имеются незначительные дефекты. Требуется мониторинг.<br/>"
        "<b>Категория 3 (Ограниченно пригодное)</b> — имеются значительные дефекты. Требуется плановый ремонт.<br/>"
        "<b>Категория 4 (Непригодное)</b> — имеются критические дефекты. Требуется немедленное вмешательство.",
        S_BODY,
    ))
    story.append(PageBreak())


def recommendations_section(story, detections):
    story.append(Paragraph("10. РЕКОМЕНДАЦИИ ПО РЕМОНТУ", S_H1))
    if not detections:
        story.append(Paragraph("Ремонт не требуется. Рекомендуется плановый осмотр через 12 месяцев.", S_OK))
        story.append(PageBreak())
        return

    seen = set()
    for i, det in enumerate(detections):
        eng = det.get("engineering", {})
        cls = det.get("class", "")
        sev = det.get("severity", "low")
        key = f"{cls}_{sev}"
        if key in seen:
            continue
        seen.add(key)

        story.append(Paragraph(f"10.{i + 1}. {eng.get('ru_name', cls)} — {_severity_label(sev)}", S_H3))
        actions = eng.get("recommended_actions", [])
        if actions:
            items = [ListItem(Paragraph(a, S_BODY), value=j + 1) for j, a in enumerate(actions)]
            story.append(ListFlowable(items, bulletType="1", bulletFontName=FONT, bulletFontSize=10))
        story.append(Spacer(1, 6 * mm))

    story.append(PageBreak())


def rebar_concrete_section(story, detections):
    story.append(Paragraph("11. ВЛИЯНИЕ НА АРМАТУРУ И БЕТОН", S_H1))
    story.append(Paragraph("11.1. Влияние на бетон", S_H2))
    story.append(Paragraph(
        "Бетон — композитный материал, состоящий из цементного камня, заполнителей (песок, щебень) и воды. "
        "Марки бетона по прочности (ГОСТ 26633-2015):",
        S_BODY,
    ))
    grades = [
        ["Класс", "Марка", "Прочность, МПа", "Применение"],
        ["B7.5", "М100", "7.5", "Подготовительные работы"],
        ["B12.5", "М150", "12.5", "Стяжки, дорожки"],
        ["B15", "М200", "15.0", "Стены, перегородки"],
        ["B20", "М250", "20.0", "Фундаменты, стены"],
        ["B22.5", "М300", "22.5", "Несущие конструкции"],
        ["B25", "М350", "25.0", "Колонны, балки"],
        ["B30", "М400", "30.0", "Мосты, тоннели"],
        ["B40", "М500", "40.0", "Спец. конструкции"],
    ]
    data = [[Paragraph(c, S_TABLE_HEADER if r == 0 else S_TABLE_CELL_C) for c in row] for r, row in enumerate(grades)]
    t = Table(data, colWidths=[20 * mm, 25 * mm, 35 * mm, 70 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("11.2. Влияние на арматуру", S_H2))
    story.append(Paragraph(
        "Арматура в железобетоне воспринимает растягивающие напряжения. Коррозия арматуры — главная причина "
        "деградации ж/б конструкций. Продукты коррозии увеличивают объём арматуры на 200-400%, что вызывает "
        "отслоение защитного слоя бетона (spalling).",
        S_BODY,
    ))
    story.append(Paragraph(
        "Минимальный защитный слой бетона (СП 63.13330.2018):<br/>"
        "• Стены толщиной до 150 мм — 10 мм<br/>"
        "• Стены толщиной 150-250 мм — 15 мм<br/>"
        "• Стены толщиной > 250 мм — 20 мм<br/>"
        "• Фундаменты — 35-40 мм<br/>"
        "• Агрессивная среда — +5-10 мм к нормативу",
        S_BODY,
    ))
    story.append(Spacer(1, 6 * mm))

    for i, det in enumerate(detections):
        eng = det.get("engineering", {})
        impact = eng.get("rebar_impact", "")
        if impact:
            story.append(Paragraph(f"Дефект №{i + 1} ({eng.get('ru_name', det.get('class', '?'))}):", S_H3))
            story.append(Paragraph(impact, S_BODY))
            story.append(Spacer(1, 4 * mm))

    story.append(PageBreak())


def measurement_section(story, detections):
    story.append(Paragraph("12. МЕТОДЫ ИЗМЕРЕНИЯ И ИНСТРУМЕНТАЛЬНЫЙ КОНТРОЛЬ", S_H1))
    story.append(Paragraph(
        "Для точного определения параметров выявленных дефектов необходимо применение следующих "
        "инструментальных методов:",
        S_BODY,
    ))

    all_methods = set()
    for det in detections:
        eng = det.get("engineering", {})
        for m in eng.get("measurement_methods", []):
            all_methods.add(m)

    if all_methods:
        for m in sorted(all_methods):
            story.append(Paragraph(f"• {m}", S_BODY))
    else:
        story.append(Paragraph("• Щуп (ГОСТ 31937-2011, п. 7.4) — измерение ширины раскрытия трещин", S_BODY))
        story.append(Paragraph("• Трещиномер микроскоп — точность до 0.01 мм", S_BODY))
        story.append(Paragraph("• Молоток Шмидта (ГОСТ 22690) — прочность бетона", S_BODY))
        story.append(Paragraph("• Ультразвук (ГОСТ 17624-2012) — глубина и прочность", S_BODY))

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("12.1. Точность методов", S_H2))
    acc_data = [
        ["Метод", "Параметр", "Точность", "Стандарт"],
        ["Щуп (пластины)", "Ширина трещины", "±0.05 мм", "ГОСТ 31937"],
        ["Трещиномер", "Ширина трещины", "±0.01 мм", "СП 13-102"],
        ["DEMEC датчики", "Динамика раскрытия", "±0.001 мм", "Мониторинг"],
        ["Ультразвук", "Глубина/прочность", "±10%", "ГОСТ 17624"],
        ["Молоток Шмидта", "Прочность бетона", "±15%", "ГОСТ 22690"],
        ["Штангенциркуль", "Глубина скола", "±0.1 мм", "ГОСТ 166"],
    ]
    data = [[Paragraph(c, S_TABLE_HEADER if r == 0 else S_TABLE_CELL) for c in row] for r, row in enumerate(acc_data)]
    t = Table(data, colWidths=[35 * mm, 35 * mm, 30 * mm, 40 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)
    story.append(PageBreak())


def license_section(story, detections):
    story.append(Paragraph("13. ТРЕБОВАНИЯ К КВАЛИФИКАЦИИ И ЛИЦЕНЗИРОВАНИЮ", S_H1))
    story.append(Paragraph(
        "Обследование строительных конструкций должно проводиться аттестованной лабораторией, "
        "имеющей аттестат аккредитации в системе Росаккредитации (ФГИС «Рossa»).",
        S_BODY,
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("13.1. Требования к персоналу", S_H2))
    story.append(Paragraph(
        "• Инженер-обследователь: профильное высшее образование (ПГС, СМ) + стаж работы 5+ лет<br/>"
        "• Аттестация НОСТРОЙ / НОПЗ — для ответственных объектов<br/>"
        "• Инженер-конструктор: расчёт несущей способности при выявлении критических дефектов<br/>"
        "• Лаборант: среднее специальное образование + аттестация по методам неразрушающего контроля",
        S_BODY,
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("13.2. Требования к лаборатории", S_H2))
    story.append(Paragraph(
        "• Аттестат аккредитации Росаккредитации (с областью аккредитации по видам испытаний)<br/>"
        "• Поверённое измерительное оборудование (внесено в ФГИС «Аршин»)<br/>"
        "• Аккредитованная система менеджмента качества (ГОСТ ISO/IEC 17025-2019)",
        S_BODY,
    ))
    story.append(Spacer(1, 6 * mm))

    for det in detections:
        eng = det.get("engineering", {})
        lic = eng.get("license_required", "")
        if lic:
            story.append(Paragraph(f"{eng.get('ru_name', det.get('class', '?'))}: {lic}", S_H3))
            story.append(Spacer(1, 3 * mm))

    story.append(PageBreak())


def conclusions_section(story, detections, summary):
    story.append(Paragraph("14. ВЫВОДЫ", S_H1))
    cond = summary.get("overall_condition", "NORMAL")
    cond_label = _condition_label(cond)

    story.append(Paragraph(
        f"В результате автоматизированного визуального обследования с применением нейросетевой модели YOLOv8 "
        f"на предоставленном изображении обнаружено <b>{summary.get('total', 0)} дефект(ов)</b>, "
        f"из них <b>{summary.get('high', 0)} критических</b>, "
        f"<b>{summary.get('medium', 0)} значительных</b>, "
        f"<b>{summary.get('low', 0)} незначительных</b>.",
        S_BODY,
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(f"Общая оценка технического состояния: <b>{cond_label}</b>", S_BODY))
    story.append(Spacer(1, 6 * mm))

    if summary.get("high", 0) > 0:
        story.append(Paragraph(
            "<b>СРОЧНО:</b> Обнаружены критические дефекты. Рекомендуется немедленное ограничение "
            "эксплуатационных нагрузок и вызов инженера-конструктора для оценки несущей способности.",
            S_DANGER,
        ))
    elif summary.get("medium", 0) > 0:
        story.append(Paragraph(
            "Обнаружены значительные дефекты. Рекомендуется плановый ремонт в течение 30 дней "
            "и установка маяков для мониторинга.",
            S_WARNING,
        ))
    elif summary.get("low", 0) > 0:
        story.append(Paragraph(
            "Обнаружены незначительные дефекты. Рекомендуется мониторинг и плановый осмотр через 6 месяцев.",
            S_OK,
        ))
    else:
        story.append(Paragraph(
            "Дефекты не обнаружены. Конструкция находится в удовлетворительном техническом состоянии.",
            S_OK,
        ))

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(
        "<b>Ограничения отчёта:</b> Настоящий отчёт составлен на основании анализа одного фотографического "
        "изображения. Для полной оценки технического состояния необходимо натурное обследование с применением "
        "инструментальных методов контроля, проводимое аттестованной лабораторией.",
        S_BODY,
    ))
    story.append(PageBreak())


def references_section(story):
    story.append(Paragraph("15. НОРМАТИВНЫЕ ССЫЛКИ", S_H1))
    refs = [
        "ГОСТ 31937-2011 — Здания и сооружения. Правила обследования и мониторинга технического состояния.",
        "СП 13-102-2003 — Правила обследования несущих строительных конструкций зданий и сооружений.",
        "СНиП 2.03.01-84* — Бетонные и железобетонные конструкции. Основные положения.",
        "СП 63.13330.2018 — Бетонные и железобетонные конструкции. Основные положения (актуализированная редакция).",
        "СП 28.13330.2017 — Защита строительных конструкций от коррозии.",
        "ГОСТ 17624-2012 — Бетоны. Ультразвуковой метод определения прочности.",
        "ГОСТ 22690-2015 — Бетоны. Определение прочности механическими методами неразрушающего контроля.",
        "ГОСТ 26633-2015 — Бетоны тяжёлые и мелкозернистые. Технические условия.",
        "ГОСТ 166-89 — Штангенциркули. Технические условия.",
        "СТО НОСТРОЙ 2.7.64-2012 — Ремонт и восстановление бетонных и железобетонных конструкций.",
        "ГОСТ ISO 8501-1 — Подготовка стальных поверхностей перед нанесением покрытий.",
        "ГОСТ ISO/IEC 17025-2019 — Общие требования к компетентности испытательных и калибровочных лабораторий.",
    ]
    for r in refs:
        story.append(Paragraph(f"• {r}", S_BODY))
    story.append(PageBreak())


def appendix_defect_types(story):
    story.append(Paragraph("ПРИЛОЖЕНИЕ А. КЛАССИФИКАЦИЯ ДЕФЕКТОВ", S_H1))
    story.append(Paragraph("А.1. Классификация трещин", S_H2))
    story.append(Paragraph(
        "По ширине раскрытия:<br/>"
        "• Волосные (до 0.1 мм) — не влияют на несущую способность<br/>"
        "• Тонкие (0.1-0.3 мм) — снижают долговечность<br/>"
        "• Широкие (0.3-1.0 мм) — требуют инъектирования<br/>"
        "• Раскрытые (> 1.0 мм) — критические, требуют усиления<br/><br/>"
        "По происхождению:<br/>"
        "• Усадочные — образуются при твердении бетона<br/>"
        "• Температурные — из-за перепадов температур<br/>"
        "• Нагрузочные — от превышения расчётных нагрузок<br/>"
        "• Осадочные — из-за неравномерной осадки фундамента<br/>"
        "• Коррозионные — от расширения продуктов коррозии арматуры",
        S_BODY,
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("А.2. Классификация сколов и отслоений", S_H2))
    story.append(Paragraph(
        "По глубине:<br/>"
        "• Поверхностные (до 5 мм) — косметический дефект<br/>"
        "• Мелкие (5-20 мм) — значительный дефект<br/>"
        "• Глубокие (> 20 мм) — критический дефект<br/>"
        "• С обнажением арматуры — критический, активная коррозия<br/><br/>"
        "По площади:<br/>"
        "• Локальные (до 10 см²) — точечные<br/>"
        "• Зонные (10-100 см²) — требуют ремонта<br/>"
        "• Площадные (> 100 см²) — требуют усиления",
        S_BODY,
    ))
    story.append(PageBreak())


def glossary_section(story):
    story.append(Paragraph("ПРИЛОЖЕНИЕ Б. ГЛОССАРИЙ ТЕРМИНОВ", S_H1))
    terms = [
        ("Bounding box", "Прямоугольная область на изображении, выделенная нейросетью как содержащая дефект."),
        ("Уверенность (confidence)", "Оценка вероятности того, что выделенная область действительно содержит дефект данного типа (0-100%)."),
        ("Защитный слой бетона", "Слой бетона от поверхности до ближайшей грани арматуры. Защищает арматуру от коррозии."),
        ("Карбонизация бетона", "Процесс нейтрализации щелочной среды бетона под действием CO2 воздуха. Снижает защитные свойства."),
        ("Депассивация арматуры", "Потеря защитной оксидной плёнки на арматуре из-за снижения pH < 9. Начало коррозии."),
        ("Инъектирование", "Заполнение трещин полимерным или цементным составом под давлением для восстановления монолитности."),
        ("Маяки (гипсовые)", "Контрольные пластинки из гипса, устанавливаемые на трещину для наблюдения за её развитием."),
        ("Несущая способность", "Способность конструкции воспринимать расчётные нагрузки без разрушения."),
        ("Неразрушающий контроль", "Методы испытаний, не повреждающие конструкцию (ультразвук, молоток Шмидта, и т.д.)."),
        ("YOLOv8", "You Only Look Once, версия 8 — архитектура нейронной сети для обнаружения объектов на изображениях."),
        ("Класс бетона (B)", "Нормативная прочность бетона на сжатие в МПа (например, B25 = 25 МПа)."),
        ("Марка бетона (М)", "Прочность бетона в кгс/см² (например, М350 = 350 кгс/см² ≈ B25)."),
        ("Морозостойкость (F)", "Количество циклов замораживания-оттаивания, которые выдерживает бетон (F50, F100, F200)."),
        ("Водонепроницаемость (W)", "Давление воды, которое выдерживает бетон (W2, W4, W6, W8)."),
    ]
    data = [[Paragraph("Термин", S_TABLE_HEADER), Paragraph("Определение", S_TABLE_HEADER)]]
    for term, defn in terms:
        data.append([Paragraph(term, S_TABLE_CELL), Paragraph(defn, S_TABLE_CELL)])
    t = Table(data, colWidths=[45 * mm, 120 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TABLE_HEADER),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, C_TABLE_ALT]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t)


# ── Main entry point ─────────────────────────────────────────────────────────

def generate_pdf_report(
    detections: list,
    annotated_image_b64: str,
    original_image_b64: str,
    image_width: int,
    image_height: int,
    processing_time: float,
    project_name: str = "Не указан",
    inspector: str = "InspectAI Automated System",
    location: str = "Не указан",
    environment: str = "atmospheric",
    aggression: str = "normal",
    pixel_scale_mm: float = None,
    structure_type: str = None,
    concrete_grade: str = None,
    rebar_class: str = None,
    structure_age: str = None,
    protective_layer_mm: float = None,
) -> bytes:
    """Generate comprehensive engineering PDF report."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=25 * mm,
        title="InspectAI — Инженерный отчёт",
        author="InspectAI Automated System",
    )

    meta = {
        "project_name": project_name,
        "inspector": inspector,
        "location": location,
        "environment": environment,
        "aggression": aggression,
        "pixel_scale_mm": pixel_scale_mm,
        "structure_type": structure_type,
        "concrete_grade": concrete_grade,
        "rebar_class": rebar_class,
        "structure_age": structure_age,
        "protective_layer_mm": protective_layer_mm,
        "image_width": image_width,
        "image_height": image_height,
        "processing_time": processing_time,
        "model_version": "yolov8s-v2.0",
    }

    summary = {
        "total": len(detections),
        "high": sum(1 for d in detections if d.get("severity") == "high"),
        "medium": sum(1 for d in detections if d.get("severity") == "medium"),
        "low": sum(1 for d in detections if d.get("severity") == "low"),
        "class_counts": {},
        "overall_condition": "INADMISSIBLE" if any(d.get("severity") == "high" for d in detections)
        else "LIMITED" if any(d.get("severity") == "medium" for d in detections)
        else "SERVICEABLE" if any(d.get("severity") == "low" for d in detections)
        else "NORMAL",
    }
    for d in detections:
        cls = d.get("class", "unknown")
        summary["class_counts"][cls] = summary["class_counts"].get(cls, 0) + 1

    story = []
    title_page(story, meta)
    toc_page(story)
    intro_section(story)
    norms_section(story)
    method_section(story, meta)
    object_section(story, meta)
    image_section(story, original_image_b64, annotated_image_b64)
    detection_results_section(story, detections)
    detailed_analysis_section(story, detections)
    summary_table_section(story, detections, summary)
    condition_section(story, summary)
    recommendations_section(story, detections)
    rebar_concrete_section(story, detections)
    measurement_section(story, detections)
    license_section(story, detections)
    conclusions_section(story, detections, summary)
    references_section(story)
    appendix_defect_types(story)
    glossary_section(story)

    doc.build(story, canvasmaker=NumberedCanvas)
    return buf.getvalue()
