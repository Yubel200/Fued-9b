export interface Producto { id: number; name: string; price: number; img: string; stock: number; available: boolean; }
export interface CartItem { id: number; name: string; price: number; img: string; stock: number; cantidad: number; }
export interface User { id: number; username: string; name: string; email: string; role: 'cliente' | 'admin'; }
export interface PedidoItem { producto_id: number; nombre_producto: string; precio: number; cantidad: number; subtotal: number; }
export interface Pedido {
  id: number; total: number; estado: 'pendiente' | 'cancelado' | 'entregado';
  estado_pago: 'pendiente' | 'verificado'; metodo_pago: 'efectivo' | 'tarjeta';
  fecha_creacion: string; fecha_entrega_estimada: string | null;
  nombre_completo: string; direccion: string; telefono: string; items: PedidoItem[];
}
export interface AdminStats {
  resumen: { ventas: number; pedidos: number; clientes: number; ticket: number };
  top_productos: { nombre: string; unidades: number; ingresos: number }[];
  ventas_dia: { fecha: string; pedidos: number; ventas: number }[];
  clientes: { id: number; username: string; name: string; compras: number; gastado: number }[];
  metodos: { metodo: string; pedidos: number; ventas: number }[];
  ultimos: { id: number; username: string; total: number; estado: string; estado_pago: string; metodo_pago: string; fecha_creacion: string }[];
}
