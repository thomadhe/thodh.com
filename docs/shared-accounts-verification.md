# Felles konto på thodh.com

Publisert 25. september 2026 på `https://thodh.com`.
Vercel-deployment: `dpl_EeQBLSe7jcAVVBnQJkQEiWbUrHCP`.

## Kontrollert

- Produksjonsbygg og ESLint uten feil; 29 automatiske tester bestod.
- Brukeren bekreftet vellykket innlogging med sin eksisterende Karrierepiloten-konto.
- Autentisert skylagring er kontrollert fra nettleseren: bytt språk til russisk, vent på lagringsbekreftelse, last siden på nytt og kontroller at russisk er beholdt. Språket ble deretter satt tilbake til italiensk. Den midlertidige raden med bare standardverdier ble fjernet med eksakt tilstands- og revisjonskontroll, slik at brukeren fortsatt kan velge import av gammel lokal fremgang.
- Kontooppdatering i en annen fane skjulte den gamle fanens data umiddelbart.
- Registrerings- og innloggingsskjema kontrollert i nettleser på desktop og 390 px mobilbredde.
- Lokalt og i produksjon: `/otsjoba` og `/konto` omdirigerer uinnloggede besøk til innlogging.
- Privat fremgang: GET/PUT uten innlogging avvises med 401; endringer fra annet avsenderdomene avvises med 403.
- Ugyldig innlogging vises som «Feil e-post eller passord.» fra det delte Supabase-prosjektet.
- Åpne eksterne returadresser er ikke tillatt; ugyldig e-postlenke går tilbake til lokal innlogging.
- Sjakk er fortsatt offentlig tilgjengelig (200).
- Databasetesten i `tests/otsjoba-rls.sql` bestod med to eksisterende konto-ID-er. Testen kontrollerte eierens lesing og skriving, avvist lesing/innsetting/oppdatering på andre kontoer, avvist overføring av eierskap, anonym tilgang og revisjonskontroll. Alle testendringer ble rullet tilbake.
- Lagringskøen er testet for raske endringer, konflikt, nettverksbrudd, kontobytte og svar som kommer etter utlogging. En konflikt beholder utkastet for eksport og stopper videre skriving.
- Supabase beholder Karrierepilotens Site URL og fire eksisterende returadresser. To godkjente callback-adresser for thodh.com og www er lagt til.
- Bekreftelses- og innloggingsmalene bruker `ConfirmationURL`. Eksisterende Resend SMTP er aktivt; avsendernavnet er Karrierepiloten.

## Avgrensning

Mottak av e-postlenker er ikke prøvd. Ingen passord ble innhentet, og det ble ikke sendt test-e-post. Dette er felles brukerregister, med separate økter på de to domenene.

Supabase-rådgiveren rapporterte ingen funn på den nye Otsjoba-tabellen eller triggeren. Den rapporterte eksisterende forhold i Karrierepiloten: serverstyrt Stripe-tabell med RLS uten klientpolicy, fem SECURITY DEFINER-funksjoner tilgjengelige for innloggede brukere og deaktivert kontroll mot lekkede passord. Disse er ikke endret i denne leveransen. Referanser: [RLS uten policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [funksjonsrettigheter](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [passordkontroll](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
