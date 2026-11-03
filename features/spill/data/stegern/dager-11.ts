import { dag, sp } from "./typer"

// Days 46–50.
export const dager11 = [
  dag(
    sp(
      "Nevn en belgfrukt",
      "bønner/bønne, erter/ert, linser, kikerter | soyabønner/soya, peanøtter/peanøtt, kidneybønner, sukkererter, edamame, aspargesbønner/grønne bønner, hvite bønner, sorte bønner | brune bønner, limabønner, mungbønner, adzukibønner, pintobønner, bondebønner/favabønner, borlottibønner, gule erter, grønne erter, splitterter, røde linser, grønne linser, belugalinser, puylinser | augebønner/black-eyed peas, cannellinibønner, flageoletbønner, lupin, tamarind, johannesbrød, guarbønner, luserne/alfalfa, brekkbønner, voksbønner | urdbønner, mottbønner, hestebønner, vingebønner, perlebønner, sabelbønner, jackbønner",
    ),
    sp("Nevn et land i Europa uten kystlinje", "#AT, #CH | #CZ, #HU, #LU | #SK, #RS, #BY | #LI, #AD, #SM, #VA, #MD, #MK, #XK | ", { nei: "Polen, Tyskland, Bosnia-Hercegovina, Slovenia, Belgia, Nederland" }),
    sp(
      "Nevn en superhelt fra DC",
      "Batman, Superman, Wonder Woman, Flash/The Flash | Aquaman, Robin, Green Lantern, Cyborg, Supergirl, Batgirl, Catwoman, Shazam, Green Arrow, Martian Manhunter, Nightwing | Harley Quinn, Raven, Starfire, Beast Boy, Hawkman, Hawkgirl, Blue Beetle, Zatanna, Black Canary, Booster Gold, Firestorm, Atom, Plastic Man, Swamp Thing, Constantine, Doctor Fate, Huntress, Red Hood, Static, Black Adam, Peacemaker, Krypto | Batwoman, Mister Miracle, Big Barda, Vixen, Red Tornado, Steel, Captain Atom, Jonah Hex, Deadman, Spectre, Sandman, Wildcat, Aqualad, Kid Flash, Wonder Girl, Superboy, Power Girl, Stargirl, Jessica Cruz, John Stewart, Hal Jordan, Barry Allen, Wally West | Guy Gardner, Kyle Rayner, Metamorpho, Elongated Man, Mera, Orion, Hourman, Doctor Light, Bumblebee, Cassandra Cain, Oracle",
      { nei: "Spider-Man, Iron Man, Hulk, Thor, Captain America" },
    ),
    sp(
      "Nevn et ord som rimer på «hus»",
      "mus, lus | brus, krus, grus | rus, sus, snus, knus, pus | dus, blus, jus, flaggermus, spissmus, julebrus, kaffekrus | markmus, skogmus, husmus, datamus, ølkrus, tekrus, fyllerus, fartsrus, sukkerrus, lykkerus, hodelus, bladlus, sengelus, appelsinbrus, sitronbrus",
      { streng: true, nei: "hus, huset, kurs, puss, bus" },
    ),
    sp(
      "Nevn en av Jesu tolv apostler",
      "Peter/Simon Peter/Petrus, Judas/Judas Iskariot, Johannes, Tomas/Thomas | Jakob, Andreas, Matteus | Filip, Bartolomeus, Simon/Simon seloten | Taddeus/Judas Taddeus, Jakob den yngre/Jakob Alfeussønn, Matthias | Paulus",
      { nei: "Jesus, Maria, Josef, Moses, Lukas, Markus" },
    ),
    sp(
      "Nevn en by i Tyskland",
      "Berlin, München, Hamburg, Frankfurt, Köln | Düsseldorf, Stuttgart, Dresden, Leipzig, Bremen, Hannover, Nürnberg, Dortmund, Kiel, Heidelberg | Essen, Bonn, Lübeck, Rostock, Münster, Freiburg, Mainz, Aachen, Augsburg, Regensburg, Würzburg, Potsdam, Weimar, Erfurt, Kassel, Karlsruhe, Mannheim, Wiesbaden, Gelsenkirchen, Duisburg, Bochum, Wuppertal, Bielefeld, Braunschweig, Wolfsburg, Ingolstadt, Garmisch-Partenkirchen, Flensburg, Trier, Koblenz, Magdeburg, Halle, Chemnitz, Jena, Göttingen | Saarbrücken, Oldenburg, Osnabrück, Paderborn, Darmstadt, Heilbronn, Ulm, Pforzheim, Reutlingen, Tübingen, Konstanz, Passau, Bamberg, Bayreuth, Fürth, Erlangen, Mönchengladbach, Krefeld, Leverkusen, Oberhausen, Hagen, Hamm, Solingen, Remscheid, Siegen, Gießen, Marburg, Fulda, Lüneburg, Celle, Hildesheim, Wolfenbüttel, Goslar, Cuxhaven, Wilhelmshaven, Emden, Stralsund, Greifswald, Schwerin, Wismar, Cottbus | Görlitz, Zwickau, Plauen, Gera, Eisenach, Gotha, Dessau, Wittenberg, Quedlinburg, Rothenburg ob der Tauber, Füssen, Berchtesgaden, Baden-Baden, Travemünde, Warnemünde, Puttgarden,",
      { nei: "Bayern, Sachsen, Wien, Zürich, Salzburg, Sylt" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du kan ha på vafler",
      "syltetøy, smør, sukker, brunost | rømme, jordbærsyltetøy, bringebærsyltetøy, sirup, sjokoladepålegg/Nugatti/Nutella, krem, is, honning, blåbærsyltetøy | sjokolade, bær, jordbær, banan, sjokoladesaus, karamellsaus, lønnesirup, melis/flormelis/puddersukker, kanel, kanelsukker, peanøttsmør, multekrem, multer, tyttebær, eplemos, ost/gulost, skinke, bacon, egg, kremost | lemon curd, vaniljekrem, vaniljesaus, kesam, yoghurt, prim, smørkaramell, fløtekaramell, salt, kylling, fruktsalat, frukt, nøtter, kokos, marshmallows | aioli, pålegg, gravlaks, rekesalat, sylte, fårepølse",
    ),
    sp("Nevn et land som grenser til Hellas", "#TR, #AL | #BG, #MK | | | @naboer:GR"),
    sp(
      "Nevn en norsk innsjø",
      "Mjøsa, Femunden, Tyrifjorden, Randsfjorden | Hornindalsvatnet, Snåsavatnet, Tinnsjå/Tinnsjøen, Sognsvann, Maridalsvannet, Gjende, Bygdin, Øyeren | Selbusjøen, Limingen, Altevatnet, Røssvatnet, Norsjø, Bandak, Nisser, Totak, Møsvatn, Byglandsfjorden, Krøderen, Vansjø, Hurdalssjøen, Eikeren, Sperillen, Storsjøen, Aursunden, Tunnsjøen, Namsvatnet, Jølstravatnet, Strynevatnet, Lovatnet, Vangsvatnet, Bogstadvannet, Østensjøvannet, Lutvann, Nøklevann, Svartediket, Jonsvatnet, Prestvannet | Vinstre, Olstappen, Tisleifjorden, Strondafjorden, Slidrefjorden, Vågåvatnet, Lesjaskogsvatnet,, Store Le, Rødenessjøen, Lyseren, Hallevatnet, Ulsrudvann, Lianvatnet, Store Lungegårdsvann,| Ringsjøen, Einavatnet, Steinsfjorden, Holsfjorden, Femsjøen, Aremarksjøen, Øymarksjøen, Skjeggedalsvatnet, Ringedalsvatnet,",
      { nei: "Oslofjorden, Sognefjorden, Vänern, Vättern" },
    ),
    sp(
      "Nevn en Queen-låt",
      "Bohemian Rhapsody, We Will Rock You, We Are the Champions, Don't Stop Me Now | Another One Bites the Dust, Radio Ga Ga, I Want to Break Free, Under Pressure, Somebody to Love, The Show Must Go On, Killer Queen, Bicycle Race, Who Wants to Live Forever, A Kind of Magic, Crazy Little Thing Called Love | Fat Bottomed Girls, I Want It All, Innuendo, These Are the Days of Our Lives, Too Much Love Will Kill You, Flash, Love of My Life, You're My Best Friend, Seven Seas of Rhye, Now I'm Here, Hammer to Fall, One Vision, Friends Will Be Friends, Princes of the Universe, Breakthru, The Miracle, Headlong, Spread Your Wings, It's a Hard Life, Body Language, Heaven for Everyone, I'm Going Slightly Mad | Tie Your Mother Down, Good Old-Fashioned Lover Boy, Keep Yourself Alive, Stone Cold Crazy, Brighton Rock, '39, Death on Two Legs, Liar, Sheer Heart Attack, Play the Game, Save Me, Mustapha, Dragon Attack, Calling All Girls, Back Chat, Was It All Worth It, Mother Love, Let Me Live, Made in Heaven, No-One but You, Las Palabras de Amor | Lazing on a Sunday Afternoon, The Prophet's Song, Bring Back That Leroy Brown, Ogre Battle, Father to Son, My Fairy King, Teo Torriatte, White Man, Get Down Make Love, Coming Soon",
    ),
    sp(
      "Nevn et møbel",
      "stol, bord, sofa, seng | skap, bokhylle/hylle, kommode, lenestol, krakk, skrivebord, nattbord, salongbord/stuebord | garderobeskap, vitrineskap, skjenk, TV-benk, puff, sjeselong, spisebord, barstol, gyngestol, køyeseng, sovesofa, hjørnesofa, reol, skohylle, kontorstol, benk, divan | buffet, chiffonier, sekretær, kiste/dragkiste, klesstativ, kistebenk, sidebord, konsollbord, sminkebord/toalettbord, himmelseng, vugge, stellebord, solseng, hengekøye, saccosekk/sakkosekk, ottoman, klappstol, skammel, taburett | bysse, chesterfield, récamier, kabinettskap,, kroksofa, hjørneskap, kubbestol, slagbord, klaffebord, glassmontre, vinskap,",
    ),
    sp(
      "Nevn en knokkel i kroppen",
      "lårbein/lårben/femur, hodeskalle/kranium/kraniet, ryggvirvel/virvel/ryggrad, ribbein/ribben | kragebein, skulderblad, bekken/bekkenbein, kneskål, kjeve/underkjeve, overarmsbein/humerus, skinnebein/tibia, brystbein | albuebein/ulna, spolebein/radius, leggbein/fibula, halebein/haleben, korsbein, hælbein, mellomhåndsbein, mellomfotsbein, fingerbein, tåbein, overkjeve, hoftebein, kinnbein, nesebein | sprangbein/talus, håndrotsbein, fotrotsbein, tinningbein, pannebein, issebein, bakhodebein, kilebein, silbein, tungebein, hammeren, ambolten, stigbøylen, atlas, tannvirvel/axis, setebein, skambein, tarmbein | plogbein, tårebein, ganebein, båtbein, månebein, trekantbein, ertebein, trapesbein, hodebein, hakebein, kileformede bein, terningbein, sesambein",
    ),
  ),
  dag(
    sp(
      "Nevn en pizza",
      "margherita, pepperoni, Hawaii, kebabpizza | capricciosa, quattro stagioni, quattro formaggi/fire oster, calzone, vesuvio, napoletana/napolitana, marinara, diavola, vegetarpizza | pizza bianca, siciliana, funghi, prosciutto e funghi, tonno, frutti di mare, Grandiosa, Big One, deep dish/Chicago deep dish, New York-pizza, pan pizza, tacopizza, BBQ-kylling, bolognese, pizza al taglio, flammekueche, lahmacun, pinsa, Detroit-pizza | pizza fritta, pizza romana, stromboli, sfincione, pissaladière, khachapuri, St. Louis-pizza, New Haven-pizza/apizza, pizza ortolana, pizza salsiccia, pizza nduja, pizza carbonara | ",
    ),
    sp("Nevn et land som begynner på E", "#EG, #EE | #EC, #ET | #SV, #ER | #GQ, #SZ, #CI | @start:E, #GB/England"),
    sp(
      "Nevn en vulkan",
      "Etna, Vesuv, Hekla, Eyjafjallajökull | Fuji, Krakatau/Krakatoa, Kilauea, Mauna Loa, Mount St. Helens, Stromboli, Pinatubo, Erebus/Mount Erebus, Tambora, Popocatépetl, Teide | Mauna Kea, Cotopaxi, Kilimanjaro, Mount Rainier, Yellowstone, Santorini/Thera, Katla, Grímsvötn, Askja, Fagradalsfjall, Surtsey, Laki, Bárðarbunga, Beerenberg, Nyiragongo, Merapi, Sakurajima, Ararat, Elbrus, Chimborazo, Mont Pelée/Pelée, Soufrière Hills, Taal, Mayon, Agung, Bromo, Ruapehu, Taranaki, Tongariro, Ngauruhoe, Whakaari/White Island, Hunga Tonga | Ol Doinyo Lengai, Erta Ale, Piton de la Fournaise, Cumbre Vieja, Tajogaite, Mount Hood, Mount Shasta, Mount Baker, Lassen, Paricutín, Colima, Villarrica, Osorno, Llaima, Chaitén, Puyehue, Láscar, Ojos del Salado, Kljutsjevskaja Sopka/Klyuchevskaya, Sjiveluts/Shiveluch, Unzen, Aso, Asama, Ontake, Novarupta, Katmai, Redoubt, Pavlof, Augustine, Vulcano, Campi Flegrei, Nisyros, Snæfellsjökull, Öræfajökull, Hverfjall, Krafla, Eldfell | Kverkfjöll, Sundhnúkur, Bezymianny,",
      { nei: "Mount Everest, Matterhorn, Mont Blanc, Galdhøpiggen" },
    ),
    sp(
      "Nevn en a-ha-låt",
      "Take On Me, The Sun Always Shines on T.V./The Sun Always Shines on TV, Hunting High and Low | Crying in the Rain, The Living Daylights, Stay on These Roads, Summer Moved On, Cry Wolf, Manhattan Skyline, Analogue, Forever Not Yours | I've Been Losing You, Velvet, Foot of the Mountain, Lifelines, Train of Thought, Touchy!, Minor Earth Major Sky, Dark Is the Night for All, Move to Memphis, You Are the One, The Blood That Moves the Body, Scoundrel Days, Early Morning, Here I Stand and Face the Rain, Living a Boy's Adventure Tale, Shapes That Go Together | Love Is Reason, The Swing of Things, Celice, Butterfly Butterfly, Under the Makeup, Cast in Steel, Angel, There's Never a Forever Thing, Out of Blue Comes Green, Soft Rains of April, Sycamore Leaves, Dream Myself Alive, Maybe Maybe, Sox of the Fox, We're Looking for the Whales, Cold River, Did Anyone Approach You | Lamb to the Slaughter, Waiting for Her, Memorial Beach, Locust, Turn the Lights Down",
    ),
    sp(
      "Nevn et yrke på et sykehus",
      "lege, sykepleier, kirurg, jordmor | portør, renholder, anestesilege/anestesiolog, anestesisykepleier, fysioterapeut, radiograf, bioingeniør, helsefagarbeider, overlege, LIS/turnuslege, ambulansearbeider/paramedic | psykolog, ergoterapeut, klinisk ernæringsfysiolog/ernæringsfysiolog, farmasøyt, helsesekretær/sekretær, kokk, vaktmester, sykehusprest/prest, sosionom, barnepleier, operasjonssykepleier, intensivsykepleier, barnesykepleier, psykiater, radiolog, patolog, kardiolog, nevrolog, onkolog, gynekolog, barnelege/pediater, ortoped, urolog, hudlege/dermatolog, øyelege, øre-nese-hals-lege/ØNH-lege | logoped, audiograf, perfusjonist, rettsmedisiner, medisinsk fysiker, IT-tekniker, administrerende direktør, klinikksjef, avdelingsleder, laborant, smittevernsykepleier, nefrolog, endokrinolog, gastroenterolog, revmatolog, hematolog, geriater, akuttmedisiner, nukleærmedisiner, plastikkirurg, karkirurg, thoraxkirurg, nevrokirurg, ortopediingeniør | sykehusklovn, sterilforsyningstekniker, apotektekniker, kodekonsulent, pasientkoordinator, sykehusingeniør",
    ),
    sp(
      "Nevn en by i Frankrike",
      "Paris, Nice, Marseille, Lyon | Bordeaux, Toulouse, Cannes, Strasbourg, Lille, Nantes, Montpellier, Avignon, Calais | Grenoble, Rennes, Reims, Dijon, Le Havre, Rouen, Chamonix, Biarritz, Saint-Tropez, Antibes, Annecy, Versailles, Orléans, Tours, Limoges, Clermont-Ferrand, Saint-Étienne, Toulon, Perpignan, Nîmes, Arles, Aix-en-Provence, Carcassonne, Lourdes, Brest, Caen, Metz, Nancy, Amiens, Le Mans, Angers, Poitiers, La Rochelle, Cherbourg, Ajaccio, Bastia, Menton, Cassis, Colmar, Besançon, Mulhouse | Pau, Bayonne, Albi, Béziers, Narbonne, Sète, Valence, Chambéry, Évian, Vichy, Troyes, Chartres, Beauvais, Dunkerque, Boulogne-sur-Mer, Dieppe, Saint-Malo, Quimper, Lorient, Vannes, Saint-Nazaire, Cognac, Angoulême, Périgueux, Bergerac, Cahors, Agen, Montauban, Rodez, Millau, Le Puy-en-Velay, Auxerre, Mâcon, Épinal, Verdun, Sedan, Laon, Soissons, Compiègne, Fontainebleau, Grasse, Fréjus, Saint-Raphaël, Hyères, Èze, Calvi, Bonifacio, Porto-Vecchio, Sarlat, Rocamadour | Mont-Saint-Michel, Honfleur, Deauville, Étretat, Arcachon, Collioure, Gordes, Roussillon, Moustiers-Sainte-Marie, Riquewihr",
      { nei: "Monaco, Brussel, Genève, Luxembourg, Normandie, Provence, Bretagne" },
    ),
  ),
  dag(
    sp(
      "Nevn en tradisjonell norsk middagsrett",
      "fårikål, kjøttkaker, raspeballer/komle/kumle/klubb/kompe, lapskaus | pinnekjøtt, ribbe, fiskeboller, fiskekaker, plukkfisk, kokt torsk, lutefisk, sodd, finnbiff, reinsdyrstek, elgstek, viltgryte, karbonader, medisterkaker, betasuppe, ertesuppe, kålruletter | rakfisk, smalahove, persetorsk, klippfisk, bacalao, mølje, lammestek, seibiff/sei med løk, stekt sild, saltkjøtt/saltkjøtt og erter, skipperlapskaus, brun lapskaus, flesk og duppe, fleskepannekake, rømmegrøt, kalvestek, kjøttsuppe, fiskesuppe, fiskegrateng, pølser og potetmos, kålstuing, kjøttkaker i brun saus | sodd med flatbrød, kumla, fiskepudding, svinestek, lammelår, torsketunger, sursild, kokt sild, kalvedans, sviskegrøt, krumkaker, pannekaker, pultost, raspeballer med kålrotstappe | gamalost, rakørret, spekemat, fenalår, kalvetunge, svineknoke,",
    ),
    sp("Nevn et land som grenser til Egypt", "#LY, #SD, #IL | #PS | | | @naboer:EG"),
    sp(
      "Nevn et hav eller havområde",
      "Atlanterhavet, Stillehavet, Middelhavet, Nordsjøen, Det indiske hav/Indiahavet | Barentshavet, Norskehavet, Østersjøen, Karibhavet, Polhavet/Nordishavet, Svartehavet, Rødehavet, Sørishavet | Kaspihavet, Dødehavet, Skagerrak, Kattegat, Grønlandshavet, Beringhavet, Japanhavet, Sør-Kinahavet, Øst-Kinahavet, Gulehavet, Arabiahavet, Adriaterhavet, Egeerhavet, Tyrrenhavet, Irskesjøen/Det irske hav, Den engelske kanal, Biscayabukta, Mexicogolfen, Persiabukta, Bengalbukta, Kvitsjøen/Hvitehavet, Karahavet | Laptevhavet, Øst-Sibirhavet, Tsjuktsjerhavet, Beauforthavet, Labradorhavet, Sargassohavet, Ligurhavet, Det joniske hav, Marmarahavet, Azovhavet, Korallhavet, Tasmanhavet, Filippinhavet, Javahavet, Andamanhavet, Celebeshavet, Okhotskhavet, Weddellhavet, Rosshavet, Amundsenhavet, Bellingshausenhavet, Scotiahavet, Timorhavet, Arafurahavet, Bismarckhavet, Salomonhavet, Det keltiske hav, Vadehavet, Bottenviken/Botnvika, Finskebukta, Rigabukta, Hebridhavet, Alboranhavet, Balearhavet, Kretahavet, Levanthavet | Sulu-havet, Bandahavet, Molukkhavet, Floreshavet,",
    ),
    sp(
      "Nevn en figur fra Super Mario-spillene",
      "Mario, Luigi, Prinsesse Peach/Peach, Bowser, Yoshi, Toad | Wario, Waluigi, Donkey Kong, Prinsesse Daisy/Daisy, Rosalina, Bowser Jr., Koopa Troopa/Koopa, Goomba, Boo, Shy Guy, Toadette, Kamek | Lakitu, Bullet Bill, Piranha Plant, Chain Chomp, Thwomp, Hammer Bro, Birdo, Diddy Kong, Dry Bones, Blooper, Cheep Cheep | Koopalings, Larry, Morton, Wendy, Iggy, Roy, Lemmy, Ludwig, Captain Toad, Toadsworth, Pauline, King Boo, Petey Piranha, Nabbit, Funky Kong, Cranky Kong, Baby Mario, Baby Luigi, Cappy, Bob-omb, Buzzy Beetle, Spiny, Wiggler, Pokey, Monty Mole, Magikoopa, Boomerang Bro, Luma, Lubba | Fawful, Geno, Mallow, Smithy, Count Bleck, Tatanga, Cackletta, Kammy Koopa, Poochy, Pianta, Bowletta, Dimentio",
    ),
    sp(
      "Nevn en leke",
      "Lego, dukke, bamse/kosebamse, ball | puslespill, lekebil, togbane, jojo/yo-yo, drage, Barbie, actionfigur, Rubiks kube, gyngehest, såpebobler, byggeklosser/klosser, Playmobil, Hot Wheels, Nerf, slim, plastelina/modellkitt | dukkehus, kosedyr, rangle, snurrebass, hoppetau, frisbee, bumerang, vannpistol, lekekjøkken, tamagotchi, Furby, Beyblade, samlekort/pokémonkort, klinkekuler, kaleidoskop, slinky, stylter, hulahoppring/hula hoop, Duplo, Meccano, magnetklosser, robotleke, fjernstyrt bil/radiostyrt bil, fidget spinner/spinner | Sylvanian Families, My Little Pony, Polly Pocket, Bratz, Transformers, G.I. Joe, Action Man, He-Man, Lekegevær, sparkesykkel, trehjulssykkel, dukkevogn,, pop it, Etch A Sketch, Lite-Brite, Spirograph, Magic 8-ball, Stretch Armstrong, Tickle Me Elmo, Cabbage Patch | Zhu Zhu Pets, Squishmallows, Labubu, Pogs, Tamiya, Jumping Jack",
    ),
    sp(
      "Nevn en by i Storbritannia",
      "London, Manchester, Liverpool, Edinburgh, Birmingham | Glasgow, Leeds, Bristol, Oxford, Cambridge, Newcastle, Belfast, Cardiff, Brighton, Aberdeen, Sheffield, Nottingham | York, Bath, Southampton, Portsmouth, Plymouth, Leicester, Coventry, Bradford, Hull, Dundee, Inverness, Stirling, Swansea, Canterbury, Dover, Windsor, Blackpool, Stoke-on-Trent, Middlesbrough, Sunderland, Wolverhampton, Derby, Reading, Norwich, Ipswich, Exeter, Bournemouth, Luton, Watford, Stratford-upon-Avon, Lerwick, Kirkwall | Durham, Lincoln, Chester, Lancaster, Carlisle, Preston, Bolton, Wigan, Blackburn, Burnley, Huddersfield, Wakefield, Doncaster, Rotherham, Barnsley, Scarborough, Whitby, Harrogate, Salisbury, Winchester, Gloucester, Cheltenham, Worcester, Hereford, Shrewsbury, Telford, Milton Keynes, Northampton, Peterborough, Colchester, Chelmsford, Southend, Maidstone, Hastings, Eastbourne, Torquay, Truro, Penzance, St Ives, Newport, Wrexham, Bangor, Aberystwyth | Derry/Londonderry, Lisburn, Armagh, Newry, Perth, St Andrews, Fort William, Oban, Paisley, Ayr, Dumfries, Falkirk, Kilmarnock, Motherwell, Stornoway, Tobermory, Elgin, Thurso, Wick",
      { nei: "Dublin, Cork, England, Skottland, Wales" },
    ),
  ),
  dag(
    sp(
      "Nevn en brus eller et brusmerke",
      "Coca-Cola/Cola/Coca Cola, Pepsi, Solo, Fanta, Sprite | Pepsi Max, Coca-Cola Zero/Cola Zero/Coke Zero, Urge, 7Up, Mozell, julebrus, Mountain Dew, Dr Pepper, Schweppes, Farris, sitronbrus, appelsinbrus, tonic, ginger ale | Battery, Red Bull, Monster, Bonaqua, Cult, Mirinda, Champis, Trocadero, Pommac, Sockerdricka, Faxe Kondi, Sinalco, Fanta Lemon, Solo Super, Sprite Zero, Tab, Fresca, Irn-Bru, Club-Mate, Fritz-Kola, Vimto, Lucozade, Ramune, Inca Kola, Guaraná/Guaraná Antarctica, Selters | Jolt, Afri Cola, Lift, Ting, Sunkist, Crush, Squirt, Canada Dry, A&W, Barq's, Big Red, Cheerwine, Moxie, Pepsi Twist, Vanilla Coke, Cherry Coke, Coca-Cola Light | Kristall, Nora, Villa",
    ),
    sp("Nevn et land som grenser til Serbia", "#HR, #HU | #BA, #ME, #XK | #RO, #BG | #MK | @naboer:RS"),
    sp(
      "Nevn en ørken",
      "Sahara, Gobi, Kalahari | Atacama, Namib, Den arabiske ørken/Rub al-Khali, Mojave, Sonora, Thar, Death Valley/Dødsdalen | Antarktis, Taklamakan/Takla Makan, Karakum, Kyzylkum, Negev, Sinai, Den syriske ørken, Den libyske ørken/Vestlige ørken, Danakil, Simpson | Store Victoria-ørkenen/Great Victoria, Store sandørken/Great Sandy, Tanami, Gibson, Chihuahua, Great Basin, Den patagonske ørken/Patagonia, Painted Desert, Dasht-e Kavir, Dasht-e Lut, Ténéré, Den nubiske ørken, Wadi Rum | Badain Jaran, Ordos, Tengger, Kumtag, Dzungaria, Thal, Cholistan, Registan, Mu Us, Strzelecki, Sturt Stony, Little Sandy, Owyhee, Black Rock, Colorado-ørkenen, Yuma-ørkenen,, Accona, Monte, Sechura, Guajira, Lençóis Maranhenses",
    ),
    sp(
      "Nevn en egyptisk gud eller gudinne",
      "Ra, Osiris, Isis, Anubis, Horus | Seth/Set, Thot/Thoth, Amon/Amun, Hathor, Bastet, Ptah, Sobek | Aton/Aten, Nut, Geb, Maat, Nefthys/Nephthys, Sekhmet, Khnum, Bes, Khonsu, Mut, Shu, Tefnut, Atum, Apep/Apophis, Ammit, Taweret | Hapi, Neith, Selket/Serket, Wadjet, Nekhbet, Montu, Min, Khepri, Heka, Sopdet, Anuket, Satet, Meretseger, Renenutet, Wepwawet, Imhotep, Serapis | Aker, Heqet, Mafdet, Seshat, Nun, Hu, Sia, Babi, Tatenen, Amaunet, Wosret, Pakhet, Mehit, Qetesh",
      { nei: "Zevs, Odin, Jupiter, Kleopatra, Tutankhamon, Ramses" },
    ),
    sp(
      "Nevn et flyselskap",
      "Norwegian, SAS, Widerøe, Lufthansa, KLM | British Airways, Ryanair, easyJet, Air France, Finnair, Icelandair, Emirates, Qatar Airways, Turkish Airlines, Wizz Air, Flyr, Braathens/Braathens SAFE | Delta, American Airlines, United/United Airlines, Southwest, Air Canada, Singapore Airlines, Cathay Pacific, Qantas, Etihad, Japan Airlines/JAL, ANA/All Nippon Airways, Thai Airways, Korean Air, LOT, Iberia, Vueling, TAP/TAP Air Portugal, Swiss, Austrian Airlines/Austrian, Brussels Airlines, Aer Lingus, ITA Airways, Alitalia, Aeroflot, Air India, Air China, China Airlines, Malaysia Airlines, Ethiopian Airlines/Ethiopian, Kenya Airways, South African Airways, EgyptAir, Royal Air Maroc, Avianca, LATAM, Aeroméxico, JetBlue, Virgin Atlantic, Air New Zealand, Pan Am | Norse Atlantic/Norse, Jet2, TUI, Condor, Eurowings, airBaltic, Play, Transavia, Aegean, Pegasus, SunExpress | China Eastern, China Southern, Garuda, Philippine Airlines, Alaska Airlines, Hawaiian Airlines, Virgin Australia, TWA, Sterling, DAT/Danish Air Transport, Volotea, Air Serbia, Croatia Airlines, Luxair, Smartwings, Blue1, Atlantic Airways, Air Greenland, Loganair, Flybe, Lufttransport, Spirit, Frontier, Allegiant, IndiGo, AirAsia, Scoot, Jetstar, Cebu Pacific, VietJet, Flydubai, Saudia, Gulf Air, Oman Air, El Al,",
    ),
    sp(
      "Nevn et kjent skip",
      "Titanic, Fram, Kon-Tiki, Osebergskipet/Oseberg, Gokstadskipet/Gokstad | Vasa/Vasaskipet, Mayflower, Santa Maria | Bismarck, Tirpitz, Blücher, Lusitania, Queen Mary 2/Queen Mary, Statsraad Lehmkuhl, Christian Radich, Sørlandet, Gjøa, Maud, Endurance, Bounty, Den sorte perle/Black Pearl, Den flyvende hollender/Flying Dutchman, Nautilus, Noahs ark/Arken | Cutty Sark, HMS Victory/Victory, Beagle, Golden Hind, Pinta, Niña, Mary Rose, Estonia, Scandinavian Star, Costa Concordia, Andrea Doria, Britannic, Olympic, Carpathia, Queen Elizabeth 2/QE2, Normandie, Wilhelm Gustloff, Yamato, USS Arizona, USS Missouri, Enterprise, Kursk, Exxon Valdez, Ever Given, Edmund Fitzgerald, Erebus, Terror, Belgica, Polarstern, Ra, Tigris, Argo, KNM Helge Ingstad/Helge Ingstad, Kongeskipet Norge/KS Norge, Tuneskipet/Tune | Californian, DS Norge, Hurtigruteskipet Richard With/Richard With, Kong Olav, Prinsesse Ragnhild, Dronning Maud, Rigmor, Gaia, Saga Oseberg, Draken Harald Hårfagre, Hjemkomst,",
    ),
  ),
]
