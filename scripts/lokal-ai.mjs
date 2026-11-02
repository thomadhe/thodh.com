// Local AI bridge: lets the owner's own browser on thodh.com use AI subscriptions
// on this PC: ChatGPT (Sign in with ChatGPT, plan usage for locally run personal
// projects), and the Claude Code and Codex CLIs that are already logged in.
// Plain Node 24, no dependencies. Listens on 127.0.0.1 only.
//
//   node scripts/lokal-ai.mjs [--port 4747] [--ny-kode]
//
// Learner text is untrusted: the CLIs run without tools, MCP servers or project
// settings, in an empty temporary directory. Tokens stay in ~/.thodh and never
// reach the browser, URLs or logs; the browser only holds the pairing token.
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { createHash, createPublicKey, randomBytes, randomUUID, timingSafeEqual, verify } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as tutor from "../features/otsjoba/lib/tutor-profile.mjs";

export const defaultPort = 4747;
const limits = { body: 256 * 1024, perMinute: 20, requestsPerMinute: 120, concurrent: 2, runMs: 75000, totalMs: 140000 };
const home = path.join(homedir(), ".thodh");

// A profile owns its input validation, prompts and output check. Add new
// profiles (for example a chess coach) here; the transport stays the same.
export const profiles = {
  "otsjoba-tutor": {
    validate: tutor.validateTutorRequest,
    system: tutor.tutorInstructions,
    prompt: tutor.tutorPrompt,
    schema: tutor.tutorResponseSchema,
    schemaName: "tutor_turn",
    check: tutor.validateTutorResponse,
  },
};

// ChatGPT's models come from the signed-in account; the CLI lists are fixed.
export const backends = {
  chatgpt: { name: "ChatGPT", models: [] },
  claude: {
    name: "Claude",
    models: [
      { id: "claude-sonnet-5-5", name: "Sonnet 5.5" },
      { id: "claude-haiku-5-5", name: "Haiku 5.5" },
      { id: "claude-opus-5-5", name: "Opus 5.5" },
    ],
  },
  codex: {
    name: "Codex",
    models: [
      { id: "gpt-6-luna", name: "GPT-6-Luna" },
      { id: "gpt-6.1-sol", name: "GPT-6.1-Sol" },
    ],
  },
};

export function allowedOrigin(origin) {
  if (origin === "https://thodh.com" || origin === "https://www.thodh.com") return true;
  return typeof origin === "string" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin);
}

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const failure = (message, extra = {}) => Object.assign(new Error(message), extra);

// Validates the whole request body; the profile validates its own payload.
export function parseConversation(body) {
  if (!isObject(body)) return { ok: false, error: "Forespørselen må være JSON-objekt." };
  if (Object.keys(body).some((k) => !["profil", "backend", "reserve", "modeller", "innhold"].includes(k))) {
    return { ok: false, error: "Forespørselen har ukjente felt." };
  }
  const profile = Object.hasOwn(profiles, body.profil) ? profiles[body.profil] : null;
  if (!profile) return { ok: false, error: "Ukjent profil." };
  const backend = body.backend ?? "auto";
  if (backend !== "auto" && !Object.hasOwn(backends, backend)) return { ok: false, error: "Ukjent AI-motor." };
  if (body.reserve !== undefined && typeof body.reserve !== "boolean") return { ok: false, error: "Ugyldig reservevalg." };
  const models = {};
  if (body.modeller !== undefined) {
    if (!isObject(body.modeller)) return { ok: false, error: "Ugyldig modellvalg." };
    for (const [key, id] of Object.entries(body.modeller)) {
      const known = key === "chatgpt"
        ? typeof id === "string" && /^[\w.:-]{1,80}$/.test(id)
        : Object.hasOwn(backends, key) && backends[key].models.some((m) => m.id === id);
      if (!known) return { ok: false, error: "Ukjent modell." };
      models[key] = id;
    }
  }
  const input = profile.validate(body.innhold);
  if (!input.ok) return input;
  return { ok: true, value: { name: body.profil, profile, input: input.value, backend, reserve: body.reserve === true, models } };
}

