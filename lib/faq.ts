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

const faqByLocale: Record<FaqLocale, FaqEntry[]> = {
  en: [
    {
      id: "accident",
      question: "What should I do in case of an accident?",
      keywords: ["accident", "crash", "collision", "emergency", "forensys", "insurance", "911"],
      blocks: [
        list(
          [b("Call Emergency Services:"), t(" Dial "), b("911"), t(" if anyone is injured or needs urgent medical help.")],
          [b("Contact Forensys Curacao:"), t(" It is "), b("mandatory"), t(" to call "), b("Forensys Curacao"), t(" at "), b("0800-1199"), t(", "), b("9233"), t(", or WhatsApp "), b("+599 9461 3282"), t(".")],
          [b("Do Not Move the Vehicle:"), t(" Wait for "), b("Forensys"), t(" to instruct you. Do not move the vehicle, even if it blocks the road, unless they tell you to.")],
          [b("Do Not Leave the Scene:"), t(" Stay there until "), b("Forensys"), t(" finishes the report. Without that report, insurance coverage can be "), b("void"), t(".")],
        ),
        p(t("Following these steps helps document the incident properly and protects your coverage.")),
      ],
    },
    {
      id: "damage",
      question: "What should I do if the rental car is damaged?",
      keywords: ["damage", "damaged", "windshield", "scratch", "hit", "forensys", "report"],
      blocks: [
        list(
          [b("Do Not Move the Car:"), t(" Leave the vehicle where the damage happened, whether it was a post, stone, windshield damage, parking damage, or road accident.")],
          [b("Contact Forensys Curacao:"), t(" Call "), b("0800-1199"), t(" or "), b("9233"), t(" immediately. They usually arrive quickly, take photos, and ask for your statement.")],
          [b("Follow Instructions:"), t(" Move the car only after "), b("Forensys"), t(" staff or the police says it is safe.")],
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
          [b("Contact Us Immediately:"), t(" Call "), b("+5999 673-3248"), t(" as soon as you realize the vehicle is missing.")],
          [b("Report It to the Police:"), t(" Call "), b("911"), t(", or the police stations in "), b("Punda +599 9461-1000"), t(" or "), b("Otrobanda +599 9462-7844"), t(".")],
          [b("Act Quickly:"), t(" Delays can make you fully responsible for the theft if negligence is involved.")],
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
      keywords: ["insurance", "coverage", "deposit", "deductible", "all risk", "all-risk"],
      blocks: [
        p(b("All-Risk Coverage.")),
        p(t("You still keep a deductible of "), b("$500"), t(" for vehicles and "), b("$750"), t(" for vans. You can reduce that risk by paying "), b("$15"), t(" per day for vehicles and "), b("$25"), t(" per day for vans. For rentals under 4 days, a flat "), b("$85"), t(" buy-off option is available. Exceptions apply for speeding, DUI, or leaving an accident scene.")),
        p(b("Deposit Amount.")),
        p(t("The required deposit is "), b("$250"), t(" for vehicles and "), b("$375"), t(" for vans.")),
      ],
    },
    {
      id: "kilometers",
      question: "How many kilometers can I drive per day?",
      keywords: ["kilometers", "kilometres", "mileage", "unlimited", "distance"],
      blocks: [p(t("If you rent from edgeRent Lite, kilometers are unlimited."))],
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
  ],
  nl: [
    {
      id: "accident",
      question: "Wat moet ik doen bij een ongeval?",
      keywords: ["ongeval", "ongeluk", "aanrijding", "noodgeval", "forensys", "verzekering", "911"],
      blocks: [
        list(
          [b("Bel de hulpdiensten:"), t(" Bel "), b("911"), t(" als er gewonden zijn of als medische hulp direct nodig is.")],
          [b("Neem contact op met Forensys Curacao:"), t(" Het is "), b("verplicht"), t(" om "), b("Forensys Curacao"), t(" te bellen op "), b("0800-1199"), t(", "), b("9233"), t(" of via WhatsApp "), b("+599 9461 3282"), t(".")],
          [b("Verplaats het voertuig niet:"), t(" Wacht op instructies van "), b("Forensys"), t(". Verplaats de auto niet, ook niet als deze de weg blokkeert, tenzij zij dat zeggen.")],
          [b("Verlaat de plaats niet:"), t(" Blijf ter plaatse totdat "), b("Forensys"), t(" het rapport heeft afgerond. Zonder dat rapport kan de verzekering "), b("ongeldig"), t(" worden.")],
        ),
        p(t("Door deze stappen te volgen, wordt alles correct vastgelegd en blijft je dekking beschermd.")),
      ],
    },
    {
      id: "damage",
      question: "Wat moet ik doen als de huurauto schade heeft?",
      keywords: ["schade", "beschadigd", "ruit", "krassen", "forensys", "melding"],
      blocks: [
        list(
          [b("Verplaats de auto niet:"), t(" Laat het voertuig staan waar de schade is ontstaan, of het nu gaat om een paal, steen, ruitschade, parkeerschade of een verkeersongeval.")],
          [b("Bel Forensys Curacao:"), t(" Bel direct "), b("0800-1199"), t(" of "), b("9233"), t(". Zij komen meestal snel, maken foto's en nemen je verklaring op.")],
          [b("Volg de instructies:"), t(" Verplaats de auto pas nadat "), b("Forensys"), t(" of de politie heeft aangegeven dat het veilig is.")],
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
          [b("Neem direct contact met ons op:"), t(" Bel "), b("+5999 673-3248"), t(" zodra je merkt dat het voertuig weg is.")],
          [b("Doe direct aangifte bij de politie:"), t(" Bel "), b("911"), t(", of de bureaus in "), b("Punda +599 9461-1000"), t(" of "), b("Otrobanda +599 9462-7844"), t(".")],
          [b("Handel snel:"), t(" Als je te laat reageert, kun je aansprakelijk worden gehouden bij nalatigheid.")],
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
      keywords: ["verzekering", "dekking", "borg", "eigen risico", "all risk", "all-risk"],
      blocks: [
        p(b("All-risk dekking.")),
        p(t("Je houdt nog steeds een eigen risico van "), b("$500"), t(" voor voertuigen en "), b("$750"), t(" voor vans. Je kunt dit risico verlagen door "), b("$15"), t(" per dag voor voertuigen en "), b("$25"), t(" per dag voor vans te betalen. Bij huur korter dan 4 dagen is er ook een vaste afkoop van "), b("$85"), t(". Uitzonderingen gelden bij te hard rijden, rijden onder invloed of het verlaten van een ongevalslocatie.")),
        p(b("Borgbedrag.")),
        p(t("De borg bedraagt "), b("$250"), t(" voor voertuigen en "), b("$375"), t(" voor vans.")),
      ],
    },
    {
      id: "kilometers",
      question: "Hoeveel kilometers mag ik per dag rijden?",
      keywords: ["kilometers", "kilometerlimiet", "onbeperkt", "afstand"],
      blocks: [p(t("Bij edgeRent Lite zijn de kilometers onbeperkt."))],
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
  ],
  es: [
    {
      id: "accident",
      question: "¿Qué debo hacer en caso de accidente?",
      keywords: ["accidente", "choque", "colisión", "emergencia", "forensys", "seguro", "911"],
      blocks: [
        list(
          [b("Llame a emergencias:"), t(" Marque "), b("911"), t(" si hay heridos o si alguien necesita atención médica urgente.")],
          [b("Contacte a Forensys Curacao:"), t(" Es "), b("obligatorio"), t(" llamar a "), b("Forensys Curacao"), t(" al "), b("0800-1199"), t(", "), b("9233"), t(" o por WhatsApp al "), b("+599 9461 3282"), t(".")],
          [b("No mueva el vehículo:"), t(" Espere instrucciones de "), b("Forensys"), t(". No mueva el auto aunque esté bloqueando la vía, salvo que ellos lo indiquen.")],
          [b("No abandone el lugar:"), t(" Permanezca allí hasta que "), b("Forensys"), t(" termine el informe. Sin ese informe, la cobertura del seguro puede quedar "), b("anulada"), t(".")],
        ),
        p(t("Seguir estos pasos ayuda a documentar correctamente el incidente y a proteger su cobertura.")),
      ],
    },
    {
      id: "damage",
      question: "¿Qué debo hacer si el auto alquilado sufre daños?",
      keywords: ["daño", "daños", "parabrisas", "golpe", "forensys", "reporte"],
      blocks: [
        list(
          [b("No mueva el auto:"), t(" Deje el vehículo donde ocurrió el daño, ya sea por un poste, piedra, parabrisas, estacionamiento o accidente de tránsito.")],
          [b("Llame a Forensys Curacao:"), t(" Llame de inmediato al "), b("0800-1199"), t(" o "), b("9233"), t(". Ellos suelen llegar rápido, tomar fotos y pedir su declaración.")],
          [b("Siga las instrucciones:"), t(" Solo mueva el auto cuando "), b("Forensys"), t(" o la policía indiquen que es seguro hacerlo.")],
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
          [b("Contáctenos inmediatamente:"), t(" Llame al "), b("+5999 673-3248"), t(" apenas note que el vehículo desapareció.")],
          [b("Repórtelo a la policía:"), t(" Llame al "), b("911"), t(", o a las estaciones de "), b("Punda +599 9461-1000"), t(" u "), b("Otrobanda +599 9462-7844"), t(".")],
          [b("Actúe rápido:"), t(" Si tarda demasiado, podría ser considerado responsable por negligencia.")],
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
      keywords: ["seguro", "cobertura", "depósito", "deducible", "all risk", "todo riesgo"],
      blocks: [
        p(b("Cobertura todo riesgo.")),
        p(t("Aún mantiene un deducible de "), b("$500"), t(" para vehículos y "), b("$750"), t(" para vans. Puede reducir ese riesgo pagando "), b("$15"), t(" por día para vehículos y "), b("$25"), t(" por día para vans. En alquileres de menos de 4 días existe una opción fija de "), b("$85"), t(". Hay excepciones en casos de exceso de velocidad, alcohol o abandonar la escena de un accidente.")),
        p(b("Monto del depósito.")),
        p(t("El depósito requerido es de "), b("$250"), t(" para vehículos y "), b("$375"), t(" para vans.")),
      ],
    },
    {
      id: "kilometers",
      question: "¿Cuántos kilómetros puedo conducir por día?",
      keywords: ["kilómetros", "kilometros", "millas", "ilimitado", "distancia"],
      blocks: [p(t("Con edgeRent Lite, los kilómetros son ilimitados."))],
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
  ],
};

export function getFaqEntries(locale: string): FaqEntry[] {
  return faqByLocale[coerceFaqLocale(locale)];
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

export function getFaqAssistantCopy(locale: string): FaqAssistantCopy {
  const normalizedLocale = coerceFaqLocale(locale);

  if (normalizedLocale === "es") {
    return {
      title: "Asistente FAQ",
      welcome: "Haz una pregunta sobre alquileres, pagos, depósito, combustible, aeropuerto o soporte y responderé con la información del FAQ.",
      notFound: "No encontré una respuesta directa en el FAQ. Abre la página FAQ o contáctanos por WhatsApp para recibir ayuda.",
      readMore: "Lee más en la página de FAQ.",
      openWhatsapp: "Abrir WhatsApp",
      askPlaceholder: "Haz una pregunta...",
    };
  }

  if (normalizedLocale === "nl") {
    return {
      title: "FAQ Assistent",
      welcome: "Stel een vraag over huur, betaling, borg, brandstof, luchthaven of support en ik antwoord met info uit de FAQ.",
      notFound: "Ik vond geen direct antwoord in de FAQ. Open de FAQ-pagina of neem contact op via WhatsApp voor hulp.",
      readMore: "Lees meer op de FAQ-pagina.",
      openWhatsapp: "Open WhatsApp",
      askPlaceholder: "Stel een vraag...",
    };
  }

  return {
    title: "FAQ Assistant",
    welcome: "Ask about rentals, payments, deposit, fuel, airport pickup, or support and I’ll answer from the FAQ.",
    notFound: "I couldn’t find a direct FAQ answer. Open the FAQ page or contact us on WhatsApp for help.",
    readMore: "Read more on the FAQ page.",
    openWhatsapp: "Open WhatsApp",
    askPlaceholder: "Ask a question...",
  };
}
