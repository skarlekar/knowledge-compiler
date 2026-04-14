#!/usr/bin/env python3
"""
Parse a PDF file to Markdown using a three-stage pipeline:

  Stage 1 — pdfminer.six  (text-based PDFs)
  Stage 2 — Tesseract OCR  (scanned images, via pypdfium2 rendering)
  Stage 3 — Claude Vision  (fallback when local stages produce thin output)

Usage:
    python3 parse_pdf.py <pdf-path> [raw-dir]

    raw-dir  Directory to write output into (default: ./raw)

Output:
    Writes <raw-dir>/<slug>.md  — Markdown text extracted from the PDF
    Prints the saved filepath to stdout so the caller can capture it.
    Progress and warnings go to stderr.

Stage selection is automatic:
    Stage 1 avg chars/page >= 100  →  use Stage 1 output
    Else Stage 2 avg words/page >= 30  →  use Stage 2 output
    Else  →  Stage 3 (Claude Vision, requires ANTHROPIC_API_KEY)

Dependencies:
    pdfminer.six>=20221105
    pypdfium2>=4.0.0          (page rendering for Stages 2 and 3)
    pytesseract>=0.3.10        (requires Tesseract engine: brew install tesseract)
    Pillow>=10.0.0
    anthropic>=0.20.0          (Stage 3 only; requires ANTHROPIC_API_KEY env var)
"""

import base64
import io
import os
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------

CHARS_PER_PAGE_MIN = 100   # below this → Stage 1 considered thin, try Stage 2
WORDS_PER_PAGE_MIN = 30    # below this → Stage 2 considered thin, try Stage 3

# Claude model for Stage 3 — cheapest vision-capable model
CLAUDE_VISION_MODEL = "claude-haiku-4-5-20251001"


# ---------------------------------------------------------------------------
# Slug helper
# ---------------------------------------------------------------------------

def derive_slug(pdf_path: Path) -> str:
    """Return a filesystem-safe slug from the PDF filename."""
    name = pdf_path.stem
    name = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return name or "document"


# ---------------------------------------------------------------------------
# Page rendering (shared by Stage 2 and Stage 3)
# ---------------------------------------------------------------------------

def _render_pages_to_png(pdf_path: Path, dpi: int = 150) -> list[bytes]:
    """
    Render each PDF page to a PNG bytes object using pypdfium2.
    Returns an empty list if pypdfium2 is not installed.
    """
    try:
        import pypdfium2 as pdfium
    except ImportError:
        print("  Warning: pypdfium2 not installed; cannot render pages for OCR/Vision.",
              file=sys.stderr)
        return []

    doc = pdfium.PdfDocument(str(pdf_path))
    pages_png: list[bytes] = []
    scale = dpi / 72.0

    for i, page in enumerate(doc):
        bitmap = page.render(scale=scale, rotation=0)
        pil_image = bitmap.to_pil()
        buf = io.BytesIO()
        pil_image.save(buf, format="PNG")
        pages_png.append(buf.getvalue())
        print(f"  Rendered page {i + 1}/{len(doc)}", file=sys.stderr)

    return pages_png


# ---------------------------------------------------------------------------
# Stage 1 — pdfminer.six
# ---------------------------------------------------------------------------

def _stage1_pdfminer(pdf_path: Path) -> tuple[list[str], bool]:
    """
    Extract text from a text-based PDF using pdfminer.six.

    Returns:
        (pages, sufficient) — pages is a list of per-page text strings;
        sufficient is True when avg chars/page >= CHARS_PER_PAGE_MIN.
    """
    try:
        from pdfminer.high_level import extract_pages
        from pdfminer.layout import LTTextContainer
    except ImportError:
        print("  Stage 1 skipped: pdfminer.six not installed.", file=sys.stderr)
        return [], False

    print("Stage 1 — pdfminer.six text extraction ...", file=sys.stderr)
    pages: list[str] = []

    try:
        for page_layout in extract_pages(str(pdf_path)):
            page_text = ""
            for element in page_layout:
                if isinstance(element, LTTextContainer):
                    page_text += element.get_text()
            pages.append(page_text.strip())
    except Exception as exc:
        print(f"  Stage 1 error: {exc}", file=sys.stderr)
        return [], False

    if not pages:
        return [], False

    avg_chars = sum(len(p) for p in pages) / len(pages)
    print(f"  {len(pages)} page(s), avg {avg_chars:.0f} chars/page", file=sys.stderr)

    sufficient = avg_chars >= CHARS_PER_PAGE_MIN
    if sufficient:
        print("  Stage 1 sufficient — skipping OCR stages.", file=sys.stderr)
    else:
        print(
            f"  Stage 1 thin (< {CHARS_PER_PAGE_MIN} chars/page) — falling through to Stage 2.",
            file=sys.stderr,
        )

    return pages, sufficient


