import { supabase } from './supabaseClient';
import { RegistroError } from './types';

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