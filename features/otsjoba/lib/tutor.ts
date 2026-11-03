import { z } from "zod";
import {
  tutorCorrections,
  tutorLanguages,
  tutorLevels,
  tutorLimits,
  tutorResponseSchema,
} from "./tutor-profile.mjs";

// The local AI bridge validates with the plain-JS rules in tutor-profile.mjs;
// tests check that both accept and reject the same requests.
export { tutorInstructions, tutorPrompt } from "./tutor-profile.mjs";
export const tutorRequest = z
  .object({
    language: z.enum(tutorLanguages),
    level: z.enum(tutorLevels),
    correction: z.enum(tutorCorrections),
    topic: z.string().max(tutorLimits.topic),
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().min(1).max(tutorLimits.content),
        }),
      )
      .min(1)
      .max(tutorLimits.messages),
  })
  .strict();
export const tutorResponse = z.object({
  reply: z.string().min(1).max(tutorLimits.reply),
  translation: z.string().max(tutorLimits.translation),
  transliteration: z.string().max(tutorLimits.translation),
  correction: z
    .object({
      original: z.string().max(tutorLimits.correction),
      improved: z.string().max(tutorLimits.correction),
      explanation: z.string().max(tutorLimits.correction),
    })
    .nullable(),
});
export const responseSchema = tutorResponseSchema;
