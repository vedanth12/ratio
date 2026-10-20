"""Merge new cases into data/cases.json.
Usage: python3 scripts/add_cases.py new_cases.json
The input is a JSON list of case objects:
  name (str), cite (str, optional), date (YYYY-MM-DD, for new judgments), year (int),
  court (str), bench (str, optional), subjects (list), topic (str),
  tag (one-line principle in your own words, <=220 chars), source (URL), kind ("new" or "landmark")
Prints how many were added and skipped as duplicates.
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from casedb import load, save, add

def main(path):
    items = json.load(open(path, encoding="utf-8"))
    db = load()
    added = skipped = 0
    for c in items:
        if c.get("date") and not c.get("year"):
            c["year"] = int(c["date"][:4])
        if add(db, c): added += 1
        else: skipped += 1
    save(db)
    print(f"added {added}, skipped {skipped} duplicates, total {len(db['cases'])}")

if __name__ == "__main__":
    main(sys.argv[1])
