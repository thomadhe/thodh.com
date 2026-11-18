import { dag, sp } from "./typer"

// Days 76–80.
export const dager17 = [
  dag(
    sp(
      "Nevn noe du finner i et klasserom",
      "tavle/krittavle, pult, stol, lærer | elev, kateter, bøker/bok, blyant, viskelær, kart/verdenskart, klokke, vindu, søppelbøtte/søppelkasse, hylle, PC/datamaskin, prosjektor, smartboard/smarttavle, whiteboard | pennal, linjal, saks, lim/limstift, kritt, tusj, globus, oppslagstavle, plakat, sekk/skolesekk, skap, knagg, timeplan, lampe, gardiner, vask, kalender, nettbrett/iPad, Chromebook, høyttaler, dør | hullemaskin, stiftemaskin, blyantspisser/spisser, kladdebok, skrivebok, arbeidsbok, lærebok, ordbok, atlas, matpakke, drikkeflaske, gymbag, svamp, tavlesvamp, magneter, radiator, persienner, ringperm/perm, ark, papir, fargeblyanter, binders, tegnestift, alfabetplakat, gangetabell | elevarbeider, akvarium, potteplante, klassekart, ordensregler, lesekrok, pute",
    ),
    sp("Nevn et land som grenser til Albania", "#GR | #ME, #MK | #XK | | @naboer:AL", { nei: "Italia, Serbia, Bosnia-Hercegovina, Kroatia, Bulgaria" }),
    sp(
      "Nevn en kjent foss",
      "Vøringsfossen, Niagarafallene/Niagara/Niagara Falls, Victoriafallene/Victoria Falls/Victoriafossen | Angel Falls/Salto Ángel/Angelfallet, Iguazú/Iguaçu/Iguazúfallene, De sju søstre/Sju søstre/Dei sju systrene, Låtefossen/Låtefoss, Steinsdalsfossen, Kjosfossen, Mardalsfossen, Sarpsfossen, Rjukanfossen, Gullfoss, Skógafoss | Vettisfossen, Skjervsfossen, Tvindefossen, Brudesløret, Friaren, Månafossen, Langfossen, Kjelsfossen, Feigumfossen, Espelandsfossen, Ringedalsfossen, Tyssestrengene, Hønefossen, Dettifoss, Seljalandsfoss, Svartifoss, Goðafoss/Godafoss, Rhinfallet/Rheinfall, Yosemite Falls, Kaieteur/Kaieteurfossen, Plitvice/Plitvicesjøene | Skykkjedalsfossen, Hengjanefossen, Utigardsfossen/Ramnefjellsfossen, Furebergsfossen, Hesjedalsfossen, Reichenbachfallene, Trümmelbachfallene, Staubbachfallet, Krka, Tugela/Tugelafallene, Jog Falls, Dudhsagar, Huangguoshu, Detian, Sutherland Falls, Gocta | Tännforsen, Njupeskär, Imatrankoski, Bridalveil Fall, Multnomah Falls, Havasu Falls, Montmorency",
    ),
    sp(
      "Nevn en norsk TV-serie",
      "Skam, Lilyhammer, Hotel Cæsar/Hotell Cæsar, Exit | Side om side, Nobel, Okkupert, Vikingane/Norsemen, Ragnarok, Beforeigners, Lykkeland/State of Happiness, Heimebane, Mammon, Rådebank, Førstegangstjenesten, Neste sommer, Jul i Skomakergata, Jul i Blåfjell, Kampen om tungtvannet/The Heavy Water War, Atlantic Crossing, Wisting, Hjem til jul | Mot i brøstet, Fleksnes/Fleksnes fataliteter, Borettslaget, Kampen for tilværelsen, Dag, Himmelblå, Vestavind, Valkyrien, Frikjent, Fallet, Lik meg, Unge lovende, Etaten, Pørni, Blank, Øyevitne, Jul på Månetoppen, Snøfall, Seierherrene, Kodenavn Hunter, Hvaler, Lovleg | Brødrene Dal/Brødrene Dal og professor Drøvel, Post Mortem/Post Mortem: Ingen dør i Skarnes, Furia, Twin | ",
    ),
    sp(
      "Nevn en del av en bil",
      "ratt, hjul, motor, bremser/brems, dekk | girspak/gir, sete/bilsete, setebelte/bilbelte, frontrute, vindusvisker/vindusviskere/viskere, speil/sidespeil/bakspeil/ryggespeil, lys/frontlys/lykt, dør/bildør, panser, bagasjerom/bagasjelokk, støtfanger/kofanger, eksosrør/eksos, batteri, tank/bensintank, radiator, clutch, gasspedal/pedal, airbag/kollisjonspute, dashbord, speedometer, horn/tuter | nummerskilt/skilt, hjulkapsel, felg, tak/soltak, karosseri, chassis, aksel, girkasse, dynamo/generator, startmotor, tennplugg, sylinder, stempel, kamaksel, veivaksel, katalysator, lyddemper, støtdemper, fjæring, bremsekloss, bremseskive, håndbrekk/parkeringsbrems, blinklys, baklys, tåkelys, hanskerom, radio, GPS/navigasjon, vindusspyler, ryggekamera, hodestøtte/nakkestøtte, rute/bilrute, vindu, hjulbue, skjerm | luftfilter, oljefilter, drivstoffpumpe, turbo, intercooler, differensial, drivaksel, styrestag, servostyring, ABS, cruisekontroll/cruise control, parkeringssensor, armlene, setevarmer, hengerfeste, skvettlapp, kjølevifte, vannpumpe, registerreim/registerrem, kardang, vindusheis, sentrallås, bremsepedal, koppholder, dørhåndtak, takstativ, reservehjul, jekk |",
    ),
    sp(
      "Nevn et tall i Fibonacci-følgen under 1000",
      "1/én/ett, 2/to, 3/tre, 5/fem, 8/åtte | 13/tretten, 21/tjueen/enogtjue | 34/trettifire, 55/femtifem, 89/åttini | 144, 233 | 377, 610, 987, 0/null",
      { streng: true, nei: "4, 6, 7, 9, 10, 1000" },
    ),
  ),
  dag(
    sp(
      "Nevn en vietnamesisk rett",
      "pho/phở bò, banh mi, vårruller/chả giò/nem rán | sommerruller/gỏi cuốn/rispapirruller/friske vårruller, bún chả, bún bò Huế, bánh xèo, phở gà, bún/risnudler | cơm tấm, cao lầu, mì Quảng, hủ tiếu, bánh cuốn, bánh bao, cá kho tộ, thịt kho, canh chua, bún riêu, bún thịt nướng, bánh canh, xôi, chè, bánh chưng, lẩu, bò kho, bò lá lốt, nem nướng, cháo, gỏi | bánh khọt, bánh bèo, chả cá Lã Vọng, bún đậu mắm tôm/bun dau mam tom, mì xào, cơm gà, bánh tét, bánh flan, cà ri gà | ",
      { nei: "pad thai, sushi, ramen, tom yum, kimchi" },
    ),
    sp(
      "Nevn et land der man kjører på venstre side av veien",
      "#GB, #JP, #AU | #IE, #NZ, #IN, #ZA, #TH | #MT, #CY, #PK, #BD, #SG, #MY, #ID, #KE, #LK, #JM | #NP, #TZ, #UG, #ZM, #ZW, #MZ, #BW, #NA, #MU, #BS, #BB, #TT, #GY, #SR, #FJ, #BN, #BT, #MV, #SC, #LS, #SZ, #MW, #PG | #WS, #TO, #KI, #TV, #NR, #SB, #TL, #AG, #DM, #GD, #KN, #LC, #VC, #HK, #MO, #IM, #JE, #GG, #BM, #KY, #FK, #VI, #VG, #AI, #MS, #TC, #CK, #NU, #SH, #NF",
      { nei: "Sverige, USA, Tyskland, Frankrike, Kina, Canada, Spania, Italia, Norge" },
    ),
    sp(
      "Nevn en energikilde",
      "sol/solkraft/solenergi/solceller, vind/vindkraft/vindenergi, vann/vannkraft, olje/petroleum | gass/naturgass/LNG, kull, atomkraft/kjernekraft/kjernekraftverk, bølgekraft/bølger, tidevann/tidevannskraft, geotermisk energi/jordvarme/geotermi, bioenergi/biomasse, ved, hydrogen, havvind | torv, uran, biodrivstoff/biodiesel, bensin, diesel, etanol/bioetanol, biogass, fusjon/fusjonskraft/fusjonsenergi, saltkraft/osmosekraft, avfall/avfallsforbrenning, thorium | muskelkraft, skifergass, metan, fjernvarme, solfanger, havstrøm | ",
    ),
    sp(
      "Nevn et kjent monster fra film, bok eller myte",
      "Dracula, Frankensteins monster/Frankenstein, King Kong, Godzilla | varulv, vampyr, zombie, mumie, troll, drage, Loch Ness-monsteret/Nessie, Yeti/den avskyelige snømannen, Bigfoot/Sasquatch, Kraken, Medusa, Minotauros/Minotaurus, kyklop, Alien/Xenomorph, Pennywise/It, Kakemonsteret/Cookie Monster, Sulley/Sully, Gruffalo | Hydra, Sfinks, Grendel, Predator, Freddy Krueger, Jason Voorhees/Jason, Chucky, Gremlins, Mike Wazowski, Jabberwocky, Balrog, Smaug, basilisk, Fenrisulven/Fenrir, Midgardsormen/Jormungand, nøkken, draugen, Kerberos/Cerberus, Skylla, Kharybdis, kimære/Kimaira, golem, Mothra, Ghidorah, The Thing, The Blob, Babadook, Slender Man, Demogorgon, Wendigo, Chupacabra, banshee, ghoul, Krampus, Baba Jaga, Leviatan/Leviathan, Haien/Jaws, dementor, orker/ork | Behemot, Cthulhu, Venom, Kaiju, Moby Dick, mara, hulder/huldra, sjøorm, Lindorm, skrømt, gjenganger, Gorgon, Tyfon, Ekhidna, Ammit, Nian, Kappa, Rakshasa | ",
    ),
    sp(
      "Nevn noe du kan kjøpe på apoteket",
      "medisin/medisiner/legemidler, Paracet/paracetamol/Panodil/Pinex, plaster, Ibux/ibuprofen/Ibumetin/Advil, solkrem | nesespray, hostesaft/hostemedisin, halstabletter/sugetabletter/halspastiller, vitaminer, tran, kondomer/kondom, graviditetstest, termometer, lusekam/lusemiddel, bandasje/gasbind, tannkrem, tannbørste, sjampo, hudkrem/krem, leppepomade, smertestillende, allergimedisin/allergitabletter/cetirizin, håndsprit/Antibac, munnbind, øyedråper, bind, tamponger, bleier, morsmelkerstatning, smokk, nikotintyggegummi/nikotinplaster/Nicorette, p-piller/prevensjon, reseptbelagte medisiner/resept | angrepille, vaksine, Voltaren, Otrivin, Nezeril, Imodium, Bepanthen, Zovirax, aloe vera, salve/sårsalve, fotkrem, deodorant, kompresjonsstrømper/støttestrømper, krykker, blodtrykksmåler, førstehjelpsskrin, flåttfjerner/flåttang, myggmiddel, reisesyketabletter, melatonin, jerntabletter/jern, omega-3, D-vitamin, C-vitamin, magnesium, probiotika, Dispril/acetylsalisylsyre | donorkort, barnemat, ørepropper, sinkkrem, vortemiddel, liktornplaster, glukosemåler, insulin |",
    ),
    sp(
      "Nevn en by i Brasil",
      "Rio de Janeiro/Rio, São Paulo, Brasília, Salvador | Fortaleza, Belo Horizonte, Manaus, Recife, Porto Alegre, Curitiba, Florianópolis | Belém, Natal, Goiânia, Campinas, Santos, Foz do Iguaçu, Maceió, João Pessoa, São Luís, Teresina, Cuiabá, Campo Grande, Vitória, Aracaju, Porto Velho, Macapá, Boa Vista, Rio Branco, Palmas, Ouro Preto, Paraty, Petrópolis, Niterói, Búzios/Armação dos Búzios | Guarulhos, Osasco, Ribeirão Preto, Sorocaba, Uberlândia, Juiz de Fora, Londrina, Joinville, Blumenau, Pelotas, Caxias do Sul, Santarém, Olinda, Ilhéus, Porto Seguro, Bonito, Gramado | Jericoacoara, Campos do Jordão, Diamantina, Parintins, Juazeiro, Petrolina, Manacapuru",
      { nei: "Buenos Aires, Montevideo, Lima, Bogotá, Santiago, Lisboa" },
    ),
  ),
  dag(
    sp(
      "Nevn en type mel eller gryn",
      "hvetemel/siktet hvete, havregryn, sammalt hvete, rugmel | byggmel, maismel, potetmel, speltmel/spelt, grovmel/grovt mel, semulegryn/mannagryn, maisstivelse/maisenna, risgryn/grøtris, bokhvetemel/bokhvete | mandelmel, kokosmel, kikertmel, polenta, bulgur, byggryn, havremel, rismel, fullkornsmel, sammalt rug, siktet rug, glutenfritt mel, hirse, tapioka, havrekli/kli, hvetekli, durumhvete/durum, perlegryn | linmel, quinoamel, hampemel, teffmel, kastanjemel, emmer, enkorn, ølandshvete, sammalt spelt, grahamsmel, kavringsmel, potetflak, couscous | ",
    ),
    sp("Nevn et land som grenser til Bolivia", "#BR, #AR, #PE, #CL | #PY | | | @naboer:BO", { nei: "Ecuador, Colombia, Uruguay, Venezuela" }),
    sp(
      "Nevn et nattaktivt dyr",
      "ugle, flaggermus, pinnsvin, grevling | rev/rødrev, kattugle, hamster, mus/skogmus, rotte, kiwi, koala, vaskebjørn, møll/nattsvermer, kakerlakk | spøkelsesdyr/tarsier, lori, galago/buskbaby, fingerdyr/aye-aye, opossum/pungrotte, wombat, nebbdyr, hyene, gaupe, hulepinnsvin/piggsvin, fennek, sjakal, gekko, skorpion, nattravn, ildflue/lysbille, chinchilla, kinkajou, kakapo, slowloris, flyvehund/flygende rev | leopard, beltedyr/armadillo, skunk, ørkenrotte/springmus, jordsvin, nattape, sovemus/hasselmus, mårhund, ål, blekksprut | ",
    ),
    sp(
      "Nevn en kjent tennisspiller",
      "Roger Federer/Federer, Rafael Nadal/Nadal, Novak Djokovic/Djokovic, Casper Ruud/Ruud, Serena Williams/Serena | Venus Williams/Venus, Andy Murray/Murray, Carlos Alcaraz/Alcaraz, Jannik Sinner/Sinner, Björn Borg/Borg, John McEnroe/McEnroe, Pete Sampras/Sampras, Andre Agassi/Agassi, Steffi Graf/Graf, Maria Sjarapova/Maria Sharapova/Sjarapova/Sharapova, Martina Navrátilová/Navratilova, Iga Świątek/Swiatek, Aryna Sabalenka/Sabalenka, Naomi Osaka/Osaka, Boris Becker/Becker | Ivan Lendl/Lendl, Jimmy Connors/Connors, Stefan Edberg/Edberg, Mats Wilander/Wilander, Chris Evert/Evert, Monica Seles/Seles, Billie Jean King, Arthur Ashe, Rod Laver/Laver, Kim Clijsters/Clijsters, Justine Henin/Henin, Martina Hingis/Hingis, Lleyton Hewitt/Hewitt, Andy Roddick/Roddick, Stan Wawrinka/Wawrinka, Juan Martín del Potro/del Potro, Daniil Medvedev/Medvedev, Alexander Zverev/Zverev, Stefanos Tsitsipas/Tsitsipas, Dominic Thiem/Thiem, Nick Kyrgios/Kyrgios, Coco Gauff/Gauff, Emma Raducanu/Raducanu, Caroline Wozniacki/Wozniacki, Ashleigh Barty/Barty, Simona Halep/Halep, Holger Rune/Rune, Christian Ruud | Petra Kvitová, Victoria Azarenka/Azarenka, Li Na, Ana Ivanović, Marat Safin/Safin, Goran Ivanišević, Gustavo Kuerten/Guga, Jevgenij Kafelnikov/Yevgeny Kafelnikov, Michael Chang, Pat Cash, Ilie Năstase, Guillermo Vilas, Margaret Court, Evonne Goolagong, Elena Rybakina/Rybakina, Jessica Pegula, Taylor Fritz, Ulrikke Eikeri, Nicolai Budkov Kjær, Jelena Janković, Amélie Mauresmo/Mauresmo, Arantxa Sánchez Vicario, Gabriela Sabatini/Sabatini, Jennifer Capriati, Lindsay Davenport | ",
    ),
    sp(
      "Nevn et yrke der man bruker uniform",
      "politi/politibetjent/politimann/politikvinne, brannmann/brannkonstabel/brannkvinne, soldat, sykepleier | pilot, flyvertinne/flyvert/kabinansatt/kabinpersonell, lege/doktor, kokk, sjåfør/bussjåfør, vekter/sikkerhetsvakt/vakt, tollbetjent/toller, konduktør, postbud, ambulansearbeider/paramedic, sjømann/matros, offiser, gardist/kongens garde | fengselsbetjent, trafikkbetjent/parkeringsvakt, lokomotivfører, helsefagarbeider, renholder, servitør, hotellportier/portier, tannlege, kirurg, jordmor, mekaniker, astronaut, kaptein, militærpoliti, sjøoffiser, styrmann, fotballdommer/dommer, prest, kassemedarbeider/kasserer, butikkmedarbeider, bud, flygeleder | jockey, kirkevert, vaktmester, kantinearbeider, bartender, hjemmehjelp, bilmekaniker, legesekretær, apotektekniker, bioingeniør, operasjonssykepleier | ",
    ),
    sp(
      "Nevn en kjent viking",
      "Leiv Eiriksson/Leif Erikson/Leiv Eriksson/Leif Eriksson, Eirik Raude/Erik the Red/Eirik den røde, Harald Hårfagre, Ragnar Lodbrok/Ragnar Lothbrok | Olav Tryggvason, Harald Hardråde, Olav den hellige/Olav Haraldsson/Hellig-Olav, Bjørn Jernside/Bjørn Ironside, Ivar Benløs/Ivar the Boneless, Gange-Rolv/Rollo, Lagertha, Floke/Floke Vilgerdsson/Hrafna-Floke/Floki, Knut den mektige/Knut den store, Harald Blåtann, Sven Tveskjegg, Eirik Blodøks/Erik Blodøks, Egil Skallagrimsson | Gorm den gamle, Ingolf Arnarson, Torfinn Karlsevne, Gudrid Torbjørnsdatter/Gudrid, Frøydis Eiriksdatter/Frøydis, Hastein, Ottar fra Hålogaland/Ottar, Håkon jarl/Håkon Sigurdsson, Tore Hund, Einar Tambarskjelve, Ubbe, Halvdan Ragnarsson/Halfdan Ragnarsson, Sigurd Orm-i-øye, Hvitserk, Aslaug, Magnus Berrføtt, Gunnhild kongemor, Harald Gråfell, Olav Kyrre, Grette Åsmundsson/Grettir, Gunnar fra Lidarende, Håkon den gode, Erling Skjalgsson | Torkjell Høge/Thorkell den høye, Palnatoke, Sigurd Jorsalfare, Vicke Viking/Vicky, Hårek/Hägar, Hikke/Hiccup, Njål, Rurik | ",
      { nei: "Odin, Tor, Loke, Snorre Sturlason" },
    ),
  ),
  dag(
    sp(
      "Nevn noe en baby trenger",
      "bleie/bleier, melk/morsmelk, smokk, barnevogn/vogn | tåteflaske/flaske/sutteflaske, barneseng/seng/sprinkelseng/vugge, babyklær/klær, body, sovepose, dyne, kosedyr/bamse/kosebamse, bilstol/babysete, stellebord, babycall/babymonitor, morsmelkerstatning, grøt/barnegrøt, smekke, kjærlighet, søvn, mamma/mor, pappa/far, foreldre, kos, omsorg | skifteunderlag/stellematte, våtservietter, lue, ullundertøy/ull, bæresele/sele, vippestol/babysitter, lekegrind, rangle, bitering, babybadekar/badebalje, termometer, nesesuger, sinkkrem/krem, vaksiner, babymat, vognpose, teppe/babyteppe, uro, nattlys, trygghet, ro, helsestasjon, D-vitamin/D-dråper, bading | votter, sokker, tøfler, bok/pekebok, musikk, sang, vuggesang, pledd, lekematte, tutekopp, gulpeklut, stellebag |",
    ),
    sp(
      "Nevn en by i Canada",
      "Toronto, Vancouver, Montreal, Ottawa | Calgary, Edmonton, Québec/Quebec City, Winnipeg, Halifax, Victoria | Hamilton, Saskatoon, Regina, St. John's/Saint John's, Whitehorse, Yellowknife, Iqaluit, Kingston, London, Windsor, Mississauga, Brampton, Kitchener, Waterloo, Laval, Gatineau, Charlottetown, Fredericton, Moncton, Thunder Bay, Kelowna, Banff, Whistler, Niagara Falls, Sudbury, Churchill, Jasper | Markham, Surrey, Burnaby, Richmond, Oshawa, Barrie, Guelph, Trois-Rivières, Sherbrooke, Saint John, Red Deer, Lethbridge, Kamloops, Nanaimo, Prince George, Dawson City/Dawson, Inuvik, Sault Ste. Marie, Medicine Hat, Fort McMurray, Lake Louise, Tofino, Peterborough, Saguenay, Lévis, Longueuil, Brandon, Moose Jaw, Prince Albert, Corner Brook, Gander, Parry Sound | ",
      { nei: "Ontario, Alberta, British Columbia, Manitoba, Saskatchewan, Nova Scotia, Yukon, Seattle, Chicago, Anchorage" },
    ),
    sp(
      "Nevn et dyr man kan ha som kjæledyr",
      "hund, katt, kanin, hamster | marsvin, undulat, gullfisk/fisk, hest, papegøye, rotte, mus, kanarifugl, skilpadde, slange | øgle, chinchilla, ilder, akvariefisk, gekko/leopardgekko, skjeggagame, ørkenrotte/springmus, degu, høne/høns, kakadue, nymfeparakitt, dvergkanin, ponni, maisslange, kongepyton/pyton | edderkopp/vogelspinn/tarantell, vandrende pinne/pinneinsekt, aksolotl/axolotl, frosk, eremittkreps, minigris/gris, geit, and, due, leguan/iguana, kameleon, afrikansk dvergpinnsvin/pinnsvin | sau, lama, alpakka, vaktel, salamander, snegle, maur/maurfarm, sukkerglider",
      { nei: "løve, tiger, elefant" },
    ),
    sp(
      "Nevn en kjent robot fra film, TV eller bok",
      "R2-D2, C-3PO, WALL-E, Terminator | Baymax, Optimus Prime, Bumblebee, EVE, RoboCop, Data, Bender, BB-8, Johnny 5/Nummer 5/Number 5, Marvin | K-2SO, HAL 9000/HAL, Ultron, Vision, Sonny, Robby the Robot/Robby, Gort, Maria, Jernkjempen/The Iron Giant/Iron Giant, Rosie, Astro Boy, Doraemon, Mega Man, Megatron, Daleks, Cybermen, K-9, Ava, David, Ash, Bishop, Roz/Den ville roboten, Chappie, IG-11, IG-88 | Mekagodzilla, Dolores, Tik-Tok, Robotboy, Kryten, Mazinger, Gundam, Voltron, T-1000, Mother, TARS, Weebo, Robot, Robbie, Twiki, Cylon, Ultraman | ",
    ),
    sp(
      "Nevn et vanlig norsk etternavn",
      "Hansen, Johansen, Olsen, Larsen, Andersen | Pedersen, Nilsen, Kristiansen, Jensen, Karlsen, Johnsen, Pettersen, Eriksen, Berg, Haugen, Hagen, Johannessen, Andreassen, Jacobsen, Dahl | Jørgensen, Halvorsen, Henriksen, Lund, Sørensen, Jakobsen, Moen, Gundersen, Iversen, Strand, Solberg, Svendsen, Eide, Knutsen, Martinsen, Paulsen, Bakken, Kristoffersen, Mathisen, Lie, Amundsen, Nguyen, Rasmussen, Ali, Lunde, Solheim, Berge, Moe, Nygård, Bakke, Kristensen, Fredriksen, Holm, Lien, Hauge, Christensen, Andresen, Nielsen, Knudsen, Evensen, Sæther, Aas, Myhre, Hanssen, Ahmed, Haugland | Thomassen, Sivertsen, Simonsen, Danielsen, Berntsen, Sandvik, Rønning, Arnesen, Antonsen, Næss, Vik, Haug, Ellingsen, Thorsen, Edvardsen, Birkeland, Isaksen, Gulbrandsen, Ruud, Aasen, Strøm, Myklebust, Tangen, Ødegård, Eliassen, Helland, Bøe, Jenssen, Aune, Mikkelsen, Tveit, Brekke, Abrahamsen, Madsen | Mortensen, Hermansen, Engen, Holmen, Fjeld, Wold, Løken, Bjerke, Dale, Hovland, Sunde, Nordby, Engebretsen, Hoel, Tveiten, Nordli, Hovde, Rød, Sandberg, Khan, Hussain",
    ),
    sp(
      "Nevn en helt, et monster eller et vesen fra gresk mytologi (ikke en gud)",
      "Herakles/Herkules/Hercules, Akilles/Achilles, Odyssevs/Odysseus/Ulysses, Medusa, Minotauros/Minotaurus | Perseus, Thesevs/Theseus, Jason, Pegasus, kyklop/Polyfemos, Hydra/Den lernaiske hydra, Kerberos/Cerberus, kentaur, Sfinks/Sfinksen, Pandora, Prometevs/Prometheus, Ikaros/Icarus, Dedalos/Daidalos, Orfevs/Orpheus, Helena/Helena av Troja, Paris, Hektor, Agamemnon, Ødipus/Oidipus, Narkissos/Narcissus/Narsissus, Atlas, titan, sirene, Trojanske hest/den trojanske hesten | harpy, gorgon, Kimaira/kimære/Chimera, Skylla, Kharybdis, satyr, nymfe, muser/musene, amasone, Ariadne, Andromeda, Penelope, Telemakhos, Patroklos, Ajax/Aias, Midas, Sisyfos, Tantalos, Atalanta, Bellerofon, Kadmos, Elektra, Medea, Antigone, Kirke/Circe, Kalypso, Laokoon, Kassandra, Priamos, Menelaos, Eurydike, Psyke, Adonis, Ganymedes, Europa, Orion, Kastor, Pollux/Polydevkes, argonautene, den nemeiske løven | Argos, Talos, Tyfon, Ekhidna, Hesperidene, moirene/skjebnegudinnene, erinyene/furiene, Lamia, Ladon, Io, Leda, Danaë, Geryon, Antaios, Kheiron/Chiron |",
      { nei: "Zevs, Poseidon, Hades, Athene, Apollon, Hera, Afrodite, Ares" },
    ),
  ),
  dag(
    sp(
      "Nevn en rett med svinekjøtt",
      "ribbe/juleribbe, svinekoteletter/koteletter/kotelett/pork chops, pulled pork, bacon/bacon og egg, medisterkaker | svinestek/flæskesteg, svinefilet/indrefilet, schnitzel, carbonara, spareribs/ribs/BBQ ribs, sursøt svin, char siu, carnitas, al pastor, porchetta, skinke/skinkestek, medisterpølse, pølser, svineknoke/eisbein/schweinshaxe, sideflesk/pork belly/stekt flesk, fleskepannekake, svinekam | stekt flesk med løk, gyros, souvlaki, tonkatsu, katsudon, char siu bao/bao, banh mi, cochinita pibil, choucroute, kassler/kasseler, julesylte/sylte, syltelabb/griseføtter, spekeskinke, hamburgerrygg, bratwurst, tonkotsu, svinegryte, lasagne | flesk og duppe, lapskaus, svinekjøttboller, mapo tofu, schweinebraten, jägerschnitzel, pinchos morunos, adobo, lechon, sisig, cassoulet, jambalaya, chorizo, salami, prosciutto, mortadella, leverpostei, blodpølse, lungemos |",
      { nei: "pinnekjøtt, fårikål, smalahove, fenalår" },
    ),
    sp("Nevn et land som grenser til Kenya", "#TZ, #UG | #ET, #SO | #SS | | @naboer:KE", { nei: "Sudan, Rwanda, Eritrea, Burundi, Zambia" }),
    sp(
      "Nevn en del av hodet eller ansiktet",
      "nese, munn, øye/øyne, øre/ører | panne, kinn, hake, leppe, tenner/tann, tunge, øyenbryn, øyevipper/vipper, hår, hodeskalle/skalle, hjerne, kjeve/kjake | tinning, nesebor, øreflipp, isse, bakhode, pupill, iris, øyelokk, gane, mandler, drøvel, tannkjøtt, kinnbein, hårfeste, skjegg, bart, smilehull, nesetipp, neserot, trommehinne, øregang, øyehule, netthinne, hornhinne, kjeveledd, tyggemuskler, hjernehinne | bihule, tåresekk, tårekanal, ansiktsnerve, underkjeve, overkjeve, hodebunn, ørevoks, neseskillevegg, brusk, lugg, tinningbein, pannebein, nakkehår, munnvik, overleppe, underleppe | ",
      { nei: "hals, nakke, skulder" },
    ),
    sp(
      "Nevn et eventyrvesen eller fabeldyr",
      "enhjørning, drage, troll, nisser/fjøsnisse | havfrue, alv/alver, fe/feer, kentaur, Pegasus, føniks/fønix, hulder/huldra, nøkken, vampyr, varulv, dverg, kjempe/jotne/jotun, heks, julenissen, tannfeen | gnom, sjøorm, kraken, griff, basilisk, sfinks, minotaur, kyklop, sirene, harpy, hydra, Yeti, Bigfoot, Loch Ness-monsteret/Nessie, golem, ånd/genie/djinn, spøkelse, gjenganger, draug/draugen, mara, vette, tomte/tomtegubbe, tusse/haugtusse, Fenrisulven, Midgardsormen, Sleipner, lindorm, kimære, hippogriff, leprechaun, banshee, nymfe, satyr, faun, ork/orker, zombie, varg | kelpie, selkie, dryade, kobold, ent, hobbit, gremlin, mumie, oskoreia, påskeharen, Dovregubben, kappa, kitsune, wyvern, mantikora, roc/rokk, kirin, qilin, thunderbird, tengu, oni | ",
    ),
    sp(
      "Nevn noe man gjør om morgenen",
      "pusse tenner/pusse tennene/pusse tenna/pusser tennene/tannpuss, spise frokost/spiser frokost/frokost, dusje, stå opp/står opp/våkne | kle på seg/kler på seg, drikke kaffe/drikker kaffe/kaffe, re opp senga/re senga/rer opp senga, gre håret/gre seg/børste håret, sminke seg, barbere seg, lese avisen/leser avisen, sjekke mobilen/sjekker mobilen, smøre matpakke/smører matpakke, gå på do/tisse, vaske ansiktet/vaske seg, lufte hunden/gå tur med hunden, gå på jobb/dra på jobb, gå på skolen/dra på skolen | trene, jogge, ta bussen, snooze/slå av vekkerklokka, gjespe, strekke seg, høre på radio, se på nyhetene, mate katten, ta medisin, lage kaffe, drikke te, lage frokost, levere i barnehagen, meditere, yoga, sjekke været, skrape bilruta/skrape ruta, måke snø, hente avisen, åpne gardinene, lufte, ta tran/ta vitaminer, si god morgen, kysse, kjøre bil, sykle | gå ut med søpla, vanne blomstene, lese, skrive dagbok, bade, høre på podkast, se på TV, rydde, pakke sekken, finne nøklene, krangle, mate fuglene |",
    ),
    sp(
      "Nevn en ballett",
      "Svanesjøen, Nøtteknekkeren, Tornerose, Giselle | Romeo og Julie, Askepott, Coppélia, Våroffer/The Rite of Spring/Le Sacre du printemps, Don Quijote/Don Quixote, Ildfuglen/The Firebird, Petrusjka/Petrushka, La Bayadère/Bayaderen | Spartacus, La Sylphide/Sylfiden, Boléro, Et folkesagn, Napoli, Faunens ettermiddag/L'après-midi d'un faune, Daphnis og Chloé/Daphnis et Chloé, Raymonda, Paquita, Le Corsaire/Korsaren, Onegin, Manon, Mayerling, Jewels, Apollon musagète/Apollo, Serenade, Les Sylphides/Chopiniana, Sheherasade/Schéhérazade, La fille mal gardée, Den døende svanen/The Dying Swan | Agon, Le Spectre de la rose/Rosens ånd, Les Noces/Bryllupet, Pulcinella, Gajane/Gayane, Carmen, Peer Gynt, Alice i Eventyrland, Anastasia, Steinblomsten | ",
      { nei: "Billy Elliot, Black Swan, Fame" },
    ),
  ),
]
