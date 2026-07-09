/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../types';
import { Shield, ShieldAlert, Check, X, ArrowLeft, Info } from 'lucide-react';

interface RolesPermisosViewProps {
  onNavigate: (page: string) => void;
  onAddAuditLog: (action: string, detail: string) => void;
}

interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
}

export default function RolesPermisosView({ onNavigate, onAddAuditLog }: RolesPermisosViewProps) {
  // Permission matrix mapping key -> active roles list
  const [matrix, setMatrix] = useState<Record<string, UserRole[]>>({
    crear_registro: ['Administrador', 'Registro'],
    ver_todos_los_registros: ['Administrador', 'Consulta'],
    ver_bandeja_propia: ['QuimicoFarmaceutico', 'Registro', 'Corrector'],
    cambiar_estado: ['Administrador', 'QuimicoFarmaceutico', 'Registro', 'Corrector'],
    gestionar_usuarios_y_permisos: ['Administrador'],
    ver_y_exportar_excel_maestro: ['Administrador'],
    ver_dashboard_y_reportes: ['Administrador', 'Consulta', 'QuimicoFarmaceutico', 'Registro'],
    ver_audit_log: ['Administrador'],
    registrar_volumen_total_formulas: ['Administrador', 'QuimicoFarmaceutico'],
  });

  const [feedback, setFeedback] = useState('');

  const permissions: PermissionDefinition[] = [
    { key: 'crear_registro', label: 'Crear Registro / Paciente', description: 'Permite ingresar un nuevo paciente con sus 4 soportes PDF.' },
    { key: 'ver_todos_los_registros', label: 'Ver Todos los Pacientes', description: 'Acceso de lectura a todas las fórmulas y soportes registrados en la base general.' },
    { key: 'ver_bandeja_propia', label: 'Ver Bandeja Propia', description: 'Visualización restringida a los registros que requieren acción directa del rol activo.' },
    { key: 'cambiar_estado', label: 'Cambiar Estado de Trazabilidad', description: 'Permite avanzar las fases del flujo (Aprobar, Devolver, Corregir).' },
    { key: 'gestionar_usuarios_y_permisos', label: 'Gestionar Usuarios y Permisos', description: 'Creación, edición, activación/desactivación y alteración de roles de usuario.' },
    { key: 'ver_y_exportar_excel_maestro', label: 'Ver y Exportar Excel Maestro', description: 'Acceso a la previsualización y descarga del libro BASE_ERRORES_FORMULAS.xlsx.' },
    { key: 'ver_dashboard_y_reportes', label: 'Ver Dashboard y Reportes', description: 'Acceso a la analítica de tasas, KPIs, gráficas y distribuciones.' },
    { key: 'ver_audit_log', label: 'Ver Audit Log', description: 'Acceso a la bitácora histórica de acciones del sistema.' },
    { key: 'registrar_volumen_total_formulas', label: 'Registrar Volumen de Fórmulas', description: 'Carga del denominador de fórmulas validadas totales para calcular el % de error de EPS.' },
  ];

  const rolesList: UserRole[] = [
    'Administrador',
    'Registro',
    'QuimicoFarmaceutico',
    'Corrector',
    'Consulta',
  ];

  const togglePermission = (permKey: string, role: UserRole) => {
    // Avoid removing Administrator's vital permissions for safety
    if (role === 'Administrador') {
      setFeedback('Por motivos de seguridad, no se permite revocar de forma interactiva los permisos del Administrador.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }

    const currentRoles = matrix[permKey] || [];
    let updated: UserRole[];
    if (currentRoles.includes(role)) {
      updated = currentRoles.filter((r) => r !== role);
    } else {
      updated = [...currentRoles, role];
    }

    setMatrix({ ...matrix, [permKey]: updated });
    onAddAuditLog(
      'Configuración Permisos',
      `Modificó el permiso "${permKey}" para el rol "${role}" en la matriz interactiva.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </button>
        <span className="text-xs text-[#9CA3AF]">
          Configuración / <span className="text-gray-300">Roles y Permisos</span>
        </span>
      </div>

      <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F3F4F6] flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" />
              Matriz de Roles y Permisos (RBAC)
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Asignación dinámica de permisos del sistema para cada uno de los 4 roles requeridos.
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-[#F59E0B] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Matrix table */}
        <div className="overflow-x-auto rounded-lg border border-[#1F2937]">
          <table id="permissions-matrix-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1F2937]/50 text-gray-400 font-semibold border-b border-[#1F2937]">
                <th className="p-3.5 w-64">Módulo / Permiso</th>
                {rolesList.map((role) => (
                  <th key={role} className="p-3.5 text-center w-28 whitespace-nowrap">
                    {role === 'QuimicoFarmaceutico'
                      ? 'Q. Farmacéutico'
                      : role === 'Consulta'
                      ? 'Consulta (Auditor)'
                      : role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/50">
              {permissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-[#1C263E]/30 transition">
                  <td className="p-3.5 space-y-1">
                    <p className="font-bold text-gray-200">{perm.label}</p>
                    <p className="text-[10px] text-gray-500 font-sans leading-tight">
                      {perm.description}
                    </p>
                  </td>
                  {rolesList.map((role) => {
                    const isGranted = (matrix[perm.key] || []).includes(role);

                    return (
                      <td key={role} className="p-3.5 text-center">
                        <button
                          id={`toggle-matrix-${perm.key}-${role}`}
                          type="button"
                          onClick={() => togglePermission(perm.key, role)}
                          className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition border ${
                            isGranted
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                              : 'bg-transparent border-[#1F2937] text-gray-600 hover:text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          {isGranted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Informative footer */}
        <div className="bg-[#0B1120] border border-[#1F2937] p-4 rounded-lg flex gap-3 text-xs text-[#9CA3AF]">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-gray-300">Control de Acceso Basado en Roles (RBAC)</p>
            <p>
              Cualquier cambio realizado en esta matriz se refleja inmediatamente en los componentes correspondientes durante la sesión activa. Por ejemplo, si quita el permiso de Reportes al Químico Farmacéutico, este ya no podrá ver la sección respectiva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
