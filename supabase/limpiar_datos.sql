-- ============================================================
-- LIMPIEZA TOTAL DE DATOS OPERATIVOS — "empezar de ceros"
--
-- Borra: registros de error, citas, denominadores, auditoría
--        y todos los PDF del bucket "documentos".
-- Conserva: cuentas de usuario, catálogo de médicos, tipos de
--           error y protocolos oncológicos.
--
-- ⚠️ IRREVERSIBLE. Ejecutar en: SQL Editor → New query → Run.
-- ============================================================

delete from registros_error;
delete from programaciones_citas;
delete from volumenes_formulas;
delete from audit_logs;

-- Vaciar el bucket de documentos PDF
delete from storage.objects where bucket_id = 'documentos';

-- Verificación: todas las tablas deben quedar en 0
select 'registros_error' as tabla, count(*) as filas from registros_error
union all select 'programaciones_citas', count(*) from programaciones_citas
union all select 'volumenes_formulas', count(*) from volumenes_formulas
union all select 'audit_logs', count(*) from audit_logs
union all select 'archivos_pdf', count(*) from storage.objects where bucket_id = 'documentos'
order by tabla;
