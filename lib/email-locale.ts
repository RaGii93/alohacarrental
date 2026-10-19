export type EmailLocale = "en" | "es" | "nl";

export function normalizeEmailLocale(locale?: string | null): EmailLocale {
  const language = String(locale || "en").trim().toLowerCase().split("-")[0];
  return language === "es" || language === "nl" ? language : "en";
}

const labels = {
  en: {
    hello: "Hello", customerInformation: "CUSTOMER INFORMATION", bookingInformation: "BOOKING INFORMATION",
    customer: "Customer", email: "Email", phone: "Phone", reference: "Reference", pickup: "Pickup", dropoff: "Dropoff",
    pickupLocation: "Pickup location", dropoffLocation: "Dropoff location", total: "Total Amount", details: "BOOKING DETAILS", extra: "Extra",
    billingDocument: "Billing document", invoice: "Invoice", salesReceipt: "Sales receipt", agreement: "Rental agreement",
    terms: "Terms and Conditions", open: "Open", noReply: "This is a no-reply mailbox. Please do not reply to this email.",
    intro: "Thank you for choosing {{tenantName}}. Below is your booking summary.",
    outro: "If you need assistance, contact us at {{email}}.",
  },
  es: {
    hello: "Hola", customerInformation: "INFORMACIÓN DEL CLIENTE", bookingInformation: "INFORMACIÓN DE LA RESERVA",
    customer: "Cliente", email: "Correo electrónico", phone: "Teléfono", reference: "Referencia", pickup: "Recogida", dropoff: "Devolución",
    pickupLocation: "Lugar de recogida", dropoffLocation: "Lugar de devolución", total: "Importe total", details: "DETALLES DE LA RESERVA", extra: "Extra",
    billingDocument: "Documento de facturación", invoice: "Factura", salesReceipt: "Recibo de pago", agreement: "Contrato de alquiler",
    terms: "Términos y condiciones", open: "Abrir", noReply: "Este buzón no admite respuestas. Por favor, no responda a este correo.",
    intro: "Gracias por elegir {{tenantName}}. A continuación encontrará el resumen de su reserva.",
    outro: "Si necesita ayuda, contáctenos en {{email}}.",
  },
  nl: {
    hello: "Hallo", customerInformation: "KLANTGEGEVENS", bookingInformation: "RESERVERINGSGEGEVENS",
    customer: "Klant", email: "E-mail", phone: "Telefoon", reference: "Referentie", pickup: "Ophalen", dropoff: "Inleveren",
    pickupLocation: "Ophaallocatie", dropoffLocation: "Inleverlocatie", total: "Totaalbedrag", details: "RESERVERINGSDETAILS", extra: "Extra",
    billingDocument: "Factuurdocument", invoice: "Factuur", salesReceipt: "Betalingsbewijs", agreement: "Huurovereenkomst",
    terms: "Algemene voorwaarden", open: "Open", noReply: "Dit is een automatisch bericht. Beantwoord deze e-mail niet.",
    intro: "Bedankt dat u voor {{tenantName}} heeft gekozen. Hieronder vindt u een overzicht van uw reservering.",
    outro: "Neem voor hulp contact met ons op via {{email}}.",
  },
};

export function getEmailLabels(locale?: string | null) {
  return labels[normalizeEmailLocale(locale)];
}

// Customer-supplied values are interpolated before HTML escaping by the renderer.
export function formatEmailText(template: string, values: Record<string, string> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
}

