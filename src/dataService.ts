import { supabase } from './supabaseClient';
import { RegistroError, Usuario, ProgramacionCita, VolumenFormulas, AuditLog, ProtocoloOncologico } from './types';

// ============ REGISTROS DE ERROR ============

// Traer todos los registros de error desde Supabase
export async function fetchErrores(): Promise<RegistroError[]> {
  const { data, error } = await supabase
    .from('registros_error')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('Error al leer registros:', error);
    return [];
  }
  return data as RegistroError[];
}

// Guardar un nuevo registro de error
export async function insertError(nuevoError: RegistroError) {
  const { error } = await supabase.from('registros_error').insert([nuevoError]);
  if (error) console.error('Error al insertar registro:', error);
}

// Actualizar un registro existente (cambios de estado, documentos, etc.)
export async function updateError(id: string, camposActualizados: Partial<RegistroError>) {
  const { error } = await supabase
    .from('registros_error')
    .update(camposActualizados)
    .eq('id_registro', id);

  if (error) console.error('Error al actualizar registro:', error);
}

// ============ USUARIOS ============

export async function fetchUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('fecha_creacion', { ascending: true });

  if (error) {
    console.error('Error al leer usuarios:', error);
    return [];
  }
  return data as Usuario[];
}

export async function insertUsuario(nuevoUsuario: Usuario) {
  const { error } = await supabase.from('usuarios').insert([nuevoUsuario]);
  if (error) console.error('Error al insertar usuario:', error);
}

export async function updateUsuario(id_usuario: string, campos: Partial<Usuario>) {
  const { error } = await supabase.from('usuarios').update(campos).eq('id_usuario', id_usuario);
  if (error) console.error('Error al actualizar usuario:', error);
}

// Siembra las cuentas base la primera vez que la tabla está vacía
export async function seedUsuarios(iniciales: Usuario[]) {
  const { error } = await supabase
    .from('usuarios')
    .upsert(iniciales, { onConflict: 'id_usuario', ignoreDuplicates: true });
  if (error) console.error('Error al sembrar usuarios iniciales:', error);
}

// ============ PROGRAMACIÓN DE CITAS ============

export async function fetchProgramaciones(): Promise<ProgramacionCita[]> {
  const { data, error } = await supabase
    .from('programaciones_citas')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('Error al leer programaciones:', error);
    return [];
  }
  return data as ProgramacionCita[];
}

export async function insertProgramacion(nueva: ProgramacionCita) {
  const { error } = await supabase.from('programaciones_citas').insert([nueva]);
  if (error) console.error('Error al insertar programación:', error);
}

export async function updateProgramacion(id: string, campos: Partial<ProgramacionCita>) {
  const { error } = await supabase
    .from('programaciones_citas')
    .update(campos)
    .eq('id_programacion', id);
  if (error) console.error('Error al actualizar programación:', error);
}

export async function deleteProgramacion(id: string) {
  const { error } = await supabase
    .from('programaciones_citas')
    .delete()
    .eq('id_programacion', id);
  if (error) console.error('Error al eliminar programación:', error);
}

// ============ VOLÚMENES DE FÓRMULAS (DENOMINADORES) ============

export async function fetchVolumenes(): Promise<VolumenFormulas[]> {
  const { data, error } = await supabase
    .from('volumenes_formulas')
    .select('*')
    .order('fecha', { ascending: true });

  if (error) {
    console.error('Error al leer volúmenes:', error);
    return [];
  }
  return data as VolumenFormulas[];
}

export async function insertVolumen(nuevo: VolumenFormulas) {
  const { error } = await supabase.from('volumenes_formulas').insert([nuevo]);
  if (error) console.error('Error al insertar volumen:', error);
}

// ============ AUDIT LOG (INMUTABLE) ============

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error al leer audit log:', error);
    return [];
  }
  return data as AuditLog[];
}

export async function insertAuditLog(log: AuditLog) {
  const { error } = await supabase.from('audit_logs').insert([log]);
  if (error) console.error('Error al insertar audit log:', error);
}

// ============ CATÁLOGO DE MÉDICOS ============

