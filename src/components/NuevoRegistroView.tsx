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
import { 
  ClipboardList, 
  CheckCircle, 
  ArrowLeft, 
  FileText, 
  UploadCloud, 
  FileUp,
  AlertCircle,
  Sparkles,
  Lock
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

  // 4 Core PDF Document States (simulating file metadata and storing notes)
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

  // Validation feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

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

  const loadExistingPatientData = () => {
    const existing = errors.find(e => e.numero_documento.trim() === documento.trim());
    if (existing) {
      setNombre(existing.nombre_paciente);
      setApellidos(existing.apellidos_paciente);
      setEps(existing.eps);
      setMedico(existing.medico);
      setOrigen(existing.origen_formula);
      setTelefonoFijo(existing.telefono_fijo || '');
      setNumeroCelular(existing.numero_celular || '');
      setCelularContactoAdicional1(existing.celular_contacto_adicional_1 || '');
      setCelularContactoAdicional2(existing.celular_contacto_adicional_2 || '');
      setObservaciones(`[ACTUALIZACIÓN EXPEDIENTE] Carga de nuevos documentos para paciente recurrente.`);
    }
  };

  // Helper to generate file names based on patient name if none uploaded manually
  const autoFillFileNames = () => {
    const cleanName = nombre.trim().toLowerCase().replace(/\s+/g, '_') || 'paciente';
    const suffix = isUpdatingExisting ? '_act' : '';
    if (!hcFileName) setHcFileName(`historia_clinica_${cleanName}${suffix}.pdf`);
    if (!pmFileName) setPmFileName(`politerapia_monoterapia_${cleanName}${suffix}.pdf`);
    if (!fmFileName) setFmFileName(`formula_medica_${cleanName}${suffix}.pdf`);
    if (!ciFileName) setCiFileName(`consentimiento_informado_${cleanName}${suffix}.pdf`);
  };

  useEffect(() => {
    autoFillFileNames();
  }, [nombre, isUpdatingExisting]);

  const handleSubmit = (e: React.FormEvent) => {
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

    if (isUpdatingExisting) {
      const existing = errors.find(e => e.numero_documento.trim() === documento.trim());
      if (existing) {
        // Prepare PDF objects to append
        const newHcDoc: DocumentoAdjunto = {
          id_documento: `DOC-HC-${Date.now()}`,
          nombre_archivo: hcFileName || `historia_clinica_${nombre.trim().toLowerCase()}_act.pdf`,
          tamano: formatFileSize(hcFile, '1.4 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: hcNotes.trim() || 'Cargado durante la actualización de ciclo.',
          es_correccion: false,
          url: hcFile ? URL.createObjectURL(hcFile) : undefined,
        };

        const newPmDoc: DocumentoAdjunto = {
          id_documento: `DOC-PM-${Date.now()}`,
          nombre_archivo: pmFileName || `politerapia_${nombre.trim().toLowerCase()}_act.pdf`,
          tamano: formatFileSize(pmFile, '0.8 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: pmNotes.trim() || 'Cargado durante la actualización de ciclo.',
          es_correccion: false,
          url: pmFile ? URL.createObjectURL(pmFile) : undefined,
        };

        const newFmDoc: DocumentoAdjunto = {
          id_documento: `DOC-FM-${Date.now()}`,
          nombre_archivo: fmFileName || `formula_medica_${nombre.trim().toLowerCase()}_act.pdf`,
          tamano: formatFileSize(fmFile, '1.1 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: fmNotes.trim() || 'Cargado durante la actualización de ciclo.',
          es_correccion: false,
          url: fmFile ? URL.createObjectURL(fmFile) : undefined,
        };

        const newCiDoc: DocumentoAdjunto = {
          id_documento: `DOC-CI-${Date.now()}`,
          nombre_archivo: ciFileName || `consentimiento_${nombre.trim().toLowerCase()}_act.pdf`,
          tamano: formatFileSize(ciFile, '2.0 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: ciNotes.trim() || 'Cargado durante la actualización de ciclo.',
          es_correccion: false,
          url: ciFile ? URL.createObjectURL(ciFile) : undefined,
        };

        const updatedHC = [...(existing.historia_clinica || []), newHcDoc];
        const updatedPM = [...(existing.politerapia_monoterapia || []), newPmDoc];
        const updatedFM = [...(existing.formula_medica || []), newFmDoc];
        const updatedCI = [...(existing.consentimiento_informado || []), newCiDoc];

        const notesLine = observaciones.trim()
          ? `\n[ACTUALIZACIÓN - ${sysDate} ${sysTime}]: ${observaciones.trim()}`
          : `\n[ACTUALIZACIÓN - ${sysDate} ${sysTime}]: Se cargaron nuevos PDF para actualizar el expediente de este paciente recurrente.`;

        if (onUpdateErrorStatus) {
          onUpdateErrorStatus(existing.id_registro, 'ENTREGADO_QF', {
            historia_clinica: updatedHC,
            politerapia_monoterapia: updatedPM,
            formula_medica: updatedFM,
            consentimiento_informado: updatedCI,
            observaciones: (existing.observaciones || '') + notesLine,
            tipo_error: '', // clear old error categorization for QF to re-audit
          });
        }
        setSuccess(true);
      }
    } else {
      // Prepare PDF objects for a brand new patient
      const docsHC: DocumentoAdjunto[] = [
        {
          id_documento: `DOC-HC-${Date.now()}`,
          nombre_archivo: hcFileName || `historia_clinica_${nombre.trim().toLowerCase()}.pdf`,
          tamano: formatFileSize(hcFile, '1.4 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: hcNotes.trim() || 'Cargado durante el registro inicial.',
          es_correccion: false,
          url: hcFile ? URL.createObjectURL(hcFile) : undefined,
        }
      ];

      const docsPM: DocumentoAdjunto[] = [
        {
          id_documento: `DOC-PM-${Date.now()}`,
          nombre_archivo: pmFileName || `politerapia_${nombre.trim().toLowerCase()}.pdf`,
          tamano: formatFileSize(pmFile, '0.8 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: pmNotes.trim() || 'Cargado durante el registro inicial.',
          es_correccion: false,
          url: pmFile ? URL.createObjectURL(pmFile) : undefined,
        }
      ];

      const docsFM: DocumentoAdjunto[] = [
        {
          id_documento: `DOC-FM-${Date.now()}`,
          nombre_archivo: fmFileName || `formula_medica_${nombre.trim().toLowerCase()}.pdf`,
          tamano: formatFileSize(fmFile, '1.1 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: fmNotes.trim() || 'Cargado durante el registro inicial.',
          es_correccion: false,
          url: fmFile ? URL.createObjectURL(fmFile) : undefined,
        }
      ];

      const docsCI: DocumentoAdjunto[] = [
        {
          id_documento: `DOC-CI-${Date.now()}`,
          nombre_archivo: ciFileName || `consentimiento_${nombre.trim().toLowerCase()}.pdf`,
          tamano: formatFileSize(ciFile, '2.0 MB'),
          fecha_carga: sysDate,
          cargado_por: currentUser.nombre_usuario,
          notas: ciNotes.trim() || 'Cargado durante el registro inicial.',
          es_correccion: false,
          url: ciFile ? URL.createObjectURL(ciFile) : undefined,
        }
      ];

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
        tipo_error: '', // Starts empty, registradores register patient regardless of whether they have errors.
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
    setHcNotes('');
    setPmNotes('');
    setFmNotes('');
    setCiNotes('');
    setLastLoadedDoc('');
    setIsUpdatingExisting(false);

    setTimeout(() => {
      setSuccess(false);
      onNavigate('registros');
    }, 2000);
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
              Ingrese los datos identificativos y adjunte obligatoriamente los 4 documentos exigidos en formato PDF para validación por Farmacia.
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
                  type="text"
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
                  type="text"
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
                  type="text"
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
                  type="text"
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
              2. Soportes Médicos Exigidos (Formato PDF)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document 1: Historia Clinica */}
              <div className="p-4 bg-[#0B1120] border border-[#1F2937] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Historia Clínica (PDF) *</span>
                </div>
                
                {/* Real file uploader */}
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
                
                {/* Real file uploader */}
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
                
                {/* Real file uploader */}
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
                
                {/* Real file uploader */}
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
              className="px-4 py-2 bg-transparent text-xs text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#1F2937] rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              id="submit-form-btn"
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg shadow-md transition flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Guardar Paciente y Documentos (PDF)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
