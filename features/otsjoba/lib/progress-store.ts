import { type LearningState } from "./learning";
import { decodeProgress, emptyProgress, type ProgressSnapshot } from "./progress";

type Status = "saved" | "pending" | "saving" | "error" | "conflict" | "signed-out";
type Snapshot = ProgressSnapshot & { status: Status; dirty: boolean; error: string };
type Transport = (url: string, init?: RequestInit) => Promise<Response>;

// Serial writes + compare-and-swap revisions prevent older tabs and slow requests
// from silently overwriting newer progress. The server verifies the account too.
export class ProgressStore {
  private current: Snapshot;
  private listeners = new Set<() => void>();
  private inFlight: Promise<boolean> | null = null;
  private generation = 0;
  constructor(readonly userId: string, initial: ProgressSnapshot, private transport: Transport = (url, init) => fetch(url, init)) {
    this.current = { ...initial, status: "saved", dirty: false, error: "" };
  }
  getSnapshot = () => this.current;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<Snapshot>) {
    this.current = { ...this.current, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  update = (value: LearningState | ((state: LearningState) => LearningState)) => {
    if (this.current.status === "signed-out" || this.current.status === "conflict") return;
    this.generation++;
    this.publish({ state: typeof value === "function" ? value(this.current.state) : value, dirty: true, status: "pending" });
  };
  invalidate = () => {
    this.generation++;
    this.publish({ ...emptyProgress(), dirty: false, status: "signed-out", error: "Innloggingen er avsluttet eller kontoen er endret." });
  };
  flush = (): Promise<boolean> => {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.save().finally(() => { this.inFlight = null; });
    return this.inFlight;
  };
  private async save(): Promise<boolean> {
    while (this.current.dirty) {
      if (this.current.status === "conflict" || this.current.status === "signed-out") return false;
      const generation = this.generation;
      const { state, revision } = this.current;
      this.publish({ status: "saving", error: "" });
      try {
        const response = await this.transport("/otsjoba/api/progress", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId, state, revision }),
        });
        const data = await response.json();
        if (this.getSnapshot().status === "signed-out") return false;
        if (response.status === 401 || data.code === "account_changed") { this.invalidate(); return false; }
        if (response.status === 409) { this.publish({ status: "conflict", error: "En annen fane eller enhet har lagret nyere fremgang. Eksporter eventuelle ulagrede endringer før du henter den nyeste." }); return false; }
        if (!response.ok) throw new Error(data.error || "Kunne ikke lagre. Prøv igjen.");
        if (!Number.isSafeInteger(data.revision) || data.revision <= revision) throw new Error("Ugyldig svar fra lagringen.");
        this.publish({ revision: data.revision, dirty: generation !== this.generation, status: generation === this.generation ? "saved" : "pending" });
      } catch (error) {
        if (this.getSnapshot().status === "signed-out") return false;
        this.publish({ status: "error", error: error instanceof Error ? error.message : "Kunne ikke lagre. Prøv igjen." });
        return false;
      }
    }
    return this.current.status !== "signed-out" && this.current.status !== "conflict";
  }
  refresh = async () => {
    const before = this.current;
    try {
      const response = await this.transport("/otsjoba/api/progress", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401 || (response.ok && data.userId !== this.userId)) { this.invalidate(); return; }
      if (!response.ok || this.current !== before || before.dirty || before.status === "signed-out") return;
      this.publish({ ...decodeProgress(data), status: "saved", error: "" });
    } catch { /* Keep existing progress; a failed refresh never overwrites it. */ }
  };
}
