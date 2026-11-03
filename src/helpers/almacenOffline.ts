// Almacén local del dispositivo (IndexedDB) para trabajar sin conexión.
// - "kv": copias de datos del servidor (catálogo, estado de caja). Se borran al cerrar sesión.
// - "ventas_pendientes": ventas hechas sin conexión que aún no llegan al servidor. NUNCA se borran al cerrar sesión.
// Ninguna función lanza error: si el navegador no permite guardar, la app sigue funcionando como antes.

const NOMBRE_BD = 'kipi-offline';
const VERSION_BD = 1;
export const STORE_KV = 'kv';
export const STORE_VENTAS = 'ventas_pendientes';

let conexion: Promise<IDBDatabase> | null = null;

const abrir = (): Promise<IDBDatabase> => {
  if (conexion) return conexion;
  conexion = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(NOMBRE_BD, VERSION_BD);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
      if (!db.objectStoreNames.contains(STORE_VENTAS)) db.createObjectStore(STORE_VENTAS, { keyPath: 'clave' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  conexion.catch(() => {
    conexion = null;
  });
  return conexion;
};

/** Ejecuta una operación sobre un almacén y espera a que la transacción termine de verdad. */
export const operacion = async <T>(
  almacen: string,
  modo: IDBTransactionMode,
  accion: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await abrir();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(almacen, modo);
    const req = accion(tx.objectStore(almacen));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

export const kvGuardar = async (clave: string, valor: unknown): Promise<void> => {
  try {
    await operacion(STORE_KV, 'readwrite', (s) => s.put(valor, clave));
  } catch {
    /* sin almacenamiento: se trabaja solo con conexión */
  }
};

export const kvLeer = async <T>(clave: string): Promise<T | null> => {
  try {
    const v = await operacion<T | undefined>(STORE_KV, 'readonly', (s) => s.get(clave));
    return v ?? null;
  } catch {
    return null;
  }
};

/** Borra las copias de datos (catálogo, caja). Las ventas pendientes se conservan. */
export const kvLimpiar = async (): Promise<void> => {
  try {
    await operacion(STORE_KV, 'readwrite', (s) => s.clear());
  } catch {
    /* nada que limpiar */
  }
};
