export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

export type FaqLocale = "en" | "nl" | "es";

const faqByLocale: Record<FaqLocale, FaqEntry[]> = {
  en: [
    {
      id: "documents",
      question: "What documents do I need to book?",
      answer: "A valid driver license, contact details, and acceptance of rental terms are required.",
      keywords: ["document", "documents", "license", "licence", "driver license", "id", "requirements"],
    },
    {
      id: "confirmation",
      question: "When is my reservation confirmed?",
      answer: "Your reservation is confirmed after admin approval. You receive email updates with your booking code.",
      keywords: ["confirm", "confirmed", "approval", "reservation", "booking status"],
    },
    {
      id: "payment",
      question: "How do payments work?",
      answer: "You receive an invoice first. After payment is received, a sales receipt is issued.",
      keywords: ["payment", "pay", "invoice", "receipt", "billing", "price", "pricing"],
    },
    {
      id: "pickup",
      question: "How does pickup and return work?",
      answer: "Select pickup and dropoff date/time and locations during booking. Bring your original documents at pickup.",
      keywords: ["pickup", "dropoff", "return", "location", "time", "delivery", "hours"],
    },
    {
      id: "opening_hours",
      question: "What are your opening hours?",
      answer: "Our standard opening hours are Monday to Saturday, 08:00 to 18:00. For out-of-hours requests, contact us by phone or WhatsApp.",
      keywords: ["opening hours", "hours", "open", "closing", "schedule", "monday", "saturday", "time"],
    },
    {
      id: "category_prices",
      question: "How are category prices calculated?",
      answer: "Each category has a daily base rate. Your final total is base rental + selected extras - discounts + applicable tax.",
      keywords: ["category price", "prices", "pricing", "daily rate", "rate", "cost", "total", "tax"],
    },
    {
      id: "emergency",
      question: "What should I do in case of an emergency?",
      answer: "Prioritize safety first. If there is immediate danger, call local emergency services right away, then contact our support line as soon as possible.",
      keywords: ["emergency", "urgent", "help", "support", "breakdown", "danger", "safety"],
    },
    {
      id: "accident",
      question: "What should I do in case of an accident?",
      answer: "Ensure everyone is safe, contact emergency services if needed, document the scene with photos, and notify us immediately. Do not admit liability on the spot.",
      keywords: ["accident", "crash", "collision", "damage", "insurance", "report", "photos"],
    },
    {
      id: "tax_info",
      question: "Is tax included in the booking total?",
      answer: "Yes. Tax is calculated as a percentage and is included in the final booking total shown in your summary and billing documents.",
      keywords: ["tax", "vat", "included", "invoice", "receipt", "total", "percentage"],
    },
    {
      id: "minimum_age",
      question: "What is the minimum age to rent?",
      answer: "The minimum rental age is 21. A valid driver license is required and must be valid on pickup date.",
      keywords: ["minimum age", "age", "driver", "license", "requirements", "young driver"],
    },
    {
      id: "deposit",
      question: "Do I need to pay a deposit?",
      answer: "A security deposit may be required depending on the booking and vehicle category. Deposit terms are communicated during confirmation.",
      keywords: ["deposit", "security deposit", "hold", "pre-authorization", "payment", "guarantee"],
    },
    {
      id: "insurance",
      question: "Is insurance included?",
      answer: "Basic coverage is included according to local rental policy. Optional extra coverage may be available depending on vehicle category.",
      keywords: ["insurance", "coverage", "liability", "protection", "policy"],
    },
    {
      id: "cancellation",
      question: "Can I cancel or modify my booking?",
      answer: "Yes, contact us as early as possible. Changes and cancellations depend on booking status and timing.",
      keywords: ["cancel", "cancellation", "modify", "change booking", "reschedule"],
    },
    {
      id: "late_return",
      question: "What happens if I return the car late?",
      answer: "Late returns may result in extra charges. Inform us immediately if your return time changes.",
      keywords: ["late return", "late fee", "extra charge", "delay"],
    },
    {
      id: "fuel_policy",
      question: "What is your fuel policy?",
      answer: "Vehicles are expected to be returned with an agreed fuel level. If not, refueling/service charges may apply.",
      keywords: ["fuel", "gas", "petrol", "refuel", "fuel policy"],
    },
    {
      id: "mileage",
      question: "Is mileage limited?",
      answer: "Mileage limits depend on your rental agreement and category. Any limit and overage policy are confirmed before pickup.",
      keywords: ["mileage", "kilometers", "km limit", "distance", "overage"],
    },
    {
      id: "additional_driver",
      question: "Can I add an additional driver?",
      answer: "Yes, additional drivers can be added if they meet the same license and age requirements.",
      keywords: ["additional driver", "second driver", "extra driver", "authorized driver"],
    },
    {
      id: "addons",
      question: "Can I request add-ons like child seats or GPS?",
      answer: "Yes, add-ons can be selected during booking, subject to availability.",
      keywords: ["child seat", "gps", "extras", "add-ons", "accessories"],
    },
    {
      id: "payment_methods",
      question: "Which payment methods do you accept?",
      answer: "We support approved digital payment methods and transfer options per invoice instructions.",
      keywords: ["payment method", "card", "bank transfer", "how to pay", "accepted payments"],
    },
    {
      id: "cross_border",
      question: "Can I take the vehicle across borders?",
      answer: "Cross-border use requires prior approval. Contact us before pickup to confirm allowed travel zones.",
      keywords: ["cross border", "travel", "international", "outside area", "permission"],
    },
    {
      id: "cleaning_smoking",
      question: "Are there cleaning or smoking penalties?",
      answer: "Yes, excessive cleaning and smoking violations may incur additional fees under rental terms.",
      keywords: ["cleaning fee", "smoking", "penalty", "condition", "vehicle care"],
    },
  ],
  nl: [
    {
      id: "documents",
      question: "Welke documenten heb ik nodig om te reserveren?",
      answer: "Een geldig rijbewijs, contactgegevens en akkoord op de huurvoorwaarden zijn vereist.",
      keywords: ["document", "documenten", "rijbewijs", "id", "vereisten", "benodigd"],
    },
    {
      id: "confirmation",
      question: "Wanneer is mijn reservering bevestigd?",
      answer: "Je reservering wordt bevestigd na goedkeuring door admin. Je ontvangt e-mailupdates met je reserveringscode.",
      keywords: ["bevestigd", "bevestiging", "goedkeuring", "reservering", "status"],
    },
    {
      id: "payment",
      question: "Hoe werken betalingen?",
      answer: "Je ontvangt eerst een factuur. Nadat de betaling is ontvangen, wordt een verkoopbon uitgegeven.",
      keywords: ["betaling", "betalen", "factuur", "bon", "prijs", "tarief"],
    },
    {
      id: "pickup",
      question: "Hoe werken ophalen en inleveren?",
      answer: "Selecteer ophaal- en inlevertijd plus locaties tijdens de reservering. Neem originele documenten mee bij ophalen.",
      keywords: ["ophalen", "inleveren", "retour", "locatie", "tijd", "aflevering", "uren"],
    },
    {
      id: "opening_hours",
      question: "Wat zijn jullie openingstijden?",
      answer: "Onze standaard openingstijden zijn maandag t/m zaterdag van 08:00 tot 18:00. Voor verzoeken buiten openingstijd kun je ons bellen of WhatsAppen.",
      keywords: ["openingstijden", "uren", "open", "gesloten", "schema", "maandag", "zaterdag", "tijd"],
    },
    {
      id: "category_prices",
      question: "Hoe worden categorieprijzen berekend?",
      answer: "Elke categorie heeft een basistarief per dag. Je eindtotaal is basishuur + geselecteerde extra's - kortingen + toepasselijke belasting.",
      keywords: ["categorieprijs", "prijzen", "tarief", "dagtarief", "kosten", "totaal", "belasting"],
    },
    {
      id: "emergency",
      question: "Wat moet ik doen bij een noodgeval?",
      answer: "Zorg eerst voor veiligheid. Bij direct gevaar bel je meteen de lokale hulpdiensten, en daarna zo snel mogelijk onze support.",
      keywords: ["noodgeval", "spoed", "hulp", "support", "pech", "gevaar", "veiligheid"],
    },
    {
      id: "accident",
      question: "Wat moet ik doen bij een ongeluk?",
      answer: "Controleer de veiligheid van iedereen, bel indien nodig hulpdiensten, maak foto's van de situatie en meld het direct aan ons. Erken ter plaatse geen aansprakelijkheid.",
      keywords: ["ongeluk", "aanrijding", "schade", "verzekering", "melding", "foto's"],
    },
    {
      id: "tax_info",
      question: "Is belasting inbegrepen in het totaalbedrag?",
      answer: "Ja. Belasting wordt als percentage berekend en is opgenomen in het definitieve totaal in je samenvatting en factuurdocumenten.",
      keywords: ["belasting", "btw", "inbegrepen", "factuur", "bon", "totaal", "percentage"],
    },
    {
      id: "minimum_age",
      question: "Wat is de minimumleeftijd om te huren?",
      answer: "De minimumleeftijd is 21 jaar. Een geldig rijbewijs is verplicht en moet geldig zijn op de ophaaldatum.",
      keywords: ["minimumleeftijd", "leeftijd", "bestuurder", "rijbewijs", "vereisten"],
    },
    {
      id: "deposit",
      question: "Moet ik een borg betalen?",
      answer: "Afhankelijk van de reservering en voertuigcategorie kan een borg vereist zijn. De borgvoorwaarden worden gedeeld tijdens de bevestiging.",
      keywords: ["borg", "waarborg", "reservering", "betaling", "garantie", "pre-autorisatie"],
    },
    {
      id: "insurance",
      question: "Is verzekering inbegrepen?",
      answer: "Basisdekking is inbegrepen volgens lokaal verhuurbeleid. Extra dekking kan optioneel beschikbaar zijn per voertuigcategorie.",
      keywords: ["verzekering", "dekking", "aansprakelijkheid", "bescherming", "polis"],
    },
    {
      id: "cancellation",
      question: "Kan ik mijn reservering annuleren of wijzigen?",
      answer: "Ja, neem zo vroeg mogelijk contact op. Wijzigingen en annuleringen hangen af van status en timing van de reservering.",
      keywords: ["annuleren", "wijzigen", "reservering aanpassen", "verplaatsen"],
    },
    {
      id: "late_return",
      question: "Wat gebeurt er als ik te laat inlever?",
      answer: "Te laat inleveren kan extra kosten veroorzaken. Laat het ons direct weten als je inlevertijd verandert.",
      keywords: ["te laat", "inleveren", "boete", "extra kosten", "vertraging"],
    },
    {
      id: "fuel_policy",
      question: "Wat is jullie brandstofbeleid?",
      answer: "Voertuigen moeten met het afgesproken brandstofniveau worden ingeleverd. Zo niet, dan kunnen tank-/servicekosten gelden.",
      keywords: ["brandstof", "tank", "benzine", "diesel", "tankbeleid"],
    },
    {
      id: "mileage",
      question: "Is er een kilometerlimiet?",
      answer: "Kilometerlimieten hangen af van overeenkomst en categorie. Eventuele limieten en meerkosten worden vooraf bevestigd.",
      keywords: ["kilometerlimiet", "kilometers", "afstand", "meerkosten"],
    },
    {
      id: "additional_driver",
      question: "Kan ik een extra bestuurder toevoegen?",
      answer: "Ja, extra bestuurders kunnen worden toegevoegd als zij aan dezelfde leeftijds- en rijbewijsvereisten voldoen.",
      keywords: ["extra bestuurder", "tweede bestuurder", "bevoegde bestuurder"],
    },
    {
      id: "addons",
      question: "Kan ik extra's aanvragen zoals kinderzitje of GPS?",
      answer: "Ja, extra's kun je tijdens het reserveren selecteren, afhankelijk van beschikbaarheid.",
      keywords: ["kinderzitje", "gps", "extra's", "accessoires", "opties"],
    },
    {
      id: "payment_methods",
      question: "Welke betaalmethoden accepteren jullie?",
      answer: "Wij ondersteunen goedgekeurde digitale betaalmethoden en overschrijvingen volgens de factuurinstructies.",
      keywords: ["betaalmethode", "kaart", "overschrijving", "hoe betalen", "betalingen"],
    },
    {
      id: "cross_border",
      question: "Mag ik met het voertuig de grens over?",
      answer: "Grensoverschrijdend gebruik vereist voorafgaande toestemming. Neem vóór ophalen contact met ons op.",
      keywords: ["grens", "reizen", "internationaal", "toestemming", "buiten gebied"],
    },
    {
      id: "cleaning_smoking",
      question: "Zijn er boetes voor schoonmaak of roken?",
      answer: "Ja, bij buitensporige vervuiling of rookovertredingen kunnen extra kosten gelden volgens de voorwaarden.",
      keywords: ["schoonmaakkosten", "roken", "boete", "kosten", "voertuigconditie"],
    },
  ],
  es: [
    {
      id: "documents",
      question: "¿Qué documentos necesito para reservar?",
      answer: "Se requiere una licencia de conducir válida, datos de contacto y la aceptación de los términos de alquiler.",
      keywords: ["documento", "documentos", "licencia", "identificación", "requisitos"],
    },
    {
      id: "confirmation",
      question: "¿Cuándo se confirma mi reserva?",
      answer: "Tu reserva se confirma después de la aprobación del administrador. Recibirás actualizaciones por correo con tu código de reserva.",
      keywords: ["confirmación", "confirmada", "aprobación", "reserva", "estado"],
    },
    {
      id: "payment",
      question: "¿Cómo funcionan los pagos?",
      answer: "Primero recibes una factura. Después de recibir el pago, se emite un comprobante de venta.",
      keywords: ["pago", "pagos", "factura", "recibo", "precio", "tarifa"],
    },
    {
      id: "pickup",
      question: "¿Cómo funcionan la entrega y devolución?",
      answer: "Selecciona fecha/hora y ubicaciones de recogida y devolución durante la reserva. Lleva tus documentos originales al recoger.",
      keywords: ["recogida", "devolución", "entrega", "ubicación", "hora", "horario"],
    },
    {
      id: "opening_hours",
      question: "¿Cuál es su horario de atención?",
      answer: "Nuestro horario estándar es de lunes a sábado, de 08:00 a 18:00. Para solicitudes fuera de horario, contáctanos por teléfono o WhatsApp.",
      keywords: ["horario", "atención", "abierto", "cerrado", "lunes", "sábado", "hora"],
    },
    {
      id: "category_prices",
      question: "¿Cómo se calculan los precios por categoría?",
      answer: "Cada categoría tiene una tarifa base diaria. El total final es alquiler base + extras seleccionados - descuentos + impuesto aplicable.",
      keywords: ["precio por categoría", "precios", "tarifa diaria", "costo", "total", "impuesto"],
    },
    {
      id: "emergency",
      question: "¿Qué debo hacer en caso de emergencia?",
      answer: "Prioriza la seguridad. Si hay peligro inmediato, llama primero a los servicios de emergencia locales y luego contáctanos lo antes posible.",
      keywords: ["emergencia", "urgente", "ayuda", "soporte", "avería", "peligro", "seguridad"],
    },
    {
      id: "accident",
      question: "¿Qué debo hacer en caso de accidente?",
      answer: "Verifica la seguridad de todos, llama a emergencias si es necesario, documenta la escena con fotos y avísanos inmediatamente. No admitas responsabilidad en el lugar.",
      keywords: ["accidente", "choque", "colisión", "daño", "seguro", "reporte", "fotos"],
    },
    {
      id: "tax_info",
      question: "¿El impuesto está incluido en el total de la reserva?",
      answer: "Sí. El impuesto se calcula como un porcentaje y se incluye en el total final mostrado en el resumen y en los documentos de facturación.",
      keywords: ["impuesto", "iva", "incluido", "factura", "recibo", "total", "porcentaje"],
    },
    {
      id: "minimum_age",
      question: "¿Cuál es la edad mínima para alquilar?",
      answer: "La edad mínima de alquiler es 21 años. Se requiere una licencia de conducir válida en la fecha de recogida.",
      keywords: ["edad mínima", "edad", "conductor", "licencia", "requisitos"],
    },
    {
      id: "deposit",
      question: "¿Debo pagar un depósito?",
      answer: "Puede requerirse un depósito de seguridad según la reserva y la categoría del vehículo. Las condiciones del depósito se comparten durante la confirmación.",
      keywords: ["depósito", "garantía", "retención", "preautorización", "pago"],
    },
    {
      id: "insurance",
      question: "¿El seguro está incluido?",
      answer: "La cobertura básica está incluida según la política local de alquiler. Puede haber coberturas adicionales opcionales según la categoría.",
      keywords: ["seguro", "cobertura", "responsabilidad", "protección", "póliza"],
    },
    {
      id: "cancellation",
      question: "¿Puedo cancelar o modificar mi reserva?",
      answer: "Sí, contáctanos lo antes posible. Los cambios y cancelaciones dependen del estado y el momento de la reserva.",
      keywords: ["cancelar", "cancelación", "modificar", "cambiar reserva", "reprogramar"],
    },
    {
      id: "late_return",
      question: "¿Qué pasa si devuelvo el vehículo tarde?",
      answer: "Las devoluciones tardías pueden generar cargos adicionales. Avísanos de inmediato si cambia tu hora de devolución.",
      keywords: ["devolución tardía", "cargo extra", "retraso", "penalización"],
    },
    {
      id: "fuel_policy",
      question: "¿Cuál es la política de combustible?",
      answer: "Los vehículos deben devolverse con el nivel de combustible acordado. De lo contrario, pueden aplicarse cargos de repostaje/servicio.",
      keywords: ["combustible", "gasolina", "repostar", "política de combustible"],
    },
    {
      id: "mileage",
      question: "¿Hay límite de kilometraje?",
      answer: "Los límites de kilometraje dependen del contrato y la categoría. Cualquier límite y política de excedente se confirma antes de la entrega.",
      keywords: ["kilometraje", "límite km", "distancia", "excedente"],
    },
    {
      id: "additional_driver",
      question: "¿Puedo agregar un conductor adicional?",
      answer: "Sí, se pueden agregar conductores adicionales si cumplen los mismos requisitos de edad y licencia.",
      keywords: ["conductor adicional", "segundo conductor", "conductor autorizado"],
    },
    {
      id: "addons",
      question: "¿Puedo solicitar extras como silla para niño o GPS?",
      answer: "Sí, los extras pueden seleccionarse durante la reserva, sujetos a disponibilidad.",
      keywords: ["silla para niño", "gps", "extras", "accesorios", "complementos"],
    },
    {
      id: "payment_methods",
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos métodos de pago digitales aprobados y opciones de transferencia según las instrucciones de la factura.",
      keywords: ["métodos de pago", "tarjeta", "transferencia bancaria", "cómo pagar"],
    },
    {
      id: "cross_border",
      question: "¿Puedo cruzar fronteras con el vehículo?",
      answer: "El uso transfronterizo requiere aprobación previa. Contáctanos antes de la entrega para confirmar zonas permitidas.",
      keywords: ["frontera", "viaje", "internacional", "fuera del área", "permiso"],
    },
    {
      id: "cleaning_smoking",
      question: "¿Hay penalizaciones por limpieza o fumar?",
      answer: "Sí, la limpieza excesiva y las infracciones por fumar pueden generar cargos adicionales según los términos.",
      keywords: ["limpieza", "fumar", "penalización", "cargos", "estado del vehículo"],
    },
  ],
};

