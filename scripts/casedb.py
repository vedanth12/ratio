"""Shared helpers for reading, validating and merging data/cases.json."""
import json, os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, "data", "cases.json")
REQUIRED = ("name", "subjects", "tag", "kind")
KINDS = ("landmark", "new", "syllabus")

def norm(s):
    s = re.sub(r"\(.*?\)|\[.*?\]", "", s.lower())
    s = s.replace(" vs. ", " v. ").replace(" vs ", " v. ")
    return re.sub(r"[^a-z]", "", s)[:70]

def load():
    if os.path.exists(PATH):
        with open(PATH, encoding="utf-8") as f:
            return json.load(f)
    return {"updated": None, "cases": []}

def save(db):
    db["updated"] = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat(timespec="minutes")
    db["cases"].sort(key=lambda c: (c["kind"] != "new", c.get("date") or "", c.get("year") or 0), reverse=False)
    news = [c for c in db["cases"] if c["kind"] == "new"]
    news.sort(key=lambda c: c.get("date") or "", reverse=True)
    rest = [c for c in db["cases"] if c["kind"] != "new"]
    db["cases"] = news + rest
    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=0, separators=(",", ":"))
        f.write("\n")

def validate(c):
    for k in REQUIRED:
        if not c.get(k):
            raise ValueError(f"missing {k}: {c}")
    if c["kind"] not in KINDS:
        raise ValueError(f"bad kind {c['kind']}")
    if not isinstance(c["subjects"], list):
        raise ValueError("subjects must be a list")
    if len(c["tag"]) > 220:
        raise ValueError(f"principle too long ({len(c['tag'])} chars): {c['name']}")

def add(db, c):
    """Add a case unless it already exists. Returns True if added."""
    validate(c)
    key = norm(c["name"]) + "|" + re.sub(r"\s", "", (c.get("cite") or "").lower())
    for x in db["cases"]:
        same_name = norm(x["name"]) == norm(c["name"])
        same_cite = c.get("cite") and x.get("cite") and re.sub(r"\s", "", x["cite"].lower()) == re.sub(r"\s", "", c["cite"].lower())
        if same_name and (same_cite or not c.get("cite") or not x.get("cite")):
            # merge subjects, keep the richer record
            for s in c["subjects"]:
                if s not in x["subjects"]:
                    x["subjects"].append(s)
            return False
    c.setdefault("id", re.sub(r"[^a-z0-9]+", "-", (c["name"][:50] + "-" + str(c.get("year") or c.get("date") or "")).lower()).strip("-"))
    c.setdefault("added", datetime.date.today().isoformat())
    db["cases"].append(c)
    return True
