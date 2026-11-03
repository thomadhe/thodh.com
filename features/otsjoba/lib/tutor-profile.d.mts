export type TutorLanguage = "it" | "ru" | "es";
export type TutorLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type TutorCorrection = "gentle" | "balanced" | "detailed";
export type TutorRequest = {
  language: TutorLanguage;
  level: TutorLevel;
  correction: TutorCorrection;
  topic: string;
  messages: { role: "user" | "assistant"; content: string }[];
};
export type TutorResponse = {
  reply: string;
  translation: string;
  transliteration: string;
  correction: { original: string; improved: string; explanation: string } | null;
};
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const tutorPersonas: Record<TutorLanguage, { intro: string; english: string; transliteration: boolean }>;
export const tutorLanguages: readonly ["it", "ru", "es"];
export const tutorLevels: readonly ["A1", "A2", "B1", "B2", "C1", "C2"];
export const tutorCorrections: readonly ["gentle", "balanced", "detailed"];
export const tutorLimits: { topic: number; messages: number; content: number; reply: number; translation: number; correction: number };
export const tutorResponseSchema: Record<string, unknown>;
export function tutorInstructions(input: TutorRequest): string;
export function tutorPrompt(input: TutorRequest): string;
export function validateTutorRequest(input: unknown): Result<TutorRequest>;
export function validateTutorResponse(output: unknown): Result<TutorResponse>;
