/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useRef, useState } from 'react';
import { DocumentoAdjunto } from '../types';
import { obtenerEnlacePDF, subirPDF } from '../dataService';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PenLine, Type, Eraser, Save, X, Loader2, AlertCircle } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfAnnotatorModalProps {
  doc: DocumentoAdjunto;
  idRegistro: string;
  tipo: string; // categoría del documento (ej. formula_medica)
  usuario: string;
  onClose: () => void;
  // Devuelve los campos actualizados del documento (nueva url, nombre y notas)
  onSaved: (camposDoc: Partial<DocumentoAdjunto>) => void;
}

type Herramienta = 'lapiz' | 'texto';

export default function PdfAnnotatorModal({
  doc,
  idRegistro,
  tipo,
  usuario,
  onClose,
  onSaved,
}: PdfAnnotatorModalProps) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [herramienta, setHerramienta] = useState<Herramienta>('lapiz');

  const contenedorRef = useRef<HTMLDivElement>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null);
  const overlaysRef = useRef<HTMLCanvasElement[]>([]);
  const editadasRef = useRef<Set<number>>(new Set());
  const herramientaRef = useRef<Herramienta>('lapiz');

  useEffect(() => {
    herramientaRef.current = herramienta;
  }, [herramienta]);

  // Cargar el PDF y renderizar cada página con su capa de dibujo encima
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        if (!doc.url) {
          setError('Este documento no tiene un archivo PDF real asociado, no es posible anotarlo.');
          setCargando(false);
          return;
        }
        const enlace = await obtenerEnlacePDF(doc.url);
        if (!enlace) throw new Error('No se pudo generar el enlace del documento.');

        const resp = await fetch(enlace);
        if (!resp.ok) throw new Error('No se pudo descargar el documento.');
        const bytes = await resp.arrayBuffer();
        pdfBytesRef.current = bytes;

        // pdfjs consume (transfiere) el buffer: se le entrega una copia
        const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
        if (cancelado || !contenedorRef.current) return;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const wrapper = document.createElement('div');
          wrapper.style.position = 'relative';
          wrapper.style.margin = '0 auto 16px auto';
          wrapper.style.width = `${viewport.width}px`;
          wrapper.style.maxWidth = '100%';

          const base = document.createElement('canvas');
          base.width = viewport.width;
          base.height = viewport.height;
          base.style.width = '100%';
          base.style.display = 'block';
          base.style.background = 'white';
          base.style.borderRadius = '8px';

          const overlay = document.createElement('canvas');
          overlay.width = viewport.width;
          overlay.height = viewport.height;
          overlay.style.width = '100%';
          overlay.style.position = 'absolute';
          overlay.style.inset = '0';
          overlay.style.cursor = 'crosshair';
          overlay.style.touchAction = 'none';

          conectarDibujo(overlay, i - 1);

          wrapper.appendChild(base);
          wrapper.appendChild(overlay);
          contenedorRef.current.appendChild(wrapper);
          overlaysRef.current[i - 1] = overlay;

          const ctx = base.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport } as any).promise;
        }
        if (!cancelado) setCargando(false);
      } catch (err) {
        console.error('Error al cargar PDF para anotación:', err);
        if (!cancelado) {
          setError('No se pudo cargar el documento para anotarlo. Intente nuevamente.');
          setCargando(false);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Habilita lápiz y notas de texto sobre la capa transparente de una página
  const conectarDibujo = (overlay: HTMLCanvasElement, indicePagina: number) => {
    const ctx = overlay.getContext('2d')!;
    let dibujando = false;

    const puntoDe = (e: PointerEvent) => {
      const rect = overlay.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * overlay.width) / rect.width,
        y: ((e.clientY - rect.top) * overlay.height) / rect.height,
      };
    };

    overlay.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const p = puntoDe(e);

      if (herramientaRef.current === 'texto') {
        const texto = window.prompt('Escriba la nota que quedará sobre el PDF:');
        if (texto && texto.trim()) {
          ctx.font = 'bold 22px Arial';
          ctx.fillStyle = '#DC2626';
          texto.split('\n').forEach((linea, n) => {
            ctx.fillText(linea, p.x, p.y + n * 26);
          });
          editadasRef.current.add(indicePagina);
        }
        return;
      }

      dibujando = true;
      overlay.setPointerCapture(e.pointerId);
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });

    overlay.addEventListener('pointermove', (e) => {
      if (!dibujando) return;
      const p = puntoDe(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      editadasRef.current.add(indicePagina);
    });

    const terminar = () => {
      dibujando = false;
    };
    overlay.addEventListener('pointerup', terminar);
    overlay.addEventListener('pointerleave', terminar);
  };

  const limpiarTodo = () => {
    overlaysRef.current.forEach((overlay) => {
      overlay.getContext('2d')!.clearRect(0, 0, overlay.width, overlay.height);
    });
    editadasRef.current.clear();
  };

  // Fusiona las anotaciones dentro del PDF, lo sube y reemplaza la referencia
  const guardarYReemplazar = async () => {
    if (editadasRef.current.size === 0) {
      alert('Aún no ha escrito ni dibujado nada sobre el PDF.');
      return;
    }
    if (!pdfBytesRef.current) return;
    setGuardando(true);
    setError('');

    try {
      const pdfDoc = await PDFDocument.load(pdfBytesRef.current);
      const paginas = pdfDoc.getPages();

      for (const idx of editadasRef.current) {
        const overlay = overlaysRef.current[idx];
        const pagina = paginas[idx];
        if (!overlay || !pagina) continue;
        const png = await pdfDoc.embedPng(overlay.toDataURL('image/png'));
        pagina.drawImage(png, {
          x: 0,
          y: 0,
          width: pagina.getWidth(),
          height: pagina.getHeight(),
        });
      }

      const bytes = await pdfDoc.save();
      const nombreNuevo = doc.nombre_archivo.replace(/\.pdf$/i, '').replace(/_ANOTADO$/i, '') + '_ANOTADO.pdf';
      const archivo = new File([bytes as BlobPart], nombreNuevo, { type: 'application/pdf' });

      const ruta = await subirPDF(archivo, idRegistro, tipo);
      if (!ruta) throw new Error('No se pudo subir el PDF anotado.');

      onSaved({
        url: ruta,
        nombre_archivo: nombreNuevo,
        tamano: `${(bytes.length / 1048576).toFixed(2)} MB`,
        notas: `${doc.notas ? doc.notas + ' | ' : ''}PDF anotado por ${usuario} el ${new Date().toLocaleDateString()}: revise las notas escritas sobre el documento.`,
      });
    } catch (err) {
      console.error('Error al guardar PDF anotado:', err);
      setError('Ocurrió un error al guardar el PDF anotado. Intente nuevamente.');
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2">
      <div className="relative bg-[#0F172A] border border-[#1E293B] rounded-2xl w-[98vw] max-w-[1500px] h-[96vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Barra de herramientas */}
        <div className="bg-[#1E293B] px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#334155]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PenLine className="w-4 h-4 text-red-400" />
              Escribir sobre el PDF
            </h3>
            <p className="text-[11px] text-gray-400 font-mono truncate max-w-[420px]">{doc.nombre_archivo}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="tool-lapiz"
              onClick={() => setHerramienta('lapiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                herramienta === 'lapiz'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-[#0B1120] text-gray-300 border-[#334155] hover:text-white'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              Lápiz
            </button>
            <button
              id="tool-texto"
              onClick={() => setHerramienta('texto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                herramienta === 'texto'
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-[#0B1120] text-gray-300 border-[#334155] hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Nota de Texto
            </button>
            <button
              id="tool-limpiar"
              onClick={limpiarTodo}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0B1120] text-gray-300 border border-[#334155] hover:text-white transition flex items-center gap-1.5"
            >
              <Eraser className="w-3.5 h-3.5" />
              Limpiar Todo
            </button>

            <button
              id="btn-guardar-anotado"
              onClick={guardarYReemplazar}
              disabled={guardando || cargando}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {guardando ? 'Guardando...' : 'Guardar y Reemplazar PDF'}
            </button>
            <button
              onClick={onClose}
              disabled={guardando}
              className="p-2 bg-[#334155] hover:bg-red-500 hover:text-white text-gray-300 rounded-lg transition"
              title="Cerrar sin guardar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-[11px] text-red-300">
          Use el <strong>Lápiz</strong> para subrayar o encerrar el error, o la <strong>Nota de Texto</strong> (haga clic donde quiere la nota). Al guardar, el PDF original se reemplaza por la versión anotada y quien corrige verá sus notas.
        </div>

        {/* Lienzo de páginas */}
        <div className="flex-1 overflow-y-auto bg-slate-800 p-4">
          {cargando && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-300">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              <span className="text-sm">Cargando documento para anotación...</span>
            </div>
          )}
          {error && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-sm text-amber-400 font-semibold max-w-md">{error}</p>
            </div>
          )}
          <div ref={contenedorRef} />
        </div>
      </div>
    </div>
  );
}
