// src/api/rooms.ts
import { Room } from "@/types";

const API_BASE = "https://cinexnova-starlight.wuaze.com";

type RoomApiRow = {
  id: number | string;
  name: string;
  capacity: number | string;
  type: string;
};

export async function fetchRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE}/rooms.php`);

  if (!res.ok) {
    console.error("Error HTTP fetchRooms:", res.status);
    throw new Error("Error al obtener salas");
  }

  const data: RoomApiRow[] = await res.json();
  return data.map((r) => ({
    id: Number(r.id),
    name: r.name,
    capacity: Number(r.capacity),
    type: r.type as Room["type"],
  }));
}

export async function fetchRoomById(id: number): Promise<Room | null> {
  const res = await fetch(`${API_BASE}/rooms.php?id=${id}`);

  if (!res.ok) {
    console.error("Error HTTP fetchRoomById:", res.status);
    throw new Error("Error al obtener sala");
  }

  const data: RoomApiRow[] = await res.json();
  const r = data[0];
  if (!r) return null;

  return {
    id: Number(r.id),
    name: r.name,
    capacity: Number(r.capacity),
    type: r.type as Room["type"],
  };
}
