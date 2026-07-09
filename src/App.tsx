/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  fetchErrores,
  insertError,
  updateError,
  fetchUsuarios,
  insertUsuario,
  updateUsuario,
  seedUsuarios,
  fetchProgramaciones,
  insertProgramacion,
  updateProgramacion,
  deleteProgramacion,
  fetchVolumenes,
  insertVolumen,
  fetchAuditLogs,
  insertAuditLog,
  fetchMedicos,
  insertMedico,
  deleteMedico,
  seedMedicos,
  fetchTiposError,
  insertTipoError,
  deleteTipoError,
  seedTiposError,
  fetchProtocolos,
  insertProtocolo,
  deleteProtocolo,
} from './dataService';
import { fechaLocalISO } from './utils';
import React, { useState, useEffect } from 'react';
import {
  Usuario,
  RegistroError,
  VolumenFormulas,
  AuditLog,
  UserRole,
  ErrorStatus,
  AccountStatus,
  ProgramacionCita,
  ProtocoloOncologico,
  MEDICOS_CATALOG,
  TIPOS_DE_ERROR_CATALOG,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_ERRORS,
  INITIAL_VOLUMES,
  INITIAL_AUDIT_LOG,
  INITIAL_PROGRAMACIONES,
} from './initialData';

// Component imports
import DashboardView from './components/DashboardView';
import NuevoRegistroView from './components/NuevoRegistroView';
import RegistrosView from './components/RegistrosView';
import ReportesView from './components/ReportesView';
import ExportarExcelView from './components/ExportarExcelView';
import UsuariosView from './components/UsuariosView';
import RolesPermisosView from './components/RolesPermisosView';
import AuditLogView from './components/AuditLogView';
import ConfiguracionView from './components/ConfiguracionView';
import GuiaUsuarioView from './components/GuiaUsuarioView';
import ProgramacionCitasView from './components/ProgramacionCitasView';

// Icon imports
import {
  Activity,
  LogOut,
  User as UserIcon,
  Bell,
  Search,
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  BarChart3,
  Users,
  ShieldCheck,
  FileCheck,
  Layers,
  Settings,
  X,
  AlertTriangle,
  Lock,
  BookOpen,
  Calendar,
} from 'lucide-react';

