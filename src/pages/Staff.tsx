import { useState } from 'react';
import { Users, Plus, Mail, Trash2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../lib/useRealtime';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { llamarFuncion } from '../lib/funciones';
import { validarPassword } from '../lib/password';
import { Button, IconButton, Card, Input, Badge, EmptyState, PageHeader, SkeletonRows } from '../components/ui';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Perfil } from '../types';

export function Staff() {
  const toast = useToast();
  const { perfil: perfilActual } = useAuth();
  const { data: perfiles, cargando, recargar } = useRealtime<Perfil>({
    query: async () => {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },
    tabla: 'perfiles',
  });

  const [showCrear, setShowCrear] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Perfil | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const duenos = perfiles.filter((p) => p.rol === 'dueño');
  const cajeros = perfiles.filter((p) => p.rol === 'cajero');

  const crearStaff = async () => {
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    const errPwd = validarPassword(form.password);
    if (errPwd) {
      toast.error(errPwd);
      return;
    }
    setGuardando(true);
    const { error } = await llamarFuncion('crear-staff', {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      password: form.password,
    });
    setGuardando(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Cajero «${form.nombre}» creado correctamente`);
    setShowCrear(false);
    setForm({ nombre: '', email: '', password: '' });
    recargar();
  };

  /**
   * Antes esto era `supabase.from('perfiles').delete()`. La tabla tiene RLS
   * activo y no hay politica DELETE, asi que el borrado afectaba a 0 filas y
   * PostgREST respondia sin error: salia el aviso de "eliminado" y el usuario
   * seguia en la lista. Ahora lo hace una Edge Function con la clave de
   * servicio, que ademas borra la cuenta de auth y no solo el perfil.
   */
  const eliminarStaff = async (p: Perfil) => {
    setEliminando(true);
    const { error } = await llamarFuncion('eliminar-staff', { id: p.id });
    setEliminando(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Usuario «${p.nombre}» eliminado`);
    /* No se espera al evento de tiempo real: si la tabla `perfiles` no esta en
       la publicacion de Realtime, ese evento no llega nunca y la lista se
       quedaria con el usuario ya borrado hasta recargar la pagina. */
    recargar();
  };

  return (
    <div className="page-shell animate-fade-in">
      <PageHeader
        title="Usuarios"
        subtitle="Gestiona el equipo de tu colmado"
        actions={
          <Button onClick={() => setShowCrear(true)}>
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Nuevo cajero</span>
            <span className="sm:hidden sr-only">Nuevo cajero</span>
          </Button>
        }
      />

      {cargando ? (
        <SkeletonRows rows={4} />
      ) : (
        <>
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              
              <h2 className="font-bold text-ink text-sm uppercase tracking-wide">Dueños</h2>
              <Badge variant="accent">{duenos.length}</Badge>
            </div>
            <ul className="space-y-2">
              {duenos.map((p) => (
                <PerfilRow key={p.id} perfil={p} esActual={p.id === perfilActual?.id} />
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              
              <h2 className="font-bold text-ink text-sm uppercase tracking-wide">Cajeros</h2>
              <Badge variant="info">{cajeros.length}</Badge>
            </div>
            {cajeros.length === 0 ? (
              <EmptyState
                icon={<Users className="w-7 h-7" />}
                title="Sin cajeros"
                description="Crea cuentas de cajero para que tu equipo pueda registrar ventas."
                action={
                  <Button onClick={() => setShowCrear(true)}>
                    <Plus className="w-4 h-4" aria-hidden="true" /> Crear cajero
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {cajeros.map((p) => (
                  <PerfilRow
                    key={p.id}
                    perfil={p}
                    esActual={p.id === perfilActual?.id}
                    onEliminar={() => setAEliminar(p)}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <Modal
        open={showCrear}
        onClose={() => setShowCrear(false)}
        title="Crear cajero"
        size="sm"
        footer={
          <Button block onClick={crearStaff} loading={guardando}>
            Crear cajero
          </Button>
        }
      >
        <div className="space-y-3">
          <p className="flex items-start gap-2 p-3 rounded-lg bg-primary-50 text-primary-800 text-sm">
            <KeyRound className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              El cajero podrá vender, manejar inventario, fiao y caja. No podrá anular ventas ni eliminar productos.
            </span>
          </p>
          <Input
            label="Nombre"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre del cajero"
          />
          <Input
            label="Email"
            type="email"
            required
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="cajero@email.com"
          />
          <Input
            label="Contraseña"
            type="password"
            required
            autoComplete="new-password"
            hint="Mínimo 6 caracteres, con letras y números (no solo números). Compártela de forma segura."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={aEliminar !== null}
        onClose={() => setAEliminar(null)}
        onConfirm={() => aEliminar && eliminarStaff(aEliminar)}
        title="Eliminar usuario"
        message={
          <>
            ¿Seguro que quieres eliminar a <strong>{aEliminar?.nombre}</strong>? Ya no podrá iniciar sesión. Esta
            acción no se puede deshacer.
          </>
        }
        confirmLabel="Sí, eliminar"
        loading={eliminando}
      />
    </div>
  );
}

function PerfilRow({
  perfil,
  esActual,
  onEliminar,
}: {
  perfil: Perfil;
  esActual: boolean;
  onEliminar?: () => void;
}) {
  const esDueno = perfil.rol === 'dueño';
  return (
    <Card as="li" className="p-3 flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${
          esDueno ? 'bg-accent-50 text-accent-800' : 'bg-primary-50 text-primary-800'
        }`}
        aria-hidden="true"
      >
        {perfil.nombre.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink truncate">{perfil.nombre}</p>
          {esActual && <Badge variant="success">Tú</Badge>}
        </div>
        <p className="flex items-center gap-1 text-xs text-ink-secondary mt-0.5">
          <Mail className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{perfil.email ?? '—'}</span>
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Badge variant={esDueno ? 'accent' : 'info'} className="capitalize">
          {perfil.rol}
        </Badge>
        {!esDueno && onEliminar && (
          <IconButton
            label={`Eliminar a ${perfil.nombre}`}
            icon={<Trash2 className="w-4 h-4" />}
            tone="danger"
            onClick={onEliminar}
          />
        )}
      </div>
    </Card>
  );
}
