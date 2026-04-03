type DateInput = Date | string | number | null | undefined;
export const APP_TIME_ZONE = "America/Kralendijk";
const KRALENDIJK_UTC_OFFSET = "-04:00";

function formatter(
  options: Intl.DateTimeFormatOptions,
  locale = "en-US"
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    ...options,
  });
}

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function partsMap(date: Date, options: Intl.DateTimeFormatOptions) {
  return formatter(options)
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
}

export function formatDate(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "-";
  const parts = partsMap(date, { day: "2-digit", month: "short", year: "numeric" });
  return `${parts.day}-${parts.month}-${parts.year}`;
}

export function formatDateTime(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "-";
  const dateLabel = formatDate(date);
  const parts = partsMap(date, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateLabel} - ${parts.hour}:${parts.minute}${parts.dayPeriod?.toUpperCase() || ""}`;
}

export function formatDateTimeRange(start: DateInput, end: DateInput): string {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

export function formatDateForInput(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "";
  const parts = partsMap(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDateTimeLocalInput(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "";
  const parts = partsMap(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseKralendijkDate(value: string, endOfDay = false): Date | null {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const time = endOfDay ? "23:59:59" : "00:00:00";
  const date = new Date(`${normalized}T${time}${KRALENDIJK_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseKralendijkDateTime(value: string): Date | null {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(normalized)) return null;
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  const date = new Date(`${withSeconds}${KRALENDIJK_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}
