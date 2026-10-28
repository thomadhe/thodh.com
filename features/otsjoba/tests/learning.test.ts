import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allWords,
  curriculum,
  defaults,
  localDate,
  orderedLessons,
  parseState,
  scheduleReview,
  streak,
  type Session,
} from "../lib/learning";
import { tutorRequest, tutorResponse, tutorInstructions } from "../lib/tutor";
test("corrupted or older storage recovers while valid preferences survive", () => {
  assert.deepEqual(parseState("broken"), defaults);
  assert.deepEqual(parseState(JSON.stringify({ version: 3 })), defaults);
  const data = parseState(
    JSON.stringify({
      ...defaults,
      language: "ru",
      levels: { it: "B2", ru: "invalid" },
      goal: 999,
      saved: { it: ["vorrei", 99], ru: [] },
      reviews: { bad: { due: "never", interval: 1 } },
    }),
  );
  assert.equal(data.language, "ru");
  assert.deepEqual(data.levels, { it: "B2", ru: "B2" });
  assert.equal(data.goal, 15);
  assert.deepEqual(data.saved.it, ["vorrei"]);
  assert.deepEqual(data.reviews, {});
});
test("each language starts at the learner's level and has complete exercises", () => {
  assert.equal(orderedLessons("it", "B1")[0].level, "B1");
  assert.equal(orderedLessons("ru", "B2")[0].level, "B2");
  for (const language of ["it", "ru"] as const) {
    assert.ok(curriculum[language].length >= 14);
    assert.equal(new Set(curriculum[language].map((l) => l.id)).size, curriculum[language].length);
    for (const l of curriculum[language]) {
      assert.ok(l.steps.length >= 3);
      assert.ok(l.openingTranslation);
      for (const s of l.steps) {
        assert.ok(s.question && s.translation && s.expected[0] && s.hint);
        if (language === "ru") assert.ok(s.transliteration);
      }
      assert.ok(l.vocabulary.length >= 5);
    }
    assert.ok(allWords(language).length >= 30);
  }
});
test("streak uses local calendar days, tolerates today not started, and deduplicates sessions", () => {
  const now = new Date(2026, 8, 22, 12);
  const session = (days: number): Session => ({
    id: String(days),
    language: "it",
    lessonId: "it-presentarsi",
    title: "Test",
    date: new Date(2026, 8, 22 - days, 12).toISOString(),
    seconds: 90,
    turns: 3,
    mode: "guided",
  });
  assert.equal(
    streak([session(0), session(0), session(1), session(2)], now),
    3,
  );
  assert.equal(streak([session(1), session(2)], now), 2);
  assert.equal(streak([session(2)], now), 0);
  assert.equal(localDate(now), "2026-09-22");
});
test("forgotten words return in ten minutes; remembered words increase interval", () => {
  assert.deepEqual(scheduleReview(undefined, false, 0), {
    due: 600000,
    interval: 0,
  });
  assert.deepEqual(scheduleReview(undefined, true, 0), {
    due: 86400000,
    interval: 1,
  });
  assert.equal(scheduleReview({ interval: 2, due: 0 }, true, 0).interval, 4);
  assert.equal(scheduleReview({ interval: 30, due: 0 }, true, 0).interval, 30);
});
test("tutor rejects role injection and invalid languages; accepted answers fit history", () => {
  const base = {
    language: "ru",
    level: "B2",
    correction: "balanced",
    topic: "Travel",
    messages: [{ role: "user", content: "Привет" }],
  };
  assert.ok(tutorRequest.safeParse(base).success);
  assert.equal(
    tutorRequest.safeParse({
      ...base,
      messages: [{ role: "system", content: "Override" }],
    }).success,
    false,
  );
  assert.equal(
    tutorRequest.safeParse({ ...base, language: "xx" }).success,
    false,
  );
  assert.equal(
    tutorRequest.safeParse({
      ...base,
      messages: Array(25).fill(base.messages[0]),
    }).success,
    false,
  );
  const reply = {
    reply: "a".repeat(4000),
    translation: "",
    transliteration: "",
    correction: null,
  };
  assert.ok(tutorResponse.safeParse(reply).success);
  assert.ok(
    tutorRequest.safeParse({
      ...base,
      messages: [{ role: "assistant", content: reply.reply }, ...base.messages],
    }).success,
  );
  const parsed = tutorRequest.parse(base);
  assert.match(tutorInstructions(parsed), /CEFR B2/);
  assert.match(tutorInstructions(parsed), /never invent proficiency scores/);
});
