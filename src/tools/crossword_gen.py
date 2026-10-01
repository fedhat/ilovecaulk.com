"""
Caulk crossword generator + validator.

Places each puzzle's words into a connected criss-cross grid, numbers it in
standard crossword order, validates it, and writes assets/js/crossword-data.js.

Validation guarantees:
  * every crossing cell agrees on its letter
  * every maximal horizontal/vertical run of 2+ letters is exactly one entry
    (so no accidental "words" are formed by adjacent letters)
  * every entry is placed exactly once and the grid is a single connected piece
  * numbering matches the standard rule (a cell is numbered if it starts an
    across or down entry, scanning rows top-to-bottom, left-to-right)

Run:  python3 src/tools/crossword_gen.py
"""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "js" / "crossword-data.js"

PUZZLES = {
    "apprentice": {
        "title": "Apprentice",
        "blurb": "A friendly warm-up. If you've ever held a caulk gun, you've got this.",
        "seed": 11,
        "words": [
            ("SILICONE", "Waterproof caulk that won't take paint"),
            ("CAULK", "Flexible filler for gaps, and the love of our lives"),
            ("BEAD", "A continuous line of caulk"),
            ("NOZZLE", "Tip you cut at an angle before you start"),
            ("GROUT", "Rigid filler between tiles, often confused with caulk"),
            ("DRAFT", "Chilly air sneaking in around a window"),
            ("PAINT", "Acrylic latex can take it; silicone can't"),
            ("MOLD", "Black spots on tired shower caulk, often"),
            ("CURE", "Harden fully after application"),
            ("TAPE", "Painter's ___, for crisp, straight caulk lines"),
            ("WINDOW", "A drafty one is basically a polite hole in your wall"),
            ("SINK", "Kitchen fixture that gets a silicone perimeter"),
            ("CRACK", "\"A caulk for every ___\""),
            ("GUN", "Tool with a trigger that pushes caulk out of the tube"),
            ("TUB", "Bathroom fixture whose edge is a caulker's proving ground"),
            ("GAP", "What a caulk fills"),
        ],
    },
    "master": {
        "title": "Master",
        "blurb": "For people who own more than one caulk gun. Some clues are puns. We're sorry. We're not sorry.",
        "seed": 7,
        "words": [
            ("POLYURETHANE", "Tough, paintable sealant for concrete joints and siding"),
            ("ELASTOMERIC", "Very stretchy, as a good exterior siding sealant should be"),
            ("BACKERROD", "Foam \"noodle\" pushed into a deep joint before caulking"),
            ("HOURGLASS", "Ideal cross-section of a properly tooled joint: thin in the middle"),
            ("CARTRIDGE", "Standard 10.1-ounce caulk package"),
            ("FLASHING", "Metal that steers water away from roof penetrations"),
            ("DRIPLESS", "Kind of gun that relieves pressure when you let go of the trigger"),
            ("ADHESION", "Sealant's grip on the surfaces it touches"),
            ("COHESION", "Sealant's own internal strength, holding itself together"),
            ("SUBSTRATE", "The surface a sealant bonds to"),
            ("TOOLING", "Smoothing a fresh bead with a finger or spatula"),
            ("ACRYLIC", "___ latex: the paintable interior workhorse"),
            ("OAKUM", "Tarred fiber once hammered into wooden ship seams"),
            ("BUTYL", "Sticky rubber sealant beloved by gutters and RVs"),
            ("PUTTY", "Old-school window glazing compound"),
            ("JOINT", "Where two materials meet, and where the caulk goes"),
            ("MILDEW", "Bathroom fungus that a mildewcide keeps at bay"),
            ("GUTTER", "Rain channel whose seams need a sealant that loves metal"),
            ("PRIMER", "Pre-coat that helps some sealants stick to porous surfaces"),
            ("SHRINK", "What latex caulk does a little as its water evaporates"),
            ("HYBRID", "MS polymer, to its friends"),
            ("DEVIL", "Hard-to-reach ship seam in a disputed story behind \"the ___ to pay\""),
            ("SKIN", "Thin film that forms on caulk before it fully cures"),
            ("ANGLE", "Cut the nozzle at a 45-degree one"),
            ("SEAM", "Line where two pieces meet"),
            ("RTV", "Kind of silicone that cures at room temperature (abbr.)"),
        ],
    },
}


