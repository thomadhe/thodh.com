import { dag, sp } from "./typer"

// Days 21–25.
export const dager6 = [
  dag(
    sp(
      "Nevn en meksikansk rett",
      "taco/tacos, burrito, nachos, quesadilla | enchilada/enchiladas, fajitas/fajita, guacamole, tortilla, salsa, chili con carne, churros | tamales/tamal, mole, pozole, elote, chilaquiles, huevos rancheros, tostada, carnitas, tacos al pastor/al pastor, barbacoa, pico de gallo, bønnemos/refried beans/frijoles, flautas, taquitos, chimichanga, tres leches, flan | cochinita pibil, chiles en nogada, birria, menudo, gorditas, sopes, tlayuda, huaraches, molletes, mole poblano, chalupa, empanadas, horchata, carne asada, esquites, pambazo, torta ahogada, cemita, enfrijoladas, entomatadas, machaca, aguachile, camarones a la diabla, sopa de tortilla, champurrado, atole | pescado zarandeado, papadzules, panuchos, salbutes, sikil pak, caldo tlalpeño, tacos de canasta, tlacoyos, memelas",
    ),
    sp("Nevn et land der spansk er offisielt språk", "#ES, #MX, #AR | #CO, #CL, #PE, #CU | #VE, #EC, #BO, #UY, #PY | #CR, #PA, #GT, #HN, #NI, #SV, #DO | #GQ, #PR", { nei: "Brasil, Portugal, Belize, Andorra, Filippinene, USA" }),
    sp(
      "Nevn et dyr som lever vilt i Sør-Amerika",
      "lama, alpakka, jaguar, anakonda, piraja/piranha | dovendyr, tukan, kapybara/flodsvin, puma, kondor, maursluker, ara/papegøye, kaiman, flamingo | tapir, beltedyr, guanako, vikunja, nandu, chinchilla, edderkoppape, brøleape, kapusinerape, ozelot, brillebjørn, elektrisk ål, boa, pilgiftfrosk/giftfrosk, kolibri, hoatzin, harpyørn, kjempeoter, amazondelfin/rosa delfin/elvedelfin, galapagosskilpadde/kjempeskilpadde, havleguan/marin leguan, blåfotsule, pingvin | nesebjørn/coati, viskasja, mara, degu, mankeulv, buskhund, oncilla, margay, jaguarundi, pudu, huemul, sjøløve, pelssel, tamarin, silkeape, uakari, titi, sakiape, nattape, oljefugl, matamata, arapaima/pirarucu, candiru | pakarana, andeskatt, magellanpingvin, humboldtpingvin, andeskondor, galapagosfink, flygeløs skarv",
    ),
    sp(
      "Nevn en figur fra Mummidalen",
      "Mummitrollet, Lille My, Snusmumrikken | Mummimamma, Mummipappa, Snorkfrøken, Sniff | Hufsa/Mårran/Groke, Hemulen, Hattifnattene/hattifnatt/hattifnatter, Too-ticky/Tutikki | Filifjonka, Mymlan/Mymla, Snorken/Snork, Stinky, Bisamrotten, Tofslan, Vifslan | Misa, Ninni, Homsan",
    ),
    sp(
      "Nevn en skytype",
      "cumulus/haugsky, cirrus/fjærsky/fjærskyer, cumulonimbus/tordensky/bygesky | stratus/lagsky, nimbostratus/regnsky, altocumulus, cirrostratus | altostratus, cirrocumulus/makrellsky/makrellskyer, stratocumulus | mammatus, lentikularis/linsesky/linseskyer, perlemorsky/perlemorskyer, lysende nattskyer/lysende nattsky, kondensstripe, tåke | pileus, arcus/buesky, asperitas, castellanus, fractus, kelvin-helmholtz, virga, incus/ambolt",
    ),
    sp(
      "Nevn en norsk forfatter",
      "Henrik Ibsen/Ibsen, Jo Nesbø/Nesbø, Knut Hamsun/Hamsun, Jon Fosse/Fosse | Bjørnstjerne Bjørnson/Bjørnson, Sigrid Undset/Undset, Karl Ove Knausgård/Knausgård, Jostein Gaarder/Gaarder, Thorbjørn Egner/Egner, Alf Prøysen/Prøysen, Henrik Wergeland/Wergeland | Anne B. Ragde/Ragde, Lars Saabye Christensen, Erlend Loe/Loe, Maja Lunde, Anne Holt, Gunnar Staalesen/Staalesen, Karin Fossum/Fossum, Tarjei Vesaas/Vesaas, Amalie Skram/Skram, Camilla Collett/Collett, Ivar Aasen/Aasen, Peter Christen Asbjørnsen/Asbjørnsen, Jørgen Moe, Ludvig Holberg/Holberg, Petter Dass, Herbjørg Wassmo/Wassmo, Jørn Lier Horst, Anne-Cath. Vestly/Vestly, Thor Heyerdahl/Heyerdahl, Olav H. Hauge, Inger Hagerup, Arne Garborg/Garborg, Alexander Kielland/Kielland | Dag Solstad/Solstad, Kjartan Fløgstad/Fløgstad, Per Petterson, Hanne Ørstavik, Vigdis Hjorth, Tomas Espedal, Linn Ullmann, Ketil Bjørnstad, Jan Kjærstad, Roy Jacobsen, Ingvar Ambjørnsen/Ambjørnsen, Tor Åge Bringsværd, Maria Parr, Unni Lindell, Tom Egeland, Samuel Bjørk, Agnes Ravatn, Edvard Hoem, Rolf Jacobsen, Gunvor Hofmo, Jens Bjørneboe/Bjørneboe, Aksel Sandemose/Sandemose, Johan Falkberget/Falkberget, Jonas Lie, Cora Sandel, Sigurd Hoel, Agnar Mykle/Mykle, Kjell Askildsen, Olav Duun/Duun, Aasmund Olavsson Vinje/Vinje, Arnulf Øverland, Knut Faldbakken, Lars Mytting/Mytting, Helga Flatland, Simon Stranger, Nina Lykke, Jon Michelet, Gert Nygårdshaug, Nordahl Grieg | Axel Jensen, Finn Carling, Tor Jonsson, Halldis Moren Vesaas, Johan Herman Wessel/Wessel, Hans E. Kinck, Levi Henriksen, Jan Erik Vold, Ruth Lillegraven, Thomas Enger, Mikkjel Fønhus, Aslaug Vaa, Kristofer Uppdal, Ragnhild Jølsen, Hans Aanrud, Regine Normann, Sigbjørn Obstfelder/Obstfelder, Olav Nygard, Stein Mehren, Paal-Helge Haugen, Lars Amund Vaage, Hanne Kristin Rohde, Pedro Carmona-Alvarez, Gine Cornelia Pedersen, Hans Herbjørnsrud",
      { nei: "Roald Dahl, Astrid Lindgren, Selma Lagerlöf" },
    ),
  ),
  dag(
    sp(
      "Nevn en sjokolade du kan kjøpe i butikken",
      "Kvikk Lunsj, Snickers, Twix, Melkesjokolade/Freia Melkesjokolade | Mars, KitKat, Bounty, Toblerone, Daim, Japp, Stratos, Troika, Firkløver, M&M's/M&Ms, Milky Way, Lion | Ritter Sport, Milka, Lindt, Cadbury, Ferrero Rocher, Kinderegg/Kinder Egg/Kinder, Kinder Bueno, Walters mandler, Smil, Hobby, Nero, Sfinx | Galaxy, Maltesers, Dairy Milk, Reese's, Marabou, Plopp, Kexchoklad, Center, Doble, Non Stop | Hershey's, Butterfinger, Baby Ruth, Aero, Crunch, Yorkie, Wispa, Flake, Twirl, Picnic, Double Decker, Boost, Toffifee, Raffaello, Mon Chéri, Merci, Celebrations, Quality Street, After Eight, Tobleroni, Kong Haakon",
    ),
    sp("Nevn et land som grenser til Tyrkia", "#GR, #SY, #IQ, #IR | #BG, #GE | #AM, #AZ | | @naboer:TR"),
    sp(
      "Nevn en blomst",
      "rose, tulipan, solsikke, lilje | løvetann, prestekrage, orkidé, påskelilje, blåklokke, hvitveis, krokus, nellik | fiol, liljekonvall, lavendel, peon/pion, valmue, hortensia, iris, geranium/pelargonium, begonia, tusenfryd, smørblomst, kornblomst, julestjerne, amaryllis, hyasint, gerbera, georgine/dahlia | magnolia, kamelia, jasmin, ringblomst, stemorsblomst, forglemmegei, revebjelle, snøklokke, ballblomst, kløver/rødkløver, lupin, mjødurt, akeleie, syrin, rododendron, asalea, petunia, fuksia, gladiolus, ridderspore, floks, lobelia, aster, krysantemum, lotus, nøkkerose/vannlilje, edelweiss | blåveis, kusymre, marisko, solblom, rosenrot, fjellsmelle, reinrose, issoleie, tiriltunge, gjøkesyre, engsoleie, linnea, bergknapp, fagerklokke, hestehov, veronika, vendelrot, røsslyng, geitrams, nyperose, vintergjæk, morgenfrue",
    ),
    sp(
      "Nevn et musikkinstrument",
      "gitar/el-gitar/elgitar, piano, trommer/trommesett, fiolin | fløyte, trompet, saksofon, bassgitar/bass, cello, klarinett, munnspill, ukulele, keyboard, orgel | trekkspill/akkordeon, harpe, banjo, mandolin, tuba, trombone, xylofon, blokkfløyte, kontrabass, obo, fagott, hardingfele, panfløyte, triangel, tamburin, synthesizer/synth | sitar, didgeridoo, sekkepipe, bongotrommer/bongo, djembe, kastanjetter, maracas, marimba, vibrafon, glockenspiel, cembalo, lyre, lut, siter, balalaika, bouzouki, kalimba, theremin, melodika, valthorn, piccolofløyte, kornett, steelpan, cajon, langeleik, munnharpe, seljefløyte, bukkehorn, lur, bratsj, pauker | koto, shamisen, erhu, guzheng, pipa, oud, kora, mbira, tabla, sarangi, shakuhachi, duduk, handpan/hang, nyckelharpa, lirekasse/hurdy-gurdy, celesta, kantele, guiro, cabasa, timbales, surdo, berimbau, charango, quena, okarina, kazoo, tinwhistle, bandoneon, concertina, harmonium, cimbalom",
    ),
    sp(
      "Nevn et stjernetegn",
      "Løven/Leo, Skorpionen/Scorpio, Tvillingene/Gemini | Fiskene/Pisces, Væren/Aries, Tyren/Taurus, Vannmannen/Aquarius | Steinbukken/Capricorn, Jomfruen/Virgo, Krepsen/Cancer | Vekten/Libra, Skytten/Sagittarius | Slangebæreren/Ophiuchus",
    ),
    sp(
      "Nevn en elv i Europa",
      "Donau, Rhinen/Rhin, Themsen, Seinen, Glomma | Volga, Elben/Elbe, Loire, Rhône, Po, Tiberen/Tiber, Ebro, Tajo/Tejo, Oder, Wisła/Weichsel/Vistula, Dnepr, Don, Numedalslågen, Drammenselva, Gudbrandsdalslågen/Lågen, Tana/Tanaelva, Altaelva/Alta, Akerselva | Main, Mosel, Ruhr, Neckar, Inn, Garonne, Dordogne, Douro/Duero, Guadalquivir, Guadiana, Arno, Adige, Maas/Meuse, Schelde, Weser, Ems, Vltava/Moldau, Dnestr, Bug, Njemen/Memel, Daugava/Düna, Narva, Klarälven, Torneälven/Torne, Göta älv, Dalälven, Namsen, Gaula, Orkla, Otra, Skienselva, Begna, Lærdalselva | Reisaelva, Målselva, Vefsna, Driva, Rauma, Alna, Pasvikelva, Severn, Trent, Shannon, Liffey, Clyde, Tay, Spey, Tweed | Ural, Petsjora/Pechora, Kama, Oka, Nordlige Dvina/Dvina, Sava, Drava, Tisza, Morava, Prut, Mureș, Olt, Iskar, Maritsa, Vardar, Kemijoki, Oulujoki, Ångermanälven, Indalsälven, Ljusnan, Umeälven, Luleälven, Kymijoki, Neva, Svir, Desna, Pripjat, Warta, Saône, Marne, Somme, Isère, Durance, Lot, Tarn, Charente, Aare, Reuss, Limmat, Ticino, Mincio, Piave, Tagliamento, Brenta, Reno, Mondego, Minho, Júcar, Segura",
    ),
  ),
  dag(
    sp(
      "Nevn en indisk rett",
      "butter chicken/smørkylling, tikka masala/chicken tikka masala/kylling tikka masala, naan/nanbrød, samosa | korma, vindaloo, biryani, tandoori/tandoorikylling, dal/daal/dhal, pakora, raita, lassi/mango lassi, palak paneer/saag paneer, chana masala, rogan josh | jalfrezi, madras, bhuna, dopiaza, pasanda, aloo gobi, dosa, idli, vada, sambar, paratha, chapati/roti, papadum/poppadom, kheer, gulab jamun, chai, chutney, løkbhaji/onion bhaji/bhaji, keema, malai kofta, paneer tikka, rasmalai, jalebi | dhansak, balti, pav bhaji, vada pav, pani puri/golgappa, bhel puri, chole bhature, rajma, kadhi, khichdi, pongal, uttapam, rasam, appam, puttu, avial, thali, dum aloo, baingan bharta, matar paneer, kulfi, laddu/ladoo, barfi, halwa, gajar halwa, shrikhand, nihari, haleem, laal maas, goan fish curry, xacuti | sorpotel, misal pav, dhokla, thepla, undhiyu, litti chokha, sarson da saag, makki di roti, kosha mangsho, machher jhol, rosogolla, sandesh, mishti doi, modak, puran poli",
    ),
    sp("Nevn et land som begynner på K", "#CN, #HR | #KE, #XK, #CY, #KW | #KH, #CM, #KZ, #CD/Kongo, #CG | #KG, #CV, #KM, #KI | @start:K"),
    sp(
      "Nevn en ugle",
      "hubro, snøugle, kattugle | tårnugle/kirkeugle, hornugle, perleugle, spurveugle | haukugle, slagugle, lappugle, jordugle | steinugle, dverghornugle, prærieugle/gravugle, alveugle, fiskeugle | brilleugle, virginiahubro, blakistonfiskeugle",
    ),
    sp(
      "Nevn en film med Tom Hanks",
      "Forrest Gump, Cast Away, Toy Story, Saving Private Ryan, Philadelphia | Big, Den grønne mil/The Green Mile, Apollo 13, Da Vinci-koden/The Da Vinci Code, Catch Me If You Can, The Terminal, Søvnløs i Seattle/Sleepless in Seattle, Du har fått mail/You've Got Mail | Captain Phillips, Splash, Road to Perdition, Engler og demoner/Angels & Demons, Inferno, Sully, The Post, Bridge of Spies, Polar Express/The Polar Express, Cloud Atlas, Larry Crowne, Elvis, En mann ved navn Otto/A Man Called Otto, Finch, Greyhound, News of the World, Asteroid City | Charlie Wilson's War, Turner & Hooch, A League of Their Own, Saving Mr. Banks, The Ladykillers, That Thing You Do!, Bachelor Party, Dragnet, The 'Burbs, Joe Versus the Volcano, Punchline, Nothing in Common, Here, Pinocchio, A Beautiful Day in the Neighborhood, The Circle, Extremely Loud & Incredibly Close, A Hologram for the King, The Money Pit, Volunteers | Mazes and Monsters, He Knows You're Alone, The Man with One Red Shoe, Every Time We Say Goodbye, The Bonfire of the Vanities, Radio Flyer",
    ),
    sp(
      "Nevn noe du kan ha i et pennal",
      "blyant, viskelær, linjal, penn | blyantspisser/spisser, fargeblyant/fargeblyanter, tusj, kulepenn, passer, gradskive, merkepenn/markeringstusj | limstift/lim, saks, kalkulator, fyllepenn, retteroller/korrekturlakk, binders, strikk, vinkelhake/trekantlinjal, trykkblyant/stiftblyant, gelpenn | fargestifter/fargekritt, kritt, sjablong, minnepinne | blekkpatron, fineliner, penselpenn, stifter, tegnestift, post-it/gule lapper, maskeringstape/tape, kalligrafipenn, blyantstift/stifter til trykkblyant",
    ),
    sp("Nevn en hovedstad i Nord- eller Sør-Amerika", "$US, $CA, $MX | $BR, $AR, $CU, $CL, $PE | $CO, $VE, $JM, $PA, $UY, $EC, $BO | $PY, $CR, $GT, $HN, $NI, $SV, $DO, $HT, $BS | @hovedstad:Sør-Amerika, @hovedstad:Nord-Amerika"),
  ),
  dag(
    sp(
      "Nevn en japansk rett",
      "sushi, ramen, sashimi, tempura | teriyaki, misosuppe/miso, udon, edamame, gyoza, yakitori, onigiri, mochi, tonkatsu/katsu, maki | soba, donburi, sukiyaki, shabu-shabu, okonomiyaki, takoyaki, nigiri, temaki, unagi, karaage, katsudon, oyakodon, gyudon, tamagoyaki, natto, chawanmushi, dorayaki, taiyaki, japansk karri/kare raisu, yakisoba, omurice, nikujaga, bento | oden, tsukemen, hiyashi chuka, chirashi, inarizushi/inari, oshizushi, korokke, menchi katsu, agedashi tofu, nabe, yudofu, kushikatsu, monjayaki, hambagu, umeboshi, tsukemono, dango, anmitsu, kakigori, senbei, zaru soba | kaiseki, wagashi, sunomono, ochazuke, zosui, kitsune udon, tanuki soba, motsunabe, chanko nabe, hitsumabushi",
      { nei: "poke, dim sum, kimchi, pad thai" },
    ),
    sp("Nevn et land som grenser til Sveits", "#DE, #FR, #IT | #AT | #LI | | @naboer:CH"),
    sp(
      "Nevn en hval eller delfin",
      "blåhval, spekkhogger, knølhval, narhval, delfin | kaskelott/spermhval, vågehval, finnhval, hvithval/beluga, grønlandshval, nise | seihval, nebbhval, grindhval, gråhval, nordkaper/retthval, brydehval, kvitnos, tumler | kvitskjeving, stripedelfin, amazondelfin/elvedelfin, sørkaper, dvergretthval, dvergkaskelott, spinnerdelfin, flekkdelfin, risso-delfin/rissodelfin | vaquita/kalifornianise, irrawaddydelfin, hectordelfin, gangesdelfin, cuviernebbhval, baird-nebbhval",
    ),
    sp(
      "Nevn et eventyr av H.C. Andersen",
      "Den lille havfrue/Den lille havfruen, Den stygge andungen, Keiserens nye klær, Prinsessen på erten | Snødronningen, Tommelise, Den lille piken med svovelstikkene/Piken med svovelstikkene, Den standhaftige tinnsoldat/Tinnsoldaten, Fyrtøyet | Nattergalen, De ville svanene/De ville svaner, Svinedrengen, Lille Claus og store Claus, Grantreet, De røde skoene, Hyrdinnen og skorsteinsfeieren, Klods-Hans, Ole Lukkøye | Reisekameraten, Snømannen, Skyggen, Stoppenålen, Engelen, Lykkens kalosjer, Elverhøi, Den flygende koffert, Storkene, Rosenalfen, Klokken, Iskjomfruen, Pengegrisen, Det er ganske visst | Ib og lille Christine, Alt hva fatter gjør det er det rette, Hjertesorg, Gartneren og herskapet, Tante Tannpine, Den lille Idas blomster, Bestemor, Flaskehalsen",
      { nei: "Rødhette, Hans og Grete, Askepott, Snøhvit, Tornerose, Rapunsel" },
    ),
    sp(
      "Nevn en type sko",
      "joggesko/sneakers, støvler, sandaler, tøfler | høye hæler/høyhælte sko, gummistøvler, fotballsko, dansesko, ballerinasko, loafers, mokasiner | slalåmstøvler, pumps, stiletter, espadriller, clogs/tresko/crocs, vintersko, fjellsko/fjellstøvler, chelsea boots, cowboystøvler, brogues, oxford, platåsko, kilehæl, flip-flops, piggsko | golfsko, klatresko, sykkelsko, tennissko, basketsko, skisko | derbysko, monkstrap, mules, slingback, peeptoe, ugg/uggs, vadere, skaller/skallesko, lakksko",
    ),
    sp(
      "Nevn et språk som er offisielt i et land i Europa",
      "norsk, svensk, dansk, engelsk, tysk, fransk | spansk, italiensk, finsk, islandsk, nederlandsk, polsk, portugisisk, russisk, gresk | ukrainsk, ungarsk, tsjekkisk, slovakisk, rumensk, bulgarsk, kroatisk, serbisk, slovensk, estisk, latvisk, litauisk, irsk, maltesisk, luxembourgsk, albansk, makedonsk, bosnisk, montenegrinsk, belarusisk/hviterussisk, samisk/nordsamisk | katalansk, baskisk, galisisk, walisisk/kymrisk, færøysk, retoromansk/rætoromansk, frisisk, tyrkisk | latin, skotsk-gælisk/gælisk",
      { nei: "esperanto, arabisk, kinesisk, flamsk" },
    ),
  ),
  dag(
    sp(
      "Nevn en alkoholfri drikk",
      "vann, melk, juice/appelsinjuice, brus | kaffe, te, kakao/varm sjokolade, saft, cola, smoothie, eplejuice, iste, mineralvann/kullsyrevann | energidrikk, sportsdrikk, kefir, kulturmelk, sjokolademelk/sjokomelk, milkshake, limonade, tonic, ginger ale, kokosvann, mandelmelk, havremelk, soyamelk, lassi, bubble tea/boble-te, julebrus, alkoholfritt øl | kombucha, ayran, horchata, mate/yerba mate, rooibos, tomatjuice, grønnsaksjuice, mysedrikk, rabarbrasaft, solbærtoddy, ingefærshot| ",
      { nei: "øl, vin, cider, sprit, gløgg, akevitt" },
    ),
    sp("Nevn et land i Oseania", "#AU, #NZ | #FJ, #PG | #WS, #TO, #SB, #VU | #KI, #TV, #NR, #PW, #MH, #FM | @kontinent:Oseania"),
    sp(
      "Nevn en ferskvannsfisk i Norge",
      "ørret, laks, gjedde, abbor | røye, sik, harr, ål | mort, brasme, lake, krøkle, gjørs, karpe, sjøørret, regnbueørret | karuss, suter, sørv, vederbuk, stam, ørekyt, hork, asp, laue, steinsmett, stingsild, bekkerøye | niøye, elveniøye, bekkeniøye, pukkellaks, gullfisk",
      { nei: "torsk, sei, makrell, sild, hyse" },
    ),
    sp(
      "Nevn et medlem av den norske kongefamilien, nå eller før",
      "Kong Harald/Harald, Dronning Sonja/Sonja, Kronprins Haakon/Haakon, Kronprinsesse Mette-Marit/Mette-Marit | Prinsesse Ingrid Alexandra/Ingrid Alexandra, Prins Sverre Magnus/Sverre Magnus, Prinsesse Märtha Louise/Märtha Louise, Marius Borg Høiby/Marius | Durek Verrett/Durek, Ari Behn, Maud Angelica Behn/Maud Angelica, Leah Isadora Behn/Leah, Emma Tallulah Behn/Emma, Prinsesse Astrid/Astrid | Kong Olav/Olav, Kronprinsesse Märtha, Kong Haakon VII/Haakon VII, Dronning Maud/Maud, Prinsesse Ragnhild/Ragnhild | ",
    ),
    sp(
      "Nevn et ord som rimer på «sol»",
      "stol | pol, fiol | nordpol, sørpol, sydpol, symbol, idol, pistol, alkohol, rullestol, lenestol, gyngestol | kontorstol, barnestol, kjøkkenstol, hagestol, solstol, monopol, metropol, Tyrol, Kabul, karriol | kolesterol, mentol, etanol, metanol, glykol, fenol, vitriol, trestol, glyserol",
      { streng: true, nei: "sol, skole, kjole" },
    ),
    sp(
      "Nevn en gresk gud eller gudinne",
      "Zevs/Zeus, Poseidon, Hades, Afrodite/Aphrodite, Athene/Athena | Apollon/Apollo, Hera, Ares, Hermes, Artemis, Dionysos, Hefaistos/Hephaistos, Demeter | Hestia, Persefone/Persephone, Eros, Nike, Gaia, Kronos, Pan, Helios, Selene, Eos, Nemesis, Tyche, Hypnos, Thanatos, Iris, Hekate, Uranos, Rhea, Asklepios, Herakles | Hebe, Eileithyia, Morfevs/Morpheus, Eris, Nyx, Erebos, Kaos/Khaos, Okeanos, Tethys, Themis, Mnemosyne, Hyperion, Theia, Prometevs/Prometheus, Atlas, Epimetevs/Epimetheus, Triton, Protevs/Proteus, Nerevs/Nereus, Amfitrite, Pontos, Tartaros, Ananke, Aiolos, Boreas, Zefyros, Harmonia | Kalliope, Klio, Erato, Euterpe, Melpomene, Polyhymnia, Terpsikhore, Thalia, Urania, Koios, Kreios, Iapetos, Foibe/Phoebe, Deimos, Fobos, Notos",
      { nei: "Jupiter, Mars, Venus, Odin, Tor" },
    ),
  ),
]
