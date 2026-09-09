"""Build the public setup desk and readable guides, then check all local links.

Usage: pip install -r tools/site/requirements.txt && python tools/build_site.py
The output directory must be empty. Only the explicit public asset set is copied.
"""
from __future__ import annotations

import argparse
import html
from html.parser import HTMLParser
from pathlib import Path
import posixpath
import re
import shutil
from urllib.parse import quote, unquote, urlsplit, urlunsplit

import markdown

ROOT = Path(__file__).resolve().parents[1]
REPO_URL = "https://github.com/JakeTheRabbit/TDR-Sensor"
SETUP = ROOT / "tools/setup"
ATTR = re.compile(r'\b(href|src)=([\"\'])(.*?)\2', re.IGNORECASE)
GUIDE_ORDER = (
    "SUBSTRATES", "PLACEMENT", "CALIBRATION", "CONFIG", "WIRING", "SENSORS",
    "FLASHING", "HOMEASSISTANT", "TROUBLESHOOTING", "MIGRATION-v3", "SOURCES", "VALIDATION",
)


def destinations() -> dict[Path, str]:
    files = {SETUP / name: name for name in (
        "index.html", "style.css", "app.js", "calculator.js", "substrates.js", "favicon.svg",
        "units.js", "wizard.js", "diagrams.js",
    )}
    files[ROOT / "tools/site/guides.css"] = "guides.css"
    for path in (ROOT / "docs").glob("*.md"):
        files[path] = f"guides/{path.stem.lower()}.html"
    for folder in ("img", "print"):
        for path in (ROOT / "docs" / folder).iterdir():
            if path.suffix.lower() in (".svg", ".pdf", ".png", ".jpg"):
                files[path] = path.relative_to(ROOT).as_posix()
    return {path.resolve(): output for path, output in files.items()}


def rewrite_links(content: str, source: Path, output: str, files: dict[Path, str]) -> str:
    def replace(match: re.Match) -> str:
        url = urlsplit(html.unescape(match[3]))
        if url.scheme or url.netloc or not url.path:
            return match[0]
        target = (source.parent / unquote(url.path)).resolve()
        if target in files:
            path = posixpath.relpath(files[target], posixpath.dirname(output) or ".")
        elif target.is_file() and target.is_relative_to(ROOT):
            path = REPO_URL + "/blob/main/" + quote(target.relative_to(ROOT).as_posix())
        else:
            raise ValueError(f"Unknown source link in {source}: {url.path}")
        rewritten = urlunsplit(("", "", path, url.query, url.fragment))
        return f'{match[1]}="{html.escape(rewritten, quote=True)}"'
    return ATTR.sub(replace, content)


def guide_page(title: str, content: str, source: str | None = None) -> str:
    source_link = (f' · <a href="{REPO_URL}/blob/main/{source}">View source</a>' if source else "")
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)} · TDR Sensor</title>
<link rel="icon" href="../favicon.svg">
<link rel="stylesheet" href="../style.css"><link rel="stylesheet" href="../guides.css">
</head><body class="guide"><header>
<div class="brand">TDR Sensor <span>Field guides</span></div>
<h1>{html.escape(title)}</h1>
<nav aria-label="Main navigation"><a href="../index.html">Setup calculator</a>
<a href="index.html">All guides</a><a href="{REPO_URL}">GitHub repository ↗</a></nav>
</header><main><article class="guide-content">{content}</article>
<footer><a href="../index.html">Back to the setup desk</a>{source_link}</footer>
</main></body></html>'''


class Links(HTMLParser):
    def __init__(self, text: str):
        super().__init__(convert_charrefs=True)
        self.urls: list[str] = []
        self.ids: set[str] = set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("src", "href") and value:
                self.urls.append(value)
            if key == "id" and value:
                self.ids.add(value)


def validate_site(output: Path) -> int:
    pages = {path: Links(path.read_text(encoding="utf-8")) for path in output.rglob("*.html")}
    checked = 0
    for path, page in pages.items():
        for link in page.urls:
            url = urlsplit(link)
            if url.scheme or url.netloc:
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if not target.is_relative_to(output):
                raise ValueError(f"Link escapes site: {path} -> {link}")
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                raise ValueError(f"Missing site link: {path} -> {link}")
            if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                raise ValueError(f"Missing heading: {path} -> {link}")
            checked += 1
    return checked


def build(output: Path) -> None:
    if output.exists() and any(output.iterdir()):
        raise ValueError(f"Output must be empty: {output}")
    output.mkdir(parents=True, exist_ok=True)
    files = destinations()
    titles = {}
    for source, destination in files.items():
        target = output / destination
        target.parent.mkdir(parents=True, exist_ok=True)
        if source.suffix == ".md":
            text = source.read_text(encoding="utf-8")
            first, body = text.split("\n", 1)
            title = first.lstrip("# ").strip()
            titles[source.stem] = title
            content = markdown.markdown(body, extensions=["extra", "toc"])
            content = rewrite_links(content, source, destination, files)
            target.write_text(guide_page(title, content, source.relative_to(ROOT).as_posix()), encoding="utf-8")
        elif source == SETUP / "index.html":
            content = rewrite_links(source.read_text(encoding="utf-8"), source, destination, files)
            content = content.replace("<!-- ONLINE_GUIDES -->", '<a href="guides/index.html">All guides</a>')
            target.write_text(content, encoding="utf-8")
        else:
            shutil.copyfile(source, target)
    order = list(GUIDE_ORDER) + sorted(set(titles) - set(GUIDE_ORDER))
    entries = "\n".join(
        f'<li><a href="{name.lower()}.html">{html.escape(titles[name])}</a></li>' for name in order if name in titles
    )
    (output / "guides/index.html").write_text(guide_page("Setup & field guides", f'<ul class="guide-list">{entries}</ul>'), encoding="utf-8")
    (output / ".nojekyll").write_text("", encoding="utf-8")
    checked = validate_site(output)
    print(f"Built {len(list(output.rglob('*.*')))} public files; checked {checked} local links and anchors.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "_site")
    build(parser.parse_args().output.resolve())
