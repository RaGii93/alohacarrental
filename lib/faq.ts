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
          [b("Call Caribbean Road Service:"), t(" Contact CRS at "), b("+599 717 9292"), t(" or WhatsApp "), b("+599 795 9292"), t(" for roadside support." )],
          [b("Contact Aloha Support Immediately:"), t(" Contact Aloha Car Rental support as soon as it is safe so our team can guide local reporting and insurance steps.")],
          [b("Police Report Is Mandatory:"), t(" A valid police report is required for insurance processing.")],
          [b("Do Not Move the Vehicle:"), t(" Leave the vehicle where it is unless emergency services, police, or CRS instruct you to move it.")],
          [b("Do Not Leave the Scene:"), t(" Stay there until the incident is properly documented. Leaving too early can affect insurance coverage.")],
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
          [b("Contact Aloha Support Immediately:"), t(" Reach out right away so Aloha Car Rental support can explain the local reporting process and next steps.")],
          [b("Follow Instructions:"), t(" Move the car only after police, emergency responders, or support confirms it is safe.")],
        ),
        p(t("This procedure keeps the incident documented correctly and helps keep your insurance valid.")),
      ],
    },
    {
      id: "theft",
      question: "What should I do if the rental car is stolen?",
      keywords: ["theft", "stolen", "police", "punda", "otrobanda", "911"],
      blocks: [
        list(
          [b("Contact Us Immediately:"), t(" Call Aloha Car Rental immediately using the support phone number shown on this FAQ page (and on your booking confirmation) as soon as you realize the vehicle is missing.")],
          [b("Report It to the Police:"), t(" Call "), b("911"), t(" and file a police report as soon as possible.")],
          [b("Act Quickly:"), t(" Delays can make you fully responsible for the theft if negligence is involved.")],
        ),
      ],
    },
    {
      id: "minimum-age",
      question: "What is the minimum age to rent a vehicle?",
      keywords: ["minimum age", "young driver", "license", "van", "vehicle", "eligibility", "driving license", "license requirement", "terms pdf"],
      blocks: [
        p(t("Minimum age and driving-license eligibility are defined by Aloha Car Rental Terms and Conditions and validated during booking.")),
        p(t("For the current legal requirements for your vehicle type, open the Terms and Conditions PDF or contact Aloha support before confirming.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "What are your insurance coverage and deposit options?",
      keywords: ["insurance", "coverage", "deposit", "deductible", "all risk", "all-risk", "cdw", "full insurance", "all-risk premium", "$100", "$500", "$600", "police report"],
      blocks: [
        p(b("CDW (basic insurance).")),
        p(t("When CDW is accepted, the deductible is "), b("$500"), t(" for cars and "), b("$600"), t(" for pickups, jeeps, SUVs, and vans.")),
        p(b("Full insurance (all-risk premium).")),
        p(t("When full insurance is accepted, the deductible is "), b("$100"), t(". A valid police report is required.")),
        p(t("Coverage exclusions and payment authorization details are governed by the official Terms and Conditions PDF.")),
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
        p(t("Aloha Car Rental accepts available local payment methods including card and cash options at the counter.")),
        p(t("Payment authorization terms for damages and losses are defined in the official Terms and Conditions.")),
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
      keywords: ["fuel", "gas", "petrol", "tank", "full to full", "full-to-full", "1/8 tank", "missing fuel", "$20", "$25", "fuel refund"],
      blocks: [
        p(t("Aloha Car Rental fuel policy is "), b("full-to-full"), t(".")),
        p(t("Vehicles are delivered full and must be returned full.")),
        p(b("Important:"), t(" Missing fuel is charged at "), b("$20"), t(" per "), b("1/8 tank"), t(" for cars and "), b("$25"), t(" per "), b("1/8 tank"), t(" for jeeps/SUVs/vans/pickups. No refunds apply for extra fuel.")),
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
      blocks: [p(t("Yes. Contact Aloha Car Rental by email, phone, or WhatsApp using the support details on this FAQ page to discuss long-term availability and pricing."))],
    },
    {
      id: "delivery",
      question: "Do you deliver the car to a specific location?",
      keywords: ["delivery", "deliver", "specific location", "hotel", "address"],
      blocks: [p(t("Yes, Aloha Car Rental can deliver your rental car to your preferred location."))],
    },
    {
      id: "airport",
      question: "Can I receive the rental car at the airport?",
      keywords: ["airport", "arrival", "pickup airport", "receive car"],
      blocks: [p(t("Yes. Depending on your flight time, Aloha Car Rental can have the car ready near the airport and send detailed instructions before arrival."))],
    },
    {
      id: "advance-booking",
      question: "How far in advance should I reserve my rental car?",
      keywords: ["reserve", "book in advance", "advance", "last minute", "24 hours"],
      blocks: [p(t("You can reserve up to one year in advance. For last-minute bookings within 24 hours, contact Aloha Car Rental directly by WhatsApp or phone using the support number shown on this FAQ page."))],
    },
    {
      id: "minimum-rental-rules",
      question: "Why can’t I book a very short rental online?",
      keywords: ["minimum rental", "minimum days", "short rental", "admin only", "booking rules"],
      blocks: [
        p(t("Some Aloha Car Rental rentals have a minimum number of days configured in the booking flow.")),
        p(t("If a booking is shorter than that minimum, the site may apply an extra short-rental surcharge or require staff assistance instead of letting the public request continue online.")),
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
        p(t("Yes. In some cases an Aloha Car Rental booking may be fulfilled with a partner-supplied vehicle instead of our own saved fleet.")),
        p(t("Those rentals are handled separately on the operational side so they do not mix into the normal public fleet inventory, while the customer still receives the normal booking communication.")),
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
          [b("Bel Caribbean Road Service:"), t(" Neem contact op met CRS via "), b("+599 717 9292"), t(" of WhatsApp "), b("+599 795 9292"), t(" voor pechhulp." )],
          [b("Neem direct contact op met Aloha support:"), t(" Neem contact op zodra het veilig is, zodat het team van Aloha Car Rental je door de lokale meldings- en verzekeringsstappen kan begeleiden.")],
          [b("Politierapport is verplicht:"), t(" Een geldig politierapport is verplicht voor verzekeringsafhandeling." )],
          [b("Verplaats het voertuig niet:"), t(" Laat de auto staan tenzij hulpdiensten, politie of CRS aangeven dat je hem mag verplaatsen.")],
          [b("Verlaat de plaats niet:"), t(" Blijf ter plaatse totdat het incident correct is vastgelegd. Te vroeg vertrekken kan gevolgen hebben voor de verzekering.")],
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
          [b("Neem direct contact op met Aloha support:"), t(" Laat het direct weten zodat Aloha Car Rental support de lokale meldingsprocedure en vervolgstappen kan uitleggen.")],
          [b("Volg de instructies:"), t(" Verplaats de auto pas nadat politie, hulpdiensten of support aangeven dat het veilig is.")],
        ),
        p(t("Zo wordt de schade correct vastgelegd en blijft de verzekering geldig.")),
      ],
    },
    {
      id: "theft",
      question: "Wat moet ik doen bij diefstal van de huurauto?",
      keywords: ["diefstal", "gestolen", "politie", "punda", "otrobanda", "911"],
      blocks: [
        list(
          [b("Neem direct contact met ons op:"), t(" Bel Aloha Car Rental direct via het supporttelefoonnummer op deze FAQ-pagina (en op je boekingsbevestiging) zodra je merkt dat het voertuig weg is.")],
          [b("Doe direct aangifte bij de politie:"), t(" Bel "), b("911"), t(" en laat zo snel mogelijk een politierapport opmaken.")],
          [b("Handel snel:"), t(" Als je te laat reageert, kun je aansprakelijk worden gehouden bij nalatigheid.")],
        ),
      ],
    },
    {
      id: "minimum-age",
      question: "Wat is de minimumleeftijd om een voertuig te huren?",
      keywords: ["minimumleeftijd", "jonge bestuurder", "rijbewijs", "bus", "auto", "geschiktheid", "rijbewijseis", "voorwaarden pdf"],
      blocks: [
        p(t("Minimumleeftijd en rijbewijseisen worden bepaald door de Algemene Voorwaarden van Aloha Car Rental en gecontroleerd tijdens de boeking.")),
        p(t("Voor de actuele wettelijke eisen per voertuigtype: open de voorwaarden-PDF of neem vooraf contact op met Aloha support.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "Wat zijn de opties voor verzekering en borg?",
      keywords: ["verzekering", "dekking", "borg", "eigen risico", "all risk", "all-risk", "cdw", "volledige verzekering", "$100", "$500", "$600", "politierapport"],
      blocks: [
        p(b("CDW (basisverzekering).")),
        p(t("Bij acceptatie van CDW is het eigen risico "), b("$500"), t(" voor auto’s en "), b("$600"), t(" voor pick-ups, jeeps, SUV’s en busjes.")),
        p(b("Volledige verzekering (all-risk premium).")),
        p(t("Bij acceptatie van volledige verzekering is het eigen risico "), b("$100"), t(". Een geldig politierapport is verplicht.")),
        p(t("Dekkingsuitsluitingen en betalingsmachtiging vallen onder de officiële voorwaarden-PDF.")),
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
        p(t("Aloha Car Rental accepteert beschikbare lokale betaalmethoden, waaronder kaart- en cashbetalingen aan de balie.")),
        p(t("Voorwaarden rond betalingsmachtiging bij schade of verlies staan in de officiële Algemene Voorwaarden.")),
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
      keywords: ["brandstof", "benzine", "tank", "full to full", "vol-vol", "1/8 tank", "ontbrekende brandstof", "$20", "$25", "geen restitutie"],
      blocks: [
        p(t("Het brandstofbeleid van Aloha Car Rental is "), b("full-to-full"), t(".")),
        p(t("Voertuigen worden met een volle tank geleverd en moeten ook weer vol worden ingeleverd.")),
        p(b("Belangrijk:"), t(" Ontbrekende brandstof wordt berekend als "), b("$20"), t(" per "), b("1/8 tank"), t(" voor auto’s en "), b("$25"), t(" per "), b("1/8 tank"), t(" voor jeeps/SUV’s/busjes/pick-ups. Extra brandstof wordt niet terugbetaald.")),
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
      blocks: [p(t("Ja. Neem contact op met Aloha Car Rental via e-mail, telefoon of WhatsApp met de supportgegevens op deze FAQ-pagina om beschikbaarheid en prijzen voor langetermijnhuur te bespreken."))],
    },
    {
      id: "delivery",
      question: "Leveren jullie de auto op een specifieke locatie af?",
      keywords: ["leveren", "afleveren", "specifieke locatie", "hotel", "adres"],
      blocks: [p(t("Ja, Aloha Car Rental kan de huurauto op jouw gewenste locatie afleveren."))],
    },
    {
      id: "airport",
      question: "Kan ik de huurauto op de luchthaven ontvangen?",
      keywords: ["luchthaven", "airport", "aankomst", "ophalen"],
      blocks: [p(t("Ja. Afhankelijk van je vluchttijd kan Aloha Car Rental de auto vlak bij de luchthaven voor je klaarzetten en sturen we vooraf de instructies."))],
    },
    {
      id: "advance-booking",
      question: "Hoe ver van tevoren moet ik mijn huurauto reserveren?",
      keywords: ["reserveren", "van tevoren", "vooraf", "last minute", "24 uur"],
      blocks: [p(t("Je kunt tot één jaar van tevoren reserveren. Voor last-minute boekingen binnen 24 uur kun je Aloha Car Rental het beste direct bellen of appen via het supportnummer op deze FAQ-pagina."))],
    },
    {
      id: "minimum-rental-rules",
      question: "Waarom kan ik een heel korte huurperiode niet online boeken?",
      keywords: ["minimum huur", "minimum dagen", "korte huur", "alleen admin", "boekingsregels"],
      blocks: [
        p(t("Voor sommige Aloha Car Rental-huurperiodes is een minimum aantal dagen ingesteld in de boekingsflow.")),
        p(t("Als een boeking korter is dan dat minimum, kan de site een extra korte-huurtoeslag toevoegen of vragen dat medewerkers de boeking handmatig afhandelen in plaats van online door te gaan.")),
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
        p(t("Ja. In sommige gevallen kan een Aloha Car Rental-boeking worden uitgevoerd met een voertuig van een partner in plaats van uit onze eigen opgeslagen vloot.")),
        p(t("Die huur wordt operationeel apart afgehandeld zodat ze niet in de normale publieke vlootinventaris terechtkomt, terwijl de klant wel de normale boekingscommunicatie ontvangt.")),
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
          [b("Llame a Caribbean Road Service:"), t(" Contacte a CRS al "), b("+599 717 9292"), t(" o WhatsApp "), b("+599 795 9292"), t(" para asistencia en carretera." )],
          [b("Contacte soporte de Aloha de inmediato:"), t(" Contacte a Aloha Car Rental apenas sea seguro para que nuestro equipo le guíe con el reporte local y el seguro.")],
          [b("El informe policial es obligatorio:"), t(" Un informe policial válido es obligatorio para la gestión del seguro." )],
          [b("No mueva el vehículo:"), t(" Deje el auto en su lugar salvo que emergencias, policía o CRS le indiquen moverlo.")],
          [b("No abandone el lugar:"), t(" Permanezca allí hasta que el incidente quede bien documentado. Irse demasiado pronto puede afectar la cobertura del seguro.")],
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
          [b("Contacte soporte de Aloha de inmediato:"), t(" Avise enseguida para que el soporte de Aloha Car Rental explique el proceso local de reporte y los siguientes pasos.")],
          [b("Siga las instrucciones:"), t(" Mueva el auto solo cuando policía, emergencias o soporte indiquen que es seguro hacerlo.")],
        ),
        p(t("Este procedimiento mantiene el caso bien documentado y ayuda a conservar la validez del seguro.")),
      ],
    },
    {
      id: "theft",
      question: "¿Qué debo hacer si roban el auto alquilado?",
      keywords: ["robo", "robado", "policía", "punda", "otrobanda", "911"],
      blocks: [
        list(
          [b("Contáctenos inmediatamente:"), t(" Llame a Aloha Car Rental de inmediato usando el número de soporte que aparece en esta página FAQ (y en su confirmación de reserva) apenas note que el vehículo desapareció.")],
          [b("Repórtelo a la policía:"), t(" Llame al "), b("911"), t(" y presente una denuncia policial lo antes posible.")],
          [b("Actúe rápido:"), t(" Si tarda demasiado, podría ser considerado responsable por negligencia.")],
        ),
      ],
    },
    {
      id: "minimum-age",
      question: "¿Cuál es la edad mínima para alquilar un vehículo?",
      keywords: ["edad mínima", "conductor joven", "licencia", "van", "vehículo", "elegibilidad", "requisito licencia", "términos pdf"],
      blocks: [
        p(t("La edad mínima y los requisitos de licencia están definidos por los Términos y Condiciones de Aloha Car Rental y se validan durante la reserva.")),
        p(t("Para ver los requisitos vigentes por tipo de vehículo, abra el PDF de Términos y Condiciones o contacte a soporte de Aloha antes de confirmar.")),
      ],
    },
    {
      id: "insurance-deposit",
      question: "¿Cuáles son las opciones de seguro y depósito?",
      keywords: ["seguro", "cobertura", "depósito", "deducible", "all risk", "todo riesgo", "cdw", "seguro full", "$100", "$500", "$600", "informe policial"],
      blocks: [
        p(b("CDW (seguro básico).")),
        p(t("Cuando se acepta CDW, el deducible es de "), b("$500"), t(" para autos y "), b("$600"), t(" para pickups, jeeps, SUVs y vans.")),
        p(b("Seguro Full (todo riesgo premium).")),
        p(t("Cuando se acepta Seguro Full, el deducible es de "), b("$100"), t(". Es obligatorio presentar un informe policial válido.")),
        p(t("Las exclusiones de cobertura y la autorización de pago se rigen por el PDF oficial de Términos y Condiciones.")),
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
        p(t("Aloha Car Rental acepta métodos de pago locales disponibles, incluyendo opciones con tarjeta y efectivo en oficina.")),
        p(t("La autorización de pago para daños o pérdidas se define en los Términos y Condiciones oficiales.")),
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
      keywords: ["combustible", "gasolina", "tanque", "full to full", "lleno a lleno", "1/8 de tanque", "combustible faltante", "$20", "$25", "sin reembolso"],
      blocks: [
        p(t("La política de combustible de Aloha Car Rental es "), b("lleno a lleno"), t(".")),
        p(t("Los vehículos se entregan llenos y deben devolverse llenos.")),
        p(b("Importante:"), t(" El combustible faltante se cobra a "), b("$20"), t(" por cada "), b("1/8 de tanque"), t(" (autos) o "), b("$25"), t(" por cada "), b("1/8 de tanque"), t(" (jeeps/SUVs/vans/pickups). No hay reembolso por combustible extra.")),
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
      blocks: [p(t("Sí. Contacte a Aloha Car Rental por correo, teléfono o WhatsApp usando los datos de soporte de esta página FAQ para consultar disponibilidad y precios de alquiler a largo plazo."))],
    },
    {
      id: "delivery",
      question: "¿Entregan el auto en una ubicación específica?",
      keywords: ["entrega", "entregar", "ubicación específica", "hotel", "dirección"],
      blocks: [p(t("Sí, Aloha Car Rental puede entregar el auto de alquiler en la ubicación que prefiera."))],
    },
    {
      id: "airport",
      question: "¿Puedo recibir el auto de alquiler en el aeropuerto?",
      keywords: ["aeropuerto", "llegada", "recibir auto", "recoger"],
      blocks: [p(t("Sí. Dependiendo del horario de su vuelo, Aloha Car Rental puede tener el auto listo cerca del aeropuerto y enviarle instrucciones antes de su llegada."))],
    },
    {
      id: "advance-booking",
      question: "¿Con cuánta anticipación debo reservar mi auto de alquiler?",
      keywords: ["reservar", "anticipación", "adelantado", "último minuto", "24 horas"],
      blocks: [p(t("Puede reservar hasta con un año de anticipación. Para reservas de último minuto dentro de 24 horas, contacte a Aloha Car Rental directamente por WhatsApp o teléfono usando el número de soporte que aparece en esta página FAQ."))],
    },
    {
      id: "minimum-rental-rules",
      question: "¿Por qué no puedo reservar un alquiler muy corto en línea?",
      keywords: ["alquiler mínimo", "días mínimos", "alquiler corto", "solo admin", "reglas de reserva"],
      blocks: [
        p(t("Algunos alquileres de Aloha Car Rental tienen un número mínimo de días configurado en el flujo de reservas.")),
        p(t("Si una reserva es más corta que ese mínimo, el sitio puede aplicar un recargo por alquiler corto o pedir que el personal la gestione manualmente en lugar de dejar continuar al público en línea.")),
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
        p(t("Sí. En algunos casos una reserva de Aloha Car Rental puede cumplirse con un vehículo suministrado por un socio en lugar de uno de nuestra flota guardada.")),
        p(t("Esos alquileres se gestionan por separado en la parte operativa para no mezclarse con el inventario público normal, mientras el cliente sigue recibiendo la comunicación habitual de la reserva.")),
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
