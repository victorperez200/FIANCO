import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Perfil } from '../types';

interface AuthContextValue {
  session: Session | null;
  perfil: Perfil | null;
  cargando: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /**
   * Quien se registra nace SIEMPRE como cajero. No hay parametro de rol a
   * proposito: los metadatos del registro los elige quien llama a la API, no
   * la app, asi que aceptarlos aqui era una ilusion de control (ver la
   * migracion 010). El rol lo concede despues un dueño.
   */
  signUp: (email: string, password: string, nombre: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /**
   * `confirmacionPendiente` avisa de que el correo aun NO ha cambiado porque
   * Supabase mando un enlace de verificacion al nuevo. Depende de la opcion
   * "Confirm email" del proyecto, asi que se deduce de la respuesta.
   */
  actualizarEmail: (
    nuevoEmail: string,
    passwordActual: string,
  ) => Promise<{ error: string | null; confirmacionPendiente: boolean }>;
  actualizarPassword: (passwordActual: string, nuevaPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarPerfil(uid: string, emailSesion?: string | null) {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    let p = data as Perfil | null;

    /* El trigger `handle_new_user` solo escribe `perfiles.email` al crear la
       cuenta. Si el usuario cambia su correo, esa fila se queda con el antiguo
       y la pantalla Usuarios mostraria un email que ya no sirve para entrar.
       Se resincroniza aqui, que es el unico punto por el que pasan todas las
       sesiones. La politica RLS `perfiles_update_propio_o_dueno` lo permite. */
    if (p && emailSesion && p.email !== emailSesion) {
      const { data: actualizado } = await supabase
        .from('perfiles')
        .update({ email: emailSesion })
        .eq('id', uid)
        .select()
        .maybeSingle();
      if (actualizado) p = actualizado as Perfil;
    }

    setPerfil(p);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        (async () => {
          await cargarPerfil(data.session!.user.id, data.session!.user.email);
          setCargando(false);
        })();
      } else {
        setCargando(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        (async () => {
          await cargarPerfil(newSession.user.id, newSession.user.email);
        })();
      } else {
        setPerfil(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, nombre: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await cargarPerfil(data.user.id);
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPerfil(null);
    setSession(null);
  };

  /**
   * Vuelve a pedir la contraseña antes de tocar las credenciales.
   *
   * Supabase no la exige para `updateUser`, pero sin esto bastaria con una
   * sesion abierta y sin vigilancia —el movil del colmado sobre el mostrador—
   * para quedarse con la cuenta: cambias correo y contraseña y el dueño ya no
   * puede entrar. El email se lee de la sesion viva, no del estado de React,
   * para no depender de un render intermedio.
   */
  const reautenticar = async (password: string) => {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!email) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? 'La contraseña actual no es correcta' : null;
  };

  const actualizarEmail = async (nuevoEmail: string, passwordActual: string) => {
    const fallo = await reautenticar(passwordActual);
    if (fallo) return { error: fallo, confirmacionPendiente: false };

    const { data, error } = await supabase.auth.updateUser({ email: nuevoEmail });
    if (error) return { error: error.message, confirmacionPendiente: false };

    /* Con "Confirm email" activado, Supabase deja el correo viejo en `email` y
       guarda el nuevo aparte hasta que se abra el enlace. Con la confirmacion
       desactivada —como esta hoy este proyecto— el cambio es inmediato. Se
       compara la respuesta en vez de dar por hecha una de las dos config: si
       manana se activa la confirmacion, el aviso al usuario sigue siendo cierto. */
    const yaAplicado = (data.user?.email ?? '').toLowerCase() === nuevoEmail.toLowerCase();
    return { error: null, confirmacionPendiente: !yaAplicado };
  };

  const actualizarPassword = async (passwordActual: string, nuevaPassword: string) => {
    const fallo = await reautenticar(passwordActual);
    if (fallo) return { error: fallo };
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{ session, perfil, cargando, signIn, signUp, signOut, actualizarEmail, actualizarPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
