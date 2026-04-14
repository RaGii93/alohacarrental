import { DEFAULT_FAQ_PROFILE, type FaqProfile } from "@/lib/deployment-profiles";

export type FaqTextRun = {
  text: string;
  bold?: boolean;
  underline?: boolean;
};

export type FaqBlock =
  | {
      type: "paragraph";
      runs: FaqTextRun[];
    }
  | {
      type: "list";
      items: FaqTextRun[][];
      ordered?: boolean;
    };

export type FaqEntry = {
  id: string;
  question: string;
  blocks: FaqBlock[];
  keywords: string[];
};

export type FaqLocale = "en" | "nl" | "es";

export type FaqAssistantCopy = {
  title: string;
  welcome: string;
  notFound: string;
  readMore: string;
  openWhatsapp: string;
  askPlaceholder: string;
};

const p = (...runs: FaqTextRun[]): FaqBlock => ({ type: "paragraph", runs });
const list = (...items: FaqTextRun[][]): FaqBlock => ({ type: "list", items });
const t = (text: string): FaqTextRun => ({ text });
const b = (text: string): FaqTextRun => ({ text, bold: true });

function coerceFaqLocale(locale: string | null | undefined): FaqLocale {
  const normalized = String(locale || "").toLowerCase().trim();
  if (normalized === "nl" || normalized.startsWith("nl-")) return "nl";
  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  return "en";
}

