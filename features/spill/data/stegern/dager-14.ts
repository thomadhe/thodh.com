import { dag, sp } from "./typer"

// Days 61–65.
export const dager14 = [
  dag(
    sp(
      "Nevn noe man kan spise til frokost",
      "brødskive/brød/skive, grøt/havregrøt/porridge, egg/kokt egg/bløtkokt egg/hardkokt egg, yoghurt, frokostblanding | müsli, granola, havregryn, knekkebrød, pannekaker/pannekake/amerikanske pannekaker, speilegg, eggerøre, omelett, bacon, toast/ristet brød, smoothie, juice/appelsinjuice, kaffe, te, melk, rundstykke/rundstykker, croissant, ost, banan, eple, cornflakes, Cheerios, havrefras | vafler/vaffel, lapper, sveler, scones, bagel, muffins, kulturmelk/surmelk, kefir, skyr, kesam, cottage cheese, chiagrøt/chiapudding, nattgrøt/overnight oats, avokadotoast/avokado, frukt, bær, blåbær, jordbær, kiwi, appelsin, Nugatti, brunost, syltetøy, honning, leverpostei, kaviar, makrell i tomat, skinke, salami, pølser, bønner/baked beans, Coco Pops, Frosties, Weetabix, wienerbrød, kanelbolle/bolle, loff, rugbrød | eggs Benedict/egg Benedict, engelsk frokost/full English, arme riddere/french toast, crêpes/crepe, shakshuka, huevos rancheros, frokostburrito/burrito, congee, misosuppe, onigiri, dim sum, roti, paratha, idli, dosa, açaí bowl, proteinbar | kippers, black pudding, birchermüsli, kedgeree, natto, chilaquiles, menemen, simit, pão de queijo",
    ),
    sp("Nevn et land som grenser til Slovakia", "#CZ, #PL, #HU | #AT | #UA | | @naboer:SK", { nei: "Tyskland, Slovenia, Romania, Serbia" }),
    sp(
      "Nevn et ord for snø eller en type snø",
      "nysnø, puddersnø/pudder, slaps, sludd, kramsnø | skare/skaresnø, våtsnø, snøfnugg/fnugg, snøfille, gammelsnø, kunstsnø/maskinsnø, løssnø, snøstorm, snøkav/kav, fokksnø/snøfokk/fokk, snøfonn/fonn, tørrsnø, pulversnø, tung snø, lett snø | sørpe, kornsnø, sukkersnø, vårsnø, klabbsnø/klabb, drivsnø, snøføyke/føyke, snøfall, snøbyge, snøkrystaller, snøflak, skavl/snøskavl, fjellsnø | firn/firnsnø, sprøhagl, snøkorn, smeltesnø | nevé, sastrugi",
      { nei: "is, regn, hagl, rim" },
    ),
    sp(
      "Nevn en norsk artist eller et norsk band",
      "a-ha, Kygo, Sissel/Sissel Kyrkjebø, Alan Walker, Sigrid | Aurora, Astrid S, Karpe, Madcon, Marcus & Martinus/Marcus og Martinus, Alexander Rybak, Kaizers Orchestra, Åge Aleksandersen, DDE, Dum Dum Boys, deLillos, Odd Nordstoga, Lene Marlin, Röyksopp, Kurt Nilsen, Maria Mena, Tix, Cezinando, Vamp, Bigbang, Girl in Red, Ylvis, Wenche Myhre, Jahn Teigen, Bjørn Eidsvåg, Hellbillies | Ane Brun, TNT, Dagny, Highasakite, Kings of Convenience, Turbonegro, Mayhem, Darkthrone, Emperor, Nico & Vinz/Nico og Vinz, Erik og Kriss, Tone Damli, Bobbysocks, Secret Garden, Postgirobygget, Jonas Fjeld, Halvdan Sivertsen, Lillebjørn Nilsen, Ole Paus, Jokke & Valentinerne/Jokke og Valentinerne, Raga Rockers, Seigmen, Motorpsycho, Gåte, Wardruna, Morten Harket, Susanne Sundfør, Moddi, Stein Torleif Bjella, Bendik, Arif, Lars Vaular, Chirag, Kamelen, Unge Ferrari, Sondre Justad, Hanne Krogh, Anita Hegerland, Jan Eggum, Eva Weel Skram, Mari Boine, Sondre Lerche, Thomas Dybdahl, Matoma, Broiler, K-391, Seeb, Gabrielle, Emma Steinbakken, Julie Bergan, Emilie Nicolas, Ulrikke Brandstorp, Keiino, Subwoolfer, Kari Bremnes, Vømmøl Spellmannslag, Plumbo, Ole Ivars, Margaret Berger, Stella Mwangi, Didrik Solli-Tangen, Tusse | Magne Furuholmen, Paul Waaktaar-Savoy, Jan Garbarek, Terje Rypdal, Bugge Wesseltoft, Hanne Hukkelberg, Datarock, Lindstrøm, Todd Terje, Cashmere Cat, Cir.Cuz, Mira Craig, Ulver, Enslaved, Satyricon, Dimmu Borgir, Gorgoroth, Immortal, Agnete, Jowst, Aleksander Walmann, Tooji, Trang Fødsel, Lars Lillo-Stenberg | Lene Nystrøm",
      { nei: "ABBA, Roxette, Aqua, Avicii, Carola" },
    ),
    sp(
      "Nevn noe man kan ha som nyttårsforsett",
      "trene mer/trene/trening, gå ned i vekt/slanke seg/slanke, slutte å røyke/røykeslutt, spise sunnere/sunnere kosthold | drikke mindre/kutte alkohol, tørr januar/tørrlagt januar, slutte å snuse, lese mer, mindre skjermtid/bruke mindre mobil, spare penger/spare, sove mer, legge seg tidligere, være snillere, gå mer tur/gå tur, begynne å løpe/løpe, lære et språk, kutte sukker/mindre sukker, bli vegetarianer/vegetar, veganuar, mindre godteri/slutte med godteri, drikke mer vann, stå opp tidligere, rydde mer/rydde | meditere, lære å strikke, lære et instrument, ta lappen/ta førerkortet, ringe foreldrene oftere, handle mindre, kjøpe mindre klær, slutte å banne, slutte å bite negler, være mer ute, kaste mindre mat, sykle til jobben, begynne på treningssenter/begynne på treningsstudio, løpe maraton, spise mindre kjøtt, kutte kaffe, skrive dagbok, reise mer, ta et kurs, lage mer mat selv, mer tid med familien, mindre sosiale medier, drikke mindre brus, gjøre leksene, holde rommet ryddig | gå 10 000 skritt om dagen/10 000 skritt, vinterbade/kalde bad, lære å programmere/lære å kode, bestige et fjell | ",
    ),
    sp(
      "Nevn et av verdens sju underverker, de gamle eller de nye",
      "Pyramidene i Giza/Pyramidene/Den store pyramiden/Kheopspyramiden/Cheopspyramiden, Den kinesiske mur/Kinesiske mur/Kinamuren, Taj Mahal, Colosseum/Kolosseum | Machu Picchu, Kristusstatuen/Cristo Redentor, Petra, Chichén Itzá, Babylons hengende hager/De hengende hager, Kolossen på Rhodos/Kolossen | Zevsstatuen i Olympia/Zevsstatuen/Zeusstatuen, Fyrtårnet på Faros/Fyrtårnet i Alexandria/Faros, Artemistempelet i Efesos/Artemistempelet | Mausoleet i Halikarnassos/Mausoleet | ",
      { nei: "Eiffeltårnet, Stonehenge, Akropolis, Sfinksen, Frihetsgudinnen, Angkor Wat" },
    ),
  ),
  dag(
    sp(
      "Nevn en type grøt",
      "risgrøt/risengrynsgrøt/julegrøt/risgraut, havregrøt/havregraut, rømmegrøt/rømmegraut | semulegrynsgrøt/semulegrøt, byggrøt/byggrynsgrøt, melkegrøt, vassgraut, smørgrøt, fløtegrøt, nattgrøt/overnight oats, maisgrøt | mannagrynsgrøt, hirsegrøt, quinoagrøt, chiagrøt, sjokoladegrøt, eplegrøt, bokhvetegrøt, speltgrøt, rugmelsgrøt, melgrøt/mjølgrøt | congee, kasha, polenta, grits, ugali, upma | nshima, pap, sadza, genfo, Cream of Wheat",
      { nei: "suppe, lapskaus" },
    ),
    sp("Nevn et land som begynner på B", "#BR, #BE, #BG | #BA, #BY, #BO, #BD | #BS, #BB, #BH | #BW, #BZ, #BJ, #BT, #BN, #BF, #BI | @start:B", { nei: "Bermuda, Bali, Bornholm, Baltikum" }),
    sp(
      "Nevn en fugl man kan se på fuglebrettet om vinteren",
      "kjøttmeis/meis, blåmeis, gråspurv/spurv, dompap | pilfink, grønnfink, bokfink, kråke, skjære, svarttrost/trost, gulspurv, spettmeis, flaggspett/spett, ringdue/due, kaie, nøtteskrike, gråtrost | granmeis, løvmeis, svartmeis, toppmeis, stjertmeis, kjernebiter, bjørkefink, grønnsisik/sisik, gråsisik, stillits, kornkråke, rødstrupe, jernspurv, gjerdesmett, sidensvans, grankorsnebb/korsnebb, bergirisk, tyrkerdue | fuglekonge, snøspurv, fasan, ravn, grønnspett, gråspett, spurvehauk, skogdue, måltrost, stær | hettemåke, konglebit, hvitryggspett, dvergspett",
      { nei: "ekorn, svale, gjøk, pingvin" },
    ),
    sp(
      "Nevn en figur fra Frost-filmene",
      "Elsa, Anna, Olaf, Kristoffer/Kristoff | Sven, Prins Hans/Hans, troll, Hertugen av Weselton/Weselton/Hertugen, Oaken | Grand Pabbie/Pabbie, Bulda, Marshmallow, Bruni, Gale, Nøkken/Nokk, Mattias/Løytnant Mattias, Kong Agnarr/Agnarr, Dronning Iduna/Iduna, Yelena, Ryder, Honeymaren | Kong Runeard/Runeard, Snowgies, jordkjempene/jordkjemper | Kai, Gerda",
      { nei: "Rapunsel, Moana, Vaiana, Ariel" },
    ),
    sp(
      "Nevn noe man kan strikke",
      "genser, lue, votter/vott/vante, sokker/sokk/raggsokker/ullsokker, skjerf | hals/halsedisse, pannebånd, kofte, lusekofte, Mariusgenser, vest, jakke, cardigan, teppe/pledd/strikketeppe, hansker, tøfler/strikketøfler, legvarmere, pulsvanter, balaclava/finlandshette, kjole, skjørt, sjal, poncho, babytøy/babyklær, bukse/strikkebukse | setesdalskofte, islender/islandsgenser, kosedyr/strikkedyr, grytekluter/grytelapp, klut/oppvaskklut, putetrekk/pute, hettegenser, hettelue, ullundertøy | Fanakofte, kaffevarmer/tevarmer, eggevarmer, dukkeklær | slips",
    ),
    sp(
      "Nevn en engelsk eller britisk konge eller dronning",
      "Elizabeth II/Elisabeth II/Dronning Elizabeth/Elizabeth/Elisabeth, Charles III/Karl III/Kong Charles/Charles, Henrik VIII/Henry VIII, Victoria/Dronning Victoria | Elizabeth I/Elisabeth I, Vilhelm Erobreren/William the Conqueror/Vilhelm I/William I, Richard Løvehjerte/Rikard Løvehjerte/Richard I/Rikard I, George VI/Georg VI, Edward VIII/Edvard VIII, George V/Georg V, Edward VII/Edvard VII, George III/Georg III, Anne/Dronning Anne, Alfred den store/Alfred, Knut den mektige/Knut den store/Canute, Johan uten land/Johan, Richard III/Rikard III, Henrik V/Henry V | Edward I/Edvard I, Edward II/Edvard II, Edward III/Edvard III, Edward IV/Edvard IV, Edward V/Edvard V, Edward VI/Edvard VI, Henrik I/Henry I, Henrik II/Henry II, Henrik III/Henry III, Henrik IV/Henry IV, Henrik VI/Henry VI, Henrik VII/Henry VII, Richard II/Rikard II, Mary I/Maria I/Bloody Mary/Maria Tudor, Mary II/Maria II, William II/Vilhelm II, William III/Vilhelm III/Vilhelm av Oranien, William IV/Vilhelm IV, George I/Georg I, George II/Georg II, George IV/Georg IV, Charles I/Karl I, Charles II/Karl II, James I/Jakob I, James II/Jakob II, Stefan/Stephen, Lady Jane Grey/Jane Grey, Harald Godwinson/Harold Godwinson/Harold II, Edvard Bekjenneren/Edward the Confessor, Anne Boleyn, Katarina av Aragon/Catherine of Aragon, Jane Seymour, Camilla/Dronning Camilla, Maria Stuart/Mary Stuart | Æthelred/Ethelred, Æthelstan/Athelstan, Harald Harefot/Harold Harefoot, Hardeknut/Hardeknud/Harthacnut, Svein Tjugeskjegg/Sven Tveskjegg/Sweyn Forkbeard, Edmund Jernside/Edmund Ironside, Edgar, Anna av Kleve/Anne of Cleves, Katarina Howard/Catherine Howard, Katarina Parr/Catherine Parr, Dronningmoren/Queen Mother/Elizabeth Bowes-Lyon, Mary av Teck, Dronning Alexandra/Alexandra av Danmark, Eleanor av Aquitaine, Dronning Charlotte/Charlotte, Robert the Bruce, Macbeth | Matilda, Eadwig, Adelaide",
      { nei: "Oliver Cromwell, Cromwell, Diana, Prinsesse Diana, William, Harry, Kong Arthur, Arthur, Maud, Dronning Maud, Prins Philip, Philip" },
    ),
  ),
  dag(
    sp(
      "Nevn en gryterett",
      "lapskaus/brunlapskaus, fårikål, chili con carne/chili, gulasj, biff stroganoff/stroganoff/stroganov | kyllinggryte, viltgryte, elggryte, reinsdyrgryte, kjøttgryte, fiskegryte, pølsegryte, karrigryte/karri/curry, boeuf bourguignon/bourguignon, coq au vin, ratatouille, tikka masala, butter chicken, lammegryte, irsk stuing/irish stew, linsegryte, bønnegryte, kikertgryte, grønnsaksgryte, svinegryte, oksegryte, chili sin carne | sodd, frikassé, osso buco, carbonade/carbonnade, ragu/ragout, pot-au-feu, cassoulet, tagine, dal/dahl, gumbo, bigos, feijoada, rogan josh, korma, vindaloo, massaman, rendang, kalops, pörkölt, sjømatgryte, kalvegryte | pollo alla cacciatora/cacciatore, stifado, Lancashire hotpot/hotpot, doro wat, adobo, navarin, daube | potjiekos, kare-kare, sancocho, locro, ghormeh sabzi",
      { nei: "suppe, pizza, lasagne" },
    ),
    sp(
      "Nevn en by i Finland",
      "Helsingfors/Helsinki, Åbo/Turku, Tammerfors/Tampere, Rovaniemi | Uleåborg/Oulu, Esbo/Espoo, Vanda/Vantaa, Lahtis/Lahti, Kuopio, Jyväskylä, Vasa, Borgå/Porvoo, Mariehamn/Maarianhamina, Hangö/Hanko | Björneborg/Pori, Joensuu, Villmanstrand/Lappeenranta, Kotka, Tavastehus/Hämeenlinna, Kouvola, Seinäjoki, Karleby/Kokkola, Mikkeli/S:t Michel/Sankt Michel, Nyslott/Savonlinna, Kajana/Kajaani, Kemi, Torneå/Tornio, Raumo/Rauma, Salo, Kervo/Kerava, Järvenpää, Imatra, Brahestad/Raahe | Ivalo, Enare/Inari, Levi, Kittilä, Sodankylä, Kuusamo, Kemijärvi, Utsjoki, Karigasniemi, Pello, Muonio, Enontekiö, Kilpisjärvi, Nuorgam, Fredrikshamn/Hamina, Lovisa/Loviisa, Ekenäs/Tammisaari, Jakobstad/Pietarsaari, Nystad/Uusikaupunki, Nådendal/Naantali, Lojo/Lohja, Hyvinge/Hyvinkää, Riihimäki, Forssa, Iisalmi, Varkaus, Kuhmo, Sotkamo, Nurmes, Lieksa | Saariselkä, Ylläs",
      { nei: "Stockholm, Tallinn, Kiruna, Haparanda, Luleå" },
    ),
    sp(
      "Nevn et dyr som går i dvale eller vinterhi",
      "bjørn/brunbjørn, pinnsvin/piggsvin, flaggermus, grevling | frosk, padde, hoggorm/orm, slange, murmeldyr, hasselmus, jordekorn, skilpadde, svartbjørn, humle/humledronning | firfisle, isbjørn, snegle/snegl, marihøne, salamander, vepsedronning/veps, stålorm, buorm, grizzlybjørn/grizzly | sommerfugl/neslesommerfugl/sitronsommerfugl, insekter, maur, maurpiggsvin | lemur/dverglemur, præriehund",
      { nei: "ekorn, elg, rev, ulv, hare, rein, reinsdyr" },
    ),
    sp(
      "Nevn en kjent norsk vinteridrettsutøver",
      "Marit Bjørgen/Bjørgen, Bjørn Dæhlie/Dæhlie, Therese Johaug/Johaug, Johannes Høsflot Klæbo/Klæbo, Petter Northug/Northug, Ole Einar Bjørndalen/Bjørndalen | Johannes Thingnes Bø/Johannes Bø, Tarjei Bø, Aksel Lund Svindal/Svindal, Kjetil Jansrud/Jansrud, Kjetil André Aamodt/Aamodt, Henrik Kristoffersen/Kristoffersen, Lasse Kjus/Kjus, Aleksander Aamodt Kilde/Kilde, Sonja Henie/Henie, Vegard Ulvang/Ulvang, Thomas Alsgaard/Alsgaard, Tora Berger, Marte Olsbu Røiseland/Røiseland, Tiril Eckhoff/Eckhoff, Johann Olav Koss/Koss, Hjalmar Andersen/Hjallis, Oscar Mathisen, Halvor Egner Granerud/Granerud, Martin Johnsrud Sundby/Sundby, Emil Hegle Svendsen/Emil Svendsen, Jarl Magnus Riiber/Riiber, Mats Zuccarello/Zuccarello, Kari Traa, Espen Bredesen | Marius Lindvik/Lindvik, Anders Jacobsen, Maren Lundby, Ragnhild Mowinckel/Mowinckel, Lucas Braathen, Atle Lie McGrath, Sturla Holm Lægreid/Lægreid, Ingrid Landmark Tandrevold/Tandrevold, Heidi Weng, Ingvild Flugstad Østberg, Astrid Uhrenholdt Jacobsen, Pål Golberg, Simen Hegstad Krüger/Krüger, Emil Iversen, Finn Hågen Krogh, Hans Christer Holund, Erik Valnes, Frode Estil, Odd-Bjørn Hjelmeset, Bente Skari, Lars Berger, Halvard Hanevold, Liv Grete Skjelbreid/Liv Grete Poirée, Vetle Sjåstad Christiansen, Sivert Guttorm Bakken, Roar Ljøkelsøy, Anders Bardal, Tom Hilde, Bjørn Einar Romøren, Daniel-André Tande, Robert Johansson, Johann André Forfang, Sigurd Pettersen, Birger Ruud, Toralf Engan, Lars Bystøl, Fred Børre Lundberg, Bjarte Engen Vik, Magnus Moan, Jens Lurås Oftebro, Jørgen Graabak, Gyda Westvold Hansen, Ole Kristian Furuseth, Finn Christian Jagge, Stein Eriksen, Kristin Lysdahl, Thea Louise Stjernesund, Timon Haugan, Rasmus Windingstad, Alexander Steen Olsen, Marcus Kleveland, Terje Håkonsen, Ståle Sandbech, Birk Ruud, Øystein Bråten, Knut Johannesen/Kuppern, Fred Anton Maier, Sten Stensen, Kay Stenshjemmet, Jan Egil Storholt, Ådne Søndrål, Håvard Bøkko, Sverre Lunde Pedersen, Bjørg Eva Jensen, Ragne Wiklund, Thomas Ulsrud, Hedda Berntsen, Johanne Killi, Silje Opseth, Espen Knutsen, Patrick Thoresen | Anders Aukland, Kristin Størmer Steira, Frode Andresen, Gunn Margit Andreassen, Synnøve Solemdal, Endre Strømsheim, Karoline Offigstad Knotten, Hans Petter Buraas, Atle Skårdal, Fredrik Møller, Kajsa Vickhoff Lie, Peder Kongshaug, Ole-Kristian Tollefsen, Jonas Holøs, Tore Ruud Hofstad, Thorleif Haug, Johan Grøttumsbråten | ",
      { nei: "Charlotte Kalla, Frida Karlsson, Mikaela Shiffrin, Ingemar Stenmark, Martin Fourcade" },
    ),
    sp(
      "Nevn noe man kan lage av snø",
      "snømann, snøhule, snøball, snøengel, snølykt/snølanterne | iglo, snøborg/borg, snøfestning, snøskulptur, hoppbakke/hopp/hoppkant, akebakke/aketrasé, snøslott, snøhus, snømur/mur/snøvegg, snødame/snøkone, snøtunnel/tunnel, snøsofa, snøhytte, snøtrapp | vann/smeltevann, snøis, skiløype/løype, snøballkrig, snøkrem, snødyr, snøkunst | halfpipe, snølabyrint/labyrint, snøseng | ",
      { nei: "regn, is" },
    ),
    sp(
      "Nevn en isbre",
      "Jostedalsbreen, Folgefonna, Svartisen, Hardangerjøkulen | Briksdalsbreen, Nigardsbreen, Engabreen, Bondhusbreen, Buarbreen, Bøyabreen, Supphellebreen, Kjenndalsbreen, Ålfotbreen, Okstindbreen/Okstindan, Blåmannsisen, Øksfjordjøkelen, Seilandsjøkelen, Aletschbreen/Aletsch, Perito Moreno, Vatnajökull | Austerdalsbreen, Frostisen, Langfjordjøkelen, Smørstabbreen, Styggedalsbreen, Hellstugubreen, Storbreen, Spørteggbreen, Myklebustbreen, Tunsbergdalsbreen, Lodalsbreen, Fåbergstølsbreen, Brenndalsbreen, Melkevollbreen, Gråsubreen, Fannaråkbreen, Steindalsbreen, Austfonna, Vestfonna, Kongsbreen, Nathorstbreen, Monacobreen, Nordenskiöldbreen, Esmarkbreen, Langjökull, Hofsjökull, Mýrdalsjökull, Eyjafjallajökull, Snæfellsjökull, Mer de Glace, Rhônebreen/Rhonegletscher, Pasterze, Jakobshavn Isbræ/Sermeq Kujalleq/Jakobshavnbreen, Hubbard Glacier, Mendenhall Glacier, Columbia Glacier, Athabasca Glacier, Fox Glacier, Franz Josef Glacier, Khumbu-isbreen/Khumbu, Siachen, Baltoro, Thwaitesbreen/Thwaites/dommedagsbreen | Grønlandsisen/innlandsisen, Fedchenko, Lambertbreen/Lambert Glacier, Pine Island Glacier, Beardmore, Upsala, Grey Glacier, Matanuska, Margerie, Exit Glacier | Rembesdalsskåka, Midtdalsbreen",
      { nei: "Galdhøpiggen, Mont Blanc, Glittertind" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du kan kjøpe på en bensinstasjon",
      "bensin, diesel, pølser/pølse i brød/pølse i lompe, kaffe | godteri/godis, brus, is, avis/aviser, spylervæske, hamburger, snus, sjokolade, vann, energidrikk, bilvask, elbillading/lading/strøm, motorolje/olje, frostvæske, vindusviskere/viskerblader, isskrape, bolle/boller/kanelbolle, baguette/bagett, sigaretter/tobakk, tyggegummi, potetgull/chips, frukt, melk, lottokupong/lotto/tipping, propan/gassflaske/gass, ved, grillkull/kull, engangsgrill, AdBlue | blomster, kart, toalettpapir, batterier/batteri, mobillader/lader, solbriller, hansker, startkabler, snøkjetting/kjetting, slepetau, lyspærer, paracet/paracetamol/smertestillende, frimerker, leker, tilhenger/henger/hengerleie, kebab, smoothie, salat, wrap, rundstykke, yoghurt | bilshampo, bilvoks, lighter, tennvæske, postkort, kondomer, sitteunderlag, isbiter | ",
    ),
    sp("Nevn et land som grenser til Kroatia", "#SI, #RS, #BA | #HU | #ME | | @naboer:HR", { nei: "Italia, Østerrike, Albania, Slovakia" }),
    sp(
      "Nevn en sjøfugl",
      "måke, lunde, skarv, ærfugl, terne | krykkje, alke, lomvi, havhest, havsule/sule, svartbak, gråmåke, fiskemåke, hettemåke, sildemåke, polarmåke, teist, alkekonge, toppskarv, storskarv, pingvin, albatross, pelikan | makrellterne, rødnebbterne, splitterne, havørn, tjeld, havelle, svartand, sjøorre, siland, praktærfugl, tyvjo, storjo, polarjo, fjelljo, ismåke, polarlomvi, smålom, storlom, islom, fregattfugl | stormsvale, havsvale, havlire, fjæreplytt, gulnebblom, sabinemåke, dvergterne, stellerand | dvergmåke, grålire, tropikkfugl, brunsule, blåfotsule",
      { nei: "stokkand, kråke, spurv, ugle" },
    ),
    sp(
      "Nevn en figur fra Narnia-bøkene",
      "Aslan, Lucy, Edmund, Peter, Susan, Den hvite heksa/Den hvite heks/Hvite heksa/Jadis | Herr Tumnus/Tumnus/faunen, Prins Kaspian/Kaspian/Caspian, Eustace/Eustas, Reepicheep, Herr og fru Bever/Bever/Beverne, Digory/Digory Kirke/Professor Kirke, Polly | Miraz, Trumpkin, Shasta, Aravis, Bri/Bree, Jill/Jill Pole, Puddleglum, Tirian, Rilian, Jewel, Shift, Puzzle, Tash, Nikabrik, Trufflehunter, Fenris Ulf/Maugrim, Onkel Andrew/Uncle Andrew | Julenissen/Father Christmas, Den grønne heksa, Rabadash, Emeth, Coriakin, Ramandu, Drinian, Hwin, Corin, Kong Lune/Lune, Glenstorm, Fledge | Lasaraleen, Kong Frank, Rumblebuffin, Ginarrbrik",
      { nei: "Harry Potter, Gandalf, Frodo" },
    ),
    sp(
      "Nevn en type hodeplagg",
      "lue/strikkelue, caps/skyggelue/baseballcaps, hatt, hjelm | pannebånd, hette, balaclava/finlandshette/rullelue, sydvest, alpelue/baskerlue/beret, cowboyhatt, sombrero, topplue, bøttehatt/bucket hat, stråhatt, solhatt, flosshatt/høy hatt, bowlerhatt/bowler, sixpence, hodetørkle/skaut, turban, hijab, krone/kongekrone, tiara, øreklokker/ørevarmer, pelslue, russelue, studenterlue, kokkelue, nisselue, sykkelhjelm, skihjelm, motorsykkelhjelm | kippa/kalott, fez, panamahatt, fedora, ørelapplue/pilotlue, hårbånd, diadem, brudeslør/slør, bandana, solskjerm/visor, hettelue, trilby | niqab, burka, mitra/bispelue, tyrolerhatt, bjørneskinnslue, pillbox | kepi, shako",
    ),
    sp(
      "Nevn et kvadrattall under 200",
      "4/fire, 9/ni, 16/seksten, 25/tjuefem/femogtjue, 100/hundre/ett hundre | 36/trettiseks/seksogtretti, 49/førtini/niogførti, 64/sekstifire/fireogseksti, 81/åttien/enogåtti | 1/en/ett, 121, 144 | 169, 196 | 0/null",
      { streng: true, nei: "2, 8, 10, 12, 50, 200" },
    ),
  ),
  dag(
    sp(
      "Nevn en type pannekake",
      "tynne pannekaker/norske pannekaker, amerikanske pannekaker/pancakes, crêpes/crepe, lapper, sveler | blini, raggmunk, potetpannekake, ovnspannekake/tykkpannekake, fleskepannekake/baconpannekaker, bananpannekaker, havregrynspannekaker, blåbærpannekaker, sjokoladepannekaker, proteinpannekaker, kaiserschmarrn, galette | dutch baby, poffertjes, okonomiyaki, dosa, æbleskiver, latkes, grovpannekaker/fullkornspannekaker, spinatpannekaker, eplepannekaker, plättar | rårakor, crumpets, bánh xèo, pajeon/koreansk pannekake, vårløkpannekake, palatschinken/palačinke, naleśniki, injera | pikelets, jianbing, uttapam, socca, farinata, syrniki",
      { nei: "vafler, omelett, lefse" },
    ),
    sp(
      "Nevn et land med kyst mot Middelhavet",
      "#ES, #IT, #GR, #FR | #HR, #TR, #EG, #CY, #MT | #MA, #TN, #IL, #LB, #MC, #AL | #DZ, #LY, #SY, #SI, #ME, #BA, #PS | #GI",
      { nei: "Portugal, Bulgaria, Jordan, Serbia, Sveits, Romania" },
    ),
    sp(
      "Nevn et ord for en dyreunge",
      "kalv/elgkalv/hvalkalv, valp/kvalp, kattunge, føll/fole, lam, kylling/kjukling | kje, killing, grisunge/smågris/pattegris/spedgris, rumpetroll, larver, yngel, unge, andunge | kvige, ungfugl, bjørnunge, ulvevalp | smolt, nymfe, puppe, unghund, ungdyr | joey",
      { nei: "egg, mor, hund, katt" },
    ),
    sp(
      "Nevn en Elvis-låt",
      "Love Me Tender, Hound Dog, Jailhouse Rock, Can't Help Falling in Love, Suspicious Minds | Blue Suede Shoes, Heartbreak Hotel, Return to Sender, In the Ghetto, Always on My Mind, Are You Lonesome Tonight, It's Now or Never, A Little Less Conversation, Burning Love, Don't Be Cruel, All Shook Up, Blue Christmas, Viva Las Vegas, Teddy Bear, Love Me | That's All Right/That's All Right Mama, Blue Moon of Kentucky, Mystery Train, I Want You I Need You I Love You, Don't, Hard Headed Woman, King Creole, One Night, A Fool Such as I, Stuck on You, Wooden Heart, Surrender, His Latest Flame, Good Luck Charm, She's Not You, Devil in Disguise, Crying in the Chapel, Kentucky Rain, The Wonder of You, An American Trilogy/American Trilogy, Polk Salad Annie, My Way, Moody Blue, Way Down, Guitar Man, If I Can Dream, Memories, Treat Me Nice, Too Much, Loving You, Wear My Ring Around Your Neck, A Big Hunk o' Love/Big Hunk o' Love, Fever, Rock-A-Hula Baby, Blue Hawaii, Follow That Dream, Little Sister, Bossa Nova Baby | Kiss Me Quick, Such a Night, You Don't Have to Say You Love Me, I Just Can't Help Believin', Steamroller Blues, Promised Land, Hurt, Separate Ways, Rubberneckin', Don't Cry Daddy, Edge of Reality, Trouble, Santa Claus Is Back in Town, Peace in the Valley, How Great Thou Art, Unchained Melody, Tutti Frutti, Money Honey, Good Rockin' Tonight | Rip It Up, Ready Teddy, Shake Rattle and Roll, Lawdy Miss Clawdy, Puppet on a String, Got a Lot o' Livin' to Do, Crawfish",
      { nei: "Johnny B. Goode, Great Balls of Fire, Rock Around the Clock" },
    ),
    sp(
      "Nevn et ord som rimer på «ski»",
      "fri, bi, ni, vi, ti | si, gi, bli, sti, skli, pi | parti, magi, politi, batteri, melodi, fantasi, energi, bakeri, kjemi, kopi, geni, harmoni, galleri, konditori | ironi, teori, terapi, strategi, kategori, garanti, demokrati, monarki, anarki, symfoni, sympati, poesi, filosofi, psykologi, biologi, geologi, teknologi, økonomi, kompani, industri, tyveri, fiskeri, meieri, bryggeri, rederi, trykkeri, snekkeri, gartneri, akademi, anatomi, astronomi, geometri, symmetri, hysteri, maskineri, slaveri, infanteri, kavaleri | kli, li, ri, hi, tvi, gni, tyranni, raffineri, artilleri, fobi, mani, bigami, galanteri",
      { streng: true, nei: "ski, vannski, slalåmski, sky, by" },
    ),
    sp(
      "Nevn en matrett eller drikk som er oppkalt etter en person eller et sted",
      "hamburger, biff stroganoff/stroganoff, pizza margherita/margherita, wienerschnitzel, champagne/sjampanje, Earl Grey | sandwich, pavlova, caesarsalat/caesar salad, beef Wellington/Wellington, eggs Benedict/egg Benedict, frankfurter, wienerbrød, berlinerbolle/berliner, napoleonskake, parmesan/parmigiano, cheddar, gouda, brie, camembert, roquefort, dijonsennep/dijon, bolognese/spaghetti bolognese, fersken Melba/peach Melba/pêche Melba, carpaccio, Sachertorte, waldorfsalat/waldorf, cognac/konjakk, Jarlsberg, bearnaise | bourbon, tequila, pilsner/pils, nachos, linzertorte/linzerkake, schwarzwälderkake/schwarzwaldkake/schwarzwälder, toast Skagen, tarte Tatin, fettuccine Alfredo/Alfredo, wienerpølse/wiener, gorgonzola, parmaskinke, emmentaler, gruyère, edamer, portvin/port, Bordeaux, Pizza Hawaii/Hawaiipizza, Mozartkugel/Mozartkuler, chicken Kiev/kylling Kiev, Yorkshire pudding, worcestersaus/Worcestershire sauce | birchermüsli, kaiserschmarrn, Janssons frestelse, biff Lindström/biff à la Lindström, bechamelsaus/béchamel, hollandaise, chantillykrem/chantilly, madeleine, praliné, crêpe Suzette, Granny Smith, baked Alaska, stilton, sherry, madeira, marsala, burgunder, chianti, rioja, prosecco, Shirley Temple, Arnold Palmer, negroni, bellini, manhattan, Long Island Iced Tea, Singapore Sling, Moscow Mule, Cornish pasty, tabasco, cotoletta alla milanese | graham crackers, Salisbury steak, Reuben sandwich, Cobb salad, Tom Collins, Welsh rarebit, Eccles cake, Bakewell tart, Oysters Rockefeller",
      { nei: "pizza, lasagne, taco, sushi, kebab" },
    ),
  ),
]
