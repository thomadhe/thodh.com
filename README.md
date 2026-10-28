# thodh.com

Personlig prosjektoversikt med Otsjoba og Sjakk for 2;) på samme domene.

## Adresser

| Adresse | Innhold |
| --- | --- |
| `/` | Prosjektoversikt |
| `/kontakt` | Kontakt |
| `/konto` | Felles konto for thodh.com og Karrierepiloten |
| `/logg-inn`, `/registrer` | Innlogging, e-postlenke og registrering |
| `/otsjoba` | Italiensk og russisk, veiledede samtaler og ordtrening |
| `/sjakk` | Sjakk for to på samme skjerm eller med invitasjonslenke på nett |

Karrierepiloten åpnes via en ekstern lenke til https://karrierepiloten.com.

## Utvikling og kontroll

```sh
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm start
```

På Windows kan `npm.cmd` brukes i stedet for `npm`. Prosjektet er koblet til Vercel-prosjektet `thodh.com`.

## Uavhengige design

`app/(site)` inneholder den eksisterende forsiden og kontaktsiden. `app/(otsjoba)/otsjoba` har et eget rotoppsett med Otsjobas CSS og metadata. Vanlige lenker mellom appene laster et nytt dokument, slik at globale stiler ikke blandes.

Sjakkspillet ligger i `public/sjakk`. En rewrite i `next.config.ts` serverer `index.html` på `/sjakk`. HTML-en bruker absolutte ressursbaner under `/sjakk`, slik at både direktelenker og omlasting fungerer. Lokal spilling trenger ingen spillserver. Begge spillere kan velge egen partitid, tillegg og separat trekkfrist. Leken variant og trening deler samme regler. Biblioteklisensen ligger i `public/sjakk/vendor/chess-LICENSE.txt`.

Nettspill går via den avgrensede serverruten `/sjakk/api/rooms/[[...path]]` til sjakkserveren på Sites, med D1 som varig lagring. Ingen thodh.com-innlogging kreves. Vertens spillerplass og engangsinvitasjonen har ulike tilfeldige nøkler; motspilleren får sin egen spillerplass. Serveren verifiserer trekk, klokker og revisjoner. Utløpte rom fjernes etter sju dager. Kun spillernøkkel og rom-ID lagres i nettleseren for gjenopptakelse.

Vercel må ha serverhemmelighetene `SJAKK_SITE_BYPASS` (eksisterende Sites-tilgang for serveren) og `SJAKK_GATEWAY_KEY`. Sistnevnte må også være satt på sjakkserveren i Sites. Gatewayen slipper bare gjennom spilloperasjoner, sender ingen brukerkapsler og eksponerer ikke servernøklene. En daglig HMAC av klient-IP lar serveren begrense nye rom per klient uten å lagre IP-adressen. Sites beholder sin egen tilgangsinnstilling; kun sjakk-API-et er tilgjengelig gjennom gatewayen.

Kildespillet vedlikeholdes i `Morsomme spill` / `sjakk-for-2`. Kjør `node scripts/export-thodh.mjs C:/thodh.com/public/sjakk` derfra for å oppdatere ressursene. Kjør testene og publiser begge prosjektene når felles spillregler eller API-kontrakten endres. Lokalt kan serverhemmelighetene ligge i en ignorert `.env.development.local`; de skal aldri ha `NEXT_PUBLIC_`-prefiks.

## Otsjoba

`features/otsjoba` inneholder komponentene som brukes av den opprinnelige Otsjoba-appen, læringsinnhold, UI-komponenter og lagring. Portrettene ligger i `public/otsjoba/tutors`. Importene og ressursbanene er tilpasset dette prosjektet. Videre endringer for thodh.com gjøres her; det er ingen automatisk synkronisering med det separate Otsjoba-repositoriet.

Fremgang lagres på kontoen i Supabase-tabellen `public.otsjoba_progress`. Hver rad eies av `auth.users.id`, og RLS begrenser lesing, innsetting og oppdatering til denne brukeren. API-et verifiserer innlogging ved hver forespørsel, kontrollerer avsenderdomene på endringer og avviser utdaterte revisjoner. Nettverksfeil vises med mulighet for nytt forsøk eller eksport. Konflikter mellom faner overskriver aldri nyere fremgang automatisk.

Gamle data på `otsjoba.learning.v1` importeres bare etter et uttrykkelig valg på en konto uten lagret fremgang. De fjernes fra nettleseren først etter bekreftet skylagring. Ingen nye kontodata lagres i localStorage. Data fra localhost eller en annen nettadresse flyttes ikke automatisk til thodh.com. Ingen samtaletekst lagres etter at økten lukkes.

## Felles innlogging

Supabase-prosjektet `beikvwnttqnebwuticgv` er det samme som Karrierepiloten bruker. Eksisterende e-post og passord fungerer på begge nettsteder, og nye kontoer får også Karrierepilotens eksisterende profil via prosjektets brukertrigger. Nettstedene har separate økter; dette er felles identitet, ikke automatisk innlogging på tvers av domenene. Utlogging fra thodh.com avslutter bare den lokale økten.

`lib/supabase/config.ts` inneholder offentlig prosjektadresse og publiserbar nøkkel. `SUPABASE_URL` og `SUPABASE_PUBLISHABLE_KEY` kan overstyre disse for et separat testmiljø. Ingen administrativ nøkkel brukes av appen. Økten ligger i HttpOnly-informasjonskapsler, med Secure på Vercel. Personlige svar har `Cache-Control: private, no-store`. Kontobytte varsles mellom faner; fremgang sjekkes også på nytt når en fane får fokus.

Databasemigrasjonen er `supabase/migrations/20260924214443_otsjoba_account_progress.sql`. Den er lagt til i det delte Supabase-prosjektet. E-postlenker bruker PKCE og må åpnes i nettleseren der lenken ble bestilt. Supabase må tillate `https://thodh.com/auth/callback**` og `https://www.thodh.com/auth/callback**`; behold Karrierepilotens eksisterende adresser og Site URL. Standard lokal utvikling på `localhost:3000` er allerede tillatt.

AI er fortsatt avslått. `/otsjoba/api/tutor` returnerer `available: false` på GET og 503 med veiledning på POST. Den opprinnelige Cloudflare/Sites-integrasjonen er ikke flyttet til nettstedet. Miljøvariabler kan ikke slå på AI her; forbruksgrenser og leverandørtilkobling må implementeres før eventuell senere aktivering.

Testene dekker læringsinnhold, gjenoppretting av lagring, repetisjon, avslått AI, sjakkregler, trekkklokken, validering, samtidige lagringer, konflikt, nettverksfeil og kontobytte. `tests/otsjoba-rls.sql` kontrollerer datatilgang med to eksisterende konto-ID-er og ruller tilbake alle testendringer. Nettleserkontroll må i tillegg dekke navigasjon, egne design, innlogging, mobilmeny og gjennomføring av en øvelse.
