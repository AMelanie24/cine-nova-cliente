import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Movie } from "@/types";

import { fetchMovies } from "@/api/movies";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Star, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

const Home = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const navigate = useNavigate();

  // 🔹 Cargar películas desde la BASE DE DATOS
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMovies();
        setMovies(data);
        setFilteredMovies(data);
      } catch (err) {
        console.error("Error al cargar películas para la cartelera:", err);
      }
    };

    load();
  }, []);

  // 🔹 Aplicar filtros
  useEffect(() => {
    let filtered = movies;

    if (selectedGenre !== "all") {
      filtered = filtered.filter((m) => m.genre === selectedGenre);
    }

    if (selectedFormat !== "all") {
      filtered = filtered.filter((m) => m.format === selectedFormat);
    }

    setFilteredMovies(filtered);
  }, [selectedGenre, selectedFormat, movies]);

  // ⚠️ OJO: aquí toma los géneros EXACTOS de la BD.
  const genres = [...new Set(movies.map((m) => m.genre))];

  const genreColors: Record<string, string> = {
    "Acción": "hsl(var(--genre-action))",
    "Terror": "hsl(var(--genre-horror))",
    "Comedia": "hsl(var(--genre-comedy))",
    "Drama": "hsl(var(--genre-drama))",
    "Ciencia Ficción": "hsl(var(--genre-scifi))",
    "Romance": "hsl(var(--genre-romance))",
    "Anime": "hsl(var(--primary))",
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? "all" : genre);
  };

  const toggleFormat = (format: string) => {
    setSelectedFormat(selectedFormat === format ? "all" : format);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4 animate-fade-in">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient-cinema">
              Cartelera 2025
            </h1>
            <p className="text-xl text-muted-foreground">
              Las mejores películas en pantalla grande
            </p>
          </div>

          {/* Filtros con Chips */}
          <Card className="card-cinema mb-8">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Géneros */}
                <div>
                  <p className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Géneros
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => {
                      const isActive = selectedGenre === genre;
                      const color = genreColors[genre] || "hsl(var(--primary))";
                      return (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          className={`chip ${isActive ? "chip-active" : ""}`}
                          style={{
                            backgroundColor: isActive ? color : "transparent",
                            color: isActive ? "white" : color,
                            borderColor: color,
                          }}
                        >
                          {genre}
                          {isActive && <X className="w-4 h-4 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Formatos */}
                <div>
                  <p className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Formato
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["2D", "3D"].map((format) => {
                      const isActive = selectedFormat === format;
                      return (
                        <button
                          key={format}
                          onClick={() => toggleFormat(format)}
                          className={`chip ${isActive ? "chip-active" : ""}`}
                          style={{
                            backgroundColor: isActive
                              ? "hsl(var(--accent))"
                              : "transparent",
                            color: isActive
                              ? "white"
                              : "hsl(var(--accent))",
                            borderColor: "hsl(var(--accent))",
                          }}
                        >
                          {format}
                          {isActive && <X className="w-4 h-4 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Botón limpiar filtros */}
                {(selectedGenre !== "all" || selectedFormat !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedGenre("all");
                      setSelectedFormat("all");
                    }}
                    className="mt-2"
                  >
                    Limpiar todos los filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {filteredMovies.length === 0 ? (
            <Card className="card-cinema">
              <CardContent className="p-12 text-center">
                <p className="text-xl text-muted-foreground">
                  No se encontraron películas con los filtros seleccionados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredMovies.map((movie, index) => (
                <Card
                  key={movie.id}
                  className="card-cinema overflow-hidden group animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative overflow-hidden aspect-[2/3]">
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)",
                      }}
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Badge className="bg-primary px-3 py-1.5 text-sm font-bold shadow-lg">
                        {movie.rating}
                      </Badge>
                      <Badge className="bg-accent px-3 py-1.5 text-sm font-bold shadow-lg">
                        {movie.format}
                      </Badge>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">
                        {movie.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {movie.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-secondary fill-secondary" />
                          {movie.genre}
                        </span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                      {movie.description}
                    </p>

                    <Button
                      onClick={() => navigate(`/showtimes/${movie.id}`)}
                      className="w-full btn-cinema"
                    >
                      Ver funciones
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
