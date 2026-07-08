/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RegistroError, VolumenFormulas, AuditLog } from '../types';
import { FileSpreadsheet, Download, Table, FileText, Activity, Layers, ArrowLeft } from 'lucide-react';

interface ExportarExcelViewProps {
  errors: RegistroError[];
  volumes: VolumenFormulas[];
  auditLogs: AuditLog[];
  onNavigate: (page: string) => void;
  onAddAuditLog: (action: string, detail: string) => void;
}

type SheetName = 'Registros' | 'Historial_Estados' | 'Volumen_Formulas' | 'Audit_Log';

export default function ExportarExcelView({
  errors,
  volumes,
  auditLogs,
  onNavigate,
  onAddAuditLog,
}: ExportarExcelViewProps) {
  const [activeSheet, setActiveSheet] = useState<SheetName>('Registros');

  // Convert table rows to standard CSV string
  const downloadCsv = (sheet: SheetName) => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    if (sheet === 'Registros') {
      headers = [
        'ID_Registro',
        'Fecha_Registro',
        'Hora_Registro',
        'Usuario_Registro',
        'Nombre_Paciente',
        'Apellidos_Paciente',
        'Numero_Documento',
        'EPS',
        'Medico',
        'Tipo_Error',
        'Origen_Formula',
        'Observaciones',
        'Estado_Actual',
      ];
      rows = errors.map((e) => [
        e.id_registro,
        e.fecha_registro,
        e.hora_registro,
        e.usuario_registro,
        e.nombre_paciente,
        e.apellidos_paciente,
        e.numero_documento,
        e.eps,
        e.medico,
        e.tipo_error,
        e.origen_formula,
        e.observaciones || '',
        e.estado_actual,
      ]);
      filename = 'BASE_ERRORES_FORMULAS_Registros.csv';
    } else if (sheet === 'Historial_Estados') {
      headers = ['ID_Registro', 'Estado', 'Fecha', 'Hora', 'Usuario'];
      errors.forEach((e) => {
        e.historial_estados.forEach((h) => {
          rows.push([e.id_registro, h.estado, h.fecha, h.hora, h.usuario]);
        });
      });
      filename = 'BASE_ERRORES_FORMULAS_Historial_Estados.csv';
    } else if (sheet === 'Volumen_Formulas') {
      headers = ['Fecha', 'EPS', 'Medico', 'Cantidad_Formulas_Validadas', 'Registrado_Por'];
      rows = volumes.map((v) => [
        v.fecha,
        v.eps,
        v.medico,
        String(v.cantidad_formulas_validadas),
        v.registrado_por,
      ]);
      filename = 'BASE_ERRORES_FORMULAS_Volumen_Formulas.csv';
    } else if (sheet === 'Audit_Log') {
      headers = ['Fecha', 'Hora', 'Usuario', 'Accion', 'Detalle'];
      rows = auditLogs.map((l) => [l.fecha, l.hora, l.usuario, l.accion, l.detalle]);
      filename = 'BASE_ERRORES_FORMULAS_Audit_Log.csv';
    }

    // Join elements escaping quotation marks
    const csvContent = [
      headers.join(';'), // Semicolon is default list separator for Spanish regional settings in Excel
      ...rows.map((row) =>
        row
          .map((val) => {
            const clean = val.replace(/"/g, '""');
            return clean.includes(';') || clean.includes('\n') || clean.includes('"')
              ? `"${clean}"`
              : clean;
          })
          .join(';')
      ),
    ].join('\n');

    // Create virtual blob and trigger click download
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    }); // UTF-8 BOM to display accented chars in Excel correctly
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Audit log
    onAddAuditLog(
      'Exportación Excel',
      `Exportó y descargó la hoja "${sheet}" en formato CSV compatible con Microsoft Excel.`
    );
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
        <span className="text-xs text-[#9CA3AF] font-mono">Consolidación de Datos de Calidad</span>
      </div>

      {/* Main explanation card */}
      <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F3F4F6] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Exportar Base de Datos a Microsoft Excel
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Generación y previsualización del libro maestro de datos clínico-farmacéuticos:{' '}
              <strong className="text-gray-300 font-mono">BASE_ERRORES_FORMULAS.xlsx</strong>
            </p>
          </div>

          <button
            id={`download-btn-${activeSheet}`}
            onClick={() => downloadCsv(activeSheet)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg transition shadow-md self-start sm:self-center"
          >
            <Download className="w-4 h-4" />
            Descargar Hoja Activa (Excel CSV)
          </button>
        </div>

        {/* Tab navigation imitating worksheets at bottom of Excel */}
        <div className="flex overflow-x-auto border-b border-[#1F2937] text-xs">
          {(['Registros', 'Historial_Estados', 'Volumen_Formulas', 'Audit_Log'] as SheetName[]).map(
            (sheet) => (
              <button
                key={sheet}
                onClick={() => setActiveSheet(sheet)}
                className={`px-4 py-2.5 font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeSheet === sheet
                    ? 'border-[#22C55E] text-[#22C55E] bg-[#1F2937]/30'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1F2937]/10'
                }`}
              >
                {sheet === 'Registros' && <Table className="w-3.5 h-3.5" />}
                {sheet === 'Historial_Estados' && <Activity className="w-3.5 h-3.5" />}
                {sheet === 'Volumen_Formulas' && <Layers className="w-3.5 h-3.5" />}
                {sheet === 'Audit_Log' && <FileText className="w-3.5 h-3.5" />}
                <span>{sheet.replace('_', ' ')}</span>
              </button>
            )
          )}
        </div>

        {/* Spreadsheet Preview Grid */}
        <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg overflow-hidden font-mono text-[11px] leading-none">
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            {activeSheet === 'Registros' && (
              <table id="excel-preview-registros" className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#1F2937]/50 text-gray-400 sticky top-0 border-b border-[#1F2937]">
                  <tr>
                    <th className="p-2.5 border-r border-[#1F2937]">ID_Registro</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Fecha_Registro</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Hora_Registro</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Usuario_Registro</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Nombre_Paciente</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Apellidos_Paciente</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Numero_Documento</th>
                    <th className="p-2.5 border-r border-[#1F2937]">EPS</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Medico</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Tipo_Error</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Origen_Formula</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Observaciones</th>
                    <th className="p-2.5">Estado_Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/30 text-gray-300">
                  {errors.map((e, idx) => (
                    <tr key={idx} className="hover:bg-[#131B2E] transition">
                      <td className="p-2.5 border-r border-[#1F2937]/40 text-[#22D3EE] font-bold">
                        {e.id_registro}
                      </td>
                      <td className="p-2.5 border-r border-[#1F2937]/40">{e.fecha_registro}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40">{e.hora_registro}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans">{e.usuario_registro}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans text-white">
                        {e.nombre_paciente}
                      </td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans text-white">
                        {e.apellidos_paciente}
                      </td>
                      <td className="p-2.5 border-r border-[#1F2937]/40">{e.numero_documento}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans">{e.eps}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans">{e.medico}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans text-red-400">
                        {e.tipo_error}
                      </td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans">{e.origen_formula}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 truncate max-w-xs font-sans text-gray-400">
                        {e.observaciones || ''}
                      </td>
                      <td className="p-2.5 text-amber-400">{e.estado_actual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeSheet === 'Historial_Estados' && (
              <table id="excel-preview-historial" className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#1F2937]/50 text-gray-400 sticky top-0 border-b border-[#1F2937]">
                  <tr>
                    <th className="p-2.5 border-r border-[#1F2937]">ID_Registro</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Estado</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Fecha</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Hora</th>
                    <th className="p-2.5">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/30 text-gray-300">
                  {errors.flatMap((e) =>
                    e.historial_estados.map((h, hIdx) => (
                      <tr key={`${e.id_registro}-${hIdx}`} className="hover:bg-[#131B2E] transition">
                        <td className="p-2.5 border-r border-[#1F2937]/40 text-[#22D3EE] font-bold">
                          {e.id_registro}
                        </td>
                        <td className="p-2.5 border-r border-[#1F2937]/40 text-amber-400">{h.estado}</td>
                        <td className="p-2.5 border-r border-[#1F2937]/40">{h.fecha}</td>
                        <td className="p-2.5 border-r border-[#1F2937]/40">{h.hora}</td>
                        <td className="p-2.5 font-sans">{h.usuario}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeSheet === 'Volumen_Formulas' && (
              <table id="excel-preview-volumen" className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#1F2937]/50 text-gray-400 sticky top-0 border-b border-[#1F2937]">
                  <tr>
                    <th className="p-2.5 border-r border-[#1F2937]">Fecha</th>
                    <th className="p-2.5 border-r border-[#1F2937]">EPS</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Medico</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Cantidad_Formulas_Validadas</th>
                    <th className="p-2.5">Registrado_Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/30 text-gray-300">
                  {volumes.map((v) => (
                    <tr key={v.id} className="hover:bg-[#131B2E] transition">
                      <td className="p-2.5 border-r border-[#1F2937]/40">{v.fecha}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans">{v.eps}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans">{v.medico}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 text-cyan-400 font-bold">
                        {v.cantidad_formulas_validadas}
                      </td>
                      <td className="p-2.5 font-sans">{v.registrado_por}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeSheet === 'Audit_Log' && (
              <table id="excel-preview-audit" className="w-full text-left whitespace-nowrap">
                <thead className="bg-[#1F2937]/50 text-gray-400 sticky top-0 border-b border-[#1F2937]">
                  <tr>
                    <th className="p-2.5 border-r border-[#1F2937]">Fecha</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Hora</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Usuario</th>
                    <th className="p-2.5 border-r border-[#1F2937]">Accion</th>
                    <th className="p-2.5">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/30 text-gray-300">
                  {auditLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-[#131B2E] transition">
                      <td className="p-2.5 border-r border-[#1F2937]/40">{l.fecha}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40">{l.hora}</td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans font-semibold text-gray-400">
                        {l.usuario}
                      </td>
                      <td className="p-2.5 border-r border-[#1F2937]/40 font-sans text-cyan-400 font-bold">
                        {l.accion}
                      </td>
                      <td className="p-2.5 font-sans text-gray-400 truncate max-w-lg" title={l.detalle}>
                        {l.detalle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-500 italic text-right mt-1">
          * El archivo CSV exportado utiliza delimitador de punto y coma (;) compatible nativamente con Microsoft Excel en español.
        </p>
      </div>
    </div>
  );
}
