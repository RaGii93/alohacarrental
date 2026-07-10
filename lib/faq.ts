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
      id: "terms-priority",
      question: "Do these FAQ answers replace the rental terms and conditions?",
      keywords: ["terms", "conditions", "policy", "official", "legal", "priority", "faq", "binding", "pdf", "agreement", "contract", "override"],
      blocks: [
        p(t("No. These FAQ answers are a practical summary for renters.")),
        p(t("The official Aloha Car Rental Terms and Conditions remain the binding source for coverage, deposit, eligibility, fees, and responsibilities.")),
        p(t("If anything appears different, follow the Terms and Conditions PDF and contact Aloha support for clarification.")),
      ],
    },
    {
      id: "accident",
      question: "What should I do in case of an accident?",
      keywords: ["accident", "crash", "collision", "emergency", "forensys", "911", "caribbean road service", "crs", "police report", "717 9292", "795 9292"],
      blocks: [
        list(
          [b("Call Emergency Services:"), t(" Dial "), b("911"), t(" if anyone is injured or needs urgent medical help.")],
          [b("Call Caribbean Road Service:"), t(" Contact CRS at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(" right away. Calling CRS is mandatory." )],
          [b("Contact Aloha Support Immediately:"), t(" After contacting CRS, notify Aloha Car Rental immediately so our team can coordinate the next steps.")],
          [b("Police Report Is Mandatory:"), t(" A valid police report is required for insurance processing.")],
          [b("Do Not Move the Vehicle:"), t(" Wait for CRS, police, or emergency services to tell you it is safe to move the vehicle.")],
          [b("Do Not Leave the Scene:"), t(" Stay there until CRS and the authorities finish the report. Without that report, insurance coverage can be void and the renter may have to pay all costs.")],
        ),
        p(t("Following these steps helps document the incident properly and protects your coverage.")),
      ],
    },
    {
      id: "damage",
      question: "What should I do if the rental car is damaged?",
      keywords: ["damaged", "windshield", "scratch", "hit", "forensys", "report", "vehicle damaged", "car damaged"],
      blocks: [
        list(
          [b("Do Not Move the Car:"), t(" Leave the vehicle where the damage happened, whether it was a post, stone, windshield damage, parking damage, or road accident.")],
          [b("Call Caribbean Road Service:"), t(" Contact CRS at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(" immediately.")],
          [b("Contact Aloha Support Immediately:"), t(" After contacting CRS, notify Aloha Car Rental right away so we can coordinate next steps.")],
          [b("Follow Instructions:"), t(" Move the car only after CRS staff, police, or emergency responders confirm it is safe.")],
        ),
        p(t("This procedure keeps the incident documented correctly and helps keep your insurance valid. Without the CRS and police report, insurance coverage can be void and the renter may have to pay all costs.")),
      ],
    },
    {
      id: "minimum-age",
      question: "What is the minimum age to rent a vehicle?",
      keywords: ["minimum age", "young driver", "license", "van", "vehicle", "eligibility", "driving license", "license requirement", "terms pdf"],
      blocks: [
        p(t("The standard minimum age is "), b("21 years old"), t(".")),
        p(t("Drivers aged "), b("19 and 20"), t(" can still rent, but a "), b("$750"), t(" security deposit is required.")),
        p(t("Drivers aged "), b("21 and over"), t(" require the standard "), b("$500"), t(" security deposit.")),
        p(t("All authorized drivers must be listed on the rental agreement and hold a valid driving license.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "What are your insurance coverage and deposit options?",
      keywords: ["insurance", "coverage", "deposit", "deductible", "all risk", "all-risk", "cdw", "full insurance", "all-risk premium", "$100", "$500", "$600", "police report"],
      blocks: [
        p(t("All rentals include "), b("basic CDW"), t(" as the standard insurance option.")),
        p(t("With accepted CDW, the deductible is "), b("$500"), t(" for cars and "), b("$600"), t(" for pickups, jeeps, SUVs, and vans.")),
        p(t("A "), b("full insurance / all-risk premium"), t(" option is also available. If accepted, the deductible is "), b("$100"), t(".")),
        p(t("Full insurance covers theft, joy-riding, and single-vehicle accidents. A valid police report is mandatory for claims.")),
        p(t("CDW and full insurance do not cover driving under the influence of alcohol or drugs, speeding, unauthorized off-road driving, or third-party damages above "), b("$50,000"), t(".")),
        p(t("If insurance is not accepted, or if coverage is invalidated, the renter is responsible for the total amount of damages and losses, including water damage.")),
      ],
    },
    {
      id: "pricing-includes",
      question: "Do your rental prices include taxes and insurance?",
      keywords: ["tax", "abb", "included", "rates", "price includes", "cdw", "insurance included"],
      blocks: [
        p(t("Yes. Rental prices include "), b("6% ABB"), t(" and "), b("basic CDW"), t(".")),
        p(t("For extra protection, you can choose the premium/full insurance upgrade at the counter for an additional daily fee.")),
      ],
    },
    {
      id: "kilometers",
      question: "How many kilometers can I drive per day?",
      keywords: ["kilometers", "kilometres", "mileage", "unlimited", "distance"],
      blocks: [p(t("Kilometers are unlimited."))],
    },
    {
      id: "payment-methods",
      question: "Do you accept cash or credit cards?",
      keywords: ["cash", "credit card", "cards", "maestro", "amex", "visa", "mastercard", "payment", "payment authorization", "power of attorney", "damage payment", "counter payment"],
      blocks: [
        p(t("Aloha Car Rental accepts cash in "), b("US dollars"), t(", "), b("Maestro"), t(", "), b("Visa"), t(", "), b("Mastercard"), t(", "), b("Discover"), t(", and "), b("Diners Club"), t(".")),
        p(t("A "), b("6% administration fee"), t(" applies to credit card payments.")),
        p(t("We do "), b("not"), t(" accept "), b("American Express (AMEX)"), t(".")),
        p(t("Under the Terms and Conditions, the renter authorizes Aloha Car Rental to use any provided credit card to pay for damages or losses when applicable.")),
      ],
    },
    {
      id: "euros",
      question: "Can I pay in euros?",
      keywords: ["euro", "euros", "currency", "guilders", "dollars"],
      blocks: [
        p(t("No, we do not accept euros. Cash payments can be made in US dollars.")),
        p(t("You can also pay using our bank mobile pin machine.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "What is your fuel policy?",
      keywords: ["fuel", "gas", "petrol", "tank", "full to full", "full-to-full", "1/8 tank", "missing fuel", "$20", "$25", "fuel refund"],
      blocks: [
        p(t("Aloha Car Rental fuel policy is "), b("full-to-full"), t(".")),
        p(t("Vehicles are delivered full and must be returned full.")),
        p(b("Important:"), t(" Missing fuel is charged at "), b("$20"), t(" per "), b("1/8 tank"), t(" for cars and "), b("$25"), t(" per "), b("1/8 tank"), t(" for jeeps/SUVs/vans/pickups. No refunds apply for extra fuel.")),
      ],
    },
    {
      id: "wrong-fuel",
      question: "What should I do if I fill the car with the wrong fuel?",
      keywords: ["wrong fuel", "misfuel", "diesel", "gasoline", "petrol", "engine damage"],
      blocks: [
        p(t("Do not start the engine.")),
        p(t("Contact Aloha Car Rental immediately for instructions.")),
        p(t("Misfueling and any resulting engine damage are not covered by standard insurance.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "Who is allowed to drive the rental car?",
      keywords: ["driver", "additional driver", "authorized driver", "co-sign"],
      blocks: [p(t("Only the lessee and any additional driver listed on the rental agreement are authorized to drive the vehicle."))],
    },
    {
      id: "off-road",
      question: "Can I drive the rental vehicle off-road?",
      keywords: ["off-road", "white sand", "dunes", "unauthorized use", "terrain"],
      blocks: [
        p(t("No. Off-road driving, driving on white sand, and driving in dunes are not permitted.")),
        p(t("Any damage caused by unauthorized off-road use is the renter's responsibility and can invalidate insurance coverage.")),
      ],
    },
    {
      id: "flat-tire",
      question: "What happens if I get a flat tire?",
      keywords: ["flat tire", "puncture", "tire repair", "roadside assistance", "$35"],
      blocks: [
        p(t("Assistance for a flat tire near town is available.")),
        p(t("The repair cost is "), b("$35"), t(".")),
      ],
    },
    {
      id: "lost-keys",
      question: "What should I do if I lose the car keys?",
      keywords: ["lost keys", "replacement key", "chip key", "remote", "lockout"],
      blocks: [
        p(t("Contact Aloha Car Rental immediately so we can arrange a replacement key or lockout support.")),
        p(t("Replacement costs are charged to the renter. Reference prices in the terms are "), b("$20"), t(" for a standard key, "), b("$160"), t(" for a chip key, "), b("$260"), t(" for a chip key with remote, and "), b("$20"), t(" for lockout service.")),
      ],
    },
    {
      id: "warning-light",
      question: "What should I do if a warning light appears on the dashboard?",
      keywords: ["warning light", "dashboard", "check engine", "indicator"],
      blocks: [
        p(t("Park the vehicle in a safe location and contact Aloha Car Rental immediately.")),
        p(t("We will guide you on the next step so you can continue safely.")),
      ],
    },
    {
      id: "breakdown",
      question: "What should I do if the car breaks down or will not start?",
      keywords: ["breakdown", "won't start", "roadside", "technical issue", "785 2604"],
      blocks: [
        p(t("Contact roadside assistance immediately if the car breaks down or will not start.")),
        p(t("For technical issues, the FAQ support document lists "), b("Road Service Bonaire +599 785 2604"), t(".")),
        p(t("Do not attempt repairs yourself without authorization from Aloha Car Rental.")),
      ],
    },
    {
      id: "returns",
      question: "Where do I return the vehicle?",
      keywords: ["return location", "same location", "pickup location", "785 5999"],
      blocks: [
        p(t("Vehicles must be returned to the same location where they were picked up.")),
        p(t("If you need to change the return location, contact the office at "), b("+599 785 5999"), t(".")),
      ],
    },
    {
      id: "cleanliness",
      question: "How should I return the vehicle?",
      keywords: ["clean", "cleaning fee", "personal belongings", "return condition"],
      blocks: [
        p(t("The vehicle must be returned clean.")),
        p(t("If it is returned dirty, the renter can be charged for cleaning and any repair or replacement costs.")),
        p(t("Aloha Car Rental is not responsible for personal belongings left in the vehicle.")),
      ],
    },
    {
      id: "long-term",
      question: "Do you offer long-term rentals?",
      keywords: ["long-term", "long term", "monthly", "extended rental"],
      blocks: [p(t("Yes. Contact Aloha Car Rental by email, phone, or WhatsApp using the support details on this FAQ page to discuss long-term availability and pricing."))],
    },
    {
      id: "delivery",
      question: "Do you deliver the car to a specific location?",
      keywords: ["delivery", "deliver", "specific location", "hotel", "address"],
      blocks: [
        p(t("No. Vehicles are collected from the main office rather than delivered to hotels or other custom locations.")),
        p(t("Aloha Car Rental provides a complimentary shuttle service from the airport, hotels, and most parts of Bonaire to the office.")),
        p(t("Shuttles to and from Rincon are available for an additional fee.")),
      ],
    },
    {
      id: "airport",
      question: "Can I receive the rental car at the airport?",
      keywords: ["airport", "arrival", "pickup airport", "receive car"],
      blocks: [
        p(t("Not directly inside the terminal.")),
        p(t("The main office is about "), b("5 minutes"), t(" from the airport, and Aloha Car Rental provides a complimentary pickup service to bring you there so you can collect your vehicle quickly.")),
      ],
    },
    {
      id: "advance-booking",
      question: "How far in advance should I reserve my rental car?",
      keywords: ["reserve", "book in advance", "advance", "last minute", "24 hours"],
      blocks: [
        p(t("Reserve as early as possible to secure your preferred vehicle and dates.")),
        p(t("For last-minute bookings within "), b("24 hours"), t(", contact Aloha Car Rental directly by WhatsApp or phone.")),
      ],
    },
    {
      id: "minimum-rental-rules",
      question: "Why can’t I book a very short rental online?",
      keywords: ["minimum rental", "minimum days", "short rental", "admin only", "booking rules"],
      blocks: [
        p(t("Online bookings are optimized for a "), b("3-day minimum"), t(".")),
        p(t("Shorter rental durations may still be possible at a premium rate, but you need to contact Aloha Car Rental directly by phone or WhatsApp.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "Can I make a last-minute booking online?",
      keywords: ["last minute", "same day", "same-day", "urgent booking", "24 hours"],
      blocks: [
        p(t("That depends on Aloha Car Rental active booking rules.")),
        p(t("If your pickup is inside the configured last-minute window, the website may add an extra percentage or require the booking to be handled directly by staff.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "Do you sometimes arrange rentals with partner vehicles?",
      keywords: ["partner rentals", "outside company", "supplier car", "other company", "partner vehicle"],
      blocks: [
        p(t("Yes. If Aloha Car Rental is fully booked for your dates, we may still be able to secure a vehicle through our local partner network.")),
        p(t("Contact us directly if you do not see availability online, because a partner vehicle may still be possible.")),
      ],
    },
    {
      id: "soft-top-jeeps",
      question: "Are there special rules for soft-top jeeps?",
      keywords: ["soft-top", "jeep", "roof", "rain", "overnight"],
      blocks: [
        p(t("Yes. Soft-top jeep roofs must be closed overnight and whenever it rains.")),
        p(t("If they are left open, the renter is liable for any interior electrical damage.")),
      ],
    },
  ],
  nl: [
    {
      id: "terms-priority",
      question: "Vervangen deze FAQ-antwoorden de huurvoorwaarden?",
      keywords: ["voorwaarden", "algemene voorwaarden", "beleid", "officieel", "juridisch", "voorrang", "faq", "bindend", "pdf", "overeenkomst", "contract", "leidend"],
      blocks: [
        p(t("Nee. Deze FAQ-antwoorden zijn een praktische samenvatting voor huurders.")),
        p(t("De officiële Algemene Voorwaarden van Aloha Car Rental blijven leidend voor dekking, borg, geschiktheid, toeslagen en verantwoordelijkheden.")),
        p(t("Als iets anders lijkt, volg dan de voorwaarden-PDF en neem contact op met Aloha support voor verduidelijking.")),
      ],
    },
    {
      id: "accident",
      question: "Wat moet ik doen bij een ongeval?",
      keywords: ["ongeval", "ongeluk", "aanrijding", "noodgeval", "forensys", "911", "caribbean road service", "crs", "politierapport", "717 9292", "795 9292"],
      blocks: [
        list(
          [b("Bel de hulpdiensten:"), t(" Bel "), b("911"), t(" als er gewonden zijn of als medische hulp direct nodig is.")],
          [b("Bel Caribbean Road Service:"), t(" Neem direct contact op met CRS via "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t(". Het bellen van CRS is verplicht." )],
          [b("Neem direct contact op met Aloha support:"), t(" Meld het na contact met CRS meteen aan Aloha Car Rental zodat wij de volgende stappen kunnen coördineren.")],
          [b("Politierapport is verplicht:"), t(" Een geldig politierapport is verplicht voor verzekeringsafhandeling." )],
          [b("Verplaats het voertuig niet:"), t(" Wacht tot CRS, politie of hulpdiensten aangeven dat het veilig is om de auto te verplaatsen.")],
          [b("Verlaat de plaats niet:"), t(" Blijf ter plaatse totdat CRS en de autoriteiten het rapport hebben afgerond. Zonder dat rapport kan de verzekering vervallen en kan de huurder alle kosten moeten betalen.")],
        ),
        p(t("Door deze stappen te volgen, wordt alles correct vastgelegd en blijft je dekking beschermd.")),
      ],
    },
    {
      id: "damage",
      question: "Wat moet ik doen als de huurauto schade heeft?",
      keywords: ["beschadigd", "ruit", "krassen", "forensys", "melding", "voertuig beschadigd", "auto beschadigd"],
      blocks: [
        list(
          [b("Verplaats de auto niet:"), t(" Laat het voertuig staan waar de schade is ontstaan, of het nu gaat om een paal, steen, ruitschade, parkeerschade of een verkeersongeval.")],
          [b("Bel Caribbean Road Service:"), t(" Neem direct contact op met CRS via "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t("." )],
          [b("Neem direct contact op met Aloha support:"), t(" Meld het na contact met CRS meteen aan Aloha Car Rental zodat wij de vervolgstappen kunnen coördineren.")],
          [b("Volg de instructies:"), t(" Verplaats de auto pas nadat CRS-medewerkers, politie of hulpdiensten aangeven dat het veilig is.")],
        ),
        p(t("Zo wordt de schade correct vastgelegd en blijft de verzekering geldig. Zonder CRS- en politierapport kan de verzekering vervallen en kan de huurder alle kosten moeten betalen.")),
      ],
    },
    {
      id: "minimum-age",
      question: "Wat is de minimumleeftijd om een voertuig te huren?",
      keywords: ["minimumleeftijd", "jonge bestuurder", "rijbewijs", "bus", "auto", "geschiktheid", "rijbewijseis", "voorwaarden pdf"],
      blocks: [
        p(t("De standaard minimumleeftijd is "), b("21 jaar"), t(".")),
        p(t("Bestuurders van "), b("19 en 20 jaar"), t(" kunnen ook huren, maar daarvoor geldt een "), b("$750"), t(" waarborgsom.")),
        p(t("Bestuurders van "), b("21 jaar en ouder"), t(" betalen de standaard "), b("$500"), t(" waarborgsom.")),
        p(t("Alle bevoegde bestuurders moeten op de huurovereenkomst staan en een geldig rijbewijs hebben.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "Wat zijn de opties voor verzekering en borg?",
      keywords: ["verzekering", "dekking", "borg", "eigen risico", "all risk", "all-risk", "cdw", "volledige verzekering", "$100", "$500", "$600", "politierapport"],
      blocks: [
        p(t("Alle huurprijzen zijn inclusief "), b("basis-CDW"), t(" als standaard verzekeringsoptie.")),
        p(t("Bij geaccepteerde CDW is het eigen risico "), b("$500"), t(" voor auto’s en "), b("$600"), t(" voor pick-ups, jeeps, SUV’s en busjes.")),
        p(t("Er is ook een "), b("volledige / all-risk premium verzekering"), t(" beschikbaar. Als die wordt geaccepteerd, is het eigen risico "), b("$100"), t(".")),
        p(t("Volledige verzekering dekt diefstal, joy-riding en eenzijdige ongevallen. Een geldig politierapport is verplicht voor claims.")),
        p(t("CDW en volledige verzekering dekken geen rijden onder invloed van alcohol of drugs, snelheidsovertredingen, ongeoorloofd off-road rijden of schade aan derden boven "), b("$50.000"), t(".")),
        p(t("Als verzekering niet wordt geaccepteerd, of als de dekking vervalt, is de huurder verantwoordelijk voor het totale schade- en verliesbedrag, inclusief waterschade.")),
      ],
    },
    {
      id: "pricing-includes",
      question: "Zijn belastingen en verzekering inbegrepen in de huurprijs?",
      keywords: ["belasting", "abb", "inbegrepen", "tarief", "cdw", "verzekering inbegrepen"],
      blocks: [
        p(t("Ja. Huurprijzen zijn inclusief "), b("6% ABB"), t(" en "), b("basis-CDW"), t(".")),
        p(t("Voor extra bescherming kun je aan de balie upgraden naar de premium/volledige verzekering tegen een extra dagtarief.")),
      ],
    },
    {
      id: "kilometers",
      question: "Hoeveel kilometers mag ik per dag rijden?",
      keywords: ["kilometers", "kilometerlimiet", "onbeperkt", "afstand"],
      blocks: [p(t("Kilometers zijn onbeperkt."))],
    },
    {
      id: "payment-methods",
      question: "Accepteren jullie contant geld of creditcards?",
      keywords: ["contant", "cash", "creditcard", "kaart", "maestro", "amex", "visa", "mastercard", "betalingsmachtiging", "volmacht", "schadebetaling", "baliebetaling"],
      blocks: [
        p(t("Aloha Car Rental accepteert contant geld in "), b("Amerikaanse dollars"), t(", "), b("Maestro"), t(", "), b("Visa"), t(", "), b("Mastercard"), t(", "), b("Discover"), t(" en "), b("Diners Club"), t(".")),
        p(t("Voor creditcardbetalingen geldt een "), b("6% administratiekost"), t(".")),
        p(t("Wij accepteren "), b("geen American Express (AMEX)"), t(".")),
        p(t("Volgens de Algemene Voorwaarden machtigt de huurder Aloha Car Rental om een opgegeven creditcard te gebruiken voor schade of verlies wanneer dat van toepassing is.")),
      ],
    },
    {
      id: "euros",
      question: "Kan ik in euro's betalen?",
      keywords: ["euro", "euro's", "valuta", "guilders", "dollars"],
      blocks: [
        p(t("Nee, wij accepteren geen euro's. Contante betalingen kunnen in Amerikaanse dollars worden gedaan.")),
        p(t("Je kunt ook betalen met onze mobiele pinmachine van de bank.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "Wat is jullie brandstofbeleid?",
      keywords: ["brandstof", "benzine", "tank", "full to full", "vol-vol", "1/8 tank", "ontbrekende brandstof", "$20", "$25", "geen restitutie"],
      blocks: [
        p(t("Het brandstofbeleid van Aloha Car Rental is "), b("full-to-full"), t(".")),
        p(t("Voertuigen worden met een volle tank geleverd en moeten ook weer vol worden ingeleverd.")),
        p(b("Belangrijk:"), t(" Ontbrekende brandstof wordt berekend als "), b("$20"), t(" per "), b("1/8 tank"), t(" voor auto’s en "), b("$25"), t(" per "), b("1/8 tank"), t(" voor jeeps/SUV’s/busjes/pick-ups. Extra brandstof wordt niet terugbetaald.")),
      ],
    },
    {
      id: "wrong-fuel",
      question: "Wat moet ik doen als ik de verkeerde brandstof heb getankt?",
      keywords: ["verkeerde brandstof", "misfuel", "diesel", "benzine", "motorschade"],
      blocks: [
        p(t("Start de motor niet.")),
        p(t("Neem direct contact op met Aloha Car Rental voor instructies.")),
        p(t("Verkeerd tanken en eventuele motorschade daardoor vallen niet onder de standaardverzekering.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "Wie mag de huurauto besturen?",
      keywords: ["bestuurder", "extra bestuurder", "gemachtigde bestuurder", "medeondertekenen"],
      blocks: [p(t("Alleen de huurder en eventuele extra bestuurder(s) die op de huurovereenkomst staan, mogen het voertuig besturen."))],
    },
    {
      id: "off-road",
      question: "Mag ik met het huurvoertuig off-road rijden?",
      keywords: ["off-road", "wit zand", "duinen", "ongeoorloofd gebruik", "terrein"],
      blocks: [
        p(t("Nee. Off-road rijden, rijden op wit zand en rijden in duinen is niet toegestaan.")),
        p(t("Schade door ongeoorloofd off-road gebruik is voor rekening van de huurder en kan de verzekeringsdekking ongeldig maken.")),
      ],
    },
    {
      id: "flat-tire",
      question: "Wat gebeurt er als ik een lekke band krijg?",
      keywords: ["lekke band", "bandenpech", "reparatie", "pechhulp", "$35"],
      blocks: [
        p(t("Hulp bij een lekke band in de buurt van de stad is beschikbaar.")),
        p(t("De reparatiekosten bedragen "), b("$35"), t(".")),
      ],
    },
    {
      id: "lost-keys",
      question: "Wat moet ik doen als ik mijn autosleutels verlies?",
      keywords: ["sleutels kwijt", "vervangende sleutel", "chipsleutel", "afstandsbediening", "buitensluiting"],
      blocks: [
        p(t("Neem direct contact op met Aloha Car Rental zodat we een vervangende sleutel of hulp bij buitensluiting kunnen regelen.")),
        p(t("Vervangingskosten zijn voor rekening van de huurder. De richtprijzen in de voorwaarden zijn "), b("$20"), t(" voor een standaardsleutel, "), b("$160"), t(" voor een chipsleutel, "), b("$260"), t(" voor een chipsleutel met afstandsbediening en "), b("$20"), t(" voor buitensluitingsservice.")),
      ],
    },
    {
      id: "warning-light",
      question: "Wat moet ik doen als er een waarschuwingslampje op het dashboard verschijnt?",
      keywords: ["waarschuwingslampje", "dashboard", "check engine", "storingslamp"],
      blocks: [
        p(t("Parkeer het voertuig op een veilige plek en neem direct contact op met Aloha Car Rental.")),
        p(t("Wij begeleiden je bij de volgende stap zodat je veilig verder kunt.")),
      ],
    },
    {
      id: "breakdown",
      question: "Wat moet ik doen als de auto pech krijgt of niet start?",
      keywords: ["pech", "start niet", "roadside", "technisch probleem", "785 2604"],
      blocks: [
        p(t("Neem direct contact op met pechhulp als de auto pech krijgt of niet wil starten.")),
        p(t("Voor technische problemen vermeldt het FAQ-supportdocument "), b("Road Service Bonaire +599 785 2604"), t(".")),
        p(t("Probeer niet zelf reparaties uit te voeren zonder toestemming van Aloha Car Rental.")),
      ],
    },
    {
      id: "returns",
      question: "Waar moet ik het voertuig inleveren?",
      keywords: ["inleverlocatie", "zelfde locatie", "ophaallocatie", "785 5999"],
      blocks: [
        p(t("Voertuigen moeten worden ingeleverd op dezelfde locatie waar ze zijn opgehaald.")),
        p(t("Als je de inleverlocatie wilt wijzigen, neem dan contact op met het kantoor via "), b("+599 785 5999"), t(".")),
      ],
    },
    {
      id: "cleanliness",
      question: "In welke staat moet ik het voertuig terugbrengen?",
      keywords: ["schoon", "schoonmaakkosten", "persoonlijke eigendommen", "inleverconditie"],
      blocks: [
        p(t("Het voertuig moet schoon worden ingeleverd.")),
        p(t("Als het voertuig vuil wordt ingeleverd, kan de huurder schoonmaak- en eventuele reparatie- of vervangingskosten in rekening gebracht krijgen.")),
        p(t("Aloha Car Rental is niet verantwoordelijk voor persoonlijke eigendommen die in het voertuig achterblijven.")),
      ],
    },
    {
      id: "long-term",
      question: "Bieden jullie langetermijnverhuur aan?",
      keywords: ["langetermijn", "lange termijn", "maandhuur", "extended rental"],
      blocks: [p(t("Ja. Neem contact op met Aloha Car Rental via e-mail, telefoon of WhatsApp met de supportgegevens op deze FAQ-pagina om beschikbaarheid en prijzen voor langetermijnhuur te bespreken."))],
    },
    {
      id: "delivery",
      question: "Leveren jullie de auto op een specifieke locatie af?",
      keywords: ["leveren", "afleveren", "specifieke locatie", "hotel", "adres"],
      blocks: [
        p(t("Nee. Voertuigen worden opgehaald bij het hoofdkantoor en niet afgeleverd bij hotels of andere gewenste locaties.")),
        p(t("Aloha Car Rental biedt wel een gratis shuttleservice van de luchthaven, hotels en de meeste delen van Bonaire naar het kantoor.")),
        p(t("Shuttles van en naar Rincon zijn beschikbaar tegen een extra toeslag.")),
      ],
    },
    {
      id: "airport",
      question: "Kan ik de huurauto op de luchthaven ontvangen?",
      keywords: ["luchthaven", "airport", "aankomst", "ophalen"],
      blocks: [
        p(t("Niet direct in de terminal.")),
        p(t("Het hoofdkantoor ligt op ongeveer "), b("5 minuten"), t(" van de luchthaven en Aloha Car Rental biedt een gratis ophaalservice zodat je daar snel je voertuig kunt ophalen.")),
      ],
    },
    {
      id: "advance-booking",
      question: "Hoe ver van tevoren moet ik mijn huurauto reserveren?",
      keywords: ["reserveren", "van tevoren", "vooraf", "last minute", "24 uur"],
      blocks: [
        p(t("Reserveer zo vroeg mogelijk om jouw gewenste voertuig en data vast te leggen.")),
        p(t("Voor last-minute boekingen binnen "), b("24 uur"), t(" kun je Aloha Car Rental het beste direct bellen of appen.")),
      ],
    },
    {
      id: "minimum-rental-rules",
      question: "Waarom kan ik een heel korte huurperiode niet online boeken?",
      keywords: ["minimum huur", "minimum dagen", "korte huur", "alleen admin", "boekingsregels"],
      blocks: [
        p(t("Online boekingen zijn ingesteld op een "), b("minimum van 3 dagen"), t(".")),
        p(t("Kortere huurperiodes kunnen soms wel tegen een hoger tarief, maar daarvoor moet je Aloha Car Rental direct bellen of appen.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "Kan ik een last-minute boeking online maken?",
      keywords: ["last minute", "zelfde dag", "spoedboeking", "24 uur"],
      blocks: [
        p(t("Dat hangt af van de actieve boekingsregels van Aloha Car Rental.")),
        p(t("Als je pickup binnen het ingestelde last-minute venster valt, kan de website een extra percentage toevoegen of vereisen dat medewerkers de boeking rechtstreeks verwerken.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "Regelen jullie soms huur met partner-voertuigen?",
      keywords: ["partnerverhuur", "ander bedrijf", "leveranciersauto", "partnervoertuig"],
      blocks: [
        p(t("Ja. Als Aloha Car Rental voor jouw data volgeboekt is, kunnen we mogelijk via ons lokale partnernetwerk toch een voertuig regelen.")),
        p(t("Neem dan direct contact met ons op, want ook als je online geen beschikbaarheid ziet, kan een partnervoertuig nog mogelijk zijn.")),
      ],
    },
    {
      id: "soft-top-jeeps",
      question: "Gelden er speciale regels voor soft-top jeeps?",
      keywords: ["soft-top", "jeep", "dak", "regen", "nacht"],
      blocks: [
        p(t("Ja. Het dak van een soft-top jeep moet 's nachts en bij regen gesloten zijn.")),
        p(t("Als het dak open blijft, is de huurder aansprakelijk voor eventuele elektrische schade aan het interieur.")),
      ],
    },
  ],
  es: [
    {
      id: "terms-priority",
      question: "¿Estas respuestas del FAQ reemplazan los términos y condiciones de alquiler?",
      keywords: ["términos", "condiciones", "política", "oficial", "legal", "prioridad", "faq", "vinculante", "pdf", "contrato", "acuerdo", "prevalece"],
      blocks: [
        p(t("No. Estas respuestas del FAQ son un resumen práctico para arrendatarios.")),
        p(t("Los Términos y Condiciones oficiales de Aloha Car Rental siguen siendo la fuente vinculante para cobertura, depósito, elegibilidad, cargos y responsabilidades.")),
        p(t("Si algo parece diferente, siga el PDF de Términos y Condiciones y contacte a soporte de Aloha para aclaración.")),
      ],
    },
    {
      id: "accident",
      question: "¿Qué debo hacer en caso de accidente?",
      keywords: ["accidente", "choque", "colisión", "emergencia", "forensys", "911", "caribbean road service", "crs", "informe policial", "717 9292", "795 9292"],
      blocks: [
        list(
          [b("Llame a emergencias:"), t(" Marque "), b("911"), t(" si hay heridos o si alguien necesita atención médica urgente.")],
          [b("Llame a Caribbean Road Service:"), t(" Contacte a CRS al "), b("+599 717 9292"), t(" o WhatsApp "), b("+599 795 9292"), t(" de inmediato. Llamar a CRS es obligatorio." )],
          [b("Contacte soporte de Aloha de inmediato:"), t(" Después de contactar a CRS, avise enseguida a Aloha Car Rental para que podamos coordinar los siguientes pasos.")],
          [b("El informe policial es obligatorio:"), t(" Un informe policial válido es obligatorio para la gestión del seguro." )],
          [b("No mueva el vehículo:"), t(" Espere a que CRS, la policía o emergencias le indiquen que es seguro mover el vehículo.")],
          [b("No abandone el lugar:"), t(" Permanezca allí hasta que CRS y las autoridades terminen el informe. Sin ese informe, la cobertura del seguro puede quedar anulada y el arrendatario puede tener que pagar todos los costos.")],
        ),
        p(t("Seguir estos pasos ayuda a documentar correctamente el incidente y a proteger su cobertura.")),
      ],
    },
    {
      id: "damage",
      question: "¿Qué debo hacer si el auto alquilado sufre daños?",
      keywords: ["parabrisas", "golpe", "forensys", "reporte", "vehículo dañado", "auto dañado"],
      blocks: [
        list(
          [b("No mueva el auto:"), t(" Deje el vehículo donde ocurrió el daño, ya sea por un poste, piedra, parabrisas, estacionamiento o accidente de tránsito.")],
          [b("Llame a Caribbean Road Service:"), t(" Contacte a CRS al "), b("+599 717 9292"), t(" o WhatsApp "), b("+599 795 9292"), t(" de inmediato." )],
          [b("Contacte soporte de Aloha de inmediato:"), t(" Después de contactar a CRS, avise enseguida a Aloha Car Rental para que podamos coordinar los siguientes pasos.")],
          [b("Siga las instrucciones:"), t(" Mueva el auto solo cuando el personal de CRS, la policía o emergencias indiquen que es seguro hacerlo.")],
        ),
        p(t("Este procedimiento mantiene el caso bien documentado y ayuda a conservar la validez del seguro. Sin el informe de CRS y la policía, la cobertura del seguro puede quedar anulada y el arrendatario puede tener que pagar todos los costos.")),
      ],
    },
    {
      id: "minimum-age",
      question: "¿Cuál es la edad mínima para alquilar un vehículo?",
      keywords: ["edad mínima", "conductor joven", "licencia", "van", "vehículo", "elegibilidad", "requisito licencia", "términos pdf"],
      blocks: [
        p(t("La edad mínima estándar es "), b("21 años"), t(".")),
        p(t("Los conductores de "), b("19 y 20 años"), t(" también pueden alquilar, pero deben dejar un depósito de seguridad de "), b("$750"), t(".")),
        p(t("Los conductores de "), b("21 años o más"), t(" requieren el depósito estándar de "), b("$500"), t(".")),
        p(t("Todos los conductores autorizados deben aparecer en el contrato y tener una licencia de conducir válida.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "¿Cuáles son las opciones de seguro y depósito?",
      keywords: ["seguro", "cobertura", "depósito", "deducible", "all risk", "todo riesgo", "cdw", "seguro full", "$100", "$500", "$600", "informe policial"],
      blocks: [
        p(t("Todos los alquileres incluyen "), b("CDW básico"), t(" como la opción de seguro estándar.")),
        p(t("Con CDW aceptado, el deducible es de "), b("$500"), t(" para autos y "), b("$600"), t(" para pickups, jeeps, SUVs y vans.")),
        p(t("También hay una opción de "), b("seguro full / premium todo riesgo"), t(". Si se acepta, el deducible es de "), b("$100"), t(".")),
        p(t("El seguro full cubre robo, joy-riding y accidentes de un solo vehículo. Es obligatorio presentar un informe policial válido para reclamos.")),
        p(t("Ni el CDW ni el seguro full cubren conducir bajo la influencia del alcohol o drogas, exceso de velocidad, conducción off-road no autorizada o daños a terceros por encima de "), b("$50,000"), t(".")),
        p(t("Si no se acepta el seguro, o si la cobertura queda invalidada, el arrendatario es responsable del monto total de daños y pérdidas, incluyendo daños por agua.")),
      ],
    },
    {
      id: "pricing-includes",
      question: "¿Los precios de alquiler incluyen impuestos y seguro?",
      keywords: ["impuestos", "abb", "incluido", "tarifa", "cdw", "seguro incluido"],
      blocks: [
        p(t("Sí. Los precios de alquiler incluyen "), b("6% ABB"), t(" y "), b("CDW básico"), t(".")),
        p(t("Para mayor protección, puede elegir en el mostrador la mejora a seguro premium/full por una tarifa diaria adicional.")),
      ],
    },
    {
      id: "kilometers",
      question: "¿Cuántos kilómetros puedo conducir por día?",
      keywords: ["kilómetros", "kilometros", "millas", "ilimitado", "distancia"],
      blocks: [p(t("Los kilómetros son ilimitados."))],
    },
    {
      id: "payment-methods",
      question: "¿Aceptan efectivo o tarjetas de crédito?",
      keywords: ["efectivo", "cash", "tarjeta", "tarjetas", "maestro", "amex", "visa", "mastercard", "pago", "autorización de pago", "poder notarial", "pago por daños", "pago en oficina"],
      blocks: [
        p(t("Aloha Car Rental acepta efectivo en "), b("dólares estadounidenses"), t(", "), b("Maestro"), t(", "), b("Visa"), t(", "), b("Mastercard"), t(", "), b("Discover"), t(" y "), b("Diners Club"), t(".")),
        p(t("Los pagos con tarjeta de crédito tienen un "), b("cargo administrativo del 6%"), t(".")),
        p(t("No aceptamos "), b("American Express (AMEX)"), t(".")),
        p(t("Según los Términos y Condiciones, el arrendatario autoriza a Aloha Car Rental a usar cualquier tarjeta de crédito proporcionada para pagar daños o pérdidas cuando corresponda.")),
      ],
    },
    {
      id: "euros",
      question: "¿Puedo pagar en euros?",
      keywords: ["euro", "euros", "moneda", "guilder", "dólares", "dolares"],
      blocks: [
        p(t("No, no aceptamos euros. Los pagos en efectivo pueden hacerse en dólares estadounidenses.")),
        p(t("También puede pagar con nuestra máquina móvil bancaria.")),
      ],
    },
    {
      id: "fuel-policy",
      question: "¿Cuál es su política de combustible?",
      keywords: ["combustible", "gasolina", "tanque", "full to full", "lleno a lleno", "1/8 de tanque", "combustible faltante", "$20", "$25", "sin reembolso"],
      blocks: [
        p(t("La política de combustible de Aloha Car Rental es "), b("lleno a lleno"), t(".")),
        p(t("Los vehículos se entregan llenos y deben devolverse llenos.")),
        p(b("Importante:"), t(" El combustible faltante se cobra a "), b("$20"), t(" por cada "), b("1/8 de tanque"), t(" (autos) o "), b("$25"), t(" por cada "), b("1/8 de tanque"), t(" (jeeps/SUVs/vans/pickups). No hay reembolso por combustible extra.")),
      ],
    },
    {
      id: "wrong-fuel",
      question: "¿Qué debo hacer si pongo el combustible equivocado?",
      keywords: ["combustible equivocado", "misfuel", "diesel", "gasolina", "daño motor"],
      blocks: [
        p(t("No encienda el motor.")),
        p(t("Contacte a Aloha Car Rental inmediatamente para recibir instrucciones.")),
        p(t("El combustible equivocado y cualquier daño al motor resultante no están cubiertos por el seguro estándar.")),
      ],
    },
    {
      id: "authorized-drivers",
      question: "¿Quién puede conducir el auto alquilado?",
      keywords: ["conductor", "conductor adicional", "autorizado", "cofirmante", "cosign"],
      blocks: [p(t("Solo el arrendatario y cualquier conductor adicional que figure en el contrato están autorizados para conducir el vehículo."))],
    },
    {
      id: "off-road",
      question: "¿Puedo conducir el vehículo de alquiler fuera de carretera?",
      keywords: ["off-road", "arena blanca", "dunas", "uso no autorizado", "terreno"],
      blocks: [
        p(t("No. No se permite conducir fuera de carretera, sobre arena blanca ni en dunas.")),
        p(t("Cualquier daño causado por uso off-road no autorizado es responsabilidad del arrendatario y puede invalidar la cobertura del seguro.")),
      ],
    },
    {
      id: "flat-tire",
      question: "¿Qué pasa si se me pincha una llanta?",
      keywords: ["llanta pinchada", "ponchada", "reparación", "asistencia", "$35"],
      blocks: [
        p(t("Hay asistencia disponible para una llanta pinchada cerca de la ciudad.")),
        p(t("El costo de reparación es de "), b("$35"), t(".")),
      ],
    },
    {
      id: "lost-keys",
      question: "¿Qué debo hacer si pierdo las llaves del auto?",
      keywords: ["llaves perdidas", "llave de reemplazo", "llave con chip", "control remoto", "lockout"],
      blocks: [
        p(t("Contacte a Aloha Car Rental inmediatamente para que podamos organizar una llave de reemplazo o asistencia por cierre fuera del vehículo.")),
        p(t("Los costos de reemplazo se cobran al arrendatario. Los precios de referencia en los términos son "), b("$20"), t(" por llave estándar, "), b("$160"), t(" por llave con chip, "), b("$260"), t(" por llave con chip y control remoto, y "), b("$20"), t(" por servicio de apertura.")),
      ],
    },
    {
      id: "warning-light",
      question: "¿Qué debo hacer si aparece una luz de advertencia en el tablero?",
      keywords: ["luz de advertencia", "tablero", "check engine", "indicador"],
      blocks: [
        p(t("Estacione el vehículo en un lugar seguro y contacte a Aloha Car Rental inmediatamente.")),
        p(t("Le indicaremos el siguiente paso para que pueda continuar con seguridad.")),
      ],
    },
    {
      id: "breakdown",
      question: "¿Qué debo hacer si el auto se avería o no enciende?",
      keywords: ["avería", "no enciende", "asistencia", "problema técnico", "785 2604"],
      blocks: [
        p(t("Contacte inmediatamente la asistencia en carretera si el auto se avería o no enciende.")),
        p(t("Para problemas técnicos, el documento de soporte FAQ indica "), b("Road Service Bonaire +599 785 2604"), t(".")),
        p(t("No intente hacer reparaciones por su cuenta sin autorización de Aloha Car Rental.")),
      ],
    },
    {
      id: "returns",
      question: "¿Dónde debo devolver el vehículo?",
      keywords: ["lugar de devolución", "misma ubicación", "lugar de recogida", "785 5999"],
      blocks: [
        p(t("Los vehículos deben devolverse en el mismo lugar donde fueron recogidos.")),
        p(t("Si necesita cambiar el lugar de devolución, contacte a la oficina al "), b("+599 785 5999"), t(".")),
      ],
    },
    {
      id: "cleanliness",
      question: "¿En qué estado debo devolver el vehículo?",
      keywords: ["limpio", "cargo de limpieza", "objetos personales", "condición de devolución"],
      blocks: [
        p(t("El vehículo debe devolverse limpio.")),
        p(t("Si se devuelve sucio, al arrendatario se le pueden cobrar costos de limpieza y cualquier reparación o reemplazo necesario.")),
        p(t("Aloha Car Rental no se hace responsable por objetos personales dejados dentro del vehículo.")),
      ],
    },
    {
      id: "long-term",
      question: "¿Ofrecen alquileres a largo plazo?",
      keywords: ["largo plazo", "alquiler largo", "mensual", "extended rental"],
      blocks: [p(t("Sí. Contacte a Aloha Car Rental por correo, teléfono o WhatsApp usando los datos de soporte de esta página FAQ para consultar disponibilidad y precios de alquiler a largo plazo."))],
    },
    {
      id: "delivery",
      question: "¿Entregan el auto en una ubicación específica?",
      keywords: ["entrega", "entregar", "ubicación específica", "hotel", "dirección"],
      blocks: [
        p(t("No. Los vehículos se recogen en la oficina principal y no se entregan en hoteles u otras ubicaciones personalizadas.")),
        p(t("Aloha Car Rental sí ofrece un servicio de traslado gratuito desde el aeropuerto, hoteles y la mayoría de las zonas de Bonaire hasta la oficina.")),
        p(t("Los traslados hacia y desde Rincon están disponibles por una tarifa adicional.")),
      ],
    },
    {
      id: "airport",
      question: "¿Puedo recibir el auto de alquiler en el aeropuerto?",
      keywords: ["aeropuerto", "llegada", "recibir auto", "recoger"],
      blocks: [
        p(t("No directamente dentro de la terminal.")),
        p(t("La oficina principal está a unos "), b("5 minutos"), t(" del aeropuerto, y Aloha Car Rental ofrece un servicio de recogida gratuito para llevarle allí y retirar su vehículo rápidamente.")),
      ],
    },
    {
      id: "advance-booking",
      question: "¿Con cuánta anticipación debo reservar mi auto de alquiler?",
      keywords: ["reservar", "anticipación", "adelantado", "último minuto", "24 horas"],
      blocks: [
        p(t("Reserve lo antes posible para asegurar el vehículo y las fechas que prefiere.")),
        p(t("Para reservas de último minuto dentro de "), b("24 horas"), t(", contacte a Aloha Car Rental directamente por WhatsApp o teléfono.")),
      ],
    },
    {
      id: "minimum-rental-rules",
      question: "¿Por qué no puedo reservar un alquiler muy corto en línea?",
      keywords: ["alquiler mínimo", "días mínimos", "alquiler corto", "solo admin", "reglas de reserva"],
      blocks: [
        p(t("Las reservas en línea están configuradas para un "), b("mínimo de 3 días"), t(".")),
        p(t("Los alquileres más cortos pueden ser posibles con una tarifa premium, pero debe contactar directamente a Aloha Car Rental por teléfono o WhatsApp.")),
      ],
    },
    {
      id: "last-minute-rules",
      question: "¿Puedo hacer una reserva de última hora en línea?",
      keywords: ["última hora", "mismo día", "reserva urgente", "24 horas"],
      blocks: [
        p(t("Depende de las reglas activas de reserva de Aloha Car Rental.")),
        p(t("Si la recogida cae dentro de la ventana configurada de última hora, el sitio puede añadir un porcentaje extra o requerir que el personal gestione la reserva directamente.")),
      ],
    },
    {
      id: "partner-rentals",
      question: "¿A veces gestionan alquileres con vehículos de socios?",
      keywords: ["alquiler de socios", "otra empresa", "vehículo de proveedor", "vehículo socio"],
      blocks: [
        p(t("Sí. Si Aloha Car Rental está completo para sus fechas, aún podemos intentar conseguirle un vehículo a través de nuestra red local de socios.")),
        p(t("Contáctenos directamente si no ve disponibilidad en línea, porque un vehículo de un socio todavía puede ser posible.")),
      ],
    },
    {
      id: "soft-top-jeeps",
      question: "¿Hay reglas especiales para los jeeps soft-top?",
      keywords: ["soft-top", "jeep", "techo", "lluvia", "noche"],
      blocks: [
        p(t("Sí. Los techos de los jeeps soft-top deben permanecer cerrados por la noche y cuando llueve.")),
        p(t("Si se dejan abiertos, el arrendatario será responsable de cualquier daño eléctrico interior.")),
      ],
    },
  ],
};

const systemFaqByLocale: Record<FaqLocale, FaqEntry[]> = {
  en: [
    {
      id: "system-online-booking",
      question: "How does the online booking flow work?",
      keywords: ["online booking", "public flow", "dates", "locations", "extras"],
      blocks: [
        p(t("Customers browse active categories, choose dates and locations, add extras, and submit bookings from the public website.")),
        p(t("Totals are calculated from configured rates, tax settings, booking rules, discount codes, and selected extras.")),
      ],
    },
    {
      id: "system-availability-rules",
      question: "How does the system enforce availability and booking rules?",
      keywords: ["availability", "double booking", "blockout", "minimum days", "booking hold", "last minute"],
      blocks: [
        p(t("Availability checks combine active bookings, vehicle status, and vehicle blockouts to prevent overlapping allocations.")),
        p(t("Booking settings support minimum booking days, hold windows, and last-minute behavior with surcharge or manual handling options.")),
      ],
    },
    {
      id: "system-booking-lifecycle",
      question: "What booking lifecycle actions are supported in admin?",
      keywords: ["confirm", "decline", "notes", "delivered", "returned", "status"],
      blocks: [
        p(t("Teams can confirm or decline bookings, add internal notes, and move bookings through delivered and returned states.")),
        p(t("This gives operational control from request intake to final closeout.")),
      ],
    },
    {
      id: "system-pickup-return",
      question: "How do pickup, return, and inspection workflows work?",
      keywords: ["pickup", "return", "inspection", "checklist", "handover", "photos"],
      blocks: [
        p(t("Pickup and return workflows support location-level handover and status transitions.")),
        p(t("Teams can complete pickup and return inspections, upload inspection images, and save notes for follow-up.")),
      ],
    },
    {
      id: "system-fleet",
      question: "What fleet management features are included?",
      keywords: ["fleet", "vehicles", "categories", "features", "locations", "status"],
      blocks: [
        list(
          [t("Category and vehicle management with pricing context")],
          [t("Vehicle feature catalog and assignment")],
          [t("Pickup and return location management")],
          [t("Vehicle status updates and operational blockouts")],
        ),
      ],
    },
    {
      id: "system-inventory-management",
      question: "How does inventory management work?",
      keywords: ["inventory", "parts", "transactions", "purchase", "usage", "adjustment", "return"],
      blocks: [
        p(t("Admin teams can create inventory parts and record stock transactions by type: purchase, usage, adjustment, and return.")),
        p(t("Inventory views expose stock levels, low-stock indicators, and stock value for operations planning.")),
      ],
    },
    {
      id: "system-maintenance-operations",
      question: "What maintenance, insurance, and inspection operations are tracked?",
      keywords: ["maintenance", "insurance", "inspection", "compliance", "records"],
      blocks: [
        p(t("The system tracks vehicle maintenance records, insurance records, and inspection records in admin workflows.")),
        p(t("These records support readiness decisions, service scheduling, and operational compliance visibility.")),
      ],
    },
    {
      id: "system-pricing-promotions",
      question: "How are pricing, extras, and discounts handled?",
      keywords: ["pricing", "tax", "discount code", "extras", "rates", "settings"],
      blocks: [
        p(t("Teams can manage category rates, tax settings, extra items, and discount codes from admin modules.")),
        p(t("Discount codes and extras can be applied to bookings while totals are recalculated through billing actions.")),
      ],
    },
    {
      id: "system-billing",
      question: "What billing and payment workflows are supported?",
      keywords: ["invoice", "estimate", "sales receipt", "payment", "billing email"],
      blocks: [
        p(t("The platform supports invoice estimates, invoice generation, billing-document emails, sales receipts, and payment receipt logging.")),
        p(t("Billing workflows are linked to booking status so finance and operations stay aligned.")),
      ],
    },
    {
      id: "system-integrations",
      question: "Which accounting integrations are available?",
      keywords: ["quickbooks", "zoho", "integration", "sync", "transfer"],
      blocks: [
        p(t("QuickBooks and Zoho admin modules support booking-level transfer and sync actions.")),
        p(t("Teams can run pending transfer sync and refresh related integration caches.")),
      ],
    },
    {
      id: "system-documents",
      question: "Can customers upload licenses and documents?",
      keywords: ["license", "document", "upload", "driver license", "files"],
      blocks: [
        p(t("Yes. The booking flow supports driver-license and related document uploads for validation workflows.")),
        p(t("Uploaded files are restricted by admin permissions and retention rules.")),
      ],
    },
    {
      id: "system-partner-rentals",
      question: "How are external and partner rental flows handled?",
      keywords: ["external rental", "partner rental", "transferred", "inspection"],
      blocks: [
        p(t("External rental workflows can be created and tracked separately from core fleet allocations.")),
        p(t("Admin actions support transfer states, flow updates, and external-rental inspection completion.")),
      ],
    },
    {
      id: "system-users-notifications-reviews",
      question: "How does the system handle users, notifications, and reviews?",
      keywords: ["users", "roles", "notifications", "reviews", "admin users"],
      blocks: [
        p(t("Admin user management supports creating, updating, and deleting staff users with controlled access.")),
        p(t("Notifications can be fetched and dismissed, and review visibility can be controlled from admin workflows.")),
      ],
    },
    {
      id: "system-localization",
      question: "Is the system ready for Caribbean operations?",
      keywords: ["caribbean", "languages", "multi-language", "locations"],
      blocks: [
        p(t("The product is designed for Caribbean rental operations with multi-location pickup/return workflows and localized public pages.")),
        p(t("Current language support includes English, Spanish, and Dutch.")),
      ],
    },
    {
      id: "system-deployment",
      question: "Can this system be reused for other deployments?",
      keywords: ["deployment", "tenant", "profile", "rental", "system", "saas"],
      blocks: [
        p(t("Yes. Tenant settings, metadata, and content profiles can be adapted for different deployments.")),
        p(t("The codebase separates rental and system FAQ profiles so messaging stays aligned with the active product context.")),
      ],
    },
  ],
  nl: [
    {
      id: "system-online-booking",
      question: "Hoe werkt de online boekingsflow?",
      keywords: ["online boeken", "publieke flow", "datums", "locaties", "extras"],
      blocks: [
        p(t("Klanten bekijken actieve categorieen, kiezen datums en locaties, voegen extras toe en dienen boekingen in via de publieke website.")),
        p(t("Totalen worden berekend op basis van ingestelde tarieven, btw-instellingen, boekingsregels, kortingscodes en gekozen extras.")),
      ],
    },
    {
      id: "system-availability-rules",
      question: "Hoe dwingt het systeem beschikbaarheid en boekingsregels af?",
      keywords: ["beschikbaarheid", "dubbele boeking", "blockout", "minimum dagen", "booking hold", "last minute"],
      blocks: [
        p(t("Beschikbaarheidscontroles combineren actieve boekingen, voertuigstatus en voertuigblockouts om overlap te voorkomen.")),
        p(t("Boekingsinstellingen ondersteunen minimumhuurdagen, holdvensters en last-minute gedrag met toeslag- of handmatige afhandelingsopties.")),
      ],
    },
    {
      id: "system-booking-lifecycle",
      question: "Welke lifecycle-acties zijn beschikbaar voor boekingen in admin?",
      keywords: ["bevestigen", "afwijzen", "notities", "afgeleverd", "geretourneerd", "status"],
      blocks: [
        p(t("Teams kunnen boekingen bevestigen of afwijzen, interne notities toevoegen en boekingen door afgeleverd- en geretourneerd-status bewegen.")),
        p(t("Dit geeft operationele controle van intake tot definitieve afsluiting.")),
      ],
    },
    {
      id: "system-pickup-return",
      question: "Hoe werken pickup-, return- en inspectieworkflows?",
      keywords: ["pickup", "return", "inspectie", "checklist", "overdracht", "fotos"],
      blocks: [
        p(t("Pickup- en returnworkflows ondersteunen overdracht per locatie en operationele statustransities.")),
        p(t("Teams kunnen pickup- en returninspecties afronden, inspectiebeelden uploaden en opvolgnotities bewaren.")),
      ],
    },
    {
      id: "system-fleet",
      question: "Welke vlootbeheerfuncties zijn inbegrepen?",
      keywords: ["vloot", "voertuigen", "categorieen", "features", "locaties", "status"],
      blocks: [
        list(
          [t("Beheer van categorieen en voertuigen met prijscontext")],
          [t("Catalogus en toewijzing van voertuigfeatures")],
          [t("Pickup- en returnlocatiebeheer")],
          [t("Voertuigstatusupdates en operationele blockouts")],
        ),
      ],
    },
    {
      id: "system-inventory-management",
      question: "Hoe werkt inventorybeheer?",
      keywords: ["inventory", "onderdelen", "transacties", "aankoop", "verbruik", "correctie", "retour"],
      blocks: [
        p(t("Adminteams kunnen inventory-onderdelen aanmaken en voorraadtransacties registreren per type: aankoop, verbruik, correctie en retour.")),
        p(t("Inventory-overzichten tonen voorraadniveaus, low-stock signalen en voorraadwaarde voor operationele planning.")),
      ],
    },
    {
      id: "system-maintenance-operations",
      question: "Welke onderhouds-, verzekerings- en inspectieoperaties worden bijgehouden?",
      keywords: ["onderhoud", "verzekering", "inspectie", "compliance", "registraties"],
      blocks: [
        p(t("Het systeem houdt voertuigonderhoudsrecords, verzekeringsrecords en inspectierecords bij in adminworkflows.")),
        p(t("Deze registraties ondersteunen inzetbaarheidsbeslissingen, serviceplanning en compliance-zichtbaarheid.")),
      ],
    },
    {
      id: "system-pricing-promotions",
      question: "Hoe worden prijzen, extras en kortingen beheerd?",
      keywords: ["prijzen", "btw", "kortingscode", "extras", "tarieven", "instellingen"],
      blocks: [
        p(t("Teams beheren categorietarieven, btw-instellingen, extra items en kortingscodes vanuit adminmodules.")),
        p(t("Kortingscodes en extras kunnen op boekingen worden toegepast terwijl totalen via billingacties worden herberekend.")),
      ],
    },
    {
      id: "system-billing",
      question: "Welke facturatie- en betalingsworkflows ondersteunt het systeem?",
      keywords: ["factuur", "offerte", "sales receipt", "betaling", "billing email"],
      blocks: [
        p(t("Het platform ondersteunt factuuroffertes, factuurgeneratie, e-mails met billingdocumenten, sales receipts en betalingsregistratie.")),
        p(t("Facturatieflows zijn gekoppeld aan boekingsstatus zodat finance en operatie op elkaar blijven aansluiten.")),
      ],
    },
    {
      id: "system-integrations",
      question: "Welke boekhoudintegraties zijn beschikbaar?",
      keywords: ["quickbooks", "zoho", "integratie", "sync", "transfer"],
      blocks: [
        p(t("QuickBooks- en Zoho-adminmodules ondersteunen transfer- en syncacties per boeking.")),
        p(t("Teams kunnen pending transfers synchroniseren en gerelateerde integratiecaches vernieuwen.")),
      ],
    },
    {
      id: "system-documents",
      question: "Kunnen klanten rijbewijzen en documenten uploaden?",
      keywords: ["rijbewijs", "document", "upload", "bestanden", "license"],
      blocks: [
        p(t("Ja. De boekingsflow ondersteunt uploads van rijbewijs en gerelateerde documenten voor validatie.")),
        p(t("Geuploade bestanden zijn afgeschermd via adminrechten en retentieregels.")),
      ],
    },
    {
      id: "system-partner-rentals",
      question: "Hoe worden externe en partnerverhuurflows afgehandeld?",
      keywords: ["externe verhuur", "partnerverhuur", "transferred", "inspectie"],
      blocks: [
        p(t("Externe verhuurflows kunnen apart van kernvlootallocaties worden aangemaakt en gevolgd.")),
        p(t("Adminacties ondersteunen transferstatus, flow-updates en afronding van externe verhuurinspecties.")),
      ],
    },
    {
      id: "system-users-notifications-reviews",
      question: "Hoe behandelt het systeem gebruikers, meldingen en reviews?",
      keywords: ["gebruikers", "rollen", "meldingen", "reviews", "admin users"],
      blocks: [
        p(t("Admingebruikersbeheer ondersteunt het aanmaken, bijwerken en verwijderen van medewerkers met gecontroleerde toegang.")),
        p(t("Meldingen kunnen worden opgehaald en afgehandeld, en reviewzichtbaarheid kan vanuit adminworkflows worden beheerd.")),
      ],
    },
    {
      id: "system-localization",
      question: "Is het systeem klaar voor Caribische operaties?",
      keywords: ["caribisch", "talen", "meertalig", "locaties"],
      blocks: [
        p(t("Het product is ontworpen voor Caribische verhuuroperaties met multi-locatie pickup/returnworkflows en gelokaliseerde publieke paginas.")),
        p(t("Huidige taalondersteuning omvat Engels, Spaans en Nederlands.")),
      ],
    },
    {
      id: "system-deployment",
      question: "Kan dit systeem hergebruikt worden voor andere deployments?",
      keywords: ["deployment", "tenant", "profiel", "rental", "system", "saas"],
      blocks: [
        p(t("Ja. Tenantinstellingen, metadata en contentprofielen kunnen worden aangepast voor verschillende deployments.")),
        p(t("De codebase scheidt rental- en system-FAQ-profielen zodat messaging aansluit op de actieve productcontext.")),
      ],
    },
  ],
  es: [
    {
      id: "system-online-booking",
      question: "¿Como funciona el flujo de reservas en linea?",
      keywords: ["reserva en linea", "flujo publico", "fechas", "ubicaciones", "extras"],
      blocks: [
        p(t("Los clientes ven categorias activas, eligen fechas y ubicaciones, agregan extras y envian reservas desde el sitio publico.")),
        p(t("Los totales se calculan con tarifas configuradas, ajustes de impuestos, reglas de reserva, codigos de descuento y extras seleccionados.")),
      ],
    },
    {
      id: "system-availability-rules",
      question: "¿Como aplica el sistema disponibilidad y reglas de reserva?",
      keywords: ["disponibilidad", "reserva duplicada", "bloqueo", "dias minimos", "booking hold", "ultima hora"],
      blocks: [
        p(t("Los controles de disponibilidad combinan reservas activas, estado del vehiculo y bloqueos para evitar asignaciones superpuestas.")),
        p(t("Las reglas de reserva soportan dias minimos, ventanas de hold y comportamiento de ultima hora con recargo o manejo manual.")),
      ],
    },
    {
      id: "system-booking-lifecycle",
      question: "¿Que acciones del ciclo de vida de reserva existen en admin?",
      keywords: ["confirmar", "rechazar", "notas", "entregado", "devuelto", "estado"],
      blocks: [
        p(t("Los equipos pueden confirmar o rechazar reservas, agregar notas internas y mover reservas por estados de entregado y devuelto.")),
        p(t("Esto mantiene control operativo desde la solicitud inicial hasta el cierre.")),
      ],
    },
    {
      id: "system-pickup-return",
      question: "¿Como funcionan recogida, devolucion e inspecciones?",
      keywords: ["recogida", "devolucion", "inspeccion", "checklist", "entrega", "fotos"],
      blocks: [
        p(t("Los flujos de recogida y devolucion soportan entrega por ubicacion y transiciones de estado operativas.")),
        p(t("Los equipos pueden completar inspecciones de recogida y devolucion, subir imagenes de inspeccion y guardar notas de seguimiento.")),
      ],
    },
    {
      id: "system-fleet",
      question: "¿Que funciones de gestion de flota incluye?",
      keywords: ["flota", "vehiculos", "categorias", "features", "ubicaciones", "estado"],
      blocks: [
        list(
          [t("Gestion de categorias y vehiculos con contexto de precios")],
          [t("Catalogo y asignacion de caracteristicas de vehiculo")],
          [t("Gestion de ubicaciones para recogida y devolucion")],
          [t("Actualizaciones de estado del vehiculo y bloqueos operativos")],
        ),
      ],
    },
    {
      id: "system-inventory-management",
      question: "¿Como funciona la gestion de inventario?",
      keywords: ["inventario", "partes", "transacciones", "compra", "uso", "ajuste", "devolucion"],
      blocks: [
        p(t("Los equipos admin pueden crear partes de inventario y registrar transacciones por tipo: compra, uso, ajuste y devolucion.")),
        p(t("Las vistas de inventario muestran niveles de stock, alertas de stock bajo y valor de stock para operaciones.")),
      ],
    },
    {
      id: "system-maintenance-operations",
      question: "¿Que operaciones de mantenimiento, seguro e inspeccion se registran?",
      keywords: ["mantenimiento", "seguro", "inspeccion", "cumplimiento", "registros"],
      blocks: [
        p(t("El sistema registra mantenimientos, seguros e inspecciones de vehiculos dentro de flujos administrativos.")),
        p(t("Estos registros apoyan decisiones de disponibilidad, programacion de servicio y visibilidad de cumplimiento.")),
      ],
    },
    {
      id: "system-pricing-promotions",
      question: "¿Como se gestionan precios, extras y descuentos?",
      keywords: ["precios", "impuestos", "codigo descuento", "extras", "tarifas", "ajustes"],
      blocks: [
        p(t("Los equipos gestionan tarifas por categoria, ajustes de impuestos, extras y codigos de descuento desde admin.")),
        p(t("Los codigos y extras se aplican a reservas mientras los totales se recalculan en acciones de facturacion.")),
      ],
    },
    {
      id: "system-billing",
      question: "¿Que flujos de facturacion y pago soporta la plataforma?",
      keywords: ["factura", "estimado", "sales receipt", "pago", "correo facturacion"],
      blocks: [
        p(t("La plataforma soporta estimados de factura, generacion de factura, envio de documentos de cobro, sales receipts y registro de pagos.")),
        p(t("Los flujos de facturacion se conectan con el estado de la reserva para mantener finanzas y operaciones alineadas.")),
      ],
    },
    {
      id: "system-integrations",
      question: "¿Que integraciones contables estan disponibles?",
      keywords: ["quickbooks", "zoho", "integracion", "sync", "transfer"],
      blocks: [
        p(t("Los modulos admin de QuickBooks y Zoho permiten acciones de transferencia y sincronizacion por reserva.")),
        p(t("Los equipos pueden sincronizar transferencias pendientes y refrescar caches relacionadas de integracion.")),
      ],
    },
    {
      id: "system-documents",
      question: "¿Los clientes pueden subir licencias y documentos?",
      keywords: ["licencia", "documento", "subida", "archivos", "driver license"],
      blocks: [
        p(t("Si. El flujo de reserva permite subir licencias y documentos relacionados para validacion.")),
        p(t("Los archivos cargados quedan restringidos por permisos administrativos y reglas de retencion.")),
      ],
    },
    {
      id: "system-partner-rentals",
      question: "¿Como se gestionan flujos de alquiler externo o con socios?",
      keywords: ["alquiler externo", "alquiler socio", "transferido", "inspeccion"],
      blocks: [
        p(t("Los flujos de alquiler externo se crean y gestionan por separado de la asignacion de flota principal.")),
        p(t("Las acciones admin incluyen estados de transferencia, actualizaciones de flujo y cierre de inspeccion externa.")),
      ],
    },
    {
      id: "system-users-notifications-reviews",
      question: "¿Como gestiona el sistema usuarios, notificaciones y resenas?",
      keywords: ["usuarios", "roles", "notificaciones", "resenas", "admin users"],
      blocks: [
        p(t("La gestion de usuarios admin permite crear, actualizar y eliminar personal con acceso controlado.")),
        p(t("Las notificaciones pueden consultarse y descartarse, y la visibilidad de resenas se controla desde admin.")),
      ],
    },
    {
      id: "system-localization",
      question: "¿El sistema esta listo para operaciones del Caribe?",
      keywords: ["caribe", "idiomas", "multilenguaje", "ubicaciones"],
      blocks: [
        p(t("El producto esta disenado para operaciones de alquiler del Caribe con flujos multiubicacion de recogida/devolucion y paginas publicas localizadas.")),
        p(t("El soporte actual de idioma incluye ingles, espanol y neerlandes.")),
      ],
    },
    {
      id: "system-deployment",
      question: "¿Puede reutilizarse este sistema para otros despliegues?",
      keywords: ["despliegue", "tenant", "perfil", "rental", "system", "saas"],
      blocks: [
        p(t("Si. La configuracion de tenant, los metadatos y los perfiles de contenido pueden adaptarse para distintos despliegues.")),
        p(t("La base de codigo separa perfiles FAQ de rental y system para mantener el mensaje alineado al contexto activo.")),
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
