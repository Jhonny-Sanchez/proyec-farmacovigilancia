/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VolumenFormulas, EPS_CATALOG, MEDICOS_CATALOG } from '../types';
import { Settings, Plus, Layers, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ConfiguracionViewProps {
  volumes: VolumenFormulas[];
  currentUser: { nombre_usuario: string };
  onAddVolume: (vol: VolumenFormulas) => void;
  onNavigate: (page: string) => void;
  medicos?: string[];
}

export default function ConfiguracionView({
  volumes,
  currentUser,
  onAddVolume,
  onNavigate,
  medicos = MEDICOS_CATALOG,
}: ConfiguracionViewProps) {
  // Form states
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [eps, setEps] = useState('');
  const [medico, setMedico] = useState('');
  const [quantity, setQuantity] = useState('');

  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (!eps || !medico || !quantity) {
      setFeedback('Por favor complete todos los campos requeridos.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setFeedback('La cantidad de fórmulas debe ser un entero mayor que cero.');
      return;
    }

    const newVolume: VolumenFormulas = {
      id: `VOL-${String(volumes.length + 1).padStart(3, '0')}`,
      fecha: date,
      eps,
      medico,
      cantidad_formulas_validadas: qty,
      registrado_por: currentUser.nombre_usuario,
    };

    onAddVolume(newVolume);

    // Reset quantity
    setQuantity('');
    setFeedback('¡Volumen de fórmulas registrado exitosamente!');
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
        <span className="text-xs text-[#9CA3AF]">
          Configuración / <span className="text-gray-300">Volumen de Fórmulas</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Add Volume form */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
            <Plus className="w-4 h-4 text-[#3B82F6]" />
            <h4 className="text-sm font-bold text-[#F3F4F6]">Registrar Volumen de Fórmulas</h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  feedback.includes('exitosamente')
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E]'
                    : 'bg-red-500/10 border border-red-500/20 text-[#EF4444]'
                }`}
              >
                {feedback}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA3AF]">Fecha de Corte</label>
              <input
                id="volume-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA3AF]">Entidad (EPS)</label>
              <select
                id="volume-eps-select"
                value={eps}
                onChange={(e) => setEps(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] outline-none"
                required
              >
                <option value="">Seleccione EPS...</option>
                {EPS_CATALOG.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA3AF]">Médico Prescriptor</label>
              <select
                id="volume-medico-select"
                value={medico}
                onChange={(e) => setMedico(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] outline-none"
                required
              >
                <option value="">Seleccione Médico...</option>
                {medicos.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA3AF]">Fórmulas Validadas Totales (Cantidad)</label>
              <input
                id="volume-qty-input"
                type="number"
                min="1"
                placeholder="ej. 85"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] outline-none font-mono"
                required
              />
            </div>

            <button
              id="submit-volume-btn"
              type="submit"
              className="w-full py-2 bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white rounded-lg transition"
            >
              Registrar Volumen Acumulado
            </button>
          </form>
        </div>

        {/* Right column: Log of Denominators */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
            <Layers className="w-4 h-4 text-[#3B82F6]" />
            <h4 className="text-sm font-bold text-[#F3F4F6]">Historial de Fórmulas Validadas Totales</h4>
          </div>

          <div className="overflow-x-auto">
            <table id="volume-formulas-table" className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-[#1F2937] text-[#9CA3AF] font-semibold bg-[#1F2937]/20 font-sans">
                  <th className="p-3">Fecha Corte</th>
                  <th className="p-3">EPS</th>
                  <th className="p-3">Médico</th>
                  <th className="p-3 text-right">Fórmulas Totales</th>
                  <th className="p-3 text-right">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/30 text-gray-300">
                {volumes
                  .slice()
                  .reverse()
                  .map((vol) => (
                    <tr key={vol.id} className="hover:bg-[#1F2937]/10 transition">
                      <td className="p-3">{vol.fecha}</td>
                      <td className="p-3 font-sans font-semibold text-gray-300">{vol.eps}</td>
                      <td className="p-3 font-sans text-gray-400">{vol.medico}</td>
                      <td className="p-3 text-right text-cyan-400 font-bold font-mono">
                        {vol.cantidad_formulas_validadas}
                      </td>
                      <td className="p-3 text-right font-sans text-gray-500">{vol.registrado_por}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
