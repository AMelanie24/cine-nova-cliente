// src/pages/SeatMap.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Showtime, Seat, Movie, Room } from "@/types";

import { fetchShowtimeById } from "@/api/showtimes";
import { fetchMovies } from "@/api/movies";
import { fetchRoomById } from "@/api/rooms";
import { fetchSeats, reserveSeats } from "@/api/seats";
import { getCart, saveCart } from "@/utils/storage";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { AlertCircle, Star, RefreshCw, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VIP_ROWS = ["I", "J"];
const POLLING_INTERVAL = 5000; // 5 segundos

const SeatMap = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar asientos (usado para polling)
  const loadSeats = useCallback(async (showtimeId: number, silent = false) => {
    try {
      const seatsRaw = await fetchSeats(showtimeId);

      // Verificar si algún asiento seleccionado ya no está disponible
      const newUnavailable = selectedSeats.filter((seatId) => {
        const seat = seatsRaw.find(
          (s) => `${s.row}${s.number}` === seatId
        );
        return seat && seat.status !== "available";
      });

      if (newUnavailable.length > 0 && !silent) {
        toast.warning(
          `Los asientos ${newUnavailable.join(", ")} ya fueron tomados por otro usuario`,
          { duration: 5000 }
        );
        // Remover asientos no disponibles de la selección
        setSelectedSeats((prev) =>
          prev.filter((s) => !newUnavailable.includes(s))
        );
      }

      setSeats(seatsRaw);
      setLastUpdate(new Date());
      setIsOnline(true);
    } catch (err) {
      console.error("Error al actualizar asientos:", err);
      setIsOnline(false);
    }
  }, [selectedSeats]);

  // Carga inicial
  useEffect(() => {
    const load = async () => {
      const showtimeId = parseInt(id || "0");
      if (!showtimeId) return;

      try {
        const st = await fetchShowtimeById(showtimeId);
        if (!st) return;

        setShowtime(st);

        const movies = await fetchMovies();
        setMovie(movies.find((m) => m.id === st.movieId) || null);

        const roomData = await fetchRoomById(st.roomId);
        setRoom(roomData);

        await loadSeats(showtimeId, true);
      } catch (err) {
        console.error("Error al cargar SeatMap:", err);
      }
    };

    load();
  }, [id]);

  // Polling para actualización en tiempo real
  useEffect(() => {
    const showtimeId = parseInt(id || "0");
    if (!showtimeId) return;

    // Iniciar polling
    pollingRef.current = setInterval(() => {
      loadSeats(showtimeId);
    }, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [id, loadSeats]);

  const toggleSeat = (row: string, number: number) => {
    const seat = seats.find((s) => s.row === row && s.number === number);
    if (!seat) return;

    // No permitir seleccionar reservados o vendidos
    if (seat.status === "sold" || seat.status === "reserved") {
      toast.error("Este asiento ya no está disponible");
      return;
    }

    // En sala VIP solo filas I y J
    if (room && room.type.toLowerCase() === "vip" && !VIP_ROWS.includes(row)) {
      toast.error("Solo puedes seleccionar asientos VIP (filas I y J).");
      return;
    }

    const seatId = `${row}${number}`;
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : [...prev, seatId]
    );
  };

  const handleRefresh = async () => {
    const showtimeId = parseInt(id || "0");
    if (showtimeId) {
      toast.info("Actualizando disponibilidad...");
      await loadSeats(showtimeId);
      toast.success("Asientos actualizados");
    }
  };

  const handleConfirm = async () => {
    if (!showtime || !movie || !room) return;

    if (selectedSeats.length === 0) {
      toast.error("Selecciona al menos un asiento");
      return;
    }

    setIsSubmitting(true);

    try {
      // Intentar reservar - el backend validará disponibilidad
      await reserveSeats(showtime.id, selectedSeats, "sold");

      // Actualizar estado local a "sold"
      const updatedSeats = seats.map((s) => {
        const seatId = `${s.row}${s.number}`;
        if (selectedSeats.includes(seatId)) {
          return { ...s, status: "sold" as const };
        }
        return s;
      });

      setSeats(updatedSeats);

      // Agregar al carrito
      const cart = getCart();

      selectedSeats.forEach((seatId) => {
        cart.push({
          type: "ticket",
          name: `${movie!.title} - ${room!.name} - Asiento ${seatId}`,
          price: showtime!.price,
          quantity: 1,
          showtimeId: showtime!.id,
          seat_row: seatId[0],
          seat_number: parseInt(seatId.slice(1)),
          subtotal: showtime!.price,
        });
      });

      saveCart(cart);
      setSelectedSeats([]);

      toast.success("¡Asientos reservados exitosamente!");
      navigate("/products");
    } catch (err: any) {
      console.error(err);

      // Manejar conflicto de asientos
      if (err.unavailable && err.unavailable.length > 0) {
        toast.error(
          `Los asientos ${err.unavailable.join(", ")} ya fueron tomados. Selecciona otros.`,
          { duration: 5000 }
        );

        // Remover asientos no disponibles y recargar
        setSelectedSeats((prev) =>
          prev.filter((s) => !err.unavailable.includes(s))
        );

        // Recargar asientos
        const showtimeId = parseInt(id || "0");
        if (showtimeId) {
          await loadSeats(showtimeId, true);
        }
      } else {
        toast.error("Error al confirmar tus asientos. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-40 px-4 animate-fade-in">
        <div className="container mx-auto max-w-6xl">
          {movie && showtime && room && (
            <>
              {/* Encabezado */}
              <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {movie.title}
                </h1>

                <p className="text-muted-foreground text-lg">
                  {room.name} • {showtime.date} {showtime.time} • ${" "}
                  {showtime.price}
                </p>

                {/* Indicador de conexión */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Wifi className={`w-4 h-4 ${isOnline ? "text-green-500" : "text-red-500"}`} />
                  <span className={isOnline ? "text-green-500" : "text-red-500"}>
                    {isOnline ? "En tiempo real" : "Sin conexión"}
                  </span>
                  {lastUpdate && (
                    <span className="text-muted-foreground">
                      • Actualizado: {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="ml-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Distinción de sala */}
                {room.type.toLowerCase() === "vip" ? (
                  <div className="flex flex-col items-center gap-2">
                    <Badge className="px-4 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold flex items-center gap-1 shadow-md">
                      <Star className="w-4 h-4" /> Sala VIP
                    </Badge>

                    <Alert className="max-w-2xl border-yellow-400 bg-yellow-100/20 backdrop-blur-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-foreground text-left text-sm md:text-base">
                        <p className="font-semibold mb-1">
                          Bienvenido a la experiencia VIP
                        </p>
                        <p className="mb-2">
                          Las filas <strong>I</strong> y <strong>J</strong> son
                          exclusivas de esta sala. Aquí disfrutarás de:
                        </p>
                        <ul className="list-disc list-inside text-xs md:text-sm text-muted-foreground space-y-1">
                          <li>Butacas más amplias y cómodas.</li>
                          <li>Mejor visibilidad hacia la pantalla.</li>
                          <li>Ambiente más silencioso y privado.</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Badge className="px-4 py-1 rounded-full bg-slate-800 text-white shadow-sm">
                    Sala tradicional
                  </Badge>
                )}
              </div>

              {/* Tarjeta con mapa */}
              <Card className="bg-card/80 backdrop-blur-sm border-border mb-6">
                <CardContent className="p-6 md:p-8">
                  {/* Leyenda */}
                  <div className="mb-8 overflow-x-auto pb-2">
                    <div className="flex justify-center gap-3 md:gap-4 min-w-max px-2">
                      <div
                        className="chip bg-transparent text-foreground border-border"
                        style={{ borderColor: "hsl(var(--seat-available))" }}
                      >
                        <div className="seat seat-available w-6 h-6 mr-2" />
                        <span className="text-xs md:text-sm">Disponible</span>
                      </div>

                      <div
                        className="chip bg-transparent text-foreground border-border"
                        style={{ borderColor: "hsl(var(--seat-selected))" }}
                      >
                        <div className="seat seat-selected w-6 h-6 mr-2" />
                        <span className="text-xs md:text-sm">Seleccionado</span>
                      </div>

                      <div
                        className="chip bg-transparent text-foreground border-border"
                        style={{ borderColor: "hsl(var(--seat-vip))" }}
                      >
                        <div className="seat seat-vip w-6 h-6 mr-2" />
                        <span className="text-xs md:text-sm">VIP</span>
                      </div>

                      <div
                        className="chip bg-transparent text-foreground border-border"
                        style={{ borderColor: "hsl(var(--seat-reserved))" }}
                      >
                        <div className="seat seat-reserved w-6 h-6 mr-2" />
                        <span className="text-xs md:text-sm">Reservado</span>
                      </div>

                      <div
                        className="chip bg-transparent text-foreground border-border"
                        style={{ borderColor: "hsl(var(--seat-sold))" }}
                      >
                        <div className="seat seat-sold w-6 h-6 mr-2" />
                        <span className="text-xs md:text-sm">Vendido</span>
                      </div>
                    </div>
                  </div>

                  {/* Pantalla */}
                  <div className="mb-12 screen-glow">
                    <div
                      className="h-3 rounded-full mb-3"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, hsl(230 100% 60%), hsl(270 70% 65%), transparent)",
                        boxShadow:
                          "0 0 40px hsl(230 100% 60% / 0.6), 0 4px 20px rgba(0,0,0,0.5)",
                      }}
                    />
                    <p className="text-center text-sm font-semibold text-foreground uppercase tracking-widest">
                      PANTALLA
                    </p>
                  </div>

                  {/* Mapa de asientos */}
                  <div className="overflow-x-auto">
                    <div className="space-y-3 min-w-max px-4 pb-4 max-h-[60vh] overflow-y-auto">
                      {rows.map((row) => (
                        <div
                          key={row}
                          className="flex items-center justify-center gap-2 md:gap-3"
                        >
                          <span className="w-10 text-center font-bold text-lg md:text-xl text-foreground sticky left-0 bg-card/90 backdrop-blur-sm z-10 py-2 px-2 rounded-lg">
                            {row}
                          </span>

                          {[...Array(16)].map((_, i) => {
                            const number = i + 1;
                            const seat = seats.find(
                              (s) => s.row === row && s.number === number
                            );

                            if (!seat) return null;

                            const seatId = `${row}${number}`;
                            const isSelected = selectedSeats.includes(seatId);

                            // VIP visual SOLO si:
                            // - Sala es VIP
                            // - Fila es I o J
                            // - Asiento sigue disponible
                            const isVipVisual =
                              room?.type.toLowerCase() === "vip" &&
                              VIP_ROWS.includes(row) &&
                              seat.status === "available";

                            let seatClass = "seat animate-pop ";
                            if (isSelected) seatClass += "seat-selected";
                            else if (seat.status === "sold")
                              seatClass += "seat-sold";
                            else if (seat.status === "reserved")
                              seatClass += "seat-reserved";
                            else if (isVipVisual) seatClass += "seat-vip";
                            else seatClass += "seat-available";

                            return (
                              <div
                                key={number}
                                onClick={() => toggleSeat(row, number)}
                                className={`${seatClass} relative w-8 h-8 md:w-10 md:h-10 transition-all duration-200`}
                              >
                                <span className="seat-number text-xs md:text-sm">
                                  {number}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resumen inferior */}
              <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 shadow-2xl z-50">
                <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:flex-1">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                      Asientos seleccionados
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedSeats.length ? (
                        selectedSeats.map((s) => (
                          <Badge
                            key={s}
                            className="text-base md:text-lg px-4 py-1 bg-primary text-primary-foreground"
                          >
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Ningún asiento seleccionado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {(selectedSeats.length * (showtime?.price || 0)).toFixed(
                          2
                        )}{" "}
                        <span className="text-lg text-muted-foreground">
                          MXN
                        </span>
                      </p>
                    </div>
                    <Button
                      disabled={selectedSeats.length === 0 || isSubmitting}
                      onClick={handleConfirm}
                      className="btn-cinema text-lg px-8 py-4"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        "Continuar"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SeatMap;
