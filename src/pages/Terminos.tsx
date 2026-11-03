import { LayoutLegal, type SeccionLegal } from '../components/publico/LayoutLegal';
import { LEGAL } from '../config/legal';
import { CONTACTO } from '../config/contacto';
import { DIAS_PRUEBA, PLAN_PRINCIPAL, formatoPrecio } from '../config/planes';

const t = LEGAL.titular;
const iva = LEGAL.precioIncluyeIva ? 'IVA incluido' : 'más IVA';

const SECCIONES: SeccionLegal[] = [
  {
    titulo: 'Quién presta el servicio y aceptación',
    parrafos: [
      `Estos Términos y Condiciones regulan el uso de KIPI (en adelante, "KIPI" o "la Plataforma"), un software en línea de punto de venta e inventario, prestado por ${t.razonSocial}, RUT ${t.rut}, con domicilio en ${t.domicilio} (en adelante, "el Prestador").`,
      'Al crear una cuenta, marcar la casilla de aceptación o usar la Plataforma, la empresa que contrata ("el Cliente") declara haber leído y aceptado estos Términos y la Política de Privacidad. Quien registra la cuenta declara tener facultades suficientes para obligar al Cliente.',
    ],
  },
  {
    titulo: 'El servicio',
    parrafos: [
      'KIPI es un servicio de software como servicio (SaaS) accesible por internet que permite registrar ventas, controlar inventario y stock por sucursal, gestionar turnos de caja, clientes y usuarios, y conectar un proveedor externo de documentos tributarios electrónicos (DTE).',
      'El Prestador puede mejorar, modificar o discontinuar funciones, procurando no afectar de manera sustancial el servicio contratado y avisando con anticipación razonable cuando el cambio sea relevante.',
    ],
  },
  {
    titulo: 'Registro, cuenta y seguridad',
    parrafos: [
      'El Cliente debe entregar información veraz, completa y actualizada (incluidos RUT, razón social y correo del administrador) y verificar su correo electrónico durante el registro. El Prestador puede rechazar o suspender registros con datos falsos, suplantación de identidad o indicios de fraude.',
      'El Cliente es responsable de la custodia de las credenciales de sus usuarios y de las acciones realizadas con ellas. Debe definir roles y permisos adecuados, usar contraseñas robustas y avisar de inmediato cualquier uso no autorizado. El administrador puede restablecer las contraseñas de los usuarios de su empresa.',
    ],
  },
  {
    titulo: 'Prueba gratuita',
    parrafos: [
      `Toda empresa nueva dispone de una prueba gratuita de ${DIAS_PRUEBA} días corridos, contados desde su registro, con todas las funciones del plan y sin necesidad de ingresar una tarjeta. Durante la prueba no se realiza ningún cobro. El Prestador podrá negar una nueva prueba a una empresa que ya hubiera usado una, o cuando detecte abuso de esta modalidad.`,
      `Antes de que termine la prueba procuraremos avisar por correo al administrador (aproximadamente 10 y 3 días antes, y al vencer). Los avisos son una cortesía: la fecha de término es la que indica la Plataforma, y el Cliente es responsable de revisarla aunque el correo no llegue.`,
      'Terminada la prueba, la cuenta queda en modo de solo lectura: el Cliente puede consultar su información, pero no registrar ventas ni modificar datos, hasta que active la suscripción. No se cobra nada ni se borran datos por el solo hecho de que termine la prueba.',
      `Para activar la suscripción, el administrador inscribe su tarjeta desde la sección Administración, en el sitio seguro de Flow. Al inscribirla, el Cliente autoriza el cobro mensual y automático de ${formatoPrecio(PLAN_PRINCIPAL.precioMensual)} (${iva}) y la cuenta vuelve a funcionar con normalidad. El primer cobro se realiza en el momento de la activación; si el Cliente activa antes de que termine la prueba, los días de prueba restantes no se acumulan ni se descuentan.`,
      `Una cuenta cuya prueba terminó y que no se activa ni se da de baja permanecerá en solo lectura. Pasados al menos ${LEGAL.diasAvisoBajaInactiva} días desde un aviso por correo, el Prestador podrá darla de baja y eliminar sus datos conforme a la sección "Baja de la cuenta y eliminación de datos".`,
    ],
  },
  {
    titulo: 'Plan, precio y forma de pago',
    parrafos: [
      `El ${PLAN_PRINCIPAL.nombre} tiene un valor de ${formatoPrecio(PLAN_PRINCIPAL.precioMensual)} mensuales (${iva}), en pesos chilenos, e incluye las funciones descritas en la página de planes.`,
      'El pago se realiza con tarjeta mediante Flow (servicio de un tercero). Al inscribir su tarjeta, el Cliente autoriza el cobro recurrente mensual y automático de la suscripción hasta que sea cancelada. KIPI no almacena los datos de la tarjeta, que son tratados por Flow bajo sus propias condiciones.',
      'El Prestador podrá modificar el precio o las condiciones del plan avisando por correo con al menos 30 días de anticipación; el cambio regirá desde el siguiente período de cobro, y el Cliente podrá cancelar antes de que entre en vigor.',
    ],
  },
  {
    titulo: 'Renovación, cancelación y reembolsos',
    parrafos: [
      'La suscripción se renueva automáticamente cada mes. El Cliente que ya activó su suscripción puede cancelarla en cualquier momento solicitándolo por escrito a ' + CONTACTO.correo + '. Tras la cancelación conservará el acceso hasta el fin del período ya pagado y no se cobrarán nuevos períodos.',
      'Los períodos ya cobrados no son reembolsables, salvo error de cobro imputable al Prestador o que la ley disponga otra cosa de manera imperativa.',
    ],
  },
  {
    titulo: 'Baja de la cuenta y eliminación de datos',
    parrafos: [
      `Mientras la cuenta esté en prueba (o con la prueba terminada y sin suscripción), el administrador puede darla de baja desde la sección Administración, confirmando con el RUT de la empresa. La baja cierra la cuenta de inmediato: ningún usuario de la empresa podrá ingresar y no se realizará ningún cobro.`,
      `Los datos del Cliente (ventas, productos, clientes, usuarios, comprobantes y demás información cargada) se conservan durante ${LEGAL.diasEliminacionTrasBaja} días desde la baja, para que el Cliente pueda pedir su reactivación escribiendo a ${CONTACTO.correo}. Vencido ese plazo se eliminan de forma definitiva e irreversible. El Cliente es responsable de respaldar la información que necesite antes de dar de baja su cuenta.`,
      'Si el Cliente ya activó una suscripción de pago, la baja de la cuenta se gestiona escribiendo a ' + CONTACTO.correo + ', para evitar cierres accidentales y cuidar los períodos ya pagados.',
    ],
  },
  {
    titulo: 'Falta de pago, suspensión y término',
    parrafos: [
      `Si no es posible cobrar la suscripción, el Cliente tendrá ${LEGAL.diasGraciaMora} días de gracia con uso normal y un aviso en pantalla. Vencido ese plazo sin regularizar el pago, la cuenta pasará a modo de solo lectura: podrá consultar su información y pagar, pero no registrar ventas ni modificar datos, hasta que el pago se normalice.`,
      `Cancelada o suspendida la cuenta, el Prestador conservará los datos del Cliente por ${LEGAL.diasConservacionTrasCancelacion} días para facilitar su reactivación o su descarga; transcurrido ese plazo podrá eliminarlos, sin perjuicio de la información que deba conservar por obligación legal. El Cliente es responsable de respaldar la información que necesite.`,
      'El Prestador podrá suspender o terminar la cuenta, con aviso cuando sea posible, por incumplimiento grave de estos Términos, uso fraudulento o ilícito, o riesgo para la seguridad de la Plataforma o de terceros.',
    ],
  },
  {
    titulo: 'Documentos tributarios electrónicos (DTE)',
    parrafos: [
      'KIPI no es un emisor ni un proveedor autorizado de facturación electrónica. Los documentos (boletas, facturas, notas de crédito) los emite el proveedor autorizado por el SII que el Cliente contrata por su cuenta; KIPI se conecta a él mediante las credenciales que el Cliente ingresa (una API Key o, según el proveedor, el correo y la contraseña de su cuenta de ese proveedor). KIPI ofrece la conexión con los proveedores disponibles en la Plataforma, que pueden cambiar con el tiempo, y no garantiza la compatibilidad con otros. El costo, las condiciones, los límites de uso y la disponibilidad de ese proveedor son de su exclusiva responsabilidad.',
      'El Cliente es responsable de contar con la autorización y los folios necesarios ante el SII, de que los datos de su empresa que informe (RUT, razón social, giro, dirección y códigos de actividad económica) sean correctos y coincidan con los registrados en su proveedor y en el SII, de la correcta emisión, anulación y declaración de sus documentos, y de cumplir sus obligaciones tributarias. KIPI es una herramienta de apoyo y no constituye asesoría tributaria, contable ni legal. Si el proveedor falla o rechaza el documento, la venta puede quedar registrada con su documento pendiente de reintento o de revisión.',
      'Al anular una venta que tiene boleta, KIPI solicita al proveedor la emisión de la nota de crédito correspondiente. Si esa nota no puede emitirse, el Cliente debe regularizarla directamente con su proveedor o ante el SII.',
      'El Cliente debe mantener sus credenciales de facturación en reserva y revocarlas o cambiarlas ante cualquier sospecha de uso indebido. KIPI las almacena cifradas y las usa solo para emitir y consultar los documentos del Cliente.',
    ],
  },
  {
    titulo: 'Uso aceptable',
    parrafos: [
      'Está prohibido: usar la Plataforma con fines ilícitos o fraudulentos; intentar acceder sin autorización a cuentas o sistemas; realizar pruebas de intrusión, ingeniería inversa o scraping sin permiso escrito; sobrecargar la infraestructura; automatizar el registro de cuentas; revender el servicio o compartir cuentas fuera de la propia empresa; o cargar contenido que infrinja derechos de terceros.',
    ],
  },
  {
    titulo: 'Datos del Cliente y datos personales',
    parrafos: [
      'La información que el Cliente carga en KIPI (productos, ventas, clientes, usuarios, etc.) es de su propiedad. El Cliente es responsable de la licitud de los datos personales de sus propios clientes y trabajadores que ingrese, y de informarles lo que corresponda. Respecto de esos datos, el Prestador actúa como encargado del tratamiento, siguiendo las instrucciones del Cliente y con las medidas de seguridad descritas en la Política de Privacidad.',
      'El Prestador no usará esos datos para fines propios distintos de prestar, asegurar y mejorar el servicio, ni los venderá a terceros.',
    ],
  },
  {
    titulo: 'Propiedad intelectual',
    parrafos: [
      'La Plataforma, su código, diseño, marcas y documentación pertenecen al Prestador. El Cliente recibe una licencia limitada, revocable, no exclusiva e intransferible para usar KIPI durante la vigencia de su suscripción y solo para las operaciones de su negocio.',
    ],
  },
  {
    titulo: 'Disponibilidad y soporte',
    parrafos: [
      'El Prestador procura mantener el servicio disponible, pero no garantiza que sea ininterrumpido o libre de errores. Pueden existir mantenciones, fallas de proveedores externos (hosting, pagos, correo, facturación) o eventos fuera de su control. El soporte se presta por correo electrónico y WhatsApp en horario hábil.',
      'Se recomienda al Cliente mantener un procedimiento alternativo de venta para contingencias.',
    ],
  },
  {
    titulo: 'Limitación de responsabilidad',
    parrafos: [
      'En la máxima medida permitida por la ley, el Prestador no responde por lucro cesante, pérdida de ventas, multas o sanciones tributarias, ni daños indirectos derivados del uso o la imposibilidad de uso de la Plataforma, ni por fallas de terceros ajenos a su control.',
      'Salvo dolo o culpa grave, la responsabilidad total del Prestador frente al Cliente por cualquier causa se limitará al monto efectivamente pagado por el Cliente en los tres (3) meses anteriores al hecho que originó el reclamo.',
    ],
  },
  {
    titulo: 'Modificaciones a estos Términos',
    parrafos: [
      'El Prestador podrá actualizar estos Términos. Los cambios relevantes se informarán por correo o en la Plataforma con al menos 15 días de anticipación. Si el Cliente continúa usando el servicio después de esa fecha, se entenderá que los acepta; si no está de acuerdo, podrá cancelar su suscripción. Se conservará registro de la versión aceptada por cada Cliente al registrarse.',
    ],
  },
  {
    titulo: 'Ley aplicable y jurisdicción',
    parrafos: [
      `Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a los tribunales ordinarios de justicia de ${t.ciudadTribunales}, sin perjuicio de los derechos irrenunciables que la ley otorgue a quien tenga la calidad de consumidor.`,
    ],
  },
  {
    titulo: 'Contacto',
    parrafos: [`Para consultas, reclamos o solicitudes relacionadas con estos Términos: ${CONTACTO.correo} · ${CONTACTO.telefono}.`],
  },
];

export const Terminos = () => (
  <LayoutLegal
    titulo="Términos y Condiciones de Uso"
    vigencia={LEGAL.vigenteDesde}
    intro="Lee con atención estas condiciones antes de contratar KIPI. Aquí se explica qué incluye el servicio, cómo se cobra, cómo cancelar y cuáles son las responsabilidades de cada parte."
    secciones={SECCIONES}
  />
);
