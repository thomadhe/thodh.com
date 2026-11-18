import { dag, sp } from "./typer"

// Days 81–85.
export const dager18 = [
  dag(
    sp(
      "Nevn noe som smaker surt",
      "sitron, lime, eddik, sure godterier/surt godteri/sure tunger | grapefrukt/grape, rabarbra, tyttebær, tranebær, surkål, sylteagurk/sure agurker/pickles, yoghurt, kulturmelk/surmelk, kefir, rømme, surdeigsbrød/surdeig, grønne epler/grønt eple, stikkelsbær, rips, solbær, kiwi, sitronsaft, kimchi, kapers, sure drops | ananas, appelsin, blodappelsin, tamarind, sumak, umeboshi, crème fraîche, kombucha, syltede grønnsaker, Warheads, Toxic Waste, engsyre/syre, sitronsyre, eplecidereddik, balsamico, vineddik, pomelo, kumquat, granateple, krekling, multer, sur fløte, surmelkost, kvass, sursild, sauerkraut | gaukesyre, verjus, rakfisk, skyr |",
      { nei: "sukker, honning, sjokolade" },
    ),
    sp(
      "Nevn et land som har konge, dronning eller annen monark i dag",
      "#NO, #SE, #DK, #GB | #NL, #BE, #ES, #JP | #LU, #LI, #MC, #TH, #SA, #MA, #CA, #AU, #NZ, #VA | #JO, #KW, #QA, #BH, #AE, #OM, #BN, #MY, #KH, #BT, #SZ, #LS, #TO, #AD | #JM, #BS, #BZ, #AG, #GD, #KN, #LC, #VC, #PG, #SB, #TV",
      { nei: "Frankrike, Tyskland, Finland, Island, Hellas, Italia, Russland, Barbados, Iran, Nepal, Irland, USA, Østerrike" },
    ),
    sp(
      "Nevn et dyr man kan se på safari i Afrika",
      "løve, elefant, sjiraff/giraff, sebra, neshorn/nesehorn | flodhest, leopard, gepard, bøffel/kafferbøffel, gnu, hyene, krokodille/nilkrokodille, antilope, gaselle, impala, vortesvin, sjimpanse, gorilla, struts, bavian | flamingo, sjakal, afrikansk villhund/villhund, kudu, oryks/oryx/gemsbok, springbukk, elandantilope/eland, topi, gribb, marabustork, sekretærfugl, surikat, mangust, serval, karakal, dikdik, okapi, bongo, vannbukk, sabelantilope, kuantilope/hartebeest, nyala, sitatunga, colobusape/colobus, marekatt/grønnmarkatt, jordsvin, skjelldyr/pangolin, honninggrevling, hornfugl/neshornfugl, perlehøne, kronetrane, pelikan, ibis, fiskeørn | lemur, kamel/dromedar, hulepinnsvin, klippegrevling, aardwolf/jordulv, bonobo, mandrill, galago, fennek, ørkenrev, sjiraffgaselle, Thomsongaselle, Grants gaselle, steenbok, klipspringer, duiker, roanantilope, hvitt neshorn, svart neshorn, skogselefant, savanneelefant, nilvaran, mamba/svart mamba, pytonslange/pyton, kobra |",
      { nei: "tiger, isbjørn, panda, kenguru, jaguar, koala" },
    ),
    sp(
      "Nevn en sang fra en Disney-film",
      "La den gå/Let It Go, Hakuna Matata, Under havet/Under the Sea, Livets sirkel/Circle of Life/The Circle of Life | Vil du bygge en snømann/Do You Want to Build a Snowman, Kjærlighet er en åpen dør/Love Is an Open Door, Inn i det ukjente/Into the Unknown, En helt ny verden/A Whole New World, Can You Feel the Love Tonight, I Just Can't Wait to Be King, Part of Your World, Beauty and the Beast, Be Our Guest, You're Welcome, How Far I'll Go, Vi snakker ikke om Bruno/We Don't Talk About Bruno, Du har en venn i meg/You've Got a Friend in Me, Hei hå/Heigh-Ho, Bare Necessities/The Bare Necessities, Supercalifragilisticexpialidocious | Friend Like Me, Prince Ali, I See the Light, Colors of the Wind, A Spoonful of Sugar, Chim Chim Cher-ee, Someday My Prince Will Come, When You Wish Upon a Star, Bibbidi-Bobbidi-Boo, I Wan'na Be Like You, Go the Distance, Zero to Hero, Reflection, I'll Make a Man Out of You, Be Prepared, Show Yourself, Remember Me, Kiss the Girl, Poor Unfortunate Souls, Belle, Gaston, You'll Be in My Heart, Cruella de Vil, Try Everything, For the First Time in Forever, In Summer, Surface Pressure | Arabian Nights, Out There, God Help the Outcasts, Dos Oruguitas, Oo-De-Lally, Everybody Wants to Be a Cat, Bella Notte, You Can Fly, Once Upon a Dream, Baby Mine, Fixer Upper, We Know the Way, Shiny, Almost There, When Will My Life Begin, Mother Knows Best, This Wish, Feed the Birds, Let's Go Fly a Kite, Step in Time, Strangers Like Me, Two Worlds, Just Around the Riverbend, Honor to Us All, Hellfire, The Bells of Notre Dame, Something There, Les Poissons |",
    ),
    sp(
      "Nevn en type bolig",
      "leilighet, enebolig, hus, hytte | rekkehus, tomannsbolig, villa, blokk/boligblokk, hybel, kollektiv, studentbolig/studenthybel, kjedehus, firemannsbolig, gård/gårdsbruk, småbruk, campingvogn, bobil, husbåt, telt, iglo, lavvo, slott, palass, herregård, penthouse/toppleilighet, sokkelleilighet/kjellerleilighet/sokkel, bygård, terrassehus/terrasseleilighet | landsted, seter/seterbu, gamme, jurt/yurt, loftsleilighet, trehus, tømmerhus/laftehus, minihus/tiny house, omsorgsbolig, internat, sykehjem, hule, trehytte, atriumhus, duplex, kårbolig, rorbu, naust, sommerhus, fritidsbolig, borettslag, sameie, hotell, motell, vandrerhjem, kloster, fyr/fyrstasjon, brakke, skyskraper, høyblokk, tipi, bungalow, chalet | pepperkakehus, fuglekasse, dukkehus, hundehus |",
    ),
    sp(
      "Nevn en norsk stavkirke",
      "Heddal stavkirke/Heddal, Borgund stavkirke/Borgund, Urnes stavkirke/Urnes | Lom stavkirke/Lom, Hopperstad stavkirke/Hopperstad, Kaupanger stavkirke/Kaupanger, Ringebu stavkirke/Ringebu, Gol stavkirke/Gol, Fantoft stavkirke/Fantoft | Torpo, Uvdal, Rollag, Flesberg, Nore, Hedalen, Høyjord, Eidsborg, Hegge, Lomen, Øye, Undredal, Rødven, Kvernes, Garmo, Reinli, Røldal, Haltdalen, Grip | Vang stavkirke/Vang/Wang, Hedared |",
      { nei: "Nidarosdomen, Ishavskatedralen, Domkirken" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du kan finne på en byggeplass",
      "kran/byggekran/tårnkran, gravemaskin/graver, hjelm/vernehjelm, betong | stillas, sement, murstein/teglstein, hammer, spiker, sag, boremaskin/drill/bor, planker/plank/materialer, trelast, betongbil/betongblander, lastebil, dumper, hjullaster, vernesko, refleksvest/vest, snekker, murer, elektriker, rørlegger, bygningsarbeider/anleggsarbeider/arbeidere, ingeniør, brakke/brakkerigg, byggegjerde/gjerde, container, byggtoalett/dokabin/Toi Toi, tegning/byggetegninger, vaterpass/vater, målebånd, tommestokk, trillebår, spade | armeringsjern/armering, forskaling, grus, sand, pukk, isolasjon, gipsplater/gips, takstein, vindu, rør, kabler/kabel, generator, kompressor, spikerpistol, vinkelsliper/flex, skrutrekker, støy, støv, byggeheis/heis, mobilkran, betongpumpe, valse/vals, presenning, hørselvern, arkitekt, byggeleder, kranfører, lift, stige, skilt, sperrebånd | kaffe, matpakke, termos, radio, skruer, lim, fugemasse, sparkel, maling, tau, stropper, pall, kjetting, sveiseapparat, steinsag, hoppetusse, borerigg, peler, spunt |",
    ),
    sp("Nevn et land som grenser til Etiopia", "#KE, #SO, #SD | #ER, #SS | #DJ |  | @naboer:ET", { nei: "Egypt, Uganda, Tanzania, Jemen" }),
    sp(
      "Nevn en fjellkjede",
      "Alpene, Himalaya, Andes/Andesfjellene, Rocky Mountains/Klippefjellene/Rockies | Pyreneene, Kaukasus, Ural/Uralfjellene, Atlasfjellene/Atlas, Karpatene, Appalachene/Appalachian Mountains, Den skandinaviske fjellkjeden/Skandesfjellene/Kjølen, Apenninene, Dolomittene, Sierra Nevada, Lyngsalpene, Sunnmørsalpene | Hindukusj/Hindu Kush, Karakoram, Pamir, Tian Shan, Altai, Zagros, Taurus, Balkanfjellene, Dinariske alper, Vogesene/Vosges, Jura, Tatra, Sudetene, Pindos, Cascade Range/Cascades, Sierra Madre, Alaska Range, Drakensberg, Ruwenzori, Great Dividing Range/Store skillefjell, Sydalpene/Southern Alps, Jotunheimen, Rondane, Dovrefjell, Hurrungane, Romsdalsalpene, Trollheimen | Kunlun, Elburs/Alborz, Ardennene, Kantabriske fjell, Sierra Morena, Grampian, Adirondack, Black Hills, Transantarktiske fjell, Schwarzwald, Harz, Erzgebirge, Rila, Pirin, Brooks Range, Coast Mountains, Simien, Lofotveggen |",
      { nei: "Mount Everest, Galdhøpiggen, Kilimanjaro, Mont Blanc" },
    ),
    sp(
      "Nevn en kjent pirat fra bok, film eller historien",
      "Kaptein Sabeltann/Sabeltann, Jack Sparrow/Kaptein Jack Sparrow, Kaptein Krok/Captain Hook/Kaptein Hook, Svartskjegg/Blackbeard | Long John Silver, Barbossa/Hector Barbossa, Davy Jones, Kaptein Kidd/William Kidd, Henry Morgan/Kaptein Morgan, Anne Bonny, Mary Read, Calico Jack/Jack Rackham, Bartholomew Roberts/Black Bart, Francis Drake, Klaus Störtebeker/Störtebeker, Barbarossa, Luffy/Monkey D. Luffy, Smee/Herr Smee | Grace O'Malley, Ching Shih/Zheng Yi Sao, Edward Low, Samuel Bellamy/Black Sam, Stede Bonnet, Charles Vane, Jean Lafitte, William Dampier, Henry Every/Henry Avery, François l'Olonnais/l'Olonnais, Langemann, Pinky, Kaptein Flint/Flint, Ben Gunn, Billy Bones, Dread Pirate Roberts, Elizabeth Swann, Rackham den røde/Red Rackham, Kaptein Pugwash | Olivier Levasseur, Edward England, Thomas Tew, Benjamin Hornigold, Kaptein Blod/Captain Blood, Gol D. Roger, Zoro, Nami, Sinbad |",
    ),
    sp(
      "Nevn noe som er laget av glass",
      "glass/drikkeglass, vindu/vindusrute/rute, flaske, speil | briller, lyspære, vase, glasskål/glassbolle, syltetøyglass/krukke/konservesglass, akvarium, frontrute, glassdør, drivhus, karaffel, vinglass, klinkekuler/glasskule, julekuler, timeglass, lupe/forstørrelsesglass, linse/linser, ølglass, ovnsform/ildfast form, snøkule | kikkert, mikroskop, termometer, reagensrør, skjerm/mobilskjerm, glassfiber, glasskunst, glassmaleri/kirkevindu, glassperler/perle, lampe/lampeskjerm, prisme, glasstak, glassvegg, glassbord, dusjvegg, glasskoen/glasstøffelen, parfymeflaske, kameralinse, solcellepanel | fiberoptikk, laboratorieglass, kolbe, pipette |",
    ),
    sp(
      "Nevn en by i Østerrike",
      "Wien/Vienna, Salzburg, Innsbruck, Graz | Linz, Kitzbühel, Klagenfurt, Villach, Bregenz, St. Anton/St. Anton am Arlberg/Sankt Anton, Hallstatt, Ischgl, Sölden, Zell am See, Mayrhofen | St. Pölten/Sankt Pölten, Wels, Dornbirn, Steyr, Leoben, Bad Ischl, Lienz, Krems/Krems an der Donau, Baden, Eisenstadt, Feldkirch, Kufstein, Schladming, Bad Gastein, Lech, Seefeld, Saalbach, Obergurgl, Kaprun, Wörgl, Hall in Tirol, Melk, Dürnstein, Gmunden, Wiener Neustadt, Bludenz, Spittal an der Drau, Wolfsberg, Braunau/Braunau am Inn, Mödling, Bad Aussee, Schwaz, Imst, Landeck | Mittersill, Kirchberg, Galtür, Obertauern, Flachau, Bad Hofgastein, Fieberbrunn, Serfaus, Hinterglemm, Alpbach, Kühtai, Neustift, Zürs, Warth, Stuben, Hallein, Bischofshofen, Ramsau, Tulln, Amstetten, Traun, Leonding, Klosterneuburg, Ternitz, Judenburg, Knittelfeld, Kapfenberg |",
      { nei: "München, Zürich, Bratislava, Budapest, Praha" },
    ),
  ),
  dag(
    sp(
      "Nevn noe man kan lage i en wok",
      "nudler/woknudler, kyllingwok/wok med kylling, stekt ris/egg fried rice, grønnsakswok/wokgrønnsaker | pad thai, chow mein, sursøt svin/sursøt kylling/sursøt, biff og brokkoli, kung pao-kylling/kung pao, nasi goreng, mie goreng/mi goreng, yakisoba, lo mein, tofu/tofuwok, reker/scampi, kylling, biff, svinekjøtt, teriyaki/teriyakikylling, cashewkylling/kylling med cashewnøtter, pad kra pao/pad krapow, char kway teow, pad see ew, mapo tofu, japchae, stir-fry | tempura, popcorn, karri/curry, dampet fisk, dumplings, lomo saltado, bulgogi, sopp, pak choi, brokkoli, paprika, sukkererter, bønnespirer, egg, nøtter, peanøtter, sesam, laks, blekksprut, and, lam, tofu med grønnsaker, kimchi-ris, omelett, fritert mat | yakiudon, hokkien mee, kway teow, sambal goreng, bami goreng, gong bao, kjøttdeig, røstede nøtter, pannekaker |",
      { nei: "sushi, pizza, kake, is" },
    ),
    sp(
      "Nevn et land som ligger helt eller delvis i Alpene",
      "#AT, #CH, #IT | #FR, #DE | #SI, #LI | #MC |",
      { nei: "Norge, Spania, Tsjekkia, Ungarn, Slovakia, Kroatia, Andorra" },
    ),
    sp(
      "Nevn noe som smelter",
      "is, snø, smør, sjokolade | iskrem/softis/ispinne, ost, stearinlys/lys, voks, isbre/bre, istapper/istapp, snømann, metall, jern, gull, sølv, bly, tinn, glass, plast, sukker, karamell, marshmallows, lava, fett, kokosfett, smult, havis/polisen, permafrost, snøfnugg | stein, magma, gelé, frost, loddetinn, parafin, asfalt, salt, kobber, aluminium, hjerte, gummi, hårvoks, leppepomade, margarin, honning, sorbet |  |",
    ),
    sp(
      "Nevn en norsk film",
      "Kon-Tiki, Max Manus, Bølgen, Flåklypa Grand Prix | Skjelvet, Trolljegeren, Troll, Elling, Hodejegerne, Verdens verste menneske, Den 12. mann, Kongens nei, Olsenbanden/Olsenbanden jr., Børning, Reprise, Oslo 31. august, Død snø, Insomnia, Buddy, Kautokeino-opprøret, Veiviseren/Pathfinder, Affeksjonsverdi/Sentimental Value, Nordsjøen/The Burning Sea, Narvik, Knerten, Karius og Baktus, Dyrene i Hakkebakkeskogen, Folk og røvere i Kardemomme by, Reisen til julestjernen | Ni liv, Kampen om tungtvannet, Fritt vilt, Villmark, Rovdyr, Lange flate ballær, Tatt av kvinnen, Jeg er Dina, Pelle Politibil, Elias og kongeskipet, Doktor Proktors prompepulver, Ut og stjæle hester, Mannen som elsket Yngve, Hawaii Oslo, Få meg på for faen/Turn Me On Dammit, Thelma, De uskyldige, Kristin Lavransdatter, Drømmer, Kjærlighet, Sex, Kaptein Sabeltann og skatten i Lama Rama, Den store barnedåpen | Mors Elling |",
      { nei: "Skam, Exit, Lilyhammer, Nobel" },
    ),
    sp(
      "Nevn noe du finner i en garasje",
      "bil, sykkel, verktøy, dekk/vinterdekk/sommerdekk | takboks, verktøykasse, arbeidsbenk, snøfreser, gressklipper/plenklipper, snøskuffe/snøspade/snømåke, ski, hageslange, trillebår, maling/malingsspann, motorsykkel, moped, garasjeport/port, motorolje/olje, jekk/donkraft, kompressor, fryser/fryseboks, høytrykksspyler, stige, sparkesykkel, tilhenger/henger, grill, hagemøbler, bensinkanne, startkabler, spylervæske, hylle/hyller | støvsuger, barnevogn, kajakk, båt, lampe, skrutrekker, hammer, sag, drill/boremaskin, spiker, skruer, tau, presenning, julepynt, esker/flyttekasser, søppeldunker/søppel, vaskemaskin, ved, sykkelpumpe, piggdekk, skiboks, akebrett, hjelm, kjelke, rake/rive, spade, rullebrett/skateboard |  |",
    ),
    sp(
      "Nevn en skuespiller som har spilt Batman, Jokeren eller Spider-Man på film",
      "Heath Ledger/Ledger, Christian Bale/Bale, Tom Holland/Holland | Tobey Maguire/Maguire, Andrew Garfield/Garfield, Joaquin Phoenix/Phoenix, Jack Nicholson/Nicholson, Ben Affleck/Affleck, Robert Pattinson/Pattinson, Michael Keaton/Keaton | George Clooney/Clooney, Val Kilmer/Kilmer, Jared Leto/Leto, Adam West | Cesar Romero/Romero, Mark Hamill/Hamill, Kevin Conroy/Conroy, Shameik Moore, Barry Keoghan/Keoghan, Will Arnett/Arnett | Lewis Wilson, Robert Lowery, Zach Galifianakis/Galifianakis, Jake Johnson, Chris Pine, Nicholas Hammond",
      { nei: "Ryan Reynolds, Henry Cavill, Hugh Jackman, Robert Downey Jr." },
    ),
  ),
  dag(
    sp(
      "Nevn en rett fra Midtøsten",
      "hummus, falafel, kebab, shawarma | tabbouleh, baba ganoush, shish kebab/shish taouk, kofta/kofte, pitabrød/pita, fattoush, labneh, mansaf, maqluba, mezze, dolma, baklava, knafeh/kunafa/künefe, halva, kibbeh, manakish/manaqish, shakshuka, ful medames/ful, koshari | döner/döner kebab, msakhan, mujaddara, freekeh, kabsa, mandi, machboos, harees, ghormeh sabzi, fesenjan, tahdig, chelo kabab, joojeh kabab, sabich, jachnun, malawach, bourekas, muhammara, tahini, toum/hvitløksdip, sambusa, lahmacun, mahshi, maamoul, qatayef, dadler | manti, fattah, ouzi, halloumi, ka'ak, zaatar, sfiha, shish barak, kubba, tepsi, dolmeh, kashk e bademjan, mirza ghasemi |",
      { nei: "sushi, pizza, tacos, pad thai, gyros" },
    ),
    sp("Nevn et land som grenser til Nigeria", "#NE, #CM | #BJ, #TD |  |  | @naboer:NG", { nei: "Ghana, Togo, Mali, Sudan" }),
    sp(
      "Nevn et dyr som lever vilt i Asia",
      "tiger, panda/kjempepanda, elefant/asiatisk elefant, orangutang | panserneshorn/neshorn/indisk neshorn, snøleopard/irbis, gibbon, makak/japansk makak/snøape, komodovaran, kongekobra, kobra, pyton, krokodille, rødpanda/kattebjørn, jak/yak, kamel/baktrisk kamel, vannbøffel, påfugl, leopard, brunbjørn, ulv, villsvin, tapir/malaysisk tapir, mangust, pangolin/skjelldyr | sjakal, stripehyene/hyene, gaselle, villhest/Przewalskis hest, saiga/saigaantilope, sobel, amurtiger/sibirsk tiger, amurleopard, asiatisk løve/løve, gaur, banteng, nilgai, sambar, aksishjort, muntjak, spøkelsesdyr/tarsier, lori/slow loris, flyvehund, gavial, saltvannskrokodille, gekko, varan, hornfugl, fasan, mandarinand, trane, kragebjørn, malaybjørn, lappbjørn, reinsdyr, gaupe, rev | isbjørn, elg, mår, ekorn, hare, dhole/rødhund, proboskisape/nesebørape, binturong, solbjørn, hjort, rådyr, sikahjort |",
      { nei: "kenguru, koala, sjiraff, sebra, nebbdyr, flodhest, gorilla, sjimpanse, lemur" },
    ),
    sp(
      "Nevn en musikal",
      "Les Misérables/Les Mis, Mamma Mia, Phantom of the Opera/The Phantom of the Opera/Fantomet i operaen, Løvenes konge/The Lion King, Grease, Cats | Wicked, Hamilton, West Side Story, Chicago, The Sound of Music/Sound of Music, Annie, Oliver, Evita, Jesus Christ Superstar, Rent, Hair, Cabaret, My Fair Lady, The Book of Mormon/Book of Mormon, Matilda, Mary Poppins, Billy Elliot, Fame, Hairspray, Spelemann på taket/Fiddler on the Roof, Little Shop of Horrors, The Rocky Horror Show/Rocky Horror, Starlight Express, Joseph and the Amazing Technicolor Dreamcoat/Joseph, A Chorus Line, Moulin Rouge, Dear Evan Hansen, Kinky Boots, Six, Frost/Frozen, Aladdin, Skjønnheten og udyret/Beauty and the Beast, Chess | Singin' in the Rain, Guys and Dolls, Oklahoma, Kiss Me Kate, Anything Goes, Show Boat, Into the Woods, Sweeney Todd, Company, Dreamgirls, Miss Saigon, Tarzan, Hadestown, Come From Away, Waitress, Jersey Boys, Avenue Q, Spring Awakening, Heathers, Mean Girls, Legally Blonde, Shrek the Musical, Charlie and the Chocolate Factory, Bat Out of Hell, We Will Rock You, Tina, & Juliet, Back to the Future, Elisabeth, Notre-Dame de Paris, Kongen og jeg/The King and I, South Pacific, Hello Dolly | Sunset Boulevard, Follies, Pippin, Godspell, Kristina från Duvemåla |",
    ),
    sp(
      "Nevn noe du kan ha i lommeboka",
      "penger/kontanter, bankkort/kort/betalingskort, førerkort/sertifikat/lappen, ID-kort/legitimasjon | kvittering, sedler/pengesedler, mynter/småpenger, bilde, kredittkort, medlemskort/bonuskort, busskort/reisekort, studentbevis/studentkort, frimerker/frimerke, lapper/lapp, kondom, bibliotekkort, treningskort, gavekort, adgangskort, visittkort, lottokupong/tippekupong, donorkort | nøkkel, pass, plaster, EU-kort/europeisk helsetrygdkort, fiskekort, jaktkort, SIM-kort, blodgiverkort, frikort, valuta, sjekker, kinobillett/billett, handleliste, lykkeamulett, tannpirker, hårstrikk |  |",
    ),
    sp(
      "Nevn en elv utenfor Europa",
      "Nilen, Amazonas/Amazon, Mississippi, Yangtze/Jangtse/Yangtzekiang | Ganges/Ganga, Gule elv/Den gule elv/Huang He, Mekong, Kongo/Kongoelva, Niger/Nigerelva, Missouri, Colorado/Coloradoelva, Rio Grande, Indus, Eufrat, Tigris, Jordan/Jordanelva | St. Lawrence/Saint Lawrence/Sankt Lawrence, Yukon, Mackenzie, Ob, Jenisej/Yenisei, Lena, Amur, Orinoco, Paraná, Zambezi, Limpopo, Okavango, Irrawaddy, Brahmaputra, Murray, Darling, Hudson, Columbia, Ohio, Syr Darja, Amu Darja | Tennessee, Sacramento, Potomac, Arkansas, Snake, Fraser, Nelson, Uruguay/Uruguayelva, Senegal/Senegalelva, Oranje/Orange, Salween, Chao Phraya, Perleelva/Zhujiang, Yamuna, Godavari, Shatt al-Arab, Blå Nil/Den blå Nil, Hvite Nil/Den hvite Nil, Rio de la Plata, Paraguay, Madeira, Rio Negro, Xingu, Tocantins, São Francisco, Magdalena, Ubangi, Kasai, Ogooué, Volta, Juba, Atbara, Irtysj, Kolyma, Indigirka, Angara, Selenga, Ussuri, Han |",
      { nei: "Donau, Rhinen, Volga, Themsen, Seinen, Glomma, Elben, Loire" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du finner på et soverom",
      "seng, dyne, pute, nattbord | garderobe/klesskap/skap, lampe/nattlampe/leselampe, vekkerklokke, gardiner, laken, dynetrekk/sengetøy, putetrekk, sengeteppe/teppe, kommode, speil, klær, tøfler, pysj/pyjamas, nattkjole, madrass, overmadrass, bamse/kosedyr, bøker/bok, mobil/mobillader/lader, TV, skrivebord, stol, gulvteppe, persienner/rullegardin, bokhylle/hylle | knagg, stumtjener/klesstativ, sovemaske, øreplugger, nattlys, vindu, ovn/radiator, plakat, bilde, luftfukter, vifte, køyeseng, babycall, sminkebord, smykkeskrin, klesvask/skittentøy/skittentøykurv, PC, spillkonsoll, vannglass, hodetelefoner, pledd, kosepute | sengegavl, sengekappe, myggnett, himmelseng, vugge, nattpotte, dagbok, puslespill, akvarium |",
    ),
    sp("Nevn et land som begynner på F", "#FR, #FI | #PH | #FJ |  | @start:F", { nei: "Færøyene, Fransk Guyana, Fransk Polynesia" }),
    sp(
      "Nevn en øygruppe",
      "Lofoten, Vesterålen, Svalbard, Færøyene, Kanariøyene, Hawaii | Azorene, Shetland, Orknøyene, Hebridene, Galápagos/Galápagosøyene, Balearene/Baleariske øyer, Kykladene, Maldivene, Seychellene, Madeira, Jomfruøyene, Falklandsøyene, Ålandsøyene/Åland, Hvaler, Zanzibar | Filippinene, Bahamas, Antillene/De store Antillene/De små Antillene, Kapp Verde, Kuriløyene, Aleutene, Salomonøyene, Fiji, Fransk Polynesia/Tahiti, Cookøyene, Franz Josef Land, Kanaløyene, Frisiske øyer/Vadehavsøyene, Dodekanesene, Joniske øyer, Vegaøyan/Vega, Bermuda, Japan, Indonesia, Malta, Molukkene, Marshalløyene | Andamanene, Nikobarene, Tonga, Samoa, Marquesasøyene, Sør-Shetlandsøyene, Novaja Semlja, Scillyøyene, Stockholms skjærgård/skjærgården, Sporadene, Lipariske øyer/Eoliske øyer, Træna, Røst, Froan, Bulandet, Solund, Kvitsøy, Tristan da Cunha, Chagos/Chagosøyene, Kerguelen, Turks- og Caicosøyene, Caymanøyene |",
    ),
    sp(
      "Nevn en rapper eller hiphop-artist",
      "Eminem, Snoop Dogg, Jay-Z, Drake, Karpe/Karpe Diem | Kanye West/Kanye/Ye, 50 Cent, Kendrick Lamar, Tupac/2Pac/Tupac Shakur, Notorious B.I.G./Biggie/Biggie Smalls, Nicki Minaj, Cardi B, Dr. Dre, Lil Wayne, Travis Scott, Ice Cube, Ice-T, Cezinando, Lars Vaular, Arif, Kamelen, Unge Ferrari, Madcon, Erik og Kriss | Post Malone, Missy Elliott, Lauryn Hill, Run-DMC, Beastie Boys, Wu-Tang Clan, Public Enemy, N.W.A, Nas, Lil Nas X, Doja Cat, Megan Thee Stallion, J. Cole, Tyler the Creator, ASAP Rocky/A$AP Rocky, Future, Lil Uzi Vert, Juice WRLD, XXXTentacion, Mac Miller, Logic, Childish Gambino, Busta Rhymes, Flo Rida, Pitbull, Wiz Khalifa, MC Hammer, Vanilla Ice, Coolio, Queen Latifah, Lil Kim, Stormzy, Dave, Skepta, Central Cee, Little Simz, Jaa9 og OnklP/Jaa9 & OnklP, Klovner i Kamp, Tommy Tee, Gatas Parlament, Side Brok, Store P, Hkeem, Musti, Vinni, Don Martin | Will Smith, Eve, Larsiveli, Kaveh, Dutty Dior, Chirag, Magdi, OnklP, Jaa9, Eazy-E, Method Man, Ghostface Killah, Kurtis Blow, Grandmaster Flash, LL Cool J, Common, Mos Def, Outkast, André 3000, Ludacris, Nelly, T.I., Young Thug, Lil Baby, DaBaby, 21 Savage, Metro Boomin, Rick Ross, Pusha T, Cypress Hill, Fugees, Wyclef Jean, The Roots, Black Eyed Peas |",
    ),
    sp(
      "Nevn noe du finner på en lekeplass",
      "huske, sklie/rutsjebane, sandkasse, klatrestativ | vippehuske/dumpehuske/vippe, karusell, klatrevegg, lekehus/lekestue, klatretau/tau, trampoline, fuglereirhuske, taubane/linebane, sandleker, spade, bøtte, benk, barn, foreldre, klatrenett, hengebru/apebro, tunnel, fjærhuske/vippedyr | balansebom, hengekøye, ballbinge, fotballmål, basketkurv, gjerde, søppelbøtte, sand, fallunderlag/gummidekke, sparkesykkel, sykkel, rullebrett, barnevogn, katt, duer, snø, akebakke, lekeapparat, ringer, brannmannsstang, sklie med tunnel |  |",
    ),
    sp(
      "Nevn en organisasjon eller et organ i FN",
      "UNICEF, WHO/Verdens helseorganisasjon, Sikkerhetsrådet/FNs sikkerhetsråd, Generalforsamlingen/FNs generalforsamling, UNESCO | UNHCR/FNs høykommissær for flyktninger, WFP/Verdens matvareprogram, FAO, Den internasjonale domstolen/ICJ, IMF/Det internasjonale pengefondet, Verdensbanken, ILO, IAEA, UNDP, Sekretariatet/FN-sekretariatet, Menneskerettighetsrådet/FNs menneskerettighetsråd | UNEP, UNRWA, UNFPA, ITU, UPU/Verdenspostforeningen, WMO, ICAO, IMO, WIPO, IFAD, UNIDO, UN Women, UNAIDS, OCHA, UNCTAD, ECOSOC/Det økonomiske og sosiale råd, blåhjelmene/FNs fredsbevarende styrker, IPCC/FNs klimapanel | Tilsynsrådet/Hjelpeforvaltningsrådet, OHCHR/Høykommissæren for menneskerettigheter, UNOPS, UN-Habitat, UNODC, UNWTO/FNs turistorganisasjon, UNFCCC, UNU/FN-universitetet |",
      { nei: "NATO, EU, WTO, Røde Kors, OSSE" },
    ),
  ),
]
