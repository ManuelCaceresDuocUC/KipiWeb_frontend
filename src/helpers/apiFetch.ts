// src/helpers/apiFetch.ts

export const apiFetch = async (endpoint: string, opciones: RequestInit = {}) => {
    // Buscamos el token en el almacenamiento local
    const token = localStorage.getItem('jwt_token');

    // Construimos los headers obligatorios
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...opciones.headers,
    };

    // Hacemos la petición adjuntando las opciones y las cabeceras blindadas
    const respuesta = await fetch(endpoint, {
        ...opciones,
        headers,
    });

    // Si el token expiró o fue manipulado y el backend responde 403/401,
    // podemos expulsar al usuario automáticamente a la pantalla de login:
    if (respuesta.status === 401 || respuesta.status === 403) {
        console.warn("Acceso denegado o sesión expirada.");
        // Opcional: localStorage.clear(); window.location.href = '/login';
    }

    return respuesta;
};