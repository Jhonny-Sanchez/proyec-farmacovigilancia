/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Usuario, RegistroError, VolumenFormulas, AuditLog, ProgramacionCita } from './types';

export const INITIAL_USERS: Usuario[] = [
  {
    id_usuario: 'USR-001',
    nombre_usuario: 'admin',
    nombre_completo: 'Dra. Elena Rostova (Administrador)',
    contrasena: 'admin123',
    rol: 'Administrador',
    estado_cuenta: 'Activo',
    fecha_creacion: '2026-01-15',
    creado_por: 'Sistema',
  },
  {
    id_usuario: 'USR-002',
    nombre_usuario: 'jregente01',
    nombre_completo: 'José Luis Regente (Aux. de Registro)',
    contrasena: 'registro123',
    rol: 'Registro',
    estado_cuenta: 'Activo',
    fecha_creacion: '2026-02-10',
    creado_por: 'admin',
  },
  {
    id_usuario: 'USR-003',
    nombre_usuario: 'qf_martinez',
    nombre_completo: 'Dr. Carlos Martínez (Químico Farmacéutico)',
    contrasena: 'quimico123',
    rol: 'QuimicoFarmaceutico',
    estado_cuenta: 'Activo',
    fecha_creacion: '2026-03-01',
    creado_por: 'admin',
  },
  {
    id_usuario: 'USR-006',
    nombre_usuario: 'auditor_externo',
    nombre_completo: 'Auditor de Calidad (Solo Consulta)',
    contrasena: 'consulta123',
    rol: 'Consulta',
    estado_cuenta: 'Activo',
    fecha_creacion: '2026-04-10',
    creado_por: 'admin',
  },
  {
    id_usuario: 'USR-007',
    nombre_usuario: 'pedro_prog',
    nombre_completo: 'Pedro Programador (Área de Programación)',
    contrasena: 'prog123',
    rol: 'Programador',
    estado_cuenta: 'Activo',
    fecha_creacion: '2026-05-12',
    creado_por: 'admin',
  },
];

