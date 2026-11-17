import "server-only"

// The answer lists stay on the server; pages and routes reach them through here.
export {
  dagensSporsmal,
  duellSporsmal,
  erGjentatt,
  erRepris,
  finaleBillett,
  finaleTekst,
  harFinaleBillett,
  harKvittering,
  kanSpillesStegern,
  kvittering,
  sjetteNr,
  vurderSvar,
} from "./stegern-logikk"
