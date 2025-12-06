// src/api/seats.ts
import { Seat } from "@/types";

const API_BASE = "https://cinexnova-starlight.wuaze.com";

type SeatApiRow = {
  id: number | string;
  showtime_id: number | string;
  row_label: string;
  seat_number: number | string;
  status: string;
  updated_at?: string;
};

type SeatsResponse = {
  seats: SeatApiRow[];
  timestamp: string;
};

export interface SeatCheckResult {
  available: boolean;
  unavailable: string[];
}

export interface ReserveResult {
  ok: boolean;
  updated: number;
  timestamp: string;
}

export interface ReserveError {
  error: string;
  unavailable: string[];
}

export async function fetchSeats(showtimeId: number): Promise<Seat[]> {
  const res = await fetch(`${API_BASE}/seats.php?showtime_id=${showtimeId}`);

  if (!res.ok) {
    console.error("Error HTTP fetchSeats:", res.status);
    throw new Error("Error al obtener asientos");
  }

  const data = await res.json();

  // Soportar nuevo formato con timestamp o formato anterior
  const seatsArray: SeatApiRow[] = data.seats || data;

  return seatsArray.map((s) => ({
    row: s.row_label,
    number: Number(s.seat_number),
    status: s.status as Seat["status"],
  }));
}

/**
 * Verifica si los asientos seleccionados siguen disponibles
 */
export async function checkSeatsAvailability(
  showtimeId: number,
  seatIds: string[]
): Promise<SeatCheckResult> {
  const res = await fetch(`${API_BASE}/seats.php?action=check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      showtime_id: showtimeId,
      seats: seatIds,
    }),
  });

  if (!res.ok) {
    throw new Error("Error al verificar disponibilidad");
  }

  return res.json();
}

/**
 * Reserva o marca como vendidos asientos.
 * status:
 *  - "reserved"  -> naranja (apartado, no pagado)
 *  - "sold"      -> rojo (comprado)
 *
 * Lanza error con unavailable[] si algún asiento ya no está disponible
 */
export async function reserveSeats(
  showtimeId: number,
  seatIds: string[], // ["I5","I6", ...]
  status: "reserved" | "sold" = "reserved"
): Promise<ReserveResult> {
  const seats = seatIds.map((id) => {
    const row = id[0];
    const num = Number(id.slice(1));
    return { row, number: num };
  });

  const res = await fetch(`${API_BASE}/seats.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      showtime_id: showtimeId,
      seats,
      status,
    }),
  });

  const data = await res.json();

  // HTTP 409 = Conflicto (asientos ya tomados)
  if (res.status === 409) {
    const error = new Error(data.error || "Asientos no disponibles") as Error & { unavailable?: string[] };
    error.unavailable = data.unavailable || [];
    throw error;
  }

  if (!res.ok) {
    throw new Error(data.error || "Error al reservar asientos");
  }

  return data;
}
