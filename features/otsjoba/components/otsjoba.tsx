/* eslint-disable @next/next/no-img-element -- Local original portraits served directly; no image optimization service required. */
"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Bookmark,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Coffee,
  Compass,
  Flame,
  GraduationCap,
  Headphones,
  House,
  MessageCircle,
  Settings,
  Sparkles,
  Target,
  Train,
  Utensils,
  Volume2,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/features/otsjoba/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/features/otsjoba/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/features/otsjoba/components/ui/select";
import { Switch } from "@/features/otsjoba/components/ui/switch";
import { Progress } from "@/features/otsjoba/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/features/otsjoba/components/ui/tabs";
import { Toaster, toast } from "sonner";
import {
  allWords,
  curriculum,
  languages,
  levels,
  localDate,
  orderedLessons,
  parseState,
  scheduleReview,
  storageKey,
  streak,
  type Language,
  type LearningState,
  type Lesson,
  type Level,
  type Session,
  type Word,
} from "@/features/otsjoba/lib/learning";
import Conversation from "@/features/otsjoba/components/conversation";
import { speak } from "@/features/otsjoba/lib/speech";
import { useAccountProgress } from "@/features/otsjoba/hooks/use-account-progress";
import { progressSchema, type ProgressSnapshot } from "@/features/otsjoba/lib/progress";
import { signOut } from "@/lib/auth/client";

type View = "today" | "learn" | "tutors" | "words" | "progress";
const nav = [
  { id: "today", label: "Min dag", icon: House },
  { id: "learn", label: "Læringsløp", icon: Compass },
  { id: "tutors", label: "Mine tutorer", icon: MessageCircle },
  { id: "words", label: "Ordsamling", icon: Bookmark },
  { id: "progress", label: "Min fremgang", icon: ChartNoAxesCombined },
] as const;
const icons: Record<string, typeof Coffee> = {
  coffee: Coffee,
  hand: MessageCircle,
  wave: MessageCircle,
  train: Train,
  utensils: Utensils,
  compass: Compass,
};

