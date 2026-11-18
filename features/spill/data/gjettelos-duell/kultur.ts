import { lag } from "../gjettelos/typer"

// Kultur, bare for Gjetteløs-duell. Hvert tall er sjekket mot kilden som står ved spørsmålet; "utregnet" betyr at svaret
// følger av tallene i spørsmålet. "anslag" er tall man må resonnere seg fram til; "fakta" er oppslag, mål og årstall.

export const kultur = [
  ...lag("kultur", "anslag", [
    ["d-flaklypa", 2, "Hvor mange kinobilletter har «Flåklypa Grand Prix» solgt i Norge?", "billetter", 5.5e6, "Store norske leksikon", { ca: true, info: "Filmen kom i 1975." }],
    ["d-agatha-christie", 2, "Hvor mange bøker har Agatha Christie solgt?", "bøker", 2e9, "Guinness World Records", { ca: true, info: "Guinness regner henne som verdens mestselgende romanforfatter." }],
    ["d-munch-besok", 2, "Hvor mange besøkende med billett hadde MUNCH i Oslo i 2025?", "besøkende", 774556, "MUNCH, årsberetning 2025", { per: "2025", info: "Med gratisbesøk var det nesten 1,15 millioner." }],
    ["d-calvin", 3, "Hvor mange striper av «Tommy og Tigern» tegnet Bill Watterson?", "striper", 3160, "NPR", { info: "Stripa gikk fra 1985 til nyttårsaften 1995." }],
    ["d-ibsen-drama", 3, "Hvor mange skuespill skrev Henrik Ibsen fra «Kjærlighedens Komedie» i 1862 til «Når vi døde vågner» i 1899?", "skuespill", 18, "Store norske leksikon"],
    ["d-loc", 3, "Hvor mange katalogiserte bøker har Library of Congress i Washington?", "bøker", 25.77e6, "Library of Congress", { ca: true, per: "2023", info: "Til sammen har biblioteket over 178 millioner gjenstander." }],
    ["d-munchmuseet", 3, "Hvor mange verk testamenterte Edvard Munch til Oslo kommune?", "verk", 26724, "Store norske leksikon", { info: "Over 18 000 grafiske blad og nesten 1 200 malerier." }],
    ["d-operaen", 2, "Hvor mange sitteplasser har hovedscenen i Operahuset i Bjørvika?", "seter", 1350, "Store norske leksikon"],
    ["d-astrid-lindgren", 2, "Hvor mange bøker har Astrid Lindgren solgt?", "bøker", 160e6, "Store norske leksikon", { ca: true }],
    ["d-a-ha", 2, "Hvor mange album og singler har a-ha solgt?", "album og singler", 70e6, "Store norske leksikon", { ca: true, info: "Debutalbumet «Hunting High and Low» alene har solgt over åtte millioner." }],
    ["d-grieg-lyriske", 3, "Hvor mange hefter med «Lyriske stykker» for piano ga Edvard Grieg ut?", "hefter", 10, "Store norske leksikon", { info: "De kom ut mellom 1867 og 1901." }],
  ]),
  ...lag("kultur", "fakta", [
    ["d-ja-vi-elsker", 2, "Hvor mange vers har «Ja, vi elsker dette landet»?", "vers", 8, "Regjeringen", { info: "På 17. mai synger vi som regel bare første og de to siste." }],
    ["d-skrik-versjoner", 3, "Hvor mange versjoner av «Skrik» regner Store norske leksikon med, når litografiet er med?", "versjoner", 5, "Store norske leksikon", { info: "To malerier, et fargekritt, en pastell og en litografi." }],
    ["d-hamsun-sult", 2, "Hvilket år kom Knut Hamsuns «Sult» ut?", "årstall", 1890, "Store norske leksikon", { info: "Et utdrag sto i tidsskriftet Ny Jord allerede i 1888." }],
    ["d-tintin", 2, "Hvor mange Tintin-album ga Hergé ut?", "album", 23, "Store norske leksikon", { info: "Hergé tegnet Tintin i 47 år, fra 1929 til 1976." }],
    ["d-nobel-norske-litt", 2, "Hvor mange nordmenn har fått nobelprisen i litteratur?", "nordmenn", 4, "Store norske leksikon", { per: "2026", info: "Bjørnson, Hamsun, Undset og Fosse." }],
  ]),
]
