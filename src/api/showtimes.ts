// src/api/showtimes.ts
import { Showtime } from "@/types";

const API_BASE = "https://cinexnova-starlight.wuaze.com";

export type ShowtimeApiRow = {
  id: number | string;
  movie_id: number | string;
  room_id: number | string;
  show_date: string;
  show_time: string;
  price: number | string;
  room_name?: string;
  room_type?: string;
  movie_title?: string;
};

// Tipo para crear/actualizar
export type ShowtimeInput = {
  movie_id: number;
  room_id: number;
  show_date: string;
  show_time: string;
  price: number;
};

// ========== LISTAR TODAS LAS FUNCIONES (Admin) ==========
export async function fetchAllShowtimes(): Promise<ShowtimeApiRow[]> {
  const res = await fetch(`${API_BASE}/showtimes.php`);

  if (!res.ok) {
    console.error("Error HTTP fetchAllShowtimes:", res.status);
    throw new Error("Error al obtener funciones");
  }

  return res.json();
}

// ========== FUNCIONES DE UNA PELÍCULA (Cliente) ==========
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
    date: s.show_date,
    time: s.show_time,
    price: Number(s.price),
  }));
}

// ========== DETALLE DE UNA FUNCIÓN (SeatMap) ==========
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

// ========== CREAR FUNCIÓN (Admin) ==========
export async function createShowtime(data: ShowtimeInput): Promise<{ success: boolean; id: number }> {
  const res = await fetch(`${API_BASE}/showtimes.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error HTTP createShowtime:", res.status, txt);
    throw new Error("Error al crear función");
  }

  return res.json();
}

// ========== ACTUALIZAR FUNCIÓN (Admin) ==========
export async function updateShowtime(id: number, data: ShowtimeInput): Promise<void> {
  const res = await fetch(`${API_BASE}/showtimes.php?action=update&id=${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error HTTP updateShowtime:", res.status, txt);
    throw new Error("Error al actualizar función");
  }
}

// ========== ELIMINAR FUNCIÓN (Admin) ==========
export async function deleteShowtime(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/showtimes.php?action=delete&id=${id}`, {
    method: "POST",
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error HTTP deleteShowtime:", res.status, txt);
    throw new Error("Error al eliminar función");
  }
}
