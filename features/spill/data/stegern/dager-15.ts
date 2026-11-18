import { dag, sp } from "./typer"

// Days 66–70.
export const dager15 = [
  dag(
    sp(
      "Nevn en rett der ost er en hovedingrediens",
      "pizza, fondue/ostefondue, raclette, mac and cheese/makaroni og ost/mac & cheese, quesadilla | ostesmørbrød, grilled cheese/grillet ostesmørbrød, toast/ost og skinke-toast, lasagne, ostekake/cheesecake, ostefat/ostebrett, ostesuppe, croque monsieur, cordon bleu, caprese/capresesalat, halloumi/grillet halloumi, saganaki, quiche, cheeseburger, nachos, ostegrateng/gratin, potetgrateng, blomkålgrateng, parmigiana/aubergine parmigiana | spanakopita, tiropita, khachapuri, burek, cacio e pepe, fettuccine Alfredo/Alfredo, käsespätzle, poutine, welsh rarebit, palak paneer, paneer tikka, mattar paneer, queso fundido, tartiflette, aligot, mozzarellasticks/ostestenger, fritert camembert/friterte camembert, bakt brie/bakt camembert, ostehorn, calzone, enchiladas, pastagrateng | cheesesteak/Philly cheesesteak, ostesufflé/sufflé, pão de queijo, carbonara, risotto, pizzabolle, chile relleno | gougères",
    ),
    sp("Nevn et land som grenser til Bulgaria", "#GR, #TR, #RO | #RS | #MK | | @naboer:BG", { nei: "Ungarn, Ukraina, Albania, Moldova" }),
    sp(
      "Nevn et hundedyr",
      "ulv/gråulv, rev/rødrev, hund/tamhund, fjellrev/polarrev | sjakal, prærieulv/coyote, dingo, fennek/ørkenrev, mårhund, afrikansk villhund/villhund | polarulv, asiatisk villhund/dhole/rødhund, manulv, gullsjakal, blårev, sølvrev | buskhund, grårev, kittrev, rødulv, etiopisk ulv/abessinsk ulv, øreflyttrev/flaggermusøret rev/storøret rev, stripesjakal | svartrygget sjakal/schabrakksjakal, Darwins rev, pampasrev, andesrev, korsakrev, tibetrev",
      { nei: "hyene, katt, gaupe, bjørn" },
    ),
    sp(
      "Nevn en film med Leonardo DiCaprio",
      "Titanic, Inception, The Wolf of Wall Street, The Revenant, Catch Me If You Can | Shutter Island, The Departed, Django Unchained, Once Upon a Time in Hollywood, The Great Gatsby, Romeo + Juliet/Romeo og Julie/Romeo and Juliet, Blood Diamond, The Aviator, Don't Look Up, Killers of the Flower Moon, The Beach, Gangs of New York | What's Eating Gilbert Grape, The Man in the Iron Mask/Mannen med jernmasken, Revolutionary Road, J. Edgar, Body of Lies, The Basketball Diaries, Marvin's Room, The Quick and the Dead, This Boy's Life, Total Eclipse, One Battle After Another | Celebrity, Critters 3, Before the Flood | The 11th Hour",
      { nei: "Forrest Gump, Interstellar, Avatar, The Godfather" },
    ),
    sp(
      "Nevn noe man kan gjøre ute om vinteren",
      "gå på ski/ski/langrenn/skitur, ake/aking/akebrett, lage snømann/snømann, gå på skøyter/skøyter | snøballkrig/kaste snøball, kjøre slalåm/slalåm/alpint/stå på ski, stå på snowboard/snowboard, isfiske/pilke, bygge snøhule/snøhule, måke snø/snømåking, gå tur/gå på tur, lage snøengel/snøengel, ishockey/hockey, bandy, sparkstøtting/spark, hundekjøring/hundeslede, kjøre snøscooter/snøscooter, skiskyting, hoppe på ski/skihopp, topptur/randonee, gå på truger/truger, vinterbade/isbade/vinterbading, fyre bål/bålkos, se på nordlyset/nordlys, curling, lage snølykt/snølykter, bygge iglo/iglo, snøborg | telemark, sykle/fatbike, snøkiting/snowkiting, isklatring, sledetur/hesteslede, kjelke, langrenn i lysløype/lysløype, skøyteløp, grille, ta bilder | skikjøring, vinterfotball, vinterklatring | ",
    ),
    sp(
      "Nevn en opera",
      "Carmen, Tryllefløyten, La Traviata, Aida, Madama Butterfly/Madame Butterfly | La Bohème/Bohème, Tosca, Rigoletto, Figaros bryllup/Le nozze di Figaro, Don Giovanni, Barberen i Sevilla/Il barbiere di Siviglia, Nibelungens ring/Der Ring des Nibelungen/Ringen, Turandot, Otello, Nabucco, Il trovatore/Trubaduren, Fidelio, Faust, Lohengrin, Tristan og Isolde, Den flygende hollender/Den flyvende hollender, Valkyrien/Die Walküre | Parsifal, Rhinens gull/Das Rheingold, Siegfried, Gudenes undergang/Götterdämmerung, Eugen Onegin/Jevgenij Onegin, Spar dame/Pique Dame, Boris Godunov, Cavalleria rusticana, Pagliacci/Bajazzo, Salome, Rosenkavaleren/Der Rosenkavalier, Elektra, Peter Grimes, Porgy and Bess, Orfeus og Evrydike/Orfeo ed Euridice, Dido og Aeneas, Così fan tutte, Lucia di Lammermoor, Kjærlighetsdrikken/L'elisir d'amore, Norma, Hoffmanns eventyr, Samson og Dalila, Perlefiskerne, Hans og Grete, Tannhäuser, Mestersangerne/Die Meistersinger, Macbeth, Falstaff, Don Carlos, Maskeballet/Un ballo in maschera, Gianni Schicchi | L'Orfeo, Idomeneo, Bortførelsen fra seraillet/Entführung aus dem Serail, Don Pasquale, Manon, Manon Lescaut, Werther, Lakmé, Pelléas og Mélisande, Wozzeck, Simon Boccanegra, La forza del destino/Skjebnens makt, Prins Igor, Rusalka, Jenůfa, Den glade enke, Flaggermusen/Die Fledermaus, Orfeus i underverdenen | Akhnaten, Einstein on the Beach, Nixon in China, Anne Pedersdotter",
      { nei: "Phantom of the Opera, Les Misérables, Svanesjøen, Nøtteknekkeren, Cats" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du trenger når du skal fiske",
      "fiskestang/stang, snelle, krok/fiskekrok, sluk, agn | snøre/fiskesnøre, mark/meitemark/makk, dupp, søkke/lodd, fiskekort, kniv/fiskekniv, håv, pilk, wobbler, flue/fiskeflue, båt, redningsvest, bøtte, isbor, termos, matpakke, tålmodighet, spinner, kunstagn, fluestang | tang/fisketang, slukboks/agnboks, garn, ruse, teine, line, pilkestang, kjølebag/kjøleboks, polaroidbriller/solbriller, myggolje/myggspray, fiskevest, fortom, svivel, ekkolodd/fiskeradar, jigg, vadere/vadebukse, støvler, sitteunderlag, reker | isskje, krokløser, fiskevekt/vekt, målebånd, gummifisk/softbait, klepp/gaff, sild | boilies",
    ),
    sp("Nevn et land som begynner på C", "#CA, #CL, #CU | #CO, #CR | #CI, #CV | | @start:C", { nei: "Kina, Kypros, Kroatia, Tsjekkia, Kamerun" }),
    sp(
      "Nevn et dyr som lever i Antarktis eller Sørishavet",
      "keiserpingvin, pingvin, sel, hval, krill | adeliepingvin, kongepingvin, eselpingvin/gentoopingvin, ringpingvin, leopardsel, weddellsel, krabbeetersel, elefantsel/sørlig elefantsel, spekkhogger/orka, blåhval, knølhval, vågehval, albatross/vandrealbatross | rosssel, pelssel, finnhval, seihval, kaskelott/spermhval, kjempepetrell, snøpetrell, storjo/skua, tannfisk/patagonsk tannfisk, isfisk, kolossblekksprut/kolossalblekksprut | makaronipingvin, klippehopper, sørkaper, havsvale | nebbhval, spretthaler, midd",
      { nei: "isbjørn, hvalross, reinsdyr, fjellrev, moskus, moskusokse" },
    ),
    sp(
      "Nevn en barnesang",
      "Bæ bæ lille lam, Lille Petter Edderkopp, Hjulene på bussen, Fader Jakob, Bjørnen sover | Ro ro ro din båt, Ro ro til fiskeskjær, Mikkel rev, Kjerringa med staven, Tre små kinesere, Alle fugler små de er, Hode skulder kne og tå, Blinke blinke lille stjerne, Se min kjole, Byssan lull, Bake kake søte, Jeg er en liten undulat, Baby Shark, Her kommer Pippi Langstrømpe | Jeg gikk en tur på stien, Det satt to katter på et bord, Bro bro brille, Hvis du er glad og vet det/Hvis du er glad, Klappe klappe søte, Ride ride ranke, Teddybjørnens vise, Kardemommesangen, Røvervisa, Musevisa, Lisa gikk til skolen, Sov du lille videungen, Old MacDonald, Jeg er en papegøye fra Amerika, En elefant kom marsjerende, Tommelfinger hvor er du | Du skal få en dag i mårå, Lillebrors vise, Kråkevisa, Politimester Bastians vise | ",
    ),
    sp(
      "Nevn noe du finner på en typisk norsk hytte",
      "peis, vedovn, utedo/do, ved, stearinlys/lys | kortstokk/kort, brettspill/spill, puslespill, Donald-blader/Donald, køyeseng, ski, pledd/ullpledd, hyttebok/gjestebok, kakao, parafinlampe/parafin, fyrstikker, radio, vaffeljern, kokekaffe/kaffekjele, gevir/elggevir, kart/turkart, kikkert, solcellepanel/solceller, gasskomfyr/gassbluss, bøtte/vannbøtte, brønn, skismøring, sofa, saueskinn/saueskinnsfell, terrasse/veranda, badstue/sauna, flagg/flaggstang, bøker, kryssord, Kvikk Lunsj | vedskjul, uthus/bod, tøfler/hyttesko, ullsokker, mus, bålpanne, tørkestativ, boblebad/jacuzzi, TV, kaffe, termos, sitteunderlag | ryeteppe, edderkopper, kjøkkenbenk | ",
    ),
    sp(
      "Nevn en norsk fjellovergang",
      "Hardangervidda, Haukelifjell/Haukeli, Filefjell, Dovrefjell/Dovre, Valdresflya | Hemsedalsfjellet, Sognefjellet/Sognefjellsvegen, Strynefjellet/Strynefjell, Saltfjellet, Trollstigen, Vikafjellet, Gaularfjellet, Aurlandsfjellet/Snøvegen, Imingfjell, Kvænangsfjellet | Bjørnfjell, Røldalsfjellet, Venabygdsfjellet, Sennalandet, Ifjordfjellet, Gamle Strynefjellsvegen, Tindevegen | Kongevegen, Jotunheimvegen | ",
      { nei: "Galdhøpiggen, Jotunheimen, Preikestolen" },
    ),
  ),
  dag(
    sp(
      "Nevn et brennevin",
      "vodka, akevitt/aquavit, whisky/whiskey, gin, rom/rum | tequila, cognac/konjakk, brandy, likør, sambuca, ouzo, grappa, absint/absinth, mezcal, calvados, armagnac, bourbon, scotch, Jägermeister, snaps/schnapps, hjemmebrent/heimbrent/HB/moonshine | Fernet/Fernet-Branca, Campari, Baileys, Amaretto, Limoncello, Cointreau/Triple sec, Kahlúa, pisco, raki, soju, cachaça, rakija, Gammel Dansk | arak, baijiu, shochu, slivovitz/plommebrennevin, pálinka, pastis, kirsch/kirschwasser, genever, Pernod, Chartreuse, Grand Marnier, Linie | obstler, poitín, Bénédictine, Drambuie",
      { nei: "vin, øl, sake, cider, champagne" },
    ),
    sp("Nevn et land som grenser til Belarus", "#RU, #PL, #UA | #LT, #LV | | | @naboer:BY", { nei: "Estland, Finland, Moldova, Romania, Slovakia" }),
    sp(
      "Nevn et mårdyr",
      "grevling, oter, mår/skogmår, røyskatt, jerv | snømus, mink, ilder, steinmår, sobel, honninggrevling, havoter/sjøoter, kjempeoter | fiskemår, dvergoter, steppeilder, svartfotilder, kanadisk oter, amerikansk grevling | tayra, zorilla/stripeilder | grison, svinegrevling, ildergrevling",
      { nei: "skunk, stinkdyr, rev, vaskebjørn, ekorn" },
    ),
    sp(
      "Nevn en krimforfatter",
      "Jo Nesbø/Nesbø, Agatha Christie/Christie, Anne Holt, Arthur Conan Doyle/Conan Doyle, Stieg Larsson | Henning Mankell/Mankell, Karin Fossum, Gunnar Staalesen/Staalesen, Unni Lindell, Jørn Lier Horst/Lier Horst, Camilla Läckberg/Läckberg, Jussi Adler-Olsen, Dan Brown, Lee Child, Raymond Chandler, Georges Simenon/Simenon, Edgar Allan Poe/Poe, John Grisham, James Patterson, Tom Egeland, Hans Olav Lahlum/Lahlum, Kjell Ola Dahl, Samuel Bjørk, Lars Kepler, Liza Marklund, Sjöwall og Wahlöö/Maj Sjöwall/Per Wahlöö | Dashiell Hammett, Dorothy L. Sayers/Dorothy Sayers, P.D. James, Ruth Rendell, Ian Rankin, Michael Connelly, Patricia Highsmith, Vidar Sundstøl, Chris Tvedt, Åsa Larsson, Arne Dahl, Håkan Nesser, Yrsa Sigurðardóttir, Arnaldur Indriðason, Ragnar Jónasson, Thomas Enger, Ingar Johnsrud, Torkil Damhaug, Kurt Aust, Helene Tursten, Leif G.W. Persson, Mari Jungstedt, Viveca Sten, Elizabeth George, Val McDermid, Peter James, Tana French, Donna Leon, Andrea Camilleri, Fred Vargas, Thomas Harris, Gillian Flynn, Paula Hawkins, Harlan Coben, Karin Slaughter, Tess Gerritsen, Patricia Cornwell, Stephen King, Jens Lapidus, Jon Michelet, Trude Teige, Jan-Erik Fjell, Heine Bakkeid, Richard Osman, Anthony Horowitz | Sue Grafton, Ellery Queen, Rex Stout, Erle Stanley Gardner, Mickey Spillane, Ed McBain, Wilkie Collins, G.K. Chesterton, Edgar Wallace, Ross Macdonald, Elmore Leonard, Dennis Lehane, Jeffery Deaver, Lynda La Plante, Ruth Ware, Alex Michaelides, Lucy Foley, Mo Hayder, Fredrik Skagen, Gert Nygårdshaug | ",
      { nei: "J.K. Rowling, Roald Dahl, Henrik Ibsen" },
    ),
    sp(
      "Nevn noe du finner i et alpinanlegg",
      "skiheis/heis, stolheis, bakke/slalåmbakke/løype, skitrekk/T-krok/trekk, gondol/gondolbane | kafé/kafeteria, skiutleie/utleie, heiskort, hoppkant/hopp, terrengpark/park/snowpark, tråkkemaskin/preppemaskin/løypemaskin/pistemaskin, snøkanon/kunstsnø, skiskole/skilærer, tallerkenheis/knappheis, barnebakke/barneområde, rullebånd/magic carpet, flomlys/lys, skipatrulje/patrulje, afterski, vafler/vaffel, varmestue, sportsbutikk, toalett, parkering, hytter, ski, snowboard, hjelm, skibriller | halfpipe, kø/heiskø, svart løype, rød løype, blå løype, grønn løype, offpist, pølser, kakao, snøscooter, ankerheis, rail | skiskap, solkrem | box",
    ),
    sp(
      "Nevn en astronaut eller kosmonaut",
      "Neil Armstrong/Armstrong, Buzz Aldrin/Aldrin, Jurij Gagarin/Juri Gagarin/Yuri Gagarin/Gagarin | Valentina Teresjkova/Teresjkova/Tereshkova, Michael Collins, Christer Fuglesang/Fuglesang, Marcus Wandt, Chris Hadfield/Hadfield, John Glenn, Alan Shepard, Sally Ride, Tim Peake, Thomas Pesquet/Pesquet, Samantha Cristoforetti/Cristoforetti, Andreas Mogensen/Mogensen, Aleksej Leonov/Alexei Leonov/Leonov, Jim Lovell/Lovell, Scott Kelly, Mark Kelly, Peggy Whitson, Sunita Williams/Suni Williams | Butch Wilmore/Barry Wilmore, Gene Cernan/Eugene Cernan, Harrison Schmitt, Pete Conrad, Alan Bean, David Scott/Dave Scott, James Irwin, John Young, Charles Duke/Charlie Duke, Edgar Mitchell, Ed White, Gus Grissom, Roger Chaffee, Frank Borman, Bill Anders/William Anders, Tom Stafford, Deke Slayton, Gordon Cooper, Wally Schirra, Scott Carpenter, Jack Swigert, Fred Haise, Ken Mattingly, Al Worden, Dick Gordon, Rusty Schweickart, Christa McAuliffe, Kalpana Chawla, Mae Jemison, Eileen Collins, Valerij Poljakov/Valeri Polyakov, Sergej Krikaljov/Sergei Krikalev, German Titov/Gherman Titov, Vladimir Komarov, Yang Liwei, Alexander Gerst/Gerst, Luca Parmitano, Helen Sharman, Jessica Meir, Christina Koch, Bob Behnken, Doug Hurley, Victor Glover, Reid Wiseman, Jeremy Hansen, Jared Isaacman | Stuart Roosa, Judith Resnik, Ronald McNair, Ilan Ramon, Story Musgrave, Kathryn Sullivan, Guion Bluford, Gennadij Padalka, Oleg Kononenko, Svetlana Savitskaja, Wang Yaping, Koichi Wakata, Ulf Merbold, Sigmund Jähn, Matthias Maurer, Paolo Nespoli, André Kuipers, Rakesh Sharma, Kate Rubins, Hayley Arceneaux, Dennis Tito | Ron Evans, Ellison Onizuka, Pavel Beljajev, Mamoru Mohri, Frank De Winne, Jean-Loup Chrétien, Claudie Haigneré, Jessica Watkins",
      { nei: "Laika, Elon Musk, Wernher von Braun, Roald Amundsen" },
    ),
  ),
  dag(
    sp(
      "Nevn noe man kan kjøpe på boks (hermetikk)",
      "makrell i tomat/makrell, tunfisk, mais, hermetiske tomater/tomat/hakkede tomater, ananas | bønner/bakte bønner/baked beans, kidneybønner, kikerter, erter/grønne erter, sardiner, ansjos, kokosmelk, fruktcocktail, fersken, lapskaus, suppe/tomatsuppe, fiskeboller, leverpostei, sjampinjong/champignon/sopp, oliven, torskelever, brus/cola, øl | pærer, aprikos, mandariner/mandarinbåter, kjøttboller, rødbeter, artisjokk, linser, hvite bønner, svarte bønner, laks, krabbe/krabbekjøtt, blåskjell/muslinger, reker, brisling, sild/sild i tomat, corned beef, Spam, pølser/wienerpølse, ravioli, hundemat/kattemat, energidrikk, kondensmelk/kondensert melk, tomatpuré, surströmming, rogn/torskerogn | palmehjerter, bambusskudd, vannkastanjer, røkt østers/østers, chili con carne, gaffelbiter, fiskepudding, sardeller | ",
    ),
    sp("Nevn et land med kyst mot Østersjøen", "#SE, #FI, #DK | #DE, #PL, #EE | #LV, #LT, #RU | | ", { nei: "Norge, Nederland, Belarus, Island" }),
    sp(
      "Nevn noe som lyser i mørket",
      "månen/måne, stjerner/stjerne, lommelykt, refleks, stearinlys/lys | nordlys, ildflue, morild, hodelykt, gatelys/gatelykt/lyktestolpe, mobil/telefon/mobilskjerm, TV/TV-skjerm, fyrtårn, nattlampe/nattlys, selvlysende stjerner/selvlysende klistremerker, lyspære, lampe, refleksvest, billykter/frontlys/lykt, trafikklys, neonskilt/neon, fyrverkeri, lyn, bål | sankthansorm/glødeorm, selvlysende klokke, knekklys/lysstav/glowstick, stjerneskudd/meteor, glør, fyrstikker, nødutgangsskilt/nødlys/exit-skilt, julelys/lysslynge | dyphavsfisk/breiflabb, manet, katteøyne, røykvarsler, julestjerne, lava, fosfor, plankton, ISS/romstasjonen, satellitt, fly, lighter, komet, planeter | radium, lysende sopp",
    ),
    sp(
      "Nevn et realityprogram på TV",
      "71° nord/71 grader nord, Farmen, Paradise Hotel, Skal vi danse, Big Brother | Idol, Stjernekamp, MasterChef, The Voice, Kompani Lauritzen, Alt for Norge, Hver gang vi møtes, Gift ved første blikk, Love Island, Robinsonekspedisjonen/Robinson, Ex on the Beach, Bachelor/The Bachelor, Bachelorette, Survivor, X Factor, Norske talenter, Mesternes mester, Luksusfellen, Fangene på fortet, Keeping Up with the Kardashians/Kardashians | Farmen kjendis, Kongen befaler, Petter uteligger, Jakten på kjærligheten, Charterfeber, Hellstrøm rydder opp, Hele Norge baker, Bake Off/The Great British Bake Off, Jersey Shore, Love Is Blind, Too Hot to Handle, Selling Sunset, Hell's Kitchen, Kitchen Nightmares, Top Model/America's Next Top Model, Drag Race/RuPaul's Drag Race, Fear Factor, The Amazing Race, Løvens hule/Shark Tank | The Osbournes, Below Deck, Ice Road Truckers, Deadliest Catch, Top Chef, Project Runway, Popstars | ",
      { nei: "Skam, Exit, Hotel Cæsar, Side om side, Vikingane" },
    ),
    sp(
      "Nevn noe som er hvitt",
      "snø, melk, skyer/sky, papir, isbjørn | sukker, salt, tenner/tann, svane, brudekjole, eggehvite, ris, mel, kritt, bomull, blomkål, fløte/krem/pisket krem, marengs, hvit sjokolade, snømann, måke | hvitveis, snøklokke, prestekrage, sau, snøugle, rype, fjellrev, røyskatt, kokos, majones, rømme, yoghurt, legefrakk/legekittel, kokkelue, kjøleskap, toalett/do, porselen, elfenben, perle, bein/skjelett, hvitløk, Det hvite hus, spøkelse, snøfnugg, rimfrost/rim, toalettpapir/dopapir | vaskemaskin, badekar, tofu, mozzarella, hvitt flagg, kalk, gips | ",
    ),
    sp(
      "Nevn et verk av Edvard Grieg",
      "Peer Gynt/Peer Gynt-suiten, I Dovregubbens hall/Dovregubbens hall/In the Hall of the Mountain King, Morgenstemning/Morgen/Morning Mood, Pianokonsert i a-moll/Pianokonserten/a-mollkonserten | Holbergsuiten/Fra Holbergs tid/Holberg-suite, Anitras dans, Solveigs sang, Åses død, Lyriske stykker, Bryllupsdag på Troldhaugen/Bryllupsdag på Trollhaugen, Våren/Siste vår, Sigurd Jorsalfar | Ingrids klage, Arabisk dans, Peer Gynts hjemkomst, Solveigs vuggevise, Jeg elsker dig/Jeg elsker deg/Ich liebe dich, Symfoniske danser, Norske danser, Slåtter, Haugtussa, Landkjenning, Den bergtekne, Til våren, Sommerfugl, Notturno, Trolltog/Troldtog, Kobold, Fiolinsonate/fiolinsonatene, Cellosonate/cellosonaten, Strykekvartett, Ballade i g-moll/Ballade, Pianosonate, Symfoni i c-moll, Foran sydens kloster, Olav Trygvason, Brudefølget drar forbi/Brudefølget drager forbi, Hjertesår, Det første møte | Ved Rondane, En svane, Fra Monte Pincio, Klokkeklang, Ensom vandrer, Halling, Springdans, Elverdans, Vektersang, Arietta, Humoresker, Bergliot, Sørgemarsj over Rikard Nordraak, Fire salmer, Hyldningsmarsj | ",
      { nei: "Svanesjøen, Måneskinnssonaten, Ja vi elsker, Für Elise" },
    ),
  ),
  dag(
    sp(
      "Nevn noe som er rundt",
      "ball, sola/sol, månen/måne, hjul, jordkloden/jorda | tallerken, mynt/mynter, ring, pizza, klokke, knapp, sirkel, kule, appelsin, eple, smultringer/donut, CD/plate, bolle, ballong, globus, øye/pupill, perle, tomat, rundkjøring, ratt, planet/planeter, boble/såpebobler, dekk/bildekk, fotball | kake, pannekake, hamburger, karusell, pariserhjul, trampoline, rokkering/hula hoop, frisbee, kjeks, lokk, blåbær, erter, druer, vannmelon/melon, null/0, bokstaven O, medalje, trommer, rundstykke, kjøttboller/kjøttkaker, snøball, rundball | koøye, kontaktlinse, kokosnøtt, rundt bord, pille/tablett, lyspære, iskule, kuppel | ",
    ),
    sp("Nevn et land som grenser til Litauen", "#LV, #PL | #BY | #RU | | @naboer:LT", { nei: "Estland, Ukraina, Tyskland, Finland" }),
    sp(
      "Nevn et amfibium",
      "frosk, padde, salamander | aksolotl/axolotl, storsalamander, småsalamander, ildsalamander/brannsalamander, pilgiftfrosk/giftfrosk, oksefrosk, løvfrosk/trefrosk, buttsnutefrosk | spissnutefrosk, damfrosk, nordpadde/vanlig padde, agapadde/cane toad, glassfrosk, rødøyd løvfrosk/rødøyet løvfrosk, goliatfrosk, kjempesalamander/japansk kjempesalamander/kinesisk kjempesalamander | klokkefrosk, strandpadde, grønnpadde, hornfrosk, olm/hulesalamander, ormepadde, klørfrosk, flygefrosk | surinamsk padde/pipa, darwinfrosk, tomatfrosk, hellbender, siren",
      { nei: "øgle, firfisle, krokodille, slange, skilpadde, kameleon" },
    ),
    sp(
      "Nevn en Taylor Swift-låt",
      "Shake It Off, Love Story, Blank Space, Anti-Hero, Cruel Summer | You Belong with Me, Bad Blood, Look What You Made Me Do, We Are Never Ever Getting Back Together, All Too Well, Style, Wildest Dreams, Delicate, ME!, Lover, Cardigan, Willow, Exile, Fortnight, Karma, The Fate of Ophelia, 22, I Knew You Were Trouble, Fearless | Champagne Problems, Lavender Haze, Midnight Rain, Bejeweled, Enchanted, Mine, Fifteen, Teardrops on My Guitar, Our Song, Tim McGraw, Picture to Burn, White Horse, Back to December, Mean, Sparks Fly, Red, Everything Has Changed, Out of the Woods, Welcome to New York, New Romantics, Ready for It, Gorgeous, End Game, Getaway Car, Don't Blame Me, The Man, You Need to Calm Down, Cornelia Street, Daylight, August, Betty, The 1, Mirrorball, Seven, Invisible String, My Tears Ricochet, No Body No Crime, Gold Rush, 'Tis the Damn Season, Snow on the Beach, Maroon, You're on Your Own Kid, Mastermind, Is It Over Now, Florida!!!, Down Bad, I Can Do It with a Broken Heart, So Long London, The Tortured Poets Department, But Daddy I Love Him, Who's Afraid of Little Old Me, The Black Dog, Opalite, Elizabeth Taylor, Father Figure, Wood, Actually Romantic, Ruin the Friendship, Eldest Daughter, Cancelled!, Honey, The Life of a Showgirl, Wi$h Li$t/Wish List, Safe & Sound/Safe and Sound, Long Live, Paper Rings | Eyes Open, Today Was a Fairytale, Crazier, Christmas Tree Farm, Only the Young, Message in a Bottle, Mr. Perfectly Fine, I Bet You Think About Me, London Boy, Death by a Thousand Cuts, Afterglow, Miss Americana & the Heartbreak Prince, The Archer, Dear John, The Story of Us, Speak Now, Better Than Revenge, Begin Again, State of Grace, How You Get the Girl, Clean, This Love, Call It What You Want, Dress, New Year's Day, I Did Something Bad, Peace, This Is Me Trying, Illicit Affairs, The Last Great American Dynasty, Tolerate It, Marjorie, Coney Island, Evermore, Vigilante Shit, Sweet Nothing, Say Don't Go, Now That We Don't Talk, Slut!, Guilty as Sin, The Alchemy, Clara Bow, LOML, So High School | Hits Different, False God, It's Nice to Have a Friend, Soon You'll Get Better, Haunted, Innocent, Last Kiss, Holy Ground, Treacherous, Stay Stay Stay, The Last Time, Starlight, I Wish You Would, Wonderland, You Are in Love, I Know Places, King of My Heart, So It Goes, Dancing with Our Hands Tied, This Is Why We Can't Have Nice Things, Hoax, Epiphany, Mad Woman, Happiness, Ivy, Cowboy Like Me, Long Story Short, Closure, Dorothea, Labyrinth, The Great War, Would've Could've Should've, Bigger Than the Whole Sky, Paris, High Infidelity, Dear Reader, You're Losing Me, Suburban Legends, The Smallest Man Who Ever Lived, The Prophecy, The Bolter, Cassandra, Peter, Robin, The Manuscript, Fresh Out the Slammer",
    ),
    sp(
      "Nevn et ord som rimer på «snø»",
      "sjø, frø, dø, kø | tø, strø, ø, klø | innsjø, adjø, miljø, trø | mø | Bø",
      { streng: true, nei: "snø, nysnø, sludd, sne" },
    ),
    sp(
      "Nevn en halvøy",
      "Den iberiske halvøy/Iberia/Den pyreneiske halvøy, Skandinavia/Den skandinaviske halvøy, Balkan/Balkanhalvøya, Den italienske halvøy/Apenninhalvøya, Jylland | Den arabiske halvøy/Arabia, Krim/Krimhalvøya, Korea/Koreahalvøya, Kamtsjatka, Florida, Sinai/Sinaihalvøya, Peloponnes, Yucatán, Kola/Kolahalvøya, Malakkahalvøya/Malayahalvøya, Indokina, Antarktishalvøya, Alaska | Nordkinn/Nordkinnhalvøya, Varangerhalvøya, Stad/Stadlandet, Nesodden, Bygdøy, Hurum/Hurumlandet, Fosen/Fosenhalvøya, Den indiske halvøy/Hindustan, Anatolia/Lilleasia, Cornwall, Bretagne, Chalkidiki/Halkidiki, Istria/Istra, Baja California, Fennoskandia | Kintyre, Cotentin, Gallipoli, Calabria, Labrador, Cape Cod, Taimyr, Tsjukotka, Afrikas horn/Somalihalvøya, Cape York, Nova Scotia, Lista | Gargano, Salento, Delmarva, Jamal, Shandong, Liaodong, Kenai, Gaspé/Gaspésie, Eyre",
      { nei: "Sjælland, Gotland, Lofoten, Island, Grønland, Madagaskar, Spitsbergen" },
    ),
  ),
]
