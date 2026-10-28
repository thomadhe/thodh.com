import test from "node:test";
import assert from "node:assert/strict";
import { ProgressStore } from "../features/otsjoba/lib/progress-store";
import { emptyProgress, progressSchema, saveProgressSchema } from "../features/otsjoba/lib/progress";
import { authInput, readJson, safeNext, sameOrigin } from "../lib/auth/validation";

const userId = "00000000-0000-4000-8000-000000000001";
const json = (body: unknown, status = 200) => Response.json(body, { status });
test("the default transport does not call native fetch with the store as its receiver", async (context) => {
  context.mock.method(globalThis, "fetch", function (this: unknown) {
    assert.equal(this instanceof ProgressStore, false, "Browser fetch rejects an incompatible receiver");
    return Promise.resolve(json({ revision: 1 }));
  });
  const store = new ProgressStore(userId, emptyProgress());
  store.update((state) => ({ ...state, language: "ru" }));
  assert.equal(await store.flush(), true);
});
test("authentication validates input, blocks foreign origins and external redirects", async () => {
  assert.equal(safeNext("https://evil.example"), "/otsjoba");
  assert.equal(safeNext("//evil.example"), "/otsjoba");
  assert.equal(safeNext("/konto"), "/konto");
  assert.equal(sameOrigin(new Request("https://thodh.com/api/auth", { headers: { origin: "https://evil.example" } })), false);
  assert.equal(sameOrigin(new Request("https://thodh.com/api/auth", { headers: { origin: "https://thodh.com" } })), true);
  assert.equal(authInput.parse({ action: "login", email: " Test@Example.com ", password: "oldpw6" }).email, "test@example.com");
  assert.equal(authInput.safeParse({ action: "signup", email: "bad" }).success, false);
  const request = new Request("https://thodh.com/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "å".repeat(100) }) });
  await assert.rejects(readJson(request, 100), /too-large/);
});
test("progress rejects malicious ownership fields and invalid state", () => {
  assert.ok(progressSchema.safeParse(emptyProgress().state).success);
  assert.equal(saveProgressSchema.safeParse({ userId, revision: -1, state: emptyProgress().state }).success, false);
  assert.equal(progressSchema.safeParse({ ...emptyProgress().state, user_id: userId }).success, false);
  assert.equal(progressSchema.safeParse({ ...emptyProgress().state, sessions: [{ title: "invalid" }] }).success, false);
});
test("rapid edits serialize and save the newest state with the acknowledged revision", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const requests: { state: { goal: number }; revision: number; userId: string }[] = [];
  const store = new ProgressStore(userId, emptyProgress(), async (_url, init) => {
    requests.push(JSON.parse(init!.body as string));
    if (requests.length === 1) await gate;
    return json({ revision: requests.length });
  });
  store.update((state) => ({ ...state, goal: 10 }));
  const saving = store.flush();
  store.update((state) => ({ ...state, goal: 20 }));
  assert.equal(store.flush(), saving);
  release();
  assert.equal(await saving, true);
  assert.deepEqual(requests.map((r) => [r.state.goal, r.revision, r.userId]), [[10, 0, userId], [20, 1, userId]]);
  assert.equal(store.getSnapshot().dirty, false);
  assert.equal(store.getSnapshot().revision, 2);
});
test("a conflict retains the draft and stops subsequent writes", async () => {
  let writes = 0;
  const store = new ProgressStore(userId, emptyProgress(), async () => { writes++; return json({ code: "conflict" }, 409); });
  store.update((state) => ({ ...state, goal: 30 }));
  assert.equal(await store.flush(), false);
  assert.equal(store.getSnapshot().status, "conflict");
  assert.equal(store.getSnapshot().state.goal, 30);
  assert.equal(await store.flush(), false);
  assert.equal(writes, 1);
});
test("network failure preserves unsaved work and allows retry", async () => {
  let requests = 0;
  const store = new ProgressStore(userId, emptyProgress(), async () => { if (!requests++) throw Error("offline"); return json({ revision: 1 }); });
  store.update((state) => ({ ...state, translations: true }));
  assert.equal(await store.flush(), false);
  assert.equal(store.getSnapshot().dirty, true);
  assert.equal(await store.flush(), true);
  assert.equal(store.getSnapshot().state.translations, true);
});
test("switching accounts clears the old screen and cannot write to the new user", async () => {
  let writes = 0;
  const store = new ProgressStore(userId, emptyProgress(), async () => { writes++; return json({ code: "account_changed" }, 409); });
  store.update((state) => ({ ...state, saved: { it: ["private"], ru: [] } }));
  assert.equal(await store.flush(), false);
  assert.equal(store.getSnapshot().status, "signed-out");
  assert.deepEqual(store.getSnapshot().state.saved.it, []);
  store.update((state) => ({ ...state, goal: 5 }));
  assert.equal(await store.flush(), false);
  assert.equal(writes, 1);
});
test("an old refresh cannot overwrite edits made while the request was pending", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const store = new ProgressStore(userId, emptyProgress(), async () => { await gate; return json({ userId, ...emptyProgress(), revision: 4 }); });
  const refresh = store.refresh();
  store.update((state) => ({ ...state, goal: 30 }));
  release(); await refresh;
  assert.equal(store.getSnapshot().state.goal, 30);
  assert.equal(store.getSnapshot().dirty, true);
});
test("logout while saving prevents a late response from restoring private state", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const store = new ProgressStore(userId, emptyProgress(), async () => { await gate; return json({ revision: 1 }); });
  store.update((state) => ({ ...state, goal: 5 }));
  const saving = store.flush();
  store.invalidate(); release(); await saving;
  assert.equal(store.getSnapshot().status, "signed-out");
  assert.equal(store.getSnapshot().dirty, false);
});
