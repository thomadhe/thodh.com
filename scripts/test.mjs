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
  const chessPush = path.join(temporary, "chess-push.test.mjs");
  const games = path.join(temporary, "spill.test.mjs");
  const geoDirection = path.join(temporary, "geografi-retning.test.mjs");
  const gjDuelBank = path.join(temporary, "gjettelos-duellbank.test.mjs");
  const stDuelBank = path.join(temporary, "stegern-duellbank.test.mjs");
  const stegernDays = path.join(temporary, "stegern-dager.test.mjs");
  const anelseslos = path.join(temporary, "anelseslos.test.mjs");
  const moggern = path.join(temporary, "moggern.test.mjs");
  for (const [entry, outfile] of [
    ["features/otsjoba/tests/learning.test.ts", learning],
    ["tests/tutor.test.ts", api],
    ["tests/accounts.test.ts", accounts],
    ["tests/chess-relay.test.ts", chessRelay],
    ["tests/chess-push.test.ts", chessPush],
    ["tests/spill.test.ts", games],
    ["tests/geografi-retning.test.ts", geoDirection],
    ["tests/gjettelos-duellbank.test.ts", gjDuelBank],
    ["tests/stegern-duellbank.test.ts", stDuelBank],
    ["tests/stegern-dager.test.ts", stegernDays],
    ["tests/anelseslos.test.ts", anelseslos],
    ["tests/moggern.test.ts", moggern],
  ]) {
    await build({ entryPoints: [entry], outfile, bundle: true, platform: "node", format: "esm" });
  }
  const result = spawnSync(process.execPath, ["--test", learning, api, accounts, chessRelay, chessPush, games, geoDirection, gjDuelBank, stDuelBank, stegernDays, anelseslos, moggern, "tests/game.test.mjs", "tests/turn-clock.test.mjs", "tests/chess-session.test.mjs", "tests/chess-online.test.mjs", "tests/sjakk-oppgaver.test.mjs", "tests/sjakk-apninger.test.mjs", "tests/sjakk-kurs.test.mjs", "tests/sjakk-for-1.test.mjs"], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  // Only remove the dedicated directory created for this test run.
  if (path.dirname(temporary) !== path.resolve(tmpdir()) || !path.basename(temporary).startsWith("thodh-tests-")) {
    throw new Error("Unexpected test directory");
  }
  await rm(temporary, { recursive: true, force: true });
}
