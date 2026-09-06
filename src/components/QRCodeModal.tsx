import { QRCodeSVG } from 'qrcode.react';

export function QRCodeModal() {
  // Obtiene el protocolo (http:), el puerto (:5173) y la ruta actual (/usuarios, etc.)
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : '';
  const pathname = window.location.pathname + window.location.search;

  // Obtiene la IP local que detectó Vite
  const localIP = import.meta.env.VITE_LOCAL_IP || 'localhost';

  // Construye la URL con la IP para el móvil
  const qrUrl = `${protocol}//${localIP}${port}${pathname}`;

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-gray-200 inline-block text-center">
      <p className="text-sm font-semibold mb-2 text-gray-700">
        Escanea desde tu celular:
      </p>
      <QRCodeSVG value={qrUrl} size={150} />
      
      {/* Texto informativo opcional para verificar la URL */}
      <p className="text-xs text-gray-400 mt-2 font-mono">{qrUrl}</p>
    </div>
  );
}