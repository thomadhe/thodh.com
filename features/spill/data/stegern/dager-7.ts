import { dag, sp } from "./typer"

// Days 26–30.
export const dager7 = [
  dag(
    sp(
      "Nevn en saus",
      "ketchup, majones, brun saus, bearnaise | hvit saus, tomatsaus, soyasaus, pesto, remulade, sennep, aioli, hollandaise, bolognese | tacosaus, salsa, chilisaus, sriracha, barbecuesaus/bbq-saus, tzatziki, guacamole, hvitløksaus/hvitløkssaus, karrisaus, sjysaus, rømmesaus, ostesaus, peppersaus, soppsaus, bechamel, carbonara | worcestershiresaus, tabasco, teriyakisaus, hoisinsaus, østerssaus, fiskesaus, ponzu, chimichurri, romesco, tartarsaus, cocktailsaus, sennepssaus, pepperrotsaus, eplemos, tyttebærsyltetøy, ranch, caesardressing, thousand island, vinaigrette, satay/peanøttsaus, sweet chili, mornay, velouté, demi-glace, beurre blanc | gremolata, salsa verde, mole, harissa, zhug, toum, nam jim, chamoy, piri-piri, aji amarillo, ravigote, sauce gribiche, bordelaise, sauce choron, sauce paloise",
    ),
    sp("Nevn et land som grenser til Iran", "#IQ, #AF, #TR | #PK | #TM, #AM, #AZ | | @naboer:IR"),
    sp(
      "Nevn en kattrase",
      "maine coon, perser/perserkatt, siameser/siameserkatt, norsk skogkatt/skogkatt | ragdoll, bengal, sfinks/sphynx, britisk korthår, huskatt | birma/hellig birma, russisk blå, abyssiner, bondekatt, scottish fold, burmeser, orientalsk korthår, devon rex, cornish rex, exotic | savannah, sibirkatt, turkisk angora, turkisk van, egyptisk mau, ocicat, tonkineser, balineser, somali, chartreux, havana, selkirk rex, manx, american shorthair, japansk bobtail, singapura, snowshoe, ragamuffin, nebelung, korat | lykoi, laperm, peterbald, donskoy, toyger, chausie, serengeti, munchkin, kurilsk bobtail, sokoke, burmilla, bombay, khao manee, pixie-bob, highlander",
    ),
    sp(
      "Nevn en figur fra Astrid Lindgrens bøker",
      "Pippi Langstrømpe/Pippi, Emil/Emil i Lønneberget, Ronja/Ronja Røverdatter, Karlsson på taket/Karlsson | Lillebror, Tommy, Annika, Brødrene Løvehjerte/Jonatan Løvehjerte/Jonatan, Kavring/Karl Løvehjerte, Madicken, Lotta/Lotta på Bråkmakergata, Birk, Mattis, Ida | Herr Nilsson, Lilla Gubben/Lille Gubben, Alfred, Mio/Mio min Mio, Kalle Blomkvist, Bullerbybarna, Tengil, Katla| Lisa, Lasse, Bosse, Britta, Anna, Olle, Skorpan, Sofia, Jum-Jum, Ture Sventon, Rasmus, Paradis-Oskar, Mattisrøverne, Lovis, Borka, Skalle-Per, Krösa-Maja, Fröken Bock/Frøken Bock| Pelle, Ronja dup",
    ),
    sp(
      "Nevn et rom i et hus",
      "kjøkken, stue, soverom, bad/baderom | gang, toalett/do, kjeller, loft, vaskerom, kontor, garasje | spisestue, gjesterom, barnerom, entré, bod, walk-in-closet/garderobe, hjemmekontor, vindfang, trappeoppgang, tv-stue/kjellerstue, badstue/sauna | spiskammer, grovkjøkken, bibliotek, vinkjeller, hobbyrom, treningsrom, kinorom, musikkrom, fyrrom, tørkerom, peisestue, salong, hall, veranda, vinterhage | anretning, bryggerhus, pikeværelse, røykerom, biljardrom, dampbad, panikkrom",
    ),
    sp(
      "Nevn en romersk keiser",
      "Augustus, Nero, Caligula | Konstantin/Konstantin den store, Marcus Aurelius, Hadrian, Trajan, Tiberius, Claudius | Commodus, Vespasian, Titus, Domitian, Diokletian, Caracalla, Septimius Severus, Theodosius/Theodosius den store, Antoninus Pius, Julian/Julian Frafalleren | Galba, Otho, Vitellius, Nerva, Lucius Verus, Pertinax, Didius Julianus, Geta, Macrinus, Elagabalus, Severus Alexander, Maximinus Thrax, Gordian, Filip araberen, Decius, Valerian, Gallienus, Claudius Gothicus, Aurelian, Probus, Carus, Maximian, Galerius, Konstantius Klorus, Licinius, Maxentius, Konstans, Konstantius II, Valens, Valentinian, Gratian, Honorius, Arcadius, Romulus Augustulus | Jovian, Magnus Maximus, Theodosius II, Valentinian III, Petronius Maximus, Avitus, Majorian, Libius Severus, Anthemius, Olybrius, Glycerius, Julius Nepos, Justinian",
      { nei: "Julius Cæsar, Cæsar, Caesar, Julius Caesar, Spartacus, Brutus" },
    ),
  ),
  dag(
    sp(
      "Nevn en kinesisk rett",
      "vårruller/vårrull, sursøt svin/sur-søt svin/sursøtt, nudler/nuddler, dim sum, stekt ris | pekingand, wonton, chow mein, kung pao/kung pao-kylling, dumplings, baozi/bao, hot pot | mapo tofu, char siu, chop suey, eggerull, eggedråpesuppe, sur og sterk suppe, dan dan nudler, xiaolongbao, sesamkylling, general tso, lo mein, congee/risgrøt, hoisin-and, cha siu bao, jiaozi | zhajiangmian, gong bao, twice-cooked pork, ma po, yu xiang qiezi, lanzhou-nudler, guotie, shaobing, jianbing, youtiao, tangyuan, mooncake/månekake, zongzi, hundreårsegg, sichuanfisk, la zi ji, dongpo-svin, beggar's chicken, mantou, rou jia mo | biang biang, liangpi, luosifen, hong shao rou, bai qie ji, char kway teow, hainankylling",
    ),
    sp("Nevn et NATO-land", "#NO, #US, #DE, #GB, #FR | #DK, #IS, #CA, #NL, #BE, #IT, #ES, #PL, #FI, #SE | #PT, #TR, #GR, #LU, #EE, #LV, #LT | #CZ, #HU, #SK, #SI, #HR, #RO, #BG | #AL, #ME, #MK", { nei: "Sveits, Østerrike, Irland, Ukraina, Russland, Kypros, Malta" }),
    sp(
      "Nevn et dyr som har horn eller gevir",
      "neshorn, ku/okse, geit, elg, reinsdyr/rein | hjort, rådyr, sau/vær, bøffel, antilope, gnu, sjiraff, steinbukk | bison, jak, vannbøffel, moskus, villsau/mufflon, impala, oryx, kudu, eland, gaselle, sebu, narhval, dåhjort, triceratops | markhor, argali, tahr, gems, saiga, springbok, nyala, bongo, hartebeest, dik-dik, okapi, gaur, banteng, anoa, takin, pronghorn/gaffelantilope, enhjørning | hornugle, neshornbille, hjortebille",
    ),
    sp(
      "Nevn en Disney-skurk",
      "Scar, Ursula, Jafar, Cruella/Cruella de Vil | Maleficent/Malefika, Kaptein Krok, Gaston, Hades, Shere Khan, den onde dronningen/stemoren til Snøhvit, Lady Tremaine/stemoren | Frollo, Ratcliffe, Shan Yu, Dr. Facilier, Mor Gothel, Hans, Kaa, Prins John, Yzma, Ratigan, Svarte-Petter, Madam Mim | Medusa, Sir Hiss, Edgar, Sykes, Clayton, Den hornede kongen, Stromboli, Chernabog, King Candy, Bellwether, Tamatoa, Magnifico, Lotso, Syndrome, Randall, Zurg, Hopper, Charles Muntz, Ernesto de la Cruz | Monstro, Lampwick, Rourke, Helga Sinclair, Captain Gantu",
    ),
    sp(
      "Nevn en lek eller et spill barn leker ute",
      "gjemsel, sisten, hoppetau, paradis | boksen går, slå ball, fotball, hoppestrikk/strikk, kongen befaler, rødt lys/rødt lys grønt lys, stiv heks | haien kommer, høk og due, kanonball, bro bro brille, alle mine kyllinger, sardiner/sardin, klinkekuler, kast på boks | landeveissisten, brennball, rounders, slengtau, bjørnen sover, sjørøversisten, sisten med frys | fargesisten, ringlek, tautrekking, sekkeløp, eggeløp",
    ),
    sp(
      "Nevn en stjerne på himmelen",
      "Sola/Solen, Nordstjernen/Polaris, Sirius | Betelgeuse, Rigel, Vega, Alfa Centauri, Proxima Centauri | Aldebaran, Arcturus/Arktur, Antares, Altair, Deneb, Spica, Capella, Pollux, Kastor/Castor, Regulus, Procyon, Canopus, Bellatrix | Achernar, Fomalhaut, Mira, Algol, Mizar, Alkor, Mintaka, Alnilam, Alnitak, Saiph, Dubhe, Merak, Alioth, Alkaid/Benetnasch, Denebola, Hadar, Acrux, Shaula, Rasalhague, Barnards stjerne | Eta Carinae, VY Canis Majoris, UY Scuti, Tabbys stjerne, Wolf 359, Luyten, Epsilon Eridani, Tau Ceti, Gliese 581, TRAPPIST-1, R136a1, Stephenson 2-18, Sadr, Albireo, Schedar, Caph, Mirach, Alpheratz, Hamal, Elnath, Menkalinan, Alhena, Wezen, Adhara, Avior, Miaplacidus, Gacrux, Mimosa, Kochab, Thuban, Eltanin, Rasalgethi, Zubenelgenubi, Vindemiatrix, Sadalsuud, Enif, Markab, Scheat",
    ),
  ),
  dag(
    sp(
      "Nevn en cocktail eller drink",
      "mojito, pina colada, margarita, gin og tonic/gin tonic | cosmopolitan, daiquiri, bloody mary, martini, sex on the beach, white russian, aperol spritz/spritz, long island iced tea | caipirinha, negroni, old fashioned, manhattan, mai tai, tequila sunrise, moscow mule, espresso martini, cuba libre, irish coffee, whiskey sour, blue lagoon, black russian, screwdriver, gin fizz, tom collins, mimosa, bellini | sidecar, sazerac, mint julep, paloma, dark 'n' stormy, french 75, kir royale, hugo spritz, pornstar martini, zombie, singapore sling, gimlet, aviation, amaretto sour, pisco sour, americano, boulevardier, grasshopper, b-52, hurricane, rusty nail, godfather, kamikaze, harvey wallbanger | corpse reviver, last word, paper plane, penicillin, clover club, bee's knees, vieux carré, ramos gin fizz, jungle bird, bramble, hanky panky, mary pickford, el diablo, fernet con coca, salty dog",
    ),
    sp("Nevn et land som grenser til Ukraina", "#RU, #PL | #BY, #RO, #HU | #SK, #MD | | @naboer:UA"),
    sp(
      "Nevn en haiart",
      "hvithai, hammerhai, hvalhai, brugde | tigerhai, oksehai, blåhai, pigghå, sitronhai | håbrann, makohai, grønlandshai/håkjerring, revehai, svarttipphai, hvittipphai, sandtigerhai| kattehai/småflekket rødhai, rødhai, megamunnhai, koboldhai, dvergpigghai, epaulettehai, wobbegong, sebrahai, silkehai, galapagoshai, håkjerring dup | grå revhai, havengel, kragehai/frynsehai, spinnerhai, sixgill/kamtannhai",
      { nei: "delfin, spekkhogger, rokke" },
    ),
    sp(
      "Nevn en figur fra Tintin",
      "Tintin, Terry/Milou/Snowy, Kaptein Haddock/Haddock | Professor Kalkulus/Kalkulus, Dupond og Dupont/Dupont/Dupond, Bianca Castafiore/Castafiore | Nestor, Rastapopoulos, Tchang/Chang, General Alcazar/Alcazar, Abdallah, Serafin Lampion/Lampion | Emir Ben Kalish Ezab, Allan, Dr. Müller/Müller, Oliveira da Figueira, Sponsz, Irma, Professor Bergamotte/Bergamotte, Wagner, Kong Muskar | Skut, Lazlo Carreidas/Carreidas, Rackham den røde, Ridder Frans av Hadoque, Sakharine",
    ),
    sp(
      "Nevn en farge i regnbuen",
      "rød, blå, gul, grønn | oransje, lilla | fiolett, indigo | | ",
      { nei: "rosa, brun, svart, hvit, turkis" },
    ),
    sp(
      "Nevn en norsk fjelltopp over 2000 meter",
      "Galdhøpiggen, Glittertind, Store Skagastølstind/Storen | Snøhetta, Rondeslottet, Store Styggedalstind, Surtningssue, Skarstind | Vesle Galdhøpiggen, Store Memurutind, Storronden, Høgronden, Fannaråken, Store Knutholstind, Bukkehø, Leirhøe, Store Smørstabbtind | Sentraltind, Store Ringstind, Store Dyrhaugstind, Uranostind, Visbretind, Kyrkja, Store Hellstugutind, Midtmaradalstind | Vinjeronden, Veslesmeden, Store Austanbotntind, Store Svartdalspiggen, Tverrbytthornet, Midtre Hellstugutind, Store Bukkeholstind, Kvasshøe, Søre Hellstugutind, Store Tverråtind, Tjønnholstind, Langvasshøe, Store Urdadalstind",
      { nei: "Gaustatoppen, Romsdalshornet, Trolltunga, Preikestolen" },
    ),
  ),
  dag(
    sp(
      "Nevn en ølstil eller øltype",
      "pils/pilsner, IPA, lager, stout | pale ale, porter, juleøl, bokkøl/bock, hveteøl/weissbier, alkoholfritt øl, sour/surøl | ale, brown ale, red ale, amber ale, double IPA, NEIPA/new england ipa, lettøl, bayer, export, dunkel, saison, tripel, dubbel, witbier, kölsch, helles, märzen, gose, berliner weisse, imperial stout, barley wine/byggvin | lambic, gueuze, kriek, rauchbier, altbier, quadrupel, scotch ale, milk stout, oatmeal stout, session ipa, west coast ipa, hazy ipa, black ipa, doppelbock, eisbock, kveik, maltøl, stjørdalsøl, steinøl | grisette, sahti, kvass, faro, oud bruin, flanders red, biere de garde, california common/steam beer, cream ale, wee heavy, schwarzbier, zwickelbier, kellerbier, roggenbier, dampfbier",
    ),
    sp("Nevn et land som begynner på T", "#DE, #TH, #TR | #TN, #TZ, #CZ | #TW, #TJ, #TD, #TG, #TM | #TO, #TT, #TV | @start:T"),
    sp(
      "Nevn en rovfugl",
      "ørn/kongeørn, havørn, hauk, falk | hubro, ugle, vandrefalk, musvåk, fiskeørn, kondor, gribb | hønsehauk, spurvehauk, tårnfalk, jaktfalk, dvergfalk, lerkefalk, glente/rød glente, fjellvåk, vepsevåk, kongegribb, hvithodehavørn, harpyørn, sekretærfugl | sivhauk, myrhauk, steppehauk, kattugle, snøugle, slagugle, haukugle, perleugle, munkegribb, lammegribb, kalkungribb, karakara, ormevåk, slangeørn, keiserørn, steppeørn, dvergørn, gåsegribb | filippinørn, kronørn, kampørn, rødhalevåk, swainsonvåk",
    ),
    sp(
      "Nevn et fjell i verden",
      "Mount Everest/Everest, K2, Kilimanjaro, Mont Blanc | Matterhorn, Fuji/Fujiyama, Galdhøpiggen, Aconcagua, Denali/Mount McKinley, Elbrus, Olympus, Kebnekaise | Kangchenjunga, Lhotse, Makalu, Annapurna, Nanga Parbat, Eiger, Jungfrau, Zugspitze, Vesuv, Etna, Ararat, Mount Kenya, Table Mountain/Taffelberget, Sinai, Ben Nevis, Snowdon, Mount Rainier, Mount St. Helens, Mount Kosciuszko/Kosciuszko, Aoraki/Mount Cook, Chimborazo, Popocatépetl | Cho Oyu, Dhaulagiri, Manaslu, Gasherbrum, Broad Peak, Shishapangma, Vinson/Mount Vinson, Puncak Jaya/Carstensz, Huascarán, Ojos del Salado, Cotopaxi, Illimani, Mount Logan, Mount Whitney, Pikes Peak, Grossglockner, Dufourspitze, Monte Rosa, Gran Paradiso, Mont Ventoux, Pico de Orizaba, Teide, Hekla, Halti, Kinabalu, Rinjani, Mauna Kea, Mauna Loa, Uluru | Ama Dablam, Nuptse, Pumori, Kailash, Siula Grande, Fitz Roy, Cerro Torre, Alpamayo, Damavand, Toubkal, Rwenzori, Stanley, Elgon, Ras Dashen, Erebus, Musala, Triglav, Gerlach, Rysy, Mount Elbert, Grand Teton, Half Dome, El Capitan",
    ),
    sp(
      "Nevn en ting du finner i en førstehjelpskoffert",
      "plaster, bandasje/gasbind, saks, kompress | pinsett, elastisk bind, sportstape/tape, desinfeksjon/sårrens/desinfiserende, engangshansker/hansker, termometer, smertestillende/paracet/paracetamol | trekantbandasje/trekanttørkle, isposer/kuldepose/kalde omslag, redningsteppe/isolasjonsteppe/folieteppe, sikkerhetsnål/sikkerhetsnåler, sårteip/sårstrips, sårsalve, gnagsårplaster, øyeskylling/øyeskyllevæske, munnstykke/ansiktsmaske | brannsårgel, splintpinsett, tourniquet/årepresse, flåttfjerner/flåttang, nesespray, antihistamin, hjertestarter, pustemaske, førstehjelpsveiledning | strips, aloe vera, jodtinktur",
    ),
    sp(
      "Nevn en norrøn gud, gudinne eller et vesen fra norrøn mytologi",
      "Odin, Tor, Loke, Frøya/Freya | Frigg, Balder, Tyr, Heimdall, Fenrisulven/Fenris, Midgardsormen, Sleipner, Valkyrie/valkyrjer | Frøy/Frey, Njord, Idunn, Brage, Vidar, Vale, Ull, Skade, Sif, Hel, Ymir, Mjølner, Yggdrasil, Hugin, Munin, Surt, Jotner/jotne | Forsete, Hod, Hermod, Gefjon, Sigyn, Nanna, Eir, Saga, Ran, Ægir, Norner/norne, Urd, Verdande, Skuld, Audhumla, Ratatosk, Nidhogg, Gullinbuste, Tanngnjost, Tanngrisne, Huldra, Gerd, Mime, Kvase, Fafner, Thrym, Utgard-Loke, Hrungne| Sol, Mane, Natt, Dag, Bestla, Bor, Bure, Lodur, Høne, Hyrrokkin, Angerboda, Jormungand, Garm, Skoll, Hate, Hræsvelg, Sæhrimne, Heidrun, Eiktyrne, Draupne, Gungne, Skidbladne, Brisingamen, Gjallarhorn",
    ),
  ),
  dag(
    sp(
      "Nevn en fransk rett eller et fransk bakverk",
      "croissant, crème brûlée, baguette/baguett, crêpe/crêpes/pannekake | ratatouille, quiche/quiche lorraine, løksuppe/fransk løksuppe, escargot/snegler, foie gras, bouillabaisse, coq au vin, macarons/macaron, croque monsieur | boeuf bourguignon/boeuf bourguignonne, cassoulet, soufflé, éclair, pain au chocolat, tarte tatin, profiteroles, confit de canard/andeconfit, steak frites, moules frites/blåskjell, bœuf tartare/tartar, salade niçoise, croque madame, gratin dauphinois, crème caramel, madeleine/madeleines, mille-feuille, brioche, vichyssoise | pot-au-feu, blanquette de veau, choucroute, tartiflette, raclette, fondue, aligot, pissaladière, socca, brandade, pâté, terrine, rillettes, galette, kouign-amann, canelé, financier, paris-brest, saint-honoré, clafoutis, far breton, quenelles, gougères, salade lyonnaise, tapenade, aioli, sole meunière | navarin, daube, garbure, piperade, hachis parmentier, œufs en meurette, île flottante, opéra, religieuse, tarte flambée/flammekueche, baeckeoffe, kig ha farz, tourte, pithivier",
    ),
    sp("Nevn et land som grenser til India", "#PK, #CN | #NP, #BD | #BT, #MM | | @naboer:IN"),
    sp(
      "Nevn et pungdyr",
      "kenguru, koala, wombat, opossum | wallaby, tasmansk djevel/pungdjevel, pungrev/possum | quokka, numbat, bandikut, sugar glider/sukkerglider, wallaroo, pungulv/tasmansk tiger, kvoll/quoll | pademelon, bettong, potoroo, pungmus, pungmuldvarp, bilby, dunnart, kuskus, trekenguru, honningpungdyr, pungekorn | monito del monte, yapok/vannopossum, shrew opossum, mulgara, kowari, planigale, antechinus, phascogale, ningaui",
      { nei: "nebbdyr, maurpiggsvin, echidna, kanin, ekorn" },
    ),
    sp(
      "Nevn en videospillkonsoll",
      "PlayStation/PS1, Xbox, Nintendo Switch/Switch, Wii | PlayStation 2/PS2, PlayStation 3/PS3, PlayStation 4/PS4, PlayStation 5/PS5, Xbox 360, Xbox One, Game Boy, Nintendo 64/N64, NES/Nintendo Entertainment System, Super Nintendo/SNES, GameCube, Nintendo DS/DS, Switch 2/Nintendo Switch 2 | Wii U, 3DS/Nintendo 3DS, Game Boy Advance/GBA, Game Boy Color, Xbox Series X/Series X, Xbox Series S/Series S, PSP, PS Vita/PlayStation Vita, Sega Mega Drive/Mega Drive/Sega Genesis, Sega Dreamcast/Dreamcast, Atari 2600, Steam Deck, Commodore 64/C64 | Sega Saturn, Sega Master System/Master System, Game Gear, Atari Jaguar, Atari Lynx, Neo Geo, 3DO, Virtual Boy, ColecoVision, Intellivision, Magnavox Odyssey/Odyssey, Ouya, TurboGrafx-16/PC Engine, Amiga, ZX Spectrum, Atari 7800, N-Gage, Nintendo DSi, Game & Watch | Vectrex, Philips CD-i, Pippin, Nuon, GP2X, Playdate, Evercade, Analogue Pocket, Wonderswan, Neo Geo Pocket",
    ),
    sp(
      "Nevn en hånd i poker",
      "par, fullt hus, royal flush, flush | straight, to par, tress/tre like, fire like | straight flush, høyt kort | | ",
    ),
    sp(
      "Nevn en film av Christopher Nolan eller Quentin Tarantino",
      "Inception, Interstellar, Pulp Fiction, Oppenheimer, The Dark Knight | Kill Bill, Django Unchained, Inglourious Basterds, Memento, Batman Begins, Tenet, Reservoir Dogs, Dunkirk, The Dark Knight Rises, The Prestige | Once Upon a Time in Hollywood, The Hateful Eight, Jackie Brown, Insomnia, Death Proof, Kill Bill Vol. 2 | Following, Grindhouse, Four Rooms, The Odyssey/Odysseen, Doodlebug | ",
      { nei: "Avatar, Titanic, Fight Club, Seven" },
    ),
  ),
]
