# Registro de Farmacovigilancia en Oncología

Sistema de trazabilidad de errores en fórmulas médicas oncológicas: registro de errores, seguimiento por estados (Registro → Químico Farmacéutico → Programación), carga de documentos PDF, programación de citas de aplicación, reportes y auditoría.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase (base de datos y almacenamiento de PDFs).

## Requisitos

- Node.js 18 o superior
- Un proyecto de Supabase con:
  - Tabla `registros_error` (columnas equivalentes a la interfaz `RegistroError` de [src/types.ts](src/types.ts), con `historial_estados` y las listas de documentos como `jsonb`, y `creado_en timestamptz default now()`)
  - Bucket de Storage llamado `documentos`
  - El script [supabase/setup.sql](supabase/setup.sql) ejecutado en el SQL Editor del panel (crea las tablas de usuarios, citas, denominadores, auditoría y médicos, y activa las políticas RLS de seguridad)

## Configuración local

1. Instalar dependencias:
   ```
   npm install
   ```
2. Crear un archivo `.env` en la raíz (ver [.env.example](.env.example)):
   ```
   VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLISHABLE
   ```
3. Ejecutar en desarrollo:
   ```
   npm run dev
   ```
   La app queda en http://localhost:3000

## Verificación y build de producción

```
npm run lint    # verificación de tipos (tsc)
npm run build   # genera la carpeta dist/
```

La carpeta `dist/` es un sitio estático: se puede desplegar en Vercel, Netlify, o cualquier servidor web interno. En el servicio de hosting hay que configurar las mismas variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` antes de hacer el build.

## Qué se guarda en Supabase

Todo el estado de la aplicación se guarda en Supabase y se comparte entre equipos:

- **Registros de error** (`registros_error`): creación, cambios de estado con historial y documentos adjuntos. Sin borrado (protegido por RLS).
- **Usuarios** (`usuarios`): cuentas y roles. La primera vez que la tabla está vacía, la app siembra las cuentas base automáticamente.
- **Citas** (`programaciones_citas`), **denominadores** (`volumenes_formulas`), **médicos** (`medicos`), **tipos de error** (`tipos_error`) y **protocolos oncológicos** (`protocolos`).
- **Audit log** (`audit_logs`): inmutable — las políticas RLS impiden editarlo o borrarlo.
- **PDFs** (bucket `documentos`): se suben con ruta `id_registro/tipo/timestamp_nombre.pdf` y se leen mediante enlaces firmados temporales (5 minutos).

**Retención documental:** los archivos PDF se eliminan automáticamente del Storage 4 meses después de que el registro queda gestionado en su totalidad (estado "Aprobada - Proceso Finalizado"). La limpieza corre al abrir la app, deja la tarjeta del documento con una nota explicativa y registra la acción en el audit log. La política RLS del bucket solo permite borrar exactamente esos archivos.

`localStorage` se usa solo como caché/respaldo local si Supabase no responde. La sesión activa es local de cada navegador.

## Pendientes recomendados antes de uso productivo

1. **Autenticación real**: el login actual es simulado (usuarios y contraseñas en la tabla `usuarios` en texto plano). Migrar a Supabase Auth.
2. Con Supabase Auth activo, endurecer las políticas de [supabase/setup.sql](supabase/setup.sql) cambiando `to anon, authenticated` por `to authenticated`.
