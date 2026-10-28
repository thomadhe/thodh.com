/* eslint-disable @next/next/no-img-element -- Local avatar portrait served without an external optimizer. */
"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bookmark,
  Check,
  Languages,
  Lightbulb,
  LoaderCircle,
  Mic,
  Send,
  Square,
  Volume2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/features/otsjoba/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/features/otsjoba/components/ui/alert-dialog";
import { Progress } from "@/features/otsjoba/components/ui/progress";
import { toast } from "sonner";
import {
  languages,
  type Language,
  type Lesson,
  type LearningState,
  type Session,
} from "@/features/otsjoba/lib/learning";
import { speak } from "@/features/otsjoba/lib/speech";

type Message = {
  role: "assistant" | "user";
  text: string;
  translation?: string;
  transliteration?: string;
  sample?: boolean;
  correction?: {
    original: string;
    improved: string;
    explanation: string;
  } | null;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export default function Conversation({
  lesson,
  language,
  mode,
  preferences,
  onClose,
  onFinish,
  onSaveWord,
}: {
  lesson: Lesson;
  language: Language;
  mode: "guided" | "ai";
  preferences: LearningState;
  onClose: () => void;
  onFinish: (session: Session) => void;
  onSaveWord: (word: string) => void;
}) {
  const tutor = languages[language];
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: lesson.opening,
      translation: lesson.openingTranslation,
      transliteration: lesson.openingTransliteration,
    },
    ...(mode === "guided"
      ? [
          {
            role: "assistant" as const,
            text: lesson.steps[0].question,
            translation: lesson.steps[0].translation,
            transliteration: lesson.steps[0].transliteration,
          },
        ]
      : []),
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [hint, setHint] = useState(false);
  const [translations, setTranslations] = useState(preferences.translations);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [micSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      !!(
        (window as SpeechWindow).SpeechRecognition ||
        (window as SpeechWindow).webkitSpeechRecognition
      ),
  );
  const [micConsent, setMicConsent] = useState(false);
  const [micInfo, setMicInfo] = useState(false);
  const [exit, setExit] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const bottom = useRef<HTMLDivElement>(null),
    recognition = useRef<Recognition | null>(null),
    lastActivity = useRef(Date.now()),
    request = useRef<AbortController | null>(null),
    saved = useRef(false),
    locked = useRef(false);
  const userTurns = messages.filter((m) => m.role === "user").length,
    finished =
      mode === "guided" && answered && step === lesson.steps.length - 1;
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastActivity.current < 90000
      )
        setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onerror = null;
        recognition.current.onend = null;
        recognition.current.abort();
      }
      request.current?.abort();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);
  function close() {
    if (userTurns || input.trim()) setExit(true);
    else onClose();
  }
  function finish() {
    if (saved.current || !userTurns) return;
    saved.current = true;
    onFinish({
      id: crypto.randomUUID(),
      language,
      lessonId: lesson.id,
      title: mode === "ai" ? `Fri samtale med ${tutor.tutor}` : lesson.title,
      date: new Date().toISOString(),
      seconds,
      turns: userTurns,
      mode,
    });
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value || locked.current || busy || (mode === "guided" && answered))
      return;
    locked.current = true;
    lastActivity.current = Date.now();
    setError("");
    if (recognition.current) {
      recognition.current.onresult = null;
      recognition.current.onerror = null;
      recognition.current.onend = null;
      recognition.current.abort();
      recognition.current = null;
    }
    setListening(false);
    const next: Message[] = [...messages, { role: "user", text: value }];
    setMessages(next);
    setInput("");
    setHint(false);
    if (mode === "guided") {
      const current = lesson.steps[step];
      const sample = current.expected[0];
      setMessages([
        ...next,
        {
          role: "assistant",
          text: sample,
          translation: current.hint,
          sample: true,
        },
      ]);
      setAnswered(true);
      if (preferences.autoSpeak) speak(sample, language);
      locked.current = false;
      return;
    }
    setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/otsjoba/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          level: preferences.levels[language],
          correction: preferences.correction,
          topic: lesson.title,
          messages: next
            .slice(-24)
            .map((m) => ({ role: m.role, content: m.text })),
        }),
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        error?: string;
        reply: string;
        translation: string;
        transliteration: string;
        correction: Message["correction"];
      };
      if (!response.ok)
        throw new Error(
          data.error || "Samtalen kunne ikke fortsette. Prøv igjen.",
        );
      setMessages([
        ...next,
        {
          role: "assistant",
          text: data.reply,
          translation: data.translation,
          transliteration: data.transliteration,
          correction: data.correction,
        },
      ]);
      if (preferences.autoSpeak) speak(data.reply, language);
    } catch (err) {
      if (!saved.current) {
        setMessages(messages);
        setInput(value);
        setError(
          err instanceof Error && err.name === "AbortError"
            ? "Svaret tok for lang tid. Teksten din er beholdt; prøv igjen."
            : err instanceof Error
              ? err.message
              : "Kunne ikke hente svar.",
        );
      }
    } finally {
      clearTimeout(timeout);
      setBusy(false);
      locked.current = false;
    }
  }
  function nextStep() {
    lastActivity.current = Date.now();
    const n = step + 1;
    setStep(n);
    setAnswered(false);
    const current = lesson.steps[n];
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: current.question,
        translation: current.translation,
        transliteration: current.transliteration,
      },
    ]);
    if (preferences.autoSpeak) speak(current.question, language);
  }
  function startMic() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    if (!micConsent) {
      setMicInfo(true);
      return;
    }
    activateMic();
  }
  function activateMic() {
    const Constructor =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!Constructor) return;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const r = new Constructor();
    r.lang = tutor.locale;
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript;
      if (text) setInput((s) => (s ? s + " " : "") + text);
      lastActivity.current = Date.now();
    };
    r.onerror = (event) => {
      setListening(false);
      if (event.error === "aborted") return;
      toast.error(
        event.error === "not-allowed"
          ? "Mikrofontilgang ble avslått. Du kan skrive svaret i stedet."
          : "Diktering er ikke tilgjengelig akkurat nå. Du kan skrive svaret.",
      );
    };
    r.onend = () => setListening(false);
    recognition.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      toast.error("Kunne ikke starte mikrofonen.");
    }
  }
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          className="conversation-dialog translate-x-0 translate-y-0 md:translate-x-[-50%] md:translate-y-[-50%]"
          showCloseButton={false}
        >
          <header className="conversation-header">
            <img src={tutor.image} alt="" />
            <div>
              <DialogTitle>
                {tutor.tutor}{" "}
                <span>
                  {tutor.flag} {preferences.levels[language]}
                </span>
              </DialogTitle>
              <DialogDescription>
                {mode === "guided" ? lesson.title : "Fri AI-samtale"}
              </DialogDescription>
            </div>
            <span className="session-timer">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
            <button
              className="icon-button"
              aria-label="Lukk samtalen"
              onClick={close}
            >
              <X size={20} />
            </button>
          </header>
          <div className="conversation-options">
            <span className="mode-label">
              {mode === "guided" ? "Veiledet øvelse" : "AI-samtale"}
            </span>
            <button
              className={"text-button " + (translations ? "selected" : "")}
              aria-pressed={translations}
              onClick={() => setTranslations((t) => !t)}
            >
              <Languages size={16} />
              Norsk støtte
            </button>
          </div>
          {mode === "guided" && (
            <div className="lesson-progress">
              <Progress
                value={
                  ((step + (answered ? 1 : 0)) / lesson.steps.length) * 100
                }
                aria-label="Fremgang i øvelsen"
              />
              <span>
                Trinn {step + 1} av {lesson.steps.length}
              </span>
            </div>
          )}
          <div
            className="conversation-messages"
            role="log"
            aria-label="Samtale"
            aria-live="polite"
          >
            {mode === "guided" && (
              <p className="guided-notice">
                Svar med egne ord, og sammenlign med et eksempelsvar. Denne
                øvelsen vurderer ikke svaret ditt automatisk.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                className={"message " + m.role + (m.sample ? " sample" : "")}
                key={i}
              >
                {m.role === "assistant" && (
                  <span className="message-label">
                    {m.sample ? "EKSEMPELSVAR" : tutor.tutor.toUpperCase()}
                  </span>
                )}
                <p lang={language}>{m.text}</p>
                {preferences.transliteration && m.transliteration && (
                  <span className="transliteration">{m.transliteration}</span>
                )}
                {(translations || m.sample) && m.translation && (
                  <p className="message-translation">{m.translation}</p>
                )}
                {m.correction && (
                  <div className="correction">
                    <strong>En mer naturlig formulering</strong>
                    <del>{m.correction.original}</del>
                    <span lang={language}>{m.correction.improved}</span>
                    <p>{m.correction.explanation}</p>
                  </div>
                )}
                {m.role === "assistant" && (
                  <button
                    className="message-listen"
                    aria-label={`Hør melding ${i + 1}`}
                    onClick={() => speak(m.text, language)}
                  >
                    <Volume2 size={16} />
                    Lytt
                  </button>
                )}
              </div>
            ))}
            {busy && (
              <div className="waiting">
                <LoaderCircle size={18} className="spin" />
                {tutor.tutor} tenker …
              </div>
            )}
            {finished && (
              <div className="lesson-complete">
                <span className="complete-icon">
                  <Check size={24} />
                </span>
                <h3>Godt jobbet. Du tok ordet!</h3>
                <p>Ta med deg noen uttrykk til neste samtale.</p>
                <div className="lesson-words">
                  {lesson.vocabulary.map((w) => (
                    <button
                      className={
                        preferences.saved[language].includes(w.word)
                          ? "saved"
                          : ""
                      }
                      key={w.word}
                      aria-pressed={preferences.saved[language].includes(
                        w.word,
                      )}
                      onClick={() => onSaveWord(w.word)}
                    >
                      <Bookmark size={14} />
                      {w.word}
                    </button>
                  ))}
                </div>
                <button className="button primary" onClick={finish}>
                  Lagre og avslutt
                  <Check size={18} />
                </button>
              </div>
            )}
            <div ref={bottom} />
          </div>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {!finished && (
            <div className="conversation-compose">
              {mode === "guided" && answered ? (
                <button
                  className="button primary next-question"
                  onClick={nextStep}
                >
                  Neste spørsmål
                  <ArrowRight size={18} />
                </button>
              ) : (
                <>
                  <div className="composer-help">
                    {mode === "guided" ? (
                      <button
                        className="text-button"
                        onClick={() => {
                          setHint((v) => !v);
                          lastActivity.current = Date.now();
                        }}
                      >
                        <Lightbulb size={16} />
                        {hint ? "Skjul hjelp" : "Jeg trenger litt hjelp"}
                      </button>
                    ) : (
                      <button
                        className="text-button"
                        disabled={!userTurns || busy}
                        onClick={finish}
                      >
                        Avslutt og lagre økten
                        <Check size={16} />
                      </button>
                    )}
                    <span>{input.length}/2000</span>
                  </div>
                  {hint && (
                    <div className="hint-box">
                      <strong>En mulig start</strong>
                      <p lang={language}>{lesson.steps[step].expected[0]}</p>
                      <span>{lesson.steps[step].hint}</span>
                    </div>
                  )}
                  <form onSubmit={submit} className="composer-form">
                    <textarea
                      aria-label="Ditt svar"
                      placeholder={
                        language === "it"
                          ? "Scrivi qui… eller bruk mikrofonen"
                          : "Напиши здесь… eller bruk mikrofonen"
                      }
                      value={input}
                      maxLength={2000}
                      disabled={busy}
                      onChange={(e) => {
                        setInput(e.target.value);
                        lastActivity.current = Date.now();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                    />
                    <div>
                      <button
                        type="button"
                        className={
                          "icon-button mic-button " +
                          (listening ? "listening" : "")
                        }
                        disabled={!micSupported || busy}
                        aria-label={
                          listening ? "Stopp diktering" : "Dikter svaret"
                        }
                        title={
                          micSupported
                            ? "Dikter og se gjennom teksten før du sender"
                            : "Nettleseren støtter ikke diktering"
                        }
                        onClick={startMic}
                      >
                        {listening ? <Square size={20} /> : <Mic size={20} />}
                      </button>
                      <button
                        type="submit"
                        className="send-button"
                        aria-label="Send svar"
                        disabled={!input.trim() || busy}
                      >
                        {busy ? (
                          <LoaderCircle size={20} className="spin" />
                        ) : (
                          <Send size={20} />
                        )}
                      </button>
                    </div>
                  </form>
                  <p className="composer-note">
                    {listening
                      ? "Lytter … Teksten vises her før du sender."
                      : "Enter for å sende · Shift + Enter for ny linje"}
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={exit} onOpenChange={setExit}>
        <AlertDialogContent>
          <AlertDialogTitle>Avslutte øvelsen?</AlertDialogTitle>
          <AlertDialogDescription>
            Økten er ikke lagret ennå. Du kan fortsette øvelsen eller lukke uten
            å lagre.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Fortsett øvelsen</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>
              Lukk uten å lagre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={micInfo} onOpenChange={setMicInfo}>
        <AlertDialogContent>
          <AlertDialogTitle>Dikter med nettleseren</AlertDialogTitle>
          <AlertDialogDescription>
            Nettleserens talegjenkjenning kan sende lyd til
            nettleserleverandøren. Otsjoba lagrer ikke lyden. Du ser gjennom
            teksten før du sender den.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Skriv i stedet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMicConsent(true);
                activateMic();
              }}
            >
              Start diktering
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
