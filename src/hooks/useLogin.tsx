import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { guardarSesion, type SesionUsuario } from "../helpers/session";
import { leerError } from "../helpers/apiFetch";

interface Credenciales {
    usuario: string;
    contrasena: string;
}

export const useLogin = () => {
    const API_URL = `${import.meta.env.VITE_API_URL}/usuarios`;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const logearUsuario = async (credenciales: Credenciales) => {
        setLoading(true);
        setError(null);
        try {
            const respuesta = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credenciales)
            });

            if (!respuesta.ok) {
                // 401 credenciales, 403 empresa pendiente de pago, 429 demasiados intentos...
                throw new Error(await leerError(respuesta, "No se pudo iniciar sesión"));
            }

            const { usuario, token } = await respuesta.json() as { usuario: SesionUsuario; token: string };

            // Se guarda exactamente lo que dice el servidor, sin valores de relleno
            guardarSesion(usuario, token);

            Swal.fire({
                title: `¡Bienvenido ${usuario.usuario}!`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            navigate(usuario.rol === 'admin' ? '/administracion' : '/home');
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "No se pudo iniciar sesión";
            setError(mensaje);
            Swal.fire({
                title: 'Error de acceso',
                text: mensaje,
                icon: 'error',
                confirmButtonColor: '#1E293B',
                confirmButtonText: 'Reintentar'
            });
        } finally {
            setLoading(false);
        }
    };

    return { logearUsuario, loading, error };
};
