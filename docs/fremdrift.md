# Fremdrift og idébank

Vaktagenten leser og oppdaterer denne fila. Den er arbeidslisten for løpende utvidelser.

Eier «hovedtråd» = hovedsamtalen styrer strømmen; vaktagenten rører den ikke. Eier «vakt» = vaktagenten styrer den. Køen nedenfor er vaktens.

## Arbeidsstrømmer (startet 2. nov. 2026)

| Strøm | Eier | Status | Gren / commit |
| --- | --- | --- | --- |
| Otsjoba: lokal AI-bro (Claude, «Continue with ChatGPT») + kurs A1–C2, spansk | hovedtråd | publisert 3. nov. | 5f4695a |
| Otsjoba: fransk (Camille) og tysk (Jonas), 30 leksjoner hver | hovedtråd | publisert 3. nov. | 142d097 |
| Sjakk: oppgaver (rangert, daglig, Lynløp, temaer) | hovedtråd | publisert 3. nov. | 8c89ff3 |
| Sjakk: åpningsrepertoar med trener Tora (19 åpninger) | hovedtråd | retting stoppet på bruksgrense, uferdige endringer i worktree t3-ad29c511 | t3/add-opening-repertoire-trainer |
| Dagsspill: 6/7-stegern | hovedtråd | retting stoppet på bruksgrense (07c519b + uferdige endringer i worktree t3-efaef30a) | t3/build-67-stegern-daily-game |
| Optimalisering: hele thodh.com (skjelett, prefetch, fonter, CLS, funksjoner i arn1) | hovedtråd | publisert 3. nov. | e8e4d8c |
| Optimalisering: online-sjakk | hovedtråd | publisert 3. nov. | e3fd09a |

## Mål som ikke er nådd (går foran køen)

### Online-sjakk like smooth som Lichess
Ikke ferdig før alt dette er målt i produksjon (to nettlesere, vanlig nett) og står som oppfylt her:

- [x] Eget trekk vises i samme bilderute som du slipper brikken, med animasjon og lyd. (lokalt: p95 14 ms)
- [x] Motstanderen ser trekket innen 250 ms (p95) via push (WebSocket/Realtime), ikke polling. (produksjon 3. nov.: 44–58 ms)
- [x] Forhåndstrekk (premove) som Lichess, også flere på rad i hurtigsjakk. (produksjon: 87 ms)
- [ ] Klokkene styres av serveren med lagkompensasjon; ingen hopp eller tapt tid ved forsinkelse.
- [ ] Brudd i nettet: kobler til igjen innen 2 s uten tapte eller doble trekk; tydelig status.
- [ ] Dra og slipp i 60 fps på mobil, ingen hakking eller layoutskift.
- [ ] Ingen «venter på server»-følelse i noen del av partiet (start, trekk, remis/oppgi, omkamp).

Gjenstår: klokker med lagkompensasjon og remistilbud krever endringer i spillserveren (Sites/D1), som ikke ligger i dette repoet — spør eieren hvor kildeprosjektet «Morsomme spill / sjakk-for-2» ligger før noen bygger det. Brudd i nettet (krav 5) og mobil-fps (krav 6) er bare målt lokalt. E2E-testen mot produksjon 3. nov. stoppet etter trekkene, i omkamp-/reload-steget (venter på «7 trekk» hos svart) — undersøk om det er en feil i appen eller i testen.

Eier fra nå: vakt. Er ingen strøm i gang på online-sjakk, start en ny Claude-agent med det som mangler, med målingene som utgangspunkt.

## Etterarbeid når strømmene er flettet

- Rewrite og lenke for `/sjakk/apninger` (oppgaver er gjort). Lenkene ligger i `<nav class="hub-links">` i public/sjakk/index.html.
- Kodegjennomgang: en egen Claude-agent (ikke den som skrev koden) ser over hver strøm før publisering.
- Optimaliseringene kan foreslå endringer i spill.ts/spill-oversikt.tsx; legg dem inn etter at 6/7-stegern er flettet.

## Kø for løpende utvidelse (øverst først)

1. Åpningsteori: nye åpninger og dypere linjer, alltid kontrollert med chess.js og Stockfish.
2. 6/7-stegern: fyll på spørsmålsbanken (dag 61+, fra 1. jan. 2027) — vent til hovedtrådens retting er flettet.
3. Otsjoba: flere språk, flere leksjoner per nivå.
4. Ytelse, neste runde: cache-headere for public/ (lyd, logoer), React.memo/cache i «I dag»-panelet (useAlleResultater), les lagret fremdrift før første tegning (useDagligTilstand) for raskere LCP.
5. Sjakkoppgaver: tidsbonus i Lynløp, gjennomgang av bom etter løp, rating synket til kontoen, egen rating per tema, «x % løste dagens».

## Idébank

(Vaktagenten fyller på her når køen er tom.)