type Message = { subject: string; title: string; introText?: string; outroText?: string };
const messages = {
  en: {
    confirmed: { subject: "Booking Confirmed", title: "Your booking has been confirmed" },
    created: { subject: "New Booking Created", title: "Booking request received" },
    invoice: { subject: "Invoice for Payment", title: "Your invoice is ready for payment" },
    billing: { subject: "Billing Document", title: "Your billing document is ready" },
    receipt: { subject: "Sales Receipt", title: "Payment received. Your sales receipt is ready" },
    payment: { subject: "Payment Received", title: "Payment received for your invoice" },
    partner: {
      subject: "Booking Confirmed", title: "Your booking has been confirmed",
      introText: "Your booking has been arranged successfully. We have reserved the requested vehicle for your selected dates and will contact you if anything else is needed before pickup.",
      outroText: "If you need to update this reservation or have any questions before pickup, please contact us and we will be happy to assist.",
    },
    expired: {
      subject: "We’re Sorry, Your Booking Request Has Expired", title: "We’re sorry, your booking request has expired",
      introText: "We sincerely apologize, but your booking request was not completed before the reservation hold period ended, so it has now been declined automatically.",
      outroText: "We understand this may be disappointing. If you would still like to reserve a vehicle, please contact us and we will gladly help you arrange a new booking as quickly as possible.",
    },
    declined: {
      subject: "We’re Sorry, We’re Unable to Approve Your Booking", title: "We’re sorry, we’re unable to approve your booking",
      introText: "We sincerely apologize, but we’re unable to approve your booking request at this time.",
      outroText: "If you would like help finding another option or making a new reservation, please contact us and our team will be happy to assist.",
    },
    reason: { subject: "", title: "", outroText: "Reason provided: {{reason}}" },
    agreement: {
      subject: "Your Rental Agreement", title: "Your rental agreement is ready",
      introText: "Your rental agreement for booking {{bookingCode}} is ready. Agreement number: {{agreementNumber}}. Use the button below to download it.",
    },
    review: {
      subject: "How was your experience?", title: "How was your rental experience?",
      introText: "We hope you enjoyed your rental! We'd love to hear your feedback. Please take a moment to leave a review.",
      outroText: "Leave your review here: {{reviewUrl}}",
    },
  },
  es: {
    confirmed: { subject: "Reserva confirmada", title: "Su reserva ha sido confirmada" },
    created: { subject: "Nueva reserva creada", title: "Solicitud de reserva recibida" },
    invoice: { subject: "Factura pendiente de pago", title: "Su factura está lista para el pago" },
    billing: { subject: "Documento de facturación", title: "Su documento de facturación está listo" },
    receipt: { subject: "Recibo de pago", title: "Pago recibido. Su recibo está listo" },
    payment: { subject: "Pago recibido", title: "Hemos recibido el pago de su factura" },
    partner: {
      subject: "Reserva confirmada", title: "Su reserva ha sido confirmada",
      introText: "Su reserva se ha realizado correctamente. Hemos reservado el vehículo solicitado para las fechas seleccionadas y nos pondremos en contacto con usted si necesitamos algo más antes de la recogida.",
      outroText: "Si necesita modificar esta reserva o tiene alguna pregunta antes de la recogida, contáctenos y estaremos encantados de ayudarle.",
    },
    expired: {
      subject: "Lo sentimos, su solicitud de reserva ha caducado", title: "Lo sentimos, su solicitud de reserva ha caducado",
      introText: "Le pedimos disculpas, pero su solicitud no se completó antes de que finalizara el plazo de reserva provisional y se ha rechazado automáticamente.",
      outroText: "Entendemos que esto puede ser decepcionante. Si aún desea reservar un vehículo, contáctenos y le ayudaremos a realizar una nueva reserva lo antes posible.",
    },
    declined: {
      subject: "Lo sentimos, no podemos aprobar su reserva", title: "Lo sentimos, no podemos aprobar su reserva",
      introText: "Le pedimos disculpas, pero no podemos aprobar su solicitud de reserva en este momento.",
      outroText: "Si necesita ayuda para encontrar otra opción o realizar una nueva reserva, contáctenos y nuestro equipo estará encantado de ayudarle.",
    },
    reason: { subject: "", title: "", outroText: "Motivo indicado: {{reason}}" },
    agreement: {
      subject: "Su contrato de alquiler", title: "Su contrato de alquiler está listo",
      introText: "Su contrato de alquiler para la reserva {{bookingCode}} está listo. Número de contrato: {{agreementNumber}}. Utilice el botón de abajo para descargarlo.",
    },
    review: {
      subject: "¿Cómo fue su experiencia?", title: "¿Cómo fue su experiencia de alquiler?",
      introText: "¡Esperamos que haya disfrutado de su alquiler! Nos encantaría conocer su opinión. Dedique un momento a dejar una reseña.",
      outroText: "Deje su reseña aquí: {{reviewUrl}}",
    },
  },
  nl: {
    confirmed: { subject: "Reservering bevestigd", title: "Uw reservering is bevestigd" },
    created: { subject: "Nieuwe reservering aangemaakt", title: "Reserveringsaanvraag ontvangen" },
    invoice: { subject: "Factuur ter betaling", title: "Uw factuur staat klaar voor betaling" },
    billing: { subject: "Factuurdocument", title: "Uw factuurdocument staat klaar" },
    receipt: { subject: "Betalingsbewijs", title: "Betaling ontvangen. Uw betalingsbewijs staat klaar" },
    payment: { subject: "Betaling ontvangen", title: "De betaling van uw factuur is ontvangen" },
    partner: {
      subject: "Reservering bevestigd", title: "Uw reservering is bevestigd",
      introText: "Uw reservering is succesvol geregeld. Wij hebben het gevraagde voertuig voor de geselecteerde datums gereserveerd en nemen contact met u op als er vóór het ophalen nog iets nodig is.",
      outroText: "Wilt u deze reservering wijzigen of heeft u vóór het ophalen nog vragen? Neem dan contact met ons op. Wij helpen u graag.",
    },
    expired: {
      subject: "Het spijt ons, uw reserveringsaanvraag is verlopen", title: "Het spijt ons, uw reserveringsaanvraag is verlopen",
      introText: "Onze excuses, maar uw reserveringsaanvraag is niet binnen de voorlopige reserveringstermijn afgerond en is daarom automatisch afgewezen.",
      outroText: "Wij begrijpen dat dit teleurstellend kan zijn. Wilt u nog steeds een voertuig reserveren? Neem dan contact met ons op. Wij helpen u graag zo snel mogelijk met een nieuwe reservering.",
    },
    declined: {
      subject: "Het spijt ons, wij kunnen uw reservering niet goedkeuren", title: "Het spijt ons, wij kunnen uw reservering niet goedkeuren",
      introText: "Onze excuses, maar wij kunnen uw reserveringsaanvraag op dit moment niet goedkeuren.",
      outroText: "Heeft u hulp nodig bij het vinden van een andere optie of het maken van een nieuwe reservering? Neem dan contact met ons op. Ons team helpt u graag.",
    },
    reason: { subject: "", title: "", outroText: "Opgegeven reden: {{reason}}" },
    agreement: {
      subject: "Uw huurovereenkomst", title: "Uw huurovereenkomst staat klaar",
      introText: "Uw huurovereenkomst voor reservering {{bookingCode}} staat klaar. Overeenkomstnummer: {{agreementNumber}}. Gebruik de onderstaande knop om deze te downloaden.",
    },
    review: {
      subject: "Hoe was uw ervaring?", title: "Hoe was uw huurervaring?",
      introText: "Wij hopen dat u van uw huurauto heeft genoten! Wij horen graag wat u ervan vond. Neem even de tijd om een beoordeling achter te laten.",
      outroText: "Laat hier uw beoordeling achter: {{reviewUrl}}",
    },
  },
} satisfies Record<EmailLocale, Record<string, Message>>;

