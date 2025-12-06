// src/api/orders.ts
import type { CartItem } from "@/types";

// API_BASE apunta al backend en InfinityFree
const API_BASE = "https://cinexnova-starlight.wuaze.com";

// =============================
// Tipos para carrito / órdenes
// =============================

export type CartTicketItem = {
  type: "ticket";
  showtimeId: number;
  seatId: string; // ej: "B7"
  price: number;
};

export type CartProductItem = {
  type: "product";
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export type OrderItemPayload =
  | {
      type: "ticket";
      showtime_id: number;
      seat_row: string;
      seat_number: number;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }
  | {
      type: "product";
      product_id: number;
      quantity: number;
      unit_price: number;
      subtotal: number;
    };

// =============================
// API EXISTENTE (create_order, get_orders, get_tickets)
// =============================

export async function createOrder(params: {
  customerName: string;
  customerEmail: string;
  items: OrderItemPayload[];
}): Promise<{ ok: boolean; order_id: number }> {
  const res = await fetch(`${API_BASE}/create_order.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      items: params.items,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error HTTP createOrder:", res.status, txt);
    throw new Error("Error al crear la orden");
  }

  return res.json();
}

export async function fetchOrdersByEmail(email: string) {
  const res = await fetch(
    `${API_BASE}/get_orders.php?email=${encodeURIComponent(email)}`
  );
  if (!res.ok) throw new Error("Error al obtener órdenes");
  return res.json();
}

export async function fetchTicketsByEmail(email: string) {
  const res = await fetch(
    `${API_BASE}/get_tickets.php?email=${encodeURIComponent(email)}`
  );
  if (!res.ok) throw new Error("Error al obtener tickets");
  return res.json();
}

// =============================
// NUEVO: GUARDAR VENTA PARA EL QR
// =============================

// API de InfinityFree para guardar las ventas del QR
const SALES_API_BASE = "https://cinexnova-starlight.wuaze.com";

export interface RemoteSalePayload {
  folio: string;
  subtotal: number;
  tax: number;
  total: number;
  items: CartItem[];
}

export const createRemoteSale = async (payload: RemoteSalePayload) => {
  try {
    const res = await fetch(`${SALES_API_BASE}/create_sale.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folio: payload.folio,
        subtotal: payload.subtotal,
        tax: payload.tax,
        total: payload.total,
        items: payload.items,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("HTTP error create_sale.php", res.status, data);
      throw new Error((data as any)?.error || "Error en create_sale.php");
    }

    if (data && (data as any).error) {
      console.error("API error create_sale.php", data);
      throw new Error((data as any).error);
    }

    console.log("create_sale.php OK:", data);
    return data;
  } catch (error) {
    console.error("Error llamando a create_sale.php", error);
    throw error;
  }
};
