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
      "De tre bukkene Bruse/Bukkene Bruse, Askeladden som kappåt med trollet/Askeladden, Østenfor sol og vestenfor måne/Øst for sol og vest for måne | Kjerringa mot strømmen, Pannekaken/Pannekaka, Soria Moria slott/Soria Moria, Smørbukk, Kvitebjørn kong Valemon/Hvitebjørn kong Valemon, Sjuende far i huset/Den sjuende far i huset/Den syvende far i huset, Veslefrikk med fela | Mestermøy, Gudbrand i Lia, Mannen som skulle stelle hjemme, Jomfruen på glassberget, Prinsessen som ingen kunne målbinde/Prinsessa som ingen kunne målbinde, Askeladden som stjal sølvendene til trollet, Risen som ikke hadde noe hjerte på seg/Trollet som ikke hadde noe hjerte/Trollet som ikke hadde noe hjerte på seg, Tyrihans som fikk kongsdatteren til å le/Tyrihans, Reven som gjeter, Bjørnen og reven, Hvorfor bjørnen er stubbrumpet, Hvorfor havet er salt, Gutten som gikk til nordavinden og krevde igjen melet/Gutten og nordavinden | De tolv villender, Lillekort, Tro og utro, Kari Trestakk, Herreper, Dukken i gresset, Gjete kongens harer, Høna tripper i berget, Lurvehette, Haren som hadde vært gift, Enkesønnen, Askeladden og de gode hjelperne, Det har ingen nød med den som alle kvinnfolk er glad i, Peik, Reve-enka, Grimsborken, Gullfuglen, Rike Per Kremmer, Kvernen som står og maler på havsens bunn, De tre prinsessene i Hvittenland, Presten og klokkeren | Kjetta på Dovre, Hanen og høna i nøtteskogen, Gutten og fanden, Mumle Gåsegg, Følgesvennen, Han far sjøl i stua, Smeden som de ikke torde slippe inn i helvete, Høna som skulle til Dovrefjell, Notabene, Fugl Dam, Buskebrura, Gale-Mattis, Bonde Værskjegg, Per Pål og Espen Askeladd",
    ),
    sp(
      "Nevn en kornsort",
      "hvete, havre, rug, bygg | mais, ris, spelt | hirse, bokhvete, quinoa, sorghum/durra, durum/durumhvete | emmer, enkorn, rughvete/triticale, teff, amarant, villris, khorasan/kamut, fonio | ",
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
      "gulrot, potet, kålrot/kålrabi, rødbete | pastinakk, reddik, nepe, sellerirot/knollselleri/rotselleri, persillerot/rotpersille, søtpotet | jordskokk, ingefær, pepperrot, maniok/kassava, jams/yams, taro, daikon, gulbete, polkabete, turnips | gurkemeie, skorsonerrot, galangal, jicama, lotusrot, yacon, havrerot, mainepe, sukkerbete/sukkerroe, fôrbete, wasabi | oca, ulluco, mashua, cikoriarot, lakrisrot, burdock/borre",
      { nei: "agurk, tomat, paprika, brokkoli" },
    ),
    sp("Nevn et land som grenser til Saudi-Arabia", "#IQ, #JO, #YE, #AE | #KW, #OM, #QA | #BH | | @naboer:SA"),
    sp("Nevn en kråkefugl", "kråke, ravn, skjære | kaie, nøtteskrike, lavskrike | nøttekråke, kornkråke, svartkråke | alpekaie, alpekråke, blåskjære | blåskrike"),
    sp(
      "Nevn en kjent hund fra film, TV eller tegneserie",
      "Lassie, Pluto, Snoopy, Scooby-Doo/Scooby | Beethoven, Bolt, Hachiko/Hachi, Lady, Landstrykeren/Tramp, Langbein/Goofy, Odie, Terry/Milou/Snowy, Idefix, Gromit, Labbetuss, Båtsmann, Tassen/Spot | Brian/Brian Griffin, Santa's Little Helper, Kommissær Rex/Rex, Clifford, Marley, Hooch, Balto, Togo, Rin Tin Tin, Toto, Nana, Pongo, Perdita, Dodger, Dug, Slinky/Slinky Dog, Bluey, Bingo, Chase, Marshall, Skye, Rubble, Rocky, Zuma, Everest, Fluffy/Nussi, Fang/Hogg, Krypto, Scrappy-Doo, Rantanplan, Dante, Zero | Courage, Spike, Droopy, Muttley, Gnasher, Max, Duke, Shiloh, Old Yeller, Benji, Laika, Copper, Bullseye, Bruno, Pudsey, Wishbone, Eddie, Comet, Frank, Air Bud/Buddy, Buster, Patch, Lucky, Rolly, Shadow, Chance, Astro, Marmaduke, Blue, Jake, Ghost, Nymeria, Seymour | Gidget, Ein, Pochita, Bond, Underdog, Huckleberry Hound, Hong Kong Phooey, Kipper, Snuffles/Padfoot",
      { nei: "Garfield, Tom, Felix, Snusmumrikken" },
    ),
    sp(
      "Nevn en dans",
      "vals, tango, salsa, ballett | breakdance, hiphop, foxtrot, swing, jive, samba, cha-cha, rumba, flamenco, linedance, polka, twist, disco | halling/hallingdans, springar/springleik, reinlender, pols, quickstep, wienervals, paso doble, lindy hop, charleston, stepp/stepdans, jazzdans, moderne dans/samtidsdans, magedans, bachata, merengue, zumba, macarena, hula, folkedans, squaredance, cancan, menuett, mazurka/masurka, polonese | gangar, rull, boogie-woogie, west coast swing, kizomba, zouk, voguing, krumping, popping, locking, haka, kathak, bharatanatyam, sirtaki, hora, kasatsjok, jitterbug, shuffle, tango argentino, gammeldans, bugg, rock'n'roll | kuduro, dabke, bolero, lambada, galopp, kadrilje, gavotte, sarabande, gigue, tarantella, bourrée",
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
      "vanilje, sjokolade/sjoko, jordbær | pistasj/pistasjnøtt, karamell, mango, sitron, kokos, mintsjokolade/mint, cookie dough, krokan, bringebær, blåbær | stracciatella, salt karamell, lakris/salt lakris, kaffe/mokka/espresso, rocky road, rom og rosin/rum raisin, tutti frutti, hasselnøtt/nøtt, kirsebær, banan, yoghurt, cookies and cream/kjeks og krem, peanøttsmør/peanøtt, matcha, brownie, pasjonsfrukt, appelsin, pære, melon/vannmelon, ananas, fersken, eple, cola, oreo, daim, nonstop, tiramisu, ostekake/cheesecake, nutella, skogsbær, fudge | neapolitansk/napolitansk, spumoni, dulce de leche, honning, lavendel, rose, gresskar, sesam, ube, rødbønne, rabarbra, multe, tyttebær, kanel, ingefær, tyggegummi/bubblegum, sjokoladechip/sjokoladebiter, nougat, marsipan, solbær, rips, lime, blodappelsin, aprikos, biscoff, snickers, kinder, brente mandler, mandel, valnøtt, pekan, lønnesirup, tyrkisk pepper, smash, kardemomme, chai, sukkerspinn, smurf | basilikum, olivenolje, svart sesam, chili, bacon, avokado, durian, taro, earl grey, lakrissalt, grapefrukt, pina colada, mojito, prosecco, champagne",
    ),
    sp("Nevn et land som begynner på G", "#GH, #GE | #GT, #GN, #GM | #GA, #GY | #GW, #GD | #GL, @start:G"),
    sp(
      "Nevn en type båt eller skip",
      "seilbåt, robåt, kano, kajakk | motorbåt, ferje/ferge, cruiseskip, fiskebåt, ubåt/undervannsbåt, tankskip/oljetanker, containerskip/lasteskip, yacht, gondol, speedbåt, rib | seilskute, hurtigbåt, slepebåt/taubåt, isbryter, hangarskip, fregatt, jolle, snekke, sjekte, katamaran, trimaran, vikingskip, flåte/tømmerflåte, gummibåt, vannscooter, redningsskøyte, tråler, pram, lekter, bilferje/bilferge, luftputebåt/hovercraft, skjærgårdsjeep, daycruiser, cabincruiser, sjark, skøyte, husbåt, krigsskip, passasjerskip, dampskip, redningsbåt/livbåt, tråkkebåt/pedaltråkkbåt | hydrofoil/bærevingebåt, dragebåt, kutter, galei, karavell, kogge, fullrigger, bark, brigg, skonnert, sampan, dhow, dsjunke, korvett, torpedobåt, jager/destroyer, slagskip, krysser, minesveiper, landgangsfartøy, hurtigruteskip, færing, åttring, nordlandsbåt, oselvar, losbåt, brannbåt, politibåt, kystvaktskip, hjuldamper, bulkskip, gasstanker/lng-skip, brønnbåt, forskningsskip, forsyningsbåt/supplyskip, racerbåt, lettbåt, elvebåt, kanalbåt, galeon/gallion, slupp | kanonbåt, kogg, knarr, langskip, trireme, bireme, felukk, pirog, umiak, fembøring, seksring, jekt, galeas, ketch, yawl, karakk, linjeskip, ringnotbåt, linebåt, garnbåt, selfanger, kabelskip, bilskip/roro-skip",
    ),
    sp(
      "Nevn en person i Friends",
      "Ross/Ross Geller, Rachel/Rachel Green, Monica/Monica Geller, Chandler/Chandler Bing, Joey/Joey Tribbiani, Phoebe/Phoebe Buffay | Gunther, Janice/Janice Litman, Mike/Mike Hannigan, Emily/Emily Waltham, Carol/Carol Willick, Susan/Susan Bunch, Ben/Ben Geller, Emma/Emma Geller | Richard/Richard Burke, Jack Geller/Jack, Judy Geller/Judy, Frank Jr./Frank Buffay Jr., Ursula/Ursula Buffay, Mr. Heckles/Heckles, Tag/Tag Jones, Paolo, Julie, Charlie/Charlie Wheeler, Estelle/Estelle Leonard, Barry/Barry Farber, Pete/Pete Becker, David, Eddie, Kathy, Joshua | Erica, Mona, Mark, Gavin, Elizabeth, Paul/Paul Stevens, Janine, Alice, Jill/Jill Green, Amy/Amy Green, Mr. Treeger/Treeger, Stu, Ugly Naked Guy, Marcel, Hugsy, Chick, Duck, Leonard/Leonard Green, Sandra Green | Bob, Fun Bobby, Gary, Kip, Kristen, Nora Bing, Charles Bing, Gloria Tribbiani, Joey Tribbiani Sr., Frank Buffay, Lily Buffay, Phoebe Sr.",
    ),
    sp(
      "Nevn en merkedag eller høytid i Norge",
      "julaften/julekvelden, 17. mai/nasjonaldagen/grunnlovsdagen, nyttårsaften, påske/påskeaften, jul | 1. juledag/første juledag, 2. juledag/andre juledag, langfredag, skjærtorsdag, 1. mai/arbeidernes dag, sankthansaften/sankthans/st. hans/jonsok, halloween, valentinsdagen/alle hjerters dag, morsdag, farsdag, pinse, nyttår | 1. nyttårsdag/nyttårsdag, palmesøndag, 1. påskedag/første påskedag, 2. påskedag/andre påskedag, pinseaften, 1. pinsedag, 2. pinsedag, Kristi himmelfartsdag/Kristi himmelfart, lille julaften, kvinnedagen/8. mars, 1. april/aprilsnarr | fastelavn, lucia/luciadagen, black friday, samefolkets dag/6. februar, frigjøringsdagen/8. mai, olsok, allehelgensdag/allehelgensaften, advent/første søndag i advent, romjul, sommersolverv, vintersolverv, vårjevndøgn, høstjevndøgn, eid/id/eid al-fitr/eid al-adha, ramadan | mikkelsmesse, martinsmesse, kyndelsmesse, skuddårsdagen, unionsoppløsningsdagen/7. juni, veterandagen, FN-dagen, divali/diwali, hanukka, holi, tjuendedag/tjuedagen, helligtrekongersdag, askeonsdag, fetetirsdag/feitetirsdag, bot- og bededag, lille nyttårsaften",
    ),
    sp(
      "Nevn en egyptisk farao",
      "Tutankhamon/Tutankhamun/Tut, Ramses/Ramses II, Kleopatra/Cleopatra, Kheops/Khufu | Akhenaton/Ekhnaton, Hatshepsut, Thutmosis/Thutmose, Djoser, Khafre/Kefren, Menkaure/Mykerinos, Amenhotep | Seti/Seti I, Narmer/Menes, Ptolemaios, Nefertiti, Sneferu, Horemheb, Ramses III | Psammetik, Nektanebo, Taharqa, Merenptah, Ay, Smenkhkare, Sobekneferu, Pepi/Pepi II, Unas, Teti, Userkaf, Sahure, Mentuhotep, Senusret/Sesostris, Amenemhat, Ahmose, Kamose | Sheshonq, Piye, Shabaka, Neko, Apries, Amasis, Cæsarion, Hor-Aha, Djet, Den, Khasekhemwy, Peribsen, Huni, Djedefre, Shepseskaf, Neferirkare, Nyuserre, Djedkare Isesi",
    ),
  ),
  dag(
    sp(
      "Nevn en småkake eller kjeks",
      "sjokoladekjeks/cookie/cookies/chocolate chip cookie, pepperkake/pepperkaker, havrekjeks/digestive, Oreo | sandkake/sandkaker, krumkake/krumkaker, berlinerkrans/berlinerkranser, kokosmakron/kokosmakroner, havreflarn, sirupsnipp/sirupsnipper, Mariekjeks/Marie, Kornmo, Bixit, Safari, Ritz, Ballerina, Bokstavkjeks | serinakake/serinakaker, fattigmann/fattigmenn, vaniljekrans/vaniljekranser, makron/macarons, shortbread, biscotti/cantucci, smørkjeks, goro, rosettbakkels, Singoalla, Gjende, Tom og Jerry/Tom & Jerry, Kapteinkjeks/Kaptein, TUC, Brago, Biscoff/Lotus Biscoff, Maryland, Café Bakeriet/Cafe Bakeriet, Gjendekjeks, kakemann/kakemenn/julemann | amaretti, florentiner, snickerdoodle, spekulaas, lebkuchen, mandelflarn, sprutbakkels, hjortetakk, brune pinner, sarakaker, kransekakestenger, kransekake, Peppernøtter, Smultring, Jødekake, Bordstabelbakkels | alfajores, pizzelle, stroopwafel, tuiles, kattetunger/langues de chat, madeleine, polvorón, kourabiedes, ma'amoul, anzac biscuits, hobnobs, jaffa cakes, custard creams, bourbon, rich tea, ginger nuts, lykkekake/fortune cookie, savoiardi/ladyfingers",
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
      "NRK1/NRK, TV 2/TV 2 Direkte, TVNorge/TVN, NRK2 | NRK Super, NRK3, TV3, V4/Viasat 4/TV3+, FEM, TV 2 Sport/TV 2 Sport 1/TV 2 Sport 2, TV 2 Zebra, TV 2 Nyheter/TV 2 Nyhetskanalen | MAX, VOX, TV 2 Livsstil, TV6, Eurosport/Eurosport Norge/Eurosport 1, Discovery Channel/Discovery, Disney Channel, Cartoon Network, Nickelodeon, National Geographic, Animal Planet, TLC, BBC, CNN, V Sport, TV 2 Sport Premium/TV 2 Premier League, Visjon Norge | TV 2 Sportskanalen, TV 2 Humor, TV 2 Filmkanalen, TV 2 Bliss, Frikanalen, Euronews, NRK Tegnspråk, Kanal 10, TV3 Norge, Matkanalen, Rikstoto Direkte | TV Vest, TV Haugaland, TV Øst, TV Budstikka, TV Romerike, TV Agder, TV Telemark, TVNord, TV Trøndelag, NRK Sápmi",
    ),
    sp(
      "Nevn en gresk øy",
      "Kreta, Rhodos, Korfu, Santorini, Mykonos | Kos, Zakynthos, Kefalonia, Lesvos/Lesbos, Naxos, Paros, Samos, Chios, Evia/Euboia | Ithaka, Patmos, Hydra, Aegina, Skiathos, Skopelos, Thassos, Lefkada/Lefkas, Karpathos, Milos, Ios, Sifnos, Syros, Tinos, Andros, Kalymnos, Leros, Symi, Spetses, Poros, Salamis | Alonissos, Kythira, Samothraki, Limnos, Ikaria, Folegandros, Amorgos, Antiparos, Halki, Kastellorizo/Megisti, Gavdos, Lipsi, Astypalea, Nisyros, Tilos, Kasos, Elafonisos, Skyros, Paxos | Serifos, Kythnos, Kea, Anafi, Donoussa, Koufonisia, Schinoussa, Iraklia, Sikinos, Kimolos, Psara, Fourni, Agathonisi, Antipaxos, Othonoi, Ereikoussa, Mathraki, Agios Efstratios",
      { nei: "Kypros, Malta, Sicilia, Sardinia, Mallorca" },
    ),
  ),
]