export const INITIAL_ERRORS: RegistroError[] = [
  {
    id_registro: 'ERR-2026-000123',
    fecha_registro: '2026-06-25',
    hora_registro: '09:42:15',
    usuario_registro: 'jregente01',
    nombre_paciente: 'María',
    apellidos_paciente: 'González López',
    numero_documento: '1032456789',
    eps: 'NUEVA EPS',
    medico: 'CARLOS BUITRAGO',
    tipo_error: 'Error de dosis',
    origen_formula: 'Sala de Quimioterapia',
    observaciones: 'Dosis prescrita supera el máximo calculado por superficie corporal (150mg vs 120mg indicado).',
    estado_actual: 'ENTREGADO_PROGRAMACION',
    historial_estados: [
      { estado: 'ENTREGADO_QF', fecha: '2026-06-25', hora: '09:42:15', usuario: 'jregente01' },
      { estado: 'CON_ERROR_REGISTRADO', fecha: '2026-06-25', hora: '10:15:30', usuario: 'qf_martinez' },
      { estado: 'CORREGIDA_PENDIENTE_VERIFICACION', fecha: '2026-06-25', hora: '11:00:00', usuario: 'jregente01' },
      { estado: 'ENTREGADO_PROGRAMACION', fecha: '2026-06-25', hora: '14:20:10', usuario: 'qf_martinez' }
    ],
    historia_clinica: [
      { id_documento: 'DOC-123-1', nombre_archivo: 'historia_clinica_maria_gonzalez.pdf', tamano: '1.4 MB', fecha_carga: '2026-06-25', cargado_por: 'jregente01', notas: 'Historia clínica inicial de la paciente con diagnóstico de Ca de Mama.' }
    ],
    politerapia_monoterapia: [
      { id_documento: 'DOC-123-2', nombre_archivo: 'politerapia_esquema_mama.pdf', tamano: '0.8 MB', fecha_carga: '2026-06-25', cargado_por: 'jregente01', notas: 'Esquema de politerapia oncológica aprobado por protocolo.' }
    ],
    formula_medica: [
      { id_documento: 'DOC-123-3', nombre_archivo: 'formula_medica_inicial.pdf', tamano: '1.1 MB', fecha_carga: '2026-06-25', cargado_por: 'jregente01', notas: 'Fórmula médica original con error en dosis.' },
      { id_documento: 'DOC-123-3-C', nombre_archivo: 'formula_medica_CORREGIDA.pdf', tamano: '1.1 MB', fecha_carga: '2026-06-25', cargado_por: 'jregente01', notas: 'Fórmula médica con dosis corregida a 120mg según indicación.', es_correccion: true }
    ],
    consentimiento_informado: [
      { id_documento: 'DOC-123-4', nombre_archivo: 'consentimiento_informado_firmado.pdf', tamano: '2.3 MB', fecha_carga: '2026-06-25', cargado_por: 'jregente01', notas: 'Consentimiento informado firmado por la paciente y testigo.' }
    ],
    resultados_laboratorio: [],
    resultados_imagenes: [],
    autorizacion_eps: [],
    otros_documentos: []
  },
  {
    id_registro: 'ERR-2026-000124',
    fecha_registro: '2026-06-26',
    hora_registro: '11:20:00',
    usuario_registro: 'jregente01',
    nombre_paciente: 'Carlos Mario',
    apellidos_paciente: 'Restrepo Vélez',
    numero_documento: '71234890',
    eps: 'FAMISANAR',
    medico: 'LUIS BAEZ',
    tipo_error: 'Error de frecuencia',
    origen_formula: 'Consulta Externa',
    observaciones: 'Se indicó infusión cada 12 horas en lugar de cada 24 horas según protocolo estándar de Rituximab.',
    estado_actual: 'ENTREGADO_PROGRAMACION',
    historial_estados: [
      { estado: 'ENTREGADO_QF', fecha: '2026-06-26', hora: '11:20:00', usuario: 'jregente01' },
      { estado: 'CON_ERROR_REGISTRADO', fecha: '2026-06-26', hora: '12:05:12', usuario: 'qf_martinez' },
      { estado: 'CORREGIDA_PENDIENTE_VERIFICACION', fecha: '2026-06-26', hora: '14:00:00', usuario: 'jregente01' },
      { estado: 'ENTREGADO_PROGRAMACION', fecha: '2026-06-26', hora: '16:45:00', usuario: 'qf_martinez' }
    ],
    historia_clinica: [
      { id_documento: 'DOC-124-1', nombre_archivo: 'historia_clinica_carlos_restrepo.pdf', tamano: '2.1 MB', fecha_carga: '2026-06-26', cargado_por: 'jregente01', notas: 'Historia clínica de consulta externa.' }
    ],
    politerapia_monoterapia: [
      { id_documento: 'DOC-124-2', nombre_archivo: 'esquema_rituximab_monoterapia.pdf', tamano: '0.9 MB', fecha_carga: '2026-06-26', cargado_por: 'jregente01', notas: 'Monoterapia Rituximab indicada por oncólogo.' }
    ],
    formula_medica: [
      { id_documento: 'DOC-124-3', nombre_archivo: 'formula_rituximab_erronea.pdf', tamano: '1.2 MB', fecha_carga: '2026-06-26', cargado_por: 'jregente01', notas: 'Fórmula errónea cada 12 horas.' },
      { id_documento: 'DOC-124-3-C', nombre_archivo: 'formula_rituximab_CORREGIDA.pdf', tamano: '1.2 MB', fecha_carga: '2026-06-26', cargado_por: 'jregente01', notas: 'Fórmula corregida a aplicación cada 24 horas.', es_correccion: true }
    ],
    consentimiento_informado: [
      { id_documento: 'DOC-124-4', nombre_archivo: 'consentimiento_rituximab.pdf', tamano: '1.9 MB', fecha_carga: '2026-06-26', cargado_por: 'jregente01', notas: 'Consentimiento para terapia biológica.' }
    ],
    resultados_laboratorio: [],
    resultados_imagenes: [],
    autorizacion_eps: [],
    otros_documentos: []
  },
  {
    id_registro: 'ERR-2026-000125',
    fecha_registro: '2026-06-27',
    hora_registro: '14:15:44',
    usuario_registro: 'admin',
    nombre_paciente: 'Ana Milena',
    apellidos_paciente: 'Suárez Castro',
    numero_documento: '52498712',
    eps: 'CAPITAL SALUD',
    medico: 'GREGORIO MALDONADO',
    tipo_error: 'Falta de MIPRES',
    origen_formula: 'Consulta Externa',
    observaciones: 'Medicamento regulado sin el respectivo código MIPRES en la formulación de consulta externa.',
    estado_actual: 'CON_ERROR_REGISTRADO',
    historial_estados: [
      { estado: 'ENTREGADO_QF', fecha: '2026-06-27', hora: '14:15:44', usuario: 'admin' },
      { estado: 'CON_ERROR_REGISTRADO', fecha: '2026-06-27', hora: '15:30:10', usuario: 'qf_martinez' }
    ],
    historia_clinica: [
      { id_documento: 'DOC-125-1', nombre_archivo: 'historia_clinica_ana_suarez.pdf', tamano: '1.7 MB', fecha_carga: '2026-06-27', cargado_por: 'admin', notas: 'Historia clínica cargada por administración.' }
    ],
    politerapia_monoterapia: [
      { id_documento: 'DOC-125-2', nombre_archivo: 'esquema_quimio_coadyuvante.pdf', tamano: '1.1 MB', fecha_carga: '2026-06-27', cargado_por: 'admin', notas: 'Detalle de medicamentos complementarios.' }
    ],
    formula_medica: [
      { id_documento: 'DOC-125-3', nombre_archivo: 'formula_medica_sin_mipres.pdf', tamano: '1.0 MB', fecha_carga: '2026-06-27', cargado_por: 'admin', notas: 'Fórmula médica carente de código MIPRES.' }
    ],
    consentimiento_informado: [
      { id_documento: 'DOC-125-4', nombre_archivo: 'consentimiento_terapia_firmado.pdf', tamano: '2.0 MB', fecha_carga: '2026-06-27', cargado_por: 'admin', notas: 'Consentimiento legal de tratamiento.' }
    ],
    resultados_laboratorio: [],
    resultados_imagenes: [],
    autorizacion_eps: [],
    otros_documentos: []
  },
  {
    id_registro: 'ERR-2026-000126',
    fecha_registro: '2026-06-28',
    hora_registro: '08:10:05',
    usuario_registro: 'jregente01',
    nombre_paciente: 'Pedro Julio',
    apellidos_paciente: 'Ramírez Ortiz',
    numero_documento: '19456123',
    eps: 'COOSALUD',
    medico: 'DAVID MAURICIO MEJIA',
    tipo_error: '',
    origen_formula: 'Sala de Quimioterapia',
    observaciones: '',
    estado_actual: 'ENTREGADO_QF',
    historial_estados: [
      { estado: 'ENTREGADO_QF', fecha: '2026-06-28', hora: '08:10:05', usuario: 'jregente01' }
    ],
    historia_clinica: [
      { id_documento: 'DOC-126-1', nombre_archivo: 'historia_clinica_pedro_ramirez.pdf', tamano: '1.3 MB', fecha_carga: '2026-06-28', cargado_por: 'jregente01', notas: 'Historia clínica de ingreso.' }
    ],
    politerapia_monoterapia: [
      { id_documento: 'DOC-126-2', nombre_archivo: 'esquema_monoterapia_pedro.pdf', tamano: '0.6 MB', fecha_carga: '2026-06-28', cargado_por: 'jregente01', notas: 'Protocolo de dosis única.' }
    ],
    formula_medica: [
      { id_documento: 'DOC-126-3', nombre_archivo: 'formula_pedro_julio.pdf', tamano: '1.1 MB', fecha_carga: '2026-06-28', cargado_por: 'jregente01', notas: 'Fórmula médica para verificación.' }
    ],
    consentimiento_informado: [
      { id_documento: 'DOC-126-4', nombre_archivo: 'consentimiento_informado_pedro.pdf', tamano: '1.8 MB', fecha_carga: '2026-06-28', cargado_por: 'jregente01', notas: 'Consentimiento firmado.' }
    ],
    resultados_laboratorio: [],
    resultados_imagenes: [],
    autorizacion_eps: [],
    otros_documentos: []
  },
  {
    id_registro: 'ERR-2026-000127',
    fecha_registro: '2026-06-29',
    hora_registro: '16:50:00',
    usuario_registro: 'jregente01',
    nombre_paciente: 'Martha Isabel',
    apellidos_paciente: 'Duque Medina',
    numero_documento: '43987123',
    eps: 'PROTEGER',
    medico: 'VLADIMIR AVILA',
    tipo_error: 'Formulación off label',
    origen_formula: 'Sala de Quimioterapia',
    observaciones: 'Prescripción de Pembrolizumab para indicación no autorizada sin soporte de comité técnico científico.',
    estado_actual: 'CORREGIDA_PENDIENTE_VERIFICACION',
    historial_estados: [
      { estado: 'ENTREGADO_QF', fecha: '2026-06-29', hora: '16:50:00', usuario: 'jregente01' },
      { estado: 'CON_ERROR_REGISTRADO', fecha: '2026-06-29', hora: '17:15:00', usuario: 'qf_martinez' },
      { estado: 'CORREGIDA_PENDIENTE_VERIFICACION', fecha: '2026-06-29', hora: '17:45:00', usuario: 'jregente01' }
    ],
    historia_clinica: [
      { id_documento: 'DOC-127-1', nombre_archivo: 'historia_clinica_martha_duque.pdf', tamano: '2.5 MB', fecha_carga: '2026-06-29', cargado_por: 'jregente01', notas: 'Historia clínica oncológica.' },
      { id_documento: 'DOC-127-1-C', nombre_archivo: 'historia_clinica_SOPORTE_COMITE.pdf', tamano: '3.1 MB', fecha_carga: '2026-06-29', cargado_por: 'jregente01', notas: 'Se adjunta acta aprobatoria de comité científico oncológico para soporte off label.', es_correccion: true }
    ],
    politerapia_monoterapia: [
      { id_documento: 'DOC-127-2', nombre_archivo: 'politerapia_martha_duque.pdf', tamano: '1.0 MB', fecha_carga: '2026-06-29', cargado_por: 'jregente01', notas: 'Esquema quimioterápico propuesto.' }
    ],
    formula_medica: [
      { id_documento: 'DOC-127-3', nombre_archivo: 'formula_medica_martha_duque.pdf', tamano: '1.1 MB', fecha_carga: '2026-06-29', cargado_por: 'jregente01', notas: 'Fórmula de Pembrolizumab.' }
    ],
    consentimiento_informado: [
      { id_documento: 'DOC-127-4', nombre_archivo: 'consentimiento_martha_duque.pdf', tamano: '2.1 MB', fecha_carga: '2026-06-29', cargado_por: 'jregente01', notas: 'Consentimiento para Pembrolizumab.' }
    ],
    resultados_laboratorio: [],
    resultados_imagenes: [],
    autorizacion_eps: [],
    otros_documentos: []
  },
  {
    id_registro: 'ERR-2026-000128',
    fecha_registro: '2026-06-30',
    hora_registro: '09:12:00',
    usuario_registro: 'jregente01',
    nombre_paciente: 'Gabriel',
    apellidos_paciente: 'Cárdenas Rojas',
    numero_documento: '1012345678',
    eps: 'FOMAG',
    medico: 'CARLOS BUITRAGO',
    tipo_error: '',
    origen_formula: 'Consulta Externa',
    observaciones: '',
    estado_actual: 'ENTREGADO_QF',
    historial_estados: [
      { estado: 'ENTREGADO_QF', fecha: '2026-06-30', hora: '09:12:00', usuario: 'jregente01' }
    ],
    historia_clinica: [
      { id_documento: 'DOC-128-1', nombre_archivo: 'historia_clinica_gabriel.pdf', tamano: '1.5 MB', fecha_carga: '2026-06-30', cargado_por: 'jregente01', notas: 'Historia clínica de control.' }
    ],
    politerapia_monoterapia: [
      { id_documento: 'DOC-128-2', nombre_archivo: 'monoterapia_gabriel.pdf', tamano: '0.8 MB', fecha_carga: '2026-06-30', cargado_por: 'jregente01', notas: 'Esquema de monoterapia.' }
    ],
    formula_medica: [
      { id_documento: 'DOC-128-3', nombre_archivo: 'formula_gabriel.pdf', tamano: '1.2 MB', fecha_carga: '2026-06-30', cargado_por: 'jregente01', notas: 'Fórmula para validación de dosis.' }
    ],
    consentimiento_informado: [
      { id_documento: 'DOC-128-4', nombre_archivo: 'consentimiento_gabriel.pdf', tamano: '1.9 MB', fecha_carga: '2026-06-30', cargado_por: 'jregente01', notas: 'Consentimiento informado del paciente.' }
    ],
    resultados_laboratorio: [],
    resultados_imagenes: [],
    autorizacion_eps: [],
    otros_documentos: []
  }
];

