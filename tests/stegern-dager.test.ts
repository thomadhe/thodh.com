import assert from "node:assert/strict"
import { test } from "node:test"
import { stegernDager } from "../features/spill/data/stegern"
import { leggTilDager } from "../features/spill/lib/dag"
import { byggOppgave, dagFor, duellDager, erRepris } from "../features/spill/lib/server/stegern-logikk"
import { STEGERN_START } from "../features/spill/lib/stegern"

// The prompts of days 1–60 (2026-11-02 to 2026-12-31), the first round of the bank. These dates have been played,
// so their prompts must never change or move: new days go at the end of the bank.
const FORSTE_60 = [
  ["Nevn en frukt", "Nevn et land som grenser til Tyskland", "Nevn et pattedyr som lever vilt i Norge", "Nevn en idrett i sommer-OL", "Nevn en norsk by", "Nevn et grunnstoff"],
  ["Nevn en grønnsak", "Nevn et land som grenser til Russland", "Nevn en fugl som finnes i Norge", "Nevn en Pixar-film", "Nevn et norsk fylke, dagens eller et tidligere", "Nevn en av USAs delstater"],
  ["Nevn en ost", "Nevn et land i Sør-Amerika", "Nevn en hunderase", "Nevn en person i Harry Potter-bøkene", "Nevn en farge", "Nevn en amerikansk president"],
  ["Nevn et bær", "Nevn et land som grenser til Kina", "Nevn en fisk man kan spise", "Nevn et instrument i et symfoniorkester", "Nevn en edelstein eller et smykkestein", "Nevn et kortspill"],
  ["Nevn noe man kan ha på pizza", "Nevn et land i Afrika", "Nevn et kattedyr", "Nevn en figur fra Donald Duck-bladet", "Nevn en planet i solsystemet", "Nevn et organ i menneskekroppen"],
  ["Nevn en type pasta", "Nevn et land som grenser til Frankrike", "Nevn et insekt", "Nevn en Disney-prinsesse", "Nevn en sjakkbrikke", "Nevn et stjernebilde"],
  ["Nevn et kjøkkenredskap", "Nevn et land i Europa", "Nevn en slange", "Nevn en ABBA-låt", "Nevn et skuespill av Henrik Ibsen", "Nevn en bok i Bibelen"],
  ["Nevn en type brød eller bakst", "Nevn en hovedstad i Europa", "Nevn et dyr som lever i havet", "Nevn en figur i The Simpsons", "Nevn en øvelse eller gren i vinter-OL", "Nevn et land som har arrangert sommer-OL"],
  ["Nevn noe man spiser eller drikker til jul i Norge", "Nevn et land som grenser til Østerrike", "Nevn et krypdyr", "Nevn en norsk konge", "Nevn en bokstav i det greske alfabetet", "Nevn en norsk statsminister"],
  ["Nevn en kaffedrikk", "Nevn et land i Asia", "Nevn en sopp", "Nevn en film av Steven Spielberg", "Nevn et kodeord i NATO-alfabetet", "Nevn et land som har euro som valuta"],
  ["Nevn en nøtt eller et frø man kan spise", "Nevn et land som grenser til Italia", "Nevn et hjortedyr", "Nevn en figur fra Thorbjørn Egners fortellinger", "Nevn en av Oslos 15 bydeler", "Nevn en NBA-klubb"],
  ["Nevn en suppe", "Nevn et land som begynner på S", "Nevn en ape eller annen primat", "Nevn en James Bond-skuespiller", "Nevn et tegnsettingstegn", "Nevn en klubb som har spilt i Premier League"],
  ["Nevn en dessert", "Nevn et land som grenser til Polen", "Nevn en bjørneart", "Nevn en Star Wars-figur", "Nevn et tre som vokser vilt i Norge", "Nevn en verdensmester i sjakk"],
  ["Nevn en pølsetype", "Nevn en hovedstad i Asia", "Nevn et dyr som lever vilt i Australia", "Nevn en bok av Roald Dahl", "Nevn en måleenhet", "Nevn et skuespill av Shakespeare"],
  ["Nevn en italiensk rett", "Nevn et land i Nord- eller Mellom-Amerika", "Nevn en hesterase", "Nevn en Marvel-superhelt", "Nevn en del av en sykkel", "Nevn en norsk nasjonalpark"],
  ["Nevn en kake", "Nevn et land som grenser til Brasil", "Nevn en gnager", "Nevn en Beatles-låt", "Nevn en geometrisk form", "Nevn en verdensmester i Formel 1"],
  ["Nevn noe man kan ha på brødskiva", "Nevn et land som begynner på M", "Nevn et husdyr på en gård", "Nevn en figur fra Ringenes herre", "Nevn et værfenomen", "Nevn en Pokémon fra første generasjon (nr. 1–151)"],
  ["Nevn et skalldyr eller bløtdyr man kan spise", "Nevn et land som grenser til Spania", "Nevn en fugl som ikke kan fly", "Nevn en Disney-tegnefilm (ikke Pixar)", "Nevn en kroppsdel med tre bokstaver", "Nevn en hovedstad i Afrika"],
  ["Nevn en sitrusfrukt", "Nevn et land i EU", "Nevn et kjent byggverk i verden", "Nevn et norsk politisk parti", "Nevn en norsk avis", "Nevn et primtall under 100"],
  ["Nevn et kjøttstykke", "Nevn et land som grenser til Ungarn", "Nevn en dinosaur", "Nevn et kjent maleri", "Nevn et sosialt medium eller en meldingsapp", "Nevn et land som har vunnet fotball-VM for menn"],
  ["Nevn en meksikansk rett", "Nevn et land der spansk er offisielt språk", "Nevn et dyr som lever vilt i Sør-Amerika", "Nevn en figur fra Mummidalen", "Nevn en skytype", "Nevn en norsk forfatter"],
  ["Nevn en sjokolade du kan kjøpe i butikken", "Nevn et land som grenser til Tyrkia", "Nevn en blomst", "Nevn et musikkinstrument", "Nevn et stjernetegn", "Nevn en elv i Europa"],
  ["Nevn en indisk rett", "Nevn et land som begynner på K", "Nevn en ugle", "Nevn en film med Tom Hanks", "Nevn noe du kan ha i et pennal", "Nevn en hovedstad i Nord- eller Sør-Amerika"],
  ["Nevn en japansk rett", "Nevn et land som grenser til Sveits", "Nevn en hval eller delfin", "Nevn et eventyr av H.C. Andersen", "Nevn en type sko", "Nevn et språk som er offisielt i et land i Europa"],
  ["Nevn en alkoholfri drikk", "Nevn et land i Oseania", "Nevn en ferskvannsfisk i Norge", "Nevn et medlem av den norske kongefamilien, nå eller før", "Nevn et ord som rimer på «sol»", "Nevn en gresk gud eller gudinne"],
  ["Nevn en saus", "Nevn et land som grenser til Iran", "Nevn en kattrase", "Nevn en figur fra Astrid Lindgrens bøker", "Nevn et rom i et hus", "Nevn en romersk keiser"],
  ["Nevn en kinesisk rett", "Nevn et NATO-land", "Nevn et dyr som har horn eller gevir", "Nevn en Disney-skurk", "Nevn en lek eller et spill barn leker ute", "Nevn en stjerne på himmelen"],
  ["Nevn en cocktail eller drink", "Nevn et land som grenser til Ukraina", "Nevn en haiart", "Nevn en figur fra Tintin", "Nevn en farge i regnbuen", "Nevn en norsk fjelltopp over 2000 meter"],
  ["Nevn en ølstil eller øltype", "Nevn et land som begynner på T", "Nevn en rovfugl", "Nevn et fjell i verden", "Nevn en ting du finner i en førstehjelpskoffert", "Nevn en norrøn gud, gudinne eller et vesen fra norrøn mytologi"],
  ["Nevn en fransk rett eller et fransk bakverk", "Nevn et land som grenser til India", "Nevn et pungdyr", "Nevn en videospillkonsoll", "Nevn en hånd i poker", "Nevn en film av Christopher Nolan eller Quentin Tarantino"],
  ["Nevn en thailandsk rett", "Nevn et land der fransk er offisielt språk", "Nevn en antilope", "Nevn et eventyr fra Asbjørnsen og Moe", "Nevn en kornsort", "Nevn en tysk delstat"],
  ["Nevn en rotgrønnsak", "Nevn et land som grenser til Saudi-Arabia", "Nevn en kråkefugl", "Nevn en kjent hund fra film, TV eller tegneserie", "Nevn en dans", "Nevn en provins eller et territorium i Canada"],
  ["Nevn en issmak", "Nevn et land som begynner på G", "Nevn en type båt eller skip", "Nevn en person i Friends", "Nevn en merkedag eller høytid i Norge", "Nevn en egyptisk farao"],
  ["Nevn en småkake eller kjeks", "Nevn et land som grenser til Argentina", "Nevn noe du kan se på himmelen", "Nevn en klassisk komponist", "Nevn et kontinent eller en verdensdel", "Nevn en måne i solsystemet"],
  ["Nevn noe som er laget av poteter", "Nevn et land der portugisisk er offisielt språk", "Nevn et pattedyr som lever i eller ved vann", "Nevn en film fra Studio Ghibli", "Nevn en norsk TV-kanal", "Nevn en gresk øy"],
  ["Nevn en tesort eller urtete", "Nevn et land som grenser til Tanzania", "Nevn en selart eller hvalross", "Nevn en person i Game of Thrones", "Nevn et verktøy", "Nevn en øy i Karibia"],
  ["Nevn et melkeprodukt", "Nevn et land som begynner på I", "Nevn et dyr som er utdødd", "Nevn en Harry Potter-bok eller -film", "Nevn et tall mellom 1 og 100 som er delelig med 7", "Nevn et eventyr samlet av brødrene Grimm"],
  ["Nevn en salat", "Nevn et land som grenser til Sør-Afrika", "Nevn en kjent katt fra film, TV eller tegneserie", "Nevn en filosof", "Nevn en del av øyet", "Nevn en valuta"],
  ["Nevn en eggerett", "Nevn et land som grenser til Peru", "Nevn en svømmeart", "Nevn en Michael Jackson-låt", "Nevn en kampsport", "Nevn en by i Italia"],
  ["Nevn en ingrediens i en vanlig kake", "Nevn et land som begynner på A", "Nevn et dyr som lever i Arktis", "Nevn en James Bond-film", "Nevn et sted på Svalbard", "Nevn en by i USA"],
  ["Nevn en risrett eller risslag", "Nevn et land som grenser til Afghanistan", "Nevn en figur fra Jungelboken", "Nevn et klesplagg", "Nevn et sjakkuttrykk", "Nevn en sjakkåpning"],
  ["Nevn en type godteri", "Nevn et land der arabisk er offisielt språk", "Nevn en papegøye", "Nevn et medlem av The Beatles, ABBA, Queen, The Rolling Stones eller a-ha", "Nevn noe som har hjul", "Nevn en by i Spania"],
  ["Nevn en sjømatrett", "Nevn et land som grenser til Sudan", "Nevn en kjent vitenskapsperson eller oppfinner", "Nevn en figur fra Toy Story", "Nevn en tidsenhet", "Nevn en hovedstad i verden"],
  ["Nevn en gatekjøkken- eller fastfoodkjede", "Nevn et land som begynner på L", "Nevn en ballsport", "Nevn en figur fra Shrek-filmene", "Nevn et bilmerke", "Nevn et norsk fjell eller en fjelltopp"],
  ["Nevn noe du kan ha i kaffen", "Nevn et land som grenser til Colombia", "Nevn et elektrisk apparat på kjøkkenet", "Nevn et norsk skisted", "Nevn en norsk fotballklubb", "Nevn et land i Afrika uten kystlinje"],
  ["Nevn en belgfrukt", "Nevn et land i Europa uten kystlinje", "Nevn en superhelt fra DC", "Nevn et ord som rimer på «hus»", "Nevn en av Jesu tolv apostler", "Nevn en by i Tyskland"],
  ["Nevn noe du kan ha på vafler", "Nevn et land som grenser til Hellas", "Nevn en norsk innsjø", "Nevn en Queen-låt", "Nevn et møbel", "Nevn en knokkel i kroppen"],
  ["Nevn en pizza", "Nevn et land som begynner på E", "Nevn en vulkan", "Nevn en a-ha-låt", "Nevn et yrke på et sykehus", "Nevn en by i Frankrike"],
  ["Nevn en tradisjonell norsk middagsrett", "Nevn et land som grenser til Egypt", "Nevn et hav eller havområde", "Nevn en figur fra Super Mario-spillene", "Nevn en leke", "Nevn en by i Storbritannia"],
  ["Nevn en brus eller et brusmerke", "Nevn et land som grenser til Serbia", "Nevn en ørken", "Nevn en egyptisk gud eller gudinne", "Nevn et flyselskap", "Nevn et kjent skip"],
  ["Nevn en krydderurt", "Nevn et land som begynner på P", "Nevn en norsk fjord", "Nevn en religion eller livssyn", "Nevn et teknologiselskap", "Nevn en norsk øy"],
  ["Nevn en druesort som brukes til vin", "Nevn et land som grenser til Romania", "Nevn en figur fra Muppets", "Nevn et programmeringsspråk", "Nevn et ord som rimer på «katt»", "Nevn en by i Sverige"],
  ["Nevn et dyr vi spiser kjøttet av", "Nevn et land som grenser til Tsjekkia", "Nevn en romersk gud eller gudinne", "Nevn et klesmerke", "Nevn en vindstyrke på Beauforts skala", "Nevn en by i Danmark"],
  ["Nevn en gresk rett", "Nevn et land som begynner på N", "Nevn en bergart eller et mineral", "Nevn en norsk dagligvarekjede", "Nevn et kort i en vanlig kortstokk", "Nevn en maler eller billedkunstner"],
  ["Nevn en spansk tapasrett eller spansk rett", "Nevn et land som grenser til Kasakhstan", "Nevn en stueplante", "Nevn en musikksjanger", "Nevn et vitamin eller et mineral i kosten", "Nevn et sted, et strøk eller en bydel i Oslo"],
  ["Nevn noe man pynter juletreet med", "Nevn et land som har arrangert vinter-OL", "Nevn en tegneserie eller tegneseriestripe", "Nevn et nordisk land eller selvstyrt område", "Nevn en kjent bro", "Nevn en kjent oppdagelsesreisende"],
  ["Nevn en kyllingrett", "Nevn et land som grenser til Mosambik", "Nevn en kjent statue eller et monument", "Nevn et skolefag", "Nevn en type bil eller kjøretøy", "Nevn en norsk nobelprisvinner"],
  ["Nevn noe du har i fredagstacoen", "Nevn et land som grenser til Zambia", "Nevn en hundekommando", "Nevn en litteratur- eller filmsjanger", "Nevn et dyr som begynner på K", "Nevn en kjent idrettsarena eller stadion"],
  ["Nevn en nudelrett eller type nudler", "Nevn et land som grenser til Belgia", "Nevn et land som har deltatt i Eurovision", "Nevn en ting som er gul", "Nevn et spill der man bruker terninger", "Nevn noe det finnes nøyaktig sju av"],
  ["Nevn noe man kan lage av epler", "Nevn et land som begynner på U", "Nevn en ting du finner på en flyplass", "Nevn et ord som rimer på «sju»", "Nevn noe du har med på skitur", "Nevn et land"],
]

