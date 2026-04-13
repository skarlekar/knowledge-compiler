#!/usr/bin/env python3
"""
Fetch a URL and convert HTML to Markdown, downloading images locally.

Usage:
    python3 fetch_md.py <url> [raw-dir]

    raw-dir  Directory to write output into (default: ./raw)

Output:
    Writes <raw-dir>/<slug>.md  — Markdown conversion of the page
    Writes <raw-dir>/images/<slug>/  — downloaded images, referenced by relative paths
    Prints the saved filepath to stdout so the caller can capture it.
    Progress and warnings go to stderr.

Dependencies:
    markdownify>=0.13.0   (pip install markdownify)
    beautifulsoup4>=4.12.0  (pip install beautifulsoup4)
    html2text is used as a fallback if markdownify is not installed.
"""

import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path


# ---------------------------------------------------------------------------
# URL / slug helpers
# ---------------------------------------------------------------------------

def derive_slug(url: str) -> str:
    """Return a filesystem-safe slug derived from the URL."""
    parsed = urllib.parse.urlparse(url)
    segments = [p for p in parsed.path.split("/") if p]
    if segments:
        name = segments[-1]
        name = re.sub(r"\.[a-zA-Z0-9]+$", "", name)   # strip extension
    else:
        name = parsed.netloc
    name = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return name or "page"


def resolve_url(src: str, base_url: str) -> str:
    """Resolve a potentially relative src against the page base URL."""
    return urllib.parse.urljoin(base_url, src)


def safe_image_filename(src_url: str, index: int) -> str:
    """Return a safe local filename for a downloaded image."""
    path = urllib.parse.urlparse(src_url).path
    filename = path.split("/")[-1] if "/" in path else path
    filename = re.sub(r"[^a-zA-Z0-9._-]", "-", filename)
    if not filename or "." not in filename:
        filename = f"img-{index:03d}.bin"
    return filename


# ---------------------------------------------------------------------------
# Network helpers
# ---------------------------------------------------------------------------

_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; url-to-markdown/1.0)"}


def fetch_html(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def fetch_bytes(url: str, timeout: int = 10) -> bytes:
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


# ---------------------------------------------------------------------------
# Image download + src rewrite
# ---------------------------------------------------------------------------

def download_images(soup, base_url: str, images_dir: Path, relative_prefix: str) -> int:
    """
    For every <img src="..."> in soup:
      - resolve the src to an absolute URL
      - download the image to images_dir
      - rewrite img['src'] to relative_prefix/<filename>

    Returns the number of images successfully downloaded.
    Skips data-URI images (already embedded). Logs warnings for failures.
    """
    images_dir.mkdir(parents=True, exist_ok=True)
    downloaded = 0
    seen_names: set[str] = set()

    for i, img in enumerate(soup.find_all("img", src=True)):
        src: str = img["src"]

        if src.startswith("data:"):
            continue                        # already embedded; leave as-is

        abs_url = resolve_url(src, base_url)
        local_name = safe_image_filename(abs_url, i)

        # Deduplicate filenames within this page
        stem, suffix = os.path.splitext(local_name)
        candidate = local_name
        counter = 1
        while candidate in seen_names:
            candidate = f"{stem}-{counter}{suffix}"
            counter += 1
        local_name = candidate
        seen_names.add(local_name)

        try:
            data = fetch_bytes(abs_url)
            (images_dir / local_name).write_bytes(data)
            img["src"] = f"{relative_prefix}/{local_name}"
            downloaded += 1
        except Exception as exc:
            print(f"  Warning: could not download {abs_url}: {exc}", file=sys.stderr)

    return downloaded


# ---------------------------------------------------------------------------
# HTML cleaning
# ---------------------------------------------------------------------------

def strip_boilerplate(soup) -> None:
    """Remove non-content elements from the parsed tree in-place."""
    for tag in soup.find_all(["script", "style", "nav", "header", "footer", "aside"]):
        tag.decompose()


# ---------------------------------------------------------------------------
# Markdown conversion
# ---------------------------------------------------------------------------

def convert_to_markdown(html_str: str) -> str:
    """Convert an HTML string to Markdown. Tries markdownify, falls back to html2text."""
    try:
        from markdownify import markdownify as md
        return md(
            html_str,
            heading_style="ATX",
            strip=["script", "style", "nav", "footer", "header", "aside"],
        )
    except ImportError:
        pass

    try:
        import html2text
        h = html2text.HTML2Text()
        h.ignore_images = False
        h.ignore_links = False
        h.body_width = 0
        return h.handle(html_str)
    except ImportError:
        pass

    sys.exit(
        "Error: no Markdown converter found.\n"
        "Run: pip install -r src/tools/requirements.txt"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Usage: fetch_md.py <url> [raw-dir]")

    url = sys.argv[1]
    raw_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("raw")
    raw_dir.mkdir(parents=True, exist_ok=True)

    slug = derive_slug(url)
    out_path = raw_dir / f"{slug}.md"

    # --- Fetch ---
    print(f"Fetching {url} ...", file=sys.stderr)
    html = fetch_html(url)

    # --- Parse, download images, strip boilerplate ---
    try:
        from bs4 import BeautifulSoup

        soup = BeautifulSoup(html, "html.parser")

        images_dir = raw_dir / "images" / slug
        relative_prefix = f"images/{slug}"
        print(f"Downloading images to {images_dir} ...", file=sys.stderr)
        n = download_images(soup, url, images_dir, relative_prefix)
        print(f"  {n} image(s) downloaded", file=sys.stderr)

        strip_boilerplate(soup)
        html_for_conversion = str(soup)

    except ImportError:
        print(
            "Warning: beautifulsoup4 not installed; images will retain original URLs.",
            file=sys.stderr,
        )
        html_for_conversion = html

    # --- Convert ---
    print("Converting to Markdown ...", file=sys.stderr)
    markdown = convert_to_markdown(html_for_conversion)

    # --- Write ---
    out_path.write_text(markdown, encoding="utf-8")
    print(f"Saved: {out_path}", file=sys.stderr)

    # Stdout: the path Claude captures for the ingest workflow
    print(str(out_path))


if __name__ == "__main__":
    main()
