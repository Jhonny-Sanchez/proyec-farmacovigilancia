// Fecha local en formato YYYY-MM-DD.
// toISOString() devuelve la fecha en UTC, lo que adelanta el día
// después de las 7 p.m. hora de Colombia (UTC-5).
export function fechaLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
