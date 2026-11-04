import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { apiFetch, esErrorDeConexion, leerError } from "../helpers/apiFetch"; // ✨ 1. Importación del helper
import { kvGuardar, kvLeer } from "../helpers/almacenOffline";
import { claveCatalogo } from "../helpers/session";

export interface Producto {
    id: number;
    codigoBarras?: string;
    descripcion: string;
    precio: number;
    stock: number;
    costo?: number | null;
    stockCritico: number;
    esInsumo: boolean;
    unidadMedida: string;
    pesable?: boolean;
    receta?: IngredienteReceta[];
    categoria?: {
        id: number;
        nombre: string;
    };
}

interface IngredienteParaEnviar {
    insumoId: number;
    cantidad: number;
}

export interface IngredienteReceta {
    id: number;
    cantidadUsada: number;
    insumo: {
        id: number;
        descripcion: string;
        stock: number;
    };
}

interface OpcionesInventario {
    /** Guarda una copia del catálogo en el dispositivo y la usa si no hay conexión (para la caja). */
    copiaSinConexion?: boolean;
}

interface CatalogoGuardado {
    guardadoEn: number;
    productos: Producto[];
}

export const useInventario = (opciones: OpcionesInventario = {}) => {
    const { copiaSinConexion = false } = opciones;
    // Si no es null, la lista viene de la copia del dispositivo (momento en que se guardó)
    const [catalogoGuardadoEn, setCatalogoGuardadoEn] = useState<number | null>(null);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    // Sucursal cuyo stock se muestra (solo admin). null = la sucursal propia del usuario.
    const [sucursalId, setSucursalId] = useState<number | null>(null);

    const API_URL = `${import.meta.env.VITE_API_URL}/productos`;

    const cargarProductos = async (sucursal: number | null = sucursalId) => {
        try {
            setLoading(true);
            // la empresa la define el token en el servidor; el stock es el de la sucursal indicada
            const urlConEmpresa = `${API_URL}?size=2000${sucursal ? `&sucursalId=${sucursal}` : ''}`;
            
            // ✨ 2. Uso de apiFetch en la lectura
            const respuesta = await apiFetch(urlConEmpresa); 
            
            if (!respuesta.ok) {
                throw new Error("No es posible contactar el servidor");
            }
            const datos = await respuesta.json();
            const listaProductos = datos.content ? datos.content : datos;
            setProductos(listaProductos);
            setCatalogoGuardadoEn(null);
            if (copiaSinConexion && !sucursal) {
                // Para vender sin conexión no hacen falta costos ni recetas: no se guardan en el dispositivo
                const liviana = (listaProductos as Producto[]).map((p) => ({ ...p, costo: null, receta: undefined }));
                void kvGuardar(claveCatalogo(), { guardadoEn: Date.now(), productos: liviana } satisfies CatalogoGuardado);
            }
        } catch (err: unknown) {
            if (copiaSinConexion && esErrorDeConexion(err)) {
                const copia = await kvLeer<CatalogoGuardado>(claveCatalogo());
                if (copia && copia.productos.length > 0) {
                    setProductos(copia.productos);
                    setCatalogoGuardadoEn(copia.guardadoEn);
                    setError(null);
                    return;
                }
            }
            const mensaje = err instanceof Error ? err.message : "Error desconocido";
            setError(mensaje);
            console.error("Error al cargar inventario", err);
        } finally {
            setLoading(false);
        }
    };   

    useEffect(() => {
        cargarProductos(sucursalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sucursalId]);

    /** Tras una venta guardada sin conexión: baja el stock mostrado (y la copia del dispositivo) para no vender de más. */
    const descontarLocal = (items: { id: number; cantidad: number }[]) => {
        setProductos((prev) => {
            const siguiente = prev.map((p) => {
                const vendido = items.find((i) => i.id === p.id);
                return vendido ? { ...p, stock: Math.max(0, p.stock - vendido.cantidad) } : p;
            });
            if (copiaSinConexion && !sucursalId) {
                const previoGuardado = catalogoGuardadoEn ?? Date.now();
                void kvGuardar(claveCatalogo(), { guardadoEn: previoGuardado, productos: siguiente } satisfies CatalogoGuardado);
            }
            return siguiente;
        });
    };

    const eliminarProducto = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // ✨ 3. Uso de apiFetch para eliminar
                const res = await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if(!res.ok) throw new Error(await leerError(res, "Error al eliminar en el servidor"));

                setProductos(productos.filter(p => p.id !== id));
                Swal.fire('¡Eliminado!', 'El producto ha sido borrado.', 'success');
            } catch (err: unknown) {
                console.error("Error al eliminar:", err);
                Swal.fire('No se pudo eliminar', err instanceof Error ? err.message : 'No se pudo eliminar el producto', 'error');
            }
        }
    };

    const agregarProducto = async (nuevo: Omit<Producto, 'id'>, ingredientes?: IngredienteParaEnviar[]) => {
        try {
            // La empresa la fija el servidor desde el token: no se envía.
            const productoConEmpresa = { ...nuevo };

            const urlFinal = ingredientes && ingredientes.length > 0 
                ? `${API_URL}/con-receta` 
                : API_URL;

            const body = ingredientes && ingredientes.length > 0
                ? { productoPrincipal: productoConEmpresa, ingredientes: ingredientes }
                : productoConEmpresa;

            // ✨ 4. Uso de apiFetch para guardar producto/receta
            const res = await apiFetch(urlFinal, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                throw new Error(await leerError(res, "Error en el servidor"));
            }

            await cargarProductos(sucursalId); 
            Swal.fire('Guardado', 'Producto y receta registrados con éxito', 'success');
        } catch (err: unknown) {
            console.error("Error al agregar:", err);
            Swal.fire('Error', 'No se pudo guardar el producto.', 'error');
            throw err;
        }
    };

    const editarProducto = async (id: number, datosActualizados: Omit<Producto, 'id'>) => {
        try {
            const res = await apiFetch(`${API_URL}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(datosActualizados)
            });
            if (!res.ok) throw new Error(await leerError(res, "Error al actualizar en el servidor"));
            
            // 🟢 Re-cargamos la lista completa para reflejar relaciones/categorías actualizadas desde la base de datos
            await cargarProductos(sucursalId);
            
            Swal.fire('¡Éxito!', 'Producto actualizado correctamente', 'success');
        } catch (err: unknown) {
            console.error("Error al editar:", err);
            Swal.fire('No se pudo modificar', err instanceof Error ? err.message : 'No se pudo modificar el producto', 'error');
        }
    }; // 🟢 CORRECCIÓN: Faltaba esta llave de cierre de la función editarProducto

    const obtenerStockVisual = (producto: Producto) => {
        if (producto.esInsumo || !producto.receta || producto.receta.length === 0) {
            return producto.stock;
        }
        const limites = producto.receta.map(item => {
            const insumoOriginal = productos.find(p => p.id === item.insumo.id);
            if (!insumoOriginal || insumoOriginal.stock <= 0) return 0;
            return Math.floor(insumoOriginal.stock / item.cantidadUsada);
        });
        return Math.min(...limites);
    };

    const productosFiltrados = productos.filter(p => {
        const b = busqueda.toLowerCase();
        return p.descripcion.toLowerCase().includes(b) || p.codigoBarras?.toLowerCase().includes(b) || p.id.toString().includes(b);
    });

    return {
        productosFiltrados,
        busqueda,
        setBusqueda,
        sucursalId,
        setSucursalId,
        productos,
        catalogoGuardadoEn,
        loading, 
        error,
        cargarProductos,   
        descontarLocal,
        eliminarProducto,
        agregarProducto,
        editarProducto,
        obtenerStockVisual,
        refrescar: () => cargarProductos(sucursalId)
    };
};