/** Datos de contacto de KIPI. Un solo lugar para cambiarlos. */
export const CONTACTO = {
  correo: 'kipisofts@gmail.com',
  telefono: '+56 9 9381 5620',
  /** Solo dígitos con código de país, para wa.me */
  whatsapp: '56993815620',
} as const;

export const enlaceWhatsApp = (mensaje: string) =>
  `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(mensaje)}`;

export const enlaceCorreo = (asunto = 'Consulta sobre KIPI') =>
  `mailto:${CONTACTO.correo}?subject=${encodeURIComponent(asunto)}`;
