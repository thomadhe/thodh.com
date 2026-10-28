import { test } from "node:test";
import assert from "node:assert/strict";
import { GET, POST } from "../app/(otsjoba)/otsjoba/api/tutor/route";

test("public Otsjoba cannot enable AI through environment flags", async () => {
  const previous = process.env.OTSJOBA_AI_ENABLED;
  process.env.OTSJOBA_AI_ENABLED = "true";
  try {
    const status = GET();
    assert.deepEqual(await status.json(), { available: false });
    assert.equal(status.headers.get("Cache-Control"), "no-store");
    const response = POST();
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /veiledet øvelse/);
  } finally {
    if (previous === undefined) delete process.env.OTSJOBA_AI_ENABLED;
    else process.env.OTSJOBA_AI_ENABLED = previous;
  }
});
