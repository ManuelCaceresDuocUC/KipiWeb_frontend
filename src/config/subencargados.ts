/**
 * Proveedores que tratan datos por cuenta de KIPI (subencargados). Un solo lugar: lo usan la Política de Privacidad
 * y el Anexo de Encargo. Si cambias de proveedor o de región, actualiza esta lista Y avisa a los clientes
 * (ver LEGAL.diasAvisoSubencargado). Mantén coherentes las regiones con las que realmente usas en Render, Railway y AWS.
 */
export interface Subencargado {
  nombre: string;
  funcion: string;
  /** País donde se procesan o almacenan los datos. */
  pais: string;
  /** Qué datos pasan por él. */
  datos: string;
}

export const SUBENCARGADOS: readonly Subencargado[] = [
  {
    nombre: 'Render',
    funcion: 'Servidor donde corre la aplicación (backend)',
    pais: 'Estados Unidos (región de Virginia)',
    datos: 'Todos los datos operativos mientras se procesan',
  },
  {
    nombre: 'Railway',
    funcion: 'Base de datos',
    pais: 'Estados Unidos (región de Virginia)',
    datos: 'Todos los datos que el Cliente carga en KIPI y los de su cuenta',
  },
  {
    nombre: 'Amazon Web Services (S3)',
    funcion: 'Almacenamiento de comprobantes y de respaldos cifrados de la base de datos',
    pais: 'Brasil (São Paulo)',
    datos: 'Comprobantes en PDF y copias de seguridad cifradas',
  },
  {
    nombre: 'Vercel',
    funcion: 'Alojamiento del sitio web y de la aplicación que ve el usuario',
    pais: 'Estados Unidos y red de distribución global',
    datos: 'No almacena datos de clientes finales; ve el tráfico entre el navegador y KIPI',
  },
  {
    nombre: 'Flow',
    funcion: 'Cobro de la suscripción con tarjeta',
    pais: 'Chile',
    datos: 'Razón social, RUT y correo del administrador; estado de la suscripción. KIPI no ve el número de la tarjeta',
  },
  {
    nombre: 'Google (Gmail)',
    funcion: 'Envío de correos del servicio',
    pais: 'Estados Unidos y otros países donde Google opera',
    datos: 'Dirección de correo del destinatario y contenido del mensaje',
  },
  {
    nombre: 'Cloudflare (Turnstile)',
    funcion: 'Protección contra robots en formularios públicos',
    pais: 'Red de distribución global',
    datos: 'Dirección IP y datos técnicos del navegador',
  },
] as const;

export const lineaSubencargado = (s: Subencargado): string => `${s.nombre} — ${s.funcion}. País: ${s.pais}. Datos: ${s.datos}.`;