export type CustomerEmailKind = keyof typeof messages.en;
export function getCustomerEmailContent(kind: CustomerEmailKind, locale?: string | null, values: Record<string, string> = {}): Message {
  const message: Message = messages[normalizeEmailLocale(locale)][kind];
  return {
    subject: formatEmailText(message.subject, values), title: formatEmailText(message.title, values),
    introText: message.introText ? formatEmailText(message.introText, values) : undefined,
    outroText: message.outroText ? formatEmailText(message.outroText, values) : undefined,
  };
}

export function formatEmailDateTime(date: Date, locale?: string | null): string {
  return new Intl.DateTimeFormat({ en: "en-US", es: "es-ES", nl: "nl-NL" }[normalizeEmailLocale(locale)], {
    timeZone: "America/La_Paz", day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(date);
}

// Match the shipped templates so existing saved default rules are translated too.
// Custom rule copy is retained, with optional per-language overrides.
const automationTemplates = [
  {
    en: {
      subject: "Your booking {{bookingCode}} is confirmed!", emailTitle: "Booking Confirmed",
      introText: "Great news, {{customerName}}! Your rental booking has been confirmed. We look forward to seeing you on {{pickupDate}}.",
    },
    es: {
      subject: "¡Su reserva {{bookingCode}} está confirmada!", emailTitle: "Reserva confirmada",
      introText: "¡Buenas noticias, {{customerName}}! Su reserva de alquiler está confirmada. Le esperamos el {{pickupDate}}.",
    },
    nl: {
      subject: "Uw reservering {{bookingCode}} is bevestigd!", emailTitle: "Reservering bevestigd",
      introText: "Goed nieuws, {{customerName}}! Uw huurreservering is bevestigd. Wij verwelkomen u graag op {{pickupDate}}.",
    },
  },
  {
    en: {
      subject: "Reminder: Your rental pickup is tomorrow ({{bookingCode}})", emailTitle: "Pickup Reminder",
      introText: "Hi {{customerName}}, just a reminder that your vehicle pickup is scheduled for {{pickupDate}} at {{pickupLocation}}. Please have your driver's license and booking code {{bookingCode}} ready.",
    },
    es: {
      subject: "Recordatorio: la recogida de su vehículo es mañana ({{bookingCode}})", emailTitle: "Recordatorio de recogida",
      introText: "Hola {{customerName}}, le recordamos que la recogida de su vehículo está prevista para el {{pickupDate}} en {{pickupLocation}}. Tenga a mano su permiso de conducir y el código de reserva {{bookingCode}}.",
    },
    nl: {
      subject: "Herinnering: u haalt uw huurauto morgen op ({{bookingCode}})", emailTitle: "Herinnering voor het ophalen",
      introText: "Hallo {{customerName}}, u kunt uw voertuig ophalen op {{pickupDate}} bij {{pickupLocation}}. Houd uw rijbewijs en reserveringscode {{bookingCode}} bij de hand.",
    },
  },
  {
    en: {
      subject: "Reminder: Your vehicle return is tomorrow ({{bookingCode}})", emailTitle: "Return Reminder",
      introText: "Hi {{customerName}}, your rental period ends tomorrow on {{dropoffDate}}. Please return the vehicle to {{dropoffLocation}}. Safe travels!",
    },
    es: {
      subject: "Recordatorio: debe devolver su vehículo mañana ({{bookingCode}})", emailTitle: "Recordatorio de devolución",
      introText: "Hola {{customerName}}, su período de alquiler finaliza mañana, el {{dropoffDate}}. Devuelva el vehículo en {{dropoffLocation}}. ¡Buen viaje!",
    },
    nl: {
      subject: "Herinnering: u levert uw huurauto morgen in ({{bookingCode}})", emailTitle: "Herinnering voor het inleveren",
      introText: "Hallo {{customerName}}, uw huurperiode eindigt morgen op {{dropoffDate}}. Lever het voertuig in bij {{dropoffLocation}}. Goede reis!",
    },
  },
];

export function localizeAutomationEmailConfig(config: Record<string, unknown>, locale?: string): Record<string, unknown> {
  const language = normalizeEmailLocale(locale);
  const localized = { ...config };
  for (const field of ["subject", "emailTitle", "introText"] as const) {
    const match = automationTemplates.find((template) => config[field] === template.en[field]);
    if (match) localized[field] = match[language][field];
  }
  const translations = config.translations as Record<string, Record<string, unknown>> | undefined;
  const override = translations?.[language];
  for (const field of ["subject", "emailTitle", "introText", "body"] as const) {
    if (typeof override?.[field] === "string") localized[field] = override[field];
  }
  return localized;
}
