import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface LectorCamaraProps {
  onScan: (codigo: string) => void;
  onClose: () => void;
}

export const LectorCamara = ({ onScan, onClose }: LectorCamaraProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scanBloqueadoRef = useRef<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let html5QrcodeScanner: Html5QrcodeScanner | null = null;

    // 🛑 FIX: Retrasamos la carga 100ms para saltarnos el "doble render" de React 18
    const timeoutId = setTimeout(() => {
      if (!isMounted) return; // Si React desmontó el componente rápido, no hacemos nada

      html5QrcodeScanner = new Html5QrcodeScanner(
        "reader-container",
        { 
          fps: 15,
          showTorchButtonIfSupported: true, // Habilita el flash en dispositivos compatibles
          // 📷 FIX: Usar "ideal" evita que el lector crashee si lo pruebas en una PC sin cámara trasera
          videoConstraints: {
            facingMode: { ideal: "environment" } 
          },
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgePercentage = 0.7; 
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const baseSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: viewfinderWidth > 500 ? 300 : baseSize,
              height: viewfinderWidth > 500 ? 150 : baseSize
            };
          },
          aspectRatio: 1.0,
        },
        false
      );
      
      scannerRef.current = html5QrcodeScanner;

      html5QrcodeScanner.render(
        (codigoDecodificado) => {
          if (scanBloqueadoRef.current) return;
          scanBloqueadoRef.current = true;

          onScan(codigoDecodificado);
          setMensajeExito(`¡Escaneado: ${codigoDecodificado}!`);
          
          setTimeout(() => {
            scanBloqueadoRef.current = false;
            setMensajeExito(null);
          }, 1500);
        },
        () => {}
      );
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId); // Cancelamos el timeout si fue un render fantasma

      // Apagamos la cámara de forma segura si ya se había encendido
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
          // Limpieza manual de seguridad por si quedan rastros en el HTML
          const el = document.getElementById("reader-container");
          if (el) el.innerHTML = "";
        }).catch((err) => {
          console.warn("Aviso al desmontar la cámara:", err);
        });
      }
    };
  }, [onScan]);

  const manejarCierreManual = async () => {
    if (scannerRef.current) {
      try { 
        await scannerRef.current.clear(); 
      } catch (error) {
        console.error("Error al cerrar la cámara manual:", error);
      }
    }
    const containerEl = document.getElementById("reader-container");
    if (containerEl) containerEl.innerHTML = "";
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white p-4 sm:p-6 rounded-2xl w-full max-w-lg shadow-2xl relative border border-gray-100 flex flex-col max-h-[95vh]">
        
        <button 
          type="button"
          onClick={manejarCierreManual}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 rounded-full w-8 h-8 flex items-center justify-center font-bold z-10 transition-colors shadow-sm"
        >
          ✕
        </button>
        
        <h3 className="text-base sm:text-lg font-black text-gray-800 mb-2 sm:mb-4 text-center flex items-center justify-center gap-2">
          <span>📷</span> Escanear Producto
        </h3>
        
        <div className="relative flex-1 min-h-[300px] w-full overflow-hidden rounded-xl border bg-gray-900 shadow-inner flex flex-col items-center justify-center">
          
          <div 
            id="reader-container" 
            className="w-full h-full 
              [&_video]:object-cover [&_video]:w-full [&_video]:h-full 
              [&_button]:absolute [&_button]:top-4 [&_button]:left-4 [&_button]:z-20 [&_button]:bg-blue-600 [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-lg [&_button]:font-bold [&_button]:shadow-md [&_button]:hover:bg-blue-700"
          ></div>
          
          {mensajeExito && (
            <div className="absolute inset-0 bg-green-500/95 flex flex-col items-center justify-center z-50 text-white p-4 animate-in fade-in zoom-in duration-200">
              <span className="text-5xl sm:text-6xl mb-3">✅</span>
              <span className="font-bold text-center text-sm sm:text-lg">{mensajeExito}</span>
            </div>
          )}
        </div>
        
        <p className="text-[10px] sm:text-xs text-center text-gray-500 mt-3 font-medium">
          Apunta la cámara al código. Se mantendrá activa para lecturas múltiples.
        </p>
      </div>
    </div>
  );
};