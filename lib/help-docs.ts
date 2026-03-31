import { routing } from "@/i18n/routing";
import { toLocalePath } from "@/lib/seo";

export type HelpLocale = (typeof routing.locales)[number];
export const HELP_BASE_PATH = "/admin/help";

type LocalizedText = Record<HelpLocale, string>;
type LocalizedList = Record<HelpLocale, string[]>;

type HelpDocDefinition = {
  id: string;
  slug: string[];
  title: LocalizedText;
  description: LocalizedText;
  keywords: string[];
  sections: Array<{
    id: string;
    heading: LocalizedText;
    summary: LocalizedText;
    bullets?: LocalizedList;
  }>;
};

export type HelpDocSection = {
  id: string;
  heading: string;
  summary: string;
  bullets: string[];
};

export type HelpDoc = {
  id: string;
  slug: string[];
  title: string;
  description: string;
  keywords: string[];
  href: string;
  sections: HelpDocSection[];
};

export type HelpSearchEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  headings: string[];
  keywords: string[];
  content: string;
};

export type HelpSearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  snippet: string;
  score: number;
};

export type HelpUiCopy = {
  homeEyebrow: string;
  homeTitle: string;
  homeDescription: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchEmptyTitle: string;
  searchEmptyDescription: string;
  searchResultsTitle: string;
  featuredTitle: string;
  featuredDescription: string;
  openDoc: string;
  assistantTitle: string;
  assistantDescription: string;
  assistantCta: string;
  assistantPageTitle: string;
  assistantPageDescription: string;
  assistantInputPlaceholder: string;
  assistantSubmit: string;
  assistantSubmitting: string;
  assistantEmpty: string;
  assistantFallback: string;
  assistantError: string;
  assistantSuggestedTitle: string;
  assistantSourcesTitle: string;
  docBack: string;
  docSectionsLabel: string;
};

const HELP_UI_COPY: Record<HelpLocale, HelpUiCopy> = {
  en: {
    homeEyebrow: "Help Center",
    homeTitle: "Documentation, walkthroughs, and operational answers",
    homeDescription:
      "Search the product docs, open detailed help pages, or ask the assistant for grounded answers based on the current EdgeRent Lite documentation.",
    searchLabel: "Search documentation",
    searchPlaceholder: "Search bookings, pickup, returns, invoices, vehicle status...",
    searchEmptyTitle: "No matching docs found",
    searchEmptyDescription: "Try a broader keyword like pickup, invoice, fuel, delivery, or return.",
    searchResultsTitle: "Search results",
    featuredTitle: "Core guides",
    featuredDescription: "Start with the most-used operational guides.",
    openDoc: "Open doc",
    assistantTitle: "Help assistant",
    assistantDescription:
      "Ask focused product questions. Answers stay grounded in the current Help Center docs.",
    assistantCta: "Open assistant",
    assistantPageTitle: "Help Assistant",
    assistantPageDescription:
      "Ask how EdgeRent Lite works. The assistant only answers from the current Help Center documentation.",
    assistantInputPlaceholder: "Ask a help question...",
    assistantSubmit: "Ask",
    assistantSubmitting: "Thinking...",
    assistantEmpty: "Ask a question to get a documentation-based answer.",
    assistantFallback: "I couldn’t find that in the current Help Center documentation.",
    assistantError: "The assistant could not answer right now.",
    assistantSuggestedTitle: "Suggested questions",
    assistantSourcesTitle: "Sources",
    docBack: "Back to Help Center",
    docSectionsLabel: "On this page",
  },
  es: {
    homeEyebrow: "Centro de ayuda",
    homeTitle: "Documentación, guías y respuestas operativas",
    homeDescription:
      "Busca en la documentación del producto, abre páginas de ayuda detalladas o pregunta al asistente para recibir respuestas basadas en la documentación actual de EdgeRent Lite.",
    searchLabel: "Buscar en la documentación",
    searchPlaceholder: "Buscar reservas, recogida, devoluciones, facturas, estado del vehículo...",
    searchEmptyTitle: "No se encontraron documentos",
    searchEmptyDescription: "Prueba con una palabra más general como recogida, factura, combustible, entrega o devolución.",
    searchResultsTitle: "Resultados de búsqueda",
    featuredTitle: "Guías principales",
    featuredDescription: "Empieza con las guías operativas más usadas.",
    openDoc: "Abrir documento",
    assistantTitle: "Asistente de ayuda",
    assistantDescription:
      "Haz preguntas concretas del producto. Las respuestas se basan solo en la documentación actual del Centro de ayuda.",
    assistantCta: "Abrir asistente",
    assistantPageTitle: "Asistente de ayuda",
    assistantPageDescription:
      "Pregunta cómo funciona EdgeRent Lite. El asistente responde solo con la documentación actual del Centro de ayuda.",
    assistantInputPlaceholder: "Haz una pregunta de ayuda...",
    assistantSubmit: "Preguntar",
    assistantSubmitting: "Pensando...",
    assistantEmpty: "Haz una pregunta para obtener una respuesta basada en la documentación.",
    assistantFallback: "No pude encontrar eso en la documentación actual del Centro de ayuda.",
    assistantError: "El asistente no pudo responder en este momento.",
    assistantSuggestedTitle: "Preguntas sugeridas",
    assistantSourcesTitle: "Fuentes",
    docBack: "Volver al Centro de ayuda",
    docSectionsLabel: "En esta página",
  },
  nl: {
    homeEyebrow: "Helpcentrum",
    homeTitle: "Documentatie, werkwijzes en operationele antwoorden",
    homeDescription:
      "Doorzoek de productdocumentatie, open gedetailleerde hulppagina’s of stel een vraag aan de assistent voor antwoorden op basis van de huidige EdgeRent Lite-documentatie.",
    searchLabel: "Zoek in de documentatie",
    searchPlaceholder: "Zoek op boekingen, ophalen, retour, facturen, voertuigstatus...",
    searchEmptyTitle: "Geen passende documentatie gevonden",
    searchEmptyDescription: "Probeer een bredere term zoals ophalen, factuur, brandstof, afleveren of retour.",
    searchResultsTitle: "Zoekresultaten",
    featuredTitle: "Belangrijkste handleidingen",
    featuredDescription: "Begin met de meest gebruikte operationele gidsen.",
    openDoc: "Document openen",
    assistantTitle: "Hulpassistent",
    assistantDescription:
      "Stel gerichte productvragen. Antwoorden blijven gebaseerd op de huidige Helpcentrum-documentatie.",
    assistantCta: "Assistent openen",
    assistantPageTitle: "Hulpassistent",
    assistantPageDescription:
      "Vraag hoe EdgeRent Lite werkt. De assistent antwoordt alleen vanuit de huidige Helpcentrum-documentatie.",
    assistantInputPlaceholder: "Stel een hulpvraag...",
    assistantSubmit: "Vragen",
    assistantSubmitting: "Bezig...",
    assistantEmpty: "Stel een vraag om een documentatiegebaseerd antwoord te krijgen.",
    assistantFallback: "Ik kon dat niet vinden in de huidige Helpcentrum-documentatie.",
    assistantError: "De assistent kon nu geen antwoord geven.",
    assistantSuggestedTitle: "Voorgestelde vragen",
    assistantSourcesTitle: "Bronnen",
    docBack: "Terug naar Helpcentrum",
    docSectionsLabel: "Op deze pagina",
  },
};

