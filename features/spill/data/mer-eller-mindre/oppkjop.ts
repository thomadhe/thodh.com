import type { MerEllerMindreCategory } from "../types"

// Prisen som ble betalt (eller avtalt) da selskaper, merkevarer og noen klubber og landområder skiftet eier,
// nominelt beløp i kjøpsåret. Der kjøpet ble kunngjort for ett beløp og avsluttet for et annet, er kunngjort
// beløp brukt (se kilden). Tall fra pressen er ikke bekreftet av partene i alle tilfeller.
// Beløpene er omregnet til norske kroner med ett fast kurs per valuta (ECB-referansekurser 29. oktober 2026,
// avrundet): USD 9.3, EUR 10.3, GBP 12.4, CHF 11.2, SEK 0.94, JPY 0.059, CAD 6.6, BRL 1.73 kroner.
// Hver verdi er avrundet til to gjeldende siffer. Kilden til hvert tall står som lenke etter varen.

export const oppkjop: MerEllerMindreCategory = {
  id: "oppkjop",
  title: "Oppkjøp",
  question: "Hva kostet mest å kjøpe?",
  winner: "higher",
  format: "compact",
  unit: "kr",
  separation: { kind: "ratio", value: 1.5 },
  source: "Kjøpesum, omregnet til kroner",
  items: [
    { name: "WhatsApp", value: 180000000000, detail: "Kjøpt av Facebook · 2014", emoji: "💬" }, // https://en.wikipedia.org/wiki/WhatsApp
    { name: "Instagram", value: 9300000000, detail: "Kjøpt av Facebook · 2012", emoji: "📸" }, // https://en.wikipedia.org/wiki/Instagram
    { name: "Twitter", value: 410000000000, detail: "Kjøpt av Elon Musk · 2022", emoji: "🐦" }, // https://en.wikipedia.org/wiki/X_(social_network)
    { name: "YouTube", value: 15000000000, detail: "Kjøpt av Google · 2006", emoji: "▶️" }, // https://en.wikipedia.org/wiki/YouTube
    { name: "Marvel", value: 37000000000, detail: "Kjøpt av Disney · 2009", emoji: "🦸" }, // https://en.wikipedia.org/wiki/Marvel_Entertainment
    { name: "Lucasfilm", value: 38000000000, detail: "Kjøpt av Disney · 2012", emoji: "⭐" }, // https://en.wikipedia.org/wiki/Lucasfilm
    { name: "Activision Blizzard", value: 640000000000, detail: "Kjøpt av Microsoft · 2022", emoji: "🎮" }, // https://en.wikipedia.org/wiki/Acquisition_of_Activision_Blizzard_by_Microsoft
    { name: "Minecraft (Mojang)", value: 23000000000, detail: "Kjøpt av Microsoft · 2014", emoji: "⛏️" }, // https://en.wikipedia.org/wiki/Minecraft
    { name: "Pixar", value: 69000000000, detail: "Kjøpt av Disney · 2006", emoji: "💡" }, // https://en.wikipedia.org/wiki/Pixar
    { name: "Skype (til Microsoft)", value: 79000000000, detail: "Kjøpt av Microsoft · 2011", emoji: "📞" }, // https://en.wikipedia.org/wiki/Skype
    { name: "Skype (til eBay)", value: 24000000000, detail: "Kjøpt av eBay · 2005", emoji: "📞" }, // https://en.wikipedia.org/wiki/Skype
    { name: "Beats", value: 28000000000, detail: "Kjøpt av Apple · 2014", emoji: "🎧" }, // https://en.wikipedia.org/wiki/Beats_(brand)
    { name: "LinkedIn", value: 240000000000, detail: "Kjøpt av Microsoft · 2016", emoji: "💼" }, // https://en.wikipedia.org/wiki/LinkedIn
    { name: "Tandberg", value: 32000000000, detail: "Kjøpt av Cisco · 2009", emoji: "📹" }, // https://en.wikipedia.org/wiki/Tandberg
    { name: "Trolltech (Qt)", value: 1100000000, detail: "Kjøpt av Nokia · 2008", emoji: "🧌" }, // https://en.wikipedia.org/wiki/Qt_Group
    { name: "FAST Search & Transfer", value: 11000000000, detail: "Kjøpt av Microsoft · 2008", emoji: "🔎" }, // https://en.wikipedia.org/wiki/Microsoft_Development_Center_Norway
    { name: "Kahoot!", value: 16000000000, detail: "Kjøpt av investorer · 2023", emoji: "❓" }, // https://en.wikipedia.org/wiki/Kahoot!
    { name: "King (Candy Crush)", value: 55000000000, detail: "Kjøpt av Activision · 2016", emoji: "🍬" }, // https://en.wikipedia.org/wiki/King_(company)
    { name: "Rovio (Angry Birds)", value: 7200000000, detail: "Kjøpt av Sega · 2023", emoji: "🐦" }, // https://en.wikipedia.org/wiki/Rovio_Entertainment
    { name: "Supercell", value: 80000000000, detail: "Kjøpt av Tencent-gruppe · 2016", emoji: "⚔️" }, // https://en.wikipedia.org/wiki/Supercell_(company)
    { name: "iZettle", value: 20000000000, detail: "Kjøpt av PayPal · 2018", emoji: "💳" }, // https://en.wikipedia.org/wiki/Zettle
    { name: "Slack", value: 260000000000, detail: "Kjøpt av Salesforce · 2020", emoji: "💬" }, // https://en.wikipedia.org/wiki/Slack_Technologies
    { name: "Tableau", value: 150000000000, detail: "Kjøpt av Salesforce · 2019", emoji: "📊" }, // https://en.wikipedia.org/wiki/Tableau_Software
    { name: "Motorola Mobility", value: 120000000000, detail: "Kjøpt av Google · 2012", emoji: "📱" }, // https://en.wikipedia.org/wiki/Motorola_Mobility
    { name: "Tumblr", value: 10000000000, detail: "Kjøpt av Yahoo · 2013", emoji: "📝" }, // https://en.wikipedia.org/wiki/Tumblr
    { name: "Hotmail", value: 3700000000, detail: "Kjøpt av Microsoft · 1997", emoji: "📧" }, // https://en.wikipedia.org/wiki/Outlook.com
    { name: "Waze", value: 12000000000, detail: "Kjøpt av Google · 2013", emoji: "🚗" }, // https://en.wikipedia.org/wiki/Waze
    { name: "Android", value: 470000000, detail: "Kjøpt av Google · 2005", emoji: "🤖" }, // https://en.wikipedia.org/wiki/Android_(operating_system)
    { name: "Nest", value: 30000000000, detail: "Kjøpt av Google · 2014", emoji: "🌡️" }, // https://en.wikipedia.org/wiki/Google_Nest
    { name: "Ring", value: 11000000000, detail: "Kjøpt av Amazon · 2018", emoji: "🔔" }, // https://en.wikipedia.org/wiki/Ring_(company)
    { name: "Twitch", value: 9000000000, detail: "Kjøpt av Amazon · 2014", emoji: "🎥" }, // https://en.wikipedia.org/wiki/Twitch_(service)
    { name: "Whole Foods", value: 130000000000, detail: "Kjøpt av Amazon · 2017", emoji: "🥑" }, // https://en.wikipedia.org/wiki/Whole_Foods_Market
    { name: "Zappos", value: 11000000000, detail: "Kjøpt av Amazon · 2009", emoji: "👟" }, // https://en.wikipedia.org/wiki/Zappos
    { name: "NeXT", value: 4000000000, detail: "Kjøpt av Apple · 1997", emoji: "🍎" }, // https://en.wikipedia.org/wiki/NeXT
    { name: "Arm", value: 300000000000, detail: "Kjøpt av SoftBank · 2016", emoji: "🔧" }, // https://en.wikipedia.org/wiki/Arm_Holdings
    { name: "Bungie", value: 33000000000, detail: "Kjøpt av Sony · 2022", emoji: "🎯" }, // https://en.wikipedia.org/wiki/Bungie
    { name: "ZeniMax", value: 75000000000, detail: "Kjøpt av Microsoft · 2021", emoji: "🎮" }, // https://en.wikipedia.org/wiki/ZeniMax_Media
    { name: "Myspace", value: 5400000000, detail: "Kjøpt av News Corp · 2005", emoji: "🎵" }, // https://en.wikipedia.org/wiki/Myspace
    { name: "Bebo (kjøpt tilbake)", value: 9300000, detail: "Grunnleggerne kjøpte · 2013", emoji: "🔙" }, // https://en.wikipedia.org/wiki/Bebo
    { name: "Vine", value: 280000000, detail: "Kjøpt av Twitter · 2012", emoji: "🌀" }, // https://en.wikipedia.org/wiki/Vine_(service)
    { name: "GeoCities", value: 33000000000, detail: "Kjøpt av Yahoo · 1999", emoji: "🌐" }, // https://en.wikipedia.org/wiki/Yahoo!
    { name: "Broadcast.com", value: 53000000000, detail: "Kjøpt av Yahoo · 1999", emoji: "📻" }, // https://en.wikipedia.org/wiki/Mark_Cuban
    { name: "Yahoo (til Verizon)", value: 42000000000, detail: "Kjøpt av Verizon · 2017", emoji: "📬" }, // https://en.wikipedia.org/wiki/Yahoo_Inc._(2017–present)
    { name: "AOL (til Verizon)", value: 41000000000, detail: "Kjøpt av Verizon · 2015", emoji: "📟" }, // https://en.wikipedia.org/wiki/AOL
    { name: "21st Century Fox", value: 660000000000, detail: "Kjøpt av Disney · 2019", emoji: "🦊" }, // https://en.wikipedia.org/wiki/Acquisition_of_21st_Century_Fox_by_Disney
    { name: "Time Warner", value: 1000000000000, detail: "Kjøpt av AT&T · 2018", emoji: "📺" }, // https://en.wikipedia.org/wiki/WarnerMedia
    { name: "Tiffany & Co.", value: 150000000000, detail: "Kjøpt av LVMH · 2021", emoji: "💍" }, // https://en.wikipedia.org/wiki/Tiffany_%26_Co.
    { name: "Volvo Cars", value: 17000000000, detail: "Kjøpt av Geely · 2010", emoji: "🚙" }, // https://en.wikipedia.org/wiki/Volvo_Cars
    { name: "The Washington Post", value: 2300000000, detail: "Kjøpt av Jeff Bezos · 2013", emoji: "📰" }, // https://en.wikipedia.org/wiki/The_Washington_Post
    { name: "Oculus", value: 19000000000, detail: "Kjøpt av Facebook · 2014", emoji: "🥽" }, // https://en.wikipedia.org/wiki/Reality_Labs
    { name: "Newcastle United", value: 3800000000, detail: "Kjøpt av Saudi-konsortium · 2021", emoji: "⚽" }, // https://en.wikipedia.org/wiki/Newcastle_United_F.C.
    { name: "Boston Celtics", value: 57000000000, detail: "Kjøpt av Chisholm · 2025", emoji: "🏀" }, // https://en.wikipedia.org/wiki/Boston_Celtics
    { name: "Zynga", value: 120000000000, detail: "Kjøpt av Take-Two · 2022", emoji: "🐄" }, // https://en.wikipedia.org/wiki/Zynga
    { name: "GitHub", value: 70000000000, detail: "Kjøpt av Microsoft · 2018", emoji: "🐙" }, // https://en.wikipedia.org/wiki/GitHub
    { name: "Mailchimp", value: 110000000000, detail: "Kjøpt av Intuit · 2021", emoji: "🐵" }, // https://en.wikipedia.org/wiki/Mailchimp
    { name: "Red Hat", value: 320000000000, detail: "Kjøpt av IBM · 2018", emoji: "🎩" }, // https://en.wikipedia.org/wiki/Red_Hat
    { name: "Sun Microsystems", value: 69000000000, detail: "Kjøpt av Oracle · 2009", emoji: "☀️" }, // https://en.wikipedia.org/wiki/Sun_Microsystems
    { name: "MySQL", value: 9300000000, detail: "Kjøpt av Sun · 2008", emoji: "🐬" }, // https://en.wikipedia.org/wiki/Sun_Microsystems
    { name: "Alcatel-Lucent", value: 160000000000, detail: "Kjøpt av Nokia · 2015", emoji: "📡" }, // https://en.wikipedia.org/wiki/Nokia
    { name: "Dollar Shave Club", value: 9300000000, detail: "Kjøpt av Unilever · 2016", emoji: "🪒" }, // https://en.wikipedia.org/wiki/Dollar_Shave_Club
    { name: "Honey", value: 37000000000, detail: "Kjøpt av PayPal · 2020", emoji: "🍯" }, // https://en.wikipedia.org/wiki/PayPal_Honey
    { name: "Napster (til Best Buy)", value: 1100000000, detail: "Kjøpt av Best Buy · 2008", emoji: "🎶" }, // https://en.wikipedia.org/wiki/Napster
    { name: "Napster (til Roxio)", value: 49000000, detail: "Kjøpt av Roxio · 2002", emoji: "🎶" }, // https://en.wikipedia.org/wiki/Napster
    { name: "Louisiana-kjøpet", value: 140000000, detail: "USA kjøper av Frankrike · 1803", emoji: "🗺️" }, // https://en.wikipedia.org/wiki/Louisiana_Purchase
    { name: "Alaska-kjøpet", value: 67000000, detail: "USA kjøper av Russland · 1867", emoji: "🐻‍❄️" }, // https://en.wikipedia.org/wiki/Alaska_Purchase
  ],
}
