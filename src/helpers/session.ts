// Única fuente de verdad de la sesión en el navegador.
// El backend NO confía en nada de esto (identidad y empresa salen del JWT); aquí solo se usa para la UI.

export interface SesionUsuario {
  id: number;
  usuario: string;
  rol: 'admin' | 'vendedor';
  correo?: string;
  empresa: { id: number; razonSocial: string; rutEmpresa: string };
  sucursal?: { id: number; nombre: string };
}

const K_TOKEN = 'jwt_token';
const K_SESION = 'user_session';
// Claves heredadas que aún leen algunas pantallas. Se escriben SOLO con datos reales del servidor.
const K_LEGACY = ['usuarioRol', 'usuarioNombre', 'usuarioId', 'empresaId'] as const;

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(K_TOKEN);
  } catch {
    return null;
  }
};

export const getSesion = (): SesionUsuario | null => {
  try {
    const raw = localStorage.getItem(K_SESION);
    return raw ? (JSON.parse(raw) as SesionUsuario) : null;
  } catch {
    return null;
  }
};

/** Segundos desde epoch del `exp` del JWT, o null si el token no se puede leer. */
const expiracionToken = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp : null;
  } catch {
    return null;
  }
};

export const haySesionValida = (): boolean => {
  const token = getToken();
  if (!token || !getSesion()) return false;
  const exp = expiracionToken(token);
  return exp !== null && exp * 1000 > Date.now();
};

export const guardarSesion = (usuario: SesionUsuario, token: string): void => {
  localStorage.setItem(K_TOKEN, token);
  localStorage.setItem(K_SESION, JSON.stringify(usuario));
  localStorage.setItem('usuarioRol', usuario.rol);
  localStorage.setItem('usuarioNombre', usuario.usuario);
  localStorage.setItem('usuarioId', String(usuario.id));
  localStorage.setItem('empresaId', String(usuario.empresa.id));
};

export const limpiarSesion = (): void => {
  try {
    localStorage.removeItem(K_TOKEN);
    localStorage.removeItem(K_SESION);
    K_LEGACY.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* almacenamiento no disponible */
  }
};

export const esAdmin = (): boolean => getSesion()?.rol === 'admin';
