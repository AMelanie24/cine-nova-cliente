import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Movie, Showtime, Room } from "@/types";

import { fetchMovies } from "@/api/movies";
import { fetchShowtimesByMovie } from "@/api/showtimes";
import { fetchRooms } from "@/api/rooms";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import Navbar from "@/components/Navbar";

const Showtimes = () => {
  const { id } = useParams(); // id de la PELÍCULA
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const load = async () => {
      const movieId = parseInt(id || "0");
      if (!movieId) return;

      try {
        const [moviesData, showtimesData, roomsData] = await Promise.all([
          fetchMovies(),
          fetchShowtimesByMovie(movieId),
          fetchRooms(),
        ]);

        setMovie(moviesData.find((m) => m.id === movieId) || null);
        setShowtimes(showtimesData);
        setRooms(roomsData);
      } catch (err) {
        console.error("Error al cargar funciones:", err);
      }
    };

    load();
  }, [id]);

  const getRoom = (roomId: number) =>
    rooms.find((r) => r.id === roomId) || null;

  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    if (!acc[showtime.date]) acc[showtime.date] = [];
    acc[showtime.date].push(showtime);
    return acc;
  }, {} as Record<string, Showtime[]>);

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12 px-4">
          <div className="container mx-auto">
            <p>Película no encontrada</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            <div className="space-y-4">
              <Card className="card-cinema overflow-hidden">
                <img
                  src={movie.image}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </Card>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-gradient-cinema">
                  {movie.title}
                </h1>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant="secondary" className="px-3 py-1">
                    {movie.rating}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {movie.genre}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    {movie.duration} min
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">
                  {movie.description}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Funciones disponibles</h2>

                {Object.entries(groupedShowtimes).map(([date, times]) => (
                  <Card key={date} className="card-cinema">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="text-xl font-semibold">
                          {new Date(date + "T00:00:00").toLocaleDateString(
                            "es-ES",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </h3>
                      </div>

                      <div className="grid gap-3">
                        {times.map((showtime) => {
                          const room = getRoom(showtime.roomId);
                          return (
                            <div
                              key={showtime.id}
                              className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-primary" />
                                  <span className="font-semibold text-lg">
                                    {showtime.time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {room?.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-secondary" />
                                  <span className="font-semibold text-secondary">
                                    ${showtime.price}
                                  </span>
                                </div>
                              </div>

                              {room?.type === "vip" && (
                                <Badge variant="secondary" className="mr-2">
                                  Solo VIP
                                </Badge>
                              )}

                              <Button
                                onClick={() =>
                                  navigate(`/seatmap/${showtime.id}`)
                                }
                                className="btn-cinema"
                              >
                                Elegir asiento
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Showtimes;
