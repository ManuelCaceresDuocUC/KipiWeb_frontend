# KIPIPOS · Etapa 2 (frontend) — Inventario por sucursal

**Verificación:** no pude hacer `npm run build` (sin acceso a npm); solo un chequeo de tipos con shims, sin errores reales. Corre `npm run build` y pásame lo que salga.

- `hooks/useInventario.tsx`: estado `sucursalId`, carga el stock de esa sucursal, campo `costo`.
- `components/PanelStockSucursal.tsx` (nuevo): selector de sucursal, casilla "permitir vender sin stock" e historial de movimientos paginado.
- `pages/Inventario.tsx`: "Ajustar Stock" ahora registra Entrada / Merma / Conteo físico (con motivo) en el servidor; el stock del formulario es solo-lectura al editar; campo costo.

Despliega este frontend **después** del backend y de correr el SQL 04.
