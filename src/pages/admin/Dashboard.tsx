import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Ticket,
  TrendingUp,
  Film,
  Package,
  FileText,
  Calendar,
  Users,
  ShoppingBag,
  BarChart3,
  Clock,
  DoorOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Navbar from "@/components/Navbar";
import { fetchDashboardStats, fetchCounts, SalesResponse } from "@/api/dashboard";
import { toast } from "sonner";

const COLORS = ["#7A3BFF", "#FF6B9D", "#00D4FF", "#FFD93D", "#6BCB77"];

const Dashboard = () => {
  const [period, setPeriod] = useState<"day" | "month" | "year" | "all">("month");
  const [salesData, setSalesData] = useState<SalesResponse | null>(null);
  const [counts, setCounts] = useState({
    movies: 0,
    rooms: 0,
    showtimes: 0,
    upcomingShowtimes: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, countsData] = await Promise.all([
        fetchDashboardStats(period),
        fetchCounts(),
      ]);
      setSalesData(statsData);
      setCounts(countsData);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  // Calcular boletos y productos vendidos
  const calculateItemStats = () => {
    if (!salesData) return { tickets: 0, products: 0 };

    let tickets = 0;
    let products = 0;

    salesData.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.item_name.toLowerCase().includes("boleto") ||
            item.item_name.toLowerCase().includes("ticket") ||
            item.item_name.toLowerCase().includes("asiento")) {
          tickets += item.quantity;
        } else {
          products += item.quantity;
        }
      });
    });

    return { tickets, products };
  };

  const itemStats = calculateItemStats();

  // Datos para gráfico de pie (distribución de ventas)
  const pieData = [
    { name: "Boletos", value: itemStats.tickets },
    { name: "Productos", value: itemStats.products },
  ].filter((d) => d.value > 0);

  const statCards = [
    {
      title: "Ingresos Totales",
      value: `$${(salesData?.stats.totalIngresos || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Ventas",
      value: salesData?.stats.totalVentas.toString() || "0",
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Boletos Vendidos",
      value: itemStats.tickets.toString(),
      icon: Ticket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Productos Vendidos",
      value: itemStats.products.toString(),
      icon: ShoppingBag,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  const quickStats = [
    {
      title: "Películas",
      value: counts.movies,
      icon: Film,
      color: "text-purple-500",
    },
    {
      title: "Salas",
      value: counts.rooms,
      icon: DoorOpen,
      color: "text-orange-500",
    },
    {
      title: "Funciones",
      value: counts.showtimes,
      icon: Calendar,
      color: "text-cyan-500",
    },
    {
      title: "Próximas",
      value: counts.upcomingShowtimes,
      icon: Clock,
      color: "text-pink-500",
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
      title: "Funciones",
      description: "Horarios y salas",
      icon: Calendar,
      path: "/admin/showtimes",
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

  const formatChartDate = (dateStr: string) => {
    if (dateStr.includes("-") && dateStr.length === 10) {
      // YYYY-MM-DD
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    }
    // YYYY-MM
    const [year, month] = dateStr.split("-");
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return months[parseInt(month) - 1] + " " + year.slice(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-gradient-cinema">
              Panel de Administración
            </h1>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={(v: typeof period) => setPeriod(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoy</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                  <SelectItem value="year">Este Año</SelectItem>
                  <SelectItem value="all">Todo</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadData} variant="outline" size="icon">
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                  <Card key={index} className="card-cinema">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Ventas por Día/Mes */}
                <Card className="card-cinema lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Tendencia de Ventas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {salesData?.chartData.byDay && salesData.chartData.byDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData.chartData.byDay.slice(-14)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatChartDate}
                            stroke="#888"
                            fontSize={12}
                          />
                          <YAxis stroke="#888" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a2e",
                              border: "1px solid #7A3BFF",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]}
                            labelFormatter={(label) => formatChartDate(label)}
                          />
                          <Bar dataKey="total" fill="#7A3BFF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No hay datos de ventas para mostrar
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Distribución */}
                <Card className="card-cinema">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-secondary" />
                      Distribución
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {pieData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a2e",
                              border: "1px solid #7A3BFF",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Sin datos
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {quickStats.map((stat, index) => (
                  <Card key={index} className="card-cinema">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        <div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Sales */}
              {salesData?.sales && salesData.sales.length > 0 && (
                <Card className="card-cinema mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Ventas Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {salesData.sales.slice(0, 5).map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold">{sale.folio}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sale.created_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              ${Number(sale.total).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {sale.items.length} items
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Management Cards */}
              <h2 className="text-2xl font-bold mb-4">Gestión Rápida</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {managementCards.map((card, index) => (
                  <Card
                    key={index}
                    className="card-cinema group cursor-pointer"
                    onClick={() => navigate(card.path)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <card.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{card.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
