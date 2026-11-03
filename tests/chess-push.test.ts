import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { pushTopic, relayChess } from "../lib/chess/relay";

const id = "00000000-0000-4000-8000-000000000002";
function configure(t: TestContext) {
  for (const [key, value] of Object.entries({ SJAKK_SITE_BYPASS: "test-private-access", SJAKK_GATEWAY_KEY: "test-gateway-key" })) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  }
}
const get = () => relayChess(new Request(`https://thodh.com/sjakk/api/rooms/${id}`, { headers: { Authorization: "Bearer seat" } }));

test("player snapshots carry a push topic only the gateway can derive", async (t) => {
  configure(t);
  t.mock.method(globalThis, "fetch", async () => Response.json({ roomId: id, revision: 3, color: "w", state: { turn: "b" }, serverNow: 1 }));
  const body = await (await get()).json();
  assert.equal(body.push, pushTopic(id, "test-gateway-key"));
  assert.match(body.push, /^sjakk-[0-9a-f]{32}$/);
  assert.notEqual(body.push, pushTopic(id, "another-key"));
  assert.notEqual(body.push, pushTopic("00000000-0000-4000-8000-000000000003", "test-gateway-key"));
  assert.equal(body.revision, 3);
});

test("previews, errors and unexpected bodies get no push topic", async (t) => {
  configure(t);
  const bodies: unknown[] = [
    { settings: { variant: "playful" }, color: "b" },
    { error: "Ugyldig spiller- eller invitasjonsnøkkel." },
    { roomId: "not-a-room", color: "w", state: {} },
    { roomId: id, color: "x", state: {} },
    [1, 2],
  ];
  for (const upstream of bodies) {
    t.mock.method(globalThis, "fetch", async () => Response.json(upstream, { status: 200 }));
    const body = await (await get()).json();
    assert.deepEqual(body, upstream);
    t.mock.restoreAll();
  }
  t.mock.method(globalThis, "fetch", async () => new Response("{not json", { headers: { "Content-Type": "application/json" } }));
  assert.equal(await (await get()).text(), "{not json");
});

test("only seat snapshots from allowed endpoints and statuses get a push topic", async (t) => {
  configure(t);
  const snapshot = { roomId: id, revision: 3, color: "w", state: { turn: "b" } };
  const post = (path: string) => new Request(`https://thodh.com/sjakk/api/rooms${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer seat" }, body: "{}" });
  const cases: [string, Request, number, boolean][] = [
    ["state", new Request(`https://thodh.com/sjakk/api/rooms/${id}`, { headers: { Authorization: "Bearer seat" } }), 200, true],
    ["state refused", new Request(`https://thodh.com/sjakk/api/rooms/${id}`, { headers: { Authorization: "Bearer seat" } }), 403, false],
    ["create", post(""), 201, true],
    ["create refused", post(""), 403, false],
    ["join", post(`/${id}/join`), 200, true],
    ["rejected join", post(`/${id}/join`), 403, false],
    ["action", post(`/${id}/action`), 200, true],
    ["action conflict", post(`/${id}/action`), 409, true],
    ["illegal action", post(`/${id}/action`), 400, false],
    ["preview", post(`/${id}/preview`), 200, false],
  ];
  for (const [name, request, status, expected] of cases) {
    t.mock.method(globalThis, "fetch", async () => Response.json(snapshot, { status }));
    const body = await (await relayChess(request)).json();
    assert.equal("push" in body, expected, name);
    t.mock.restoreAll();
  }
  // A snapshot for another room than the one in the path gets nothing.
  t.mock.method(globalThis, "fetch", async () => Response.json({ ...snapshot, roomId: "00000000-0000-4000-8000-000000000003" }));
  assert.equal("push" in await (await get()).json(), false);
});
