from io import BytesIO

from docx import Document
from fastapi import UploadFile
from pypdf import PdfReader


async def extract_text(file: UploadFile) -> str:
    content = await file.read()
    filename = file.filename or ""

    if filename.lower().endswith(".pdf"):
        return _extract_pdf(content)
    if filename.lower().endswith(".docx"):
        return _extract_docx(content)
    if filename.lower().endswith(".txt"):
        return content.decode("utf-8", errors="ignore")

    raise ValueError("Unsupported file type. Upload PDF, DOCX, or TXT.")


def _extract_pdf(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()


def _extract_docx(content: bytes) -> str:
    document = Document(BytesIO(content))
    return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()
