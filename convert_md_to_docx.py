import re
import os
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_inline_runs(paragraph, text, base_font_size=10.5, is_italic_base=False, is_callout=False):
    # Regex to tokenize bold, italic, code, links
    pattern = re.compile(
        r'(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^\)]+\)|[^*`\[]+)'
    )
    tokens = pattern.findall(text)
    for token in tokens:
        if token.startswith('***') and token.endswith('***'):
            run = paragraph.add_run(token[3:-3])
            run.bold = True
            run.italic = True
        elif token.startswith('**') and token.endswith('**'):
            run = paragraph.add_run(token[2:-2])
            run.bold = True
            if is_italic_base:
                run.italic = True
        elif token.startswith('*') and token.endswith('*'):
            run = paragraph.add_run(token[1:-1])
            run.italic = True
        elif token.startswith('`') and token.endswith('`'):
            run = paragraph.add_run(token[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(base_font_size - 1)
            run.font.color.rgb = RGBColor(180, 40, 40)
        elif token.startswith('[') and '](' in token and token.endswith(')'):
            label = token[1:token.index('](')]
            run = paragraph.add_run(label)
            run.font.color.rgb = RGBColor(27, 95, 175)
            run.underline = True
        else:
            run = paragraph.add_run(token)
            if is_italic_base:
                run.italic = True

        run.font.name = 'Calibri'
        run.font.size = Pt(base_font_size)
        if is_callout:
            run.font.color.rgb = RGBColor(30, 41, 59)

def convert_md_to_docx(md_path, docx_path):
    doc = Document()
    
    # Page setup - Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "Dicoding Bootcamp Batch 15 — Capstone DB15-G009 (Toko Firaza)"
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.runs[0].font.name = 'Calibri'
        hp.runs[0].font.size = Pt(8.5)
        hp.runs[0].font.color.rgb = RGBColor(140, 140, 140)

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    def flush_table(rows):
        if not rows:
            return
        parsed = []
        for r in rows:
            cells = [c.strip() for c in r.strip().strip('|').split('|')]
            parsed.append(cells)
        
        if len(parsed) < 2:
            return
        
        headers = parsed[0]
        # Check if row 1 is separator (e.g. :--- | :---)
        data_rows = parsed[2:] if re.match(r'^[\s\-:|]+$', rows[1]) else parsed[1:]
        
        col_count = len(headers)
        tbl = doc.add_table(rows=len(data_rows) + 1, cols=col_count)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False

        # Format header row
        hdr_cells = tbl.rows[0].cells
        for i, h_text in enumerate(headers):
            if i < len(hdr_cells):
                hdr_cells[i].text = h_text
                set_cell_background(hdr_cells[i], "1B365D")
                set_cell_margins(hdr_cells[i], top=120, bottom=120, left=150, right=150)
                p = hdr_cells[i].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for run in p.runs:
                    run.font.name = 'Calibri'
                    run.font.size = Pt(9.5)
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(255, 255, 255)

        # Format data rows
        for r_idx, row_data in enumerate(data_rows):
            row_cells = tbl.rows[r_idx + 1].cells
            bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, cell_text in enumerate(row_data):
                if c_idx < len(row_cells):
                    row_cells[c_idx].text = cell_text
                    set_cell_background(row_cells[c_idx], bg_color)
                    set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=150, right=150)
                    p = row_cells[c_idx].paragraphs[0]
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    for run in p.runs:
                        run.font.name = 'Calibri'
                        run.font.size = Pt(9.0)
                        run.font.color.rgb = RGBColor(30, 41, 59)

        # Add empty spacing paragraph after table
        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(2)
        sp.paragraph_format.space_after = Pt(6)

    def flush_code(lines_to_flush):
        if not lines_to_flush:
            return
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run("\n".join(lines_to_flush))
        run.font.name = 'Consolas'
        run.font.size = Pt(9.0)
        run.font.color.rgb = RGBColor(30, 41, 59)
        
        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(2)
        sp.paragraph_format.space_after = Pt(6)

    for line in lines:
        raw = line.rstrip()
        stripped = raw.strip()

        # Handle Code Blocks
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                flush_code(code_lines)
                code_lines = []
            else:
                if in_table:
                    in_table = False
                    flush_table(table_rows)
                    table_rows = []
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(raw)
            continue

        # Handle Tables
        if stripped.startswith("|") and stripped.endswith("|"):
            in_table = True
            table_rows.append(stripped)
            continue
        else:
            if in_table:
                in_table = False
                flush_table(table_rows)
                table_rows = []

        # Empty lines
        if not stripped:
            continue

        # Skip anchor tags e.g. <a id="..."></a>
        if stripped.startswith("<a id=") or stripped.startswith("</a>"):
            continue

        # Horizontal rule
        if stripped in ["---", "***", "___"]:
            # Small dividing line / spacing
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(8)
            r = p.add_run("_________________________________________________________________________________")
            r.font.name = 'Calibri'
            r.font.size = Pt(8)
            r.font.color.rgb = RGBColor(210, 215, 225)
            continue

        # Headers
        if stripped.startswith("# "):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[2:])
            run.font.name = 'Calibri'
            run.font.size = Pt(16)
            run.font.bold = True
            run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
            continue

        if stripped.startswith("## "):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[3:])
            run.font.name = 'Calibri'
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = RGBColor(27, 54, 93) # Deep Navy
            continue

        if stripped.startswith("### "):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[4:])
            run.font.name = 'Calibri'
            run.font.size = Pt(11.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(30, 64, 175) # Blue 800
            continue

        if stripped.startswith("#### "):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(stripped[5:])
            run.font.name = 'Calibri'
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = RGBColor(15, 118, 110) # Teal 700
            continue

        # Blockquote / Callout ("> ...")
        if stripped.startswith("> "):
            callout_text = stripped[2:]
            # Create a nice single-cell callout box
            tbl = doc.add_table(rows=1, cols=1)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = tbl.rows[0].cells[0]
            
            is_tip = "💡" in callout_text
            bg = "EFF6FF" if is_tip else "F8FAFC" # soft blue or soft slate
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=180, right=180)
            
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            
            add_inline_runs(p, callout_text, base_font_size=9.5, is_italic_base=not is_tip, is_callout=True)
            
            sp = doc.add_paragraph()
            sp.paragraph_format.space_before = Pt(2)
            sp.paragraph_format.space_after = Pt(4)
            continue

        # Bullet List Items
        if stripped.startswith("* ") or stripped.startswith("- "):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            item_text = stripped[2:]
            # Check for checkbox
            if item_text.startswith("[ ] "):
                item_text = "☐ " + item_text[4:]
            elif item_text.startswith("[x] "):
                item_text = "☑ " + item_text[4:]
            add_inline_runs(p, item_text, base_font_size=10)
            continue

        # Numbered List Items
        num_match = re.match(r'^(\d+)\.\s+(.*)$', stripped)
        if num_match:
            num = num_match.group(1)
            content = num_match.group(2)
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            add_inline_runs(p, content, base_font_size=10)
            continue

        # Regular Paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        add_inline_runs(p, stripped, base_font_size=10)

    # If any trailing table
    if in_table:
        flush_table(table_rows)

    doc.save(docx_path)
    print(f"[OK] File docx berhasil dibuat di: {docx_path}")

if __name__ == "__main__":
    base = Path(r"d:\1-dev\2-dicoding\fullstack")
    md = base / "PERSIAPAN_DISKUSI_ADVISOR.md"
    docx = base / "PERSIAPAN_DISKUSI_ADVISOR.docx"
    convert_md_to_docx(md, docx)