export const INITIAL_VOLUMES: VolumenFormulas[] = [
  // Total of validated formulas as denominators (spanning June 2026)
  { id: 'VOL-01', fecha: '2026-06-25', eps: 'NUEVA EPS', medico: 'CARLOS BUITRAGO', cantidad_formulas_validadas: 85, registrado_por: 'admin' },
  { id: 'VOL-02', fecha: '2026-06-25', eps: 'FAMISANAR', medico: 'LUIS BAEZ', cantidad_formulas_validadas: 90, registrado_por: 'admin' },
  { id: 'VOL-03', fecha: '2026-06-26', eps: 'CAPITAL SALUD', medico: 'GREGORIO MALDONADO', cantidad_formulas_validadas: 120, registrado_por: 'admin' },
  { id: 'VOL-04', fecha: '2026-06-26', eps: 'COOSALUD', medico: 'DAVID MAURICIO MEJIA', cantidad_formulas_validadas: 60, registrado_por: 'admin' },
  { id: 'VOL-05', fecha: '2026-06-27', eps: 'PROTEGER', medico: 'VLADIMIR AVILA', cantidad_formulas_validadas: 75, registrado_por: 'admin' },
  { id: 'VOL-06', fecha: '2026-06-27', eps: 'FOMAG', medico: 'CARLOS BUITRAGO', cantidad_formulas_validadas: 110, registrado_por: 'admin' },
  { id: 'VOL-07', fecha: '2026-06-28', eps: 'NUEVA EPS', medico: 'LUIS BAEZ', cantidad_formulas_validadas: 130, registrado_por: 'admin' },
  { id: 'VOL-08', fecha: '2026-06-28', eps: 'FAMISANAR', medico: 'GREGORIO MALDONADO', cantidad_formulas_validadas: 95, registrado_por: 'admin' },
  { id: 'VOL-09', fecha: '2026-06-29', eps: 'CAPITAL SALUD', medico: 'DAVID MAURICIO MEJIA', cantidad_formulas_validadas: 80, registrado_por: 'admin' },
  { id: 'VOL-10', fecha: '2026-06-29', eps: 'COOSALUD', medico: 'VLADIMIR AVILA', cantidad_formulas_validadas: 70, registrado_por: 'admin' },
  { id: 'VOL-11', fecha: '2026-06-30', eps: 'PROTEGER', medico: 'CARLOS BUITRAGO', cantidad_formulas_validadas: 100, registrado_por: 'admin' },
  { id: 'VOL-12', fecha: '2026-06-30', eps: 'FOMAG', medico: 'LUIS BAEZ', cantidad_formulas_validadas: 65, registrado_por: 'admin' }
];

