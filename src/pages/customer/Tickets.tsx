import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sale } from "@/types";
import { getSales } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Ticket from "@/components/Ticket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Eye } from "lucide-react";

const Tickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (user) {
      const allSales = getSales();
      const userSales = allSales.filter(sale => sale.sellerEmail === user.email);
      setSales(userSales.reverse()); // Más recientes primero
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-slate-50 to-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4 animate-fade-in">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient-cinema mb-2">
              Mis Tickets
            </h1>
            <p className="text-muted-foreground">
              Historial completo de tus compras y tickets
            </p>
          </div>

          {sales.length === 0 ? (
            <Card className="card-cinema">
              <CardContent className="p-12 text-center">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No tienes tickets</h3>
                <p className="text-muted-foreground mb-6">
                  Cuando realices una compra, tus tickets aparecerán aquí
                </p>
                <Button onClick={() => navigate("/")} className="btn-cinema">
                  Ver Cartelera
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <Card key={sale.id} className="card-cinema hover-scale">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold mb-1">
                          Folio: {sale.id}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(sale.createdAt)}
                        </p>
                      </div>
                      <Badge className="bg-primary text-white">
                        ${sale.total.toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                          <span className="flex-1">
                            {item.type === "ticket" ? "🎟️" : "🍿"} {item.name}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            x{item.quantity || 1}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={() => setSelectedSale(sale)}
                      className="w-full btn-cinema"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Ticket Completo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedSale && (
        <Ticket
          items={selectedSale.items}
          subtotal={selectedSale.subtotal}
          tax={selectedSale.tax}
          total={selectedSale.total}
          saleId={selectedSale.id}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};

export default Tickets;
