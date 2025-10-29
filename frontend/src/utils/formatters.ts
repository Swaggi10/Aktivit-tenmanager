import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

/**
 * Datum formatieren (z.B. "12. Jan 2024")
 */
export const formatDate = (date: Date | string): string => {
  return format(new Date(date), 'dd. MMM yyyy', { locale: de });
};

/**
 * Datum mit Uhrzeit formatieren
 */
export const formatDateTime = (date: Date | string): string => {
  return format(new Date(date), 'dd. MMM yyyy, HH:mm', { locale: de });
};

/**
 * Relative Zeit (z.B. "vor 2 Stunden")
 */
export const formatRelativeTime = (date: Date | string): string => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: de,
  });
};

/**
 * Punkte formatieren (z.B. "1,234")
 */
export const formatPoints = (points: number): string => {
  return new Intl.NumberFormat('de-DE').format(points);
};

/**
 * Prozentsatz formatieren
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};
