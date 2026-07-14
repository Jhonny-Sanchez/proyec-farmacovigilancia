/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Usuario } from '../types';
import { KeyRound, X, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface CambiarClaveModalProps {
  currentUser: Usuario;
  onChangePassword: (nuevaClave: string) => void;
  onClose: () => void;
}

// Modal de seguridad: permite a CADA usuario cambiar su propia contraseña.
// Valida la contraseña actual antes de aceptar la nueva.
export default function CambiarClaveModal({
  currentUser,
  onChangePassword,
  onClose,
}: CambiarClaveModalProps) {
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirmacion, setClaveConfirmacion] = useState('');
  const [mostrarClaves, setMostrarClaves] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!claveActual || !claveNueva || !claveConfirmacion) {
      setError('Por favor complete todos los campos.');
      return;
    }

    if (claveActual !== currentUser.contrasena) {
      setError('La contraseña actual es incorrecta.');
      return;
    }

    if (claveNueva.length < 6) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    if (claveNueva === claveActual) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    if (claveNueva !== claveConfirmacion) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    onChangePassword(claveNueva);
    setExito(true);
    setTimeout(() => onClose(), 1800);
  };

  const inputClass =
    'w-full bg-[#0B1120] border border-[#1F2937] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-gray-600 focus:border-[#3B82F6] outline-none transition font-mono';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#131B2E] border border-[#1F2937] rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
          <div className="flex items-center gap-2 text-[#F3F4F6]">
            <KeyRound className="w-4 h-4 text-[#3B82F6]" />
            <h2 className="text-sm font-bold">Cambiar Mi Contraseña</h2>
          </div>
          <button
            id="close-password-modal-btn"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#1F2937] text-gray-500 hover:text-white transition"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
          Cuenta: <span className="font-mono font-bold text-[#22D3EE]">{currentUser.nombre_usuario}</span>.
          Por seguridad, confirme su contraseña actual antes de definir la nueva.
        </p>

        {exito ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>¡Contraseña actualizada con éxito! Úsela en su próximo inicio de sesión.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[#EF4444] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#9CA3AF]">Contraseña Actual</label>
              <input
                id="current-password-input"
                type={mostrarClaves ? 'text' : 'password'}
                placeholder="Ingrese su contraseña actual..."
                value={claveActual}
                onChange={(e) => setClaveActual(e.target.value)}
                className={inputClass}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#9CA3AF]">Nueva Contraseña</label>
              <input
                id="new-password-input"
                type={mostrarClaves ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres..."
                value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#9CA3AF]">Confirmar Nueva Contraseña</label>
              <input
                id="confirm-password-input"
                type={mostrarClaves ? 'text' : 'password'}
                placeholder="Repita la nueva contraseña..."
                value={claveConfirmacion}
                onChange={(e) => setClaveConfirmacion(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <button
              type="button"
              id="toggle-show-passwords-btn"
              onClick={() => setMostrarClaves(!mostrarClaves)}
              className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] hover:text-[#22D3EE] transition font-semibold"
            >
              {mostrarClaves ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {mostrarClaves ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            </button>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                id="cancel-password-change-btn"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-[#1F2937] text-xs font-semibold text-[#9CA3AF] hover:text-white hover:bg-[#1F2937]/40 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="submit-password-change-btn"
                className="flex-1 py-2 bg-[#3B82F6] hover:bg-blue-600 text-xs font-bold text-white rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Guardar Contraseña
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
