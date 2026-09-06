import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../helpers/apiFetch';
import type { Categoria } from '../types/admin.types';

export const useCategorias = (API_URL: string, empresaId: string) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');

  // Cargar categorías al inicio
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await apiFetch(`${API_URL}/categorias?empresaId=${empresaId}`);
        if (res.ok) setCategorias(await res.json());
      } catch (error) {
        console.error("Error al cargar categorías", error);
      }
    };
    fetchCategorias();
  }, [API_URL, empresaId]);

  const agregarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    try {
      const res = await apiFetch(`${API_URL}/categorias`, {
        method: 'POST',
        body: JSON.stringify({ nombre: nuevaCategoria, empresa: { id: parseInt(empresaId) } })
      });
      if (res.ok) {
        setCategorias([...categorias, await res.json()]);
        setNuevaCategoria('');
        Swal.fire('Confirmación', 'La categoría ha sido registrada.', 'success');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const iniciarEdicion = (cat: Categoria) => {
    setEditandoCategoriaId(cat.id);
    setEditandoNombre(cat.nombre);
  };

  const guardarEdicion = async (id: number) => {
    if (!editandoNombre.trim()) return;
    try {
      const res = await apiFetch(`${API_URL}/categorias/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre: editandoNombre, empresa: { id: parseInt(empresaId) } })
      });
      if (res.ok) {
        const actualizado = await res.json();
        setCategorias(categorias.map(cat => cat.id === id ? actualizado : cat));
        setEditandoCategoriaId(null);
        setEditandoNombre('');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarCategoria = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: "Si la categoría posee productos vinculados, no se podrá eliminar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiFetch(`${API_URL}/categorias/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategorias(categorias.filter(cat => cat.id !== id));
        Swal.fire('Confirmación', 'Categoría eliminada.', 'success');
      } else {
        Swal.fire('Error', 'No es posible eliminar esta categoría.', 'error');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    categorias,
    nuevaCategoria, setNuevaCategoria,
    editandoCategoriaId, 
    setEditandoCategoriaId, // <- AGREGAR ESTA LÍNEA
    editandoNombre, setEditandoNombre,
    agregarCategoria, iniciarEdicion, guardarEdicion, eliminarCategoria
  };
};