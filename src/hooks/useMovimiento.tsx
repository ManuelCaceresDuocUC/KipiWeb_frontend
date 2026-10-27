import { useEffect, useState } from "react";
import { apiFetch } from "../helpers/apiFetch"; // ✨ 1. Importación del helper

export interface VentaDetalle {
    id: number;
    cantidad: number;
    precioUnitario: number;
    precio: number;
    producto: {
        descripcion: string;
        precio: number;
    };
}

export interface Movimiento { 
    id: number;
    total: number;
    metodoPago: string;
    fechaHora: string;
    detalles: VentaDetalle[];
}

export const useMovimiento = () => {
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = `${import.meta.env.VITE_API_URL}/movimientos`;

    const cargarMovimientos = async (fechaInicio?: string, fechaFin?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (fechaInicio) {
                params.set('fechaInicio', fechaInicio);
                if (fechaFin) params.set('fechaFin', fechaFin);
            }
            const qs = params.toString();
            const url = qs ? `${API_URL}?${qs}` : API_URL;

            // ✨ 2. Uso de apiFetch
            const respuesta = await apiFetch(url);
            if (!respuesta.ok) throw new Error("Error en la respuesta del servidor");
            
            const datos = await respuesta.json();
            setMovimientos(datos);
        } catch (err) {
            console.log(err);
            setError("Error al procesar los datos del servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarMovimientos();
    }, []);

    return { cargarMovimientos, movimientos, loading, error, setError };
};