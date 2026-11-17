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
  version: '2026-11-17',
  vigenteDesde: '17 de noviembre de 2026',
  titular: {
    razonSocial: 'LOS CACERES SPA',
    rut: '78255686-K',
    domicilio: 'ALEMANIA ST 61',
    ciudadTribunales: 'Valparaíso',
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
  /** Plazo máximo para avisar al Cliente (responsable) de una vulneración de seguridad, contado desde que KIPI la conoce. */
  horasAvisoBrecha: 48,
  /** Días de anticipación con que se avisa al Cliente de un cambio de subencargado. */
  diasAvisoSubencargado: 15,
  /** Plazo de respuesta a solicitudes de derechos de las personas (Ley 21.719): días corridos, prorrogables una vez. */
  diasRespuestaDerechos: 30,
  /** Días máximos tras la eliminación de una cuenta en que los respaldos cifrados siguen existiendo antes de borrarse solos. */
  diasPermanenciaRespaldos: 30,
} as const;
