// src/api/categories.ts
import { Category } from "@/types";

// 🔹 URL BASE DE TU HOSTING
const API_BASE = "https://cinexnova-starlight.wuaze.com";

// 🔹 Obtener categorías
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories.php`);

  if (!res.ok) {
    console.error("Error HTTP fetchCategories:", res.status);
    throw new Error("Error al obtener categorías");
  }

  return res.json();
}

// 🔹 Crear categoría
export async function createCategory(name: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    console.error("Error HTTP createCategory:", res.status);
    throw new Error("Error al crear categoría");
  }

  return res.json();
}

// 🔹 Actualizar categoría
export async function updateCategory(id: number, name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories.php?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    console.error("Error HTTP updateCategory:", res.status);
    throw new Error("Error al actualizar categoría");
  }
}

// 🔹 Eliminar categoría
export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/categories.php?id=${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    console.error("Error HTTP deleteCategory:", res.status);
    throw new Error("Error al eliminar categoría");
  }
}
