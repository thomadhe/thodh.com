import { z } from "zod";
import { defaults, type LearningState } from "./learning";

const language = z.enum(["it", "ru"]);
const level = z.enum(["A1", "A2", "B1", "B2", "C1"]);
const text = z.string().max(500);
const date = z.string().datetime({ offset: true });
export const progressSchema = z.object({
  version: z.literal(1),
  language,
  levels: z.object({ it: level, ru: level }).strict(),
  goal: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
  translations: z.boolean(), transliteration: z.boolean(), autoSpeak: z.boolean(),
  correction: z.enum(["gentle", "balanced", "detailed"]),
  sessions: z.array(z.object({
    id: text, language, lessonId: text, title: text, date,
    seconds: z.number().finite().min(0).max(604800),
    turns: z.number().int().min(0).max(1000), mode: z.enum(["guided", "ai"]),
  }).strict()).max(1000),
  saved: z.object({ it: z.array(text).max(1000), ru: z.array(text).max(1000) }).strict(),
  reviews: z.record(z.string().max(600), z.object({ due: z.number().finite().min(0), interval: z.number().finite().min(0).max(30) }).strict())
    .refine((v) => Object.keys(v).length <= 2000),
  activities: z.array(z.object({
    id: text, kind: z.enum(["quick", "chess"]), key: text, title: text, date,
    xp: z.number().int().min(0).max(100), correct: z.number().int().min(0).optional(), total: z.number().int().min(0).optional(),
  }).strict()).max(2000),
  mistakes: z.array(text).max(2000),
  chessGame: z.object({ pgn: z.string().max(100000), mode: z.enum(["bot", "local"]), side: z.enum(["w", "b"]) }).strict(),
}).strict();

export const saveProgressSchema = z.object({
  userId: z.string().uuid(), revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), state: progressSchema,
}).strict();

export type ProgressSnapshot = { state: LearningState; revision: number };
export function emptyProgress(): ProgressSnapshot {
  return { state: structuredClone(defaults), revision: 0 };
}

export function decodeProgress(row: { state: unknown; revision: number } | null): ProgressSnapshot {
  if (!row) return emptyProgress();
  // Invalid server data is an error, never an excuse to overwrite it with defaults.
  return { state: progressSchema.parse(row.state), revision: row.revision };
}