export function extractJson(text) {
  if (isObject(text)) return text;
  if (typeof text !== "string") throw new Error("Tomt svar.");
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Svaret inneholdt ikke JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

// Owner-only file: atomic write, then (on Windows) an ACL for this user alone.
function writePrivate(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(temporary, file);
  if (process.platform === "win32" && process.env.USERNAME) {
    spawnSync("icacls", [file, "/inheritance:r", "/grant:r", `${process.env.USERNAME}:F`], { stdio: "ignore", windowsHide: true });
  }
}

function readPrivate(file) {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return null; }
}

function log(message) {
  console.log(`${new Date().toLocaleTimeString("nb-NO")}  ${message}`);
}

function openBrowser(url) {
  const [command, args] = process.platform === "win32"
    ? ["rundll32.exe", ["url.dll,FileProtocolHandler", url]]
    : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try { spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true }).unref(); return true; }
  catch { return false; }
}

// --- ChatGPT: Sign in with ChatGPT (plan usage), loopback OAuth with PKCE. ---
const openai = {
  issuer: "https://auth.openai.com",
  authorize: "https://auth.openai.com/api/accounts/authorize",
  token: "https://auth.openai.com/api/accounts/oauth/token",
  discovery: "https://auth.openai.com/.well-known/openid-configuration",
  resource: "https://api.openai.com/v1",
  api: "https://api.openai.com/v1",
  scope: "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct",
  agentName: "Otsjoba",
};
const terminalRefresh = ["invalid_grant", "invalid_refresh_token", "token_expired", "refresh_token_expired", "refresh_token_invalidated", "refresh_token_reused"];

// Norwegian messages for the documented plan-usage errors.
export function chatGptError(code, status) {
  const known = {
    subscription_sharing_usage_limit_exceeded: [429, true, "Du har nådd bruksgrensen for ChatGPT-abonnementet ditt. Se chatgpt.com/settings/usage for når du kan fortsette."],
    subscription_sharing_usage_unavailable: [503, false, "ChatGPT-abonnementet er midlertidig utilgjengelig for apper. Prøv igjen om litt."],
    subscription_sharing_user_unavailable: [503, false, "ChatGPT-kontoen er midlertidig utilgjengelig. Prøv igjen om litt."],
    subscription_sharing_user_not_eligible: [403, true, "ChatGPT-kontoen din har ikke tilgang til å bruke abonnementet i andre apper."],
    subscription_sharing_invalid_user: [401, true, "ChatGPT godtok ikke innloggingen. Logg inn med ChatGPT på nytt."],
    subscription_sharing_unsupported_capability: [400, true, "ChatGPT støttet ikke forespørselen fra broen."],
    subscription_sharing_route_not_supported: [403, true, "ChatGPT støttet ikke forespørselen fra broen."],
    chatpass_v2_scope_not_authorized: [403, true, "Innloggingen mangler tillatelse til å bruke ChatGPT-abonnementet. Logg ut og inn igjen, og godta bruken."],
    chatpass_v2_invalid_authorization_context: [403, true, "Innloggingen mangler tillatelse til å bruke ChatGPT-abonnementet. Logg ut og inn igjen, og godta bruken."],
  }[code];
  if (known) return failure(known[2], { status: known[0], fatal: known[1], code, melding: known[2] });
  return failure(`ChatGPT svarte med feil${code ? ` (${code})` : status ? ` (HTTP ${status})` : ""}.`, { status: 502, code });
}

async function postForm(url, fields) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(fields),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw failure(`OpenAI-innloggingen svarte med ${data.error || `HTTP ${response.status}`}.`, { code: data.error, status: response.status });
  return data;
}

const b64url = (value) => Buffer.from(value).toString("base64url");
const decodePart = (part) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

