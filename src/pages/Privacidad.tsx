import { LayoutLegal, type SeccionLegal } from '../components/publico/LayoutLegal';
import { LEGAL } from '../config/legal';
import { CONTACTO } from '../config/contacto';

const t = LEGAL.titular;

const SECCIONES: SeccionLegal[] = [
  {
    titulo: 'Quién es el responsable',
    parrafos: [
      `${t.razonSocial}, RUT ${t.rut}, domicilio ${t.domicilio} ("KIPI"), es responsable del tratamiento de los datos de las cuentas de sus clientes (empresas y sus usuarios). Respecto de los datos personales que cada empresa cargue sobre sus propios clientes y trabajadores, KIPI actúa como encargado del tratamiento por cuenta de esa empresa.`,
      'Esta política se redacta conforme a la Ley N° 19.628 sobre protección de la vida privada y a la Ley N° 21.719, que regula la protección y el tratamiento de los datos personales y que entra en vigencia el 1 de diciembre de 2026.',
    ],
  },
  {
    titulo: 'Qué datos tratamos',
    parrafos: [
      'Datos de la empresa: RUT, razón social, giro, sucursales y direcciones.',
      'Datos de usuarios: nombre de usuario, correo electrónico, rol, sucursal asignada y contraseña (almacenada solo como hash irreversible).',
      'Datos operativos que la empresa carga: productos, inventario, ventas, turnos de caja, documentos tributarios y, si los usa, datos de sus clientes (nombre, RUT, teléfono, correo, deuda/crédito).',
      'Datos técnicos y de seguridad: dirección IP, fecha y versión de los Términos aceptados, intentos de acceso y registros de errores.',
      'Datos de pago: la tarjeta se inscribe directamente en Flow; KIPI no ve ni almacena el número de la tarjeta. Recibimos de Flow el estado de la suscripción y sus identificadores.',
      'Contenido que nos envías por el formulario de contacto o por correo.',
    ],
  },
  {
    titulo: 'Para qué los usamos y con qué fundamento',
    parrafos: [
      'Prestar el servicio contratado, crear y administrar la cuenta, cobrar la suscripción y dar soporte (ejecución del contrato).',
      'Verificar el correo y prevenir fraude, abuso y ataques, y mantener la seguridad de la Plataforma (interés legítimo).',
      'Enviar comunicaciones del servicio: códigos de verificación, recuperación de contraseña, avisos de cobro, mora o cambios en los términos.',
      'Cumplir obligaciones legales y tributarias y atender requerimientos de autoridades.',
      'No vendemos datos personales ni los usamos para publicidad de terceros.',
    ],
  },
  {
    titulo: 'Con quién los compartimos',
    parrafos: [
      'Para operar KIPI usamos proveedores que tratan datos en nuestro nombre: Flow (pagos y suscripciones), Render y Railway (servidores y base de datos), Vercel (sitio web), Amazon Web Services S3 (almacenamiento de comprobantes), Google (envío de correos) y Cloudflare (protección anti-robots). Cada uno trata solo los datos necesarios para su función.',
      'Si la empresa conecta un proveedor de facturación electrónica, KIPI le envía los datos necesarios para emitir cada documento tributario, bajo las condiciones de ese proveedor.',
      'Algunos de estos proveedores pueden almacenar o procesar datos fuera de Chile. Exigimos medidas de seguridad adecuadas y solo los usamos para los fines indicados.',
    ],
  },
  {
    titulo: 'Seguridad',
    parrafos: [
      'Aplicamos medidas técnicas y organizativas razonables: comunicaciones cifradas (HTTPS), contraseñas almacenadas con hash, API Keys de facturación cifradas, control de acceso por roles y por empresa, límites a intentos de acceso y solicitudes, y verificación de correo en el registro.',
      'Ningún sistema es completamente infalible. Si ocurre una vulneración que afecte datos personales, la informaremos a los afectados y a la autoridad conforme a la ley.',
    ],
  },
  {
    titulo: 'Cuánto tiempo conservamos los datos',
    parrafos: [
      `Mientras la cuenta esté vigente. Tras cancelarla o suspenderla, conservamos la información por ${LEGAL.diasConservacionTrasCancelacion} días para permitir su reactivación o descarga y luego la eliminamos, salvo lo que debamos conservar por obligación legal (por ejemplo, respaldo de cobros y de la aceptación de los Términos).`,
      'Los códigos de verificación y enlaces de recuperación se eliminan automáticamente poco después de vencer.',
    ],
  },
  {
    titulo: 'Tus derechos',
    parrafos: [
      'Puedes solicitar acceso, rectificación, supresión, oposición, bloqueo temporal y portabilidad de tus datos personales, en los términos de la ley. Escríbenos a ' + CONTACTO.correo + ' indicando tu nombre, tu empresa y lo que necesitas; responderemos dentro de los plazos legales.',
      'Si los datos que consultas corresponden a clientes finales de un comercio que usa KIPI, deberás dirigirte primero a ese comercio, que es quien decide sobre ellos; te ayudaremos a gestionarlo cuando corresponda.',
      'También puedes reclamar ante la autoridad de protección de datos competente.',
    ],
  },
  {
    titulo: 'Cookies y almacenamiento local',
    parrafos: [
      'KIPI no usa cookies de seguimiento ni de publicidad. Al iniciar sesión, guarda en tu navegador (almacenamiento local) un token de sesión y datos básicos de tu cuenta para que el sistema funcione; se borran al cerrar sesión. Los formularios públicos pueden cargar el widget de Cloudflare Turnstile para distinguir personas de robots.',
    ],
  },
  {
    titulo: 'Menores de edad',
    parrafos: ['KIPI está dirigido a empresas y personas mayores de 18 años. No recopilamos intencionalmente datos de menores.'],
  },
  {
    titulo: 'Cambios en esta política y contacto',
    parrafos: [
      'Podemos actualizar esta política; los cambios relevantes se informarán por correo o en la Plataforma. La versión vigente siempre estará en esta página.',
      `Contacto para temas de privacidad: ${CONTACTO.correo}.`,
    ],
  },
];

export const Privacidad = () => (
  <LayoutLegal
    titulo="Política de Privacidad"
    vigencia={LEGAL.vigenteDesde}
    intro="Explicamos qué datos tratamos, para qué, con quién los compartimos, cuánto tiempo los conservamos y cómo puedes ejercer tus derechos."
    secciones={SECCIONES}
  />
);