def place_words(words, rng):
    """Greedy randomized placement. Returns list of (word, row, col, dir) or None."""
    grid = {}          # (r, c) -> letter
    used_dir = {}      # (r, c) -> set of directions occupying the cell
    placed = []
    order = sorted(words, key=lambda w: -len(w[0]))
    # Keep the longest word first; lightly shuffle the rest for variety.
    head, rest = order[0], order[1:]
    rng.shuffle(rest)
    rest.sort(key=lambda w: -len(w[0]) + rng.random() * 4)
    order = [head] + rest

    def cells(word, r, c, d):
        dr, dc = (0, 1) if d == "across" else (1, 0)
        return [(r + dr * i, c + dc * i) for i in range(len(word))]

    def can_place(word, r, c, d):
        dr, dc = (0, 1) if d == "across" else (1, 0)
        pr, pc = (1, 0) if d == "across" else (0, 1)  # perpendicular offset
        # the cells just before and after must be empty
        if (r - dr, c - dc) in grid or (r + dr * len(word), c + dc * len(word)) in grid:
            return -1
        crossings = 0
        for i, ch in enumerate(word):
            cell = (r + dr * i, c + dc * i)
            if cell in grid:
                if grid[cell] != ch or d in used_dir[cell]:
                    return -1
                crossings += 1
            else:
                # new cell: perpendicular neighbours must be empty
                if (cell[0] + pr, cell[1] + pc) in grid or (cell[0] - pr, cell[1] - pc) in grid:
                    return -1
        return crossings

    def commit(word, r, c, d):
        for cell, ch in zip(cells(word, r, c, d), word):
            grid[cell] = ch
            used_dir.setdefault(cell, set()).add(d)
        placed.append((word, r, c, d))

    w0 = order[0][0]
    commit(w0, 0, 0, "across")
    pending = order[1:]
    for _ in range(3):  # a few passes so words that didn't fit early can try again
        still = []
        for word, _clue in pending:
            options = []
            for (gr, gc), gch in list(grid.items()):
                for i, ch in enumerate(word):
                    if ch != gch:
                        continue
                    for d in ("across", "down"):
                        r, c = (gr, gc - i) if d == "across" else (gr - i, gc)
                        x = can_place(word, r, c, d)
                        if x > 0:
                            options.append((x, r, c, d))
            if not options:
                still.append((word, _clue))
                continue

            def score(opt):
                x, r, c, d = opt
                rows = [p[0] for p in grid] + [cc[0] for cc in cells(word, r, c, d)]
                cols = [p[1] for p in grid] + [cc[1] for cc in cells(word, r, c, d)]
                h = max(rows) - min(rows) + 1
                w = max(cols) - min(cols) + 1
                return (x * 12) - (h * w) * 0.08 - abs(h - w) * 0.9 + rng.random()

            best = max(options, key=score)
            commit(word, best[1], best[2], best[3])
        pending = still
        if not pending:
            break
    if pending:
        return None
    return placed


def normalise(placed):
    min_r = min(r if d == "across" else r for _, r, c, d in placed)
    min_c = min(c for _, r, c, d in placed)
    out = []
    for w, r, c, d in placed:
        out.append((w, r - min_r, c - min_c, d))
    rows = max((r + (len(w) - 1 if d == "down" else 0)) for w, r, c, d in out) + 1
    cols = max((c + (len(w) - 1 if d == "across" else 0)) for w, r, c, d in out) + 1
    return out, rows, cols


