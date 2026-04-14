---
name: ingest-pdf
description: Parse a PDF file to Markdown using a three-stage pipeline (pdfminer.six → Tesseract OCR → Claude Vision) and save to raw/. Use this before the ingest workflow whenever the source is a PDF file.
argument-hint: <path-to-pdf>
allowed-tools: [Bash, Read]
---

# ingest-pdf

Convert a PDF file to a Markdown file in `raw/` so the standard
Knowledge Compiler ingest workflow can proceed against a local file.

Runs `src/tools/parse_pdf.py` — three-stage pipeline with automatic stage selection:

1. **Stage 1 — pdfminer.six**: Text extraction for text-based PDFs. Fast, no OCR needed. Sufficient when avg chars/page ≥ 100.
2. **Stage 2 — Tesseract OCR**: Renders pages via pypdfium2, OCRs with Tesseract. Handles scanned documents. Sufficient when avg words/page ≥ 30.
3. **Stage 3 — Claude Vision**: Sends page images to `claude-haiku-4-5-20251001`. Final fallback when local stages produce thin output. Requires `ANTHROPIC_API_KEY`.

## Arguments

Path to PDF file: $ARGUMENTS

## Steps

### 1 — Verify the script exists

Check that `src/tools/parse_pdf.py` is present. If it is missing, stop and
tell the user: "parse_pdf.py not found — ensure the file exists at src/tools/parse_pdf.py."

### 2 — Ensure dependencies are installed

Run:

```bash
pip show pdfminer.six pypdfium2 pytesseract Pillow anthropic 2>&1
```

If any package is missing from the output, install them:

```bash
pip install -r src/tools/requirements.txt
```

Report any installation errors and stop if installation fails.

Check that the Tesseract OCR engine is installed (required for Stage 2):

```bash
tesseract --version 2>&1 | head -1
```

If Tesseract is not found, warn the user:
- Stage 2 will be skipped automatically.
- Stage 3 (Claude Vision) will be the fallback — it requires `ANTHROPIC_API_KEY`.
- To enable Stage 2: `brew install tesseract` (macOS) or `apt-get install tesseract-ocr` (Linux).

### 3 — Run the parser

```bash
python3 src/tools/parse_pdf.py "$ARGUMENTS" raw/
```

- Progress messages (which stage ran, page counts, avg chars/words) go to stderr — visible in the terminal.
- The saved filepath is printed to **stdout** — capture it.
- Stage selection is automatic; no flags needed.

### 4 — Handle errors

- Non-zero exit code → report the stderr output and stop; do not continue to the ingest workflow.
- `ANTHROPIC_API_KEY not set` → tell the user to export the key and retry, or install Tesseract so Stage 2 runs instead.
- `pypdfium2 not installed` warning → note that Stages 2 and 3 page rendering will be skipped; only Stage 1 text extraction will run.
- `Tesseract engine not found` → Stage 2 is skipped automatically; Stage 3 will run if needed.

### 5 — Report and return

Tell the user: "Saved `<filepath>` (via <stage-name>). Proceeding with ingest."

Return the captured filepath so the calling ingest workflow uses it as the
source file.
