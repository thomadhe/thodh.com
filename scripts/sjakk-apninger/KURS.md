# Gjennomganger – kursformat (schema 1)

A course is a guided walkthrough of one opening, played on a board like a short video: the board moves, arrows and squares light up, coach Tora explains in text (read aloud if the player wants), and now and then the player must answer. It is meant to be watched before the opening goes into the repertoire, and it teaches understanding: the ideas, the plans in the middlegame, the typical tactics. The move tree in `data/<id>.json` stays the place for drilling.

One file per opening: `public/sjakk/apninger/data/kurs/<opening id>.json`.

```jsonc
{
  "schema": 1,
  "apning": "smith-morra",            // the id of the opening file this course belongs to
  "tittel": "Smith-Morra: slik spiller du gambiten",
  "minutter": 12,                      // honest estimate of watching time
  "kapitler": [
    {
      "id": "ideen",                   // a-z, 0-9 and dashes, unique in the file
      "tittel": "Hvorfor ofre en bonde?",
      "start": "e4 c5",                // SAN from the initial position; the board is set here when the chapter starts
      "steg": [
        {
          "trekk": "d4 cxd4 c3",       // optional: SAN played from the current position, animated one by one
          "tekst": "…",                // 1–3 short sentences, read aloud; the core of the step
          "piler": ["c3d4"],           // optional: green arrows (plans), from-to squares
          "fare": ["d8a5"],            // optional: orange arrows (threats)
          "felt": ["d5", "f7"]         // optional: highlighted squares
        },
        { "fra": "e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4", "tekst": "…" },  // optional "fra": jump to this position (full SAN from the start), e.g. to show another line
        {
          "tekst": "Svart har nettopp spilt …e6. Hva gjør du nå?",
          "sporsmal": { "type": "trekk", "svar": ["Nb5"], "hint": "Se på d6.", "forklaring": "…" }
        },
        {
          "tekst": "Hva er planen her?",
          "sporsmal": { "type": "valg", "valg": ["…", "…", "…"], "riktig": 1, "forklaring": "…" }
        }
      ]
    }
  ],
  "huskeregler": ["…", "…"]            // 4–6 rules of thumb shown at the end
}
```

Rules:
- A step has `trekk` or `fra` or neither, never both. After a `trekk` question the board shows the position after the right answer (the first entry in `svar`), and the next step continues from there. A `valg` question does not move anything.
- All SAN is English (`Nf3`, `Qxd4`), as in the trees; prose is Norwegian with Norwegian piece letters (K, D, T, L, S), like the rest of the coach text.
- Where the course shows a position that is in the opening's tree with our side to move, it must show the tree's repertoire move, or say plainly that it is showing an alternative. The course and the flashcards may never teach different moves for the same position.
- Every concrete claim is tested against the position with chess.js and the engine (Stockfish, see README). An example game is called an example game ("eksempelparti"); it is not attributed to real players unless the game is certain and checked.
- Write for a club player who knows the rules and basic tactics, not for a GM. Short sentences, one idea per step, the board doing the work.

## Additions (compatible with schema 1)
- `"alternativ": true` on a step (or on a chapter, for all its steps) says that the step deliberately shows another move than the tree's in a tree position, and that the text says so. It only silences the verifier's warning; nothing else changes.
- A `fra` that branches off the current line is played in from where it branches (at most the last 8 half-moves), so the player sees where the new line goes. A `fra` far away is set at once except for its last 8 half-moves.
- `manifest.json` may list the openings that have a course: `"kurs": ["smith-morra", …]`. When the list is there, the trainer only asks for those files; without it, it asks for an opening's file when a page needs it. The verifier checks that the list and the files agree.

## How it is played and read
- Steps play by themselves: the moves first, then the arrows and squares, and the text stays as long as it takes to read (about 170 words a minute, never under 3 seconds), or as long as the speech takes. Questions stop and wait.
- The text is read aloud by the browser's Norwegian voice, if the player wants. Write moves as in the rest of the coach text and they are spoken naturally: `3.Sf3` is "tre springer f3", `4…Lc5` is "fire, løper c5", `…Dd4`, `exd5` ("e tar d5"), `0-0` ("kort rokade"), `Lxf7+` ("løper tar f7, sjakk"), `…Sf6–g4` ("springer fra f6 til g4"). `!` and `?` after a move are not read. Avoid other notation in prose (no `+/=`, no evaluations like `+0,5`).
- A `trekk` question asks for the move on the board; `hint` is shown on request and after the second wrong try, and the piece to move is marked. A `valg` question gets one try, then the right answer is shown. Both show `forklaring` and go on.
- Pre-recorded sound per step (for example a `lyd` URL) is not part of the format yet; do not add it.

## Checking
`node scripts/sjakk-apninger/verifiser-kurs.mjs` checks every file in `data/kurs/` (or `--fil <path>` for a draft anywhere; `--streng` also fails on warnings): every `trekk`, `fra`, `start` and `svar` with chess.js (legal and written as chess.js writes it), squares in `piler`, `fare` and `felt`, ids, that `apning` exists, and it warns where the course plays another move than the tree in a tree position with our side to move, on unknown fields, on texts over 420 characters, on 4–6 `huskeregler`, and when `minutter` is far from what the steps take. `npm test` runs the same checks on every course in `data/kurs/`. An error hides the chapter (or the course) in the trainer.
