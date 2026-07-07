from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "entrega-cliente" / "documentacion-cliente-enci.md"
OUT = ROOT / "docs" / "entrega-cliente" / "documentacion-cliente-enci.pdf"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#5B6472"))
    canvas.drawString(doc.leftMargin, 0.45 * inch, "Documentacion cliente - Enci Ventas")
    canvas.drawRightString(LETTER[0] - doc.rightMargin, 0.45 * inch, f"Pagina {doc.page}")
    canvas.restoreState()


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleMain",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=21,
            leading=26,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#17324D"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H1Custom",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#17324D"),
            spaceBefore=12,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="H2Custom",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#245B7D"),
            spaceBefore=8,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyCustom",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=12.5,
            textColor=colors.HexColor("#1F2933"),
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=7.2,
            leading=9,
            textColor=colors.HexColor("#1F2933"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallBold",
            parent=styles["Small"],
            fontName="Helvetica-Bold",
        )
    )
    return styles


STYLES = make_styles()


def inline(text: str) -> str:
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font name='Courier'>\1</font>", text)
    return text


def paragraph(text: str, style: str = "BodyCustom"):
    return Paragraph(inline(text), STYLES[style])


def table_from_lines(lines: list[str]):
    rows = []
    for line in lines:
        if set(line.replace("|", "").strip()) <= {"-", ":"}:
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        rows.append(cells)
    if not rows:
        return None
    max_cols = max(len(row) for row in rows)
    rows = [row + [""] * (max_cols - len(row)) for row in rows]
    usable_width = 6.1 * inch
    widths = [usable_width / max_cols] * max_cols
    data = []
    for row_index, row in enumerate(rows):
        style = "SmallBold" if row_index == 0 else "Small"
        data.append([Paragraph(inline(cell), STYLES[style]) for cell in row])
    tbl = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    tbl.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#C8D1DA")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF1F6")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return tbl


def build_story(markdown: str):
    story = []
    lines = markdown.splitlines()
    i = 0
    in_code = False
    code_lines: list[str] = []
    table_lines: list[str] = []

    def flush_table():
        nonlocal table_lines
        if table_lines:
            tbl = table_from_lines(table_lines)
            if tbl is not None:
                story.append(tbl)
                story.append(Spacer(1, 7))
            table_lines = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            flush_table()
            if in_code:
                story.append(Preformatted("\n".join(code_lines), STYLES["Small"]))
                story.append(Spacer(1, 6))
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            table_lines.append(line)
            i += 1
            continue

        flush_table()

        if not stripped:
            story.append(Spacer(1, 4))
        elif stripped.startswith("# "):
            story.append(paragraph(stripped[2:], "TitleMain"))
        elif stripped.startswith("## "):
            story.append(paragraph(stripped[3:], "H1Custom"))
        elif stripped.startswith("### "):
            story.append(paragraph(stripped[4:], "H2Custom"))
        elif stripped.startswith("- "):
            story.append(paragraph("- " + stripped[2:]))
        elif re.match(r"^\d+\. ", stripped):
            story.append(paragraph(stripped))
        else:
            story.append(paragraph(stripped))
        i += 1

    flush_table()
    return story


def build_pdf(src: Path, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(out),
        pagesize=LETTER,
        leftMargin=0.72 * inch,
        rightMargin=0.72 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
        title=src.stem,
        author="Equipo de desarrollo",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="default", frames=[frame], onPage=footer)])
    doc.build(build_story(src.read_text(encoding="utf-8")))


def main() -> None:
    build_pdf(SRC, OUT)
    print(OUT)


if __name__ == "__main__":
    main()
