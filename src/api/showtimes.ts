// src/api/showtimes.ts
import { Showtime } from "@/types";

const API_BASE = "https://cinexnova-starlight.wuaze.com";

type ShowtimeApiRow = {
  id: number | string;
  movie_id: number | string;
  room_id: number | string;
  show_date: string;
  show_time: string;
  price: number | string;
  room_name?: string;
  room_type?: string;
};

// 🔹 Todas las funciones de UNA película (pantalla Showtimes)
export async function fetchShowtimesByMovie(movieId: number): Promise<Showtime[]> {
  const res = await fetch(`${API_BASE}/showtimes.php?movie_id=${movieId}`);

  if (!res.ok) {
    console.error("Error HTTP fetchShowtimesByMovie:", res.status);
    throw new Error("Error al obtener funciones");
  }

  const data: ShowtimeApiRow[] = await res.json();

  return data.map((s) => ({
    id: Number(s.id),
    movieId: Number(s.movie_id),
    roomId: Number(s.room_id),
    date: s.show_date, // YYYY-MM-DD
    time: s.show_time, // HH:MM:SS
    price: Number(s.price),
  }));
}

// 🔹 Detalle de UNA función por su id (para SeatMap)
export async function fetchShowtimeById(id: number): Promise<Showtime | null> {
  const res = await fetch(`${API_BASE}/showtimes.php?id=${id}`);

  if (!res.ok) {
    console.error("Error HTTP fetchShowtimeById:", res.status);
    throw new Error("Error al obtener función");
  }

  const data: ShowtimeApiRow[] = await res.json();
  const s = data[0];

  if (!s) return null;

  return {
    id: Number(s.id),
    movieId: Number(s.movie_id),
    roomId: Number(s.room_id),
    date: s.show_date,
    time: s.show_time,
    price: Number(s.price),
  };
}
