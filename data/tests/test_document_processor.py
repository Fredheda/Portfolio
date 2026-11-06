"""Offline tests for DocumentProcessor.

They import only DocumentProcessor, a plain class module. Never import
IndexCreator or populate_index here: those talk to Azure AI Search and the
paid embeddings API. Inputs are generated in memory or in tmp_path.
"""

import zipfile

from DocumentProcessor import DocumentProcessor

MARKDOWN = "# A\n\nbody a\n\n## B\n\nbody b\n\n# A\n\nbody a2\n"

PDF_BYTES = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R"
    b"/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
    b"4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 20 100 Td (Hello pdf body) Tj ET\nendstream endobj\n"
    b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
    b"trailer<</Root 1 0 R/Size 6>>\n%%EOF\n"
)

DOCX_PARTS = {
    "[Content_Types].xml": (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        "</Types>"
    ),
    "_rels/.rels": (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        "</Relationships>"
    ),
    "word/document.xml": (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
        "<w:p><w:r><w:t>Hello docx body</w:t></w:r></w:p></w:body></w:document>"
    ),
}


def test_markdown_split_keeps_a_unique_header_per_chunk():
    chunks = DocumentProcessor().split_markdown_document_by_headers("f", MARKDOWN)
    assert len(chunks) == 3
    assert len({chunk["header"] for chunk in chunks}) == 3


def test_long_text_falls_back_to_the_recursive_split():
    chunks = DocumentProcessor().split_text_by_recursively("f", "word " * 4000)
    assert len(chunks) >= 4
    assert all(len(chunk["content"]) <= 5000 for chunk in chunks)


def test_txt_pdf_and_docx_files_become_chunks(tmp_path):
    (tmp_path / "x.txt").write_text(MARKDOWN, encoding="utf-8")
    (tmp_path / "y.pdf").write_bytes(PDF_BYTES)
    with zipfile.ZipFile(tmp_path / "z.docx", "w") as archive:
        for name, xml in DOCX_PARTS.items():
            archive.writestr(name, xml)

    chunks = DocumentProcessor().process_documents(str(tmp_path))

    text = " ".join(chunk["content"] for chunk in chunks)
    assert "body a2" in text
    assert "Hello pdf body" in text
    assert "Hello docx body" in text
