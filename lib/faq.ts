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
      keywords: ["accident", "crash", "collision", "emergency", "911", "police", "crs", "roadside", "report"],
      blocks: [
        list(
          [b("Call Police/Emergency Services:"), t(" Dial "), b("911"), t(" if anyone is injured, needs urgent medical help, or the accident must be reported to the police.")],
          [b("Call roadside service (CRS):"), t(" It is mandatory to contact "), b("CRS - Caribbean Road Services"), t(" by phone at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(".")],
          [b("Notify us immediately:"), t(" After contacting CRS, let us know right away so we can coordinate the next steps.")],
          [b("Do not move the vehicle:"), t(" Wait for CRS to instruct you. Move the car only after CRS staff or the police say it is safe.")],
          [b("Do not leave the scene:"), t(" Stay there until CRS finishes the report.")],
        ),
        p(t("Without the CRS report, insurance coverage can be void and the lessee may be responsible for all costs.")),
        p(t("Following these steps helps document the incident properly and protects your coverage.")),
      ],
    },
    {
      id: "damage",
      question: "What should I do if the rental car is damaged?",
      keywords: ["damage", "damaged", "windshield", "scratch", "parking damage", "stone", "report", "crs"],
      blocks: [
        list(
          [b("Do not move the car:"), t(" Leave the vehicle where the damage happened, whether it was a post, stone, windshield damage, parking damage, or a road accident.")],
          [b("Contact CRS immediately:"), t(" Call "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(". They usually arrive quickly, take photos, and ask for your statement.")],
          [b("Notify us immediately:"), t(" After contacting CRS, let us know right away so we can coordinate the next steps.")],
          [b("Follow instructions:"), t(" Move the car only after CRS staff or the police say it is safe.")],
        ),
        p(t("This procedure keeps the incident documented correctly through the CRS report and helps keep your insurance valid.")),
        p(t("Without that report, insurance coverage can be void and the lessee may have to pay all costs.")),
      ],
    },
    {
      id: "minimum-age",
      question: "What is the minimum age to rent a vehicle?",
      keywords: ["minimum age", "age", "young driver", "19", "20", "21", "deposit", "vehicle"],
      blocks: [
        p(t("The standard minimum age to rent a vehicle is "), b("21 years old"), t(".")),
        p(t("We also accept drivers aged "), b("19 and 20"), t(", but they are subject to a higher security deposit of "), b("$750"), t(".")),
        p(t("Drivers aged "), b("21 and over"), t(" require the standard deposit of "), b("$500"), t(".")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "What are your insurance coverage and deposit options?",
      keywords: ["insurance", "coverage", "deposit", "security deposit", "premium coverage", "premium", "cdw", "basic cdw"],
      blocks: [
        p(t("All of our vehicles include "), b("Basic Collision Damage Waiver (CDW)"), t(" as standard.")),
        p(t("For added peace of mind, we also offer "), b("Premium Coverage"), t(" options to further reduce your liability.")),
        p(t("The required security deposit depends on the driver's age: "), b("$750"), t(" for ages "), b("19-20"), t(", and "), b("$500"), t(" for ages "), b("21 and over"), t(".")),
      ],
    },
    {
      id: "kilometers",
      question: "How many kilometers can I drive per day?",
      keywords: ["kilometers", "kilometres", "mileage", "unlimited", "distance"],
      blocks: [p(t("Unlimited mileage."))],
    },
    {
      id: "roadside-assistance",
      question: "How do I reach roadside assistance or emergency support?",
      keywords: ["roadside assistance", "roadside", "emergency", "support", "help", "breakdown", "won't start", "warning light", "crs"],
      blocks: [
        p(t("We provide "), b("24/7 roadside assistance"), t(".")),
        p(t("For accidents or vehicle damage, contact "), b("CRS - Caribbean Road Services"), t(" at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(".")),
        p(t("If the car breaks down, will not start, or you have another technical issue, contact "), b("Road Service Bonaire at +599 785 2604"), t(" immediately.")),
        p(t("If anyone is injured or emergency services are needed, call "), b("911"), t(".")),
      ],
    },
    {
      id: "payment-methods",
      question: "Do you accept cash or credit cards?",
      keywords: ["cash", "credit card", "cards", "maestro", "visa", "mastercard", "discover", "diners", "amex", "american express", "payment"],
      blocks: [
        p(t("We accept cash "), b("(US dollars)"), t(", Maestro, Visa, Mastercard, Discover, and Diners Club credit cards.")),
        p(t("A "), b("6% administration fee"), t(" applies to all credit card payments.")),
        p(b("Important:"), t(" We do not accept "), b("American Express (AMEX)"), t(".")),
      ],
    },
    {
      id: "euros",
      question: "Can I pay in euros?",
      keywords: ["euro", "euros", "currency", "guilders", "dollars"],
      blocks: [
        p(t("No, we do not accept euros. Cash payments can be made in "), b("US dollars ($)"), t(".")),
        p(t("You can also pay using our bank mobile pin machine.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "What is your fuel policy?",
      keywords: ["fuel", "gas", "petrol", "tank", "full to full", "full-to-full", "pickup", "pickups"],
      blocks: [
        p(t("Our fuel policy is "), b("full-to-full"), t(".")),
        p(t("Vehicles are delivered with a full tank and must be returned with a full tank. If the vehicle was not delivered full, you may return it with the same level received.")),
        p(b("Important:"), t(" If the fuel level is too low at return, a minimum charge of "), b("$25"), t(" for vehicles and "), b("$35"), t(" for pickups applies for every "), b("1/4 tank"), t(" or part of it.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "Who is allowed to drive the rental car?",
      keywords: ["driver", "additional driver", "authorized driver", "co-sign", "co signer", "co-signs"],
      blocks: [p(t("The primary renter and the additional driver who co-signs the agreement and has a valid driving license may drive the vehicle."))],
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
      keywords: ["delivery", "deliver", "specific location", "hotel", "address", "shuttle", "office", "rincon"],
      blocks: [
        p(t("No, we do not offer vehicle delivery to specific locations or hotels.")),
        p(t("All rentals must be collected at our main office, located just "), b("5 minutes from the airport"), t(".")),
        p(t("We provide a "), b("complimentary shuttle service"), t(" to our office from the airport, hotels, and most parts of Bonaire.")),
        p(t("Please note that shuttles to and from "), b("Rincon"), t(" are available for an additional fee.")),
      ],
    },
    {
      id: "airport",
      question: "Can I receive the rental car at the airport?",
      keywords: ["airport", "arrival", "pickup airport", "receive car", "terminal", "desk", "shuttle", "pick-up service"],
      blocks: [
        p(t("While we do not have a desk directly inside the terminal, our main office is located just a "), b("5-minute drive away"), t(".")),
        p(t("We provide a "), b("complimentary pick-up service"), t(" from the airport to our office so you can collect your vehicle quickly and easily.")),
      ],
    },
    {
      id: "advance-booking",
      question: "How far in advance should I reserve my rental car?",
      keywords: ["reserve", "book in advance", "advance", "how far", "how early", "last minute", "24 hours"],
      blocks: [p(t("Please reserve your rental car at least "), b("2 days in advance"), t(". For last-minute bookings within 24 hours, contact us directly by WhatsApp or phone."))],
    },
    {
      id: "minimum-rental-rules",
      question: "Why can’t I book a very short rental online?",
      keywords: ["minimum rental", "minimum days", "short rental", "3-day minimum", "three day minimum", "premium rate"],
      blocks: [
        p(t("Online bookings are optimized for our "), b("3-day minimum"), t(" to give you the best value.")),
        p(t("Shorter rental durations are available at a "), b("premium rate"), t(". Please call us or send us a WhatsApp message.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "Can I make a last-minute booking online?",
      keywords: ["last minute", "same day", "same-day", "urgent booking", "24 hours", "within 24 hours"],
      blocks: [
        p(t("For last-minute bookings within "), b("24 hours"), t(", contact us directly by WhatsApp or phone.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "Do you sometimes arrange rentals with partner vehicles?",
      keywords: ["partner rentals", "outside company", "supplier car", "other company", "partner vehicle", "affiliate network", "fully booked", "sold out"],
      blocks: [
        p(t("Yes. We leverage a "), b("wide affiliate network"), t(" to find you the right car, even if it is not in our immediate inventory.")),
        p(t("If you see that we are "), b("fully booked"), t(" for your dates, contact us immediately. We may still be able to secure a vehicle through our local partners.")),
      ],
    },
    {
      id: "taxes-insurance",
      question: "Do your rental prices include taxes and insurance?",
      keywords: ["taxes", "tax", "insurance included", "included insurance", "abb", "cdw", "prices include"],
      blocks: [
        p(t("Yes, our rates are transparent.")),
        p(t("All prices include "), b("6% ABB (sales tax)"), t(" and "), b("Basic Collision Damage Waiver (CDW)"), t(" insurance.")),
        p(t("For even more protection, you can upgrade to "), b("Premium Coverage"), t(" at the counter for an additional daily fee.")),
        p(t("This upgrade further reduces your financial responsibility in the event of damage.")),
      ],
    },
    {
      id: "wrong-fuel",
      question: "What should I do if I fill the car with the wrong fuel?",
      keywords: ["wrong fuel", "misfuel", "diesel", "gasoline", "petrol in diesel", "wrong gas"],
      blocks: [
        p(b("Do not start the engine.")),
        p(t("Contact us immediately for further instructions.")),
        p(t("Costs for misfueling and any resulting engine damage are not covered by standard insurance.")),
      ],
    },
    {
      id: "lost-keys",
      question: "What should I do if I lose my car keys?",
      keywords: ["lost key", "lost keys", "key replacement", "replacement key", "missing key"],
      blocks: [
        p(t("Contact us immediately.")),
        p(t("We will arrange for a replacement key.")),
        p(t("The costs for key replacement and delivery are usually charged to the renter.")),
      ],
    },
    {
      id: "warning-light",
      question: "What should I do if a warning light appears on the dashboard?",
      keywords: ["warning light", "dashboard light", "engine light", "check engine", "dashboard"],
      blocks: [
        p(t("If a warning light appears, please park the car in a safe location and contact us immediately.")),
        p(t("We will assist you right away so you can continue your trip safely.")),
      ],
    },
    {
      id: "breakdown",
      question: "What should I do if the car breaks down or won't start?",
      keywords: ["break down", "breakdown", "won't start", "car won't start", "technical issue", "road service bonaire", "+599 785 2604"],
      blocks: [
        p(t("We provide "), b("24/7 roadside assistance"), t(" for your peace of mind.")),
        p(t("If you experience any technical issues, contact "), b("Road Service Bonaire at +599 785 2604"), t(" immediately.")),
        p(t("For safety and insurance reasons, do not attempt to perform any repairs yourself without our authorization.")),
      ],
    },
  ],
  nl: [
    {
      id: "accident",
      question: "Wat moet ik doen bij een ongeval?",
      keywords: ["ongeval", "ongeluk", "aanrijding", "noodgeval", "911", "politie", "crs", "pechhulp", "rapport"],
      blocks: [
        list(
          [b("Bel politie/hulpdiensten:"), t(" Bel "), b("911"), t(" als er gewonden zijn, dringende medische hulp nodig is, of het ongeval bij de politie moet worden gemeld.")],
          [b("Bel pechdienst (CRS):"), t(" Het is verplicht om "), b("CRS - Caribbean Road Services"), t(" te bellen op "), b("+599 717 9292"), t(" of te appen via "), b("+599 795 9292"), t(".")],
          [b("Informeer ons direct:"), t(" Laat het ons meteen weten nadat je CRS hebt gesproken, zodat wij de volgende stappen kunnen coördineren.")],
          [b("Verplaats het voertuig niet:"), t(" Wacht op instructies van CRS. Verplaats de auto alleen als CRS-medewerkers of de politie aangeven dat het veilig is.")],
          [b("Verlaat de plaats niet:"), t(" Blijf ter plaatse totdat CRS het rapport heeft afgerond.")],
        ),
        p(t("Zonder het CRS-rapport kan de verzekeringsdekking vervallen en kan de huurder aansprakelijk worden voor alle kosten.")),
        p(t("Door deze stappen te volgen wordt het incident correct vastgelegd en blijft je dekking beschermd.")),
      ],
    },
    {
      id: "damage",
      question: "Wat moet ik doen als de huurauto schade heeft?",
      keywords: ["schade", "beschadigd", "ruit", "krassen", "parkeerschade", "steen", "rapport", "crs"],
      blocks: [
        list(
          [b("Verplaats de auto niet:"), t(" Laat het voertuig staan waar de schade is ontstaan, of dat nu door een paal, steen, ruitschade, parkeerschade of een verkeersongeval komt.")],
          [b("Neem direct contact op met CRS:"), t(" Bel "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t(". Zij arriveren meestal snel, maken foto's en nemen je verklaring op.")],
          [b("Informeer ons direct:"), t(" Laat het ons meteen weten nadat je CRS hebt gecontacteerd, zodat wij de volgende stappen kunnen coördineren.")],
          [b("Volg de instructies:"), t(" Verplaats de auto alleen als CRS-medewerkers of de politie aangeven dat het veilig is.")],
        ),
        p(t("Deze procedure zorgt ervoor dat het incident correct wordt vastgelegd via het CRS-rapport en helpt om je verzekering geldig te houden.")),
        p(t("Zonder dat rapport kan de verzekeringsdekking vervallen en kan de huurder alle kosten moeten betalen.")),
      ],
    },
    {
      id: "minimum-age",
      question: "Wat is de minimumleeftijd om een voertuig te huren?",
      keywords: ["minimumleeftijd", "leeftijd", "jonge bestuurder", "19", "20", "21", "borg", "voertuig"],
      blocks: [
        p(t("De standaard minimumleeftijd om een voertuig te huren is "), b("21 jaar"), t(".")),
        p(t("Wij accepteren ook bestuurders van "), b("19 en 20 jaar"), t(", maar daarvoor geldt een hogere waarborgsom van "), b("$750"), t(".")),
        p(t("Bestuurders van "), b("21 jaar en ouder"), t(" betalen de standaardborg van "), b("$500"), t(".")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "Wat zijn de opties voor verzekering en borg?",
      keywords: ["verzekering", "dekking", "borg", "waarborgsom", "premium dekking", "premium", "cdw", "basic cdw"],
      blocks: [
        p(t("Al onze voertuigen zijn standaard inclusief "), b("Basic Collision Damage Waiver (CDW)"), t(".")),
        p(t("Voor extra gemoedsrust bieden we ook "), b("Premium Coverage"), t(" aan, waarmee je aansprakelijkheid verder wordt verlaagd.")),
        p(t("De vereiste waarborgsom hangt af van de leeftijd van de bestuurder: "), b("$750"), t(" voor leeftijden "), b("19-20"), t(", en "), b("$500"), t(" voor "), b("21 jaar en ouder"), t(".")),
      ],
    },
    {
      id: "kilometers",
      question: "Hoeveel kilometers mag ik per dag rijden?",
      keywords: ["kilometers", "kilometerlimiet", "onbeperkt", "afstand"],
      blocks: [p(t("Onbeperkt aantal kilometers."))],
    },
    {
      id: "roadside-assistance",
      question: "Hoe bereik ik pechhulp of noodondersteuning?",
      keywords: ["pechhulp", "noodgeval", "support", "hulp", "storing", "start niet", "waarschuwingslampje", "crs"],
      blocks: [
        p(t("Wij bieden "), b("24/7 pechhulp"), t(".")),
        p(t("Bij ongevallen of voertuigschaade neem je contact op met "), b("CRS - Caribbean Road Services"), t(" via "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t(".")),
        p(t("Als de auto pech heeft, niet start of een ander technisch probleem heeft, neem dan direct contact op met "), b("Road Service Bonaire via +599 785 2604"), t(".")),
        p(t("Als er gewonden zijn of hulpdiensten nodig zijn, bel dan "), b("911"), t(".")),
      ],
    },
    {
      id: "payment-methods",
      question: "Accepteren jullie contant geld of creditcards?",
      keywords: ["contant", "cash", "creditcard", "kaart", "maestro", "visa", "mastercard", "discover", "diners", "amex", "american express", "betaling"],
      blocks: [
        p(t("Wij accepteren contant geld "), b("(Amerikaanse dollars)"), t(", Maestro, Visa, Mastercard, Discover en Diners Club creditcards.")),
        p(t("Op alle creditcardbetalingen geldt een "), b("6% administratietoeslag"), t(".")),
        p(b("Belangrijk:"), t(" Wij accepteren "), b("geen American Express (AMEX)"), t(".")),
      ],
    },
    {
      id: "euros",
      question: "Kan ik in euro's betalen?",
      keywords: ["euro", "euro's", "valuta", "guilders", "dollars"],
      blocks: [
        p(t("Nee, wij accepteren geen euro's. Contante betalingen kunnen worden gedaan in "), b("Amerikaanse dollars ($)"), t(".")),
        p(t("Je kunt ook betalen met onze mobiele pinmachine van de bank.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "Wat is jullie brandstofbeleid?",
      keywords: ["brandstof", "benzine", "tank", "full to full", "vol-vol", "pickup", "pickups"],
      blocks: [
        p(t("Ons brandstofbeleid is "), b("full-to-full"), t(".")),
        p(t("Voertuigen worden met een volle tank geleverd en moeten ook weer vol worden ingeleverd. Als het voertuig niet vol is geleverd, mag je het terugbrengen met hetzelfde niveau.")),
        p(b("Belangrijk:"), t(" Als het brandstofniveau bij inlevering te laag is, geldt een minimumbedrag van "), b("$25"), t(" voor voertuigen en "), b("$35"), t(" voor pickups per "), b("1/4 tank"), t(" of deel daarvan.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "Wie mag de huurauto besturen?",
      keywords: ["bestuurder", "extra bestuurder", "gemachtigde bestuurder", "medeondertekenen", "co signer", "medeondertekent"],
      blocks: [p(t("De hoofdhuurder en de extra bestuurder die de overeenkomst mede ondertekent en een geldig rijbewijs heeft, mogen rijden."))],
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
      keywords: ["leveren", "afleveren", "specifieke locatie", "hotel", "adres", "shuttle", "kantoor", "rincon"],
      blocks: [
        p(t("Nee, wij leveren geen voertuigen af op specifieke locaties of bij hotels.")),
        p(t("Alle huurauto's moeten worden opgehaald bij ons hoofdkantoor, op slechts "), b("5 minuten van de luchthaven"), t(".")),
        p(t("Wij bieden een "), b("gratis shuttle service"), t(" naar ons kantoor vanaf de luchthaven, hotels en de meeste delen van Bonaire.")),
        p(t("Let op: shuttles van en naar "), b("Rincon"), t(" zijn beschikbaar tegen een meerprijs.")),
      ],
    },
    {
      id: "airport",
      question: "Kan ik de huurauto op de luchthaven ontvangen?",
      keywords: ["luchthaven", "airport", "aankomst", "ophalen", "terminal", "balie", "shuttle", "ophaalservice"],
      blocks: [
        p(t("Hoewel wij geen balie direct in de terminal hebben, ligt ons hoofdkantoor slechts "), b("5 minuten rijden"), t(" verderop.")),
        p(t("Wij bieden een "), b("gratis ophaalservice"), t(" vanaf de luchthaven naar ons kantoor, zodat je je voertuig snel en gemakkelijk kunt ophalen.")),
      ],
    },
    {
      id: "advance-booking",
      question: "Hoe ver van tevoren moet ik mijn huurauto reserveren?",
      keywords: ["reserveren", "van tevoren", "vooraf", "hoe vroeg", "hoe ver", "last minute", "24 uur"],
      blocks: [p(t("Reserveer je huurauto voorlopig minimaal "), b("2 dagen van tevoren"), t(". Voor last-minute boekingen binnen 24 uur kun je ons het beste direct bellen of appen."))],
    },
    {
      id: "minimum-rental-rules",
      question: "Waarom kan ik een heel korte huurperiode niet online boeken?",
      keywords: ["minimum huur", "minimum dagen", "korte huur", "3 dagen minimum", "drie dagen minimum", "premium tarief"],
      blocks: [
        p(t("Online boekingen zijn geoptimaliseerd voor ons "), b("minimum van 3 dagen"), t(", zodat je de beste waarde krijgt.")),
        p(t("Kortere huurperiodes zijn beschikbaar tegen een "), b("premium tarief"), t(". Bel of WhatsApp ons hiervoor.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "Kan ik een last-minute boeking online maken?",
      keywords: ["last minute", "zelfde dag", "spoedboeking", "24 uur", "binnen 24 uur"],
      blocks: [
        p(t("Voor last-minute boekingen binnen "), b("24 uur"), t(", neem je rechtstreeks contact met ons op via WhatsApp of telefoon.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "Regelen jullie soms huur met partner-voertuigen?",
      keywords: ["partnerverhuur", "ander bedrijf", "leveranciersauto", "partnervoertuig", "affiliate netwerk", "volgeboekt", "uitverkocht"],
      blocks: [
        p(t("Ja. Wij maken gebruik van een "), b("breed affiliatenetwerk"), t(" om de juiste auto voor je te vinden, zelfs als die niet direct in onze eigen voorraad zit.")),
        p(t("Als je ziet dat wij "), b("volgeboekt"), t(" zijn voor jouw data, neem dan meteen contact met ons op. Mogelijk kunnen wij alsnog een voertuig regelen via onze lokale partners.")),
      ],
    },
    {
      id: "taxes-insurance",
      question: "Zijn belastingen en verzekering inbegrepen in jullie huurprijzen?",
      keywords: ["belasting", "belastingen", "verzekering inbegrepen", "inbegrepen verzekering", "abb", "cdw", "prijzen inclusief"],
      blocks: [
        p(t("Ja, onze tarieven zijn transparant.")),
        p(t("Alle prijzen zijn inclusief "), b("6% ABB (omzetbelasting)"), t(" en "), b("Basic Collision Damage Waiver (CDW)"), t(" verzekering.")),
        p(t("Voor nog meer bescherming kun je aan de balie upgraden naar "), b("Premium Coverage"), t(" tegen een extra dagtarief.")),
        p(t("Deze upgrade verlaagt je financiële verantwoordelijkheid verder in geval van schade.")),
      ],
    },
    {
      id: "wrong-fuel",
      question: "Wat moet ik doen als ik de auto met de verkeerde brandstof vul?",
      keywords: ["verkeerde brandstof", "misfuel", "diesel", "benzine", "verkeerd getankt"],
      blocks: [
        p(b("Start de motor niet.")),
        p(t("Neem onmiddellijk contact met ons op voor verdere instructies.")),
        p(t("Kosten door verkeerd tanken en eventuele motorschade vallen niet onder de standaardverzekering.")),
      ],
    },
    {
      id: "lost-keys",
      question: "Wat moet ik doen als ik mijn autosleutels verlies?",
      keywords: ["sleutel kwijt", "sleutels kwijt", "vervangende sleutel", "sleutel vervangen", "verloren sleutel"],
      blocks: [
        p(t("Neem direct contact met ons op.")),
        p(t("Wij zorgen voor een vervangende sleutel.")),
        p(t("De kosten voor de vervangende sleutel en levering worden meestal aan de huurder doorberekend.")),
      ],
    },
    {
      id: "warning-light",
      question: "Wat moet ik doen als er een waarschuwingslampje op het dashboard verschijnt?",
      keywords: ["waarschuwingslampje", "dashboardlampje", "motorlampje", "check engine", "dashboard"],
      blocks: [
        p(t("Als er een waarschuwingslampje verschijnt, parkeer de auto dan op een veilige plek en neem direct contact met ons op.")),
        p(t("Wij helpen je meteen verder zodat je je reis veilig kunt voortzetten.")),
      ],
    },
    {
      id: "breakdown",
      question: "Wat moet ik doen als de auto pech heeft of niet start?",
      keywords: ["pech", "start niet", "auto start niet", "technisch probleem", "road service bonaire", "+599 785 2604"],
      blocks: [
        p(t("Wij bieden "), b("24/7 pechhulp"), t(" voor jouw gemoedsrust.")),
        p(t("Als je technische problemen ervaart, neem dan direct contact op met "), b("Road Service Bonaire via +599 785 2604"), t(".")),
        p(t("Probeer om veiligheids- en verzekeringsredenen geen reparaties zelf uit te voeren zonder onze toestemming.")),
      ],
    },
  ],
  es: [
    {
      id: "accident",
      question: "¿Qué debo hacer en caso de accidente?",
      keywords: ["accidente", "choque", "colisión", "emergencia", "911", "policía", "crs", "asistencia", "reporte"],
      blocks: [
        list(
          [b("Llame a la policía/servicios de emergencia:"), t(" Marque "), b("911"), t(" si hay heridos, se necesita ayuda médica urgente o el accidente debe reportarse a la policía.")],
          [b("Llame al servicio de carretera (CRS):"), t(" Es obligatorio contactar a "), b("CRS - Caribbean Road Services"), t(" por teléfono al "), b("+599 717 9292"), t(" o por WhatsApp al "), b("+599 795 9292"), t(".")],
          [b("Infórmenos de inmediato:"), t(" Después de hablar con CRS, avísenos enseguida para coordinar los siguientes pasos.")],
          [b("No mueva el vehículo:"), t(" Espere las instrucciones de CRS. Mueva el auto solo cuando el personal de CRS o la policía indiquen que es seguro.")],
          [b("No abandone el lugar:"), t(" Permanezca allí hasta que CRS termine el reporte.")],
        ),
        p(t("Sin el reporte de CRS, la cobertura del seguro puede quedar anulada y el arrendatario podría ser responsable de todos los costos.")),
        p(t("Seguir estos pasos ayuda a documentar correctamente el incidente y protege su cobertura.")),
      ],
    },
    {
      id: "damage",
      question: "¿Qué debo hacer si el auto alquilado sufre daños?",
      keywords: ["daño", "daños", "parabrisas", "golpe", "daño de estacionamiento", "piedra", "reporte", "crs"],
      blocks: [
        list(
          [b("No mueva el auto:"), t(" Deje el vehículo donde ocurrió el daño, ya sea por un poste, piedra, daño en el parabrisas, golpe de estacionamiento o accidente en carretera.")],
          [b("Contacte a CRS de inmediato:"), t(" Llame al "), b("+599 717 9292"), t(" o escriba por WhatsApp al "), b("+599 795 9292"), t(". Normalmente llegan rápido, toman fotos y recogen su declaración.")],
          [b("Infórmenos de inmediato:"), t(" Después de contactar a CRS, avísenos enseguida para coordinar los siguientes pasos.")],
          [b("Siga las instrucciones:"), t(" Mueva el auto solo cuando el personal de CRS o la policía indiquen que es seguro.")],
        ),
        p(t("Este procedimiento mantiene el incidente correctamente documentado a través del reporte de CRS y ayuda a conservar la validez del seguro.")),
        p(t("Sin ese reporte, la cobertura del seguro puede quedar anulada y el arrendatario podría tener que pagar todos los costos.")),
      ],
    },
    {
      id: "minimum-age",
      question: "¿Cuál es la edad mínima para alquilar un vehículo?",
      keywords: ["edad mínima", "edad", "conductor joven", "19", "20", "21", "depósito", "vehículo"],
      blocks: [
        p(t("La edad mínima estándar para alquilar un vehículo es "), b("21 años"), t(".")),
        p(t("También aceptamos conductores de "), b("19 y 20 años"), t(", pero están sujetos a un depósito de seguridad más alto de "), b("$750"), t(".")),
        p(t("Los conductores de "), b("21 años o más"), t(" requieren el depósito estándar de "), b("$500"), t(".")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "¿Cuáles son las opciones de seguro y depósito?",
      keywords: ["seguro", "cobertura", "depósito", "depósito de seguridad", "premium coverage", "premium", "cdw", "basic cdw"],
      blocks: [
        p(t("Todos nuestros vehículos incluyen "), b("Basic Collision Damage Waiver (CDW)"), t(" como estándar.")),
        p(t("Para mayor tranquilidad, también ofrecemos "), b("Premium Coverage"), t(" para reducir aún más su responsabilidad.")),
        p(t("El depósito de seguridad requerido depende de la edad del conductor: "), b("$750"), t(" para edades "), b("19-20"), t(", y "), b("$500"), t(" para "), b("21 años o más"), t(".")),
      ],
    },
    {
      id: "kilometers",
      question: "¿Cuántos kilómetros puedo conducir por día?",
      keywords: ["kilómetros", "kilometros", "millas", "ilimitado", "distancia"],
      blocks: [p(t("Kilometraje ilimitado."))],
    },
    {
      id: "roadside-assistance",
      question: "¿Cómo contacto la asistencia en carretera o soporte de emergencia?",
      keywords: ["asistencia en carretera", "asistencia", "emergencia", "soporte", "ayuda", "avería", "no arranca", "luz de advertencia", "crs"],
      blocks: [
        p(t("Ofrecemos "), b("asistencia en carretera 24/7"), t(".")),
        p(t("Para accidentes o daños del vehículo, contacte a "), b("CRS - Caribbean Road Services"), t(" al "), b("+599 717 9292"), t(" o por WhatsApp al "), b("+599 795 9292"), t(".")),
        p(t("Si el auto se avería, no arranca o presenta otro problema técnico, contacte de inmediato a "), b("Road Service Bonaire al +599 785 2604"), t(".")),
        p(t("Si hay heridos o se necesitan servicios de emergencia, llame al "), b("911"), t(".")),
      ],
    },
    {
      id: "payment-methods",
      question: "¿Aceptan efectivo o tarjetas de crédito?",
      keywords: ["efectivo", "cash", "tarjeta", "tarjetas", "maestro", "visa", "mastercard", "discover", "diners", "amex", "american express", "pago"],
      blocks: [
        p(t("Aceptamos efectivo "), b("(dólares estadounidenses)"), t(", Maestro, Visa, Mastercard, Discover y tarjetas Diners Club.")),
        p(t("Se aplica un "), b("cargo administrativo del 6%"), t(" a todos los pagos con tarjeta de crédito.")),
        p(b("Importante:"), t(" No aceptamos "), b("American Express (AMEX)"), t(".")),
      ],
    },
    {
      id: "euros",
      question: "¿Puedo pagar en euros?",
      keywords: ["euro", "euros", "moneda", "guilder", "dólares", "dolares"],
      blocks: [
        p(t("No, no aceptamos euros. Los pagos en efectivo pueden hacerse en "), b("dólares estadounidenses ($)"), t(".")),
        p(t("También puede pagar con nuestra máquina móvil bancaria.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "¿Cuál es su política de combustible?",
      keywords: ["combustible", "gasolina", "tanque", "full to full", "lleno a lleno", "pickup", "pickups"],
      blocks: [
        p(t("Nuestra política de combustible es "), b("lleno a lleno"), t(".")),
        p(t("Los vehículos se entregan con el tanque lleno y deben devolverse llenos. Si no se entregó lleno, puede devolverlo con el mismo nivel recibido.")),
        p(b("Importante:"), t(" Si el nivel de combustible es insuficiente al devolverlo, se aplica un cargo mínimo de "), b("$25"), t(" para vehículos y "), b("$35"), t(" para pickups por cada "), b("1/4 de tanque"), t(" o fracción.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "¿Quién puede conducir el auto alquilado?",
      keywords: ["conductor", "conductor adicional", "autorizado", "cofirmante", "cosign", "firma conjunta"],
      blocks: [p(t("Puede conducir el arrendatario principal y el conductor adicional que firme el contrato y tenga licencia válida."))],
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
      keywords: ["entrega", "entregar", "ubicación específica", "hotel", "dirección", "shuttle", "oficina", "rincon"],
      blocks: [
        p(t("No, no ofrecemos entrega de vehículos en ubicaciones específicas ni en hoteles.")),
        p(t("Todos los alquileres deben recogerse en nuestra oficina principal, ubicada a solo "), b("5 minutos del aeropuerto"), t(".")),
        p(t("Ofrecemos un "), b("servicio de traslado gratuito"), t(" hacia nuestra oficina desde el aeropuerto, hoteles y la mayor parte de Bonaire.")),
        p(t("Tenga en cuenta que los traslados desde y hacia "), b("Rincon"), t(" están disponibles por un cargo adicional.")),
      ],
    },
    {
      id: "airport",
      question: "¿Puedo recibir el auto de alquiler en el aeropuerto?",
      keywords: ["aeropuerto", "llegada", "recibir auto", "recoger", "terminal", "mostrador", "shuttle", "servicio de recogida"],
      blocks: [
        p(t("Aunque no tenemos un mostrador directamente dentro de la terminal, nuestra oficina principal está a solo "), b("5 minutos en coche"), t(".")),
        p(t("Ofrecemos un "), b("servicio de recogida gratuito"), t(" desde el aeropuerto hasta nuestra oficina para que pueda recoger su vehículo rápida y fácilmente.")),
      ],
    },
    {
      id: "advance-booking",
      question: "¿Con cuánta anticipación debo reservar mi auto de alquiler?",
      keywords: ["reservar", "anticipación", "adelantado", "qué tan pronto", "cuánto antes", "último minuto", "24 horas"],
      blocks: [p(t("Por ahora, reserve su auto de alquiler al menos "), b("2 días antes"), t(". Para reservas de último minuto dentro de 24 horas, contáctenos directamente por WhatsApp o teléfono."))],
    },
    {
      id: "minimum-rental-rules",
      question: "¿Por qué no puedo reservar un alquiler muy corto en línea?",
      keywords: ["alquiler mínimo", "días mínimos", "alquiler corto", "mínimo de 3 días", "tarifa premium"],
      blocks: [
        p(t("Las reservas en línea están optimizadas para nuestro "), b("mínimo de 3 días"), t(", para ofrecerle la mejor relación calidad-precio.")),
        p(t("Las duraciones de alquiler más cortas están disponibles con una "), b("tarifa premium"), t(". Llámenos o envíenos un WhatsApp.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "¿Puedo hacer una reserva de última hora en línea?",
      keywords: ["última hora", "mismo día", "reserva urgente", "24 horas", "dentro de 24 horas"],
      blocks: [
        p(t("Para reservas de última hora dentro de "), b("24 horas"), t(", contáctenos directamente por WhatsApp o teléfono.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "¿A veces gestionan alquileres con vehículos de socios?",
      keywords: ["alquiler de socios", "otra empresa", "vehículo de proveedor", "vehículo socio", "red afiliada", "completo", "agotado"],
      blocks: [
        p(t("Sí. Aprovechamos una "), b("amplia red de afiliados"), t(" para encontrarle el auto adecuado, incluso si no está en nuestro inventario inmediato.")),
        p(t("Si ve que estamos "), b("completamente reservados"), t(" para sus fechas, contáctenos de inmediato. Aún podríamos conseguirle un vehículo a través de nuestros socios locales.")),
      ],
    },
    {
      id: "taxes-insurance",
      question: "¿Sus precios de alquiler incluyen impuestos y seguro?",
      keywords: ["impuestos", "impuesto", "seguro incluido", "incluye seguro", "abb", "cdw", "precios incluyen"],
      blocks: [
        p(t("Sí, nuestras tarifas son transparentes.")),
        p(t("Todos los precios incluyen "), b("6% ABB (impuesto sobre ventas)"), t(" y "), b("Basic Collision Damage Waiver (CDW)"), t(" de seguro.")),
        p(t("Para una protección aún mayor, puede mejorar a "), b("Premium Coverage"), t(" en el mostrador por una tarifa diaria adicional.")),
        p(t("Esta mejora reduce aún más su responsabilidad financiera en caso de daños.")),
      ],
    },
    {
      id: "wrong-fuel",
      question: "¿Qué debo hacer si lleno el auto con el combustible equivocado?",
      keywords: ["combustible equivocado", "misfuel", "diésel", "gasolina", "combustible incorrecto"],
      blocks: [
        p(b("No arranque el motor.")),
        p(t("Contáctenos de inmediato para recibir más instrucciones.")),
        p(t("Los costos por repostar el combustible incorrecto y cualquier daño al motor resultante no están cubiertos por el seguro estándar.")),
      ],
    },
    {
      id: "lost-keys",
      question: "¿Qué debo hacer si pierdo las llaves del auto?",
      keywords: ["llave perdida", "llaves perdidas", "reemplazo de llave", "llave de repuesto", "llave extraviada"],
      blocks: [
        p(t("Contáctenos de inmediato.")),
        p(t("Organizaremos una llave de reemplazo.")),
        p(t("Los costos del reemplazo de la llave y su entrega normalmente se cobran al arrendatario.")),
      ],
    },
    {
      id: "warning-light",
      question: "¿Qué debo hacer si aparece una luz de advertencia en el tablero?",
      keywords: ["luz de advertencia", "luz del tablero", "check engine", "luz del motor", "tablero"],
      blocks: [
        p(t("Si aparece una luz de advertencia, estacione el auto en un lugar seguro y contáctenos de inmediato.")),
        p(t("Le ayudaremos enseguida para que pueda continuar su viaje con seguridad.")),
      ],
    },
    {
      id: "breakdown",
      question: "¿Qué debo hacer si el auto se avería o no arranca?",
      keywords: ["avería", "no arranca", "el auto no arranca", "problema técnico", "road service bonaire", "+599 785 2604"],
      blocks: [
        p(t("Ofrecemos "), b("asistencia en carretera 24/7"), t(" para su tranquilidad.")),
        p(t("Si experimenta cualquier problema técnico, contacte de inmediato a "), b("Road Service Bonaire al +599 785 2604"), t(".")),
        p(t("Por razones de seguridad y seguro, no intente realizar reparaciones por su cuenta sin nuestra autorización.")),
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
