/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'Administrador'
  | 'Registro'
  | 'QuimicoFarmaceutico'
  | 'Programador'
  | 'Corrector'
  | 'Consulta';

export type AccountStatus = 'Activo' | 'Inactivo';

export interface Usuario {
  id_usuario: string;
  nombre_usuario: string;
  nombre_completo: string;
  contrasena: string; // Plaintext for simulation login ease
  rol: UserRole;
  estado_cuenta: AccountStatus;
  fecha_creacion: string;
  creado_por: string;
}

export type OriginFormula = 'Sala de Quimioterapia' | 'Consulta Externa';

export type ErrorStatus =
  | 'ENTREGADO_QF'
  | 'CON_ERROR_REGISTRADO'
  | 'CORREGIDA_PENDIENTE_VERIFICACION'
  | 'ENTREGADO_PROGRAMACION';

export interface StateHistoryItem {
  estado: ErrorStatus;
  fecha: string;
  hora: string;
  usuario: string;
}

export interface DocumentoAdjunto {
  id_documento: string;
  nombre_archivo: string;
  tamano: string;
  fecha_carga: string;
  cargado_por: string;
  notas?: string;
  es_correccion?: boolean;
  url?: string; // Blob/Data URL for real file viewing
}

export interface RegistroError {
  id_registro: string;
  fecha_registro: string;
  hora_registro: string;
  usuario_registro: string;
  nombre_paciente: string;
  apellidos_paciente: string;
  numero_documento: string;
  eps: string;
  medico: string;
  tipo_error: string;
  origen_formula: OriginFormula;
  observaciones?: string;
  estado_actual: ErrorStatus;
  historial_estados: StateHistoryItem[];

  // Patient Contact Fields
  telefono_fijo?: string;
  numero_celular?: string;
  celular_contacto_adicional_1?: string;
  celular_contacto_adicional_2?: string;
  
  // PDF Document attachments with histories/notes
  historia_clinica: DocumentoAdjunto[];
  politerapia_monoterapia: DocumentoAdjunto[];
  formula_medica: DocumentoAdjunto[];
  consentimiento_informado: DocumentoAdjunto[];
  resultados_laboratorio: DocumentoAdjunto[];
  resultados_imagenes: DocumentoAdjunto[];
  autorizacion_eps: DocumentoAdjunto[];
  otros_documentos: DocumentoAdjunto[];

  // Scheduler / Programador custom fields
  cantidad_ciclos?: number;
  dias_administracion?: string;
}

export interface ProgramacionCita {
  id_programacion: string;
  id_registro: string; // references the formula/register
  nombre_paciente: string;
  apellidos_paciente: string;
  numero_documento: string;
  eps: string;
  ciclo_actual: number; // e.g. 1
  dia_aplicacion: number; // e.g. 1, 2, 3...
  fecha_aplicacion: string; // YYYY-MM-DD
  hora_aplicacion?: string; // HH:MM
  telefono_contacto_1?: string; // Required
  telefono_contacto_2?: string; // Optional
  telefono_contacto_3?: string; // Optional
  medicamento?: string;
  observaciones?: string;
  estado_programacion: 'Programada' | 'Realizada' | 'Cancelada';
  fecha_registro: string;
  programado_por: string;
  
  // Patient simulated SMS / WhatsApp feedback
  confirmacion_paciente?: 'Si' | 'No' | 'Pendiente';
  motivo_desacuerdo?: string;
  sms_enviado?: boolean;
  whatsapp_enviado?: boolean;
}

// Protocolo oncológico: define medicamentos, frecuencia y ciclos de un esquema
export interface ProtocoloOncologico {
  nombre: string; // clave única del protocolo (ej. FOLFOX-6)
  medicamentos: string; // medicamentos que componen el esquema
  frecuencia_aplicacion: string; // ej. "Cada 21 días"
  cantidad_ciclos: number;
  observaciones?: string;
  creado_por: string;
  fecha_creacion: string;
}

export interface VolumenFormulas {
  id: string;
  fecha: string;
  eps: string;
  medico: string;
  cantidad_formulas_validadas: number;
  registrado_por: string;
}

export interface AuditLog {
  id: string;
  fecha: string;
  hora: string;
  usuario: string;
  accion: string;
  detalle: string;
}

// System Catalogs
export const EPS_CATALOG = [
  'FAMISANAR',
  'NUEVA EPS',
  'CAPITAL SALUD',
  'COOSALUD',
  'PROTEGER',
  'FOMAG',
];

export const MEDICOS_CATALOG = [
  'CARLOS BUITRAGO',
  'LUIS BAEZ',
  'GREGORIO MALDONADO',
  'DAVID MAURICIO MEJIA',
  'VLADIMIR AVILA',
];

export const TIPOS_DE_ERROR_CATALOG = [
  'Error de dosis',
  'Error de frecuencia',
  'Error de vía de administración',
  'Error de cantidad',
  'Falta de MIPRES',
  'Formulación off label',
];

export const ORIGEN_FORMULA_CATALOG: OriginFormula[] = [
  'Sala de Quimioterapia',
  'Consulta Externa',
];

export const ROLES_CATALOG: UserRole[] = [
  'Administrador',
  'Registro',
  'QuimicoFarmaceutico',
  'Programador',
  'Corrector',
  'Consulta',
];

export interface StatusConfig {
  id: ErrorStatus;
  nombre: string;
  color: string; // Tailwind class color accent
  badgeBg: string;
  badgeText: string;
}

export const STATUS_CONFIGS: Record<ErrorStatus, StatusConfig> = {
  ENTREGADO_QF: {
    id: 'ENTREGADO_QF',
    nombre: 'Registrada - Pendiente QF',
    color: 'blue',
    badgeBg: 'bg-blue-500/10 border-blue-500/30',
    badgeText: 'text-blue-400',
  },
  CON_ERROR_REGISTRADO: {
    id: 'CON_ERROR_REGISTRADO',
    nombre: 'Con Error - Pendiente Corrección',
    color: 'red',
    badgeBg: 'bg-red-500/10 border-red-500/30',
    badgeText: 'text-red-400',
  },
  CORREGIDA_PENDIENTE_VERIFICACION: {
    id: 'CORREGIDA_PENDIENTE_VERIFICACION',
    nombre: 'Corregida - Pendiente Verificación QF',
    color: 'amber',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-400',
  },
  ENTREGADO_PROGRAMACION: {
    id: 'ENTREGADO_PROGRAMACION',
    nombre: 'Aprobada - Proceso Finalizado',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-400',
  },
};
