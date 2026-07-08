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
  TIPOS_DE_ERROR_CATALOG,
  DocumentoAdjunto,
} from '../types';
import { obtenerEnlacePDF } from '../dataService';
import {
  Search,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  User,
  AlertCircle,
  Send,
  FileText,
  Trash2,
  Lock,
  Plus,
  X,
  RefreshCw,
  UploadCloud,
  Layers,
  ExternalLink,
  Eye,
  Loader2,
} from 'lucide-react';

// Categorías de documentos (las 8)
type DocCategory =
  | 'historia_clinica'
  | 'politerapia_monoterapia'
  | 'formula_medica'
  | 'consentimiento_informado'
  | 'resultados_laboratorio'
  | 'resultados_imagenes'
  | 'autorizacion_eps'
  | 'otros_documentos';

// Etiquetas legibles para cada categoría
const CATEGORY_LABELS: Record<DocCategory, string> = {
  historia_clinica: 'Historia Clínica',
  politerapia_monoterapia: 'Politerapia o Monoterapia',
  formula_medica: 'Fórmula Médica',
  consentimiento_informado: 'Consentimiento Informado',
  resultados_laboratorio: 'Resultados de Laboratorio',
  resultados_imagenes: 'Resultados de Imágenes',
  autorizacion_eps: 'Autorización EPS',
  otros_documentos: 'Otros Documentos',
};

