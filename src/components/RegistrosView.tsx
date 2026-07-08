/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  RegistroError,
  STATUS_CONFIGS,
  ErrorStatus,
  UserRole,
  OriginFormula,
  TIPOS_DE_ERROR_CATALOG,
  DocumentoAdjunto,
} from '../types';
import {
  Search,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  Send,
  FileText,
  Trash2,
  Lock,
  Plus,
  X,
  FileDown,
  RefreshCw,
  UploadCloud,
  Layers,
  Printer,
  Download,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface RegistrosViewProps {
  errors: RegistroError[];
  currentUser: { nombre_usuario: string; rol: UserRole };
  selectedError: RegistroError | null;
  onSelectError: (error: RegistroError | null) => void;
  onUpdateErrorStatus: (
    id: string,
    newStatus: ErrorStatus,
    updatedFields?: Partial<RegistroError>
  ) => void;
  onNavigate: (page: string) => void;
}

export default function RegistrosView({
  errors,
  currentUser,
  selectedError,
  onSelectError,
  onUpdateErrorStatus,
  onNavigate,
}: RegistrosViewProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEps, setFilterEps] = useState('');
  const [filterErrorType, setFilterErrorType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // States for active validation workflow actions
  const [transitionErrorType, setTransitionErrorType] = useState('Error de dosis');
  const [transitionObservations, setTransitionObservations] = useState('');
  const [transitionCorrectionNotes, setTransitionCorrectionNotes] = useState('');

  // Soportes / Attachments addition form state
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [newDocCategory, setNewDocCategory] = useState<'historia_clinica' | 'politerapia_monoterapia' | 'formula_medica' | 'consentimiento_informado'>('historia_clinica');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [dragActiveAdd, setDragActiveAdd] = useState(false);

  // Subsequent month / cycle complete formulation form states
  const [showNextMonthForm, setShowNextMonthForm] = useState(false);
  const [nextFormulaNotes, setNextFormulaNotes] = useState('');
  
  const [nextHcFile, setNextHcFile] = useState<File | null>(null);
  const [nextHcName, setNextHcName] = useState('');
  const [nextPmFile, setNextPmFile] = useState<File | null>(null);
  const [nextPmName, setNextPmName] = useState('');
  const [nextFmFile, setNextFmFile] = useState<File | null>(null);
  const [nextFmName, setNextFmName] = useState('');
  const [nextCiFile, setNextCiFile] = useState<File | null>(null);
  const [nextCiName, setNextCiName] = useState('');

  const [nextMonthSuccess, setNextMonthSuccess] = useState(false);
  const [nextMonthError, setNextMonthError] = useState('');

  // Selected document to view in simulated PDF viewer modal
  const [activeViewDoc, setActiveViewDoc] = useState<{
    doc: DocumentoAdjunto;
    category: 'historia_clinica' | 'politerapia_monoterapia' | 'formula_medica' | 'consentimiento_informado' | string;
  } | null>(null);

  useEffect(() => {
    if (selectedError) {
      setTransitionErrorType(selectedError.tipo_error || 'Error de dosis');
      setTransitionObservations(selectedError.observaciones || '');
      setTransitionCorrectionNotes('');
      setShowAttachForm(false);
      
      // Auto-populate file name hint for correction
      const cleanName = selectedError.nombre_paciente.toLowerCase().replace(/\s+/g, '_');
      setNewDocFileName(`correccion_${newDocCategory}_${cleanName}.pdf`);

      // Auto-populate next formulation files
      setNextHcName(`historia_clinica_siguiente_mes_${cleanName}.pdf`);
      setNextPmName(`politerapia_siguiente_mes_${cleanName}.pdf`);
      setNextFmName(`formula_medica_siguiente_mes_${cleanName}.pdf`);
      setNextCiName(`consentimiento_siguiente_mes_${cleanName}.pdf`);
      setNextFormulaNotes('');
      setShowNextMonthForm(false);
      setNextMonthSuccess(false);
      setNextMonthError('');
    }
  }, [selectedError]);

  useEffect(() => {
    if (selectedError) {
      const cleanName = selectedError.nombre_paciente.toLowerCase().replace(/\s+/g, '_');
      setNewDocFileName(`correccion_${newDocCategory}_${cleanName}.pdf`);
    }
  }, [newDocCategory, selectedError]);

  // Inbox Mode Toggle: "bandeja" (segmented by role permissions) vs "todos"
  const isInboxEligible = ['QuimicoFarmaceutico', 'Registro'].includes(currentUser.rol);
  const [inboxMode, setInboxMode] = useState<'bandeja' | 'todos'>(isInboxEligible ? 'bandeja' : 'todos');

  // Filter records based on role and options
  const getFilteredErrors = () => {
    let filtered = [...errors];

    // 1. Role-based segmentation (if in "bandeja" mode)
    if (inboxMode === 'bandeja') {
      if (currentUser.rol === 'Registro') {
        // sees only records in Con Error status for corrections, OR reports they registered
        filtered = filtered.filter(
          (e) => e.estado_actual === 'CON_ERROR_REGISTRADO' || e.usuario_registro === currentUser.nombre_usuario
        );
      } else if (currentUser.rol === 'QuimicoFarmaceutico') {
        // sees QF pending validations
        filtered = filtered.filter(
          (e) => e.estado_actual === 'ENTREGADO_QF' || e.estado_actual === 'CORREGIDA_PENDIENTE_VERIFICACION'
        );
      }
    }

    // 2. Search query (matches patient name, ID, doc or doctor)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.id_registro.toLowerCase().includes(q) ||
          e.nombre_paciente.toLowerCase().includes(q) ||
          e.apellidos_paciente.toLowerCase().includes(q) ||
          e.numero_documento.includes(q) ||
          e.medico.toLowerCase().includes(q)
      );
    }

    // 3. Select Filters
    if (filterEps) {
      filtered = filtered.filter((e) => e.eps === filterEps);
    }
    if (filterErrorType) {
      filtered = filtered.filter((e) => e.tipo_error === filterErrorType);
    }
    if (filterStatus) {
      filtered = filtered.filter((e) => e.estado_actual === filterStatus);
    }

    // Sort newest first
    return filtered.sort((a, b) => b.id_registro.localeCompare(a.id_registro));
  };

  const visibleErrors = getFilteredErrors();

  // Handle transitions
  const handleTransition = (
    record: RegistroError,
    targetStatus: ErrorStatus,
    updatedFields?: Partial<RegistroError>
  ) => {
    onUpdateErrorStatus(record.id_registro, targetStatus, updatedFields);
    
    // Maintain view synchrony
    onSelectError({
      ...record,
      estado_actual: targetStatus,
      historial_estados: [
        ...record.historial_estados,
        {
          estado: targetStatus,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0],
          usuario: currentUser.nombre_usuario,
        },
      ],
      ...(updatedFields || {}),
    });
  };

  // Document attachment handler (Correcciones / Soportes)
  const handleAddDocumentAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedError || !newDocFileName.trim()) return;

    let computedSize = '1.2 MB';
    if (newDocFile) {
      if (newDocFile.size < 1024) {
        computedSize = `${newDocFile.size} B`;
      } else if (newDocFile.size < 1024 * 1024) {
        computedSize = `${(newDocFile.size / 1024).toFixed(1)} KB`;
      } else {
        computedSize = `${(newDocFile.size / (1024 * 1024)).toFixed(1)} MB`;
      }
    }

    const newDoc: DocumentoAdjunto = {
      id_documento: `DOC-ADD-${Date.now()}`,
      nombre_archivo: newDocFileName.trim(),
      tamano: computedSize,
      fecha_carga: new Date().toISOString().split('T')[0],
      cargado_por: currentUser.nombre_usuario,
      notas: newDocNotes.trim() || 'Documento correctivo cargado.',
      es_correccion: true,
      url: newDocFile ? URL.createObjectURL(newDocFile) : undefined,
    };

    const currentArray = selectedError[newDocCategory] || [];
    const updatedArray = [...currentArray, newDoc];

    const updatedFields: Partial<RegistroError> = {
      [newDocCategory]: updatedArray,
    };

    // Update state permanently
    onUpdateErrorStatus(selectedError.id_registro, selectedError.estado_actual, updatedFields);
    
    // Sync UI selection state
    onSelectError({
      ...selectedError,
      ...updatedFields,
    });

    // Reset inputs
    setNewDocNotes('');
    setNewDocFile(null);
    setShowAttachForm(false);
  };

  // Delete Document (ADMIN ONLY)
  const handleDeleteDocument = (
    category: 'historia_clinica' | 'politerapia_monoterapia' | 'formula_medica' | 'consentimiento_informado',
    docId: string
  ) => {
    if (currentUser.rol !== 'Administrador') return;
    if (!selectedError) return;

    const currentArray = selectedError[category] || [];
    const updatedArray = currentArray.filter((d) => d.id_documento !== docId);

    const updatedFields: Partial<RegistroError> = {
      [category]: updatedArray,
    };

    onUpdateErrorStatus(selectedError.id_registro, selectedError.estado_actual, updatedFields);
    onSelectError({
      ...selectedError,
      ...updatedFields,
    });
  };

  // Batch subsequent formulation PDF loader
  const handleNextMonthFormulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedError) return;
    setNextMonthError('');
    setNextMonthSuccess(false);

    // Create attachments for each category
    const makeDoc = (fileName: string, fileObj: File | null, prefix: string): DocumentoAdjunto => {
      let computedSize = '1.5 MB';
      if (fileObj) {
        if (fileObj.size < 1024) {
          computedSize = `${fileObj.size} B`;
        } else if (fileObj.size < 1024 * 1024) {
          computedSize = `${(fileObj.size / 1024).toFixed(1)} KB`;
        } else {
          computedSize = `${(fileObj.size / (1024 * 1024)).toFixed(1)} MB`;
        }
      }
      return {
        id_documento: `DOC-NEXT-${prefix}-${Date.now()}`,
        nombre_archivo: fileName.trim(),
        tamano: computedSize,
        fecha_carga: new Date().toISOString().split('T')[0],
        cargado_por: currentUser.nombre_usuario,
        notas: `[Siguiente Formulación] ${nextFormulaNotes.trim() || 'Carga de nueva formulación para siguientes meses/ciclos'}`,
        es_correccion: false,
        url: fileObj ? URL.createObjectURL(fileObj) : undefined,
      };
    };

    const hcDoc = makeDoc(nextHcName || 'historia_clinica.pdf', nextHcFile, 'HC');
    const pmDoc = makeDoc(nextPmName || 'politerapia.pdf', nextPmFile, 'PM');
    const fmDoc = makeDoc(nextFmName || 'formula_medica.pdf', nextFmFile, 'FM');
    const ciDoc = makeDoc(nextCiName || 'consentimiento.pdf', nextCiFile, 'CI');

    const updatedHc = [...(selectedError.historia_clinica || []), hcDoc];
    const updatedPm = [...(selectedError.politerapia_monoterapia || []), pmDoc];
    const updatedFm = [...(selectedError.formula_medica || []), fmDoc];
    const updatedCi = [...(selectedError.consentimiento_informado || []), ciDoc];

    const updatedFields: Partial<RegistroError> = {
      historia_clinica: updatedHc,
      politerapia_monoterapia: updatedPm,
      formula_medica: updatedFm,
      consentimiento_informado: updatedCi,
      observaciones: (selectedError.observaciones || '') + `\n[Carga Nueva Formulación (Próximos Meses) por ${currentUser.nombre_usuario} el ${new Date().toLocaleDateString()}: ${nextFormulaNotes.trim() || 'Sin notas adicionales'}]`
    };

    // Transition back to QF verification so they can approve the new PDFs
    handleTransition(selectedError, 'ENTREGADO_QF', updatedFields);

    setNextMonthSuccess(true);
    setNextFormulaNotes('');
    setNextHcFile(null);
    setNextPmFile(null);
    setNextFmFile(null);
    setNextCiFile(null);

    setTimeout(() => {
      setNextMonthSuccess(false);
      setShowNextMonthForm(false);
    }, 2000);
  };

  // Helper catalogs for filtering
  const distinctEps = Array.from(new Set(errors.map((e) => e.eps)));
  const distinctErrorTypes = Array.from(new Set(errors.map((e) => e.tipo_error).filter(Boolean)));
  const distinctStatuses = Array.from(new Set(errors.map((e) => e.estado_actual)));

  return (
    <div className="space-y-6">
      {!selectedError ? (
        // LIST VIEW
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#F3F4F6]">Bandeja de Fórmulas y Pacientes</h3>
              <p className="text-xs text-[#9CA3AF]">
                Monitoreo, auditoría de soportes PDF y validación farmacéutica de pacientes oncológicos.
              </p>
            </div>

            {/* Inbox View Toggle */}
            {isInboxEligible && (
              <div className="inline-flex rounded-lg bg-[#0B1120] p-1 border border-[#1F2937] text-xs">
                <button
                  id="inbox-view-filter-btn"
                  onClick={() => setInboxMode('bandeja')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    inboxMode === 'bandeja'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  Mi Bandeja Acciones
                </button>
                <button
                  id="all-view-filter-btn"
                  onClick={() => setInboxMode('todos')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition ${
                    inboxMode === 'todos'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  Todos los Pacientes
                </button>
              </div>
            )}
          </div>

          {/* Filtering bar */}
          <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input
                id="search-input"
                type="text"
                placeholder="Buscar por ID, Nombres, Cédula o Médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg pl-9 pr-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] outline-none transition"
              />
            </div>

            {/* EPS */}
            <div>
              <select
                id="filter-eps-select"
                value={filterEps}
                onChange={(e) => setFilterEps(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-2.5 py-2 text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
              >
                <option value="">Todas las EPS</option>
                {distinctEps.map((eps) => (
                  <option key={eps} value={eps}>
                    {eps}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                id="filter-status-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-2.5 py-2 text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none"
              >
                <option value="">Cualquier Estado</option>
                {distinctStatuses.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_CONFIGS[st as ErrorStatus]?.nombre || st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List Content */}
          <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl overflow-hidden shadow-xl">
            {visibleErrors.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
                <p className="text-sm text-[#9CA3AF] font-medium">No se encontraron registros de pacientes</p>
                <p className="text-xs text-gray-600">No hay elementos pendientes en esta bandeja de entrada en este momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table id="errors-master-table" className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#1F2937] text-[#9CA3AF] font-semibold bg-[#1F2937]/30">
                      <th className="p-4 w-28">Código Trámite</th>
                      <th className="p-4">Nombres y Apellidos</th>
                      <th className="p-4">Identificación</th>
                      <th className="p-4">EPS</th>
                      <th className="p-4">Médico</th>
                      <th className="p-4">Hallazgo QF</th>
                      <th className="p-4">Origen</th>
                      <th className="p-4">Estado Actual</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937]/50">
                    {visibleErrors.map((err) => {
                      const statusConf = STATUS_CONFIGS[err.estado_actual] || {
                        nombre: err.estado_actual,
                        badgeBg: 'bg-gray-500/10 border-gray-500/20',
                        badgeText: 'text-gray-400',
                      };

                      return (
                        <tr
                          key={err.id_registro}
                          className="hover:bg-[#1F2937]/30 transition group cursor-pointer"
                          onClick={() => onSelectError(err)}
                        >
                          <td className="p-4 font-mono font-semibold text-[#22D3EE] group-hover:text-[#3B82F6] transition">
                            {err.id_registro}
                          </td>
                          <td className="p-4 font-medium text-[#F3F4F6]">
                            {err.nombre_paciente} {err.apellidos_paciente}
                          </td>
                          <td className="p-4 text-gray-400 font-mono">{err.numero_documento}</td>
                          <td className="p-4 text-gray-300">{err.eps}</td>
                          <td className="p-4 text-gray-300 truncate max-w-[130px]" title={err.medico}>
                            {err.medico}
                          </td>
                          <td className="p-4">
                            {err.tipo_error ? (
                              <span className="text-red-400 font-semibold">{err.tipo_error}</span>
                            ) : (
                              <span className="text-gray-500 italic">Sin errores registrados</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-[11px] text-gray-400 bg-[#0B1120] border border-[#1F2937] px-2 py-0.5 rounded-md">
                              {err.origen_formula}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusConf.badgeBg} ${statusConf.badgeText}`}
                            >
                              {statusConf.nombre}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              id={`inspect-btn-${err.id_registro}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectError(err);
                              }}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-[#1F2937] rounded-md transition inline-flex items-center gap-1 text-[11px] font-medium"
                            >
                              <span>Ver</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // PATIENT EXPEDIENT & VALIDATION TIMELINE
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              id="back-to-list-btn"
              onClick={() => onSelectError(null)}
              className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Listado de Pacientes
            </button>
            <span className="text-xs text-[#9CA3AF]">
              Expediente: <span className="text-[#22D3EE] font-bold font-mono">{selectedError.id_registro}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Patient Details, Document Management, Actions */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Patient core info */}
              <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#F3F4F6]">
                        {selectedError.nombre_paciente} {selectedError.apellidos_paciente}
                      </h3>
                      <p className="text-xs text-[#9CA3AF]">
                        Identificación: <span className="font-mono text-gray-300 font-bold">{selectedError.numero_documento}</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#22D3EE] bg-[#0B1120] border border-[#1F2937] px-3 py-1.5 rounded-lg font-bold">
                    {selectedError.id_registro}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-[#0B1120] p-3 rounded-lg border border-[#1F2937]/50">
                    <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px]">EPS</span>
                    <span className="text-[#F3F4F6] font-semibold">{selectedError.eps}</span>
                  </div>

                  <div className="space-y-1 bg-[#0B1120] p-3 rounded-lg border border-[#1F2937]/50">
                    <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px]">Médico Prescriptor</span>
                    <span className="text-[#F3F4F6] font-semibold">{selectedError.medico}</span>
                  </div>

                  <div className="space-y-1 bg-[#0B1120] p-3 rounded-lg border border-[#1F2937]/50">
                    <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px]">Origen de Fórmula</span>
                    <span className="text-[#22D3EE] font-semibold">{selectedError.origen_formula}</span>
                  </div>

                  <div className="space-y-1 bg-[#0B1120] p-3 rounded-lg border border-[#1F2937]/50">
                    <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px]">Hallazgo de Error</span>
                    {selectedError.tipo_error ? (
                      <span className="text-red-400 font-bold">{selectedError.tipo_error}</span>
                    ) : (
                      <span className="text-emerald-400 italic">Aún sin anomalías o errores reportados</span>
                    )}
                  </div>
                </div>

                {/* Patient Contact Numbers */}
                {(selectedError.numero_celular || selectedError.telefono_fijo) && (
                  <div className="border-t border-[#1F2937]/50 pt-4 mt-1 space-y-2">
                    <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px] font-semibold">
                      Información de Contacto del Paciente
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      {selectedError.numero_celular && (
                        <div className="bg-[#0B1120] p-2.5 rounded-lg border border-[#1F2937]/50">
                          <span className="text-blue-400 block uppercase tracking-wider text-[9px] font-medium">Celular Principal</span>
                          <span className="text-[#F3F4F6] font-semibold font-mono">{selectedError.numero_celular}</span>
                        </div>
                      )}
                      {selectedError.telefono_fijo && (
                        <div className="bg-[#0B1120] p-2.5 rounded-lg border border-[#1F2937]/50">
                          <span className="text-[#9CA3AF] block uppercase tracking-wider text-[9px]">Teléfono Fijo</span>
                          <span className="text-[#F3F4F6] font-semibold font-mono">{selectedError.telefono_fijo}</span>
                        </div>
                      )}
                      {selectedError.celular_contacto_adicional_1 && (
                        <div className="bg-[#0B1120] p-2.5 rounded-lg border border-[#1F2937]/50">
                          <span className="text-[#9CA3AF] block uppercase tracking-wider text-[9px]">Celular Adicional 1</span>
                          <span className="text-[#F3F4F6] font-semibold font-mono">{selectedError.celular_contacto_adicional_1}</span>
                        </div>
                      )}
                      {selectedError.celular_contacto_adicional_2 && (
                        <div className="bg-[#0B1120] p-2.5 rounded-lg border border-[#1F2937]/50">
                          <span className="text-[#9CA3AF] block uppercase tracking-wider text-[9px]">Celular Adicional 2</span>
                          <span className="text-[#F3F4F6] font-semibold font-mono">{selectedError.celular_contacto_adicional_2}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedError.observaciones && (
                  <div className="space-y-2">
                    <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px] font-semibold">
                      Observaciones de Registro o Farmacia
                    </span>
                    <div className="bg-[#0B1120] border border-[#1F2937] p-4 rounded-lg text-xs text-gray-300 leading-relaxed whitespace-pre-line italic">
                      {selectedError.observaciones}
                    </div>
                  </div>
                )}

                {/* Programador Custom Fields: Cantidad de Ciclos & Días de Administración */}
                <div className="border-t border-[#1F2937] pt-4 mt-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>Control de Tratamiento y Ciclos (Área Programación)</span>
                  </div>

                  {currentUser.rol === 'Programador' || currentUser.rol === 'Administrador' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0B1120] p-4 rounded-xl border border-cyan-500/10">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Cantidad de Ciclos Totales *</label>
                        <input
                          id="patient-cycles-input"
                          type="number"
                          min="1"
                          placeholder="Ej. 6"
                          value={selectedError.cantidad_ciclos || ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            const updatedFields = { cantidad_ciclos: val };
                            onUpdateErrorStatus(selectedError.id_registro, selectedError.estado_actual, updatedFields);
                            onSelectError({ ...selectedError, ...updatedFields });
                          }}
                          className="w-full bg-[#131B2E] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] outline-none transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Días de Administración *</label>
                        <input
                          id="patient-days-input"
                          type="text"
                          placeholder="Ej. Día 1, Día 8"
                          value={selectedError.dias_administracion || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updatedFields = { dias_administracion: val };
                            onUpdateErrorStatus(selectedError.id_registro, selectedError.estado_actual, updatedFields);
                            onSelectError({ ...selectedError, ...updatedFields });
                          }}
                          className="w-full bg-[#131B2E] border border-[#1F2937] focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] outline-none transition"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0B1120]/60 p-3 rounded-lg border border-[#1F2937]/50 text-xs">
                      <div>
                        <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px]">Cantidad de Ciclos</span>
                        <span className="text-[#F3F4F6] font-semibold">
                          {selectedError.cantidad_ciclos ? `${selectedError.cantidad_ciclos} ciclos` : <span className="text-gray-500 italic">Pendiente de definir</span>}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] block uppercase tracking-wider text-[10px]">Días de Administración</span>
                        <span className="text-[#F3F4F6] font-semibold">
                          {selectedError.dias_administracion ? selectedError.dias_administracion : <span className="text-gray-500 italic">Pendiente de definir</span>}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

               {/* PDF Document Management & Checklist (The Requested core feature) */}
              <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#F3F4F6]">Expediente Digital de Soportes Médicos (PDF)</h4>
                    <p className="text-xs text-[#9CA3AF]">
                      Visualice, verifique o adjunte las correcciones y nuevas formulaciones documentales de este paciente.
                    </p>
                  </div>

                  {/* Attachment Addition Trigger (Available to Registry and Admin) */}
                  {(currentUser.rol === 'Registro' || currentUser.rol === 'Administrador') && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        id="toggle-attach-form-btn"
                        onClick={() => {
                          setShowAttachForm(!showAttachForm);
                          setShowNextMonthForm(false);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-[11px] transition flex items-center gap-1 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adjuntar Corrección / Soporte</span>
                      </button>

                      <button
                        id="toggle-next-month-form-btn"
                        onClick={() => {
                          setShowNextMonthForm(!showNextMonthForm);
                          setShowAttachForm(false);
                        }}
                        className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-[#0B1120] font-bold rounded-lg text-[11px] transition flex items-center gap-1.5 shadow-md"
                        title="Permite cargar de una vez los 4 PDF del siguiente mes/ciclos en este mismo expediente de paciente"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Cargar Nueva Formulación (Próximos Meses)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Subsequent Formulation Batch Upload Form (The Requested feature) */}
                {showNextMonthForm && (
                  <form onSubmit={handleNextMonthFormulation} className="bg-[#0B1120] border border-[#1F2937] p-5 rounded-lg space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                      <div>
                        <span className="text-xs font-bold text-cyan-400 block">Carga Masiva de Nueva Formulación (Próximos Meses o Ciclos)</span>
                        <span className="text-[10px] text-gray-400">Re-envíe el trámite a revisión del Q.F. adjuntando los nuevos documentos del paciente en un solo paso.</span>
                      </div>
                      <button type="button" onClick={() => setShowNextMonthForm(false)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {nextMonthSuccess && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs font-semibold animate-pulse">
                        ✓ ¡Nueva formulación cargada con éxito! El estado ha cambiado a Pendiente Validación (ENTREGADO_QF).
                      </div>
                    )}

                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* HC */}
                        <div className="bg-[#131B2E]/60 p-3 rounded border border-[#1F2937] space-y-1">
                          <label className="block text-gray-400 font-semibold uppercase text-[9px] tracking-wider">1. Nueva Historia Clínica *</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNextHcFile(file);
                                setNextHcName(file.name);
                              }
                            }}
                            className="text-[10px] text-gray-300 w-full"
                          />
                          <input
                            type="text"
                            value={nextHcName}
                            onChange={(e) => setNextHcName(e.target.value)}
                            className="bg-[#0B1120] border border-[#1F2937] p-1 rounded text-[10px] text-white w-full font-mono mt-1"
                            placeholder="Nombre del archivo"
                          />
                        </div>

                        {/* Politerapia */}
                        <div className="bg-[#131B2E]/60 p-3 rounded border border-[#1F2937] space-y-1">
                          <label className="block text-gray-400 font-semibold uppercase text-[9px] tracking-wider">2. Nueva Politerapia / Monoterapia *</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNextPmFile(file);
                                setNextPmName(file.name);
                              }
                            }}
                            className="text-[10px] text-gray-300 w-full"
                          />
                          <input
                            type="text"
                            value={nextPmName}
                            onChange={(e) => setNextPmName(e.target.value)}
                            className="bg-[#0B1120] border border-[#1F2937] p-1 rounded text-[10px] text-white w-full font-mono mt-1"
                            placeholder="Nombre del archivo"
                          />
                        </div>

                        {/* Formula Medica */}
                        <div className="bg-[#131B2E]/60 p-3 rounded border border-[#1F2937] space-y-1">
                          <label className="block text-gray-400 font-semibold uppercase text-[9px] tracking-wider">3. Nueva Fórmula Médica *</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNextFmFile(file);
                                setNextFmName(file.name);
                              }
                            }}
                            className="text-[10px] text-gray-300 w-full"
                          />
                          <input
                            type="text"
                            value={nextFmName}
                            onChange={(e) => setNextFmName(e.target.value)}
                            className="bg-[#0B1120] border border-[#1F2937] p-1 rounded text-[10px] text-white w-full font-mono mt-1"
                            placeholder="Nombre del archivo"
                          />
                        </div>

                        {/* Consentimiento */}
                        <div className="bg-[#131B2E]/60 p-3 rounded border border-[#1F2937] space-y-1">
                          <label className="block text-gray-400 font-semibold uppercase text-[9px] tracking-wider">4. Nuevo Consentimiento Informado *</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNextCiFile(file);
                                setNextCiName(file.name);
                              }
                            }}
                            className="text-[10px] text-gray-300 w-full"
                          />
                          <input
                            type="text"
                            value={nextCiName}
                            onChange={(e) => setNextCiName(e.target.value)}
                            className="bg-[#0B1120] border border-[#1F2937] p-1 rounded text-[10px] text-white w-full font-mono mt-1"
                            placeholder="Nombre del archivo"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-gray-400 font-semibold">Notas, Mes de Aplicación o Ciclos a Validar:</label>
                        <textarea
                          rows={2}
                          value={nextFormulaNotes}
                          onChange={(e) => setNextFormulaNotes(e.target.value)}
                          placeholder="Ej: Carga de soportes para Segundo Mes de tratamiento (Ciclos 3 y 4)..."
                          className="w-full bg-[#131B2E] border border-[#1F2937] p-2 rounded text-xs text-white"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowNextMonthForm(false)}
                          className="px-3 py-1.5 bg-transparent text-gray-400 hover:text-white transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-[#0B1120] font-bold rounded flex items-center gap-1.5 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Cargar Formulación y Re-enviar a QF
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Real File Attachment Form */}
                {showAttachForm && (
                  <form onSubmit={handleAddDocumentAttachment} className="bg-[#0B1120] border border-[#1F2937] p-4 rounded-lg space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#1F2937] pb-2">
                      <span className="text-xs font-bold text-blue-400">Adjuntar Corrección o Nuevo Soporte</span>
                      <button type="button" onClick={() => setShowAttachForm(false)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5 col-span-1 md:col-span-2">
                        <label className="block text-gray-400">Seleccionar o Arrastrar Archivo de Corrección (PDF) *</label>
                        <label 
                          className={`block border border-dashed rounded-lg p-4 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                            dragActiveAdd ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                          }`}
                          onDragOver={(e) => { e.preventDefault(); setDragActiveAdd(true); }}
                          onDragLeave={() => setDragActiveAdd(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragActiveAdd(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type === 'application/pdf') {
                              setNewDocFile(file);
                              setNewDocFileName(file.name);
                            }
                          }}
                        >
                          <input
                            id="new-doc-file-input"
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewDocFile(file);
                                setNewDocFileName(file.name);
                              }
                            }}
                          />
                          <UploadCloud className={`w-8 h-8 mx-auto mb-1 ${dragActiveAdd ? 'text-blue-400' : 'text-gray-500'}`} />
                          <span className="text-[12px] text-[#F3F4F6] block font-semibold truncate">
                            {newDocFileName || 'Arrastre un archivo PDF aquí'}
                          </span>
                          <span className="text-[10px] text-[#9CA3AF]">
                            {newDocFile ? `${(newDocFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic para examinar archivos locales'}
                          </span>
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-gray-400">Tipo de Documento a Cargar:</label>
                        <select
                          id="new-doc-category-select"
                          value={newDocCategory}
                          onChange={(e) => setNewDocCategory(e.target.value as any)}
                          className="w-full bg-[#131B2E] border border-[#1F2937] p-2 rounded text-xs text-white"
                        >
                          <option value="historia_clinica">Historia Clínica (PDF)</option>
                          <option value="politerapia_monoterapia">Politerapia o Monoterapia (PDF)</option>
                          <option value="formula_medica">Fórmula Médica (PDF)</option>
                          <option value="consentimiento_informado">Consentimiento Informado (PDF)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-gray-400">Nombre del Archivo PDF:</label>
                        <input
                          id="new-doc-name-input"
                          type="text"
                          value={newDocFileName}
                          onChange={(e) => setNewDocFileName(e.target.value)}
                          placeholder="Ej. correccion_clinica.pdf"
                          className="w-full bg-[#131B2E] border border-[#1F2937] p-2 rounded text-xs text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="block text-gray-400">Notas específicas de la Corrección o Justificación:</label>
                      <textarea
                        id="new-doc-notes-textarea"
                        rows={2}
                        value={newDocNotes}
                        onChange={(e) => setNewDocNotes(e.target.value)}
                        placeholder="Escriba aquí los detalles corregidos o comentarios de esta nueva versión del documento..."
                        className="w-full bg-[#131B2E] border border-[#1F2937] p-2 rounded text-xs text-white"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowAttachForm(false)}
                        className="px-3 py-1.5 bg-transparent text-gray-400 hover:text-white transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Cargar Documento Correctivo
                      </button>
                    </div>
                  </form>
                )}

                {/* Documents grid per required categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Category 1: Historia Clinica */}
                  <div className="bg-[#0B1120] border border-[#1F2937] rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>1. Historia Clínica</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase">PDF Exigido</span>
                      </div>

                      <div className="space-y-2.5">
                        {(!selectedError.historia_clinica || selectedError.historia_clinica.length === 0) ? (
                          <p className="text-[11px] text-red-400 italic">No se han cargado documentos en este apartado.</p>
                        ) : (
                          selectedError.historia_clinica.map((doc) => (
                            <div key={doc.id_documento} className="p-2.5 bg-[#131B2E]/50 border border-[#1F2937]/80 rounded-lg text-xs space-y-1.5">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                                  <span className="font-mono text-gray-200 truncate block text-[11px]" title={doc.nombre_archivo}>
                                    {doc.nombre_archivo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {doc.es_correccion && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded">
                                      Corrección
                                    </span>
                                  )}
                                  
                                  {/* Delete file (Admin Only) */}
                                  {currentUser.rol === 'Administrador' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument('historia_clinica', doc.id_documento)}
                                      className="p-1 text-[#EF4444] hover:bg-red-500/15 rounded transition"
                                      title="Eliminar documento del expediente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <Lock className="w-3 h-3 text-gray-600" title="Solo el Administrador puede retirar archivos" />
                                  )}
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-400 italic leading-relaxed bg-[#0B1120] p-1.5 rounded border border-[#1F2937]/30">
                                <strong>Notas:</strong> {doc.notas || 'Sin notas.'}
                              </p>

                              <div className="flex items-center justify-between gap-2 border-t border-[#1F2937]/40 pt-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveViewDoc({ doc, category: 'historia_clinica' })}
                                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 flex items-center gap-1.5 text-[10px] font-bold bg-[#0B1120] px-2 py-1 rounded border border-cyan-500/20 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Abrir Documento</span>
                                </button>
                                <div className="text-[9px] text-gray-500 font-mono text-right flex flex-col">
                                  <span>Por: {doc.cargado_por}</span>
                                  <span>{doc.fecha_carga} ({doc.tamano})</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Politerapia o Monoterapia */}
                  <div className="bg-[#0B1120] border border-[#1F2937] rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>2. Politerapia o Monoterapia</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase">PDF Exigido</span>
                      </div>

                      <div className="space-y-2.5">
                        {(!selectedError.politerapia_monoterapia || selectedError.politerapia_monoterapia.length === 0) ? (
                          <p className="text-[11px] text-red-400 italic">No se han cargado documentos en este apartado.</p>
                        ) : (
                          selectedError.politerapia_monoterapia.map((doc) => (
                            <div key={doc.id_documento} className="p-2.5 bg-[#131B2E]/50 border border-[#1F2937]/80 rounded-lg text-xs space-y-1.5">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                                  <span className="font-mono text-gray-200 truncate block text-[11px]" title={doc.nombre_archivo}>
                                    {doc.nombre_archivo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {doc.es_correccion && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded">
                                      Corrección
                                    </span>
                                  )}
                                  
                                  {currentUser.rol === 'Administrador' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument('politerapia_monoterapia', doc.id_documento)}
                                      className="p-1 text-[#EF4444] hover:bg-red-500/15 rounded transition"
                                      title="Eliminar documento del expediente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <Lock className="w-3 h-3 text-gray-600" title="Solo el Administrador puede retirar archivos" />
                                  )}
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-400 italic leading-relaxed bg-[#0B1120] p-1.5 rounded border border-[#1F2937]/30">
                                <strong>Notas:</strong> {doc.notas || 'Sin notas.'}
                              </p>

                              <div className="flex items-center justify-between gap-2 border-t border-[#1F2937]/40 pt-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveViewDoc({ doc, category: 'politerapia_monoterapia' })}
                                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 flex items-center gap-1.5 text-[10px] font-bold bg-[#0B1120] px-2 py-1 rounded border border-cyan-500/20 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Abrir Documento</span>
                                </button>
                                <div className="text-[9px] text-gray-500 font-mono text-right flex flex-col">
                                  <span>Por: {doc.cargado_por}</span>
                                  <span>{doc.fecha_carga} ({doc.tamano})</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Formula Medica */}
                  <div className="bg-[#0B1120] border border-[#1F2937] rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>3. Fórmula Médica</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase">PDF Exigido</span>
                      </div>

                      <div className="space-y-2.5">
                        {(!selectedError.formula_medica || selectedError.formula_medica.length === 0) ? (
                          <p className="text-[11px] text-red-400 italic">No se han cargado documentos en este apartado.</p>
                        ) : (
                          selectedError.formula_medica.map((doc) => (
                            <div key={doc.id_documento} className="p-2.5 bg-[#131B2E]/50 border border-[#1F2937]/80 rounded-lg text-xs space-y-1.5">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                                  <span className="font-mono text-gray-200 truncate block text-[11px]" title={doc.nombre_archivo}>
                                    {doc.nombre_archivo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {doc.es_correccion && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded">
                                      Corrección
                                    </span>
                                  )}
                                  
                                  {currentUser.rol === 'Administrador' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument('formula_medica', doc.id_documento)}
                                      className="p-1 text-[#EF4444] hover:bg-red-500/15 rounded transition"
                                      title="Eliminar documento del expediente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <Lock className="w-3 h-3 text-gray-600" title="Solo el Administrador puede retirar archivos" />
                                  )}
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-400 italic leading-relaxed bg-[#0B1120] p-1.5 rounded border border-[#1F2937]/30">
                                <strong>Notas:</strong> {doc.notas || 'Sin notas.'}
                              </p>

                              <div className="flex items-center justify-between gap-2 border-t border-[#1F2937]/40 pt-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveViewDoc({ doc, category: 'formula_medica' })}
                                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 flex items-center gap-1.5 text-[10px] font-bold bg-[#0B1120] px-2 py-1 rounded border border-cyan-500/20 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Abrir Documento</span>
                                </button>
                                <div className="text-[9px] text-gray-500 font-mono text-right flex flex-col">
                                  <span>Por: {doc.cargado_por}</span>
                                  <span>{doc.fecha_carga} ({doc.tamano})</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category 4: Consentimiento Informado */}
                  <div className="bg-[#0B1120] border border-[#1F2937] rounded-xl p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>4. Consentimiento Informado</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase">PDF Exigido</span>
                      </div>

                      <div className="space-y-2.5">
                        {(!selectedError.consentimiento_informado || selectedError.consentimiento_informado.length === 0) ? (
                          <p className="text-[11px] text-red-400 italic">No se han cargado documentos en este apartado.</p>
                        ) : (
                          selectedError.consentimiento_informado.map((doc) => (
                            <div key={doc.id_documento} className="p-2.5 bg-[#131B2E]/50 border border-[#1F2937]/80 rounded-lg text-xs space-y-1.5">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                                  <span className="font-mono text-gray-200 truncate block text-[11px]" title={doc.nombre_archivo}>
                                    {doc.nombre_archivo}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {doc.es_correccion && (
                                    <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded">
                                      Corrección
                                    </span>
                                  )}
                                  
                                  {currentUser.rol === 'Administrador' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDocument('consentimiento_informado', doc.id_documento)}
                                      className="p-1 text-[#EF4444] hover:bg-red-500/15 rounded transition"
                                      title="Eliminar documento del expediente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <Lock className="w-3 h-3 text-gray-600" title="Solo el Administrador puede retirar archivos" />
                                  )}
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-400 italic leading-relaxed bg-[#0B1120] p-1.5 rounded border border-[#1F2937]/30">
                                <strong>Notas:</strong> {doc.notas || 'Sin notas.'}
                              </p>

                              <div className="flex items-center justify-between gap-2 border-t border-[#1F2937]/40 pt-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveViewDoc({ doc, category: 'consentimiento_informado' })}
                                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/20 flex items-center gap-1.5 text-[10px] font-bold bg-[#0B1120] px-2 py-1 rounded border border-cyan-500/20 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Abrir Documento</span>
                                </button>
                                <div className="text-[9px] text-gray-500 font-mono text-right flex flex-col">
                                  <span>Por: {doc.cargado_por}</span>
                                  <span>{doc.fecha_carga} ({doc.tamano})</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Board (Role Specific Actions) */}
              <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-[#F3F4F6]">Acciones de Trazabilidad y Validación</h4>
                <p className="text-xs text-[#9CA3AF]">
                  Controles de flujo interactivos para la validación y corrección de expedientes oncológicos.
                </p>

                {/* Status indicator */}
                <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Estado de Validación:</span>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${STATUS_CONFIGS[selectedError.estado_actual]?.badgeBg} ${STATUS_CONFIGS[selectedError.estado_actual]?.badgeText}`}>
                    {STATUS_CONFIGS[selectedError.estado_actual]?.nombre || selectedError.estado_actual}
                  </span>
                </div>

                {/* WORKFLOW PHASE A: Quimico Farmaceutico reviews (Visible in any non-finalized status to avoid getting stuck when corrections are uploaded) */}
                {selectedError.estado_actual !== 'ENTREGADO_PROGRAMACION' && (
                  <div className="space-y-4">
                    {currentUser.rol === 'QuimicoFarmaceutico' || currentUser.rol === 'Administrador' ? (
                      <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-4 space-y-4">
                        <div className="border-b border-[#1F2937] pb-2">
                          <span className="text-xs font-bold text-blue-400 block">Evaluación del Químico Farmacéutico (QF)</span>
                          <span className="text-[11px] text-[#9CA3AF]">Examine los 4 soportes en PDF y apruebe para dispensación o devuelva con los hallazgos.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Option A: Approve */}
                          <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
                            <div>
                              <span className="text-xs font-bold text-emerald-400 block mb-1">Opción A: Aprobar Fórmula</span>
                              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                                Si toda la información de identificación, EPS y los 4 soportes PDF con notas están correctos, apruebe el registro para dar por terminado el flujo y avanzar a programación.
                              </p>
                            </div>
                            <button
                              id="btn-approve-to-programming"
                              onClick={() => handleTransition(selectedError, 'ENTREGADO_PROGRAMACION', { observaciones: (selectedError.observaciones || '') + `\n[Aprobado por ${currentUser.nombre_usuario} el ${new Date().toLocaleDateString()}]` })}
                              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Aprobar y Finalizar Trámite
                            </button>
                          </div>

                          {/* Option B: Register error */}
                          <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 space-y-3">
                            <div>
                              <span className="text-xs font-bold text-red-400 block mb-1">Opción B: Reportar Hallazgo / Error</span>
                              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                                Devuelva la fórmula al Personal de Registro detallando qué soportes o campos contienen errores para su corrección.
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-gray-300 block font-medium">Clasificación de Hallazgo:</label>
                              <select
                                id="transition-error-type-select"
                                value={transitionErrorType}
                                onChange={(e) => setTransitionErrorType(e.target.value)}
                                className="w-full bg-[#131B2E] border border-[#1F2937] text-white p-2 rounded text-xs outline-none"
                              >
                                {TIPOS_DE_ERROR_CATALOG.map((errType) => (
                                  <option key={errType} value={errType}>{errType}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-gray-300 block font-medium">Observaciones de Devolución:</label>
                              <textarea
                                id="transition-observations-textarea"
                                rows={2}
                                value={transitionObservations}
                                onChange={(e) => setTransitionObservations(e.target.value)}
                                className="w-full bg-[#131B2E] border border-[#1F2937] text-white p-2 rounded text-xs outline-none"
                                placeholder="Indique detalladamente cuál documento contiene errores..."
                              />
                            </div>

                            <button
                              id="btn-devolve-to-external"
                              onClick={() => handleTransition(selectedError, 'CON_ERROR_REGISTRADO', { tipo_error: transitionErrorType, observaciones: transitionObservations })}
                              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md"
                            >
                              <Send className="w-4 h-4" />
                              Registrar Hallazgo y Devolver para Corrección
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Show role required block only if status is NOT CON_ERROR_REGISTRADO (since in CON_ERROR_REGISTRADO they see the Registry block or its error block) */
                      selectedError.estado_actual !== 'CON_ERROR_REGISTRADO' && (
                        <div className="text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-1">Rol Requerido: Químico Farmacéutico (QF)</span>
                            <span>Como usuario con rol <strong>{currentUser.rol}</strong>, no tiene permisos de validación de fórmulas. Cambie su rol temporal a <strong>Químico Farmacéutico</strong> o <strong>Administrador</strong> en el panel superior para validar este trámite.</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* WORKFLOW PHASE B: Registry Corrects (CON_ERROR_REGISTRADO) */}
                {selectedError.estado_actual === 'CON_ERROR_REGISTRADO' && (
                  <div className="space-y-4">
                    {currentUser.rol === 'Registro' || currentUser.rol === 'Administrador' ? (
                      <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-4 space-y-3">
                        <div className="border-b border-[#1F2937] pb-2">
                          <span className="text-xs font-bold text-amber-400 block">Corrección por Personal de Registro</span>
                          <span className="text-[11px] text-[#9CA3AF]">
                            Revise la observación de la glosa, cargue las correcciones de los archivos con error en el panel de <strong>Expediente Digital</strong>, y retorne a farmacia para su aprobación.
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] text-gray-300 block font-medium">Notas de la Corrección Aplicada:</label>
                          <textarea
                            id="transition-correction-textarea"
                            rows={2}
                            value={transitionCorrectionNotes}
                            onChange={(e) => setTransitionCorrectionNotes(e.target.value)}
                            className="w-full bg-[#131B2E] border border-[#1F2937] text-white p-2 rounded text-xs outline-none focus:border-blue-500"
                            placeholder="Ej. 'Se re-adjunta la fórmula médica corregida con la dosificación recomendada y se carga el soporte de la historia clínica actualizado...'"
                          />
                        </div>

                        <button
                          id="btn-transition-corregida"
                          onClick={() => {
                            if (!transitionCorrectionNotes.trim()) {
                              alert('Por favor ingrese una nota detallando qué corrección realizó antes de reenviar el trámite.');
                              return;
                            }
                            const updatedObs = (selectedError.observaciones || '') + `\n\n[Corrección por Registro (${currentUser.nombre_usuario})]: ${transitionCorrectionNotes}`;
                            handleTransition(selectedError, 'CORREGIDA_PENDIENTE_VERIFICACION', { observaciones: updatedObs });
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Enviar Soportes Corregidos a Verificación QF
                        </button>
                      </div>
                    ) : (
                      /* Only show if the user is NOT a QuimicoFarmaceutico (who is already viewing the QF actions directly above) */
                      currentUser.rol !== 'QuimicoFarmaceutico' && (
                        <div className="text-[11px] text-amber-400 bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-1">Rol Requerido: Personal de Registro</span>
                            <span>Como usuario con rol <strong>{currentUser.rol}</strong>, no puede registrar correcciones. Cambie su sesión de pruebas al rol <strong>Registro</strong> o <strong>Administrador</strong> en la parte superior para cargar archivos y reenviar.</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* WORKFLOW PHASE C: Finalized (ENTREGADO_PROGRAMACION) */}
                {selectedError.estado_actual === 'ENTREGADO_PROGRAMACION' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg flex items-start gap-2.5 text-emerald-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block mb-1">Validación de Fórmula Aprobada con Éxito</span>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Este registro ha culminado favorablemente el ciclo de farmacovigilancia de oncología. Los 4 soportes PDF reglamentarios fueron validados por el Químico Farmacéutico y el expediente se encuentra archivado y disponible para consulta o auditorías.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Timeline of States & Audits */}
            <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#F3F4F6]">Historial y Línea de Tiempo</h4>
                <p className="text-xs text-[#9CA3AF]">
                  Historial cronológico auditado de cambios de estado del trámite.
                </p>

                {/* Timeline display */}
                <div className="relative border-l-2 border-[#1F2937] pl-5 ml-2.5 space-y-6 py-2">
                  {selectedError.historial_estados.map((hist, idx) => {
                    const conf = STATUS_CONFIGS[hist.estado] || {
                      nombre: hist.estado,
                      color: 'gray',
                    };

                    return (
                      <div key={idx} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#131B2E] bg-blue-500" />

                        <div className="text-xs space-y-0.5">
                          <span className="block font-bold text-[#F3F4F6] text-[11px] leading-tight">
                            {conf.nombre}
                          </span>
                          <span className="block text-[10px] text-gray-500 font-mono">
                            {hist.fecha} a las {hist.hora}
                          </span>
                          <span className="block text-[10px] text-[#22D3EE]">
                            Por: <span className="font-sans font-medium text-gray-400">{hist.usuario}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PDF Document Summary Stats & Reminders */}
              <div className="border-t border-[#1F2937] pt-4 mt-6 space-y-3">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Auditoría del Expediente
                </span>
                
                <div className="bg-[#0B1120] rounded-lg p-3 border border-[#1F2937] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Historia Clínica:</span>
                    <span className="text-white font-mono font-bold text-[11px]">
                      {selectedError.historia_clinica?.length || 0} cargado(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Politerapia/Monoterapia:</span>
                    <span className="text-white font-mono font-bold text-[11px]">
                      {selectedError.politerapia_monoterapia?.length || 0} cargado(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fórmula Médica:</span>
                    <span className="text-white font-mono font-bold text-[11px]">
                      {selectedError.formula_medica?.length || 0} cargado(s)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Consentimiento Informado:</span>
                    <span className="text-white font-mono font-bold text-[11px]">
                      {selectedError.consentimiento_informado?.length || 0} cargado(s)
                    </span>
                  </div>
                </div>

                <div className="bg-[#1F2937]/20 rounded-lg p-2.5 border border-[#1F2937]/50 text-[10px] text-[#9CA3AF] flex items-start gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Seguridad de Datos:</strong> Los soportes cargados no pueden ser borrados ni modificados por ningún usuario exceptuando al <strong>Administrador</strong>.
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ----------------- INTERACTIVE SIMULATED PDF DOCUMENT VIEWER MODAL ----------------- */}
      {activeViewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="relative bg-[#0F172A] border border-[#1E293B] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-8 overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#1E293B] px-6 py-4 flex items-center justify-between border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                    {activeViewDoc.category === 'historia_clinica' && 'Soporte 1: Historia Clínica'}
                    {activeViewDoc.category === 'politerapia_monoterapia' && 'Soporte 2: Politerapia / Monoterapia'}
                    {activeViewDoc.category === 'formula_medica' && 'Soporte 3: Fórmula Médica'}
                    {activeViewDoc.category === 'consentimiento_informado' && 'Soporte 4: Consentimiento Informado'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Archivo: {activeViewDoc.doc.nombre_archivo} ({activeViewDoc.doc.tamano})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeViewDoc.doc.url && (
                  <button
                    onClick={() => window.open(activeViewDoc.doc.url, '_blank')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Ver archivo original en nueva pestaña"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir PDF Real</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-[#334155] hover:bg-[#475569] text-gray-300 hover:text-white rounded-lg transition cursor-pointer"
                  title="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveViewDoc(null)}
                  className="p-2 bg-[#334155] hover:bg-red-500 hover:text-white text-gray-300 rounded-lg transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content / Preview Canvas */}
            <div className="p-6 overflow-y-auto bg-slate-900 flex-1 flex flex-col items-center">
              {/* Optional Real PDF iFrame */}
              {activeViewDoc.doc.url ? (
                <div className="w-full flex flex-col gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Este soporte contiene un archivo PDF real cargado por el usuario. Puede abrirlo a continuación o en pantalla completa.</span>
                  </div>
                  <iframe
                    src={activeViewDoc.doc.url}
                    className="w-full h-[600px] border border-[#1E293B] rounded-xl bg-white"
                    title="Visor PDF Real"
                  />
                </div>
              ) : (
                /* Simulated Clinical PDF Paper */
                <div className="w-full max-w-2xl bg-white text-slate-800 shadow-xl rounded-xl p-8 font-sans border-2 border-slate-300 flex flex-col gap-6 relative select-none">
                  {/* Decorative Medical Watermark & stamps */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                    <FileText className="w-96 h-96 text-slate-950" />
                  </div>
                  
                  {/* Clinical Letterhead Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-full bg-[#1E293B] flex items-center justify-center text-white font-serif font-black text-xl">
                        On
                      </div>
                      <div>
                        <h1 className="text-base font-extrabold text-slate-900 leading-none">CENTRO ONCOLÓGICO DE OCCIDENTE</h1>
                        <p className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider">REG. SALUD N° ON-98455-COL</p>
                        <p className="text-[10px] text-slate-400">Unidad de Oncología Médica y Farmacovigilancia</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-block bg-red-100 border border-red-300 text-red-700 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight uppercase">
                        SOPORTE AUDITABLE
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">ID: {activeViewDoc.doc.id_documento}</p>
                      <p className="text-[9px] text-slate-400 font-mono">FECHA CARGA: {activeViewDoc.doc.fecha_carga}</p>
                    </div>
                  </div>

                  {/* Patient Record Information */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2.5 text-xs text-slate-700">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Paciente:</span>
                      <span className="font-bold text-slate-900 text-[13px]">{selectedError.nombre_paciente} {selectedError.apellidos_paciente}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Identificación:</span>
                      <span className="font-bold font-mono text-slate-800">{selectedError.numero_documento}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Entidad EPS:</span>
                      <span className="font-extrabold text-slate-800">{selectedError.eps}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Médico Tratante:</span>
                      <span className="font-bold text-slate-800">{selectedError.medico}</span>
                    </div>
                  </div>

                  {/* Simulated Category Specific PDF body */}
                  <div className="flex-1 space-y-4">
                    
                    {/* Category 1: Historia Clinica */}
                    {activeViewDoc.category === 'historia_clinica' && (
                      <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                        <div className="border-l-4 border-[#1E293B] pl-3 py-0.5 bg-slate-50">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">ANAMNESIS Y RESUMEN HISTORIA CLÍNICA ONCOLÓGICA</h4>
                        </div>
                        <p>
                          Paciente de 45 años diagnosticado con <strong>Neoplasia Maligna de la Mama (C50.9)</strong> en estadio clínico IIB, hormono-dependiente con receptores de estrógenos positivos. Ingresa remitido por consulta externa para el inicio de ciclo terapéutico adyuvante con esquema de quimio-radioterapia combinada.
                        </p>
                        
                        <div className="space-y-2 pt-2">
                          <h5 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1">PARÁMETROS BIOMÉTRICOS Y VALORACIÓN FÍSICA:</h5>
                          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                            <span><strong>Peso:</strong> 68.5 kg</span>
                            <span><strong>Talla:</strong> 1.65 m</span>
                            <span><strong>Superficie Corporal (SC):</strong> 1.76 m²</span>
                            <span><strong>Presión Art:</strong> 120/80 mmHg</span>
                            <span><strong>Frecuencia Card:</strong> 72 lpm</span>
                            <span><strong>Estado General (ECOG):</strong> 0</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h5 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1">ANÁLISIS DE LABORATORIO Y TOXICIDAD:</h5>
                          <p className="text-[11px]">
                            Hemograma de control reporta recuento absoluto de neutrófilos (RAN) en 2,300/mm³, plaquetas en 240,000/mm³ y depuración de creatinina sérica en rangos óptimos. Pruebas de función hepática normales. No se evidencian contraindicaciones de toxicidad hematológica u orgánica para el inicio de quimioterapia.
                          </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-900 space-y-1">
                          <span className="font-bold block text-amber-950">NOTAS DE AUDITORÍA (HISTORIA CLÍNICA):</span>
                          <p className="italic">"{activeViewDoc.doc.notas || 'Archivo cargado en regla.'}"</p>
                        </div>
                      </div>
                    )}

                    {/* Category 2: Politerapia o Monoterapia */}
                    {activeViewDoc.category === 'politerapia_monoterapia' && (
                      <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                        <div className="border-l-4 border-emerald-600 pl-3 py-0.5 bg-emerald-50/50">
                          <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">ESQUEMA DE POLITERAPIA Y PROTOCOLO DE APLICACIÓN</h4>
                        </div>
                        <p>
                          A continuación se describe el esquema terapéutico prescrito, basado en protocolos oncológicos vigentes e indicados por guías de práctica clínica:
                        </p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border border-slate-200">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <th className="p-2 border-r border-slate-200">Medicamentos Esquema AC-T</th>
                                <th className="p-2 border-r border-slate-200">Dosis Estándar</th>
                                <th className="p-2 border-r border-slate-200">Frecuencia</th>
                                <th className="p-2">Dosis Calculada</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="p-2 border-r border-slate-100 font-bold">Doxorubicina</td>
                                <td className="p-2 border-r border-slate-100 font-mono">60 mg/m² IV</td>
                                <td className="p-2 border-r border-slate-100">Cada 21 días</td>
                                <td className="p-2 font-mono font-bold text-red-600">105.6 mg</td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="p-2 border-r border-slate-100 font-bold">Ciclofosfamida</td>
                                <td className="p-2 border-r border-slate-100 font-mono">600 mg/m² IV</td>
                                <td className="p-2 border-r border-slate-100">Cada 21 días</td>
                                <td className="p-2 font-mono font-bold text-red-600">1056.0 mg</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-r border-slate-100 font-bold">Paclitaxel</td>
                                <td className="p-2 border-r border-slate-100 font-mono">175 mg/m² IV</td>
                                <td className="p-2 border-r border-slate-100">Cada 14 días</td>
                                <td className="p-2 font-mono font-bold">308.0 mg</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <h5 className="font-extrabold text-slate-900">PREMEDICACIÓN Y SOPORTE REQUERIDO:</h5>
                          <ul className="list-disc pl-4 space-y-1 text-[11px]">
                            <li><strong>Dexametasona:</strong> 20 mg IV pre-quimioterapia para profilaxis de emesis y reacciones alérgicas.</li>
                            <li><strong>Ondansetrón:</strong> 8 mg IV directo para prevención de náuseas.</li>
                            <li><strong>Ranitidina:</strong> 50 mg IV para soporte gastroprotector.</li>
                            <li><strong>Filgrastim:</strong> 300 mcg SC diario por 5 días, iniciando 24 horas post-quimioterapia.</li>
                          </ul>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-900 space-y-1">
                          <span className="font-bold block text-amber-950">NOTAS DE AUDITORÍA (POLITERAPIA):</span>
                          <p className="italic">"{activeViewDoc.doc.notas || 'Esquema aprobado.'}"</p>
                        </div>
                      </div>
                    )}

                    {/* Category 3: Formula Medica */}
                    {activeViewDoc.category === 'formula_medica' && (
                      <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                        <div className="border-l-4 border-blue-600 pl-3 py-0.5 bg-blue-50">
                          <h4 className="text-xs font-black text-blue-950 uppercase tracking-wide">ORDEN / FÓRMULA MÉDICA DE CONTROL ESPECIAL</h4>
                        </div>
                        <p>
                          Médico Tratante certifica la formulación médica oncológica bajo las estrictas directrices de farmacología y dosis del expediente del paciente:
                        </p>

                        <div className="border border-dashed border-slate-400 bg-slate-50 p-4 rounded-xl font-mono text-[11px] space-y-3">
                          <div className="flex justify-between border-b border-slate-200 pb-1 font-bold text-slate-900">
                            <span>DESCRIPCIÓN DE MEDICAMENTOS</span>
                            <span>CANTIDAD</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-slate-900">1. DOXORUBICINA CLORHIDRATO SOLUCIÓN INYECTABLE 50 mg</span>
                                <p className="text-[10px] text-slate-500">Mezclar dosis de 105.6 mg en Dextrosa 5% 250 ml. Infundir en 45 minutos vía intravenosa central.</p>
                              </div>
                              <span className="font-bold">3 AMPOLLAS</span>
                            </div>

                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-slate-900">2. CICLOFOSFAMIDA INYECTABLE 1 g</span>
                                <p className="text-[10px] text-slate-500">Mezclar dosis de 1056.0 mg en Solución Salina 0.9% 500 ml. Infundir en 1 hora vía intravenosa central.</p>
                              </div>
                              <span className="font-bold">2 VIALES</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px] pt-4 font-mono border-t border-slate-200">
                          <div>
                            <span className="block text-slate-400 font-bold">N° DE REGISTRO MÉDICO:</span>
                            <span className="text-slate-900 font-bold">REG-MED-845112-ONCO</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-slate-400 font-bold">CÓDIGO DE BARRAS / CONTROL:</span>
                            <span className="text-slate-950 font-bold">*F-M-2026-{selectedError.numero_documento.slice(-4)}*</span>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-900 space-y-1">
                          <span className="font-bold block text-amber-950">NOTAS DE AUDITORÍA (FÓRMULA MÉDICA):</span>
                          <p className="italic">"{activeViewDoc.doc.notas || 'Fórmula revisada en orden.'}"</p>
                        </div>
                      </div>
                    )}

                    {/* Category 4: Consentimiento Informado */}
                    {activeViewDoc.category === 'consentimiento_informado' && (
                      <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                        <div className="border-l-4 border-slate-800 pl-3 py-0.5 bg-slate-100">
                          <h4 className="text-xs font-black text-slate-950 uppercase tracking-wide">CONSENTIMIENTO INFORMADO Y DECLARACIÓN DE VOLUNTAD</h4>
                        </div>
                        
                        <p className="text-[11px]">
                          Yo, <strong>{selectedError.nombre_paciente} {selectedError.apellidos_paciente}</strong>, mayor de edad, identificado con la cédula descrita en el encabezado, actuando de forma voluntaria y habiendo recibido información exhaustiva y clara por parte de mi médico oncólogo tratante, <strong>{selectedError.medico}</strong>, sobre la naturaleza, alcances, beneficios, riesgos potenciales y efectos secundarios de la terapia quimioterápica adyuvante prescrita, <strong>DECLARO BAJO JURAMENTO QUE CONSIENTO EL TRATAMIENTO</strong>.
                        </p>

                        <div className="space-y-2">
                          <h5 className="font-extrabold text-slate-900">DECLARACIONES RELEVANTES ACEPTE:</h5>
                          <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-slate-600">
                            <li>Comprendo que el tratamiento implica medicamentos citostáticos de alta complejidad.</li>
                            <li>He sido informado sobre las posibles reacciones adversas (toxicidades, náuseas, alopecia, fatiga, mielosupresión).</li>
                            <li>Autorizo la administración de infusiones y la colocación del catéter implantable o periférico necesario.</li>
                            <li>Se me ha explicado la importancia de asistir con rigurosidad a los ciclos programados de oncología.</li>
                          </ul>
                        </div>

                        <p className="text-[11px] text-slate-500 italic border-t border-slate-200 pt-3">
                          Este documento sirve como soporte legal de que el consentimiento ha sido diligenciado, firmado y guardado conforme a la Ley de Ética Médica de la República.
                        </p>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-900 space-y-1">
                          <span className="font-bold block text-amber-950">NOTAS DE AUDITORÍA (CONSENTIMIENTO):</span>
                          <p className="italic">"{activeViewDoc.doc.notas || 'Consentimiento firmado correctamente por el paciente.'}"</p>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Signatures & Stamps Footer */}
                  <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-6 mt-4">
                    <div className="text-center space-y-1 flex flex-col items-center">
                      <div className="w-40 h-10 border-b border-slate-400 flex items-end justify-center select-none">
                        <span className="font-serif italic text-xs text-slate-400">Firma Huella Digitalizada</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">PACIENTE: {selectedError.nombre_paciente} {selectedError.apellidos_paciente}</span>
                      <span className="text-[8px] text-slate-400 block">C.C. {selectedError.numero_documento}</span>
                    </div>

                    <div className="text-center space-y-1 flex flex-col items-center">
                      <div className="w-40 h-10 border-b border-slate-400 flex items-end justify-center select-none relative">
                        <span className="font-sans italic text-[11px] text-blue-800 font-extrabold">Dr. {selectedError.medico}</span>
                        {/* Stamp overlay */}
                        <div className="absolute right-0 top-0 w-8 h-8 rounded-full border border-red-500/50 flex items-center justify-center rotate-12 bg-red-50/20 select-none pointer-events-none">
                          <span className="text-[6px] text-red-500 font-bold uppercase font-mono tracking-tighter">REG SALUD</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">MÉDICO ONCÓLOGO TRATANTE</span>
                      <span className="text-[8px] text-slate-400 block">RECONOCIMIENTO POR BIO-REGISTRO</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-[#1E293B] px-6 py-4 border-t border-[#334155] flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-mono">
                Autenticado en Sistema el: {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
              </span>
              <button
                onClick={() => setActiveViewDoc(null)}
                className="px-5 py-2 bg-[#334155] hover:bg-[#475569] text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
