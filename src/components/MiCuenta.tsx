import { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { Button, IconButton, Input } from './ui';
import { Modal } from './Modal';
import { validarPassword } from '../lib/password';

/**
 * Traduce los mensajes de Supabase, que llegan en ingles.
 *
 * Lo que ve el cajero no puede ser "New password should be different from the
 * old password": si no entiende el error, no sabe que corregir.
 */
function traducir(mensaje: string) {
  const m = mensaje.toLowerCase();
  if (m.includes('should be different')) return 'La contraseña nueva debe ser distinta de la actual';
  if (m.includes('at least') || m.includes('minimum')) return 'La contraseña es demasiado corta';
  if (m.includes('already been registered') || m.includes('already registered')) {
    return 'Ese correo ya está en uso por otra cuenta';
  }
  if (m.includes('invalid') && m.includes('email')) return 'El correo no tiene un formato válido';
  if (m.includes('for security purposes')) return 'Espera un momento antes de volver a intentarlo';
  if (m.includes('same email')) return 'Ese ya es tu correo actual';
  return mensaje;
}

const CAMPOS_EMAIL = { nuevoEmail: '', password: '' };
const CAMPOS_PASS = { actual: '', nueva: '', repetir: '' };

export function MiCuenta({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, perfil, actualizarEmail, actualizarPassword } = useAuth();
  const toast = useToast();

  const emailActual = session?.user.email ?? '';

  const [formEmail, setFormEmail] = useState(CAMPOS_EMAIL);
  const [formPass, setFormPass] = useState(CAMPOS_PASS);
  const [verPass, setVerPass] = useState(false);
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);

  /* Las contraseñas escritas no deben sobrevivir al cierre del diálogo. */
  useEffect(() => {
    if (!open) {
      setFormEmail(CAMPOS_EMAIL);
      setFormPass(CAMPOS_PASS);
      setVerPass(false);
    }
  }, [open]);

  const cambiarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo = formEmail.nuevoEmail.trim();
    if (!nuevo || !formEmail.password) {
      toast.error('Completa el correo nuevo y tu contraseña actual');
      return;
    }
    if (nuevo.toLowerCase() === emailActual.toLowerCase()) {
      toast.error('Ese ya es tu correo actual');
      return;
    }

    setGuardandoEmail(true);
    const { error, confirmacionPendiente } = await actualizarEmail(nuevo, formEmail.password);
    setGuardandoEmail(false);

    if (error) {
      toast.error(traducir(error));
      return;
    }
    setFormEmail(CAMPOS_EMAIL);
    toast.success(
      confirmacionPendiente
        ? `Te enviamos un enlace a ${nuevo}. Ábrelo para confirmar el cambio.`
        : `Listo. Ahora entras con ${nuevo}.`,
    );
  };

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPass.actual || !formPass.nueva) {
      toast.error('Completa tu contraseña actual y la nueva');
      return;
    }
    const errPwd = validarPassword(formPass.nueva);
    if (errPwd) {
      toast.error(errPwd);
      return;
    }
    if (formPass.nueva !== formPass.repetir) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    setGuardandoPass(true);
    const { error } = await actualizarPassword(formPass.actual, formPass.nueva);
    setGuardandoPass(false);

    if (error) {
      toast.error(traducir(error));
      return;
    }
    setFormPass(CAMPOS_PASS);
    toast.success('Contraseña actualizada. Úsala la próxima vez que entres.');
  };

  const ojo = (
    <IconButton
      label={verPass ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
      icon={verPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      onClick={() => setVerPass((v) => !v)}
    />
  );

  return (
    <Modal open={open} onClose={onClose} title="Mi cuenta" size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sunken border border-line">
          <div
            className="w-11 h-11 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center font-bold shrink-0"
            aria-hidden="true"
          >
            {perfil?.nombre?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate">{perfil?.nombre}</p>
            <p className="text-sm text-ink-secondary truncate">{emailActual}</p>
          </div>
        </div>

        <p className="flex items-start gap-2 p-3 rounded-lg bg-primary-50 text-primary-800 text-sm">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>Para cambiar tu correo o tu contraseña tienes que escribir la contraseña actual.</span>
        </p>

        {/* ==================== Correo ==================== */}
        <form onSubmit={cambiarEmail} className="space-y-3">
          <h3 className="font-bold text-ink text-sm uppercase tracking-wide">Cambiar correo</h3>

          <Input
            label="Correo nuevo"
            type="email"
            required
            autoComplete="email"
            value={formEmail.nuevoEmail}
            onChange={(e) => setFormEmail({ ...formEmail, nuevoEmail: e.target.value })}
            placeholder="tu@email.com"
            hint="Con este correo iniciarás sesión a partir de ahora."
            leading={<Mail className="w-5 h-5" />}
          />

          <Input
            label="Tu contraseña actual"
            type={verPass ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={formEmail.password}
            onChange={(e) => setFormEmail({ ...formEmail, password: e.target.value })}
            placeholder="Contraseña actual"
            leading={<Lock className="w-5 h-5" />}
            trailing={ojo}
          />

          <Button type="submit" block variant="outline" loading={guardandoEmail}>
            Cambiar correo
          </Button>
        </form>

        <hr className="border-line" />

        {/* ==================== Contraseña ==================== */}
        <form onSubmit={cambiarPassword} className="space-y-3">
          <h3 className="font-bold text-ink text-sm uppercase tracking-wide">Cambiar contraseña</h3>

          <Input
            label="Tu contraseña actual"
            type={verPass ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={formPass.actual}
            onChange={(e) => setFormPass({ ...formPass, actual: e.target.value })}
            placeholder="Contraseña actual"
            leading={<Lock className="w-5 h-5" />}
            trailing={ojo}
          />

          <Input
            label="Contraseña nueva"
            type={verPass ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={formPass.nueva}
            onChange={(e) => setFormPass({ ...formPass, nueva: e.target.value })}
            placeholder="Mínimo 6 caracteres"
            hint="Mínimo 6 caracteres, con letras y números (no solo números)."
            leading={<Lock className="w-5 h-5" />}
          />

          <Input
            label="Repetir contraseña nueva"
            type={verPass ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={formPass.repetir}
            onChange={(e) => setFormPass({ ...formPass, repetir: e.target.value })}
            placeholder="Escríbela otra vez"
            error={
              formPass.repetir && formPass.nueva !== formPass.repetir ? 'No coincide con la nueva' : undefined
            }
            leading={<Lock className="w-5 h-5" />}
          />

          <Button type="submit" block loading={guardandoPass}>
            Cambiar contraseña
          </Button>
        </form>
      </div>
    </Modal>
  );
}
