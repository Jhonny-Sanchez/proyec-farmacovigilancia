/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLog } from '../types';
import { FileText, Search, ArrowLeft, RotateCcw } from 'lucide-react';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
  onNavigate: (page: string) => void;
}

export default function AuditLogView({ auditLogs, onNavigate }: AuditLogViewProps) {
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredLogs = auditLogs
    .filter(
      (log) =>
        log.usuario.toLowerCase().includes(query.toLowerCase()) ||
        log.accion.toLowerCase().includes(query.toLowerCase()) ||
        log.detalle.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => {
      const aTime = `${a.fecha}T${a.hora}`;
      const bTime = `${b.fecha}T${b.hora}`;
      return sortOrder === 'desc' ? bTime.localeCompare(aTime) : aTime.localeCompare(bTime);
    });

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
          Configuración / <span className="text-gray-300">Audit Log</span>
        </span>
      </div>

      <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F3F4F6] flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Bitácora de Auditoría del Sistema (Audit Log)
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Historial inmutable de acciones realizadas por los usuarios (Logins, creación, cambio de estado, exportaciones).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="toggle-audit-order-btn"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2.5 py-1.5 bg-[#1F2937] text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-gray-800 rounded-lg text-xs font-semibold transition flex items-center gap-1 border border-[#1F2937]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Orden: {sortOrder === 'desc' ? 'Recientes Primero' : 'Antiguos Primero'}
            </button>
          </div>
        </div>

        {/* Filter search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            id="audit-search-input"
            type="text"
            placeholder="Filtrar por usuario, acción o detalle (ej. ERR-2026)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 outline-none focus:border-[#3B82F6]"
          />
        </div>

        {/* Logs table */}
        <div className="overflow-x-auto rounded-lg border border-[#1F2937] bg-[#0B1120]/40">
          <table id="audit-logs-table" className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#1F2937]/50 text-gray-400 font-semibold border-b border-[#1F2937] font-sans">
                <th className="p-3 w-36">Fecha / Hora</th>
                <th className="p-3 w-28">Usuario</th>
                <th className="p-3 w-40">Acción</th>
                <th className="p-3">Detalle Técnico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/30 text-gray-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 font-sans">
                    No se encontraron registros en el log de auditoría.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1C263E]/20 transition">
                    <td className="p-3 text-gray-500">
                      {log.fecha} <span className="text-gray-600">|</span> {log.hora}
                    </td>
                    <td className="p-3 font-sans font-semibold text-gray-300">
                      {log.usuario}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2937] text-cyan-400 border border-[#1F2937] uppercase">
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-gray-400">
                      {log.detalle}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
