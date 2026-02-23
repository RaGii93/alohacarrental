import { format } from "date-fns";

type DateInput = Date | string | number | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "-";
  return format(date, "dd-MMM-yyyy");
}

export function formatDateTime(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "-";
  return format(date, "dd-MMM-yyyy - h:mma");
}

export function formatDateTimeRange(start: DateInput, end: DateInput): string {
  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
}

