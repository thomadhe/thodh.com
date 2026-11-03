# Fremdrift og idébank

Vaktagenten leser og oppdaterer denne fila. Den er arbeidslisten for løpende utvidelser.

## Arbeidsstrømmer (startet 2. nov. 2026)

| Strøm | Status | Gren / commit |
| --- | --- | --- |
| Otsjoba: lokal AI-bro (Claude, Codex, «Continue with ChatGPT») + kurs A1–C2 (+ flere språk) | pågår | – |
| Sjakk: oppgaver (rangert, daglig, Lynløp, temaer) | publisert 3. nov. | c168b68 + rettelser 54ce6c6, live 8c89ff3 |
| Sjakk: åpningsrepertoar med personlig trener (e4 + gambitter, Englund-gambitt for svart) | pågår | – |
| Optimalisering: online-sjakk (Claude Opus 5.5) | pågår | – |
| Optimalisering: hele thodh.com (Claude Sonnet 5.5) | pågår | – |
| Dagsspill: 6/7-stegern | pågår | – |

## Mål som ikke er nådd (går foran køen)

### Online-sjakk like smooth som Lichess
Ikke ferdig før alt dette er målt i produksjon (to nettlesere, vanlig nett) og står som oppfylt her:

- [ ] Eget trekk vises i samme bilderute som du slipper brikken, med animasjon og lyd.
- [ ] Motstanderen ser trekket innen 250 ms (p95) via push (WebSocket/Realtime), ikke polling.
- [ ] Forhåndstrekk (premove) som Lichess, også flere på rad i hurtigsjakk.
- [ ] Klokkene styres av serveren med lagkompensasjon; ingen hopp eller tapt tid ved forsinkelse.
- [ ] Brudd i nettet: kobler til igjen innen 2 s uten tapte eller doble trekk; tydelig status.
- [ ] Dra og slipp i 60 fps på mobil, ingen hakking eller layoutskift.
- [ ] Ingen «venter på server»-følelse i noen del av partiet (start, trekk, remis/oppgi, omkamp).

Hver vaktrunde: er online-strømmen ferdig og målet ikke nådd, start en ny Claude-agent med det som mangler, med målingene som utgangspunkt.

## Etterarbeid når strømmene er flettet

- Rewrite og lenke for `/sjakk/apninger` (oppgaver er gjort). Lenkene ligger i `<nav class="hub-links">` i public/sjakk/index.html.
- Kodegjennomgang: en egen Claude-agent (ikke den som skrev koden) ser over hver strøm før publisering.
- Optimaliseringene kan foreslå endringer i spill.ts/spill-oversikt.tsx; legg dem inn etter at 6/7-stegern er flettet.

## Kø for løpende utvidelse (øverst først)

1. Åpningsteori: nye åpninger og dypere linjer, alltid kontrollert med chess.js og Stockfish.
2. 6/7-stegern: fyll på spørsmålsbanken god tid før den tar slutt.
3. Otsjoba: flere språk, flere leksjoner per nivå.
4. Sjakkoppgaver: tidsbonus i Lynløp, gjennomgang av bom etter løp, rating synket til kontoen, egen rating per tema, «x % løste dagens».

## Idébank

(Vaktagenten fyller på her når køen er tom.)
