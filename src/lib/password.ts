/**
 * Política de contraseña para cuentas nuevas.
 *
 * Regla: al menos 6 caracteres, con AL MENOS una letra y AL MENOS un número.
 * Eso descarta las contraseñas débiles obvias —«123456» (solo números) o
 * «password» (solo letras)— sin exigir símbolos raros que un cajero olvidaría.
 *
 * Se comprueba en el cliente para avisar al instante, PERO la comprobación que
 * cuenta es la del servidor: la misma regla está duplicada a propósito en la
 * Edge Function `supabase/functions/crear-staff`, porque una función de Deno no
 * puede importar este archivo del frontend y el cliente siempre se puede saltar.
 */
export const PASSWORD_MIN = 6;

export function validarPassword(pwd: string): string | null {
  if (pwd.length < PASSWORD_MIN) return `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  if (!/[a-zA-Z]/.test(pwd)) return 'La contraseña no puede ser solo números: añade al menos una letra';
  if (!/[0-9]/.test(pwd)) return 'La contraseña debe incluir al menos un número';
  return null;
}