const HELP_DOCS: HelpDocDefinition[] = [
  {
    id: "booking-lifecycle",
    slug: ["bookings", "booking-lifecycle"],
    title: {
      en: "Booking lifecycle",
      es: "Ciclo de una reserva",
      nl: "Boekingscyclus",
    },
    description: {
      en: "How a booking moves from request to payment, pickup, return, and closeout.",
      es: "Cómo una reserva pasa de solicitud a pago, recogida, devolución y cierre.",
      nl: "Hoe een boeking van aanvraag naar betaling, ophalen, retour en afsluiting gaat.",
    },
    keywords: ["booking", "confirmed", "invoice", "payment", "delivered", "returned", "workflow"],
    sections: [
      {
        id: "request-stage",
        heading: {
          en: "Request and confirmation",
          es: "Solicitud y confirmación",
          nl: "Aanvraag en bevestiging",
        },
        summary: {
          en: "A booking starts as pending. Staff can confirm it, decline it, or send the invoice while it is still pending or already confirmed.",
          es: "Una reserva comienza como pendiente. El personal puede confirmarla, rechazarla o enviar la factura mientras siga pendiente o ya esté confirmada.",
          nl: "Een boeking begint als in behandeling. Medewerkers kunnen deze bevestigen, afwijzen of de factuur versturen terwijl deze nog in behandeling is of al bevestigd is.",
        },
        bullets: {
          en: [
            "Pending bookings can be confirmed or declined from the booking detail page.",
            "Invoice sending is available for pending and confirmed bookings.",
            "A booking detail record keeps the same history even after edits and pricing refreshes.",
            "If a booking is declined, staff can record a decline reason from the booking detail workflow.",
            "The booking detail page centralizes confirmation, decline, invoice, payment, pickup, and return actions so operations stay on one record.",
          ],
          es: [
            "Las reservas pendientes pueden confirmarse o rechazarse desde la página de detalle.",
            "El envío de facturas está disponible para reservas pendientes y confirmadas.",
            "El detalle de la reserva conserva el mismo historial incluso después de ediciones y recalculos.",
            "Si una reserva se rechaza, el personal puede registrar el motivo desde el flujo de detalle de la reserva.",
            "La página de detalle centraliza confirmación, rechazo, factura, pago, salida y retorno para que la operación quede en un solo registro.",
          ],
          nl: [
            "Boekingen in behandeling kunnen worden bevestigd of afgewezen vanaf de detailpagina.",
            "Facturen kunnen worden verzonden voor boekingen in behandeling en bevestigde boekingen.",
            "Het boekingsrecord behoudt dezelfde historie, ook na bewerkingen en prijsvernieuwingen.",
            "Als een boeking wordt afgewezen, kunnen medewerkers een afwijsreden vastleggen vanuit de detailflow.",
            "De boekingsdetailpagina centraliseert bevestiging, afwijzen, facturatie, betaling, pickup en retour op één record.",
          ],
        },
      },
      {
        id: "payment-stage",
        heading: {
          en: "Payment and delivery readiness",
          es: "Pago y preparación para aflevering",
          nl: "Betaling en gereed voor aflevering",
        },
        summary: {
          en: "After payment is received, the booking becomes ready for pickup check-in. Mark Delivered does not appear before payment is recorded.",
          es: "Después de recibir el pago, la reserva queda lista para la inspección de salida. Marcar como entregado no aparece antes de registrar el pago.",
          nl: "Nadat de betaling is ontvangen, is de boeking klaar voor de pickup check-in. Mark Delivered verschijnt niet voordat de betaling is geregistreerd.",
        },
        bullets: {
          en: [
            "Payment can be recorded by receiving invoice payment or by creating a sales receipt.",
            "A sales receipt can also mark the booking delivered immediately if staff choose that option.",
            "Pickup check-in becomes available only after payment is received.",
            "The billing summary recalculates base rental, extras, discounts, extra tax, and any later closeout charges.",
            "Open billing documents remain accessible from booking detail for review or resend.",
          ],
          es: [
            "El pago puede registrarse recibiendo el pago de la factura o creando un recibo de venta.",
            "Un recibo de venta también puede marcar la reserva como entregada inmediatamente si el personal lo elige.",
            "La inspección de salida solo está disponible después de recibir el pago.",
            "El resumen de facturación recalcula alquiler base, extras, descuentos, impuesto de extras y cualquier cargo de cierre posterior.",
            "Los documentos de facturación siguen accesibles desde el detalle para revisión o reenvío.",
          ],
          nl: [
            "Betaling kan worden geregistreerd via factuurbetaling ontvangen of door een verkoopbon aan te maken.",
            "Een verkoopbon kan de boeking ook direct als afgeleverd markeren als medewerkers dat kiezen.",
            "Pickup check-in is pas beschikbaar nadat de betaling is ontvangen.",
            "De factuursamenvatting herberekent basishuur, extra’s, kortingen, belasting op extra’s en latere afsluitkosten.",
            "Open factuurdocumenten blijven toegankelijk vanuit het boekingsdetail voor controle of opnieuw verzenden.",
          ],
        },
      },
      {
        id: "closeout-stage",
        heading: {
          en: "Return and closeout",
          es: "Devolución y cierre",
          nl: "Retour en afsluiting",
        },
        summary: {
          en: "After the vehicle is delivered, the return check-in closes the rental, applies any return charges, and moves the vehicle back into the active fleet when appropriate.",
          es: "Después de entregar el vehículo, la inspección de retorno cierra el alquiler, aplica cargos de retorno y devuelve el vehículo a la flota activa cuando corresponde.",
          nl: "Nadat het voertuig is afgeleverd, sluit de retour check-in de huur af, past eventuele retourkosten toe en zet het voertuig weer terug in de actieve vloot wanneer dat hoort.",
        },
        bullets: {
          en: [
            "Return check-in records odometer, fuel, damage notes, photos, and client acceptance.",
            "Late return, fuel shortage, and damage charges are added during closeout.",
            "Returned bookings show the final condition log and closeout amounts in booking detail.",
            "The return flow closes the contract operationally and updates the vehicle state back into usable fleet flow when appropriate.",
            "Closeout values remain visible in the booking summary for later audit or dispute review.",
          ],
          es: [
            "La inspección de retorno registra odómetro, combustible, daños, fotos y aceptación del cliente.",
            "Los cargos por retraso, combustible faltante y daños se agregan durante el cierre.",
            "Las reservas devueltas muestran el registro final de condición y los cargos finales en el detalle.",
            "El flujo de retorno cierra el contrato operativamente y devuelve el vehículo al flujo normal de flota cuando corresponde.",
            "Los valores de cierre permanecen visibles en el resumen de la reserva para auditoría o revisión posterior.",
          ],
          nl: [
            "Retour check-in registreert kilometerstand, brandstof, schadenotities, foto’s en klantacceptatie.",
            "Te late retour-, brandstof- en schadekosten worden tijdens afsluiting toegevoegd.",
            "Geretourneerde boekingen tonen het definitieve conditielogboek en de eindkosten in het boekingsdetail.",
            "De retourflow sluit het contract operationeel af en zet het voertuig terug in de normale vlootflow wanneer dat hoort.",
            "Afsluitwaarden blijven zichtbaar in de boekingssamenvatting voor audit of latere controle.",
          ],
        },
      },
      {
        id: "edit-impact",
        heading: {
          en: "Editing an existing booking",
          es: "Editar una reserva existente",
          nl: "Een bestaande boeking bewerken",
        },
        summary: {
          en: "Editing a booking refreshes operational and pricing data while keeping the same booking record and history.",
          es: "Editar una reserva actualiza datos operativos y de precio manteniendo el mismo registro e historial.",
          nl: "Het bewerken van een boeking ververst operationele en prijsgegevens terwijl hetzelfde record en de historie behouden blijven.",
        },
        bullets: {
          en: [
            "Booking edits can update customer details, flight number, dates, category, assigned vehicle, locations, notes, and selected extras.",
            "Saving an edit recalculates totals using the current pricing setup and rechecks availability.",
            "The system keeps the current vehicle only if it still fits the updated booking conditions.",
            "Updated pricing can trigger a refreshed invoice or payment request for the customer.",
          ],
          es: [
            "La edición puede actualizar datos del cliente, número de vuelo, fechas, categoría, vehículo asignado, ubicaciones, notas y extras seleccionados.",
            "Guardar una edición recalcula totales con la configuración de precios actual y vuelve a comprobar disponibilidad.",
            "El sistema mantiene el vehículo actual solo si aún encaja con las nuevas condiciones.",
            "El precio actualizado puede generar una factura o solicitud de pago renovada para el cliente.",
          ],
          nl: [
            "Bewerkingen kunnen klantgegevens, vluchtnummer, data, categorie, toegewezen voertuig, locaties, notities en geselecteerde extra’s aanpassen.",
            "Opslaan van een bewerking herberekent totalen met de huidige prijsinstellingen en controleert de beschikbaarheid opnieuw.",
            "Het systeem behoudt het huidige voertuig alleen als het nog past bij de nieuwe voorwaarden.",
            "Bijgewerkte prijzen kunnen een vernieuwde factuur of betalingsaanvraag voor de klant veroorzaken.",
          ],
        },
      },
    ],
  },
  {
    id: "pickup-check-in",
    slug: ["operations", "pickup-check-in"],
    title: {
      en: "Pickup check-in",
      es: "Inspección de salida",
      nl: "Pickup check-in",
    },
    description: {
      en: "What staff record when handing a car to a client and how client acceptance works.",
      es: "Qué registra el personal al entregar un vehículo y cómo funciona la aceptación del cliente.",
      nl: "Wat medewerkers registreren wanneer een auto aan een klant wordt overgedragen en hoe klantacceptatie werkt.",
    },
    keywords: ["pickup", "check-in", "delivered", "odometer", "fuel", "damage", "acceptance"],
    sections: [
      {
        id: "wizard-steps",
        heading: {
          en: "Pickup wizard steps",
          es: "Pasos del asistente de salida",
          nl: "Stappen van de pickup-wizard",
        },
        summary: {
          en: "The pickup flow uses a step wizard so staff record the condition before the vehicle is handed over.",
          es: "El flujo de salida usa un asistente por pasos para registrar la condición antes de entregar el vehículo.",
          nl: "De pickup-flow gebruikt een stapwizard zodat medewerkers de staat registreren voordat het voertuig wordt overgedragen.",
        },
        bullets: {
          en: [
            "Step 1 captures odometer, fuel level, damage status, damage notes, and agent notes.",
            "Step 2 lets staff upload inspection photos. Images are compressed before upload and stored as small documentation snapshots.",
            "Step 3 shows a client overview so the renter can accept the recorded condition and details.",
            "The pickup summary explains the starting vehicle state before the keys are handed over.",
            "The booking detail page stores pickup values in the condition log for later comparison during return.",
          ],
          es: [
            "El paso 1 registra odómetro, nivel de combustible, estado de daños, notas de daños y notas del agente.",
            "El paso 2 permite subir fotos de inspección. Las imágenes se comprimen antes de la carga.",
            "El paso 3 muestra un resumen para que el cliente acepte la condición registrada.",
            "El resumen de salida explica el estado inicial del vehículo antes de entregar las llaves.",
            "La página de detalle guarda los valores de salida en el registro de condición para compararlos al retorno.",
          ],
          nl: [
            "Stap 1 registreert kilometerstand, brandstofniveau, schadestatus, schadenotities en agentnotities.",
            "Stap 2 laat medewerkers inspectiefoto’s uploaden. Afbeeldingen worden vóór upload gecomprimeerd.",
            "Stap 3 toont een klantoverzicht zodat de huurder de geregistreerde staat en details kan accepteren.",
            "De pickupsamenvatting legt de startstaat van het voertuig vast voordat de sleutels worden overgedragen.",
            "De boekingsdetailpagina bewaart pickupwaarden in het conditielogboek voor vergelijking bij retour.",
          ],
        },
      },
      {
        id: "pickup-guardrails",
        heading: {
          en: "Operational guardrails",
          es: "Reglas operativas",
          nl: "Operationele regels",
        },
        summary: {
          en: "Pickup cannot be completed until the required data and client acceptance are present.",
          es: "La salida no puede completarse hasta que existan los datos obligatorios y la aceptación del cliente.",
          nl: "Pickup kan niet worden voltooid totdat de verplichte gegevens en klantacceptatie aanwezig zijn.",
        },
        bullets: {
          en: [
            "Odometer and fuel level are required.",
            "Damage notes become required if damage is marked as present.",
            "The client acceptance checkbox and accepted-by name are required before completing pickup.",
            "Pickup photos are optional but strongly recommended for disputes and insurance evidence.",
            "Staff should complete pickup from the booking detail flow rather than forcing a vehicle status manually.",
          ],
          es: [
            "El odómetro y el nivel de combustible son obligatorios.",
            "Las notas de daños son obligatorias si se marca que existen daños.",
            "La casilla de aceptación del cliente y el nombre aceptado por son obligatorios antes de completar la salida.",
            "Las fotos de salida son opcionales, pero muy recomendables para disputas y evidencia de seguro.",
            "El personal debe completar la salida desde el detalle de la reserva en vez de forzar un estado manual del vehículo.",
          ],
          nl: [
            "Kilometerstand en brandstofniveau zijn verplicht.",
            "Schadenotities worden verplicht als schade als aanwezig is gemarkeerd.",
            "De klantacceptatie-checkbox en de naam van de accepterende klant zijn verplicht voordat pickup wordt voltooid.",
            "Pickupfoto’s zijn optioneel maar sterk aanbevolen voor geschillen en verzekeringsbewijs.",
            "Medewerkers horen pickup af te ronden vanuit het boekingsdetail in plaats van handmatig een voertuigstatus te forceren.",
          ],
        },
      },
      {
        id: "client-acceptance",
        heading: {
          en: "Client acceptance overview",
          es: "Resumen de aceptación del cliente",
          nl: "Klantacceptatie-overzicht",
        },
        summary: {
          en: "The acceptance step is meant to make the recorded starting condition visible and explicit for the renter.",
          es: "El paso de aceptación busca dejar visible y explícita la condición inicial registrada para el cliente.",
          nl: "De acceptatiestap maakt de geregistreerde beginstaat zichtbaar en expliciet voor de huurder.",
        },
        bullets: {
          en: [
            "The client overview shows odometer, fuel, damage status, and category context.",
            "If charges are relevant later, the same captured pickup state is used as the comparison baseline.",
            "Accepted-by information creates a named acknowledgment in the booking record.",
          ],
          es: [
            "El resumen del cliente muestra odómetro, combustible, estado de daños y contexto de categoría.",
            "Si luego se aplican cargos, el mismo estado de salida sirve como base de comparación.",
            "La información de aceptación deja una confirmación nominal dentro del registro de la reserva.",
          ],
          nl: [
            "Het klantoverzicht toont kilometerstand, brandstof, schadestatus en categorieverwijzing.",
            "Als later kosten worden toegepast, dient dezelfde pickupstaat als vergelijkingsbasis.",
            "Accepted-by-informatie legt een benoemde bevestiging vast in het boekingsrecord.",
          ],
        },
      },
    ],
  },
  {
    id: "return-closeout",
    slug: ["operations", "return-closeout"],
    title: {
      en: "Return closeout and charges",
      es: "Cierre de retorno y cargos",
      nl: "Retourafsluiting en kosten",
    },
    description: {
      en: "How the return inspection calculates fuel, late return, and damage charges.",
      es: "Cómo la inspección de retorno calcula cargos por combustible, retraso y daños.",
      nl: "Hoe de retourinspectie brandstof-, vertraging- en schadekosten berekent.",
    },
    keywords: ["return", "late", "fuel", "damage", "closeout", "charge", "grace"],
    sections: [
      {
        id: "late-return",
        heading: {
          en: "Late return rule",
          es: "Regla de devolución tardía",
          nl: "Regel voor te late retour",
        },
        summary: {
          en: "The system compares the scheduled dropoff time with the actual return time and applies a 4-hour grace period.",
          es: "El sistema compara la hora programada de entrega con la hora real de retorno y aplica un período de gracia de 4 horas.",
          nl: "Het systeem vergelijkt de geplande inlevertijd met de werkelijke retourtijd en past een respijtperiode van 4 uur toe.",
        },
        bullets: {
          en: [
            "Returned on time or within 4 hours late: no late fee.",
            "More than 4 hours late: at least 1 extra rental day is charged.",
            "If the return is much later, extra days continue in 24-hour blocks after the grace period.",
            "The return wizard shows a warning banner with the exact scheduled dropoff time when the grace window has already passed.",
            "The warning is visible before completion so staff understand that closeout will change the total.",
          ],
          es: [
            "Devuelto a tiempo o con hasta 4 horas de retraso: sin cargo por retraso.",
            "Más de 4 horas de retraso: se cobra al menos 1 día extra de alquiler.",
            "Si el retorno es mucho más tarde, los días extra continúan en bloques de 24 horas después del período de gracia.",
            "El asistente de retorno muestra una advertencia con la hora exacta programada cuando ya pasó el período de gracia.",
            "La advertencia aparece antes de completar para que el personal entienda que el cierre cambiará el total.",
          ],
          nl: [
            "Op tijd geretourneerd of binnen 4 uur te laat: geen te-laat-kosten.",
            "Meer dan 4 uur te laat: er wordt minimaal 1 extra huurdag berekend.",
            "Als de retour veel later is, lopen extra dagen door in blokken van 24 uur na de respijtperiode.",
            "De retourwizard toont een waarschuwingsbanner met de exacte geplande inlevertijd wanneer de respijtperiode al voorbij is.",
            "De waarschuwing is zichtbaar vóór afronding zodat medewerkers weten dat de afsluiting het totaal verandert.",
          ],
        },
      },
      {
        id: "fuel-charge",
        heading: {
          en: "Fuel shortage charge",
          es: "Cargo por combustible faltante",
          nl: "Kosten voor brandstoftekort",
        },
        summary: {
          en: "Return fuel charges are calculated from the difference between pickup fuel and return fuel, using the category fuel rate per quarter tank.",
          es: "Los cargos por combustible se calculan a partir de la diferencia entre el combustible de salida y el de retorno, usando la tarifa de la categoría por cuarto de tanque.",
          nl: "Retourbrandstofkosten worden berekend op basis van het verschil tussen brandstof bij pickup en retour, met het categorietarief per kwart tank.",
        },
        bullets: {
          en: [
            "Fuel rates are configured per vehicle category.",
            "Vans and buses can use a higher fuel charge per quarter tank than economy or compact categories.",
            "The return summary shows the category fuel rate used for the closeout.",
            "Fuel shortage is measured against the pickup fuel level stored during delivery.",
            "This keeps closeout tied to actual recorded starting condition instead of staff memory.",
          ],
          es: [
            "Las tarifas de combustible se configuran por categoría de vehículo.",
            "Las vans y buses pueden usar un cargo más alto por cuarto de tanque que categorías economy o compact.",
            "El resumen de retorno muestra la tarifa de combustible de categoría usada para el cierre.",
            "El faltante de combustible se mide contra el nivel registrado en la salida.",
            "Esto mantiene el cierre ligado a una condición inicial registrada y no a la memoria del personal.",
          ],
          nl: [
            "Brandstoftarieven worden per voertuigcategorie ingesteld.",
            "Bussen en vans kunnen een hoger tarief per kwart tank hebben dan economy- of compact-categorieën.",
            "De retoursamenvatting toont het gebruikte brandstoftarief van de categorie.",
            "Brandstoftekort wordt gemeten tegen het pickupniveau dat tijdens aflevering is opgeslagen.",
            "Zo blijft de afsluiting gekoppeld aan een geregistreerde beginstaat in plaats van personeelsgeheugen.",
          ],
        },
      },
      {
        id: "damage-charge",
        heading: {
          en: "Damage records and extra charges",
          es: "Daños y cargos extra",
          nl: "Schaderegistratie en extra kosten",
        },
        summary: {
          en: "If damage is present at return, staff can add notes, upload photos, and record a damage charge during closeout.",
          es: "Si hay daños al retorno, el personal puede añadir notas, subir fotos y registrar un cargo por daños durante el cierre.",
          nl: "Als er bij retour schade aanwezig is, kunnen medewerkers notities toevoegen, foto’s uploaden en een schadebedrag registreren tijdens de afsluiting.",
        },
        bullets: {
          en: [
            "Damage notes and supporting photos become part of the booking condition log.",
            "Return damage charge is shown separately in billing summary.",
            "Closeout adds late, fuel, and damage charges into the updated booking total.",
            "Return photos are useful when comparing new damage against the pickup inspection baseline.",
            "The booking detail page keeps these entries for later operational review.",
          ],
          es: [
            "Las notas de daños y fotos de respaldo pasan a formar parte del registro de condición de la reserva.",
            "El cargo por daños se muestra por separado en el resumen de facturación.",
            "El cierre agrega cargos por retraso, combustible y daños al total actualizado.",
            "Las fotos de retorno ayudan a comparar daños nuevos con la inspección inicial.",
            "La página de detalle conserva estos registros para revisión operativa posterior.",
          ],
          nl: [
            "Schadenotities en ondersteunende foto’s worden onderdeel van het conditielogboek van de boeking.",
            "Schadekosten bij retour worden apart getoond in de factuursamenvatting.",
            "De afsluiting voegt te-laat-, brandstof- en schadekosten toe aan het bijgewerkte boekingstotaal.",
            "Retourfoto’s helpen nieuwe schade te vergelijken met de pickup-inspectiebasis.",
            "De detailpagina bewaart deze registraties voor latere operationele controle.",
          ],
        },
      },
      {
        id: "return-completion",
        heading: {
          en: "What closeout changes",
          es: "Qué cambia al cerrar",
          nl: "Wat afsluiting wijzigt",
        },
        summary: {
          en: "Completing return inspection updates both the booking record and the operational fleet state.",
          es: "Completar la inspección de retorno actualiza tanto la reserva como el estado operativo de flota.",
          nl: "Het voltooien van de retourinspectie werkt zowel het boekingsrecord als de operationele vlootstatus bij.",
        },
        bullets: {
          en: [
            "The booking stores return odometer, fuel, damage flags, notes, accepted-by details, and calculated closeout charges.",
            "The billing summary starts reflecting late return, fuel difference, and return damage amounts.",
            "Operationally, the vehicle is moved out of active rental flow and back toward normal fleet availability.",
          ],
          es: [
            "La reserva guarda odómetro final, combustible, daños, notas, aceptación y cargos calculados de cierre.",
            "El resumen de facturación empieza a mostrar retraso, diferencia de combustible y daños de retorno.",
            "Operativamente, el vehículo sale del flujo de alquiler activo y vuelve hacia disponibilidad normal de flota.",
          ],
          nl: [
            "De boeking bewaart retourkilometers, brandstof, schadevlaggen, notities, accepted-by-details en berekende afsluitkosten.",
            "De factuursamenvatting toont vervolgens te late retour, brandstofverschil en retourschadebedragen.",
            "Operationeel gaat het voertuig uit de actieve huurflow en terug richting normale vlootbeschikbaarheid.",
          ],
        },
      },
    ],
  },
  {
    id: "vehicle-status-rules",
    slug: ["fleet", "vehicle-status-rules"],
    title: {
      en: "Vehicle status rules",
      es: "Reglas de estado del vehículo",
      nl: "Regels voor voertuigstatus",
    },
    description: {
      en: "How vehicle status should be managed and why manual ON_RENT changes can cause problems.",
      es: "Cómo debe gestionarse el estado del vehículo y por qué los cambios manuales a ON_RENT pueden causar problemas.",
      nl: "Hoe voertuigstatus beheerd moet worden en waarom handmatige ON_RENT-wijzigingen problemen kunnen geven.",
    },
    keywords: ["vehicle", "status", "on_rent", "manual", "root", "fleet", "unlock"],
    sections: [
      {
        id: "normal-flow",
        heading: {
          en: "Use booking flow instead of manual status changes",
          es: "Usa el flujo de reservas en lugar de cambios manuales",
          nl: "Gebruik de boekingsflow in plaats van handmatige statuswijzigingen",
        },
        summary: {
          en: "Vehicles should normally move into on-rent through booking delivery and move back through return check-in.",
          es: "Normalmente los vehículos deben pasar a en alquiler mediante la entrega de la reserva y volver mediante la inspección de retorno.",
          nl: "Voertuigen horen normaal gesproken naar on-rent te gaan via aflevering van een boeking en terug via retour check-in.",
        },
        bullets: {
          en: [
            "Pickup check-in is the operational step that marks a booking delivered.",
            "Return check-in is the operational step that closes the rental and returns the vehicle to the active fleet.",
            "Manual status changes bypass the contract, inspection, and billing workflow.",
            "Vehicle status should be treated as an outcome of the booking workflow, not a replacement for it.",
            "If staff need to investigate a car, booking detail and condition logs should be reviewed before changing anything manually.",
          ],
          es: [
            "La inspección de salida es el paso operativo que marca una reserva como entregada.",
            "La inspección de retorno es el paso que cierra el alquiler y devuelve el vehículo a la flota activa.",
            "Los cambios manuales de estado omiten el flujo de contrato, inspección y facturación.",
            "El estado del vehículo debe tratarse como resultado del flujo de reserva, no como sustituto de ese flujo.",
            "Si el personal necesita investigar un auto, primero debe revisar el detalle de reserva y los registros de condición.",
          ],
          nl: [
            "Pickup check-in is de operationele stap die een boeking als afgeleverd markeert.",
            "Retour check-in is de operationele stap die de huur afsluit en het voertuig terugzet naar de actieve vloot.",
            "Handmatige statuswijzigingen omzeilen het contract-, inspectie- en facturatieproces.",
            "Voertuigstatus moet worden gezien als uitkomst van de boekingsflow, niet als vervanging ervan.",
            "Als medewerkers een auto moeten onderzoeken, horen ze eerst boekingsdetail en conditielogs te controleren.",
          ],
        },
      },
      {
        id: "manual-risk",
        heading: {
          en: "Manual ON_RENT risk",
          es: "Riesgo de ON_RENT manual",
          nl: "Risico van handmatig ON_RENT",
        },
        summary: {
          en: "If someone manually sets a car to ON_RENT without a linked booking flow, normal admin actions may not be able to bring it back cleanly.",
          es: "Si alguien pone manualmente un auto en ON_RENT sin un flujo de reserva vinculado, las acciones normales de admin pueden no devolverlo correctamente.",
          nl: "Als iemand een auto handmatig op ON_RENT zet zonder gekoppelde boekingsflow, kunnen normale admin-acties deze mogelijk niet netjes terugzetten.",
        },
        bullets: {
          en: [
            "This can affect even ROOT in the current action-layer logic.",
            "The documented recovery path is to use the proper return flow when possible or correct the record directly in the database.",
            "Avoid manual status forcing unless you are intentionally handling a recovery case.",
            "The installation guide documents this exact failure mode because a vehicle can become operationally stuck without a matching contract flow.",
          ],
          es: [
            "Esto puede afectar incluso a ROOT en la lógica actual de acciones.",
            "La recuperación documentada es usar el flujo correcto de retorno cuando sea posible o corregir el registro directamente en la base de datos.",
            "Evita forzar estados manualmente salvo en un caso de recuperación controlado.",
            "La guía de instalación documenta este caso exacto porque un vehículo puede quedar atascado sin un flujo contractual correspondiente.",
          ],
          nl: [
            "Dit kan zelfs ROOT beïnvloeden in de huidige action-layer logica.",
            "Het gedocumenteerde herstelpad is het juiste retourproces gebruiken wanneer mogelijk of het record direct in de database corrigeren.",
            "Forceer statussen niet handmatig behalve bij een bewust herstelgeval.",
            "De installatiehandleiding documenteert exact dit probleem omdat een voertuig operationeel vast kan komen te zitten zonder passend contractproces.",
          ],
        },
      },
    ],
  },
  {
    id: "admin-sidebar-guide",
    slug: ["admin", "sidebar-navigation"],
    title: {
      en: "Admin sidebar guide",
      es: "Guía del menú lateral de admin",
      nl: "Handleiding voor de admin-zijbalk",
    },
    description: {
      en: "What each admin sidebar section is for and when staff should use it.",
      es: "Para qué sirve cada sección del menú lateral y cuándo debe usarla el personal.",
      nl: "Waar elke admin-zijbalksectie voor dient en wanneer medewerkers die moeten gebruiken.",
    },
    keywords: ["sidebar", "navigation", "admin", "bookings", "deliveries", "returns", "help", "settings"],
    sections: [
      {
        id: "booking-operations",
        heading: {
          en: "Booking operations sections",
          es: "Secciones operativas de reservas",
          nl: "Operationele boekingssecties",
        },
        summary: {
          en: "These are the day-to-day sections used most often by staff and owners.",
          es: "Estas son las secciones del día a día más usadas por personal y propietarios.",
          nl: "Dit zijn de dagelijkse secties die het meest worden gebruikt door medewerkers en eigenaars.",
        },
        bullets: {
          en: [
            "Bookings: the main booking queue with pending, confirmed, and declined states plus access to each booking record.",
            "Deliveries: the operational list for upcoming handovers and pickup check-in readiness.",
            "Returns: the operational list for upcoming returns and return closeout.",
            "Fleet: the high-level fleet status and forecast overview.",
            "Help Center: internal documentation, searchable guides, and the help assistant for admin users.",
          ],
          es: [
            "Reservas: la cola principal con estados pendiente, confirmada y rechazada, además de acceso a cada registro.",
            "Entregas: la lista operativa para próximas entregas y preparación de inspección de salida.",
            "Devoluciones: la lista operativa para próximos retornos y cierre de retorno.",
            "Flota: la vista general del estado y pronóstico de flota.",
            "Centro de ayuda: documentación interna, guías con búsqueda y asistente de ayuda para usuarios admin.",
          ],
          nl: [
            "Boekingen: de hoofdqueue met statussen in behandeling, bevestigd en afgewezen plus toegang tot elk boekingsrecord.",
            "Leveringen: de operationele lijst voor komende overdrachten en pickup check-in gereedheid.",
            "Innames: de operationele lijst voor komende retours en retourafsluiting.",
            "Vloot: het algemene overzicht van vlootstatus en prognose.",
            "Helpcentrum: interne documentatie, doorzoekbare handleidingen en de hulpassistent voor admin-gebruikers.",
          ],
        },
      },
      {
        id: "management-sections",
        heading: {
          en: "Owner and root management sections",
          es: "Secciones de gestión para owner y root",
          nl: "Beheersecties voor owner en root",
        },
        summary: {
          en: "These sections are mainly for configuration, oversight, and financial control.",
          es: "Estas secciones son principalmente para configuración, control y supervisión financiera.",
          nl: "Deze secties zijn vooral bedoeld voor configuratie, toezicht en financiële controle.",
        },
        bullets: {
          en: [
            "Financial: revenue, pipeline, and financial dashboard views.",
            "QuickBooks: transfer queue and external accounting sync follow-up.",
            "Availability Blocks: fleet or vehicle-specific date blocks that affect booking availability.",
            "Vehicle Management: vehicle records, pricing, categories, extras, and discount setup.",
            "Reviews: customer review moderation.",
            "Settings: tenant, tax, branding, theme, and integration settings.",
            "Locations: pickup and dropoff location management.",
            "Logs: audit trail and operational history.",
            "Users: admin user management and role control.",
          ],
          es: [
            "Finanzas: vistas de ingresos, pipeline y panel financiero.",
            "QuickBooks: cola de transferencias y seguimiento de sincronización contable externa.",
            "Bloqueos de disponibilidad: bloqueos por fecha para toda la flota o vehículos específicos que afectan la disponibilidad.",
            "Gestión de vehículos: registros de vehículos, precios, categorías, extras y descuentos.",
            "Reseñas: moderación de reseñas de clientes.",
            "Configuración: tenant, impuestos, marca, tema e integraciones.",
            "Ubicaciones: gestión de puntos de recogida y entrega.",
            "Registros: auditoría e historial operativo.",
            "Usuarios: gestión de usuarios admin y control de roles.",
          ],
          nl: [
            "Financieel: omzet-, pipeline- en financieel dashboardoverzicht.",
            "QuickBooks: overdrachtsqueue en opvolging van externe boekhoudsynchronisatie.",
            "Beschikbaarheidsblokkeringen: datumblokkeringen voor hele vloot of specifieke voertuigen die beschikbaarheid beïnvloeden.",
            "Voertuigbeheer: voertuigrecords, prijzen, categorieën, extra’s en kortingsinstellingen.",
            "Reviews: moderatie van klantreviews.",
            "Instellingen: tenant-, belasting-, branding-, thema- en integratie-instellingen.",
            "Locaties: beheer van ophaal- en inleverlocaties.",
            "Logs: audittrail en operationele historie.",
            "Gebruikers: beheer van admin-gebruikers en rollen.",
          ],
        },
      },
      {
        id: "sidebar-submenus",
        heading: {
          en: "Sidebar submenu behavior",
          es: "Comportamiento de submenús laterales",
          nl: "Gedrag van zijbalk-submenu’s",
        },
        summary: {
          en: "Some sidebar entries expose focused sub-navigation when that section is active.",
          es: "Algunas entradas del menú muestran subnavegación específica cuando la sección está activa.",
          nl: "Sommige zijbalkitems tonen gerichte subnavigatie wanneer die sectie actief is.",
        },
        bullets: {
          en: [
            "Bookings expands into Pending, Confirmed, and Declined filters.",
            "Vehicle Management expands into Manage, Pricing, Categories, Extras, and Discounts.",
            "These submenu states help staff stay on one operational area without opening separate systems.",
          ],
          es: [
            "Reservas se expande en filtros Pendiente, Confirmada y Rechazada.",
            "Gestión de vehículos se expande en Gestión, Precios, Categorías, Extras y Descuentos.",
            "Estos submenús ayudan a trabajar dentro de una sola área operativa sin abrir sistemas separados.",
          ],
          nl: [
            "Boekingen klapt uit naar filters In behandeling, Bevestigd en Afgewezen.",
            "Voertuigbeheer klapt uit naar Beheer, Prijzen, Categorieën, Extra’s en Kortingen.",
            "Deze submenu’s helpen medewerkers binnen één operationeel gebied te blijven zonder aparte systemen te openen.",
          ],
        },
      },
    ],
  },
  {
    id: "customer-emails",
    slug: ["communications", "customer-emails"],
    title: {
      en: "Customer emails and terms",
      es: "Correos al cliente y términos",
      nl: "Klantmails en voorwaarden",
    },
    description: {
      en: "Which booking emails are sent to customers and how terms are included.",
      es: "Qué correos se envían al cliente y cómo se incluyen los términos.",
      nl: "Welke boekingsmails naar klanten worden verstuurd en hoe voorwaarden worden opgenomen.",
    },
    keywords: ["emails", "terms", "invoice", "confirmed", "payment", "sales receipt", "attachment"],
    sections: [
      {
        id: "email-events",
        heading: {
          en: "Customer-facing email events",
          es: "Eventos de correo al cliente",
          nl: "Klantgerichte e-mailmomenten",
        },
        summary: {
          en: "Terms are included in the main customer booking flow emails.",
          es: "Los términos se incluyen en los principales correos del flujo de reservas para el cliente.",
          nl: "Voorwaarden worden opgenomen in de belangrijkste boekingsmails voor klanten.",
        },
        bullets: {
          en: [
            "Booking created or request received.",
            "Booking confirmed.",
            "Invoice or payment request.",
            "Resend billing document.",
            "Sales receipt.",
            "Payment received notice.",
            "Customer-facing billing emails include the terms link even when a PDF attachment cannot be added.",
          ],
          es: [
            "Reserva creada o solicitud recibida.",
            "Reserva confirmada.",
            "Factura o solicitud de pago.",
            "Reenvío del documento de facturación.",
            "Recibo de venta.",
            "Aviso de pago recibido.",
            "Los correos de facturación al cliente incluyen el enlace a términos aunque no se pueda adjuntar un PDF.",
          ],
          nl: [
            "Boeking aangemaakt of aanvraag ontvangen.",
            "Boeking bevestigd.",
            "Factuur of betalingsverzoek.",
            "Factuurdocument opnieuw verzenden.",
            "Verkoopbon.",
            "Bericht dat betaling is ontvangen.",
            "Klantgerichte factuurmails bevatten de voorwaardenlink, ook als een PDF-bijlage niet kan worden toegevoegd.",
          ],
        },
      },
      {
        id: "terms-priority",
        heading: {
          en: "How terms attachment is resolved",
          es: "Cómo se resuelve el adjunto de términos",
          nl: "Hoe de voorwaardenbijlage wordt bepaald",
        },
        summary: {
          en: "The system first looks for a local terms PDF in public files. Only if no local file exists does it try the configured terms URL.",
          es: "El sistema primero busca un PDF local de términos en archivos públicos. Solo si no existe intenta la URL configurada.",
          nl: "Het systeem zoekt eerst naar een lokaal voorwaarden-PDF in openbare bestanden. Alleen als dat ontbreekt, probeert het de geconfigureerde URL.",
        },
        bullets: {
          en: [
            "If a matching local PDF exists, that file is attached to the email.",
            "If no local file is found, the system tries the configured URL.",
            "If attachment resolution fails, the email still includes a direct terms link.",
            "Local public files have priority over remote URLs for terms attachment.",
          ],
          es: [
            "Si existe un PDF local coincidente, ese archivo se adjunta al correo.",
            "Si no hay archivo local, el sistema intenta la URL configurada.",
            "Si falla el adjunto, el correo igualmente incluye un enlace directo a los términos.",
            "Los archivos públicos locales tienen prioridad sobre URLs remotas para adjuntar términos.",
          ],
          nl: [
            "Als er een passend lokaal PDF bestaat, wordt dat bestand aan de e-mail toegevoegd.",
            "Als er geen lokaal bestand is, probeert het systeem de geconfigureerde URL.",
            "Als de bijlage niet kan worden opgehaald, bevat de e-mail nog steeds een directe link naar de voorwaarden.",
            "Lokale openbare bestanden hebben voorrang op externe URL’s voor de voorwaardenbijlage.",
          ],
        },
      },
      {
        id: "billing-document-actions",
        heading: {
          en: "Billing document actions",
          es: "Acciones de documentos de facturación",
          nl: "Acties rond factuurdocumenten",
        },
        summary: {
          en: "Booking detail keeps billing outputs accessible for operational follow-up.",
          es: "El detalle de la reserva mantiene accesibles los documentos de facturación para seguimiento operativo.",
          nl: "Boekingsdetail houdt factuurdocumenten toegankelijk voor operationele opvolging.",
        },
        bullets: {
          en: [
            "Staff can open the billing document directly from booking detail.",
            "Staff can resend the billing document by email from the booking detail action area.",
            "The same booking record keeps payment state, document state, and QuickBooks transfer status together.",
          ],
          es: [
            "El personal puede abrir el documento de facturación directamente desde el detalle de la reserva.",
            "El personal puede reenviar el documento por correo desde el área de acciones del detalle.",
            "El mismo registro mantiene juntos el estado de pago, documento y transferencia a QuickBooks.",
          ],
          nl: [
            "Medewerkers kunnen het factuurdocument direct openen vanuit het boekingsdetail.",
            "Medewerkers kunnen het factuurdocument opnieuw per e-mail verzenden vanuit het actiegebied van het detail.",
            "Hetzelfde boekingsrecord houdt betaalstatus, documentstatus en QuickBooks-overdrachtsstatus samen.",
          ],
        },
      },
    ],
  },
  {
    id: "quickbooks-setup",
    slug: ["integrations", "quickbooks-setup"],
    title: {
      en: "QuickBooks setup and sandbox mode",
      es: "Configuración de QuickBooks y modo sandbox",
      nl: "QuickBooks-instelling en sandboxmodus",
    },
    description: {
      en: "How to configure QuickBooks from Settings, connect with OAuth, use sandbox or production, and verify refresh-token health.",
      es: "Cómo configurar QuickBooks desde Ajustes, conectarlo con OAuth, usar sandbox o producción y verificar el estado del refresh token.",
      nl: "Hoe je QuickBooks vanuit Instellingen configureert, via OAuth verbindt, sandbox of productie gebruikt en de refresh-tokenstatus controleert.",
    },
    keywords: ["quickbooks", "sandbox", "production", "oauth", "refresh token", "realm id", "invoice provider", "health"],
    sections: [
      {
        id: "wizard-steps",
        heading: {
          en: "Setup wizard steps",
          es: "Pasos del asistente de configuración",
          nl: "Stappen van de instelwizard",
        },
        summary: {
          en: "QuickBooks can be configured directly from Admin Settings without editing the codebase or deployment environment.",
          es: "QuickBooks puede configurarse directamente desde Ajustes de Admin sin editar el código ni el entorno de despliegue.",
          nl: "QuickBooks kan rechtstreeks vanuit Admin Instellingen worden geconfigureerd zonder de codebase of deploymentomgeving te wijzigen.",
        },
        bullets: {
          en: [
            "Choose QuickBooks as the invoice provider in Settings.",
            "Enter the QuickBooks client ID, client secret, redirect URI, and optional item ID, then save.",
            "Select the QuickBooks environment: sandbox for testing or production for live books.",
            "Click Connect QuickBooks to complete the Intuit consent flow.",
            "Click Check QuickBooks after connecting to verify the stored token and realm ID.",
          ],
          es: [
            "Elige QuickBooks como proveedor de facturación en Ajustes.",
            "Introduce client ID, client secret, redirect URI y el item ID opcional de QuickBooks, y luego guarda.",
            "Selecciona el entorno de QuickBooks: sandbox para pruebas o producción para libros reales.",
            "Haz clic en Conectar QuickBooks para completar el flujo de consentimiento de Intuit.",
            "Haz clic en Verificar QuickBooks después de conectar para validar el token guardado y el realm ID.",
          ],
          nl: [
            "Kies QuickBooks als factuurprovider in Instellingen.",
            "Voer de QuickBooks client ID, client secret, redirect URI en optionele item ID in en sla daarna op.",
            "Kies de QuickBooks-omgeving: sandbox voor tests of productie voor live administratie.",
            "Klik op Connect QuickBooks om de Intuit-toestemmingsflow te voltooien.",
            "Klik na het verbinden op Check QuickBooks om de opgeslagen token en realm ID te verifiëren.",
          ],
        },
      },
      {
        id: "token-lifecycle",
        heading: {
          en: "Refresh token behavior",
          es: "Comportamiento del refresh token",
          nl: "Gedrag van de refresh token",
        },
        summary: {
          en: "EdgeRent Lite stores the QuickBooks refresh token and uses it to renew access automatically when API calls or health checks run.",
          es: "EdgeRent Lite guarda el refresh token de QuickBooks y lo usa para renovar el acceso automáticamente cuando se ejecutan llamadas API o verificaciones de estado.",
          nl: "EdgeRent Lite slaat de QuickBooks refresh token op en gebruikt die om toegang automatisch te vernieuwen wanneer API-calls of health checks draaien.",
        },
        bullets: {
          en: [
            "The access token is not the long-term credential; the refresh token is.",
            "If the health check fails because the refresh token is invalid or revoked, reconnect QuickBooks from Settings.",
            "A successful refresh may rotate the refresh token, and the app stores the updated value automatically.",
            "If QuickBooks is disconnected, invoice and payment transfers will fail until the connection is restored.",
          ],
          es: [
            "El access token no es la credencial de largo plazo; el refresh token sí lo es.",
            "Si la verificación falla porque el refresh token es inválido o fue revocado, vuelve a conectar QuickBooks desde Ajustes.",
            "Una renovación correcta puede rotar el refresh token y la app guarda automáticamente el nuevo valor.",
            "Si QuickBooks se desconecta, las transferencias de facturas y pagos fallarán hasta restaurar la conexión.",
          ],
          nl: [
            "De access token is niet de langetermijnreferentie; de refresh token wel.",
            "Als de health check faalt omdat de refresh token ongeldig is of is ingetrokken, verbind QuickBooks opnieuw vanuit Instellingen.",
            "Een succesvolle refresh kan de refresh token roteren en de app slaat de nieuwe waarde automatisch op.",
            "Als QuickBooks is losgekoppeld, mislukken factuur- en betalingsoverdrachten totdat de verbinding is hersteld.",
          ],
        },
      },
      {
        id: "sandbox-vs-production",
        heading: {
          en: "Sandbox vs production",
          es: "Sandbox frente a producción",
          nl: "Sandbox versus productie",
        },
        summary: {
          en: "The QuickBooks environment selector controls whether the app talks to Intuit sandbox or production accounting data.",
          es: "El selector de entorno de QuickBooks controla si la app usa datos contables sandbox o de producción de Intuit.",
          nl: "De QuickBooks-omgevingskeuze bepaalt of de app met sandbox- of productieboekhouding van Intuit praat.",
        },
        bullets: {
          en: [
            "Use sandbox during demos, QA, and connection testing.",
            "Use production only when you are ready to post real customer invoices and payments.",
            "Keep the redirect URI in the QuickBooks app configuration aligned with the value shown in Settings.",
            "Realm ID and refresh token are tied to the company and environment you authorized.",
          ],
          es: [
            "Usa sandbox durante demos, QA y pruebas de conexión.",
            "Usa producción solo cuando estés listo para registrar facturas y pagos reales de clientes.",
            "Mantén la redirect URI de la app de QuickBooks alineada con el valor mostrado en Ajustes.",
            "Realm ID y refresh token están vinculados a la empresa y al entorno que autorizaste.",
          ],
          nl: [
            "Gebruik sandbox tijdens demo’s, QA en verbindingstests.",
            "Gebruik productie pas wanneer je echte klantfacturen en betalingen wilt boeken.",
            "Houd de redirect URI in de QuickBooks-app gelijk aan de waarde die in Instellingen staat.",
            "Realm ID en refresh token zijn gekoppeld aan het bedrijf en de omgeving die je hebt geautoriseerd.",
          ],
        },
      },
    ],
  },
  {
    id: "zoho-setup",
    slug: ["integrations", "zoho-setup"],
    title: {
      en: "Zoho Invoice setup and connection health",
      es: "Configuración de Zoho Invoice y estado de conexión",
      nl: "Zoho Invoice-instelling en verbindingsstatus",
    },
    description: {
      en: "How to configure Zoho Invoice from Settings, connect with OAuth, persist refresh tokens, and validate the organization link.",
      es: "Cómo configurar Zoho Invoice desde Ajustes, conectarlo con OAuth, guardar refresh tokens y validar el vínculo con la organización.",
      nl: "Hoe je Zoho Invoice vanuit Instellingen configureert, via OAuth verbindt, refresh tokens bewaart en de organisatiekoppeling controleert.",
    },
    keywords: ["zoho", "zoho invoice", "oauth", "refresh token", "organization", "health", "payments", "invoices"],
    sections: [
      {
        id: "wizard-steps",
        heading: {
          en: "Setup wizard steps",
          es: "Pasos del asistente de configuración",
          nl: "Stappen van de instelwizard",
        },
        summary: {
          en: "Zoho Invoice setup can be completed from Admin Settings without adding provider credentials to the codebase.",
          es: "La configuración de Zoho Invoice puede completarse desde Ajustes de Admin sin añadir credenciales del proveedor al código.",
          nl: "De Zoho Invoice-instelling kan vanuit Admin Instellingen worden voltooid zonder providergegevens aan de code toe te voegen.",
        },
        bullets: {
          en: [
            "Choose Zoho Invoice as the invoice provider in Settings.",
            "Enter the Zoho client ID, client secret, redirect URI, accounts URL, and API base URL, then save.",
            "Click Connect Zoho to run the consent flow.",
            "After connection, the app stores the refresh token and attempts to resolve an organization automatically.",
            "Click Check Zoho to confirm the token still refreshes and the organization is available.",
          ],
          es: [
            "Elige Zoho Invoice como proveedor de facturación en Ajustes.",
            "Introduce client ID, client secret, redirect URI, accounts URL y API base URL de Zoho, y luego guarda.",
            "Haz clic en Conectar Zoho para ejecutar el flujo de consentimiento.",
            "Después de conectar, la app guarda el refresh token e intenta resolver automáticamente una organización.",
            "Haz clic en Verificar Zoho para confirmar que el token aún se renueva y que la organización está disponible.",
          ],
          nl: [
            "Kies Zoho Invoice als factuurprovider in Instellingen.",
            "Voer de Zoho client ID, client secret, redirect URI, accounts URL en API base URL in en sla daarna op.",
            "Klik op Connect Zoho om de toestemmingsflow te starten.",
            "Na het verbinden slaat de app de refresh token op en probeert automatisch een organisatie te bepalen.",
            "Klik op Check Zoho om te bevestigen dat de token nog ververst en de organisatie beschikbaar is.",
          ],
        },
      },
      {
        id: "token-lifecycle",
        heading: {
          en: "Refresh token behavior",
          es: "Comportamiento del refresh token",
          nl: "Gedrag van de refresh token",
        },
        summary: {
          en: "EdgeRent Lite uses the stored Zoho refresh token to request fresh access tokens whenever a sync or health check runs.",
          es: "EdgeRent Lite usa el refresh token guardado de Zoho para solicitar access tokens nuevos cuando se ejecuta una sincronización o una verificación de estado.",
          nl: "EdgeRent Lite gebruikt de opgeslagen Zoho refresh token om nieuwe access tokens op te halen wanneer een sync of health check draait.",
        },
        bullets: {
          en: [
            "If the refresh token expires or is revoked, reconnect Zoho from Settings.",
            "Health checks are useful after provider changes, permission changes, or failed transfers.",
            "A valid Zoho connection is required before invoice or payment sync can complete.",
            "The stored organization ID controls where invoices and payments are created.",
          ],
          es: [
            "Si el refresh token expira o es revocado, vuelve a conectar Zoho desde Ajustes.",
            "Las verificaciones de estado son útiles después de cambios de proveedor, permisos o transferencias fallidas.",
            "Se requiere una conexión válida de Zoho antes de completar la sincronización de facturas o pagos.",
            "El organization ID guardado controla dónde se crean las facturas y pagos.",
          ],
          nl: [
            "Als de refresh token verloopt of wordt ingetrokken, verbind Zoho opnieuw vanuit Instellingen.",
            "Health checks zijn nuttig na providerwijzigingen, permissiewijzigingen of mislukte overdrachten.",
            "Een geldige Zoho-verbinding is vereist voordat factuur- of betalingssync kan worden voltooid.",
            "De opgeslagen organization ID bepaalt waar facturen en betalingen worden aangemaakt.",
          ],
        },
      },
      {
        id: "invoice-payment-sequence",
        heading: {
          en: "Invoice and payment sequence",
          es: "Secuencia de factura y pago",
          nl: "Volgorde van factuur en betaling",
        },
        summary: {
          en: "If payment is not yet received, only the invoice is created. Once payment is marked in EdgeRent Lite, the next Zoho sync creates the payment against that invoice.",
          es: "Si el pago aún no se recibió, solo se crea la factura. Una vez marcado el pago en EdgeRent Lite, la siguiente sincronización de Zoho crea el pago contra esa factura.",
          nl: "Als de betaling nog niet is ontvangen, wordt alleen de factuur aangemaakt. Zodra de betaling in EdgeRent Lite is gemarkeerd, maakt de volgende Zoho-sync de betaling tegen die factuur aan.",
        },
        bullets: {
          en: [
            "Invoice today and payment later is supported.",
            "The booking record remains the source of truth for payment received state.",
            "If a payment is marked after invoice creation, rerun the Zoho transfer or process the pending queue.",
          ],
          es: [
            "Se admite factura hoy y pago más tarde.",
            "El registro de la reserva sigue siendo la fuente de verdad para el estado de pago recibido.",
            "Si el pago se marca después de crear la factura, vuelve a ejecutar la transferencia de Zoho o procesa la cola pendiente.",
          ],
          nl: [
            "Vandaag factureren en later betalen wordt ondersteund.",
            "Het boekingsrecord blijft de bron van waarheid voor de status betaling ontvangen.",
            "Als betaling na het aanmaken van de factuur wordt gemarkeerd, voer de Zoho-overdracht opnieuw uit of verwerk de wachtrij.",
          ],
        },
      },
    ],
  },
  {
    id: "booking-pricing-rules",
    slug: ["bookings", "pricing-rules"],
    title: {
      en: "Booking pricing rules and exceptions",
      es: "Reglas de precios y excepciones de reserva",
      nl: "Boekingsprijsregels en uitzonderingen",
    },
    description: {
      en: "How minimum rental days, last-minute windows, admin overrides, and pricing surcharges work in the booking flow.",
      es: "Cómo funcionan los días mínimos, las ventanas de última hora, las excepciones de admin y los recargos en el flujo de reservas.",
      nl: "Hoe minimale huurdagen, last-minute vensters, admin-uitzonderingen en prijstoeslagen werken in de boekingsflow.",
    },
    keywords: ["minimum rental", "last minute", "pricing rules", "admin only", "surcharge", "booking settings"],
    sections: [
      {
        id: "base-pricing",
        heading: {
          en: "Base pricing starts with daily rate",
          es: "El precio base empieza con la tarifa diaria",
          nl: "Basisprijs begint met het dagtarief",
        },
        summary: {
          en: "Every booking starts from the category base price multiplied by rental days. Extras and booking-rule surcharges are layered on top of that base.",
          es: "Cada reserva parte del precio base de la categoría multiplicado por los días. Los extras y recargos se suman encima de esa base.",
          nl: "Elke boeking start met de basisprijs van de categorie vermenigvuldigd met het aantal huurdagen. Extra's en toeslagen komen daar bovenop.",
        },
        bullets: {
          en: [
            "Base total is daily rate × rental days.",
            "Extras are added after the base total.",
            "Tax is calculated after the booking-rule pricing adjustments.",
          ],
          es: [
            "El total base es tarifa diaria × días de alquiler.",
            "Los extras se suman después del total base.",
            "El impuesto se calcula después de aplicar los ajustes de reglas de reserva.",
          ],
          nl: [
            "Het basistotaal is dagtarief × huurdagen.",
            "Extra's worden toegevoegd na het basistotaal.",
            "Belasting wordt berekend na de boekingsregel-aanpassingen.",
          ],
        },
      },
      {
        id: "minimum-rental-rules",
        heading: {
          en: "Minimum rental and admin-only exceptions",
          es: "Alquiler mínimo y excepciones solo para admin",
          nl: "Minimale huur en alleen-admin uitzonderingen",
        },
        summary: {
          en: "The minimum rental days setting is the main threshold. Public users can be blocked below that threshold while admin users stay allowed to create exceptions.",
          es: "La configuración de días mínimos es el umbral principal. Los usuarios públicos pueden quedar bloqueados por debajo de ese umbral mientras administración sigue pudiendo crear excepciones.",
          nl: "De instelling voor minimale huurdagen is de hoofdgrens. Publieke gebruikers kunnen daaronder worden geblokkeerd terwijl admins nog uitzonderingen kunnen maken.",
        },
        bullets: {
          en: [
            "When below-minimum admin-only is enabled, public users see a blocking message and cannot continue.",
            "Admins can still create the booking from the admin booking flow.",
            "A below-minimum surcharge can be configured as percentage on base total, percentage on current subtotal, or fixed amount.",
          ],
          es: [
            "Cuando la opción solo-admin para reservas por debajo del mínimo está activa, los usuarios públicos ven un bloqueo y no pueden continuar.",
            "Los admins aún pueden crear la reserva desde el flujo de admin.",
            "El recargo por debajo del mínimo puede configurarse como porcentaje sobre el total base, porcentaje sobre el subtotal actual o monto fijo.",
          ],
          nl: [
            "Wanneer alleen-admin voor onder-minimum boekingen is ingeschakeld, zien publieke gebruikers een blokkade en kunnen ze niet doorgaan.",
            "Admins kunnen de boeking nog steeds aanmaken vanuit de admin-flow.",
            "De onder-minimum toeslag kan worden ingesteld als percentage op basistotaal, percentage op huidig subtotaal of vast bedrag.",
          ],
        },
      },
      {
        id: "last-minute-rules",
        heading: {
          en: "Last-minute rules",
          es: "Reglas de última hora",
          nl: "Last-minute regels",
        },
        summary: {
          en: "A booking becomes last-minute when pickup is inside the configured threshold hours. That can trigger an extra percentage and optional public blocking.",
          es: "Una reserva pasa a ser de última hora cuando la recogida cae dentro del umbral configurado en horas. Eso puede activar un porcentaje extra y un bloqueo opcional al público.",
          nl: "Een boeking wordt last-minute wanneer de pickup binnen de ingestelde urendrempel valt. Dat kan een extra percentage en optionele blokkering voor publiek activeren.",
        },
        bullets: {
          en: [
            "Last-minute rules are managed from Admin Settings.",
            "Public users can be restricted while admins remain allowed to proceed.",
            "The extra percent is shown in the booking price breakdown before confirmation.",
          ],
          es: [
            "Las reglas de última hora se gestionan desde Ajustes de Admin.",
            "Los usuarios públicos pueden quedar restringidos mientras los admins siguen autorizados.",
            "El porcentaje extra se muestra en el desglose antes de confirmar.",
          ],
          nl: [
            "Last-minute regels worden beheerd vanuit Admin Instellingen.",
            "Publieke gebruikers kunnen worden beperkt terwijl admins doorgaan.",
            "Het extra percentage wordt in de prijsopbouw getoond vóór bevestiging.",
          ],
        },
      },
    ],
  },
  {
    id: "partner-rentals",
    slug: ["operations", "partner-rentals"],
    title: {
      en: "Partner rentals and outside-company vehicles",
      es: "Alquileres de socios y vehículos de otras empresas",
      nl: "Partnerverhuur en voertuigen van andere bedrijven",
    },
    description: {
      en: "How separate partner rentals work without mixing outside-company vehicles into the main fleet inventory.",
      es: "Cómo funcionan los alquileres de socios sin mezclar vehículos externos con el inventario principal.",
      nl: "Hoe partnerverhuur werkt zonder voertuigen van externe bedrijven te mengen met de hoofdvloot.",
    },
    keywords: ["partner rentals", "external rentals", "outside company", "supplier vehicles", "finance bucket"],
    sections: [
      {
        id: "separate-flow",
        heading: {
          en: "Separate operational flow",
          es: "Flujo operativo separado",
          nl: "Aparte operationele flow",
        },
        summary: {
          en: "Partner rentals live in their own admin area and do not create public-fleet availability or saved fleet records.",
          es: "Los alquileres de socios viven en su propia área de admin y no crean disponibilidad en la flota pública ni registros de flota guardados.",
          nl: "Partnerverhuur leeft in een eigen admin-gebied en maakt geen publieke vlootbeschikbaarheid of opgeslagen vlootrecords aan.",
        },
        bullets: {
          en: [
            "Use partner rentals when the vehicle belongs to another company.",
            "The customer still receives the normal booking email and operational follow-up.",
            "These bookings stay out of the public booking inventory and fleet calendar.",
          ],
          es: [
            "Usa alquileres de socios cuando el vehículo pertenece a otra empresa.",
            "El cliente sigue recibiendo el correo normal de reserva y el seguimiento operativo.",
            "Estas reservas se mantienen fuera del inventario público y del calendario de flota.",
          ],
          nl: [
            "Gebruik partnerverhuur wanneer het voertuig van een ander bedrijf is.",
            "De klant ontvangt nog steeds de normale boekingsmail en operationele opvolging.",
            "Deze boekingen blijven buiten de publieke inventaris en vlootkalender.",
          ],
        },
      },
      {
        id: "finance-tracking",
        heading: {
          en: "Finance tracking and transfers",
          es: "Seguimiento financiero y transferencias",
          nl: "Financiële tracking en overdrachten",
        },
        summary: {
          en: "Partner rentals track income, supplier expense, margin, payment state, and transfer bucket movement separately from fleet rentals.",
          es: "Los alquileres de socios registran ingreso, gasto del proveedor, margen, estado de pago y bucket de transferencia por separado.",
          nl: "Partnerverhuur houdt omzet, leverancierskosten, marge, betaalstatus en bucket-overdracht apart bij van vlootverhuur.",
        },
        bullets: {
          en: [
            "Day price is multiplied by the rental days for the booking total.",
            "Payment, pickup, dropoff, and transfer status can be updated from the partner rental workflow.",
            "Use the transfer/bucket status to track what still needs to be paid out to the supplier.",
          ],
          es: [
            "El precio por día se multiplica por los días del alquiler para obtener el total.",
            "Pago, recogida, entrega y estado de transferencia se actualizan desde el flujo de partner rental.",
            "Usa el estado de transferencia/bucket para seguir lo que aún debe pagarse al proveedor.",
          ],
          nl: [
            "De dagprijs wordt vermenigvuldigd met het aantal huurdagen voor het totaal.",
            "Betaling, pickup, dropoff en overdrachtsstatus kunnen vanuit de partnerverhuur-flow worden bijgewerkt.",
            "Gebruik de transfer/bucket-status om te volgen wat nog aan de leverancier moet worden betaald.",
          ],
        },
      },
    ],
  },
  {
    id: "fleet-calendar",
    slug: ["fleet", "calendar-view"],
    title: {
      en: "Fleet calendar and date-range views",
      es: "Calendario de flota y vistas por rango de fechas",
      nl: "Vlootkalender en datumrange-weergaven",
    },
    description: {
      en: "How the fleet calendar tab works, what it shows, and how date-range filters affect every fleet view.",
      es: "Cómo funciona la pestaña de calendario de flota, qué muestra y cómo los filtros de fechas afectan cada vista.",
      nl: "Hoe de vlootkalender-tab werkt, wat deze toont en hoe datumfilters elke vlootweergave beïnvloeden.",
    },
    keywords: ["fleet calendar", "calendar tab", "operations", "forecast", "date range", "filters"],
    sections: [
      {
        id: "calendar-layout",
        heading: {
          en: "Calendar layout",
          es: "Diseño del calendario",
          nl: "Kalenderindeling",
        },
        summary: {
          en: "The fleet calendar aligns vehicle rows with day columns so staff can see bookings, overlaps, and today markers at a glance.",
          es: "El calendario alinea filas de vehículos con columnas de días para ver reservas, solapes y el marcador de hoy de un vistazo.",
          nl: "De vlootkalender zet voertuigrijen uit tegen dagkolommen zodat medewerkers boekingen, overlap en vandaag-markeringen direct zien.",
        },
        bullets: {
          en: [
            "Each row represents a vehicle.",
            "Booking bars span the active dates for that vehicle.",
            "The today marker helps operations compare upcoming and in-progress work.",
          ],
          es: [
            "Cada fila representa un vehículo.",
            "Las barras de reserva abarcan las fechas activas de ese vehículo.",
            "El marcador de hoy ayuda a comparar trabajo próximo y en curso.",
          ],
          nl: [
            "Elke rij vertegenwoordigt een voertuig.",
            "Boekingsbalken lopen over de actieve data van dat voertuig.",
            "De vandaag-markering helpt bij het vergelijken van aankomend en lopend werk.",
          ],
        },
      },
      {
        id: "shared-filters",
        heading: {
          en: "Shared date filters",
          es: "Filtros de fecha compartidos",
          nl: "Gedeelde datumfilters",
        },
        summary: {
          en: "The selected start and end dates drive the calendar, operations, and forecast tabs together so every fleet view stays aligned.",
          es: "Las fechas elegidas gobiernan juntos el calendario, operaciones y previsión para que todas las vistas queden alineadas.",
          nl: "De gekozen start- en einddatum sturen kalender, operations en forecast samen aan zodat alle vlootweergaven uitgelijnd blijven.",
        },
        bullets: {
          en: [
            "Changing the date range updates every fleet tab.",
            "The selected tab and date filters persist in the URL.",
            "Use the same range when comparing occupancy, utilization, and scheduled work.",
          ],
          es: [
            "Cambiar el rango de fechas actualiza cada pestaña de flota.",
            "La pestaña elegida y los filtros se mantienen en la URL.",
            "Usa el mismo rango al comparar ocupación, utilización y trabajo programado.",
          ],
          nl: [
            "Het wijzigen van het datumbereik werkt door in elke vloottab.",
            "De gekozen tab en filters blijven in de URL staan.",
            "Gebruik hetzelfde bereik bij het vergelijken van bezetting, benutting en gepland werk.",
          ],
        },
      },
    ],
  },
];