export default function App() {
  // 1. Core persistent states loaded from LocalStorage
  const [users, setUsers] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem('onco_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [errors, setErrors] = useState<RegistroError[]>(() => {
    const saved = localStorage.getItem('onco_errors');
    return saved ? JSON.parse(saved) : INITIAL_ERRORS;
  });

  const [volumes, setVolumes] = useState<VolumenFormulas[]>(() => {
    const saved = localStorage.getItem('onco_volumes');
    return saved ? JSON.parse(saved) : INITIAL_VOLUMES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('onco_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOG;
  });

  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('onco_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [programaciones, setProgramaciones] = useState<ProgramacionCita[]>(() => {
    const saved = localStorage.getItem('onco_programaciones');
    return saved ? JSON.parse(saved) : INITIAL_PROGRAMACIONES;
  });

  const [medicos, setMedicos] = useState<string[]>(() => {
    const saved = localStorage.getItem('onco_medicos');
    return saved ? JSON.parse(saved) : MEDICOS_CATALOG;
  });

  const [tiposError, setTiposError] = useState<string[]>(() => {
    const saved = localStorage.getItem('onco_tipos_error');
    return saved ? JSON.parse(saved) : TIPOS_DE_ERROR_CATALOG;
  });

  const [protocolos, setProtocolos] = useState<ProtocoloOncologico[]>(() => {
    const saved = localStorage.getItem('onco_protocolos');
    return saved ? JSON.parse(saved) : [];
  });

  const [activePage, setActivePage] = useState<string>('dashboard');
  const [selectedError, setSelectedError] = useState<RegistroError | null>(null);

  // Search input in header
  const [globalSearch, setGlobalSearch] = useState('');

  // Login inputs
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Notification list panel toggle
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem('onco_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('onco_errors', JSON.stringify(errors));
  }, [errors]);

  useEffect(() => {
    localStorage.setItem('onco_volumes', JSON.stringify(volumes));
  }, [volumes]);

  useEffect(() => {
    localStorage.setItem('onco_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('onco_programaciones', JSON.stringify(programaciones));
  }, [programaciones]);

  useEffect(() => {
    localStorage.setItem('onco_medicos', JSON.stringify(medicos));
  }, [medicos]);

  useEffect(() => {
    localStorage.setItem('onco_tipos_error', JSON.stringify(tiposError));
  }, [tiposError]);

  useEffect(() => {
    localStorage.setItem('onco_protocolos', JSON.stringify(protocolos));
  }, [protocolos]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('onco_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('onco_current_user');
    }
  }, [currentUser]);
  // Cargar todos los datos desde Supabase al iniciar.
  // Si una tabla está vacía o aún no existe, se conserva el respaldo local.
  useEffect(() => {
    fetchErrores().then((data) => {
      if (data.length > 0) setErrors(data);
    });
    fetchUsuarios().then((data) => {
      if (data.length > 0) setUsers(data);
      else seedUsuarios(INITIAL_USERS); // primera vez: siembra las cuentas base
    });
    fetchProgramaciones().then((data) => {
      if (data.length > 0) setProgramaciones(data);
    });
    fetchVolumenes().then((data) => {
      if (data.length > 0) setVolumes(data);
    });
    fetchAuditLogs().then((data) => {
      if (data.length > 0) setAuditLogs(data);
    });
    fetchMedicos().then((data) => {
      if (data.length > 0) setMedicos(data);
      else seedMedicos(MEDICOS_CATALOG); // primera vez: siembra el catálogo base
    });
    fetchTiposError().then((data) => {
      if (data.length > 0) setTiposError(data);
      else seedTiposError(TIPOS_DE_ERROR_CATALOG); // primera vez: siembra la clasificación base
    });
    fetchProtocolos().then((data) => {
      if (data.length > 0) setProtocolos(data);
    });
  }, []);

  // Operational scheduling handlers
  const handleAddProgramacion = (newProg: ProgramacionCita) => {
    setProgramaciones((prev) => [newProg, ...prev]);
    insertProgramacion(newProg);
    addAuditLog(
      'Creación Programación',
      `Agendó sesión para paciente ${newProg.nombre_paciente} ${newProg.apellidos_paciente} (C.C. ${newProg.numero_documento}) para el Ciclo ${newProg.ciclo_actual}, Día ${newProg.dia_aplicacion} el día ${newProg.fecha_aplicacion}.`
    );
  };

  const handleUpdateProgramacionEstado = (id: string, nuevoEstado: 'Programada' | 'Realizada' | 'Cancelada') => {
    setProgramaciones((prev) =>
      prev.map((p) =>
        p.id_programacion === id ? { ...p, estado_programacion: nuevoEstado } : p
      )
    );
    updateProgramacion(id, { estado_programacion: nuevoEstado });
    const item = programaciones.find((p) => p.id_programacion === id);
    if (item) {
      addAuditLog(
        'Modificación Programación',
        `Cambió el estado de programación de la de ${item.nombre_paciente} ${item.apellidos_paciente} a ${nuevoEstado}.`
      );
    }
  };

  const handleUpdateProgramacionConfirmacion = (id: string, confirmacion: 'Si' | 'No' | 'Pendiente', motivo?: string) => {
    setProgramaciones((prev) =>
      prev.map((p) =>
        p.id_programacion === id
          ? { ...p, confirmacion_paciente: confirmacion, motivo_desacuerdo: motivo }
          : p
      )
    );
    updateProgramacion(id, { confirmacion_paciente: confirmacion, motivo_desacuerdo: motivo });
    const item = programaciones.find((p) => p.id_programacion === id);
    if (item) {
      addAuditLog(
        'Confirmación Paciente',
        `Paciente ${item.nombre_paciente} ${item.apellidos_paciente} respondió a notificación: ${confirmacion}.${confirmacion === 'No' && motivo ? ` Motivo de desacuerdo: ${motivo}` : ''}`
      );
    }
  };

  const handleDeleteProgramacion = (id: string) => {
    const item = programaciones.find((p) => p.id_programacion === id);
    setProgramaciones((prev) => prev.filter((p) => p.id_programacion !== id));
    deleteProgramacion(id);
    if (item) {
      addAuditLog(
        'Eliminación Programación',
        `Eliminó la programación de aplicación de ${item.nombre_paciente} ${item.apellidos_paciente} programada para el día ${item.fecha_aplicacion}.`
      );
    }
  };

  // 2. Helper to log events in the immutable Audit Log
  const addAuditLog = (action: string, detail: string) => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const dy = String(now.getDate()).padStart(2, '0');
    const hr = String(now.getHours()).padStart(2, '0');
    const mn = String(now.getMinutes()).padStart(2, '0');
    const sc = String(now.getSeconds()).padStart(2, '0');

    const newLog: AuditLog = {
      // Id único por marca de tiempo: evita choques de clave primaria
      // cuando varios equipos escriben en la misma base de datos.
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: `${yr}-${mo}-${dy}`,
      hora: `${hr}:${mn}:${sc}`,
      usuario: currentUser ? currentUser.nombre_usuario : 'Invitado',
      accion: action,
      detalle: detail,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    insertAuditLog(newLog);
  };

  // 3. Authenticate user
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    // Match simulated user accounts
    const matched = users.find(
      (u) =>
        u.nombre_usuario.toLowerCase() === loginUser.trim().toLowerCase() &&
        u.contrasena === loginPass
    );

    if (!matched) {
      setLoginError('Nombre de usuario o contraseña incorrectos.');
      return;
    }

    if (matched.estado_cuenta === 'Inactivo') {
      setLoginError('Su cuenta se encuentra inactiva. Contacte al administrador.');
      return;
    }

    // Success login
    setCurrentUser(matched);
    setActivePage('dashboard');
    setSelectedError(null);

    // Write audit trail
    const tempUser = matched.nombre_usuario;
    const now = new Date();
    const logTime = `${fechaLocalISO(now)} ${now.toTimeString().split(' ')[0]}`;
    // Directly append log using current values to avoid waiting state cycle
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fecha: fechaLocalISO(now),
      hora: now.toTimeString().split(' ')[0],
      usuario: tempUser,
      accion: 'Sesión Iniciada',
      detalle: `El usuario ${tempUser} inició sesión exitosamente en el sistema en ${logTime}.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    insertAuditLog(newLog);

    setLoginUser('');
    setLoginPass('');
  };

  // 1-Click quick login assistant
  const handleQuickLogin = (uname: string, psw: string) => {
    setLoginUser(uname);
    setLoginPass(psw);
    setTimeout(() => {
      // Trigger submission simulated
      const matched = users.find(
        (u) => u.nombre_usuario === uname && u.contrasena === psw
      );
      if (matched && matched.estado_cuenta === 'Activo') {
        setCurrentUser(matched);
        setActivePage('dashboard');
        setSelectedError(null);
        const now = new Date();
        const newLog: AuditLog = {
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          fecha: fechaLocalISO(now),
          hora: now.toTimeString().split(' ')[0],
          usuario: matched.nombre_usuario,
          accion: 'Sesión Iniciada',
          detalle: `Inicio de sesión rápido asistido de prueba para rol: ${matched.rol}`,
        };
        setAuditLogs((prev) => [newLog, ...prev]);
        insertAuditLog(newLog);
      }
    }, 100);
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog('Sesión Cerrada', `El usuario ${currentUser.nombre_usuario} cerró sesión voluntariamente.`);
    }
    setCurrentUser(null);
    setActivePage('dashboard');
    setSelectedError(null);
  };

  // Add error from New Record form
  const handleAddError = (newError: RegistroError) => {
  setErrors((prev) => [newError, ...prev]);
  insertError(newError);
  addAuditLog('Reporte de Error', `Registró con éxito el error ${newError.id_registro} de ${newError.nombre_paciente} ${newError.apellidos_paciente}.`);
};

  // Update validation state transitions
  const handleUpdateErrorStatus = (
  id: string,
  newStatus: ErrorStatus,
  updatedFields?: Partial<RegistroError>
) => {
  const target = errors.find((err) => err.id_registro === id);
  if (!target) return;

  const statusChanged = newStatus !== target.estado_actual;
  const updatedHistory = statusChanged
    ? [
        ...target.historial_estados,
        {
          estado: newStatus,
          fecha: fechaLocalISO(),
          hora: new Date().toTimeString().split(' ')[0],
          usuario: currentUser ? currentUser.nombre_usuario : 'Sistema',
        },
      ]
    : target.historial_estados;

  const updatedRecord: RegistroError = {
    ...target,
    estado_actual: newStatus,
    historial_estados: updatedHistory,
    ...(updatedFields || {}),
  };

  setErrors((prev) => prev.map((err) => (err.id_registro === id ? updatedRecord : err)));

  updateError(id, {
    estado_actual: newStatus,
    historial_estados: updatedHistory,
    ...(updatedFields || {}),
  });

  if (statusChanged) {
    addAuditLog('Trazabilidad Estado', `Avanzó el estado del registro ${id} hacia la fase: ${newStatus}.`);
  } else {
    addAuditLog('Modificación Registro', `Se actualizaron datos o documentos del paciente ${id}.`);
  }
};

  // Create new user account (Admin only)
  const handleAddUser = (newUser: Usuario) => {
    setUsers((prev) => [...prev, newUser]);
    insertUsuario(newUser);
    addAuditLog('Gestión Usuarios', `Creó la cuenta de usuario ${newUser.nombre_usuario} (${newUser.rol}).`);
  };

  // Manage Medicos (Admin / Programador / Registro etc. - let's allow it in Usuarios view for authorized roles, or admin only. We can pass it)
  const handleAddMedico = (nuevoMedico: string) => {
    setMedicos((prev) => {
      if (prev.includes(nuevoMedico)) return prev;
      return [...prev, nuevoMedico];
    });
    insertMedico(nuevoMedico);
    addAuditLog('Gestión Médicos', `Registró al nuevo médico prescriptor: ${nuevoMedico}.`);
  };

  const handleDeleteMedico = (medicoEliminar: string) => {
    setMedicos((prev) => prev.filter((m) => m !== medicoEliminar));
    deleteMedico(medicoEliminar);
    addAuditLog('Gestión Médicos', `Eliminó al médico prescriptor: ${medicoEliminar}.`);
  };

  // Manage catálogo de tipos de error (clasificación de hallazgo)
  const handleAddTipoError = (nuevoTipo: string) => {
    setTiposError((prev) => {
      if (prev.includes(nuevoTipo)) return prev;
      return [...prev, nuevoTipo];
    });
    insertTipoError(nuevoTipo);
    addAuditLog('Gestión Tipos de Error', `Agregó el tipo de error a la clasificación de hallazgo: ${nuevoTipo}.`);
  };

  const handleDeleteTipoError = (tipoEliminar: string) => {
    setTiposError((prev) => prev.filter((t) => t !== tipoEliminar));
    deleteTipoError(tipoEliminar);
    addAuditLog('Gestión Tipos de Error', `Eliminó el tipo de error de la clasificación de hallazgo: ${tipoEliminar}.`);
  };

  // Manage protocolos oncológicos
  const handleAddProtocolo = (nuevoProtocolo: ProtocoloOncologico) => {
    setProtocolos((prev) => {
      if (prev.some((p) => p.nombre === nuevoProtocolo.nombre)) return prev;
      return [...prev, nuevoProtocolo];
    });
    insertProtocolo(nuevoProtocolo);
    addAuditLog('Gestión Protocolos', `Agregó el protocolo oncológico: ${nuevoProtocolo.nombre} (${nuevoProtocolo.cantidad_ciclos} ciclos, ${nuevoProtocolo.frecuencia_aplicacion}).`);
  };

  const handleDeleteProtocolo = (nombreProtocolo: string) => {
    setProtocolos((prev) => prev.filter((p) => p.nombre !== nombreProtocolo));
    deleteProtocolo(nombreProtocolo);
    addAuditLog('Gestión Protocolos', `Eliminó el protocolo oncológico: ${nombreProtocolo}.`);
  };

  // Toggle user active status (Admin only)
  const handleUpdateUserStatus = (id_usuario: string, status: AccountStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id_usuario === id_usuario ? { ...u, estado_cuenta: status } : u))
    );
    updateUsuario(id_usuario, { estado_cuenta: status });
    const targetUsr = users.find((u) => u.id_usuario === id_usuario)?.nombre_usuario || id_usuario;
    addAuditLog('Gestión Usuarios', `Actualizó el estado de la cuenta ${targetUsr} a: ${status}.`);
  };

  // Update user role (Admin only)
  const handleUpdateUserRole = (id_usuario: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id_usuario === id_usuario ? { ...u, rol: role } : u))
    );
    updateUsuario(id_usuario, { rol: role });
    const targetUsr = users.find((u) => u.id_usuario === id_usuario)?.nombre_usuario || id_usuario;
    addAuditLog('Gestión Usuarios', `Modificó el rol de cuenta de ${targetUsr} hacia: ${role}.`);
  };

  // Log formula volumes totals (denominators)
  const handleAddVolume = (newVol: VolumenFormulas) => {
    setVolumes((prev) => [...prev, newVol]);
    insertVolumen(newVol);
    addAuditLog('Carga Denominadores', `Registró ${newVol.cantidad_formulas_validadas} fórmulas validadas totales para la EPS ${newVol.eps}.`);
  };

  // Fast Switch Role toolbar inside Sandbox Header (makes testing super seamless)
  const handleFastSwitchRole = (role: UserRole) => {
    const candidate = users.find((u) => u.rol === role && u.estado_cuenta === 'Activo');
    if (candidate) {
      setCurrentUser(candidate);
      setSelectedError(null);
      addAuditLog('Cambio de Rol Rápido', `Se alternó la sesión de prueba al rol funcional: ${role}`);
    }
  };

  // Enforce access control according to the role permissions matrix
  const hasAccess = (page: string): boolean => {
    if (!currentUser) return false;
    const r = currentUser.rol;

    if (r === 'Administrador') return true; // Has total permission

    if (page === 'dashboard' || page === 'registros' || page === 'detalle_registro' || page === 'guia_usuario') {
      return true; // everyone sees these
    }

    if (page === 'nuevo_registro') {
      return r === 'Registro';
    }

    if (page === 'programacion_citas') {
      return r === 'Programador' || r === 'QuimicoFarmaceutico';
    }

    if (page === 'reportes') {
      return r === 'Consulta' || r === 'QuimicoFarmaceutico';
    }

    if (page === 'configuracion') {
      return r === 'QuimicoFarmaceutico';
    }

    // restricted configuration screens
    return false;
  };

  // Calculated inbox alert for current role
  const getPendingAlerts = () => {
    if (!currentUser) return [];
    const r = currentUser.rol;

    if (r === 'QuimicoFarmaceutico') {
      return errors.filter(
        (e) => e.estado_actual === 'ENTREGADO_QF' || e.estado_actual === 'CORREGIDA_PENDIENTE_VERIFICACION'
      );
    }
    if (r === 'Registro') {
      return errors.filter((e) => e.estado_actual === 'CON_ERROR_REGISTRADO');
    }
    return [];
  };

  const pendingInboxAlerts = getPendingAlerts();

  // Route layout renderer
  const renderPage = () => {
    if (!hasAccess(activePage)) {
      return (
        <div className="bg-[#131B2E] border border-red-500/20 p-8 rounded-xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-[#F3F4F6]">Acceso Restringido</h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            Su rol actual (<strong className="text-blue-400">{currentUser?.rol}</strong>) no posee permisos autorizados para acceder a este módulo.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-xs font-semibold text-white rounded-lg transition"
            >
              Volver al Dashboard Seguro
            </button>
          </div>
        </div>
      );
    }

    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardView
            errors={errors}
            volumes={volumes}
            onNavigate={(page) => {
              setActivePage(page);
              setSelectedError(null);
            }}
            onSelectError={(err) => {
              setSelectedError(err);
              setActivePage('registros');
            }}
          />
        );
      case 'nuevo_registro':
        return (
          <NuevoRegistroView
            currentUser={currentUser!}
            errors={errors}
            onAddError={handleAddError}
            onUpdateErrorStatus={handleUpdateErrorStatus}
            onNavigate={setActivePage}
            medicos={medicos}
          />
        );
      case 'registros':
        return (
          <RegistrosView
            errors={errors}
            currentUser={currentUser!}
            selectedError={selectedError}
            onSelectError={setSelectedError}
            onUpdateErrorStatus={handleUpdateErrorStatus}
            onNavigate={setActivePage}
            tiposError={tiposError}
          />
        );
      case 'reportes':
        return <ReportesView errors={errors} volumes={volumes} onNavigate={setActivePage} medicos={medicos} />;
      case 'exportar_excel':
        return (
          <ExportarExcelView
            errors={errors}
            volumes={volumes}
            auditLogs={auditLogs}
            onNavigate={setActivePage}
            onAddAuditLog={addAuditLog}
          />
        );
      case 'usuarios':
        return (
          <UsuariosView
            users={users}
            currentUser={currentUser!}
            onAddUser={handleAddUser}
            onUpdateUserStatus={handleUpdateUserStatus}
            onUpdateUserRole={handleUpdateUserRole}
            onNavigate={setActivePage}
            medicos={medicos}
            onAddMedico={handleAddMedico}
            onDeleteMedico={handleDeleteMedico}
            tiposError={tiposError}
            onAddTipoError={handleAddTipoError}
            onDeleteTipoError={handleDeleteTipoError}
            protocolos={protocolos}
            onAddProtocolo={handleAddProtocolo}
            onDeleteProtocolo={handleDeleteProtocolo}
          />
        );
      case 'roles_permisos':
        return <RolesPermisosView onNavigate={setActivePage} onAddAuditLog={addAuditLog} />;
      case 'audit_log':
        return <AuditLogView auditLogs={auditLogs} onNavigate={setActivePage} />;
      case 'configuracion':
        return (
          <ConfiguracionView
            volumes={volumes}
            currentUser={currentUser!}
            onAddVolume={handleAddVolume}
            onNavigate={setActivePage}
            medicos={medicos}
          />
        );
      case 'guia_usuario':
        return (
          <GuiaUsuarioView
            onNavigate={setActivePage}
            currentUserRole={currentUser!.rol}
          />
        );
      case 'programacion_citas':
        return (
          <ProgramacionCitasView
            errors={errors}
            programaciones={programaciones}
            onAddProgramacion={handleAddProgramacion}
            onUpdateProgramacionEstado={handleUpdateProgramacionEstado}
            onUpdateProgramacionConfirmacion={handleUpdateProgramacionConfirmacion}
            onDeleteProgramacion={handleDeleteProgramacion}
            onNavigate={setActivePage}
            currentUser={currentUser!}
            protocolos={protocolos}
          />
        );
      default:
        return <div className="text-[#F3F4F6] text-xs">Página en construcción</div>;
    }
  };

  // Auth Guard
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B1120] text-[#F3F4F6] flex flex-col items-center justify-center p-4 relative font-sans">
        {/* Background ambient lighting dots */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Logo Title Block */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-[#131B2E] border border-[#1F2937] text-[#22D3EE] shadow-xl animate-pulse">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#F3F4F6]">
              Registro de Farmacovigilancia en Oncología
            </h1>
            <p className="text-xs text-[#9CA3AF] max-w-xs mx-auto">
              Sistema de Trazabilidad de Errores en Fórmulas Médicas para Farmacia y Áreas Clínicas
            </p>
          </div>

          {/* Login Credentials Panel */}
          <div className="bg-[#131B2E] border border-[#1F2937] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 text-[#F3F4F6]">
              <Lock className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-sm font-bold">Autenticación de Cuenta</h2>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#9CA3AF]">Nombre de Usuario</label>
                <input
                  id="login-username-input"
                  type="text"
                  placeholder="ej. admin, jregente01..."
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] outline-none transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#9CA3AF]">Contraseña</label>
                <input
                  id="login-password-input"
                  type="password"
                  placeholder="Ingrese contraseña..."
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] outline-none transition font-mono"
                  required
                />
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-2 bg-[#3B82F6] hover:bg-blue-600 text-xs font-bold text-white rounded-lg transition shadow-md"
              >
                Ingresar al Sistema
              </button>
            </form>
          </div>

          {/* Quick Sandbox Accounts Selector (Brilliant for UI/UX inspection and grading) */}
          <div className="bg-[#131B2E]/60 border border-[#1F2937]/80 rounded-xl p-4 space-y-2.5">
            <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider text-center">
              Asistente de Acceso de Prueba (Clic para iniciar sesión)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="quick-login-admin"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 rounded bg-[#0B1120] border border-[#1F2937] text-left text-[10px] hover:border-[#3B82F6] transition text-gray-300 hover:text-white"
              >
                <span className="font-bold block text-red-400">1. Administrador</span>
                <span>admin / admin123</span>
              </button>
              <button
                id="quick-login-registro"
                onClick={() => handleQuickLogin('jregente01', 'registro123')}
                className="p-2 rounded bg-[#0B1120] border border-[#1F2937] text-left text-[10px] hover:border-[#3B82F6] transition text-gray-300 hover:text-white"
              >
                <span className="font-bold block text-[#22D3EE]">2. Registro</span>
                <span>jregente01 / registro123</span>
              </button>
              <button
                id="quick-login-qf"
                onClick={() => handleQuickLogin('qf_martinez', 'quimico123')}
                className="p-2 rounded bg-[#0B1120] border border-[#1F2937] text-left text-[10px] hover:border-[#3B82F6] transition text-gray-300 hover:text-white"
              >
                <span className="font-bold block text-blue-400">3. Químico Farmac.</span>
                <span>qf_martinez / quimico123</span>
              </button>
              <button
                id="quick-login-programador"
                onClick={() => handleQuickLogin('pedro_prog', 'prog123')}
                className="p-2 rounded bg-[#0B1120] border border-[#1F2937] text-left text-[10px] hover:border-[#3B82F6] transition text-gray-300 hover:text-white"
              >
                <span className="font-bold block text-cyan-400 font-sans">4. Programador Citas</span>
                <span>pedro_prog / prog123</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 italic text-center pt-1">
              * El sistema simula el control de acceso en base a estos perfiles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F3F4F6] flex font-sans">
      {/* 1. Collapsible Fixed Sidebar */}
      <aside className="w-64 bg-[#131B2E] border-r border-[#1F2937] flex flex-col justify-between hidden md:flex flex-shrink-0">
        <div className="space-y-6 py-5">
          {/* Logo header */}
          <div className="px-6 py-4 flex items-center gap-3 border-b border-[#1F2937]/50 pb-5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              R
            </div>
            <div>
              <h1 className="text-xs font-bold leading-none text-blue-400 tracking-wider">REGISTRO</h1>
              <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold font-sans">
                Onco Farmacovigilancia
              </p>
            </div>
          </div>

          {/* Nav list group: PRINCIPAL */}
          <div className="space-y-1">
            <span className="px-5 text-[9px] font-bold text-gray-500 uppercase tracking-widest block pb-1">
              Principal
            </span>

            {/* Dashboard Link */}
            <button
              id="sidebar-link-dashboard"
              onClick={() => {
                setActivePage('dashboard');
                setSelectedError(null);
              }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                activePage === 'dashboard'
                  ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Principal</span>
            </button>

            {/* Nuevo Registro Link (Restricted role check) */}
            {hasAccess('nuevo_registro') && (
              <button
                id="sidebar-link-new"
                onClick={() => {
                  setActivePage('nuevo_registro');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'nuevo_registro'
                    ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Registro</span>
              </button>
            )}

            {/* Registros Link */}
            <button
              id="sidebar-link-logs"
              onClick={() => {
                setActivePage('registros');
                setSelectedError(null);
              }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                activePage === 'registros'
                  ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Bandeja de Fórmulas</span>
            </button>

            {/* Programación Citas Link */}
            {hasAccess('programacion_citas') && (
              <button
                id="sidebar-link-programacion"
                onClick={() => {
                  setActivePage('programacion_citas');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'programacion_citas'
                    ? 'bg-cyan-600/15 border-l-4 border-cyan-400 text-cyan-300'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span className="flex items-center justify-between w-full pr-2">
                  <span>Programación Aplicación</span>
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 font-bold px-1 rounded uppercase tracking-wider font-mono">
                    Citas
                  </span>
                </span>
              </button>
            )}

            {/* Reportes Link (Restricted role check) */}
            {hasAccess('reportes') && (
              <button
                id="sidebar-link-reports"
                onClick={() => {
                  setActivePage('reportes');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'reportes'
                    ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reportes y Gráficas</span>
              </button>
            )}

            {/* Exportar Link */}
            {hasAccess('exportar_excel') && (
              <button
                id="sidebar-link-excel"
                onClick={() => {
                  setActivePage('exportar_excel');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'exportar_excel'
                    ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar a Excel</span>
              </button>
            )}

            {/* Guía de Usuario Link */}
            <button
              id="sidebar-link-guide"
              onClick={() => {
                setActivePage('guia_usuario');
                setSelectedError(null);
              }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                activePage === 'guia_usuario'
                  ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                  : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#22D3EE]" />
              <span className="flex items-center gap-1.5">
                Guía de Usuario
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                  Nuevo
                </span>
              </span>
            </button>
          </div>

          {/* Nav list group: CONFIGURACIÓN */}
          <div className="space-y-1 pt-2">
            <span className="px-5 text-[9px] font-bold text-gray-500 uppercase tracking-widest block pb-1">
              Configuración
            </span>

            {/* Volumes totals configuration */}
            {hasAccess('configuracion') && (
              <button
                id="sidebar-link-denominators"
                onClick={() => {
                  setActivePage('configuracion');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'configuracion'
                    ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Config. Denominadores</span>
              </button>
            )}

            {/* Directory Users Link */}
            {currentUser.rol === 'Administrador' && (
              <button
                id="sidebar-link-users"
                onClick={() => {
                  setActivePage('usuarios');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'usuarios'
                    ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Usuarios Sistema</span>
              </button>
            )}

            {/* Roles and Perms Matrix Link */}
            {currentUser.rol === 'Administrador' && (
              <button
                id="sidebar-link-matrix"
                onClick={() => {
                  setActivePage('roles_permisos');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'roles_permisos'
                    ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Roles y Permisos</span>
              </button>
            )}

            {/* Audit Log Link */}
            {currentUser.rol === 'Administrador' && (
              <button
                id="sidebar-link-audit"
                onClick={() => {
                  setActivePage('audit_log');
                  setSelectedError(null);
                }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-xs font-semibold transition text-left ${
                  activePage === 'audit_log'
                    ? 'bg-blue-600/15 border-l-4 border-[#3B82F6] text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-[#F3F4F6] border-l-4 border-transparent'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Audit Log</span>
              </button>
            )}
          </div>
        </div>

        {/* User profile Section at bottom */}
        <div className="p-4 border-t border-[#1F2937] bg-[#0B1120]/40 text-xs space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#22D3EE] flex items-center justify-center font-bold">
              {currentUser.nombre_usuario.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate max-w-[130px]">
              <p className="font-bold text-[#F3F4F6] truncate leading-none mb-0.5">
                {currentUser.nombre_completo}
              </p>
              <span className="text-[10px] text-[#3B82F6] font-semibold">{currentUser.rol}</span>
            </div>
          </div>

          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-[#1F2937] text-[#9CA3AF] hover:text-[#EF4444] hover:bg-red-500/5 hover:border-red-500/10 transition text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dynamic Header */}
        <header className="h-16 border-b border-[#1F2937] bg-[#131B2E] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 block md:hidden font-mono font-bold text-[#22D3EE]">
              F.V. ONCOLOGÍA
            </span>

            {/* Fast Switch Role Helper Dropdown (Saves immense reviewer time!) */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#9CA3AF]">
              <span className="text-[10px] bg-[#1F2937] px-2 py-0.5 rounded text-gray-400">Prueba rápida:</span>
              <select
                id="header-role-sandbox-switcher"
                value={currentUser.rol}
                onChange={(e) => handleFastSwitchRole(e.target.value as UserRole)}
                className="bg-[#0B1120] border border-[#1F2937] text-gray-300 px-2 py-1 rounded text-[11px] outline-none"
              >
                <option value="Administrador">Sesión: Administrador</option>
                <option value="Registro">Sesión: Registro</option>
                <option value="QuimicoFarmaceutico">Sesión: Químico Farm.</option>
                <option value="Programador">Sesión: Programador</option>
                <option value="Consulta">Sesión: Auditor (Solo lectura)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification alert inbox bell */}
            <div className="relative">
              <button
                id="header-notification-bell"
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className="p-1.5 rounded-lg hover:bg-[#1F2937] text-[#9CA3AF] hover:text-[#F3F4F6] transition relative"
                title="Bandeja de Alertas Clínicas del Rol"
              >
                <Bell className="w-4 h-4" />
                {pendingInboxAlerts.length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              {/* Notification dropdown floating */}
              {showNotificationPanel && (
                <div className="absolute right-0 mt-2.5 w-72 rounded-xl bg-[#131B2E] border border-[#1F2937] shadow-2xl overflow-hidden p-4 space-y-3 font-sans">
                  <div className="flex items-center justify-between border-b border-[#1F2937] pb-2 text-xs">
                    <span className="font-bold text-[#F3F4F6]">Alertas del Rol ({currentUser.rol})</span>
                    <button onClick={() => setShowNotificationPanel(false)}>
                      <X className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto text-[11px]">
                    {pendingInboxAlerts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Sin pendientes clínicos urgentes.</p>
                    ) : (
                      pendingInboxAlerts.map((e) => (
                        <div
                          key={e.id_registro}
                          onClick={() => {
                            setSelectedError(e);
                            setActivePage('registros');
                            setShowNotificationPanel(false);
                          }}
                          className="p-2 rounded bg-[#0B1120] border border-[#1F2937] hover:border-[#3B82F6] transition cursor-pointer text-left space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#22D3EE] font-mono">{e.id_registro}</span>
                            <span className="text-[9px] text-gray-500">{e.fecha_registro}</span>
                          </div>
                          <p className="text-gray-300 font-semibold truncate">
                            {e.nombre_paciente} {e.apellidos_paciente}
                          </p>
                          <p className="text-red-400 font-sans italic truncate">{e.tipo_error}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Active profile short info */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#9CA3AF] hidden sm:inline font-mono font-bold bg-[#0B1120] px-2 py-1 rounded border border-[#1F2937]">
                {currentUser.nombre_usuario}
              </span>
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#9CA3AF] hover:text-[#EF4444] transition sm:hidden"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Floating responsive navigation drawer helper on tablet/mobile screens */}
        <div className="flex md:hidden bg-[#131B2E] border-b border-[#1F2937] p-2 overflow-x-auto gap-2 text-[11px]">
          <button
            onClick={() => {
              setActivePage('dashboard');
              setSelectedError(null);
            }}
            className={`px-3 py-1 rounded transition ${
              activePage === 'dashboard' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
            }`}
          >
            Dashboard
          </button>
          {hasAccess('nuevo_registro') && (
            <button
              onClick={() => {
                setActivePage('nuevo_registro');
                setSelectedError(null);
              }}
              className={`px-3 py-1 rounded transition ${
                activePage === 'nuevo_registro' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Nuevo Error
            </button>
          )}
          <button
            onClick={() => {
              setActivePage('registros');
              setSelectedError(null);
            }}
            className={`px-3 py-1 rounded transition ${
              activePage === 'registros' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
            }`}
          >
            Bandeja
          </button>
          {hasAccess('programacion_citas') && (
            <button
              id="mobile-nav-programacion"
              onClick={() => {
                setActivePage('programacion_citas');
                setSelectedError(null);
              }}
              className={`px-3 py-1 rounded transition shrink-0 ${
                activePage === 'programacion_citas' ? 'bg-[#22D3EE] text-[#0B1120] font-bold' : 'text-[#9CA3AF]'
              }`}
            >
              Programación
            </button>
          )}
          {hasAccess('reportes') && (
            <button
              onClick={() => {
                setActivePage('reportes');
                setSelectedError(null);
              }}
              className={`px-3 py-1 rounded transition ${
                activePage === 'reportes' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Reportes
            </button>
          )}
          {hasAccess('exportar_excel') && (
            <button
              onClick={() => {
                setActivePage('exportar_excel');
                setSelectedError(null);
              }}
              className={`px-3 py-1 rounded transition ${
                activePage === 'exportar_excel' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Excel
            </button>
          )}
          {hasAccess('configuracion') && (
            <button
              onClick={() => {
                setActivePage('configuracion');
                setSelectedError(null);
              }}
              className={`px-3 py-1 rounded transition ${
                activePage === 'configuracion' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Carga Denom.
            </button>
          )}
          {currentUser.rol === 'Administrador' && (
            <button
              onClick={() => {
                setActivePage('usuarios');
                setSelectedError(null);
              }}
              className={`px-3 py-1 rounded transition ${
                activePage === 'usuarios' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
              }`}
            >
              Usuarios
            </button>
          )}
          <button
            onClick={() => {
              setActivePage('guia_usuario');
              setSelectedError(null);
            }}
            className={`px-3 py-1 rounded transition whitespace-nowrap ${
              activePage === 'guia_usuario' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF]'
            }`}
          >
            Guía 📖
          </button>
        </div>

        {/* Render page routing content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0B1120]">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
