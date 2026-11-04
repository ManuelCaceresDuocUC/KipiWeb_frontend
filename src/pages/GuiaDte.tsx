import { Link } from 'react-router-dom';
import { NavbarPublico } from '../components/publico/NavbarPublico';
import { FooterPublico } from '../components/publico/FooterPublico';
import { CONTACTO, enlaceWhatsApp } from '../config/contacto';

interface Paso {
  titulo: string;
  texto?: string;
  puntos?: string[];
}

const PASOS: Paso[] = [
  {
    titulo: 'Cómo funciona',
    texto:
      'KIPI no emite boletas por sí mismo: las emite un proveedor autorizado por el SII que tú contratas. KIPI se conecta a tu cuenta de ese proveedor y le pide una boleta cada vez que vendes. Esto toma entre 15 y 30 minutos si ya tienes tus datos a mano.',
  },
  {
    titulo: 'Antes de empezar: lo que necesitas',
    puntos: [
      'Tu empresa o tu actividad con inicio de actividades en el SII y un giro que permita emitir boletas.',
      'Los datos de tu empresa tal como figuran en el SII: RUT, razón social, giro, dirección y comuna. Deben ser idénticos en KIPI, en tu proveedor y en el SII.',
      'Tu código de actividad económica (Acteco), de 6 dígitos. Lo encuentras en el sitio del SII, en Mi SII → Actividades económicas.',
      'Estar habilitado para emitir boleta electrónica: certificado digital y folios autorizados. Tu proveedor te guía en esto; pregúntale qué te pide en tu caso.',
    ],
  },
  {
    titulo: 'Paso 1 · Contrata un proveedor',
    texto:
      'Hoy KIPI se conecta con dos proveedores. El precio, las condiciones y los límites son de cada uno y se contratan directamente con ellos:',
    puntos: [
      'OpenFactura (Haulmer): en KIPI pegas la API Key de tu cuenta.',
      'SimpleFactura: en KIPI ingresas el correo y la contraseña de tu cuenta.',
      'Antes de pagar, confirma con el proveedor que tu plan incluye el uso por integración o API (no todos los planes lo incluyen) y pide una cuenta o llave de pruebas si la ofrece.',
      'Los pasos dentro del sitio de cada proveedor pueden cambiar con el tiempo; si algo no coincide, su soporte te ayudará.',
    ],
  },
  {
    titulo: 'Paso 2 · Revisa los datos de tu empresa',
    puntos: [
      'En KIPI, los datos de tu empresa (razón social, giro, dirección y comuna) salen del registro. Compáralos con los del SII; si hay diferencias, el proveedor puede rechazar las boletas.',
      'Si usas SimpleFactura, esos mismos datos se envían en cada boleta.',
    ],
  },
  {
    titulo: 'Paso 3 · Conéctalo en KIPI',
    texto: 'Entra con tu usuario administrador y ve a Administración → Facturación Electrónica DTE.',
    puntos: [
      'Elige tu proveedor.',
      'Elige el entorno: Sandbox / Pruebas para ensayar sin valor tributario, o Producción para emitir boletas oficiales. La llave debe ser del mismo entorno que elijas.',
      'Escribe el RUT del emisor y el Acteco.',
      'Pega la API Key (OpenFactura) o ingresa correo y contraseña (SimpleFactura). Se guardan cifradas y no se vuelven a mostrar.',
      'Pulsa «Probar conexión con proveedor». Si dice que fue aceptada, guarda.',
    ],
  },
  {
    titulo: 'Paso 4 · Elige cuándo emitir',
    puntos: [
      'Efectivo y transferencia: normalmente se dejan activados.',
      'Tarjeta: déjalo desactivado si el voucher de tu máquina (Transbank, Getnet, etc.) ya vale como boleta. Si lo activas, el IVA podría informarse dos veces.',
      'Fiado (crédito): no emite boleta en el momento de la venta.',
    ],
  },
  {
    titulo: 'Paso 5 · Haz una prueba antes de vender',
    puntos: [
      'Lo más seguro es probar primero en el entorno de pruebas con la llave de pruebas: haz una venta en la caja y revisa que llegue el folio y el PDF.',
      'Luego cambia a Producción con tu llave de producción y haz tu primera venta real con atención: revisa en Movimientos que la boleta aparezca emitida.',
      'Una boleta emitida en producción es un documento real. Si te equivocas, se corrige anulando la venta (el sistema pide al proveedor la nota de crédito).',
    ],
  },
  {
    titulo: 'Si algo no funciona',
    puntos: [
      'La venta siempre queda registrada. Si la boleta no sale, queda pendiente y puedes reintentarla desde Movimientos.',
      'Causas frecuentes: llave de otro entorno (pruebas vs. producción), Acteco o datos de la empresa que no coinciden con el SII, folios agotados o plan sin acceso por API.',
      'Sin internet: la venta se guarda en el equipo y la boleta se emite cuando vuelve la conexión, con la fecha de ese momento.',
    ],
  },
  {
    titulo: 'Cuida tus credenciales',
    puntos: [
      'No compartas tu API Key ni tu contraseña. Si sospechas que alguien las vio, cámbialas en tu proveedor y actualízalas en KIPI.',
      'KIPI las guarda cifradas y solo las usa para emitir y consultar tus documentos.',
    ],
  },
];

export const GuiaDte = () => (
  <div className="min-h-screen bg-white font-sans text-slate-800">
    <NavbarPublico />
    <main className="pt-28 pb-16 md:pt-36">
      <div className="max-w-3xl mx-auto px-4 sm:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Guía: conecta tu proveedor de boletas electrónicas</h1>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Para emitir boletas desde KIPI necesitas un proveedor autorizado por el SII. Esta guía te lleva de cero a tu primera boleta.
        </p>

        <ol className="mt-10 space-y-8">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                <span className="text-slate-400 mr-2">{i + 1}.</span>
                {p.titulo}
              </h2>
              {p.texto && <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{p.texto}</p>}
              {p.puntos && (
                <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed text-slate-700">
                  {p.puntos.map((x) => <li key={x}>{x}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-xl bg-slate-900 p-6 text-white">
          <h2 className="text-lg font-semibold">¿Prefieres que te ayudemos?</h2>
          <p className="mt-1 text-sm text-slate-300">
            Te acompañamos en la habilitación, desde elegir el proveedor hasta tu primera boleta. Escríbenos a {CONTACTO.correo}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={enlaceWhatsApp('Hola, necesito ayuda para conectar mi proveedor de boletas electrónicas en KIPI')}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-600"
            >
              Hablar por WhatsApp
            </a>
            <Link to="/configuracion-dte" className="rounded border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800">
              Ir a la configuración
            </Link>
          </div>
        </div>
      </div>
    </main>
    <FooterPublico />
  </div>
);
