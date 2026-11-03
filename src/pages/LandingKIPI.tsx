import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Barcode, Boxes, ChevronRight, FileText, Landmark, Layers, ShieldCheck, Store, Users, Wallet,
} from 'lucide-react';
import { NavbarPublico } from '../components/publico/NavbarPublico';
import { FooterPublico } from '../components/publico/FooterPublico';
import { MaquetaPOS } from '../components/publico/MaquetaPOS';
import { TarjetaPlan } from '../components/publico/TarjetaPlan';
import { DIAS_PRUEBA, PLAN_PRINCIPAL, formatoPrecio } from '../config/planes';
import { CONTACTO, enlaceCorreo } from '../config/contacto';

const FUNCIONES = [
  { icono: Barcode, titulo: 'Punto de venta ágil', texto: 'Vende con lector de código de barras, búsqueda rápida o la cámara del celular. Efectivo, tarjeta, transferencia y fiado.' },
  { icono: Boxes, titulo: 'Inventario en tiempo real', texto: 'Cada venta descuenta stock al instante. Alertas de stock crítico, categorías y recetas con insumos.' },
  { icono: Wallet, titulo: 'Caja y turnos', texto: 'Apertura y cierre de turno con arqueo, movimientos de caja y trazabilidad de quién hizo qué.' },
  { icono: FileText, titulo: 'Boleta y factura electrónica', texto: 'Emite desde el POS con tu proveedor autorizado por el SII. Anulas una venta y KIPI emite la nota de crédito.' },
  { icono: Store, titulo: 'Multi-sucursal', texto: 'Cada sucursal con su stock y su personal. Administra todo tu negocio desde una sola cuenta.' },
  { icono: Users, titulo: 'Equipo con roles', texto: 'Administrador y cajero con permisos distintos: tu equipo vende sin ver lo que no debe.' },
];

const PASOS = [
  { n: '1', titulo: 'Crea tu cuenta, sin tarjeta', texto: `Registra tu empresa, tus sucursales y las cuentas de tu equipo en un solo formulario. Tienes ${DIAS_PRUEBA} días gratis con todo incluido.` },
  { n: '2', titulo: 'Carga tus productos y vende', texto: 'Agrega tu catálogo, abre tu primer turno y empieza a vender desde cualquier computador.' },
  { n: '3', titulo: 'Activa tu suscripción si te sirve', texto: 'Al terminar la prueba inscribes tu tarjeta de forma segura con Flow. Si prefieres no continuar, das de baja tu cuenta desde el sistema.' },
];

const PREGUNTAS = [
  { q: '¿Necesito instalar algo?', a: 'No. KIPI funciona 100 % en el navegador, desde cualquier computador, tablet o celular con internet.' },
  { q: '¿Cómo emito boletas y facturas electrónicas?', a: 'Contratas un proveedor de facturación autorizado por el SII (por ejemplo Haulmer/OpenFactura) y pegas su API Key en KIPI. El costo de ese proveedor es aparte y lo pagas directamente a él.' },
  { q: `¿Cómo funciona la prueba gratuita de ${DIAS_PRUEBA} días?`, a: `Creas tu cuenta sin ingresar tarjeta y usas KIPI completo durante ${DIAS_PRUEBA} días. Te avisamos por correo antes de que termine. Si no activas tu suscripción, la cuenta queda en modo solo lectura y no se te cobra nada.` },
  { q: '¿Cómo se paga la suscripción?', a: `Cuando termine la prueba (o antes, si quieres), inscribes tu tarjeta en Flow. El plan cuesta ${formatoPrecio(PLAN_PRINCIPAL.precioMensual)} al mes y el cobro es automático desde que activas la suscripción.` },
  { q: '¿Puedo cancelar o borrar mi cuenta?', a: 'Sí. Durante la prueba puedes dar de baja tu cuenta desde Administración: tus datos se eliminan definitivamente tras un plazo de gracia, por si fue un error. Una vez activada la suscripción, la cancelas escribiéndonos y mantienes el acceso hasta el fin del período pagado.' },
  { q: '¿Puedo tener varias sucursales y usuarios?', a: 'Sí. Puedes registrar varias sucursales, asignarles personal y definir quién es administrador y quién cajero.' },
  { q: '¿Qué pasa si no se logra cobrar mi suscripción?', a: 'Tienes 7 días de gracia con uso normal para regularizar el pago. Después la cuenta queda en modo solo lectura (puedes consultar tu información y pagar) hasta que se normalice.' },
  { q: '¿Me ayudan a empezar?', a: `Sí, escríbenos a ${CONTACTO.correo} o por WhatsApp y te acompañamos en la puesta en marcha.` },
];

