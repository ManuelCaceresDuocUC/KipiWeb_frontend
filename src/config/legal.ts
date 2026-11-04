/**
 * Datos legales de KIPI. Un solo lugar para completar/actualizar.
 *
 * ⚠ Los textos de /terminos y /privacidad son un BORRADOR redactado por Claude. Deben ser revisados por un abogado
 * antes de publicarse. Completa los campos marcados con [COMPLETAR].
 *
 * Al cambiar el contenido de los términos o de la política: sube LEGAL.version (formato AAAA-MM-DD) Y la variable
 * LEGAL_TERMINOS_VERSION en Render con el mismo valor. Mientras no coincidan, el registro se rechaza.
 */
export const LEGAL = {
  version: '2026-11-03',
  vigenteDesde: '3 de noviembre de 2026',
  titular: {
    razonSocial: 'LOS CACERES SPA',
    rut: '78255686-K',
    domicilio: 'ALEMANIA ST 61',
    ciudadTribunales: '[COMPLETAR: ciudad, p. ej. Santiago]',
  },
  /** Días que se conservan los datos de una cuenta cancelada o suspendida antes de eliminarlos. [CONFIRMAR] */
  diasConservacionTrasCancelacion: 90,
  /** Días entre que el cliente da de baja su cuenta (prueba) y la eliminación definitiva. Debe coincidir con SUSCRIPCION_BAJA_DIAS (Render). */
  diasEliminacionTrasBaja: 30,
  /** Días de aviso por correo antes de dar de baja una cuenta con la prueba vencida y sin actividad. */
  diasAvisoBajaInactiva: 15,
  diasGraciaMora: 7,
  /** true si el precio publicado incluye IVA. [CONFIRMAR] */
  precioIncluyeIva: true,
} as const;
