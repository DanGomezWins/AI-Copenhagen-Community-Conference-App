"""
Extracts speaker pages from the conference deck into structured JSON.

The deck uses font weight to mark structure, which is far more reliable than
guessing from punctuation:

    17pt Inter-ExtraBold  name, job title, organisation
    13pt Inter-Bold       the TALK TITLE  ("Keynote: Donkeycorns & Refounders.")
     9-10pt Inter-Light   prose - bio before the title, talk description after
     5pt Inter-Bold       the running page header, ignored

Writes Assets/speakers-pdf.json. Run before scripts/parse-speakers.mts.

    python3 scripts/extract-speakers-pdf.py
"""

import io
import json
import sys

import pdfplumber

sys.stdout.reconfigure(encoding="utf-8")

PDF = "Assets/AIMC Community Conference speakers & topics 2026.pdf"
OUT = "Assets/speakers-pdf.json"
PAGE_HEADER = "AI Meetup Copenhagen Community Conference #1"

HEADER_PT = 15.0   # anything at or above this is the name/title/org block
TITLE_PT = 12.0    # the talk title sits between TITLE_PT and HEADER_PT
RUNNING_PT = 7.0   # below this is the running page header


def lines_with_size(page):
    """Group words into lines, each tagged with its largest font size."""
    words = page.extract_words(extra_attrs=["size", "fontname"])
    rows = {}
    for w in words:
        key = round(w["top"])
        # Lines wobble by a pixel; snap to the nearest existing row.
        match = next((k for k in rows if abs(k - key) <= 3), key)
        rows.setdefault(match, []).append(w)

    out = []
    for top in sorted(rows):
        ws = sorted(rows[top], key=lambda w: w["x0"])
        text = " ".join(w["text"] for w in ws).strip()
        size = max(w["size"] for w in ws)
        bold = any("Bold" in w["fontname"] for w in ws)
        if text and text != PAGE_HEADER:
            out.append({"text": text, "size": size, "bold": bold})
    return out


speakers = []

with pdfplumber.open(PDF) as pdf:
    for page in pdf.pages:
        lines = [l for l in lines_with_size(page) if l["size"] >= RUNNING_PT]
        if not lines:
            continue

        header = [l["text"] for l in lines if l["size"] >= HEADER_PT]
        if not header:
            continue  # a cover or divider page

        header_text = " ".join(header).strip().rstrip(",")
        parts = [p.strip() for p in header_text.split(",") if p.strip()]
        name = parts[0] if parts else ""
        if not name:
            continue

        job_title = ", ".join(parts[1:-1]) if len(parts) > 2 else (parts[1] if len(parts) == 2 else None)
        company = parts[-1] if len(parts) > 2 else None

        # The talk title is the one line set in the mid-weight bold face.
        title_idx = next(
            (i for i, l in enumerate(lines)
             if TITLE_PT <= l["size"] < HEADER_PT and l["bold"]),
            None,
        )

        body = [l for l in lines if l["size"] < TITLE_PT]

        if title_idx is None:
            talk_title = None
            bio = " ".join(l["text"] for l in body).strip()
            talk_body = ""
        else:
            talk_title = lines[title_idx]["text"].strip().rstrip(".")
            before = [l["text"] for l in lines[:title_idx] if l["size"] < TITLE_PT]
            after = [l["text"] for l in lines[title_idx + 1:] if l["size"] < TITLE_PT]
            bio = " ".join(before).strip()
            talk_body = " ".join(after).strip()

        speakers.append({
            "name": name,
            "title": job_title,
            "company": company,
            "talk_title": talk_title or None,
            "talk_description": talk_body or None,
            "bio": bio or None,
        })

# Two speakers run onto a second page - bio on one, the talk on the next - and
# so appear twice. Merge consecutive entries sharing a name rather than leaving
# two half-empty records.
merged = []
for s in speakers:
    if merged and merged[-1]["name"] == s["name"]:
        prev = merged[-1]
        prev["talk_title"] = prev["talk_title"] or s["talk_title"]
        prev["talk_description"] = (
            " ".join(x for x in [prev["talk_description"], s["talk_description"]] if x)
            or None
        )
        prev["bio"] = " ".join(x for x in [prev["bio"], s["bio"]] if x) or None
        prev["title"] = prev["title"] or s["title"]
        prev["company"] = prev["company"] or s["company"]
        continue
    merged.append(s)
speakers = merged

io.open(OUT, "w", encoding="utf-8", newline="\n").write(
    json.dumps(speakers, indent=2, ensure_ascii=False) + "\n"
)

print(f"{len(speakers)} speaker pages -> {OUT}\n")
print(f"{'NAME':26} {'TALK TITLE':46} BIO  DESC")
for s in speakers:
    print(
        f"  {(s['name'] or '')[:24]:24} "
        f"{(s['talk_title'] or '— none —')[:44]:46} "
        f"{'y' if s['bio'] else '-':3}  {'y' if s['talk_description'] else '-'}"
    )
missing = [s["name"] for s in speakers if not s["talk_title"]]
if missing:
    print(f"\nno talk title on the page for: {', '.join(missing)}")
