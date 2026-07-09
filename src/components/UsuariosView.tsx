/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Usuario, ROLES_CATALOG, UserRole, AccountStatus } from '../types';
import { fechaLocalISO } from '../utils';
import { Users, Plus, Shield, CheckCircle2, XCircle, ArrowLeft, Trash2, Edit, Stethoscope, AlertTriangle } from 'lucide-react';

interface UsuariosViewProps {
  users: Usuario[];
  currentUser: { nombre_usuario: string };
  onAddUser: (user: Usuario) => void;
  onUpdateUserStatus: (id_usuario: string, status: AccountStatus) => void;
  onUpdateUserRole: (id_usuario: string, role: UserRole) => void;
  onNavigate: (page: string) => void;
  medicos: string[];
  onAddMedico: (medico: string) => void;
  onDeleteMedico: (medico: string) => void;
  tiposError: string[];
  onAddTipoError: (tipo: string) => void;
  onDeleteTipoError: (tipo: string) => void;
}

export default function UsuariosView({
  users,
  currentUser,
  onAddUser,
  onUpdateUserStatus,
  onUpdateUserRole,
  onNavigate,
  medicos,
  onAddMedico,
  onDeleteMedico,
  tiposError,
  onAddTipoError,
  onDeleteTipoError,
}: UsuariosViewProps) {
  // Form states
  const [activeTab, setActiveTab] = useState<'usuarios' | 'medicos' | 'tipos_error'>('usuarios');
  const [username, setUsername] = useState('');
  const [fullname, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Consulta');

  const [feedback, setFeedback] = useState('');

  // Medicos states
  const [medicoName, setMedicoName] = useState('');
  const [medicoFeedback, setMedicoFeedback] = useState('');

  // Tipos de error (clasificación de hallazgo) states
  const [tipoName, setTipoName] = useState('');
  const [tipoFeedback, setTipoFeedback] = useState('');

  const handleTipoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTipoFeedback('');

    const nombreLimpio = tipoName.trim();
    if (!nombreLimpio) {
      setTipoFeedback('Por favor escriba el nombre del tipo de error.');
      return;
    }

    if (tiposError.some((t) => t.toLowerCase() === nombreLimpio.toLowerCase())) {
      setTipoFeedback('Este tipo de error ya existe en la clasificación.');
      return;
    }

    onAddTipoError(nombreLimpio);
    setTipoName('');
    setTipoFeedback('¡Tipo de error agregado con éxito a la clasificación!');
    setTimeout(() => setTipoFeedback(''), 3000);
  };

  const handleMedicoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMedicoFeedback('');

    if (!medicoName.trim()) {
      setMedicoFeedback('Por favor complete el nombre del médico.');
      return;
    }

    const nameUpper = medicoName.trim().toUpperCase();

    if (medicos.includes(nameUpper)) {
      setMedicoFeedback('Este médico ya se encuentra registrado.');
      return;
    }

    onAddMedico(nameUpper);
    setMedicoName('');
    setMedicoFeedback('¡Médico prescriptor registrado con éxito!');
    setTimeout(() => setMedicoFeedback(''), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (!username.trim() || !fullname.trim() || !password.trim()) {
      setFeedback('Por favor complete todos los campos.');
      return;
    }

    if (users.some((u) => u.nombre_usuario.toLowerCase() === username.trim().toLowerCase())) {
      setFeedback('El nombre de usuario ya existe en el sistema.');
      return;
    }

    const newUser: Usuario = {
      id_usuario: `USR-${Date.now()}`,
      nombre_usuario: username.trim().toLowerCase(),
      nombre_completo: fullname.trim(),
      contrasena: password,
      rol: role,
      estado_cuenta: 'Activo',
      fecha_creacion: fechaLocalISO(),
      creado_por: currentUser.nombre_usuario,
    };

    onAddUser(newUser);

    // Reset Form
    setUsername('');
    setFullname('');
    setPassword('');
    setRole('Consulta');
    setFeedback('¡Usuario creado con éxito!');
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
          Configuración / <span className="text-gray-300">Gestión de Personal</span>
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1F2937] gap-4">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 px-1 ${
            activeTab === 'usuarios'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-[#9CA3AF] border-transparent hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Cuentas de Usuario del Sistema
        </button>
        <button
          onClick={() => setActiveTab('medicos')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 px-1 ${
            activeTab === 'medicos'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-[#9CA3AF] border-transparent hover:text-white'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Médicos Prescriptores (Catálogo)
        </button>
        <button
          id="tab-tipos-error"
          onClick={() => setActiveTab('tipos_error')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 px-1 ${
            activeTab === 'tipos_error'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-[#9CA3AF] border-transparent hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Tipos de Error (Clasificación de Hallazgo)
        </button>
      </div>

      {activeTab === 'usuarios' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Add User Form */}
          <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
              <Plus className="w-4 h-4 text-[#3B82F6]" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Registrar Nuevo Usuario</h4>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {feedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    feedback.includes('éxito')
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E]'
                      : 'bg-red-500/10 border border-red-500/20 text-[#EF4444]'
                  }`}
                >
                  {feedback}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">Nombre de Usuario (Login)</label>
                <input
                  id="create-user-username"
                  type="text"
                  placeholder="ej. jgomez01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] placeholder-gray-600 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">Nombre Completo</label>
                <input
                  id="create-user-fullname"
                  type="text"
                  placeholder="ej. Julián Gómez"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] placeholder-gray-600 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">Contraseña Inicial</label>
                <input
                  id="create-user-pwd"
                  type="password"
                  placeholder="Min. 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] placeholder-gray-600 outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">Rol de Usuario</label>
                <select
                  id="create-user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] outline-none"
                >
                  {ROLES_CATALOG.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 italic">
                  * El rol determina los accesos de bandeja y permisos de trazabilidad.
                </p>
              </div>

              <button
                id="submit-create-user-btn"
                type="submit"
                className="w-full py-2 bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white rounded-lg transition"
              >
                Crear Cuenta de Usuario
              </button>
            </form>
          </div>

          {/* Right column: User Directory table */}
          <div className="lg:col-span-2 bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
              <Users className="w-4 h-4 text-[#3B82F6]" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Directorio de Cuentas de Usuario</h4>
            </div>

            <div className="overflow-x-auto">
              <table id="users-directory-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1F2937] text-[#9CA3AF] font-semibold bg-[#1F2937]/20">
                    <th className="p-3">ID / Usuario</th>
                    <th className="p-3">Nombre Completo</th>
                    <th className="p-3">Rol del Sistema</th>
                    <th className="p-3">Estado Cuenta</th>
                    <th className="p-3 text-right">Acciones de Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/40">
                  {users.map((user) => (
                    <tr key={user.id_usuario} className="hover:bg-[#1F2937]/10 transition">
                      <td className="p-3">
                        <span className="block font-mono text-[10px] text-gray-500">{user.id_usuario}</span>
                        <span className="font-semibold text-[#22D3EE] font-mono">{user.nombre_usuario}</span>
                      </td>
                      <td className="p-3 font-semibold text-[#F3F4F6]">{user.nombre_completo}</td>
                      <td className="p-3">
                        <select
                          id={`user-role-select-${user.id_usuario}`}
                          value={user.rol}
                          onChange={(e) => onUpdateUserRole(user.id_usuario, e.target.value as UserRole)}
                          className="bg-[#0B1120] border border-[#1F2937] text-gray-300 px-1.5 py-1 rounded text-[11px] outline-none"
                        >
                          {ROLES_CATALOG.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            user.estado_cuenta === 'Activo'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          {user.estado_cuenta === 'Activo' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {user.estado_cuenta}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {user.nombre_usuario !== 'admin' && (
                          <button
                            id={`toggle-user-status-${user.id_usuario}`}
                            onClick={() =>
                              onUpdateUserStatus(
                                user.id_usuario,
                                user.estado_cuenta === 'Activo' ? 'Inactivo' : 'Activo'
                              )
                            }
                            className={`text-xs px-2.5 py-1 rounded transition border font-semibold ${
                              user.estado_cuenta === 'Activo'
                                ? 'text-red-400 border-red-400/20 hover:bg-red-500/10'
                                : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-500/10'
                            }`}
                          >
                            {user.estado_cuenta === 'Activo' ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'medicos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Add Medico Form */}
          <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
              <Plus className="w-4 h-4 text-[#3B82F6]" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Registrar Nuevo Médico</h4>
            </div>

            <form onSubmit={handleMedicoSubmit} className="space-y-4">
              {medicoFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    medicoFeedback.includes('éxito')
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E]'
                      : 'bg-red-500/10 border border-red-500/20 text-[#EF4444]'
                  }`}
                >
                  {medicoFeedback}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">Nombre Completo del Médico</label>
                <input
                  id="create-medico-name"
                  type="text"
                  placeholder="ej. DRA. CLARA ROJAS"
                  value={medicoName}
                  onChange={(e) => setMedicoName(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] placeholder-gray-600 outline-none uppercase font-sans font-semibold"
                  required
                />
                <p className="text-[10px] text-gray-500 italic">
                  * El nombre se registrará y mostrará en mayúsculas automáticamente.
                </p>
              </div>

              <button
                id="submit-create-medico-btn"
                type="submit"
                className="w-full py-2 bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Médico Prescriptor
              </button>
            </form>
          </div>

          {/* Right column: Medico Directory table */}
          <div className="lg:col-span-2 bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
              <Stethoscope className="w-4 h-4 text-[#3B82F6]" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Catálogo de Médicos Prescriptores Activos</h4>
            </div>

            <div className="overflow-x-auto">
              <table id="medicos-directory-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1F2937] text-[#9CA3AF] font-semibold bg-[#1F2937]/20">
                    <th className="p-3"># No.</th>
                    <th className="p-3">Nombre Completo del Médico Prescriptor</th>
                    <th className="p-3 text-right">Acciones de Catálogo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/40 font-semibold text-[#F3F4F6]">
                  {medicos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-gray-500 italic">
                        No hay médicos registrados en el catálogo.
                      </td>
                    </tr>
                  ) : (
                    medicos.map((med, index) => (
                      <tr key={med} className="hover:bg-[#1F2937]/10 transition">
                        <td className="p-3 font-mono text-gray-500 w-16">{index + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{med}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            id={`delete-medico-${index}`}
                            onClick={() => {
                              if (confirm(`¿Está seguro que desea eliminar al médico ${med}? Ya no aparecerá en las nuevas listas desplegables.`)) {
                                onDeleteMedico(med);
                              }
                            }}
                            className="text-xs px-2.5 py-1 rounded transition border font-semibold text-red-400 border-red-400/20 hover:bg-red-500/10 flex items-center gap-1 ml-auto"
                            title="Eliminar médico de la clínica"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar Médico
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Add Tipo de Error Form */}
          <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
              <Plus className="w-4 h-4 text-[#3B82F6]" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Agregar Tipo de Error</h4>
            </div>

            <form onSubmit={handleTipoSubmit} className="space-y-4">
              {tipoFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    tipoFeedback.includes('éxito')
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E]'
                      : 'bg-red-500/10 border border-red-500/20 text-[#EF4444]'
                  }`}
                >
                  {tipoFeedback}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#9CA3AF]">Nombre del Tipo de Error</label>
                <input
                  id="create-tipo-error-name"
                  type="text"
                  placeholder="ej. Error de duración de tratamiento"
                  value={tipoName}
                  onChange={(e) => setTipoName(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] placeholder-gray-600 outline-none font-sans font-semibold"
                  required
                />
                <p className="text-[10px] text-gray-500 italic">
                  * Aparecerá de inmediato en la lista "Clasificación de Hallazgo" que usa el Químico Farmacéutico al reportar errores.
                </p>
              </div>

              <button
                id="submit-create-tipo-error-btn"
                type="submit"
                className="w-full py-2 bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar a la Clasificación
              </button>
            </form>
          </div>

          {/* Right column: Tipos de Error table */}
          <div className="lg:col-span-2 bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
              <AlertTriangle className="w-4 h-4 text-[#3B82F6]" />
              <h4 className="text-sm font-bold text-[#F3F4F6]">Clasificación de Hallazgo Vigente</h4>
            </div>

            <div className="overflow-x-auto">
              <table id="tipos-error-table" className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1F2937] text-[#9CA3AF] font-semibold bg-[#1F2937]/20">
                    <th className="p-3"># No.</th>
                    <th className="p-3">Tipo de Error / Hallazgo</th>
                    <th className="p-3 text-right">Acciones de Catálogo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/40 font-semibold text-[#F3F4F6]">
                  {tiposError.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-gray-500 italic">
                        No hay tipos de error registrados en la clasificación.
                      </td>
                    </tr>
                  ) : (
                    tiposError.map((tipo, index) => (
                      <tr key={tipo} className="hover:bg-[#1F2937]/10 transition">
                        <td className="p-3 font-mono text-gray-500 w-16">{index + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>{tipo}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            id={`delete-tipo-error-${index}`}
                            onClick={() => {
                              if (confirm(`¿Está seguro que desea eliminar el tipo de error "${tipo}"? Ya no aparecerá en la Clasificación de Hallazgo. Los registros históricos que lo usan no se modifican.`)) {
                                onDeleteTipoError(tipo);
                              }
                            }}
                            className="text-xs px-2.5 py-1 rounded transition border font-semibold text-red-400 border-red-400/20 hover:bg-red-500/10 flex items-center gap-1 ml-auto"
                            title="Eliminar tipo de error de la clasificación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
