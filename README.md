# Registro de Farmacovigilancia en Oncología

Sistema de trazabilidad de errores en fórmulas médicas oncológicas: registro de errores, seguimiento por estados (Registro → Químico Farmacéutico → Programación), carga de documentos PDF, programación de citas de aplicación, reportes y auditoría.

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS 4 + Supabase (base de datos y almacenamiento de PDFs).

## Requisitos

- Node.js 18 o superior
- Un proyecto de Supabase con:
  - Tabla `registros_error` (columnas equivalentes a la interfaz `RegistroError` de [src/types.ts](src/types.ts), con `historial_estados` y las listas de documentos como `jsonb`, y `creado_en timestamptz default now()`)
  - Bucket de Storage llamado `documentos`

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

- **Registros de error** (`registros_error`): creación, cambios de estado con historial y documentos adjuntos.
- **PDFs** (bucket `documentos`): se suben con ruta `id_registro/tipo/timestamp_nombre.pdf` y se leen mediante enlaces firmados temporales (5 minutos).

Los usuarios, citas, denominadores y audit log se guardan por ahora en `localStorage` del navegador.

## Pendientes recomendados antes de uso productivo

1. **Restringir RLS en Supabase**: actualmente la clave pública permite insertar, leer, actualizar y borrar en `registros_error`. Se recomienda activar políticas que limiten borrado/actualización a usuarios autenticados.
2. **Autenticación real**: el login actual es simulado (usuarios y contraseñas en el código/localStorage). Migrar a Supabase Auth.
3. **Migrar a Supabase** usuarios, citas, denominadores y audit log para que sean compartidos entre equipos.
