import { dag, sp } from "./typer"

// Days 71–75.
export const dager16 = [
  dag(
    sp(
      "Nevn en tysk rett",
      "bratwurst, currywurst, surkål/sauerkraut, schnitzel/wienerschnitzel, pretzel/brezel/bretzel | eisbein, schweinshaxe/svineknoke, sauerbraten, spätzle, käsespätzle, knödel/kloss/klosser, tysk potetsalat/kartoffelsalat, rouladen/rinderrouladen/rulader, schwarzwälderkake/Schwarzwälder Kirschtorte/schwarzwaldkake, berliner/berlinerbolle/Berliner Pfannkuchen, weisswurst, frankfurter/frankfurterpølse, leberkäse, kassler/kasseler, maultaschen, flammkuchen, königsberger klopse, jägerschnitzel, bockwurst | apfelstrudel/strudel, stollen/julestollen, lebkuchen, schweinebraten, reibekuchen/kartoffelpuffer, rotkohl/rødkål, döner/döner kebab | labskaus, rote grütze, bienenstich, käsekuchen, gulaschsuppe, kohlrouladen, himmel und erde, pumpernickel, brötchen, mettwurst, mett/mettbrötchen, eintopf, spargel, kaiserschmarrn | saumagen, linseneintopf, erbsensuppe",
      { nei: "pizza, paella, sushi" },
    ),
    sp(
      "Nevn en by i Nederland",
      "Amsterdam, Rotterdam, Haag/Den Haag/The Hague, Utrecht | Eindhoven, Groningen, Maastricht, Leiden, Delft, Haarlem, Arnhem, Nijmegen, Tilburg, Breda, Almere, Zwolle, Enschede, 's-Hertogenbosch/Den Bosch, Gouda, Edam, Volendam, Alkmaar | Leeuwarden, Apeldoorn, Amersfoort, Dordrecht, Zaandam, Venlo, Hilversum, Schiedam, Vlissingen, Middelburg, Assen, Lelystad, Zandvoort, Deventer, Kampen, Hoorn, Emmen, Heerlen, Roermond, Sittard, Helmond, Oss, Ede, Zeist, Purmerend, Hoofddorp, Amstelveen, Den Helder, Harlingen, Enkhuizen | Giethoorn, Scheveningen, Lisse | Kinderdijk, Monnickendam",
      { nei: "Brussel, Antwerpen, Brugge, Gent, Köln" },
    ),
    sp(
      "Nevn et dyr som legger egg",
      "høne/høns, fugl/fugler, krokodille, skilpadde, slange, fisk | and, gås, struts, pingvin, nebbdyr, maurpiggsvin, frosk, padde, øgle, edderkopp, maur, bie, sommerfugl, insekt/insekter, laks, torsk, sild, kalkun, dinosaur | blekksprut, snegle/snegl, vaktel, due, emu, kiwi, hai, leguan/iguana, kobra, pyton/python, gekko, kameleon, komodovaran, alligator, havskilpadde, sjøstjerne, kråkebolle, krabbe, hummer, reke, mygg, flue, marihøne, kakerlakk, termitt, veps, salamander, kolibri, ørn, ugle, papegøye, kasuar | rokke, stør, kveite, makrell, ål, kongekobra, varan | ",
      { nei: "hval, delfin, katt, hund, ku, hoggorm, guppy, flaggermus" },
    ),
    sp(
      "Nevn et dataspill eller videospill",
      "Minecraft, Fortnite, FIFA/EA Sports FC/EA FC, Super Mario/Mario, Tetris, GTA/Grand Theft Auto/GTA V/GTA 5 | Pokémon, The Legend of Zelda/Zelda, Call of Duty/CoD, Roblox, The Sims/Sims/Sims 4, Pac-Man, Counter-Strike/CS/CS2/CS:GO, League of Legends, World of Warcraft/WoW, Among Us, Candy Crush, Angry Birds, Mario Kart/Mario Kart 8, Sonic, Animal Crossing, Overwatch, Halo, Red Dead Redemption/Red Dead/Red Dead Redemption 2, Skyrim, Fallout, Assassin's Creed, God of War, The Last of Us, Elden Ring, Rocket League, Apex Legends, Valorant, Space Invaders, Donkey Kong, Street Fighter, Mortal Kombat, Tekken, Crash Bandicoot, Wii Sports, Just Dance, Super Smash Bros./Smash Bros, Pokémon Go, Clash of Clans, Subway Surfers | Dota/Dota 2, Spyro, Rayman, Doom, Half-Life, Portal, StarCraft, Diablo, Age of Empires, Civilization, SimCity, Hitman, Battlefield, Need for Speed, Gran Turismo, Forza, Guitar Hero, Kirby, Metroid, Final Fantasy, Kingdom Hearts, Dark Souls, Bloodborne, Cyberpunk 2077, The Witcher/Witcher 3, Baldur's Gate, Mass Effect, Uncharted, Tomb Raider, Resident Evil, Silent Hill, Metal Gear Solid, BioShock, Stardew Valley, Terraria, Hollow Knight, Undertale, Cuphead, Fall Guys, PUBG, Clash Royale, Brawl Stars, Temple Run, Fruit Ninja, Flappy Bird, Genshin Impact, Hogwarts Legacy, Splatoon, Pong, Kabal/Solitaire, Minesweeper/Minerydder, Snake, Worms | Asteroids, Frogger, Lemmings, Prince of Persia, Monkey Island, Myst, The Longest Journey, It Takes Two, Valheim, Hearthstone, Wordle | Anarchy Online, Age of Conan, Celeste",
      { nei: "Monopol, sjakk, Yatzy, Ludo" },
    ),
    sp(
      "Nevn noe du finner på et bad",
      "toalett/do, dusj, vask/servant, speil, badekar | tannbørste, tannkrem, såpe, sjampo, balsam, håndkle, dopapir/toalettpapir, hårføner/føner, kam, hårbørste/børste, barberhøvel/høvel, deodorant/deo, krem/fuktighetskrem, sminke, badematte, dusjforheng, dusjsåpe/dusjgel, vaskemaskin, varmekabler/gulvvarme, vifte/avtrekk, baderomsskap/speilskap/skap, søppelbøtte, dobørste/toalettbørste, plaster, medisiner/medisinskap, badevekt/vekt, bomullspinner/q-tips, tanntråd, munnvann, neglesaks/neglefil, pinsett, rettetang/krølltang, hårstrikk, parfyme, skittentøykurv/skittentøyskurv, kran/blandebatteri, sluk, fliser | badebombe, gummiand/badeand, badekåpe/morgenkåpe, bind/tamponger, tørkestativ, solkrem, hårspray/hårvoks/hårgelé, luftfrisker, toalettrens | bleier, potte, dopapirholder, håndklestativ/knagg, lampe, bidet, badstue, boblebad, klorin | stikkontakt, kontaktlinser",
    ),
    sp(
      "Nevn en muskel i kroppen",
      "biceps, triceps, hjertet/hjertemuskel, magemuskler/magemuskel/sixpack/rectus abdominis, setemuskel/rumpemuskel/gluteus/gluteus maximus | lårmuskel/quadriceps/firehodet lårmuskel, hamstring, leggmuskel/gastrocnemius, deltamuskel/deltoid/skuldermuskel, brystmuskel/pectoralis, brede ryggmuskel/latissimus/lats, kappemuskel/trapezius, mellomgulvet/diafragma, tungen/tunge, skrå magemuskler/obliques, kjevemuskel/tyggemuskel/masseter, lukkemuskel/sfinkter | hoftebøyer/iliopsoas, adduktorer, rotatormansjett/rotatorcuff, ryggstrekker/erector spinae, underarmsmuskler/underarmsmuskel, bekkenbunnen/bekkenbunnsmuskler, soleus, sartorius/skreddermuskel | supraspinatus, infraspinatus, rhomboideus, serratus/sagtannmuskel, tverrgående magemuskel/transversus abdominis, brachialis, brachioradialis, piriformis, tibialis anterior, gluteus medius, pannemuskel/frontalis, stapedius, tinningmuskel/temporalis, interkostalmuskler/mellomribbeinsmuskler, abduktorer, sternocleidomastoideus | teres major, peroneus, gluteus minimus, levator scapulae, platysma, orbicularis oculi, buccinator",
      { nei: "akillessenen, achillessenen, sene, lunge, lever" },
    ),
  ),
  dag(
    sp(
      "Nevn noe man kan sylte eller legge ned",
      "agurk/sylteagurk/pickles, rødbeter, løk/syltet løk, sild/sursild, jordbær | rødløk, rødkål, surkål/kål, gulrøtter, chili/jalapeño, paprika, hvitløk, ingefær, egg, blåbær, tyttebær, bringebær, plommer, pærer, epler, kirsebær, rabarbra, oliven, kapers, sopp, blomkål, squash, gresskar, tomat, multer, solbær, rips, stikkelsbær | nyper, sitron, mango, kimchi, aprikos, fersken, appelsin/marmelade, asier, perleløk, bønner/brekkbønner, reddik, sjalottløk | gravlaks, rakfisk, fennikel, druer | valnøtter",
    ),
    sp("Nevn et land som grenser til Latvia", "#EE, #LT, #RU | #BY | | | @naboer:LV", { nei: "Finland, Polen, Ukraina, Sverige" }),
    sp(
      "Nevn et dyr som er svart og hvitt",
      "panda/kjempepanda, sebra, pingvin/keiserpingvin, spekkhogger/orka, skjære | ku/holsteinku, dalmatiner, grevling, skunk/stinkdyr, lunde | alke, lomvi, ærfugl, tjeld, border collie, husky, katt, stork, svartbak, svarthvit fluesnapper, linerle, flaggspett, tapir | hvitkinngås, kvinand, havsule, colobusape/guereza, vari, honninggrevling | Commersons delfin",
      { nei: "isbjørn, kråke, ravn, rødpanda, tiger" },
    ),
    sp(
      "Nevn en kjent detektiv fra bok, film eller TV",
      "Sherlock Holmes/Sherlock/Holmes, Hercule Poirot/Poirot, Miss Marple/Marple, Harry Hole, Varg Veum | Columbo, Kurt Wallander/Wallander, Inspektør Clouseau/Clouseau, Philip Marlowe, Sam Spade, Nancy Drew, Kalle Blomkvist/Mesterdetektiven Blomkvist, Dr. Watson/Watson, Inspector Gadget/Inspektør Gadget, Jessica Fletcher, Dirty Harry/Harry Callahan, Adrian Monk/Monk, William Wisting/Wisting, Hanne Wilhelmsen, Konrad Sejer/Sejer, Cato Isaksen, Carl Mørck, Sarah Lund, Saga Norén, Maigret/Kommissær Maigret, Inspector Morse/Morse, Inspektør Barnaby/Barnaby, Vera Stanhope/Vera, Benoit Blanc | Scooby-Doo/Scooby, Mikael Blomkvist, Ellery Queen, Lewis, Jack Frost/Inspektør Frost, Taggart, John Rebus/Rebus, Van Veeteren, Martin Beck, Erik Winter, Joona Linna, Montalbano, Guido Brunetti/Brunetti, Lord Peter Wimsey, Pater Brown/Father Brown, Nero Wolfe, Perry Mason, Mike Hammer, Kinsey Millhone, Lincoln Rhyme, Harry Bosch/Bosch, Alex Cross, Precious Ramotswe, Cormoran Strike, Enola Holmes, Jane Tennison, Starsky og Hutch, Magnum, Kojak, Derrick, LasseMaja, Luther | Tintin, Jack Reacher, Kay Scarpetta, Gil Grissom, Jim Rockford/Rockford, Lestrade, Detective Pikachu, Ace Ventura, Hardyguttene/Hardy Boys, De fem, Kommissær Rex/Rex, Veronica Mars, Crockett og Tubbs | Frank Frølich, Gunnarstranda, Mia Krüger",
      { nei: "Agatha Christie, Arthur Conan Doyle, Jo Nesbø, James Bond" },
    ),
    sp(
      "Nevn et populært sydenmål for nordmenn",
      "Gran Canaria, Kanariøyene, Mallorca, Kreta, #TH, Tenerife, #ES | Alicante, Torrevieja, Costa del Sol, Malaga, Marbella, Benidorm, Alanya, Antalya, #TR, Rhodos, #CY, Algarve, #PT, Phuket, Krabi, Dubai, #IT, #GR, Lanzarote, Fuerteventura, La Palma, Ibiza, Menorca, Kos, Korfu, Chania, Santorini, Albir, Alfaz del Pi/l'Alfàs del Pi, Fuengirola, Playa del Inglés, Maspalomas, Las Palmas, Puerto Rico, Palma | #HR, Split, Dubrovnik, #BG, Sunny Beach, Madeira, #CV, #EG, Hurghada, Sharm el-Sheikh, Bali, Florida, Mexico/Cancún, Karibia, #LK, #VN, #MV, Zanzibar, #TN, #MA, #MT, Barcelona, Nice, Side, Bodrum, Marmaris, Fethiye, Mykonos, Larnaca, Ayia Napa, Pafos/Paphos, Pattaya, Hua Hin, Khao Lak, Koh Lanta, Koh Samui, Bangkok, Playa de las Américas, Los Cristianos, Costa Adeje, Puerto de la Cruz, Puerto de Mogán/Mogán, Sitges | #GM, Miami, Goa, #MU, #SC, Agadir, Lindos, Faliraki, Chalkidiki, Parga, Lefkas, Zakynthos, Samos, Naxos, Paros, Sardinia, Sicilia, Gardasjøen, Toscana, Rimini, Rivieraen/Côte d'Azur, Lisboa, Albufeira, Nerja, Torremolinos, Estepona, Altea, Calpe, Denia, Salou, Lloret de Mar, Alcúdia, Magaluf, Kemer, Belek, Protaras, #AE, Ao Nang | Gran Alacant, Orihuela Costa, La Zenia, Playa Flamenca, Ciudad Quesada, Jávea, Cala d'Or, Puerto Pollensa, Funchal, Lagos",
      { nei: "Norge, Svalbard, Island, Lofoten, Sverige" },
    ),
    sp(
      "Nevn en by i India",
      "Mumbai/Bombay, Delhi/New Delhi/Ny-Delhi, Kolkata/Calcutta/Kalkutta, Agra | Bangalore/Bengaluru, Chennai/Madras, Hyderabad, Jaipur, Varanasi/Benares, Pune, Ahmedabad, Amritsar | Goa, Lucknow, Kanpur, Surat, Chandigarh, Kochi/Cochin, Mysore/Mysuru, Udaipur, Jodhpur, Darjeeling, Shimla, Rishikesh, Srinagar, Bhopal, Indore, Patna, Nagpur, Visakhapatnam, Thiruvananthapuram/Trivandrum, Coimbatore, Madurai, Puducherry/Pondicherry, Leh, Haridwar, Gurugram/Gurgaon, Noida, Jaisalmer | Pushkar, Bodh Gaya, Khajuraho, Panaji/Panjim, Dharamsala, Manali, Ooty, Prayagraj/Allahabad, Kozhikode/Calicut, Bhubaneswar, Guwahati, Shillong, Gangtok, Ranchi, Raipur, Vadodara/Baroda, Rajkot, Nashik, Aurangabad, Vijayawada, Mangaluru/Mangalore, Ludhiana, Jalandhar, Meerut, Dehradun, Bikaner, Ajmer, Mathura, Vrindavan, Ayodhya, Kanyakumari | Hampi",
      { nei: "Karachi, Lahore, Islamabad, Dhaka, Kathmandu, Katmandu, Colombo" },
    ),
  ),
  dag(
    sp(
      "Nevn en del av et hus",
      "tak, vegg, dør, vindu, gulv | pipe/skorstein, grunnmur/mur, kjeller, loft, trapp, takrenne/renne, veranda, terrasse, balkong, garasje, takstein, møne, vinduskarm/karm, takvindu, gang/inngangsparti, entré, rom, kjøkken, bad, stue, soverom, vaskerom, peis, dørhåndtak/håndtak, ringeklokke/dørklokke, fasade, kledning/panel, isolasjon, bjelke/bjelker | sperrer/takstoler, sokkel, terskel/dørterskel, hems, kott/bod, krypkjeller, fundament, rekkverk/gelender, ytterdør/inngangsdør, vinterhage/glassveranda | postkasse, gesims, takfot, vindskier, stendere, lister/listverk, ark, kvist, karnapp, platting, varmepumpe, sikringsskap/sikringer, ventil/ventilasjon, sluk, snøfanger, lynavleder, antenne/parabol, solcellepanel/solceller | ",
    ),
    sp("Nevn et land som ekvator går gjennom", "#BR, #EC | #ID, #KE, #CO | #CD, #UG, #GA, #SO | #CG, #ST, #KI | #MV", {
      nei: "Ekvatorial-Guinea, Peru, Venezuela, Tanzania, Nigeria, Kamerun, Malaysia, Singapore",
    }),
    sp(
      "Nevn et dyr som lever i ørkenen",
      "kamel, skorpion, slange, fennek/ørkenrev, øgle | dromedar, klapperslange, ørkenrotte/ørkenmus/gerbil, springmus/jerboa, kengururotte, gribb, sjakal, hyene, prærieulv/coyote, oryx/oryxantilope, addax, gaselle/dorkasgaselle, ørkenskilpadde, tornet djevel/moloch, gilaøgle, varan/ørkenvaran, gekko, roadrunner, surikat | sandkatt, karakal, dingo, struts, baktrisk kamel, tarantell, ørkengresshoppe/vandregresshoppe/gresshoppe, skarabé/tordivel | emu, kenguru, villesel, ørkenhare/jackrabbit, ørkenpiggsvin, puma, pekari/javelina, sidewinder, hornhoggorm/ørkenhoggorm, alveugle | tykkhornsau/bighorn, sandboa",
      { nei: "isbjørn, pingvin, sel, elg" },
    ),
    sp(
      "Nevn en norsk håndballspiller, nå eller før",
      "Sander Sagosen/Sagosen, Nora Mørk, Stine Oftedal/Stine Bredal Oftedal/Oftedal, Camilla Herrem/Herrem, Henny Reistad/Reistad | Heidi Løke, Gro Hammerseng/Hammerseng, Katrine Lunde, Kari Aalvik Grimsbø/Grimsbø, Magnus Abelvik Rød, Harald Reinkind/Reinkind, Kristian Bjørnsen, Bjarte Myrhol/Myrhol, Torbjørn Bergerud/Bergerud, Kjetil Strand, Frank Løke, Ole Erevik/Erevik, Linn-Kristin Riegelhuth Koren/Linn-Kristin Riegelhuth, Silje Solberg, Veronica Kristiansen, Kristine Lunde-Borgersen, Cecilie Leganger/Leganger, Mia Hundvin, Trine Haltvik, Marit Breivik, Christian Berge | Thorir Hergeirsson, Glenn Solberg, Steinar Ege, Kjersti Grini, Tonje Larsen, Ida Alstad, Marit Malm Frafjord, Kristine Breistøl, Emilie Hegh Arntzen, Kari Brattset Dale, Vilde Ingstad, Sanna Solberg-Isaksen, Stine Skogrand, Marta Tomac, Amanda Kurtović, Malin Aune, Thea Mørk, Karoline Dyhre Breivang, Else-Marthe Sørlie Lybekk, Tonje Nøstvold, Gøril Snorroeggen, Susann Goksør Bjerkrheim, Håvard Tvedten, Erlend Mamelund, Espen Lie Hansen, Magnus Jøndal, Kevin Gulliksen, Gøran Søgard Johannessen, Eivind Tangen, Kent Robin Tønnesen, Kristian Kjelling, Børge Lund, Frode Hagen | Ragnhild Aamodt, August Pedersen, Tobias Grøndahl, Joakim Hykkerud, Sindre Heldal, Stig Rasch, Johnny Jensen, Rune Erland, Ole Gustav Gjekstad | ",
      { nei: "Mikkel Hansen, Niklas Landin, Ivano Balić, Steffen Weinhold" },
    ),
    sp(
      "Nevn noe man kan samle på",
      "frimerker, mynter, fotballkort, pokémonkort, steiner | klistremerker/glansbilder, skjell, servietter, Donald-blader/tegneserier, Lego, plater/LP-plater/vinyl, sedler, kapsler/korke/flaskekorker, postkort, bøker, dukke, lekebil/modellbiler/biler, bamse/kosedyr, pins/buttons, nøkkelringer, autografer, viskelær, magneter/kjøleskapsmagneter, snøkuler, fingerbøl, kunst/malerier, antikviteter, klokker/ur, joggesko/sneakers/sko, vesker, Funko Pop/Funko, figurer, Kinderegg-figurer/Kinderegg, Barbie, suvenirer | billetter, fjær, sommerfugl/insekter, fossiler, mineraler, vin, pant | fyrstikkesker, telefonkort, blader/løv, whisky, armbånd, porselen/keramikk, tinnsoldater, Pez-dispensere, gummiender, parfymeflasker, kokebøker | bonuspoeng",
    ),
    sp(
      "Nevn en militær grad",
      "general, sersjant/sergeant, kaptein/captain, major, løytnant/lieutenant, admiral | menig, korporal/corporal, oberst/colonel, fenrik, oberstløytnant, brigader, kommandør, generalmajor, generalløytnant, viseadmiral, kontreadmiral, feltmarskalk/marskalk | visekorporal, kommandørkaptein, orlogskaptein, kvartermester, flaggkommandør, rittmester, premierløytnant, sekondløytnant, oversersjant, stabssersjant | kommandersersjant, generalissimus, storadmiral, kadett | kornett",
      { nei: "soldat, offiser, befal, konge, sjef, politimester" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du kan ha på hamburgeren",
      "ost, salat, tomat, løk, ketchup, bacon | sylteagurk/agurk/pickles, majones/majo, sennep, hamburgerdressing/burgerdressing/dressing, rødløk, stekt løk/sprøstekt løk/karamellisert løk, avokado, guacamole, jalapeños/jalapeño, chili, chilimajones/chilimajo, aioli/hvitløksdressing, grillsaus/BBQ-saus/barbecuesaus, egg/speilegg, sopp/sjampinjong, ananas, coleslaw/kålsalat, cheddar, isbergsalat | rødbeter, blåmuggost, mozzarella, brie, paprika, rucola, relish, sriracha, salsa, pulled pork, kimchi, chipotle, ranch, hvitløk | rømme, trøffelmajones, pommes frites | peanøttsmør, foie gras, honning, hash brown",
    ),
    sp("Nevn et land som grenser til Montenegro", "#AL, #HR, #RS | #BA | #XK | | @naboer:ME", { nei: "Slovenia, Hellas, Nord-Makedonia, Bulgaria, Italia" }),
    sp(
      "Nevn et dyr som er større enn et menneske",
      "elefant, hval, giraff, hest, elg, flodhest | ku/okse, neshorn/nesehorn, isbjørn, bjørn/brunbjørn/grizzly, krokodille, hai/hvithai, kamel, bison, spekkhogger, blåhval, hvalhai, tiger, løve | struts, gorilla, elefantsel, hvalross, hjort, moskus/moskusokse, yak, vannbøffel/bøffel, sebra, dinosaur, mammut | delfin, sjøku/manat/dugong, reinsdyr, villsvin, kafferbøffel, gnu, esel, muldyr, okapi, tapir, anakonda, pyton, kjempeblekksprut, klumpfisk/solfisk, kveite, kjempeskilpadde, lærskilpadde | stør, lama",
      { nei: "katt, gaupe, rev, ulv" },
    ),
    sp(
      "Nevn en figur fra Ole Brumm",
      "Ole Brumm/Brumm/Winnie the Pooh/Pooh, Nasse Nøff/Nasse/Piglet, Tigergutt/Tigger, Ior/Eeyore | Kristoffer Robin/Christopher Robin, Kanin/Rabbit, Ugla/Uglen/Owl, Kanga/Kengu, Ru/Roo/Lille Ru | Heffalump/heffalumper | Woozle, Gopher, Lumpy | Kessie, Darby",
      { nei: "Mikke Mus, Bambi, Baloo, Paddington" },
    ),
    sp(
      "Nevn et trafikkskilt",
      "stoppskilt/stopp, vikeplikt, fartsgrense, forkjørsvei, gangfelt/fotgjengerovergang | innkjøring forbudt, parkering forbudt, stans forbudt, elgfare/elg, rundkjøring, envei/enveiskjørt vei, motorvei, forbikjøring forbudt, kjøring forbudt, blindvei, gang- og sykkelvei/sykkelvei, skolevei/barn, farlig sving/sving, veiarbeid/vegarbeid, parkering/parkeringsplass, fartskamera/automatisk trafikkontroll/ATK | gatetun, fartsdump/fartshump, rasfare/steinsprang, glatt kjørebane/glatt vei, veikryss/vegkryss/kryss, trafikklys/lysregulert kryss, kollektivfelt/bussfelt, tunnel, planovergang/jernbaneovergang, bomstasjon/bom, fotgjengere, rasteplass, omkjøring, motortrafikkvei, tettsted, u-sving forbudt | innsnevret kjørebane, reinsdyr/rein, hjort, kø, påbudt kjøreretning, påbudt sykkelvei, kjettingpåbud, ferjekai/ferje, bensinstasjon, sykehus, toalett, turistvei/severdighet, opphør av fartsgrense, høydebegrensning, venstresving forbudt, høyresving forbudt, bratt bakke/stigning, steinsprut/løs grus, sidevind, kyr/storfe, skiløpere, taxi/drosje | breddebegrensning, lavtflyvende fly",
    ),
    sp(
      "Nevn en bok av Stephen King",
      "Det/It, Shining/The Shining, Carrie, Misery, Pet Sematary/Dyrekirkegården | Den grønne mila/The Green Mile, The Body/Stand by Me, Rita Hayworth and Shawshank Redemption/Shawshank, The Stand, Cujo, Christine, Salem's Lot, The Dead Zone/Dødssonen, Firestarter, Doctor Sleep, 11.22.63, Under the Dome, Det mørke tårnet/The Dark Tower, The Gunslinger/Revolvermannen, Tåken/The Mist | Insomnia, Dolores Claiborne, Gerald's Game, The Outsider, The Institute, Billy Summers, Holly, Fairy Tale, Later, Mr. Mercedes, Finders Keepers, End of Watch, Joyland, Duma Key, Lisey's Story, Cell, Bag of Bones, Dreamcatcher, Hearts in Atlantis, The Girl Who Loved Tom Gordon, Rose Madder, Needful Things, The Tommyknockers, The Eyes of the Dragon, Thinner, The Long Walk, The Running Man, Rage, Roadwork, The Talisman, Black House, Night Shift, Skeleton Crew, Different Seasons, Four Past Midnight, Everything's Eventual, Full Dark No Stars, Revival, Sleeping Beauties, Elevation, If It Bleeds, 1922, Apt Pupil, Never Flinch, You Like It Darker | The Colorado Kid, Blaze, From a Buick 8, Desperation, The Regulators, Gwendy's Button Box, Children of the Corn, The Langoliers, Secret Window, On Writing | The Lawnmower Man, Trucks, Danse Macabre, Riding the Bullet",
      { nei: "Dracula, Frankenstein, Twilight" },
    ),
  ),
  dag(
    sp(
      "Nevn en koreansk rett",
      "kimchi, bibimbap, bulgogi, koreansk BBQ/korean BBQ/K-BBQ | tteokbokki, kimbap/gimbap, japchae, samgyeopsal, koreansk fried chicken/korean fried chicken, ramyeon/ramyun, kimchi jjigae, sundubu jjigae/sundubu, galbi/kalbi, dakgalbi, bossam, naengmyeon, jajangmyeon, mandu, pajeon/haemul pajeon, hotteok, bingsu/patbingsu, samgyetang, yangnyeom chicken/yangnyeom | budae jjigae, doenjang jjigae, seolleongtang, galbitang, gamjatang, haejangguk, jeon, gyeran-jjim, banchan, kalguksu, kimchi bokkeumbap/kimchi fried rice | bungeoppang, tteokguk, sundae, eomuk/odeng, jokbal | sannakji, dosirak, kongguksu",
      { nei: "sushi, pad thai, ramen, dim sum" },
    ),
    sp("Nevn et land som begynner på D", "#DK | #DO, #AE | #CD, #DJ | #CF, #DM | @start:D", { nei: "Tyskland, Deutschland, Dubai" }),
    sp(
      "Nevn en naturkatastrofe",
      "jordskjelv, tsunami/flodbølge, vulkanutbrudd/vulkan, orkan/hurricane, flom | snøskred/lavine, jordskred/jordras, kvikkleireskred/leirskred, steinras/steinsprang, tornado/virvelstorm, tyfon, syklon, skogbrann, tørke, storm/uvær, hetebølge, sandstorm, haglstorm/hagl, isstorm, snøstorm, lynnedslag/lyn, ekstremvær, kuldebølge | meteornedslag/asteroide/meteoritt, fjellskred, stormflo, skybrudd/styrtregn/ekstremnedbør | sørpeskred, monsun, gresshoppesverm, epidemi/pandemi, hungersnød, solstorm | ørkenspredning, erosjon, istid",
      { nei: "krig, terror" },
    ),
    sp(
      "Nevn en kjent heks eller trollmann fra bok eller film",
      "Harry Potter, Gandalf, Merlin, Albus Humlesnurr/Humlesnurr/Dumbledore, Hermine Grang/Hermine/Hermione, Voldemort/Lord Voldemort | Saruman, Den onde heksa fra vest/Heksa fra vest/Wicked Witch of the West, Glinda, Elphaba, Den hvite heksa/Jadis, Ronny Wiltersen/Ronny/Ron Weasley, Severus Slur/Slur/Snape, Minerva McSnurp/McSnurp/McGonagall, Doctor Strange/Dr. Strange | Den lille heksa/Lille Heksa, Bibi Blocksberg, Kiki, Sabrina, Yennefer, Morgana/Morgan le Fay, Kirke/Circe, Baba Jaga, heksa i Hans og Grete, Trollmannen fra Oz, Scarlet Witch/Wanda Maximoff, Bellatrix Lestrange/Bellatrix, Draco Malfoy/Draco Malfang/Draco, Grindelwald, Sirius Svaart/Sirius Black, Gygrid/Hagrid, Magica/Magica de Spell | Rincewind, Granny Weatherwax, Medea, Malefika/Maleficent, Ursula, Madam Mim, Prospero, Jafar, Winifred Sanderson/Sanderson-søstrene, Newt Scamander, Lucius Malfoy, Ginny Wiltersen/Ginny, Neville Langballe/Neville, Mikke som trollmannens læregutt/Trollmannens læregutt, Trollkarlen | Ged, Raistlin, Zatanna, Yen Sid",
      { nei: "Frodo, Aragorn, Legolas" },
    ),
    sp(
      "Nevn noe du finner i kjøleskapet",
      "melk, smør, ost, egg, juice/appelsinjuice, pålegg | yoghurt, syltetøy, leverpostei, skinke, salami, kaviar, majones, ketchup, sennep, rømme, fløte, brus, øl, vann, grønnsaker, agurk, paprika, tomat, salat, gulrøtter, frukt, rester/middagsrester/matrester, kjøttdeig, kylling, fisk, laks, pølser, margarin, brunost | sjokolade, vin/hvitvin, kefir/kulturmelk, cottage cheese, kesam, saft, smoothie, dressing, pesto, oliven, sylteagurk, rødbeter, lyset/lys, bacon, reker, potetsalat, hummus, gjær, kake/bløtkake, pudding, matpakke | saus, medisiner/insulin, hylle/hyller, grønnsaksskuff, fryser, deig, gelé, rekesalat, coleslaw | ",
    ),
    sp(
      "Nevn en hovedstad i en av USAs delstater",
      "Boston, Atlanta, Austin, Sacramento, Denver | Phoenix, Honolulu, Nashville, Salt Lake City, Indianapolis, Albany, Juneau, Columbus, Oklahoma City, Tallahassee | Springfield, Richmond, Raleigh, Madison, Santa Fe, Baton Rouge, Little Rock, Saint Paul/St. Paul, Providence, Hartford, Carson City, Lincoln, Annapolis, Des Moines, Montgomery, Jackson | Dover, Boise, Topeka, Frankfort, Augusta, Lansing, Jefferson City, Helena, Concord, Trenton, Bismarck, Salem, Harrisburg, Columbia, Pierre, Montpelier, Olympia, Charleston, Cheyenne | ",
      {
        nei: "New York, Los Angeles, Chicago, Seattle, Miami, Houston, Las Vegas, San Francisco, Washington, Philadelphia, Detroit, New Orleans, Dallas, Portland",
      },
    ),
  ),
]
