import { User, Movie, Room, Showtime, Product, Category, Sale, Seat } from "@/types";
import { moviesData } from "@/data/movies";
import { generateProducts, categories } from "@/data/products";

const STORAGE_KEYS = {
  USER: "cinema_user",
  MOVIES: "cinema_movies",
  ROOMS: "cinema_rooms",
  SHOWTIMES: "cinema_showtimes",
  PRODUCTS: "cinema_products",
  CATEGORIES: "cinema_categories",
  SALES: "cinema_sales",
  SEATS: "cinema_seats",
  CART: "cinema_cart",
};

// Initialize storage with mock data
export const initializeStorage = () => {
  // Always update movies to ensure format field exists
  const existingMovies = localStorage.getItem(STORAGE_KEYS.MOVIES);
  if (!existingMovies) {
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(moviesData));
  } else {
    // Update existing movies to ensure format field
    const movies = JSON.parse(existingMovies);
    const updatedMovies = movies.map((movie: Movie) => {
      const sourceMovie = moviesData.find(m => m.id === movie.id);
      return {
        ...movie,
        format: movie.format || sourceMovie?.format || "2D"
      };
    });
    localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(updatedMovies));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(generateProducts()));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    const rooms: Room[] = [
      { id: 1, name: "Sala 1", capacity: 160, type: "standard" },
      { id: 2, name: "Sala 2", capacity: 160, type: "standard" },
      { id: 3, name: "Sala VIP", capacity: 80, type: "vip" },
    ];
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SHOWTIMES)) {
    const showtimes: Showtime[] = [];
    const today = new Date();
    const dates = [0, 1, 2].map(d => {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      return date.toISOString().split('T')[0];
    });

    moviesData.forEach((movie, idx) => {
      dates.forEach(date => {
        ["14:00", "17:00", "20:00", "22:30"].forEach((time, timeIdx) => {
          showtimes.push({
            id: showtimes.length + 1,
            movieId: movie.id,
            roomId: (timeIdx % 4) + 1,
            date,
            time,
            price: 100 + (timeIdx * 20),
          });
        });
      });
    });

    localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SEATS)) {
    const seats: Record<number, Seat[]> = {};
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    
    // Generate seats for each showtime
    const showtimes = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOWTIMES) || "[]");
    const rooms = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS) || "[]");
    
    showtimes.forEach((showtime: Showtime) => {
      const room = rooms.find((r: Room) => r.id === showtime.roomId);
      seats[showtime.id] = [];
      
      rows.forEach(row => {
        for (let num = 1; num <= 16; num++) {
          let status: "available" | "reserved" | "sold" | "vip" = "available";
          
          // Randomly set some seats as reserved/sold (5%)
          const random = Math.random();
          if (random < 0.025) status = "reserved";
          else if (random < 0.05) status = "sold";
          // VIP seats in rows I and J for vip rooms
          else if (room?.type === "vip" && (row === 'I' || row === 'J')) status = "vip";
          
          seats[showtime.id].push({ row, number: num, status });
        }
      });
    });
    
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
  }
};

// User
export const saveUser = (user: User) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const clearUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Movies
export const getMovies = (): Movie[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MOVIES);
  return data ? JSON.parse(data) : [];
};

export const saveMovies = (movies: Movie[]) => {
  localStorage.setItem(STORAGE_KEYS.MOVIES, JSON.stringify(movies));
};

// Rooms
export const getRooms = (): Room[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ROOMS);
  return data ? JSON.parse(data) : [];
};

export const saveRooms = (rooms: Room[]) => {
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
};

// Showtimes
export const getShowtimes = (): Showtime[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SHOWTIMES);
  return data ? JSON.parse(data) : [];
};

export const saveShowtimes = (showtimes: Showtime[]) => {
  localStorage.setItem(STORAGE_KEYS.SHOWTIMES, JSON.stringify(showtimes));
};

// Products
export const getProducts = (): Product[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return data ? JSON.parse(data) : [];
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
};

// Categories
export const getCategories = (): Category[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  return data ? JSON.parse(data) : [];
};

// Seats
export const getSeats = (showtimeId: number): Seat[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SEATS);
  const allSeats: Record<number, Seat[]> = data ? JSON.parse(data) : {};
  return allSeats[showtimeId] || [];
};

export const saveSeats = (showtimeId: number, seats: Seat[]) => {
  const data = localStorage.getItem(STORAGE_KEYS.SEATS);
  const allSeats: Record<number, Seat[]> = data ? JSON.parse(data) : {};
  allSeats[showtimeId] = seats;
  localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(allSeats));
};

// Sales
export const getSales = (): Sale[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SALES);
  return data ? JSON.parse(data) : [];
};

export const saveSale = (sale: Sale) => {
  const sales = getSales();
  sales.push(sale);
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
};

// Cart
export const getCart = (): any[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CART);
  return data ? JSON.parse(data) : [];
};

export const saveCart = (cart: any[]) => {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
};

export const clearCart = () => {
  localStorage.removeItem(STORAGE_KEYS.CART);
};