# ---------------------------------------------------------------------------
# Stage 2 — Tesseract OCR
# ---------------------------------------------------------------------------

def _stage2_tesseract(pages_png: list[bytes]) -> tuple[list[str], bool]:
    """
    OCR each rendered page PNG with pytesseract.

    Returns:
        (pages, sufficient) — pages is per-page OCR text; sufficient is True
        when avg words/page >= WORDS_PER_PAGE_MIN.
    """
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        print("  Stage 2 skipped: pytesseract or Pillow not installed.", file=sys.stderr)
        return [], False

    # Verify the Tesseract binary is accessible
    try:
        pytesseract.get_tesseract_version()
    except pytesseract.TesseractNotFoundError:
        print(
            "  Stage 2 skipped: Tesseract engine not found. "
            "Install with: brew install tesseract",
            file=sys.stderr,
        )
        return [], False

    print("Stage 2 — Tesseract OCR ...", file=sys.stderr)
    pages: list[str] = []

    for i, png_bytes in enumerate(pages_png):
        try:
            img = Image.open(io.BytesIO(png_bytes))
            text = pytesseract.image_to_string(img, lang="eng")
            pages.append(text.strip())
            print(f"  OCR page {i + 1}/{len(pages_png)}", file=sys.stderr)
        except Exception as exc:
            print(f"  Warning: OCR failed for page {i + 1}: {exc}", file=sys.stderr)
            pages.append("")

    if not pages:
        return [], False

    avg_words = sum(len(p.split()) for p in pages) / len(pages)
    print(f"  avg {avg_words:.0f} words/page", file=sys.stderr)

    sufficient = avg_words >= WORDS_PER_PAGE_MIN
    if sufficient:
        print("  Stage 2 sufficient — skipping Claude Vision.", file=sys.stderr)
    else:
        print(
            f"  Stage 2 thin (< {WORDS_PER_PAGE_MIN} words/page) — falling through to Stage 3.",
            file=sys.stderr,
        )

    return pages, sufficient


# ---------------------------------------------------------------------------
# Stage 3 — Claude Vision
# ---------------------------------------------------------------------------

def _stage3_claude_vision(pages_png: list[bytes]) -> list[str]:
    """
    Extract text from each page image using Claude Haiku vision.
    Requires the ANTHROPIC_API_KEY environment variable.

    Returns a list of per-page text strings.
    Raises SystemExit if the API key is missing or the package is absent.
    """
    try:
        import anthropic
    except ImportError:
        sys.exit(
            "Error: Stage 3 requires the 'anthropic' package.\n"
            "Run: pip install -r src/tools/requirements.txt"
        )

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit(
            "Error: ANTHROPIC_API_KEY environment variable is not set.\n"
            "Stage 3 (Claude Vision) requires a valid API key.\n"
            "Set the key or install Tesseract (brew install tesseract) to use Stage 2."
        )

    client = anthropic.Anthropic(api_key=api_key)
    print(
        f"Stage 3 — Claude Vision ({CLAUDE_VISION_MODEL}), {len(pages_png)} page(s) ...",
        file=sys.stderr,
    )
    pages: list[str] = []

    for i, png_bytes in enumerate(pages_png):
        print(f"  Vision page {i + 1}/{len(pages_png)} ...", file=sys.stderr)
        try:
            b64 = base64.standard_b64encode(png_bytes).decode("ascii")
            message = client.messages.create(
                model=CLAUDE_VISION_MODEL,
                max_tokens=4096,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": b64,
                                },
                            },
                            {
                                "type": "text",
                                "text": (
                                    "Extract all readable text from this document page. "
                                    "Preserve paragraph structure and heading hierarchy. "
                                    "Do not summarize — return the full text verbatim. "
                                    "Output only the extracted text with no commentary."
                                ),
                            },
                        ],
                    }
                ],
            )
            text = message.content[0].text if message.content else ""
            pages.append(text.strip())
        except Exception as exc:
            print(f"  Warning: Vision API failed for page {i + 1}: {exc}", file=sys.stderr)
            pages.append("")

    return pages


