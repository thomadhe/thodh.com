import { dag, sp } from "./typer"

// Days 13–15.
export const dager4 = [
  dag(
    sp(
      "Nevn en dessert",
      "is/iskrem, sjokoladekake, eplekake, riskrem | karamellpudding, tiramisu, ostekake/cheesecake, sjokolademousse/mousse, pavlova, crème brûlée, brownies, panna cotta, bløtkake, vafler, pannekaker, fruktsalat | sorbet, trifle, pai/eplepai, crumble, churros, baklava, sjokoladefondant/lava cake, tilslørte bondepiker, multekrem, banana split, sundae, gelé, profiteroles, sufflé/soufflé, kransekake, muffins, sviskegrøt, rabarbragrøt | eclair, tarte tatin, zabaione/sabayon, affogato, semifreddo, marengs, sitronfromasj/fromasj, tyttebærkrem, rødgrøt, krumkaker, clafoutis, key lime pie, cobbler, sticky toffee pudding, bread and butter pudding, eton mess | knafeh, kulfi, mochi, gulab jamun, tres leches, flan, dulce de leche, crema catalana, bakewell tart, paris-brest, napoleonskake/mille-feuille, sachertorte, schwarzwalderkake, eplestrudel/strudel, kaiserschmarrn, riz à l'amande",
    ),
    sp("Nevn et land som grenser til Polen", "#DE, #CZ | #UA, #SK, #LT | #BY, #RU | | @naboer:PL"),
    sp(
      "Nevn en bjørneart",
      "isbjørn, brunbjørn, kjempepanda/panda, grizzlybjørn/grizzly | svartbjørn/amerikansk svartbjørn, kodiakbjørn | brillebjørn, solbjørn/malaybjørn, kragebjørn/asiatisk svartbjørn/månebjørn | leppebjørn/lappebjørn | hulebjørn",
      { nei: "koala, rødpanda, vaskebjørn, maurbjørn, koalabjørn" },
    ),
    sp(
      "Nevn en Star Wars-figur",
      "Darth Vader/Vader, Luke Skywalker/Luke, Yoda, Han Solo/Han, Leia/Prinsesse Leia | Chewbacca/Chewie, R2-D2, C-3PO, Obi-Wan Kenobi/Obi-Wan, Anakin Skywalker/Anakin, Darth Maul, Palpatine/Keiseren/Darth Sidious | Boba Fett, Jabba/Jabba the Hutt, Padmé Amidala/Padmé, Lando Calrissian/Lando, Kylo Ren, Rey, Finn, BB-8, Grogu/Baby Yoda, Din Djarin/Mandalorian/Mando, Jar Jar Binks/Jar Jar, Grev Dooku/Count Dooku/Dooku, Mace Windu, Qui-Gon Jinn/Qui-Gon, General Grievous/Grievous, Ahsoka Tano/Ahsoka | Poe Dameron/Poe, Snoke, Jango Fett, Wedge Antilles/Wedge, Admiral Ackbar/Ackbar, Tarkin/Grand Moff Tarkin, Ewok/ewoker, Wicket, Greedo, Jyn Erso, Cassian Andor/Andor, K-2SO, Rose Tico, Captain Phasma/Phasma, Maz Kanata, Cad Bane, Bo-Katan, Hera Syndulla, Ezra Bridger, Kanan Jarrus, Sabine Wren, Thrawn, Watto, Sebulba, Nute Gunray | Shmi Skywalker, Owen Lars, Beru Lars, Bail Organa, Mon Mothma, Biggs Darklighter, Nien Nunb, Bossk, IG-88, Dengar, Salacious Crumb, Bib Fortuna, Kit Fisto, Plo Koon, Ki-Adi-Mundi, Aayla Secura, Asajj Ventress, Saw Gerrera, Orson Krennic/Krennic, Chirrut Îmwe, Baze Malbus, Galen Erso, Qi'ra, Tobias Beckett, Moff Gideon, Greef Karga, Cara Dune, IG-11, Fennec Shand",
    ),
    sp(
      "Nevn et tre som vokser vilt i Norge",
      "gran, furu, bjørk, eik | osp, rogn, selje, ask, lønn/spisslønn, alm, lind, bøk | or/gråor/svartor, hegg, einer, hassel, lerk, pil/vier, fjellbjørk, dvergbjørk | barlind, kristtorn, villeple/eple, fuglekirsebær/kirsebær, hagtorn, platanlønn, sitkagran, edelgran, poppel, hestekastanje | istervier, bergfuru, vrifuru/contortafuru, douglasgran, trollhegg, slåpetorn, svarthyll, rødhyll, krossved, sølvpoppel, dunbjørk, hengebjørk",
      { nei: "palme, sypress, sedertre, bambus" },
    ),
    sp(
      "Nevn en verdensmester i sjakk",
      "Magnus Carlsen/Carlsen, Garri Kasparov/Garry Kasparov/Kasparov, Bobby Fischer/Fischer | Anatolij Karpov/Karpov, Viswanathan Anand/Anand, Vladimir Kramnik/Kramnik, Gukesh/Gukesh Dommaraju/Dommaraju Gukesh, Ding Liren/Ding | Mikhail Tal/Tal, Boris Spasskij/Spassky, José Raúl Capablanca/Capablanca | Emanuel Lasker/Lasker, Aleksandr Aljechin/Alekhine/Aljekhin, Mikhail Botvinnik/Botvinnik, Tigran Petrosjan/Petrosian, Vasilij Smyslov/Smyslov, Max Euwe/Euwe | Wilhelm Steinitz/Steinitz, Ruslan Ponomarjov/Ponomariov, Rustam Kasimdzjanov/Kasimdzhanov, Veselin Topalov/Topalov, Aleksandr Khalifman/Khalifman, Hou Yifan, Ju Wenjun, Vera Menchik/Menchik, Maia Tsjiburdanidze/Chiburdanidze, Nona Gaprindasjvili/Gaprindashvili, Xie Jun, Zsuzsa Polgár/Susan Polgar",
      { nei: "Hikaru Nakamura, Nakamura, Fabiano Caruana, Caruana, Judit Polgar" },
    ),
  ),
  dag(
    sp(
      "Nevn en pølsetype",
      "wienerpølse/wiener, grillpølse, chorizo, salami | bratwurst, kjøttpølse, medisterpølse, fårepølse, morrpølse, servelat, frankfurter/frankfurterpølse, pepperoni, blodpølse | vossakorv, kabanos, chipolata, nürnberger, weisswurst, bockwurst, currywurst, kielbasa, merguez, mortadella | salsiccia, ostepølse, lammepølse, elgpølse, reinsdyrpølse, julepølse, spekepølse, falukorv | andouille, boudin, cotechino, sucuk, chistorra, morcilla, butifarra, isterband, debrecziner, thüringer, käsekrainer, cumberland, saucisson, knackwurst, landjäger, lap cheong, longganisa, boerewors, nduja",
    ),
    sp("Nevn en hovedstad i Asia", "$JP, $CN, $TH | $KR, $IN, $VN, $PH, $ID, $IR, $IQ, $AF | $MY, $SG, $NP, $BD, $PK, $KP, $MN, $SA, $IL, $SY, $AE, $QA, $TR, $LB | @hovedstad:Asia | "),
    sp(
      "Nevn et dyr som lever vilt i Australia",
      "kenguru, koala, nebbdyr, emu | wombat, dingo, tasmansk djevel/pungdjevel, kakadue, kookaburra/latterfugl, wallaby, saltvannskrokodille/krokodille | maurpiggsvin/echidna, kasuar, undulat, quokka, flygehund/flyvende hund/flygerev, svartsvane, taipan, pungrev/possum, numbat, bandikut, sugar glider/sukkerglider | tornedjevel/moloch, kragefirfisle, goanna/varan, lyrefugl, boksmanet, blåringet blekksprut, dugong, rosella, galah, lorikeet/lori, wallaroo, pademelon, bettong, potoroo, kvoll/quoll, blåtungeskink | pungulv/tasmansk tiger, trektnettedderkopp, irukandji, perentie",
      { nei: "kiwi, panda, løve, tiger" },
    ),
    sp(
      "Nevn en bok av Roald Dahl",
      "Charlie og sjokoladefabrikken/Charlie and the Chocolate Factory, Matilda, SVK/The BFG, Heksene/The Witches | James og kjempeferskenen/James and the Giant Peach, Den fantastiske Mikkel Rev/Fantastic Mr Fox, Dustene/The Twits, Georgs magiske medisin/George's Marvellous Medicine | Charlie og den store glassheisen/Charlie and the Great Glass Elevator, Danny verdensmester/Danny the Champion of the World, Den enorme krokodillen/The Enormous Crocodile, Giraffen pelikanen og meg/The Giraffe and the Pelly and Me | Gutten/Boy, Esio Trot, Minpinene/The Minpins, Ensom flyger/Going Solo, The Gremlins | Kiss Kiss, Someone Like You, Tales of the Unexpected, My Uncle Oswald, Switch Bitch, The Vicar of Nibbleswicke, Rhyme Stew, Dirty Beasts, Revolting Rhymes",
    ),
    sp(
      "Nevn en måleenhet",
      "meter, kilo/kilogram, liter, sekund | centimeter, gram, kilometer, minutt, time, grad, millimeter, mil | tonn, desiliter, milliliter, watt, volt, ampere, kalori/kilokalori, kelvin, celsius, byte, hertz, fot, tomme, kvadratmeter, hektar, mål, knop, joule, kilowattime | newton, pascal, ohm, candela, mol, lumen, lux, bar, atmosfære, lysår, parsec, astronomisk enhet, nautisk mil, yard, mile, pund, unse, gallon, pint, teskje, spiseskje, karat, fahrenheit, hestekraft, desibel, kilobyte, megabyte, gigabyte, terabyte | becquerel, sievert, gray, tesla, weber, henry, coulomb, farad, siemens, katal, dekar, favn, alen, skjeppe, ångstrøm, mikrometer, nanometer, barrel, furlong, stone, dram, rankine",
    ),
    sp(
      "Nevn et skuespill av Shakespeare",
      "Romeo og Julie/Romeo and Juliet, Hamlet, Macbeth | Kong Lear/King Lear, Othello, En midtsommernattsdrøm/A Midsummer Night's Dream/Midtsommernattsdrøm, Stormen/The Tempest, Julius Cæsar/Julius Caesar | Kjøpmannen i Venedig/The Merchant of Venice, Trollkjerringa/The Taming of the Shrew, Som dere vil ha det/As You Like It, Helligtrekongersaften/Twelfth Night, Stor ståhei for ingenting/Much Ado About Nothing, Richard III/Richard den tredje, Antonius og Kleopatra/Antony and Cleopatra | Henrik V/Henry V, Henrik IV/Henry IV, Henrik VI/Henry VI, Henrik VIII/Henry VIII, Richard II, Kong Johan/King John, De lystige koner i Windsor/The Merry Wives of Windsor, Like for like/Measure for Measure, Coriolanus, Titus Andronicus, Timon fra Athen/Timon of Athens, Troilus og Cressida/Troilus and Cressida, Et vintereventyr/The Winter's Tale, Cymbeline, Perikles/Pericles, Forvekslingskomedien/The Comedy of Errors, To herrer fra Verona/The Two Gentlemen of Verona, Kjærlighetens forspilte møye/Love's Labour's Lost, Slutt godt alt godt/All's Well That Ends Well | De to edle frender/The Two Noble Kinsmen, Edward III",
    ),
  ),
  dag(
    sp(
      "Nevn en italiensk rett",
      "pizza, lasagne, spagetti bolognese/bolognese, carbonara/spagetti carbonara | risotto, tiramisu, bruschetta, gnocchi, ravioli, minestrone, calzone, focaccia, panna cotta, antipasti/antipasto | ossobuco, saltimbocca, vitello tonnato, carpaccio, caprese/insalata caprese, arancini, cannelloni, aglio e olio, amatriciana, cacio e pepe, puttanesca, polenta, piadina, gelato, cannoli, frittata, porchetta, parmigiana/melanzane alla parmigiana, pollo alla cacciatora, bistecca alla fiorentina, tortellini | supplì, cotoletta alla milanese, panzanella, ribollita, pasta e fagioli, caponata, trippa, baccalà | bagna cauda, tortellini in brodo, zabaione, semifreddo, sfogliatella, babà, crostata, cantucci/biscotti, panettone, panforte, vincisgrassi, sarde a beccafico, gnocco fritto, zeppole, pesto alla genovese, cicchetti",
    ),
    sp("Nevn et land i Nord- eller Mellom-Amerika", "#US, #CA, #MX | #CU, #JM, #PA, #CR, #GT | #HN, #NI, #SV, #DO, #HT, #BS, #BZ | #TT, #BB | @kontinent:Nord-Amerika, #GL, #PR"),
    sp(
      "Nevn en hesterase",
      "fjordhest, araber/arabisk fullblod, islandshest, shetlandsponni/shetlandshest | dølahest, nordlandshest/lyngshest, fullblod/engelsk fullblod, kaldblodstraver, varmblodstraver, mustang, shire/shirehest, clydesdale, quarter horse, appaloosa, frieser/frisisk hest, lipizzaner | haflinger, andalusier, hannoveraner, trakehner, connemara, welshponni/welsh, gotlandsruss, percheron, ardenner, falabella, akhal-teke, holsteiner, oldenburger | knabstrupper, paso fino, przewalskihest/przewalski, tinker/irish cob | new forest, exmoor, dartmoor, fellponni, highlandponni, morgan, tennessee walker, standardbred, lusitano, camargue, kladruber, noriker, shagya, criollo, marwari, mangalarga, boulonnais, suffolk punch, mongolsk hest, brabanter",
    ),
    sp(
      "Nevn en Marvel-superhelt",
      "Spider-Man/Spiderman/Edderkoppmannen, Iron Man/Jernmannen, Hulk, Thor, Captain America/Kaptein Amerika | Black Panther, Black Widow, Doctor Strange/Dr. Strange, Wolverine, Deadpool, Ant-Man, Captain Marvel, Hawkeye, Groot, Star-Lord, Rocket, Scarlet Witch/Wanda | Vision, Gamora, Drax, Falcon, Winter Soldier/Bucky | Daredevil, Silver Surfer/Sølvsurferen, Storm, Cyclops, Jean Grey, Professor X/Charles Xavier, Mister Fantastic, Human Torch, The Thing/Tingen, Invisible Woman, Shang-Chi, Moon Knight, Ms. Marvel, She-Hulk, Ghost Rider, Blade, Nick Fury | War Machine, Wasp, Quicksilver, Gambit, Rogue, Beast, Iceman, Nightcrawler, Colossus, Punisher, Luke Cage, Jessica Jones, Iron Fist, Mantis, Nebula, Valkyrie, Miles Morales, Spider-Gwen, Squirrel Girl, Cable, Domino, Elektra, Nova, Adam Warlock, Hercules, Namor, Sentry, Echo, Kate Bishop, Yelena Belova, America Chavez",
      { nei: "Batman, Superman, Wonder Woman, Aquaman, Flash" },
    ),
    sp(
      "Nevn en del av en sykkel",
      "pedal, kjede, sete/sal/sykkelsete, styre | dekk, bremse/bremser, ringeklokke/bjelle, gir, hjul, eike/eiker, felg | slange, lykt/sykkellykt, refleks, støttebein/støtteben/sykkelstøtte, skjerm/skvettskjerm, bagasjebrett, kurv, ramme, nav, krank/kranker, kjedehjul/tannhjul, girspak, bremsehåndtak, bremsekloss, ventil, setepinne/sadelpinne | bakgir/girskifter, framgir, kassett, styrestamme, gaffel/forgaffel, støtdemper, styrelager, kranklager, bremseskive, bremsekabel, girwire/girkabel, ventilhette, hurtigkobling, kjedebeskytter/kjededeksel, flaskeholder, sykkelcomputer, dynamo | eikerefleks, navdynamo, frihjul, fotbrems/tråkkebrems, kjedestrammer, styreteip, pedalreim, girøre, drivverk",
    ),
    sp(
      "Nevn en norsk nasjonalpark",
      "Jotunheimen, Rondane, Hardangervidda | Dovrefjell–Sunndalsfjella/Dovrefjell, Jostedalsbreen, Femundsmarka, Folgefonna, Saltfjellet–Svartisen/Saltfjellet/Svartisen, Lofotodden | Hallingskarvet, Børgefjell, Ytre Hvaler, Breheimen, Reinheimen, Øvre Pasvik, Varangerhalvøya, Færder, Raet, Jomfruland, Junkerdal, Rago, Forollhogna, Fulufjellet, Gutulia | Stabbursdalen, Reisa, Øvre Dividal, Ånderdalen, Lomsdal–Visten, Blåfjella–Skjækerfjella, Skarvan og Roltdalen, Langsua, Seiland, Møysalen, Sjunkhatten, Rohkunborri, Dovre | Nordvest-Spitsbergen, Sør-Spitsbergen, Forlandet, Indre Wijdefjorden, Nordenskiöld Land, Sassen-Bünsow Land",
    ),
  ),
]
