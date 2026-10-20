# Ratio

A case study app for Indian law students. Install it on your phone from **https://vedanth12.github.io/ratio/**.

- **New**: Supreme Court and High Court judgments, added daily, each with a one-line principle.
- **Library**: landmark cases by subject, plus the BITS Law syllabus reading lists by course and topic.
- **Quiz**: match principles, citations and topics to cases.
- **Me**: progress, your own cases, and backup/restore of your notes.

Briefs, saved cases and progress stay on your device (browser storage). Principles are short study aids written in plain words, not headnotes. Read the judgment before citing it.

## Files
- `data/cases.json` — landmark cases and new judgments (updated daily, see `UPDATING.md`)
- `data/syllabus.json` — course reading lists
- `scripts/add_cases.py` — merge new cases with duplicate checking
- `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` — the app
