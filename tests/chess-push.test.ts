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
