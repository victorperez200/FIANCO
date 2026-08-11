import { supabase } from './supabase';

/**
 * Llama a una Edge Function con la sesion del usuario actual.
 *
 * Existe porque el navegador NO puede borrar ni crear cuentas por su cuenta:
 * eso exige la clave de servicio, que jamas debe viajar al cliente. La funcion
 * comprueba en el servidor que quien llama es el dueño.
 */
export async function llamarFuncion<T>(
  nombre: string,
  body: unknown,
): Promise<{ data: T | null; error: string | null }> {
  const { data: sesion } = await supabase.auth.getSession();
  const token = sesion.session?.access_token;
  if (!token) return { data: null, error: 'Tu sesión expiró. Vuelve a iniciar sesión.' };

  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${nombre}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    let payload: { error?: string } & Record<string, unknown> = {};
    try {
      payload = await res.json();
    } catch {
      /* Respuesta sin cuerpo JSON (por ejemplo un 502 del gateway). */
    }

    if (!res.ok) {
      /* Un 404 aqui no es "no encontrado": es que la funcion no esta
         desplegada. Sin distinguirlo, el dueño ve un "Error interno" y no
         tiene forma de saber que falta un `supabase functions deploy`. */
      if (res.status === 404) {
        return { data: null, error: `La función «${nombre}» no está desplegada en Supabase.` };
      }
      return { data: null, error: payload.error ?? `Error ${res.status}` };
    }

    return { data: payload as T, error: null };
  } catch {
    /*
      `fetch` solo lanza si la peticion no llego a completarse, y el caso mas
      probable no es que se haya caido internet: cuando la funcion NO existe, la
      pasarela de Supabase responde a la comprobacion previa (preflight) del
      navegador sin permitir la cabecera `content-type`, asi que el navegador
      corta la peticion y el 404 nunca llega hasta aqui. Es decir: el caso 404
      de arriba casi nunca se alcanza desde el navegador y este es el mensaje
      que de verdad se ve. Por eso nombra las dos causas en vez de decir solo
      "error de conexion", que mandaba a revisar el wifi.
    */
    return {
      data: null,
      error: `No se pudo contactar con la función «${nombre}». Si es nueva, falta desplegarla en Supabase; si no, revisa tu conexión.`,
    };
  }
}
