// Fecha local en formato YYYY-MM-DD.
// toISOString() devuelve la fecha en UTC, lo que adelanta el día
// después de las 7 p.m. hora de Colombia (UTC-5).
export function fechaLocalISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Resume el detalle de un protocolo ("- Capecitabina: 1000 mg/m2 VO...")
// dejando solo los nombres de los medicamentos ("Capecitabina + Oxaliplatino").
// Se usa para llenar el campo Medicamento de una cita, que se muestra en la
// tabla de citas y en los mensajes al paciente: el detalle completo puede
// tener más de mil caracteres.
export function resumirMedicamentos(detalle: string, maxNombres = 6): string {
  const nombres = detalle
    .split('\n')
    .map((linea) => linea.replace(/^[-•*\s]+/, '').split(':')[0].trim())
    .filter(Boolean);

  if (nombres.length === 0) return detalle.trim();

  const visibles = nombres.slice(0, maxNombres).join(' + ');
  return nombres.length > maxNombres ? `${visibles} y otros` : visibles;
}
