import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Calendar, Clock, Film, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

import {
  fetchAllShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  ShowtimeApiRow,
  ShowtimeInput,
} from "@/api/showtimes";
import { fetchMovies } from "@/api/movies";
import { fetchRooms } from "@/api/rooms";
import { Movie, Room } from "@/types";

const ShowtimesAdmin = () => {
  const [showtimes, setShowtimes] = useState<ShowtimeApiRow[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<ShowtimeInput>({
    movie_id: 0,
    room_id: 0,
    show_date: "",
    show_time: "",
    price: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [showtimesData, moviesData, roomsData] = await Promise.all([
        fetchAllShowtimes(),
        fetchMovies(),
        fetchRooms(),
      ]);
      setShowtimes(showtimesData);
      setMovies(moviesData);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      movie_id: movies[0]?.id || 0,
      room_id: rooms[0]?.id || 0,
      show_date: new Date().toISOString().split("T")[0],
      show_time: "14:00",
      price: 90,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (showtime: ShowtimeApiRow) => {
    setEditingId(Number(showtime.id));
    setFormData({
      movie_id: Number(showtime.movie_id),
      room_id: Number(showtime.room_id),
      show_date: showtime.show_date,
      show_time: showtime.show_time.substring(0, 5), // HH:MM
      price: Number(showtime.price),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.movie_id || !formData.room_id || !formData.show_date || !formData.show_time) {
      toast.error("Completa todos los campos");
      return;
    }

    try {
      if (editingId) {
        await updateShowtime(editingId, formData);
        toast.success("Función actualizada");
      } else {
        await createShowtime(formData);
        toast.success("Función creada");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving showtime:", error);
      toast.error("Error al guardar función");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta función?")) return;

    try {
      await deleteShowtime(id);
      toast.success("Función eliminada");
      loadData();
    } catch (error) {
      console.error("Error deleting showtime:", error);
      toast.error("Error al eliminar función");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // HH:MM
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-gradient-cinema">
              Gestión de Funciones
            </h1>
            <Button onClick={openCreateModal} className="btn-cinema gap-2">
              <Plus className="w-4 h-4" />
              Nueva Función
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="card-cinema">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{showtimes.length}</p>
                    <p className="text-sm text-muted-foreground">Funciones</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-cinema">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Film className="w-8 h-8 text-secondary" />
                  <div>
                    <p className="text-2xl font-bold">{movies.length}</p>
                    <p className="text-sm text-muted-foreground">Películas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-cinema">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DoorOpen className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{rooms.length}</p>
                    <p className="text-sm text-muted-foreground">Salas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-cinema">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {showtimes.filter((s) => s.show_date >= new Date().toISOString().split("T")[0]).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Próximas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="card-cinema">
            <CardHeader>
              <CardTitle>Lista de Funciones</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Cargando...</p>
              ) : showtimes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No hay funciones registradas
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Película</TableHead>
                        <TableHead>Sala</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {showtimes.map((showtime) => (
                        <TableRow key={showtime.id}>
                          <TableCell className="font-medium">
                            {showtime.movie_title || `Película #${showtime.movie_id}`}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              showtime.room_type === "vip"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-blue-500/20 text-blue-500"
                            }`}>
                              {showtime.room_name}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(showtime.show_date)}</TableCell>
                          <TableCell>{formatTime(showtime.show_time)}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            ${Number(showtime.price).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditModal(showtime)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(Number(showtime.id))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal Crear/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Función" : "Nueva Función"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Película */}
            <div className="space-y-2">
              <Label>Película</Label>
              <Select
                value={String(formData.movie_id)}
                onValueChange={(v) => setFormData({ ...formData, movie_id: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona película" />
                </SelectTrigger>
                <SelectContent>
                  {movies.map((movie) => (
                    <SelectItem key={movie.id} value={String(movie.id)}>
                      {movie.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sala */}
            <div className="space-y-2">
              <Label>Sala</Label>
              <Select
                value={String(formData.room_id)}
                onValueChange={(v) => setFormData({ ...formData, room_id: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona sala" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={String(room.id)}>
                      {room.name} ({room.type === "vip" ? "VIP" : "Standard"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formData.show_date}
                onChange={(e) => setFormData({ ...formData, show_date: e.target.value })}
              />
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input
                type="time"
                value={formData.show_time}
                onChange={(e) => setFormData({ ...formData, show_time: e.target.value })}
              />
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label>Precio ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="btn-cinema">
              {editingId ? "Guardar Cambios" : "Crear Función"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShowtimesAdmin;
