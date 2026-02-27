"""
tests/test_cleaner.py — Unit tests for cleaner.cleaner.clean_text()

Tests cover: normal input, newline handling, non-ASCII removal,
multi-space collapse, lowercasing, empty/None rejection.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from cleaner import clean_text


# ---------------------------------------------------------------------------
# Normal / Happy-path tests
# ---------------------------------------------------------------------------

class TestCleanTextNormal:
    def test_basic_cleanup(self):
        raw = "Hello World  Python  Developer"
        result = clean_text(raw)
        assert result == "hello world python developer"

    def test_newlines_replaced_by_space(self):
        raw = "John Doe\nSoftware Engineer\nPython SQL React"
        result = clean_text(raw)
        assert "\n" not in result
        assert "john doe" in result
        assert "software engineer" in result

    def test_carriage_returns_removed(self):
        raw = "Line one\r\nLine two\rLine three"
        result = clean_text(raw)
        assert "\r" not in result
        assert "\n" not in result
        assert "line one" in result
        assert "line two" in result
        assert "line three" in result

    def test_multiple_spaces_collapsed(self):
        raw = "Python    SQL        React"
        result = clean_text(raw)
        assert "  " not in result
        assert result == "python sql react"

    def test_lowercasing(self):
        raw = "PYTHON Django REST API AWS"
        result = clean_text(raw)
        assert result == result.lower()
        assert "python" in result
        assert "django" in result
        assert "rest api" in result

    def test_non_ascii_stripped(self):
        # Resume PDFs sometimes have box-drawing, em-dashes, curly quotes
        raw = "Python \u2013 Django \u2018REST API\u2019 React"
        result = clean_text(raw)
        # Non-ASCII chars should be replaced with space and collapsed
        assert "\u2013" not in result
        assert "\u2018" not in result
        assert "\u2019" not in result
        assert "python" in result
        assert "django" in result
        assert "react" in result

    def test_standard_punctuation_preserved(self):
        raw = "Skills: Python, SQL. Contact: dev@email.com"
        result = clean_text(raw)
        assert "python," in result or "python" in result
        assert "@" in result

    def test_tabs_collapsed(self):
        raw = "Python\t\tSQL\t  React"
        result = clean_text(raw)
        assert "\t" not in result
        assert "  " not in result

    def test_leading_trailing_whitespace_stripped(self):
        raw = "   Python Developer   "
        result = clean_text(raw)
        assert result == result.strip()
        assert result.startswith("python")
        assert result.endswith("developer")


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestCleanTextEdgeCases:
    def test_already_clean_text(self):
        raw = "python developer sql postgresql"
        result = clean_text(raw)
        assert result == raw

    def test_single_word(self):
        result = clean_text("Python")
        assert result == "python"

    def test_unicode_letters_stripped(self):
        # Hindi/Chinese characters should be stripped
        raw = "Python \u4e2d\u6587 Developer"
        result = clean_text(raw)
        assert "\u4e2d\u6587" not in result
        assert "python" in result
        assert "developer" in result


# ---------------------------------------------------------------------------
# Error cases
# ---------------------------------------------------------------------------

class TestCleanTextErrors:
    def test_empty_string_raises_value_error(self):
        with pytest.raises(ValueError, match="non-empty"):
            clean_text("")

    def test_none_raises_value_error(self):
        with pytest.raises(ValueError):
            clean_text(None)  # type: ignore

    def test_whitespace_only_raises_value_error(self):
        # After cleaning, result is empty
        with pytest.raises(ValueError):
            clean_text("   \n\t\r\n   ")
