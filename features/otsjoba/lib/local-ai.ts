import { validateTutorResponse, type TutorRequest, type TutorResponse } from "./tutor-profile.mjs";

// The owner's own PC runs scripts/lokal-ai.mjs; this browser talks to it on
// 127.0.0.1. The pairing token and engine choice are per device, not per account.
export const bridgeStorageKey = "otsjoba.lokal-ai.v1";
export const defaultBridgePort = 4747;
export const engines = ["chatgpt", "claude"] as const;
export type BridgeEngine = (typeof engines)[number];
export type BridgeSettings = { token: string; port: number; engine: BridgeEngine; model: string; reserve: boolean };
export type BridgeModel = { id: string; name: string };
export type BridgeEngineInfo = { navn: string; tilgjengelig: boolean; modeller: BridgeModel[]; innlogget?: boolean; melding?: string };
export type BridgeHealth = Record<BridgeEngine, BridgeEngineInfo | undefined>;
export type BridgeStatus =
  | { state: "checking" | "unpaired" | "offline" | "denied" | "outdated" }
  | { state: "ready"; health: BridgeHealth };
export type BridgeReply = { reply: TutorResponse; engine: BridgeEngine; model: string };

const token = /^[\w-]{40,128}$/;
const isEngine = (v: unknown): v is BridgeEngine => engines.includes(v as BridgeEngine);
export function parsePairing(value: string): { token: string; port: number } | null {
  const text = value.trim();
  const match = /(?:^|[#&?])lokal-ai=([\w-]+)/.exec(text);
  const candidate = match ? match[1] : text;
  if (!token.test(candidate)) return null;
  const port = Number(/[#&?]port=(\d{4,5})(?:&|$)/.exec(text)?.[1] || defaultBridgePort);
  return { token: candidate, port: port >= 1024 && port <= 65535 ? port : defaultBridgePort };
}

export function readBridgeSettings(): BridgeSettings | null {
  try {
    const p = JSON.parse(localStorage.getItem(bridgeStorageKey) || "null");
    if (!p || typeof p.token !== "string" || !token.test(p.token)) return null;
    return {
      token: p.token,
      port: Number.isInteger(p.port) && p.port >= 1024 && p.port <= 65535 ? p.port : defaultBridgePort,
      engine: isEngine(p.engine) ? p.engine : "chatgpt",
      model: typeof p.model === "string" && p.model.length < 80 ? p.model : "",
      reserve: p.reserve !== false,
    };
  } catch {
    return null;
  }
}

export function saveBridgeSettings(settings: BridgeSettings | null) {
  try {
    if (settings) localStorage.setItem(bridgeStorageKey, JSON.stringify(settings));
    else localStorage.removeItem(bridgeStorageKey);
  } catch { /* Private mode: the pairing lasts for this page only. */ }
}

export function pair(value: string, previous: BridgeSettings | null): BridgeSettings | null {
  const pairing = parsePairing(value);
  if (!pairing) return null;
  const settings: BridgeSettings = { engine: "chatgpt", model: "", reserve: true, ...previous, ...pairing };
  saveBridgeSettings(settings);
  return settings;
}

// Reads `#lokal-ai=<token>` once and removes it from the address bar and history.
// A link with another token than the stored one replaces the pairing only after
// the owner confirms, so a planted link cannot silently redirect the bridge.
export function takePairingFromHash(previous: BridgeSettings | null): BridgeSettings | null {
  const hash = window.location.hash;
  if (!hash.includes("lokal-ai=")) return null;
  history.replaceState(history.state, "", window.location.pathname + window.location.search);
  const pairing = parsePairing(hash);
  if (!pairing) return null;
  if (previous && previous.token !== pairing.token && !window.confirm(
    "Lenken har en annen paringskode enn den Otsjoba allerede er koblet til. Vil du erstatte koblingen til lokal AI?",
  )) return null;
  return pair(hash, previous);
}

const base = (s: BridgeSettings) => `http://127.0.0.1:${s.port}/v1`;
const headers = (s: BridgeSettings) => ({ Authorization: `Bearer ${s.token}` });

export async function checkBridge(settings: BridgeSettings | null, signal?: AbortSignal): Promise<BridgeStatus> {
  if (!settings) return { state: "unpaired" };
  try {
    const response = await fetch(`${base(settings)}/helse`, { headers: headers(settings), cache: "no-store", signal });
    if (response.status === 401) return { state: "denied" };
    const data = await response.json();
    if (!response.ok || data.versjon !== 2 || !data.profiler?.includes("otsjoba-tutor")) return { state: "outdated" };
    return { state: "ready", health: data.backends };
  } catch {
    return { state: "offline" };
  }
}

export function usableEngines(status: BridgeStatus): BridgeEngine[] {
  if (status.state !== "ready") return [];
  return engines.filter((e) => {
    const info = status.health[e];
    return info?.tilgjengelig && info.innlogget !== false && info.modeller.length > 0;
  });
}

// The engine and model that will answer first, given what the bridge offers.
export function chosenEngine(settings: BridgeSettings | null, status: BridgeStatus): { engine: BridgeEngine; model: BridgeModel } | null {
  if (status.state !== "ready") return null;
  const usable = usableEngines(status);
  const engine = settings && usable.includes(settings.engine) ? settings.engine : usable[0];
  if (!engine) return null;
  const models = status.health[engine]!.modeller;
  const model = models.find((m) => m.id === settings?.model) || models[0];
  return { engine, model };
}

export function engineLabel(status: BridgeStatus, engine: BridgeEngine, model: string) {
  const info = status.state === "ready" ? status.health[engine] : undefined;
  const name = info?.navn || { chatgpt: "ChatGPT", claude: "Claude" }[engine];
  return `${name} ${info?.modeller.find((m) => m.id === model)?.name || model}`;
}

async function call(settings: BridgeSettings, path: string, body: unknown, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(`${base(settings)}${path}`, {
      method: "POST",
      headers: { ...headers(settings), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Den lokale AI-broen svarer ikke. Kjører node scripts/lokal-ai.mjs fortsatt?");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.feil || "Den lokale AI-broen kunne ikke svare. Prøv igjen.");
  return data;
}

export async function askBridge(settings: BridgeSettings, status: BridgeStatus, input: TutorRequest, signal?: AbortSignal): Promise<BridgeReply> {
  const choice = chosenEngine(settings, status);
  if (!choice) throw new Error("Den lokale AI-broen er ikke tilkoblet.");
  const data = await call(settings, "/samtale", {
    profil: "otsjoba-tutor",
    backend: choice.engine,
    reserve: settings.reserve,
    modeller: { [choice.engine]: choice.model.id },
    innhold: input,
  }, signal);
  const reply = validateTutorResponse(data?.svar);
  if (!reply.ok || !isEngine(data.backend)) throw new Error("Svaret fra AI-broen hadde feil format.");
  return { reply: reply.value, engine: data.backend, model: String(data.modell) };
}

// The bridge opens the ChatGPT sign-in in the default browser; tokens stay on the PC.
export const startChatGptSignIn = (settings: BridgeSettings) => call(settings, "/chatgpt/logg-inn", {});
export const signOutChatGpt = (settings: BridgeSettings) => call(settings, "/chatgpt/logg-ut", {});
