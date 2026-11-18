import { dag, sp } from "./typer"

// Days 106–110.
export const dager23 = [
  dag(
    sp(
      "Nevn et krydder som ikke er en krydderurt",
      "pepper/sort pepper/svart pepper/kvernet pepper, kanel, paprika/paprikapulver, karri/karripulver, chili/chilipulver | kardemomme, ingefær, nellik/nellikspiker, muskat/muskatnøtt, hvitløkspulver/hvitløk, salt, spisskummen/cumin, gurkemeie/kurkuma, safran, vanilje, allehånde/piment, karve | kajennepepper/cayennepepper, hvit pepper, rosépepper/rosa pepper, grønn pepper, sennepsfrø, korianderfrø, fennikelfrø, anis, stjerneanis, einebær, muskatblomme, garam masala, chiliflak, røkt paprika, løkpulver, sitronpepper, hvitløkssalt, femkrydder/kinesisk femkrydder, tandoorikrydder, tacokrydder, sesamfrø, valmuefrø | bukkehornkløver/fenugreek, svartkarve/nigellafrø, lakrisrot, pepperrot, wasabi, sichuanpepper/szechuanpepper, galangal, ras el hanout, berbere, baharat, sumak, ajwain, asafoetida | langpepper, kubebepper, tonkabønne, paradiskorn, mahleb, amchur, chaat masala",
      { nei: "basilikum, oregano, timian, persille, rosmarin, dill, gressløk, mynte, salvie, estragon" },
    ),
    sp("Nevn et land som grenser til Pakistan", "#IN, #AF | #IR, #CN | | | @naboer:PK", { nei: "Bangladesh, Nepal, Tadsjikistan" }),
    sp(
      "Nevn en norsk elv",
      "Glomma/Glåma, Akerselva, Numedalslågen, Drammenselva, Tana/Tanaelva, Altaelva | Gudbrandsdalslågen/Lågen, Otra, Gaula, Namsen, Orkla, Skienselva, Lærdalselva, Begna, Mandalselva, Nidelva, Driva, Rauma, Målselva, Reisaelva, Vefsna, Pasvikelva, Alna, Lysakerelva, Sandvikselva, Suldalslågen | Trysilelva/Klarälven, Femundselva, Rena, Vorma, Hallingdalselva, Simoa, Etna, Dokka, Otta, Sjoa, Bøvra, Atna, Folla, Stjørdalselva, Verdalselva, Surna, Stryneelva, Eira, Aurlandselva, Flåmselva, Vosso, Bjerkreimselva, Sira, Kvina, Tovdalselva, Barduelva, Lakselva, Karasjohka/Karasjokka, Neidenelva, Jakobselva/Grense Jakobselv | Eio, Opo, Etneelva, Ogna, Figgjo, Audna, Storelva, Gjerstadelva, Hunnselva, Lena, Mesna, Gausa, Saltdalselva, Beiarelva, Ranelva, Røssåga, Anárjohka, Kautokeinoelva, Repparfjordelva, Stabburselva, Børselva, Komagelva, Tista, Mosseelva, Hobølelva, Valldøla, Aura | Tokkeelva, Bøelva, Måna",
      { nei: "Donau, Rhinen, Themsen, Göta älv, Torneälven, Dalälven" },
    ),
    sp(
      "Nevn en Coldplay-låt",
      "Yellow, Viva la Vida, Fix You, The Scientist, Paradise | Clocks, A Sky Full of Stars, Hymn for the Weekend, Adventure of a Lifetime, Something Just Like This, My Universe, Higher Power, Speed of Sound, In My Place, Every Teardrop Is a Waterfall/Every Teardrop, Trouble | Magic, Shiver, Talk, Violet Hill, Lovers in Japan, Lost!, Princess of China, Charlie Brown, Up&Up, Orphans, Christmas Lights, Don't Panic, Midnight, Ink, True Love, Atlas, Strawberry Swing, Life in Technicolor, Politik, God Put a Smile upon Your Face, Feelslikeimfallinginlove, We Pray, Hurts Like Heaven, Us Against the World, Everglow, Birds, Amazing Day | Daddy, Champion of the World, Army of One, Major Minus, Square One, What If, White Shadows, Swallowed in the Sea, Fly On, A Message, Low, Twisted Logic, X&Y, Til Kingdom Come, The Hardest Part, Cemeteries of London, Yes, Death and All His Friends, 42, Moon Music, Humankind, Let Somebody Go, Coloratura, Biutyful, Always in My Head, Another's Arms, Oceans, Daylight, Green Eyes, Warning Sign, A Whisper, Amsterdam, Spies, Sparks, Parachutes, High Speed, We Never Change, Everything's Not Lost | Church, Trouble in Town, Arabesque, Guns, Cry Cry Cry, Old Friends, Up in Flames, Don't Let It Break Your Heart, Up with the Birds, Jupiter, Good Feelings, All My Love, Aeterna, One World",
    ),
    sp(
      "Nevn noe som er rødt",
      "jordbær, tomat, blod, hjerte, rose, brannbil | kirsebær, bringebær, eple/rødt eple, ketchup, rød paprika/paprika, chili, rips, tyttebær, rødt lys/trafikklys, stoppskilt, julenisse/nisser, nisselue, leppestift, marihøne, rødt kort, Mars, fluesopp, rødvin | rødbete, postkasse, valmue, tulipan, vannmelon, granateple, Rødhette, Elmo, Lynet McQueen, Ferrari, Rudolfs nese/Rudolf, rubin, Coca-Cola, kinn | lava, glo/glør, hummer, krabbe, rødstrupe, murstein, telefonkiosk, dobbeltdekker/London-buss, Kvikk Lunsj, rød løper, Spider-Man, Mario, ild/flammer | solnedgang, korall, Rødt, kardinal, sportsbil",
      { nei: "blå, grønn, gul, rosa" },
    ),
    sp(
      "Nevn et romfartøy, en romstasjon eller et romteleskop",
      "ISS/Den internasjonale romstasjonen/romstasjonen, Hubble/Hubble-teleskopet, Apollo 11, Sputnik 1/Sputnik | James Webb/James Webb-teleskopet/JWST, Mir, Voyager 1, Voyager 2, Challenger, Columbia, Discovery, Atlantis, Endeavour, romfergen/Space Shuttle, Apollo 13, Vostok 1, Curiosity, Perseverance, Saturn V, Falcon 9, Crew Dragon/Dragon, Starship | Tiangong, Skylab, Salyut, Sojuz/Soyuz, Apollo/Apollo-programmet, Gemini, Mercury, Pioneer 10, Pioneer 11, New Horizons, Cassini/Cassini-Huygens, Juno, Galileo, Rosetta, Philae, Kepler, Spitzer, Chandra, Gaia, Sojourner, Spirit, Opportunity, Ingenuity, Viking 1, Viking 2, Parker Solar Probe, Sputnik 2, Artemis/Artemis I, Orion, Ariane/Ariane 5, Chang'e, Lunokhod | Explorer 1, Mariner 4, Venera, Magellan, Dawn, OSIRIS-REx, DART, Lucy, JUICE, BepiColombo, Psyche, Europa Clipper, Starliner, Shenzhou, Buran, Hayabusa, Chandrayaan, Mangalyaan, Yutu, InSight, Mars Pathfinder, SOHO, Planck, Herschel, Euclid, TESS, Luna 9 | Eagle, Enterprise, Freedom 7, Friendship 7, Vostok 6, Luna 2, Mars Express, Venus Express, Giotto, Ulysses, Stardust, Deep Impact, Kibo, Columbus, Zarja/Zarya",
    ),
  ),
  dag(
    sp(
      "Nevn en type snacks",
      "potetgull/chips, popcorn, nøtter, ostepop | nachos/tortillachips, salte pinner/saltstenger, peanøtter/saltede peanøtter, Cheez Doodles, Smash, Bugles, Pringles, Doritos, kringle/saltkringler/pretzel | cashewnøtt, mandler, pistasjnøtter, Cheetos, Lay's, Kims, Maarud, Sørlandschips, Taffel, rislapper/riskaker, maischips, linsechips, grønnsakschips/rotfruktchips, kjeks/salte kjeks/crackers, ostekjeks, dipp | Polly, Ritz, TUC, rekechips/krupuk, solsikkekjerner, gresskarkjerner, edamame, oliven, kikertsnacks, tangsnacks/nori-snacks | biltong, beef jerky/tørket kjøtt, svor/svinesvor/fleskesvor, papadum/papadam, wasabinøtter/wasabierter, popchips",
    ),
    sp("Nevn et land som begynner på J", "#JP, #JM | #JO | #YE | | @start:J"),
    sp(
      "Nevn noe du finner i skogen",
      "tre/trær, mose, kongler, sopp, stein/steiner | blåbær, tyttebær, gran, furu, bjørk, maurtue, maur, elg, rådyr, ekorn, rev, fugl/fugler, stubbe/trestubbe, lyng, bregne, sti/skogsti, bekk, gress, løv/blader, kvister/pinner, røtter, kantarell, fluesopp, barnåler/nåler, hare | grevling, bjørn, ulv, gaupe, hjort, villsvin, hakkespett/spett, ugle, tiur/storfugl, orrfugl, jerpe, kråke, skogsmus/mus, flått, mygg, edderkopp/edderkopper, snegle/snegler, meitemark/mark, sommerfugl, frosk, hoggorm, padde, bringebær, markjordbær/jordbær, einer, rogn, osp, eik, lav, kvae, bark, gapahuk, bålplass, tømmerstokker/tømmer, hogstfelt, myr, tjern, skogsvei, lysløype, skiløype | bjørnebær, hasselnøtter, eikenøtter, ved/vedkubbe, vindfall, dyrespor/spor, hytte/skogshytte, orienteringspost/o-post, varde, maurtuer | troll, huldra",
    ),
    sp(
      "Nevn en øvelse i friidrett",
      "100 meter/100 m/hundremeter, høydehopp, lengdehopp, spydkast/spyd, maraton/marathon | 200 meter/200 m, 400 meter/400 m, 800 meter/800 m, 1500 meter/1500 m, 5000 meter/5000 m, 10 000 meter/10 000 m, stavsprang, tresteg, kulestøt/kule, diskos/diskoskast, slegge/sleggekast, hekkeløp/hekk, 110 meter hekk, 400 meter hekk, stafett, 4 x 100 meter, tikamp, sjukamp/syvkamp, hinder/3000 meter hinder | 100 meter hekk, 4 x 400 meter, kappgang/gang, 20 km kappgang, halvmaraton, 3000 meter, femkamp, 60 meter, 60 meter hekk, mile/engelsk mil, terrengløp, gateløp, mixstafett/blandet stafett | lengde uten tilløp, høyde uten tilløp, slengball, liten ball/ballkast, 300 meter, 600 meter, 1000 meter, 2000 meter hinder, vektkast, 35 km kappgang, 50 km kappgang, 10 km/10 kilometer, ultraløp | ",
      { nei: "langrenn, svømming, sykling" },
    ),
    sp(
      "Nevn et håndverksyrke",
      "snekker, tømrer, rørlegger, elektriker, maler | murer, frisør, baker, smed, skomaker, skredder, møbelsnekker, blikkenslager, taktekker, flislegger, glassmester, låsesmed, gullsmed, urmaker, bilmekaniker/mekaniker, sveiser, konditor, kokk, slakter, tapetserer, gulvlegger, steinhugger, keramiker/pottemaker | sølvsmed, salmaker/sadelmaker, bokbinder, glassblåser, båtbygger, forgyller, stukkatør, fotograf, gravør, instrumentmaker, felemaker/fiolinmaker, orgelbygger, kurvmaker, seilmaker, bøkker/tønnemaker, hjulmaker, garver, buntmaker, hattemaker/modist, vever, kunstsmed, hovslager, barberer, florist/blomsterdekoratør, steinsetter/brolegger, stillasbygger, isolatør, ventilasjonsmontør, betongfagarbeider | gartner, kosmetolog, hudpleier, treskjærer, rosemaler, maskinarbeider, platearbeider, industrimekaniker, automatiker, heismontør, kjøttskjærer, pølsemaker, kobbersmed | børstebinder, repslager, tinnstøper, glassmaler, typograf, boktrykker, sjokolademaker",
      { nei: "lege, lærer, advokat, sykepleier" },
    ),
    sp(
      "Nevn et kjent slott eller palass",
      "Slottet/Det kongelige slott, Buckingham Palace, Versailles/Versailles-slottet, Neuschwanstein | Akershus festning/Akershus slott, Windsor Castle/Windsor, Kreml, Den forbudte by, Alhambra, Schönbrunn, Kronborg, Amalienborg, Christiansborg, Drottningholm, Stockholms slott, Oscarshall, Tower of London, Edinburgh Castle, Balmoral, Hofburg, Peterhof, Vinterpalasset/Eremitasjen, Topkapi/Topkapı-palasset | Frederiksborg, Rosenborg, Egeskov, Fredensborg, Gripsholm, Kalmar slott, Uppsala slott, Stiftsgården, Gamlehaugen, Bergenhus festning/Bergenhus, Sandringham, Kensington Palace, Hampton Court, Holyrood/Holyroodhouse, Caernarfon Castle, Warwick Castle, Chambord, Chenonceau, Fontainebleau, Linderhof, Herrenchiemsee, Sanssouci, Charlottenburg, Heidelberg slott, Hohenzollern, Prahaborg/Hradčany, Wawel, Bran/Draculas slott, Peleș, Pena-palasset/Pena, Palacio Real, El Escorial, Dogepalasset/Palazzo Ducale, Palazzo Pitti, Engelsborgen/Castel Sant'Angelo, Caserta, Potala/Potala-palasset, Himeji/Himeji-slottet, Osaka-slottet, Dolmabahçe, Belvedere, Elysée-palasset | Austrått/Austråttborgen, Steinvikholm, Leeds Castle, Stirling Castle, Eilean Donan, Blarney Castle, Malbork/Marienburg, Katarinapalasset, Carcassonne, Gyeongbokgung, Château Frontenac, Hearst Castle, Schwerin slott, Moritzburg, Louvre | Hogwarts, Disney-slottet/Askepotts slott, Vaduz slott, Bled slott, Château d'If",
      { nei: "Colosseum, Eiffeltårnet, Taj Mahal, Det hvite hus" },
    ),
  ),
  dag(
    sp(
      "Nevn en kålvekst",
      "blomkål, brokkoli, hodekål/kål/hvitkål, rosenkål | rødkål, grønnkål, kinakål, kålrot, savoykål, spisskål, pak choi/pak choy, kålrabi/knutekål, romanesco | reddik, nepe, ruccola/rucola, svartkål/palmekål/cavolo nero, broccolini, kinesisk brokkoli/gai lan | sennep/sennepsplante, bladsennep, pepperrot, wasabi, raps, karse, brønnkarse, mizuna | tatsoi, choy sum, rybs, sareptasennep",
      { nei: "spinat, mangold, salat, isbergsalat, purre, selleri" },
    ),
    sp("Nevn et land som grenser til Nord-Makedonia", "#GR, #BG | #AL, #RS | #XK | | @naboer:MK", { nei: "Montenegro, Kroatia, Tyrkia" }),
    sp(
      "Nevn et dyr med mer enn fire bein",
      "edderkopp, maur, bie, flue, krabbe, tusenbein | hummer, reke, kreps, skolopender, skorpion, bille, sommerfugl, mygg, veps/hveps, humle, marihøne, gresshoppe, kakerlakk, termitt, flått, midd, øyenstikker, lus, loppe | insekt, kongekrabbe, taskekrabbe, strandkrabbe, eremittkreps, sjøkreps, languster, krill, tarantell, svart enke, stankelbein, vevkjerring/langbein, møll, skrukketroll | dolkhale/hesteskokrabbe, vannløper, klegg, knott, sikade, siriss, larver, bladlus, veggedyr, vandrende pinne/pinneinsekt, kneler, tege, saksedyr, sølvkre | bjørnedyr/vannbjørn, sjøedderkopp, vannkalv, hoppekreps, trilobitt",
      { nei: "hund, katt, hest, slange, meitemark, snegl" },
    ),
    sp(
      "Nevn en fantasy- eller science fiction-forfatter",
      "J.R.R. Tolkien/Tolkien, J.K. Rowling/Rowling, George R.R. Martin, C.S. Lewis | Terry Pratchett/Pratchett, Isaac Asimov/Asimov, Douglas Adams, Jules Verne/Verne, H.G. Wells, Philip Pullman/Pullman, Neil Gaiman/Gaiman, Stephen King, Frank Herbert, Arthur C. Clarke, Ray Bradbury/Bradbury, Suzanne Collins, Rick Riordan/Riordan, Christopher Paolini/Paolini, Michael Ende, Brandon Sanderson/Sanderson, Philip K. Dick, Mary Shelley, George Orwell/Orwell, Aldous Huxley/Huxley, Ursula K. Le Guin/Ursula Le Guin, Lewis Carroll, Robert Jordan | Siri Pettersen, Tor Åge Bringsværd/Bringsværd, Jon Bing, Margaret Atwood, Orson Scott Card, Andy Weir, Liu Cixin, Robert A. Heinlein/Heinlein, Kurt Vonnegut, William Gibson, Dan Simmons, Robin Hobb, Patrick Rothfuss, Terry Brooks, Raymond E. Feist, Joe Abercrombie, Sarah J. Maas, Leigh Bardugo, Stephenie Meyer, Cassandra Clare, Veronica Roth, Anne McCaffrey, Marion Zimmer Bradley, David Eddings, Terry Goodkind, Robert E. Howard, H.P. Lovecraft/Lovecraft, Edgar Rice Burroughs, Stanisław Lem/Stanislaw Lem, Astrid Lindgren | Iain M. Banks, Larry Niven, Kim Stanley Robinson, N.K. Jemisin, Octavia E. Butler/Octavia Butler, Ted Chiang, James S.A. Corey, Michael Moorcock, Diana Wynne Jones, Cornelia Funke, Eoin Colfer, Rebecca Yarros, Naomi Novik, Jonathan Stroud, Ernest Cline, Lois Lowry, James Dashner, Steven Erikson | Fritz Leiber, Jack Vance, Gene Wolfe, Lois McMaster Bujold, Garth Nix, Tamora Pierce, Brent Weeks, Mark Lawrence, Scott Lynch, V.E. Schwab, Philip Reeve, Jevgenij Zamjatin/Yevgeny Zamyatin, Kazuo Ishiguro, Hugh Howey, Blake Crouch, Patrick Ness, Alastair Reynolds, Peter F. Hamilton, Greg Bear, Glen Cook",
    ),
    sp(
      "Nevn et sted man må ha billett for å komme inn",
      "kino, konsert, teater, fotballkamp, museum | opera/operaen, fly, tog, buss, båt/ferje, dyrepark/dyrehage/zoo, akvarium, fornøyelsespark/tivoli, festival, stadion, badeland/svømmehall/vannpark, sirkus, utstilling/kunstutstilling, Tusenfryd | standup/show/revy, ballett, musikal, ishall/skøytebane, alpinanlegg/skiheis/heis, planetarium, vitensenter, klatrepark, lekeland, trampolinepark, ishockeykamp/hockeykamp, håndballkamp, t-bane/trikk, Disneyland | galleri, slott, bowlinghall, gondol/Fløibanen, Holmenkollen, Nasjonalmuseet, Munchmuseet/Munch, Hurtigruten, messe, Louvre, Eiffeltårnet, Legoland, Liseberg, spa, Bø Sommarland/Sommarland | boksekamp, cruise",
      { nei: "kirke, bibliotek, park, skole, butikk" },
    ),
    sp(
      "Nevn en italiensk fotballklubb",
      "Juventus/Juve, AC Milan/Milan, Inter/Inter Milan/Internazionale, Roma/AS Roma, Napoli | Lazio, Fiorentina, Atalanta, Torino, Sampdoria, Genoa, Parma, Bologna, Udinese | Sassuolo, Cagliari, Lecce, Hellas Verona/Verona, Empoli, Monza, Salernitana, Frosinone, Spezia, Cremonese, Como, Venezia, Pisa, Palermo, Bari, Brescia, Chievo/Chievo Verona, Livorno, Perugia, Reggina, Piacenza, Vicenza/Lanerossi Vicenza, Ascoli, Catania, Siena, Cesena, Pescara, Benevento, Crotone | Carpi, Modena, Reggiana, Ternana, Avellino, Foggia, Cosenza, SPAL, Novara, Pro Vercelli, Ancona, Triestina, Padova, Catanzaro, Mantova | Südtirol, Lucchese, Alessandria, Juve Stabia",
      { nei: "Real Madrid, Barcelona, Bayern München, Porto" },
    ),
  ),
  dag(
    sp(
      "Nevn en rett med lammekjøtt eller sau",
      "fårikål, pinnekjøtt, lammestek, lammelår | lammekoteletter/lammekotelett, smalahove, lammeskank, lammecurry, moussaka, lammekarré/lammerack, rogan josh, lammegryte, lammeburger, fenalår/spekelår, shepherd's pie | lapskaus, kebab/döner, lammefrikassé, kofta, tagine/lammetagine, kleftiko, irsk lammegryte/Irish stew, sodd, lammerull/sauerull, lammekebab/shish kebab | lammepølse, biryani, merguez, haggis, plov, mansaf, lammeribbe, lammesadel, vossakorv | lammetunge, navarin, lammenyrer",
      { nei: "ribbe, svinestek, biff" },
    ),
    sp("Nevn et land som begynner på V", "#VN, #VE | #VA | #VU | | @start:V"),
    sp(
      "Nevn noe du finner på en bondegård som ikke er et dyr",
      "traktor, låve, fjøs, høy | silo, stall, møkk/gjødsel, rundball/høyball, plog, harv, skurtresker/treskeverk, slåmaskin, åker/kornåker, eng, gjerde, melkerobot/melkemaskin, våningshus/hovedhus, stabbur, bonde/bonden, korn, gummistøvler/støvler | tun/gårdsplass, hønsehus, tilhenger/henger, høygaffel/greip, potetåker, gjødselspreder, såmaskin, ballepresse, fôr/kraftfôr, halm, melkespann, melketank, fugleskremsel, beite/beitemark, høyloft, egg, melk | frontlaster, potetopptaker, bøtte, frukthage, drivhus, vedskjul, steingjerde, gårdsbutikk, låvebro, kjerre, hesje, ljå, rive, ull, epletrær | grøft, potetkjeller, smie, separator, smørkjerne",
      { nei: "ku, gris, sau, høne, hest, geit, katt, hund" },
    ),
    sp(
      "Nevn en kjent fotballspiller som ikke er norsk",
      "Lionel Messi/Messi, Cristiano Ronaldo/Ronaldo/CR7, Pelé, Diego Maradona/Maradona, Kylian Mbappé/Mbappé, Neymar | Zinedine Zidane/Zidane, David Beckham/Beckham, Ronaldinho, Zlatan Ibrahimović/Zlatan/Ibrahimović, Mohamed Salah/Salah, Harry Kane/Kane, Robert Lewandowski/Lewandowski, Luka Modrić/Modrić, Johan Cruyff/Cruyff, Franz Beckenbauer/Beckenbauer, Wayne Rooney/Rooney, Kevin De Bruyne/De Bruyne, Thierry Henry/Henry, Steven Gerrard/Gerrard, Jude Bellingham/Bellingham, Lamine Yamal/Yamal, Vinícius Júnior/Vinícius/Vini Jr, Andrés Iniesta/Iniesta, Xavi, Gianluigi Buffon/Buffon, Paolo Maldini/Maldini, Ronaldo Nazário/R9, Kaká, Luis Suárez/Suárez, Sergio Ramos/Ramos, Manuel Neuer/Neuer, Karim Benzema/Benzema, Toni Kroos/Kroos, Virgil van Dijk/van Dijk, Son Heung-min/Son, Antoine Griezmann/Griezmann, Eden Hazard/Hazard, Gareth Bale/Bale, Frank Lampard/Lampard, Paul Pogba/Pogba, Marta, Megan Rapinoe/Rapinoe, Alexia Putellas/Putellas, Aitana Bonmatí/Bonmatí | George Best, Bobby Charlton, Eusébio, Gerd Müller, Thomas Müller, Michel Platini/Platini, Marco van Basten/van Basten, Ruud Gullit/Gullit, Romário, Rivaldo, Roberto Baggio/Baggio, Andrea Pirlo/Pirlo, Francesco Totti/Totti, Alessandro Del Piero/Del Piero, Fabio Cannavaro/Cannavaro, Luís Figo/Figo, Raúl, Fernando Torres/Torres, David Villa, Iker Casillas/Casillas, Peter Schmeichel/Schmeichel, Michael Laudrup/Laudrup, Brian Laudrup, Henrik Larsson, Christian Eriksen/Eriksen, Alan Shearer/Shearer, Gary Lineker/Lineker, Paul Scholes/Scholes, Ryan Giggs/Giggs, Eric Cantona/Cantona, Dennis Bergkamp/Bergkamp, Patrick Vieira/Vieira, Didier Drogba/Drogba, Samuel Eto'o/Eto'o, George Weah/Weah, Sadio Mané/Mané, Bukayo Saka/Saka, Phil Foden/Foden, Cole Palmer/Palmer, Declan Rice, Marcus Rashford/Rashford, Raheem Sterling/Sterling, Pedri, Gavi, Jamal Musiala/Musiala, Florian Wirtz/Wirtz, Ousmane Dembélé/Dembélé, Romelu Lukaku/Lukaku, Thibaut Courtois/Courtois, Rodri, Sam Kerr, Mia Hamm | Alisson, Ederson, Casemiro, Dani Alves, Marcelo, Roberto Carlos, Cafu, Lothar Matthäus/Matthäus, Jürgen Klinsmann/Klinsmann, Oliver Kahn/Kahn, Miroslav Klose/Klose, Philipp Lahm/Lahm, Bastian Schweinsteiger/Schweinsteiger, Arjen Robben/Robben, Wesley Sneijder, Robin van Persie/van Persie, Ruud van Nistelrooy, Edwin van der Sar, Clarence Seedorf, Frank Rijkaard, Lev Jasjin/Lev Yashin, Ferenc Puskás/Puskás, Alfredo Di Stéfano/Di Stéfano, Garrincha, Zico, Sócrates, Gabriel Batistuta/Batistuta, Juan Román Riquelme/Riquelme, Carlos Tevez/Tevez, Sergio Agüero/Agüero, Ángel Di María/Di María, Julián Álvarez, Lautaro Martínez, Diego Forlán/Forlán, Edinson Cavani/Cavani, James Rodríguez, Radamel Falcao/Falcao, Carlos Valderrama/Valderrama, Hristo Stoitsjkov/Stoichkov, Gheorghe Hagi/Hagi, Davor Šuker/Suker, Andrij Sjevtsjenko/Shevchenko, Pavel Nedvěd/Nedvěd, Petr Čech/Čech, Gianfranco Zola/Zola, Kasper Schmeichel, Alexander Isak/Isak, Viktor Gyökeres/Gyökeres, Pernille Harder, Alex Morgan, Abby Wambach, Birgit Prinz, Hope Solo, Lucy Bronze | Park Ji-sung, Hidetoshi Nakata, Christian Pulisic, Landon Donovan, Dejan Kulusevski, Rasmus Højlund, Federico Valverde, Achraf Hakimi, Victor Osimhen, Riyad Mahrez, Yaya Touré, Michael Essien, Jay-Jay Okocha, Roger Milla, Nwankwo Kanu, Khvicha Kvaratskhelia, Fridolina Rolfö, Alessia Russo",
      { nei: "Erling Haaland, Haaland, Martin Ødegaard, Ødegaard, Ole Gunnar Solskjær, Solskjær, John Arne Riise, Ada Hegerberg, Hegerberg" },
    ),
    sp(
      "Nevn et ord som rimer på «bil»",
      "smil, stil, pil, fil, mil | sil, hvil, krokodil, mobil, april, Brasil | profil, Nil, kil, fossil, reptil, stabil, tekstil | senil, steril, labil, fertil, projektil, subtil, automobil, livsstil | lastebil, elbil, brannbil, varebil, servil, volatil",
      { streng: true, nei: "bil, vil, til, ville, spill" },
    ),
    sp(
      "Nevn et sted som nevnes i Bibelen",
      "Betlehem, Jerusalem, Nasaret, Egypt, Edens hage/Eden | Babylon, Jeriko, Galilea, Golgata, Getsemane, Jordanelven/Jordanelva/Jordan, Sinai/Sinaifjellet, Sodoma, Gomorra, Babels tårn, Kanaan, Roma, Damaskus, Ninive, Betania, Kapernaum, Kana, Samaria, Judea, Genesaretsjøen/Galileasjøen, Dødehavet, Oljeberget/Olivenberget, Ararat, Rødehavet/Det røde hav, Sion | Emmaus, Hebron, Betel, Ur, Haran, Gosen, Tyrus, Sidon, Korint, Efesos, Patmos, Moab, Edom, Gilead, Assyria, Persia, Kypros, Kreta, Malta, Antiokia, Tarsus, Filippi, Tessalonika, Galatia, Athen, Areopagos, Joppe/Jaffa, Cæsarea, Siloadammen/Siloa, Betesda, Harmageddon/Megiddo, Karmel/Karmelfjellet, Tabor, Hermon, Gaza, Libanon, Nilen, Eufrat, Tigris | Horeb, Midjan, Ai, Gibeon, Sikem, Kadesj, Beersheba, Rama, Nain, Betsaida, Korasin, Dekapolis, Laodikea, Smyrna, Pergamon, Tyatira, Sardes, Filadelfia, Kolossæ, Lystra, Derbe, Ikonium, Berøa, Troas, Arimatea, Magdala | Gabbata, Idumea, Askalon, Gat, Ekron",
    ),
  ),
  dag(
    sp(
      "Nevn en pai eller terte",
      "eplepai/apple pie, quiche/quiche lorraine, kyllingpai, sitronterte/sitronpai/tarte au citron | pecanpai, gresskarpai/pumpkin pie, blåbærpai/blåbærterte, rabarbrapai, kjøttpai, shepherd's pie, bringebærterte, jordbærterte, sjokoladeterte/sjokoladepai, tarte tatin, kirsebærpai, key lime pie, fruktterte | fiskepai, laksepai, skinkepai, baconpai, spinatpai, brokkolipai, grønnsakspai, mandelterte, pot pie/chicken pot pie, banoffee pie/banoffee, marengspai/lemon meringue pie, pastel de nata/pasteis de nata | steak and kidney pie, mince pie, cottage pie, linzerterte, bakewell tart, crostata, flammkuchen/tarte flambée, spanakopita, empanada, pirog, nøttepai, mississippi mud pie | pastei, frangipaneterte",
      { nei: "eplekake, bløtkake, pizza" },
    ),
    sp("Nevn et land som grenser til Myanmar", "#TH, #CN, #IN | #BD | #LA | | @naboer:MM", { nei: "Vietnam, Kambodsja, Nepal" }),
    sp(
      "Nevn noe som er laget av papir eller papp",
      "bok, avis, eske/pappeske, toalettpapir/dopapir, papirfly | konvolutt, brev, notatbok/skrivebok/kladdebok, pappkrus/papirkopp, tørkepapir/kjøkkenrull, serviett/papirserviett, tegneblokk, kart, plakat, kort/postkort/bursdagskort, kalender, kartong/melkekartong, papirpose/pose | sedler/pengesedler, papptallerken, papirsugerør, origami, frimerke, billett, kvittering, tapet, puslespill, kortstokk/spillkort, pizzaeske, eggekartong, papirlenker, konfetti, brosjyre/flyer/reklame, blad/magasin, tegneserie, kaffefilter, lommetørkle/papirlommetørkle, post-it-lapp/lapp, gavepapir/innpakningspapir | papirlykt, papirhatt/papirkrone, papirmasje/papier-mâché, bokmerke, tepose, sandpapir, vitnemål, etikett, papirvindmølle | drage, diplom, sjekk",
    ),
    sp(
      "Nevn en kjent bjørn fra film, bok eller tegneserie",
      "Ole Brumm/Winnie the Pooh/Brumm, Baloo, Paddington, Bamse | Yogi/Yogi Bear/Jogi, Fozzie/Fozzie Bjørn, Teddy, Lotso, Ted, Po, Rasmus Klump | Iorek Byrnison/Iorek, Lille John, Kenai, Koda, Mishka/Misjka, Rupert/Rupert Bjørn, Care Bears, de tre bjørnene | Smokey Bear, Gummibjørnene/Gummi Bears, Boo Boo | Corduroy, Teddy Ruxpin, Bernard",
      { nei: "Tigergutt, Nasse Nøff, Ior, Kanin" },
    ),
    sp(
      "Nevn en tysk fotballklubb",
      "Bayern München/Bayern/FC Bayern, Borussia Dortmund/Dortmund/BVB, Bayer Leverkusen/Leverkusen, Schalke 04/Schalke/FC Schalke 04 | RB Leipzig/Leipzig, Werder Bremen/Bremen, Hamburger SV/HSV/Hamburg, Borussia Mönchengladbach/Mönchengladbach/Gladbach, VfB Stuttgart/Stuttgart, Eintracht Frankfurt/Frankfurt, VfL Wolfsburg/Wolfsburg, 1. FC Köln/FC Köln/Köln, Hertha BSC/Hertha Berlin/Hertha, Union Berlin/1. FC Union Berlin, SC Freiburg/Freiburg, Mainz 05/1. FSV Mainz 05/Mainz, Hoffenheim/TSG Hoffenheim, FC Augsburg/Augsburg, St. Pauli/FC St. Pauli | 1. FC Kaiserslautern/FC Kaiserslautern/Kaiserslautern, 1. FC Nürnberg/FC Nürnberg/Nürnberg, Hannover 96/Hannover, Fortuna Düsseldorf/Düsseldorf, VfL Bochum/Bochum, Arminia Bielefeld/Bielefeld, Darmstadt 98/SV Darmstadt/Darmstadt, Heidenheim/1. FC Heidenheim, Holstein Kiel, Karlsruher SC/Karlsruhe, MSV Duisburg/Duisburg, Eintracht Braunschweig/Braunschweig, 1860 München/TSV 1860 München, Dynamo Dresden, Hansa Rostock, Energie Cottbus, Greuther Fürth/Fürth, SC Paderborn/Paderborn | FC Ingolstadt/Ingolstadt, Alemannia Aachen/Aachen, Rot-Weiss Essen, Kickers Offenbach, SV Sandhausen, Erzgebirge Aue, 1. FC Magdeburg/Magdeburg, Jahn Regensburg, Wehen Wiesbaden, Preußen Münster, Waldhof Mannheim, Stuttgarter Kickers, Elversberg/SV Elversberg | Tasmania Berlin, Blau-Weiß Berlin, KFC Uerdingen/Uerdingen, Wattenscheid 09, 1. FC Saarbrücken/Saarbrücken, Carl Zeiss Jena, Lokomotive Leipzig",
      { nei: "Red Bull Salzburg, Salzburg, Rapid Wien, Ajax" },
    ),
    sp(
      "Nevn en norsk dal",
      "Gudbrandsdalen, Østerdalen, Hallingdal/Hallingdalen, Setesdal/Setesdalen, Romsdalen/Romsdal | Numedal/Numedalen, Valdres, Sunndalen/Sunndal, Gauldalen/Gauldal, Hemsedal, Saltdalen/Saltdal, Målselvdalen, Bardudalen/Bardu, Orkdalen/Orkdal, Lærdal/Lærdalen, Ottadalen, Verdalen/Verdal, Stjørdalen/Stjørdal, Namdalen, Sirdal | Heidal, Sjodalen, Gausdal, Rendalen, Engerdal, Folldal, Alvdal, Soknedal, Meldal, Surnadal, Innerdalen, Valldalen/Valldal, Jostedalen, Flåmsdalen, Aurlandsdalen, Nærøydalen, Raundalen, Måbødalen, Røldal, Suldal, Fyresdal, Uvdal, Sigdal, Etnedal, Tydal, Reisadalen, Pasvikdalen, Eggedal, Hornindal, Oppdal, Drivdalen, Sokndal, Morgedal, Lyngdal, Mandal, Kvinesdal, Tromsdalen | Todalen, Eikesdalen, Isterdalen, Norddal, Simadalen, Vestfjorddalen, Begnadalen, Atndalen, Dunderlandsdalen, Junkerdalen, Skjomdalen, Signaldalen, Kåfjorddalen, Tanadalen, Budal, Heddal, Åseral | ",
    ),
  ),
]
