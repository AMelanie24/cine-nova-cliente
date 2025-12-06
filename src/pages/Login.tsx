// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Film } from "lucide-react";
import { UserRole } from "@/types";
import { toast } from "sonner";
import { loginRequest } from "@/services/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Si ya está autenticado, redirige según el rol guardado en AuthContext
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "customer":
        default:
          navigate("/");
          break;
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      // 1️⃣ Validar en la API (MySQL)
      // loginRequest devuelve algo como: { ok: true, email, role }
      const data = await loginRequest(email, password);

      // 2️⃣ Tomar el rol que viene del backend (admin | customer)
      const roleFromApi = (data.role || "customer") as UserRole;

      // 3️⃣ Guardar en el AuthContext (localStorage) con ese rol
      login(data.email ?? email, password, roleFromApi);

      // 4️⃣ Mensajes distintos según el rol
      if (roleFromApi === "admin") {
        toast.success(
          "🔐 Sesión de administrador iniciada. Ahora puedes gestionar la cartelera, dulcería y usuarios."
        );
      } else {
        toast.success(
          "🎬 ¡Bienvenido a STARLIGHT CINEMA! 🍿 Tu función está por comenzar… explora la cartelera y disfruta la experiencia. ⭐"
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md card-cinema">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Film className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl text-gradient-cinema">
            STARLIGHT CINEMA
          </CardTitle>
          <CardDescription>
            Ingresa tus credenciales para continuar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full btn-cinema">
              Iniciar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
