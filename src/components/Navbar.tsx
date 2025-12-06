import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Film, User, LogOut, ShoppingCart, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrador";
      case "customer": return "Cliente";
      default: return role;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <Film className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold text-gradient-cinema">STARLIGHT</span>
        </Link>

        <div className="flex items-center space-x-4">
          {user && user.role === "customer" && (
            <>
              <Button variant="outline" size="icon" onClick={() => navigate("/customer/cart")}>
                <ShoppingCart className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/customer/tickets")} className="hidden sm:flex gap-2">
                <Receipt className="w-4 h-4" />
                Mis Tickets
              </Button>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-primary font-semibold">{getRoleLabel(user.role)}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "customer" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/customer/tickets")}>
                      <Receipt className="w-4 h-4 mr-2" />
                      Mis Tickets
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate("/login")}>
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
