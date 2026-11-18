import { dag, sp } from "./typer"

// Days 91–95.
export const dager20 = [
  dag(
    sp(
      "Nevn noe som henger på veggen",
      "bilde, klokke/veggklokke/veggur, speil, maleri/malerier, plakat | hylle/vegghylle, kalender, TV/flatskjerm, lampe/vegglampe, knagg/kleskrok, gardiner/gardin, fotografi/foto/familiebilde, tavle, kart/verdenskart, diplom | lysbryter/bryter, stikkontakt, panelovn/ovn, varmepumpe, røykvarsler/brannalarm, termostat, oppslagstavle, whiteboard, nøkkelskap, kors/krusifiks, bilderamme/ramme, veggteppe, broderi, bonad, gevir/hjortegevir, trofé, medalje, gitar, dartskive, tegning, timeplan, ukeplan, brannslukningsapparat/brannslukker, førstehjelpsskrin, veggtelefon, vifte | gjøkur/kukeklokke, hjortehode, pyntetallerken/platte, krans/dørkrans, barometer, termometer, sverd, skjold, veggskap, radiator, vimpel/vimpler, kjøkkenrull/tørkerullholder, nøkkelbrett | ",
    ),
    sp("Nevn et land som grenser til Botswana", "#ZA | #ZW, #NA | #ZM | | @naboer:BW", { nei: "Angola, Mosambik, Lesotho, Malawi" }),
    sp(
      "Nevn en naturtype eller et landskap",
      "skog, fjell, ørken, regnskog, hav | myr, tundra, savanne, strand, innsjø/sjø, elv, fjord, dal, slette, jungel, isbre/bre, vidde/fjellvidde, steppe, øy | kyst, eng, våtmark, prærie, korallrev, vulkan, kløft/canyon, juv, foss, åker, beitemark, lynghei/kystlynghei, barskog, løvskog, blandingsskog, taiga, mangroveskog/mangrove, sump, elvedelta/delta, lagune, ås, høyfjell, skjærgård, holme, fjære, klippe, platå, oase, sanddyne | kratt, ur/steinur, morene, skjær, tjern, bekk, li/fjellside, karst, hei/fjellhei, lavland, høyland, kystslette, bjørkeskog, fjellbjørkeskog, kulturlandskap, polarørken, innlandsis/iskappe, havis, gressland, sletteland | ",
    ),
    sp(
      "Nevn en superkraft",
      "fly/flyging, usynlighet/bli usynlig, superstyrke/styrke, lese tanker/tankelesing | teleportering/teleportere, tidsreise/reise i tid, superfart/fart, røntgensyn, telekinese, udødelighet, stoppe tiden/kontrollere tiden, formskifting/skifte form, gå gjennom vegger | helbredelse/selvhelbredelse, værkontroll/kontrollere været, kontrollere ild/ildkraft, kontrollere vann, snakke med dyr, puste under vann, laserøyne/laserblikk, krympe, klatre på vegger, edderkoppsans, superhørsel, nattesyn, se fremtiden/framsyn, magnetisme, elektrisitet/lyn, kraftfelt, usårbarhet/uovervinnelighet, telepati, strekke seg/strekkbar kropp | klone seg/kloning, tankekontroll/sinnskontroll, illusjoner, kontrollere metall, kontrollere planter, kontrollere vind, superintelligens, fotografisk hukommelse, kontrollere skygger, superhopp, kontrollere lyd | ",
    ),
    sp(
      "Nevn noe man kildesorterer",
      "papir, plast, glass, matavfall/mat | metall, restavfall, papp, pantflasker/flasker, pantebokser/bokser, batterier, el-avfall/elektronikk/EE-avfall, klær/tekstiler | farlig avfall, hageavfall, kartong/melkekartong, aviser, glass- og metallemballasje, hermetikkbokser, isopor, trevirke/treverk, lyspærer, spraybokser, maling, medisiner, storavfall, skrapmetall/jern, aluminium, bildekk/dekk, sko | kaffekapsler, møbler, mobiltelefoner/mobil, blekkpatron, lysrør, frityrolje/matolje, gips, betong, porselen/keramikk, plastfolie, tetrapak | ",
    ),
    sp(
      "Nevn en oldtidssivilisasjon eller en sivilisasjon fra Amerika før Columbus",
      "egyptere/egypterne/oldtidens Egypt, grekere/grekerne/antikkens Hellas, romere/romerne/Romerriket, maya, inka/inkariket | azteker/aztekerne, persere/perserne/Perserriket, kinesere/det gamle Kina, sumerere/sumererne, babylonere/babylonerne/Babylon, fønikere/fønikerne, vikinger/vikingene | assyrere/assyrerne, hettittene/hettitter, israelitter, keltere/kelterne, etruskere/etruskerne, kartagere/kartagerne/Kartago, minoere/minoerne/minoisk sivilisasjon, mykenere/mykenerne, olmeker/olmekerne, induskulturen/Indusdalen/harappa, germanere, gallere, hunnere, goter, skytere, nubiere/Kush, akkadere, makedonere, spartanere, kanaanitter, filistere, mesopotamiere/Mesopotamia | Aksum, moche, nazca, zapoteker, Teotihuacán, elamitter, lydere, parthere, nabateere, trakere, illyrere, dakere, vandaler, frankere, saksere, piktere, tolteker, chavín | ",
    ),
  ),
  dag(
    sp(
      "Nevn en rett fra Latin-Amerika eller Karibia (ikke meksikansk)",
      "empanadas/empanada, ceviche, feijoada, churrasco | arepa, chimichurri, dulce de leche, asado, pão de queijo, jerk chicken/jerk-kylling, moqueca, brigadeiro, picanha | lomo saltado, ají de gallina, pabellón criollo, ropa vieja, moros y cristianos, tostones, stekt plantain/plátanos fritos, mofongo, cubansk sandwich/cubano, coxinha, acarajé, tres leches, alfajores, choripán, milanesa, locro, sopaipillas, humitas, pupusa, gallo pinto, sancocho, bandeja paisa, ajiaco, anticuchos, causa, papa a la huancaína, rice and peas, ackee and saltfish, curry goat, callaloo, arroz con pollo | vatapá, farofa, açaí, quindim, chipa, sopa paraguaya, salteñas, chivito, matambre, provoleta, pastel de choclo, curanto, cazuela, picarones, casado, cuy, griot, conch fritters, jamaican patty/beef patty, mangú, arroz con gandules, lechón, roti, doubles | ",
      { nei: "taco, burrito, nachos, quesadilla, enchilada, fajitas, guacamole, chili con carne" },
    ),
    sp(
      "Nevn et land som Donau renner gjennom eller langs",
      "#AT, #DE, #HU | #RS, #RO, #SK | #BG, #HR | #UA | #MD",
      { nei: "Tsjekkia, Sveits, Slovenia, Polen, Bosnia-Hercegovina, Italia" },
    ),
    sp(
      "Nevn en oppfinnelse",
      "hjul, lyspære/lyspæren, telefon, internett, fly/flyet | bil/bilen, datamaskin/PC, boktrykkerkunsten/trykkpressen, dampmaskin, radio, TV/fjernsyn, mobiltelefon/mobil/smarttelefon, kompass, krutt, papir, penicillin, vaksine | tog/lokomotiv, sykkel, kamera/fotoapparat, mikroskop, teleskop, termometer, barometer, klokke/ur, vaskemaskin, kjøleskap, mikrobølgeovn, støvsuger, glidelås, binders, telegraf, grammofon/fonograf, transistor, laser, GPS, satellitt, rakett, forbrenningsmotor/motor, dynamitt, plast, briller, skrivemaskin, symaskin, ubåt, helikopter, fallskjerm, heis, rulletrapp, airbag/kollisjonspute, bilbelte/sikkerhetsbelte, sprayboks/aerosolboks, ostehøvel, røntgenapparat/røntgen, pacemaker, kunstig intelligens/KI/AI, World Wide Web/www, e-post, kredittkort, minibank, strekkode, QR-kode, solcellepanel/solcelle, batteri, dynamo | tannbørste, vannklosett/toalett, fyrstikker, betong, glass, skrift/skriftspråk, kalender, plog, vannmølle, vindmølle, seil, kuleramme/abakus, kikkert, pendelur, stetoskop, sprøyte, narkose/anestesi, pasteurisering, hermetikkboks, fyllepenn, kulepenn, blyant, viskelær, teip, post-it, borrelås/velcro, nylon, luftdekk, motorsykkel, traktor, snøscooter, lysdiode/LED, mikrobrikke/mikrochip/integrert krets, harddisk, USB, Bluetooth, wifi, berøringsskjerm/touchskjerm, 3D-printer, drone, robot, elbil | ",
    ),
    sp(
      "Nevn et filmselskap eller filmstudio",
      "Disney/Walt Disney Studios, Pixar, Warner Bros./Warner Brothers/Warner, Universal/Universal Pictures, DreamWorks | Paramount/Paramount Pictures, Sony Pictures, Columbia/Columbia Pictures, 20th Century Fox/20th Century Studios/Fox, MGM/Metro-Goldwyn-Mayer, Lionsgate, Studio Ghibli/Ghibli, Marvel Studios/Marvel, Lucasfilm, Netflix, Nordisk Film | A24, Miramax, New Line Cinema/New Line, Illumination, Blue Sky Studios/Blue Sky, Aardman, Laika, Legendary Pictures/Legendary, Amblin/Amblin Entertainment, Focus Features, Searchlight Pictures/Fox Searchlight, Pathé, Gaumont, Toho, SF Studios/SF/Svensk Filmindustri, Amazon MGM Studios/Amazon Studios, Summit Entertainment, TriStar, Touchstone, Orion Pictures, United Artists, RKO, Hammer Films, Blumhouse, StudioCanal, Constantin Film, Working Title, Ealing Studios, Filmkameratene, Maipo Film, Motlys, Mer Film, Norsk Film, Paradox, Fantefilm, Zentropa | Shaw Brothers, Golden Harvest, Cinecittà, UFA, Babelsberg, Pinewood, Shepperton, Mosfilm, Toei, Kyoto Animation, Madhouse, Weta, Industrial Light & Magic/ILM, Skydance, Bad Robot, Plan B, Annapurna Pictures, Neon, Magnolia Pictures, Castle Rock, Carolco, Village Roadshow, Hanna-Barbera, Rankin/Bass | ",
    ),
    sp(
      "Nevn noe du kan finne på loftet",
      "julepynt, gamle klær/klær, esker/pappesker/flytteesker, koffert, støv | gamle leker/leker, gamle bøker/bøker, fotoalbum/gamle bilder, gamle møbler/møbler, spindelvev/edderkopper, mus, ski, gyngehest, babyklær, isolasjon, takvindu, plastjuletre/juletre, lamper, speil, gamle aviser/aviser, gamle brev/brev, dukke/dukkehus, barneseng/vugge, barnevogn | sovepose, telt, campingutstyr, sportsutstyr, tegneserier/blader, platespiller, LP-plater/plater, symaskin, kiste/skipskiste, bjelker/takbjelker, flaggermus, vepsebol, klessnor/tørkestativ, madrass, sengetøy, dyner, gardiner, bilderammer/ramme, malerier, verktøy, skøyter, akebrett, kjelke | uniform, skolebøker, skolesekk, brudekjole, gammel radio, kassett/kassettspiller, videokassetter/VHS, brettspill/spill, puslespill, hatteesker, rokk, vevstol, skattekiste/skatt, spøkelse, dagbok, pipe/skorstein | ",
    ),
    sp(
      "Nevn en flytype eller flymodell",
      "Boeing 747/747/jumbojet, Airbus A380/A380, Concorde, Boeing 737/737 | Spitfire/Supermarine Spitfire, F-35/F-35 Lightning, F-16, Airbus A320/A320, Boeing 787/787/Dreamliner, Cessna, Hercules/C-130/C-130 Hercules, Boeing 777/777, Airbus A350/A350, Airbus A330/A330, Wright Flyer | Boeing 757/757, Boeing 767/767, Dash 8/Q400, Messerschmitt/Messerschmitt Bf 109, B-2/B-2 Spirit, F-22/Raptor, Eurofighter/Typhoon, Gripen/JAS 39 Gripen, MiG-21, MiG-29, P-3 Orion/Orion, Boeing 737 MAX/737 MAX, Airbus A321, Airbus A319, Airbus A220, Boeing 707, Boeing 727, DC-3/Douglas DC-3, DC-9, Fokker 50, Fokker 100, ATR 72, Twin Otter, Antonov An-225/An-225/Mrija, SR-71/Blackbird, Ju 52/Junkers Ju 52, P-51 Mustang/Mustang, Lancaster, B-17/Flying Fortress, B-52, F-15, F/A-18/F-18/Hornet, F-14/Tomcat, F-5, Harrier, Tornado, Mirage, Rafale, Zero/Mitsubishi Zero, Stuka, Piper Cub, Hurricane/Hawker Hurricane | Spirit of St. Louis, Tu-144/Tupolev Tu-144, Beluga/Airbus Beluga, Dreamlifter, Lockheed Constellation, de Havilland Comet/Comet, Sopwith Camel, Embraer E190, CRJ900, Catalina, Sea Gladiator | ",
    ),
  ),
  dag(
    sp(
      "Nevn en type vin",
      "rødvin, hvitvin, rosévin/rosé, musserende vin/musserende, champagne | prosecco, cava, portvin/port, dessertvin, sherry, gløgg/glühwein, sangria, hetvin, madeira, marsala, oransjevin/orange wine, naturvin, alkoholfri vin, boksvin/kartongvin, fruktvin, eplevin, søtvin | crémant, spumante, sekt, lambrusco, Chianti, Rioja, Bordeaux, Bourgogne, Beaujolais/Beaujolais Nouveau, Barolo, Amarone, Chablis, Sauternes, Tokaji, vermut/vermouth, sake/risvin, mjød, nattverdsvin/kirkevin, vinho verde, retsina, Valpolicella, Brunello, Châteauneuf-du-Pape, isvin/Eiswein | Côtes du Rhône, Asti, Soave, Ripasso, Douro, Priorat, Ribera del Duero, Médoc, Saint-Émilion, Pomerol, Sancerre, Pouilly-Fumé, Muscadet, Alsace, Mosel, Barbaresco | ",
      { nei: "øl, cider, vodka, saft" },
    ),
    sp("Nevn et land som grenser til Zimbabwe", "#ZA | #BW, #ZM, #MZ | | | @naboer:ZW", { nei: "Namibia, Malawi, Angola, Tanzania" }),
    sp(
      "Nevn noe du kan finne på stranden eller i fjæra",
      "skjell, sand, steiner/stein, tang, krabbe, manet | blåskjell, sjøstjerne, tare, strandkrabbe, rekved/drivved, måker/måke, rur, strandsnegl/snegl, søppel/plast/plastsøppel, sjøglass/glassbiter, sandslott, bølger, håndkle, parasoll, badeball, spade, bøtte, solkrem | albuskjell, kamskjell, østers, hjerteskjell, kråkebolle, tangloppe, fjæremark/sandorm, flaskepost/flaske, tau, fiskegarn/garn, fjærepytt/strandpytt, brennmanet, glassmanet, ålegras, tjeld, sandløper, strandsnipe, ærfugl, skarv, gråhegre/hegre, sel, solseng, livredder/badevakt, badegjester | rav, fossiler, sneglehus, sanddyne, strandrug, strandkål, o-skjell, sandskjell, knivskjell, sjøpølse | ",
    ),
    sp(
      "Nevn en animert TV-serie",
      "The Simpsons/Simpsons, SpongeBob/Svampebob/SpongeBob SquarePants, Familien Flintstone/The Flintstones/Flintstones, Tom og Jerry/Tom and Jerry, Family Guy | South Park, Futurama, Peppa Gris/Peppa Pig/Gurli Gris, Paw Patrol, Scooby-Doo, Pokémon, Bluey, Rick and Morty, American Dad, Bob's Burgers, Gravity Falls, Phineas og Ferb/Phineas and Ferb, Avatar: The Last Airbender/Avatar, Dragon Ball/Dragon Ball Z, Naruto, One Piece, Sailor Moon, Mummitrollet/Mumitrollet, Barbapapa, Smurfene, Postmann Pat, Brannmann Sam, Thomas og vennene hans/Thomas the Tank Engine, Byggmester Bob/Bob the Builder | DuckTales, Darkwing Duck, Tiny Toons, Animaniacs, Pinky og Hjernen/Pinky and the Brain, Looney Tunes, Den rosa panteren/Pink Panther, Garfield, He-Man, Transformers, Teenage Mutant Ninja Turtles/Ninja Turtles/Turtles, Batman: The Animated Series, X-Men, Arcane, BoJack Horseman, Archer, King of the Hill, Beavis and Butt-Head, Daria, Dexters laboratorium/Dexter's Laboratory, Powerpuff Girls/Powerpuff-jentene, Johnny Bravo, Ed Edd n Eddy, Ben 10, Adventure Time, Regular Show, Steven Universe, Gumball/The Amazing World of Gumball, Kim Possible, Totally Spies, Winx Club, Miraculous, Pingu, Sauen Shaun/Shaun the Sheep, Masha og bjørnen/Masha and the Bear, Ninjago, PJ Masks/Pysjheltene, Dora utforskeren/Dora, Albert Åberg, Pettson og Findus, Rugrats, Hey Arnold!, Familien Jetson/The Jetsons, Alvin og gjengen/Alvin and the Chipmunks, Inspektør Gadget/Inspector Gadget, Digimon, Yu-Gi-Oh!, Beyblade, Doraemon | Attack on Titan, Death Note, Demon Slayer, Jujutsu Kaisen, My Hero Academia, Fullmetal Alchemist, Cowboy Bebop, Neon Genesis Evangelion, Detective Conan, Hey Duggee, Octonauts, Cocomelon, Danny Phantom, Jimmy Neutron, The Loud House, Fairly OddParents, CatDog, Big Mouth, Invincible, Harley Quinn, Courage the Cowardly Dog, Kaptein Planet, Pelle Politibil | ",
    ),
    sp(
      "Nevn en type veske eller bag",
      "ryggsekk/sekk, håndveske/veske, skolesekk/ransel, koffert, sportsbag/treningsbag/bag | handlepose/bærepose/handlenett, skulderveske, toalettveske/toalettmappe, clutch, rumpetaske/magebelte/fanny pack/bumbag/hoftesekk, PC-veske/laptopveske, kabinkoffert/trillekoffert, tursekk, gympose/gymbag, tøynett/tøypose/tote bag, kamerabag, stellebag/stelleveske, kjølebag | dokumentmappe/aktmappe/attachéveske, messenger bag/postmannsveske, crossbody-veske/crossbody, weekendbag, duffelbag, sjøsekk, sykkelveske, golfbag, skibag, shoppingbag/shopper, sminkeveske/sminkepung/kosmetikkveske | legeveske, pung, nettveske, beltetaske, bøttebag, saddlebag | ",
    ),
    sp(
      "Nevn en region i Italia",
      "Toscana, Sicilia, Sardinia, Lombardia | Veneto, Piemonte, Lazio, Kampania/Campania, Puglia/Apulia, Liguria, Calabria | Emilia-Romagna, Umbria, Trentino-Alto Adige/Trentino-Sør-Tirol/Sør-Tirol/Trentino, Friuli-Venezia Giulia/Friuli, Marche, Abruzzo, Valle d'Aosta/Aostadalen | Basilicata, Molise | ",
      { nei: "Korsika, Malta, San Marino" },
    ),
  ),
  dag(
    sp(
      "Nevn noe som kan fly",
      "fugl/fugler, fly/flyet, helikopter, flaggermus | luftballong/ballong/varmluftsballong, drone, insekter/insekt, sommerfugl, bie, flue, mygg, rakett, papirdrage, seilfly, papirfly, luftskip/zeppeliner, paraglider, hangglider, jagerfly, passasjerfly | ørn, måke, kråke, due, papegøye, ugle, and, gås, svane, kolibri, humle, veps, øyenstikker, marihøne, møll, gresshoppe, romskip/romferje, drage, heks, Superman/Supermann, Peter Pan, julenissen | UFO/flygende tallerken, engel/engler, flygeekorn, flygefisk, frisbee, fallskjerm, Iron Man | Pegasus, Dumbo, Tingeling, feer",
    ),
    sp(
      "Nevn en by i Japan",
      "Tokyo/Tokio, Osaka, Kyoto, Hiroshima | Nagasaki, Sapporo, Yokohama, Kobe, Nagoya, Nara, Fukuoka | Sendai, Kawasaki, Naha, Kanazawa, Niigata, Hakodate, Nagano, Kagoshima, Kumamoto, Okayama, Kitakyushu, Chiba, Saitama, Nikko, Kamakura, Fukushima, Himeji, Hamamatsu, Shizuoka | Matsuyama, Takamatsu, Aomori, Akita, Morioka, Yamagata, Utsunomiya, Gifu, Wakayama, Kochi, Tottori, Matsue, Miyazaki, Oita, Saga, Toyama, Fukui, Otaru, Asahikawa, Kushiro, Obihiro, Takayama, Kurashiki, Ise, Beppu, Sakai, Hakone | ",
      { nei: "Seoul, Beijing, Shanghai, Bangkok, Okinawa, Busan" },
    ),
    sp(
      "Nevn et giftig dyr",
      "hoggorm, kobra, klapperslange, skorpion, edderkopp | svart enke, taipan, mamba/svart mamba, brennmanet, manet, pilgiftfrosk/giftfrosk, kubemanet/boksmanet/sjøveps, kulefisk/pufferfisk/fugu, veps, bie, fjesing | kjeglesnegl, blåringet blekksprut, steinfisk, nebbdyr, korallslange, gilaøgle, komodovaran, havslange/sjøslange, eneboerspinner/brun eneboer, traktedderkopp, vandreedderkopp, skolopender/tusenbein, agapadde/padde, piggrokke, kongekobra, spyttekobra, puffadder, løvefisk | ildsalamander/salamander, tarantell, sandhoggorm, gabonhoggorm, boomslang, tigerslange, sjøanemone, kulemaur | ",
      { nei: "løve, hai, krokodille, isbjørn, ulv, tiger" },
    ),
    sp(
      "Nevn en figur fra Alice i Eventyrland",
      "Alice, Hattemakeren/Den gale hattemakeren/Mad Hatter, Hjerterdronningen/Queen of Hearts, Den hvite kaninen/Hvite kanin/White Rabbit, Filurkatten/Cheshirekatten/Cheshire Cat | Marsharen/March Hare, Syvsoveren/Hasselmusen/Dormouse, Kålormen/Larven/Caterpillar, Tweedledum, Tweedledee, Hjerterkongen/King of Hearts, Hjerterknekten/Knave of Hearts | Dodoen/Dodo, Hertuginnen/The Duchess, Forloren skilpadde/Den forlorne skilpadden/Mock Turtle, Griffen/Gryphon, Dina, Øgla Bill/Bill, Humpty Dumpty, Den røde dronningen/Red Queen, Den hvite dronningen/White Queen, Jabberwocky | Den hvite ridderen/White Knight, Kokka/The Cook | ",
    ),
    sp(
      "Nevn en frisyre",
      "hestehale, flette, dutt/knute/topknute, lugg/pannelugg, pagehår/page | snauklipp/barbert, krøller, bob, mohawk/hanekam, dreadlocks/dreads, afro, musefletter, fiskebeinsflette, fransk flette, permanent/perm, midtskill, sideskill, undercut, fade, maskinklipp/buzz cut, pixie, hockeysveis/mullet, oppsatt hår/oppsett, sleik/sleikesveis | glattet hår, beach waves/bølger, quiff, pompadour, crew cut, cornrows, skinhead, flattop, chignon, halvt oppsatt, piggsveis/spikes, emo, lang lugg, potteklipp/bowl cut, skin fade, man bun, kronefletter, vannfallsflette, bokserfletter, korketrekkerkrøller, lagdelt | skallet/blank, tupé | ",
    ),
    sp(
      "Nevn en by i Sveits",
      "Zürich, Genève/Genf/Geneva, Basel, Bern | Lausanne, Luzern/Lucerne, Lugano, St. Moritz/Sankt Moritz, Zermatt, Davos, Interlaken, Montreux | St. Gallen, Winterthur, Locarno, Biel/Bienne, Thun, Fribourg, Neuchâtel, Sion, Chur, Schaffhausen, Grindelwald, Verbier, Crans-Montana, Gstaad, Engelberg, Zug, Arosa, Wengen, Lauterbrunnen, Vevey | Aarau, Solothurn, Bellinzona, Baden, Olten, Rapperswil, Ascona, Saas-Fee, Adelboden, Laax, Andermatt, Klosters, Mürren, Brig, Martigny, Yverdon-les-Bains/Yverdon, Nyon, La Chaux-de-Fonds, Einsiedeln, Appenzell, Herisau, Liestal, Frauenfeld, Glarus, Altdorf, Schwyz, Sarnen, Stans, Delémont, Wil, Uster, Kreuzlingen, Spiez, Brienz, Pontresina, Lenzerheide, Champéry | ",
      { nei: "Wien, Innsbruck, Salzburg, Vaduz, München, Milano, Liechtenstein" },
    ),
  ),
  dag(
    sp(
      "Nevn noe man kan blåse opp",
      "ballong/ballonger, luftmadrass/luftseng, badering, badeball/strandball | dekk/sykkeldekk/bildekk/sykkelslange, ball/fotball/basketball/volleyball, hoppeslott, badedyr/oppblåsbart dyr, gummibåt/badebåt, oppblåsbart basseng/basseng/plaskebasseng, nakkepute/reisepute, armringer/svømmevinger | redningsvest, padlebrett/SUP, bobletyggis/tyggegummi, papirpose/pose, gummihanske/hansker, kollisjonspute/airbag, redningsflåte/flåte, oppblåsbar kajakk | oppblåsbart telt, oppblåsbar sofa, oppblåsbar nisse, kinn, kulefisk/pufferfisk | ",
    ),
    sp("Nevn et land som grenser til Uganda", "#KE, #TZ | #CD, #RW | #SS | | @naboer:UG", { nei: "Etiopia, Burundi, Somalia, Sudan" }),
    sp(
      "Nevn et dyr som lever i trær",
      "ekorn, ape/aper, koala, dovendyr, fugl/fugler | orangutang, lemur, ugle, spett/hakkespett, flygeekorn, løvfrosk/trefrosk, gibbon, kameleon, leopard, rød panda/kattebjørn, mår, gekko, larver | treslange, grønn mamba, opossum/pungrotte, trekenguru, sukkerglider, kinkajou, spøkelsesdyr/tarsier, sjimpanse, jaguar, ozelot, margay, papegøye, tukan, flaggermus, kolugo/flygende lemur, leguan/grønn leguan, binturong, lori, galago, hasselmus, skjære, kråke, kattugle, svartspett | pungrev, klatremus, maur, edderkopp, trebille | ",
    ),
    sp(
      "Nevn en figur fra Peter Pan",
      "Peter Pan, Kaptein Krok/Captain Hook/Krok, Tingeling/Tinker Bell, Wendy/Wendy Darling | Smee/Mr. Smee/Herr Smee, Krokodillen/Tick-Tock, John/John Darling, Michael/Mikkel/Michael Darling, Nana, De fortapte guttene/Lost Boys, Tiger Lily/Tigerlilje | Mrs. Darling/Fru Darling, Mr. Darling/Herr Darling, havfruene/havfruer | Tootles, Slightly, Nibs, Starkey | ",
    ),
    sp(
      "Nevn et smykke",
      "ring, halskjede/kjede, øredobber/øreringer/ørepynt, armbånd | anheng, brosje, sølje, piercing, nesering, tåring, ankelkjede/ankelarmbånd, forlovelsesring, giftering/vielsesring, perlekjede, medaljong, mansjettknapper | tiara/diadem/krone, slipsnål, choker, signetring, kors/korskjede, charms/charmsarmbånd, vennskapsarmbånd, øreclips/øreklips, bunadssølv, brudesølje, navlepiercing, amulett, hårsmykke, klokke/armbåndsur | lommeur, brillekjede, talisman, rosenkrans, beltespenne, hodesmykke | ",
    ),
    sp(
      "Nevn en av de sju dvergene i Snøhvit",
      "Brille/Doc/Kloker, Gretten/Grumpy/Butter/Gnavpot, Lystig/Happy/Glader, Søvnig/Sleepy/Trötter | Blyger/Bashful/Flovmand, Prosit/Sneezy, Minsten/Dopey/Toker/Dumpe | | | ",
      { nei: "Snøhvit, Pinocchio, Dumbo" },
    ),
  ),
]
