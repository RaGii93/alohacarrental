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
