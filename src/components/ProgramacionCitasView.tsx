/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { fechaLocalISO } from '../utils';
import {
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  ArrowLeft,
  Trash2,
  Layers,
  User,
  Plus,
  AlertCircle,
  FileText,
  MessageSquare,
  MessageCircle,
  Smartphone,
  Send,
  X,
  Check,
} from 'lucide-react';
import { RegistroError, ProgramacionCita, UserRole } from '../types';

interface ProgramacionCitasViewProps {
  errors: RegistroError[];
  programaciones: ProgramacionCita[];
  onAddProgramacion: (newProg: ProgramacionCita) => void;
  onUpdateProgramacionEstado: (id: string, nuevoEstado: 'Programada' | 'Realizada' | 'Cancelada') => void;
  onUpdateProgramacionConfirmacion: (id: string, confirmacion: 'Si' | 'No' | 'Pendiente', motivo?: string) => void;
  onDeleteProgramacion: (id: string) => void;
  onNavigate: (page: string) => void;
  currentUser: { nombre_usuario: string; rol: UserRole };
}

export default function ProgramacionCitasView({
  errors,
  programaciones,
  onAddProgramacion,
  onUpdateProgramacionEstado,
  onUpdateProgramacionConfirmacion,
  onDeleteProgramacion,
  onNavigate,
  currentUser,
}: ProgramacionCitasViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEps, setFilterEps] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedRegistroId, setSelectedRegistroId] = useState('');
  const [ciclo, setCiclo] = useState(1);
  const [diaAplicacion, setDiaAplicacion] = useState(1);
  const [fechaAplicacion, setFechaAplicacion] = useState('');
  const [medicamento, setMedicamento] = useState('');
  const [horaAplicacion, setHoraAplicacion] = useState('08:00');
  const [telefonoContacto1, setTelefonoContacto1] = useState('');
  const [telefonoContacto2, setTelefonoContacto2] = useState('');
  const [telefonoContacto3, setTelefonoContacto3] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [ignoreWarning, setIgnoreWarning] = useState(false);

  // Simulation states
  const [simulatingAppointmentId, setSimulatingAppointmentId] = useState<string | null>(null);
  const [simulationResponse, setSimulationResponse] = useState<'Si' | 'No' | null>(null);
  const [simulationReason, setSimulationReason] = useState('');

  // Get only approved patient records
  const approvedRecords = errors.filter(
    (e) => e.estado_actual === 'ENTREGADO_PROGRAMACION'
  );

  const selectedRecord = errors.find((e) => e.id_registro === selectedRegistroId);

  // Check for duplication warning dynamically
  const existingCycleDay = selectedRecord
    ? programaciones.find(
        (p) =>
          p.numero_documento === selectedRecord.numero_documento &&
          p.ciclo_actual === ciclo &&
          p.dia_aplicacion === diaAplicacion &&
          p.estado_programacion !== 'Cancelada'
      )
    : null;

  const existingDate = selectedRecord && fechaAplicacion
    ? programaciones.find(
        (p) =>
          p.numero_documento === selectedRecord.numero_documento &&
          p.fecha_aplicacion === fechaAplicacion &&
          p.estado_programacion !== 'Cancelada'
      )
    : null;

  const isDuplicateCycleAndDay = !!existingCycleDay;
  const isDuplicateDate = !!existingDate;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    if (!selectedRegistroId) {
      setFormError('Debe seleccionar un paciente de la lista de registros aprobados.');
      return;
    }
    if (!fechaAplicacion) {
      setFormError('Por favor seleccione una fecha para la aplicación.');
      return;
    }
    if (!horaAplicacion) {
      setFormError('Por favor seleccione una hora para la aplicación.');
      return;
    }
    if (!telefonoContacto1.trim()) {
      setFormError('El número de contacto 1 es obligatorio para coordinar la cita.');
      return;
    }
    if (!/^\d{7,15}$/.test(telefonoContacto1.trim())) {
      setFormError('El número de contacto 1 debe ser un teléfono válido (entre 7 y 15 dígitos).');
      return;
    }
    if (telefonoContacto2.trim() && !/^\d{7,15}$/.test(telefonoContacto2.trim())) {
      setFormError('El número de contacto 2 opcional debe ser un teléfono válido (entre 7 y 15 dígitos).');
      return;
    }
    if (telefonoContacto3.trim() && !/^\d{7,15}$/.test(telefonoContacto3.trim())) {
      setFormError('El número de contacto 3 opcional debe ser un teléfono válido (entre 7 y 15 dígitos).');
      return;
    }
    if (!medicamento.trim()) {
      setFormError('Por favor ingrese el nombre del medicamento o mezcla oncológica.');
      return;
    }

    const rec = errors.find((r) => r.id_registro === selectedRegistroId);
    if (!rec) return;

    // Check bounds if defined
    if (rec.cantidad_ciclos && ciclo > rec.cantidad_ciclos) {
      setFormError(`El ciclo ingresado (${ciclo}) supera la cantidad de ciclos programados para este paciente (${rec.cantidad_ciclos}).`);
      return;
    }

    // Check duplication warnings
    if ((isDuplicateCycleAndDay || isDuplicateDate) && !ignoreWarning) {
      setFormError('Alerta de duplicidad: Ya existe una programación para este ciclo/día o fecha. Para continuar, revise las alertas abajo y marque la casilla de confirmación.');
      return;
    }

    const generatedId = `PROG-${Date.now()}`;

    const newProg: ProgramacionCita = {
      id_programacion: generatedId,
      id_registro: rec.id_registro,
      nombre_paciente: rec.nombre_paciente,
      apellidos_paciente: rec.apellidos_paciente,
      numero_documento: rec.numero_documento,
      eps: rec.eps,
      ciclo_actual: ciclo,
      dia_aplicacion: diaAplicacion,
      fecha_aplicacion: fechaAplicacion,
      hora_aplicacion: horaAplicacion,
      telefono_contacto_1: telefonoContacto1.trim(),
      telefono_contacto_2: telefonoContacto2.trim() || undefined,
      telefono_contacto_3: telefonoContacto3.trim() || undefined,
      medicamento: medicamento.trim(),
      observaciones: observaciones.trim(),
      estado_programacion: 'Programada',
      fecha_registro: fechaLocalISO(),
      programado_por: currentUser.nombre_usuario,
      confirmacion_paciente: 'Pendiente',
      sms_enviado: true,
      whatsapp_enviado: true,
    };

    onAddProgramacion(newProg);
    setFormSuccess(true);
    
    // Automatically open the patient notification simulator for this newly created appointment
    setTimeout(() => {
      setSimulatingAppointmentId(generatedId);
      setSimulationResponse(null);
      setSimulationReason('');
    }, 600);

    // Reset fields
    setObservaciones('');
    setFechaAplicacion('');
    setHoraAplicacion('08:00');
    setTelefonoContacto1('');
    setTelefonoContacto2('');
    setTelefonoContacto3('');
    setMedicamento('');
    setCiclo(1);
    setDiaAplicacion(1);
    setIgnoreWarning(false);

    setTimeout(() => {
      setFormSuccess(false);
      setShowForm(false);
    }, 1500);
  };

  // Filtered programaciones list
  const filteredProgramaciones = programaciones.filter((p) => {
    const matchesSearch =
      `${p.nombre_paciente} ${p.apellidos_paciente} ${p.numero_documento} ${p.medicamento || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesEps = filterEps === '' || p.eps === filterEps;
    const matchesEstado = filterEstado === '' || p.estado_programacion === filterEstado;
    return matchesSearch && matchesEps && matchesEstado;
  });

  const distinctEps = Array.from(new Set(programaciones.map((p) => p.eps)));

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Dashboard
          </button>
          <h2 className="text-xl font-bold text-[#F3F4F6] tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Programación de Citas y Aplicaciones
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Planificación de infusiones de quimioterapia para pacientes con tratamientos aprobados en farmacia.
          </p>
        </div>

        {(currentUser.rol === 'Programador' || currentUser.rol === 'Administrador') && (
          <button
            id="btn-add-programacion"
            onClick={() => {
              setShowForm(!showForm);
              setFormError('');
              setFormSuccess(false);
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-2 shadow-lg shadow-cyan-950/20"
          >
            <Plus className="w-4 h-4" />
            Agendar Nueva Aplicación
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Schedule Form */}
        {showForm && (
          <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
            <div className="bg-[#1F2937]/50 px-6 py-4 border-b border-[#1F2937] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-sm font-bold text-[#F3F4F6]">Planificar Sesión de Quimioterapia</h4>
                  <p className="text-xs text-[#9CA3AF]">Complete los datos de ciclo, dosis y fecha de agendamiento.</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-pulse">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>¡Aplicación programada con éxito en la agenda clínica!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Select patient */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-gray-400 font-semibold">Seleccionar Paciente (Sólo Fórmulas Aprobadas QF) *</label>
                  <select
                    id="select-patient-program"
                    value={selectedRegistroId}
                    onChange={(e) => {
                      setSelectedRegistroId(e.target.value);
                      const rec = errors.find((r) => r.id_registro === e.target.value);
                      if (rec) {
                        setMedicamento(rec.tipo_error ? 'Medicamento Corregido' : '');
                      }
                    }}
                    className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] focus:border-cyan-400 outline-none transition"
                    required
                  >
                    <option value="">-- Seleccione un paciente aprobado --</option>
                    {approvedRecords.map((r) => (
                      <option key={r.id_registro} value={r.id_registro}>
                        {r.nombre_paciente} {r.apellidos_paciente} - {r.eps} ({r.numero_documento})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Patient Info Card Inline */}
                <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-3 flex flex-col justify-center space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Esquema Aprobado:</p>
                  {selectedRecord ? (
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-cyan-300">
                        Ciclos Totales: <span className="text-white">{selectedRecord.cantidad_ciclos || 'Sin definir'}</span>
                      </p>
                      <p className="text-[11px] font-semibold text-cyan-300">
                        Días: <span className="text-white">{selectedRecord.dias_administracion || 'Sin definir'}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">Seleccione paciente para ver ciclos.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-gray-400 font-semibold">Ciclo Actual *</label>
                  <input
                    id="input-sched-cycle"
                    type="number"
                    min="1"
                    value={ciclo}
                    onChange={(e) => setCiclo(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-400 font-semibold">Día de Aplicación (Número) *</label>
                  <input
                    id="input-sched-day"
                    type="number"
                    min="1"
                    value={diaAplicacion}
                    onChange={(e) => setDiaAplicacion(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-400 font-semibold">Fecha de Aplicación *</label>
                  <input
                    id="input-sched-date"
                    type="date"
                    value={fechaAplicacion}
                    onChange={(e) => setFechaAplicacion(e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-400 font-semibold">Medicamento / Mezcla *</label>
                  <input
                    id="input-sched-med"
                    type="text"
                    placeholder="Ej. Paclitaxel + Carboplatino"
                    value={medicamento}
                    onChange={(e) => setMedicamento(e.target.value)}
                    className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition"
                    required
                  />
                </div>
              </div>

              {/* Time and Contact Numbers Section */}
              <div className="border-t border-[#1F2937]/50 pt-4">
                <h5 className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Información de Hora de Aplicación y Números de Contacto para Notificaciones
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="block text-gray-400 font-semibold">Hora de Aplicación *</label>
                    <input
                      id="input-sched-time"
                      type="time"
                      value={horaAplicacion}
                      onChange={(e) => setHoraAplicacion(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-400 font-semibold">Teléfono Contacto 1 (Obligatorio) *</label>
                    <input
                      id="input-sched-phone1"
                      type="tel"
                      placeholder="Ej. 3157894561"
                      value={telefonoContacto1}
                      onChange={(e) => setTelefonoContacto1(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-400 font-semibold">Teléfono Contacto 2 (Opcional)</label>
                    <input
                      id="input-sched-phone2"
                      type="tel"
                      placeholder="Ej. 3004561234"
                      value={telefonoContacto2}
                      onChange={(e) => setTelefonoContacto2(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-400 font-semibold">Teléfono Contacto 3 (Opcional)</label>
                    <input
                      id="input-sched-phone3"
                      type="tel"
                      placeholder="Ej. 3111234567"
                      value={telefonoContacto3}
                      onChange={(e) => setTelefonoContacto3(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block text-gray-400 font-semibold">Indicaciones Clínicas / Observaciones de Agendamiento</label>
                <textarea
                  id="textarea-sched-notes"
                  rows={2}
                  placeholder="Ej. Realizar pre-medicación estándar 30 min antes. Monitorear signos vitales..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] outline-none focus:border-cyan-400 transition resize-none"
                />
              </div>

              {/* Warnings and Acknowledge checkbox */}
              {(isDuplicateCycleAndDay || isDuplicateDate) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-amber-400">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">¡Advertencia de Programación Duplicada!</span>
                      {isDuplicateCycleAndDay && existingCycleDay && (
                        <p>
                          El paciente <strong>{selectedRecord?.nombre_paciente} {selectedRecord?.apellidos_paciente}</strong> ya tiene programada una cita para el <strong className="text-white">Ciclo {ciclo}, Día de Aplicación {diaAplicacion}</strong> (ID: <span className="font-mono text-white">{existingCycleDay.id_programacion}</span> - Fecha: {existingCycleDay.fecha_aplicacion} - Medicamento: {existingCycleDay.medicamento || 'N/A'}).
                        </p>
                      )}
                      {isDuplicateDate && existingDate && (
                        <p>
                          El paciente ya tiene una cita agendada en la misma fecha seleccionada: <strong className="text-white">{fechaAplicacion}</strong> (ID: <span className="font-mono text-white">{existingDate.id_programacion}</span> - Ciclo {existingDate.ciclo_actual}, Día {existingDate.dia_aplicacion}).
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400">
                        Por favor verifique que no se trate de un agendamiento redundante para el mismo ciclo y día de aplicación.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer select-none bg-amber-500/5 p-2 rounded border border-amber-500/10 hover:bg-amber-500/10 transition">
                    <input
                      id="checkbox-ignore-duplicate"
                      type="checkbox"
                      checked={ignoreWarning}
                      onChange={(e) => setIgnoreWarning(e.target.checked)}
                      className="rounded border-[#1F2937] text-amber-500 focus:ring-amber-500 bg-[#0B1120]"
                    />
                    <span>Comprendo el riesgo de duplicidad, deseo proceder y guardar la cita de todas formas.</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition"
                >
                  Guardar en Agenda
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and List */}
        <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 self-start md:self-auto">
              Calendario y Programación de Aplicaciones Activas
            </h4>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar paciente, ID o medicamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-cyan-400 outline-none transition"
                />
              </div>

              <select
                value={filterEps}
                onChange={(e) => setFilterEps(e.target.value)}
                className="bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-gray-300 outline-none"
              >
                <option value="">Todas las EPS</option>
                {distinctEps.map((eps) => (
                  <option key={eps} value={eps}>
                    {eps}
                  </option>
                ))}
              </select>

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-gray-300 outline-none"
              >
                <option value="">Todos los Estados</option>
                <option value="Programada">Programada</option>
                <option value="Realizada">Realizada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* List/Table */}
          {filteredProgramaciones.length === 0 ? (
            <div className="p-12 text-center bg-[#0B1120]/40 rounded-xl border border-[#1F2937]/50 space-y-3">
              <Clock className="w-10 h-10 text-gray-600 mx-auto" />
              <h5 className="text-xs font-bold text-gray-300">No hay programaciones cargadas</h5>
              <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                No se encontraron registros de citas que coincidan con los filtros aplicados. Registre nuevas aplicaciones para los pacientes aprobados por Farmacia.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1F2937]">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-[#1F2937]/50 text-gray-400 border-b border-[#1F2937]">
                    <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Paciente / ID</th>
                    <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">EPS</th>
                    <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Medicamento</th>
                    <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Ciclo / Día</th>
                    <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Fecha / Hora</th>
                    <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Contacto y Respuesta</th>
                    <th className="p-3 font-semibold text-[10px] uppercase tracking-wider">Estado Cita</th>
                    {(currentUser.rol === 'Programador' || currentUser.rol === 'Administrador') && (
                      <th className="p-3 font-semibold text-[10px] uppercase tracking-wider text-right">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937] bg-[#0B1120]/30 text-xs">
                  {filteredProgramaciones.map((p) => {
                    let badgeClass = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                    if (p.estado_programacion === 'Realizada') {
                      badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    } else if (p.estado_programacion === 'Cancelada') {
                      badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
                    }

                    // Contact strings compilation
                    const phones = [
                      p.telefono_contacto_1,
                      p.telefono_contacto_2,
                      p.telefono_contacto_3,
                    ].filter(Boolean);

                    // Patient response styling
                    let responseBadge = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-2.5 h-2.5" /> Pendiente
                      </span>
                    );
                    if (p.confirmacion_paciente === 'Si') {
                      responseBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" /> De acuerdo
                        </span>
                      );
                    } else if (p.confirmacion_paciente === 'No') {
                      responseBadge = (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30" title={p.motivo_desacuerdo}>
                          <X className="w-2.5 h-2.5" /> En Desacuerdo
                        </span>
                      );
                    }

                    return (
                      <tr key={p.id_programacion} className="hover:bg-[#131B2E]/60 transition">
                        <td className="p-3">
                          <div className="font-semibold text-white">
                            {p.nombre_paciente} {p.apellidos_paciente}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            C.C. {p.numero_documento} | Ref: {p.id_registro}
                          </div>
                        </td>
                        <td className="p-3 text-gray-300 font-semibold">{p.eps}</td>
                        <td className="p-3">
                          <span className="bg-[#1F2937]/80 text-[#22D3EE] px-2 py-1 rounded text-[11px] font-mono border border-[#1F2937]">
                            {p.medicamento}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">
                          Ciclo {p.ciclo_actual} <span className="text-gray-500">/</span> Día {p.dia_aplicacion}
                        </td>
                        <td className="p-3 text-[#F3F4F6] font-mono font-bold py-4">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            {p.fecha_aplicacion}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {p.hora_aplicacion || '08:00'}
                          </div>
                        </td>
                        <td className="p-3 space-y-1.5">
                          {/* Phones display */}
                          <div className="space-y-0.5 text-[10px]">
                            {phones.map((ph, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-gray-300 font-mono">
                                <span className="text-cyan-400 font-sans">#{idx + 1}:</span>
                                <span>{ph}</span>
                                {idx === 0 && <span className="text-[8px] bg-cyan-950 text-cyan-400 px-1 rounded uppercase">Oblig</span>}
                              </div>
                            ))}
                          </div>
                          {/* Notification channels status */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-[#22D3EE] bg-cyan-950/40 px-1 py-0.2 rounded font-sans">
                              <MessageSquare className="w-2.5 h-2.5" /> SMS Sent
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded font-sans">
                              <MessageCircle className="w-2.5 h-2.5" /> WA Sent
                            </span>
                          </div>
                          {/* Patient answer response with simulate trigger button */}
                          <div className="flex items-center gap-2 pt-1">
                            {responseBadge}
                            <button
                              onClick={() => {
                                setSimulatingAppointmentId(p.id_programacion);
                                setSimulationResponse(null);
                                setSimulationReason('');
                              }}
                              className="px-2 py-0.5 text-[9px] font-bold bg-[#131B2E] hover:bg-cyan-950 text-cyan-400 border border-cyan-900/50 hover:border-cyan-500/30 rounded flex items-center gap-1 transition"
                              title="Verificar celular simulado del paciente"
                            >
                              <Smartphone className="w-2.5 h-2.5" />
                              Responder
                            </button>
                          </div>
                          {/* Motivo desacuerdo display */}
                          {p.confirmacion_paciente === 'No' && p.motivo_desacuerdo && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded p-1.5 mt-1 text-[10px] text-red-400 max-w-xs leading-tight">
                              <strong className="block font-bold">Razón del paciente:</strong>
                              {p.motivo_desacuerdo}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                            {p.estado_programacion}
                          </span>
                        </td>
                        {(currentUser.rol === 'Programador' || currentUser.rol === 'Administrador') && (
                          <td className="p-3 text-right">
                            <div className="inline-flex gap-2">
                              {p.estado_programacion === 'Programada' && (
                                <>
                                  <button
                                    onClick={() => onUpdateProgramacionEstado(p.id_programacion, 'Realizada')}
                                    className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition"
                                    title="Marcar como realizada"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onUpdateProgramacionEstado(p.id_programacion, 'Cancelada')}
                                    className="p-1 hover:bg-red-500/20 text-red-400 rounded transition"
                                    title="Cancelar aplicación"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSimulatingAppointmentId(p.id_programacion);
                                      setSimulationResponse(null);
                                      setSimulationReason('');
                                    }}
                                    className="p-1 hover:bg-cyan-500/20 text-cyan-400 rounded transition"
                                    title="Simular Mensaje y Respuesta"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onDeleteProgramacion(p.id_programacion)}
                                className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded transition"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Patient Phone Notification Simulator Overlay */}
      {simulatingAppointmentId && (() => {
        const simApp = programaciones.find((p) => p.id_programacion === simulatingAppointmentId);
        if (!simApp) return null;

        return (
          <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0B1120] border-4 border-[#1F2937] rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl relative flex flex-col h-[650px] font-sans ring-8 ring-cyan-950/40">
              
              {/* Notch / Speaker of simulated phone */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#1F2937] h-6 w-32 rounded-b-xl z-20 flex items-center justify-center">
                <div className="w-12 h-1 bg-[#111827] rounded-full" />
              </div>

              {/* Screen Content */}
              <div className="flex-1 overflow-y-auto pt-8 pb-4 px-4 flex flex-col space-y-4">
                
                {/* Header of Phone Screen */}
                <div className="border-b border-[#1F2937] pb-3 text-center">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider font-mono">Simulador de Notificaciones</p>
                  <h4 className="text-xs font-bold text-white mt-1 flex items-center justify-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    Celular del Paciente
                  </h4>
                  <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/40 px-2.5 py-0.5 rounded-full mt-1.5 inline-block font-mono">
                    Tel Principal: {simApp.telefono_contacto_1}
                  </span>
                </div>

                <div className="space-y-4 flex-1">
                  {/* SMS Message Simulation */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest font-mono">
                      <MessageSquare className="w-3 h-3 text-blue-400" /> Mensaje de Texto (SMS) Recibido
                    </span>
                    <div className="bg-[#1E293B] border border-[#334155] p-3 rounded-2xl rounded-tl-none text-[11px] text-[#F1F5F9] leading-relaxed shadow-md">
                      <p className="font-semibold text-[10px] text-blue-400 mb-1">🏥 CLINICA ONCOLOGICA</p>
                      Hola {simApp.nombre_paciente}, se ha programado su sesión de quimioterapia ({simApp.medicamento}) para el {simApp.fecha_aplicacion} a las {simApp.hora_aplicacion || '08:00'}. ¿Está de acuerdo con esta fecha y hora de aplicación? Responda SÍ o NO.
                    </div>
                  </div>

                  {/* WhatsApp Message Simulation */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1F2937]/40">
                    <span className="text-[9px] font-bold text-[#10B981] flex items-center gap-1 uppercase tracking-widest font-mono">
                      <MessageCircle className="w-3 h-3" /> WhatsApp Business Recibido
                    </span>
                    <div className="bg-[#052E16] border border-[#14532D] p-3 rounded-2xl rounded-tl-none text-[11px] text-[#DCFCE7] leading-relaxed shadow-md relative">
                      <div className="absolute right-2 top-2 text-[8px] text-emerald-500/70 font-mono font-sans">Hoy, ahora</div>
                      <p className="font-extrabold text-[10.5px] text-[#10B981] mb-1">🏥 Centro de Control Oncológico</p>
                      <p className="mb-1 text-gray-200">Hola <strong className="text-white">{simApp.nombre_paciente} {simApp.apellidos_paciente}</strong>,</p>
                      <p className="mb-2 text-gray-200">Le notificamos que su cita para la aplicación de quimioterapia (<strong>{simApp.medicamento}</strong>) ha sido programada:</p>
                      <div className="bg-[#14532D]/40 p-2 rounded-lg border border-[#166534] mb-2 space-y-0.5 text-[10px] text-gray-200">
                        <p>📅 <strong>Fecha:</strong> {simApp.fecha_aplicacion}</p>
                        <p>⏰ <strong>Hora:</strong> {simApp.hora_aplicacion || '08:00'}</p>
                        <p>🔄 <strong>Ciclo:</strong> {simApp.ciclo_actual} / <strong>Día:</strong> {simApp.dia_aplicacion}</p>
                      </div>
                      <p className="italic text-[10px] text-emerald-400">¿Está de acuerdo con la fecha y hora de su aplicación?</p>
                    </div>
                  </div>

                  {/* Interactive Response Form */}
                  <div className="bg-[#1E293B]/40 border border-[#334155]/30 p-3 rounded-xl space-y-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center font-sans">Simular Respuesta de Paciente</p>
                    
                    {simulationResponse === null ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSimulationResponse('Si');
                          }}
                          className="py-2 px-3 bg-[#10B981] hover:bg-[#059669] text-black text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          SÍ, de acuerdo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSimulationResponse('No');
                          }}
                          className="py-2 px-3 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                          NO, en desacuerdo
                        </button>
                      </div>
                    ) : simulationResponse === 'Si' ? (
                      <div className="space-y-3 font-sans">
                        <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-800 text-emerald-400 text-[11px] text-center">
                          Ha seleccionado: <strong>SÍ, de acuerdo con la fecha y hora</strong>.
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSimulationResponse(null)}
                            className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-[10px] rounded transition"
                          >
                            Atrás
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateProgramacionConfirmacion(simApp.id_programacion, 'Si');
                              setSimulatingAppointmentId(null);
                            }}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded transition shadow"
                          >
                            Confirmar respuesta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        <div className="p-2.5 rounded bg-red-950/30 border border-red-800 text-red-400 text-[11px]">
                          <span className="font-bold">Indique el motivo de desacuerdo:</span>
                          <p className="text-[9px] text-gray-400 mt-0.5">Esto notificará al programador el por qué no puede asistir.</p>
                        </div>
                        <textarea
                          rows={2}
                          value={simulationReason}
                          onChange={(e) => setSimulationReason(e.target.value)}
                          placeholder="Escriba aquí la razón (Ej. cruce de horarios, cita médica previa...)"
                          className="w-full bg-[#0B1120] border border-[#334155] rounded-lg p-2 text-xs text-white outline-none focus:border-red-400 transition"
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSimulationResponse(null);
                              setSimulationReason('');
                            }}
                            className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-[10px] rounded transition"
                          >
                            Atrás
                          </button>
                          <button
                            type="button"
                            disabled={!simulationReason.trim()}
                            onClick={() => {
                              onUpdateProgramacionConfirmacion(simApp.id_programacion, 'No', simulationReason.trim());
                              setSimulatingAppointmentId(null);
                            }}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Enviar Desacuerdo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Close button at bottom of mobile mock */}
                <div className="pt-2 font-sans">
                  <button
                    onClick={() => setSimulatingAppointmentId(null)}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition"
                  >
                    Cerrar Simulador
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
