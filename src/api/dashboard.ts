// src/api/dashboard.ts - API para estadísticas del dashboard

const API_BASE = "https://cinexnova-starlight.wuaze.com";

export interface DashboardStats {
  totalVentas: number;
  totalIngresos: number;
  totalImpuestos: number;
  promedioVenta: number;
}

export interface ChartDataPoint {
  date?: string;
  month?: string;
  count: number;
  total: number;
}

export interface SalesResponse {
  sales: Array<{
    id: number;
    folio: string;
    subtotal: number;
    tax: number;
    total: number;
    created_at: string;
    items: Array<{
      item_name: string;
      quantity: number;
      price: number;
    }>;
  }>;
  stats: DashboardStats;
  chartData: {
    byDay: ChartDataPoint[];
    byMonth: ChartDataPoint[];
  };
}

export async function fetchDashboardStats(
  period: "day" | "month" | "year" | "all" = "all",
  date?: string
): Promise<SalesResponse> {
  const params = new URLSearchParams({ period });
  if (date) params.append("date", date);

  const res = await fetch(`${API_BASE}/get_sales.php?${params}`);

  if (!res.ok) {
    throw new Error("Error al obtener estadísticas");
  }

  return res.json();
}

// Obtener conteos de películas, salas y funciones
export async function fetchCounts(): Promise<{
  movies: number;
  rooms: number;
  showtimes: number;
  upcomingShowtimes: number;
}> {
  const [moviesRes, roomsRes, showtimesRes] = await Promise.all([
    fetch(`${API_BASE}/movies.php`),
    fetch(`${API_BASE}/rooms.php`),
    fetch(`${API_BASE}/showtimes.php`),
  ]);

  const movies = await moviesRes.json();
  const rooms = await roomsRes.json();
  const showtimes = await showtimesRes.json();

  const today = new Date().toISOString().split("T")[0];
  const upcomingShowtimes = showtimes.filter(
    (s: { show_date: string }) => s.show_date >= today
  ).length;

  return {
    movies: movies.length,
    rooms: rooms.length,
    showtimes: showtimes.length,
    upcomingShowtimes,
  };
}
