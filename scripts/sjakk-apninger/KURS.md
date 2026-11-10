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
