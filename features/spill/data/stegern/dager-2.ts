import { dag, sp } from "./typer"

// Days 6–10.
export const dager2 = [
  dag(
    sp(
      "Nevn en type pasta",
      "spagetti/spaghetti, lasagne, makaroni, penne | tagliatelle, fusilli/skruepasta, ravioli, tortellini, farfalle/sløyfepasta, linguine, fettuccine | rigatoni, cannelloni, gnocchi, orzo, conchiglie/skjellpasta, pappardelle, tortiglioni, vermicelli, tagliolini | orecchiette, bucatini, ziti, cavatappi, campanelle, gemelli, radiatori, ditalini, stelline, capellini/englehår, paccheri, strozzapreti, trofie, mafalde, agnolotti, cappelletti, spaghettini | casarecce, garganelli, lumaconi, anelli, mezzelune, culurgiones, pici, bigoli, corzetti, fregola, malloreddus, cavatelli, maltagliati, testaroli",
    ),
    sp("Nevn et land som grenser til Frankrike", "#DE, #ES, #IT | #BE, #CH | #LU, #AD | #MC | #BR, #SR, @naboer:FR"),
    sp(
      "Nevn et insekt",
      "maur, bie, flue, mygg | veps, sommerfugl, marihøne, gresshoppe, humle, kakerlakk | øyenstikker/gullsmed, bille, siriss, møll, lus, loppe, termitt, knott, klegg, tege | bladlus, sølvkre, oldenborre, tordivel/skarnbasse/møkkbille, hjortebille, vannkalv, stankelbein, sviknott, kålsommerfugl, påfuglsommerfugl, kneler/knelere, vandrende pinne/pinneinsekt, sikade| vårflue, døgnflue, steinflue, kamelhalsflue, skorpionflue, sankthansorm/lysbille, sagveps, gallveps, snutebille, barkbille, granbarkbille, bombarderbille, maurløve, gulløye, nattsvermer",
      { nei: "edderkopp, flått, skorpion, tusenbein, skolopender, midd, meitemark, snegle" },
    ),
    sp(
      "Nevn en Disney-prinsesse",
      "Askepott/Cinderella, Snøhvit/Snehvit, Ariel, Elsa | Rapunzel/Rapunsel, Belle, Tornerose/Aurora, Jasmin/Jasmine, Anna | Pocahontas, Mulan, Tiana, Vaiana/Moana | Merida, Raya | Kida, Vanellope, Eilonwy",
    ),
    sp("Nevn en sjakkbrikke", "konge, dronning/dame | tårn, hest/springer | bonde, løper | | ", { nei: "ridder, biskop, slott" }),
    sp(
      "Nevn et stjernebilde",
      "Orion, Store bjørn/Ursa Major/Karlsvogna, Kassiopeia/Cassiopeia | Lille bjørn/Ursa Minor, Sydkorset/Crux, Skorpionen/Scorpius, Løven/Leo, Tvillingene/Gemini | Væren/Aries, Tyren/Taurus, Krepsen/Cancer, Jomfruen/Virgo, Vekten/Libra, Skytten/Sagittarius, Steinbukken/Capricornus, Vannmannen/Aquarius, Fiskene/Pisces, Svanen/Cygnus, Pegasus, Andromeda, Dragen/Draco | Lyren/Lyra, Ørnen/Aquila, Perseus, Kusken/Auriga, Store hund/Canis Major, Lille hund/Canis Minor, Hydra/Vannslangen, Kefeus/Cepheus, Herkules/Hercules, Bjørnevokteren/Bootes, Delfinen/Delphinus, Haren/Lepus, Kentauren/Centaurus, Føniks/Phoenix, Nordlige krone/Corona Borealis, Slangebæreren/Ophiuchus | Sørlige krone/Corona Australis, Slangen/Serpens, Giraffen/Camelopardalis, Gaupen/Lynx, Enhjørningen/Monoceros, Duen/Columba, Kjølen/Carina, Seilet/Vela, Akterstavnen/Puppis, Tukanen/Tucana, Påfuglen/Pavo, Ulven/Lupus, Alteret/Ara, Berenikes hår/Coma Berenices, Jakthundene/Canes Venatici, Lille løve/Leo Minor, Trekanten/Triangulum, Hvalen/Cetus, Eridanus, Sørlige fisk/Piscis Austrinus, Tranen/Grus, Ravnen/Corvus, Begeret/Crater, Sekstanten/Sextans, Øglen/Lacerta, Reven/Vulpecula, Pilen/Sagitta, Lille hest/Equuleus, Skjoldet/Scutum, Ovnen/Fornax, Billedhuggeren/Sculptor, Teleskopet/Telescopium, Mikroskopet/Microscopium, Oktanten/Octans, Pendeluret/Horologium, Nettet/Reticulum, Pumpen/Antlia, Kompasset/Pyxis, Passeren/Circinus, Vinkelhaken/Norma, Sørlige trekant/Triangulum Australe, Malerstaffeliet/Pictor, Gravstikken/Caelum, Sverdfisken/Dorado, Flygefisken/Volans, Kameleonen/Chamaeleon, Paradisfuglen/Apus, Indianeren/Indus, Bordfjellet/Mensa, Hydrus",
    ),
  ),
  dag(
    sp(
      "Nevn et kjøkkenredskap",
      "kniv, visp, stekespade, sleiv | ostehøvel, rivjern, kjevle, skrellekniv/potetskreller, øse, slikkepott, sil/dørslag, saks | hvitløkspresse, tang/grilltang, målebeger, kjøkkenvekt, eggedeler, hullsleiv, pizzahjul/pizzakutter, boksåpner, korketrekker, flaskeåpner, skjærefjøl/skjærebrett, kakespade, potetstapper, trakt, pensel/bakepensel | sitronpresse, salatslynge, morter, mandolin, rasp, kokkekniv, brødkniv, filetkniv, slipestål/knivslipe, sprøytepose, deigskrape, pastamaskin, eggeklokke, steketermometer, isskje, pepperkvern, kaffekvern, krumkakejern, vaffeljern, lefsepinne, mikser/stavmikser, blender | lefsetakke, sukkerbrødform, kransekakeform, kakering, smørkniv, grapefruktkniv, eplekjernefjerner, kirsebærsteiner, ostekniv, trøffelhøvel, sushimatte, chinois, mikroplan, spirulizer/spiralkutter, kjøttbanker, kjøttkvern, pølsehorn, fiskepinsett, sjalottkniv",
    ),
    sp(
      "Nevn et land i Europa",
      "#NO, #SE, #DK, #DE, #FR | #FI, #IS, #ES, #IT, #GB, #NL, #PL | #BE, #AT, #CH, #PT, #GR, #IE, #UA, #RU, #CZ, #HU | #HR, #RS, #RO, #BG, #EE, #LV, #LT, #SK, #SI, #LU, #BY | @kontinent:Europa, #TR, #CY, #GE, #KZ, #AZ, #AM",
    ),
    sp(
      "Nevn en slange",
      "kobra, pyton/pytonslange, hoggorm, anakonda | klapperslange, mamba/svart mamba, boa/kvelerslange, buorm/snok, kongekobra | taipan, slettsnok, korallslange, sjøslange, kornslange, kongeslange, melkeslange, grønn mamba | puffotter, gabonhoggorm, hornhoggorm, sandhoggorm, boomslang, tigerslange, brunslange, regnbueboa, tigerpyton, nettpyton, kongepyton, vannmokasin, kobberhode, lansehoggorm | blindslange, sandboa, eskulapsnok, ringsnok, piskeslange, perlehoggorm, buskmester, rinkhals, krait, spyttkobra, eggeteter, trelevende pyton, grønn trepyton",
      { nei: "stålorm, ål, mark, meitemark" },
    ),
    sp(
      "Nevn en ABBA-låt",
      "Dancing Queen, Mamma Mia, Waterloo, Super Trouper | Gimme Gimme Gimme/Gimme! Gimme! Gimme!, Take a Chance on Me, The Winner Takes It All, Money Money Money, Fernando, SOS, Chiquitita, Thank You for the Music | Knowing Me Knowing You, Voulez-Vous, I Have a Dream, Lay All Your Love on Me, Does Your Mother Know, Summer Night City, Ring Ring, Honey Honey, The Name of the Game, One of Us, Happy New Year | Eagle, Angeleyes, Head over Heels, I Do I Do I Do I Do I Do, Hasta Mañana, Slipping Through My Fingers, Our Last Summer, Andante Andante, The Day Before You Came, I Still Have Faith in You, Don't Shut Me Down, When I Kissed the Teacher | Under Attack, Kisses of Fire, Rock Me, Hole in Your Soul, Dum Dum Diddle, Two for the Price of One, Lovelight, Cassandra, Tiger, Bang-A-Boomerang, Hey Hey Helen, People Need Love, Nina Pretty Ballerina, Move On, Little Things, Just a Notion",
    ),
    sp(
      "Nevn et skuespill av Henrik Ibsen",
      "Et dukkehjem, Peer Gynt | Gengangere, Vildanden/Villanden, Hedda Gabler, En folkefiende | Fruen fra havet, Brand, Byggmester Solness, Rosmersholm | Kejser og Galilæer/Keiser og galileer, Lille Eyolf, John Gabriel Borkman, Når vi døde vågner, Samfundets støtter/Samfunnets støtter, De unges forbund, Kongs-emnerne/Kongsemnene, Fru Inger til Østeraad/Fru Inger til Østråt, Gildet paa Solhaug/Gildet på Solhaug, Hærmændene paa Helgeland/Hærmennene på Helgeland, Kjærlighedens komedie/Kjærlighetens komedie | Catilina, Kjæmpehøien/Kjempehaugen, Olaf Liljekrans, Sancthansnatten/Sankthansnatten, Norma",
    ),
    sp(
      "Nevn en bok i Bibelen",
      "1. Mosebok/Første Mosebok/1 Mosebok/Mosebok/Genesis, Matteus/Matteusevangeliet, Markus/Markusevangeliet, Lukas/Lukasevangeliet, Johannes/Johannesevangeliet | 2. Mosebok/Andre Mosebok/2 Mosebok/Exodus, Salmenes bok/Salmene, Åpenbaringen/Johannes' åpenbaring/Johannes åpenbaring, Apostlenes gjerninger, Job, Jona | Ordspråkene/Salomos ordspråk, Romerbrevet/Romerne, Daniel, Jesaja, Ester, Rut, Josva, Dommerne, Forkynneren, Høysangen, 1. Korinterbrev/Første Korinterbrev/Korinterbrevet/1 Korinterbrev, Jeremia, Esekiel | 3. Mosebok/Tredje Mosebok/3 Mosebok/Leviticus, 4. Mosebok/Fjerde Mosebok/4 Mosebok/Numeri, 5. Mosebok/Femte Mosebok/5 Mosebok/Deuteronomium, 1. Samuelsbok/Første Samuelsbok/1 Samuelsbok/Samuelsboka, 2. Samuelsbok/Andre Samuelsbok/2 Samuelsbok, 1. Kongebok/Første Kongebok/1 Kongebok/Kongeboka, 2. Kongebok/Andre Kongebok/2 Kongebok, 2. Korinterbrev/Andre Korinterbrev/2 Korinterbrev, Galaterbrevet/Galaterne, Efeserbrevet/Efeserne, Hebreerbrevet/Hebreerne, Jakobs brev/Jakob, Klagesangene, Esra, Nehemja, Hosea, Amos, Mika | 1. Krønikebok/Første Krønikebok/1 Krønikebok/Krønikeboka, 2. Krønikebok/Andre Krønikebok/2 Krønikebok, Filipperbrevet/Filipperne, Kolosserbrevet/Kolosserne, 1. Tessalonikerbrev/Første Tessalonikerbrev/1 Tessalonikerbrev/Tessalonikerbrevet, 2. Tessalonikerbrev/Andre Tessalonikerbrev/2 Tessalonikerbrev, 1. Timoteusbrev/Første Timoteusbrev/1 Timoteusbrev/Timoteusbrevet, 2. Timoteusbrev/Andre Timoteusbrev/2 Timoteusbrev, Titusbrevet/Titus, Filemonbrevet/Filemon, 1. Petersbrev/Første Petersbrev/1 Petersbrev/Petersbrevet/Peters brev, 2. Petersbrev/Andre Petersbrev/2 Petersbrev, 1. Johannesbrev/Første Johannesbrev/1 Johannesbrev/Johannesbrevet/Johannes' brev, 2. Johannesbrev/Andre Johannesbrev/2 Johannesbrev, 3. Johannesbrev/Tredje Johannesbrev/3 Johannesbrev, Judasbrevet/Judas brev/Judas, Joel, Obadja, Nahum, Habakkuk, Sefanja, Haggai, Sakarja, Malaki",
    ),
  ),
  dag(
    sp(
      "Nevn en type brød eller bakst",
      "loff, rundstykke/rundstykker, baguett/baguette, croissant | kneippbrød/kneipp, grovbrød, ciabatta, focaccia, lefse, flatbrød, knekkebrød, pitabrød/pita, nanbrød/naan, kanelbolle/kanelsnurr, bolle/boller | rugbrød, surdeigsbrød/surdeig, bagel, tortilla, polarbrød, skolebolle, wienerbrød, horn, brioche, hamburgerbrød, pølsebrød, toastbrød, fullkornsbrød, havrebrød, speltbrød | chapati, pumpernickel, challah, lompe, rosinbolle, kringle, skillingsbolle, kardemommebolle, julekake, pain au chocolat, scones, muffins, pretzel, grissini, kavring | injera, arepa, roti, paratha, lavash, pão de queijo, bao, pupusa, barbari, sangak, matzah/matzo, tunnbröd/tynnbrød, krotekake, hveteleiv, havreleiv, potetkake",
    ),
    sp("Nevn en hovedstad i Europa", "$NO, $SE, $DK, $GB, $FR, $DE | $FI, $IS, $ES, $IT, $NL, $BE, $AT, $PL, $GR, $PT, $IE, $CZ | $HU, $CH, $RU, $UA, $HR, $RS, $RO, $BG, $EE, $LV, $LT, $SK, $SI, $LU | @hovedstad:Europa | $AD, $MC, $SM, $VA, $LI, $MT, $MD, $ME, $MK, $AL, $BA, $XK, $BY"),
    sp(
      "Nevn et dyr som lever i havet",
      "hval, hai, delfin, blekksprut, sel | manet, krabbe, hummer, reke, sjøstjerne, havskilpadde/skilpadde, spekkhogger, fisk, torsk, makrell, sild | hvalross, sjøløve, kråkebolle/sjøpinnsvin, blåskjell/skjell, østers, sjøpølse, sjøhest, rokke, ål, kveite, tunfisk, sardin, nise, narhval, blåhval, knølhval, kaskelott/spermhval, hvithval/beluga, krill, laks | sjøanemone/anemone, kongekrabbe, snøkrabbe, breiflabb, klovnefisk, barrakuda, sverdfisk, marlin, seilfisk, hammerhai, hvithai, hvalhai, brugde, sjøku/manat, dugong, havoter/sjøoter, pingvin, korall/koraller, steinbit, rognkjeks | kalmar, akkar, sepia, nautilus, sjøsnegl/havsnegl, sjøpung, svamp, rur, eremittkreps/eremittkrabbe, kamskjell, hjerteskjell, havål, lysing, havmus, kjempeblekksprut, vampyrblekksprut, brennmanet, blæremanet/portugisisk krigsskip, sjøsommerfugl, slimål, lanternefisk, pelikanål",
    ),
    sp(
      "Nevn en figur i The Simpsons",
      "Homer/Homer Simpson, Bart/Bart Simpson, Lisa/Lisa Simpson, Marge/Marge Simpson, Maggie/Maggie Simpson | Mr. Burns/Burns, Ned Flanders/Flanders, Moe, Krusty, Milhouse, Apu, Smithers | Barney, Ralph/Ralph Wiggum, Chief Wiggum/Wiggum, Nelson, Skinner/Principal Skinner, Edna Krabappel/Krabappel, Otto, Lenny, Carl, Sideshow Bob, Abe Simpson/Grampa/Bestefar Simpson, Patty, Selma, Itchy, Scratchy, Snowball, Santa's Little Helper | Comic Book Guy, Groundskeeper Willie/Willie, Dr. Hibbert/Hibbert, Dr. Nick, Kent Brockman, Troy McClure, Lionel Hutz, Professor Frink/Frink, Hans Moleman, Martin, Jimbo, Kearney, Dolph, Sherri, Terri, Rod, Todd, Maude, Reverend Lovejoy/Lovejoy, Helen Lovejoy, Mayor Quimby/Quimby, Fat Tony, Snake, Cletus, Kang, Kodos, Gil, Disco Stu, Duffman, Bumblebee Man, Lunchlady Doris, Chalmers, Agnes Skinner, Jasper | Rainier Wolfcastle, Sideshow Mel, Herb, Mona, Ling, Luann, Kirk, Elizabeth Hoover, Dewey Largo, Database, Uter, Wendell, Lewis, Allison, Squeaky Voiced Teen, Blinky, Plopper/Spider-Pig, Poochie, Jebediah Springfield, Brandine, Manjula, Artie Ziff, Mindy, Frank Grimes/Grimey, Hank Scorpio",
    ),
    sp(
      "Nevn en øvelse eller gren i vinter-OL",
      "langrenn, alpint, skiskyting, skihopp/hopp | skøyter/skøyteløp/hurtigløp, kunstløp, ishockey, curling, snowboard, kombinert/nordisk kombinert | freestyle, bob, aking, skeleton, kortbane/short track, utfor, slalåm, storslalåm, super-G | slopestyle, big air, halfpipe, skicross, snowboardcross, kulekjøring/puckelpist, parallellslalåm, sprint, fellesstart, stafett, lagsprint, skiathlon, jaktstart, monobob, skialpinisme | aerials/hopp freestyle, teamkonkurranse, lagtempo, massestart, superkombinasjon, isdans, parløp, toerbob, firerbob",
      { nei: "telemark, bandy, skøyteseiling" },
    ),
    sp(
      "Nevn et land som har arrangert sommer-OL",
      "#US, #GR, #CN | #GB/England, #FR, #JP, #BR, #AU | #ES, #DE/Vest-Tyskland, #SE, #RU/Sovjetunionen/Sovjet, #IT, #KR, #CA, #MX | #FI, #NL | #BE",
      { nei: "Norge, Sveits, Østerrike, Bosnia-Hercegovina" },
    ),
  ),
  dag(
    sp(
      "Nevn noe man spiser eller drikker til jul i Norge",
      "ribbe, pinnekjøtt, lutefisk, medisterkake | julepølse, surkål, risengrynsgrøt/grøt, riskrem, pepperkaker, lefse, kransekake, gløgg, julebrus, juleøl, rødkål, medisterpølse | kalkun, torsk, rakfisk, smalahove, sylte, rullepølse, juleskinke, karamellpudding, krumkaker, sandkaker, fattigmann, berlinerkranser, goro, serinakaker, sirupsnipper, smultringer, julekake, marsipan, multekrem, kokosmakroner, mandarin/mandariner, akevitt, poteter, saus/sjysaus | havreflarn, rosettbakkels, sirupssnipp, tyttebærsyltetøy, prim, pultost, fenalår, pepperkakehus, kakemenn, lussekatter, kjeks, nøtter, fiken, dadler, sjokolade, twist, kvikk lunsj | rømmegrøt, mølje, dravle, rosinsuppe/fruktsuppe, svisker, sviskegrøt, eplekake, kvæfjordkake, lefse med smør, lammestek, ribberull, julesild, gravlaks, røkelaks, reker",
    ),
    sp("Nevn et land som grenser til Østerrike", "#DE, #IT, #CH | #HU, #CZ | #SI, #SK | #LI | @naboer:AT"),
    sp(
      "Nevn et krypdyr",
      "slange, krokodille, skilpadde, øgle, alligator | kameleon, leguan/iguana, gekko, komodovaran/varan, firfisle, hoggorm, kobra, pyton | stålorm, skink, basilisk, tuatara/brueøgle, kaiman, gavial, skjeggagam/agam, anolis, havskilpadde, landskilpadde, anakonda, klapperslange, mamba, boa | kragefirfisle, moloch/tornedjevel, gilaøgle, perleøgle, sandøgle, markfirfisle, leopardgekko, hornøgle, kjempeskilpadde/galapagosskilpadde, lærskilpadde, alligatorskilpadde, snappskilpadde, kongekobra, taipan | dinosaur, pterosaur, plesiosaur",
      { nei: "frosk, padde, salamander, salamandere, axolotl" },
    ),
    sp(
      "Nevn en norsk konge",
      "Harald V/Harald/Kong Harald/Harald den femte, Olav V/Olav/Kong Olav/Olav den femte, Haakon VII/Haakon/Håkon/Kong Haakon/Haakon den sjuende | Harald Hårfagre, Olav Tryggvason, Olav den hellige/Olav Haraldsson/Hellig-Olav | Harald Hardråde, Magnus Lagabøte, Sverre/Sverre Sigurdsson, Håkon den gode, Håkon Håkonsson, Christian IV/Christian den fjerde/Kristian Kvart, Eirik Blodøks | Magnus Berrføtt, Sigurd Jorsalfare, Oscar II/Oscar, Karl Johan/Karl XIV Johan, Christian Frederik, Magnus den gode, Olav Kyrre, Håkon V Magnusson, Haakon VI, Magnus Eriksson, Harald Gråfell | Øystein Magnusson, Inge Krokrygg, Magnus Erlingsson, Eirik Magnusson, Olav IV Håkonsson, Erik av Pommern, Christian I, Christian II, Christian III, Frederik I, Frederik II, Frederik III, Christian V, Frederik IV, Christian VI, Frederik V, Christian VII, Frederik VI, Karl XIII, Oscar I, Karl XV, Sigurd Munn, Harald Gille, Håkon Herdebrei, Magnus Blinde, Hans",
      { nei: "Quisling, Haakon Magnus, Sverre Magnus" },
    ),
    sp(
      "Nevn en bokstav i det greske alfabetet",
      "alfa/alpha, beta, gamma, delta, pi, omega | sigma, lambda, epsilon, theta/teta, my/mu | zeta, eta, kappa, rho/ro, tau, fi/phi, psi | jota/iota, ny/nu, ksi/xi, omikron/omicron, ypsilon/upsilon, khi/chi | ",
    ),
    sp(
      "Nevn en norsk statsminister",
      "Jonas Gahr Støre/Støre, Erna Solberg/Solberg/Erna, Jens Stoltenberg/Stoltenberg, Gro Harlem Brundtland/Gro/Brundtland | Kjell Magne Bondevik/Bondevik, Thorbjørn Jagland/Jagland, Kåre Willoch/Willoch, Einar Gerhardsen/Gerhardsen | Jan P. Syse/Syse, Odvar Nordli/Nordli, Trygve Bratteli/Bratteli, Per Borten/Borten, Lars Korvald/Korvald, John Lyng/Lyng, Christian Michelsen/Michelsen, Johan Nygaardsvold/Nygaardsvold | Oscar Torp/Torp, Gunnar Knudsen, Johan Ludwig Mowinckel/Mowinckel, Christopher Hornsrud/Hornsrud, Peder Kolstad/Kolstad, Jens Hundseid/Hundseid, Johan Sverdrup/Sverdrup, Emil Stang | Ivar Lykke, Abraham Berge, Otto Bahr Halvorsen, Wollert Konow, Jørgen Løvland/Løvland, Francis Hagerup/Hagerup, Otto Blehr/Blehr, Christian Homann Schweigaard, Frederik Stang, Johannes Steen, Christian Selmer",
      { nei: "Quisling, Vidkun Quisling" },
    ),
  ),
  dag(
    sp(
      "Nevn en kaffedrikk",
      "cappuccino, caffè latte/latte/kaffe latte, espresso, americano | macchiato, mocha/mokka, flat white, filterkaffe/svart kaffe, iskaffe | cortado, lungo, ristretto, doppio, frappé, frappuccino, affogato, irish coffee, café au lait, kokekaffe, presskannekaffe/presskanne, latte macchiato, cold brew | dalgona, wienerkaffe, café con leche, piccolo, red eye, café bombón, galão, café de olla, tyrkisk kaffe, vietnamesisk kaffe, karsk/kaffekarsk, espresso tonic, marocchino | mazagran, breve, kaffedoktor, eiskaffee, kopi, kaffe med fløte",
      { nei: "chai latte, te, kakao, matcha latte" },
    ),
    sp(
      "Nevn et land i Asia",
      "#CN, #JP, #IN | #TH, #KR, #VN, #ID, #PK, #IR, #IQ, #SA, #AF | #PH, #MY, #SG, #NP, #BD, #KP, #MN, #IL, #TR, #SY, #LK, #KZ, #AE | #MM, #KH, #LA, #UZ, #QA, #KW, #JO, #LB, #YE, #OM, #TW, #GE, #AM, #AZ | @kontinent:Asia, #RU, #EG, #CY",
    ),
    sp(
      "Nevn en sopp",
      "kantarell, fluesopp, sjampinjong/champignon, steinsopp | traktkantarell, piggsopp, østerssopp, shiitake, portobello, morkel, trøffel, rødskrubb, hvit fluesopp | grønn fluesopp, rød fluesopp, spiss giftslørsopp, sandmorkel, matriske, rimsopp, kjeglesopp, brunskrubb, kremle, smørsopp, sauesopp, blek kantarell | ørsopp, enoki, kongeøsterssopp, kragesopp, honningsopp, svovelkjuke, knuskkjuke, kjuke, røyksopp, parasollsopp, reddiksopp, stubbeskjellsopp, pluggsopp, svartsopp, lerkesopp, kastanjesopp, sandsopp, granmatriske, furumatriske | gjærsopp/gjær, muggsopp/mugg, blåmuggsopp, chaga, reishi, lion's mane/igelkottsopp, tunderkjuke, svartkjuke, beltekjuke, eikekjuke",
    ),
    sp(
      "Nevn en film av Steven Spielberg",
      "Haisommer/Jaws/Haien, E.T., Jurassic Park, Indiana Jones/Jakten på den forsvunne skatten/Raiders of the Lost Ark, Schindlers liste/Schindler's List | Saving Private Ryan, Catch Me If You Can, Klodenes kamp/War of the Worlds, Minority Report, Lincoln, The Terminal | A.I./AI, München/Munich, Nærkontakt av tredje grad/Close Encounters of the Third Kind/Close Encounters, Hook, Duellen/Duel, Fargen lilla/The Color Purple, Solens rike/Empire of the Sun, Ready Player One, West Side Story, The Fabelmans | Always, Amistad, The Lost World/Jurassic Park 2, Indiana Jones og templets forbannelse/Temple of Doom, Indiana Jones og det siste korstoget/The Last Crusade, Indiana Jones og krystallhodeskallens rike/Kingdom of the Crystal Skull, Krigshesten/War Horse, Tintin/Tintins eventyr, Bridge of Spies, SVK/The BFG, The Post | The Sugarland Express/Sugarland Express, 1941, Twilight Zone",
    ),
    sp(
      "Nevn et kodeord i NATO-alfabetet",
      "alfa/alpha, bravo, charlie | delta, echo/ekko, foxtrot, tango, zulu | golf, hotel, kilo, lima, oscar, romeo, sierra, x-ray/xray, yankee, victor | india, juliett/juliet, mike, papa, whiskey/whisky, november | quebec, uniform",
    ),
    sp(
      "Nevn et land som har euro som valuta",
      "#DE, #FR, #ES, #IT | #NL, #FI, #GR, #PT, #IE, #AT, #BE | #EE, #LV, #LT, #SK, #SI, #LU, #MT, #CY, #HR | #BG, #MC, #SM, #VA, #AD, #ME | #XK",
      { nei: "Sverige, Danmark, Norge, Polen, Ungarn, Tsjekkia, Romania, Sveits, Storbritannia, Island" },
    ),
  ),
]
