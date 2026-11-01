import { LayoutLegal, type SeccionLegal } from '../components/publico/LayoutLegal';
import { LEGAL } from '../config/legal';
import { CONTACTO } from '../config/contacto';
import { PLAN_PRINCIPAL, formatoPrecio } from '../config/planes';

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
      'La suscripción se renueva automáticamente cada mes. El Cliente puede cancelarla en cualquier momento solicitándolo por escrito a ' + CONTACTO.correo + '. Tras la cancelación conservará el acceso hasta el fin del período ya pagado y no se cobrarán nuevos períodos.',
      'Los períodos ya cobrados no son reembolsables, salvo error de cobro imputable al Prestador o que la ley disponga otra cosa de manera imperativa.',
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
      'KIPI no es un emisor ni un proveedor autorizado de facturación electrónica. Los documentos (boletas, facturas, notas de crédito) los emite el proveedor autorizado por el SII que el Cliente contrata por su cuenta; KIPI se conecta a él mediante la API Key que el Cliente ingresa. El costo, las condiciones y la disponibilidad de ese proveedor son de su exclusiva responsabilidad.',
      'El Cliente es responsable de contar con la autorización y los folios necesarios ante el SII, de la correcta emisión, anulación y declaración de sus documentos, y de cumplir sus obligaciones tributarias. KIPI es una herramienta de apoyo y no constituye asesoría tributaria, contable ni legal. Si el proveedor falla, la venta puede quedar registrada con su documento pendiente de reintento.',
      'El Cliente debe mantener su API Key en reserva y revocarla ante cualquier sospecha de uso indebido. KIPI la almacena cifrada.',
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