export class ChatGpt {
  constructor(file, port) {
    this.file = file;
    this.port = port;
    this.data = readPrivate(file) || {};
    // A stable host identifier must exist before the first sign-in.
    if (typeof this.data.hostId !== "string" || !this.data.hostId.startsWith("urn:uuid:")) {
      this.data.hostId = `urn:uuid:${randomUUID()}`;
      this.save();
    }
    this.pending = null;
    this.refreshing = null;
    this.models = null;
    this.signingOut = false;
  }
  save() { writePrivate(this.file, this.data); }
  get signedIn() { return !!this.data.tokens?.refresh && !this.signingOut; }
  get redirectUri() { return `http://127.0.0.1:${this.port}/auth/callback`; }
  async discovery() {
    if (!this.meta) {
      const response = await fetch(openai.discovery, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw failure("Fant ikke OpenAIs innloggingsoppsett.");
      this.meta = await response.json();
    }
    return this.meta;
  }

  start() {
    const verifier = b64url(randomBytes(48));
    const first = !this.data.clientId;
    this.pending = {
      state: b64url(randomBytes(24)),
      nonce: b64url(randomBytes(24)),
      verifier,
      clientId: first ? null : this.data.clientId,
      created: Date.now(),
    };
    const params = new URLSearchParams({
      client_id: first ? "dynamic_agent_client" : this.data.clientId,
      ...(first && { agent_name_hint: openai.agentName }),
      ext_agent_host_id: this.data.hostId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: openai.scope,
      resource: openai.resource,
      state: this.pending.state,
      nonce: this.pending.nonce,
      code_challenge: b64url(createHash("sha256").update(verifier).digest()),
      code_challenge_method: "S256",
    });
    return `${openai.authorize}?${params}`;
  }

  async verifyIdToken(idToken, clientId, nonce) {
    const [h, p, s] = String(idToken || "").split(".");
    if (!h || !p || !s) throw failure("Innloggingen ga ikke et gyldig ID-token.");
    const header = decodePart(h), claims = decodePart(p);
    const { jwks_uri: jwksUri } = await this.discovery();
    const keys = await (await fetch(jwksUri, { signal: AbortSignal.timeout(15000) })).json();
    const jwk = keys.keys?.find((k) => k.kid === header.kid);
    if (!jwk) throw failure("Fant ikke nøkkelen ID-tokenet er signert med.");
    const key = createPublicKey({ key: jwk, format: "jwk" });
    const data = Buffer.from(`${h}.${p}`), signature = Buffer.from(s, "base64url");
    const valid = header.alg === "RS256" ? verify("RSA-SHA256", data, key, signature)
      : header.alg === "ES256" ? verify("sha256", data, { key, dsaEncoding: "ieee-p1363" }, signature)
        : false;
    const now = Date.now() / 1000;
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!valid || claims.iss !== openai.issuer || !audience.includes(clientId) || !(claims.exp > now - 5) || claims.nonce !== nonce || !claims.sub) {
      throw failure("ID-tokenet fra innloggingen kunne ikke bekreftes.");
    }
    return claims;
  }

  // Handles GET /auth/callback; returns [status, Norwegian message for the tab].
  async callback(url) {
    const q = url.searchParams, pending = this.pending;
    if (!pending || q.get("state") !== pending.state || Date.now() - pending.created > 600000) {
      return [400, "Innloggingen er ukjent eller utløpt. Start den på nytt fra Otsjoba."];
    }
    this.pending = null;
    if (q.get("error")) return [400, "Innloggingen ble avbrutt. Du kan prøve igjen fra Otsjoba."];
    const issued = q.get("client_id");
    let clientId = pending.clientId;
    if (!clientId) {
      if (!issued || issued === "dynamic_agent_client") return [400, "Registreringen hos OpenAI ble ikke fullført. Prøv igjen."];
      // Keep the issued client ID before the exchange; a failed code can be retried with it.
      clientId = issued;
      this.data.clientId = issued;
      this.save();
    } else if (issued && issued !== clientId) {
      return [400, "Innloggingen kom fra en annen registrering. Prøv igjen."];
    }
    const code = q.get("code");
    if (!code) return [400, "Innloggingen ga ingen kode. Prøv igjen."];
    try {
      const tokens = await postForm(openai.token, {
        grant_type: "authorization_code", client_id: clientId, code,
        code_verifier: pending.verifier, redirect_uri: this.redirectUri, resource: openai.resource,
      });
      const claims = await this.verifyIdToken(tokens.id_token, clientId, pending.nonce);
      const scopes = String(tokens.scope || "").split(" ").filter(Boolean);
      if (!scopes.includes("chatgpt.tokens.use.direct")) return [400, "Du godtok ikke bruk av ChatGPT-abonnementet. Prøv igjen og godta bruken."];
      this.data.account = { email: claims.email || "", subject: claims.sub };
      this.data.tokens = this.tokens(tokens, null);
      this.models = null;
      this.save();
      log("ChatGPT er logget inn.");
      return [200, "Du er logget inn med ChatGPT. Lukk denne fanen og gå tilbake til Otsjoba."];
    } catch (error) {
      log(`ChatGPT-innlogging feilet: ${error.code || error.message}`);
      return [400, error.code === "invalid_grant" ? "Koden utløp. Start innloggingen på nytt fra Otsjoba." : "Innloggingen kunne ikke fullføres. Prøv igjen fra Otsjoba."];
    }
  }

