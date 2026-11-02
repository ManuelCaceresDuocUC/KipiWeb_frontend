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
  version: '2026-11-02',
  vigenteDesde: '2 de noviembre de 2026',
  titular: {
    razonSocial: 'LOS CÁCERES SPA',
    rut: '78255686-K',
    domicilio: 'ALEMANIA ST 61',
    ciudadTribunales: 'VALPARAÍSO',
  },
  /** Días que se conservan los datos de una cuenta cancelada o suspendida antes de eliminarlos. [CONFIRMAR] */
  diasConservacionTrasCancelacion: 90,
  diasGraciaMora: 7,
  /** true si el precio publicado incluye IVA. [CONFIRMAR] */
  precioIncluyeIva: true,
} as const;
