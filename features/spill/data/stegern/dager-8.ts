import { dag, sp } from "./typer"

// Days 31–35.
export const dager8 = [
  dag(
    sp(
      "Nevn en thailandsk rett",
      "pad thai, grønn karri, tom yum, rød karri | massaman/massamankarri, panang/panangkarri, tom kha/tom kha gai, satay, vårruller, gul karri, som tam/papayasalat, larb, khao pad/thai stekt ris | pad kra pao/pad krapow, pad see ew, khao soi, mango sticky rice/klebrig ris med mango, cashewkylling, jungelkarri/kaeng pa, pad prik king, yam nua | moo ping, gai yang, khao man gai, tod mun pla/fiskekaker, nam prik, boat noodles/kuay teow reua, rad na, pad woon sen | khanom jeen, kaeng som, kaeng hang lay, sai ua, mu kratha, khao niao, yam som o, kai jeow, hor mok, miang kham, pla rad prik, khao tom, jok, tub tim grob, khanom krok",
    ),
    sp("Nevn et land der fransk er offisielt språk", "#FR, #BE, #CH | #CA, #LU, #MC, #HT | #SN, #CI, #CD, #CM, #MG | #BJ, #TG, #GN, #TD, #CF, #GA, #CG, #BI, #RW, #DJ, #KM, #SC, #VU, #GQ | ", { nei: "Mali, Burkina Faso, Niger, Marokko, Algerie, Tunisia, Vietnam, Libanon" }),
    sp(
      "Nevn en antilope",
      "impala, gnu, springbok, gaselle | oryx, kudu, eland, thomsongaselle, nyala | bongo, dik-dik, topi, hartebeest/kongoni, vannbukk, sabelantilope, hestantilope, saiga, gerenuk | klippespringer, duiker, sitatunga, blesbok, bontebok, lechwe, puku, reedbuck/sivbukk, oribi, steenbok, grant-gaselle, dorkasgaselle, hjorteantilope/hjortegeit/blackbuck, nilgau, chiru | addax, beira, suni, dibatag, korrigum, rheboks, sumpbukk, gaffelantilope",
      { nei: "steinbukk, okapi, reinsdyr, hjort, elg, sjiraff" },
    ),
    sp(
      "Nevn et eventyr fra Asbjørnsen og Moe",
      "De tre bukkene Bruse/Bukkene Bruse, Askeladden som kappåt med trollet/Askeladden, Østenfor sol og vestenfor måne | Kjerringa mot strømmen, Pannekaken, Soria Moria slott, Smørbukk, Kvitebjørn kong Valemon | Mestermøy, Gudbrand i Lia, Mannen som skulle stelle hjemme, Jomfruen på glassberget, Prinsessen som ingen kunne målbinde, Askeladden som stjal sølvendene til trollet, Risen som ikke hadde noe hjerte på seg/Trollet som ikke hadde noe hjerte, Tyrihans som fikk kongsdatteren til å le/Tyrihans, Reven som gjeter, Bjørnen og reven | De tolv villender, Lillekort, Tro og utro, Kari Trestakk, Herreper, Dukken i gresset, Gjete kongens harer, Høna tripper i berget, Lurvehette, Haren som hadde vært gift, Enkesønnen, Askeladden og de gode hjelperne, Det har ingen nød med den som alle kvinnfolk er glad i, Peik | Kjetta på Dovre, Hanen og høna i nøtteskogen,, Gutten og fanden, Mumle Gåsegg, Følgesvennen,",
    ),
    sp(
      "Nevn en kornsort",
      "hvete, havre, rug, bygg | mais, ris, spelt | hirse, bokhvete, quinoa, sorghum/durra, durum | emmer, enkorn, rughvete/triticale, teff, amarant, villris, khorasan/kamut, fonio |",
    ),
    sp(
      "Nevn en tysk delstat",
      "Bayern/Bavaria, Berlin, Hamburg | Sachsen/Saxony, Nordrhein-Westfalen/NRW, Baden-Württemberg, Hessen/Hesse, Niedersachsen/Lower Saxony, Bremen | Schleswig-Holstein, Brandenburg, Thüringen/Thuringia, Sachsen-Anhalt, Rheinland-Pfalz | Mecklenburg-Vorpommern, Saarland | ",
      { nei: "München, Köln, Frankfurt, Stuttgart, Westfalen, Pfalz" },
    ),
  ),
  dag(
    sp(
      "Nevn en rotgrønnsak",
      "gulrot, potet, kålrot, rødbete | pastinakk, reddik, nepe, sellerirot/knollselleri, persillerot, søtpotet | jordskokk, ingefær, pepperrot, maniok/kassava, jams, taro, daikon | gurkemeie, skorsonerrot, galangal, jicama, lotusrot, yacon | oca, ulluco, mashua, rotpersille",
      { nei: "agurk, tomat, paprika, brokkoli" },
    ),
    sp("Nevn et land som grenser til Saudi-Arabia", "#IQ, #JO, #YE, #AE | #KW, #OM, #QA | #BH | | @naboer:SA"),
    sp("Nevn en kråkefugl", "kråke, ravn, skjære | kaie, nøtteskrike, lavskrike | nøttekråke, kornkråke, svartkråke | alpekaie, alpekråke, blåskjære | blåskrike"),
    sp(
      "Nevn en kjent hund fra film, TV eller tegneserie",
      "Lassie, Pluto, Snoopy, Scooby-Doo | Beethoven, Bolt, Hachiko, Lady, Landstrykeren, Langbein, Odie, Terry/Milou, Idefix, Gromit | Brian, Santa's Little Helper, Kommissær Rex/Rex, Clifford, Marley, Hooch, Balto, Togo, Rin Tin Tin, Toto, Nana, Pongo, Perdita, Dodger, Dug, Slinky, Bluey, Bingo, Chase, Marshall, Skye, Rubble, Rocky, Zuma, Everest, Fluffy, Fang, Krypto, Scrappy-Doo | Courage, Spike, Droopy, Muttley, Gnasher, Max, Duke, Shiloh, Old Yeller, Benji, Laika, Copper, Bullseye, Bruno, Pudsey, Wishbone, Eddie, Comet, Frank |, Gidget,",
      { nei: "Garfield, Tom, Felix, Snusmumrikken" },
    ),
    sp(
      "Nevn en dans",
      "vals, tango, salsa, ballett | breakdance, hiphop, foxtrot, swing, jive, samba, cha-cha, rumba, flamenco, linedance, polka, twist, disco | halling/hallingdans, springar/springleik, reinlender, pols, quickstep, wienervals, paso doble, lindy hop, charleston, stepp/stepdans, jazzdans, moderne dans/samtidsdans, magedans, bachata, merengue, zumba, macarena, hula, folkedans, squaredance, cancan, menuett, mazurka/masurka, polonese | gangar, rull, boogie-woogie, west coast swing, kizomba, zouk, voguing, krumping, popping, locking, haka, kathak, bharatanatyam, sirtaki, hora, kasatsjok, jitterbug, shuffle, tango argentino, gammeldans, bugg, rock'n'roll | kuduro, dabke, bolero, lambada, galopp, kadrilje, gavotte, sarabande, gigue, tarantella, bourrée,",
    ),
    sp(
      "Nevn en provins eller et territorium i Canada",
      "Québec/Quebec, Ontario, British Columbia | Alberta, Nova Scotia, Manitoba, Newfoundland og Labrador/Newfoundland | Saskatchewan, New Brunswick, Yukon, Nunavut | Prince Edward Island/PEI, Northwest Territories/Nordvestterritoriene | ",
      { nei: "Alaska, Vancouver, Toronto, Montreal, Labrador" },
    ),
  ),
  dag(
    sp(
      "Nevn en issmak",
      "vanilje, sjokolade, jordbær | pistasj, karamell, mango, sitron, kokos, mintsjokolade/mint, cookie dough, krokan | stracciatella, salt karamell, lakris, bringebær, blåbær, kaffe/mokka, rocky road, rom og rosin/rum raisin, tutti frutti, hasselnøtt/nøtt, kirsebær, banan, yoghurt, cookies and cream/kjeks og krem, peanøttsmør, matcha, brownie, pasjonsfrukt, appelsin | neapolitansk/napolitansk, spumoni, dulce de leche, honning, lavendel, rose, gresskar, sesam, ube, rødbønne, rabarbra, multe, tyttebær, kanel, ingefær, tyggegummi/bubblegum, sjokoladechip, nougat, marsipan | basilikum, olivenolje, svart sesam, chili, bacon, avokado, durian, taro, earl grey, lakrissalt",
    ),
    sp("Nevn et land som begynner på G", "#GH, #GE | #GT, #GN, #GM | #GA, #GY | #GW, #GD | #GL, @start:G"),
    sp(
      "Nevn en type båt eller skip",
      "seilbåt, robåt, kano, kajakk | motorbåt, ferje, cruiseskip, fiskebåt, ubåt, tankskip, containerskip/lasteskip, yacht, gondol | seilskute, hurtigbåt, slepebåt, isbryter, hangarskip, fregatt, jolle, snekke, sjekte, katamaran, trimaran, vikingskip, flåte, gummibåt, vannscooter, redningsskøyte, tråler, pram, lekter, bilferje, luftputebåt/hovercraft | hydrofoil/bærevingebåt, dragebåt, kutter, galei, karavell, kogge, fullrigger, bark, brigg, skonnert, sampan, dhow, dsjunke, korvett, torpedobåt, jager/destroyer, slagskip, krysser, minesveiper, landgangsfartøy, hurtigruteskip, færing, åttring, nordlandsbåt, oselvar | kanonbåt, kogg, knarr, langskip, trireme, bireme, felukk, pirog, umiak,",
    ),
    sp(
      "Nevn en person i Friends",
      "Ross, Rachel, Monica, Chandler, Joey, Phoebe | Gunther, Janice, Mike, Emily, Carol, Susan, Ben | Richard, Jack Geller, Judy Geller, Frank Jr., Ursula, Mr. Heckles/Heckles, Tag, Paolo, Julie, Charlie, Estelle, Barry, Pete, David, Eddie, Kathy, Joshua, Emma | Erica, Mona, Mark, Gavin, Elizabeth, Paul, Janine, Alice, Jill, Amy, Mr. Treeger/Treeger, Stu, Ugly Naked Guy, Marcel, Hugsy, Chick, Duck, Leonard, Sandra Green,| Bob, Fun Bobby, Gary, Kip, Kristen,, Nora Bing, Charles Bing, Gloria Tribbiani, Joey Tribbiani Sr., Frank Buffay, Lily Buffay, Phoebe Sr.",
    ),
    sp(
      "Nevn en merkedag eller høytid i Norge",
      "julaften, 17. mai/nasjonaldagen/grunnlovsdagen, nyttårsaften, påske/påskeaften | 1. juledag/første juledag, 2. juledag/andre juledag, langfredag, skjærtorsdag, 1. mai/arbeidernes dag, sankthansaften/jonsok, halloween, valentinsdagen, morsdag, farsdag, pinse | 1. nyttårsdag/nyttårsdag, palmesøndag, 1. påskedag/første påskedag, 2. påskedag/andre påskedag, pinseaften, 1. pinsedag, 2. pinsedag, Kristi himmelfartsdag | fastelavn, lucia/luciadagen, lille julaften, black friday, kvinnedagen, samefolkets dag, frigjøringsdagen/8. mai, olsok, allehelgensdag, advent/første søndag i advent | mikkelsmesse, martinsmesse, kyndelsmesse, skuddårsdagen, unionsoppløsningsdagen/7. juni, veterandagen, FN-dagen, eid, divali, hanukka, holi,,, tjuendedag/tjuedagen, helligtrekongersdag",
    ),
    sp(
      "Nevn en egyptisk farao",
      "Tutankhamon/Tutankhamun/Tut, Ramses/Ramses II, Kleopatra/Cleopatra, Kheops/Khufu | Akhenaton/Ekhnaton, Hatshepsut, Thutmosis/Thutmose, Djoser, Khafre/Kefren, Menkaure/Mykerinos, Amenhotep | Seti/Seti I, Narmer/Menes, Ptolemaios, Nefertiti, Sneferu, Horemheb, Ramses III | Psammetik, Nektanebo, Taharqa, Merenptah, Ay, Smenkhkare, Sobekneferu, Pepi/Pepi II, Unas, Teti, Userkaf, Sahure, Mentuhotep, Senusret/Sesostris, Amenemhat, Ahmose, Kamose | Sheshonq, Piye, Shabaka, Neko, Apries, Amasis, Cæsarion, Hor-Aha, Djet, Den, Khasekhemwy, Peribsen, Huni, Djedefre, Shepseskaf, Neferirkare, Nyuserre, Djedkare Isesi",
    ),
  ),
  dag(
    sp(
      "Nevn en småkake eller kjeks",
      "sjokoladekjeks/cookie/cookies, pepperkake/pepperkaker, havrekjeks/digestive, Oreo | sandkake/sandkaker, krumkake/krumkaker, berlinerkrans/berlinerkranser, kokosmakron/kokosmakroner, havreflarn, sirupsnipp/sirupsnipper, Mariekjeks/Marie | serinakake/serinakaker, fattigmann/fattigmenn, vaniljekrans/vaniljekranser, makron/macarons, shortbread, biscotti/cantucci, Bixit, Safari, Ritz, smørkjeks, goro, rosettbakkels | amaretti, florentiner, snickerdoodle, spekulaas, lebkuchen, mandelflarn, kakemann/kakemenn, sprutbakkels, hjortetakk, brune pinner, sarakaker, kransekakestenger | alfajores, pizzelle, stroopwafel, tuiles, kattetunger/langues de chat, madeleine, polvorón, kourabiedes, ma'amoul, anzac biscuits, hobnobs, jaffa cakes, custard creams, bourbon, rich tea, ginger nuts, lykkekake/fortune cookie",
    ),
    sp("Nevn et land som grenser til Argentina", "#CL, #BR | #UY, #PY | #BO | | @naboer:AR"),
    sp(
      "Nevn noe du kan se på himmelen",
      "sola/solen, månen, stjerner/stjerne, skyer/sky | fly, fugl/fugler, regnbue, nordlys, planet/planeter, stjerneskudd, komet | satellitt, drone, helikopter, luftballong/varmluftsballong/ballong, drage, romstasjonen/ISS, Melkeveien, Venus/aftenstjernen, Jupiter, Mars, lyn, Karlsvogna, Orion, halo, solformørkelse, måneformørkelse, Nordstjernen | meteor, fyrverkeri, kondensstriper, lysende nattskyer, zeppeliner, paraglider, fallskjerm, UFO, galakse, Andromedagalaksen, Sjustjernen/Pleiadene, Saturn,| halvmåne, fullmåne, blodmåne, supermåne,, morgenrøde, aftenrøde, stjernebilder, solgløtt",
    ),
    sp(
      "Nevn en klassisk komponist",
      "Mozart, Beethoven, Bach, Grieg/Edvard Grieg | Chopin, Vivaldi, Tsjajkovskij/Tchaikovsky, Händel/Handel, Haydn, Schubert, Wagner, Verdi, Strauss/Johann Strauss | Brahms, Debussy, Mahler, Liszt, Puccini, Rakhmaninov/Rachmaninoff, Stravinskij/Stravinsky, Sibelius, Dvořák/Dvorak, Ravel, Rossini, Mendelssohn, Schumann, Prokofjev/Prokofiev, Sjostakovitsj/Shostakovich, Bizet, Satie, Holst, Elgar, Gershwin, Ole Bull, Johan Svendsen/Svendsen | Saint-Saëns, Fauré, Berlioz, Bruckner, Mussorgskij/Mussorgsky, Rimskij-Korsakov, Borodin, Smetana, Janáček, Bartók, Kodály, Copland, Bernstein, Barber, Philip Glass, Arvo Pärt/Pärt, Monteverdi, Purcell, Telemann, Scarlatti, Corelli, Pachelbel, Gluck, Offenbach, Delibes, Massenet, Gounod, Donizetti, Bellini, Paganini, Weber, Carl Nielsen/Nielsen, Sinding, Johan Halvorsen, Geirr Tveitt/Tveitt, Harald Sæverud/Sæverud, Nordraak, Kjerulf, Ligeti, Schönberg/Schoenberg, Alban Berg, Webern, Stockhausen, John Cage, Steve Reich, Orff, Hindemith, Britten, Vaughan Williams, Rautavaara, Gade | Hildegard av Bingen, Palestrina, Lully, Rameau, Couperin, Byrd, Dowland, Tallis, Gesualdo, Buxtehude, Albinoni, Boccherini, Clementi, Hummel, Alkan, Franck, Dukas, Messiaen, Poulenc, Milhaud, Honegger, Varèse, Ives, Szymanowski, Górecki, Lutosławski, Penderecki, Schnittke, Gubaidulina, Fartein Valen, Klaus Egge, Arne Nordheim/Nordheim, Lindeman, Agathe Backer Grøndahl",
    ),
    sp(
      "Nevn et kontinent eller en verdensdel",
      "Europa, Asia, Afrika | Nord-Amerika, Sør-Amerika, Amerika | Antarktis/Antarktika, Australia, Oseania | Eurasia, Afroeurasia | Zealandia, Pangea, Gondwana, Laurasia",
      { nei: "Arktis, Atlantis, Grønland, Skandinavia" },
    ),
    sp(
      "Nevn en måne i solsystemet",
      "Månen, Titan, Europa, Io, Ganymedes/Ganymede | Fobos/Phobos, Deimos, Kallisto/Callisto, Triton, Enceladus, Charon/Karon | Mimas, Tethys, Dione, Rhea, Iapetus, Hyperion, Phoebe, Miranda, Ariel, Umbriel, Titania, Oberon | Nereid, Proteus, Amalthea, Himalia, Puck, Pandora, Prometheus, Janus, Epimetheus, Pan, Atlas, Larissa, Galatea, Despina, Thalassa, Naiad, Metis, Adrastea, Thebe, Elara | Sycorax, Caliban, Nix, Hydra, Kerberos, Styx, Dysnomia, Hi'iaka, Namaka, Vanth, Weywot, Cordelia, Ophelia, Bianca, Cressida, Desdemona, Juliet, Portia, Rosalind, Belinda, Perdita, Mab, Cupid, Halimede, Sao, Psamathe, Neso",
    ),
  ),
  dag(
    sp(
      "Nevn noe som er laget av poteter",
      "pommes frites/pommes/frites, potetmos, potetgull/chips, lompe/lomper | rösti, potetsalat, bakt potet/bakepotet, stekte poteter, potetgrateng/gratinerte poteter, raspeball/komle/kumle/klubb/kompe, potetlefse/lefse, hasselbackpoteter | akevitt, vodka, potetsuppe, potetkake, potetbrød, gnocchi, latkes, hash browns, tortilla española/spansk omelett, patatas bravas, potetkroketter/kroketter, pommes duchesse, pommes anna | aligot, colcannon, poutine, båtpoteter/wedges, potetstappe, potetmel | aloo gobi, samosa, papas arrugadas, causa, llapingachos, kartoffelpuffer, raggmunk, pitepalt, kroppkakor, rotmos, kumpir, pierogi, vareniki, draniki, knödel,",
    ),
    sp("Nevn et land der portugisisk er offisielt språk", "#BR, #PT | #AO, #MZ | #CV, #GW | #ST, #TL | #GQ, #MO", { nei: "Spania, Argentina, Galicia" }),
    sp(
      "Nevn et pattedyr som lever i eller ved vann",
      "hval, delfin, sel, oter | hvalross, sjøløve, nise, spekkhogger, bever, flodhest | sjøku/manat, dugong, narhval, havoter/sjøoter, isbjørn, mink, nebbdyr | desman, vannspissmus, bisamrotte, kapybara, nutria/beverrotte, vånd, amazondelfin/elvedelfin, kjempeoter, vannbøffel,, elefantsel, havert, steinkobbe, grønlandssel, ringsel, klappmyss, storkobbe | sitatunga,, vannopossum/yapok,, munkesel, leopardsel, weddellsel, krabbeetersel",
    ),
    sp(
      "Nevn en film fra Studio Ghibli",
      "Min nabo Totoro/Totoro/My Neighbor Totoro, Chihiro og heksene/Spirited Away, Prinsesse Mononoke/Princess Mononoke, Det levende slottet/Howl's Moving Castle | Kikis budtjeneste/Kiki's Delivery Service, Ponyo/Ponyo på klippen ved havet, Nausicaä, Laputa/Castle in the Sky, Porco Rosso, Vinden stiger/The Wind Rises, Gutten og hegren/The Boy and the Heron, Ildfluenes grav/Grave of the Fireflies, Arrietty | Whisper of the Heart, The Cat Returns, Pom Poko, Only Yesterday, From Up on Poppy Hill, When Marnie Was There, Tales from Earthsea, Prinsesse Kaguya/The Tale of the Princess Kaguya, My Neighbors the Yamadas, Ocean Waves | Earwig and the Witch/Earwig og heksa, The Red Turtle | ",
    ),
    sp(
      "Nevn en norsk TV-kanal",
      "NRK1, TV 2, TVNorge, NRK2 | NRK Super, NRK3, TV3, V4/Viasat 4, FEM, TV 2 Sport, TV 2 Zebra, TV 2 Nyheter | MAX, VOX, TV 2 Livsstil, Eurosport, Discovery Channel/Discovery, Disney Channel, Cartoon Network, Nickelodeon, National Geographic, Animal Planet, TLC, BBC, CNN, V Sport | TV 2 Sportskanalen, Frikanalen, Euronews, NRK Tegnspråk, TV Vest, TV Haugaland,, TV 2 Humor,|,",
    ),
    sp(
      "Nevn en gresk øy",
      "Kreta, Rhodos, Korfu, Santorini, Mykonos | Kos, Zakynthos, Kefalonia, Lesvos/Lesbos, Naxos, Paros, Samos, Chios, Evia/Euboia | Ithaka, Patmos, Hydra, Aegina, Skiathos, Skopelos, Thassos, Lefkada/Lefkas, Karpathos, Milos, Ios, Sifnos, Syros, Tinos, Andros, Kalymnos, Leros, Symi, Spetses, Poros, Salamis | Alonissos, Kythira, Samothraki, Limnos, Ikaria, Folegandros, Amorgos, Antiparos, Halki, Kastellorizo/Megisti, Gavdos, Lipsi, Astypalea, Nisyros, Tilos, Kasos, Elafonisos, Skyros, Paxos | Serifos, Kythnos, Kea, Anafi, Donoussa, Koufonisia, Schinoussa, Iraklia, Sikinos, Kimolos, Psara, Fourni, Agathonisi, Antipaxos, Othonoi, Ereikoussa, Mathraki, Agios Efstratios",
      { nei: "Kypros, Malta, Sicilia, Sardinia, Mallorca" },
    ),
  ),
]
