from app.utils.text import clean_text, truncate


def test_clean_text():
    raw = "  Hello    world  \n\n\n\n\nNext paragraph  "
    result = clean_text(raw)
    assert "    " not in result
    assert "\n\n\n" not in result


def test_truncate_short():
    assert truncate("Hello", 10) == "Hello"


def test_truncate_long():
    long_text = "A" * 600
    result = truncate(long_text, 512)
    assert len(result) == 512
    assert result.endswith("...")