export async function fetchMedicos(): Promise<string[]> {
  const { data, error } = await supabase
    .from('medicos')
    .select('nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al leer médicos:', error);
    return [];
  }
  return (data as { nombre: string }[]).map((m) => m.nombre);
}

export async function insertMedico(nombre: string) {
  const { error } = await supabase
    .from('medicos')
    .upsert([{ nombre }], { onConflict: 'nombre', ignoreDuplicates: true });
  if (error) console.error('Error al insertar médico:', error);
}

export async function deleteMedico(nombre: string) {
  const { error } = await supabase.from('medicos').delete().eq('nombre', nombre);
  if (error) console.error('Error al eliminar médico:', error);
}

// Siembra el catálogo base de médicos la primera vez
export async function seedMedicos(nombres: string[]) {
  const { error } = await supabase
    .from('medicos')
    .upsert(nombres.map((nombre) => ({ nombre })), { onConflict: 'nombre', ignoreDuplicates: true });
  if (error) console.error('Error al sembrar médicos iniciales:', error);
}

// ============ CATÁLOGO DE TIPOS DE ERROR (CLASIFICACIÓN DE HALLAZGO) ============

export async function fetchTiposError(): Promise<string[]> {
  const { data, error } = await supabase
    .from('tipos_error')
    .select('nombre')
    .order('creado_en', { ascending: true });

  if (error) {
    console.error('Error al leer tipos de error:', error);
    return [];
  }
  return (data as { nombre: string }[]).map((t) => t.nombre);
}

export async function insertTipoError(nombre: string) {
  const { error } = await supabase
    .from('tipos_error')
    .upsert([{ nombre }], { onConflict: 'nombre', ignoreDuplicates: true });
  if (error) console.error('Error al insertar tipo de error:', error);
}

export async function deleteTipoError(nombre: string) {
  const { error } = await supabase.from('tipos_error').delete().eq('nombre', nombre);
  if (error) console.error('Error al eliminar tipo de error:', error);
}

// Siembra el catálogo base de tipos de error la primera vez
export async function seedTiposError(nombres: string[]) {
  const { error } = await supabase
    .from('tipos_error')
    .upsert(nombres.map((nombre) => ({ nombre })), { onConflict: 'nombre', ignoreDuplicates: true });
  if (error) console.error('Error al sembrar tipos de error iniciales:', error);
}

// ============ PROTOCOLOS ONCOLÓGICOS ============

export async function fetchProtocolos(): Promise<ProtocoloOncologico[]> {
  const { data, error } = await supabase
    .from('protocolos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error al leer protocolos:', error);
    return [];
  }
  return data as ProtocoloOncologico[];
}

export async function insertProtocolo(protocolo: ProtocoloOncologico) {
  const { error } = await supabase
    .from('protocolos')
    .upsert([protocolo], { onConflict: 'nombre', ignoreDuplicates: true });
  if (error) console.error('Error al insertar protocolo:', error);
}

export async function deleteProtocolo(nombre: string) {
  const { error } = await supabase.from('protocolos').delete().eq('nombre', nombre);
  if (error) console.error('Error al eliminar protocolo:', error);
}

// ============ STORAGE DE DOCUMENTOS PDF ============

// Subir un archivo PDF al bucket "documentos" y devolver su ruta
export async function subirPDF(file: File, idRegistro: string, tipo: string): Promise<string | null> {
  // Crear una ruta única: idRegistro/tipo/timestamp_nombre.pdf
  const nombreLimpio = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ruta = `${idRegistro}/${tipo}/${Date.now()}_${nombreLimpio}`;

  const { error } = await supabase.storage
    .from('documentos')
    .upload(ruta, file);

  if (error) {
    console.error('Error al subir PDF:', error);
    return null;
  }
  return ruta; // Devolvemos la ruta para guardarla en la base de datos
}

// Obtener un enlace temporal seguro (firmado) para ver/descargar un PDF
export async function obtenerEnlacePDF(ruta: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('documentos')
    .createSignedUrl(ruta, 300); // 300 segundos = 5 minutos de validez

  if (error) {
    console.error('Error al generar enlace:', error);
    return null;
  }
  return data.signedUrl;
}
