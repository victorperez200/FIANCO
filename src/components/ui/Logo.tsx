/**
 * Identidad de marca. Un unico sitio donde vive el logo: antes el icono `Store`
 * de lucide estaba copiado en cuatro pantallas con cuatro tamanos distintos, asi
 * que cambiar la marca obligaba a tocar cada una.
 *
 * El logo tiene dos piezas:
 *   · MARCA    disco claro con el simbolo (dos barras unidas por un asta).
 *   · LOGOTIPO "Fianco" en serif con la aberracion cromatica de la marca.
 *
 * `tono` describe EL FONDO sobre el que se dibuja, no el color del logo:
 *   · 'oscuro' rail y panel de login  -> disco blanco, simbolo tinta
 *   · 'claro'  cabecera movil, lienzo -> disco tinta, simbolo blanco
 * El disco siempre existe: es lo que mantiene la misma silueta en ambos fondos.
 */

type Tono = 'oscuro' | 'claro';
type Tamano = 'sm' | 'md' | 'lg';

const MARCA: Record<Tamano, string> = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-14 h-14',
};

const LOGOTIPO: Record<Tamano, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

const CLAIM: Record<Tamano, string> = {
  sm: 'text-[0.625rem]',
  md: 'text-[0.6875rem]',
  lg: 'text-xs',
};

interface LogoMarcaProps {
  tono?: Tono;
  size?: Tamano;
  className?: string;
}

/** Solo el disco. Para favicon en pantalla, avatares o espacios muy estrechos. */
export function LogoMarca({ tono = 'oscuro', size = 'md', className = '' }: LogoMarcaProps) {
  const disco = tono === 'oscuro' ? '#FFFFFF' : 'rgb(var(--rail-bg))';
  const simbolo = tono === 'oscuro' ? 'rgb(var(--rail-bg))' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 48 48"
      className={`${MARCA[size]} shrink-0 ${className}`}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="24" fill={disco} />
      {/* Barra superior, asta y barra inferior: el simbolo se lee igual a 16px
          que a 96px porque no hay ningun trazo por debajo de 4px. */}
      <g fill={simbolo}>
        <rect x="13" y="13.5" width="22" height="5" rx="2.5" />
        <rect x="21.5" y="18.5" width="5" height="11" rx="2.5" />
        <rect x="13" y="29.5" width="22" height="5" rx="2.5" />
      </g>
    </svg>
  );
}

interface LogoProps extends LogoMarcaProps {
  /** Muestra el claim «Gestión para colmados» bajo el logotipo. */
  claim?: boolean;
  /** Apila marca y logotipo en vertical y centra (portada de login movil). */
  vertical?: boolean;
}

export function Logo({ tono = 'oscuro', size = 'md', claim = false, vertical = false, className = '' }: LogoProps) {
  const tinta = tono === 'oscuro' ? 'text-white' : 'text-ink';
  const claimTinta = tono === 'oscuro' ? 'text-rail-muted' : 'text-ink-muted';

  return (
    <div
      className={`flex items-center gap-3
        ${vertical ? 'flex-col text-center gap-2' : ''} ${className}`}
    >
      <LogoMarca tono={tono} size={size} />
      <div className={vertical ? '' : 'min-w-0'}>
        {/* El logotipo es texto real, no una imagen: el lector de pantalla
            anuncia «Fianco» y el zoom del navegador lo escala sin pixelar. */}
        <p className={`font-display font-bold tracking-tight leading-none logo-aberracion ${LOGOTIPO[size]} ${tinta}`}>
          Fianco
        </p>
        {claim && (
          <p className={`mt-1.5 uppercase tracking-[0.22em] leading-none ${CLAIM[size]} ${claimTinta}`}>
            
          </p>
        )}
      </div>
    </div>
  );
}