const fallbackLocale = (locale?: string): FaqLocale =>
  locale === "nl" || locale === "es" ? locale : "en";

export function getFaqEntries(locale?: string): FaqEntry[] {
  return faqByLocale[fallbackLocale(locale)];
}

export function getFaqAssistantCopy(locale?: string): {
  welcome: string;
  readMore: string;
  notFound: string;
  openWhatsapp: string;
  title: string;
  askPlaceholder: string;
} {
  const safeLocale = fallbackLocale(locale);
  if (safeLocale === "nl") {
    return {
      welcome: "Welkom. Stel vragen over reserveren, documenten, betaling, ophalen of inleveren.",
      readMore: "Je kunt meer lezen op de FAQ-pagina.",
      notFound: "Ik kon dit niet vinden in onze FAQ. Neem contact op via WhatsApp voor directe hulp.",
      openWhatsapp: "Open WhatsApp",
      title: "Help Assistent",
      askPlaceholder: "Stel een vraag...",
    };
  }
  if (safeLocale === "es") {
    return {
      welcome: "Bienvenido. Haz preguntas sobre reservas, documentos, pagos, recogida o devolución.",
      readMore: "Puedes leer más en la página de Preguntas frecuentes.",
      notFound: "No pude encontrar eso en nuestras preguntas frecuentes. Contáctanos por WhatsApp para ayuda directa.",
      openWhatsapp: "Abrir WhatsApp",
      title: "Asistente de Ayuda",
      askPlaceholder: "Haz una pregunta...",
    };
  }
  return {
    welcome: "Welcome. Ask me about booking, documents, payment, pickup, or return.",
    readMore: "You can read more on the FAQ page.",
    notFound: "I could not find that in our FAQ. Please contact us on WhatsApp for direct help.",
    openWhatsapp: "Open WhatsApp",
    title: "Help Assistant",
    askPlaceholder: "Ask a question...",
  };
}
