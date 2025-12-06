import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartItem } from "@/types";
import { getCart, saveCart, clearCart, saveSale } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Ticket from "@/components/Ticket";

const Cart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showTicket, setShowTicket] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setCart(getCart());
  }, []);

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    saveCart(newCart);
    toast.success("Artículo eliminado");
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
    saveCart(newCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    const sale = {
      id: `STAR-${Date.now()}`,
      sellerEmail: user?.email || "customer@starlight.com",
      items: cart,
      subtotal,
      tax,
      total,
      createdAt: new Date().toISOString(),
    };

    saveSale(sale);
    setLastSale(sale);
    clearCart();
    setCart([]);
    setShowTicket(true);
    toast.success("¡Compra realizada con éxito!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {showTicket && lastSale && (
        <Ticket
          items={lastSale.items}
          subtotal={lastSale.subtotal}
          tax={lastSale.tax}
          total={lastSale.total}
          saleId={lastSale.id}
          onClose={() => {
            setShowTicket(false);
            navigate("/");
          }}
        />
      )}
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gradient-cinema">Mi Carrito</h1>
            <Button onClick={() => navigate("/products")} variant="outline" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Seguir comprando
            </Button>
          </div>

          {cart.length === 0 ? (
            <Card className="card-cinema">
              <CardContent className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
                <p className="text-muted-foreground mb-6">Agrega productos o boletos para continuar</p>
                <Button onClick={() => navigate("/")} className="btn-cinema">
                  Ver cartelera
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item, index) => (
                  <Card key={index} className="card-cinema">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.type === "ticket" ? "Boleto" : "Producto"}
                        </p>
                      </div>

                      {item.type === "product" && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}
                          >
                            -
                          </Button>
                          <span className="w-12 text-center font-semibold">{item.quantity || 1}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}
                          >
                            +
                          </Button>
                        </div>
                      )}

                      <div className="text-right">
                        <p className="font-bold text-lg">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                      </div>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="card-cinema">
                <CardContent className="p-6">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (16%):</span>
                      <span className="font-semibold">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-xl">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button onClick={handleCheckout} className="w-full btn-cinema" size="lg">
                    Finalizar compra
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Cart;
