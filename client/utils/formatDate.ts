import i18n from "../i18n";

const LOCALE_MAP: Record<string, string> = {
  en: "en-GB",
  ru: "ru-RU",
  pl: "pl-PL",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  ua: "ua-UA",
  pt: "pt-PT",
  be: "be-BY",
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
