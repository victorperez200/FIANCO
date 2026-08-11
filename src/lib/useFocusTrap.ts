import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Pila de capas abiertas.
 *
 * Cuando un dialogo se abre encima de otro (en Ventas, "Crear cliente" sale
 * sobre "Seleccionar cliente") las dos trampas escuchan en `document`, asi que
 * un Escape cerraria las dos de golpe y un Tab pelearia entre ambas. Solo la
 * capa que esta en la cima reacciona.
 */
const pila: symbol[] = [];

/**
 * Encierra el foco dentro de una capa superpuesta mientras esta abierta.
 *
 * Sin esto, tabular dentro de un modal o de un menu lateral saca el foco a la
 * pagina de detras: el usuario de teclado sigue "escribiendo" en una pantalla
 * que ya no ve. Ademas cierra con Escape, bloquea el scroll del fondo y
 * devuelve el foco al elemento que abrio la capa.
 *
 * Devuelve la ref que hay que colgar del contenedor de la capa.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  /**
   * `onClose` llega casi siempre como una funcion anonima declarada en el render
   * de la pagina, asi que cambia de identidad en CADA render. Si estuviera en las
   * dependencias del efecto, la trampa se desmontaria y se volveria a montar con
   * cada pulsacion de tecla dentro del dialogo: la limpieza devolvia el foco al
   * elemento anterior y el efecto nuevo lo mandaba al primer focusable (la X de
   * cerrar). Ese era el bug de "escribo el nombre y el cursor se va del campo".
   *
   * Guardandolo en una ref, el efecto se monta una sola vez por apertura y el
   * manejador de Escape sigue viendo siempre la version mas reciente.
   */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;

    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = Symbol('capa');
    pila.push(token);
    const esLaCima = () => pila[pila.length - 1] === token;

    /* Se recalcula en cada Tab: el contenido de la capa puede cambiar
       (por ejemplo al aparecer un error de validacion). */
    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      );

    const primero = focusables()[0];
    if (primero) primero.focus();
    else node?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (!esLaCima()) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }

      const first = list[0];
      const last = list[list.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const i = pila.indexOf(token);
      if (i !== -1) pila.splice(i, 1);
      /* Solo la ultima capa en cerrarse devuelve el scroll: si lo hiciera la de
         encima, el fondo volveria a desplazarse con el dialogo aun abierto. */
      if (pila.length === 0) document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [active]);

  return ref;
}