const rentalFaqByLocale: Record<FaqLocale, FaqEntry[]> = {
  en: [
    {
      id: "accident",
      question: "What should I do in case of an accident?",
      keywords: ["accident", "crash", "collision", "emergency", "insurance", "911", "roadside", "support"],
      blocks: [
        list(
          [b("Call Emergency Services:"), t(" Dial "), b("911"), t(" if anyone is injured or needs urgent medical help.")],
          [b("Call Aloha Car Rental during business hours:"), t(" From "), b("8:00 AM to 8:00 PM"), t(", call our main line at "), b("+599 785 5999"), t(".")],
          [b("Call roadside support after hours:"), t(" From "), b("8:00 PM to 8:00 AM"), t(", call our dedicated roadside line at "), b("+599 785 2604"), t(".")],
          [b("Roadside Assistance & Emergencies:"), t(" You can also contact "), b("CRS - Caribbean Road Services"), t(" by phone at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(".")],
          [b("Stay safe and wait for instructions:"), t(" If the vehicle is in a dangerous spot, move only if police or emergency responders tell you to do so.")],
        ),
        p(t("We provide support around the clock with "), b("24/7 roadside assistance"), t(".")),
      ],
    },
    {
      id: "damage",
      question: "What should I do if the rental car is damaged?",
      keywords: ["damage", "damaged", "windshield", "scratch", "hit", "report", "roadside", "support"],
      blocks: [
        list(
          [b("Contact us as soon as possible:"), t(" During "), b("8:00 AM to 8:00 PM"), t(" call "), b("+599 785 5999"), t(". After hours, call "), b("+599 785 2604"), t(".")],
          [b("For urgent roadside help:"), t(" Contact "), b("CRS - Caribbean Road Services"), t(" at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(".")],
          [b("If there is an emergency:"), t(" Call "), b("911"), t(" immediately if someone is injured or if police, ambulance, or fire services are needed.")],
        ),
        p(t("Keep the damage documented with photos when possible and wait for instructions from our team or emergency services.")),
      ],
    },
    {
      id: "theft",
      question: "What should I do if the rental car is stolen?",
      keywords: ["theft", "stolen", "police", "911", "support", "roadside"],
      blocks: [
        list(
          [b("Call Aloha Car Rental immediately:"), t(" During "), b("8:00 AM to 8:00 PM"), t(" call "), b("+599 785 5999"), t(". After hours, call "), b("+599 785 2604"), t(".")],
          [b("Report it to emergency services:"), t(" Call "), b("911"), t(" right away to notify the police.")],
          [b("Need roadside coordination?"), t(" CRS - Caribbean Road Services is also available at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(".")],
        ),
      ],
    },
    {
      id: "minimum-age",
      question: "What is the minimum age to rent a vehicle?",
      keywords: ["minimum age", "age", "young driver", "license", "van", "vehicle"],
      blocks: [
        p(t("Minimum age requirements are "), b("19+"), t(" for vehicles and "), b("25+"), t(" for vans. You must also have held a category B driving license for at least one year.")),
        p(t("There is a deductible of "), b("$500"), t(" for vehicles and "), b("$750"), t(" for vans. Drivers under "), b("23"), t(" or with less than two years on a B license have a higher deductible of "), b("$600"), t(", and that amount cannot be waived.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "What are your insurance coverage and deposit options?",
      keywords: ["insurance", "coverage", "deposit", "deductible", "all risk", "all-risk", "cdw", "basic cdw", "abb", "tax", "taxes", "price", "prices"],
      blocks: [
        p(b("Included in the price.")),
        p(t("All of our prices include "), b("Basic CDW"), t(" and "), b("6% ABB tax"), t(".")),
        p(b("Additional insurance and deposit.")),
        p(t("You still keep a deductible of "), b("$500"), t(" for vehicles and "), b("$750"), t(" for vans. You can reduce that risk by paying "), b("$15"), t(" per day for vehicles and "), b("$25"), t(" per day for vans. For rentals under 4 days, a flat "), b("$85"), t(" buy-off option is available. Exceptions apply for speeding, DUI, or leaving an accident scene.")),
        p(b("Deposit Amount.")),
        p(t("The required deposit is "), b("$250"), t(" for vehicles and "), b("$375"), t(" for vans.")),
      ],
    },
    {
      id: "kilometers",
      question: "How many kilometers can I drive per day?",
      keywords: ["kilometers", "kilometres", "mileage", "unlimited", "distance"],
      blocks: [p(t("Please contact Aloha Car Rental directly for the mileage policy that applies to your booking."))],
    },
    {
      id: "roadside-assistance",
      question: "How do I reach roadside assistance or emergency support?",
      keywords: ["roadside assistance", "roadside", "emergency", "support", "help", "phone", "whatsapp", "business hours", "after hours", "crs"],
      blocks: [
        p(t("We provide "), b("24/7 roadside assistance"), t(".")),
        p(t("During business hours "), b("(8:00 AM - 8:00 PM)"), t(", call our main business line at "), b("+599 785 5999"), t(".")),
        p(t("After hours "), b("(8:00 PM - 8:00 AM)"), t(", call our dedicated roadside service line at "), b("+599 785 2604"), t(".")),
        p(t("For Roadside Assistance & Emergencies, you can also contact "), b("CRS - Caribbean Road Services"), t(" by phone at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(".")),
        p(t("Police, ambulance, and fire department can be reached at "), b("911"), t(".")),
      ],
    },
    {
      id: "payment-methods",
      question: "Do you accept cash or credit cards?",
      keywords: ["cash", "credit card", "cards", "maestro", "amex", "visa", "mastercard", "payment"],
      blocks: [
        p(t("Yes. We accept cash, Maestro, Kompa Leon, Visa/Mastercard, Discover/Diners, Amex, and other major credit cards. A "), b("5% administration"), t(" fee applies to credit card payments.")),
      ],
    },
    {
      id: "euros",
      question: "Can I pay in euros?",
      keywords: ["euro", "euros", "currency", "guilders", "dollars"],
      blocks: [
        p(t("No, we do not accept euros. Cash payments can be made in Caribbean guilders or US dollars.")),
        p(t("You can also pay using our bank mobile pin machine.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "What is your fuel policy?",
      keywords: ["fuel", "gas", "petrol", "tank", "full to full", "full-to-full"],
      blocks: [
        p(t("Our fuel policy is "), b("full-to-full"), t(".")),
        p(t("Vehicles are delivered with a full tank and must be returned with a full tank. If the vehicle was not delivered full, you may return it with the same level received.")),
        p(b("Important:"), t(" If the fuel level is too low at return, a minimum charge of "), b("$25"), t(" for vehicles and "), b("$35"), t(" for vans applies for every "), b("1/4 tank"), t(" or part of it.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "Who is allowed to drive the rental car?",
      keywords: ["driver", "additional driver", "authorized driver", "co-sign"],
      blocks: [p(t("The primary renter and the additional driver who co-signs the agreement and has a valid driving license may drive the vehicle."))],
    },
    {
      id: "early-flight-return",
      question: "Where do I leave the vehicle if my flight departs before opening hours?",
      keywords: ["flight", "departure", "opening hours", "return", "early return"],
      blocks: [p(t("If your return flight leaves before opening hours, tell the rental agent when you pick up the vehicle. They will give you the return instructions."))],
    },
    {
      id: "long-term",
      question: "Do you offer long-term rentals?",
      keywords: ["long-term", "long term", "monthly", "extended rental"],
      blocks: [p(t("Yes. Contact us by email or WhatsApp to discuss long-term availability and pricing."))],
    },
    {
      id: "delivery",
      question: "Do you deliver the car to a specific location?",
      keywords: ["delivery", "deliver", "specific location", "hotel", "address"],
      blocks: [p(t("Yes, we can deliver the rental car to your preferred location."))],
    },
    {
      id: "airport",
      question: "Can I receive the rental car at the airport?",
      keywords: ["airport", "arrival", "pickup airport", "receive car"],
      blocks: [p(t("Yes. Depending on your flight time, we can have the car ready near the airport and send detailed instructions before arrival."))],
    },
    {
      id: "advance-booking",
      question: "How far in advance should I reserve my rental car?",
      keywords: ["reserve", "book in advance", "advance", "last minute", "24 hours"],
      blocks: [p(t("You can reserve up to one year in advance. For last-minute bookings within 24 hours, contact us directly by WhatsApp or phone."))],
    },
    {
      id: "minimum-rental-rules",
      question: "Why can’t I book a very short rental online?",
      keywords: ["minimum rental", "minimum days", "short rental", "admin only", "booking rules"],
      blocks: [
        p(t("Some rentals have a minimum number of days configured in the booking flow.")),
        p(t("If a booking is shorter than that minimum, the site may apply an extra short-rental surcharge or require staff assistance instead of letting the public request continue online.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "Can I make a last-minute booking online?",
      keywords: ["last minute", "same day", "same-day", "urgent booking", "24 hours"],
      blocks: [
        p(t("That depends on the active booking rules.")),
        p(t("If your pickup is inside the configured last-minute window, the website may add an extra percentage or require the booking to be handled directly by staff.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "Do you sometimes arrange rentals with partner vehicles?",
      keywords: ["partner rentals", "outside company", "supplier car", "other company", "partner vehicle"],
      blocks: [
        p(t("Yes. In some cases a booking may be fulfilled with a partner-supplied vehicle instead of our own saved fleet.")),
        p(t("Those rentals are handled separately on the operational side so they do not mix into the normal public fleet inventory, while the customer still receives the normal booking communication.")),
      ],
    },
  ],
  nl: [
    {
      id: "accident",
      question: "Wat moet ik doen bij een ongeval?",
      keywords: ["ongeval", "ongeluk", "aanrijding", "noodgeval", "verzekering", "911", "pechhulp", "support"],
      blocks: [
        list(
          [b("Bel de hulpdiensten:"), t(" Bel "), b("911"), t(" als er gewonden zijn of als medische hulp direct nodig is.")],
          [b("Bel Aloha Car Rental tijdens kantooruren:"), t(" Van "), b("8:00 tot 20:00"), t(" bel je onze hoofdlijn op "), b("+599 785 5999"), t(".")],
          [b("Bel pechhulp na sluitingstijd:"), t(" Van "), b("20:00 tot 8:00"), t(" bel je onze speciale pechhulplijn op "), b("+599 785 2604"), t(".")],
          [b("Pechhulp & noodgevallen:"), t(" Je kunt ook "), b("CRS - Caribbean Road Services"), t(" bellen op "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t(".")],
          [b("Blijf veilig en wacht op instructies:"), t(" Staat het voertuig op een gevaarlijke plek, verplaats het dan alleen als politie of hulpdiensten dat aangeven.")],
        ),
        p(t("Wij bieden "), b("24/7 pechhulp"), t(".")),
      ],
    },
    {
      id: "damage",
      question: "Wat moet ik doen als de huurauto schade heeft?",
      keywords: ["schade", "beschadigd", "ruit", "krassen", "melding", "pechhulp", "support"],
      blocks: [
        list(
          [b("Neem zo snel mogelijk contact met ons op:"), t(" Tijdens "), b("8:00 tot 20:00"), t(" bel je "), b("+599 785 5999"), t(". Na sluitingstijd bel je "), b("+599 785 2604"), t(".")],
          [b("Voor urgente pechhulp:"), t(" Neem contact op met "), b("CRS - Caribbean Road Services"), t(" via "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t(".")],
          [b("Bij een noodgeval:"), t(" Bel "), b("911"), t(" als iemand gewond is of als politie, ambulance of brandweer nodig is.")],
        ),
        p(t("Maak indien mogelijk foto's van de schade en wacht op instructies van ons team of de hulpdiensten.")),
      ],
    },
    {
      id: "theft",
      question: "Wat moet ik doen bij diefstal van de huurauto?",
      keywords: ["diefstal", "gestolen", "politie", "911", "support", "pechhulp"],
      blocks: [
        list(
          [b("Bel Aloha Car Rental direct:"), t(" Tijdens "), b("8:00 tot 20:00"), t(" bel je "), b("+599 785 5999"), t(". Na sluitingstijd bel je "), b("+599 785 2604"), t(".")],
          [b("Meld het bij de hulpdiensten:"), t(" Bel meteen "), b("911"), t(" om de politie in te schakelen.")],
          [b("Hulp nodig bij coördinatie?"), t(" CRS - Caribbean Road Services is ook bereikbaar op "), b("+599 717 9292"), t(" of via WhatsApp "), b("+599 795 9292"), t(".")],
        ),
      ],
    },
    {
      id: "minimum-age",
      question: "Wat is de minimumleeftijd om een voertuig te huren?",
      keywords: ["minimumleeftijd", "leeftijd", "jonge bestuurder", "rijbewijs", "bus", "auto"],
      blocks: [
        p(t("De minimumleeftijd is "), b("19+"), t(" voor voertuigen en "), b("25+"), t(" voor bussen/vans. Je moet ook minimaal één jaar een rijbewijs B hebben.")),
        p(t("Het eigen risico is "), b("$500"), t(" voor voertuigen en "), b("$750"), t(" voor vans. Bestuurders jonger dan "), b("23"), t(" jaar of met minder dan twee jaar rijbewijs B krijgen een verhoogd eigen risico van "), b("$600"), t(", en dat kan niet worden afgekocht.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "Wat zijn de opties voor verzekering en borg?",
      keywords: ["verzekering", "dekking", "borg", "eigen risico", "all risk", "all-risk", "cdw", "basic cdw", "abb", "belasting", "prijs", "prijzen"],
      blocks: [
        p(b("Inbegrepen in de prijs.")),
        p(t("Al onze prijzen zijn inclusief "), b("Basic CDW"), t(" en "), b("6% ABB-belasting"), t(".")),
        p(b("Extra verzekering en borg.")),
        p(t("Je houdt nog steeds een eigen risico van "), b("$500"), t(" voor voertuigen en "), b("$750"), t(" voor vans. Je kunt dit risico verlagen door "), b("$15"), t(" per dag voor voertuigen en "), b("$25"), t(" per dag voor vans te betalen. Bij huur korter dan 4 dagen is er ook een vaste afkoop van "), b("$85"), t(". Uitzonderingen gelden bij te hard rijden, rijden onder invloed of het verlaten van een ongevalslocatie.")),
        p(b("Borgbedrag.")),
        p(t("De borg bedraagt "), b("$250"), t(" voor voertuigen en "), b("$375"), t(" voor vans.")),
      ],
    },
    {
      id: "kilometers",
      question: "Hoeveel kilometers mag ik per dag rijden?",
      keywords: ["kilometers", "kilometerlimiet", "onbeperkt", "afstand"],
      blocks: [p(t("Neem rechtstreeks contact op met Aloha Car Rental voor het kilometerbeleid dat op jouw boeking van toepassing is."))],
    },
    {
      id: "roadside-assistance",
      question: "Hoe bereik ik pechhulp of noodondersteuning?",
      keywords: ["pechhulp", "noodgeval", "support", "hulp", "telefoon", "whatsapp", "kantooruren", "na sluitingstijd", "crs"],
      blocks: [
        p(t("Wij bieden "), b("24/7 pechhulp"), t(".")),
        p(t("Tijdens kantooruren "), b("(8:00 - 20:00)"), t(" bel je onze hoofdlijn op "), b("+599 785 5999"), t(".")),
        p(t("Na sluitingstijd "), b("(20:00 - 8:00)"), t(" bel je onze speciale pechhulplijn op "), b("+599 785 2604"), t(".")),
        p(t("Voor pechhulp en noodgevallen kun je ook "), b("CRS - Caribbean Road Services"), t(" bellen op "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t(".")),
        p(t("Politie, ambulance en brandweer bereik je via "), b("911"), t(".")),
      ],
    },
    {
      id: "payment-methods",
      question: "Accepteren jullie contant geld of creditcards?",
      keywords: ["contant", "cash", "creditcard", "kaart", "maestro", "amex", "visa", "mastercard"],
      blocks: [
        p(t("Ja. Wij accepteren cash, Maestro, Kompa Leon, Visa/Mastercard, Discover/Diners, Amex en andere grote creditcards. Op creditcardbetalingen geldt een "), b("5% administratie"), t(" toeslag.")),
      ],
    },
    {
      id: "euros",
      question: "Kan ik in euro's betalen?",
      keywords: ["euro", "euro's", "valuta", "guilders", "dollars"],
      blocks: [
        p(t("Nee, wij accepteren geen euro's. Contante betalingen kunnen in Caribische guldens of Amerikaanse dollars worden gedaan.")),
        p(t("Je kunt ook betalen met onze mobiele pinmachine van de bank.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "Wat is jullie brandstofbeleid?",
      keywords: ["brandstof", "benzine", "tank", "full to full", "vol-vol"],
      blocks: [
        p(t("Ons brandstofbeleid is "), b("full-to-full"), t(".")),
        p(t("Voertuigen worden met een volle tank geleverd en moeten ook weer vol worden ingeleverd. Als het voertuig niet vol is geleverd, mag je het terugbrengen met hetzelfde niveau.")),
        p(b("Belangrijk:"), t(" Als het brandstofniveau bij inlevering te laag is, geldt een minimumbedrag van "), b("$25"), t(" voor voertuigen en "), b("$35"), t(" voor vans per "), b("1/4 tank"), t(" of deel daarvan.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "Wie mag de huurauto besturen?",
      keywords: ["bestuurder", "extra bestuurder", "gemachtigde bestuurder", "medeondertekenen"],
      blocks: [p(t("De hoofdhuurder en de extra bestuurder die de overeenkomst mede ondertekent en een geldig rijbewijs heeft, mogen rijden."))],
    },
    {
      id: "early-flight-return",
      question: "Waar laat ik het voertuig als mijn vlucht vertrekt vóór openingstijd?",
      keywords: ["vlucht", "vertrek", "openingstijd", "inleveren", "vroeg"],
      blocks: [p(t("Als je retourvlucht vertrekt vóór openingstijd, meld dit dan bij het ophalen. Onze rental agent geeft je dan instructies voor het inleveren."))],
    },
    {
      id: "long-term",
      question: "Bieden jullie langetermijnverhuur aan?",
      keywords: ["langetermijn", "lange termijn", "maandhuur", "extended rental"],
      blocks: [p(t("Ja. Neem contact met ons op via e-mail of WhatsApp om beschikbaarheid en prijzen voor langetermijnhuur te bespreken."))],
    },
    {
      id: "delivery",
      question: "Leveren jullie de auto op een specifieke locatie af?",
      keywords: ["leveren", "afleveren", "specifieke locatie", "hotel", "adres"],
      blocks: [p(t("Ja, we kunnen de huurauto op jouw gewenste locatie afleveren."))],
    },
    {
      id: "airport",
      question: "Kan ik de huurauto op de luchthaven ontvangen?",
      keywords: ["luchthaven", "airport", "aankomst", "ophalen"],
      blocks: [p(t("Ja. Afhankelijk van je vluchttijd kunnen we de auto vlak bij de luchthaven voor je klaarzetten en sturen we vooraf de instructies."))],
    },
    {
      id: "advance-booking",
      question: "Hoe ver van tevoren moet ik mijn huurauto reserveren?",
      keywords: ["reserveren", "van tevoren", "vooraf", "last minute", "24 uur"],
      blocks: [p(t("Je kunt tot één jaar van tevoren reserveren. Voor last-minute boekingen binnen 24 uur kun je ons het beste direct bellen of appen."))],
    },
    {
      id: "minimum-rental-rules",
      question: "Waarom kan ik een heel korte huurperiode niet online boeken?",
      keywords: ["minimum huur", "minimum dagen", "korte huur", "alleen admin", "boekingsregels"],
      blocks: [
        p(t("Voor sommige huurperiodes is een minimum aantal dagen ingesteld in de boekingsflow.")),
        p(t("Als een boeking korter is dan dat minimum, kan de site een extra korte-huurtoeslag toevoegen of vragen dat medewerkers de boeking handmatig afhandelen in plaats van online door te gaan.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "Kan ik een last-minute boeking online maken?",
      keywords: ["last minute", "zelfde dag", "spoedboeking", "24 uur"],
      blocks: [
        p(t("Dat hangt af van de actieve boekingsregels.")),
        p(t("Als je pickup binnen het ingestelde last-minute venster valt, kan de website een extra percentage toevoegen of vereisen dat medewerkers de boeking rechtstreeks verwerken.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "Regelen jullie soms huur met partner-voertuigen?",
      keywords: ["partnerverhuur", "ander bedrijf", "leveranciersauto", "partnervoertuig"],
      blocks: [
        p(t("Ja. In sommige gevallen kan een boeking worden uitgevoerd met een voertuig van een partner in plaats van uit onze eigen opgeslagen vloot.")),
        p(t("Die huur wordt operationeel apart afgehandeld zodat ze niet in de normale publieke vlootinventaris terechtkomt, terwijl de klant wel de normale boekingscommunicatie ontvangt.")),
      ],
    },
  ],
  es: [
    {
      id: "accident",
      question: "¿Qué debo hacer en caso de accidente?",
      keywords: ["accidente", "choque", "colisión", "emergencia", "seguro", "911", "asistencia", "soporte"],
      blocks: [
        list(
          [b("Llame a emergencias:"), t(" Marque "), b("911"), t(" si hay heridos o si alguien necesita atención médica urgente.")],
          [b("Llame a Aloha Car Rental en horario comercial:"), t(" De "), b("8:00 AM a 8:00 PM"), t(", llame a nuestra línea principal "), b("+599 785 5999"), t(".")],
          [b("Llame a asistencia después del horario comercial:"), t(" De "), b("8:00 PM a 8:00 AM"), t(", llame a nuestra línea dedicada "), b("+599 785 2604"), t(".")],
          [b("Asistencia en carretera y emergencias:"), t(" También puede contactar a "), b("CRS - Caribbean Road Services"), t(" por teléfono al "), b("+599 717 9292"), t(" o por WhatsApp al "), b("+599 795 9292"), t(".")],
          [b("Manténgase seguro y espere instrucciones:"), t(" Si el vehículo está en un lugar peligroso, muévalo solo si la policía o los servicios de emergencia se lo indican.")],
        ),
        p(t("Ofrecemos "), b("asistencia en carretera 24/7"), t(".")),
      ],
    },
    {
      id: "damage",
      question: "¿Qué debo hacer si el auto alquilado sufre daños?",
      keywords: ["daño", "daños", "parabrisas", "golpe", "reporte", "asistencia", "soporte"],
      blocks: [
        list(
          [b("Contáctenos lo antes posible:"), t(" Durante "), b("8:00 AM a 8:00 PM"), t(" llame al "), b("+599 785 5999"), t(". Después del horario comercial, llame al "), b("+599 785 2604"), t(".")],
          [b("Para ayuda urgente en carretera:"), t(" Contacte a "), b("CRS - Caribbean Road Services"), t(" al "), b("+599 717 9292"), t(" o por WhatsApp al "), b("+599 795 9292"), t(".")],
          [b("Si hay una emergencia:"), t(" Llame al "), b("911"), t(" de inmediato si alguien está herido o si necesita policía, ambulancia o bomberos.")],
        ),
        p(t("Si puede, tome fotos de los daños y espere instrucciones de nuestro equipo o de los servicios de emergencia.")),
      ],
    },
    {
      id: "theft",
      question: "¿Qué debo hacer si roban el auto alquilado?",
      keywords: ["robo", "robado", "policía", "911", "soporte", "asistencia"],
      blocks: [
        list(
          [b("Llame a Aloha Car Rental inmediatamente:"), t(" Durante "), b("8:00 AM a 8:00 PM"), t(" llame al "), b("+599 785 5999"), t(". Después del horario comercial, llame al "), b("+599 785 2604"), t(".")],
          [b("Repórtelo a emergencias:"), t(" Llame al "), b("911"), t(" de inmediato para notificar a la policía.")],
          [b("¿Necesita coordinación adicional?"), t(" CRS - Caribbean Road Services también está disponible en "), b("+599 717 9292"), t(" o por WhatsApp al "), b("+599 795 9292"), t(".")],
        ),
      ],
    },
    {
      id: "minimum-age",
      question: "¿Cuál es la edad mínima para alquilar un vehículo?",
      keywords: ["edad mínima", "edad", "conductor joven", "licencia", "van", "vehículo"],
      blocks: [
        p(t("La edad mínima es "), b("19+"), t(" para vehículos y "), b("25+"), t(" para vans. Además, debe tener licencia categoría B desde hace al menos un año.")),
        p(t("El deducible es de "), b("$500"), t(" para vehículos y "), b("$750"), t(" para vans. Conductores menores de "), b("23"), t(" años o con menos de dos años de licencia B tienen un deducible aumentado de "), b("$600"), t(", y ese monto no puede eliminarse.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "¿Cuáles son las opciones de seguro y depósito?",
      keywords: ["seguro", "cobertura", "depósito", "deducible", "all risk", "todo riesgo", "cdw", "basic cdw", "abb", "impuesto", "impuestos", "precio", "precios"],
      blocks: [
        p(b("Incluido en el precio.")),
        p(t("Todos nuestros precios incluyen "), b("Basic CDW"), t(" y "), b("6% de impuesto ABB"), t(".")),
        p(b("Seguro adicional y depósito.")),
        p(t("Aún mantiene un deducible de "), b("$500"), t(" para vehículos y "), b("$750"), t(" para vans. Puede reducir ese riesgo pagando "), b("$15"), t(" por día para vehículos y "), b("$25"), t(" por día para vans. En alquileres de menos de 4 días existe una opción fija de "), b("$85"), t(". Hay excepciones en casos de exceso de velocidad, alcohol o abandonar la escena de un accidente.")),
        p(b("Monto del depósito.")),
        p(t("El depósito requerido es de "), b("$250"), t(" para vehículos y "), b("$375"), t(" para vans.")),
      ],
    },
    {
      id: "kilometers",
      question: "¿Cuántos kilómetros puedo conducir por día?",
      keywords: ["kilómetros", "kilometros", "millas", "ilimitado", "distancia"],
      blocks: [p(t("Comuníquese directamente con Aloha Car Rental para confirmar la política de kilometraje aplicable a su reserva."))],
    },
    {
      id: "roadside-assistance",
      question: "¿Cómo contacto la asistencia en carretera o soporte de emergencia?",
      keywords: ["asistencia en carretera", "asistencia", "emergencia", "soporte", "ayuda", "teléfono", "whatsapp", "horario", "fuera de horario", "crs"],
      blocks: [
        p(t("Ofrecemos "), b("asistencia en carretera 24/7"), t(".")),
        p(t("Durante horario comercial "), b("(8:00 AM - 8:00 PM)"), t(", llame a nuestra línea principal al "), b("+599 785 5999"), t(".")),
        p(t("Fuera de horario "), b("(8:00 PM - 8:00 AM)"), t(", llame a nuestra línea dedicada de asistencia al "), b("+599 785 2604"), t(".")),
        p(t("Para asistencia en carretera y emergencias, también puede contactar a "), b("CRS - Caribbean Road Services"), t(" al "), b("+599 717 9292"), t(" o por WhatsApp al "), b("+599 795 9292"), t(".")),
        p(t("Policía, ambulancia y bomberos están disponibles en "), b("911"), t(".")),
      ],
    },
    {
      id: "payment-methods",
      question: "¿Aceptan efectivo o tarjetas de crédito?",
      keywords: ["efectivo", "cash", "tarjeta", "tarjetas", "maestro", "amex", "visa", "mastercard", "pago"],
      blocks: [
        p(t("Sí. Aceptamos efectivo, Maestro, Kompa Leon, Visa/Mastercard, Discover/Diners, Amex y otras tarjetas principales. Los pagos con tarjeta tienen un cargo administrativo de "), b("5%"), t(".")),
      ],
    },
    {
      id: "euros",
      question: "¿Puedo pagar en euros?",
      keywords: ["euro", "euros", "moneda", "guilder", "dólares", "dolares"],
      blocks: [
        p(t("No, no aceptamos euros. Los pagos en efectivo pueden hacerse en florines caribeños o en dólares estadounidenses.")),
        p(t("También puede pagar con nuestra máquina móvil bancaria.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "¿Cuál es su política de combustible?",
      keywords: ["combustible", "gasolina", "tanque", "full to full", "lleno a lleno"],
      blocks: [
        p(t("Nuestra política de combustible es "), b("lleno a lleno"), t(".")),
        p(t("Los vehículos se entregan con el tanque lleno y deben devolverse llenos. Si no se entregó lleno, puede devolverlo con el mismo nivel recibido.")),
        p(b("Importante:"), t(" Si el nivel de combustible es insuficiente al devolverlo, se aplica un cargo mínimo de "), b("$25"), t(" para vehículos y "), b("$35"), t(" para vans por cada "), b("1/4 de tanque"), t(" o fracción.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "¿Quién puede conducir el auto alquilado?",
      keywords: ["conductor", "conductor adicional", "autorizado", "cofirmante", "cosign"],
      blocks: [p(t("Puede conducir el arrendatario principal y el conductor adicional que firme el contrato y tenga licencia válida."))],
    },
    {
      id: "early-flight-return",
      question: "¿Dónde dejo el vehículo si mi vuelo sale antes del horario de apertura?",
      keywords: ["vuelo", "salida", "horario", "devolución", "temprano"],
      blocks: [p(t("Si su vuelo de regreso sale antes del horario de apertura, informe al agente al recoger el vehículo. Le dará las instrucciones para la devolución."))],
    },
    {
      id: "long-term",
      question: "¿Ofrecen alquileres a largo plazo?",
      keywords: ["largo plazo", "alquiler largo", "mensual", "extended rental"],
      blocks: [p(t("Sí. Contáctenos por correo o WhatsApp para consultar disponibilidad y precios de alquiler a largo plazo."))],
    },
    {
      id: "delivery",
      question: "¿Entregan el auto en una ubicación específica?",
      keywords: ["entrega", "entregar", "ubicación específica", "hotel", "dirección"],
      blocks: [p(t("Sí, podemos entregar el auto de alquiler en la ubicación que prefiera."))],
    },
    {
      id: "airport",
      question: "¿Puedo recibir el auto de alquiler en el aeropuerto?",
      keywords: ["aeropuerto", "llegada", "recibir auto", "recoger"],
      blocks: [p(t("Sí. Dependiendo del horario de su vuelo, podemos tener el auto listo cerca del aeropuerto y enviarle instrucciones antes de su llegada."))],
    },
    {
      id: "advance-booking",
      question: "¿Con cuánta anticipación debo reservar mi auto de alquiler?",
      keywords: ["reservar", "anticipación", "adelantado", "último minuto", "24 horas"],
      blocks: [p(t("Puede reservar hasta con un año de anticipación. Para reservas de último minuto dentro de 24 horas, contáctenos directamente por WhatsApp o teléfono."))],
    },
    {
      id: "minimum-rental-rules",
      question: "¿Por qué no puedo reservar un alquiler muy corto en línea?",
      keywords: ["alquiler mínimo", "días mínimos", "alquiler corto", "solo admin", "reglas de reserva"],
      blocks: [
        p(t("Algunos alquileres tienen un número mínimo de días configurado en el flujo de reservas.")),
        p(t("Si una reserva es más corta que ese mínimo, el sitio puede aplicar un recargo por alquiler corto o pedir que el personal la gestione manualmente en lugar de dejar continuar al público en línea.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "¿Puedo hacer una reserva de última hora en línea?",
      keywords: ["última hora", "mismo día", "reserva urgente", "24 horas"],
      blocks: [
        p(t("Depende de las reglas activas de reserva.")),
        p(t("Si la recogida cae dentro de la ventana configurada de última hora, el sitio puede añadir un porcentaje extra o requerir que el personal gestione la reserva directamente.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "¿A veces gestionan alquileres con vehículos de socios?",
      keywords: ["alquiler de socios", "otra empresa", "vehículo de proveedor", "vehículo socio"],
      blocks: [
        p(t("Sí. En algunos casos una reserva puede cumplirse con un vehículo suministrado por un socio en lugar de uno de nuestra flota guardada.")),
        p(t("Esos alquileres se gestionan por separado en la parte operativa para no mezclarse con el inventario público normal, mientras el cliente sigue recibiendo la comunicación habitual de la reserva.")),
      ],
    },
  ],
};

const systemFaqByLocale: Record<FaqLocale, FaqEntry[]> = {
  en: [
    {
      id: "system-online-booking",
      question: "How does the online booking system work?",
      keywords: ["online booking", "website", "reservations", "availability", "booking flow"],
      blocks: [
        p(t("Customers can browse active categories, choose dates and locations, add extras, and submit a booking through the public website.")),
        p(t("Availability and pricing are calculated from the configured fleet, rates, minimum booking rules, and active operational restrictions.")),
      ],
    },
    {
      id: "system-double-booking",
      question: "How does the system prevent double bookings?",
      keywords: ["double booking", "overlap", "conflict", "availability", "inventory"],
      blocks: [
        p(t("The platform checks vehicle availability against active bookings and vehicle blockouts before confirming a reservation.")),
        p(t("This keeps the same vehicle from being allocated to overlapping rental periods.")),
      ],
    },
    {
      id: "system-fleet",
      question: "What fleet management features are included?",
      keywords: ["fleet", "vehicles", "status", "maintenance", "blockouts"],
      blocks: [
        list(
          [t("Vehicle categories with pricing and feature setup")],
          [t("Vehicle status tracking for active, on-rent, maintenance, and inactive units")],
          [t("Vehicle blockouts for service, repairs, or internal use")],
          [t("Pickup and dropoff location management")],
        ),
      ],
    },
    {
      id: "system-billing",
      question: "Does the platform support invoices and accounting integrations?",
      keywords: ["invoice", "billing", "quickbooks", "zoho", "payments", "accounting"],
      blocks: [
        p(t("Yes. The system supports booking totals, payment tracking, invoice generation, and accounting workflows.")),
        p(t("It can be configured for QuickBooks Online and Zoho Invoice integrations where those modules are enabled.")),
      ],
    },
    {
      id: "system-documents",
      question: "Can customers upload licenses and documents?",
      keywords: ["license", "document", "upload", "driver license", "files"],
      blocks: [
        p(t("Yes. The booking flow supports driver-license and document uploads for rental validation workflows.")),
        p(t("Access to uploaded files is restricted inside the admin system according to the configured permissions and retention rules.")),
      ],
    },
    {
      id: "system-localization",
      question: "Is the system ready for Caribbean operations?",
      keywords: ["caribbean", "languages", "islands", "currencies", "pickup", "airport"],
      blocks: [
        p(t("The platform is built around Caribbean rental operations, including island pickup and return workflows, multi-location handling, and multilingual public pages.")),
        p(t("The current product includes English, Spanish, and Dutch language support.")),
      ],
    },
    {
      id: "system-users",
      question: "Can the system be used by a team?",
      keywords: ["users", "team", "roles", "admin", "permissions"],
      blocks: [
        p(t("Yes. Admin access is designed for operational teams managing bookings, fleet, returns, billing, and reviews.")),
        p(t("Role-based access can be used to control which staff members can view or update specific areas.")),
      ],
    },
    {
      id: "system-deployment",
      question: "Can this system be reused for new rental brands or SaaS deployments?",
      keywords: ["deployment", "tenant", "branding", "saas", "reuse", "white label"],
      blocks: [
        p(t("Yes. Branding, tenant settings, metadata, and FAQ content can be adapted for a rental company deployment or for a SaaS/system marketing deployment.")),
        p(t("This codebase now keeps separate rental and system content profiles to reduce copy mismatches during future rollouts.")),
      ],
    },
  ],
  nl: [
    {
      id: "system-online-booking",
      question: "Hoe werkt het online boekingssysteem?",
      keywords: ["online boeken", "website", "reserveringen", "beschikbaarheid", "boekingsflow"],
      blocks: [
        p(t("Klanten kunnen actieve categorieën bekijken, datums en locaties kiezen, extra's toevoegen en een reservering indienen via de publieke website.")),
        p(t("Beschikbaarheid en tarieven worden berekend op basis van de ingestelde vloot, prijstabellen, minimale huurregels en actieve operationele beperkingen.")),
      ],
    },
    {
      id: "system-double-booking",
      question: "Hoe voorkomt het systeem dubbele reserveringen?",
      keywords: ["dubbele reservering", "overlap", "conflict", "beschikbaarheid", "inventory"],
      blocks: [
        p(t("Het platform controleert de beschikbaarheid van voertuigen tegen actieve reserveringen en blockouts voordat een boeking wordt bevestigd.")),
        p(t("Daardoor kan hetzelfde voertuig niet aan overlappende huurperiodes worden toegewezen.")),
      ],
    },
    {
      id: "system-fleet",
      question: "Welke vlootbeheerfuncties zijn inbegrepen?",
      keywords: ["vloot", "voertuigen", "status", "onderhoud", "blockouts"],
      blocks: [
        list(
          [t("Voertuigcategorieën met prijs- en featureconfiguratie")],
          [t("Statusbeheer voor actieve, verhuurde, onderhouds- en inactieve voertuigen")],
          [t("Voertuigblockouts voor service, reparaties of intern gebruik")],
          [t("Beheer van pickup- en dropofflocaties")],
        ),
      ],
    },
    {
      id: "system-billing",
      question: "Ondersteunt het platform facturen en boekhoudintegraties?",
      keywords: ["factuur", "boekhouding", "quickbooks", "zoho", "betalingen", "billing"],
      blocks: [
        p(t("Ja. Het systeem ondersteunt boekingstotalen, betalingsregistratie, factuurgeneratie en boekhoudworkflows.")),
        p(t("Het kan worden ingericht voor integraties met QuickBooks Online en Zoho Invoice wanneer die modules zijn ingeschakeld.")),
      ],
    },
    {
      id: "system-documents",
      question: "Kunnen klanten rijbewijzen en documenten uploaden?",
      keywords: ["rijbewijs", "document", "upload", "bestanden", "license"],
      blocks: [
        p(t("Ja. De boekingsflow ondersteunt uploads van rijbewijzen en documenten voor validatie tijdens het verhuurproces.")),
        p(t("Toegang tot geüploade bestanden is binnen het adminsysteem beperkt volgens de ingestelde rechten en retentieregels.")),
      ],
    },
    {
      id: "system-localization",
      question: "Is het systeem geschikt voor Caribische verhuurprocessen?",
      keywords: ["caribisch", "talen", "eilanden", "luchthaven", "pickup", "return"],
      blocks: [
        p(t("Het platform is gebouwd rond Caribische verhuurprocessen, inclusief eiland-specifieke pickup- en returnflows, meerdere locaties en meertalige publieke pagina's.")),
        p(t("Het product ondersteunt momenteel Engels, Spaans en Nederlands.")),
      ],
    },
    {
      id: "system-users",
      question: "Kan het systeem door een team worden gebruikt?",
      keywords: ["gebruikers", "team", "rollen", "admin", "rechten"],
      blocks: [
        p(t("Ja. Admin-toegang is bedoeld voor teams die reserveringen, vloot, retouren, facturatie en reviews beheren.")),
        p(t("Rolgebaseerde toegang kan worden gebruikt om te bepalen welke medewerkers specifieke onderdelen mogen bekijken of aanpassen.")),
      ],
    },
    {
      id: "system-deployment",
      question: "Kan dit systeem opnieuw worden gebruikt voor nieuwe verhuurmerken of SaaS-deployments?",
      keywords: ["deployment", "tenant", "branding", "saas", "hergebruik", "white label"],
      blocks: [
        p(t("Ja. Branding, tenantinstellingen, metadata en FAQ-inhoud kunnen worden aangepast voor een verhuurbedrijf of voor een SaaS-/systeemdeployment.")),
        p(t("Deze codebase bewaart nu aparte rental- en system-profielen om copy-mismatches bij toekomstige uitrol te voorkomen.")),
      ],
    },
  ],
  es: [
    {
      id: "system-online-booking",
      question: "¿Cómo funciona el sistema de reservas en línea?",
      keywords: ["reservas en línea", "sitio web", "disponibilidad", "flujo de reserva"],
      blocks: [
        p(t("Los clientes pueden ver categorías activas, elegir fechas y ubicaciones, agregar extras y enviar una reserva desde el sitio público.")),
        p(t("La disponibilidad y los precios se calculan según la flota configurada, las tarifas, las reglas mínimas de reserva y las restricciones operativas activas.")),
      ],
    },
    {
      id: "system-double-booking",
      question: "¿Cómo evita el sistema las reservas duplicadas?",
      keywords: ["reserva duplicada", "solapamiento", "conflicto", "disponibilidad", "inventario"],
      blocks: [
        p(t("La plataforma revisa la disponibilidad del vehículo frente a reservas activas y bloqueos antes de confirmar una reserva.")),
        p(t("Eso evita que el mismo vehículo se asigne a periodos de alquiler superpuestos.")),
      ],
    },
    {
      id: "system-fleet",
      question: "¿Qué funciones de gestión de flota incluye?",
      keywords: ["flota", "vehículos", "estado", "mantenimiento", "bloqueos"],
      blocks: [
        list(
          [t("Categorías de vehículos con configuración de precios y características")],
          [t("Seguimiento de estado para unidades activas, alquiladas, en mantenimiento e inactivas")],
          [t("Bloqueos de vehículos por servicio, reparaciones o uso interno")],
          [t("Gestión de ubicaciones de recogida y entrega")],
        ),
      ],
    },
    {
      id: "system-billing",
      question: "¿La plataforma soporta facturas e integraciones contables?",
      keywords: ["factura", "contabilidad", "quickbooks", "zoho", "pagos", "billing"],
      blocks: [
        p(t("Sí. El sistema soporta totales de reserva, seguimiento de pagos, generación de facturas y flujos contables.")),
        p(t("Puede configurarse para integraciones con QuickBooks Online y Zoho Invoice cuando esos módulos estén habilitados.")),
      ],
    },
    {
      id: "system-documents",
      question: "¿Los clientes pueden subir licencias y documentos?",
      keywords: ["licencia", "documento", "subida", "archivos", "driver license"],
      blocks: [
        p(t("Sí. El flujo de reserva admite la carga de licencias y documentos para validación dentro del proceso de alquiler.")),
        p(t("El acceso a los archivos subidos queda restringido dentro del sistema administrativo según permisos y reglas de retención.")),
      ],
    },
    {
      id: "system-localization",
      question: "¿El sistema está preparado para operaciones del Caribe?",
      keywords: ["caribe", "idiomas", "islas", "aeropuerto", "recogida", "devolución"],
      blocks: [
        p(t("La plataforma está construida para operaciones de alquiler en el Caribe, incluyendo flujos de recogida y devolución en islas, múltiples ubicaciones y páginas públicas multilingües.")),
        p(t("Actualmente el producto incluye soporte en inglés, español y neerlandés.")),
      ],
    },
    {
      id: "system-users",
      question: "¿Puede usarlo un equipo de trabajo?",
      keywords: ["usuarios", "equipo", "roles", "admin", "permisos"],
      blocks: [
        p(t("Sí. El acceso administrativo está pensado para equipos que gestionan reservas, flota, devoluciones, facturación y reseñas.")),
        p(t("El acceso por roles puede usarse para controlar qué miembros del equipo pueden ver o editar áreas específicas.")),
      ],
    },
    {
      id: "system-deployment",
      question: "¿Puede reutilizarse este sistema para nuevas marcas de alquiler o despliegues SaaS?",
      keywords: ["despliegue", "tenant", "branding", "saas", "reutilizar", "white label"],
      blocks: [
        p(t("Sí. La marca, la configuración del tenant, los metadatos y el contenido del FAQ pueden adaptarse tanto para una empresa de alquiler como para una implantación SaaS o de sistema.")),
        p(t("Este código ahora mantiene perfiles separados de rental y system para evitar mezclar textos en futuros despliegues.")),
      ],
    },
  ],
};

const faqByProfile: Record<FaqProfile, Record<FaqLocale, FaqEntry[]>> = {
  rental: rentalFaqByLocale,
  system: systemFaqByLocale,
};

export function getFaqEntries(locale: string, profile: FaqProfile = DEFAULT_FAQ_PROFILE): FaqEntry[] {
  return faqByProfile[profile][coerceFaqLocale(locale)];
}

export function faqBlocksToPlainText(blocks: FaqBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "list") {
        return block.items.map((item, index) => `${index + 1}. ${item.map((run) => run.text).join("")}`).join(" ");
      }
      return block.runs.map((run) => run.text).join("");
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeFaqSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s+/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFaqAssistantCopy(locale: string, profile: FaqProfile = DEFAULT_FAQ_PROFILE): FaqAssistantCopy {
  const normalizedLocale = coerceFaqLocale(locale);
  const isSystemProfile = profile === "system";

  if (normalizedLocale === "es") {
    return {
      title: "Asistente FAQ",
      welcome: isSystemProfile
        ? "Haz una pregunta sobre reservas en línea, flota, facturación, roles o despliegue del sistema y responderé con la información del FAQ."
        : "Haz una pregunta sobre alquileres, pagos, depósito, combustible, aeropuerto o soporte y responderé con la información del FAQ.",
      notFound: isSystemProfile
        ? "No encontré una respuesta directa en el FAQ del sistema. Abre la página FAQ o contacta al equipo para más detalles."
        : "No encontré una respuesta directa en el FAQ. Abre la página FAQ o contáctanos por WhatsApp para recibir ayuda.",
      readMore: "Lee más en la página de FAQ.",
      openWhatsapp: "Abrir WhatsApp",
      askPlaceholder: "Haz una pregunta...",
    };
  }

  if (normalizedLocale === "nl") {
    return {
      title: "FAQ Assistent",
      welcome: isSystemProfile
        ? "Stel een vraag over online boekingen, vlootbeheer, facturatie, rollen of systeemdeployment en ik antwoord met info uit de FAQ."
        : "Stel een vraag over huur, betaling, borg, brandstof, luchthaven of support en ik antwoord met info uit de FAQ.",
      notFound: isSystemProfile
        ? "Ik vond geen direct antwoord in de systeem-FAQ. Open de FAQ-pagina of neem contact op met het team voor meer details."
        : "Ik vond geen direct antwoord in de FAQ. Open de FAQ-pagina of neem contact op via WhatsApp voor hulp.",
      readMore: "Lees meer op de FAQ-pagina.",
      openWhatsapp: "Open WhatsApp",
      askPlaceholder: "Stel een vraag...",
    };
  }

  return {
    title: "FAQ Assistant",
    welcome: isSystemProfile
      ? "Ask about online booking, fleet operations, billing, user roles, or system deployment and I’ll answer from the FAQ."
      : "Ask about rentals, payments, deposit, fuel, airport pickup, or support and I’ll answer from the FAQ.",
    notFound: isSystemProfile
      ? "I couldn’t find a direct answer in the system FAQ. Open the FAQ page or contact the team for more detail."
      : "I couldn’t find a direct FAQ answer. Open the FAQ page or contact us on WhatsApp for help.",
    readMore: "Read more on the FAQ page.",
    openWhatsapp: "Open WhatsApp",
    askPlaceholder: "Ask a question...",
  };
}
