"""Build the self-contained HTML edition of the white paper.

Usage: python docs/whitepaper/build_html.py
Reads aegis-vetting-at-mission-speed.md, inlines every image as a data URI,
turns bare source URLs into clickable links, and writes the .html beside it.
Requires: pip install markdown
"""
import base64
import mimetypes
import re
from pathlib import Path

import markdown

HERE = Path(__file__).resolve().parent
MD = HERE / "aegis-vetting-at-mission-speed.md"
OUT = HERE / "aegis-vetting-at-mission-speed.html"

CSS = """
:root { --navy:#002D5B; --gold:#D4AF37; --gold-dark:#8a6d1d; --teal:#00707F;
  --ink:#1b2733; --muted:#5b6b7b; --line:#e2e8f0; --wash:#f6f8fa; }
* { box-sizing: border-box; }
body { margin:0; padding:0; background:#fff; color:var(--ink);
  font:17px/1.65 'Georgia', 'Times New Roman', serif; }
.page { max-width: 880px; margin: 0 auto; padding: 48px 32px 96px; }
h1,h2,h3,h4 { font-family:'Helvetica Neue', Arial, sans-serif; color:var(--navy);
  line-height:1.25; }
h1 { font-size:44px; margin:24px 0 8px; letter-spacing:-0.5px; }
h1 + h3 { color:var(--muted); font-weight:500; font-size:22px; margin-top:0; }
h2 { font-size:28px; margin-top:56px; padding-top:18px; border-top:3px solid var(--gold); }
h3 { font-size:20px; margin-top:32px; }
p { margin: 14px 0; }
a { color:var(--teal); }
strong { color:var(--navy); }
blockquote { margin:28px 0; padding:8px 28px; background:var(--wash);
  border-left:5px solid var(--gold); }
blockquote p { margin:12px 0; font-family:'Helvetica Neue', Arial, sans-serif;
  font-size:17px; }
table { border-collapse:collapse; width:100%; margin:22px 0;
  font-family:'Helvetica Neue', Arial, sans-serif; font-size:15px; }
th { background:var(--navy); color:#fff; text-align:left; padding:10px 12px; }
td { border-bottom:1px solid var(--line); padding:10px 12px; vertical-align:top; }
tr:nth-child(even) td { background:var(--wash); }
img { max-width:100%; height:auto; border:1px solid var(--line); border-radius:8px;
  box-shadow:0 6px 24px rgba(0,45,91,.12); margin:26px 0 6px; }
em { color:var(--muted); }
p em:first-child { font-size:14.5px; font-family:'Helvetica Neue', Arial, sans-serif; }
hr { border:none; border-top:1px solid var(--line); margin:42px 0; }
ol, ul { padding-left: 26px; }
li { margin: 8px 0; }
li a { word-break: break-all; }
h2:first-of-type { border-top:none; }
@media print {
  .page { padding: 0.4in 0.2in; max-width:none; }
  h2 { break-after: avoid; }
  img { break-inside: avoid; box-shadow:none; }
  blockquote, table { break-inside: avoid; }
}
@media (max-width: 640px) {
  body { font-size:16px; }
  h1 { font-size:32px; }
  .page { padding: 24px 16px 64px; }
  table { display:block; overflow-x:auto; }
}
"""


def inline_image(match: re.Match) -> str:
    src = match.group(1)
    mime = mimetypes.guess_type(src)[0] or "image/jpeg"
    data = base64.b64encode((HERE / src).read_bytes()).decode()
    return f'src="data:{mime};base64,{data}"'


def linkify(match: re.Match) -> str:
    url = match.group(1)
    return f'<a href="{url}">{url}</a>'


def main() -> None:
    body = markdown.markdown(MD.read_text(encoding="utf-8"),
                             extensions=["tables", "attr_list"])
    body = re.sub(r'src="(img/[^"]+)"', inline_image, body)
    # Bare source URLs (the endnotes) become clickable; URLs already inside an
    # href (preceded by a quote) are left alone.
    body = re.sub(r'(?<!")(https?://[^\s<"]+)', linkify, body)
    html = (
        '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>Vetting at Mission Speed - Aegis White Paper</title>\n"
        f"<style>{CSS}</style></head>\n"
        f'<body><div class="page">{body}</div></body></html>'
    )
    OUT.write_text(html, encoding="utf-8")
    print(f"wrote {OUT.name}: {OUT.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
