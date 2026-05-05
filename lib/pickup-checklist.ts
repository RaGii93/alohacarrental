import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatDateTime } from "@/lib/datetime";
import { TenantConfig, tenantThemeTokenToPdfRgb } from "@/lib/tenant";

export type AgrChecklistMode = "pickup" | "return";

export const AGR_CHECKLIST_ITEMS = {
  pickup: [
    "license_verified",
    "vehicle_exterior_checked",
    "vehicle_interior_checked",
    "fuel_level_confirmed",
    "accessories_confirmed",
    "rental_window_confirmed",
    "terms_explained",
    "client_received_vehicle",
  ],
  return: [
    "vehicle_exterior_rechecked",
    "vehicle_interior_rechecked",
    "fuel_level_rechecked",
    "damage_reviewed",
    "late_return_reviewed",
    "extra_charges_explained",
    "keys_received",
    "client_closeout_confirmed",
  ],
} as const;

type ModeItemMap = typeof AGR_CHECKLIST_ITEMS;
export type AgrChecklistItemId<M extends AgrChecklistMode = AgrChecklistMode> = ModeItemMap[M][number];

const CHECKLIST_LABELS: Record<string, Record<AgrChecklistMode, Record<string, string>>> = {
  en: {
    pickup: {
      license_verified: "Driver license and renter identity verified",
      vehicle_exterior_checked: "Vehicle exterior checked with the client",
      vehicle_interior_checked: "Vehicle interior checked with the client",
      fuel_level_confirmed: "Pickup fuel level confirmed",
      accessories_confirmed: "Spare tire, jack, tools, and accessories confirmed",
      rental_window_confirmed: "Pickup and dropoff timing/location confirmed",
      terms_explained: "Rental terms and key responsibilities explained",
      client_received_vehicle: "Client received the vehicle and keys",
    },
    return: {
      vehicle_exterior_rechecked: "Vehicle exterior rechecked with the client",
      vehicle_interior_rechecked: "Vehicle interior rechecked with the client",
      fuel_level_rechecked: "Return fuel level confirmed",
      damage_reviewed: "Damage review completed with the client",
      late_return_reviewed: "Late return status reviewed",
      extra_charges_explained: "Any extra charges were explained",
      keys_received: "Vehicle keys and accessories received back",
      client_closeout_confirmed: "Client confirmed the return closeout summary",
    },
  },
  es: {
    pickup: {
      license_verified: "Licencia del conductor e identidad del cliente verificadas",
      vehicle_exterior_checked: "Exterior del vehiculo revisado con el cliente",
      vehicle_interior_checked: "Interior del vehiculo revisado con el cliente",
      fuel_level_confirmed: "Nivel de combustible de entrega confirmado",
      accessories_confirmed: "Llanta de repuesto, gato, herramientas y accesorios confirmados",
      rental_window_confirmed: "Horario y lugar de entrega/devolucion confirmados",
      terms_explained: "Condiciones del alquiler y responsabilidades explicadas",
      client_received_vehicle: "El cliente recibio el vehiculo y las llaves",
    },
    return: {
      vehicle_exterior_rechecked: "Exterior del vehiculo revisado nuevamente con el cliente",
      vehicle_interior_rechecked: "Interior del vehiculo revisado nuevamente con el cliente",
      fuel_level_rechecked: "Nivel de combustible al devolver confirmado",
      damage_reviewed: "Revision de danos completada con el cliente",
      late_return_reviewed: "Se reviso si hubo devolucion tardia",
      extra_charges_explained: "Se explicaron los cargos adicionales",
      keys_received: "Se recibieron las llaves y accesorios del vehiculo",
      client_closeout_confirmed: "El cliente confirmo el resumen de cierre",
    },
  },
  nl: {
    pickup: {
      license_verified: "Rijbewijs en identiteit van de huurder gecontroleerd",
      vehicle_exterior_checked: "Buitenkant van het voertuig met de klant gecontroleerd",
      vehicle_interior_checked: "Binnenkant van het voertuig met de klant gecontroleerd",
      fuel_level_confirmed: "Brandstofniveau bij uitgifte bevestigd",
      accessories_confirmed: "Reservewiel, krik, gereedschap en accessoires bevestigd",
      rental_window_confirmed: "Ophaal- en inlevertijd/locatie bevestigd",
      terms_explained: "Huurvoorwaarden en verantwoordelijkheden uitgelegd",
      client_received_vehicle: "Klant heeft voertuig en sleutels ontvangen",
    },
    return: {
      vehicle_exterior_rechecked: "Buitenkant van het voertuig opnieuw met de klant gecontroleerd",
      vehicle_interior_rechecked: "Binnenkant van het voertuig opnieuw met de klant gecontroleerd",
      fuel_level_rechecked: "Brandstofniveau bij inlevering bevestigd",
      damage_reviewed: "Schadecontrole met de klant voltooid",
      late_return_reviewed: "Te late inlevering is beoordeeld",
      extra_charges_explained: "Eventuele extra kosten zijn uitgelegd",
      keys_received: "Voertuigsleutels en accessoires zijn terug ontvangen",
      client_closeout_confirmed: "Klant heeft het eindoverzicht bevestigd",
    },
  },
};