  tokens(response, previous) {
    return {
      access: response.access_token,
      refresh: response.refresh_token || previous?.refresh,
      idToken: response.id_token || previous?.idToken,
      expiresAt: Date.now() + (Number(response.expires_in) || 3600) * 1000,
      scopes: response.scope ? String(response.scope).split(" ") : previous?.scopes || [],
      savedAt: new Date().toISOString(),
    };
  }

  // Refresh tokens rotate: one refresh at a time, always storing the newest.
  async accessToken(force = false) {
    if (!this.signedIn) throw failure("Logg inn med ChatGPT først.", { status: 401, fatal: true, melding: "Logg inn med ChatGPT først." });
    if (!force && this.data.tokens.expiresAt - Date.now() > 120000) return this.data.tokens.access;
    this.refreshing ??= (async () => {
      const previous = this.data.tokens;
      try {
        const response = await postForm(openai.token, {
          grant_type: "refresh_token", client_id: this.data.clientId, refresh_token: previous.refresh, resource: openai.resource,
        });
        this.data.tokens = this.tokens(response, previous);
        this.save();
      } catch (error) {
        if (terminalRefresh.includes(error.code)) {
          this.data.tokens = null;
          this.save();
          throw failure("ChatGPT-innloggingen er utløpt. Logg inn med ChatGPT på nytt.", { status: 401, fatal: true, melding: "ChatGPT-innloggingen er utløpt. Logg inn med ChatGPT på nytt." });
        }
        throw error;
      } finally {
        this.refreshing = null;
      }
    })();
    await this.refreshing;
    return this.data.tokens.access;
  }

