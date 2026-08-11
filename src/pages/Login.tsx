import { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { Button, IconButton, Input, Logo } from '../components/ui';

export function Login() {
  const { signIn, signUp } = useAuth();
  const toast = useToast();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    if (modo === 'login') {
      const { error } = await signIn(email, password);
      if (error) toast.error(error === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error);
    } else {
      const { error } = await signUp(email, password, nombre || email.split('@')[0]);
      if (error) {
        toast.error(error.includes('already') ? 'Este email ya está registrado' : error);
      } else {
        toast.success('Cuenta creada. Bienvenido a Fianco.');
      }
    }
    setEnviando(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-canvas">
      {/* ============ Panel decorativo (solo escritorio) ============ */}
      <div className="lg:w-1/2 bg-rail relative overflow-hidden hidden lg:flex flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Logo tono="oscuro" size="md" claim />
        </div>

        <div className="relative z-10 text-white">
          <p className="text-4xl font-extrabold leading-tight mb-4">
            Tu colmado,
            <br />
            siempre bajo control
          </p>
          <p className="text-white/75 text-lg max-w-md">
            Ventas, inventario, crédito «fiao» y caja — todo en una sola app simple, rápida y pensada para el día a
            día del colmado dominicano.
          </p>

          <dl className="flex gap-6 mt-8">
            <div>
              <dt className="text-3xl font-bold">RD$</dt>
              <dd className="text-rail-muted text-sm">Caja en tiempo real</dd>
            </div>
            <div>
              <dt className="text-3xl font-bold">Fiao</dt>
              <dd className="text-rail-muted text-sm">Control de deudas</dd>
            </div>
            <div>
              <dt className="text-3xl font-bold">Stock</dt>
              <dd className="text-rail-muted text-sm">Alertas automáticas</dd>
            </div>
          </dl>
        </div>

        <p className="relative z-10 text-rail-muted text-xs">Hecho para colmados de República Dominicana</p>
      </div>

      {/* ============ Formulario ============ */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Logo tono="claro" size="md" claim vertical className="lg:hidden mb-8" />

          <h1 className="text-2xl font-bold text-ink mb-1">
            {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>
          <p className="text-ink-secondary text-sm mb-6">
            {modo === 'login' ? 'Ingresa para gestionar tu colmado' : 'El dueño del colmado debe crear tu cuenta'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'registro' && (
              <Input
                label="Nombre"
                type="text"
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                leading={<UserIcon className="w-5 h-5" />}
              />
            )}

            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              leading={<Mail className="w-5 h-5" />}
            />

            <Input
              label="Contraseña"
              type={showPass ? 'text' : 'password'}
              required
              minLength={6}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              hint={modo === 'registro' ? 'Al menos 6 caracteres.' : undefined}
              leading={<Lock className="w-5 h-5" />}
              trailing={
                <IconButton
                  label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  icon={showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  onClick={() => setShowPass((v) => !v)}
                />
              }
            />

            <Button type="submit" size="lg" block loading={enviando}>
              {modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-secondary mt-6">
            {modo === 'login' ? '' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
              className="text-primary-700 font-semibold hover:text-primary-800 cursor-pointer
                transition-colors duration-base ease-smooth"
            >
              {modo === 'login' ? '' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
