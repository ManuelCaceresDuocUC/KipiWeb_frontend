import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiFetch } from "../helpers/apiFetch"; // ✨ 1. Importamos nuestro helper

interface Usuario {
    usuario: string;
    contrasena: string;
    rol?: string;
    id?: number;
    empresa?: { id: number };
}

export const useLogin = () => {
    const API_URL = `${import.meta.env.VITE_API_URL}/usuarios`;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    const eliminarUsuario = (usuario: string) => {
        setUsuarios(usuarios.filter(p => p.usuario !== usuario));
    };
    
    const agregarUsuario = (nuevo: Usuario) => {
        setUsuarios([...usuarios, nuevo]);
    };
    
    const cargarUsuarios = async () => {
        try {
            setLoading(true);

            // ✨ 2. MIRA QUÉ LIMPIO: apiFetch se encarga de buscar y pegar el JWT automáticamente
            const respuesta = await apiFetch(API_URL);

            if (!respuesta.ok) throw new Error("Error al conectar con el servidor o sin permisos");
            const datos = await respuesta.json();
            setUsuarios(datos);
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error desconocido";
            setError(mensaje);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const logearUsuario = async (credenciales: Usuario) => {
        setLoading(true); 
        setError(null);
        try {
            // Para el login podemos seguir usando fetch normal (o apiFetch), 
            // ya que en este momento el usuario todavía no tiene un token:
            const respuesta = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credenciales)
            });

            if (respuesta.ok) {
                const { usuario: usuarioLogeado, token } = await respuesta.json();
                
                Swal.fire({
                    title: `¡Bienvenido ${usuarioLogeado.usuario}!`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Guardado del token y sesión
                localStorage.setItem('jwt_token', token);
                localStorage.setItem('user_session', JSON.stringify(usuarioLogeado));
                
                const rolUsuario = usuarioLogeado.rol || 'vendedor';
                localStorage.setItem('usuarioRol', rolUsuario);
                localStorage.setItem('usuarioNombre', usuarioLogeado.usuario);
                localStorage.setItem('usuarioId', usuarioLogeado.id?.toString() || '1');
                const idEmpresa = usuarioLogeado.empresa?.id || 1;
                localStorage.setItem('empresaId', idEmpresa.toString());

                if (rolUsuario === 'administrador' || rolUsuario === 'admin') {
                    navigate('/administracion');
                } else {
                    navigate('/home'); 
                }
            } else {
                // Si la clave o el usuario están mal, lanzamos el error al catch
                throw new Error("Usuario o contraseña incorrectos");
            }
        } catch {
            Swal.fire({
                title: 'Error de acceso',
                text: "Usuario o contraseña incorrectos",
                icon: 'error',
                confirmButtonColor: '#1E293B',
                confirmButtonText: 'Reintentar'
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        usuarios,
        eliminarUsuario,
        agregarUsuario,
        logearUsuario,
        loading, 
        error,
    };
};