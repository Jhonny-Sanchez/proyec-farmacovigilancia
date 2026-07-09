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

create table if not exists tipos_error (
  nombre text primary key,
  creado_en timestamptz not null default now()
);

create table if not exists protocolos (
  nombre text primary key,
  medicamentos text not null,
  frecuencia_aplicacion text not null,
  cantidad_ciclos integer not null,
  observaciones text,
  creado_por text not null,
  fecha_creacion text not null,
  creado_en timestamptz not null default now()
);

-- ============ 2. RLS: ROW LEVEL SECURITY ============
-- Principio: la clave pública (anon) solo puede hacer lo que la app
-- necesita. Todo lo demás queda bloqueado.

-- Activar RLS en las 6 tablas
alter table registros_error enable row level security;
alter table usuarios enable row level security;
alter table programaciones_citas enable row level security;
alter table volumenes_formulas enable row level security;
alter table audit_logs enable row level security;
alter table medicos enable row level security;
alter table tipos_error enable row level security;
alter table protocolos enable row level security;

-- Eliminar TODAS las políticas existentes de estas tablas (incluidas
-- políticas viejas "permitir todo" creadas por configuraciones previas)
do $$
declare pol record;
begin
  for pol in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('registros_error','usuarios','programaciones_citas',
                        'volumenes_formulas','audit_logs','medicos','tipos_error','protocolos')
  loop
    execute format('drop policy %I on %I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- ---- registros_error: leer, crear y actualizar. PROHIBIDO borrar. ----
create policy "registros_select" on registros_error for select to anon, authenticated using (true);
create policy "registros_insert" on registros_error for insert to anon, authenticated with check (true);
create policy "registros_update" on registros_error for update to anon, authenticated using (true) with check (true);
-- (sin política de delete: nadie puede borrar registros con la clave pública)

-- ---- usuarios: leer, crear y actualizar. PROHIBIDO borrar. ----
create policy "usuarios_select" on usuarios for select to anon, authenticated using (true);
create policy "usuarios_insert" on usuarios for insert to anon, authenticated with check (true);
create policy "usuarios_update" on usuarios for update to anon, authenticated using (true) with check (true);

-- ---- programaciones_citas: operación completa (la app permite eliminar citas). ----
create policy "prog_select" on programaciones_citas for select to anon, authenticated using (true);
create policy "prog_insert" on programaciones_citas for insert to anon, authenticated with check (true);
create policy "prog_update" on programaciones_citas for update to anon, authenticated using (true) with check (true);
create policy "prog_delete" on programaciones_citas for delete to anon, authenticated using (true);

-- ---- volumenes_formulas: leer y crear. Sin modificar ni borrar. ----
create policy "vol_select" on volumenes_formulas for select to anon, authenticated using (true);
create policy "vol_insert" on volumenes_formulas for insert to anon, authenticated with check (true);

-- ---- audit_logs: INMUTABLE. Solo leer y agregar; imposible editar o borrar. ----
create policy "audit_select" on audit_logs for select to anon, authenticated using (true);
create policy "audit_insert" on audit_logs for insert to anon, authenticated with check (true);

-- ---- medicos: catálogo administrable. ----
create policy "medicos_select" on medicos for select to anon, authenticated using (true);
create policy "medicos_insert" on medicos for insert to anon, authenticated with check (true);
create policy "medicos_delete" on medicos for delete to anon, authenticated using (true);

-- ---- tipos_error: catálogo administrable (clasificación de hallazgo). ----
create policy "tipos_select" on tipos_error for select to anon, authenticated using (true);
create policy "tipos_insert" on tipos_error for insert to anon, authenticated with check (true);
create policy "tipos_delete" on tipos_error for delete to anon, authenticated using (true);

-- ---- protocolos: catálogo administrable de protocolos oncológicos. ----
create policy "protocolos_select" on protocolos for select to anon, authenticated using (true);
create policy "protocolos_insert" on protocolos for insert to anon, authenticated with check (true);
create policy "protocolos_delete" on protocolos for delete to anon, authenticated using (true);

-- ============ VERIFICACIÓN ============
-- Al terminar debe mostrar rls_activo = true en las 8 tablas.
select tablename as tabla, rowsecurity as rls_activo
from pg_tables
where schemaname = 'public'
  and tablename in ('registros_error','usuarios','programaciones_citas',
                    'volumenes_formulas','audit_logs','medicos','tipos_error','protocolos')
order by tablename;

-- ============ 3. STORAGE (bucket "documentos") ============
-- Ya está restringido: subir y leer permitido, borrar bloqueado.
-- Si el bucket llegara a recrearse, las políticas equivalentes son:
--   subir:  create policy "docs_upload" on storage.objects for insert to anon
--             with check (bucket_id = 'documentos');
--   leer:   create policy "docs_read" on storage.objects for select to anon
--             using (bucket_id = 'documentos');
