import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "../helpers/apiFetch"; // ✨ 1. Importación del helper

export interface Receta {
    id?: number;
    productoPadreId?: number;
    productoPadreNombre?: string; 
    productoNombre?: string; 
    insumoId?: number;        
    insumoNombre?: string;
    cantidadUsada: number;   
    productoPrincipal?: {
        id: number;
        descripcion: string;
    };
    insumo?: {
        id: number;
        descripcion: string;
        stock?: number;
    };
    producto?: {
        id: number;
        descripcion: string;
    };
}

export const useRecetas = () => {
    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_URL = `${import.meta.env.VITE_API_URL}/recetas`;

    const cargarRecetas = async () => {
        try {
            setLoading(true);
            // ✨ 2. Uso de apiFetch
            const respuesta = await apiFetch(API_URL);
            if (!respuesta.ok) throw new Error("Error al conectar con el servidor");
            const datos = await respuesta.json();
            
            console.log("Recetas recibidas del backend:", datos); 
            setRecetas(datos);
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error desconocido";
            setError(mensaje);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarRecetas();
    }, []);

    const eliminarReceta = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Disociar insumo?',
            text: "Se borrará la relación de este insumo con la formulación del producto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, disociar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // ✨ 3. Uso de apiFetch para eliminar
                const res = await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("Error en el servidor");

                setRecetas(recetas.filter(r => r.id !== id));
                Swal.fire('Eliminado', 'El insumo ha sido disociado de la receta.', 'success');
            } catch (err) {
                console.error("Error al eliminar:", err);
                const mensajeError = err instanceof Error ? err.message : 'Ocurrió un problema inesperado';
                Swal.fire('Error', mensajeError, 'error');
            }
        }
    };

    const agregarReceta = async (nuevo: Omit<Receta, 'id' | 'productoPadreNombre' | 'insumoNombre'>) => {
        try {
            // ✨ 4. Uso de apiFetch para crear receta
            const res = await apiFetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(nuevo)
            });
            if (!res.ok) throw new Error("Error al guardar");
            
            const recetaGuardada = await res.json();
            setRecetas([...recetas, recetaGuardada]);
            Swal.fire('Éxito', 'Insumo vinculado correctamente', 'success');
        } catch (err) {
            console.error("Error al agregar:", err);
            const mensajeError = err instanceof Error ? err.message : 'Ocurrió un problema inesperado';
            Swal.fire('Error', mensajeError, 'error');
        }
    };

    const editarReceta = async (id: number, datosActualizados: Partial<Receta>) => {
        try {
            // ✨ 5. Uso de apiFetch para editar receta
            const res = await apiFetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(datosActualizados)
            });

            if (!res.ok) throw new Error("Error al actualizar");

            const recetaServidor = await res.json();
            setRecetas(prev => prev.map(r => r.id === id ? recetaServidor : r));

            Swal.fire('Actualizado', 'Los cambios han sido guardados', 'success');
        } catch (err: unknown) {
            console.error("Error al actualizar:", err); 
            const mensajeError = err instanceof Error ? err.message : 'Ocurrió un problema inesperado';
            Swal.fire('Error', mensajeError, 'error');
        }
    };

    return {
        recetas,
        loading,
        error,
        eliminarReceta,
        agregarReceta,
        editarReceta,
        cargarRecetas,
        refrescar: cargarRecetas 
    };
};