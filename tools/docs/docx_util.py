"""Utilidades para armar documentos Word con la identidad lila de Nova."""
from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

PRI = RGBColor(0x5B, 0x34, 0xC9)
TINTA = RGBColor(0x1D, 0x12, 0x40)
SUAVE = RGBColor(0x6B, 0x5F, 0x8F)
HEX_PRI, HEX_CLARO, HEX_ALT = "5B34C9", "EFE9FF", "F7F4FF"


def nuevo_documento(titulo_corto):
    d = Document()
    s = d.sections[0]
    s.page_width, s.page_height = Cm(21.59), Cm(27.94)
    s.left_margin = s.right_margin = Cm(2.2)
    s.top_margin, s.bottom_margin = Cm(2.2), Cm(2.0)
    base = d.styles["Normal"]
    base.font.name = "Calibri"
    base.font.size = Pt(10.5)
    base.font.color.rgb = TINTA
    base.paragraph_format.space_after = Pt(5)
    base.paragraph_format.line_spacing = 1.12
    for nombre, tam, color in (("Heading 1", 18, PRI), ("Heading 2", 13.5, PRI), ("Heading 3", 11.5, TINTA)):
        st = d.styles[nombre]
        st.font.name = "Calibri"
        st.font.size = Pt(tam)
        st.font.bold = True
        st.font.color.rgb = color
        st.paragraph_format.space_before = Pt(14 if nombre == "Heading 1" else 10)
        st.paragraph_format.space_after = Pt(5)
        st.paragraph_format.keep_with_next = True
    pie = s.footer.paragraphs[0]
    pie.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = pie.add_run(f"Nova · Ruta Segura — {titulo_corto}   |   Página ")
    r.font.size = Pt(8.5)
    r.font.color.rgb = SUAVE
    _campo(pie, "PAGE")
    return d


def _campo(parrafo, codigo):
    r = parrafo.add_run()
    r.font.size = Pt(8.5)
    r.font.color.rgb = SUAVE
    for tipo, texto in (("begin", None), (None, codigo), ("end", None)):
        if tipo:
            e = OxmlElement("w:fldChar")
            e.set(qn("w:fldCharType"), tipo)
        else:
            e = OxmlElement("w:instrText")
            e.set(qn("xml:space"), "preserve")
            e.text = texto
        r._r.append(e)


def sombrear(celda, hex_color):
    pr = celda._tc.get_or_add_tcPr()
    sh = OxmlElement("w:shd")
    sh.set(qn("w:val"), "clear")
    sh.set(qn("w:color"), "auto")
    sh.set(qn("w:fill"), hex_color)
    pr.append(sh)


def portada(d, titulo, subtitulo, datos):
    p = d.add_paragraph()
    p.paragraph_format.space_before = Pt(110)
    r = p.add_run("NOVA")
    r.font.size, r.font.bold, r.font.color.rgb = Pt(14), True, PRI
    p = d.add_paragraph()
    r = p.add_run(titulo)
    r.font.size, r.font.bold, r.font.color.rgb = Pt(34), True, TINTA
    p = d.add_paragraph()
    r = p.add_run(subtitulo)
    r.font.size, r.font.color.rgb = Pt(14), SUAVE
    d.add_paragraph().paragraph_format.space_after = Pt(60)
    t = d.add_table(rows=0, cols=2)
    for k, v in datos:
        c = t.add_row().cells
        c[0].text, c[1].text = k, v
        c[0].paragraphs[0].runs[0].bold = True
        c[0].width, c[1].width = Cm(4.5), Cm(12)
    d.add_page_break()


def h1(d, t): return d.add_heading(t, 1)
def h2(d, t): return d.add_heading(t, 2)
def h3(d, t): return d.add_heading(t, 3)


def p(d, texto, negrita=False, cursiva=False, color=None):
    par = d.add_paragraph()
    r = par.add_run(texto)
    r.bold, r.italic = negrita, cursiva
    if color:
        r.font.color.rgb = color
    return par


def vinetas(d, items, estilo="List Bullet"):
    for it in items:
        par = d.add_paragraph(style=estilo)
        if isinstance(it, tuple):
            r = par.add_run(it[0])
            r.bold = True
            par.add_run(" " + it[1])
        else:
            par.add_run(it)


def tabla(d, encabezado, filas, anchos=None, fs=9):
    t = d.add_table(rows=1, cols=len(encabezado))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(encabezado):
        c = t.rows[0].cells[i]
        c.text = ""
        r = c.paragraphs[0].add_run(h)
        r.bold, r.font.size, r.font.color.rgb = True, Pt(fs), RGBColor(255, 255, 255)
        sombrear(c, HEX_PRI)
    for n, fila in enumerate(filas):
        cs = t.add_row().cells
        for i, v in enumerate(fila):
            cs[i].text = ""
            r = cs[i].paragraphs[0].add_run(str(v))
            r.font.size = Pt(fs)
            if i == 0:
                r.bold = True
            if n % 2:
                sombrear(cs[i], HEX_ALT)
    if anchos:
        for fila in t.rows:
            for i, a in enumerate(anchos):
                fila.cells[i].width = Cm(a)
    # repetir encabezado al saltar de página
    trPr = t.rows[0]._tr.get_or_add_trPr()
    e = OxmlElement("w:tblHeader")
    e.set(qn("w:val"), "true")
    trPr.append(e)
    d.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


def imagen(d, ruta, ancho_cm=16.5, pie=None):
    d.add_picture(str(ruta), width=Cm(ancho_cm))
    d.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    if pie:
        c = d.add_paragraph()
        c.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = c.add_run(pie)
        r.italic, r.font.size, r.font.color.rgb = True, Pt(9), SUAVE


def nota(d, texto):
    t = d.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    c = t.rows[0].cells[0]
    c.text = ""
    r = c.paragraphs[0].add_run(texto)
    r.font.size = Pt(9.5)
    sombrear(c, HEX_CLARO)
    d.add_paragraph().paragraph_format.space_after = Pt(2)
