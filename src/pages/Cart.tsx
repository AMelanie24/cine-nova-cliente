// src/pages/customer/Cart.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart, saveCart, clearCart } from "@/utils/storage";
import {
  createOrder,
  type OrderItemPayload,
  createRemoteSale,
} from "@/api/orders";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type CartItem = {
  type: "ticket" | "product";
  name: string;
  price: number;
  quantity?: number;
  productId?: number;
  showtimeId?: number;
  seat?: string; // ej: "B7"
};

const Cart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Cliente STARLIGHT");
  const [customerEmail, setCustomerEmail] = useState("cliente@correo.com");
  const navigate = useNavigate();

  // Cargar carrito desde localStorage
  useEffect(() => {
    const cart = getCart();
    setItems(cart);
  }, []);

  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    saveCart(newItems as any);
  };

  const removeItem = (index: number) => {
    const copy = [...items];
    copy.splice(index, 1);
    updateCart(copy);
  };

  const changeQuantity = (index: number, delta: number) => {
    const copy = [...items];
    const item = copy[index];
    if (!item) return;
    if (item.type === "ticket") return; // tickets = siempre 1

    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      copy.splice(index, 1);
    } else {
      item.quantity = newQty;
    }
    updateCart(copy);
  };

  const total = items.reduce((sum, item) => {
    const qty = item.type === "ticket" ? 1 : item.quantity || 1;
    return sum + item.price * qty;
  }, 0);

  // ⭐ Handler real para confirmar compra
  const handlePay = async () => {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    if (!customerEmail.includes("@")) {
      toast.error("Ingresa un correo válido");
      return;
    }

    // Calculamos subtotal e IVA (16%) a partir del total
    const taxRate = 0.16;
    const subtotal = Number((total / (1 + taxRate)).toFixed(2));
    const tax = Number((total - subtotal).toFixed(2));

    // Adaptar carrito → payload para PHP (create_order.php)
    const payloadItems: OrderItemPayload[] = items.map((item) => {
      if (item.type === "ticket") {
        const seat = item.seat || "A1";
        const seatRow = seat.charAt(0);
        const seatNumber = parseInt(seat.slice(1) || "1", 10);
        const unitPrice = Number(item.price) || 0;

        return {
          type: "ticket",
          showtime_id: Number(item.showtimeId),
          seat_row: seatRow,
          seat_number: seatNumber,
          quantity: 1,
          unit_price: unitPrice,
          subtotal: unitPrice,
        };
      } else {
        const qty = Number(item.quantity || 1);
        const unitPrice = Number(item.price) || 0;
        return {
          type: "product",
          product_id: Number(item.productId),
          quantity: qty,
          unit_price: unitPrice,
          subtotal: unitPrice * qty,
        };
      }
    });

    try {
      toast.info("Procesando tu compra...");

      // 1️⃣ Crear orden en tu API existente (create_order.php)
      const resp = await createOrder({
        customerName,
        customerEmail,
        items: payloadItems,
      });

      // 2️⃣ Generar un folio para la venta (basado en timestamp, como el que ya ves en el QR)
      const saleId = `STAR-${Date.now()}`;

      // 3️⃣ Guardar venta + boletos en la tabla sales + tickets
      await createRemoteSale({
        folio: saleId,
        subtotal,
        tax,
        total,
        items, // mismos items del carrito
      });

      toast.success(`Compra realizada. Orden #${resp.order_id}`);

      clearCart();
      setItems([]);

      // Aquí, si más adelante quieres abrir el componente <Ticket />
      // puedes guardar saleId en algún estado global/contexto y navegar:
      // navigate(`/customer/ticket/${saleId}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al procesar la compra");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <h1 className="text-3xl font-bold mb-2 text-gradient-cinema">
            Carrito
          </h1>

          {/* Datos del cliente */}
          <Card className="card-cinema">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Datos para asociar tus tickets / compras
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Nombre
                  </label>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Correo electrónico
                  </label>
                  <input
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de items */}
          {items.length === 0 ? (
            <p className="text-muted-foreground">
              Tu carrito está vacío. Agrega productos o tickets desde la
              cartelera y la dulcería.
            </p>
          ) : (
            <Card className="card-cinema">
              <CardContent className="p-4 space-y-4">
                {items.map((item, index) => {
                  const qty =
                    item.type === "ticket" ? 1 : item.quantity || 1;
                  const subtotalItem = qty * item.price;

                  return (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {item.name}
                          </span>
                          <Badge variant="outline">
                            {item.type === "ticket"
                              ? "Ticket"
                              : "Producto"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} c/u
                        </p>
                        {item.type === "ticket" && item.seat && (
                          <p className="text-xs text-muted-foreground">
                            Asiento: <strong>{item.seat}</strong>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        {item.type === "product" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => changeQuantity(index, -1)}
                            >
                              -
                            </Button>
                            <span>{qty}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => changeQuantity(index, 1)}
                            >
                              +
                            </Button>
                          </div>
                        )}

                        <div className="text-right">
                          <p className="font-semibold">
                            ${subtotalItem.toFixed(2)}
                          </p>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Resumen y botón pagar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Total a pagar
              </p>
              <p className="text-3xl font-bold">
                ${total.toFixed(2)}{" "}
                <span className="text-base text-muted-foreground">
                  MXN
                </span>
              </p>
            </div>
            <Button
              className="btn-cinema px-8 py-6 text-lg"
              disabled={items.length === 0}
              onClick={handlePay}
            >
              Confirmar compra
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
