# Åpninger – data and verification

The opening trainer lives in `public/sjakk/apninger/`. Each opening is one JSON file in `data/`, listed in `data/manifest.json` (order and library groups).

## File format (schema 1)

Top level: `schema`, `id` (same as file name), `navn`, `farge` (`w`/`b` – the side the repertoire is for), `eco`, `niva` (`lett`/`middels`/`vanskelig`), `karakter`, `skarphet` (1–5), `kort`, `start` (SAN moves played before the tree, may be empty), `intro` (`historie`, `karakter`, `passer`), `planer[]`, `modellideer[]`, `feller[]`, `sidelinjer[]`, `trekk[]`.

`trekk` is a flat list of moves. `sti` is the full SAN path from the position after `start`; a move's parent must appear earlier in the list.

- Repertoire moves (made by `farge`) need `hva`, `ide`, `pass`. Write `ide` so it reads after "fordi …" – the coach says «Du spilte X, men her vil vi spille Y, fordi <ide>». Optional: `vurdering` (honest evaluation, required in practice for gambits and engine-flagged moves), `vanligeFeil` (`{ "SAN": "why it is wrong" }`), `plan` (required on the last move of a line), `piler`/`fare` (`"e2e4"` arrows), `felt` (highlighted squares), `navn`.
- Opponent moves need `hva`; `vekt` (default 1) orders the replies and marks the most common.
- Exactly one repertoire move per position. The same position reached by another move order must get the same repertoire move – or end with `"overgang": "<sti>"` pointing to the path where the line continues.
- `feller`: `{ id, type: "slå" | "unngå", navn, sti, trekk, tekst, forklaring, godta? }`. `trekk` starts with the drilling side's move; opponent replies alternate. `godta` lists other accepted moves for one-move "unngå" drills.
- `sidelinjer`: `{ navn, sti, tekst, kilde? }` – shown in "Om åpningen", not practised.
- `motor` on repertoire moves is written by the verifier (`cp` from white's view after the move, `tap` in cp versus the engine's best, `best`, `dybde`). Don't edit it by hand.

All coach text is Norwegian Bokmål with Norwegian piece letters (K, D, T, L, S) in prose; `sti`/`trekk` use English SAN.

## Commands

```sh
node scripts/sjakk-apninger/verifiser.mjs                         # schema + chess.js legality, no engine
node scripts/sjakk-apninger/verifiser.mjs --motor <stockfish.js> --dybde 16 --skriv
node scripts/sjakk-apninger/verifiser.mjs --motor <stockfish.js> --bare kongegambitt --skriv
node scripts/sjakk-apninger/utforsk.mjs --motor <stockfish.js> --multipv 3 "e4 e5 f4 exf4"
node --test tests/sjakk-apninger.test.mjs
```

The engine is the npm package `stockfish`, installed outside the repo (for example `npm install stockfish` in a temp folder; use `node_modules/stockfish/bin/stockfish-19.js`). `SJAKK_MOTOR` can hold the path instead of `--motor`. Results are cached in the OS temp folder.

`--skriv` stores `motor` on every repertoire move and writes `rapport.json` (full runs only). Moves losing more than 100 cp are flagged; each flagged move needs a `vurdering`, or a better move. Trap moves losing more than 50 cp are reported too.

The tests check every file: schema, legal and correctly written SAN for all lines, an explanation on every repertoire move, transpositions, and the stable file format (`format.mjs`).
