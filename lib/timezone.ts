export const LA_PAZ_TIME_ZONE = "America/La_Paz";

const LA_PAZ_OFFSET_MINUTES = -4 * 60;

type DateInput = Date | string | number | null | undefined;

type LaPazParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const laPazDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: LA_PAZ_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatOffsetDateParts(date: Date) {
  const shifted = new Date(date.getTime() + LA_PAZ_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function getLaPazDateTimeParts(input: DateInput): LaPazParts | null {
  const date = toDate(input);
  if (!date) return null;

  const parts = laPazDateTimeFormatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

export function createLaPazDate(params: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): Date {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = params;

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - LA_PAZ_OFFSET_MINUTES * 60_000
  );
}

export function parseLaPazDateInput(value: string, hour = 12): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  return createLaPazDate({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour,
  });
}

export function parseLaPazDateTimeInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  return createLaPazDate({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  });
}

export function formatDateInputInLaPaz(input: DateInput): string {
  const date = toDate(input);
  if (!date) return "";

  const { year, month, day } = formatOffsetDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDateTimeInputInLaPaz(input: DateInput): string {
  const parts = getLaPazDateTimeParts(input);
  if (!parts) return "";

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function combineLaPazDateAndTime(date: Date | null, time: string): Date | null {
  if (!date) return null;

  const parts = getLaPazDateTimeParts(date);
  if (!parts) return null;

  const match = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  return createLaPazDate({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: Number(match[1]),
    minute: Number(match[2]),
  });
}

export function addLaPazDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function startOfLaPazDay(date: Date): Date {
  const parts = getLaPazDateTimeParts(date);
  if (!parts) return date;

  return createLaPazDate({
    year: parts.year,
    month: parts.month,
    day: parts.day,
  });
}

export function getLaPazToday(): Date {
  return startOfLaPazDay(new Date());
}

export function getLaPazTodayPlusYears(yearsDelta: number): Date {
  const todayParts = getLaPazDateTimeParts(new Date());
  if (!todayParts) {
    return new Date();
  }

  return createLaPazDate({
    year: todayParts.year + yearsDelta,
    month: todayParts.month,
    day: todayParts.day,
    hour: 12,
  });
}