export function isHelpLocale(locale: string): locale is HelpLocale {
  return (routing.locales as readonly string[]).includes(locale);
}

function normalizeLocale(locale: string): HelpLocale {
  return isHelpLocale(locale) ? locale : routing.defaultLocale;
}

function joinDocContent(doc: HelpDoc): string {
  return [
    doc.title,
    doc.description,
    ...doc.sections.flatMap((section) => [section.heading, section.summary, ...section.bullets]),
  ]
    .join(" ")
    .trim();
}

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .filter((token) => token.length > 1);
}

function resolveDoc(definition: HelpDocDefinition, locale: string): HelpDoc {
  const safeLocale = normalizeLocale(locale);
  const href = `${HELP_BASE_PATH}/${definition.slug.join("/")}`;

  return {
    id: definition.id,
    slug: definition.slug,
    title: definition.title[safeLocale],
    description: definition.description[safeLocale],
    keywords: definition.keywords,
    href,
    sections: definition.sections.map((section) => ({
      id: section.id,
      heading: section.heading[safeLocale],
      summary: section.summary[safeLocale],
      bullets: section.bullets?.[safeLocale] ?? [],
    })),
  };
}

export function getHelpUiCopy(locale: string): HelpUiCopy {
  return HELP_UI_COPY[normalizeLocale(locale)];
}