// Orden y numeración de las categorías para mostrar
const CATEGORY_ORDER: DocCategory[] = [
  'historia_clinica',
  'politerapia_monoterapia',
  'formula_medica',
  'consentimiento_informado',
  'resultados_laboratorio',
  'resultados_imagenes',
  'autorizacion_eps',
  'otros_documentos',
];

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
  const [newDocCategory, setNewDocCategory] = useState<DocCategory>('historia_clinica');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [dragActiveAdd, setDragActiveAdd] = useState(false);

  // Visor de PDF real
  const [activeViewDoc, setActiveViewDoc] = useState<{
    doc: DocumentoAdjunto;
    category: DocCategory;
  } | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState('');

  useEffect(() => {
    if (selectedError) {
      setTransitionErrorType(selectedError.tipo_error || 'Error de dosis');
      setTransitionObservations(selectedError.observaciones || '');
      setTransitionCorrectionNotes('');
      setShowAttachForm(false);

      const cleanName = selectedError.nombre_paciente.toLowerCase().replace(/\s+/g, '_');
      setNewDocFileName(`correccion_${newDocCategory}_${cleanName}.pdf`);
    }
  }, [selectedError]);

  useEffect(() => {
    if (selectedError) {
      const cleanName = selectedError.nombre_paciente.toLowerCase().replace(/\s+/g, '_');
      setNewDocFileName(`correccion_${newDocCategory}_${cleanName}.pdf`);
    }
  }, [newDocCategory, selectedError]);

  // Cuando se abre un documento, generar el enlace temporal firmado
  const handleOpenDoc = async (doc: DocumentoAdjunto, category: DocCategory) => {
    setActiveViewDoc({ doc, category });
    setViewerUrl(null);
    setViewerError('');

    if (!doc.url) {
      setViewerError('Este documento no tiene un archivo PDF asociado.');
      return;
    }

    setViewerLoading(true);
    try {
      const enlace = await obtenerEnlacePDF(doc.url);
      if (enlace) {
        setViewerUrl(enlace);
      } else {
        setViewerError('No se pudo generar el enlace del documento. Intente nuevamente.');
      }
    } catch (err) {
      console.error('Error al abrir documento:', err);
      setViewerError('Ocurrió un error al cargar el documento.');
    } finally {
      setViewerLoading(false);
    }
  };

  const closeViewer = () => {
    setActiveViewDoc(null);
    setViewerUrl(null);
    setViewerError('');
    setViewerLoading(false);
  };

  // Inbox Mode Toggle
  const isInboxEligible = ['QuimicoFarmaceutico', 'Registro'].includes(currentUser.rol);
  const [inboxMode, setInboxMode] = useState<'bandeja' | 'todos'>(isInboxEligible ? 'bandeja' : 'todos');

  // Filter records based on role and options
  const getFilteredErrors = () => {
    let filtered = [...errors];

    if (inboxMode === 'bandeja') {
      if (currentUser.rol === 'Registro') {
        filtered = filtered.filter(
          (e) => e.estado_actual === 'CON_ERROR_REGISTRADO' || e.usuario_registro === currentUser.nombre_usuario
        );
      } else if (currentUser.rol === 'QuimicoFarmaceutico') {
        filtered = filtered.filter(
          (e) => e.estado_actual === 'ENTREGADO_QF' || e.estado_actual === 'CORREGIDA_PENDIENTE_VERIFICACION'
        );
      }
    }

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

    if (filterEps) {
      filtered = filtered.filter((e) => e.eps === filterEps);
    }
    if (filterErrorType) {
      filtered = filtered.filter((e) => e.tipo_error === filterErrorType);
    }
    if (filterStatus) {
      filtered = filtered.filter((e) => e.estado_actual === filterStatus);
    }

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

    const currentArray = (selectedError[newDocCategory] as DocumentoAdjunto[]) || [];
    const updatedArray = [...currentArray, newDoc];

    const updatedFields: Partial<RegistroError> = {
      [newDocCategory]: updatedArray,
    };

    onUpdateErrorStatus(selectedError.id_registro, selectedError.estado_actual, updatedFields);

    onSelectError({
      ...selectedError,
      ...updatedFields,
    });

    setNewDocNotes('');
    setNewDocFile(null);
    setShowAttachForm(false);
  };

  // Delete Document (ADMIN ONLY)
  const handleDeleteDocument = (category: DocCategory, docId: string) => {
    if (currentUser.rol !== 'Administrador') return;
    if (!selectedError) return;

    const currentArray = (selectedError[category] as DocumentoAdjunto[]) || [];
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

  // Helper catalogs for filtering
  const distinctEps = Array.from(new Set(errors.map((e) => e.eps)));
  const distinctStatuses = Array.from(new Set(errors.map((e) => e.estado_actual)));

  // Componente reutilizable: tarjeta de una categoría de documentos
  const renderDocCategory = (category: DocCategory, index: number) => {
    if (!selectedError) return null;
    const docs = (selectedError[category] as DocumentoAdjunto[]) || [];

    return (
      <div key={category} className="bg-[#0B1120] border border-[#1F2937] rounded-xl p-4 space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5 mb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>{index + 1}. {CATEGORY_LABELS[category]}</span>
            </span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase">PDF</span>
          </div>

          <div className="space-y-2.5">
            {docs.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic">No se han cargado documentos en este apartado.</p>
            ) : (
              docs.map((doc) => (
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
                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded">
                          Corrección
                        </span>
                      )}

                      {currentUser.rol === 'Administrador' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(category, doc.id_documento)}
                          className="p-1 text-[#EF4444] hover:bg-red-500/15 rounded transition"
                          title="Eliminar documento del expediente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <Lock className="w-3 h-3 text-gray-600" />
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 italic leading-relaxed bg-[#0B1120] p-1.5 rounded border border-[#1F2937]/30">
                    <strong>Notas:</strong> {doc.notas || 'Sin notas.'}
                  </p>

                  <div className="flex items-center justify-between gap-2 border-t border-[#1F2937]/40 pt-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDoc(doc, category)}
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
    );
  };

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
            {/* Left Column */}
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

                {/* Programador Custom Fields */}
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

              {/* PDF Document Management */}
              <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F2937] pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#F3F4F6]">Expediente Digital de Soportes Médicos (PDF)</h4>
                    <p className="text-xs text-[#9CA3AF]">
                      Visualice, verifique o adjunte las correcciones documentales de este paciente.
                    </p>
                  </div>

                  {(currentUser.rol === 'Registro' || currentUser.rol === 'Administrador') && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        id="toggle-attach-form-btn"
                        onClick={() => setShowAttachForm(!showAttachForm)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-[11px] transition flex items-center gap-1 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adjuntar Corrección / Soporte</span>
                      </button>
                    </div>
                  )}
                </div>

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
                        <label className="block text-gray-400">Seleccionar o Arrastrar Archivo (PDF) *</label>
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
                          onChange={(e) => setNewDocCategory(e.target.value as DocCategory)}
                          className="w-full bg-[#131B2E] border border-[#1F2937] p-2 rounded text-xs text-white"
                        >
                          {CATEGORY_ORDER.map((cat) => (
                            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]} (PDF)</option>
                          ))}
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
                        Cargar Documento
                      </button>
                    </div>
                  </form>
                )}

                {/* Documents grid - las 8 categorías */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {CATEGORY_ORDER.map((cat, idx) => renderDocCategory(cat, idx))}
                </div>
              </div>

              {/* Action Board */}
              <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-[#F3F4F6]">Acciones de Trazabilidad y Validación</h4>
                <p className="text-xs text-[#9CA3AF]">
                  Controles de flujo interactivos para la validación y corrección de expedientes oncológicos.
                </p>

                <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Estado de Validación:</span>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${STATUS_CONFIGS[selectedError.estado_actual]?.badgeBg} ${STATUS_CONFIGS[selectedError.estado_actual]?.badgeText}`}>
                    {STATUS_CONFIGS[selectedError.estado_actual]?.nombre || selectedError.estado_actual}
                  </span>
                </div>

                {/* WORKFLOW PHASE A: Quimico Farmaceutico reviews */}
                {selectedError.estado_actual !== 'ENTREGADO_PROGRAMACION' && (
                  <div className="space-y-4">
                    {currentUser.rol === 'QuimicoFarmaceutico' || currentUser.rol === 'Administrador' ? (
                      <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-4 space-y-4">
                        <div className="border-b border-[#1F2937] pb-2">
                          <span className="text-xs font-bold text-blue-400 block">Evaluación del Químico Farmacéutico (QF)</span>
                          <span className="text-[11px] text-[#9CA3AF]">Examine los soportes en PDF y apruebe para dispensación o devuelva con los hallazgos.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
                            <div>
                              <span className="text-xs font-bold text-emerald-400 block mb-1">Opción A: Aprobar Fórmula</span>
                              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                                Si toda la información de identificación, EPS y los soportes PDF con notas están correctos, apruebe el registro para dar por terminado el flujo y avanzar a programación.
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

                {/* WORKFLOW PHASE B: Registry Corrects */}
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
                            placeholder="Ej. 'Se re-adjunta la fórmula médica corregida con la dosificación recomendada...'"
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

                {/* WORKFLOW PHASE C: Finalized */}
                {selectedError.estado_actual === 'ENTREGADO_PROGRAMACION' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg flex items-start gap-2.5 text-emerald-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block mb-1">Validación de Fórmula Aprobada con Éxito</span>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Este registro ha culminado favorablemente el ciclo de farmacovigilancia de oncología. Los soportes PDF reglamentarios fueron validados por el Químico Farmacéutico y el expediente se encuentra archivado y disponible para consulta o auditorías.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Timeline */}
            <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-[#F3F4F6]">Historial y Línea de Tiempo</h4>
                <p className="text-xs text-[#9CA3AF]">
                  Historial cronológico auditado de cambios de estado del trámite.
                </p>

                <div className="relative border-l-2 border-[#1F2937] pl-5 ml-2.5 space-y-6 py-2">
                  {selectedError.historial_estados.map((hist, idx) => {
                    const conf = STATUS_CONFIGS[hist.estado] || {
                      nombre: hist.estado,
                      color: 'gray',
                    };

                    return (
                      <div key={idx} className="relative">
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

              {/* Audit summary - 8 categorías */}
              <div className="border-t border-[#1F2937] pt-4 mt-6 space-y-3">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                  Auditoría del Expediente
                </span>

                <div className="bg-[#0B1120] rounded-lg p-3 border border-[#1F2937] text-xs space-y-2">
                  {CATEGORY_ORDER.map((cat) => {
                    const count = (selectedError[cat] as DocumentoAdjunto[] | undefined)?.length || 0;
                    return (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-gray-400">{CATEGORY_LABELS[cat]}:</span>
                        <span className="text-white font-mono font-bold text-[11px]">
                          {count} cargado(s)
                        </span>
                      </div>
                    );
                  })}
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

      {/* ----------------- VISOR DE PDF REAL ----------------- */}
      {activeViewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="relative bg-[#0F172A] border border-[#1E293B] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col my-8 overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#1E293B] px-6 py-4 flex items-center justify-between border-b border-[#334155]">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">
                    {CATEGORY_LABELS[activeViewDoc.category]}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Archivo: {activeViewDoc.doc.nombre_archivo} ({activeViewDoc.doc.tamano})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewerUrl && (
                  <button
                    onClick={() => window.open(viewerUrl, '_blank')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Ver archivo en nueva pestaña"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir en Pestaña Nueva</span>
                  </button>
                )}
                <button
                  onClick={closeViewer}
                  className="p-2 bg-[#334155] hover:bg-red-500 hover:text-white text-gray-300 rounded-lg transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-6 overflow-y-auto bg-slate-900 flex-1 flex flex-col items-center justify-center min-h-[400px]">
              {viewerLoading && (
                <div className="flex flex-col items-center gap-3 text-gray-300">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                  <span className="text-sm">Generando enlace seguro del documento...</span>
                </div>
              )}

              {viewerError && !viewerLoading && (
                <div className="flex flex-col items-center gap-3 text-center max-w-md">
                  <AlertCircle className="w-12 h-12 text-amber-400" />
                  <p className="text-sm text-amber-400 font-semibold">{viewerError}</p>
                  <p className="text-xs text-gray-500">
                    Es posible que este documento se haya cargado antes de activar el almacenamiento seguro, o que el archivo no esté disponible.
                  </p>
                </div>
              )}

              {viewerUrl && !viewerLoading && (
                <div className="w-full flex flex-col gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Documento PDF cargado de forma segura. El enlace es temporal y expira por seguridad.</span>
                  </div>
                  <iframe
                    src={viewerUrl}
                    className="w-full h-[600px] border border-[#1E293B] rounded-xl bg-white"
                    title="Visor PDF"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#1E293B] px-6 py-4 border-t border-[#334155] flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-mono">
                Consultado el: {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}
              </span>
              <button
                onClick={closeViewer}
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