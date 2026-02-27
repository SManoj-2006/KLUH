"""
cleaner.py — Text cleaning and normalisation for resume NLP processing.

Takes the raw text produced by extractor.py and returns a clean,
whitespace-normalised, lowercased string suitable for tokenisation
and pattern matching by nlp_pipeline.py.

This module is completely self-contained and has no dependency on any
other project file.
"""

import logging
import re

logger = logging.getLogger(__name__)

# Pattern that captures only printable ASCII characters, including
# standard punctuation. Unicode letters/digits are retained via \w,
# but non-ASCII symbols (e.g. box-drawing characters from PDF) are removed.
_NON_ASCII_NOISE_RE = re.compile(r"[^\x00-\x7F]+")

# Collapse any run of whitespace (spaces, tabs, newlines, carriage returns)
# into a single space.
_WHITESPACE_RE = re.compile(r"\s+")


def clean_text(raw_text: str) -> str:
    """
    Clean raw PDF text for NLP processing.

    Applies the following transformations in order:

    1. Validates that ``raw_text`` is a non-empty string.
    2. Replaces all newline and carriage-return characters with spaces
       so the text becomes a single flat string.
    3. Removes non-ASCII characters that are not standard printable
       ASCII — this strips PDF artefacts such as box-drawing symbols,
       ligatures, and private-use Unicode glyphs while preserving normal
       punctuation (``.,;:!?-/@#$%&*()[]{}``).
    4. Collapses all consecutive whitespace into a single space.
    5. Strips leading and trailing whitespace.
    6. Converts the entire string to lowercase so that all downstream
       comparisons can rely on case-insensitive logic without repeated
       ``str.lower()`` calls.

    Args:
        raw_text: Raw extracted text from a PDF, as returned by
                  ``extractor.extract_text_from_pdf()``.

    Returns:
        Cleaned, whitespace-normalised, lowercased string ready for NLP.

    Raises:
        ValueError: If ``raw_text`` is ``None``, an empty string, or
                    reduces to an empty string after cleaning.
    """
    if not raw_text:
        raise ValueError(
            "raw_text must be a non-empty string; received: "
            f"{type(raw_text).__name__!r} = {raw_text!r}"
        )

    logger.debug(
        "Cleaning text. Input length: %d characters.", len(raw_text)
    )

    # Step 1 — Replace newlines / carriage returns with spaces.
    text = raw_text.replace("\r\n", " ").replace("\r", " ").replace("\n", " ")

    # Step 2 — Strip non-ASCII noise characters.
    text = _NON_ASCII_NOISE_RE.sub(" ", text)

    # Step 3 — Collapse whitespace.
    text = _WHITESPACE_RE.sub(" ", text)

    # Step 4 — Strip edges.
    text = text.strip()

    # Step 5 — Lowercase.
    text = text.lower()

    if not text:
        raise ValueError(
            "Text became empty after cleaning. The source PDF may contain "
            "only non-ASCII or image-based content."
        )

    logger.debug(
        "Cleaning complete. Output length: %d characters.", len(text)
    )
    return text