export function getAllHelpDocs(locale: string): HelpDoc[] {
  return HELP_DOCS.map((doc) => resolveDoc(doc, locale));
}

export function getFeaturedHelpDocs(locale: string): HelpDoc[] {
  const docs = getAllHelpDocs(locale);
  const priority = [
    "admin-sidebar-guide",
    "booking-lifecycle",
    "booking-pricing-rules",
    "partner-rentals",
    "fleet-calendar",
    "quickbooks-setup",
    "zoho-setup",
    "pickup-check-in",
    "return-closeout",
  ];

  return docs
    .sort((a, b) => {
      const indexA = priority.indexOf(a.id);
      const indexB = priority.indexOf(b.id);
      const rankA = indexA === -1 ? priority.length : indexA;
      const rankB = indexB === -1 ? priority.length : indexB;
      return rankA - rankB;
    })
    .slice(0, 6);
}

export function getHelpDocBySlug(locale: string, slug: string[]): HelpDoc | null {
  const normalized = slug.join("/");
  const doc = HELP_DOCS.find((entry) => entry.slug.join("/") === normalized);
  return doc ? resolveDoc(doc, locale) : null;
}

export function getHelpDocById(locale: string, id: string): HelpDoc | null {
  const doc = HELP_DOCS.find((entry) => entry.id === id);
  return doc ? resolveDoc(doc, locale) : null;
}