const tekster = (i: number) => [...stegernDager[i].sporsmal, stegernDager[i].finale].map((s) => s.tekst)

test("6/7-stegern: banken har 120 dager", () => {
  assert.equal(stegernDager.length, 120)
  for (const [i, d] of stegernDager.entries()) assert.equal(d.sporsmal.length, 5, `dag ${i + 1}`)
})

test("6/7-stegern: dag 1–60 er uendret og ligger på samme datoer", () => {
  assert.equal(FORSTE_60.length, 60)
  for (const [i, forventet] of FORSTE_60.entries()) {
    assert.deepEqual(tekster(i), forventet, `dag ${i + 1}`)
    const dato = leggTilDager(STEGERN_START, i)
    assert.equal(dagFor(dato), stegernDager[i], dato)
    // These dates were the first round of the bank, never a replay.
    assert.equal(erRepris(dato), false, dato)
  }
})

test("6/7-stegern: dag 61–120 følger etter, og banken starter først på nytt etter 120 dager", () => {
  assert.equal(leggTilDager(STEGERN_START, 60), "2027-01-01")
  for (let i = 60; i < 120; i++) {
    const dato = leggTilDager(STEGERN_START, i)
    assert.equal(dagFor(dato), stegernDager[i], dato)
    assert.equal(erRepris(dato), false, dato)
  }
  assert.equal(erRepris(leggTilDager(STEGERN_START, 120)), true)
  assert.equal(dagFor(leggTilDager(STEGERN_START, 120)), stegernDager[0])
})

