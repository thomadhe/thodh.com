import { sp } from "../stegern/typer"

// Geography: cities, rivers, lakes, islands, mountains and countries.
export const geografi = [
  sp(
    "Nevn en by i Finland",
    "Helsingfors/Helsinki, Åbo/Turku, Tammerfors/Tampere, Rovaniemi | Oulu/Uleåborg, Espoo/Esbo, Vantaa/Vanda, Lahti/Lahtis, Kuopio, Jyväskylä, Vasa/Vaasa | Pori/Björneborg, Joensuu, Lappeenranta/Villmanstrand, Hämeenlinna/Tavastehus, Kotka, Porvoo/Borgå, Mariehamn/Maarianhamina, Savonlinna/Nyslott, Kemi, Tornio/Torneå, Hanko/Hangö, Seinäjoki, Kajaani/Kajana, Mikkeli/S:t Michel, Kokkola/Karleby, Rauma/Raumo | Hyvinkää/Hyvinge, Lohja/Lojo, Järvenpää/Träskända, Kerava/Kervo, Nokia, Salo, Imatra, Raahe/Brahestad, Kouvola, Kangasala, Iisalmi/Idensalmi, Varkaus, Kauniainen/Grankulla, Jakobstad/Pietarsaari, Ekenäs/Tammisaari, Loviisa/Lovisa, Naantali/Nådendal, Uusikaupunki/Nystad | Kristinestad/Kristiinankaupunki, Kuusamo, Kemijärvi, Kuhmo, Lieksa, Nurmes, Outokumpu, Heinola, Forssa, Riihimäki, Valkeakoski, Ylöjärvi, Lapua/Lappo, Ylivieska, Raisio/Reso, Kaarina/S:t Karins, Sastamala",
    { nei: "Stockholm, Tallinn, Haparanda, Inari, Levi" },
  ),
  sp(
    "Nevn en by i Polen",
    "Warszawa/Warsaw/Varsjava/Warszawa, Kraków/Krakow/Krakau, Gdańsk/Gdansk/Danzig | Wrocław/Wroclaw/Breslau, Poznań/Poznan, Łódź/Lodz, Szczecin/Stettin, Katowice, Sopot, Gdynia | Lublin, Białystok/Bialystok, Bydgoszcz, Toruń/Torun, Częstochowa/Czestochowa, Zakopane, Oświęcim/Oswiecim/Auschwitz, Rzeszów/Rzeszow, Kielce, Olsztyn, Opole, Radom | Malbork, Elbląg/Elblag, Gliwice, Zabrze, Bytom, Sosnowiec, Tarnów/Tarnow, Płock/Plock, Koszalin, Słupsk/Slupsk, Legnica, Kalisz, Gorzów Wielkopolski/Gorzow, Zielona Góra/Zielona Gora, Świnoujście/Swinoujscie, Kołobrzeg/Kolobrzeg, Wieliczka, Nowy Sącz/Nowy Sacz, Przemyśl/Przemysl, Chorzów/Chorzow, Tychy, Rybnik, Bielsko-Biała/Bielsko-Biala, Wałbrzych/Walbrzych | Jelenia Góra/Jelenia Gora, Zamość/Zamosc, Sandomierz, Kazimierz Dolny, Łeba/Leba, Władysławowo/Wladyslawowo, Ustka, Międzyzdroje/Miedzyzdroje, Karpacz, Gniezno, Włocławek/Wloclawek, Grudziądz/Grudziadz, Siedlce, Suwałki/Suwalki",
    { nei: "Praha, Vilnius, Berlin, Kaliningrad, Lviv" },
  ),
  sp(
    "Nevn en by i Nederland",
    "Amsterdam, Rotterdam, Haag/Den Haag/The Hague, Utrecht | Eindhoven, Groningen, Maastricht, Leiden, Delft, Haarlem, Arnhem, Nijmegen | Tilburg, Breda, Almere, Zwolle, Enschede, 's-Hertogenbosch/Den Bosch/Hertogenbosch, Dordrecht, Leeuwarden, Alkmaar, Gouda, Edam, Volendam, Zaandam, Apeldoorn, Amersfoort, Hilversum | Venlo, Deventer, Middelburg, Vlissingen, Den Helder, Assen, Emmen, Heerlen, Roermond, Hoorn, Lelystad, Zandvoort, Schiedam, Zoetermeer, Amstelveen, Hoofddorp, Purmerend, Kampen, Harderwijk, Ede, Wageningen, Helmond, Sittard, Oss, Scheveningen | Veenendaal, Bergen op Zoom, Roosendaal, Terneuzen, Enkhuizen, Monnickendam, Giethoorn, Lisse, Noordwijk, Katwijk, Valkenburg, Hengelo, Almelo, Meppel, Sneek, Harlingen, Franeker, Zutphen, Tiel, Vlaardingen, Gorinchem, Woerden, Zeist, Naarden, IJmuiden, Beverwijk",
    { nei: "Brussel, Antwerpen, Gent, Brugge, Holland, Köln" },
  ),
  sp(
    "Nevn en by i Kina",
    "Beijing/Peking, Shanghai, Hongkong/Hong Kong | Guangzhou/Kanton/Canton, Shenzhen, Chengdu, Chongqing, Wuhan, Xi'an/Xian, Tianjin, Macao/Macau/Makao, Nanjing/Nanking | Hangzhou, Harbin, Shenyang, Dalian, Qingdao, Suzhou, Kunming, Xiamen, Lhasa, Ürümqi/Urumqi, Changsha, Zhengzhou, Guilin | Jinan, Fuzhou, Hefei, Nanning, Lanzhou, Taiyuan, Shijiazhuang, Ningbo, Dongguan, Foshan, Sanya, Hohhot, Guiyang, Xining, Yinchuan, Haikou, Nanchang, Changchun, Wuxi | Luoyang, Kaifeng, Datong, Kashgar/Kashi, Yangshuo, Lijiang, Dunhuang, Pingyao, Zhuhai, Shantou, Wenzhou, Yantai, Tangshan, Baotou, Anshan, Qufu, Chengde, Leshan, Dali, Zhangjiajie",
    { nei: "Tokyo, Seoul, Hanoi, Bangkok, Pyongyang, Ulan Bator" },
  ),
  sp(
    "Nevn en by i Japan",
    "Tokyo, Osaka, Kyoto, Hiroshima | Nagasaki, Yokohama, Sapporo, Nagoya, Kobe, Fukuoka, Nara | Sendai, Kawasaki, Kitakyushu, Chiba, Saitama, Okayama, Kumamoto, Kagoshima, Naha, Hakodate, Kanazawa, Niigata, Nikko, Kamakura, Himeji, Nagano | Shizuoka, Hamamatsu, Matsuyama, Takamatsu, Kochi, Aomori, Akita, Morioka, Fukushima, Toyota, Gifu, Wakayama, Matsue, Tottori, Yamaguchi, Shimonoseki, Oita, Miyazaki, Beppu, Kurashiki, Sasebo, Otaru, Asahikawa, Yokosuka | Kushiro, Kofu, Utsunomiya, Mito, Maebashi, Takasaki, Otsu, Fukui, Toyama, Hakone, Takayama, Obihiro, Hachinohe, Iwaki, Koriyama, Hirosaki, Atami, Karuizawa, Uji, Ise",
    { nei: "Seoul, Beijing, Shanghai, Busan, Okinawa, Hokkaido, Fuji" },
  ),
  sp(
    "Nevn en by i Australia",
    "Sydney, Melbourne, Brisbane, Perth | Adelaide, Canberra, Darwin, Hobart, Gold Coast, Cairns | Newcastle, Wollongong, Geelong, Townsville, Alice Springs, Launceston, Sunshine Coast, Fremantle, Broome, Byron Bay | Ballarat, Bendigo, Toowoomba, Mackay, Rockhampton, Bunbury, Albury, Wagga Wagga, Orange, Dubbo, Tamworth, Mildura, Kalgoorlie, Coober Pedy, Port Macquarie, Bundaberg, Hervey Bay, Coffs Harbour | Devonport, Burnie, Mount Gambier, Port Augusta, Whyalla, Geraldton, Esperance, Katherine, Mount Isa, Bathurst, Shepparton, Wodonga, Lismore, Gladstone, Port Hedland, Karratha, Exmouth, Albany, Port Lincoln, Tennant Creek, Noosa, Airlie Beach, Port Douglas",
    { nei: "Auckland, Wellington, Christchurch, Tasmania, Uluru" },
  ),
  sp(
    "Nevn en by i Canada",
    "Toronto, Montreal/Montréal, Vancouver, Ottawa | Calgary, Edmonton, Q/Québec/Q City, Winnipeg, Halifax, Victoria | Hamilton, Regina, Saskatoon, St. John's/Saint John's, Whitehorse, Yellowknife, Iqaluit, Charlottetown, Fredericton, Niagara Falls, Banff, Whistler, Kelowna | Kingston, London, Windsor, Mississauga, Brampton, Laval, Gatineau, Kitchener, Waterloo, Sherbrooke, Trois-Rivières/Trois-Rivieres, Saint John, Moncton, Thunder Bay, Sudbury, Kamloops, Nanaimo, Red Deer, Lethbridge, Prince George, Surrey, Burnaby, Markham, Oshawa | Churchill, Dawson City, Jasper, Inuvik, Sault Ste. Marie, Barrie, Guelph, Brandon, Fort McMurray, Medicine Hat, Prince Rupert, Lunenburg, Corner Brook, Gander, Rimouski, Saguenay, Lévis/Levis, Longueuil, Peterborough, Belleville, Timmins, North Bay, Moose Jaw",
    { nei: "Seattle, Chicago, Detroit, Anchorage, Alberta, Ontario, Yukon" },
  ),
  sp(
    "Nevn en by i Sør-Amerika",
    "Rio de Janeiro/Rio, São Paulo/Sao Paulo, Buenos Aires, Lima | Santiago/Santiago de Chile, Bogotá/Bogota, Caracas, Quito, Montevideo, La Paz, Brasília/Brasilia, Medellín/Medellin | Asunción/Asuncion, Cali, Guayaquil, Salvador, Fortaleza, Belo Horizonte, Manaus, Recife, Porto Alegre, Curitiba, Córdoba/Cordoba, Rosario, Mendoza, Valparaíso/Valparaiso, Cusco/Cuzco, Cartagena, Ushuaia, Mar del Plata, Paramaribo, Georgetown | Belém/Belem, Viña del Mar/Vina del Mar, Arequipa, Trujillo, Barranquilla, Maracaibo, Valencia, Bariloche/San Carlos de Bariloche, Punta Arenas, Cayenne, Sucre, Santa Cruz/Santa Cruz de la Sierra, Cochabamba, Potosí/Potosi, Florianópolis/Florianopolis, Natal, Santos, Campinas, Iquitos, Punta del Este, Salta, Concepción/Concepcion, Santa Marta, Bucaramanga, Cuenca | Colonia del Sacramento/Colonia, Tucumán/San Miguel de Tucumán/Tucuman, Antofagasta, Iquique, La Plata, Ciudad del Este, Encarnación/Encarnacion, Puno, Ayacucho, Huaraz, Nazca, Oruro, Uyuni, Calama, Arica, Puerto Montt, Puerto Natales, El Calafate, Paraty, Ouro Preto, Foz do Iguaçu/Foz do Iguacu, João Pessoa/Joao Pessoa, Maceió/Maceio, Goiânia/Goiania, Vitória/Vitoria, Pereira, Cúcuta/Cucuta, Barquisimeto, Mérida/Merida",
    { nei: "Mexico by, Panama by, Havanna, Machu Picchu, Patagonia, Amazonas, San José" },
  ),
  sp(
    "Nevn en by i India",
    "Mumbai/Bombay, Delhi/New Delhi/Ny Delhi, Kolkata/Calcutta/Kalkutta | Chennai/Madras, Bangalore/Bengaluru, Hyderabad, Agra, Jaipur, Varanasi/Benares | Ahmedabad, Pune, Surat, Lucknow, Kanpur, Amritsar, Chandigarh, Udaipur, Jodhpur, Mysore/Mysuru, Kochi/Cochin, Darjeeling, Shimla, Rishikesh, Srinagar, Pondicherry/Puducherry, Panaji | Nagpur, Indore, Bhopal, Patna, Jaisalmer, Thiruvananthapuram/Trivandrum, Madurai, Coimbatore, Haridwar, Leh, Dharamsala/Dharamshala, Guwahati, Shillong, Bhubaneswar, Puri, Visakhapatnam, Mangalore/Mangaluru, Prayagraj/Allahabad, Manali, Pushkar | Vijayawada, Gwalior, Aurangabad, Nashik, Kota, Bikaner, Ajmer, Khajuraho, Bodh Gaya, Kanyakumari, Hampi, Gangtok, Imphal, Aizawl, Kohima, Agartala, Itanagar, Ranchi, Raipur, Dehradun, Jammu, Ludhiana, Vadodara/Baroda, Rajkot, Nainital, Ooty/Udhagamandalam, Munnar, Alappuzha/Alleppey, Kozhikode/Calicut",
    { nei: "Goa, Kerala, Rajasthan, Kashmir, Punjab, Karachi, Lahore, Dhaka, Katmandu, Islamabad" },
  ),
  sp(
    "Nevn en by i Hellas",
    "Aten/Athen/Athens, Thessaloniki/Saloniki, Heraklion/Iraklio | Patras, Chania/Hania, Rhodos, Korfu/Kerkyra, Pireus/Piraeus, Nafplio/Nauplia | Larissa, Volos, Ioannina, Kavala, Kalamata, Sparta, Olympia, Delfi/Delphi, Korint/Korinth/Korinthos, Argos, Rethymno/Rethymnon, Agios Nikolaos, Hersonissos, Lindos | Tripoli, Alexandroupoli, Komotini, Xanthi, Drama, Serres, Katerini, Veria/Veroia, Edessa, Florina, Kastoria, Kozani, Trikala, Karditsa, Lamia, Chalkida/Chalkis, Elefsina/Eleusis, Megara, Pyrgos, Preveza, Parga, Igoumenitsa, Arta, Messolonghi, Kalambaka/Kalabaka, Monemvasia, Gythio, Fira, Oia, Ermoupoli, Mytilini | Argostoli, Sitia, Ierapetra, Malia, Kissamos, Paleochora, Elounda, Methoni, Pylos, Kardamyli, Loutraki, Glyfada, Marousi, Kifisia, Vouliagmeni, Rafina, Lavrio",
    { nei: "Kreta, Halkidiki, Peloponnes, Santorini, Mykonos, Istanbul, Nikosia, Meteora" },
  ),
  sp(
    "Nevn en by i Tyrkia",
    "Istanbul, Ankara, Antalya, Izmir | Alanya, Bodrum, Marmaris, Side, Kemer, Fethiye, Bursa, Kuşadası/Kusadasi | Adana, Konya, Gaziantep, Trabzon, Samsun, Kayseri, Eskişehir/Eskisehir, Diyarbakır/Diyarbakir, Mersin, Edirne, Çanakkale/Canakkale, Göreme/Goreme, Dalaman, Çeşme/Cesme, Belek, Didim, Ölüdeniz/Oludeniz, Kaş/Kas | Şanlıurfa/Sanliurfa/Urfa, Van, Erzurum, Denizli, Muğla/Mugla, Aydın/Aydin, Manisa, Malatya, Elazığ/Elazig, Batman, Mardin, Antakya/Hatay, İskenderun/Iskenderun, Kahramanmaraş/Kahramanmaras, Sivas, Tokat, Amasya, Rize, Kars, Kalkan, Ürgüp/Urgup, Selçuk/Selcuk, Pamukkale | İzmit/Izmit, Adapazarı/Adapazari, Zonguldak, Sinop, Kastamonu, Bolu, Afyonkarahisar/Afyon, Kütahya/Kutahya, Isparta, Burdur, Niğde/Nigde, Nevşehir/Nevsehir, Aksaray, Karaman, Adıyaman/Adiyaman, Siirt, Bitlis, Hakkâri/Hakkari, Erzincan, Giresun, Ordu, Artvin, Bandırma/Bandirma, Balıkesir/Balikesir, Tekirdağ/Tekirdag, Edremit, Avanos",
    { nei: "Efesos, Troja, Kappadokia, Nikosia, Baku, Tbilisi" },
  ),
  sp(
    "Nevn en by i Portugal",
    "Lisboa/Lisbon/Lissabon, Porto/Oporto, Faro | Albufeira, Lagos, Coimbra, Braga, Funchal, Sintra, Cascais, Estoril | Évora/Evora, Aveiro, Guimarães/Guimaraes, Setúbal/Setubal, Portimão/Portimao, Tavira, Vilamoura, Óbidos/Obidos, Nazaré/Nazare, Fátima/Fatima, Ponta Delgada, Sagres, Vila Nova de Gaia/Gaia | Leiria, Viseu, Viana do Castelo, Bragança/Braganca, Amadora, Almada, Matosinhos, Olhão/Olhao, Loulé/Loule, Silves, Peniche, Ericeira, Tomar, Santarém/Santarem, Castelo Branco, Guarda, Covilhã/Covilha, Beja, Elvas, Chaves, Vila Real, Lamego, Figueira da Foz, Angra do Heroísmo/Angra | Quarteira, Armação de Pêra/Armacao de Pera, Carvoeiro, Monchique, Vila Real de Santo António, Alvor, Sesimbra, Póvoa de Varzim/Povoa de Varzim, Vila do Conde, Espinho, Ovar, Barcelos, Ponte de Lima, Amarante, Peso da Régua/Régua, Mafra, Torres Vedras, Caldas da Rainha, Alcobaça/Alcobaca, Batalha, Marvão/Marvao, Portalegre, Abrantes, Machico, Câmara de Lobos, Horta",
    { nei: "Madeira, Algarve, Azorene, Sevilla, Madrid, Vigo, Rio de Janeiro" },
  ),
  sp(
    "Nevn en norsk elv",
    "Glomma, Numedalslågen, Akerselva, Tana/Tanaelva/Deatnu | Gudbrandsdalslågen/Lågen, Drammenselva, Altaelva, Namsen, Gaula, Orkla, Otra, Nidelva, Begna, Driva, Rauma, Alna | Stjørdalselva, Lysakerelva, Mandalselva, Skienselva, Vorma, Trysilelva/Klarälven, Femundselva, Surna, Lærdalselva, Aurlandselva, Vosso, Suldalslågen, Målselva, Reisaelva, Pasvikelva, Karasjohka, Kautokeinoelva, Lakselva, Vefsna, Otta, Sjoa, Rena | Bjerkreimselva, Figgjo, Ogna, Sira, Kvina, Tovdalselva, Barduelva, Neidenelva/Neiden, Beiarelva, Saltdalselva, Ranelva, Røssåga, Skjoma, Lyngdalselva, Simoa, Lierelva, Sandvikselva, Hunnselva, Lena, Atna, Folla, Bøvra, Vinstra, Nea, Etna, Dokka, Hallingdalselva, Snarumselva, Gausa | Gudåa, Verdalselva, Ogndalselva, Eira, Jølstra, Nausta, Gloppenelva, Stryneelva, Opo, Etneelva, Hå/Håelva, Loselva, Ljanselva, Hoffselva, Frognerelva, Tista, Enningdalselva, Leira, Nitelva, Rømua",
    { nei: "Mjøsa, Femunden, Tyrifjorden, Randsfjorden, Donau, Rhinen, Themsen" },
  ),
  sp(
    "Nevn en foss, i Norge eller i verden",
    "Niagarafallene/Niagara/Niagara Falls, Victoriafallene/Victoria Falls, Vøringsfossen, Angelfallene/Angel Falls/Salto Ángel | Iguazúfallene/Iguazu/Iguazú/Iguaçu, Gullfoss, Låtefossen, De syv søstre/Syv søstre/De sju søstrene/Dei sju systrene, Steinsdalsfossen, Kjosfossen, Mardalsfossen, Rjukanfossen, Tvindefossen | Dettifoss, Skógafoss/Skogafoss, Seljalandsfoss, Goðafoss/Godafoss, Rhinfallene/Rheinfallene/Rheinfall, Yosemite Falls, Sarpsfossen, Hønefossen, Vettisfossen, Langfossen/Langfoss, Kjelfossen, Skjervefossen, Brudesløret, Friaren, Tyssestrengene, Stalheimsfossen, Feigumfossen, Ringedalsfossen, Månafossen, Hengjanefossen | Kaieteurfallene/Kaieteur, Tugelafallene/Tugela, Sutherland Falls, Gocta, Krimmlfallene/Krimml, Reichenbachfallene/Reichenbach, Sta뮬hfallene/Sta뮬h, Trümmelbachfallene/Trümmelbach, Jog Falls, Dudhsagar, Ban Gioc, Kuang Si, Erawan, Huangguoshu, Detian, Tis Abay/Blue Nile Falls, Murchison Falls, Augrabies, Epupa, Havasu Falls, Multnomah Falls, Horseshoe Falls, Bridalveil Fall, Shoshone Falls, Montmorency, Svartifoss, Háifoss/Haifoss, Hraunfossar, Glymur, Dynjandi, Aldeyjarfoss, Gljúfrabúi/Gljufrabui, Kirkjufellsfoss | Espelandsfossen, Svandalsfossen, Skykkjedalsfossen, Valursfossen, Stigfossen, Mongefossen, Likholefossen, Vinnufossen, Formofossen, Fiskumfossen, Storseterfossen, Furebergsfossen, Sivlefossen, Tännforsen/Tännfallet, Ristafallet, Njupeskär, Imatrankoski, Skradinski buk, Cascata delle Marmore/Marmore, Ruacana, Wallaman Falls, Jim Jim Falls, Wentworth Falls, Huka Falls",
    { nei: "Plitvice, Geirangerfjorden, Preikestolen, Trolltunga" },
  ),
  sp(
    "Nevn en isbre i Norge eller på Svalbard",
    "Jostedalsbreen, Folgefonna, Svartisen | Briksdalsbreen, Nigardsbreen, Hardangerjøkulen, Bøyabreen, Engabreen, Austfonna, Buerbreen, Bondhusbreen | Ålfotbreen, Blåmannsisen, Øksfjordjøkelen, Seilandsjøkelen, Okstindbreen, Smørstabbreen, Supphellebreen, Austerdalsbreen, Tunsbergdalsbreen, Kjenndalsbreen, Brenndalsbreen, Bergsetbreen, Fåbergstølsbreen, Lodalsbreen, Langfjordjøkelen, Rembesdalskåka, Hellstugubreen, Storbreen, Veobreen, Monacobreen, Nordenskiöldbreen, Kongsbreen, Esmarkbreen, Hornbreen, Negribreen, Vestfonna, Kronebreen | Jostefonn, Grovabreen, Myklebustbreen, Gjegnalundsbreen, Frostisen, Strupbreen, Styggedalsbreen, Vestre Memurubre, Juvfonne, Gråsubreen, Midtdalsbreen, Spørteggbreen, Tindefjellbreen, Steindalsbreen, Hansbreen, Tunabreen, Wahlenbergbreen, Fridtjovbreen, Paulabreen, Holtedahlfonna, Lomonosovfonna, Åsgardfonna, Kvitøyjøkulen | ",
    { nei: "Vatnajökull, Aletschbreen, Grønlandsisen, Galdhøpiggen, Jotunheimen" },
  ),
  sp(
    "Nevn en innsjø utenfor Norge",
    "Victoriasjøen/Victoria, Bajkalsjøen/Bajkal/Baikal, Gardasjøen/Lago di Garda/Garda, Loch Ness | Titicacasjøen/Titicaca, Genfersjøen/Lac Léman/Léman, Comosjøen/Lago di Como/Como, Vänern, Vättern, Kaspihavet, Bodensjøen/Bodensee, Lake Superior/Øvre sjø/Superiorsjøen, Michigansjøen/Lake Michigan, Dødehavet | Huronsjøen/Lake Huron, Eriesjøen/Lake Erie, Ontariosjøen/Lake Ontario, Tanganyikasjøen/Tanganyika, Malawisjøen/Malawi/Nyasasjøen, Tsjadsjøen, Aralsjøen, Balaton, Ladoga/Ladogasjøen, Onega/Onegasjøen, Saimaa, Mälaren, Siljan, Lago Maggiore/Maggiore, Genesaretsjøen/Galileasjøen/Tiberiassjøen/Kinneret, Ohridsjøen/Ohrid, Bledsjøen/Bled, Vierwaldstättersjøen/Luzernsjøen, Zürichsjøen/Zürichsee, Lake Tahoe/Tahoe, Great Salt Lake/Store saltsjø, Torneträsk, Inarisjøen/Enare träsk, Päijänne | Peipus/Peipussjøen, Prespa/Prespasjøen, Trasimeno, Hallstätter See/Hallstattsjøen, Wolfgangsee, Königssee, Neuchâtelsjøen/Neuchâtel, Annecysjøen/Lac d'Annecy, Crater Lake, Winnipegsjøen, Store bjørnesjø/Great Bear Lake, Store slavesjø/Great Slave Lake, Lake Louise, Nicaraguasjøen, Atitlán/Atitlan, Issyk-Kul, Balkhasj/Balkhash, Khövsgöl, Tonle Sap, Tobasjøen/Toba, Biwasjøen/Biwa, Tauposjøen/Taupo, Eyresjøen/Lake Eyre, Vansjøen, Urmiasjøen/Urmia, Turkanasjøen/Turkana/Rudolfsjøen, Albertsjøen, Kivusjøen/Kivu, Nassersjøen, Lough Neagh, Windermere, Loch Lomond, Storsjön, Pielinen, Iseosjøen/Lago d'Iseo, Chiemsee, Starnberger See | Edwardsjøen, Karibasjøen/Kariba, Voltasjøen, Tanasjøen/Lake Tana, Sevan, Qinghaisjøen/Qinghai, Dongting, Poyang, Dal Lake, Inlesjøen/Inle, Okeechobee, Lake Mead, Lake Powell, Champlain/Lake Champlain, Maracaibosjøen, Poopó, Llanquihue, Nahuel Huapi, General Carrera, Te Anau, Wakatipu, Pukaki, Tekapo, Müritz",
    { nei: "Mjøsa, Femunden, Randsfjorden, Tyrifjorden, Middelhavet, Østersjøen, Svartehavet, Rødehavet" },
  ),
  sp(
    "Nevn en fjellkjede",
    "Alpene, Himalaya, Andesfjellene/Andes, Klippefjellene/Rocky Mountains/Rockies | Pyreneene, Kaukasus, Uralfjellene/Ural, Atlasfjellene/Atlas, Karpatene, Appalachene/Appalachian Mountains, Apenninene, Den skandinaviske fjellkjeden/Kjølen/Skandes | Sierra Nevada, Dinariske alper/Dinaridene, Balkanfjellene, Hindukush/Hindu Kush, Karakoram, Pamir, Tian Shan, Altaj/Altai, Zagros, Taurusfjellene/Taurus, Elburs/Alborz, Drakensberg, Ruwenzori/Rwenzori, Great Dividing Range/Det store vannskillet, Tatra, Jurafjellene/Jura, Vogesene, Harz, Schwarzwald, Erzgebirge/Malmfjellene, Sudetene, Pindos, Kantabriske fjell/Cordillera Cantábrica, Dolomittene | Sierra Madre, Kaskadefjellene/Cascade Range, Brooks Range, Alaska Range, Transantarktiske fjell, Ellsworthfjellene, Rila, Rhodopene/Rodopi, Kunlun, Hengduan, Sulaiman, Vestghatene/Western Ghats, Østghatene/Eastern Ghats, Vindhya, Aravalli, Annamittene/Annamite, Barisan, Sierra Maestra, Coast Mountains, Mackenzie Mountains, Adirondack, Ozark, Sierra de Guadarrama, Sierra Morena, Pennines, Grampian Mountains/Grampians, Cairngorms, Massif Central/Sentralmassivet, Ardennene, Eifel, Taunus, Beskidene, Velebit, Prokletije, Simien, Ahaggar/Hoggar, Tibesti, Virunga, Rif | MacDonnell Ranges, Flinders Ranges, Sørlige alper/Southern Alps, Owen Stanley, Bayerischer Wald, Böhmerwald, Rhön, Šar/Sar-fjellene, Laurentidene, Sierra Nevada de Santa Marta",
    { nei: "Mount Everest, Mont Blanc, Kilimanjaro, Galdhøpiggen, Jotunheimen, Fuji" },
  ),
  sp(
    "Nevn en øy i Middelhavet",
    "Sicilia, Sardinia, Korsika, Kreta, Mallorca, Kypros, Malta | Ibiza, Rhodos, Menorca, Capri, Korfu, Santorini, Mykonos, Kos, Elba | Gozo, Ischia, Formentera, Lesbos, Zakynthos, Kefalonia, Naxos, Paros, Hvar, Brač/Brac, Krk, Korčula/Korcula, Samos, Chios, Djerba, Lampedusa, Stromboli, Lipari, Euboia/Evia | Pantelleria, Vulcano, Cres, Rab, Pag, Mljet, Vis, Ithaka, Lefkada/Lefkas, Thassos, Samothraki, Lemnos/Limnos, Karpathos, Patmos, Milos, Ios, Sifnos, Syros, Tinos, Andros, Egina/Aegina, Hydra, Spetses, Poros, Skiathos, Skopelos, Alonissos, Kythira, Symi, Kalymnos, Leros | Gökçeada/Gokceada, Bozcaada, Porquerolles, Giglio, Procida, Favignana, Levanzo, Marettimo, Comino, Ustica, Salina, Panarea, Filicudi, Alicudi, Asinara, Sant'Antioco, La Maddalena, Cabrera, Port-Cros, Lošinj/Losinj, Šolta/Solta, Lastovo, Kerkennah, Gavdos, Spinalonga, Kasos, Astypalea, Amorgos, Folegandros, Serifos, Kea, Kythnos",
    { nei: "Gran Canaria, Tenerife, Lanzarote, Madeira, Azorene, Island, Kanariøyene" },
  ),
  sp(
    "Nevn en øy i Asia",
    "Bali, Borneo, Sri Lanka, Taiwan | Java, Sumatra, Honshu, Hokkaido, Phuket, Singapore, Okinawa, Hainan, Sulawesi | Kyushu, Shikoku, Luzon, Mindanao, Lombok, Ko Samui/Koh Samui, Langkawi, Penang, Cebu, Boracay, Palawan, Sakhalin, Jeju, Hong Kong Island/Hongkong-øya, Timor, Flores, Komodo, Phi Phi/Ko Phi Phi/Koh Phi Phi, Ko Lanta/Koh Lanta, Ko Tao/Koh Tao, Ko Pha Ngan/Koh Phangan, Ko Chang/Koh Chang, Phu Quoc | Sumbawa, Bohol, Leyte, Samar, Negros, Panay, Mindoro, Andamanene, Nikobarene, Maldivene, Kurilene, Tioman, Batam, Bintan, Seram, Halmahera, Ambon, Madura, Bangka, Belitung, Sokotra/Socotra, Bahrain, Wrangeløya, Siargao, Gili-øyene/Gili, Nusa Penida, Lantau, Miyajima/Itsukushima, Sado, Yakushima, Ishigaki, Tsushima, Iriomote, Ulleungdo, Ko Lipe/Koh Lipe, Similanøyene/Similan, Cat Ba/Cát Bà, Con Dao/Côn Đảo | Siberut, Nias, Mentawai, Buru, Sumba, Alor, Ternate, Tidore, Labuan, Lamma, Cheung Chau, Kinmen, Penghu, Awaji, Naoshima, Amami, Rebun, Rishiri, Shodoshima, Coron, Camiguin, Siquijor, Bantayan, Malapascua, Ko Kut/Koh Kood, Ko Samet/Koh Samet, Elephanta, Majuli, Diu",
    { nei: "Mallorca, Kreta, Madagaskar, Grønland, Island, Hawaii, Tahiti" },
  ),
  sp(
    "Nevn et land der engelsk er offisielt språk",
    "#GB, #US, #IE, #AU, #CA, #NZ | #IN, #ZA, #MT, #JM, #NG, #SG | #KE, #GH, #PH, #PK, #UG, #ZM, #ZW, #BS, #BB, #TT, #FJ | #BW, #NA, #LS, #SZ, #RW, #TZ, #SD, #SS, #CM, #SL, #LR, #GM, #MW, #MU, #SC, #PG, #GY, #BZ | #SB, #VU, #WS, #TO, #KI, #TV, #NR, #MH, #FM, #PW, #AG, #DM, #GD, #KN, #LC, #VC, #BI",
    { nei: "Sverige, Nederland, Island, Israel" },
  ),
  sp("Nevn et land som begynner på B", "#BE, #BR | #BG, #BA, #BY | #BD, #BO, #BH | #BS, #BB, #BT, #BW, #BZ, #BJ, #BN | @start:B"),
  sp(
    "Nevn en hovedstad som begynner på B",
    "Berlin, Brussel/Bruxelles/Brussels, Budapest, Bern | Beograd/Belgrade, Bratislava, București/Bucuresti/Bukarest/Bucharest, Bangkok, Buenos Aires, Beijing, Bogotá/Bogota | Beirut, Bagdad/Baghdad, Baku, Brasília/Brasilia, Bridgetown, Brazzaville | Bamako, Bangui, Banjul, Bissau, Bisjkek/Bishkek, Belmopan, Basseterre, Bandar Seri Begawan | ",
    { nei: "Bonn, Bujumbura, Barcelona, Bergen, Basel, Bombay, Birmingham, Bordeaux, Bremen, Brno, Brisbane, Boston, Peking" },
  ),
  sp(
    "Nevn en hovedstad som begynner på S",
    "Stockholm, Sofia, Santiago/Santiago de Chile, Seoul | Sarajevo, Skopje, San Marino, Singapore, San José/San Jose | Santo Domingo, San Salvador, Sanaa/Sana'a, Suva, São Tomé/Sao Tome, Sucre | St. John's/Saint John's, St. George's/Saint George's, Sri Jayawardenepura Kotte/Sri Jayawardenapura Kotte | ",
    { nei: "Sydney, St. Petersburg, Sankt Petersburg, Shanghai, Salzburg, Stavanger, Sevilla, São Paulo, Seattle, San Francisco, Strasbourg, Split" },
  ),
  sp(
    "Nevn et land med kyst mot Middelhavet",
    "#ES, #FR, #IT, #GR, #TR | #HR, #EG, #CY, #MT, #MA, #TN | #LY, #DZ, #IL, #LB, #SY, #AL, #ME, #SI, #MC | #BA, #PS | ",
    { nei: "Portugal, San Marino, Vatikanstaten, Nord-Makedonia, Bulgaria, Jordan, Serbia, Østerrike, Sveits" },
  ),
  sp("Nevn et land i Midtøsten", "#IR, #IQ, #IL, #SA | #SY, #JO, #LB, #AE, #PS, #QA, #KW | #OM, #YE, #BH, #TR, #EG | #CY | ", { nei: "Pakistan, India, Marokko" }),
  sp(
    "Nevn et land eller rike som ikke finnes lenger",
    "Sovjetunionen/Sovjet/USSR/SSSR, Jugoslavia, Øst-Tyskland/DDR, Tsjekkoslovakia | Vest-Tyskland/BRD, Romerriket/Det romerske rike, Det osmanske riket/Osmanerriket/Det ottomanske riket, Preussen, Østerrike-Ungarn, Det tysk-romerske riket, Det bysantinske riket/Bysants/Østromerriket | Kalmarunionen, Danmark-Norge, Sverige-Norge/Unionen Sverige-Norge, Sør-Vietnam, Serbia og Montenegro, Det britiske imperiet/Britiske imperiet, Mongolriket, Inkariket, Aztekerriket, Kartago, Perserriket, Babylonia/Babylon, Rhodesia | Biafra, Nord-Jemen, Sør-Jemen, Den forente arabiske republikk, Kongeriket Sardinia/Sardinia-Piemonte, Kongeriket De to Sicilier/De to Sicilier, Republikken Venezia, Kongeriket Hawaii, Republikken Texas, Polen-Litauen, Kongeriket Bøhmen/Bøhmen, Kongeriket Navarra/Navarra, Kongeriket Aragón/Aragón/Aragon, Kongeriket Castilla/Castilla/Kastilja, Hertugdømmet Burgund/Burgund, Wessex, Northumbria, Mercia, Storcolombia/Gran Colombia, Tanganyika, Zanzibar, Kongeriket Bayern, Kongeriket Hannover, Assyria, Frankerriket, Kievriket/Kyiv-Rus/Kiev-Russland, Mogulriket, Khmerriket, Maliriket, Songhairiket, Kongeriket Jerusalem, Den sentralamerikanske føderasjonen | Det karolingiske riket, Hettitterriket, Akkad, Det makedonske riket, Vestgoterriket, Østgoterriket, Vandalriket, Langobardriket, Det seleukidiske riket, Ptolemeerriket, Partherriket, Sasanideriket, Kalifatet, Abbasidekalifatet, Umayyadekalifatet, Timuridriket, Det svenske stormaktsriket, Livland, Kurland, Den nederlandske republikk",
    { nei: "Burma, Ceylon, Siam, Zaire, Abessinia, Persia, Holland, Grønland, Tibet, Kosovo, Taiwan" },
  ),
]