export function getAllHelpDocSlugs(): string[][] {
  return HELP_DOCS.map((doc) => doc.slug);
}

export function getHelpSuggestions(locale: string): string[] {
  const safeLocale = normalizeLocale(locale);
  return {
    en: [
      "How does pickup check-in work?",
      "What happens after a booking is confirmed?",
      "How are late return charges calculated?",
      "Can staff manually set a vehicle to ON_RENT?",
      "What customer emails are sent?",
      "How do minimum rental days and last-minute booking rules work?",
      "How do partner rentals stay separate from my normal fleet?",
      "How does the fleet calendar tab use date filters?",
      "What does each admin sidebar section do?",
      "How do I connect QuickBooks in sandbox mode?",
      "How do I reconnect Zoho if the token expires?",
    ],
    es: [
      "¿Cómo funciona la inspección de salida?",
      "¿Qué ocurre después de confirmar una reserva?",
      "¿Cómo se calculan los cargos por devolución tardía?",
      "¿El personal puede poner un vehículo manualmente en ON_RENT?",
      "¿Qué correos se envían al cliente?",
      "¿Cómo funcionan los días mínimos y las reglas de última hora?",
      "¿Cómo se mantienen separados los alquileres de socios de mi flota normal?",
      "¿Cómo usa filtros de fecha la pestaña de calendario de flota?",
      "¿Para qué sirve cada sección del menú lateral de admin?",
      "¿Cómo conecto QuickBooks en modo sandbox?",
      "¿Cómo vuelvo a conectar Zoho si expira el token?",
    ],
    nl: [
      "Hoe werkt pickup check-in?",
      "Wat gebeurt er nadat een boeking is bevestigd?",
      "Hoe worden kosten voor te late retour berekend?",
      "Kunnen medewerkers een voertuig handmatig op ON_RENT zetten?",
      "Welke klantmails worden verstuurd?",
      "Hoe werken minimale huurdagen en last-minute regels?",
      "Hoe blijven partnerverhuren gescheiden van mijn normale vloot?",
      "Hoe gebruikt de vlootkalender-tab datumfilters?",
      "Waarvoor dient elke sectie in de admin-zijbalk?",
      "Hoe verbind ik QuickBooks in sandboxmodus?",
      "Hoe verbind ik Zoho opnieuw als de token verloopt?",
    ],
  }[safeLocale];
}