# ---------------------------------------------------------------------------
# Markdown assembly
# ---------------------------------------------------------------------------

def _pages_to_markdown(pages: list[str], slug: str, stage_label: str) -> str:
    """Assemble per-page text strings into a single Markdown document."""
    title = slug.replace("-", " ").title()
    header = f"# {title}\n\n*Extracted via {stage_label}*\n\n---\n\n"
    body_parts = [p.strip() for p in pages if p.strip()]
    return header + "\n\n---\n\n".join(body_parts)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def parse_pdf(pdf_path: Path, output_dir: Path) -> Path:
    """
    Run the three-stage PDF parsing pipeline and write a Markdown file.

    Returns the path of the saved .md file (also printed to stdout).
    """
    slug = derive_slug(pdf_path)
    out_path = output_dir / f"{slug}.md"
    output_dir.mkdir(parents=True, exist_ok=True)

    # --- Stage 1: pdfminer.six ---
    s1_pages, s1_ok = _stage1_pdfminer(pdf_path)
    if s1_ok:
        md = _pages_to_markdown(s1_pages, slug, "pdfminer.six (text extraction)")
        out_path.write_text(md, encoding="utf-8")
        print(f"Saved: {out_path}", file=sys.stderr)
        print(str(out_path))
        return out_path

    # --- Render pages for Stage 2 and Stage 3 ---
    pages_png = _render_pages_to_png(pdf_path)

    # --- Stage 2: Tesseract OCR ---
    if pages_png:
        s2_pages, s2_ok = _stage2_tesseract(pages_png)
        if s2_ok:
            md = _pages_to_markdown(s2_pages, slug, "Tesseract OCR")
            out_path.write_text(md, encoding="utf-8")
            print(f"Saved: {out_path}", file=sys.stderr)
            print(str(out_path))
            return out_path
    else:
        # pypdfium2 unavailable — fall back to Stage 1 output however thin
        if s1_pages:
            print(
                "  Warning: page rendering failed; using thin Stage 1 output.",
                file=sys.stderr,
            )
            md = _pages_to_markdown(s1_pages, slug, "pdfminer.six (thin output, partial)")
            out_path.write_text(md, encoding="utf-8")
            print(f"Saved: {out_path}", file=sys.stderr)
            print(str(out_path))
            return out_path
        sys.exit(
            "Error: pdfminer produced no text and page rendering is unavailable.\n"
            "Install pypdfium2: pip install -r src/tools/requirements.txt"
        )

    # --- Stage 3: Claude Vision ---
    s3_pages = _stage3_claude_vision(pages_png)

    if not any(p.strip() for p in s3_pages):
        sys.exit(
            "Error: all three stages produced empty output.\n"
            "The PDF may be corrupted, encrypted, or contain only non-extractable content."
        )

    md = _pages_to_markdown(s3_pages, slug, f"Claude Vision ({CLAUDE_VISION_MODEL})")
    out_path.write_text(md, encoding="utf-8")
    print(f"Saved: {out_path}", file=sys.stderr)
    print(str(out_path))
    return out_path


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage: parse_pdf.py <pdf-path> [raw-dir]")

    pdf_path = Path(sys.argv[1])
    raw_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("raw")

    if not pdf_path.exists():
        sys.exit(f"Error: file not found: {pdf_path}")

    if pdf_path.suffix.lower() != ".pdf":
        sys.exit(f"Error: expected a .pdf file, got: {pdf_path.name}")

    print(f"Parsing PDF: {pdf_path}", file=sys.stderr)
    parse_pdf(pdf_path, raw_dir)


if __name__ == "__main__":
    main()
