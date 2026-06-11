#!/usr/bin/env python3
"""Upsert a curriculum (app/curricula/) into a LIVE server over the HTTP API.
Idempotent: units match by (parent, title), skills by name within the program;
existing rows are updated in place (descriptions, content, types, positions)
and re-parented if the tree moved. Nothing is deleted - learner mastery on
existing skills is preserved, and new skills reach enrolled learners
automatically.

Usage:
  TUTOR_URL=http://localhost:8000 TUTOR_API_KEY=... \
    python scripts/push_curriculum.py [--program-id N] [--module alevel_maths_uk]
"""
import argparse
import importlib
import os
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

BASE = os.environ.get("TUTOR_URL", "http://localhost:8000").rstrip("/")
KEY = os.environ.get("TUTOR_API_KEY", "")
H = {"X-API-Key": KEY} if KEY else {}


def api(method: str, path: str, **kwargs):
    r = httpx.request(method, f"{BASE}{path}", headers=H, timeout=30, **kwargs)
    r.raise_for_status()
    return r.json()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--module", default="alevel_maths_uk")
    ap.add_argument("--program-id", type=int, default=None,
                    help="enrich this program; default: match by title, else create")
    args = ap.parse_args()
    cur = importlib.import_module(f"app.curricula.{args.module}")

    programs = api("GET", "/programs")
    prog = None
    if args.program_id:
        prog = next((p for p in programs if p["id"] == args.program_id), None)
        if not prog:
            sys.exit(f"program {args.program_id} not found")
    else:
        prog = next((p for p in programs
                     if p["title"] == cur.PROGRAM["title"] and p["owner_id"] is None), None)
    if prog:
        api("PATCH", f"/programs/{prog['id']}", json=cur.PROGRAM)
        print(f"updated program {prog['id']}: {cur.PROGRAM['title']}")
    else:
        prog = api("POST", "/programs", json={**cur.PROGRAM, "owner_id": None})
        print(f"created program {prog['id']}: {cur.PROGRAM['title']}")
    pid = prog["id"]

    # index what's already there
    def walk(nodes, parent_id, acc):
        for n in nodes:
            acc[(parent_id, n["title"])] = n
            walk(n.get("children", []), n["id"], acc)
    existing_units: dict = {}
    walk(api("GET", f"/programs/{pid}/tree"), None, existing_units)
    existing_skills = {s["name"]: s for s in api("GET", f"/programs/{pid}/skills")}

    stats = {"units+": 0, "units~": 0, "skills+": 0, "skills~": 0}

    def upsert(nodes, parent_id):
        for pos, node in enumerate(nodes):
            found = existing_units.get((parent_id, node["title"]))
            payload = {"title": node["title"], "content": node.get("content", ""),
                       "position": pos}
            if found:
                api("PATCH", f"/units/{found['id']}", json=payload)
                unit_id = found["id"]
                stats["units~"] += 1
            else:
                made = api("POST", "/units", json={
                    "program_id": pid, "parent_id": parent_id, **payload})
                unit_id = made["id"]
                stats["units+"] += 1
            for spos, sk in enumerate(node.get("skills", [])):
                spayload = {**sk, "position": spos, "unit_id": unit_id}
                old = existing_skills.get(sk["name"])
                if old:
                    api("PATCH", f"/skills/{old['id']}", json=spayload)
                    stats["skills~"] += 1
                else:
                    api("POST", "/skills", json={"program_id": pid, **spayload})
                    stats["skills+"] += 1
            upsert(node.get("children", []), unit_id)

    upsert(cur.TREE, None)
    print(f"done: {stats}")
    skills = api("GET", f"/programs/{pid}/skills")
    print(f"program {pid} now has {len(skills)} skills")


if __name__ == "__main__":
    main()
