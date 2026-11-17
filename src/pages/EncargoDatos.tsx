import { LayoutLegal, type SeccionLegal } from '../components/publico/LayoutLegal';
import { LEGAL } from '../config/legal';
import { CONTACTO } from '../config/contacto';
import { SUBENCARGADOS, lineaSubencargado } from '../config/subencargados';

const t = LEGAL.titular;

const SECCIONES: SeccionLegal[] = [
  {
    titulo: 'Partes y objeto',
    parrafos: [
      `Este Anexo regula el tratamiento de datos personales que ${t.razonSocial}, RUT ${t.rut}, domicilio ${t.domicilio} ("KIPI" o el "Encargado"), realiza por cuenta de la empresa que contrata el servicio (el "Cliente" o el "Responsable"), conforme al artículo 15 bis de la Ley N° 19.628, modificada por la Ley N° 21.719.`,
      'Forma parte de los Términos y Condiciones y se acepta junto con ellos al registrarse. Si hay contradicción entre ambos en materia de datos personales, prevalece este Anexo.',
    ],
  },
  {
    titulo: 'Roles de las partes',
    parrafos: [
      'El Cliente es el Responsable: decide qué datos de sus propios clientes y trabajadores carga en KIPI, para qué los usa y con qué fundamento. Es quien debe informar a esas personas y contar con una base de licitud.',
      'KIPI es el Encargado: trata esos datos solo para prestar el servicio y siguiendo las instrucciones del Cliente. Si KIPI los usara para un fin propio o distinto del encargado, pasaría a ser responsable de ese tratamiento.',
      'Respecto de los datos de las cuentas del Cliente (administradores, usuarios, cobro de la suscripción), KIPI actúa como responsable, según se explica en la Política de Privacidad.',
    ],
  },
  {
    titulo: 'Datos, personas y finalidad',
    parrafos: [
      'Tipos de datos: nombre, RUT, teléfono y correo de los clientes finales del Cliente; deuda, límite de crédito y movimientos del fiado, incluidos los números de vales en papel; datos de ventas asociadas; y nombre de usuario, correo y rol de los trabajadores del Cliente.',
      'Personas afectadas: clientes finales del Cliente y sus trabajadores.',
      'Finalidad: prestar las funciones contratadas de venta, inventario, caja, fiado, emisión de documentos tributarios, comprobantes por correo y soporte. No se usan los datos para publicidad ni se venden.',
      'Los datos pueden incluir información sobre obligaciones económicas o comerciales (la deuda del fiado). El Cliente debe tratarla con especial cuidado.',
      'Duración: mientras esté vigente la suscripción del Cliente y hasta que se eliminen los datos según la sección "Devolución y eliminación".',
    ],
  },
  {
    titulo: 'Instrucciones del Cliente',
    parrafos: [
      'KIPI trata los datos solo según las instrucciones documentadas del Cliente, que son: lo que el Cliente ingresa, modifica, consulta o elimina usando la Plataforma, la configuración que elige y lo que pida por escrito a soporte.',
      'Si KIPI cree que una instrucción infringe la ley de protección de datos, se lo avisará al Cliente.',
    ],
  },
  {
    titulo: 'Confidencialidad',
    parrafos: [
      'KIPI mantiene en reserva los datos del Cliente y limita el acceso a las personas que lo necesitan para prestar el servicio, quienes están obligadas a guardar confidencialidad. No accede al contenido de las cuentas salvo para dar soporte solicitado por el Cliente, prevenir o resolver un incidente de seguridad o cumplir una obligación legal.',
    ],
  },
  {
    titulo: 'Medidas de seguridad',
    parrafos: [
      'KIPI aplica medidas técnicas y organizativas proporcionales al riesgo, entre ellas: comunicaciones cifradas (HTTPS); contraseñas guardadas con hash irreversible; credenciales de facturación cifradas (AES-256-GCM); separación de los datos de cada empresa y control de acceso por rol; registro de actividad de acciones sensibles consultable por el administrador; límites a intentos de acceso y de solicitudes; verificación de correo; copias de seguridad diarias cifradas con revisión de su estado; y monitoreo del servidor con alertas.',
      'El Cliente es responsable de la seguridad de su lado: custodia de contraseñas, asignación de roles, cierre de sesiones y protección de los equipos donde usa KIPI.',
    ],
  },
  {
    titulo: 'Subencargados',
    parrafos: [
      'El Cliente autoriza a KIPI a usar los siguientes subencargados, con los que KIPI mantiene contratos que les exigen un nivel de protección equivalente al de este Anexo:',
      ...SUBENCARGADOS.map(lineaSubencargado),
      `KIPI avisará al Cliente por correo o en la Plataforma, con al menos ${LEGAL.diasAvisoSubencargado} días de anticipación, de cualquier incorporación o reemplazo. Si el Cliente se opone por motivos razonables de protección de datos, podrá dar de baja su cuenta sin penalidad y KIPI le facilitará la descarga de su información.`,
      'El proveedor de facturación electrónica que el Cliente conecta no es subencargado de KIPI: el Cliente lo contrata y se relaciona directamente con él.',
    ],
  },
  {
    titulo: 'Transferencias internacionales',
    parrafos: [
      'Los subencargados listados tratan datos en Estados Unidos y Brasil, y el pago se procesa en Chile. El Cliente autoriza estas transferencias. KIPI las realiza con las garantías que exige la ley, como cláusulas contractuales tipo u otras garantías adecuadas, y se compromete a informar al Cliente si estas cambian.',
    ],
  },
  {
    titulo: 'Derechos de las personas',
    parrafos: [
      `Las personas pueden pedir acceso, rectificación, supresión, oposición, bloqueo temporal y portabilidad de sus datos. El Cliente, como Responsable, debe responder en ${LEGAL.diasRespuestaDerechos} días corridos, prorrogables una vez, y el bloqueo temporal en 2 días hábiles.`,
      'KIPI ayuda al Cliente a atender esas solicitudes: la Plataforma permite a los administradores corregir los datos de un cliente final, descargar todos sus datos y eliminar sus datos personales (se conservan las ventas y los movimientos sin su identidad). Si una persona se dirige a KIPI, KIPI se lo informa al Cliente sin demora y no responde por sí misma, salvo instrucción del Cliente o exigencia legal.',
      'Los documentos tributarios ya emitidos se conservan por obligación legal, en el proveedor de facturación del Cliente.',
    ],
  },
  {
    titulo: 'Vulneraciones de seguridad',
    parrafos: [
      `Si KIPI toma conocimiento de una vulneración de seguridad que afecte los datos del Cliente, se lo informará sin dilaciones indebidas y, a más tardar, dentro de ${LEGAL.horasAvisoBrecha} horas, por correo al administrador de la cuenta.`,
      'El aviso incluirá, en cuanto se conozca: qué ocurrió y cuándo, qué datos y cuántas personas podrían estar afectados, las consecuencias probables, las medidas tomadas y las recomendadas, y un contacto para coordinar. Si no toda la información está disponible de inmediato, se entregará por etapas.',
      'El Cliente, como Responsable, decide si debe informar a la Agencia de Protección de Datos Personales y a los afectados; esto es obligatorio cuando se vean afectados datos sensibles, de menores de 14 años o relativos a obligaciones económicas, financieras, bancarias o comerciales, como el fiado. KIPI coopera y entrega la información que el Cliente necesite para ello.',
      'KIPI lleva un registro de todos sus incidentes de seguridad, con sus causas, efectos y medidas, y toma medidas para contener y corregir cada uno.',
    ],
  },
  {
    titulo: 'Demostración de cumplimiento',
    parrafos: [
      'A solicitud razonable y por escrito, KIPI entregará al Cliente la información necesaria para demostrar el cumplimiento de este Anexo, incluida una descripción de sus medidas de seguridad, y permitirá una revisión razonable, una vez al año salvo incidente, con aviso previo y sin afectar el servicio ni los datos de otros clientes.',
    ],
  },
  {
    titulo: 'Devolución y eliminación',
    parrafos: [
      'Mientras la cuenta esté vigente, el Cliente puede descargar su información desde la Plataforma. Al terminar el servicio, el Cliente tiene los plazos de reactivación y descarga indicados en los Términos y Condiciones.',
      `Vencidos esos plazos, KIPI elimina de forma definitiva los datos de la cuenta. Las copias de seguridad cifradas que los contengan se borran automáticamente dentro de ${LEGAL.diasPermanenciaRespaldos} días. KIPI puede conservar solo lo que una ley le obligue a mantener, por el tiempo que ella exija.`,
    ],
  },
  {
    titulo: 'Vigencia, responsabilidad y contacto',
    parrafos: [
      'Este Anexo rige mientras KIPI trate datos por cuenta del Cliente. La responsabilidad de cada parte se rige por los Términos y Condiciones y por la ley.',
      `Contacto para temas de datos personales: ${CONTACTO.correo}.`,
    ],
  },
];

export const EncargoDatos = () => (
  <LayoutLegal
    titulo="Anexo de Encargo de Tratamiento de Datos"
    vigencia={LEGAL.vigenteDesde}
    intro="Este anexo explica cómo trata KIPI, por cuenta de tu empresa, los datos personales de tus clientes y trabajadores, y qué obligaciones tiene cada parte."
    secciones={SECCIONES}
  />
);
