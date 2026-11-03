import { dag, sp } from "./typer"

// Days 51–55.
export const dager12 = [
  dag(
    sp(
      "Nevn en krydderurt",
      "basilikum, persille, dill, timian | rosmarin, oregano, mynte/peppermynte, gressløk, koriander, salvie | estragon, merian, sitronmelisse, kjørvel, løpstikke, laurbær/laurbærblad,, bladselleri, ramsløk | pimpinelle, isop, sar/bønneurt, kvann, malurt, sitrongress, kaffirlimeblad, curryblad, thaibasilikum, vietnamesisk koriander, shiso, epazote, lovage | perilla, sorrel/syre, engsyre, karse, brønnkarse,, boretsj, hyssop, sweet cicely/spansk kjørvel, rue/vinrute, stevia, kattemynte",
    ),
    sp("Nevn et land som begynner på P", "#PL, #PT | #PE, #PK | #PA, #PY,, #PS | #PG, #PW | @start:P"),
    sp(
      "Nevn en norsk fjord",
      "Oslofjorden, Sognefjorden, Hardangerfjorden, Geirangerfjorden | Trondheimsfjorden, Lysefjorden, Nærøyfjorden, Nordfjord, Storfjorden, Romsdalsfjorden, Boknafjorden | Aurlandsfjorden, Sunndalsfjorden, Tysfjorden, Ofotfjorden, Porsangerfjorden, Varangerfjorden, Lyngenfjorden, Malangen, Altafjorden, Saltfjorden, Ranfjorden, Vefsnfjorden, Namsfjorden, Beitstadfjorden, Moldefjorden, Hjørundfjorden,, Sørfjorden, Eidfjorden, Bjørnafjorden, Fensfjorden, Masfjorden, Lusterfjorden, Fjærlandsfjorden, Lærdalsfjorden, Årdalsfjorden, Sunnylvsfjorden, Tafjorden, Norddalsfjorden, Isfjorden, Indre Oslofjord, Drammensfjorden, Tyrifjorden, Randsfjorden | Frierfjorden, Langesundsfjorden, Kristiansandsfjorden, Høgsfjorden, Gandsfjorden, Hafrsfjord, Jøsenfjorden, Sandsfjorden, Saudafjorden, Åkrafjorden, Matrefjorden, Samnangerfjorden, Osterfjorden,, Hylsfjorden,, Tanafjorden, Laksefjorden, Kvænangen | Ullsfjorden, Balsfjorden, Vestfjorden, Skjerstadfjorden, Sjona, Velfjorden, Bindalsfjorden, Foldafjorden, Stjørdalsfjorden, Orkdalsfjorden, Hemnefjorden, Halsafjorden, Tingvollfjorden,, Dalsfjorden, Førdefjorden, Gloppenfjorden, Innvikfjorden, Faleidfjorden",
      { nei: "Mjøsa, Femunden, Sognsvann" },
    ),
    sp(
      "Nevn en religion eller livssyn",
      "kristendom, islam, buddhisme, hinduisme, jødedom | ateisme, humanisme, sikhisme, katolisisme/katolsk, protestantisme, ortodoks kristendom, agnostisisme | norrøn religion/åsatro, shinto, taoisme, konfusianisme, jainisme, bahai, mormonisme/mormoner, Jehovas vitner, pinsebevegelsen, luthersk/lutherdom, scientologi, sjamanisme, paganisme/hedendom, wicca | zoroastrisme, rastafari, druidisme, animisme, kvekere, amish, unitarisme, adventister, metodisme, baptister, anglikansk/anglikanisme, kalvinisme, sufisme, sunni, sjia, kabbala, hasidisme, tibetansk buddhisme, zen, theravada, mahayana, vodou/voodoo, santería, candomblé, cao dai, falun gong, tenrikyo | spinozisme, deisme, panteisme, gnostisisme, manikeisme, mithraisme, mandeisme, yazidisme, druserne, alevisme, ahmadiyya,, pastafarianisme",
    ),
    sp(
      "Nevn et teknologiselskap",
      "Apple, Google, Microsoft, Samsung, Meta/Facebook | Amazon, Tesla, Netflix, Spotify, IBM, Intel, Sony, Nvidia, OpenAI, Nokia, Huawei | Dell, HP, Lenovo, Asus, Acer, Oracle, Cisco, Adobe, SAP, Uber, Airbnb, TikTok/ByteDance, Snapchat/Snap, X/Twitter, LinkedIn, PayPal, eBay, Alibaba, Tencent, Xiaomi, LG, Philips, Ericsson, Anthropic, Telenor, Finn, Vipps, Opera, Kahoot, AMD, Qualcomm, Salesforce, Zoom, Dropbox, Shopify,| Arm, TSMC, ASML, Broadcom, Siemens, Bosch, Panasonic, Toshiba, Fujitsu, Hitachi, Canon, Nikon, Atlassian, Slack, Discord, Reddit, Pinterest, Palantir, Snowflake, Stripe, Klarna, Visma, Tietoevry, Schibsted, Nordic Semiconductor, Autostore, Cognite, Kongsberg, Tandberg, Norsk Data, Fast Search, Trolltech, DeepMind, Mistral, xAI, Valve, Epic Games, Nintendo, Electronic Arts/EA, Activision, Ubisoft, Rovio, Supercell, Mojang, King, Wolt, Bolt, Lyft, DoorDash, Instacart, Zalando, Booking.com | Unity, Roblox, Twilio, Cloudflare, Datadog, MongoDB, Red Hat, VMware, Commodore, Atari, Sun Microsystems, Xerox, Kodak, Motorola, BlackBerry, Palm, Yahoo, AOL, Netscape, MySpace",
    ),
    sp(
      "Nevn en norsk øy",
      "Senja, Hitra, Tjøme,, Hinnøya, Sørøya, Smøla, Frøya, Karmøy | Stord, Tromsøya, Ringvassøya, Kvaløya, Andøya, Langøya, Vestvågøy, Austvågøy, Moskenesøya, Flakstadøya, Magerøya, Seiland, Askøy, Sotra, Bømlo, Tysnes, Osterøy, Radøy | Finnøy, Rennesøy, Bokn, Herøy, Gossa, Averøya, Frei, Tustna, Hidra, Tromøy, Hisøy, Nøtterøy, Hvaler, Bygdøy, Hovedøya, Lindøya, Langøyene,| Træna, Røst, Værøy, Lurøy, Rødøy, Dønna, Vega, Leka, Vikna, Utsira, Kvitsøy, Fedje, Solund, Bremanger, Selja, Runde, Giske, Vigra, Godøy, Harøy, Ona, Grip, Veøy, Halten, Sula, Froan, Jomfruland, Lyngør, Merdø, Justøy,, Svalbard, Jan Mayen, Bjørnøya, Bouvetøya, Peter I Øy | Kjøtta, Grytøya, Tjeldøya, Rolla, Andørja, Arnøya, Kågen, Uløya, Loppa, Silda, Ingøya, Rolvsøya,, Skorpa, Måsøya, Ylvingen, Herøy (Nordland), Tomma, Handnesøya, Meløya, Fugløya, Givær, Helligvær, Landego",
      { nei: "Island, Grønland, Gotland, Bornholm, Åland" },
    ),
  ),
  dag(
    sp(
      "Nevn en druesort som brukes til vin",
      "merlot, chardonnay, cabernet sauvignon, pinot noir | sauvignon blanc, riesling, shiraz/syrah, pinot grigio/pinot gris, malbec, sangiovese, tempranillo, zinfandel/primitivo | grenache/garnacha, nebbiolo, gewürztraminer, chenin blanc, viognier, muscat/moscato/muskat, cabernet franc, carménère, pinotage, gamay, barbera, montepulciano, prosecco/glera, grüner veltliner, albariño, verdejo | mourvèdre/monastrell, petit verdot, sémillon, trebbiano, vermentino, garganega, corvina, aglianico, nero d'avola, touriga nacional, carignan, cinsault, tannat, dolcetto, lambrusco, marsanne, roussanne, pinot blanc, silvaner, müller-thurgau, torrontés, furmint, assyrtiko, xinomavro, blaufränkisch, zweigelt, saperavi, macabeo, xarel·lo, parellada | fiano, greco, falanghina, negroamaro, nerello mascalese, sagrantino, teroldego, lagrein, schiava, ribolla gialla, friulano, picpoul, melon de bourgogne, aligoté, mencía, godello, bobal, graciano, baga, castelão, alvarinho, arinto, loureiro, encruzado, kerner, scheurebe, solaris, rondo",
    ),
    sp("Nevn et land som grenser til Romania", "#HU, #UA | #BG, #RS | #MD | | @naboer:RO"),
    sp(
      "Nevn en figur fra Muppets",
      "Kermit/Kermit frosken, Miss Piggy/Frøken Piggy, Dyret/Animal, Gonzo | Fozzie/Fozzie Bjørn, Svenske kokken/den svenske kokken, Statler, Waldorf, Rowlf, Beaker, Dr. Bunsen Honeydew/Bunsen | Scooter, Sam Ørn/Sam the Eagle, Rizzo, Pepe, Camilla, Sweetums, Lew Zealand, Crazy Harry, Dr. Teeth, Floyd, Janice, Zoot, Walter, Robin, Uncle Deadly, Link Hogthrob,| Bobo, Marvin Suggs, Clifford, Beauregard, Mahna Mahna/Mah Na Mah Na, Bean Bunny, Constantine, Pops, Johnny Fiama, Sal Minella, Mildred, Hilda, Wayne, Wanda | Thog, Behemoth, Lips, Afghan Hound, Gorgon Heap",
    ),
    sp(
      "Nevn et programmeringsspråk",
      "Python, Java, JavaScript, C++ | C, C#, HTML, CSS, SQL, PHP, TypeScript, Swift, Scratch | Rust, Go, Kotlin, Ruby, R, MATLAB, Perl, Assembly/assembler, Basic/BASIC, Visual Basic, Pascal, Fortran, COBOL, Lua, Dart, Bash/shell, PowerShell, Scala, Haskell, Julia, Objective-C, Delphi | Lisp, Prolog, Erlang, Elixir, F#, OCaml, Clojure, Groovy, Ada, Simula, Smalltalk, Scheme, Racket, Zig, Nim, Crystal, Solidity, Elm, Logo, APL, VHDL, Verilog, Haxe, Apex, ABAP, Tcl, Awk, Sed, WebAssembly/Wasm, Coffeescript, Visual Basic for Applications/VBA | Brainfuck, Forth, Algol, PL/I, Modula-2, Eiffel, Oberon, Idris, Agda, Coq/Rocq, Lean, Mojo, Carbon, Gleam, Odin, V, Hack, ColdFusion, Rexx, Malbolge, Whitespace, Befunge, Piet, LOLCODE, Chef",
      { nei: "Word, Excel, Linux, Windows, Photoshop" },
    ),
    sp(
      "Nevn et ord som rimer på «katt»",
      "hatt, matt | natt, glatt, flatt, platt, skatt | spratt, satt, kratt, latt,,, bratt, fatt, tatt,| sjakkmatt, godnatt, midnatt, tophatt, solhatt, inntatt,,, julenatt, nyttårsnatt, juleskatt,, inntektsskatt, eiendomsskatt, formueskatt,|,,,,",
      { streng: true, nei: "katt, katten, kattunge" },
    ),
    sp(
      "Nevn en by i Sverige",
      "Stockholm, Göteborg/Gøteborg, Malmö/Malmø, Uppsala | Strömstad/Strømstad, Karlstad, Kiruna, Lund, Helsingborg, Linköping, Örebro, Västerås, Umeå, Luleå, Sundsvall, Östersund, Jönköping, Norrköping, Gävle, Visby | Halmstad, Kalmar, Växjö, Karlskrona, Kristianstad, Borås, Trollhättan, Uddevalla, Falun, Borlänge, Mora, Sälen, Åre, Haparanda, Skellefteå, Örnsköldsvik, Härnösand, Arvika, Charlottenberg, Eskilstuna, Södertälje, Nyköping, Ystad, Trelleborg, Landskrona, Kungsbacka | Varberg, Falkenberg, Ängelholm, Båstad, Lidköping, Skövde, Motala, Västervik, Oskarshamn, Sandviken, Hudiksvall, Söderhamn, Bollnäs, Ljusdal, Torsby, Hagfors, Kristinehamn, Karlskoga, Nynäshamn, Norrtälje, Sigtuna, Lysekil, Marstrand, Smögen, Grebbestad, Fjällbacka | Kungälv, Alingsås, Lerum, Mölndal, Partille, Vänersborg, Åmål, Mariestad, Hjo, Vadstena, Mjölby, Tranås, Vetlanda, Värnamo, Ljungby, Älmhult, Olofström, Karlshamn, Ronneby, Sölvesborg, Höganäs, Simrishamn, Eslöv, Hässleholm, Arboga, Köping, Sala, Enköping, Fagersta, Ludvika, Avesta, Hedemora, Rättvik, Leksand, Sveg, Kramfors, Sollefteå, Lycksele, Vilhelmina, Arvidsjaur, Jokkmokk, Gällivare, Pajala, Boden, Piteå, Kalix, Abisko, Riksgränsen",
      { nei: "Oslo, København, Helsinki, Gotland, Öland" },
    ),
  ),
  dag(
    sp(
      "Nevn et dyr vi spiser kjøttet av",
      "gris/svin, ku/storfe/okse, kylling/høne, lam/sau | elg, reinsdyr/rein, kalkun, hjort, and,,, kalv, geit | hval/vågehval, hest, rådyr, hare, kanin, gås, rype, struts, bison, villsvin, kenguru, vaktel, due, fasan, vilt | sel, krokodille, alligator, frosk/froskelår, snegl, emu, kamel, kje, bjørn, bever, ekorn, skilpadde, slange, insekter, gresshopper, larver, marsvin, jak, vannbøffel, alpakka, lama, perlehøne | hund, katt, rotte, flaggermus, hvalross, sjøløve, moskus, gnu, impala, sebra, kudu, springbok",
      { nei: "løve, tiger, panda, isbjørn" },
    ),
    sp("Nevn et land som grenser til Tsjekkia", "#DE, #PL | #AT, #SK | | | @naboer:CZ"),
    sp(
      "Nevn en romersk gud eller gudinne",
      "Jupiter, Venus, Mars, Neptun/Neptune | Merkur/Mercury, Juno, Minerva, Pluto, Apollo, Diana, Saturn, Bacchus, Amor/Cupido/Cupid | Vulcan/Vulkan, Vesta, Ceres, Janus, Aurora, Fortuna, Faunus, Flora, Luna, Sol, Terra, Uranus, Proserpina, Bellona, Victoria, Somnus, Libertas, Pax | Quirinus, Lares, Penates, Mithras, Pomona, Silvanus, Orcus, Dis Pater, Fides, Spes, Concordia, Salus, Juventas, Liber, Libera, Portunus, Volturnus, Vertumnus | Ops, Tellus, Nox, Trivia,, Febris, Mefitis, Cardea, Carmenta, Egeria, Furrina, Pales, Robigus, Sancus, Terminus, Consus, Laverna, Feronia, Bona Dea",
      { nei: "Zevs, Zeus, Odin, Tor, Ra" },
    ),
    sp(
      "Nevn et klesmerke",
      "H&M/H og M, Nike, Adidas, Zara | Levi's/Levis, Gucci, Bergans, Norrøna, Helly Hansen, Moods of Norway, Dale of Norway, Tommy Hilfiger, Ralph Lauren, Gant, Lacoste, Puma, The North Face, Calvin Klein, Hugo Boss, Louis Vuitton, Prada, Chanel, Dior, Burberry, Peak Performance, Kappahl, Lindex, Cubus, Dressmann, Bik Bok | Mango, Uniqlo, Gap, Diesel, Converse, Vans, Reebok, Under Armour, Fila, Champion, Supreme, Stone Island, Moncler, Canada Goose, Patagonia, Arc'teryx, Fjällräven, Kari Traa, Swix, Devold, Ulvang, Holzweiler, Ganni, Acne Studios, Filippa K, Tiger of Sweden, J.Lindeberg, Weekday, Monki, COS | & Other Stories, Massimo Dutti, Bershka, Pull & Bear, Stradivarius, Primark, Shein, Versace, Armani, Balenciaga, Fendi, Hermès, Valentino, Givenchy, Saint Laurent/YSL, Dolce & Gabbana, Bottega Veneta, Off-White, Carhartt, Dickies, Wrangler, Lee, Timberland, Dr. Martens, Asics, New Balance, Salomon, Jack & Jones, Vero Moda, Only, Selected | Ellesse, Kappa, Umbro, Hummel, Le Coq Sportif, Diadora, Sergio Tacchini, Fred Perry, Barbour, Hackett, Paul Smith, Ted Baker, Superdry, Hollister, Abercrombie & Fitch, American Eagle, Urban Outfitters, Bape, Palace, Stüssy, Kenzo, Lanvin, Miu Miu, Celine, Loewe, Jil Sander, Marni, Maison Margiela, Rick Owens, Comme des Garçons, Issey Miyake",
    ),
    sp(
      "Nevn en vindstyrke på Beauforts skala",
      "storm, orkan, stille | kuling, frisk bris, lett bris, liten kuling | flau vind, svak vind, laber bris, stiv kuling, sterk kuling, full storm | liten storm, sterk storm | ",
      { nei: "tornado, tyfon, orkankast, vindkast" },
    ),
    sp(
      "Nevn en by i Danmark",
      "København, Aarhus/Århus, Odense, Aalborg/Ålborg | Esbjerg, Roskilde, Helsingør, Skagen, Frederikshavn, Hirtshals, Billund, Randers, Vejle, Kolding, Horsens, Silkeborg, Herning, Fredericia, Sønderborg, Svendborg | Viborg, Holstebro, Næstved, Køge, Hillerød, Slagelse, Holbæk, Nykøbing Falster, Rønne, Grenaa, Ebeltoft, Ribe, Tønder, Aabenraa, Haderslev, Thisted, Hjørring, Brønderslev, Skive, Struer, Lemvig, Ringkøbing | Varde, Grindsted, Middelfart, Nyborg, Faaborg, Assens, Kalundborg, Korsør, Vordingborg, Nakskov, Maribo, Frederiksberg, Lyngby/Kongens Lyngby, Hellerup, Klampenborg, Dragør, Ishøj, Greve, Gentofte, Ballerup, Albertslund, Hvidovre, Glostrup | Løkken, Blokhus, Hals, Sæby, Skælskør, Stege, Præstø, Nysted, Rudkøbing, Marstal, Ærøskøbing, Allinge, Gudhjem, Svaneke, Nexø, Hornbæk, Gilleleje, Hundested, Frederikssund, Jyllinge, Solrød, Ringsted, Sorø,, Odder, Skanderborg, Ry, Hobro, Mariager, Løgstør, Nibe, Fjerritslev, Thyborøn, Hvide Sande, Søndervig, Henne, Fanø, Nordby, Rømø, Kerteminde, Bogense",
      { nei: "Malmö, Stockholm, Bornholm, Jylland, Sjælland, Fyn" },
    ),
  ),
  dag(
    sp(
      "Nevn en gresk rett",
      "gyros, souvlaki, tzatziki, gresk salat | moussaka, feta, baklava, oliven, dolmades, spanakopita | pita, kalamari/blekksprutringer,,, tiropita, stifado, pastitsio, keftedes, taramosalata, gemista, horiatiki, loukoumades, galaktoboureko, saganaki, fava, spetsofai, kleftiko, giouvetsi,, melitzanosalata | avgolemono, fasolada, magiritsa, kokoretsi, kontosouvli, bougatsa, kataifi, revithia, briam, imam baildi, papoutsakia, soutzoukakia, youvarlakia, dakos, kolokithokeftedes, horta, octopus/grillet blekksprut, psarosoupa, kakavia, loukaniko,, ouzo, retsina, metaxa, frappé, koulourakia, melomakarona, kourabiedes, diples, galopita | lagana, lalangia, trahana, hilopites, kritharaki, staka, sfakiani pita, gigantes",
      { nei: "kebab, falafel, hummus, paella" },
    ),
    sp("Nevn et land som begynner på N", "#NO, #NL/Nederland | #NZ, #NP, #NG | #NI, #NE, #KP/Nord-Korea, #MK/Nord-Makedonia | #NA, #NR | @start:N"),
    sp(
      "Nevn en bergart eller et mineral",
      "granitt, kalkstein, marmor, sandstein | kvarts, gneis, skifer, basalt, leire, kull, diamant, gull | feltspat, glimmer, obsidian, pimpstein, flint, kritt, larvikitt, olivin, talk, gips, salt/steinsalt, svovel, jern/jernmalm, kobber, sølv, magnetitt, pyritt/svovelkis, grafitt | dolomitt, konglomerat, breksje, tuff, andesitt, rhyolitt, gabbro, dioritt, porfyr, kvartsitt, fyllitt, glimmerskifer, serpentin, kleberstein/fedstein, amfibolitt, eklogitt, anortositt, syenitt, nefelin, apatitt, kalkspat/kalsitt, fluoritt, baritt, galenitt/blyglans, sinkblende/sfaleritt, hematitt, kassiteritt, cinnober, rutil, ilmenitt, granat, turmalin, beryll, topas, korund, spinell, zirkon, kyanitt, staurolitt | thulitt, molybdenglans, hornfels, migmatitt, mylonitt, peridotitt, dunitt, komatiitt, kimberlitt, lamprofyr, pegmatitt, aplitt, trondhjemitt, mangeritt, charnockitt, granulitt, blåskifer, grønnskifer, anhydritt, boraks, halitt, sylvin, trona, natron, kaolinitt, illitt, smektitt, vermikulitt, zeolitt",
    ),
    sp(
      "Nevn en norsk dagligvarekjede",
      "Rema 1000/Rema, Kiwi, Coop Extra/Extra, Meny | Spar, Joker, Bunnpris, Coop Prix/Prix, Coop Mega/Mega, Coop Obs/Obs, Eurospar | Coop Marked, Nærbutikken, Matkroken, Oda, Kolonial, Europris, Holdbart, | Mix, Narvesen, 7-Eleven, Deli de Luca,, Ica, Rimi,| Fudi, Matbørsen, Centra, Prima, Joker Nærbutikk,,, Godt Levert, Adams Matkasse, Kolonihagen, Lidl, Smart Club, Gigaboks,,",
      { nei: "Ikea, Elkjøp, Clas Ohlson, XXL, Power, Jernia" },
    ),
    sp(
      "Nevn et kort i en vanlig kortstokk",
      "ess, konge, dame/dronning, knekt, joker | hjerter ess, spar ess, kløver, spar, ruter, hjerter | spar dame, hjerter dame, ruter knekt, kløver konge, tieren/ti, nieren/ni, åtteren/åtte, sjueren/sju, seksern/seks, femmeren/fem, fireren/fire, treeren/tre, toeren/to | kløver ess, ruter ess, spar konge, hjerter konge, ruter konge, kløver dame, ruter dame, spar knekt, hjerter knekt, kløver knekt,| ",
      { nei: "kortstokk, kabal, poker" },
    ),
    sp(
      "Nevn en maler eller billedkunstner",
      "Edvard Munch/Munch, Leonardo da Vinci/da Vinci/Leonardo, Vincent van Gogh/van Gogh, Pablo Picasso/Picasso | Claude Monet/Monet, Michelangelo, Rembrandt, Salvador Dalí/Dalí/Dali, Andy Warhol/Warhol, Frida Kahlo/Kahlo, Banksy, Johannes Vermeer/Vermeer, Gustav Klimt/Klimt | Henri Matisse/Matisse, Paul Cézanne/Cézanne, Pierre-Auguste Renoir/Renoir, Edgar Degas/Degas, Paul Gauguin/Gauguin, Raphael/Rafael, Botticelli, Caravaggio, Francisco Goya/Goya, Diego Velázquez/Velázquez, El Greco, Wassily Kandinsky/Kandinsky, Piet Mondrian/Mondrian, René Magritte/Magritte, Jackson Pollock/Pollock, Roy Lichtenstein/Lichtenstein, Keith Haring/Haring, Jean-Michel Basquiat/Basquiat, Hans Gude/Gude, J.C. Dahl/Johan Christian Dahl, Adolph Tidemand/Tidemand, Theodor Kittelsen/Kittelsen, Harald Sohlberg/Sohlberg, Christian Krohg/Krohg, Nikolai Astrup/Astrup, Frans Widerberg/Widerberg, Odd Nerdrum/Nerdrum, Jakob Weidemann/Weidemann, Kjell Aukrust/Aukrust, Gustav Vigeland/Vigeland | Hieronymus Bosch/Bosch, Pieter Bruegel/Bruegel, Jan van Eyck/van Eyck, Albrecht Dürer/Dürer, Hans Holbein/Holbein, Titian/Tizian, Tintoretto, Peter Paul Rubens/Rubens, Anthony van Dyck, William Turner/Turner, John Constable/Constable, Caspar David Friedrich/Friedrich, Eugène Delacroix/Delacroix, Édouard Manet/Manet, Camille Pissarro/Pissarro, Georges Seurat/Seurat, Henri de Toulouse-Lautrec/Toulouse-Lautrec, Egon Schiele/Schiele, Marc Chagall/Chagall, Joan Miró/Miró, Paul Klee/Klee, Georgia O'Keeffe/O'Keeffe, Edward Hopper/Hopper, Mark Rothko/Rothko, David Hockney/Hockney, Yayoi Kusama/Kusama, Ai Weiwei, Damien Hirst/Hirst, Jeff Koons/Koons, Hokusai, Hiroshige, Erik Werenskiold/Werenskiold, Gerhard Munthe/Munthe, Frits Thaulow/Thaulow, Harriet Backer/Backer, Kitty Kielland, Peder Balke/Balke, Lars Hertervig/Hertervig, Rolf Nesch, Inger Sitter, Gunnar S. Gundersen, Bjarne Melgaard/Melgaard, Håkon Bleken, Ludvig Eikaas, Kjell Nupen, Olav Christopher Jenssen, Nico Widerberg, Pushwagner, Hariton Pushwagner, Vebjørn Sand, Anna-Eva Bergman, Oda Krohg | Giotto, Cimabue, Fra Angelico, Masaccio, Piero della Francesca, Mantegna, Bellini, Giorgione, Correggio, Parmigianino, Bronzino, Poussin, Claude Lorrain, Watteau, Fragonard, Boucher, Chardin, Ingres, David/Jacques-Louis David, Géricault, Courbet, Millet, Corot, Sisley, Morisot, Cassatt, Bonnard, Vuillard, Modigliani, Braque, Léger, Duchamp, Ernst, Tanguy, de Chirico, Bacon/Francis Bacon, Freud/Lucian Freud, de Kooning, Kline, Twombly, Rauschenberg, Johns/Jasper Johns, Richter/Gerhard Richter, Kiefer, Baselitz, Polke",
    ),
  ),
  dag(
    sp(
      "Nevn en spansk tapasrett eller spansk rett",
      "paella, tapas, tortilla/tortilla española, churros | gazpacho, patatas bravas, serranoskinke/jamón serrano, chorizo, albóndigas, croquetas/kroketter, gambas al ajillo/hvitløksreker, pimientos de padrón, calamares, pan con tomate, empanada, sangria | pulpo a la gallega, salmorejo, fabada, cocido, crema catalana, flan, pisto, migas, morcilla, cochinillo, jamón ibérico, manchego, boquerones, escalivada, ajoblanco, txistorra, pintxos, aceitunas/oliven,, turrón, polvorones, tarta de Santiago,| bacalao al pil pil, marmitako, merluza a la vasca, rabo de toro, callos, lacón con grelos, caldo gallego, fideuà, arroz negro, suquet, botillo, cachopo, papas arrugadas, mojo | gofio, sobrasada, ensaïmada, ensaladilla rusa, berenjenas con miel, flamenquín, carrillada, secreto ibérico, pescaíto frito, espinacas con garbanzos, huevos rotos, torrijas, leche frita, natillas",
      { nei: "taco, burrito, nachos, quesadilla, ceviche" },
    ),
    sp("Nevn et land som grenser til Kasakhstan", "#RU, #CN | #UZ, #KG | #TM | | @naboer:KZ"),
    sp(
      "Nevn en stueplante",
      "monstera, kaktus, aloe vera, orkidé | fredslilje, gullranke/epipremnum, svigermors tunge/sansevieria/bajonettlilje, sukkulent/sukkulenter, gummiplante/gummitre, fiolin-fiken/fiolinfiken/fikus lyrata, pengetre/pengeplante, julestjerne, palme, bregne, begonia, geranium/pelargonium | grønnrenner/grønne renner/klorofytum,, dracena/drage-tre, yucca/yukka, zamioculcas/ZZ-plante, calathea, philodendron, hoya/voksblomst,, kalanchoe, amaryllis, julekaktus, gerbera | anthurium/flamingoblomst, alokasia, peperomia, pilea/pannekakeplante, tradescantia/vandrende jøde, eføy, fikus/fikus benjamina, krassula, kokospalme, dvergpalme, elefantfot/elefantfotpalme, strelitzia/paradisfugl, kjøttetende plante/fluefanger | marant/maranta,, bonsai,,, kaffeplante, sitrontre, avokadoplante,, tillandsia/luftplante, bromelia, nepenthes/kannebærer, soldogg, oxalis, coleus/palettblad, kroton, schefflera, dieffenbachia, aglaonema, syngonium, rhipsalis, haworthia, echeveria, lithops/levende steiner, perlekjede/senecio, kentiapalme, areca, chamaedorea,",
    ),
    sp(
      "Nevn en musikksjanger",
      "pop, rock, hiphop/rap, jazz, klassisk | metal/heavy metal, country, techno, blues, reggae, punk, disco, elektronisk, R&B, soul, funk | folkemusikk, indie, house, trance, dubstep, salsa, samba, gospel, opera, musikal, k-pop, grunge, black metal, death metal, hardrock, viser/visesang, korpsmusikk, dansebandmusikk/dansband, schlager, singer-songwriter, rock'n'roll | ambient, drum and bass, jungle, garage, grime, trap, drill, afrobeats, reggaeton, bossa nova, tango, flamenco, fado, calypso, ska, dancehall, bluegrass, americana, swing, bebop, fusion, prog/progrock, psykedelisk rock, shoegaze, post-rock, emo, hardcore, metalcore, synthpop, new wave, eurodance, italo disco, lo-fi, chillwave, joik, kveding, gammeldans, hardingfelemusikk | vaporwave, hyperpop, witch house, math rock, krautrock, zydeco, cumbia, bachata, merengue, highlife, qawwali, gamelan, klezmer, rebetiko, enka, j-pop, c-pop, gregoriansk sang, barokk, renessansemusikk, minimalisme, serialisme, musique concrète, noise",
    ),
    sp(
      "Nevn et vitamin eller et mineral i kosten",
      "C-vitamin/vitamin C, D-vitamin/vitamin D, jern, kalsium | A-vitamin/vitamin A, B12/B12-vitamin/vitamin B12, magnesium, sink, kalium, jod,, E-vitamin/vitamin E, K-vitamin/vitamin K | folat/folsyre/B9, B6/vitamin B6, selen, natrium/salt, fosfor, B1/tiamin, B2/riboflavin, B3/niacin, biotin/B7, fluor | kobber, mangan, krom, molybden, klorid, pantotensyre/B5, kolin, betakaroten, kobolt | vanadium, bor, nikkel, silisium",
      { nei: "protein, fett, karbohydrater, fiber, sukker" },
    ),
    sp(
      "Nevn et sted, et strøk eller en bydel i Oslo",
      "Grünerløkka/Løkka, Majorstuen, Frogner, Grønland, Tøyen, Aker Brygge, Holmenkollen | Bjørvika, Sentrum, Karl Johan/Karl Johans gate, Sagene, St. Hanshaugen, Bislett, Bygdøy, Tjuvholmen, Vika, Kvadraturen, Nydalen, Ullevål, Torshov, Sinsen, Storo, Gamlebyen, Kampen, Vålerenga, Ekeberg, Nordstrand, Bekkelaget, Lambertseter, Manglerud, Helsfyr, Bryn, Alna, Furuset, Stovner, Grorud, Vestli, Romsås, Holmlia, Mortensrud, Bøler, Oppsal, Skøyen, Smestad, Ullern, Røa, Vinderen, Slemdal, Blindern, Marienlyst, Fagerborg, Homansbyen, Uranienborg, Briskeby, Skillebekk,| Ila, Lindern, Bolteløkka, Adamstuen, Ullevål hageby, Tåsen, Nordberg, Kjelsås, Grefsen, Disen, Lofthus, Linderud, Veitvet, Rødtvet, Kalbakken, Haugerud, Trosterud, Lindeberg, Høybråten, Haugenstua, Rommen, Ammerud, Tveita, Hellerud, Abildsø, Godlia, Skullerud, Ljabru, Hauketo, Prinsdal, Bjørndal | Rosenholm, Ryen,, Sjursøya, Kværnerbyen, Vaterland, Hammersborg, Pilestredet, Bygdøy allé, Gimle, Thomas Heftyes gate, Bestum, Lilleaker,, Ris, Holmen, Voksen, Sørkedalen, Maridalen, Sognsvann, Frognerseteren, Tryvann, Østmarka, Nordmarka, Hovedøya, Gressholmen, Langøyene, Sørenga,, Ekebergsletta,| Akerselva, Torggata, Youngstorget, Christiania torv, Rådhusplassen, Jernbanetorget, Stortorvet, Olaf Ryes plass, Birkelunden, Sofienbergparken, Vigelandsparken/Frognerparken, Slottsparken,, Botanisk hage, Akershus festning, Bogstad, Holmenkollbakken, Vippetangen",
    ),
  ),
]