test("6/7-stegern: hvert nytt spørsmål kan tolkes og har minst ett svar på nivå 1", () => {
  for (let i = 60; i < stegernDager.length; i++) {
    for (const s of [...stegernDager[i].sporsmal, stegernDager[i].finale]) {
      const hvor = `dag ${i + 1}: ${s.tekst}`
      const o = byggOppgave(s)
      assert.ok(o.alternativer.some((a) => a.nivaa === 1), hvor)
      assert.ok(o.alternativer.length >= 4, hvor)
    }
  }
})

test("6/7-stegern: ingen spørsmål går igjen i banken", () => {
  const sett = new Map<string, number>()
  // Case, spacing and punctuation do not make two prompts different.
  const nokkel = (t: string) => t.toLowerCase().replace(/[^a-zæøå0-9]+/g, " ").trim()
  for (let i = 0; i < stegernDager.length; i++) {
    for (const t of tekster(i)) {
      const k = nokkel(t)
      assert.ok(!sett.has(k), `«${t}» på dag ${i + 1} finnes også på dag ${sett.get(k)}`)
      sett.set(k, i + 1)
    }
  }
})

test("6/7-stegern: duellen kan bruke alle tidligere dager i første runde av banken", () => {
  // Until today and the next DUELL_SPERRE_DAGER days all fall within the first 120, no past day comes back soon
  // enough to be blocked; day 106 is the last such day.
  for (const iDag of ["2026-12-31", "2027-01-01", "2027-02-14", leggTilDager(STEGERN_START, 105)]) {
    const dager = duellDager(iDag)
    const antall = Math.round((Date.parse(iDag) - Date.parse(STEGERN_START)) / 86_400_000)
    assert.equal(dager.length, antall, iDag)
    assert.equal(dager[0], STEGERN_START, iDag)
  }
})
