/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RegistroError, VolumenFormulas, EPS_CATALOG, MEDICOS_CATALOG } from '../types';
import { Calendar, BarChart3, TrendingUp, ShieldAlert, Award, FileSpreadsheet, ArrowLeft, Filter } from 'lucide-react';

interface ReportesViewProps {
  errors: RegistroError[];
  volumes: VolumenFormulas[];
  onNavigate: (page: string) => void;
  medicos?: string[];
}

export default function ReportesView({ errors, volumes, onNavigate, medicos = MEDICOS_CATALOG }: ReportesViewProps) {
  // Date filters states (defaults to late June 2026)
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [sortBy, setSortBy] = useState<'rate_desc' | 'rate_asc' | 'alpha'>('rate_desc');

  // Filter records in range
  const filteredErrors = errors.filter(
    (e) => e.fecha_registro >= startDate && e.fecha_registro <= endDate
  );
  const filteredVolumes = volumes.filter(
    (v) => v.fecha >= startDate && v.fecha <= endDate
  );

  const errorsCount = filteredErrors.length;
  const volumesSum = filteredVolumes.reduce(
    (sum, v) => sum + v.cantidad_formulas_validadas,
    0
  );
  const totalRate = volumesSum > 0 ? (errorsCount / volumesSum) * 100 : 0;

  // EPS comparison rates
  const epsReportList = EPS_CATALOG.map((eps) => {
    const epsErrors = filteredErrors.filter((e) => e.eps === eps).length;
    const epsVol = filteredVolumes
      .filter((v) => v.eps === eps)
      .reduce((sum, v) => sum + v.cantidad_formulas_validadas, 0);
    const rate = epsVol > 0 ? (epsErrors / epsVol) * 100 : 0;
    return { name: eps, errors: epsErrors, volume: epsVol, rate };
  });

  // Doctor comparison rates
  const medReportList = medicos.map((med) => {
    const medErrors = filteredErrors.filter((e) => e.medico === med).length;
    const medVol = filteredVolumes
      .filter((v) => v.medico === med)
      .reduce((sum, v) => sum + v.cantidad_formulas_validadas, 0);
    const rate = medVol > 0 ? (medErrors / medVol) * 100 : 0;
    return { name: med, errors: medErrors, volume: medVol, rate };
  });

  // Sort lists
  const sortReport = (list: { name: string; errors: number; volume: number; rate: number }[]) => {
    const clone = [...list];
    if (sortBy === 'rate_desc') {
      return clone.sort((a, b) => b.rate - a.rate);
    } else if (sortBy === 'rate_asc') {
      return clone.sort((a, b) => a.rate - b.rate);
    } else {
      return clone.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const sortedEps = sortReport(epsReportList);
  const sortedMed = sortReport(medReportList);

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
        <span className="text-xs text-[#9CA3AF] font-mono">Reporte consolidado de Calidad</span>
      </div>

      {/* Date range filters */}
      <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#3B82F6]" />
          <h4 className="text-sm font-bold text-[#F3F4F6]">Filtros de Período y Configuración</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#9CA3AF]">Fecha Inicio (Desde)</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
              <input
                id="report-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F3F4F6] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#9CA3AF]">Fecha Fin (Hasta)</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
              <input
                id="report-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F3F4F6] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#9CA3AF]">Criterio de Ordenamiento</label>
            <select
              id="report-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] outline-none"
            >
              <option value="rate_desc">Tasa de Error: Mayor a Menor</option>
              <option value="rate_asc">Tasa de Error: Menor a Mayor</option>
              <option value="alpha">Alfabético por Nombre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Numerical summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131B2E] border border-[#1F2937] p-5 rounded-xl space-y-1">
          <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Fórmulas Erróneas</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-400">{errorsCount}</span>
            <span className="text-xs text-gray-500">encontradas en el rango</span>
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#1F2937] p-5 rounded-xl space-y-1">
          <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Fórmulas Validadas (Total)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#F3F4F6]">{volumesSum}</span>
            <span className="text-xs text-gray-500 font-mono">denominador</span>
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#1F2937] p-5 rounded-xl space-y-1">
          <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Tasa de Error en el Período</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#22D3EE]">{totalRate.toFixed(2)}%</span>
            <span className="text-xs text-[#22C55E] font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Estabilidad
            </span>
          </div>
        </div>
      </div>

      {/* Analytical rate tables and horizontal graphics side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EPS statistics */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Tasa de Error por Entidad (EPS)</h4>
            </div>
            <span className="text-[10px] font-mono text-gray-500">Denominador: Volumen de Formulas de EPS</span>
          </div>

          <div className="space-y-4">
            {sortedEps.map((item) => {
              const maxVal = Math.max(...sortedEps.map((i) => i.rate), 1);
              const percentOfMax = `${(item.rate / maxVal) * 100}%`;

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300">{item.name}</span>
                    <span className="font-mono text-[#22D3EE] font-bold">
                      {item.rate.toFixed(2)}%{' '}
                      <span className="text-[10px] text-gray-500 font-normal">
                        ({item.errors} de {item.volume})
                      </span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-[#0B1120] rounded-full overflow-hidden border border-[#1F2937]/50">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-[#22D3EE] rounded-full transition-all duration-500"
                      style={{ width: item.rate > 0 ? percentOfMax : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doctor statistics */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-400" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Tasa de Error por Médico Prescriptor</h4>
            </div>
            <span className="text-[10px] font-mono text-gray-500">Denominador: Volumen de formulas del médico</span>
          </div>

          <div className="space-y-4">
            {sortedMed.map((item) => {
              const maxVal = Math.max(...sortedMed.map((i) => i.rate), 1);
              const percentOfMax = `${(item.rate / maxVal) * 100}%`;

              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300 truncate max-w-[200px]">{item.name}</span>
                    <span className="font-mono text-violet-400 font-bold">
                      {item.rate.toFixed(2)}%{' '}
                      <span className="text-[10px] text-gray-500 font-normal">
                        ({item.errors} de {item.volume})
                      </span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-[#0B1120] rounded-full overflow-hidden border border-[#1F2937]/50">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: item.rate > 0 ? percentOfMax : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calculation methodology details card */}
      <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4" />
          Nota Metodológica e Indicador de Gestión
        </h4>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">
          Para garantizar la veracidad matemática, la tasa de error <strong>no se calcula</strong> sobre las recetas defectuosas solas. En su lugar, se requiere el volumen total acumulado de fórmulas validadas (correctas + incorrectas) registradas periódicamente de manera independiente para cada EPS y Médico. El porcentaje resultante refleja qué porcentaje del volumen formulado presenta algún tipo de error que deba corregirse.
        </p>
      </div>
    </div>
  );
}