  async listModels() {
    if (this.models && Date.now() - this.models.at < 600000) return this.models.list;
    const response = await fetch(`${openai.api}/models`, {
      headers: { Authorization: `Bearer ${await this.accessToken()}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw failure(`Kunne ikke hente ChatGPT-modellene (HTTP ${response.status}).`);
    const data = await response.json();
    const list = (data.models || []).filter((m) => m.visibility === "list" && typeof m.slug === "string")
      .map((m) => ({ id: m.slug, name: m.display_name || m.slug }));
    this.models = { at: Date.now(), list };
    return list;
  }

  async respond({ model, system, prompt, schema, schemaName, signal, timeout }, retried = false) {
    const body = {
      model,
      instructions: system,
      input: [{ role: "user", content: prompt }],
      store: false,
      stream: true,
      // Structured outputs are not listed for this flow; drop them if rejected.
      ...(this.structured !== false && { text: { format: { type: "json_schema", name: schemaName, schema, strict: true } } }),
    };
    const response = await fetch(`${openai.api}/responses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await this.accessToken(retried)}`, "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body),
      signal: AbortSignal.any([AbortSignal.timeout(timeout), ...(signal ? [signal] : [])]),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const code = data?.error?.code;
      if (code === "subscription_sharing_unsupported_capability" && String(data.error.param || "").startsWith("text") && this.structured !== false) {
        this.structured = false;
        return this.respond({ model, system, prompt, schema, schemaName, signal, timeout }, retried);
      }
      if (response.status === 401 && !retried && (!code || code === "subscription_sharing_invalid_user")) {
        return this.respond({ model, system, prompt, schema, schemaName, signal, timeout }, true);
      }
      throw chatGptError(code, response.status);
    }
    return extractJson(await readEvents(response.body));
  }

  async signOut() {
    const tokens = this.data.tokens;
    // Stop new requests first, then revoke, then clear local tokens.
    this.signingOut = true;
    let confirmed = !tokens?.refresh;
    try {
      if (tokens?.refresh) {
        const endpoint = (await this.discovery().catch(() => ({}))).revocation_endpoint;
        for (let attempt = 0; endpoint && attempt < 3 && !confirmed; attempt++) {
          try {
            const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({ token: tokens.refresh, token_type_hint: "refresh_token", client_id: this.data.clientId }),
              signal: AbortSignal.timeout(15000),
            });
            if (response.ok) confirmed = true;
            else if (response.status < 500) break;
          } catch { /* Retry network failures with backoff. */ }
          if (!confirmed) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      }
    } finally {
      // The registration (client ID) and host ID are kept for a later sign-in.
      this.data.tokens = null;
      this.data.account = null;
      this.models = null;
      this.save();
      this.signingOut = false;
    }
    log(confirmed ? "Logget ut av ChatGPT." : "Logget ut lokalt; OpenAI bekreftet ikke tilbakekallingen.");
    return confirmed;
  }
}

// Server-sent events from /v1/responses: the text is final only after response.completed.
export async function readEvents(stream) {
  let buffer = "", text = "", completed = false;
  const handle = (block) => {
    const data = block.split(/\r?\n/).filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
    if (!data || data === "[DONE]") return;
    const event = JSON.parse(data);
    if (event.type === "response.output_text.delta") text += event.delta || "";
    else if (event.type === "response.completed") completed = true;
    else if (event.type === "response.failed") throw chatGptError(event.response?.error?.code);
    else if (event.type === "response.incomplete") throw failure("ChatGPT-svaret ble ufullstendig.");
    else if (event.type === "error") throw chatGptError(event.error?.code || event.code);
  };
  for await (const chunk of stream.pipeThrough(new TextDecoderStream())) {
    buffer += chunk;
    let index;
    while ((index = buffer.search(/\r?\n\r?\n/)) >= 0) {
      handle(buffer.slice(0, index));
      buffer = buffer.slice(index).replace(/^\r?\n\r?\n/, "");
    }
  }
  if (buffer.trim()) handle(buffer);
  if (!completed) throw failure("ChatGPT-strømmen sluttet før svaret var ferdig.");
  return text;
}

// --- CLI engines -------------------------------------------------------------
// Never let an API key in the environment turn subscription use into paid API use.
function childEnv() {
  const env = { ...process.env };
  for (const key of ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "OPENAI_API_KEY", "CODEX_API_KEY", "CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT"]) delete env[key];
  return env;
}

function findOnPath(names) {
  const dirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const dir of dirs) for (const name of names) {
    const file = path.join(dir, name);
    if (existsSync(file)) return file;
  }
  return null;
}

// Resolves to an executable that can be spawned without a shell, so learner
// text and prompts never pass through cmd.exe quoting.
function resolveCommand(name) {
  if (process.platform !== "win32") {
    const file = findOnPath([name]);
    return file && { file, prefix: [] };
  }
  const exe = findOnPath([`${name}.exe`]);
  if (exe) return { file: exe, prefix: [] };
  const shim = findOnPath([`${name}.cmd`]);
  if (name === "codex" && shim) {
    const script = path.join(path.dirname(shim), "node_modules", "@openai", "codex", "bin", "codex.js");
    if (existsSync(script)) return { file: process.execPath, prefix: [script] };
  }
  return null;
}

function kill(child) {
  if (child.exitCode !== null || child.pid === undefined) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill("SIGKILL");
}

function run(command, args, { cwd, input, signal, timeout }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command.file, [...command.prefix, ...args], { cwd, env: childEnv(), windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", done = false;
    const finish = (error, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      if (error) { kill(child); reject(error); } else resolve(value);
    };
    const onAbort = () => finish(failure("Avbrutt.", { aborted: true }));
    const timer = setTimeout(() => finish(failure("Tidsavbrudd.", { timeout: true })), timeout);
    signal?.addEventListener("abort", onAbort, { once: true });
    child.stdout.setEncoding("utf8").on("data", (d) => { if (stdout.length < 2e6) stdout += d; });
    child.stderr.setEncoding("utf8").on("data", (d) => { if (stderr.length < 2e5) stderr += d; });
    child.on("error", (error) => finish(error));
    child.on("close", (code) => finish(code === 0 ? null : failure(`Avsluttet med kode ${code}.`, { stderr }), { stdout, stderr }));
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

const runners = {
  chatgpt: (job) => job.chat.respond(job),
  async claude({ command, model, system, prompt, schema, cwd, signal, timeout }) {
    const args = [
      "-p", "--output-format", "json", "--model", model,
      "--system-prompt", system, "--json-schema", JSON.stringify(schema),
      "--tools", "", "--strict-mcp-config", "--safe-mode", "--setting-sources", "",
      "--no-session-persistence", "--disable-slash-commands", "--permission-prompts", "none",
    ];
    const { stdout } = await run(command, args, { cwd, input: prompt, signal, timeout });
    const data = JSON.parse(stdout);
    if (data.is_error) throw new Error(typeof data.result === "string" ? data.result.slice(0, 300) : "Claude meldte en feil.");
    return data.structured_output ?? extractJson(data.result);
  },
  async codex({ command, model, system, prompt, schema, cwd, signal, timeout }) {
    const schemaFile = path.join(cwd, "schema.json"), outFile = path.join(cwd, "svar.txt");
    await writeFile(schemaFile, JSON.stringify(schema));
    const args = [
      "exec", "--ephemeral", "--skip-git-repo-check", "--ignore-user-config", "--ignore-rules",
      "--sandbox", "read-only", "--color", "never", "-C", cwd, "-m", model,
      "-c", 'model_reasoning_effort="low"', "--output-schema", schemaFile, "-o", outFile, "-",
    ];
    const input = `${system}\n\nAnswer directly. Do not run shell commands, read files or use any tools.\n\n${prompt}`;
    await run(command, args, { cwd, input, signal, timeout });
    return extractJson(await readFile(outFile, "utf8"));
  },
};

const status = { checked: 0, commands: {} };
async function refreshCommands(force = false) {
  if (!force && Date.now() - status.checked < 60000) return status.commands;
  const entries = await Promise.all(["claude", "codex"].map(async (key) => {
    const command = resolveCommand(key);
    if (!command) return [key, null];
    try {
      await run(command, ["--version"], { cwd: tmpdir(), input: "", timeout: 20000 });
      return [key, command];
    } catch { return [key, null]; }
  }));
  status.commands = Object.fromEntries(entries);
  status.checked = Date.now();
  return status.commands;
}

async function engineModels(key, chat) {
  if (key !== "chatgpt") return backends[key].models;
  return chat?.signedIn ? chat.listModels() : [];
}

export async function converse({ profile, input, backend, reserve, models }, signal, chat) {
  const commands = await refreshCommands();
  const ready = (key) => (key === "chatgpt" ? !!chat?.signedIn : !!commands[key]);
  // "auto" tries every engine in order; `reserve` falls back to the others.
  const others = Object.keys(backends).filter((k) => k !== backend && ready(k));
  const order = backend === "auto" ? others : [backend, ...(reserve ? others : [])];
  if (!order.length || !ready(order[0])) {
    throw failure(backend === "chatgpt" ? "Logg inn med ChatGPT i Otsjoba-innstillingene først."
      : backend === "auto" ? "Ingen AI-motor er klar på denne PC-en."
        : `${backends[backend].name} er ikke installert eller svarer ikke på denne PC-en.`, { status: 503 });
  }
  const deadline = Date.now() + limits.totalMs;
  let last = null, message = null;
  for (const key of order) {
    let model;
    try {
      const list = await engineModels(key, chat);
      model = (list.find((m) => m.id === models[key]) || list[0])?.id;
      if (!model) throw failure(`${backends[key].name} har ingen tilgjengelige modeller.`);
    } catch (error) {
      last = error;
      message ??= error.melding;
      continue;
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 5000) break;
      const cwd = key === "chatgpt" ? null : await mkdtemp(path.join(tmpdir(), "lokal-ai-"));
      const started = Date.now();
      try {
        const raw = await runners[key]({
          chat, command: commands[key], model, system: profile.system(input), prompt: profile.prompt(input),
          schema: profile.schema, schemaName: profile.schemaName, cwd, signal, timeout: Math.min(limits.runMs, left),
        });
        const checked = profile.check(raw);
        if (checked.ok) return { svar: checked.value, backend: key, modell: model, ms: Date.now() - started };
        last = new Error(checked.error);
      } catch (error) {
        if (error.aborted || signal?.aborted) throw failure("Avbrutt.", { aborted: true });
        last = error;
        if (error.melding) message ??= error.melding;
        if (error.fatal) break;
      } finally {
        if (cwd) await rm(cwd, { recursive: true, force: true }).catch(() => {});
      }
    }
    log(`${key} ga ikke et gyldig svar: ${String(last?.code || last?.message || "").slice(0, 200)} ${String(last?.stderr || "").trim().slice(0, 300)}`);
  }
  throw failure(message || (last?.timeout || last?.name === "TimeoutError"
    ? "AI-en brukte for lang tid. Prøv igjen, gjerne med en raskere modell."
    : "AI-en ga ikke et gyldig svar, heller ikke etter et nytt forsøk. Prøv igjen om litt."), { status: last?.status === 429 ? 429 : 502 });
}

// --- HTTP server -------------------------------------------------------------
function loadToken(fresh) {
  const file = path.join(home, "lokal-ai.json");
  const saved = !fresh && readPrivate(file);
  if (saved && typeof saved.token === "string" && /^[\w-]{40,}$/.test(saved.token)) {
    writePrivate(file, saved);
    return { token: saved.token, file };
  }
  const token = randomBytes(32).toString("base64url");
  writePrivate(file, { token, created: new Date().toISOString() });
  return { token, file, created: true };
}

function sameToken(header, token) {
  const match = /^Bearer ([\w-]+)$/.exec(header || "");
  if (!match) return false;
  const a = Buffer.from(match[1]), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limits.body) { reject(failure("Forespørselen er for stor.", { status: 413 })); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); }
      catch { reject(failure("Forespørselen er ikke gyldig JSON.", { status: 400 })); }
    });
    req.on("error", reject);
  });
}

class Window {
  constructor(max) { this.max = max; this.hits = []; }
  take() {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < 60000);
    if (this.hits.length >= this.max) return false;
    this.hits.push(now);
    return true;
  }
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function page(res, code, message) {
  res.writeHead(code, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    "Referrer-Policy": "no-referrer",
  });
  res.end(`<!doctype html><html lang="nb"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Otsjoba · lokal AI</title><body style="font:16px/1.6 'Segoe UI',Arial,sans-serif;background:#f8f9fb;color:#232834;display:grid;place-items:center;min-height:90vh;margin:0"><main style="max-width:420px;background:#fff;border:1px solid #e6e8ed;border-radius:14px;padding:28px"><p style="margin:0 0 6px;color:#dc5035;font-weight:650">otsjoba.</p><h1 style="font-size:20px;margin:0 0 8px">${code === 200 ? "Ferdig" : "Ikke fullført"}</h1><p style="margin:0;color:#555f6d">${escapeHtml(message)}</p></main></body></html>`);
}

export function createServer({ token, port, chat }) {
  const requests = new Window(limits.requestsPerMinute), conversations = new Window(limits.perMinute);
  let running = 0;
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const send = (code, body) => {
      res.writeHead(code, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(allowedOrigin(origin) && { "Access-Control-Allow-Origin": origin, Vary: "Origin" }),
      });
      res.end(JSON.stringify(body));
    };
    // The Host check stops DNS rebinding; the Origin check stops other sites.
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host || "")) return send(421, { feil: "Ukjent vertsnavn." });
    if (!requests.take()) return send(429, { feil: "For mange forespørsler. Vent litt." });
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    // The OAuth redirect is a top-level navigation without Origin or pairing
    // token; it is accepted only for a pending sign-in with a matching state.
    if (req.method === "GET" && url.pathname === "/auth/callback") {
      if (req.headers.host !== `127.0.0.1:${port}`) return page(res, 400, "Bruk 127.0.0.1 for innloggingen.");
      const [code, message] = await chat.callback(url);
      return page(res, code, message);
    }
    if (!allowedOrigin(origin)) return send(403, { feil: "Denne nettsiden har ikke tilgang til lokal AI." });
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Private-Network": "true",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      });
      return res.end();
    }
    if (!sameToken(req.headers.authorization, token)) return send(401, { feil: "Paringskoden stemmer ikke. Åpne lenken som broen skrev ut på nytt." });
    if (req.method === "GET" && url.pathname === "/v1/helse") {
      const commands = await refreshCommands();
      let chatgpt = { navn: "ChatGPT", tilgjengelig: true, innlogget: chat.signedIn, modeller: [] };
      if (chat.signedIn) {
        try {
          chatgpt.modeller = await chat.listModels();
          chatgpt.melding = `Logget inn${chat.data.account?.email ? ` som ${chat.data.account.email}` : ""} · bruker ChatGPT-abonnementet ditt.`;
        } catch (error) {
          chatgpt = { ...chatgpt, innlogget: chat.signedIn, melding: error.melding || "Kunne ikke hente ChatGPT-modellene akkurat nå." };
        }
      }
      return send(200, {
        ok: true, versjon: 2, profiler: Object.keys(profiles),
        backends: {
          chatgpt,
          ...Object.fromEntries(["claude", "codex"].map((key) => [key, { navn: backends[key].name, tilgjengelig: !!commands[key], modeller: backends[key].models }])),
        },
      });
    }
    if (req.method !== "POST") return send(404, { feil: "Ukjent adresse." });
    if (!/^application\/json\b/.test(req.headers["content-type"] || "")) return send(415, { feil: "Send JSON." });
    let body;
    try { body = await readBody(req); }
    catch (error) { return send(error.status || 400, { feil: error.message }); }
    if (url.pathname === "/v1/chatgpt/logg-inn") {
      const authorizeUrl = chat.start();
      const opened = openBrowser(authorizeUrl);
      log("Åpner ChatGPT-innloggingen i nettleseren.");
      return send(200, { startet: true, apnet: opened, url: authorizeUrl });
    }
    if (url.pathname === "/v1/chatgpt/logg-ut") {
      const confirmed = await chat.signOut();
      return send(200, {
        bekreftet: confirmed,
        melding: confirmed ? "Logget ut av ChatGPT." : "Logget ut på denne PC-en, men OpenAI bekreftet ikke tilbakekallingen. Du kan koble fra Otsjoba under Innstillinger i ChatGPT.",
      });
    }
    if (url.pathname !== "/v1/samtale") return send(404, { feil: "Ukjent adresse." });
    const parsed = parseConversation(body);
    if (!parsed.ok) return send(400, { feil: parsed.error });
    if (running >= limits.concurrent) return send(429, { feil: "AI-en svarer allerede på to samtaler. Vent litt." });
    if (!conversations.take()) return send(429, { feil: "Grensen er 20 svar i minuttet. Vent litt." });
    running++;
    const controller = new AbortController();
    res.on("close", () => { if (!res.writableEnded) controller.abort(); });
    const started = Date.now();
    try {
      const result = await converse(parsed.value, controller.signal, chat);
      log(`${origin}  ${parsed.value.name}  ${result.backend}/${result.modell}  ${Date.now() - started} ms`);
      send(200, result);
    } catch (error) {
      if (error.aborted) { log("Avbrutt av nettleseren."); return; }
      log(`Feil: ${error.message}`);
      send(error.status || 500, { feil: error.status ? error.message : "Broen fikk en uventet feil." });
    } finally { running--; }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  return server;
}

async function main() {
  const argv = process.argv.slice(2);
  const portArg = argv.indexOf("--port");
  const port = Number(portArg >= 0 ? argv[portArg + 1] : process.env.LOKAL_AI_PORT || defaultPort);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error("Porten må være et heltall mellom 1024 og 65535.");
    process.exit(1);
  }
  const { token, file, created } = loadToken(argv.includes("--ny-kode"));
  const chat = new ChatGpt(path.join(home, "lokal-ai-chatgpt.json"), port);
  const commands = await refreshCommands(true);
  const server = createServer({ token, port, chat });
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? `Port ${port} er i bruk. Kjører broen allerede? Velg en annen med --port.` : error.message);
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    const suffix = port === defaultPort ? "" : `&port=${port}`;
    console.log(`\nLokal AI for thodh.com kjører på http://127.0.0.1:${port}`);
    console.log(`  ChatGPT: ${chat.signedIn ? "logget inn" : "ikke logget inn (logg inn fra Otsjoba-innstillingene)"}`);
    for (const key of ["claude", "codex"]) console.log(`  ${backends[key].name}: ${commands[key] ? "tilgjengelig" : "ikke funnet"}`);
    console.log(`\n${created ? "Ny paringskode lagret" : "Paringskode"} i ${file}`);
    console.log("Åpne en av lenkene én gang i nettleseren for å koble Otsjoba til broen:");
    console.log(`  https://thodh.com/otsjoba#lokal-ai=${token}${suffix}`);
    console.log(`  http://localhost:3000/otsjoba#lokal-ai=${token}${suffix}`);
    console.log("\nIkke del lenkene. Chrome og Edge kan spørre om tilgang til lokale enheter første gang: velg Tillat.");
    console.log("Stopp med Ctrl+C.\n");
  });
}

const entry = process.argv[1] && path.resolve(process.argv[1]);
if (entry && path.basename(fileURLToPath(import.meta.url)) === "lokal-ai.mjs" && entry === fileURLToPath(import.meta.url)) main();