def validate(placed, rows, cols):
    grid = {}
    errors = []
    for w, r, c, d in placed:
        for i, ch in enumerate(w):
            cell = (r, c + i) if d == "across" else (r + i, c)
            if cell in grid and grid[cell] != ch:
                errors.append(f"crossing conflict at {cell}: {grid[cell]} vs {ch} ({w})")
            grid[cell] = ch
    # every maximal run must be exactly an entry
    entries = {(r, c, d): w for w, r, c, d in placed}
    runs = []
    for d in ("across", "down"):
        for a in range(rows if d == "across" else cols):
            b = 0
            limit = cols if d == "across" else rows
            while b < limit:
                cell = (a, b) if d == "across" else (b, a)
                if cell in grid:
                    start = b
                    s = ""
                    while b < limit and ((a, b) if d == "across" else (b, a)) in grid:
                        s += grid[(a, b) if d == "across" else (b, a)]
                        b += 1
                    if len(s) >= 2:
                        sr, sc = (a, start) if d == "across" else (start, a)
                        runs.append((sr, sc, d, s))
                else:
                    b += 1
    run_keys = {(r, c, d): s for r, c, d, s in runs}
    for key, s in run_keys.items():
        if key not in entries:
            errors.append(f"unintended run {s!r} at {key}")
        elif entries[key] != s:
            errors.append(f"run {s!r} at {key} doesn't match entry {entries[key]!r}")
    for key, w in entries.items():
        if key not in run_keys:
            errors.append(f"entry {w!r} at {key} is not a maximal run")
    # connectivity
    cells = set(grid)
    start = next(iter(cells))
    seen = {start}
    stack = [start]
    while stack:
        r, c = stack.pop()
        for n in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if n in cells and n not in seen:
                seen.add(n)
                stack.append(n)
    if seen != cells:
        errors.append("grid is not connected")
    return grid, errors


def number(placed, rows, cols, grid, clues):
    starts = {}
    for w, r, c, d in placed:
        starts.setdefault((r, c), {})[d] = w
    nums = {}
    n = 0
    for r in range(rows):
        for c in range(cols):
            if (r, c) not in grid:
                continue
            a = (r, c - 1) not in grid and (r, c + 1) in grid
            dn = (r - 1, c) not in grid and (r + 1, c) in grid
            if a or dn:
                n += 1
                nums[(r, c)] = n
    entries = []
    for w, r, c, d in placed:
        entries.append({"num": nums[(r, c)], "dir": d, "row": r, "col": c, "answer": w, "clue": clues[w]})
    # sanity: every numbered start begins an entry, every entry start is numbered
    for (r, c), dirs in starts.items():
        assert (r, c) in nums, f"unnumbered entry start {(r, c)}"
    entries.sort(key=lambda e: (0 if e["dir"] == "across" else 1, e["num"]))
    return entries


def build(key, spec):
    clues = dict(spec["words"])
    best = None
    rng = random.Random(spec["seed"])
    for attempt in range(1500):
        placed = place_words(list(spec["words"]), rng)
        if not placed:
            continue
        placed, rows, cols = normalise(placed)
        grid, errors = validate(placed, rows, cols)
        if errors:
            continue
        crossings = sum(len(w) for w, *_ in placed) - len(grid)
        fill = len(grid) / (rows * cols)
        aspect = max(rows, cols) / min(rows, cols)
        score = crossings * 3 + fill * 40 - aspect * 6 - max(rows, cols) * 0.8
        if best is None or score > best[0]:
            best = (score, placed, rows, cols, grid, crossings)
    if not best:
        raise SystemExit(f"{key}: could not place every word")
    _, placed, rows, cols, grid, crossings = best
    grid, errors = validate(placed, rows, cols)
    assert not errors, errors
    entries = number(placed, rows, cols, grid, clues)
    return {
        "title": spec["title"],
        "blurb": spec["blurb"],
        "rows": rows,
        "cols": cols,
        "entries": entries,
    }, {"rows": rows, "cols": cols, "cells": len(grid), "crossings": crossings, "entries": len(entries)}, grid


def main():
    data = {}
    for key, spec in PUZZLES.items():
        puzzle, stats, grid = build(key, spec)
        data[key] = puzzle
        print(f"{key}: {stats['entries']} entries, {stats['rows']}x{stats['cols']} grid, "
              f"{stats['cells']} letter cells, {stats['crossings']} crossings - validation passed")
        for r in range(puzzle["rows"]):
            print("   " + "".join(grid.get((r, c), ".") for c in range(puzzle["cols"])))
    js = ("/* Generated by src/tools/crossword_gen.py. Edit the word lists there, not here. */\n"
          "window.CAULK_CROSSWORDS = " + json.dumps(data, indent=1) + ";\n")
    OUT.write_text(js, encoding="utf-8", newline="\n")
    print(f"wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