export const INITIAL_AUDIT_LOG: AuditLog[] = [
  { id: 'LOG-001', fecha: '2026-06-25', hora: '09:00:00', usuario: 'Sistema', accion: 'Inicialización', detalle: 'Inicialización de catálogo y base de datos de farmacovigilancia en oncología.' },
  { id: 'LOG-002', fecha: '2026-06-25', hora: '09:42:15', usuario: 'jregente01', accion: 'Creación Registro', detalle: 'Creación del error ERR-2026-000123 correspondiente al paciente María González López.' },
  { id: 'LOG-003', fecha: '2026-06-25', hora: '10:15:30', usuario: 'qf_martinez', accion: 'Cambio de Estado', detalle: 'Marcó como REGISTRADA_PENDIENTE_QF el registro ERR-2026-000123.' },
  { id: 'LOG-004', fecha: '2026-06-25', hora: '11:00:00', usuario: 'qf_martinez', accion: 'Cambio de Estado', detalle: 'Reenvió a Registro para corrección de dosis de 150mg a 120mg.' }
];

export const INITIAL_PROGRAMACIONES: ProgramacionCita[] = [
  {
    id_programacion: 'PROG-1',
    id_registro: 'ERR-2026-000123',
    nombre_paciente: 'María',
    apellidos_paciente: 'González López',
    numero_documento: '1032456789',
    eps: 'NUEVA EPS',
    ciclo_actual: 1,
    dia_aplicacion: 1,
    fecha_aplicacion: '2026-07-02',
    hora_aplicacion: '08:30',
    telefono_contacto_1: '3157894561',
    telefono_contacto_2: '3004561234',
    telefono_contacto_3: '',
    medicamento: 'Trastuzumab + Paclitaxel',
    observaciones: 'Monitorear signos vitales estrechamente. Infusión lenta inicial.',
    estado_programacion: 'Programada',
    fecha_registro: '2026-06-30',
    programado_por: 'pedro_prog',
    confirmacion_paciente: 'Si',
    sms_enviado: true,
    whatsapp_enviado: true,
  },
  {
    id_programacion: 'PROG-2',
    id_registro: 'ERR-2026-000124',
    nombre_paciente: 'Carlos Mario',
    apellidos_paciente: 'Restrepo Vélez',
    numero_documento: '71234890',
    eps: 'FAMISANAR',
    ciclo_actual: 1,
    dia_aplicacion: 8,
    fecha_aplicacion: '2026-07-05',
    hora_aplicacion: '10:00',
    telefono_contacto_1: '3219876543',
    telefono_contacto_2: '',
    telefono_contacto_3: '',
    medicamento: 'Rituximab',
    observaciones: 'Premedicación con paracetamol y difenhidramina obligatoria.',
    estado_programacion: 'Programada',
    fecha_registro: '2026-06-30',
    programado_por: 'pedro_prog',
    confirmacion_paciente: 'Pendiente',
    sms_enviado: true,
    whatsapp_enviado: true,
  },
];