function getLocale(locale?: string) {
  return locale && CHECKLIST_LABELS[locale] ? locale : "en";
}

export function getAgrChecklistItems(mode: AgrChecklistMode) {
  return [...AGR_CHECKLIST_ITEMS[mode]];
}

export function normalizeAgrChecklistSelection(
  mode: AgrChecklistMode,
  input?: string[] | null
): string[] {
  const selected = new Set<string>();
  for (const value of input || []) {
    if ((AGR_CHECKLIST_ITEMS[mode] as readonly string[]).includes(value)) {
      selected.add(value);
    }
  }
  return AGR_CHECKLIST_ITEMS[mode].filter((item) => selected.has(item));
}

export function getAgrChecklistLabels(mode: AgrChecklistMode, locale?: string) {
  return CHECKLIST_LABELS[getLocale(locale)][mode];
}

export async function generateAgrChecklistPdf(input: {
  locale?: string;
  mode: AgrChecklistMode;
  tenantConfig: TenantConfig;
  bookingCode: string;
  customerName: string;
  vehicleName: string;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  startDate: Date;
  endDate: Date;
  acceptedBy: string;
  acceptedAt: Date;
  odometerKm: number;
  fuelLevelLabel: string;
  damageNotes?: string | null;
  agentNotes?: string | null;
  checklistItemIds: string[];
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const labels = getAgrChecklistLabels(input.mode, input.locale);
  const margin = 42;
  const contentWidth = width - margin * 2;
  const primary = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(input.tenantConfig.theme.primary);
    return rgb(r, g, b);
  })();
  const primaryForeground = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(input.tenantConfig.theme.primaryForeground);
    return rgb(r, g, b);
  })();
  const accent = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(input.tenantConfig.theme.accent);
    return rgb(r, g, b);
  })();
  const accentForeground = (() => {
    const { r, g, b } = tenantThemeTokenToPdfRgb(input.tenantConfig.theme.accentForeground);
    return rgb(r, g, b);
  })();
  const dark = rgb(0.1, 0.1, 0.12);
  const muted = rgb(0.38, 0.4, 0.45);
  const border = rgb(0.91, 0.87, 0.85);
  const soft = rgb(0.985, 0.978, 0.972);
  const richSurface = rgb(0.96, 0.955, 0.945);
  const badgeWidth = input.mode === "pickup" ? 166 : 160;
  const modeTitle = input.mode === "pickup" ? "PICKUP CHECKLIST" : "RETURN CHECKLIST";
  const modeSubtitle =
    input.mode === "pickup" ? "Vehicle handoff confirmation record" : "Vehicle return and closeout record";

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: margin, y: height - 122, width: contentWidth, height: 2, color: accent });

  const embeddedLogo = await loadLogoImageForPdf(pdfDoc, input.tenantConfig.logoUrl);
  if (embeddedLogo) {
    const logoMaxHeight = 58;
    const logoScale = logoMaxHeight / embeddedLogo.height;
    page.drawImage(embeddedLogo, {
      x: margin,
      y: height - 88,
      width: embeddedLogo.width * logoScale,
      height: logoMaxHeight,
    });
  } else {
    page.drawText(input.tenantConfig.tenantName || "LOGO", {
      x: margin,
      y: height - 55,
      size: 14,
      font: bold,
      color: dark,
    });
  }

  const metaX = width - margin - 190;
  page.drawText(modeTitle, { x: metaX, y: height - 48, size: 15, font: bold, color: dark });
  page.drawText(`Booking: ${input.bookingCode}`, { x: metaX, y: height - 66, size: 10, font, color: muted });
  page.drawText(`Accepted: ${formatDateTime(input.acceptedAt)}`, { x: metaX, y: height - 82, size: 10, font, color: muted });
  page.drawText(`Generated: ${formatDateTime(new Date())}`, { x: metaX, y: height - 98, size: 10, font, color: muted });

  let y = height - 146;
  page.drawText(input.tenantConfig.address || "-", { x: margin, y, size: 10, font, color: muted });
  y -= 14;
  page.drawText(`${input.tenantConfig.email} | ${input.tenantConfig.phone}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: muted,
  });

  y -= 26;
  page.drawRectangle({
    x: margin,
    y: y - 82,
    width: contentWidth,
    height: 82,
    color: richSurface,
    borderColor: border,
    borderWidth: 1,
  });
  page.drawRectangle({ x: margin, y: y - 82, width: 7, height: 82, color: primary });
  page.drawText(modeTitle, { x: margin + 24, y: y - 24, size: 17, font: bold, color: dark });
  page.drawText(modeSubtitle, { x: margin + 24, y: y - 41, size: 9.5, font, color: muted });
  page.drawText(input.tenantConfig.tenantName || "", {
    x: margin + 24,
    y: y - 58,
    size: 8.8,
    font,
    color: muted,
  });
  page.drawRectangle({
    x: width - margin - badgeWidth - 18,
    y: y - 34,
    width: badgeWidth,
    height: 24,
    color: accent,
    borderColor: border,
    borderWidth: 1,
  });
  page.drawText(input.mode === "pickup" ? "READY FOR DELIVERY" : "RETURN COMPLETE", {
    x: width - margin - badgeWidth - 8,
    y: y - 26,
    size: 9,
    font: bold,
    color: accentForeground,
  });
  y -= 102;

  const cardGap = 12;
  const cardW = (contentWidth - cardGap) / 2;
  const topCardHeight = 132;
  const topCardY = y;

  page.drawRectangle({
    x: margin,
    y: topCardY - topCardHeight,
    width: cardW,
    height: topCardHeight,
    color: rgb(1, 1, 1),
    borderColor: border,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: margin + cardW + cardGap,
    y: topCardY - topCardHeight,
    width: cardW,
    height: topCardHeight,
    color: rgb(1, 1, 1),
    borderColor: border,
    borderWidth: 1,
  });

  const drawInfoCard = (title: string, x: number, topY: number, boxHeight: number, rows: Array<[string, string]>) => {
    page.drawRectangle({ x, y: topY - 34, width: cardW, height: 34, color: primary });
    page.drawText(title, { x: x + 14, y: topY - 22, size: 10, font: bold, color: primaryForeground });
    let rowY = topY - 52;
    for (const [label, value] of rows) {
      page.drawText(label, { x: x + 14, y: rowY, size: 9.5, font: bold, color: muted });
      page.drawText(value, {
        x: x + 96,
        y: rowY,
        size: 9.5,
        font,
        color: dark,
        maxWidth: cardW - 110,
      });
      rowY -= 17;
    }
  };

  drawInfoCard("CUSTOMER INFORMATION", margin, topCardY, topCardHeight, [
    ["Customer", input.customerName],
    ["Vehicle", input.vehicleName],
    ["Accepted by", input.acceptedBy],
    ["Accepted at", formatDateTime(input.acceptedAt)],
  ]);

  drawInfoCard("BOOKING INFORMATION", margin + cardW + cardGap, topCardY, topCardHeight, [
    ["Booking", input.bookingCode],
    ["Pickup", formatDateTime(input.startDate)],
    ["Dropoff", formatDateTime(input.endDate)],
    ["Pickup spot", input.pickupLocation || "-"],
    ["Dropoff spot", input.dropoffLocation || "-"],
  ]);

  y -= topCardHeight + 18;

  const detailBlockHeight = 72;
  page.drawRectangle({
    x: margin,
    y: y - detailBlockHeight,
    width: contentWidth,
    height: detailBlockHeight,
    color: rgb(1, 1, 1),
    borderColor: border,
    borderWidth: 1,
  });
  page.drawRectangle({ x: margin, y: y - 32, width: contentWidth, height: 32, color: soft });
  page.drawText("VEHICLE & INSPECTION", {
    x: margin + 14,
    y: y - 20,
    size: 10,
    font: bold,
    color: primary,
  });
  page.drawText(`Vehicle: ${input.vehicleName}`, {
    x: margin + 14,
    y: y - 48,
    size: 9.5,
    font,
    color: dark,
  });
  page.drawText(`Odometer: ${Math.max(0, Math.round(input.odometerKm))} km`, {
    x: margin + 182,
    y: y - 48,
    size: 9.5,
    font,
    color: dark,
  });
  page.drawText(`Fuel level: ${input.fuelLevelLabel}`, {
    x: margin + 350,
    y: y - 48,
    size: 9.5,
    font,
    color: dark,
  });

  y -= detailBlockHeight + 20;

  page.drawRectangle({ x: margin, y: y - 28, width: contentWidth, height: 28, color: primary });
  page.drawText("CHECKLIST REVIEW", { x: margin + 14, y: y - 18, size: 10, font: bold, color: primaryForeground });
  y -= 28;

  for (const itemId of AGR_CHECKLIST_ITEMS[input.mode]) {
    const checked = input.checklistItemIds.includes(itemId);
    page.drawRectangle({
      x: margin,
      y: y - 26,
      width: contentWidth,
      height: 26,
      color: checked ? soft : rgb(1, 1, 1),
      borderColor: border,
      borderWidth: 1,
    });
    page.drawRectangle({
      x: margin + 12,
      y: y - 18,
      width: 10,
      height: 10,
      color: checked ? accent : rgb(1, 1, 1),
      borderColor: checked ? accent : muted,
      borderWidth: 1,
    });
    if (checked) {
      page.drawText("x", { x: margin + 14.5, y: y - 16.5, size: 8, font: bold, color: accentForeground });
    }
    page.drawText(labels[itemId], {
      x: margin + 30,
      y: y - 17,
      size: 9.4,
      font,
      color: dark,
      maxWidth: contentWidth - 44,
    });
    y -= 26;
  }

  const noteBlocks = [
    { label: "Damage Notes", value: input.damageNotes?.trim() || "" },
    { label: "Agent Notes", value: input.agentNotes?.trim() || "" },
  ].filter((entry) => entry.value);

  for (const block of noteBlocks) {
    if (y < 120) break;
    y -= 18;
    page.drawRectangle({ x: margin, y: y - 28, width: contentWidth, height: 28, color: primary });
    page.drawText(block.label.toUpperCase(), { x: margin + 14, y: y - 18, size: 10, font: bold, color: primaryForeground });
    y -= 40;
    page.drawText(block.value.slice(0, 320), {
      x: margin + 2,
      y,
      size: 9.2,
      font,
      color: dark,
      maxWidth: contentWidth - 4,
      lineHeight: 12,
    });
    y -= 28;
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

async function loadLogoImageForPdf(pdfDoc: PDFDocument, rawLogoUrl?: string) {
  const candidatePaths = Array.from(new Set([String(rawLogoUrl || "").trim(), "/images/Logo.png"].filter(Boolean)));
  for (const candidatePath of candidatePaths) {
    if (!candidatePath.startsWith("/")) continue;
    try {
      const filePath = path.join(process.cwd(), "public", candidatePath.replace(/^\/+/, ""));
      const bytes = await readFile(filePath);
      const lower = candidatePath.toLowerCase();
      if (lower.endsWith(".png")) return await pdfDoc.embedPng(bytes);
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return await pdfDoc.embedJpg(bytes);
    } catch {}
  }
  return null;
}
