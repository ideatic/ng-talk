export const nameof = <T>(name: keyof T) => name;

export function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function daysDiff(date: Date, reference: Date): number {
  const diff = new Date(date.getTime()).setHours(12) - new Date(reference.getTime()).setHours(12);
  return Math.round(diff / 8.64e7);
}
