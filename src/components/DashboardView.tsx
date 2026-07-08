/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RegistroError, VolumenFormulas, STATUS_CONFIGS } from '../types';
import {
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Clock,
  Plus,
  Download,
  BarChart3,
  ListFilter,
  Eye,
  BookOpen,
} from 'lucide-react';

interface DashboardViewProps {
  errors: RegistroError[];
  volumes: VolumenFormulas[];
  onNavigate: (page: string) => void;
  onSelectError: (error: RegistroError) => void;
}

export default function DashboardView({
  errors,
  volumes,
  onNavigate,
  onSelectError,
}: DashboardViewProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [hoveredBarEps, setHoveredBarEps] = useState<string | null>(null);
  const [hoveredBarMed, setHoveredBarMed] = useState<string | null>(null);

  // 1. Calculations
  const totalErrors = errors.length;
  const totalValidatedFormulas = volumes.reduce(
    (sum, v) => sum + v.cantidad_formulas_validadas,
    0
  );
  const globalErrorRate =
    totalValidatedFormulas > 0
      ? (totalErrors / totalValidatedFormulas) * 100
      : 0;

  const pendingCount = errors.filter(
    (e) => e.estado_actual !== 'ENTREGADO_PROGRAMACION'
  ).length;

  // 2. Calculations for Charts

  // A. Error Trend by Day (last 6 days)
  const days = ['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30'];
  const errorCountsByDay = days.map(
    (day) => errors.filter((e) => e.fecha_registro === day).length
  );
  const maxDayCount = Math.max(...errorCountsByDay, 1);

  // B. Error type distribution
  const typeCounts: Record<string, number> = {};
  errors.forEach((e) => {
    typeCounts[e.tipo_error] = (typeCounts[e.tipo_error] || 0) + 1;
  });
  const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
    percentage: totalErrors > 0 ? (value / totalErrors) * 100 : 0,
  }));

  // Colors for slices
  const SLICE_COLORS = [
    '#3B82F6', // Blue
    '#22D3EE', // Cyan
    '#8B5CF6', // Violet
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#10B981', // Emerald
  ];

  // C. Rate of error by EPS
  const epsList = ['FAMISANAR', 'NUEVA EPS', 'CAPITAL SALUD', 'COOSALUD', 'PROTEGER', 'FOMAG'];
  const epsRates = epsList.map((eps) => {
    const epsErrors = errors.filter((e) => e.eps === eps).length;
    const epsVol = volumes
      .filter((v) => v.eps === eps)
      .reduce((sum, v) => sum + v.cantidad_formulas_validadas, 0);
    const rate = epsVol > 0 ? (epsErrors / epsVol) * 100 : 0;
    return { name: eps, errorsCount: epsErrors, volume: epsVol, rate };
  });

  // D. Rate of error by Doctor
  const medList = ['CARLOS BUITRAGO', 'LUIS BAEZ', 'GREGORIO MALDONADO', 'DAVID MAURICIO MEJIA', 'VLADIMIR AVILA'];
  const medRates = medList.map((med) => {
    const medErrors = errors.filter((e) => e.medico === med).length;
    const medVol = volumes
      .filter((v) => v.medico === med)
      .reduce((sum, v) => sum + v.cantidad_formulas_validadas, 0);
    const rate = medVol > 0 ? (medErrors / medVol) * 100 : 0;
    return { name: med, errorsCount: medErrors, volume: medVol, rate };
  });

  return (
    <div className="space-y-6">
      {/* Banner de Guía de Usuario */}
      <div className="bg-[#131B2E] border border-blue-500/25 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
        <div className="flex gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#22D3EE] h-fit">
            <BookOpen className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-200">
              ¿Desea aprender cómo funciona este sistema? Guía "Paso a Paso" Disponible
            </h4>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Consulte nuestro nuevo manual interactivo diseñado para indicarle paso a paso cómo operar los flujos clínicos y de farmacovigilancia.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('guia_usuario')}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded-lg transition shrink-0 uppercase tracking-wider shadow-lg shadow-blue-500/15"
        >
          Ver Guía del Sistema
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div id="kpi-errors" className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Errores Registrados</p>
            <h3 className="text-3xl font-bold text-[#F3F4F6] tracking-tight">{totalErrors}</h3>
            <p className="text-xs text-[#22C55E] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.4% vs mes ant.</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[#EF4444]">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div id="kpi-validated" className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Fórmulas Validadas</p>
            <h3 className="text-3xl font-bold text-[#F3F4F6] tracking-tight">{totalValidatedFormulas}</h3>
            <p className="text-xs text-[#22C55E] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+4.2% vs mes ant.</span>
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6]">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div id="kpi-rate" className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Tasa de Error Global</p>
            <h3 className="text-3xl font-bold text-[#22D3EE] tracking-tight">
              {globalErrorRate.toFixed(2)}%
            </h3>
            <p className="text-xs text-[#9CA3AF]">Basado en el denominador maestro</p>
          </div>
          <div className="p-3 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE]">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div id="kpi-pending" className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Pendientes de Gestión</p>
            <h3 className="text-3xl font-bold text-[#F59E0B] tracking-tight">{pendingCount}</h3>
            <p className="text-xs text-amber-500/80">Flujo activo QF / Áreas de origen</p>
          </div>
          <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B]">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Graphs Row: Trend & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line graph */}
        <div className="lg:col-span-2 bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">Tendencia Temporal de Errores</h4>
              <p className="text-xs text-[#9CA3AF]">Distribución diaria de incidencias en los últimos días</p>
            </div>
            <span className="text-xs bg-[#1F2937] text-[#F3F4F6] px-2.5 py-1 rounded-full font-medium">Junio 2026</span>
          </div>

          {/* Line Chart Draw */}
          <div className="h-56 relative flex items-end justify-between pt-6">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-600">
              <div className="border-b border-[#1F2937]/50 w-full pb-1 flex justify-between">
                <span>{maxDayCount} errores</span>
              </div>
              <div className="border-b border-[#1F2937]/50 w-full pb-1 flex justify-between">
                <span>{Math.round(maxDayCount / 2)} errores</span>
              </div>
              <div className="border-b border-[#1F2937]/50 w-full pb-1">
                <span>0</span>
              </div>
            </div>

            {/* Custom SVG Path for Trend */}
            <div className="w-full h-full relative z-10 pt-4 flex items-end">
              <svg className="w-full h-3/4 overflow-visible" viewBox="0 0 600 150">
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Path area */}
                <path
                  d={`M 20,${150 - (errorCountsByDay[0] / maxDayCount) * 110} 
                      L 130,${150 - (errorCountsByDay[1] / maxDayCount) * 110} 
                      L 240,${150 - (errorCountsByDay[2] / maxDayCount) * 110} 
                      L 350,${150 - (errorCountsByDay[3] / maxDayCount) * 110} 
                      L 460,${150 - (errorCountsByDay[4] / maxDayCount) * 110} 
                      L 570,${150 - (errorCountsByDay[5] / maxDayCount) * 110}
                      L 570,150 L 20,150 Z`}
                  fill="url(#trendGrad)"
                />

                {/* Line path */}
                <path
                  d={`M 20,${150 - (errorCountsByDay[0] / maxDayCount) * 110} 
                      L 130,${150 - (errorCountsByDay[1] / maxDayCount) * 110} 
                      L 240,${150 - (errorCountsByDay[2] / maxDayCount) * 110} 
                      L 350,${150 - (errorCountsByDay[3] / maxDayCount) * 110} 
                      L 460,${150 - (errorCountsByDay[4] / maxDayCount) * 110} 
                      L 570,${150 - (errorCountsByDay[5] / maxDayCount) * 110}`}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Dots */}
                {errorCountsByDay.map((count, idx) => {
                  const cx = 20 + idx * 110;
                  const cy = 150 - (count / maxDayCount) * 110;
                  return (
                    <g key={idx} className="group/dot cursor-pointer">
                      <circle cx={cx} cy={cy} r="6" fill="#131B2E" stroke="#22D3EE" strokeWidth="3" />
                      <circle cx={cx} cy={cy} r="10" fill="#22D3EE" opacity="0" className="hover:opacity-20 transition" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between text-xs text-[#9CA3AF] px-2 pt-2">
            {days.map((day) => (
              <div key={day} className="text-center font-mono">
                <span>{day.substring(8, 10)} Jun</span>
                <span className="block text-[10px] text-[#3B82F6] font-bold">
                  {errors.filter((e) => e.fecha_registro === day).length} err.
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Donut */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">Distribución por Tipo de Error</h4>
            <p className="text-xs text-[#9CA3AF]">Proporción de desviaciones detectadas</p>
          </div>

          <div className="my-4 flex justify-center relative">
            {/* Donut SVG */}
            {totalErrors === 0 ? (
              <div className="h-32 flex items-center justify-center text-[#9CA3AF] text-sm">
                Sin datos de errores registrados
              </div>
            ) : (
              <div className="relative w-36 h-36">
                <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1F2937" strokeWidth="4.5" />
                  {(() => {
                    let cumulativePercent = 0;
                    return typeDistribution.map((item, index) => {
                      const color = SLICE_COLORS[index % SLICE_COLORS.length];
                      const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                      const strokeDashoffset = 100 - cumulativePercent;
                      cumulativePercent += item.percentage;

                      return (
                        <circle
                          key={item.name}
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke={color}
                          strokeWidth="4.5"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:stroke-[5.5] cursor-pointer"
                          onMouseEnter={() => setHoveredSlice(item.name)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-[#9CA3AF]">Total</span>
                  <span className="text-xl font-bold text-[#F3F4F6]">{totalErrors}</span>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs">
            {typeDistribution.slice(0, 4).map((item, idx) => (
              <div
                key={item.name}
                className={`flex items-center justify-between p-1 rounded transition ${
                  hoveredSlice === item.name ? 'bg-[#1F2937]/50' : ''
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SLICE_COLORS[idx % SLICE_COLORS.length] }}
                  />
                  <span className="text-[#F3F4F6] truncate">{item.name}</span>
                </div>
                <span className="font-mono font-medium text-[#22D3EE] ml-2">{item.value} ({Math.round(item.percentage)}%)</span>
              </div>
            ))}
            {typeDistribution.length > 4 && (
              <p className="text-[10px] text-[#9CA3AF] text-center pt-1 italic">
                + {typeDistribution.length - 4} categorías adicionales en registros
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Graphs Row: EPS and Medicos rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Rate by EPS */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">Tasa de Error por EPS (%)</h4>
            <p className="text-xs text-[#9CA3AF]">
              (Errores de la EPS ÷ Fórmulas validadas de la EPS) × 100
            </p>
          </div>

          <div className="space-y-3.5">
            {epsRates.map((epsItem) => {
              const maxRate = Math.max(...epsRates.map((r) => r.rate), 1);
              const barWidth = `${(epsItem.rate / maxRate) * 100}%`;

              return (
                <div
                  key={epsItem.name}
                  className="space-y-1 group"
                  onMouseEnter={() => setHoveredBarEps(epsItem.name)}
                  onMouseLeave={() => setHoveredBarEps(null)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#F3F4F6]">{epsItem.name}</span>
                    <span className="font-mono text-[#22D3EE] font-bold">
                      {epsItem.rate.toFixed(2)}%{' '}
                      <span className="text-[#9CA3AF] text-[10px] font-normal">
                        ({epsItem.errorsCount}/{epsItem.volume})
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#1F2937] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: epsItem.rate > 0 ? barWidth : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Rate by Doctor */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">Tasa de Error por Médico Prescriptor (%)</h4>
            <p className="text-xs text-[#9CA3AF]">
              (Errores del médico ÷ Fórmulas validadas del médico) × 100
            </p>
          </div>

          <div className="space-y-3.5">
            {medRates.map((medItem) => {
              const maxRate = Math.max(...medRates.map((r) => r.rate), 1);
              const barWidth = `${(medItem.rate / maxRate) * 100}%`;

              return (
                <div
                  key={medItem.name}
                  className="space-y-1 group"
                  onMouseEnter={() => setHoveredBarMed(medItem.name)}
                  onMouseLeave={() => setHoveredBarMed(null)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#F3F4F6] truncate max-w-[180px]">
                      {medItem.name}
                    </span>
                    <span className="font-mono text-violet-400 font-bold">
                      {medItem.rate.toFixed(2)}%{' '}
                      <span className="text-[#9CA3AF] text-[10px] font-normal">
                        ({medItem.errorsCount}/{medItem.volume})
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#1F2937] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: medItem.rate > 0 ? barWidth : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row: Recent Registries & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Registries table */}
        <div className="lg:col-span-3 bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold text-[#F3F4F6]">Últimos Errores Reportados</h4>
              <p className="text-xs text-[#9CA3AF]">Incidentes recientes que requieren trazabilidad</p>
            </div>
            <button
              id="view-all-errors-btn"
              onClick={() => onNavigate('registros')}
              className="text-xs text-[#3B82F6] hover:text-[#22D3EE] font-medium flex items-center gap-1 transition"
            >
              <ListFilter className="w-3.5 h-3.5" />
              Ver todo el listado
            </button>
          </div>

          <div className="overflow-x-auto">
            <table id="recent-errors-table" className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] text-[#9CA3AF] font-medium">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Paciente</th>
                  <th className="py-2.5">EPS</th>
                  <th className="py-2.5">Error</th>
                  <th className="py-2.5">Estado</th>
                  <th className="py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/40">
                {errors.slice(0, 5).map((err) => {
                  const statusConf = STATUS_CONFIGS[err.estado_actual] || {
                    nombre: err.estado_actual,
                    badgeBg: 'bg-gray-500/10 border-gray-500/20',
                    badgeText: 'text-gray-400',
                  };

                  return (
                    <tr key={err.id_registro} className="hover:bg-[#1F2937]/20 transition">
                      <td className="py-3 font-mono font-semibold text-[#22D3EE]">{err.id_registro}</td>
                      <td className="py-3 font-medium text-[#F3F4F6] truncate max-w-[120px]">
                        {err.nombre_paciente} {err.apellidos_paciente}
                      </td>
                      <td className="py-3 text-[#9CA3AF]">{err.eps}</td>
                      <td className="py-3 text-[#9CA3AF] truncate max-w-[150px]">{err.tipo_error}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConf.badgeBg} ${statusConf.badgeText}`}
                        >
                          {statusConf.nombre}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectError(err)}
                          className="p-1 text-[#3B82F6] hover:text-[#22D3EE] rounded transition hover:bg-[#1F2937]/80 inline-flex items-center gap-1"
                          title="Ver detalle y flujo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Gestionar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
          <div>
            <h4 className="text-base font-semibold text-[#F3F4F6]">Atajos Rápidos</h4>
            <p className="text-xs text-[#9CA3AF]">Acceso ágil a herramientas clave</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              id="shortcut-new-error"
              onClick={() => onNavigate('nuevo_registro')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1F2937]/50 hover:bg-[#1F2937] border border-[#1F2937] text-left text-xs transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-blue-500/10 text-[#3B82F6]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#F3F4F6]">Nuevo Registro</p>
                  <p className="text-[10px] text-[#9CA3AF]">Reportar error de fórmula</p>
                </div>
              </div>
            </button>

            <button
              id="shortcut-export"
              onClick={() => onNavigate('exportar_excel')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1F2937]/50 hover:bg-[#1F2937] border border-[#1F2937] text-left text-xs transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-emerald-500/10 text-[#22C55E]">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#F3F4F6]">Exportar a Excel</p>
                  <p className="text-[10px] text-[#9CA3AF]">Generar reporte maestro</p>
                </div>
              </div>
            </button>

            <button
              id="shortcut-reports"
              onClick={() => onNavigate('reportes')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1F2937]/50 hover:bg-[#1F2937] border border-[#1F2937] text-left text-xs transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-cyan-500/10 text-[#22D3EE]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#F3F4F6]">Generar Reporte</p>
                  <p className="text-[10px] text-[#9CA3AF]">Tasa de error y métricas</p>
                </div>
              </div>
            </button>

            <button
              id="shortcut-pending"
              onClick={() => onNavigate('registros')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[#1F2937]/50 hover:bg-[#1F2937] border border-[#1F2937] text-left text-xs transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-amber-500/10 text-[#F59E0B]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#F3F4F6]">Ver Pendientes</p>
                  <p className="text-[10px] text-[#9CA3AF]">Fórmulas sin recibir o reenviar</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
