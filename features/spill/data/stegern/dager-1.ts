import { dag, sp } from "./typer"

// Days 1–5.
export const dager1 = [
  dag(
    sp(
      "Nevn en frukt",
      "eple/epler, banan/bananer, appelsin/appelsiner | pære/pærer, kiwi, mango, ananas, drue/druer/vindrue, jordbær | plomme/plommer, fersken, nektarin, sitron, lime, mandarin, klementin, grapefrukt/grape, melon, vannmelon, kirsebær, blåbær, bringebær, aprikos, granateple, pasjonsfrukt, fiken, daddel/dadler | avokado, litchi/lychee, kokosnøtt/kokos, papaya, guava, kumquat, kaki/persimon/sharonfrukt, stjernefrukt/karambola, dragefrukt/pitaya, kvede, morell, tyttebær, multe/molte/multer, solbær, rips, stikkelsbær, bjørnebær, tranebær, pomelo, physalis, blodappelsin, nashi | tomat, oliven, rambutan, durian, mangostan, jackfrukt, salak, cherimoya, feijoa, longan, kiwano, tamarind, mispel, sapodilla, akee",
    ),
    sp("Nevn et land som grenser til Tyskland", "#DK, #FR | #PL, #AT, #NL | #CH, #BE | #CZ | @naboer:DE"),
    sp(
      "Nevn et pattedyr som lever vilt i Norge",
      "elg, rev/rødrev, ekorn | hare/fjellhare, rådyr, hjort, bjørn/brunbjørn, ulv, reinsdyr/rein/villrein | gaupe, jerv, grevling, pinnsvin/piggsvin, bever, lemen, mus/skogmus/markmus/husmus, oter, mår | røyskatt, snømus, mink, flaggermus, moskus/moskusfe/moskusokse, fjellrev, isbjørn, villsvin, sel, rotte/brunrotte, spissmus | nise, spekkhogger, hval, steinkobbe, havert, klatremus, vånd/vannrotte, hasselmus, mårhund, hvalross",
      { nei: "muldvarp, kenguru, løve" },
    ),
    sp(
      "Nevn en idrett i sommer-OL",
      "fotball, friidrett, svømming, håndball | sykling, tennis, basketball/basket, volleyball, boksing, bryting, turn | roing, padling/kajakk/kano, seiling, skyting, bueskyting, fekting, judo, taekwondo, vektløfting, golf, rugby, hockey/landhockey, ridning/ridesport | triatlon, moderne femkamp, stuping, kunstsvømming/synkronsvømming, vannpolo, bordtennis, badminton, sandvolleyball, bmx, terrengsykling, surfing, skateboard, klatring/sportsklatring | breaking/breakdance, baseball, softball, cricket, lacrosse, flaggfotball, squash, maraton, sjumannsrugby",
    ),
    sp(
      "Nevn en norsk by",
      "Oslo, Bergen, Trondheim, Stavanger | Kristiansand, Tromsø, Drammen, Fredrikstad, Bodø, Ålesund | Sandnes, Sarpsborg, Skien, Tønsberg, Hamar, Lillehammer, Moss, Haugesund, Larvik, Halden, Arendal, Gjøvik, Molde, Harstad, Kongsberg, Porsgrunn, Narvik, Alta, Hammerfest, Kristiansund, Sandefjord, Lillestrøm, Røros | Steinkjer, Grimstad, Mandal, Elverum, Kongsvinger, Horten, Holmestrand, Hønefoss, Mo i Rana/Mo, Mosjøen, Vadsø, Kirkenes, Levanger, Namsos, Stjørdal, Førde, Florø, Egersund, Flekkefjord, Notodden, Kragerø, Risør, Lillesand, Farsund, Svolvær, Sortland, Finnsnes, Ski, Jessheim, Askim, Drøbak, Leirvik/Stord, Sandvika, Rjukan, Stavern, Verdalsøra/Verdal, Odda, Bryne, Fauske, Brumunddal, Ulsteinvik, Orkanger | Vardø, Honningsvåg, Brekstad, Kolvereid, Åkrehamn, Fosnavåg, Rørvik, Kopervik, Skudeneshavn, Tvedestrand, Brevik, Langesund, Moelv, Sandnessjøen, Brønnøysund, Stokmarknes, Leknes, Mysen, Åndalsnes, Otta, Lyngdal, Svelvik, Sauda, Hokksund, Fagernes, Jørpeland, Stathelle, Stjørdalshalsen",
    ),
    sp(
      "Nevn et grunnstoff",
      "oksygen/surstoff/oxygen, hydrogen/vannstoff, karbon/kullstoff/carbon, jern/iron, gull/gold | nitrogen/kvelstoff, helium, sølv/silver, kobber/copper, natrium/sodium, kalsium/calcium, uran/uranium, sink/zinc | klor/chlorine, aluminium, bly/lead, kalium/potassium, magnesium, neon, svovel/sulfur, fosfor, platina/platinum, kvikksølv/mercury, tinn/tin, nikkel, litium/lithium, titan/titanium, silisium/silicon, jod/iod/iodine, fluor, plutonium, radon, argon | krom, mangan, kobolt, wolfram/tungsten, arsen, radium, brom, xenon, krypton, barium, bor/boron, beryllium, kadmium, palladium, iridium, osmium, polonium, cesium, strontium, selen, germanium, gallium, vismut, antimon, thorium | scandium, vanadium, rubidium, yttrium, zirkonium, niob, molybden, technetium, ruthenium, rhodium, indium, tellur, lantan, cerium, neodym, europium, gadolinium, americium, einsteinium, nobelium, francium, astat, thallium, tantal, hafnium, rhenium, actinium, protactinium, neptunium, curium, berkelium, californium, fermium, mendelevium, lawrencium, rutherfordium, dubnium, seaborgium, bohrium, hassium, meitnerium, darmstadtium, roentgenium, copernicium, nihonium, flerovium, moscovium, livermorium, tenness, oganesson, praseodym, prometium, samarium, terbium, dysprosium, holmium, erbium, thulium, ytterbium, lutetium",
    ),
  ),
  dag(
    sp(
      "Nevn en grønnsak",
      "gulrot/gulrøtter, potet/poteter, agurk, brokkoli | tomat, løk, paprika, salat, kål/hodekål, blomkål, mais, erter/ert | squash, aubergine, spinat, purre, selleri, rosenkål, kålrot, rødbete/rødbeter, reddik, hvitløk, bønner/bønne, sukkererter, grønnkål, sopp, pastinakk | rødkål, kinakål, pak choi, fennikel, asparges, artisjokk, persillerot, nepe, jordskokk, mangold, ruccola, sjalottløk, vårløk, søtpotet, gresskar, chili, sellerirot/knollselleri | jams, okra, maniok/kassava, taro, edamame, romanesco, kålrabi/kohlrabi, savoykål, bambusskudd, skorsonerrot, endiv, rabarbra, karse, brønnkarse, daikon, lotusrot",
    ),
    sp("Nevn et land som grenser til Russland", "#NO, #FI, #CN | #UA, #BY, #EE | #LV, #LT, #KZ, #PL, #MN | #GE, #AZ, #KP | @naboer:RU"),
    sp(
      "Nevn en fugl som finnes i Norge",
      "måke/måse, kråke, spurv/gråspurv, ørn/kongeørn/havørn | skjære, due, svane, and/stokkand, ugle, meis/kjøttmeis/blåmeis, trost/svarttrost, rype/lirype/fjellrype, lunde | hakkespett, gjøk, falk, hauk, ravn, stær, svale/låvesvale, gås/grågås, rødstrupe, bokfink, terne, ærfugl, tjeld, skarv, hegre/gråhegre, storfugl, orrfugl, jerpe | rugde, vipe, linerle, gjerdesmett, fossekall, dompap, gråtrost, sidensvans, nøtteskrike, lerke/sanglerke, trane, lom/storlom/smålom, havsule, alke, lomvi/polarlomvi, krykkje, kvinand, laksand, hettemåke, fiskemåke, gråmåke, svartbak, tårnfalk, vandrefalk, hubro, spurvehauk, musvåk, fiskeørn | blåstrupe, lappspurv, snøspurv, fjelljo, tyvjo, rødstilk, myrsnipe, steinskvett, buskskvett, rødvingetrost, gulspurv, grønnfink, bjørkefink, gråsisik, grønnsisik, korsnebb, konglebit, varsler, tornskate, nattergal, fuglekonge, stillits, løvsanger, munk, hagesanger, kattugle, perleugle, spurveugle, haukugle, snøugle, jaktfalk, dvergfalk, myrhauk, hønsehauk, vepsevåk, fjellvåk, havhest, stormsvale, toppskarv, teist, alkekonge, ismåke, polarmåke, sandlo, heilo, enkeltbekkasin, strandsnipe, storspove, småspove",
    ),
    sp(
      "Nevn en Pixar-film",
      "Toy Story, Biler/Cars, Oppdrag Nemo/Finding Nemo/Nemo, Monsterbedriften/Monsters Inc | Up/Se opp, Ratatouille, WALL-E, De utrolige/The Incredibles, Innsiden ut/Inside Out | Coco, Luca, Soul, Modig/Brave, Toy Story 2, Oppdrag Doris/Finding Dory, Småkryp/A Bug's Life, Rød/Turning Red, Monsteruniversitetet/Monsters University | Elemental, Onward/Videre, Lightyear, Den gode dinosauren/The Good Dinosaur, Toy Story 3, Toy Story 4, Biler 2/Cars 2, Biler 3/Cars 3, De utrolige 2/Incredibles 2, Innsiden ut 2/Inside Out 2, Toy Story 5 | Elio, Hoppers",
    ),
    sp(
      "Nevn et norsk fylke, dagens eller et tidligere",
      "Oslo, Vestland, Trøndelag, Rogaland | Akershus, Innlandet, Nordland, Agder, Troms, Finnmark | Østfold, Buskerud, Vestfold, Telemark, Møre og Romsdal | Viken, Vestfold og Telemark, Troms og Finnmark, Hordaland, Hedmark, Oppland | Sogn og Fjordane, Aust-Agder, Vest-Agder, Sør-Trøndelag, Nord-Trøndelag, Bergen",
    ),
    sp(
      "Nevn en av USAs delstater",
      "California, Texas, Florida, New York | Alaska, Hawaii, Nevada, Washington, Arizona, Colorado, Utah, Illinois, Ohio, Michigan, Georgia | Oregon, Massachusetts, Pennsylvania, Virginia, New Jersey, Louisiana, Tennessee, Minnesota, North Carolina/Nord-Carolina, South Carolina/Sør-Carolina, North Dakota/Nord-Dakota, South Dakota/Sør-Dakota, Montana, Wisconsin, Kentucky, Kansas, Missouri, Alabama, Mississippi, Indiana, Iowa | Idaho, Wyoming, Nebraska, Oklahoma, Arkansas, New Mexico, Maine, Vermont, New Hampshire, Connecticut, Rhode Island, Maryland, Delaware, West Virginia | ",
      { nei: "Washington DC, Puerto Rico" },
    ),
  ),
  dag(
    sp(
      "Nevn en ost",
      "brunost/geitost/gudbrandsdalsost, norvegia, gulost, mozzarella | parmesan/parmigiano, cheddar, brie, camembert, feta/fetaost, jarlsberg, gouda, kremost | blåmuggost/blåost, edamer, ricotta, mascarpone, halloumi, gorgonzola, pultost, cottage cheese/cottage, roquefort, emmentaler, manchego, gamalost, prim, ridder, snøfrisk, nøkkelost, grana padano | pecorino, gruyère, raclette, taleggio, burrata, stilton, havarti, comté, appenzeller, port salut, chèvre, kraftkar, castello, philadelphia, mysost, fløtemysost | époisses, reblochon, munster, vacherin, provolone, scamorza, fontina, asiago, limburger, tilsiter, västerbottensost, wensleydale, red leicester, mimolette, bocconcini, stracciatella, paneer, queso fresco, kefalotyri, graviera",
    ),
    sp("Nevn et land i Sør-Amerika", "#BR, #AR, #CL | #PE, #CO, #VE | #UY, #EC, #BO | #PY | @kontinent:Sør-Amerika"),
    sp(
      "Nevn en hunderase",
      "labrador/labrador retriever, golden retriever/golden, puddel, schæfer/schæferhund | border collie, husky/siberian husky, chihuahua, dachshund/dachs, beagle, bulldog/engelsk bulldog, fransk bulldog, rottweiler, dobermann, mops, cocker spaniel, elghund/norsk elghund | dalmatiner, boxer, grand danois, sankt bernhard/st. bernhard, berner sennen/berner sennenhund, shih tzu, yorkshireterrier/yorkie, jack russell/jack russell terrier, pomeranian, cavalier/cavalier king charles spaniel, greyhound, collie, samojed, alaskan malamute/malamute, akita, shiba/shiba inu, bichon frisé, newfoundlandshund/newfoundland, buhund/norsk buhund, lundehund/norsk lundehund | weimaraner, vizsla, whippet, basset/basset hound, blodhund, sheltie/shetland sheepdog, corgi/welsh corgi, australian shepherd, cane corso, staffordshire bullterrier, bullterrier, pitbull, malteser, papillon, pekingeser, lhasa apso, chow chow, shar pei, airedaleterrier, west highland white terrier/westie, schnauzer, dvergschnauzer, labradoodle, hamiltonstøver, dunker, irsk setter, engelsk setter, gordonsetter, pointer, springer spaniel, finsk lapphund | afghansk mynde, borzoi, saluki, basenji, leonberger, hovawart, briard, puli, komondor, rhodesian ridgeback, dogo argentino, kooikerhondje, lagotto romagnolo, haldenstøver, norrbottenspets, jämthund, laika, eurasier, keeshond, tibetansk mastiff, mastiff, bullmastiff, bedlingtonterrier, irsk ulvehund, skotsk hjortehund, kinesisk nakenhund",
    ),
    sp(
      "Nevn en person i Harry Potter-bøkene",
      "Harry Potter/Harry, Hermine Grang/Hermine/Hermione, Ronny Wiltersen/Ronny/Ron, Voldemort/Lord Voldemort/Tom Venster/Tom Riddle, Albus Humlesnurr/Humlesnurr/Dumbledore | Severus Slur/Slur/Snape, Gygrid/Hagrid, Draco Malfang/Draco/Malfoy, Sirius Svaart/Sirius/Sirius Black, Ginny Wiltersen/Ginny, Nilus Langballe/Nilus/Neville | Dobby, Luna Lunekjær/Luna, Fred Wiltersen/Fred, Petter Pittelpytt/Pittelpytt/Ormehale, Dolly Uffert/Uffert/Umbridge, Minerva McSnurp/McSnurp/McGonagall, Remus Lupus/Lupus/Lupin, Cedric Djervdal/Cedric, Bellatrix, Lucius Malfang/Lucius, Krabbe/Crabbe, Gurgel/Goyle | Hedvig/Hedwig, Arthur Wiltersen, Molly Wiltersen, Percy Wiltersen/Percy, Bill Wiltersen, Charlie Wiltersen, Cho Chang, Viktor Krum/Krum, Fleur Delacour/Fleur, Alastor Bister/Bister, Nymfadora Dult/Dult/Tonks, Petunia Dumling/Petunia, Vernon Dumling/Vernon, Dudleif Dumling/Dudleif/Dudley, Argus Nask/Nask/Filch, Ollivander, Krengel/Quirrell, Lily Potter, James Potter | Nagini, Gellert Grindelwald/Grindelwald, Aberforth, Narcissa, Snilehorn/Slughorn, Seamus Finnigan/Seamus, Dean Thomas, Parvati Patil/Parvati, Hulkende Hulda/Myrtle, Lockhart, Pomfrit/Pomfrey, Fudge, Kingsley, Kreacher, Winky, Fawkes",
    ),
    sp(
      "Nevn en farge",
      "rød, blå, grønn, gul | svart/sort, hvit, oransje, lilla/fiolett, rosa, brun, grå | turkis, beige, gull, sølv, marineblå, lyseblå, mørkeblå, vinrød/burgunder, lime, mintgrønn/mint, olivengrønn/oliven, fersken, korall, lavendel, magenta, cyan, indigo | bordeaux, oker, sennepsgul, petrol, kobber, bronse, kremhvit/krem, elfenben, karmin, purpur, terrakotta, khaki, smaragdgrønn, safirblå, rubinrød, kongeblå, himmelblå, isblå, antrasitt, sjokoladebrun, laksrosa, fuksia | vermilion, cerise, ultramarin, koboltblå, kadmiumgul, cyklamen, chartreuse, taupe, sepia, umbra, mauve, celadon, ecru, sienna, prøyssisk blå",
    ),
    sp(
      "Nevn en amerikansk president",
      "Donald Trump/Trump, Barack Obama/Obama, Joe Biden/Biden, Abraham Lincoln/Lincoln, George Washington/Washington | John F. Kennedy/JFK/Kennedy, George W. Bush/Bush, Bill Clinton/Clinton, Ronald Reagan/Reagan, Richard Nixon/Nixon | Jimmy Carter/Carter, Franklin D. Roosevelt/Roosevelt/FDR, Theodore Roosevelt/Teddy Roosevelt, Thomas Jefferson/Jefferson, George H. W. Bush/Bush senior, Dwight D. Eisenhower/Eisenhower, Harry S. Truman/Truman, Gerald Ford/Ford, Lyndon B. Johnson/LBJ | John Adams/Adams, James Madison/Madison, James Monroe/Monroe, Andrew Jackson/Jackson, Ulysses S. Grant/Grant, Woodrow Wilson/Wilson, Herbert Hoover/Hoover, John Quincy Adams, William McKinley/McKinley, Calvin Coolidge/Coolidge, Warren G. Harding/Harding | Martin Van Buren/Van Buren, William Henry Harrison, John Tyler/Tyler, James K. Polk/Polk, Zachary Taylor/Taylor, Millard Fillmore/Fillmore, Franklin Pierce/Pierce, James Buchanan/Buchanan, Andrew Johnson, Rutherford B. Hayes/Hayes, James A. Garfield/Garfield, Chester A. Arthur/Arthur, Grover Cleveland/Cleveland, Benjamin Harrison, William Howard Taft/Taft",
    ),
  ),
  dag(
    sp(
      "Nevn et bær",
      "jordbær, blåbær, bringebær | tyttebær, multe/molte/multer/moltebær, solbær, rips/rødrips, bjørnebær | stikkelsbær, tranebær, kirsebær, krekling/krøkebær, markjordbær/ville jordbær, hvitrips, blokkebær, rognebær | einebær, aroniabær/aronia, gojibær/goji, nype/nyper, havtorn/tindved, hyllebær, acaibær/acai, drue/druer | steinbær, åkerbær, hagtornbær, berberis, blåhegg, morell",
    ),
    sp("Nevn et land som grenser til Kina", "#RU, #IN | #MN, #KP, #VN, #PK | #NP, #KZ, #MM, #LA, #AF | #BT, #KG, #TJ | @naboer:CN"),
    sp(
      "Nevn en fisk man kan spise",
      "laks, torsk, makrell, sei | sild, ørret, tunfisk/tun, kveite/hellefisk, hyse/kolje, sardin/sardiner, ansjos | steinbit, breiflabb/havtaske, lyr, rødspette, piggvar, sjøtunge, røye, abbor, gjedde, sik, ål, uer, brosme, lange, skrei, hvitting, flyndre | pangasius, tilapia, havabbor, dorade, sverdfisk, mahi-mahi, brisling, lodde, kolmule, blåkveite, skate, rognkjeks, karpe, brasme, gjørs, harr, regnbueørret, berggylt, lysing | pigghå, lomre, smørflyndre, tobis, mort, lake, hestmakrell, ising, skrubbe, sandflyndre, kongefisk",
      { nei: "hval, reke, reker, krabbe, hummer, blåskjell, blekksprut" },
    ),
    sp(
      "Nevn et instrument i et symfoniorkester",
      "fiolin, cello, fløyte, trompet | kontrabass, bratsj, klarinett, obo, fagott, pauker/pauke, harpe, horn/valthorn | trombone, tuba, piccolofløyte/piccolo, triangel, cymbal/cymbaler, stortromme, skarptromme, xylofon, celesta, piano/flygel | engelsk horn/engelskhorn, bassklarinett, kontrafagott, rørklokker, glockenspiel, marimba, vibrafon, tamtam/gongong, kastanjetter, tamburin, orgel, saksofon | wagnertuba, basstrombone, kornett, cembalo, woodblock, piskeslag, kubjelle, vindmaskin, euphonium, altfløyte",
    ),
    sp(
      "Nevn en edelstein eller et smykkestein",
      "diamant, rubin, safir, smaragd | ametyst, perle, topas, opal, jade | granat, turkis, akvamarin, onyks, rav, agat, månestein, rosenkvarts, bergkrystall, lapis lazuli/lapis | peridot, citrin, turmalin, tansanitt, korall, alexandritt, spinell, malakitt, hematitt, karneol, tigerøye, jaspis, obsidian, zirkon, beryll, kvarts | morganitt, labradoritt, larimar, moldavitt, kunzitt, iolitt, sodalitt, krysopras, rodonitt, fluoritt, aventurin, larvikitt, thulitt, kalsedon",
    ),
    sp(
      "Nevn et kortspill",
      "poker, kabal, uno, blackjack/tjueen/21 | vri åtter/vri 8, idiot, løgn/juks/bløff, krig, bridge, casino/kasino, svarteper | amerikaner, femkort, hjerterfri/hjerter, whist, canasta, rummy/gin rummy, texas hold'em, stress, gris, president | baccarat, omaha, cribbage, mau-mau, bismarck, skitgubbe, sjavott, durak | piquet, belote, skat, tarokk, euchre, pinochle, rook, preferans",
    ),
  ),
  dag(
    sp(
      "Nevn noe man kan ha på pizza",
      "ost, skinke, pepperoni, tomatsaus/tomat | løk, paprika, sopp/champignon, kjøttdeig, ananas, kebab, oliven, kylling | salami, mozzarella, bacon, rødløk, mais, jalapeño, hvitløk, basilikum, oregano, ruccola, spinat, tunfisk/tun, reker, egg, chili, pesto | spekeskinke/parmaskinke, feta/fetaost, gorgonzola, parmesan, artisjokk, kapers, ansjos, soltørkede tomater, cherrytomater, pinjekjerner, aubergine, squash, rømme, crème fraîche, chorizo, pulled pork, biff/oksekjøtt, taco, bearnaise, ricotta, burrata, honning, trøffel, salsa | potet, banan, kjøttboller, scampi, laks, blåskjell, nduja, fiken, pære, valnøtter, sjokolade, bresaola, prosciutto, sardiner, kimchi",
    ),
    sp("Nevn et land i Afrika", "#EG, #ZA, #NG, #KE | #MA, #GH, #ET, #SN, #TZ, #DZ, #TN | #UG, #CM, #CI, #MG, #SO, #SD, #LY, #CD, #AO, #RW, #ZW, #ZM, #NA, #BW, #MZ, #ML | #ER, #NE, #TD, #MW, #BJ, #TG, #BF, #GN, #SL, #LR, #GA, #CG, #CF, #SS, #MR, #CV, #MU, #SC, #GM | @kontinent:Afrika"),
    sp(
      "Nevn et kattedyr",
      "løve, tiger, gaupe, leopard/panter/svart panter | gepard, puma/kuguar/fjelløve, jaguar, katt/huskatt, snøleopard | ozelot, serval, karakal, villkatt | manul/pallaskatt, jaguarundi, margay, fiskekatt, sandkatt, oncilla, kodkod, rustkatt, marmorkatt, leopardkatt, gullkatt, skyleopard | liger, tigon, sabeltanntiger/smilodon, jungelkatt, kanadagaupe, rødgaupe, iberiagaupe, geoffroykatt, pampaskatt, svartfotkatt",
    ),
    sp(
      "Nevn en figur fra Donald Duck-bladet",
      "Donald Duck/Donald, Onkel Skrue/Skrue McDuck, Ole, Dole, Doffen | Mikke Mus/Mikke, Langbein, Dolly Duck/Dolly, Bestemor Duck, Fetter Anton/Anton | Petter Smart, Hexia de Trick/Hexia, B-gjengen, Pluto, Klarabella/Klara Ku/Klarabella Ku, Mimmi Mus/Mimmi, Svarte-Petter, Lille Hjelper | Fantonald, Mikkel, Morten, Store Stygge Ulv/Stygge Ulv, Guffen, Max, Rockerduck | Glittrende Goldie/Goldie, Hortensia, Lille Ulv, Brigitta",
    ),
    sp(
      "Nevn en planet i solsystemet",
      "Jorden/Jorda/Tellus/Earth, Mars, Jupiter | Saturn, Venus, Merkur/Mercury | Neptun/Neptune, Uranus | | ",
      { nei: "Pluto, Månen, Sola, Solen" },
    ),
    sp(
      "Nevn et organ i menneskekroppen",
      "hjerte, lunge/lunger, hjerne, lever | nyre/nyrer, mage/magesekk, hud, tarm/tarmer, øye/øyne, øre/ører | bukspyttkjertel/pankreas, nese, milt, galleblære, urinblære/blære, tynntarm, tykktarm, livmor, skjoldbruskkjertel, spiserør, strupe | eggstokk/eggstokker, testikkel/testikler, prostata, binyre/binyrer, hypofyse, blindtarm/appendiks/appendix, penis, skjede/vagina, tolvfingertarm, endetarm, luftrør, tunge, mandler, thymus/brissel | lymfeknute/lymfeknuter, beinmarg/benmarg, epifyse/konglekjertel, hypotalamus, mellomgulv, bronkier, livmorhals, eggleder, urinleder, urinrør, bitestikkel, spyttkjertel/spyttkjertler, ryggmarg, brystkjertel",
    ),
  ),
]
