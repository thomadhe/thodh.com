import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { relayChess } from "../lib/chess/relay";

const id = "00000000-0000-4000-8000-000000000001";
function configure(t: TestContext) {
  for (const [key, value] of Object.entries({ SJAKK_SITE_BYPASS: "test-private-access", SJAKK_GATEWAY_KEY: "test-gateway-key" })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  }
}
test("chess gateway relays only room operations and keeps server credentials private", async (t) => {
  configure(t);
  const calls: { url: string; headers: Headers }[] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(input), headers: new Headers(init.headers) });
    assert.equal(init.redirect, "manual");
    assert.equal(init.cache, "no-store");
    return Response.json({ state: { turn: "b" } }, { headers: { "Set-Cookie": "upstream=private", "OAI-Sites-Authorization": "private" } });
  });
  const response = await relayChess(new Request(`https://thodh.com/sjakk/api/rooms/${id}/action`, {
    method: "POST", body: JSON.stringify({ revision: 2, action: { type: "ack" } }),
    headers: { Origin: "https://thodh.com", "Content-Type": "application/json", Authorization: "Bearer player-seat", "x-forwarded-for": "192.0.2.10", Cookie: "user=private", "X-Sjakk-Gateway-Key": "attacker", "X-Sjakk-Client": "attacker" },
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { state: { turn: "b" } });
  assert.equal(response.headers.get("Set-Cookie"), null);
  assert.equal(response.headers.get("OAI-Sites-Authorization"), null);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(calls[0].url, `https://sjakk-for-to-kveldsro-160926.thodhel.chatgpt.site/api/rooms/${id}/action`);
  assert.equal(calls[0].headers.get("Authorization"), "Bearer player-seat");
  assert.equal(calls[0].headers.get("OAI-Sites-Authorization"), "Bearer test-private-access");
  assert.equal(calls[0].headers.get("X-Sjakk-Gateway-Key"), "test-gateway-key");
  assert.match(calls[0].headers.get("X-Sjakk-Client")!, /^[a-f0-9]{64}$/);
  assert.equal(calls[0].headers.get("Cookie"), null);
  assert.equal(calls[0].headers.get("Origin"), null);

  const foreign = await relayChess(new Request(`https://thodh.com/sjakk/api/rooms/${id}`, { headers: { Origin: "https://other.test" } }));
  assert.equal(foreign.status, 403);
  for (const path of ["/sjakk/api/rooms", "/sjakk/api/rooms/admin", `/sjakk/api/rooms/${id}?url=https://other.test`, `/sjakk/api/rooms/${id}/action`]) {
    assert.equal((await relayChess(new Request(`https://thodh.com${path}`))).status, 404);
  }
  const large = await relayChess(new Request("https://thodh.com/sjakk/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: "x".repeat(16385) }));
  assert.equal(large.status, 413);
  assert.equal(calls.length, 1);
});

test("chess gateway returns a safe reconnect error when the backend is unavailable", async (t) => {
  configure(t);
  t.mock.method(globalThis, "fetch", async () => new Response("private login page", { status: 302, headers: { Location: "https://login.test" } }));
  const result = await relayChess(new Request(`https://thodh.com/sjakk/api/rooms/${id}`));
  assert.equal(result.status, 502);
  assert.equal(result.headers.get("Location"), null);
  assert.doesNotMatch(await result.text(), /private|login/);
});
