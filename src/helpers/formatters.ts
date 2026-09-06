export const formatearRut = (rut: string) => {
  // 1. Eliminar todo lo que no sea número o la letra K
  const valorLimpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (valorLimpio.length === 0) return '';
  if (valorLimpio.length <= 1) return valorLimpio;
  
  // 2. Separar el cuerpo y el dígito verificador (DV)
  const cuerpo = valorLimpio.slice(0, -1);
  const dv = valorLimpio.slice(-1);
  
  // 3. Agregar los puntos al cuerpo usando una expresión regular
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // 4. Retornar el RUT armado
  return `${cuerpoFormateado}-${dv}`;
};