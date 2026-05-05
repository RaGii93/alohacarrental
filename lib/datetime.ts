import { LA_PAZ_TIME_ZONE } from "@/lib/timezone";

type DateInput = Date | string | number | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: LA_PAZ_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: LA_PAZ_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatDate(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "-";
  return dateFormatter.format(date);
}

export function formatDateTime(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "-";
  return dateTimeFormatter.format(date).replace(", ", " - ").replace(" AM", "AM").replace(" PM", "PM");
}

export function formatDateTimeRange(start: DateInput, end: DateInput): string {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}
