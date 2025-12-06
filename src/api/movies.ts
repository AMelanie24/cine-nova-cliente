// src/api/movies.ts
import { Movie } from "@/types";

// API_BASE apunta al backend en InfinityFree
const API_BASE = "https://cinexnova-starlight.wuaze.com";

// Obtener TODAS las peliculas (cliente y admin usan esto)
export async function fetchMovies(): Promise<Movie[]> {
  const res = await fetch(`${API_BASE}/movies.php`);

  if (!res.ok) {
    console.error("Error HTTP fetchMovies:", res.status);
    throw new Error("Error al obtener peliculas");
  }

  const data = await res.json();
  console.log("Peliculas desde API:", data);

  return data.map((m: any) => ({
    id: Number(m.id),
    title: m.title,
    duration: Number(m.duration),
    rating: m.rating,
    genre: m.genre,
    image: m.image,
    description: m.description,
    format: (m.format ?? "2D") as "2D" | "3D",
  }));
}

// Crear pelicula (usado solo en admin)
export async function createMovie(movie: Movie): Promise<Movie> {
  const res = await fetch(`${API_BASE}/movies.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movie),
  });

  if (!res.ok) {
    console.error("Error HTTP createMovie:", res.status);
    const txt = await res.text();
    console.error("Respuesta servidor createMovie:", txt);
    throw new Error("Error al crear pelicula");
  }

  return res.json();
}

// Actualizar pelicula (admin)
export async function updateMovie(movie: Movie): Promise<void> {
  const res = await fetch(`${API_BASE}/movies.php?action=update&id=${movie.id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movie),
  });

  if (!res.ok) {
    console.error("Error HTTP updateMovie:", res.status);
    const txt = await res.text();
    console.error("Respuesta servidor updateMovie:", txt);
    throw new Error("Error al actualizar pelicula");
  }
}

// Eliminar pelicula (admin)
export async function deleteMovie(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/movies.php?action=delete&id=${id}`, {
    method: "POST",
  });

  if (!res.ok) {
    console.error("Error HTTP deleteMovie:", res.status);
    const txt = await res.text();
    console.error("Respuesta servidor deleteMovie:", txt);
    throw new Error("Error al eliminar pelicula");
  }
}

// Subir imagen y devolver URL ABSOLUTA (admin)
export async function uploadMovieImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_BASE}/upload_movie_image.php`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    console.error("Error HTTP uploadMovieImage:", res.status);
    const txt = await res.text();
    console.error("Respuesta servidor uploadMovieImage:", txt);
    throw new Error("Error al subir imagen");
  }

  const data = await res.json();
  return data.url as string;
}
