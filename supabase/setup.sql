-- ============================================================
-- Registro Farmacovigilancia en Oncología
-- Script de configuración de Supabase: tablas nuevas + RLS
--
-- CÓMO EJECUTARLO:
--   Panel de Supabase → SQL Editor → New query → pegar todo → Run
--   Es idempotente: se puede ejecutar varias veces sin dañar datos.
-- ============================================================

-- ============ 1. TABLAS NUEVAS ============

create table if not exists usuarios (
  id_usuario text primary key,
  nombre_usuario text not null,
  nombre_completo text not null,
  contrasena text not null,
  rol text not null,
  estado_cuenta text not null,
  fecha_creacion text not null,
  creado_por text not null,
  creado_en timestamptz not null default now()
);

create table if not exists programaciones_citas (
  id_programacion text primary key,
  id_registro text not null,
  nombre_paciente text not null,
  apellidos_paciente text not null,
  numero_documento text not null,
  eps text not null,
  ciclo_actual integer not null,
  dia_aplicacion integer not null,
  fecha_aplicacion text not null,
  hora_aplicacion text,
  telefono_contacto_1 text,
  telefono_contacto_2 text,
  telefono_contacto_3 text,
  medicamento text,
  observaciones text,
  estado_programacion text not null,
  fecha_registro text not null,
  programado_por text not null,
  confirmacion_paciente text,
  motivo_desacuerdo text,
  sms_enviado boolean,
  whatsapp_enviado boolean,
  creado_en timestamptz not null default now()
);

create table if not exists volumenes_formulas (
  id text primary key,
  fecha text not null,
  eps text not null,
  medico text not null,
  cantidad_formulas_validadas integer not null,
  registrado_por text not null,
  creado_en timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  fecha text not null,
  hora text not null,
  usuario text not null,
  accion text not null,
  detalle text not null,
  creado_en timestamptz not null default now()
);

create table if not exists medicos (
  nombre text primary key,
  creado_en timestamptz not null default now()
);

-- ============ 2. RLS: ROW LEVEL SECURITY ============
-- Principio: la clave pública (anon) solo puede hacer lo que la app
-- necesita. Todo lo demás queda bloqueado.

-- ---- registros_error: leer, crear y actualizar. PROHIBIDO borrar. ----
alter table registros_error enable row level security;
drop policy if exists "registros_select" on registros_error;
drop policy if exists "registros_insert" on registros_error;
drop policy if exists "registros_update" on registros_error;
create policy "registros_select" on registros_error for select to anon, authenticated using (true);
create policy "registros_insert" on registros_error for insert to anon, authenticated with check (true);
create policy "registros_update" on registros_error for update to anon, authenticated using (true) with check (true);
-- (sin política de delete: nadie puede borrar registros con la clave pública)

-- ---- usuarios: leer, crear y actualizar. PROHIBIDO borrar. ----
alter table usuarios enable row level security;
drop policy if exists "usuarios_select" on usuarios;
drop policy if exists "usuarios_insert" on usuarios;
drop policy if exists "usuarios_update" on usuarios;
create policy "usuarios_select" on usuarios for select to anon, authenticated using (true);
create policy "usuarios_insert" on usuarios for insert to anon, authenticated with check (true);
create policy "usuarios_update" on usuarios for update to anon, authenticated using (true) with check (true);

-- ---- programaciones_citas: operación completa (la app permite eliminar citas). ----
alter table programaciones_citas enable row level security;
drop policy if exists "prog_select" on programaciones_citas;
drop policy if exists "prog_insert" on programaciones_citas;
drop policy if exists "prog_update" on programaciones_citas;
drop policy if exists "prog_delete" on programaciones_citas;
create policy "prog_select" on programaciones_citas for select to anon, authenticated using (true);
create policy "prog_insert" on programaciones_citas for insert to anon, authenticated with check (true);
create policy "prog_update" on programaciones_citas for update to anon, authenticated using (true) with check (true);
create policy "prog_delete" on programaciones_citas for delete to anon, authenticated using (true);

-- ---- volumenes_formulas: leer y crear. Sin modificar ni borrar. ----
alter table volumenes_formulas enable row level security;
drop policy if exists "vol_select" on volumenes_formulas;
drop policy if exists "vol_insert" on volumenes_formulas;
create policy "vol_select" on volumenes_formulas for select to anon, authenticated using (true);
create policy "vol_insert" on volumenes_formulas for insert to anon, authenticated with check (true);

-- ---- audit_logs: INMUTABLE. Solo leer y agregar; imposible editar o borrar. ----
alter table audit_logs enable row level security;
drop policy if exists "audit_select" on audit_logs;
drop policy if exists "audit_insert" on audit_logs;
create policy "audit_select" on audit_logs for select to anon, authenticated using (true);
create policy "audit_insert" on audit_logs for insert to anon, authenticated with check (true);

-- ---- medicos: catálogo administrable. ----
alter table medicos enable row level security;
drop policy if exists "medicos_select" on medicos;
drop policy if exists "medicos_insert" on medicos;
drop policy if exists "medicos_delete" on medicos;
create policy "medicos_select" on medicos for select to anon, authenticated using (true);
create policy "medicos_insert" on medicos for insert to anon, authenticated with check (true);
create policy "medicos_delete" on medicos for delete to anon, authenticated using (true);

-- ============ 3. STORAGE (bucket "documentos") ============
-- Ya está restringido: subir y leer permitido, borrar bloqueado.
-- Si el bucket llegara a recrearse, las políticas equivalentes son:
--   subir:  create policy "docs_upload" on storage.objects for insert to anon
--             with check (bucket_id = 'documentos');
--   leer:   create policy "docs_read" on storage.objects for select to anon
--             using (bucket_id = 'documentos');
