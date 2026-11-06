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

## Evaluation bar

`evalbar.mjs` draws the bar under the board and `motor.mjs` runs Stockfish in a Web Worker. The trainer shows the stored `motor.cp` at once, then refines it live, and stops at depth 18 or 2.5 seconds. Reuse it on any board:

```js
const bar = lagEvalbar(element, { lager: localStorage });
const lagret = lagretOppslag(apning.noder);
bar.settStilling(fen, { orientering: 'w', lagret: lagret(fen) });
bar.avslutt(); // when the board goes away
```

The engine in `public/sjakk/vendor/` is `stockfish-19-lite-single.js` and `.wasm` from the npm package `stockfish` 19.0.1, unchanged. It is single-threaded, so it needs no COOP/COEP headers, and it is GPLv3: `stockfish-LICENSE.txt` sits next to it, and the page links to the source (`KREDITT` in `evalbar.mjs`). When updating the engine, change the file name in `motor.mjs` and the version in `KREDITT`.

A bar can be put on hold with `bar.hold(true)`: it shows a calm line instead of the number and starts no engine. Flashcards and the Feller view use this, because a number like −4,8 tells the player that a strong move exists. In Lær and Øv the bar is always on.

## Repertoire and flashcards

`#/repertoar` is the player's own repertoire, `#/repertoar/bygg` the guided flow that fills it, `#/repertoar/ov` (optionally `/w` or `/b`) the mixed drill and `#/repertoar/kort` the flashcards. Nothing here lists openings by name, except the two in `STARTFORSLAG`, so a new data file shows up by itself.

- **Slots** (`repertoar.mjs`): `fordel()` puts an opening in the deepest slot its `start` lies in, and in every slot its tree reaches. Openings of a colour that fit nothing go to "Andre". Add a slot to `SLOTS` when a new reply needs its own place.
- **Guided flow** (`bygg.mjs`): one question per slot, each with its own address (`#/repertoar/bygg/<slot>`, plus `/hull` to visit only empty slots). `byggSteg()` orders them by `SVAR_VEKT`, White before Black, with a deeper slot right after the reply it hangs on. A slot the chosen openings can never reach, like Spanish after 1…d5, is skipped. `alternativer()` puts chosen openings, then `STARTFORSLAG`, then what answers most of the reply first, and three are shown until the player asks for all.
- **Coverage:** `svarDekning()` adds up each slot's share of the games (`slotVekt()`: `SVAR_VEKT`, or `vekt` on a deeper slot). An opening whose `start` narrows the reply counts `START_SVAR` for each opponent move there, and a slot closed off by a choice counts as answered. The numbers are guesses, so text always goes through `omtrentProsent()`, which rounds to 5 %.
- **Next step:** `nesteSteg()` gives the one button at the top of the library and repertoire page: build, today's session, more new cards or the mixed drill.
- **Choosing:** `krysser()` finds the first position where two openings want different moves of ours. A new choice replaces the openings in its slot that it crosses, and the player can keep both. Openings that cover different lines, like Evans and Sg5-angrepet, stand side by side.
- **Mixed drill:** runs through the same `spillOv` as the opening view, from move 1, with `startNoder()` in front of the line. The opening stays unnamed until the opponent has replied, since the name would give the reply away. `velgBlandetLinje()` takes due lines, then new lines, then extra rounds, and walks the moves so the opponent picks by `vekt` (`SVAR_VEKT` for the first reply). Playing another chosen opening's move switches line and is no mistake.
- **Cards** (`kort.mjs`): one card per position and colour, from every repertoire move from move 3 on, except positions with one legal move. `feller` become cards at the trap's position, with `godta`. Same key means one card: transpositions merge, and different moves are all accepted.
- **Schedule:** Leitner per card with `INTERVALL_DAGER`. Right moves up, a hint stays in the box, wrong goes to box 1 and comes back in the session without a second review. Due dates are local midnight. `kortKo()` holds the limits: `OKT_STORRELSE`, `NYE_PER_DAG`, `MAKS_FORFALT`. Over the cap it sorts by relative overdueness and pauses new cards.
- **Teaching:** a card without a post is never tested. `lagOkt()` puts it in the queue twice, three new cards at a time with reviews spread between them. The first time shows the arrow and the explanation, and the player plays the move. `vistKort()` then writes a post in box 0 that is due today, and only the test gives box 1. Cards with a post from before are not taught again. The first time a session teaches from an opening it shows "Kort fortalt", remembered in `introer`.
- **Order of new cards:** each card has `vekt`, how likely its position is (`veiVekt()`: `SVAR_VEKT` for the first reply, then `vekt` down the path). `nyeIRekkefolge()` takes the likeliest and follows its likeliest line for as long as that line is at least half as likely as the best card waiting. Reviews are shuffled.
- **Pace:** `tempo` holds the new cards per day (`NYE_VALG`, default `NYE_PER_DAG`). A session has at most `OKT_STORRELSE` reviews and all of the day's new cards.

Both live in the progress object under `sjakk-apninger`, with the same `VERSJON`: `repertoar` is `{ id: { valgt, sist } }`, so deselecting leaves a dated entry, `kort` is `{ kortId: { boks, forfall, sist, forst, riktige, feil, vist? } }`, `introer` is `{ id: { sist } }` and `tempo` is `{ nye, sist }`. Old progress reads as before and gets empty fields. A new field needs a line in `slaSammen()` in `synk.mjs`, or it disappears in the first merge.

The tests check every file: schema, legal and correctly written SAN for all lines, an explanation on every repertoire move, transpositions, and the stable file format (`format.mjs`).
