/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EPS_CATALOG,
  MEDICOS_CATALOG,
  ORIGEN_FORMULA_CATALOG,
  OriginFormula,
  RegistroError,
  DocumentoAdjunto,
  ErrorStatus,
} from '../types';
import { subirPDF } from '../dataService';
import { 
  ClipboardList, 
  CheckCircle, 
  ArrowLeft, 
  FileText, 
  UploadCloud, 
  FileUp,
  AlertCircle,
  Sparkles,
  Lock,
  Loader2
} from 'lucide-react';

interface NuevoRegistroViewProps {
  currentUser: { nombre_usuario: string; nombre_completo: string };
  errors: RegistroError[];
  onAddError: (newError: RegistroError) => void;
  onUpdateErrorStatus?: (
    id: string,
    newStatus: ErrorStatus,
    updatedFields?: Partial<RegistroError>
  ) => void;
  onNavigate: (page: string) => void;
  medicos?: string[];
}

export default function NuevoRegistroView({
  currentUser,
  errors,
  onAddError,
  onUpdateErrorStatus,
  onNavigate,
  medicos = MEDICOS_CATALOG,
}: NuevoRegistroViewProps) {
  // Generate next automatic ID
  const [nextId, setNextId] = useState('');

  useEffect(() => {
    let maxNum = 128;
    errors.forEach((err) => {
      const match = err.id_registro.match(/ERR-\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    const formattedNum = String(nextNum).padStart(6, '0');
    setNextId(`ERR-2026-${formattedNum}`);
  }, [errors]);

  // Form states
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [documento, setDocumento] = useState('');
  const [eps, setEps] = useState('');
  const [medico, setMedico] = useState('');
  const [origen, setOrigen] = useState<OriginFormula>('Consulta Externa');
  const [observaciones, setObservaciones] = useState('');

  // Contact phone number fields
  const [telefonoFijo, setTelefonoFijo] = useState('');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [celularContactoAdicional1, setCelularContactoAdicional1] = useState('');
  const [celularContactoAdicional2, setCelularContactoAdicional2] = useState('');

  // 8 PDF Document States (file + notes + drag flag)
  const [hcFile, setHcFile] = useState<File | null>(null);
  const [hcFileName, setHcFileName] = useState('');
  const [hcNotes, setHcNotes] = useState('');
  const [dragActiveHC, setDragActiveHC] = useState(false);

  const [pmFile, setPmFile] = useState<File | null>(null);
  const [pmFileName, setPmFileName] = useState('');
  const [pmNotes, setPmNotes] = useState('');
  const [dragActivePM, setDragActivePM] = useState(false);

  const [fmFile, setFmFile] = useState<File | null>(null);
  const [fmFileName, setFmFileName] = useState('');
  const [fmNotes, setFmNotes] = useState('');
  const [dragActiveFM, setDragActiveFM] = useState(false);

  const [ciFile, setCiFile] = useState<File | null>(null);
  const [ciFileName, setCiFileName] = useState('');
  const [ciNotes, setCiNotes] = useState('');
  const [dragActiveCI, setDragActiveCI] = useState(false);

  const [labFile, setLabFile] = useState<File | null>(null);
  const [labFileName, setLabFileName] = useState('');
  const [labNotes, setLabNotes] = useState('');
  const [dragActiveLAB, setDragActiveLAB] = useState(false);

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgFileName, setImgFileName] = useState('');
  const [imgNotes, setImgNotes] = useState('');
  const [dragActiveIMG, setDragActiveIMG] = useState(false);

  const [epsFile, setEpsFile] = useState<File | null>(null);
  const [epsFileName, setEpsFileName] = useState('');
  const [epsNotes, setEpsNotes] = useState('');
  const [dragActiveEPS, setDragActiveEPS] = useState(false);

  const [otrosFile, setOtrosFile] = useState<File | null>(null);
  const [otrosFileName, setOtrosFileName] = useState('');
  const [otrosNotes, setOtrosNotes] = useState('');
  const [dragActiveOTROS, setDragActiveOTROS] = useState(false);

  // Validation feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Format file size dynamically
  const formatFileSize = (file: File | null, defaultSize: string) => {
    if (!file) return defaultSize;
    if (file.size < 1024) return `${file.size} B`;
    if (file.size < 1024 * 1024) return `${(file.size / 1024).toFixed(1)} KB`;
    return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Auto field simulations
  const [sysDate, setSysDate] = useState('');
  const [sysTime, setSysTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const hr = String(now.getHours()).padStart(2, '0');
      const mn = String(now.getMinutes()).padStart(2, '0');
      const sc = String(now.getSeconds()).padStart(2, '0');
      setSysDate(`${yr}-${mo}-${dy}`);
      setSysTime(`${hr}:${mn}:${sc}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [existingPatientFound, setExistingPatientFound] = useState(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [lastLoadedDoc, setLastLoadedDoc] = useState('');

  // Check if patient already exists in records and pull their info automatically
  useEffect(() => {
    const trimmedDoc = documento.trim();
    if (trimmedDoc.length >= 4) {
      const existing = errors.find(e => e.numero_documento.trim() === trimmedDoc);
      if (existing) {
        setIsUpdatingExisting(true);
        setExistingPatientFound(true);
        if (lastLoadedDoc !== trimmedDoc) {
          setNombre(existing.nombre_paciente);
          setApellidos(existing.apellidos_paciente);
          setEps(existing.eps);
          setMedico(existing.medico);
          setOrigen(existing.origen_formula);
          setTelefonoFijo(existing.telefono_fijo || '');
          setNumeroCelular(existing.numero_celular || '');
          setCelularContactoAdicional1(existing.celular_contacto_adicional_1 || '');
          setCelularContactoAdicional2(existing.celular_contacto_adicional_2 || '');
          setLastLoadedDoc(trimmedDoc);
          setObservaciones(`[ACTUALIZACIÓN EXPEDIENTE] Carga de nuevos documentos para paciente recurrente.`);
        }
      } else {
        setIsUpdatingExisting(false);
        setExistingPatientFound(false);
        if (lastLoadedDoc !== '') {
          setNombre('');
          setApellidos('');
          setEps('');
          setMedico('');
          setTelefonoFijo('');
          setNumeroCelular('');
          setCelularContactoAdicional1('');
          setCelularContactoAdicional2('');
          setLastLoadedDoc('');
          setObservaciones('');
        }
      }
    } else {
      setIsUpdatingExisting(false);
      setExistingPatientFound(false);
      if (lastLoadedDoc !== '') {
        setNombre('');
        setApellidos('');
        setEps('');
        setMedico('');
        setTelefonoFijo('');
        setNumeroCelular('');
        setCelularContactoAdicional1('');
        setCelularContactoAdicional2('');
        setLastLoadedDoc('');
        setObservaciones('');
      }
    }
  }, [documento, errors, lastLoadedDoc]);

  // Helper to generate file names based on patient name if none uploaded manually
  const autoFillFileNames = () => {
    const cleanName = nombre.trim().toLowerCase().replace(/\s+/g, '_') || 'paciente';
    const suffix = isUpdatingExisting ? '_act' : '';
    if (!hcFileName) setHcFileName(`historia_clinica_${cleanName}${suffix}.pdf`);
    if (!pmFileName) setPmFileName(`politerapia_monoterapia_${cleanName}${suffix}.pdf`);
    if (!fmFileName) setFmFileName(`formula_medica_${cleanName}${suffix}.pdf`);
    if (!ciFileName) setCiFileName(`consentimiento_informado_${cleanName}${suffix}.pdf`);
    if (!labFileName) setLabFileName(`resultados_laboratorio_${cleanName}${suffix}.pdf`);
    if (!imgFileName) setImgFileName(`resultados_imagenes_${cleanName}${suffix}.pdf`);
    if (!epsFileName) setEpsFileName(`autorizacion_eps_${cleanName}${suffix}.pdf`);
    if (!otrosFileName) setOtrosFileName(`otros_documentos_${cleanName}${suffix}.pdf`);
  };

  useEffect(() => {
    autoFillFileNames();
  }, [nombre, isUpdatingExisting]);

  // Build a document array for a section: uploads the file to Supabase (if any) and returns [] or [doc]
  const construirDocs = async (
    idRegistro: string,
    tipo: string,
    file: File | null,
    fileName: string,
    notes: string,
    prefijo: string,
    tamanoDefault: string,
    contexto: string
  ): Promise<DocumentoAdjunto[]> => {
    if (!file) return []; // Si no hay archivo, no se crea documento

    const ruta = await subirPDF(file, idRegistro, tipo);
    if (!ruta) {
      // Si la subida falla, se aborta todo el guardado: así nunca queda un
      // registro "exitoso" con documentos sin archivo real en la nube.
      throw new Error(`No se pudo subir el archivo "${fileName || file.name}" a la nube.`);
    }

    const doc: DocumentoAdjunto = {
      id_documento: `${prefijo}-${Date.now()}`,
      nombre_archivo: fileName || `${tipo}_${nombre.trim().toLowerCase()}.pdf`,
      tamano: formatFileSize(file, tamanoDefault),
      fecha_carga: sysDate,
      cargado_por: currentUser.nombre_usuario,
      notas: notes.trim() || contexto,
      es_correccion: false,
      url: ruta, // Guardamos la RUTA de Supabase Storage
    };
    return [doc];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!nombre.trim() || !apellidos.trim() || !documento.trim()) {
      setErrorMsg('Por favor complete todos los campos de información personal del paciente.');
      return;
    }
    if (!/^\d+$/.test(documento)) {
      setErrorMsg('El número de documento de identificación debe contener exclusivamente dígitos numéricos.');
      return;
    }
    if (!numeroCelular.trim()) {
      setErrorMsg('El número celular de contacto es obligatorio.');
      return;
    }
    if (!eps) {
      setErrorMsg('Seleccione una EPS de la lista.');
      return;
    }
    if (!medico) {
      setErrorMsg('Seleccione el médico prescriptor.');
      return;
    }
    if (!origen) {
      setErrorMsg('Seleccione el área de origen de la fórmula.');
      return;
    }

    setUploading(true);

    try {
      if (isUpdatingExisting) {
        const existing = errors.find(e => e.numero_documento.trim() === documento.trim());
        if (existing) {
          const idReg = existing.id_registro;
          const ctx = 'Cargado durante la actualización de ciclo.';

          const newHC = await construirDocs(idReg, 'historia_clinica', hcFile, hcFileName, hcNotes, 'DOC-HC', '1.4 MB', ctx);
          const newPM = await construirDocs(idReg, 'politerapia_monoterapia', pmFile, pmFileName, pmNotes, 'DOC-PM', '0.8 MB', ctx);
          const newFM = await construirDocs(idReg, 'formula_medica', fmFile, fmFileName, fmNotes, 'DOC-FM', '1.1 MB', ctx);
          const newCI = await construirDocs(idReg, 'consentimiento_informado', ciFile, ciFileName, ciNotes, 'DOC-CI', '2.0 MB', ctx);
          const newLAB = await construirDocs(idReg, 'resultados_laboratorio', labFile, labFileName, labNotes, 'DOC-LAB', '1.0 MB', ctx);
          const newIMG = await construirDocs(idReg, 'resultados_imagenes', imgFile, imgFileName, imgNotes, 'DOC-IMG', '1.0 MB', ctx);
          const newEPS = await construirDocs(idReg, 'autorizacion_eps', epsFile, epsFileName, epsNotes, 'DOC-EPS', '0.5 MB', ctx);
          const newOTROS = await construirDocs(idReg, 'otros_documentos', otrosFile, otrosFileName, otrosNotes, 'DOC-OTROS', '0.5 MB', ctx);

          const updatedHC = [...(existing.historia_clinica || []), ...newHC];
          const updatedPM = [...(existing.politerapia_monoterapia || []), ...newPM];
          const updatedFM = [...(existing.formula_medica || []), ...newFM];
          const updatedCI = [...(existing.consentimiento_informado || []), ...newCI];
          const updatedLAB = [...(existing.resultados_laboratorio || []), ...newLAB];
          const updatedIMG = [...(existing.resultados_imagenes || []), ...newIMG];
          const updatedEPS = [...(existing.autorizacion_eps || []), ...newEPS];
          const updatedOTROS = [...(existing.otros_documentos || []), ...newOTROS];

          const notesLine = observaciones.trim()
            ? `\n[ACTUALIZACIÓN - ${sysDate} ${sysTime}]: ${observaciones.trim()}`
            : `\n[ACTUALIZACIÓN - ${sysDate} ${sysTime}]: Se cargaron nuevos PDF para actualizar el expediente de este paciente recurrente.`;

          if (onUpdateErrorStatus) {
            onUpdateErrorStatus(existing.id_registro, 'ENTREGADO_QF', {
              historia_clinica: updatedHC,
              politerapia_monoterapia: updatedPM,
              formula_medica: updatedFM,
              consentimiento_informado: updatedCI,
              resultados_laboratorio: updatedLAB,
              resultados_imagenes: updatedIMG,
              autorizacion_eps: updatedEPS,
              otros_documentos: updatedOTROS,
              observaciones: (existing.observaciones || '') + notesLine,
              tipo_error: '',
            });
          }
          setSuccess(true);
        }
      } else {
        const idReg = nextId;
        const ctx = 'Cargado durante el registro inicial.';

        const docsHC = await construirDocs(idReg, 'historia_clinica', hcFile, hcFileName, hcNotes, 'DOC-HC', '1.4 MB', ctx);
        const docsPM = await construirDocs(idReg, 'politerapia_monoterapia', pmFile, pmFileName, pmNotes, 'DOC-PM', '0.8 MB', ctx);
        const docsFM = await construirDocs(idReg, 'formula_medica', fmFile, fmFileName, fmNotes, 'DOC-FM', '1.1 MB', ctx);
        const docsCI = await construirDocs(idReg, 'consentimiento_informado', ciFile, ciFileName, ciNotes, 'DOC-CI', '2.0 MB', ctx);
        const docsLAB = await construirDocs(idReg, 'resultados_laboratorio', labFile, labFileName, labNotes, 'DOC-LAB', '1.0 MB', ctx);
        const docsIMG = await construirDocs(idReg, 'resultados_imagenes', imgFile, imgFileName, imgNotes, 'DOC-IMG', '1.0 MB', ctx);
        const docsEPS = await construirDocs(idReg, 'autorizacion_eps', epsFile, epsFileName, epsNotes, 'DOC-EPS', '0.5 MB', ctx);
        const docsOTROS = await construirDocs(idReg, 'otros_documentos', otrosFile, otrosFileName, otrosNotes, 'DOC-OTROS', '0.5 MB', ctx);

        // Create registry object
        const newRecord: RegistroError = {
          id_registro: nextId,
          fecha_registro: sysDate,
          hora_registro: sysTime,
          usuario_registro: currentUser.nombre_usuario,
          nombre_paciente: nombre.trim(),
          apellidos_paciente: apellidos.trim(),
          numero_documento: documento.trim(),
          eps,
          medico,
          tipo_error: '',
          origen_formula: origen,
          observaciones: observaciones.trim() || undefined,
          estado_actual: 'ENTREGADO_QF',
          historial_estados: [
            {
              estado: 'ENTREGADO_QF',
              fecha: sysDate,
              hora: sysTime,
              usuario: currentUser.nombre_usuario,
            },
          ],
          telefono_fijo: telefonoFijo.trim() || undefined,
          numero_celular: numeroCelular.trim(),
          celular_contacto_adicional_1: celularContactoAdicional1.trim() || undefined,
          celular_contacto_adicional_2: celularContactoAdicional2.trim() || undefined,
          historia_clinica: docsHC,
          politerapia_monoterapia: docsPM,
          formula_medica: docsFM,
          consentimiento_informado: docsCI,
          resultados_laboratorio: docsLAB,
          resultados_imagenes: docsIMG,
          autorizacion_eps: docsEPS,
          otros_documentos: docsOTROS,
        };

        onAddError(newRecord);
        setSuccess(true);
      }

      // Reset Form
      setNombre('');
      setApellidos('');
      setDocumento('');
      setEps('');
      setMedico('');
      setObservaciones('');
      setTelefonoFijo('');
      setNumeroCelular('');
      setCelularContactoAdicional1('');
      setCelularContactoAdicional2('');
      setHcFile(null);
      setPmFile(null);
      setFmFile(null);
      setCiFile(null);
      setLabFile(null);
      setImgFile(null);
      setEpsFile(null);
      setOtrosFile(null);
      setHcNotes('');
      setPmNotes('');
      setFmNotes('');
      setCiNotes('');
      setLabNotes('');
      setImgNotes('');
      setEpsNotes('');
      setOtrosNotes('');
      setLastLoadedDoc('');
      setIsUpdatingExisting(false);

      setTimeout(() => {
        setSuccess(false);
        onNavigate('registros');
      }, 2000);
    } catch (err) {
      console.error('Error al guardar:', err);
      setErrorMsg('Ocurrió un error al subir los documentos. Intente nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
        <span className="text-xs text-[#9CA3AF]">
          Rol Activo:{' '}
          <span className="text-[#3B82F6] font-semibold">Personal de Registro</span>
        </span>
      </div>

      <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-[#1F2937]/50 px-6 py-4 border-b border-[#1F2937] flex items-center gap-3">
          <div className="p-2 rounded bg-blue-500/10 text-blue-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#F3F4F6]">Registrar Fórmula Médica y Paciente</h3>
            <p className="text-xs text-[#9CA3AF]">
              Ingrese los datos identificativos y adjunte los documentos en formato PDF para validación por Farmacia.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-[#EF4444] text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {uploading && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] text-xs flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
              <span>Subiendo documentos a la base de datos segura, por favor espere...</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] text-xs flex items-center gap-2.5 animate-pulse">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-bold">
                  {isUpdatingExisting 
                    ? '¡Expediente de Paciente Actualizado con Éxito (Sin Duplicados)!'
                    : '¡Registro de Paciente Creado Exitosamente!'}
                </p>
                <p className="text-[10px] text-emerald-400/80">
                  {isUpdatingExisting 
                    ? 'Se han anexado los nuevos soportes PDF al expediente existente.'
                    : `Código de Seguimiento: ${nextId}. Redirigiendo a la lista...`}
                </p>
              </div>
            </div>
          )}

          {isUpdatingExisting && (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[#22D3EE] text-xs flex items-start gap-3.5 shadow-lg animate-fadeIn">
              <Sparkles className="w-5 h-5 flex-shrink-0 text-cyan-400 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <p className="font-bold text-xs uppercase tracking-wider text-cyan-300">EXPEDIENTE ACTIVO DETECTADO (SISTEMA ANTIDUPLICADO)</p>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  Este paciente ya se encuentra registrado en la base de datos. Para mantener la consistencia y evitar la creación de registros duplicados, se ha recuperado la información básica de su expediente.
                </p>
                <p className="font-semibold text-cyan-400 text-[11px]">
                  Proceda a adjuntar a continuación los nuevos archivos PDF para actualizar los soportes de este paciente.
                </p>
              </div>
            </div>
          )}

          {/* Patient Details Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-1">
              1. Datos de Identificación y Paciente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Nombres del Paciente <span className="text-red-400">*</span>
                </label>
                <input
                  id="patient-name-input"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. María"
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  required
                  disabled={isUpdatingExisting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Apellidos del Paciente <span className="text-red-400">*</span>
                </label>
                <input
                  id="patient-lastname-input"
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. González López"
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  required
                  disabled={isUpdatingExisting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Número de Identificación <span className="text-red-400">*</span>
                </label>
                <input
                  id="patient-doc-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                  placeholder="Solo dígitos"
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none font-mono transition"
                  required
                />
                
                {existingPatientFound && (
                  <div className="mt-2 p-2 rounded-lg bg-cyan-950/30 border border-[#22D3EE]/20 text-[10px] text-cyan-300 flex items-center justify-between gap-1 animate-fadeIn">
                    <p className="font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      Expediente cargado
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Entidad Administradora (EPS) <span className="text-red-400">*</span>
                </label>
                <select
                  id="select-eps"
                  value={eps}
                  onChange={(e) => setEps(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  required
                  disabled={isUpdatingExisting}
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
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Médico Prescriptor <span className="text-red-400">*</span>
                </label>
                <select
                  id="select-medico"
                  value={medico}
                  onChange={(e) => setMedico(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  required
                  disabled={isUpdatingExisting}
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
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Área de Origen de la Fórmula <span className="text-red-400">*</span>
                </label>
                <select
                  id="select-origin"
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value as OriginFormula)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] focus:border-[#3B82F6] outline-none transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  required
                  disabled={isUpdatingExisting}
                >
                  {ORIGEN_FORMULA_CATALOG.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Numbers Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#1E2937]/25 p-4 rounded-xl border border-[#1F2937]/50">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Número Telefónico <span className="text-[10px] text-gray-500">(Opcional)</span>
                </label>
                <input
                  id="patient-phone-input"
                  type="tel"
                  inputMode="numeric"
                  value={telefonoFijo}
                  onChange={(e) => setTelefonoFijo(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 6023214567"
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none font-mono transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  disabled={isUpdatingExisting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Número Celular <span className="text-red-400">*</span>
                </label>
                <input
                  id="patient-cel-input"
                  type="tel"
                  inputMode="numeric"
                  value={numeroCelular}
                  onChange={(e) => setNumeroCelular(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 3157654321"
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none font-mono transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  required
                  disabled={isUpdatingExisting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Celular Adicional 1 <span className="text-[10px] text-gray-500">(Opcional)</span>
                </label>
                <input
                  id="patient-cel-backup1-input"
                  type="tel"
                  inputMode="numeric"
                  value={celularContactoAdicional1}
                  onChange={(e) => setCelularContactoAdicional1(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 3109876543"
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none font-mono transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  disabled={isUpdatingExisting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">
                  Celular Adicional 2 <span className="text-[10px] text-gray-500">(Opcional)</span>
                </label>
                <input
                  id="patient-cel-backup2-input"
                  type="tel"
                  inputMode="numeric"
                  value={celularContactoAdicional2}
                  onChange={(e) => setCelularContactoAdicional2(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 3181234567"
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none font-mono transition disabled:bg-[#111827] disabled:text-[#9CA3AF]/70 disabled:cursor-not-allowed"
                  disabled={isUpdatingExisting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA3AF]">
                Observaciones iniciales del Regente de Registro
              </label>
              <textarea
                id="notes-textarea"
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Escriba comentarios sobre el ingreso o estado de los soportes..."
                className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none transition resize-none"
              />
            </div>
          </div>

          {/* PDF Attachments Section */}
          <div className="space-y-6 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 border-b border-[#1F2937] pb-1">
              2. Soportes Médicos (Formato PDF)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document 1: Historia Clinica */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Historia Clínica (PDF) *</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActiveHC ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActiveHC(true); }}
                  onDragLeave={() => setDragActiveHC(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveHC(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setHcFile(file);
                      setHcFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="hc-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setHcFile(file);
                        setHcFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActiveHC ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={hcFileName || 'historia_clinica.pdf'}>
                    {hcFileName || 'historia_clinica.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {hcFile ? `${(hcFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre la Historia Clínica:</label>
                  <textarea
                    id="hc-notes-textarea"
                    rows={2}
                    value={hcNotes}
                    onChange={(e) => setHcNotes(e.target.value)}
                    placeholder="Ingrese observaciones clínicas de este soporte..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Document 2: Politerapia o Monoterapia */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Politerapia o Monoterapia (PDF) *</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActivePM ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActivePM(true); }}
                  onDragLeave={() => setDragActivePM(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActivePM(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setPmFile(file);
                      setPmFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="pm-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPmFile(file);
                        setPmFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActivePM ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={pmFileName || 'politerapia_monoterapia.pdf'}>
                    {pmFileName || 'politerapia_monoterapia.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {pmFile ? `${(pmFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre el Esquema/Terapia:</label>
                  <textarea
                    id="pm-notes-textarea"
                    rows={2}
                    value={pmNotes}
                    onChange={(e) => setPmNotes(e.target.value)}
                    placeholder="Ingrese notas terapéuticas o del esquema oncológico..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Document 3: Formula Medica */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Fórmula Médica (PDF) *</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActiveFM ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActiveFM(true); }}
                  onDragLeave={() => setDragActiveFM(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveFM(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setFmFile(file);
                      setFmFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="fm-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFmFile(file);
                        setFmFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActiveFM ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={fmFileName || 'formula_medica.pdf'}>
                    {fmFileName || 'formula_medica.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {fmFile ? `${(fmFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre la Fórmula Médica:</label>
                  <textarea
                    id="fm-notes-textarea"
                    rows={2}
                    value={fmNotes}
                    onChange={(e) => setFmNotes(e.target.value)}
                    placeholder="Ingrese anotaciones sobre la dosificación, volumen o vía prescrita..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Document 4: Consentimiento Informado */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Consentimiento Informado (PDF) *</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActiveCI ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActiveCI(true); }}
                  onDragLeave={() => setDragActiveCI(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveCI(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setCiFile(file);
                      setCiFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="ci-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCiFile(file);
                        setCiFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActiveCI ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={ciFileName || 'consentimiento_informado.pdf'}>
                    {ciFileName || 'consentimiento_informado.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {ciFile ? `${(ciFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre el Consentimiento:</label>
                  <textarea
                    id="ci-notes-textarea"
                    rows={2}
                    value={ciNotes}
                    onChange={(e) => setCiNotes(e.target.value)}
                    placeholder="Ingrese notas del consentimiento firmado..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Document 5: Resultados de Laboratorio */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Resultados de Laboratorio (PDF)</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActiveLAB ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActiveLAB(true); }}
                  onDragLeave={() => setDragActiveLAB(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveLAB(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setLabFile(file);
                      setLabFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="lab-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLabFile(file);
                        setLabFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActiveLAB ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={labFileName || 'resultados_laboratorio.pdf'}>
                    {labFileName || 'resultados_laboratorio.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {labFile ? `${(labFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre Resultados de Laboratorio:</label>
                  <textarea
                    id="lab-notes-textarea"
                    rows={2}
                    value={labNotes}
                    onChange={(e) => setLabNotes(e.target.value)}
                    placeholder="Ingrese observaciones de los resultados de laboratorio..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Document 6: Resultados de Imágenes */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Resultados de Imágenes (PDF)</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActiveIMG ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActiveIMG(true); }}
                  onDragLeave={() => setDragActiveIMG(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveIMG(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setImgFile(file);
                      setImgFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="img-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImgFile(file);
                        setImgFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActiveIMG ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={imgFileName || 'resultados_imagenes.pdf'}>
                    {imgFileName || 'resultados_imagenes.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {imgFile ? `${(imgFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre Resultados de Imágenes:</label>
                  <textarea
                    id="img-notes-textarea"
                    rows={2}
                    value={imgNotes}
                    onChange={(e) => setImgNotes(e.target.value)}
                    placeholder="Ingrese observaciones de los estudios imagenológicos..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Document 7: Autorización EPS */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Autorización EPS (PDF)</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActiveEPS ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActiveEPS(true); }}
                  onDragLeave={() => setDragActiveEPS(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveEPS(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setEpsFile(file);
                      setEpsFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="eps-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEpsFile(file);
                        setEpsFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActiveEPS ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={epsFileName || 'autorizacion_eps.pdf'}>
                    {epsFileName || 'autorizacion_eps.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {epsFile ? `${(epsFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre la Autorización EPS:</label>
                  <textarea
                    id="eps-notes-textarea"
                    rows={2}
                    value={epsNotes}
                    onChange={(e) => setEpsNotes(e.target.value)}
                    placeholder="Ingrese observaciones sobre la autorización de la EPS..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Document 8: Otros Documentos */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Otros Documentos (PDF)</span>
                </div>
                <label 
                  className={`block border border-dashed rounded-lg p-3 text-center cursor-pointer transition bg-[#131B2E]/40 ${
                    dragActiveOTROS ? 'border-blue-500 bg-[#3B82F6]/10' : 'border-[#1F2937] hover:border-blue-500/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActiveOTROS(true); }}
                  onDragLeave={() => setDragActiveOTROS(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveOTROS(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') {
                      setOtrosFile(file);
                      setOtrosFileName(file.name);
                    }
                  }}
                >
                  <input
                    id="otros-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setOtrosFile(file);
                        setOtrosFileName(file.name);
                      }
                    }}
                  />
                  <UploadCloud className={`w-6 h-6 mx-auto mb-1 ${dragActiveOTROS ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-[11px] text-[#F3F4F6] block font-mono truncate" title={otrosFileName || 'otros_documentos.pdf'}>
                    {otrosFileName || 'otros_documentos.pdf'}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {otrosFile ? `${(otrosFile.size / (1024 * 1024)).toFixed(2)} MB (Archivo seleccionado)` : 'Haga clic o arrastre un PDF aquí'}
                  </span>
                </label>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400">Notas sobre Otros Documentos:</label>
                  <textarea
                    id="otros-notes-textarea"
                    rows={2}
                    value={otrosNotes}
                    onChange={(e) => setOtrosNotes(e.target.value)}
                    placeholder="Ingrese cualquier otra observación relevante..."
                    className="w-full bg-[#131B2E] border border-[#1F2937] rounded-lg p-2 text-[11px] text-[#F3F4F6] focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metadatos Autogenerados */}
          <div className="p-4 rounded-lg bg-[#0B1120] border border-[#1F2937] space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
              Metadatos del Trámite (Autogenerados)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 text-xs font-mono text-gray-400">
              <div>
                <span className="block text-[10px] text-gray-500 font-sans">ID Interno:</span>
                <span className="text-[#22D3EE] font-bold">{nextId || 'Generando...'}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 font-sans">Fecha Registro:</span>
                <span className="text-[#F3F4F6]">{sysDate}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 font-sans">Hora Registro:</span>
                <span className="text-[#F3F4F6]">{sysTime}</span>
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 font-sans">Registrador:</span>
                <span className="text-[#F3F4F6] font-sans">{currentUser.nombre_usuario}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="cancel-form-btn"
              type="button"
              onClick={() => onNavigate('dashboard')}
              disabled={uploading}
              className="px-4 py-2 bg-transparent text-xs text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#1F2937] rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              id="submit-form-btn"
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg shadow-md transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4" />
                  Guardar Paciente y Documentos (PDF)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