export function buildHelpSearchIndex(locale: string): HelpSearchEntry[] {
  return getAllHelpDocs(locale).map((doc) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    href: toLocalePath(normalizeLocale(locale), doc.href),
    headings: doc.sections.map((section) => section.heading),
    keywords: doc.keywords,
    content: joinDocContent(doc),
  }));
}

function scoreField(text: string, terms: string[], weight: number): number {
  const normalized = normalizeText(text);
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = normalized.match(new RegExp(escaped, "g"));
    if (matches?.length) {
      score += matches.length * weight;
    }
  }
  return score;
}

function createSnippet(content: string, query: string): string {
  const normalizedContent = normalizeText(content);
  const terms = tokenize(query);
  const match = terms.find((term) => normalizedContent.includes(term));
  if (!match) {
    return content.length > 180 ? `${content.slice(0, 177).trim()}...` : content;
  }

  const rawLower = content.toLowerCase();
  const index = rawLower.indexOf(match.toLowerCase());
  if (index < 0) {
    return content.length > 180 ? `${content.slice(0, 177).trim()}...` : content;
  }

  const start = Math.max(0, index - 70);
  const end = Math.min(content.length, index + 110);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

export function searchHelpDocs(locale: string, query: string): HelpSearchResult[] {
  const terms = tokenize(query);
  if (!terms.length) return [];

  return buildHelpSearchIndex(locale)
    .map((entry) => {
      const phrase = normalizeText(query);
      let score = 0;
      score += scoreField(entry.title, terms, 14);
      score += scoreField(entry.description, terms, 10);
      score += scoreField(entry.headings.join(" "), terms, 9);
      score += scoreField(entry.keywords.join(" "), terms, 11);
      score += scoreField(entry.content, terms, 3);

      const titleNormalized = normalizeText(entry.title);
      const contentNormalized = normalizeText(entry.content);
      if (phrase && titleNormalized.includes(phrase)) score += 28;
      if (phrase && contentNormalized.includes(phrase)) score += 12;

      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        href: entry.href,
        snippet: createSnippet(entry.content, query),
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
