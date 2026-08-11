/**
 * Criterio unico de "stock bajo".
 *
 * Antes cada pantalla lo decidia por su cuenta y no coincidian: Inventario
 * comparaba en el cliente (y contaba tambien los productos dados de baja),
 * mientras el inicio y la insignia del menu preguntaban a la base de datos con
 * un filtro que no funcionaba. Con un solo predicado, los tres numeros dicen lo
 * mismo.
 *
 * Un producto inactivo no cuenta: esta descatalogado, no "por reponer".
 */
export interface ConStock {
  stock: number;
  stock_minimo: number;
  activo?: boolean;
}

export const esStockBajo = (p: ConStock) => p.activo !== false && p.stock < p.stock_minimo;
