import { dag, sp } from "./typer"

// Days 101–105.
export const dager22 = [
  dag(
    sp(
      "Nevn noe man kan grille",
      "pølser, hamburger/burger, kylling, biff, spareribs | svinekoteletter/koteletter, entrecôte, indrefilet, svinenakke, lammekoteletter, laks, reker/scampi, grønnsaker/grillgrønnsaker, maiskolbe/mais, paprika, squash, sjampinjong/sopp, halloumi, grillspyd/spyd/kyllingspyd, bakt potet/poteter, banan/grillbanan, marshmallows/marshmallow, fisk, kjøtt | løk, aubergine, ananas, pinnebrød, grillpizza/pizza, grillost/ost, makrell, ørret, kveite, bacon, tomat, asparges, lammelår/lam, tofu, vegetarburger/veggisburger, pulled pork, satay, souvlaki, chorizo, bratwurst, flanksteak, kalkun, and, hvalbiff/hval, fersken, svinefilet, ribeye, mørbrad | brisket, tri-tip, tørrfisk, rødbeter, hvitløk, brød, toast, polenta, nektarin | ",
    ),
    sp("Nevn et land som grenser til Mali", "#DZ, #SN | #MR, #NE, #BF | #CI, #GN | | @naboer:ML", { nei: "Ghana, Marokko, Liberia, Sierra Leone, Gambia, Nigeria" }),
    sp(
      "Nevn et ord for et dyrs bolig eller hjem",
      "reir/rede, hi, maurtue/tue, bikube/kube, hule | fuglekasse/fuglehus, stall, fjøs, bur, hundehus, akvarium, terrarium, beverhytte, termittue, vepsebol/bol, spindelvev/edderkoppnett, sneglehus, hønsehus | binge/grisebinge, svinesti/sti, kennel, musehull/hull, vinterhi, låve, fold/sauefold, innhegning, jordhule, dyrehage/zoo | kokong, demning, dam, kaninbur | korallrev, skall",
    ),
    sp(
      "Nevn noe typisk norsk",
      "brunost/geitost, ostehøvel, bunad, 17. mai/syttende mai/nasjonaldagen, fjord, lutefisk | ski/skigåing, Kvikk Lunsj, matpakke, lefse, rømmegrøt, fårikål, pinnekjøtt, raspeballer/komle/kumle/klubb/potetball, fiskeboller, troll, nisser, hytte/hyttetur, påskekrim, tran, Freia melkesjokolade/Freia, Grandiosa, bløtkake, vafler/vaffel, kaviar/Mills Kaviar, smalahove, rakfisk, multer, sølje, lusekofte/Mariusgenser, Holmenkollen, Hurtigruten, nordlys, midnattssol, stavkirke, langrenn, janteloven, dugnad, kos/koselig, friluftsliv, allemannsretten, fredagstaco/taco, pålegg | Solo, pølse i lompe/lompe, julebord, laks, tørrfisk, klippfisk, flatbrød, krumkake, kransekake, akevitt, Jarlsberg, gamalost/gammelost, prim, sild, elg, reinsdyr, joik, hardingfele, seter, stabbur, rorbu, russ/russefeiring, lapskaus, eggedosis, nynorsk, bokmål, vikinger, Askeladden, oljefondet, søndagstur | snus, Nordkapp, Lofoten, binders, Kong Harald, Dovregubben, a-ha, Edvard Munch, Henrik Ibsen | ",
    ),
    sp(
      "Nevn et annet ord for penger",
      "spenn, krone, cash, gryn, mynter/mynt | kontanter, sedler/pengesedler, stålpenger, flus, grunker, kapital, midler, valuta, formue, lommepenger, sparepenger, pæng/peng | kronasjer, skilling, øre, lønn, money, betalingsmiddel, slanter, papirpenger, likvider, lapper, rikdom | daler/riksdaler, deig, bucks, ressurser, kryptovaluta/bitcoin | ",
    ),
    sp(
      "Nevn et fjell som er over 8000 meter høyt",
      "Mount Everest/Everest/Chomolungma/Sagarmatha, K2, Kangchenjunga/Kanchenjunga | Lhotse, Makalu, Cho Oyu, Dhaulagiri, Manaslu, Nanga Parbat, Annapurna | Gasherbrum I/Gasherbrum 1/Hidden Peak, Broad Peak, Gasherbrum II/Gasherbrum 2, Shishapangma/Xixabangma | | ",
      { nei: "Kilimanjaro, Mont Blanc, Aconcagua, Denali, Galdhøpiggen, Elbrus, Matterhorn" },
    ),
  ),
  dag(
    sp(
      "Nevn noe man spiser med skje",
      "suppe, grøt, yoghurt, is, frokostblanding/kornblanding | pudding, gelé, müsli, havregrøt, risgrøt, karamellpudding, riskrem, fromasj, tiramisu, kesam, skyr, cornflakes, bløtkokt egg/kokt egg/egg, rømmegrøt, sjokoladepudding, softis, mousse/sjokolademousse, panna cotta, crème brûlée, babymat, eplemos/mos | lapskaus, gryterett, chili, sodd, kompott, fruktsalat, sorbet, velling, smoothiebowl/açaíbowl, chiapudding, hostesaft/medisin, tran, potetmos, vaniljesaus, fruktsuppe/blåbærsuppe, cottage cheese, risotto, dal, ramen, pho, krem, kremfløte | sukker, ris, bønner, kaviar, honning, syltetøy, curry | ",
    ),
    sp(
      "Nevn en by i Kina",
      "Beijing/Peking, Shanghai, Hongkong | Shenzhen, Guangzhou/Kanton/Canton, Wuhan, Chengdu, Chongqing, Xi'an, Nanjing, Tianjin, Macao/Macau, Harbin, Hangzhou | Shenyang, Dalian, Qingdao, Kunming, Lhasa, Ürümqi, Suzhou, Xiamen, Changsha, Zhengzhou, Jinan, Hefei, Fuzhou, Nanning, Guilin, Lanzhou, Taiyuan, Shijiazhuang, Hohhot, Ningbo, Dongguan, Foshan, Wenzhou, Sanya, Haikou | Guiyang, Xining, Yinchuan, Changchun, Kashgar/Kashi, Luoyang, Datong, Kaifeng, Pingyao, Lijiang, Dali, Yangshuo, Zhuhai, Shantou, Wuxi, Nanchang, Jilin, Tangshan, Baotou, Yantai, Weihai, Zhangjiajie, Chengde, Qufu, Dunhuang, Turpan | ",
      { nei: "Taipei, Tokyo, Seoul, Pyongyang, Ulan Bator, Hanoi, Taiwan, Bangkok" },
    ),
    sp(
      "Nevn et ord for en gruppe dyr",
      "flokk, stim, sverm | hjord, koloni, kull | bøling, drift, skokk, kobbel, tropp, horde | fylking, skare, bestand/populasjon, familie | ",
    ),
    sp(
      "Nevn en barnebokforfatter",
      "Astrid Lindgren/Lindgren, Roald Dahl/Dahl, Thorbjørn Egner/Egner, J.K. Rowling/Rowling, Alf Prøysen/Prøysen, H.C. Andersen/Hans Christian Andersen | Anne-Cath. Vestly/Vestly, Maria Parr, Tove Jansson/Jansson, Dr. Seuss/Seuss, Enid Blyton/Blyton, Jo Nesbø/Nesbø, Jostein Gaarder/Gaarder, Beatrix Potter, A.A. Milne/Milne, Julia Donaldson/Donaldson, Lewis Carroll/Carroll, C.S. Lewis, Michael Ende, Gunilla Bergström/Bergström, Sven Nordqvist/Nordqvist, Jeff Kinney/Kinney, David Walliams/Walliams, Rick Riordan/Riordan, Erlend Loe, Bjørn F. Rørvik/Rørvik, Kjell Aukrust/Aukrust | Tor Åge Bringsværd/Bringsværd, Inger Hagerup, Zinken Hopp, Erich Kästner, Lemony Snicket, Philip Pullman, Cornelia Funke, Eric Carle, Maurice Sendak, Judith Kerr, Michael Bond, Carlo Collodi, J.M. Barrie, Rudyard Kipling, L. Frank Baum, Mark Twain, Lars Mæhle, Endre Lund Eriksen, Arne Svingen, Tormod Haugen, Kari Stai, Stian Hole, Gro Dahle, Svein Nyhus, Bjørn Sortland, Øyvind Torseter, Torill Thorstad Hauger, Ulf Stark, Barbro Lindgren, Martin Widmark, Lauren Child, Michael Morpurgo, Jacqueline Wilson, Anthony Horowitz, R.L. Stine, Kate DiCamillo, Beverly Cleary, E.B. White, Shel Silverstein, Dick Bruna, Mo Willems, Oliver Jeffers | Eric Hill, Quentin Blake, Axel Scheffler, Suzanne Collins, Jules Verne, Hergé | ",
    ),
    sp(
      "Nevn en måte å hilse på",
      "hei, hallo, god morgen, håndhilse/håndtrykk/håndhilsing, klem | vinke, heisann/heisan, hei hei, god dag, god kveld, morn/morna, halla, kinnkyss/kyss på kinnet, high five/gi fem, nikke/nikk, takk for sist | bukke/bukk, neie/kniks, fist bump, hallais, hei på deg, god ettermiddag, kyss, smile/smil, hyggelig å treffe deg/hyggelig å hilse på deg, hvordan står det til/står til | honnør/salutt, lette på hatten, eskimokyss/gni nesene, namaste, hello, hola, bonjour, salam/as-salamu alaykum, shalom, moin, ciao, yo, klapp på skulderen, lenge siden, går det bra | heisann sveisann, halla balla, wassup",
    ),
    sp(
      "Nevn en severdighet i New York",
      "Frihetsgudinnen/Statue of Liberty, Empire State Building, Central Park, Times Square, Brooklyn Bridge/Brooklynbroen | One World Trade Center/World Trade Center/Freedom Tower, 9/11 Memorial/Ground Zero/11-minnesmerket, Rockefeller Center, Chrysler Building, Wall Street, Broadway, Fifth Avenue/5th Avenue, Metropolitan Museum of Art/The Met/Metropolitan, MoMA/Museum of Modern Art, Guggenheim, American Museum of Natural History, FN-bygningen/FN-hovedkvarteret, High Line, Grand Central/Grand Central Terminal, Madison Square Garden, Yankee Stadium, Coney Island, Ellis Island, Flatiron Building | Staten Island Ferry, Chinatown, Little Italy, SoHo, Harlem, Greenwich Village, Manhattan Bridge, St. Patrick's Cathedral, Top of the Rock, Vessel, Summit One Vanderbilt, Charging Bull/Wall Street-oksen, Bryant Park, Washington Square Park, Carnegie Hall, Lincoln Center, Radio City Music Hall, Apollo Theater, New York Public Library, Trump Tower, The Dakota/Dakota, Strawberry Fields, Bronx Zoo, Central Park Zoo, Intrepid Museum/Intrepid, Hudson Yards, Little Island, Dumbo, Williamsburg, Battery Park, Liberty Island, Macy's, Plaza Hotel, Chelsea Market | Brooklyn, Queens, Bronx, Manhattan, Staten Island, Roosevelt Island, Waldorf Astoria, Tiffany, Katz's Delicatessen | ",
      { nei: "Golden Gate, Hollywood, Det hvite hus, Space Needle, Kapitol" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du kan se i et sirkus",
      "klovn, akrobat, sirkusdirektør/direktør, elefant, løve/løver | sjonglør/sjonglering, trapes/trapeskunstner, linedans/line, tryllekunstner/magiker, manesje, sirkustelt/telt, popcorn, sukkerspinn, hest, tiger | hund, menneskekanonkule/kanonkule, ildsluker, slangemenneske, enhjulssykkel/ethjulssykkel, stylter/styltegjenger, dyretemmer/løvetemmer, hulahopp/hula hoop | sel, ape/apekatt, knivkaster, sterk mann/kraftkar, sirkusorkester/orkester, publikum, billett, sagflis, kunstrytter, luftakrobat, ballonger, kamel | bjørn, papegøye, dødskule, kjegle, pølser",
    ),
    sp("Nevn et land som grenser til Algerie", "#MA, #TN, #LY | #ML, #NE, #MR | | #EH | @naboer:DZ", { nei: "Egypt, Spania, Senegal, Tsjad, Sudan" }),
    sp(
      "Nevn en del av en datamaskin",
      "tastatur, mus, skjerm, prosessor/CPU/mikroprosessor, harddisk/HDD | hovedkort, RAM/minne/arbeidsminne, skjermkort/grafikkort/GPU, strømforsyning/PSU, vifte/kjølevifte, SSD, kabinett, høyttalere/høyttaler, mikrofon, webkamera/kamera, USB-port/USB, batteri, lader/ladekabel, styreplate/touchpad/pekeplate, tast | DVD-stasjon/CD-rom/DVD-spiller/CD-spiller, nettverkskort, trådløskort/wifikort, lydkort, kjøleribbe/kjøler, HDMI-port/HDMI, strømknapp/av-på-knapp, brikkesett, kabel/kabler, mellomromstast, nettverksport/ethernetport, kortleser/SD-kortleser, diskettstasjon/diskett, skriver/printer | BIOS, operativsystem, kjølepasta, hengsel, joystick/spillkontroll, kjerne | ",
    ),
    sp(
      "Nevn en person i Det gamle testamente",
      "Adam, Eva, Noah/Noa, Moses, Abraham, David | Goliat, Salomo/Kong Salomo, Josef, Jakob, Isak, Kain, Abel, Samson/Simson, Jona/Jonas, Daniel | Delila, Elia, Rut/Ruth, Ester, Sara, Rebekka, Rakel, Lea, Aron, Josva, Saul, Gideon, Job, Jesaja, Jeremia, Esekiel, Metusalem, Lot, Ismael, Esau, Mirjam, Batseba, Absalom, Samuel, Elisa, Nehemja, Esra, Hagar | Set, Enok, Nimrod, Potifar, Noomi, Debora, Eli, Jonatan, Sakarja, Malaki, Amos, Hosea, Joel, Mika, Nahum, Habakkuk, Sefanja, Haggai, Obadja, Jefta, Juda, Ruben, Benjamin, Levi, Simeon, Dina, Tamar, Jesse, Boas, Isebel, Akab, Nebukadnesar, Belsassar, Kyros, dronningen av Saba, Melkisedek, Hiskia, Josjia, Mordekai, Haman, Sadrak, Mesjak, Abed-Nego | Ham, Sem, Jafet, Lamek, Tubal-Kain, Bileam, Rahab, Barak, Jael",
      { nei: "Jesus, Maria, Peter, Paulus, Judas, Johannes, Lasarus, Herodes, Pontius Pilatus, Matteus" },
    ),
    sp(
      "Nevn noe som kommer i par",
      "sokker, sko, votter, øyne, ører | hansker, ski, staver/skistaver, øredobber, briller, bukse, hender, føtter, armer, bein, lunger, nyrer, skøyter, støvler, tøfler, tvillinger | spisepinner/pinner, trommestikker, skolisser, høyttalere, ørepropper/øreplugger, vinger, øyenbryn, nesebor, knær, albuer, skuldre, kjærestepar/ektepar/kjærester, dansepar, salt og pepper, kontaktlinser/linser, årer/padleårer, krykker | pedal, øreklokker, leggskinner, boksehansker, manualer, gardiner, svane, terningpar | Knoll og Tott, Bert og Ernie",
    ),
    sp(
      "Nevn en kunstretning eller stilart",
      "impresjonisme, kubisme, surrealisme, renessanse/renessansen, romantikk, ekspresjonisme | barokk, popkunst/pop art, abstrakt kunst/abstrakt, realisme, gotikk, rokokko, klassisisme/nyklassisisme, modernisme, jugend/art nouveau, art deco, funkis/funksjonalisme, minimalisme, dadaisme/dada, futurisme, nasjonalromantikk | postimpresjonisme, pointillisme, fauvisme, abstrakt ekspresjonisme, naturalisme, symbolisme, Bauhaus, konstruktivisme, suprematisme, gatekunst/street art/graffiti, fotorealisme/hyperrealisme, manierisme, prerafaelittene/prerafaelittisme, romansk stil/romansk, bysantinsk kunst, brutalisme, postmodernisme, konseptkunst, op art, land art, dragestil, sveitserstil, nygotikk | De Stijl, fluxus, orfisme, tachisme, kinetisk kunst, performancekunst/performance, installasjonskunst, videokunst, digital kunst, naivisme/naiv kunst, art brut, biedermeier, empire, historisme, sosialistisk realisme, magisk realisme, neoekspresjonisme, Barbizon-skolen | kitsch, Skagenmalerne",
    ),
  ),
  dag(
    sp(
      "Nevn en britisk rett",
      "fish and chips, full English/full English breakfast/engelsk frokost, scones, shepherd's pie | Sunday roast, roastbeef, Yorkshire pudding, beans on toast, cottage pie, bangers and mash, haggis, steak and kidney pie, pork pie, Cornish pasty/pasty, crumpets, chicken tikka masala, Beef Wellington, mince pies, Christmas pudding/plum pudding, trifle, sticky toffee pudding | Welsh rarebit, ploughman's lunch, toad in the hole, Lancashire hotpot, black pudding, kedgeree, scotch egg, Eton mess, bread and butter pudding, spotted dick, Victoria sponge/Victoriakake, Bakewell tart, Eccles cakes, agurksmørbrød/cucumber sandwiches, afternoon tea, cream tea, jellied eels, pie and mash, bubble and squeak, Welsh cakes, Cullen skink, shortbread, Cumberland sausage, mushy peas, chip butty, sausage roll, coronation chicken | Scotch broth, cock-a-leekie, Arbroath smokie, Marmite, porridge, crumble, treacle tart, Chelsea buns, hot cross buns, Worcestershiresaus | ",
      { nei: "Irish stew, colcannon, pizza, taco" },
    ),
    sp("Nevn et land som grenser til Libya", "#EG, #TN, #DZ | #SD, #TD, #NE | | | @naboer:LY", { nei: "Marokko, Mali, Israel, Sør-Sudan, Italia" }),
    sp(
      "Nevn en trekkfugl",
      "svale/låvesvale, gjøk, stær, stork, trane | gås/villgås/gjess, grågås, taksvale, linerle, tårnseiler/tårnsvale, løvsanger, terne/rødnebbterne/makrellterne, vipe, sanglerke/lerke, rødstjert, fiskeørn | steinskvett, svarthvit fluesnapper/fluesnapper, tjeld, heilo, storspove, tornsanger, hagesanger, munk, rørsanger, blåstrupe, hvitkinngås, kortnebbgås, sædgås, ringgås, vepsevåk, lappspove, polarsnipe, sangsvane, rødstrupe, bokfink, gulerle | nattergal, snøspurv, myrsnipe, sandlo, gråfluesnapper, trepiplerke, heipiplerke, rosenfink, hortulan | flamingo, kolibri",
      { nei: "kråke, skjære, gråspurv, spurv, kjøttmeis, due, ravn, pingvin" },
    ),
    sp(
      "Nevn et ukeblad eller magasin",
      "Donald Duck/Donald, Se og Hør, KK/Kvinner og Klær, Hjemmet | Vi Menn, Det Nye, Henne, Elle, Vogue, Allers, Norsk Ukeblad, Familien, Illustrert Vitenskap, National Geographic, Time, Kamille, Her og Nå, Bonytt, Foreldre & Barn/Foreldre og barn, Tara, Topp, A-magasinet, D2 | Cosmopolitan, Harper's Bazaar, Rolling Stone, The New Yorker, The Economist, Newsweek, People, Forbes, GQ, Wired, Mad, Fantomet, Pondus, Nemi, Vi over 60, Fjell og Vidde, Jakt & Fiske/Jakt og Fiske, Motor, Bo Bedre, Hytteliv, Villmarksliv, Kapital, Dine Penger, Teknisk Ukeblad, Natt & Dag | Billedbladet NÅ, Tex Willer, Bamse, Vanity Fair, Hello!, Glamour, Marie Claire, Reader's Digest/Det Beste | ",
      { nei: "VG, Dagbladet, Aftenposten" },
    ),
    sp(
      "Nevn noe du forbinder med et bryllup",
      "brud/brudepar, brudgom, brudekjole, ringer/gifteringer/ring, bryllupskake/kake | prest, kirke, forlover, brudepike, brudebukett/bukett, slør, taler/tale, brudevals/første dans, kyss, ja-ordet/ja, bryllupsreise/honeymoon, vielse/vigsel, bryllupsmiddag/middag, kransekake, blomster, smoking, dress, gjester, bryllupsgaver/gaver, ris, konfetti, champagne, fotograf, toastmaster | brudesølje, bunad, invitasjon, bryllupsfest/fest, utdrikningslag, forlovelse, kjole og hvitt, dans, kjærlighet, brudebil, band, rådhuset/borgerlig vielse, bordplassering, ringbærer, blomsterpike, brudesuite | svigerfamilie/svigerforeldre, tårer, bryllupsdag, gullbryllup, sølvbryllup, ektepakt, hest og vogn, Las Vegas, kapell | ",
    ),
    sp(
      "Nevn et NFL-lag",
      "Kansas City Chiefs/Chiefs, New England Patriots/Patriots, Dallas Cowboys/Cowboys, Green Bay Packers/Packers, San Francisco 49ers/49ers/Niners | Philadelphia Eagles/Eagles, Pittsburgh Steelers/Steelers, Miami Dolphins/Dolphins, New York Giants/Giants, New York Jets/Jets, Chicago Bears/Bears, Seattle Seahawks/Seahawks, Denver Broncos/Broncos, Las Vegas Raiders/Raiders/Oakland Raiders, Buffalo Bills/Bills, Tampa Bay Buccaneers/Buccaneers/Bucs, Baltimore Ravens/Ravens, Minnesota Vikings/Vikings, Los Angeles Rams/Rams/St. Louis Rams | Detroit Lions/Lions, Cincinnati Bengals/Bengals, Cleveland Browns/Browns, Houston Texans/Texans, Indianapolis Colts/Colts/Baltimore Colts, Jacksonville Jaguars/Jaguars, Tennessee Titans/Titans/Houston Oilers, Los Angeles Chargers/Chargers/San Diego Chargers, Washington Commanders/Commanders/Washington Football Team, Atlanta Falcons/Falcons, Carolina Panthers/Panthers, New Orleans Saints/Saints, Arizona Cardinals/Cardinals | | ",
      { nei: "Los Angeles Lakers, Boston Red Sox, New York Yankees, Chicago Bulls, Golden State Warriors" },
    ),
  ),
  dag(
    sp(
      "Nevn noe som inneholder sjokolade",
      "sjokoladekake, kakao/varm sjokolade, Kvikk Lunsj, Nugatti, sjokoladeis | brownies/brownie, Smash, M&M's, Daim, Snickers, Twix, Kinderegg, Kinder, Nutella, sjokolademelk, Litago, sjokoladepudding, sjokolademousse, cookies/sjokoladecookies, Bounty, Mars, KitKat, Freia Melkesjokolade/melkesjokolade, trøfler/sjokoladetrøfler, konfekt, Twist, Non Stop, Japp, påskeegg | Kex/Kexsjokolade, Firkløver, Smil, Troika, Stratos, Hobby, Lion, Toblerone, Ferrero Rocher, Mozartkuler, sjokoladeboller, sjokoladecroissant/pain au chocolat, sjokolademuffins/muffins, sachertorte, schwarzwaldkake/Schwarzwälderkake, mokka/mocha, Coco Pops, sjokoladefondue, sjokoladepålegg, sjokoladekalender/julekalender, sjokoladenisse, Maltesers, Milky Way, Marabou, Milka, sjokoladesaus, Delfiakake, sjokoladeplate | tiramisu, Cocoa Puffs, mole poblano, sjokoladekjeks | ",
      { nei: "vaniljeis, skolebolle, karamell, lakris" },
    ),
    sp(
      "Nevn et land med «land» i navnet på norsk",
      "Tyskland, Finland, Russland | Island/Iceland, Irland/Ireland, Nederland/Holland/The Netherlands, Thailand | New Zealand/Ny-Zealand, Estland | England, Skottland, Grønland, Nord-Irland, Swaziland | Lettland, Åland, Somaliland, Øst-Tyskland, Vest-Tyskland, Basutoland, Bechuanaland, Nyasaland",
      { nei: "Polen, Hellas, Sveits, Norge, Sverige, Danmark, Latvia, Eswatini" },
    ),
    sp(
      "Nevn et måleinstrument",
      "termometer, linjal, vekt/badevekt/kjøkkenvekt, målebånd/rullemål, stoppeklokke | barometer, speedometer/fartsmåler, meterstokk, klokke/ur, kompass, vaterpass/vater, gradskive/vinkelmåler, hygrometer, vindmåler/anemometer, regnmåler, seismograf, voltmeter, amperemeter, multimeter, blodtrykksmåler, pulsklokke/pulsmåler, skyvelære, målebeger/litermål/desilitermål, kilometerteller | mikrometer, lydmåler/desibelmåler, lysmåler/luxmeter, turteller, høydemåler, ekkolodd/dybdemåler, Geigerteller, pH-meter, alkometer, strømmåler, vannmåler, manometer, sekstant, teodolitt, laseravstandsmåler, skritteller/skrittmåler, måleskje, bensinmåler, pulsoksymeter | timeglass, solur, kalorimeter, spektrometer, oscilloskop, galvanometer, refraktometer | ",
    ),
    sp(
      "Nevn et kjent kjærlighetspar fra virkeligheten, bøker eller film",
      "Romeo og Julie/Romeo og Julia/Romeo & Julie/Romeo and Juliet, Jack og Rose/Jack & Rose, Adam og Eva/Adam & Eva, Mikke og Minni/Mikke Mus og Minni Mus, Kong Harald og Dronning Sonja/Harald og Sonja | Shrek og Fiona, Elizabeth og Darcy/Elizabeth Bennet og Mr. Darcy, Noah og Allie, Bella og Edward, Haakon og Mette-Marit/Kronprins Haakon og Mette-Marit, William og Kate, Barack og Michelle Obama/Barack og Michelle, Antonius og Kleopatra/Marcus Antonius og Kleopatra, Tristan og Isolde, Lady og Landstrykeren, Kermit og Miss Piggy, Ross og Rachel, Homer og Marge, Donald og Dolly, Beyoncé og Jay-Z, Brad Pitt og Angelina Jolie/Brangelina, John Lennon og Yoko Ono, Bonnie og Clyde, Charles og Diana/Prins Charles og Diana, Napoleon og Josephine | Johnny Cash og June Carter, Frida Kahlo og Diego Rivera, Orfeus og Eurydike, Paris og Helena, Odyssevs og Penelope, Lancelot og Guinevere, Aladdin og Jasmin, Belle og Udyret/Skjønnheten og udyret, Ariel og Eric/Ariel og Erik, Han Solo og Leia, Harry og Sally, Westley og Buttercup, Rhett og Scarlett/Scarlett O'Hara og Rhett Butler, Heathcliff og Catherine, Jane Eyre og Rochester, Ron og Hermine, Harry og Ginny, Katniss og Peeta, Tarzan og Jane, Skipper'n og Olivia/Popeye og Olivia, Fred og Wilma, Tony og Maria, Danny og Sandy, Rick og Ilsa, Marie og Pierre Curie, Johnny og Baby, Edward og Vivian, Carl og Ellie, WALL-E og EVE, Olav og Märtha, Kristin og Erlend, Peer og Solveig | Sid og Nancy, Abélard og Héloïse, Dante og Beatrice, Pyramus og Thisbe, Shah Jahan og Mumtaz Mahal, Elizabeth Taylor og Richard Burton | ",
    ),
    sp(
      "Nevn hvordan man sier «jeg elsker deg» på et annet språk",
      "I love you, je t'aime, te quiero, te amo, ti amo, ich liebe dich | jag älskar dig, jeg elsker dig, minä rakastan sinua/rakastan sinua, aishiteru, wo ai ni, ya tebya lyublyu/ja tebja ljublju, eu te amo, ik hou van jou/ik hou van je, seni seviyorum, saranghae/saranghaeyo, s'agapo/se agapo, kocham cię | ég elska þig/eg elska thig, eg elski teg, mi amas vin, te iubesc, szeretlek, miluji tě, volim te, obicham te, ana bahebak/uhibbuk, ani ohev otach, main tumse pyar karta hoon, aku cinta kamu, mahal kita, chan rak khun/phom rak khun, anh yêu em/em yêu anh, nakupenda, ek het jou lief, tá grá agam duit, t'estimo, maite zaitut, ma armastan sind, es tevi mīlu, aš tave myliu, ya tebe kokhayu, të dua, dooset daram | ti voglio bene, ich hab dich lieb, je t'adore, ngiyakuthanda, rwy'n dy garu di, ľúbim ťa | ",
      { nei: "jeg elsker deg, eg elskar deg, elsker deg" },
    ),
    sp(
      "Nevn et maleri av Edvard Munch",
      "Skrik/Skriket/The Scream, Madonna, Pikene på broen, Vampyr/Kjærlighet og smerte, Det syke barn | Livets dans, Solen, Melankoli, Pubertet, Angst, Aften på Karl Johan, Sjalusi, Kysset/Kyss, Selvportrett, Stjernenatt | Arbeidere på hjemvei, Ved dødssengen, Døden i sykeværelset, Mannen i kålåkeren, Nattevandreren, Selvportrett mellom klokken og sengen, Selvportrett med vinflaske, Separasjon, Aske, Kvinnen i tre stadier, Inger på stranden, Vår, Natt i St. Cloud, Rue Lafayette, Fortvilelse, Månelys, Historien, Alma Mater, Galopperende hest, Damene på broen, Badende menn, Den gule tømmerstokken, Arbeidere i snø, Rødt villvin, Marats død, Golgata | | ",
      { nei: "Mona Lisa, Solsikker, Brudeferden i Hardanger, Nattevakten" },
    ),
  ),
]
