"""
Text extraction from PDF and DOCX files.
Only compares files within the same assignment (unit-scoped by caller).
"""


def extract_text(file_path: str) -> str:
    """
    Extract plain text from a PDF or DOCX file.
    Returns empty string on any error (handles blank/corrupt files gracefully).
    """
    try:
        if file_path.lower().endswith('.pdf'):
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                return ' '.join(
                    (p.extract_text() or '').encode('utf-8', errors='replace').decode('utf-8')
                    for p in pdf.pages
                )
        elif file_path.lower().endswith('.docx'):
            from docx import Document
            doc = Document(file_path)
            return ' '.join(
                p.text.encode('utf-8', errors='replace').decode('utf-8')
                for p in doc.paragraphs
            )
    except Exception:
        pass
    return ''
