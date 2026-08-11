import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

interface UseRealtimeOptions<T> {
  query: () => Promise<{ data: T[] | null; error: Error | null }>;
  tabla: string;
  enabled?: boolean;
  deps?: unknown[];
}

/**
 * Hook que carga datos y los mantiene sincronizados en tiempo real
 * con Supabase Realtime. Cuando hay un cambio en la tabla, recarga
 * los datos desde la base de datos (evita inconsistencias).
 */
export function useRealtime<T>({
  query,
  tabla,
  enabled = true,
  deps = [],
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  /**
   * Solo la primera carga pinta el esqueleto. Antes cualquier recarga en tiempo
   * real —la venta de otro cajero, un ajuste de stock— vaciaba la lista entera
   * y la sustituia por el esqueleto durante el viaje de ida y vuelta a la base
   * de datos. Ademas del parpadeo, eso desmontaba las filas: si tenias el foco
   * en el boton de editar de una fila, el foco se caia al `body`.
   */
  const yaCargo = useRef(false);

  const cargar = async () => {
    try {
      if (!yaCargo.current) setCargando(true);
      const { data: result, error: err } = await queryRef.current();
      if (err) {
        setError(err.message);
      } else {
        setError(null);
        setData(result ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      yaCargo.current = true;
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setCargando(false);
      return;
    }

    /* Si cambia la tabla o alguna dependencia, la consulta pasa a significar
       otra cosa: ahi el esqueleto si es correcto, porque lo que hay en pantalla
       ya no corresponde a lo que se esta pidiendo. */
    yaCargo.current = false;
    cargar();

    const channel = supabase
      .channel(`realtime-${tabla}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tabla },
        () => cargar(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla, enabled, ...deps]);

  return { data, cargando, error, recargar: cargar };
}
