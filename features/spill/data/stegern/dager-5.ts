import { dag, sp } from "./typer"

// Days 16–20.
export const dager5 = [
  dag(
    sp(
      "Nevn en kake",
      "sjokoladekake, bløtkake, eplekake, gulrotkake | ostekake, kransekake, brownies, sukkerbrød, rullekake, prinsesskake/marsipankake, suksessterte, toscakake/tosca, kvæfjordkake/verdens beste | napoleonskake, fyrstekake, budapestrull/budapestkake, sachertorte, schwarzwalderkake/svartskogkake, red velvet, mandelkake, sitronkake, banankake, kladdkake, blåbærkake, rabarbrakake, marengskake, pavlova, krokanbunn, kardemommekake, julekake | othellokake, mazarin/mazarinkake, trøffelkake, daimkake, snickerskake, operakake, dobos/dobostorte, tres leches, baumkuchen, fruktkake, kaffekake, langpannekake, brødkake, pound cake, angel food cake, cupcake/cupcakes, muffins | pischinger, esterházy-kake, kyiv-kake, medovik, prinsregentkake, simnel cake, battenberg, lamington, pastel de nata, bienenstich, linzertorte, gugelhupf, panforte, castella",
    ),
    sp("Nevn et land som grenser til Brasil", "#AR, #UY, #PY | #CO, #VE, #PE, #BO | #GY, #SR | | #FR, @naboer:BR"),
    sp(
      "Nevn en gnager",
      "mus, rotte, ekorn, marsvin | hamster, bever, lemen, hulepinnsvin, chinchilla, ørkenrotte/gerbil, degu | murmeldyr, præriehund, jordekorn, sjusover, flygeekorn, kapybara/flodsvin, mara, aguti, nutria/beverrotte, bisamrotte/moskusrotte, vånd, markmus, skogmus, husmus, brunrotte, svartrotte, hasselmus, klatremus | springmus/jerboa, nakenrotte/nakenmulldyr, kengururotte, lommerotte/gopher, bambusrotte, paka, viskasja/viscacha, blindmus, mulldyr, hamsterarter, dverghamster, dvergmus, buskrotte, risrotte, vandrerotte, bomullsrotte| piggmus, lemming, stekelsvin",
      { nei: "kanin, hare, pinnsvin, piggsvin, spissmus, muldvarp, flaggermus, opossum" },
    ),
    sp(
      "Nevn en Beatles-låt",
      "Yesterday, Hey Jude, Let It Be, Yellow Submarine, Help! | All You Need Is Love, Here Comes the Sun, Come Together, Twist and Shout, A Hard Day's Night, Penny Lane, Strawberry Fields Forever, I Want to Hold Your Hand, She Loves You, Eleanor Rigby, Love Me Do | Can't Buy Me Love, Something, Lucy in the Sky with Diamonds, Ob-La-Di Ob-La-Da, Get Back, The Long and Winding Road, Michelle, Norwegian Wood, In My Life, Blackbird, While My Guitar Gently Weeps, Day Tripper, Ticket to Ride, Paperback Writer, Drive My Car, With a Little Help from My Friends, Sgt. Pepper's Lonely Hearts Club Band, A Day in the Life, All My Loving, Please Please Me | Revolution, Helter Skelter, Back in the U.S.S.R., Across the Universe, Here There and Everywhere, Nowhere Man, Girl, We Can Work It Out, I Saw Her Standing There, From Me to You, Eight Days a Week, I Feel Fine, Hello Goodbye, Lady Madonna, Taxman, Got to Get You into My Life, Good Day Sunshine, Octopus's Garden, Maxwell's Silver Hammer, Golden Slumbers, Carry That Weight, The End, Dear Prudence, I Am the Walrus, Magical Mystery Tour, The Fool on the Hill, Rain, Don't Let Me Down, The Ballad of John and Yoko | Tomorrow Never Knows, Rocky Raccoon, Julia, Martha My Dear, Glass Onion, Mother Nature's Son, Honey Pie, Savoy Truffle, Piggies, Birthday, Yer Blues, Cry Baby Cry, Sexy Sadie, Happiness Is a Warm Gun, Because, Sun King, Mean Mr. Mustard, Polythene Pam, She Came In Through the Bathroom Window, You Never Give Me Your Money, I Want You, Oh! Darling, Her Majesty, Dig a Pony, I've Got a Feeling, One After 909, Two of Us, For You Blue, I Me Mine, Free as a Bird, Real Love, Now and Then",
    ),
    sp(
      "Nevn en geometrisk form",
      "sirkel, trekant, firkant, kvadrat | rektangel, sekskant, femkant, oval, kule, terning/kube, stjerne, hjerte | romb, trapes, parallellogram, åttekant, sylinder, kjegle, pyramide, ellipse, halvsirkel, prisme | sjukant/syvkant, nikant, tikant, tolvkant, tetraeder, oktaeder, dodekaeder, ikosaeder, torus, ellipsoide, kvartsirkel, halvmåne, kors, deltoide/drage, rett prisme, kvadratisk pyramide | pentagram, heksagram, annulus/sirkelring, sirkelsektor, sirkelsegment, reuleaux-trekant, möbiusbånd, kardioide, hyperboloide, paraboloide",
    ),
    sp(
      "Nevn en verdensmester i Formel 1",
      "Lewis Hamilton/Hamilton, Michael Schumacher/Schumacher, Max Verstappen/Verstappen, Ayrton Senna/Senna | Sebastian Vettel/Vettel, Fernando Alonso/Alonso, Kimi Räikkönen/Räikkönen/Raikkonen, Niki Lauda/Lauda, Alain Prost/Prost, Mika Häkkinen/Häkkinen/Hakkinen, Nico Rosberg/Rosberg | Nigel Mansell/Mansell, Juan Manuel Fangio/Fangio, Jenson Button/Button, Damon Hill, Jacques Villeneuve/Villeneuve, Nelson Piquet/Piquet, James Hunt/Hunt, Jackie Stewart/Stewart, Emerson Fittipaldi/Fittipaldi, Lando Norris/Norris | Graham Hill, Jim Clark/Clark, Jack Brabham/Brabham, Alberto Ascari/Ascari, Jochen Rindt/Rindt, Mario Andretti/Andretti, Jody Scheckter/Scheckter, Alan Jones, Keke Rosberg, John Surtees/Surtees, Denny Hulme/Hulme, Phil Hill, Mike Hawthorn/Hawthorn | Giuseppe Farina/Nino Farina/Farina",
      { nei: "Charles Leclerc, Leclerc, Oscar Piastri, Piastri, Gilles Villeneuve, Stirling Moss, Moss" },
    ),
  ),
  dag(
    sp(
      "Nevn noe man kan ha på brødskiva",
      "ost, skinke, leverpostei, syltetøy | brunost, salami, smør, makrell i tomat, egg, agurk, tomat, servelat, sjokoladepålegg/Nugatti/Nutella, peanøttsmør, kaviar | majones, rekesalat, italiensk salat, røkelaks/laks, avokado, banan, honning, kalkun, roastbiff, sardiner, sylte, rullepølse, hummus, prim, kokt skinke | fenalår, spekeskinke, fårepølse, eggesalat, tunfisk, sild, kremost, smøreost, skinkesalat, paprika, salat, løk, sennep, mysost, gomme, pultost, ansjos, pålegssjokolade, rømme | pesto, tapenade, chutney, marmelade, eplemos, morrpølse, lammerull, okserull, kalverull, krabbe, baconost, reker, karbonade",
    ),
    sp("Nevn et land som begynner på M", "#MX, #MA | #MT, #MY, #MD, #MN | #MG, #ML, #MZ, #MC, #MM, #MV | #MR, #MU, #MW, #ME | @start:M"),
    sp(
      "Nevn et husdyr på en gård",
      "ku, gris, sau, høne/høns, hest | geit, kalv, okse, lam, gås, and, kalkun, kylling | kanin, katt, hund, esel, lama, alpakka, ponni, hane, reinsdyr, kje | vannbøffel/bøffel, kamel, muldyr/mulesel, perlehøne, vaktel, struts, due, bie/bier, jak/yak, emu | mink, rev, fasan, påfugl, angorakanin",
    ),
    sp(
      "Nevn en figur fra Ringenes herre",
      "Frodo/Frodo Lommelun, Gandalf, Gollum/Sméagol, Aragorn, Legolas | Sam/Samvis/Sam Gamgod, Gimli, Bilbo/Bilbo Lommelun, Sauron, Saruman, Boromir, Pippin, Merry | Arwen, Galadriel, Elrond, Éowyn, Théoden, Faramir, Treskjegg/Treebeard, Ormetunge/Gríma/Wormtongue, Denethor, Heksekongen/Nazgûl/Ringåndene, Tom Bombadil, Éomer, Balrog, Celeborn, Lurtz, Shelob | Radagast, Glorfindel, Haldir, Isildur, Elendil, Gil-galad, Bard, Thorin, Smaug, Beorn, Fatty Bolger, Barliman Butterbur/Barliman, Rosie, Gamling, Háma, Grishnákh, Uglúk, Gorbag, Shagrat, Azog, Bolg, Thranduil, Glóin, Balin, Dwalin, Kíli, Fíli, Bombur, Dáin, Shadowfax | Círdan, Fëanor, Morgoth/Melkor, Lúthien, Beren, Túrin, Húrin, Ungoliant, Eärendil, Goldberry, Gamle Pil/Old Man Willow, Lobelia, Gaffer, Bifur, Bofur, Dori, Nori, Ori, Óin",
    ),
    sp(
      "Nevn et værfenomen",
      "regn, snø, sol/solskinn, vind, tåke | storm, torden, lyn, hagl, sludd, skyer/overskyet | orkan, tornado, regnbue, nordlys, frost, rim, yr/duskregn, tordenvær, hetebølge, tørke, kuling, snøstorm, underkjølt regn, dugg | monsun, tyfon, syklon, sandstorm, skypumpe, fønvind/føhn, halo, glattis/is, kaldfront, varmfront, lavtrykk, høytrykk, skodde, isslag, haglbyge, regnbyge, snøbyge, vindkast/kastevind | kulelyn, snøfokk, rimfrost, bisol, vindhose, støvvirvel, sankt elmsild/St. Elmsild, polarlavtrykk/polart lavtrykk, inversjon, morgenrøde, aftenrøde, lysende nattskyer, perlemorskyer, regnbuetåke",
    ),
    sp(
      "Nevn en Pokémon fra første generasjon (nr. 1–151)",
      "Pikachu, Charizard, Bulbasaur, Squirtle, Charmander, Mewtwo | Mew, Eevee, Jigglypuff, Snorlax, Psyduck, Meowth, Gengar, Gyarados, Magikarp, Blastoise, Venusaur, Pidgey, Rattata, Caterpie, Onix, Ditto, Vulpix, Geodude, Butterfree, Raichu | Charmeleon, Wartortle, Ivysaur, Metapod, Weedle, Kakuna, Beedrill, Pidgeotto, Pidgeot, Raticate, Ekans, Arbok, Sandshrew, Clefairy, Ninetales, Zubat, Oddish, Diglett, Dugtrio, Persian, Mankey, Growlithe, Arcanine, Poliwag, Abra, Kadabra, Alakazam, Machop, Machamp, Ponyta, Slowpoke, Magnemite, Gastly, Haunter, Cubone, Hitmonlee, Hitmonchan, Koffing, Chansey, Mr. Mime, Scyther, Jynx, Lapras, Vaporeon, Jolteon, Flareon, Articuno, Zapdos, Moltres, Dratini, Dragonite, Golem, Electrode, Voltorb | Spearow, Fearow, Sandslash, Nidoran, Nidorina, Nidoqueen, Nidorino, Nidoking, Clefable, Wigglytuff, Golbat, Gloom, Vileplume, Paras, Parasect, Venonat, Venomoth, Golduck, Primeape, Poliwhirl, Poliwrath, Machoke, Bellsprout, Weepinbell, Victreebel, Tentacool, Tentacruel, Graveler, Rapidash, Slowbro, Magneton, Farfetch'd, Doduo, Dodrio, Seel, Dewgong, Grimer, Muk, Shellder, Cloyster, Drowzee, Hypno, Krabby, Kingler, Exeggcute, Exeggutor, Marowak, Lickitung, Weezing, Rhyhorn, Rhydon, Tangela, Kangaskhan, Horsea, Seadra, Goldeen, Seaking, Staryu, Starmie, Electabuzz, Magmar, Pinsir, Tauros, Porygon, Omanyte, Omastar, Kabuto, Kabutops, Aerodactyl, Dragonair | ",
    ),
  ),
  dag(
    sp(
      "Nevn et skalldyr eller bløtdyr man kan spise",
      "reker, krabbe, hummer, blåskjell | kongekrabbe, østers, kamskjell, sjøkreps/scampi/langustine, blekksprut, kreps | hjerteskjell, sandskjell, knivskjell, strandsnegl, kalmar, akkar, sepia, languster, snøkrabbe, taskekrabbe, kråkebolle, tigerreke, kongereke | teppeskjell, oskjell, hestereke, dypvannsreke, abalone/øreskjell, krill, sjøpølse, vinbergsnegl/escargot, trollhummer, kuskjell, havsnegl | albueskjell, eremittkreps, pæreskjell, venusskjell, sjøtroll, conch",
      { nei: "torsk, laks, tunfisk, sild" },
    ),
    sp("Nevn et land som grenser til Spania", "#PT, #FR | #AD | #MA | | @naboer:ES"),
    sp(
      "Nevn en fugl som ikke kan fly",
      "pingvin, struts, emu, kiwi | dronte/dodo, kasuar, nandu | kakapo, moa, geirfugl, keiserpingvin, kongepingvin | takahe, weka, galapagosskarv/flygeløs skarv, elefantfugl, adeliepingvin, eselpingvin/gentoopingvin, humboldtpingvin, brillepingvin, magellanpingvin | inaccessiblerikse, aucklandand",
      { nei: "høne, kylling, kalkun, påfugl, rype" },
    ),
    sp(
      "Nevn en Disney-tegnefilm (ikke Pixar)",
      "Løvenes konge/The Lion King, Frost/Frozen, Snøhvit og de syv dvergene/Snøhvit/Snow White, Askepott/Cinderella, Aladdin, Den lille havfruen/The Little Mermaid | Skjønnheten og udyret/Beauty and the Beast, Bambi, Dumbo, Pinocchio, Peter Pan, Jungelboken/The Jungle Book, Tornerose/Sleeping Beauty, Mulan, Pocahontas, Tarzan, Herkules/Hercules, Lady og Landstrykeren/Lady and the Tramp, 101 dalmatinere, Robin Hood, Aristokattene/The Aristocats, To på rømmen/Rapunzel/Tangled, Vaiana/Moana, Zootropolis/Zootopia, Encanto, Big Hero 6, Frost 2/Frozen 2 | Bernard og Bianca/The Rescuers, Sverdet i steinen/The Sword in the Stone, Prinsessen og frosken/The Princess and the Frog, Lilo og Stitch/Lilo & Stitch | Keiserens nye stil/The Emperor's New Groove, Ringeren i Notre Dame/The Hunchback of Notre Dame, Atlantis, Skatteplaneten/Treasure Planet, Brother Bear, Bolt, Wreck-It Ralph, Raya og den siste dragen/Raya, Wish, Fantasia, Oliver og vennene/Oliver & Company, Dinosaur, Alice i Eventyrland/Alice in Wonderland | Fox and the Hound, The Black Cauldron, Meet the Robinsons, Chicken Little, Home on the Range, Bernard og Bianca i Australia/The Rescuers Down Under, Basil/The Great Mouse Detective, Saludos Amigos, The Three Caballeros, Make Mine Music, Fun and Fancy Free, Melody Time, Winnie the Pooh/Ole Brumm, Strange World, Mufasa",
    ),
    sp("Nevn en kroppsdel med tre bokstaver", "arm, fot, øye, øre | kne, hår, ben | lår, hud, hæl | ræv | ", { streng: true, nei: "tå, nese, bein, munn, hals" }),
    sp("Nevn en hovedstad i Afrika", "$EG, $KE, $ZA | $NG, $MA, $ET, $GH, $SN, $TN, $DZ | $UG, $TZ, $SO, $SD, $ZW, $AO, $CD, $RW, $LY, $ML, $MG | @hovedstad:Afrika | "),
  ),
  dag(
    sp(
      "Nevn en sitrusfrukt",
      "sitron, lime, appelsin, grapefrukt/grape | mandarin, klementin, pomelo, blodappelsin | kumquat, bergamott, satsuma, tangerin, yuzu | sukadesitron/cedrat, kaffirlime, fingerlime, sudachi, ugli, kalamansi, tangelo, minneola | chinotto, kabosu, dekopon, pomerans/bitterappelsin, sevillaappelsin",
    ),
    sp("Nevn et land i EU", "#DE, #FR, #SE, #DK, #FI | #ES, #IT, #NL, #PL, #BE, #AT, #PT, #GR, #IE | #CZ, #HU, #RO, #BG, #HR, #EE, #LV, #LT | #SK, #SI, #LU, #MT, #CY | ", { nei: "Norge, Storbritannia, Sveits, Island, Tyrkia, Ukraina, Serbia" }),
    sp(
      "Nevn et kjent byggverk i verden",
      "Eiffeltårnet, Frihetsgudinnen, Den kinesiske mur/Kinesiske mur, Taj Mahal, pyramidene/pyramidene i Giza | Big Ben, Colosseum, Burj Khalifa, Det skjeve tårnet i Pisa/Pisatårnet, Empire State Building, Operahuset i Sydney/Sydney Opera House, Sagrada Família, Golden Gate Bridge/Golden Gate, Kreml, Peterskirken, Akropolis/Parthenon | Notre-Dame, Det hvite hus, Buckingham Palace, Tower Bridge, London Eye, Brandenburger Tor, Neuschwanstein, Machu Picchu, Petra, Angkor Wat, Kristusstatuen, Triumfbuen, Louvre, Westminster Abbey, One World Trade Center, CN Tower, Petronas Towers, The Shard, Atomium, Alhambra, Hagia Sophia, Den blå moské, Den forbudte by, Stonehenge, Sfinksen, Chichén Itzá | Versailles, Sacré-Cœur, Pantheon, Trevifontenen, Rialtobroen, Dogepalasset, Markuskirken, Firenzedomen/Duomo, Kölnerdomen, Riksdagsbygningen/Reichstag, Karlsbroen, Burj al Arab, Marina Bay Sands, Shanghai Tower, Taipei 101, Tokyo Skytree, Tokyotårnet, Space Needle, Gateway Arch, Chrysler Building, Flatiron Building, Guggenheim, Hooverdammen, Tower of London, St. Paul's Cathedral, Edinburgh Castle, Westminsterpalasset, Operahuset i Oslo/Operaen, Nidarosdomen, Holmenkollbakken | Potala, Borobudur, Shwedagon, Fernsehturm, The Gherkin, Lotustempelet, Mont-Saint-Michel, Prambanan, Abu Simbel, Karnak, Persepolis, Meteora, Bagan, Tikal, Teotihuacán, Moai/Påskeøya-statuene",
    ),
    sp(
      "Nevn et norsk politisk parti",
      "Arbeiderpartiet/Ap/Det norske Arbeiderparti, Høyre, Fremskrittspartiet/FrP | Senterpartiet/Sp, SV/Sosialistisk Venstreparti, Rødt, KrF/Kristelig Folkeparti, Venstre, MDG/Miljøpartiet De Grønne | Pasientfokus, Industri- og Næringspartiet/INP, Konservativt, Liberalistene, Demokratene, Pensjonistpartiet, Norgesdemokratene, Partiet De Kristne, Kystpartiet | NKP/Norges Kommunistiske Parti, Rød Valgallianse/RV, Piratpartiet, Helsepartiet, Alliansen, Bondepartiet, Sosialistisk Folkeparti/SF | Kristent Samlingsparti, Det Liberale Folkepartiet, Frisinnede Venstre, Samfunnspartiet, Folkeaksjonen Nei til mer bompenger/FNB",
    ),
    sp(
      "Nevn en norsk avis",
      "VG/Verdens Gang, Aftenposten, Dagbladet, Bergens Tidende/BT | Adresseavisen/Adressa, Dagens Næringsliv/DN, Stavanger Aftenblad/Aftenbladet, Klassekampen, Morgenbladet, Nettavisen, Fædrelandsvennen | Vårt Land, Dagsavisen, Nationen, Finansavisen, Romerikes Blad, Drammens Tidende, Fredriksstad Blad, Sunnmørsposten, Nordlys, Avisa Nordland, iTromsø, Tønsbergs Blad, Sandefjords Blad, Varden, Telemarksavisa, Oppland Arbeiderblad, Hamar Arbeiderblad, Gudbrandsdølen Dagningen, Glåmdalen, Østlendingen, Agderposten, Haugesunds Avis, Bergensavisen/BA, Trønder-Avisa, Budstikka/Asker og Bærums Budstikke, Dagen | Romsdals Budstikke, Firda, Sogn Avis, Harstad Tidende, Lofotposten, Finnmarken, Finnmark Dagblad, Altaposten, Ságat, Avvir, Moss Avis, Sarpsborg Arbeiderblad, Halden Arbeiderblad, Smaalenenes Avis, Laagendalsposten, Ringerikes Blad, Jærbladet, Dalane Tidende, Grimstad Adressetidende, Avisa Valdres, Hallingdølen, Gjengangeren, Østlandets Blad, Indre Akershus Blad, Namdalsavisa, Steinkjer-Avisa, Innherred, Helgelands Blad, Rana Blad, Brønnøysunds Avis, Bladet Vesterålen, Hadeland, Varingen, Ullensaker Blad, Avisa Oslo, Ny Tid, E24 | Agenda Magasin, Minerva, Subjekt, Fjordenes Tidende, Lindesnes Avis, Bygdeposten, Raumnes, Eidsvoll Ullensaker Blad, Akershus Amtstidende, Strilen, Askøyværingen, Sydvesten, Bømlo-Nytt, Grenda, Hordaland Folkeblad, Kvinnheringen, Hardanger Folkeblad, Vestnytt",
    ),
    sp(
      "Nevn et primtall under 100",
      "2/to, 3/tre, 5/fem, 7/sju/syv | 11/elleve, 13/tretten, 17/sytten | 19/nitten, 23/tjuetre/treogtjue, 29/tjueni/niogtjue, 31/trettien/enogtretti, 37/trettisju/trettisyv/syvogtretti | 41/førtien/enogførti, 43/førtitre/treogførti, 47/førtisju/førtisyv/syvogførti, 53/femtitre/treogfemti, 59/femtini/niogfemti, 61/sekstien/enogseksti | 67/sekstisju/sekstisyv/syvogseksti, 71/syttien/enogsytti, 73/syttitre/treogsytti, 79/syttini/niogsytti, 83/åttitre/treogåtti, 89/åttini/niogåtti, 97/nittisju/nittisyv/syvognitti",
      { streng: true },
    ),
  ),
  dag(
    sp(
      "Nevn et kjøttstykke",
      "indrefilet, entrecôte, ytrefilet, kotelett/koteletter | ribbe, mørbrad, nakke/svinenakke, bog, lårstek, kjøttdeig, høyrygg, flatbiff | rundstek, mellomlårstek, innanlår, ytrelår, bryst, flanke, tykkstek, skank, oksehale, skinke, lammelår, lammecarré/carré, spareribs/ribs, bankebiff, t-bone, ribeye/rib-eye | tomahawk, picanha, porterhouse, tri-tip, brisket, short ribs, sirloin, flat iron, onglet/hanger steak, flanksteak, skirt steak, tournedos, chateaubriand, filet mignon, tunge, svinebog, lammebog, lammenakke, hamburgerrygg, svinekam | ossobuco, chuck, denver steak, presa, secreto, pluma, coppa, guanciale, pancetta, eye of round",
    ),
    sp("Nevn et land som grenser til Ungarn", "#AT, #RO | #SK, #HR, #RS, #UA | #SI | | @naboer:HU"),
    sp(
      "Nevn en dinosaur",
      "Tyrannosaurus/T-rex/Tyrannosaurus rex, Triceratops, Stegosaurus, Brachiosaurus, Velociraptor | Diplodocus, Brontosaurus, Ankylosaurus, Spinosaurus, Allosaurus, Iguanodon, Parasaurolophus | Apatosaurus, Pachycephalosaurus, Archaeopteryx, Dilophosaurus, Carnotaurus, Giganotosaurus, Gallimimus, Compsognathus, Deinonychus, Argentinosaurus, Therizinosaurus, Oviraptor, Protoceratops, Edmontosaurus, Maiasaura, Megalosaurus | Utahraptor, Baryonyx, Ceratosaurus, Corythosaurus, Styracosaurus, Kentrosaurus, Plateosaurus, Coelophysis, Herrerasaurus, Eoraptor, Microraptor, Troodon, Albertosaurus, Tarbosaurus, Suchomimus, Euoplocephalus, Lambeosaurus, Hadrosaurus, Psittacosaurus, Amargasaurus, Camarasaurus, Mamenchisaurus | Saltasaurus, Dreadnoughtus, Patagotitan, Sinosauropteryx, Yutyrannus, Mapusaurus, Acrocanthosaurus, Torosaurus, Centrosaurus, Pachyrhinosaurus, Chasmosaurus, Gigantoraptor, Deinocheirus, Ornithomimus, Struthiomimus, Majungasaurus, Cryolophosaurus, Nigersaurus, Sauroposeidon, Supersaurus, Barosaurus, Scelidosaurus, Heterodontosaurus, Leaellynasaura, Muttaburrasaurus, Minmi, Ouranosaurus, Tenontosaurus, Dryosaurus, Thescelosaurus, Daspletosaurus, Nodosaurus",
      { nei: "Pteranodon, Pterodactyl, Mosasaurus, Plesiosaurus, Ichthyosaurus, Dimetrodon, mammut" },
    ),
    sp(
      "Nevn et kjent maleri",
      "Mona Lisa, Skrik/Skriket, Stjernenatt/Stjernenatten/The Starry Night | Piken med perleøredobben/Pike med perleøredobb, Venus' fødsel, Nattverden/Det siste måltid/The Last Supper, Solsikker/Solsikkene, Guernica, Skapelsen av Adam/Adams skapelse, Kysset, Nattevakten/Nattvakten, Brudeferden i Hardanger, American Gothic/Amerikansk gotikk, Hukommelsens bestandighet/The Persistence of Memory | Las Meninas, Den store bølgen ved Kanagawa/Den store bølgen, Nighthawks, Vandreren over tåkehavet, Vannliljer/Nøkkeroser, Impression soleil levant/Inntrykk soloppgang, Friheten leder folket, Lystens hage/Hagen med de jordiske gleder, Medusas flåte, Søndag ettermiddag på øya La Grande Jatte/Grande Jatte, Les Demoiselles d'Avignon, Arnolfini-portrettet, Den tredje mai 1808 | Madonna, Vampyr, Livets dans, Pubertet, Det syke barn, Soria Moria, Vinternatt i Rondane, Sjøtrollet, Campbell's Soup Cans/Suppebokser | Marilyn Diptych, Jente med ballong/Girl with Balloon, Saturn fortærer sin sønn, Høyvognen/The Hay Wain, Olympia, Frokost i det grønne, Nattkaféen, Potetspiserne, Soverommet i Arles, Babels tårn, Bøndenes bryllup, Jegerne i snøen, Ophelia, Whistlers mor",
    ),
    sp(
      "Nevn et sosialt medium eller en meldingsapp",
      "Facebook, Instagram, Snapchat, TikTok | X/Twitter, YouTube, WhatsApp, Messenger, LinkedIn, Pinterest, Reddit, Discord | Tumblr, BeReal, Threads, Telegram, Signal, Twitch, Bluesky, Mastodon, WeChat, Vimeo, Strava, Flickr, Tinder | MySpace, Nettby, Google+, Vine, Periscope, Ask.fm, Kik, Viber, LINE, Weibo, VK/VKontakte, QQ, Clubhouse, Yik Yak, Jodel, Letterboxd, Goodreads, Bumble, Hinge, Truth Social | Biip, Blink, Hi5, Bebo, Friendster, Orkut, Parler, Gab, Underskog",
    ),
    sp("Nevn et land som har vunnet fotball-VM for menn", "#BR, #DE/Vest-Tyskland, #AR | #FR, #IT | #ES, #UY | #GB/England | ", { nei: "Nederland, Portugal, Kroatia, Norge, Sverige" }),
  ),
]
