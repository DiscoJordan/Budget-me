import i18n from "../i18n";

const LOCALE_MAP: Record<string, string> = {
  en: "en-GB",
  ru: "ru-RU",
};

export function getLocale(): string {
  return LOCALE_MAP[i18n.language] ?? "en-GB";
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString(getLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(getLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(getLocale(), {
    month: "long",
    year: "numeric",
  });
}

export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString(getLocale(), {
    day: "2-digit",
    month: "short",
  });
}
