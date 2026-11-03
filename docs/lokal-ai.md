# Lokal AI for Otsjoba

Fri samtale i Otsjoba bruker AI-abonnementene på din egen PC, ikke en betalt API-nøkkel og ikke thodh.com-serveren. Et lite program, broen (`scripts/lokal-ai.mjs`), kjører på PC-en og lytter bare på `127.0.0.1`. Nettleseren din på thodh.com/otsjoba snakker direkte med broen. Vercel kjører ingen AI.

Broen er bare for deg. Den skal ikke deles med eller betjene andre: abonnementene er personlige.

## Motorer

| Motor | Krav | Merknad |
| --- | --- | --- |
| ChatGPT | ChatGPT-abonnement, innlogging fra Otsjoba | Foretrukket. Bruker «Sign in with ChatGPT» for lokalt kjørte personlige prosjekter, uten CLI. |
| Claude | `claude` (Claude Code) installert og innlogget | Kjøres som `claude -p` uten verktøy, MCP og innstillinger, i en tom midlertidig mappe. |

Codex er ikke med som motor. `codex exec` beholder verktøy (kodemodus og underagenter) selv med alle funksjoner slått av, og da kan ikke elevtekst kjøres trygt gjennom den.

Velg motor og modell under Innstillinger → Lokal AI i Otsjoba. Med «Prøv en annen motor hvis den valgte feiler» går broen videre til neste klare motor.

## Start

Fra thodh.com-mappen:

```sh
node scripts/lokal-ai.mjs
```

Valg: `--port 4747` (standard, eller miljøvariabelen `LOKAL_AI_PORT`) og `--ny-kode` (lager en ny paringskode, slik at gamle nettlesere mister tilgangen).

Første gang skriver broen ut en lenke, for eksempel `https://thodh.com/otsjoba#lokal-ai=…`. Åpne den én gang i nettleseren du bruker Otsjoba i. Otsjoba lagrer koden i nettleseren og fjerner den fra adresselinjen. Du kan også lime inn lenken under Innstillinger → Lokal AI.

Chrome og Edge kan spørre om thodh.com får koble til enheter på det lokale nettverket. Velg Tillat. Det skjer bare én gang per nettleser.

### Logg inn med ChatGPT

1. Start broen og åpne Otsjoba → Innstillinger → Lokal AI.
2. Trykk **Continue with ChatGPT**. Broen åpner OpenAIs innlogging i standardnettleseren.
3. Logg inn, velg konto og godta at Otsjoba får bruke ChatGPT-abonnementet ditt.
4. Fanen sier «Du er logget inn med ChatGPT». Lukk den. Otsjoba viser at ChatGPT er koblet til, og modellene kontoen din har tilgang til.

Logg ut fra samme sted. Broen tilbakekaller tokenet hos OpenAI og sletter det lokalt. Du kan også koble fra Otsjoba under ChatGPT → Innstillinger. Bruken teller mot grensene i abonnementet ditt; se chatgpt.com/settings/usage.

## Sikkerhet

- Lytter bare på `127.0.0.1`. `Host` må være `127.0.0.1:<port>` eller `localhost:<port>`, noe som stopper DNS-rebinding.
- Godtar bare `Origin` `https://thodh.com`, `https://www.thodh.com`, `http://localhost:<port>` og `http://127.0.0.1:<port>`.
- Hver forespørsel må ha paringskoden som `Authorization: Bearer …`. Koden ligger i `~/.thodh/lokal-ai.json`, aldri i repoet. En lenke med en annen kode enn den lagrede erstatter koblingen først etter at du har bekreftet det.
- ChatGPT-tokenene ligger i `~/.thodh/lokal-ai-chatgpt.json`, med tilgang bare for din bruker (på Windows via `icacls`). De sendes aldri til nettleseren, i URL-er eller i logger. Refresh-tokenet roterer og fornyes ett om gangen.
- Grenser: 256 KiB per forespørsel, 120 forespørsler og 20 svar i minuttet, to samtidige kjøringer og tidsavbrudd per kjøring. Bare forespørsler med riktig paringskode teller mot disse grensene; andre nettsider avvises uten å bruke av dem.
- Innholdet valideres med de samme reglene som appen (`features/otsjoba/lib/tutor-profile.mjs`), og svaret valideres mot tutorskjemaet. Et ugyldig svar prøves én gang til.
- Broen fjerner `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` og lignende fra miljøet til Claude Code, slik at bruken aldri går over til betalt API.

Nye bruksområder, som en sjakktrener, legges til som en ny profil i `profiles` i `scripts/lokal-ai.mjs`.

## Valgfritt: start automatisk i Windows

Broen installerer ingenting selv. Slik kan du starte den ved innlogging, hvis du vil:

1. Trykk Win + R, skriv `shell:startup` og trykk Enter.
2. Lag en snarvei i mappen med målet
   `"C:\Program Files\nodejs\node.exe" C:\thodh.com\scripts\lokal-ai.mjs`
   og «Start i» `C:\thodh.com`.
3. Sett «Kjør» til «Minimert».

Du kan også bruke Oppgaveplanlegging med utløseren «Ved pålogging» og samme kommando. Fjern snarveien eller oppgaven for å slå av autostarten.
