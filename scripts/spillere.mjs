// How many play: daily visitors from Vercel Web Analytics (cookie-free; a visitor is counted once a day).
// Uses the logged-in Vercel CLI and .vercel/project.json. Hobby keeps a month of data.
//   node scripts/spillere.mjs [days, default 14]

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const dager = Math.min(Math.max(Number(process.argv[2]) || 14, 1), 31);
const { projectId, orgId } = JSON.parse(readFileSync(new URL("../.vercel/project.json", import.meta.url), "utf8"));
const dato = (d) => d.toISOString().slice(0, 10);
const idag = new Date();
const fra = new Date(idag.getTime() - (dager - 1) * 864e5);
// The end is exclusive: tomorrow, so today counts too.
const til = new Date(idag.getTime() + 864e5);

function sporring(parametre) {
  const q = new URLSearchParams({ projectId, teamId: orgId, since: dato(fra), until: dato(til), ...parametre });
  const ut = execSync(`npx vercel api "/v1/query/web-analytics/visits/aggregate?${q}" --raw`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return JSON.parse(ut).data;
}

const spill = "startswith(requestPath, '/spill/')";
const alle = sporring({ by: "day", limit: "31" });
const iSpill = new Map(sporring({ by: "day", limit: "31", filter: spill }).map((r) => [r.timestamp, r.visitors]));

console.log(`Dag (UTC)    Spillere  Besøkende`);
for (const r of alle.filter((r) => r.timestamp.slice(0, 10) <= dato(idag))) console.log(`${r.timestamp.slice(0, 10)}  ${String(iSpill.get(r.timestamp) ?? 0).padStart(8)}  ${String(r.visitors).padStart(9)}`);

console.log(`\nPer spill, ${dato(fra)}–${dato(idag)} (besøkende i perioden):`);
for (const r of sporring({ by: "requestPath", limit: "30", filter: spill })) console.log(`${String(r.visitors).padStart(6)}  ${r.requestPath}`);
