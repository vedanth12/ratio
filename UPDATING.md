# Daily case update — instructions

This file is the procedure the daily scheduled task follows. It keeps `data/cases.json` current.

## What to add each run

1. **New Supreme Court judgments** delivered since the last run. Find them through LiveLaw's Supreme Court daily and weekly round-ups, SCC Online Blog's weekly developments, Verdictum, Bar & Bench, and sci.gov.in. Add every *reportable* judgment that decides a point of law. Skip adjournments, notices, listing orders and pure fact appreciation with no principle.
2. **Important High Court rulings** (Bombay, Delhi, Madras, Karnataka, Allahabad, Kerala, Gujarat, Calcutta and others) that state a clear legal principle. Aim for 3–8 a day, not every order.
3. **Landmark cases**: add 5 well-known landmark cases a day, rotating subjects in this order: Constitutional Law, Criminal Law, Criminal Procedure, Evidence, Civil Procedure, Contract, Torts, Family Law, Property Law, Administrative Law, Company Law, Arbitration, Intellectual Property, Labour Law, Environmental Law, Jurisprudence, Tax Law, Insolvency. Check `data/cases.json` first and never repeat a case.

## How to write each case

Write a JSON list to a temp file and run `python3 scripts/add_cases.py that_file.json`. Each object:

```json
{"name":"Party v. Party","cite":"2026 LiveLaw (SC) 1040","date":"2026-10-15","court":"Supreme Court of India",
 "bench":"X, Y JJ","subjects":["Criminal Procedure"],"topic":"Bail",
 "tag":"One line, in your own words, stating what the court held (max 220 chars)",
 "source":"https://link-to-the-report-you-used","kind":"new"}
```

- `kind` is `"new"` for recent judgments and `"landmark"` for older landmark cases (landmark: use `year` instead of `date`, and `source` is optional).
- If only the week is known, set `date` to the last day of that week and add `"reported":"Week of 5–11 Oct 2026"`.
- Use statute references under the new codes where they apply (BNS, BNSS, BSA) and mention the old IPC/CrPC/Evidence Act section when the case was decided under it.
- **Never copy headnotes or paragraphs** from SCC, Manupatra, LiveLaw or any other source. Write the principle yourself. No quotation longer than a few words.
- **Only add what you could verify** in a source you actually read in this run. If the citation, bench or date is unclear, leave that field out rather than guess. Do not invent citations.
- Keep subject names consistent with those already in `data/cases.json`.

## Finish

1. Run `python3 -c "import json;json.load(open('data/cases.json'))"` to check the file is valid.
2. Commit with a message like `Add 9 SC, 4 HC, 5 landmark cases (20 Oct 2026)` and push to `main`. GitHub Pages publishes the update within a minute or two.
3. If nothing new was found, do not commit.
