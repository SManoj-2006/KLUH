"""
extractor.py — PDF text extraction using PyMuPDF (fitz).

This module is responsible for opening a PDF file and extracting
raw text from all pages. It is completely self-contained and has
no dependency on any other project file.
"""

import logging
import os

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract all text from a PDF using PyMuPDF.

    Opens the PDF at ``file_path`` as a context manager, iterates over
    every page, and concatenates the text returned by ``page.get_text()``.
    Leading/trailing whitespace on the final result is stripped, but
    internal structure is preserved for the downstream cleaner.

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        Raw concatenated text from all pages, stripped of surrounding
        whitespace.

    Raises:
        FileNotFoundError: If the file does not exist at ``file_path``.
        ValueError: If the file is not a readable PDF, if PyMuPDF raises
                    a runtime error while opening it, or if the extracted
                    text is empty or consists solely of whitespace.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    logger.info("Extracting text from PDF: %s", file_path)

    try:
        with fitz.open(file_path) as doc:
            page_count = len(doc)
            logger.debug("PDF has %d page(s)", page_count)

            pages_text: list[str] = []
            for page_index in range(page_count):
                page = doc[page_index]
                page_text = page.get_text()
                pages_text.append(page_text)
                logger.debug(
                    "Page %d/%d: extracted %d characters",
                    page_index + 1,
                    page_count,
                    len(page_text),
                )

            raw_text = " ".join(pages_text).strip()

    except fitz.FileDataError as exc:
        raise ValueError(
            f"File at '{file_path}' is not a valid PDF or is corrupted: {exc}"
        ) from exc
    except RuntimeError as exc:
        raise ValueError(
            f"PyMuPDF encountered an error reading '{file_path}': {exc}"
        ) from exc

    if not raw_text:
        raise ValueError(
            f"PDF at '{file_path}' yielded no extractable text. "
            "The file may be image-only or encrypted."
        )

    logger.info(
        "Extraction complete. Total characters extracted: %d", len(raw_text)
    )
    return raw_text
