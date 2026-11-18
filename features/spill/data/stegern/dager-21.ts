import { dag, sp } from "./typer"

// Days 96–100.
export const dager21 = [
  dag(
    sp(
      "Nevn noe du kan ha på pølsa",
      "sennep, ketchup, sprøstekt løk/stekt løk, rå løk/løk | rekesalat, potetsalat, agurksalat, ost/revet ost, bacon, majones/majo/mayo, remulade, sylteagurk/agurk, relish, chilisaus/chili, hvitløksdressing/dressing | surkål/sauerkraut, jalapeños/jalapeño, rødløk, reker, coleslaw/kålsalat, karrisaus/currysaus/curryketchup, BBQ-saus/barbecuesaus/grillsaus, salsa, ostesaus/cheddarsaus, tomat, salat, potetmos/mos, rømmedressing, sweet chili/sweet chilisaus | sriracha, guacamole, pesto, persille, chili con carne, tzatziki, ananas, mais | smør, trøffelmajones",
    ),
    sp(
      "Nevn et land som slutter på «-stan»",
      "Afghanistan, Pakistan | Kasakhstan/Kazakhstan/Kasakstan, Usbekistan/Uzbekistan | Turkmenistan, Tadsjikistan/Tajikistan, Kirgisistan/Kyrgyzstan | | ",
      { nei: "Kurdistan, Tatarstan, Dagestan, Turkestan, Iran, Irak" },
    ),
    sp(
      "Nevn en and eller gås",
      "stokkand, ærfugl, grågås, kanadagås | krikkand, kvinand, toppand, hvitkinngås, tamand, tamgås, villand, villgås | bergand, havelle, sjøorre, svartand, laksand, siland, brunnakke, stjertand, skjeand, mandarinand, kortnebbgås, sædgås, ringgås, gravand, pekingand | snadderand, knekkand, taffeland, praktærfugl, stellerand, brudeand, moskusand, dverggås, snøgås, nilgås, rustand, lappfiskand | stripegås, rødhalsgås, hawaiigås/nene",
      { nei: "svane, knoppsvane, sangsvane, lom, skarv, måke" },
    ),
    sp(
      "Nevn noe fra Minecraft",
      "Steve, Creeper, Enderman, zombie, diamant | Alex, skjelett/skeleton, landsbyboer/villager, Ender Dragon/Enderdragen, Wither, edderkopp/spider, Nether, TNT, redstone, obsidian, crafting table/arbeidsbenk, hakke/pickaxe | slime, ghast, blaze, piglin, jerngolem/iron golem, heks/witch, pillager, warden, ender pearl/enderperle, The End/End, Nether-portal/portal, sverd/diamantsverd, kiste/chest, fakkel/torch, seng, ovn/furnace, smaragd/emerald, netherite, bedrock, lava, sau, ku, gris, kylling, hest, ulv, katt, aksolotl/axolotl, panda, rev, bie | silverfish, shulker, guardian, elder guardian, phantom, drowned, husk, stray, magmakube/magma cube, hoglin, strider, evoker, vindicator, ravager, vex, endermite, vandrende handelsmann/wandering trader, allay, sniffer, breeze, armadillo, elytra, trident, netherrack, glowstone, ender chest, lapis lazuli/lapis, kull, gull, jern, ull, glass, grus, sand, cobblestone, planker | Herobrine, papegøye, isbjørn, frosk, skilpadde, delfin, blekksprut, kamel",
    ),
    sp(
      "Nevn et sted man kan overnatte",
      "hotell, hytte, telt, camping/campingplass | motell, vandrerhjem/hostel, Airbnb, pensjonat/gjestehus, bed and breakfast/B&B, ferieleilighet/leilighet, bobil, campingvogn, hos venner, hos besteforeldre, fjellstue, turisthytte/DNT-hytte, lavvo, gapahuk, sofa | hengekøye, båt/seilbåt, sovevogn/nattog, lugar/ferge, cruiseskip, snøhule, iglo, ishotell/snøhotell, trehytte/tretopphytte, rorbu, seter/støl, koie, internat, hybel/studenthjem, glamping, campinghytte, flyplasshotell, kapselhotell, ryokan, under åpen himmel | sykehus, fengsel, kloster, bivuakk | ",
    ),
    sp(
      "Nevn en musikkfestival",
      "Øyafestivalen/Øya, Roskilde/Roskilde-festivalen, Glastonbury, Coachella | Tomorrowland, Woodstock, Bergenfest, Tons of Rock, Palmesus, Piknik i Parken/PiP, Lollapalooza, Wacken/Wacken Open Air, Sziget, Pstereo, Slottsfjell, Kongsberg Jazzfestival, Moldejazz, Bukta, Trænafestivalen/Træna, Findings | Hovefestivalen/Hove, Quartfestivalen/Quart, Vinjerock, Utkant, Malakoff, Notodden Blues Festival/Notodden Blues, Førdefestivalen, Riddu Riđđu/Riddu Riddu, Rock in Rio, Primavera Sound/Primavera, Exit, Download, Reading, Leeds, Bonnaroo, Burning Man, Sweden Rock, Way Out West, Southside, Hurricane, Rock am Ring, Montreux Jazz Festival/Montreux Jazz, Ultra Music Festival/Ultra, Electric Daisy Carnival/EDC, Lowlands, Pinkpop, Pukkelpop, Rock Werchter, Hellfest | Norwegian Wood, by:Larm, Kalvøyafestivalen, Raumarock, Karmøygeddon, Inferno Metal Festival/Inferno, Beyond the Gates, Vossajazz, Olavsfestdagene, Festspillene i Bergen/Festspillene, Oslo Jazzfestival, Polarjazz, Nattjazz, Varangerfestivalen, Smukfest, Grøn Koncert, Tinderbox, NorthSide, Distortion, Flow Festival, Ruisrock, Peace & Love | ",
      { nei: "Eurovision, Melodi Grand Prix, Spellemann" },
    ),
  ),
  dag(
    sp(
      "Nevn et ord for «takk» på et annet språk",
      "thank you/thanks, danke/danke schön, merci/merci beaucoup, gracias, grazie | tack, tak, kiitos, obrigado/obrigada, arigato/arigatou, spasibo/spasiba, xièxie, dank je/dank u/bedankt | efharisto/efcharistó, shukran, teşekkürler/teşekkür ederim/sağ ol, dziękuję, kamsahamnida/gamsahamnida, asante/asante sana, toda/toda raba, takk fyrir, giitu | dhanyavaad, mahalo, köszönöm, děkuji, ďakujem, hvala, mulțumesc, aitäh, paldies, ačiū, terima kasih, salamat, khop khun/kop khun, cảm ơn, ngiyabonga, dankie, diolch, go raibh maith agat, gràcies, eskerrik asko, grazas, faleminderit, madloba, shukriya, rahmat, mamnun | gratias tibi, blagodarya, dyakuyu",
      { nei: "takk, tusen takk, takker" },
    ),
    sp("Nevn et land som grenser til Kamerun", "#NG | #TD, #CF, #GA | #CG, #GQ | | @naboer:CM", { nei: "Ghana, Benin, Niger, Sudan, Togo" }),
    sp(
      "Nevn en drøvtygger",
      "ku/kyr/storfe, sau, geit, elg, reinsdyr/rein | hjort, rådyr, giraff, okse, antilope, bison, gnu, moskus/moskusfe/moskusokse, bøffel/vannbøffel/kafferbøffel, jak | gaselle, impala, kudu, oryks/oryx, springbukk, okapi, steinbukk, gemse, mufflon, dåhjort, kronhjort, wapiti, kalv, kje, lam | dikdik, eland/elandantilope, sabelantilope, tjukkhornsau/bighorn, villsau, hjortevilt, sitatunga, nyala | kamel, lama, alpakka",
      { nei: "hest, gris, kanin, elefant, neshorn, flodhest" },
    ),
    sp(
      "Nevn en spansk fotballklubb",
      "Real Madrid, Barcelona/Barça/FC Barcelona, Atlético Madrid/Atlético | Sevilla, Valencia, Villarreal, Real Sociedad, Athletic Bilbao/Athletic Club/Bilbao, Real Betis/Betis, Celta Vigo/Celta | Espanyol, Getafe, Osasuna, Mallorca/Real Mallorca, Girona, Rayo Vallecano/Rayo, Alavés/Deportivo Alavés, Las Palmas, Deportivo La Coruña/Deportivo/Depor, Real Zaragoza/Zaragoza, Málaga, Granada, Cádiz, Levante, Almería, Real Valladolid/Valladolid, Elche, Leganés | Eibar, Sporting Gijón/Sporting, Racing Santander/Racing, Real Oviedo/Oviedo, Tenerife, Huesca, Córdoba, Hércules, Numancia, Recreativo Huelva/Recreativo, Real Murcia, Xerez, Albacete, Castellón, Burgos, Mirandés, Ponferradina, Lugo, Gimnàstic/Nàstic, Logroñés, Compostela, Salamanca | ",
      { nei: "Benfica, Porto, Sporting Lisboa, Juventus, Bayern München" },
    ),
    sp(
      "Nevn et sted i Finnmark",
      "Hammerfest, Alta, Kirkenes, Nordkapp, Vadsø, Vardø | Honningsvåg, Karasjok, Kautokeino, Tana/Deanu/Tana bru, Lakselv, Båtsfjord, Berlevåg, Mehamn, Sørøya, Magerøya, Porsanger, Sør-Varanger, Finnmarksvidda | Kjøllefjord, Havøysund, Hasvik, Loppa, Lebesby, Gamvik, Måsøy, Nesseby, Øksfjord, Bjørnevatn, Kvalsund, Skaidi, Neiden, Pasvik/Pasvikdalen, Grense Jakobselv, Ifjord, Vestertana, Seiland, Talvik, Varangerhalvøya, Varangerfjorden, Porsangerfjorden, Altafjorden, Knivskjellodden, Stabbursdalen, Masi, Hamningberg | Ekkerøy, Kiberg, Bugøynes, Svanvik, Kongsfjord, Gjesvær, Skarsvåg, Kamøyvær, Varangerbotn, Laksefjorden, Sennalandet, Rolvsøy, Repvåg | ",
      { nei: "Tromsø, Narvik, Harstad, Bodø, Lyngen, Skibotn, Senja, Kvænangen" },
    ),
    sp(
      "Nevn et dyr i den kinesiske dyrekretsen",
      "drage, tiger, rotte, hest, slange | okse/ku/bøffel, kanin/hare, geit/sau/bukk, ape, hane/høne, hund, gris/svin/villsvin | | | ",
      { nei: "katt, løve, elefant, panda, bjørn, ulv" },
    ),
  ),
  dag(
    sp(
      "Nevn en type spisested",
      "restaurant, kafé/café, gatekjøkken, pizzeria, kantine | bistro, pub, bar, kebabsjappe/kebabsted, sushirestaurant, burgerrestaurant/hamburgerrestaurant/burgersjappe, food truck/matbil, kiosk, bakeri, konditori, buffet, veikro/kro, kafeteria, mathall, drive-in/drive-through/drive-thru | brasserie, trattoria, osteria, taverna, tapasbar, vinbar, ølhall/ølstue, pølsebod/pølsevogn, tehus, nudelbar, diner, steakhouse, fiskerestaurant/sjømatrestaurant, spisesal, messe, gastropub, lunsjbar/lunsjkafé, salatbar, juicebar, kaffebar, isbar, Kaffistova, restaurantvogn, food court, bensinstasjon, street food | bodega, izakaya, dim sum-restaurant, pop-up-restaurant, fjellstue, serveringssted | ",
    ),
    sp("Nevn et land som grenser til Tsjad", "#LY, #SD | #NG, #CM, #NE | #CF | | @naboer:TD", { nei: "Mali, Egypt, Algerie, Sør-Sudan, Etiopia" }),
    sp(
      "Nevn en kroppsdel som dyr kan ha, men ikke mennesker",
      "hale, horn, vinger, fjær, snabel | gevir, hov/hover, nebb, finne, gjeller, manke, skjell, pigger, skall, poter/pote, snute | klør/klo, støttenner/støttann, tentakler/tentakkel, følehorn/antenner, pung, pukkel, morrhår/værhår, brodd | sugekopper, hanekam/kam, svømmehud, luffer, fasettøyne, ryggfinne, halefinne | kloakk, kråse, spinnvorter, blekkpose, strupesekk, eggtann, lysorgan",
      { nei: "hår, negler, tenner, øyne, ører, nese, tunge" },
    ),
    sp(
      "Nevn en film som foregår i verdensrommet",
      "Star Wars, Interstellar, Gravity, Apollo 13, Alien | The Martian, 2001: En romodyssé/2001: A Space Odyssey/2001, Guardians of the Galaxy, Star Trek, Avatar, WALL-E, Armageddon, Passengers, Ad Astra, First Man, Lightyear, Aliens, Prometheus, Rogue One | Moon, Sunshine, Event Horizon, Treasure Planet/Skatteplaneten, Elysium, Contact, Solaris, Dune, Spaceballs, Galaxy Quest, Lost in Space, Mission to Mars, Red Planet, Pitch Black, Serenity, Starship Troopers, Det femte element/The Fifth Element, Valerian, Jupiter Ascending, Life, Space Cowboys, Elio | Apollo 18, Barbarella, Flash Gordon, Silent Running, Dark Star, Pandorum, High Life, Aniara, Solo | ",
      { nei: "E.T., Men in Black, Independence Day" },
    ),
    sp(
      "Nevn noe du forbinder med fastelavn eller karneval",
      "fastelavnsbolle/bolle/boller/semla, fastelavnsris/ris, kostyme/utkledning, maske, krem/pisket krem | samba, Rio/Rio de Janeiro/karnevalet i Rio, Venezia/karnevalet i Venezia, opptog/parade/karnevalstog, fjær, konfetti, dans, ansiktsmaling/sminke, faste, askeonsdag, fetetirsdag/Mardi Gras, flormelis/melis, vaniljekrem | Notting Hill Carnival/Notting Hill, Köln/karnevalet i Köln, New Orleans, sambaskole, Brasil, klovn, prinsesse, pirat, superhelt, slå katten av tønnen/katten av tønnen, tønne, sambadronning, Fasching/Fastnacht, Trinidad | påske, syltetøy, Basel, Tenerife, gjøgler, ballonger, serpentin | ",
    ),
    sp(
      "Nevn en by i Tyrkia",
      "Istanbul/Konstantinopel, Ankara, Antalya, Izmir | Bodrum, Alanya, Marmaris, Side, Fethiye, Kuşadası/Kusadasi, Bursa, Trabzon | Adana, Konya, Gaziantep, Kayseri, Mersin, Samsun, Diyarbakır, Erzurum, Van, Şanlıurfa/Urfa, Edirne, Çanakkale, Eskişehir, Didim, Kemer, Belek, Dalaman, Göreme, Pamukkale, Kaş, Kalkan, Çeşme, Denizli | Malatya, Sivas, Batman, Mardin, Antakya/Hatay, İskenderun, Kahramanmaraş, Elazığ, Manisa, Aydın, Muğla, Balıkesir, Tekirdağ, İzmit, Adapazarı, Zonguldak, Rize, Ordu, Giresun, Kars, Ağrı, Bitlis, Sinop, Amasya, Tokat, Çorum, Nevşehir, Ürgüp, Avanos, Ölüdeniz | ",
      { nei: "Athen, Teheran, Bagdad, Damaskus, Kypros, Nikosia, Kappadokia" },
    ),
  ),
  dag(
    sp(
      "Nevn en polsk rett",
      "pierogi/pirogi, kiełbasa/kielbasa/polsk pølse, bigos, żurek | gołąbki/golabki/kålruletter, barszcz/borsjtsj/borscht, placki ziemniaczane/placki, pączki, kotlet schabowy/schabowy | rosół/rosol, zapiekanka, oscypek, flaki, sernik, makowiec, kaszanka, krokiety, kluski śląskie/kluski, kopytka, łazanki, pyzy, faworki/chrust, mizeria, smalec, golonka, kapuśniak, kotlet mielony, chłodnik, naleśniki, racuchy, szarlotka, pierniki | fasolka po bretońsku, kisiel, budyń, kompot, obwarzanek, kremówka, krupnik, zupa ogórkowa, zupa grzybowa, gzik, pasztet, śledź, karp | czernina, prażucha, proziaki",
      { nei: "pelmeni, gulasj, vodka, solyanka" },
    ),
    sp(
      "Nevn et land der engelsk er offisielt språk",
      "#GB, #US, #AU, #IE, #CA | #NZ, #IN, #ZA, #MT, #JM, #SG | #NG, #KE, #GH, #PH, #PK, #UG, #TZ, #ZM, #ZW, #BS, #BB, #TT, #FJ | #BW, #NA, #MW, #LS, #SZ, #SL, #LR, #GM, #CM, #RW, #SS, #SC, #MU, #GY, #BZ, #PG, #SB, #VU | #KI, #TV, #NR, #WS, #TO, #MH, #FM, #PW, #AG, #DM, #GD, #KN, #LC, #VC",
      { nei: "Norge, Sverige, Danmark, Island, Tyskland, Kypros, Frankrike" },
    ),
    sp(
      "Nevn et rovdyr",
      "løve, tiger, ulv, bjørn, rev | gaupe, jerv, isbjørn, leopard, gepard, jaguar, puma, hyene, krokodille, hai, ørn, spekkhogger, brunbjørn | katt, sel, oter, mår, røyskatt, snømus, mink, grevling, sjakal, prærieulv/coyote, dingo, villhund/afrikansk villhund, grizzly/grizzlybjørn, tasmansk djevel/pungdjevel, komodovaran, hauk, falk, ugle, kongeørn, havørn, snøleopard, fjellrev, piraja, vaskebjørn | ozelot, karakal, serval, honninggrevling, skunk, ilder, mårhund, mangust, gjedde, barrakuda, tyrannosaurus/T. rex, velociraptor, slange, kobra | edderkopp, øyenstikker, manet",
    ),
    sp(
      "Nevn en skrekkfilm",
      "Scream, Halloween, It/Det, The Exorcist/Eksorsisten, The Shining | A Nightmare on Elm Street/Marerittet på Elm Street, Fredag den 13./Friday the 13th, Saw, The Ring/Ringu, Psycho, The Conjuring, Annabelle, Paranormal Activity, Get Out, The Texas Chain Saw Massacre/Motorsagmassakren, Jaws/Haisommer, Insidious, Sinister, Hereditary, Midsommar, A Quiet Place, Smile, Terrifier, M3GAN, Five Nights at Freddy's, Fritt vilt, Død snø, Trolljegeren | The Babadook, Us, The Blair Witch Project/Blair Witch, Rosemarys baby, The Omen/Omen, Carrie, Poltergeist, Dracula, Frankenstein, Nosferatu, Night of the Living Dead, Dawn of the Dead, 28 dager senere/28 Days Later, Evil Dead/The Evil Dead, Hellraiser, Child's Play/Chucky, Candyman, The Thing, The Fly, The Others, The Sixth Sense, Final Destination, The Descent, Hostel, The Grudge/Ju-on, The Witch, It Follows, Train to Busan, REC, La den rette komme inn/Let the Right One In, The Cabin in the Woods, Cujo, Dyrekirkegården/Pet Sematary, Misery, Alien | Villmark, De uskyldige/The Innocents, Rovdyr, Jeepers Creepers, The Purge, Don't Breathe, Barbarian, Talk to Me, Longlegs, The Substance, Sinners, Weapons, Speak No Evil, Suspiria, Audition | ",
    ),
    sp(
      "Nevn noe man kan oppbevare ting i",
      "eske/esker, boks/bokser, skap, skuff, kasse | pose/poser, sekk, koffert, kiste, krukke, flaske, kurv, bøtte, glass/syltetøyglass, matboks, plastboks/tupperware, beholder, lomme, veske | container, lagerrom/lager, bod/kjellerbod, kjeller, loft, garasje, safe/pengeskap, skrin/smykkeskrin, lommebok/pung, tønne, tank, silo, låve, fryser, kjøleskap, kommode, garderobe, klesskap, kopp, vase, ringperm/perm/mappe, konvolutt, pennal, etui, termos, kanne, dunk, verktøykasse, brødboks, kakeboks, skål, sparegris/sparebøsse, medisinskap | skyen, minnepinne/USB-pinne, harddisk | ",
    ),
    sp(
      "Nevn et språk som snakkes i Asia",
      "kinesisk/mandarin, japansk, koreansk, hindi, arabisk | thai/thailandsk, vietnamesisk, indonesisk/bahasa indonesia, urdu, persisk/farsi, tyrkisk, russisk, bengali/bangla, kantonesisk, tagalog/filipino, malayisk/malay/bahasa malaysia, hebraisk, engelsk | punjabi, tamil, telugu, marathi, gujarati, kannada, malayalam, nepali, singalesisk/sinhala, burmesisk, khmer, laotisk/lao, mongolsk, tibetansk, uigurisk, kasakhisk, usbekisk, tadsjikisk, kirgisisk, turkmensk, aserbajdsjansk, georgisk, armensk, kurdisk, pashto, dari | javanesisk, sundanesisk, hmong, wu/shanghainesisk, hokkien, hakka, tetum, dzongkha, dhivehi, odia, assamesisk, sindhi, balutsji, aramaisk, ainu, portugisisk | sanskrit",
      { nei: "swahili, spansk, polsk, latin" },
    ),
  ),
  dag(
    sp(
      "Nevn noe du kan finne i postkassen",
      "brev, regning, reklame, avis/aviser, pakke | postkort/kort, julekort, ukeblad/blad/magasin, katalog, hentelapp/hentemelding, invitasjon, bursdagskort, takkekort, konvolutt/konvolutter, gratisavis, lokalavis, giro | kontoutskrift, valgkort, innkalling, bankkort, flygeblad/løpeseddel/flyer, lapp/beskjed, nøkler/nøkkel, frimerker, vareprøver/prøver, menighetsblad, sjekk, kjærlighetsbrev, skattemelding | edderkopp, snegl, vepsebol, fugleredet/fuglereir | ",
    ),
    sp("Nevn et land som grenser til Niger", "#NG, #LY, #ML | #DZ, #TD, #BF | #BJ | | @naboer:NE", { nei: "Ghana, Sudan, Kamerun, Senegal, Togo" }),
    sp(
      "Nevn en tidsperiode i historien",
      "steinalder, bronsealder, jernalder, vikingtid, middelalder | renessansen/renessanse, antikken/oldtiden, opplysningstiden, istid, den industrielle revolusjon/industrialiseringen, barokken, romantikken, reformasjonen, mellomkrigstiden, den kalde krigen/kalde krigen, andre verdenskrig/2. verdenskrig, første verdenskrig/1. verdenskrig | dansketiden/firehundreårsnatten, svensketiden/unionstiden, okkupasjonen/okkupasjonstiden, yngre steinalder/neolitikum, eldre steinalder/paleolitikum, mesolitikum, merovingertiden, folkevandringstiden, romertiden, belle époque, viktoriatiden, kolonitiden, korstogstiden/korstogene, høymiddelalderen, senmiddelalderen, senantikken, tidligmoderne tid, rokokko, informasjonsalderen, romalderen, atomalderen, Edo-perioden, den store depresjonen | ancien régime, svartedauden, gullalderen, juratiden/jura, krittiden/kritt, trias | ",
    ),
    sp(
      "Nevn et britisk band",
      "The Beatles/Beatles, Queen, The Rolling Stones/Rolling Stones, Coldplay, Oasis | Pink Floyd, Led Zeppelin, Spice Girls, One Direction, Iron Maiden, The Who, Black Sabbath, Radiohead, Arctic Monkeys, Muse, Duran Duran, Depeche Mode, The Police, Dire Straits, Genesis, Deep Purple, Take That, Blur, Def Leppard, The Clash, Sex Pistols, Little Mix, UB40, Pet Shop Boys, Simply Red | The Kinks, Status Quo, Motörhead, Judas Priest, Yes, Jethro Tull, Eurythmics, Wham!, Tears for Fears, Spandau Ballet, Culture Club, The Cure, The Smiths, Joy Division, New Order, Massive Attack, Portishead, Placebo, Keane, Snow Patrol, Travis, Franz Ferdinand, Kasabian, Bastille, The 1975, Mumford & Sons, Florence + the Machine, Gorillaz, Jamiroquai, Bloc Party, Kaiser Chiefs, Stereophonics, Manic Street Preachers, Pulp, Suede, The Verve, The Stone Roses, Madness, The Specials, Erasure, Soft Cell, The Human League, Electric Light Orchestra/ELO, The Hollies, The Animals, The Yardbirds, Cream, The Shadows, Bay City Rollers, Slade, T. Rex, Roxy Music, Whitesnake, The Prodigy, The Chemical Brothers, Sugababes, Girls Aloud, All Saints, Steps, S Club 7, McFly, Busted, Bee Gees | Supergrass, Feeder, Happy Mondays, Bronski Beat, Ultravox, Sweet, Uriah Heep, Bring Me the Horizon, Biffy Clyro, Elbow, Faithless, Hurts, Years & Years, Rudimental, Clean Bandit, Royal Blood, Wet Leg, Idles, The Libertines, Primal Scream, Simple Minds, Texas, Deacon Blue, The Proclaimers, Belle and Sebastian | ",
      { nei: "U2, ABBA, a-ha, Westlife, The Cranberries, Boyzone, AC/DC, Nirvana, Metallica" },
    ),
    sp(
      "Nevn en type butikk",
      "klesbutikk, matbutikk/dagligvarebutikk, skobutikk, sportsbutikk, apotek | bokhandel, elektronikkbutikk/elektrobutikk, møbelbutikk, lekebutikk/leketøysbutikk, kiosk, bakeri, blomsterbutikk/blomsterhandel, gullsmed, smykkebutikk, interiørbutikk, jernvarehandel/jernvarebutikk, byggevarehus, optiker, vinmonopol/polet, dyrebutikk, godtebutikk, bruktbutikk/gjenbruksbutikk/secondhandbutikk | slakter, fiskebutikk, ostebutikk, sjokoladebutikk, antikvariat, antikvitetsbutikk, parfymeri, kosmetikkbutikk, varehus, nettbutikk, taxfree, hobbybutikk, garnbutikk, stoffbutikk, musikkbutikk/platebutikk, spillbutikk, mobilbutikk, sykkelbutikk, bilforhandler, helsekostbutikk/helsekost, suvenirbutikk/souvenirbutikk, lavprisbutikk, outlet, hagesenter, fargehandel/malingsbutikk, brudebutikk, babybutikk, delikatessebutikk, konditori | frisør, kjøpesenter, bensinstasjon, tobakksbutikk, postkontor | ",
    ),
    sp(
      "Nevn et alfabet eller skriftsystem",
      "det latinske alfabetet/latinsk/latinske alfabetet, kyrillisk/det kyrilliske alfabetet, det greske alfabetet/gresk, arabisk, runer/runealfabetet/futhark | hieroglyfer/egyptiske hieroglyfer, kinesiske tegn/kinesisk skrift/hanzi, hebraisk, hangul/koreansk, hiragana, katakana, kanji, punktskrift/blindeskrift/braille, morsekode/morse, kileskrift, devanagari | thai/thailandsk skrift, armensk, georgisk, bengalsk, tamilsk, gurmukhi, etiopisk/ge'ez, tibetansk, mongolsk, khmer, burmesisk, laotisk, singalesisk, mayaskrift, ogham, glagolittisk, gotisk, fønikisk, aramaisk, syrisk, koptisk, tifinagh, cherokee, linear B, linear A | stenografi, pinyin, semafor, binærkode/binær | ",
    ),
  ),
]
