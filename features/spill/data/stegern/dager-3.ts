import { dag, sp } from "./typer"

// Days 11–12.
export const dager3 = [
  dag(
    sp(
      "Nevn en nøtt eller et frø man kan spise",
      "peanøtt/peanøtter/jordnøtt, valnøtt/valnøtter, hasselnøtt/hasselnøtter, mandel/mandler | cashewnøtt/cashew, pistasj/pistasjnøtt, kokosnøtt, solsikkefrø, paranøtt, pekannøtt | macadamia/macadamianøtt, gresskarkjerner/gresskarfrø, pinjekjerner, chiafrø, linfrø, sesamfrø/sesam, kastanje/kastanjer | hampefrø, valmuefrø, quinoa, bokhvete, kakaobønne/kakaobønner, kaffebønne, sennepsfrø, fennikelfrø, karve | tigernøtt, kolanøtt, betelnøtt, sheanøtt, kukuinøtt, bambaranøtt, pilinøtt, baru, candlenut, ginkgo",
    ),
    sp("Nevn et land som grenser til Italia", "#FR, #CH, #AT | #SI | #VA, #SM | | @naboer:IT"),
    sp(
      "Nevn et hjortedyr",
      "elg, rådyr, hjort/kronhjort, reinsdyr/rein | dåhjort/dådyr, villrein, karibu, wapiti | sikahjort, muntjak, vannrådyr, sambarhjort, aksishjort, damhjort, mulehjort, hvithalehjort | sumphjort, pampashjort, pudu, sørlig pudu, nordlig pudu, davidshjort/milu, barasingha, moskushjort, elghjort, kinesisk vannhjort | huemul, brockethjort, timorhjort, tufthjort, gaffelhjort, axishjort, mazama",
      { nei: "antilope, gaselle, gnu, impala, moskus, moskusokse" },
    ),
    sp(
      "Nevn en figur fra Thorbjørn Egners fortellinger",
      "Kasper, Jesper, Jonatan, Karius, Baktus | Mikkel Rev, Klatremus, Bamse Brakar, Politimester Bastian/Bastian, Tante Sofie/Sofie | Morten Skogmus, Kamomilla, Tobias, Pinnsvinet | | ",
    ),
    sp(
      "Nevn en bydel i Oslo",
      "Grünerløkka, Frogner, Gamle Oslo | Sagene, St. Hanshaugen, Nordre Aker, Vestre Aker, Ullern | Grorud, Stovner, Bjerke, Alna, Østensjø, Nordstrand | Søndre Nordstrand | ",
      { nei: "Majorstuen, Grønland, Tøyen, Holmenkollen, Bislett" },
    ),
    sp(
      "Nevn en NBA-klubb",
      "Los Angeles Lakers/Lakers, Chicago Bulls/Bulls, Boston Celtics/Celtics, Golden State Warriors/Warriors | Miami Heat/Heat, New York Knicks/Knicks, Brooklyn Nets/Nets, San Antonio Spurs/Spurs, Houston Rockets/Rockets, Dallas Mavericks/Mavericks/Mavs, Cleveland Cavaliers/Cavaliers/Cavs, Los Angeles Clippers/Clippers | Phoenix Suns/Suns, Philadelphia 76ers/76ers/Sixers, Denver Nuggets/Nuggets, Milwaukee Bucks/Bucks, Toronto Raptors/Raptors, Oklahoma City Thunder/Thunder, Utah Jazz/Jazz, Detroit Pistons/Pistons, Orlando Magic/Magic | Atlanta Hawks/Hawks, Portland Trail Blazers/Trail Blazers/Blazers, Sacramento Kings/Kings, Minnesota Timberwolves/Timberwolves/Wolves, Indiana Pacers/Pacers, Memphis Grizzlies/Grizzlies, New Orleans Pelicans/Pelicans | Charlotte Hornets/Hornets, Washington Wizards/Wizards",
    ),
  ),
  dag(
    sp(
      "Nevn en suppe",
      "tomatsuppe, kyllingsuppe, fiskesuppe, ertesuppe/gule erter | løksuppe/fransk løksuppe, grønnsakssuppe, blomkålsuppe, betasuppe, aspargessuppe, sjampinjongsuppe/soppsuppe, kjøttsuppe, linsesuppe, gulasjsuppe | minestrone, gazpacho, borsjtsj/borsch, ramen, miso/misosuppe, tom yum, pho, gresskarsuppe, potetsuppe, purreløksuppe, brokkolisuppe, hummersuppe, bouillabaisse | bergensk fiskesuppe, sodd, rosinsuppe, fruktsuppe, chowder/clam chowder, vichyssoise, mulligatawny, wonton/wontonsuppe, laksa, harira, solyanka, kharcho, avgolemono, ribollita, bisque, consommé, buljong, chili | tom kha/tom kha gai, caldo verde, menudo, pozole, sopa de lima, gumbo, cock-a-leekie, cullen skink, okroshka, shchi, ukha, rassolnik, fasolada, tarator, ajiaco, sancocho, callaloo, egusi, pepper soup, ash reshteh, mercimek, yayla",
    ),
    sp("Nevn et land som begynner på S", "#SE, #ES | #CH, #SY, #SG, #SA | #SN, #SK, #SI, #RS, #SO, #SD, #ZA/Sør-Afrika, #KR/Sør-Korea | #SS/Sør-Sudan, #SR, #SC, #SL, #LK/Sri Lanka, #WS/Samoa, #SB/Salomonøyene | @start:S"),
    sp(
      "Nevn en ape eller annen primat",
      "gorilla, sjimpanse, orangutang, bavian | gibbon, lemur, makak, kapusinerape, mandrill, bonobo, edderkoppape, menneske | brøleape, ekorn-ape/ekornape, silkeape, tamarin, neseape, colobus/colobusape, langur, tarsier/spøkelsesdyr, loris, galago | gelada, drill, rhesusape, japansk makak/snøape, berberape, gullsnøbbeape/gylden snøbbeape, uakari, titi, nattape, sakiape, vervetape, diana-ape | aye-aye/fingerdyr, sifaka, indri, potto, hulok, siamang, kipunji, gylden løveape/løveape, pygmésilkeape/dvergsilkeape, mangabey, talapoin, guenon",
    ),
    sp(
      "Nevn en James Bond-skuespiller",
      "Daniel Craig/Craig, Sean Connery/Connery, Roger Moore/Moore, Pierce Brosnan/Brosnan | Timothy Dalton/Dalton | George Lazenby/Lazenby | David Niven/Niven | Barry Nelson",
      { nei: "Idris Elba, Henry Cavill, Tom Hardy" },
    ),
    sp(
      "Nevn et tegnsettingstegn",
      "punktum, komma, spørsmålstegn, utropstegn | kolon, semikolon, bindestrek, apostrof, anførselstegn/hermetegn/sitattegn/gåseøyne | tankestrek, parentes, skråstrek, tre prikker/ellipse/prikk prikk prikk, klammeparentes | bakstrek/omvendt skråstrek, krøllparentes, asterisk/stjerne, et-tegn/krøllalfa, ampersand/og-tegn | ",
    ),
    sp(
      "Nevn en klubb som har spilt i Premier League",
      "Manchester United/Man United/Man Utd, Liverpool, Arsenal, Chelsea, Manchester City/Man City | Tottenham/Tottenham Hotspur/Spurs, Newcastle/Newcastle United, Everton, Aston Villa, West Ham/West Ham United, Leeds/Leeds United | Leicester/Leicester City, Southampton, Fulham, Crystal Palace, Wolverhampton/Wolves, Brighton, Nottingham Forest/Forest, Blackburn/Blackburn Rovers, Sunderland, Middlesbrough, Bournemouth/AFC Bournemouth, Burnley, Brentford, Watford, West Bromwich/West Brom | Norwich/Norwich City, Stoke/Stoke City, Sheffield United, Sheffield Wednesday, Ipswich/Ipswich Town, Bolton/Bolton Wanderers, Charlton/Charlton Athletic, Derby/Derby County, Portsmouth, Wigan/Wigan Athletic, Swansea/Swansea City, Hull/Hull City, Queens Park Rangers/QPR, Coventry/Coventry City, Birmingham/Birmingham City, Reading, Cardiff/Cardiff City, Wimbledon, Huddersfield/Huddersfield Town | Barnsley, Blackpool, Bradford/Bradford City, Luton/Luton Town, Oldham/Oldham Athletic, Swindon/Swindon Town",
      { nei: "Celtic, Rangers" },
    ),
  ),
]
