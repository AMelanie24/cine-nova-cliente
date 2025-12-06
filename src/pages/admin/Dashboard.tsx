import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSales, getProducts } from "@/utils/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Ticket, ShoppingBag, TrendingUp, Film, Package, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    ticketsSold: 0,
    productsSold: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const sales = getSales();
    const today = new Date().toISOString().split('T')[0];
    
    const todaySales = sales.filter(s => s.createdAt.startsWith(today));
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    
    let tickets = 0;
    let products = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.type === "ticket") tickets++;
        else products += item.quantity || 1;
      });
    });

    setStats({
      totalSales: totalRevenue,
      todaySales: todayRevenue,
      ticketsSold: tickets,
      productsSold: products,
    });
  }, []);

  const statCards = [
    {
      title: "Ventas Totales",
      value: `$${stats.totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Ventas del Día",
      value: `$${stats.todaySales.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-secondary",
    },
    {
      title: "Boletos Vendidos",
      value: stats.ticketsSold.toString(),
      icon: Ticket,
      color: "text-blue-500",
    },
    {
      title: "Productos Vendidos",
      value: stats.productsSold.toString(),
      icon: ShoppingBag,
      color: "text-green-500",
    },
  ];

  const managementCards = [
    {
      title: "Películas",
      description: "Administrar cartelera",
      icon: Film,
      path: "/admin/movies",
    },
    {
      title: "Productos",
      description: "Gestionar dulcería",
      icon: Package,
      path: "/admin/products",
    },
    {
      title: "Reportes",
      description: "Generar PDF y Excel",
      icon: FileText,
      path: "/admin/reports",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gradient-cinema">Panel de Administración</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Card key={index} className="card-cinema">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {managementCards.map((card, index) => (
              <Card key={index} className="card-cinema group cursor-pointer" onClick={() => navigate(card.path)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <card.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
