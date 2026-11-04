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
      'Datos operativos que la empresa carga: productos, inventario, ventas, turnos de caja, documentos tributarios y, si los usa, datos de sus clientes (nombre, RUT, teléfono, correo, límite de crédito, deuda y movimientos del fiado, incluido el número de los vales en papel que registre).',
      'Credenciales de facturación electrónica: la API Key o, según el proveedor, el correo y la contraseña de la cuenta que la empresa tiene en su proveedor de documentos tributarios, junto con el RUT emisor y los códigos de actividad económica. Se guardan cifradas.',
      'Credenciales entregadas para una habilitación asistida: si el titular de la cuenta nos pide ayuda para activar su proveedor de facturación y, para ello, nos comparte voluntariamente credenciales de esa cuenta (usuario y contraseña, o API Key), las usamos solo para la tarea solicitada, no las compartimos con terceros ni las usamos para ningún otro fin, y las eliminamos de nuestros mensajes y registros al terminar. Recomendamos cambiar la contraseña después. El detalle está en los Términos y Condiciones.',
      'Datos técnicos y de seguridad: dirección IP, fecha y versión de los Términos aceptados, intentos de acceso y registros de errores.',
      'Registro de actividad: para seguridad y trazabilidad, anotamos las acciones sensibles realizadas en la cuenta (por ejemplo, anulación de ventas, ventas registradas tras un corte de conexión, fiados registrados desde un vale en papel, cambios de usuarios y de la configuración de facturación, restablecimiento de contraseñas y cierre de sesiones), con el usuario, la fecha y la dirección IP. El administrador de la empresa puede consultarlo.',
      'Datos de pago: durante la prueba gratuita no solicitamos datos de pago. Cuando el cliente activa su suscripción, creamos su cliente en Flow con la razón social, el RUT y el correo del administrador, y la tarjeta se inscribe directamente en Flow; KIPI no ve ni almacena el número de la tarjeta. Recibimos de Flow el estado de la suscripción y sus identificadores.',
      'Contenido que nos envías por el formulario de contacto o por correo.',
    ],
  },
  {
    titulo: 'Datos guardados en tu dispositivo (modo sin conexión)',
    parrafos: [
      'Para que la caja siga funcionando cuando falla internet, KIPI guarda en el navegador del equipo: la aplicación misma, una copia del catálogo de productos y precios (sin costos ni recetas), el último estado conocido de la caja, y las ventas realizadas sin conexión que aún no se envían (con su detalle, montos, medios de pago, hora y usuario que las registró). Esta información queda en el equipo y no se comparte con nadie hasta que la venta se envía a KIPI.',
      'La copia del catálogo y el estado de la caja se borran al cerrar sesión. Las ventas pendientes de envío se conservan aunque se cierre sesión, porque corresponden a dinero ya cobrado, y se eliminan del equipo en cuanto KIPI las recibe. Cualquier persona con acceso al equipo y al navegador podría ver esa información: te recomendamos usar cuentas de usuario del sistema operativo protegidas y no usar equipos compartidos.',
    ],
  },
  {
    titulo: 'Para qué los usamos y con qué fundamento',
    parrafos: [
      'Prestar el servicio contratado, crear y administrar la cuenta, cobrar la suscripción y dar soporte (ejecución del contrato).',
      'Verificar el correo y prevenir fraude, abuso y ataques, y mantener la seguridad de la Plataforma (interés legítimo).',
      'Enviar comunicaciones del servicio: códigos de verificación, recuperación de contraseña, avisos de fin de la prueba gratuita, de cobro, de mora o de baja, y cambios en los términos.',
      'Por cuenta del comercio que usa KIPI, enviar al cliente final que compra a crédito un comprobante por correo con el detalle de su compra, el monto y su saldo adeudado. Ese correo se envía solo si el comercio registró el correo del cliente; si no quieres recibirlo, pídeselo al comercio o escríbenos y lo gestionamos con él.',
      'Cumplir obligaciones legales y tributarias y atender requerimientos de autoridades.',
      'No vendemos datos personales ni los usamos para publicidad de terceros.',
    ],
  },
  {
    titulo: 'Con quién los compartimos',
    parrafos: [
      'Para operar KIPI usamos proveedores que tratan datos en nuestro nombre: Flow (pagos y suscripciones), Render y Railway (servidores y base de datos), Vercel (sitio web), Amazon Web Services S3 (almacenamiento de comprobantes), Google (envío de correos) y Cloudflare (protección anti-robots). Cada uno trata solo los datos necesarios para su función.',
      'Si la empresa conecta un proveedor de facturación electrónica (por ejemplo, Haulmer/OpenFactura o SimpleFactura), KIPI le envía los datos necesarios para emitir cada documento tributario (datos del emisor, detalle de la venta y, si corresponde, del receptor) y las credenciales que la empresa registró, bajo las condiciones y la política de privacidad de ese proveedor, con el cual la empresa mantiene su propio contrato.',
      'Algunos de estos proveedores pueden almacenar o procesar datos fuera de Chile. Exigimos medidas de seguridad adecuadas y solo los usamos para los fines indicados.',
    ],
  },
  {
    titulo: 'Seguridad',
    parrafos: [
      'Aplicamos medidas técnicas y organizativas razonables: comunicaciones cifradas (HTTPS), contraseñas almacenadas con hash, credenciales de facturación cifradas, control de acceso por roles y por empresa, posibilidad de cerrar las sesiones activas de un usuario, registro de actividad, límites a intentos de acceso y solicitudes, y verificación de correo en el registro.',
      'Ningún sistema es completamente infalible. Si ocurre una vulneración que afecte datos personales, la informaremos a los afectados y a la autoridad conforme a la ley.',
    ],
  },
  {
    titulo: 'Cuánto tiempo conservamos los datos',
    parrafos: [
      `Mientras la cuenta esté vigente. Tras cancelarla o suspenderla, conservamos la información por ${LEGAL.diasConservacionTrasCancelacion} días para permitir su reactivación o descarga y luego podremos eliminarla, salvo lo que debamos conservar por obligación legal (por ejemplo, respaldo de cobros y de la aceptación de los Términos).`,
      `Si el cliente da de baja su cuenta desde la plataforma, conservamos su información durante ${LEGAL.diasEliminacionTrasBaja} días por si pide reactivarla y luego eliminamos de forma definitiva todos los datos de la cuenta (empresa, usuarios, sucursales, ventas, productos, clientes, comprobantes y registro de actividad), y borramos su cliente en Flow.`,
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
      'KIPI no usa cookies de seguimiento ni de publicidad. Al iniciar sesión, guarda en tu navegador (almacenamiento local) un token de sesión y datos básicos de tu cuenta para que el sistema funcione; se borran al cerrar sesión. Además usa el almacenamiento del navegador (IndexedDB y caché de la aplicación) para el modo sin conexión descrito arriba, y conserva en el equipo preferencias como la impresión automática y la cantidad de copias del comprobante, y un código de numeración de vales de fiado. Los formularios públicos pueden cargar el widget de Cloudflare Turnstile para distinguir personas de robots.',
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
