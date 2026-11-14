// src/lib/date.ts
export const APP_TIMEZONE = "Asia/Chita"; // UTC+9

/**
 * Возвращает текущую дату по Чите в формате YYYY-MM-DD
 */
export function getTodayChitaDateStr(baseDate: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(baseDate);

  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/**
 * Преобразует Date или ISO-строку в YYYY-MM-DD по часовому поясу Читы (для <input type="date">)
 */
export function toChitaDateInputValue(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  return getTodayChitaDateStr(d);
}

/**
 * Возвращает начало дня (00:00:00.000 +09:00) по Чите
 */
export function getChitaStartOfDay(dateStrOrDate: string | Date = new Date()): Date {
  const dateStr =
    typeof dateStrOrDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStrOrDate.trim())
      ? dateStrOrDate.trim()
      : getTodayChitaDateStr(typeof dateStrOrDate === "string" ? new Date(dateStrOrDate) : dateStrOrDate);
  return new Date(`${dateStr}T00:00:00.000+09:00`);
}

/**
 * Возвращает конец дня (23:59:59.999 +09:00) по Чите — т.е. 14:59:59.999Z.
 * Исключает сдвиг даты на сутки вперёд в браузере и на сервере.
 */
export function parseChitaEndOfDay(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    const dateStr = getTodayChitaDateStr(dateInput);
    return new Date(`${dateStr}T23:59:59.999+09:00`);
  }

  const trimmed = dateInput.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T23:59:59.999+09:00`);
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Некорректный формат даты: ${dateInput}`);
  }
  const dateStr = getTodayChitaDateStr(parsed);
  return new Date(`${dateStr}T23:59:59.999+09:00`);
}

/**
 * Расчет даты ближайшего дня недели (1 = ПН ... 7 = ВС) строго по часовому поясу Читы
 */
export function getNextDayOfWeekChita(dayOfWeek: number): Date {
  const todayStr = getTodayChitaDateStr(new Date());
  const chitaNoon = new Date(`${todayStr}T12:00:00+09:00`);
  const jsDay = chitaNoon.getUTCDay();
  const currentDay = jsDay === 0 ? 7 : jsDay;

  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }

  chitaNoon.setUTCDate(chitaNoon.getUTCDate() + daysUntil);
  const targetStr = getTodayChitaDateStr(chitaNoon);
  return new Date(`${targetStr}T23:59:59.999+09:00`);
}

/**
 * Форматирует дату в формате ДД.ММ.ГГГГ строго по часовому поясу Читы
 */
export function formatChitaDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "—";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { timeZone: APP_TIMEZONE });
}