function Navigation({
  view,
  setView,
  settings,
  email,
  navigate,
  logout,
}: {
  view: View;
  setView: (v: View) => void;
  settings: () => void;
  email: string;
  navigate: (path: string) => void;
  logout: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar className="app-sidebar" collapsible="offcanvas">
      <SidebarHeader>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("today");
            setOpenMobile(false);
          }}
          aria-label="Otsjoba hjem"
        >
          <span className="brand-mark">
            o<span>•</span>
          </span>
          otsjoba<span className="brand-period">.</span>
        </a>
        <p className="sidebar-tagline">Litt øving. Mer flyt.</p>
      </SidebarHeader>
      <SidebarContent>
        <div className="nav-eyebrow">DITT SPRÅKROM</div>
        <nav aria-label="Hovedmeny">
          {nav.map((n) => (
            <button
              key={n.id}
              aria-current={view === n.id ? "page" : undefined}
              className={"nav-item " + (view === n.id ? "active" : "")}
              onClick={() => {
                setView(n.id);
                setOpenMobile(false);
              }}
            >
              <n.icon size={20} />
              {n.label}
              {view === n.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-spark">✳</span>
          <p>
            Små samtaler.
            <br />
            Store fremskritt.
          </p>
          <span>Én økt av gangen.</span>
        </div>
      </SidebarContent>
      <SidebarFooter>
        {/* A document navigation keeps the separate apps' global styles isolated. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="nav-item" href="/" onClick={(event) => { event.preventDefault(); navigate("/"); }}>
          <House size={19} />
          Tilbake til thodh.com
        </a>
        <button
          className="nav-item"
          onClick={() => {
            settings();
            setOpenMobile(false);
          }}
        >
          <Settings size={19} />
          Innstillinger
        </button>
        <button className="nav-item" onClick={() => navigate("/konto")}>Kontoen min</button>
        <button className="nav-item" onClick={logout}>Logg ut</button>
        <div className="profile">
          <div className="profile-initial">{email[0].toUpperCase()}</div>
          <div>
            <strong>Din språkreise</strong>
            <span className="account-email" title={email}>{email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function LessonCard({
  lesson,
  index,
  complete,
  onClick,
}: {
  lesson: Lesson;
  index: number;
  complete: boolean;
  onClick: () => void;
}) {
  const Icon = icons[lesson.icon] || MessageCircle;
  return (
    <button className="lesson-card" onClick={onClick}>
      <div className={"lesson-icon tone-" + (index % 3)}>
        <Icon size={24} />
      </div>
      <div className="lesson-meta">
        <span>{lesson.level}</span>
        <span>·</span>
        <span>{lesson.steps.length} samtaletrinn</span>
        {complete && <Check size={15} className="green" />}
      </div>
      <h3>{lesson.title}</h3>
      <p>{lesson.subtitle}</p>
      <span className="lesson-action">
        {complete ? "Øv en gang til" : "Åpne øvelse"}
        <ArrowRight size={17} />
      </span>
    </button>
  );
}

export default function Otsjoba({ userId, email, initial, initialNow }: { userId: string; email: string; initial: ProgressSnapshot; initialNow: number }) {
  const account = useAccountProgress(userId, initial);
  const { state, setState } = account;
  const [legacy, setLegacy] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [now, setNow] = useState(initialNow);
  const [view, setView] = useState<View>("today");
  const [settings, setSettings] = useState(false);
  const [active, setActive] = useState<{
    lesson: Lesson;
    mode: "guided" | "ai";
  } | null>(null);
  const [connection, setConnection] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [wordFilter, setWordFilter] = useState("all");
  const [practice, setPractice] = useState<Word[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  // Unowned legacy progress requires an explicit choice before importing.
  useEffect(() => {
    if (initial.revision === 0) try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Legacy browser data is available only after hydration.
      setLegacy(localStorage.getItem(storageKey));
    } catch { /* Cloud storage does not need localStorage. */ }
    if ("speechSynthesis" in window) speechSynthesis.getVoices();
    fetch("/otsjoba/api/tutor")
      .then((r) => r.json() as Promise<{ available?: boolean }>)
      .then((d) => setAiAvailable(d.available === true))
      .catch(() => {});
  }, [initial.revision]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const lang = state.language,
    tutor = languages[lang],
    lessons = orderedLessons(lang, state.levels[lang]),
    nextLesson =
      lessons.find(
        (l) =>
          !state.sessions.some(
            (s) =>
              s.language === lang && s.mode === "guided" && s.lessonId === l.id,
          ),
      ) || lessons[0];
  const today = localDate(new Date(now)),
    todaySeconds = state.sessions
      .filter((s) => localDate(new Date(s.date)) === today)
      .reduce((a, s) => a + s.seconds, 0),
    todayMinutes = Math.floor(todaySeconds / 60),
    dayStreak = streak(state.sessions, new Date(now)),
    completed = new Set(
      state.sessions
        .filter((s) => s.language === lang && s.mode === "guided")
        .map((s) => s.lessonId),
    );
  const words = allWords(lang),
    saved = state.saved[lang],
    due = words.filter(
      (w) =>
        !state.reviews[lang + ":" + w.word] ||
        state.reviews[lang + ":" + w.word].due <= now,
    );
  const update = (patch: Partial<LearningState>) =>
    setState((s) => ({ ...s, ...patch }));
  const changeLanguage = (value: Language) => {
    update({ language: value });
    setWordFilter("all");
  };
  function saveWord(word: string) {
    setState((s) => ({
      ...s,
      saved: {
        ...s.saved,
        [lang]: s.saved[lang].includes(word)
          ? s.saved[lang].filter((w) => w !== word)
          : [...s.saved[lang], word],
      },
    }));
  }
  function finish(session: Session) {
    setState((s) => ({ ...s, sessions: [...s.sessions, session].slice(-1000) }));
    setActive(null);
    toast.success("Økten er fullført. Godt jobbet!");
  }
  function startPractice() {
    const list =
      wordFilter === "saved"
        ? words.filter((w) => saved.includes(w.word))
        : wordFilter === "all"
          ? words
          : due;
    if (!list.length) {
      toast.info("Ingen ord klare for repetisjon nå.");
      return;
    }
    setPractice(list);
    setPracticeIndex(0);
    setFlipped(false);
  }
  function reviewWord(remembered: boolean) {
    if (!practice) return;
    const key = lang + ":" + practice[practiceIndex].word;
    setState((s) => ({
      ...s,
      reviews: {
        ...s.reviews,
        [key]: scheduleReview(s.reviews[key], remembered),
      },
    }));
    setFlipped(false);
    setPracticeIndex((i) => i + 1);
  }
  function downloadProgress() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `otsjoba-fremgang-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function navigate(path: string) {
    if (await account.flush()) window.location.assign(path);
    else toast.error("Fremgangen er ikke lagret. Se meldingen øverst på siden.");
  }
  async function logout() {
    if (!await account.flush()) { toast.error("Lagre eller eksporter fremgangen før du logger ut."); return; }
    try { await signOut(); account.invalidate(); }
    catch { toast.error("Kunne ikke logge ut. Prøv igjen."); }
  }
  async function importLegacy() {
    if (!legacy || account.revision !== 0) return;
    setImporting(true);
    try {
      if (JSON.parse(legacy)?.version !== 1) throw new Error("format");
      const imported = progressSchema.parse(parseState(legacy));
      setState(imported);
      if (await account.flush()) {
        try { if (localStorage.getItem(storageKey) === legacy) localStorage.removeItem(storageKey); } catch { /* Import is saved remotely. */ }
        setLegacy(null); toast.success("Fremgangen er importert til kontoen din.");
      }
    } catch { toast.error("Den gamle fremgangen kunne ikke importeres. Den er beholdt i nettleseren."); }
    finally { setImporting(false); }
  }
  if (account.status === "signed-out") return <main className="account-notice"><h1>Logg inn igjen</h1><p>Innloggingen er avsluttet eller kontoen er endret. Åpne Otsjoba på nytt for å fortsette.</p><a href="/logg-inn">Til innlogging</a></main>;
  if (account.status === "conflict") return <main className="account-notice"><h1>Nyere fremgang finnes</h1><p>{account.error}</p><button onClick={downloadProgress}>Eksporter ulagret fremgang</button><button onClick={() => { account.invalidate(); window.location.reload(); }}>Hent nyeste fremgang</button></main>;
  return (
    <SidebarProvider style={{ "--sidebar-width": "232px" } as CSSProperties}>
      <Navigation
        view={view}
        setView={setView}
        settings={() => setSettings(true)}
        email={email}
        navigate={navigate}
        logout={logout}
      />
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <SidebarTrigger className="mobile-menu" />
            <span>DIN PERSONLIGE SPRÅKREISE</span>
          </div>
          <div className="topbar-actions">
            <div className="streak-pill">
              <Flame size={18} />
              <strong>{dayStreak}</strong>
              <span>{dayStreak === 1 ? "dag" : "dager"}</span>
            </div>
            <Select
              value={lang}
              onValueChange={(v) => changeLanguage(v as Language)}
            >
              <SelectTrigger
                aria-label="Velg språk"
                className="language-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">🇮🇹 Italiensk</SelectItem>
                <SelectItem value="ru">🇷🇺 Russisk</SelectItem>
              </SelectContent>
            </Select>
            <button
              className="user-avatar"
              aria-label="Åpne innstillinger"
              onClick={() => setSettings(true)}
            >
              {email[0].toUpperCase()}
            </button>
          </div>
        </header>
        <main className="workspace" id="main-content">
          <div className="account-save-status" role="status" aria-live="polite">
            {account.status === "saved" ? account.revision ? "✓ Lagret på kontoen din" : "Privat fremgang på kontoen din" : account.status === "pending" || account.status === "saving" ? "Lagrer fremgangen…" : account.error}
            {account.status === "error" && <button onClick={() => { void account.flush(); }}>Prøv å lagre igjen</button>}
            {account.status === "error" && <button onClick={downloadProgress}>Eksporter fremgang</button>}
          </div>
          {legacy && account.revision === 0 && <section className="legacy-import" aria-label="Gammel fremgang"><strong>Har du øvd her før?</strong><p>Denne nettleseren har gammel fremgang uten konto. Importer bare hvis den er din.</p><button disabled={importing} onClick={importLegacy}>{importing ? "Importerer…" : "Importer min gamle fremgang"}</button><button onClick={() => setLegacy(null)}>Hopp over</button></section>}
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {view === "today"
                  ? "VELKOMMEN TILBAKE"
                  : view === "learn"
                    ? "ETT STEG VIDERE"
                    : view === "tutors"
                      ? "GODT SELSKAP, GOD ØVING"
                      : view === "words"
                        ? "ORD SOM BLIR MED DEG"
                        : "SE HVA DU HAR GJORT"}
              </p>
              <h1>
                {view === "today"
                  ? "Hva vil du snakke om i dag?"
                  : view === "learn"
                    ? "Din vei til bedre flyt."
                    : view === "tutors"
                      ? "Møt språktutorene dine."
                      : view === "words"
                        ? "Gjør ordene til dine."
                        : "Små steg teller."}
              </h1>
              <p className="heading-sub">
                {view === "today"
                  ? "Finn ordene. Prøv deg frem. Gjør språket til ditt."
                  : view === "learn"
                    ? `${tutor.name} · Tilpasset ditt valgte nivå ${state.levels[lang]}`
                    : view === "tutors"
                      ? "En fast samtalepartner for hvert språk."
                      : view === "words"
                        ? `${words.length} ord og uttrykk fra samtaleøvelsene dine.`
                        : "Fremgangen din, basert på økter du har gjennomført."}
              </p>
            </div>
            {view === "today" && (
              <span className="date-label">
                {new Date(now).toLocaleDateString("nb-NO", {
                  day: "numeric",
                  month: "long",
                })}
              </span>
            )}
          </div>
          {view === "today" && (
            <div className="dashboard-grid">
              <div className="dashboard-primary">
                <section className={"conversation-hero " + lang}>
                  <div className="hero-copy">
                    <span className="hero-kicker">
                      <span className="flag">{tutor.flag}</span> {tutor.name}{" "}
                      <span className="hero-level">{state.levels[lang]}</span>
                    </span>
                    <h2>
                      {lang === "it" ? (
                        <>
                          Un po’ di pratica.
                          <br />
                          Mye mer selvtillit.
                        </>
                      ) : (
                        <>
                          Давай поговорим.
                          <br />
                          Finn din egen flyt.
                        </>
                      )}
                    </h2>
                    <p>
                      {lang === "it"
                        ? "Giulia er klar for en ny samtale. Er du?"
                        : "Sasha har nye spørsmål og perspektiver til deg."}
                    </p>
                    <button
                      className="button white"
                      disabled={!nextLesson}
                      onClick={() =>
                        nextLesson &&
                        setActive({ lesson: nextLesson, mode: "guided" })
                      }
                    >
                      <MessageCircle size={19} />
                      Start samtaleøvelse
                      <ArrowRight size={18} />
                    </button>
                    <span className="hero-footnote">
                      {nextLesson?.title} · {nextLesson?.steps.length || 3}{" "}
                      trinn
                    </span>
                  </div>
                  <div className="hero-portrait">
                    <img
                      src={tutor.image}
                      alt={`${tutor.tutor}, din ${lang === "it" ? "italienske" : "russiske"} tutor`}
                    />
                    <div className="portrait-caption">
                      <span>{tutor.greeting}</span>
                      <strong>
                        {tutor.tutor}
                        <span>Din språktutor</span>
                      </strong>
                    </div>
                  </div>
                </section>
                <div className="section-heading">
                  <h2>En liten økt, et stort steg</h2>
                  <button
                    className="text-button"
                    onClick={() => setView("learn")}
                  >
                    Se læringsløpet
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="lesson-grid">
                  {lessons.slice(0, 3).map((l, i) => (
                    <LessonCard
                      key={l.id}
                      lesson={l}
                      index={i}
                      complete={completed.has(l.id)}
                      onClick={() => setActive({ lesson: l, mode: "guided" })}
                    />
                  ))}
                </div>
                <section className="vocab-banner">
                  <div className="vocab-symbol">
                    <Bookmark size={24} />
                  </div>
                  <div>
                    <h3>Ordene du møter, er verdt å beholde.</h3>
                    <p>Repeter uttrykk fra øvelsene og bruk dem neste gang.</p>
                  </div>
                  <button
                    className="button outline"
                    onClick={() => setView("words")}
                  >
                    Øv på ord
                    <ArrowRight size={17} />
                  </button>
                </section>
              </div>
              <aside className="dashboard-aside">
                <section className="goal-card">
                  <div className="section-heading compact">
                    <h3>Dagens lille mål</h3>
                    <Target size={21} />
                  </div>
                  <div
                    className="goal-ring"
                    style={
                      {
                        "--goal":
                          Math.min(100, (todayMinutes / state.goal) * 100) +
                          "%",
                      } as CSSProperties
                    }
                  >
                    <div>
                      <strong>
                        {todayMinutes}
                        <span>/{state.goal}</span>
                      </strong>
                      <span>minutter i dag</span>
                    </div>
                  </div>
                  <p>
                    {todayMinutes >= state.goal
                      ? "Målet er nådd. Godt jobbet!"
                      : `${state.goal} minutter nærmere ordene du leter etter.`}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setSettings(true)}
                  >
                    Juster målet
                    <ChevronRight size={15} />
                  </button>
                </section>
                <section className="languages-card">
                  <h3>Mine språk</h3>
                  {(["it", "ru"] as Language[]).map((l) => {
                    const count = new Set(
                      state.sessions
                        .filter((s) => s.language === l && s.mode === "guided")
                        .map((s) => s.lessonId),
                    ).size;
                    return (
                      <button
                        key={l}
                        className={
                          "language-row " + (l === lang ? "selected" : "")
                        }
                        onClick={() => changeLanguage(l)}
                      >
                        <span className="language-flag">
                          {languages[l].flag}
                        </span>
                        <span>
                          <strong>
                            {languages[l].name}
                            <b>{state.levels[l]}</b>
                          </strong>
                          <span>
                            {count} av {curriculum[l].length} øvelser
                            gjennomført
                          </span>
                          <Progress
                            value={(count / curriculum[l].length) * 100}
                            aria-label={`Fremgang ${languages[l].name}`}
                          />
                        </span>
                      </button>
                    );
                  })}
                </section>
                <section className="quote-card">
                  <Sparkles size={22} />
                  <p>
                    Du trenger ikke finne
                    <br />
                    <em>de perfekte ordene.</em>
                    <br />
                    Bare de neste.
                  </p>
                  <span>DU LÆRER NÅR DU PRØVER</span>
                </section>
              </aside>
            </div>
          )}
          {view === "learn" && (
            <>
              <div className="course-summary">
                <GraduationCap />
                <div>
                  <strong>
                    {tutor.native} · {state.levels[lang]}
                  </strong>
                  <p>{tutor.focus} Øvelser nær ditt nivå vises først.</p>
                </div>
                <span>
                  {completed.size}/{lessons.length} gjennomført
                </span>
              </div>
              <div className="lesson-grid course-grid">
                {lessons.map((l, i) => (
                  <LessonCard
                    key={l.id}
                    lesson={l}
                    index={i}
                    complete={completed.has(l.id)}
                    onClick={() => setActive({ lesson: l, mode: "guided" })}
                  />
                ))}
              </div>
            </>
          )}
          {view === "tutors" && (
            <>
              <div className="tutor-grid">
                {(["it", "ru"] as Language[]).map((l) => (
                  <article className={"tutor-card " + l} key={l}>
                    <div className="tutor-photo">
                      <img src={languages[l].image} alt={languages[l].tutor} />
                      <span>
                        {languages[l].flag} {languages[l].native}
                      </span>
                    </div>
                    <div className="tutor-info">
                      <p className="eyebrow">
                        DIN {languages[l].name.toUpperCase()}TUTOR
                      </p>
                      <h2>{languages[l].tutor}</h2>
                      <p>
                        {l === "it"
                          ? "Varm, nysgjerrig og glad i de gode hverdagssamtalene. Øv på å fortelle historier og begrunne meningene dine."
                          : "Rolig, reflektert og glad i nyanser. Utfordre deg selv med diskusjon, argumentasjon og mer presise formuleringer."}
                      </p>
                      <div className="tutor-tags">
                        <span>{state.levels[l]}</span>
                        <span>Norsk støtte</span>
                        <span>
                          {l === "it"
                            ? "Hverdagsliv & kultur"
                            : "Perspektiver & diskusjon"}
                        </span>
                      </div>
                      <button
                        className="button primary"
                        onClick={() => {
                          changeLanguage(l);
                          setActive({
                            lesson: orderedLessons(l, state.levels[l])[0],
                            mode: "guided",
                          });
                        }}
                      >
                        Øv med {languages[l].tutor}
                        <ArrowRight size={18} />
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          changeLanguage(l);
                          if (aiAvailable)
                            setActive({
                              lesson: orderedLessons(l, state.levels[l])[0],
                              mode: "ai",
                            });
                          else setConnection(true);
                        }}
                      >
                        <Sparkles size={16} />
                        Fri AI-samtale
                        {!aiAvailable && (
                          <span className="small-tag">Koble til senere</span>
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <p className="privacy-note">
                <Headphones size={17} />
                Opplesning bruker stemmene i nettleseren din. Mikrofon støttes i
                enkelte nettlesere.
              </p>
            </>
          )}
          {view === "words" && (
            <>
              <div className="words-toolbar">
                <Tabs value={wordFilter} onValueChange={setWordFilter}>
                  <TabsList>
                    <TabsTrigger value="all">
                      Alle ord ({words.length})
                    </TabsTrigger>
                    <TabsTrigger value="saved">
                      Lagrede ({saved.length})
                    </TabsTrigger>
                    <TabsTrigger value="due">
                      Til repetisjon ({due.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <button className="button primary" onClick={startPractice}>
                  <BookOpen size={18} />
                  Start ordtrening
                </button>
              </div>
              <div className="word-list">
                {(wordFilter === "saved"
                  ? words.filter((w) => saved.includes(w.word))
                  : wordFilter === "due"
                    ? due
                    : words
                ).map((w) => (
                  <article className="word-row" key={w.word}>
                    <button
                      className="icon-button"
                      aria-label={`Hør ${w.word}`}
                      onClick={() => speak(w.word, lang)}
                    >
                      <Volume2 size={19} />
                    </button>
                    <div>
                      <strong lang={lang}>{w.word}</strong>
                      {state.transliteration && w.transliteration && (
                        <span>{w.transliteration}</span>
                      )}
                    </div>
                    <p>{w.translation}</p>
                    <button
                      className={
                        "icon-button " + (saved.includes(w.word) ? "saved" : "")
                      }
                      onClick={() => saveWord(w.word)}
                      aria-label={`${saved.includes(w.word) ? "Fjern" : "Lagre"} ${w.word}`}
                      aria-pressed={saved.includes(w.word)}
                    >
                      <Bookmark size={19} />
                    </button>
                  </article>
                ))}
              </div>
              {wordFilter === "saved" && !saved.length && (
                <div className="empty-state">
                  <Bookmark size={36} />
                  <h2>Samle ordene du vil huske</h2>
                  <p>Trykk på bokmerket ved et ord for å lagre det her.</p>
                </div>
              )}
              {wordFilter === "due" && !due.length && (
                <div className="empty-state">
                  <Check size={36} />
                  <h2>Du er à jour!</h2>
                  <p>Ordene kommer tilbake når det er tid for å repetere.</p>
                </div>
              )}
            </>
          )}
          {view === "progress" && (
            <>
              <div className="stat-grid">
                <article>
                  <MessageCircle />
                  <strong>{state.sessions.length}</strong>
                  <span>gjennomførte økter</span>
                </article>
                <article>
                  <Flame />
                  <strong>{dayStreak}</strong>
                  <span>dager på rad</span>
                </article>
                <article>
                  <Headphones />
                  <strong>
                    {Math.floor(
                      state.sessions.reduce((a, s) => a + s.seconds, 0) / 60,
                    )}
                  </strong>
                  <span>minutter med øving</span>
                </article>
                <article>
                  <Bookmark />
                  <strong>
                    {state.saved.it.length + state.saved.ru.length}
                  </strong>
                  <span>lagrede ord</span>
                </article>
              </div>
              <section className="activity-card">
                <h2>Den siste uken</h2>
                <div className="activity-bars">
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(now);
                    d.setDate(d.getDate() - 6 + i);
                    const seconds = state.sessions
                      .filter(
                        (s) => localDate(new Date(s.date)) === localDate(d),
                      )
                      .reduce((a, s) => a + s.seconds, 0);
                    const minutes = Math.floor(seconds / 60);
                    return (
                      <div key={i}>
                        <span>{minutes} min</span>
                        <div className="bar-track">
                          <div
                            style={{
                              height: `${Math.min(100, (seconds / (state.goal * 60)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span>
                          {d.toLocaleDateString("nb-NO", { weekday: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
              <div className="section-heading">
                <h2>Øktene dine</h2>
              </div>
              {!state.sessions.length ? (
                <div className="empty-state">
                  <Compass size={38} />
                  <h3>Din første økt venter på deg</h3>
                  <p>
                    Gjennomfør en samtaleøvelse, så starter historikken din her.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => setView("today")}
                  >
                    Finn en øvelse
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="word-list">
                  {state.sessions
                    .slice()
                    .reverse()
                    .map((s) => (
                      <article className="session-row" key={s.id}>
                        <span className="language-flag">
                          {languages[s.language].flag}
                        </span>
                        <div>
                          <strong>{s.title}</strong>
                          <span>
                            {new Date(s.date).toLocaleDateString("nb-NO")} ·{" "}
                            {s.turns} svar ·{" "}
                            {s.mode === "ai" ? "AI-samtale" : "Veiledet øvelse"}
                          </span>
                        </div>
                        <span>
                          {Math.floor(s.seconds / 60)}:
                          {String(s.seconds % 60).padStart(2, "0")}
                        </span>
                        <Check size={18} className="green" />
                      </article>
                    ))}
                </div>
              )}
            </>
          )}
          <footer className="app-footer">
            <span>
              otsjoba<span> · </span>Plass til å prøve.
            </span>
            <span>Fremgangen lagres privat på kontoen din.</span>
          </footer>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="settings-dialog">
          <DialogTitle>Gjør Otsjoba til din</DialogTitle>
          <DialogDescription>
            Nivåene er dine egne vurderinger. Juster dem når du vil.
          </DialogDescription>
          {(["it", "ru"] as Language[]).map((l) => (
            <div className="setting-row" key={l}>
              <label id={`level-${l}`}>
                {languages[l].flag} {languages[l].name}
              </label>
              <Select
                value={state.levels[l]}
                onValueChange={(v) =>
                  update({ levels: { ...state.levels, [l]: v as Level } })
                }
              >
                <SelectTrigger aria-labelledby={`level-${l}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="setting-row">
            <label id="goal-label">Daglig mål</label>
            <Select
              value={String(state.goal)}
              onValueChange={(v) => update({ goal: Number(v) })}
            >
              <SelectTrigger aria-labelledby="goal-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20, 30].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} minutter
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="setting-row">
            <label htmlFor="translations">Vis norsk oversettelse</label>
            <Switch
              id="translations"
              checked={state.translations}
              onCheckedChange={(v) => update({ translations: v })}
            />
          </div>
          <div className="setting-row">
            <label htmlFor="transliteration">
              Vis russisk med latinske bokstaver
            </label>
            <Switch
              id="transliteration"
              checked={state.transliteration}
              onCheckedChange={(v) => update({ transliteration: v })}
            />
          </div>
          <div className="setting-row">
            <label htmlFor="auto-speak">Les opp tutorsvar automatisk</label>
            <Switch
              id="auto-speak"
              checked={state.autoSpeak}
              onCheckedChange={(v) => update({ autoSpeak: v })}
            />
          </div>
          <div className="setting-row">
            <label id="correction-label">Rettelser i AI-samtaler</label>
            <Select
              value={state.correction}
              onValueChange={(v) =>
                update({ correction: v as LearningState["correction"] })
              }
            >
              <SelectTrigger aria-labelledby="correction-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gentle">Forsiktig</SelectItem>
                <SelectItem value="balanced">Balansert</SelectItem>
                <SelectItem value="detailed">Grundig</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="notice">
            Fri AI-samtale: {aiAvailable ? "tilkoblet" : "ikke tilkoblet ennå"}.
            Veiledede øvelser og ordtrening fungerer uten AI.
          </p>
          <button className="button outline" onClick={downloadProgress}>
            <ArrowDownToLine size={17} />
            Eksporter fremgangen din
          </button>
          <button className="button primary" onClick={() => setSettings(false)}>
            Ferdig
            <Check size={17} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={connection} onOpenChange={setConnection}>
        <DialogContent>
          <div className="connection-icon">
            <Sparkles size={28} />
          </div>
          <DialogTitle>Fri samtale kommer med AI-tilkobling</DialogTitle>
          <DialogDescription>
            Otsjoba er klargjort for OpenAI. Når tilkoblingen aktiveres, kan du
            snakke fritt og få personlige rettelser på italiensk og russisk.
          </DialogDescription>
          <p className="notice">
            Tilkoblingen er foreløpig avslått. Ingen AI-kall eller API-kostnader
            påløper fra appen. Nå kan du bruke veiledede øvelser med
            eksempelsvar.
          </p>
          <button
            className="button primary"
            onClick={() => {
              setConnection(false);
              setView("learn");
            }}
          >
            Utforsk øvelsene
            <ArrowRight size={17} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!practice}
        onOpenChange={(open) => {
          if (!open) setPractice(null);
        }}
      >
        <DialogContent className="practice-dialog">
          <DialogTitle>Ordtrening · {tutor.name}</DialogTitle>
          <DialogDescription>
            {practiceIndex < (practice?.length || 0)
              ? `${practiceIndex + 1} av ${practice?.length} ord. Prøv å huske betydningen før du snur kortet.`
              : "Runden er ferdig. Ordene planlegges for ny repetisjon."}
          </DialogDescription>
          {practice && practiceIndex < practice.length ? (
            <>
              <div className="flashcard">
                <button
                  className="icon-button"
                  aria-label="Hør ordet"
                  onClick={() => speak(practice[practiceIndex].word, lang)}
                >
                  <Volume2 size={24} />
                </button>
                <strong lang={lang}>{practice[practiceIndex].word}</strong>
                {state.transliteration && (
                  <span>{practice[practiceIndex].transliteration}</span>
                )}
                {flipped ? (
                  <p>{practice[practiceIndex].translation}</p>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => setFlipped(true)}
                  >
                    Vis betydningen
                    <ArrowRight size={17} />
                  </button>
                )}
              </div>
              {flipped && (
                <div className="flashcard-actions">
                  <button
                    className="button outline"
                    onClick={() => reviewWord(false)}
                  >
                    Øv igjen
                  </button>
                  <button
                    className="button primary"
                    onClick={() => reviewWord(true)}
                  >
                    Jeg husket det
                    <Check size={17} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Check size={42} />
              <h2>En liten runde rikere.</h2>
              <p>
                Ord du husket, får litt lengre pause. De andre kommer tilbake om
                ti minutter.
              </p>
              <button
                className="button primary"
                onClick={() => setPractice(null)}
              >
                Ferdig
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {active && (
        <Conversation
          lesson={active.lesson}
          mode={active.mode}
          language={lang}
          preferences={state}
          onClose={() => setActive(null)}
          onFinish={finish}
          onSaveWord={saveWord}
        />
      )}
    </SidebarProvider>
  );
}
