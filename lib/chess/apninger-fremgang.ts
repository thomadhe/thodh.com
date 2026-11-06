import { z } from "zod";

// The opening trainer's progress object (public/sjakk/apninger/repetisjon.mjs). Only the outline is checked here:
// it belongs to the player, and the browser merges it key by key.
const tabell = z.record(z.string().max(2000), z.unknown());
const fremgang = z.object({ versjon: z.literal(1), linjer: tabell, feil: tabell, feller: tabell, repertoar: tabell, kort: tabell }).passthrough();

export const lagreFremgangSchema = z.object({
  userId: z.string().uuid(),
  revision: z.number().int().min(0),
  state: fremgang,
}).strict();
