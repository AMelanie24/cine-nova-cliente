// src/api/seats.ts
import { Seat } from "@/types";

const API_BASE = "https://cinexnova-starlight.wuaze.com";

type SeatApiRow = {
  id: number | string;
  showtime_id: number | string;
  row_label: string;
  seat_number: number | string;
  status: string;
};

export async function fetchSeats(showtimeId: number): Promise<Seat[]> {
  const res = await fetch(`${API_BASE}/seats.php?showtime_id=${showtimeId}`);

  if (!res.ok) {
    console.error("Error HTTP fetchSeats:", res.status);
    throw new Error("Error al obtener asientos");
  }

  const data: SeatApiRow[] = await res.json();

  return data.map((s) => ({
    row: s.row_label,
    number: Number(s.seat_number),
    status: s.status as Seat["status"],
  }));
}

/**
 * Reserva o marca como vendidos asientos.
 * status:
 *  - "reserved"  -> naranja (apartado, no pagado)
 *  - "sold"      -> rojo (comprado)
 */
export async function reserveSeats(
  showtimeId: number,
  seatIds: string[], // ["I5","I6", ...]
  status: "reserved" | "sold" = "reserved"
): Promise<void> {
  const seats = seatIds.map((id) => {
    const row = id[0];
    const num = Number(id.slice(1)); // A10 -> row A, number 10
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

  if (!res.ok) {
    const txt = await res.text();
    console.error("Error HTTP reserveSeats:", res.status, txt);
    throw new Error("Error al reservar asientos");
  }
}
