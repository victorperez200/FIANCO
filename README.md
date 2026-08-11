# Fianco

Gestión para colmados — una app simple, rápida y pensada para el día a día del
colmado dominicano: **ventas, inventario, crédito «fiao» y caja**, todo en un
solo lugar y en tiempo real.

## Qué hace

- **Vender** — catálogo con búsqueda por nombre o categoría, carrito, cobro al
  contado o a fiao.
- **Inventario** — productos, precios, stock y alertas de stock bajo.
- **Fiao** — control de deudas por cliente, abonos parciales y estados
  (pendiente, abonada, vencida, saldada).
- **Caja** — ingresos y egresos del día, cierre de caja.
- **Clientes** — ficha, teléfono y límite de crédito.
- **Historial** — ventas del día con opción de anular (solo dueño).
- **Usuarios** — el dueño crea y elimina cuentas de cajero.

### Roles

- **Dueño** — acceso total: anular ventas, eliminar productos/clientes,
  gestionar usuarios y abonar deudas vencidas.
- **Cajero** — vender, fiao y caja del día a día.


## Tecnologías

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS.
- **Backend:** Supabase — PostgreSQL (con RLS y funciones PL/pgSQL), Auth,
  Realtime y Edge Functions (Deno/TypeScript).
- **Iconos:** lucide-react · **Tipografías:** Geist / Geist Mono / Playfair Display.



## Backend (Supabase)

El código del backend vive en `supabase/`:


## Estructura

```
src/
  components/   Componentes de UI y layout
  pages/        Un archivo por módulo (Ventas, Inventario, Fiao, Caja, …)
  lib/          Cliente Supabase, auth, consultas, hooks y utilidades
  styles/       Tokens de diseño (colores, tipografía, espaciado)
supabase/
  migrations/   Esquema y funciones de la base de datos
  functions/    Edge Functions (Deno)
public/         Recursos estáticos
```
