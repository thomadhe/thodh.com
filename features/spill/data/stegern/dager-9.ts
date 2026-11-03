import { dag, sp } from "./typer"

// Days 36–40.
export const dager9 = [
  dag(
    sp(
      "Nevn en tesort eller urtete",
      "grønn te, svart te, kamillete/kamille, peppermyntete/peppermynte | earl grey, rooibos, ingefærte, chai, jasminte, matcha, nypete, fruktte, iste | oolong, english breakfast, darjeeling, assam, sencha, lapsang souchong, hvit te, pu-erh, mate/yerba mate, hibiskuste/hibiskus, brenneslete, salvie, sitronmelisse, fennikelte, lakriste, lindeblomst | genmaicha, gyokuro, hojicha, bancha, kukicha, ceylon, keemun, longjing/dragebrønn, tieguanyin, silver needle, bai mu dan, honeybush, lapacho, guayusa, rød te, chaga | kombucha, bubble tea, masala chai, thai iste, yuzu-te, ringblomst, rosehip",
    ),
    sp("Nevn et land som grenser til Tanzania", "#KE, #UG | #RW, #MZ, #ZM | #CD, #MW | #BI | @naboer:TZ"),
    sp(
      "Nevn en selart eller hvalross",
      "hvalross, sjøløve, steinkobbe | havert, grønlandssel, ringsel | klappmyss, storkobbe, elefantsel, leopardsel | weddellsel, krabbeetersel, munkesel, pelssel | rosssel, båndsel, flekksel, bajkalsel, kaspisel",
      { nei: "oter, pingvin, delfin, nise" },
    ),
    sp(
      "Nevn en person i Game of Thrones",
      "Jon Snow/Jon, Daenerys/Daenerys Targaryen, Tyrion/Tyrion Lannister, Arya/Arya Stark, Cersei/Cersei Lannister | Sansa/Sansa Stark, Ned Stark/Eddard Stark, Joffrey, Jaime/Jaime Lannister, Bran/Bran Stark, Khal Drogo/Drogo, Hodor, Robb Stark/Robb, Hunden/Sandor Clegane/The Hound, Lillefinger/Littlefinger/Petyr Baelish, Theon/Theon Greyjoy, Brienne | Varys, Samwell/Samwell Tarly, Ramsay Bolton/Ramsay, Margaery, Stannis, Melisandre, Jorah, Tywin, Catelyn, Ygritte, Gendry, Davos, Missandei, Grey Worm, Fjellet/Gregor Clegane/The Mountain, Oberyn, Nattkongen/Night King, Tormund, Bronn, Podrick, Robert Baratheon, Viserys, Rickon, Tommen, Myrcella, Olenna, Lyanna Mormont, Daario, Ellaria, Shae, Gilly, High Sparrow, Euron, Yara/Asha, Hot Pie, Jaqen H'ghar, Qyburn, Drogon, Rhaegal, Viserion, Ghost | Rhaegar, Lyanna Stark, Benjen, Lysa Arryn, Robin Arryn, Walder Frey, Roose Bolton, Mance Rayder, Thoros, Beric, Syrio Forel, Osha, Meera, Jojen, Craster, Edmure, Blackfish/Brynden Tully, Doran Martell, Obara, Tyene, Kevan, Lancel, Pycelle, Maester Aemon, Alliser Thorne, Janos Slynt, Ilyn Payne, Meryn Trant, Barristan Selmy, Irri, Doreah, Xaro, Pyat Pree, Nymeria, Summer, Grey Wind, Shaggydog, Lady | Rhaenyra, Daemon Targaryen, Alicent, Aegon Targaryen, Aemond, Corlys Velaryon, Rhaenys, Criston Cole, Otto Hightower, Dunk, Egg",
    ),
    sp(
      "Nevn et verktøy",
      "hammer, sag, skrutrekker, tang | drill/bormaskin, skiftenøkkel, vater, målebånd, tommestokk/meterstokk, øks, spade, kniv | høvel, meisel, fil, sandpapir, tvinge, stiftepistol, unbrakonøkkel/umbraconøkkel, fastnøkkel, pipenøkkel, skralle/skrallenøkkel, slagdrill, stikksag, sirkelsag, båndsag, slipemaskin, multiverktøy, avbitertang, nebbtang, rørtang, baufil, hagesaks, rake, trillebår, spett, kubein/brekkjern, motorsag, vinkelsliper, loddebolt, limpistol, vinkelhake, skruestikke | kittkniv, sparkel, murskje, pensel, malerull, høvelbenk, dreiebenk, overfres/fres, dykksag, kappsag, gjæringssag, popnagletang, gjengetapp, kjørner, stemjern, spikerpistol, slegge, ljå, sigd, hakke, høygaffel, sveiseapparat, polermaskin, multimeter, momentnøkkel, skyvelære, mikrometer, laservater | dor, hoggjern, kløyvøks, grev, krafse, rasp,, syl, sylskrape, tappejern,",
    ),
    sp(
      "Nevn en øy i Karibia",
      "Cuba, Jamaica, Puerto Rico, Bahamas, Barbados | Hispaniola/Haiti, Trinidad, Tobago, Aruba, Curaçao, St. Lucia/Saint Lucia, Grenada, Martinique, Guadeloupe, Den dominikanske republikk | Antigua, Barbuda, St. Kitts/Saint Kitts, Nevis, Dominica, St. Vincent/Saint Vincent, Grenadinene, Bonaire, Caymanøyene/Cayman Islands/Grand Cayman, Turks- og Caicosøyene, St. Thomas, St. John, St. Croix, Tortola, Anguilla, Montserrat, St. Martin/Sint Maarten, St. Barths/Saint-Barthélemy, Isla Margarita/Margarita | Saba, Sint Eustatius, Isla de la Juventud, Vieques, Culebra, Andros, Eleuthera, New Providence, Grand Bahama, Abaco, Bequia, Mustique, Carriacou, Virgin Gorda, Jost Van Dyke, Anegada, Marie-Galante, Les Saintes | Cozumel, San Andrés, Roatán, Isla Mujeres, Utila, Little Cayman, Cayman Brac, Bimini, Exuma, Inagua, Water Island, Navassa",
    ),
  ),
  dag(
    sp(
      "Nevn et melkeprodukt",
      "melk, ost, yoghurt, smør | fløte, rømme, kesam, cottage cheese | kefir, kremfløte, matfløte, crème fraîche, is, skyr | kulturmelk/surmelk, kvarg, brunost, prim, ghee, kondensert melk, melkepulver, mysost, mascarpone, ricotta, sjokolademelk, lettmelk, skummet melk, helmelk | ayran, lassi, labneh, kumys, tjukkmjølk, gomme, myse, råmelk, dulce de leche, clotted cream, smetana, quark, filmjölk, piimä",
    ),
    sp("Nevn et land som begynner på I", "#IT, #IS, #IN | #IE, #IR, #IQ, #IL, #ID | | | @start:I"),
    sp(
      "Nevn et dyr som er utdødd",
      "dinosaur, mammut, dronte/dodo, sabeltanntiger | geirfugl, moa, pungulv/tasmansk tiger, kjempehjort/irsk kjempehjort, ullhåret neshorn, urokse, vandredue, stellersjøku/stellerku, kvagga, hulebjørn, megalodon | trilobitt, ammonitt, mosasaur, plesiosaur, ichthyosaur | terrorfugl, elefantfugl, glyptodon, kjempedovendyr/megatherium, diprotodon, baiji/kinesisk elvedelfin, gullpadde, pyreneisk steinbukk, karibisk munkesel, japansk ulv, carolinaparakitt, labradorand, tyrannosaurus/t-rex, triceratops, pterosaur/pteranodon | thylacoleo, smilodon, mastodont, deinotherium, andrewsarchus, dunkleosteus, arthropleura, meganeura, hallucigenia, anomalocaris, quetzalcoatlus, titanoboa, gigantopithecus, kjempebever, hulehyene, hulelove, tarpan, Atlas-bjørn, bali-tiger, java-tiger, kaspisk tiger, vestlig svart neshorn, falklandsrev",
      { nei: "panda, isbjørn, elefant, neshorn, tiger, ulv, drage, enhjørning" },
    ),
    sp(
      "Nevn en Harry Potter-bok eller -film",
      "De vises stein/Harry Potter og de vises stein/The Philosopher's Stone, Fangen fra Azkaban/The Prisoner of Azkaban | Mysteriekammeret/The Chamber of Secrets, Ildbegeret/The Goblet of Fire, Dødstalismanene/The Deathly Hallows | Føniksordenen/The Order of the Phoenix, Halvblodsprinsen/The Half-Blood Prince | Fantastiske skapninger/Fantastic Beasts, Det forbannede barnet/The Cursed Child | Grindelwalds forbrytelser/The Crimes of Grindelwald, Humlesnurrs hemmeligheter/The Secrets of Dumbledore, Quidditch gjennom tidene/Quidditch Through the Ages",
    ),
    sp(
      "Nevn et tall mellom 1 og 100 som er delelig med 7",
      "7/sju/syv, 14/fjorten, 21/tjueen/enogtjue | 28/tjueåtte/åtteogtjue, 35/trettifem/femogtretti, 42/førtito/toogførti, 49/førtini/niogførti | 56/femtiseks/seksogfemti, 63/sekstitre/treogseksti, 70/sytti | 77/syttisju/syttisyv/syvogsytti, 84/åttifire/fireogåtti, 98/nittiåtte/åtteognitti | 91/nittien/enognitti",
      { streng: true },
    ),
    sp(
      "Nevn et eventyr samlet av brødrene Grimm",
      "Rødhette/Lille Rødhette, Hans og Grete, Snøhvit, Askepott, Tornerose, Rapunsel/Rapunzel | Froskekongen/Froskeprinsen, Bremer bymusikanter/Musikantene fra Bremen, Rumleskaft/Rumpelstiltskin, Snøhvit og Rosenrød, Ulven og de sju geitekillingene | De sju ravnene, Gåsepiken, Det tapre lille skredderet/Den tapre skredderen, De tolv brødrene, Mor Hulda, Bordet dekk deg, Gullgåsa, Tommeliten, Jorinde og Joringel, De seks svanene | De tolv dansende prinsessene, Fiskeren og hans kone, Djevelen med de tre gullhårene, Jernhans | Allerleirauh, Den gylne fugl, Livets vann, De tolv jegerne, Hans i lykken, Skomakeren og nissene, Bror og søster, Den kloke Else, Kong Drosselskjegg, Sjumilsstøvlene, Tre spinnersker, Brødrene Bjørnskinn/Bjørneskinn",
      { nei: "Den lille havfruen, Den stygge andungen, Prinsessen på erten, Pinocchio, Peter Pan" },
    ),
  ),
  dag(
    sp(
      "Nevn en salat",
      "cæsarsalat/caesarsalat/caesar, gresk salat, potetsalat, pastasalat | coleslaw/kålsalat, rekesalat, italiensk salat, tunfisksalat, kyllingsalat, fruktsalat, waldorfsalat | salade niçoise/nicoisesalat, caprese, tabbouleh, fattoush, panzanella, cobbsalat, tacosalat, quinoasalat, couscoussalat, eggesalat, sildesalat, rødbetsalat, råkost, bønnesalat, linsesalat, agurksalat, tomatsalat, sjøgresssalat/wakame | som tam, larb, gado-gado, russisk salat/olivier, shirazi, chef's salad, insalata di mare, wedge salad, ambrosia, makaronisalat, burratasalat, laksesalat,| ensalada rusa, salade lyonnaise, kachumber, horiatiki, çoban salatası, nam tok",
    ),
    sp("Nevn et land som grenser til Sør-Afrika", "#NA, #BW, #ZW, #MZ | #LS, #SZ | | | @naboer:ZA"),
    sp(
      "Nevn en kjent katt fra film, TV eller tegneserie",
      "Garfield, Tom, Hello Kitty, Felix | Sylvester, Cheshire-katten/Cheshire, Den bestevlede katten/Puss in Boots/Mons, Figaro, Lucifer, Grumpy Cat, Findus, Salem | Duchess, Thomas O'Malley/O'Malley, Marie, Berlioz, Toulouse, Si og Am, Scratchy, Snowball, Crookshanks, Fru Nask/Mrs. Norris, Azrael, Jess | Hobbes, Heathcliff, Top Cat, Doraemon, Jiji, Luna, Meowth, Stimpy, Mr. Bigglesworth, Jonesy, Goose, Dinah, Snagglepuss, Pink Panther/Den rosa panter | Bagpuss, Church, Orion,, Puss, Catbus/Kattebussen, Nermal, Arlene, Mittens,",
    ),
    sp(
      "Nevn en filosof",
      "Platon, Aristoteles, Sokrates, Nietzsche, Kant | Descartes, Marx/Karl Marx, Konfutse/Confucius, Sartre, Kierkegaard, Hegel, Locke, Hobbes, Rousseau, Machiavelli, Voltaire, Spinoza, Hume, Wittgenstein, Arne Næss/Næss | Pythagoras, Heraklit, Demokrit, Epikur, Diogenes, Seneca, Marcus Aurelius, Augustin, Thomas Aquinas/Aquinas, Leibniz, Berkeley, Schopenhauer, John Stuart Mill/Mill, Bentham, Heidegger | Simone de Beauvoir/Beauvoir, Camus, Foucault, Bertrand Russell/Russell, Popper, Hannah Arendt/Arendt, Laozi/Lao Tse/Lao-tse, Buddha, Zenon, Parmenides, Thales | Anaximander, Anaximenes, Empedokles, Protagoras, Plotin, Boethius, Anselm, Abelard, Ockham, Avicenna/Ibn Sina, Averroës/Ibn Rushd, Maimonides, Montaigne, Pascal, Francis Bacon/Bacon, Herder, Fichte, Schelling, Comte, Husserl, Merleau-Ponty, Derrida, Deleuze, Habermas, Adorno, Rawls, Nozick, Quine, Kripke, Rorty, Peirce, William James, Dewey, Frege, Carnap, Zhuangzi, Mencius, Nagarjuna, Hypatia, Mary Wollstonecraft/Wollstonecraft, Gunnar Skirbekk, Hans Skjervheim, Peter Wessel Zapffe/Zapffe, Lars Svendsen, Jon Elster, Judith Butler, Peter Singer, Martha Nussbaum, Slavoj Žižek/Zizek",
    ),
    sp(
      "Nevn en del av øyet",
      "pupill, iris/regnbuehinne, linse, netthinne | hornhinne, øyelokk, øyevipper/vipper, synsnerve, glasslegeme | senehinne/sklera, årehinne, gule flekk/makula, tårekanal, tapper/tappe, staver/stav, tårekjertel, bindehinne, blinde flekk | strålelegeme/ciliærlegeme, fovea/synsgrop, kammervann, øyemuskler/øyemuskel, øyehule, fremre kammer, bakre kammer | zonulatråder, schlemms kanal, meibomske kjertler, limbus, Bruchs membran, pigmentepitel",
      { nei: "øyebryn, nese, panne" },
    ),
    sp(
      "Nevn en valuta",
      "euro, krone/norsk krone, dollar, pund | yen, rubel, yuan/renminbi, franc/sveitsisk franc, rupi/rupee, peso | real, zloty, forint, lira, rand, won, dinar, dirham, riyal/rial, shekel, baht, rupiah, ringgit, D-mark/mark, peseta, drakme, gylden, bitcoin | dong, kuna, escudo, leu, lev, hryvnja, lari, dram, manat, tenge, som, taka, kyat, kip, riel, tugrik, afghani, birr, shilling, naira, cedi, kwacha, kwanza, metical, pula | ariary, rufiyaa, loti, lilangeni, dalasi, leone, ouguiya, nakfa, guarani, boliviano, sol, bolívar, colón, córdoba, lempira, quetzal, balboa, gourde, kina, vatu, pa'anga, tala, spesidaler/riksdaler, skilling, ecu",
    ),
  ),
  dag(
    sp(
      "Nevn en eggerett",
      "omelett, eggerøre, speilegg, kokt egg/bløtkokt egg/hardkokt egg | posjert egg, eggs benedict, frittata, eggedosis, quiche, eggesalat, fylte egg/devilled eggs | shakshuka, tortilla/spansk omelett, scotch egg, huevos rancheros, eggs florentine, tamagoyaki, egg fu yung, sufflé/soufflé, menemen, croque madame | carbonara, eggekake, egg og bacon | oeufs cocotte/bakte egg,, eggedråpesuppe, kuku sabzi, chawanmushi, oyakodon, çılbır, eggs royale,, kaiserschmarrn, pannekake,, zabaione",
    ),
    sp("Nevn et land som grenser til Peru", "#BR, #CL | #BO, #EC, #CO | | | @naboer:PE"),
    sp(
      "Nevn en svømmeart",
      "crawl/fristil, bryst/brystsvømming | rygg/ryggsvømming, butterfly/delfin | hundesvømming, medley | sidesvømming, livredningssvømming | trudgen, elementær ryggsvømming",
    ),
    sp(
      "Nevn en Michael Jackson-låt",
      "Thriller, Billie Jean, Beat It, Bad, Smooth Criminal | Black or White, Man in the Mirror, Heal the World, Earth Song, They Don't Care About Us, Dirty Diana, Remember the Time, Don't Stop 'Til You Get Enough | Rock with You, Human Nature, P.Y.T., Wanna Be Startin' Somethin', The Way You Make Me Feel, You Are Not Alone, Scream, Leave Me Alone, Off the Wall, Jam, In the Closet, Give In to Me, Will You Be There, Liberian Girl, Another Part of Me, Speed Demon, I Just Can't Stop Loving You, Ben, Blood on the Dance Floor, Stranger in Moscow, You Rock My World | Rockin' Robin, Who Is It, Childhood, Ghosts, Butterflies, Cry, Hollywood Tonight, Love Never Felt So Good, Xscape, Say Say Say, The Girl Is Mine, I Want You Back, ABC, I'll Be There, This Is It, Gone Too Soon,| Dangerous, HIStory, Morphine, Tabloid Junkie, 2 Bad, Unbreakable, Heaven Can Wait, Break of Dawn, Whatever Happens, Threatened",
    ),
    sp(
      "Nevn en kampsport",
      "karate, judo, boksing, taekwondo | kickboksing, bryting, MMA, kung fu, jiu-jitsu/jujutsu, brasiliansk jiu-jitsu/BJJ, aikido, muay thai/thaiboksing, sumo, kendo | fekting, krav maga, capoeira, wing chun, hapkido, sambo, savate, silat, eskrima/kali/arnis, glima, sanda, kyokushin, gresk-romersk bryting, fribryting | kalaripayattu, systema, bartitsu, kyudo, iaido, naginata, bojutsu, HEMA, tai chi/taiji, shorinji kempo, jeet kune do, lethwei, pankration, vovinam | bokator,,, dambe, laamb, schwingen, kurash, ssireum",
    ),
    sp(
      "Nevn en by i Italia",
      "Roma, Venezia/Venedig, Milano, Firenze, Napoli | Pisa, Torino, Verona, Bologna, Genova, Palermo, Siena, Sorrento, Amalfi | Bari, Catania, Bergamo, Padova, Trieste, Lucca, Parma, Modena, Perugia, Assisi, Rimini, Ravenna, Como, Cagliari, Messina, Taormina, Pompeii/Pompei, Brindisi, Lecce, Salerno, Cortina d'Ampezzo/Cortina, San Gimignano, Positano | Ferrara, Mantova, Vicenza, Treviso, Udine, Bolzano, Trento, Brescia, Cremona, Piacenza, Reggio Emilia, Reggio Calabria, Ancona, Pescara, L'Aquila, Taranto, Matera, Potenza, Siracusa, Agrigento, Trapani, Marsala, Sassari, Olbia, Alghero, Livorno, Arezzo, Urbino, Orvieto, Spoleto, Viterbo | Latina, Caserta, Foggia, Cosenza, Catanzaro, Alessandria, Asti, Novara, Aosta, La Spezia, Sanremo, Portofino, Monza, Pavia, Varese, Lecco, Sondrio, Rovigo, Belluno, Pordenone, Gorizia, Ragusa, Noto, Cefalù, Tropea, Gaeta,",
      { nei: "Sicilia, Sardinia, Toscana, Malta, San Marino" },
    ),
  ),
  dag(
    sp(
      "Nevn en ingrediens i en vanlig kake",
      "mel/hvetemel, sukker, egg, smør | bakepulver, melk, vaniljesukker/vanilje, kakao, gjær, salt, natron | margarin, fløte, sjokolade, kardemomme, kanel, rosiner, nøtter, mandler, olje, sirup, honning, melis/flormelis, brunt sukker, havregryn, kokos, sitron/sitronskall | kesam, kremost, rømme, yoghurt, marsipan, krem, syltetøy, gelé, epler, gulrøtter, bananer, bær, maisenna/maisstivelse, potetmel, kaffe, mandelmel, fruktsukker | xantangummi, hjortetakksalt, pottaske, karamellfarge, trimolin, glukosesirup, tonka, invertsukker",
    ),
    sp("Nevn et land som begynner på A", "#AU, #AR | #AF, #AL | #DZ, #AM, #AO | #AD, #AZ | @start:A, #US"),
    sp(
      "Nevn et dyr som lever i Arktis",
      "isbjørn, hvalross, fjellrev/polarrev, sel | reinsdyr, moskus, narhval, hvithval/beluga, snøugle, lemen, polarulv/ulv, grønlandshval, ringsel, snøhare/polarhare | alkekonge, lunde, polarmåke, ismåke, polartorsk, grønlandshai/håkjerring, krill, ærfugl, polarlomvi, havhest, krykkje, snøspurv, svalbardrype/fjellrype | jerv, kortnebbgås, hvitkinngås, ringgås, storkobbe, klappmyss, grønlandssel |, røye,, sabinemåke, rosenmåke, fjelljo, polarjo, polarsnipe, steinvender, sandløper, havelle, praktærfugl, gulnebblom",
      { nei: "pingvin, keiserpingvin, kenguru, løve" },
    ),
    sp(
      "Nevn en James Bond-film",
      "Skyfall, Goldfinger, Casino Royale, Dr. No, No Time to Die | GoldenEye, Spectre, Quantum of Solace, From Russia with Love/Fra Russland med kjærlighet, Thunderball, You Only Live Twice/Man lever bare to ganger, Live and Let Die/Lev og la dø, The Spy Who Loved Me/Spionen som elsket meg, Moonraker, Die Another Day/Dø en annen dag | Tomorrow Never Dies/Morgendagen dør aldri, The World Is Not Enough/Verden er ikke nok, A View to a Kill, Octopussy, For Your Eyes Only/Bare for dine øyne, Licence to Kill/Med rett til å drepe, The Living Daylights, On Her Majesty's Secret Service/I hennes majestets hemmelige tjeneste, Diamonds Are Forever/Diamanter varer evig, The Man with the Golden Gun/Mannen med den gyldne pistol | Never Say Never Again | ",
    ),
    sp(
      "Nevn et sted på Svalbard",
      "Longyearbyen, Ny-Ålesund, Barentsburg | Svea/Sveagruva, Pyramiden, Spitsbergen, Bjørnøya, Nordaustlandet | Hopen, Edgeøya, Barentsøya, Kong Karls Land, Prins Karls Forland, Isfjorden, Kongsfjorden, Hornsund, Van Mijenfjorden, Adventdalen, Kvitøya | Hiorthhamn, Grumant, Colesbukta, Kapp Linné, Magdalenefjorden, Smeerenburg, Virgohamna, Kinnvika, Sjuøyane, Wijdefjorden, Newtontoppen, Austfonna, Vestfonna, Hornsundtind, Platåberget, Bolterdalen, Bjørndalen, Endalen, Longyearbreen, Tempelfjorden, Billefjorden, Hinlopenstretet, Storfjorden | Moffen, Danskøya, Amsterdamøya, Petuniabukta, Perriertoppen, Larsbreen, Gruve 7, Hotellneset, Fuglehuken, Kapp Thordsen, Bellsund, Recherchefjorden, Kapp Lee",
    ),
    sp(
      "Nevn en by i USA",
      "New York, Los Angeles, Chicago, San Francisco, Las Vegas, Miami | Washington/Washington D.C., Boston, Seattle, Houston, Dallas, Philadelphia, New Orleans, Orlando, Atlanta, San Diego, Detroit, Denver | Phoenix, Austin, Nashville, Memphis, Portland, Minneapolis, Baltimore, Pittsburgh, Cleveland, Honolulu, Salt Lake City, San Antonio, St. Louis, Kansas City, Indianapolis, Milwaukee, Cincinnati, Sacramento, San Jose, Tampa, Charlotte, Anchorage, Albuquerque, Tucson, Oakland, Buffalo, Hollywood, Brooklyn, Fargo, Minot, Juneau, Santa Fe, Key West, Palm Springs, Aspen | Boise, Omaha, Des Moines, Little Rock, Jackson, Birmingham, Montgomery, Raleigh, Richmond, Norfolk, Hartford, Providence, Albany, Burlington, Concord, Augusta, Dover, Annapolis, Trenton, Columbus, Lansing, Madison, Springfield, Topeka, Wichita, Lincoln, Bismarck, Pierre, Helena, Cheyenne, Carson City, Reno, Spokane, Tacoma, Eugene, Fresno, Bakersfield, Long Beach, Santa Barbara, Santa Monica, Malibu, Pasadena, Anaheim, El Paso, Fort Worth, Arlington, Plano, Lubbock, Galveston, Corpus Christi, Tulsa, Oklahoma City, Louisville, Lexington, Knoxville, Chattanooga, Savannah, Charleston, Jacksonville, Tallahassee, Fort Lauderdale, St. Petersburg, Gainesville | Duluth, St. Paul, Green Bay, Ann Arbor, Grand Rapids, Toledo, Akron, Dayton, Rochester, Syracuse, Newark, Jersey City, Atlantic City, Wilmington, Scranton, Erie, Flint, Gary, Peoria, Rockford, Sioux Falls, Rapid City, Fairbanks, Hilo, Flagstaff, Sedona, Las Cruces, Boulder, Vail, Park City, Moab, Yuma",
      { nei: "Texas, California, Florida, Hawaii, Alaska, Toronto, Vancouver" },
    ),
  ),
]
