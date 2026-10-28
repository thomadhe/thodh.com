import rawCurriculum from "@/features/otsjoba/data/curriculum.json";

export type Language = "it" | "ru";
export type Level = "A1" | "A2" | "B1" | "B2" | "C1";
export type Word = {
  word: string;
  translation: string;
  transliteration?: string;
};
export type Step = {
  question: string;
  translation: string;
  transliteration?: string;
  expected: string[];
  hint: string;
  reply: string;
  replyTranslation: string;
  replyTransliteration?: string;
};
export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  level: Level;
  icon: string;
  opening: string;
  openingTranslation: string;
  openingTransliteration?: string;
  steps: Step[];
  vocabulary: Word[];
};
export const curriculum = rawCurriculum as Record<Language, Lesson[]>;
export const languages = {
  it: {
    name: "Italiensk",
    native: "Italiano",
    tutor: "Giulia",
    locale: "it-IT",
    flag: "🇮🇹",
    image: "/otsjoba/tutors/giulia.png",
    greeting: "Ciao, bentornato!",
    focus: "Fortell, begrunn og finn ordene.",
  },
  ru: {
    name: "Russisk",
    native: "Русский",
    tutor: "Sasha",
    locale: "ru-RU",
    flag: "🇷🇺",
    image: "/otsjoba/tutors/sasha.png",
    greeting: "Рад тебя видеть!",
    focus: "Diskuter, nyanser og snakk friere.",
  },
};
export const levels: Level[] = ["A1", "A2", "B1", "B2", "C1"];
export type Session = {
  id: string;
  language: Language;
  lessonId: string;
  title: string;
  date: string;
  seconds: number;
  turns: number;
  mode: "guided" | "ai";
};
export type Review = { due: number; interval: number };
export type Activity = {
  id: string;
  kind: "quick" | "chess";
  key: string;
  title: string;
  date: string;
  xp: number;
  correct?: number;
  total?: number;
};
export type LearningState = {
  version: 1;
  language: Language;
  levels: Record<Language, Level>;
  goal: number;
  translations: boolean;
  transliteration: boolean;
  autoSpeak: boolean;
  correction: "gentle" | "balanced" | "detailed";
  sessions: Session[];
  saved: Record<Language, string[]>;
  reviews: Record<string, Review>;
  activities: Activity[];
  mistakes: string[];
  chessGame: { pgn: string; mode: "bot" | "local"; side: "w" | "b" };
};
export const defaults: LearningState = {
  version: 1,
  language: "it",
  levels: { it: "B1", ru: "B2" },
  goal: 15,
  translations: false,
  transliteration: false,
  autoSpeak: false,
  correction: "balanced",
  sessions: [],
  saved: { it: [], ru: [] },
  reviews: {},
  activities: [],
  mistakes: [],
  chessGame: { pgn: "", mode: "bot", side: "w" },
};
export const storageKey = "otsjoba.learning.v1";
export function parseState(raw: string | null): LearningState {
  if (!raw) return structuredClone(defaults);
  try {
    const p = JSON.parse(raw);
    if (p.version !== 1) return structuredClone(defaults);
    return {
      ...defaults,
      language: p.language === "ru" ? "ru" : "it",
      levels: {
        it: levels.includes(p.levels?.it) ? p.levels.it : "B1",
        ru: levels.includes(p.levels?.ru) ? p.levels.ru : "B2",
      },
      goal: [5, 10, 15, 20, 30].includes(p.goal) ? p.goal : 15,
      translations: p.translations === true,
      transliteration: p.transliteration === true,
      autoSpeak: p.autoSpeak === true,
      correction: ["gentle", "balanced", "detailed"].includes(p.correction)
        ? p.correction
        : "balanced",
      activities: Array.isArray(p.activities) ? p.activities.filter((a: Activity) =>
        a && ["quick", "chess"].includes(a.kind) && typeof a.id === "string" &&
        typeof a.key === "string" && typeof a.title === "string" &&
        Number.isInteger(a.xp) && a.xp >= 0 && a.xp <= 100 && !Number.isNaN(Date.parse(a.date))
      ).slice(-2000) : [],
      mistakes: Array.isArray(p.mistakes) ? [...new Set(p.mistakes.filter((q: unknown) => typeof q === "string"))] as string[] : [],
      chessGame: {
        pgn: typeof p.chessGame?.pgn === "string" && p.chessGame.pgn.length < 100000 ? p.chessGame.pgn : "",
        mode: p.chessGame?.mode === "local" ? "local" : "bot",
        side: p.chessGame?.side === "b" ? "b" : "w",
      },
      sessions: Array.isArray(p.sessions)
        ? p.sessions
            .filter(
              (s: Session) =>
                s &&
                ["it", "ru"].includes(s.language) &&
                typeof s.id === "string" &&
                typeof s.title === "string" &&
                Number.isFinite(s.seconds) &&
                s.seconds >= 0 &&
                !Number.isNaN(Date.parse(s.date)),
            )
            .slice(-1000)
        : [],
      saved: {
        it: Array.isArray(p.saved?.it)
          ? p.saved.it.filter((x: unknown) => typeof x === "string")
          : [],
        ru: Array.isArray(p.saved?.ru)
          ? p.saved.ru.filter((x: unknown) => typeof x === "string")
          : [],
      },
      reviews:
        p.reviews && typeof p.reviews === "object"
          ? (Object.fromEntries(
              Object.entries(p.reviews).filter(
                ([, v]) =>
                  v &&
                  typeof v === "object" &&
                  Number.isFinite((v as Review).due) &&
                  Number.isFinite((v as Review).interval),
              ),
            ) as Record<string, Review>)
          : {},
    };
  } catch {
    return structuredClone(defaults);
  }
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function streak(sessions: { date: string }[], now = new Date()) {
  const days = new Set(sessions.map((s) => localDate(new Date(s.date))));
  const d = new Date(now);
  if (!days.has(localDate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(localDate(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export function recordActivity(state: LearningState, activity: Omit<Activity, "xp">): LearningState {
  if (state.activities.some(a => a.id === activity.id)) return state;
  const repeated = state.activities.some(a => a.kind === activity.kind && a.key === activity.key);
  const xp = repeated ? 0 : activity.kind === "chess" ? 20 : 10;
  return { ...state, activities: [...state.activities, { ...activity, xp }].slice(-2000) };
}
export function totalXp(state: LearningState) {
  const conversations = new Set(state.sessions.map(s => `${s.language}:${s.mode}:${s.lessonId}`));
  return conversations.size * 20 + state.activities.reduce((sum, a) => sum + a.xp, 0);
}
export function allWords(language: Language): Word[] {
  return [
    ...new Map(
      curriculum[language].flatMap((l) => l.vocabulary).map((w) => [w.word, w]),
    ).values(),
  ];
}
export function orderedLessons(language: Language, level: Level) {
  return [...curriculum[language]].sort(
    (a, b) =>
      Math.abs(levels.indexOf(a.level) - levels.indexOf(level)) -
      Math.abs(levels.indexOf(b.level) - levels.indexOf(level)),
  );
}
export function scheduleReview(
  previous: Review | undefined,
  remembered: boolean,
  now = Date.now(),
): Review {
  const interval = remembered
    ? Math.min(30, Math.max(1, (previous?.interval || 0) * 2))
    : 0;
  return { interval, due: now + (remembered ? interval * 86400000 : 600000) };
}
