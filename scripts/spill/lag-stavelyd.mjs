// Generates natural-sounding Stavebien audio (word, definition, example sentence) with a neural
// Norwegian Bokmål voice. Existing files are skipped, so the script can be rerun after adding words.
//
//   Azure (recommended, free tier covers the whole list):
//     TTS_LEVERANDOR=azure AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=westeurope node scripts/spill/lag-stavelyd.mjs
//   Google Cloud Text-to-Speech:
//     TTS_LEVERANDOR=google GOOGLE_TTS_KEY=... node scripts/spill/lag-stavelyd.mjs
//
// Optional: TTS_STEMME (default nb-NO-PernilleNeural / nb-NO-Chirp3-HD-Aoede), TTS_MAKS (stop after N files).
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { stavebienOrd } from "../../features/spill/data/stavebien/ord.ts"
import { LYD_DELER, LYD_MAPPE, lydId, lydTekst } from "../../features/spill/lib/stavebien-lyd.ts"

const leverandor = process.env.TTS_LEVERANDOR ?? "azure"
const maks = Number(process.env.TTS_MAKS ?? Infinity)
const mappe = path.join(process.cwd(), "public", LYD_MAPPE)
mkdirSync(mappe, { recursive: true })

const escape = (s) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)

async function azure(tekst, del) {
  const { AZURE_SPEECH_KEY: key, AZURE_SPEECH_REGION: region } = process.env
  if (!key || !region) throw new Error("Mangler AZURE_SPEECH_KEY eller AZURE_SPEECH_REGION")
  const stemme = process.env.TTS_STEMME ?? "nb-NO-PernilleNeural"
  // Single words are read a little slower and with a short pause, like a spelling bee host.
  const rate = del === "ord" ? "-12%" : "-4%"
  const ssml = `<speak version="1.0" xml:lang="nb-NO"><voice name="${stemme}"><prosody rate="${rate}">${escape(tekst)}</prosody></voice></speak>`
  const svar = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "thodh.com-stavebien",
    },
    body: ssml,
  })
  if (!svar.ok) throw new Error(`Azure ${svar.status}: ${await svar.text()}`)
  return Buffer.from(await svar.arrayBuffer())
}

async function google(tekst, del) {
  const key = process.env.GOOGLE_TTS_KEY
  if (!key) throw new Error("Mangler GOOGLE_TTS_KEY")
  const svar = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: tekst },
      voice: { languageCode: "nb-NO", name: process.env.TTS_STEMME ?? "nb-NO-Chirp3-HD-Aoede" },
      audioConfig: { audioEncoding: "MP3", speakingRate: del === "ord" ? 0.9 : 0.97 },
    }),
  })
  if (!svar.ok) throw new Error(`Google ${svar.status}: ${await svar.text()}`)
  return Buffer.from((await svar.json()).audioContent, "base64")
}

const syntetiser = leverandor === "google" ? google : azure
let laget = 0
let hoppet = 0
for (const o of stavebienOrd) {
  for (const [del, kode] of Object.entries(LYD_DELER)) {
    const fil = path.join(mappe, `${lydId(o.word)}-${kode}.mp3`)
    if (existsSync(fil)) {
      hoppet++
      continue
    }
    if (laget >= maks) break
    for (let forsok = 1; ; forsok++) {
      try {
        writeFileSync(fil, await syntetiser(lydTekst(o, del), del))
        break
      } catch (e) {
        if (forsok >= 4) throw e
        await new Promise((r) => setTimeout(r, 1500 * forsok))
      }
    }
    laget++
    if (laget % 50 === 0) console.log(`${laget} filer laget …`)
  }
}
// The pages read this manifest; public/ is not part of the server bundle on Vercel.
const filer = readdirSync(mappe).filter((f) => f.endsWith(".mp3")).sort()
writeFileSync(path.join(process.cwd(), "features/spill/data/stavebien/lyd.json"), JSON.stringify(filer) + "\n")
console.log(`Ferdig: ${laget} nye filer, ${hoppet} fantes fra før (${leverandor}).`)
