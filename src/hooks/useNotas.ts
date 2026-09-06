import { useState, useEffect } from 'react';
import { apiFetch } from '../helpers/apiFetch';
import type { Nota } from '../types/admin.types';

export const useNotas = (API_URL: string, empresaId: string) => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');

  // Cargar notas al inicio
  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const res = await apiFetch(`${API_URL}/notas?empresaId=${empresaId}`);
        if (res.ok) setNotas(await res.json());
      } catch (error) {
        console.error("Error al cargar notas", error);
      }
    };
    fetchNotas();
  }, [API_URL, empresaId]);

  const agregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNota.trim()) return;
    try {
      const res = await apiFetch(`${API_URL}/notas`, {
        method: 'POST',
        body: JSON.stringify({ texto: nuevaNota, empresa: { id: parseInt(empresaId) } })
      });
      if (res.ok) {
        setNotas([await res.json(), ...notas]);
        setNuevaNota('');
      }
    } catch (error) {
      console.error(error); 
    }
  };

  const eliminarNota = async (id: number) => {
    try {
      if ((await apiFetch(`${API_URL}/notas/${id}`, { method: 'DELETE' })).ok) {
        setNotas(notas.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    notas,
    nuevaNota, setNuevaNota,
    agregarNota, eliminarNota
  };
};