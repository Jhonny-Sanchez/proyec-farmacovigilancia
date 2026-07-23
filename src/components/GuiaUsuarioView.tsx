/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  User,
  Shield,
  FileText,
  Layers,
  Settings,
  PlayCircle,
  Activity,
  FileCheck,
  BarChart3,
  Download,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Info,
} from 'lucide-react';
import { UserRole } from '../types';

interface GuiaUsuarioViewProps {
  onNavigate: (page: string) => void;
  currentUserRole: UserRole;
}

export default function GuiaUsuarioView({ onNavigate, currentUserRole }: GuiaUsuarioViewProps) {
  const [selectedRoleGuide, setSelectedRoleGuide] = useState<UserRole>(currentUserRole);
  const [activeTab, setActiveTab] = useState<'flujo' | 'roles' | 'calculos' | 'faq'>('flujo');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const steps = [
    {
      number: '01',
      title: 'Captura y Validación de Paciente',
      role: 'Registro (Auxiliar / Regente)',
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      description: 'Ingreso inicial del paciente y carga obligatoria de los 4 soportes en PDF. Si el paciente ya existe, se recuperan automáticamente sus datos básicos.',
      details: [
        'Haga clic en "Nuevo Registro". Ingrese la cédula o documento del paciente.',
        'Si ya existía, haga clic en el botón "Recuperar Datos" para rellenar automáticamente sus datos personales, médico e institución.',
        'Adjunte obligatoriamente los 4 archivos PDF (Historia Clínica, Politerapia, Fórmula y Consentimiento) para el nuevo ciclo de tratamiento, escriba notas si es necesario y guarde el caso. Se creará en estado "Registrada - Pendiente QF" (ENTREGADO_QF).',
      ],
      actionLabel: 'Ir a Nuevo Registro',
      actionPage: 'nuevo_registro',
    },
    {
      number: '02',
      title: 'Auditoría Farmacéutica y Hallazgos',
      role: 'Químico Farmacéutico (QF)',
      icon: <Activity className="w-5 h-5 text-purple-400" />,
      badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      description: 'Verificación técnica detallada de los 4 documentos PDF. Si se detecta un error de prescripción, se documenta la objeción clínica y se devuelve para subsanación.',
      details: [
        'Vaya a la "Bandeja de Fórmulas". Seleccione el registro que tiene la alerta "Registrada - Pendiente QF".',
        'Revise detenidamente los 4 documentos adjuntos usando el visor digital.',
        'Si hay error en la dosis o vía, haga clic en "Reportar Error de Prescripción", documente los hallazgos clínicos y guarde. El estado cambiará a "Con Error - Pendiente Corrección" (CON_ERROR_REGISTRADO).',
      ],
      actionLabel: 'Ver Bandeja de Fórmulas',
      actionPage: 'registros',
    },
    {
      number: '03',
      title: 'Subsanación y Carga de Corrección',
      role: 'Registro (Auxiliar / Regente)',
      icon: <FileCheck className="w-5 h-5 text-amber-400" />,
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      description: 'El personal de registro recibe la notificación del error clínico, gestiona la fórmula corregida con el médico y carga el soporte correctivo.',
      details: [
        'En la bandeja, busque casos en estado "Con Error - Pendiente Corrección".',
        'Abra el caso para leer las observaciones detalladas del Químico Farmacéutico.',
        'Haga clic en el botón de adjuntar documento correctivo, arrastre el nuevo PDF firmado y guarde. El estado cambiará automáticamente a "Corregida - Pendiente Verificación QF" (CORREGIDA_PENDIENTE_VERIFICACION) para su re-evaluación.',
      ],
      actionLabel: 'Ver Bandeja de Fórmulas',
      actionPage: 'registros',
    },
    {
      number: '04',
      title: 'Aprobación Final de Mezcla',
      role: 'Químico Farmacéutico (QF)',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      description: 'El Químico valida la nueva versión corregida cargada. Si todo es conforme a protocolos, autoriza el registro para iniciar la fase de dosificación y agendamiento.',
      details: [
        'Abra el caso en estado "Corregida - Pendiente Verificación QF".',
        'Inspeccione el documento marcado con la etiqueta "Corrección".',
        'Haga clic en "Aprobar Fórmula y Soportes". El estado avanzará a "Aprobada - Proceso Finalizado" (ENTREGADO_PROGRAMACION), habilitando el agendamiento del tratamiento.',
      ],
      actionLabel: 'Ver Bandeja de Fórmulas',
      actionPage: 'registros',
    },
    {
      number: '05',
      title: 'Asignación de Ciclos y Programación de Aplicaciones',
      role: 'Programador de Tratamiento',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      description: 'Asignación de la cantidad de ciclos y días de administración del esquema de quimioterapia, y proyección de las fechas de aplicación del medicamento.',
      details: [
        'Inicie sesión como Programador o use la prueba rápida. Busque un registro aprobado en la bandeja.',
        'Ingrese los valores numéricos correspondientes a la "Cantidad de Ciclos" y "Días de Administración" (ej. 6 ciclos y 3 días de aplicación).',
        'Vaya al módulo "Programación de Aplicaciones" para agendar y proyectar las citas de infusión específicas (Ciclo X, Día Y) para el paciente basándose en su esquema terapéutico.',
      ],
      actionLabel: 'Programar Aplicaciones',
      actionPage: 'programacion_citas',
    },
  ];

  const roleGuides: Record<UserRole, { title: string; desc: string; responsibilities: string[]; tip: string }> = {
    Administrador: {
      title: 'Guía de Control Total (Administrador)',
      desc: 'Tiene acceso ilimitado a todos los módulos. Su principal función es velar por la disponibilidad del sistema, gestionar cuentas de usuario, configurar la matriz de permisos y revisar la bitácora técnica.',
      responsibilities: [
        'Crear, suspender o cambiar roles de usuario en el menú "Usuarios Sistema".',
        'Ajustar permisos finos en la "Matriz de Roles y Permisos" interactiva.',
        'Inspeccionar el historial de acciones inmutables en "Audit Log" para auditorías normativas.',
        'Cargar denominadores e indicadores de volumen total de fórmulas.',
      ],
      tip: 'Los roles son fijos por cuenta y se asignan desde el módulo "Usuarios Sistema". Ningún usuario, incluido el Administrador, puede cambiar el rol de su propia sesión.',
    },
    Registro: {
      title: 'Guía de Captura y Corrección (Perfil Registro)',
      desc: 'Frente de batalla de la seguridad. Registra nuevos pacientes de forma ágil, ingresa los 4 soportes en PDF y se encarga de subsanar y subir correcciones de archivos cuando el Químico Farmacéutico reporta algún hallazgo.',
      responsibilities: [
        'Ingresar nuevos pacientes recopilando Nombres, Apellidos, Identificación y EPS.',
        'Cargar de forma obligatoria los 4 archivos en PDF (Historia Clínica, Politerapia, Fórmula Médica y Consentimiento) con sus respectivas notas de registro.',
        'Hacer seguimiento a los casos devueltos en estado "Con Error Registrado", corregir los soportes solicitados y reenviar a validación.',
      ],
      tip: 'La carga de correcciones se realiza directamente desde el expediente digital en la Bandeja de Fórmulas.',
    },
    QuimicoFarmaceutico: {
      title: 'Guía de Validación y Análisis (Perfil Químico Farmacéutico)',
      desc: 'Actúa como el validador científico del sistema. Analiza las prescripciones y los 4 soportes adjuntos, aprueba el despacho seguro o devuelve detallando los hallazgos clínicos de error.',
      responsibilities: [
        'Monitorear la Bandeja de Fórmulas buscando registros pendientes en estado "Entregado QF" o "Re-Verificación".',
        'Verificar minuciosamente los soportes PDF y registrar las observaciones del análisis técnico.',
        'Registrar el volumen total de fórmulas validadas mensuales para el cálculo de tasas reales de error.',
      ],
      tip: 'Recuerde que el registro del volumen de fórmulas validadas es vital para que las gráficas de tasas de error calculen la información de forma real.',
    },
    Programador: {
      title: 'Guía de Programación y Agendamiento (Perfil Programador)',
      desc: 'Encargado de agendar y autorizar la preparación de las mezclas oncológicas validadas. Registra en la bandeja de fórmulas la cantidad de ciclos y los días de administración del tratamiento, y utiliza el nuevo módulo "Programación de Aplicaciones" para agendar y proyectar las fechas específicas para cada día de ciclo del paciente.',
      responsibilities: [
        'Monitorear la bandeja buscando registros en estado "Aprobado" listos para programar.',
        'Asignar los parámetros críticos de tratamiento del paciente: Cantidad de Ciclos totales y Días de Administración.',
        'Planificar y agendar la aplicación del medicamento para cada día y ciclo específico mediante el módulo de programación de citas.',
      ],
      tip: 'La programación es el paso final que garantiza que el paciente reciba su terapia oncológica de manera oportuna y dosificada de acuerdo con el protocolo médico.',
    },
    Corrector: {
      title: 'Guía de Corrección de Fórmulas (Perfil Corrector)',
      desc: 'Encargado de subsanar los hallazgos reportados por el Químico Farmacéutico. Revisa las notas escritas sobre los PDF glosados, adjunta la fórmula y los documentos corregidos, y reenvía el expediente a farmacia para su re-verificación.',
      responsibilities: [
        'Monitorear la Bandeja de Fórmulas buscando registros en estado "Con Error - Pendiente Corrección".',
        'Abrir los PDF anotados por el Químico Farmacéutico para identificar exactamente qué se debe corregir.',
        'Adjuntar la fórmula médica y demás soportes corregidos desde el Expediente Digital.',
        'Marcar el registro como "Corregido" para devolverlo al Químico Farmacéutico.',
      ],
      tip: 'Los documentos con notas del Químico Farmacéutico aparecen con el sufijo "_ANOTADO" en el nombre del archivo.',
    },
    Consulta: {
      title: 'Guía de Consulta y Auditoría de Lectura',
      desc: 'Diseñado para entes de control, comités de farmacovigilancia o auditores médicos. Posee acceso de solo lectura al dashboard, reportes analíticos y previsualización de datos.',
      responsibilities: [
        'Analizar las tendencias de tasas de error en el dashboard principal.',
        'Revisar informes de distribución de errores por EPS, médicos prescriptores y medicamentos.',
        'Consultar la bandeja para auditorías de historias clínicas o trazabilidad sin riesgo de modificar o eliminar datos.',
      ],
      tip: 'Use los filtros rápidos de la bandeja de fórmulas para segmentar los errores por EPS o por Tipo de Error de manera inmediata.',
    },
  };

  const faqs = [
    {
      q: '¿Cómo se calcula técnicamente la Tasa de Error?',
      a: 'La Tasa de Error se calcula dividiendo la cantidad de Errores de Prescripción Registrados entre el Volumen Total de Fórmulas Validadas (denominador) cargadas para el mismo periodo/EPS, y luego multiplicando por 100 para obtener el porcentaje. Si no se cargan denominadores para una EPS, el sistema mostrará la tasa sobre el acumulado general registrado.',
    },
    {
      q: '¿Qué es el modelo de Trazabilidad en Fases de este sistema?',
      a: 'Para asegurar la doble verificación clínica, una fórmula médica con error no pasa de "Registrado" a "Finalizado" directamente. Pasa por un flujo controlado: 1. Registrado por Regente -> 2. Recibido y Analizado por Químico Farmacéutico -> 3. Entregado al área clínica (Sala de Quimio o Consulta Externa) -> 4. Verificado y Finalizado por el personal asistencial.',
    },
    {
      q: '¿Dónde se exporta la base de datos de errores para el Ministerio o la EPS?',
      a: 'Ingrese al módulo "Exportar a Excel" en el menú lateral. El sistema consolidará toda la base de datos simulando el formato corporativo oficial "BASE_ERRORES_FORMULAS.xlsx" y registrará la acción de exportación en el Audit Log para cumplir con la normatividad de protección de datos.',
    },
    {
      q: '¿Puedo cambiar de rol dentro del sistema?',
      a: 'No. Cada cuenta tiene un único rol fijo asignado por el Administrador y la sesión no permite alternar entre perfiles. Si sus funciones cambian, solicite al Administrador la actualización de su rol en el módulo "Usuarios Sistema"; el cambio queda registrado en el Audit Log y se aplica de inmediato en la sesión del usuario.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F3F4F6] transition font-semibold"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Volver al Dashboard
        </button>
        <span className="text-xs text-[#9CA3AF]">
          Guías / <span className="text-gray-300">Paso a Paso del Sistema</span>
        </span>
      </div>

      {/* Main Container Card */}
      <div className="bg-[#131B2E] border border-[#1F2937] rounded-xl p-6 space-y-6">
        {/* Title Section */}
        <div className="border-b border-[#1F2937] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F3F4F6] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Manual de Operación y Paso a Paso Interactiva
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Aprenda a administrar el sistema, gestionar los flujos de trazabilidad y comprender los indicadores de farmacovigilancia.
            </p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
          >
            <PlayCircle className="w-4 h-4" />
            Comenzar Operación
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#1F2937] text-xs">
          <button
            onClick={() => setActiveTab('flujo')}
            className={`px-4 py-2.5 font-bold border-b-2 transition ${
              activeTab === 'flujo'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#1F2937]/30'
            }`}
          >
            Flujo de Trazabilidad (4 Pasos)
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 font-bold border-b-2 transition ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#1F2937]/30'
            }`}
          >
            Guía por Rol Funcional
          </button>
          <button
            onClick={() => setActiveTab('calculos')}
            className={`px-4 py-2.5 font-bold border-b-2 transition ${
              activeTab === 'calculos'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#1F2937]/30'
            }`}
          >
            Fórmulas y Cálculos Clínicos
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2.5 font-bold border-b-2 transition ${
              activeTab === 'faq'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-[#1F2937]/30'
            }`}
          >
            Preguntas Frecuentes
          </button>
        </div>

        {/* Tab 1: Flujo de Trazabilidad */}
        {activeTab === 'flujo' && (
          <div className="space-y-6">
            <div className="bg-[#0B1120] border border-[#1F2937] p-4 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-200">El Ciclo de Seguridad de la Prescripción Oncológica</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Este sistema implementa una barrera de seguridad activa de cuatro fases de verificación que garantiza que ningún medicamento oncológico sea administrado si presenta un error de prescripción, permitiendo el registro, análisis farmacéutico, corrección y verificación por enfermería.
                </p>
              </div>
            </div>

            {/* Steps Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {steps.map((st, idx) => (
                <div key={st.number} className="bg-[#0B1120]/60 border border-[#1F2937] rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Step head */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-extrabold text-gray-700 font-mono">{st.number}</span>
                      <div className="p-1.5 bg-[#1F2937] rounded-lg">
                        {st.icon}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#F3F4F6]">{st.title}</h4>
                    </div>

                    <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                      {st.description}
                    </p>

                    {/* Step items bullet */}
                    <ul className="text-[10px] text-gray-500 space-y-1 pt-2 list-disc list-inside">
                      {st.details.map((det, dIdx) => (
                        <li key={dIdx} className="leading-tight">
                          {det}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => onNavigate(st.actionPage)}
                    className="w-full mt-4 py-1.5 bg-[#1F2937] hover:bg-[#3B82F6] hover:text-white text-gray-400 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1 border border-transparent hover:border-[#3B82F6]/30"
                  >
                    <span>{st.actionLabel}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Guía por Rol Funcional */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column: Role guide navigator list */}
              <div className="md:w-1/3 bg-[#0B1120]/60 border border-[#1F2937] rounded-xl p-4 space-y-2 h-fit">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 pb-2 border-b border-[#1F2937]">
                  Seleccione Perfil Clínico
                </p>
                <div className="space-y-1 pt-2">
                  {[
                    { val: 'Administrador', label: 'Administrador del Sistema', color: 'border-red-500/40 text-red-400' },
                    { val: 'Registro', label: 'Personal de Registro (Regente)', color: 'border-[#22D3EE]/40 text-[#22D3EE]' },
                    { val: 'QuimicoFarmaceutico', label: 'Químico Farmacéutico', color: 'border-blue-500/40 text-blue-400' },
                    { val: 'Consulta', label: 'Auditor Médico (Solo Lectura)', color: 'border-emerald-500/40 text-emerald-400' },
                  ].map((roleOpt) => (
                    <button
                      key={roleOpt.val}
                      onClick={() => setSelectedRoleGuide(roleOpt.val as UserRole)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between border ${
                        selectedRoleGuide === roleOpt.val
                          ? 'bg-blue-600/10 border-blue-500 text-white'
                          : 'bg-transparent border-transparent text-[#9CA3AF] hover:bg-[#1F2937]/30 hover:text-white'
                      }`}
                    >
                      <span>{roleOpt.label}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition ${selectedRoleGuide === roleOpt.val ? 'text-blue-400 rotate-90' : 'text-gray-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Active Role Detailed instructions */}
              <div className="flex-1 bg-[#0B1120]/40 border border-[#1F2937] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3">
                  <User className="w-5 h-5 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">{roleGuides[selectedRoleGuide].title}</h4>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {roleGuides[selectedRoleGuide].desc}
                </p>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-[#22D3EE]">Responsabilidades Clave en el Sistema:</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {roleGuides[selectedRoleGuide].responsibilities.map((resp, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical role tip */}
                <div className="bg-blue-900/10 border border-blue-500/20 p-3.5 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Consejo Práctico del Rol</p>
                  <p className="text-[11px] text-blue-200/70 leading-relaxed">
                    {roleGuides[selectedRoleGuide].tip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Fórmulas y Cálculos Clínicos */}
        {activeTab === 'calculos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formula explanation */}
              <div className="bg-[#0B1120]/60 border border-[#1F2937] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 text-[#22D3EE]">
                  <Layers className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Tasa de Error Global (%)</h4>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Para que las tasas de error de farmacovigilancia tengan relevancia real en salud pública, se calculan utilizando el total de fórmulas validadas como denominador (y no solo respecto a sí mismas).
                </p>

                {/* Formula display block */}
                <div className="bg-[#131B2E] border border-[#1F2937] p-4 rounded-xl text-center space-y-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Fórmula Matemática</span>
                  <div className="inline-flex flex-col items-center">
                    <span className="text-xs font-bold text-red-400 pb-1.5 border-b border-[#1F2937] font-mono">
                      Cantidad de Errores Registrados
                    </span>
                    <span className="text-xs font-bold text-blue-400 pt-1.5 font-mono">
                      Fórmulas Validadas Totales (Denominador)
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white px-2">× 100</span>
                </div>

                <p className="text-[10px] text-gray-500 italic leading-snug">
                  * El sistema agrupa esta información de forma mensual y por EPS de manera automática en el módulo "Reportes" para graficar la evolución de la tasa en el tiempo.
                </p>
              </div>

              {/* What to do when denominator is missing */}
              <div className="bg-[#0B1120]/60 border border-[#1F2937] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">¿Cómo Registrar el Volumen (Denominador)?</h4>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Para que las tasas de error por EPS aparezcan de forma real y no queden sesgadas, siga este procedimiento como Químico Farmacéutico:
                </p>

                <div className="space-y-3 text-[11px] text-gray-400">
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono text-[10px] flex-shrink-0">
                      1
                    </span>
                    <p>
                      Ingrese al menú <strong>"Config. Denominadores"</strong> (solo visible si tiene rol de Químico Farmacéutico o Administrador).
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono text-[10px] flex-shrink-0">
                      2
                    </span>
                    <p>
                      Seleccione la fecha de corte, la <strong>Entidad (EPS)</strong> y el médico prescriptor.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono text-[10px] flex-shrink-0">
                      3
                    </span>
                    <p>
                      Escriba la cantidad de fórmulas totales procesadas en ese periodo (ej. 1,240 fórmulas) y haga clic en "Registrar Volumen".
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('configuracion')}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-blue-600 hover:text-white text-xs text-gray-300 font-bold rounded-lg transition border border-transparent hover:border-blue-500/30"
                >
                  Registrar Fórmulas Ahora (Denominadores)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-4 max-w-3xl mx-auto py-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#22D3EE] border-b border-[#1F2937] pb-2 mb-4">
              Preguntas Frecuentes de la Operación
            </h4>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B1120]/40 border border-[#1F2937] rounded-xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between text-xs font-bold text-gray-200 hover:bg-[#1C263E]/30 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${expandedFaq === idx ? 'rotate-90 text-blue-400' : ''}`} />
                  </button>

                  {expandedFaq === idx && (
                    <div className="px-5 pb-4 pt-1 text-[11px] text-gray-400 leading-relaxed border-t border-[#1F2937]/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
