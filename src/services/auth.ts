// src/services/auth.ts
const API_URL = "https://cinexnova-starlight.wuaze.com/login.php";

export async function loginRequest(email: string, password: string) {
  try {
    const params = new URLSearchParams({ email, password });

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      method: "GET",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      throw new Error(
        (data && data.message) || "Error al conectar con el servidor"
      );
    }

    if (!data.ok) {
      throw new Error(data.message || "Credenciales incorrectas");
    }

    // data = { ok: true, email, role }
    return data;
  } catch (error: any) {
    throw new Error(error.message || "No se pudo conectar al servidor");
  }
}
