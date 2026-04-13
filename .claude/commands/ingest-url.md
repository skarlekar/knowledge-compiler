---
name: ingest-url
description: Fetch a URL, convert its HTML to Markdown with images downloaded locally, and save to raw/. Use this before the ingest workflow whenever the source is a URL.
argument-hint: <url>
allowed-tools: [Bash, Read]
---

# ingest-url

Convert a remote URL to a local Markdown file in `raw/` so the standard
Knowledge Compiler ingest workflow can proceed against a local file.

Runs `src/tools/fetch_md.py` — pure local Python, no MCP, no API calls.
Images are downloaded to `raw/images/<slug>/` and referenced with relative paths.

## Arguments

URL to fetch: $ARGUMENTS

## Steps

### 1 — Verify the script exists

Check that `src/tools/fetch_md.py` is present. If it is missing, stop and
tell the user: "fetch_md.py not found — ensure the file exists at src/tools/fetch_md.py."

### 2 — Ensure dependencies are installed

Run:

```bash
pip show markdownify beautifulsoup4 2>&1
```

If either package is missing from the output, install them:

```bash
pip install -r src/tools/requirements.txt
```

Report any installation errors and stop if installation fails.

### 3 — Run the converter

```bash
python3 src/tools/fetch_md.py "$ARGUMENTS" raw/
```

- Progress messages go to stderr (visible in the terminal).
- The saved filepath is printed to **stdout** — capture it.

### 4 — Handle errors

- Non-zero exit code → report the stderr output and stop; do not continue
  to the ingest workflow.
- Image download warnings in stderr are non-fatal — note them in your
  ingest summary but continue.

### 5 — Report and return

Tell the user: "Saved `<filepath>`. Proceeding with ingest."

Return the captured filepath so the calling ingest workflow uses it as the
source file instead of the original URL.
