import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const temporary = await mkdtemp(path.join(tmpdir(), "thodh-tests-"));
try {
  const learning = path.join(temporary, "learning.test.mjs");
  const api = path.join(temporary, "tutor.test.mjs");
  const accounts = path.join(temporary, "accounts.test.mjs");
  const chessRelay = path.join(temporary, "chess-relay.test.mjs");
  const games = path.join(temporary, "spill.test.mjs");
  for (const [entry, outfile] of [
    ["features/otsjoba/tests/learning.test.ts", learning],
    ["tests/tutor.test.ts", api],
    ["tests/accounts.test.ts", accounts],
    ["tests/chess-relay.test.ts", chessRelay],
    ["tests/spill.test.ts", games],
  ]) {
    await build({ entryPoints: [entry], outfile, bundle: true, platform: "node", format: "esm" });
  }
  const result = spawnSync(process.execPath, ["--test", learning, api, accounts, chessRelay, games, "tests/game.test.mjs", "tests/turn-clock.test.mjs", "tests/chess-session.test.mjs"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  // Only remove the dedicated directory created for this test run.
  if (path.dirname(temporary) !== path.resolve(tmpdir()) || !path.basename(temporary).startsWith("thodh-tests-")) {
    throw new Error("Unexpected test directory");
  }
  await rm(temporary, { recursive: true, force: true });
}