export const LandingKIPI = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();

  // Si ya hay sesión iniciada, se va directo al sistema
  useEffect(() => {
    if (localStorage.getItem('usuarioRol')) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  // Scroll a la sección cuando se llega con /#seccion desde otra página
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <NavbarPublico />

      {/* HERO */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> POS e inventario para comercios de Chile
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Vende, controla tu stock y emite boletas desde un solo lugar.
            </h1>
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              KIPI reúne tu caja, tu inventario y tu equipo en una plataforma web simple y rápida, sin instalar nada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                to="/registroempresa"
                className="bg-slate-900 hover:bg-slate-700 text-white px-6 py-3.5 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Probar gratis {DIAS_PRUEBA} días <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                to="/planes"
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-6 py-3.5 rounded-lg font-semibold text-sm transition-colors text-center"
              >
                Ver planes y precios
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              {DIAS_PRUEBA} días gratis, sin tarjeta · Luego <strong className="text-slate-800">{formatoPrecio(PLAN_PRINCIPAL.precioMensual)}</strong> al mes
            </p>
          </div>

          <div className="lg:col-span-6">
            <MaquetaPOS />
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Todo lo que necesitas para operar tu local</h2>
            <p className="text-slate-500 mt-2">Herramientas pensadas para reducir errores en caja y ahorrar tiempo en la atención.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
              <div key={titulo} className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-md hover:border-slate-300 transition-all">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4">
                  <Icono className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{titulo}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-slate-50 border-y border-slate-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Empieza en tres pasos</h2>
            <p className="text-slate-500 mt-2">De la cuenta a tu primera venta, sin instalaciones ni configuraciones complicadas.</p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PASOS.map((p) => (
              <li key={p.n} className="bg-white rounded-2xl border border-slate-200 p-6">
                <span className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold mb-4">{p.n}</span>
                <h3 className="font-semibold text-slate-900 mb-1.5">{p.titulo}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* BOLETAS: TRANSPARENCIA DEL MODELO */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tu facturación, con tu propio proveedor</h2>
            <p className="text-slate-600 leading-relaxed">
              Los documentos tributarios los emite el proveedor autorizado por el SII que tú elijas. Conectas su API Key en KIPI y la boleta o factura sale desde la misma pantalla de cobro, con su folio y su PDF.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700">
              {[
                'Tu API Key se guarda cifrada y nunca se muestra completa.',
                'Anulas una venta con boleta y KIPI emite la nota de crédito.',
                'Si el proveedor falla, la venta igual se registra y la boleta se reintenta.',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-slate-900 text-white p-8 space-y-4">
            <Landmark className="w-8 h-8 text-slate-400" />
            <p className="text-lg font-semibold">¿No tienes proveedor de boletas aún?</p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Te orientamos para elegir uno y conectarlo. Mientras tanto puedes usar KIPI como POS e inventario desde el primer día.
            </p>
            <a href={enlaceCorreo('Ayuda con boleta electrónica')} className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-slate-900 px-4 py-2.5 rounded-lg hover:bg-slate-100">
              Pedir orientación <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="py-20 bg-slate-50 border-y border-slate-200 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <Layers className="w-8 h-8 mx-auto text-slate-400 mb-3" />
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Un plan simple, con todo incluido</h2>
            <p className="text-slate-500 mt-2">Sin módulos por separado ni sorpresas. Revisa el detalle completo en la página de planes.</p>
          </div>
          <div className="max-w-md mx-auto">
            <TarjetaPlan plan={PLAN_PRINCIPAL} resumida />
          </div>
        </div>
      </section>

      {/* PREGUNTAS */}
      <section id="preguntas" className="py-20 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-8 text-center">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {PREGUNTAS.map((p) => (
              <details key={p.q} className="group rounded-xl border border-slate-200 bg-white px-5 py-4 open:shadow-sm">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm">
                  {p.q}
                  <ChevronRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="rounded-3xl bg-slate-900 text-white px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">¿Listo para ordenar tu local?</h2>
              <p className="text-slate-400 text-sm mt-1">Crea tu cuenta gratis, sin tarjeta, y empieza a vender hoy.</p>
            </div>
            <Link to="/registroempresa" className="bg-white hover:bg-slate-100 text-slate-900 px-7 py-3 rounded-lg font-semibold text-sm whitespace-nowrap">
              Crear mi cuenta
            </Link>
          </div>
        </div>
      </section>

      <FooterPublico />
    </div>
  );
};
