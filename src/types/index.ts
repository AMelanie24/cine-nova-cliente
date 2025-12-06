export type UserRole = "admin" | "customer";

export interface User {
  token: string;
  role: UserRole;
  email: string;
  fullName: string;
}

export interface Movie {
  id: number;
  title: string;
  duration: number;
  rating: string;
  genre: string;
  image: string;
  description: string;
  format: "2D" | "3D";
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  type: "standard" | "vip";
}

export interface Showtime {
  id: number;
  movieId: number;
  roomId: number;
  date: string;
  time: string;
  price: number;
  isVipOnly?: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  categoryId: number;
  image: string;
}

export type SeatStatus = "available" | "reserved" | "sold" | "vip";

export interface Seat {
  row: string;
  number: number;
  status: SeatStatus;
}

export interface CartItem {
  type: "ticket" | "product";
  name: string;
  price: number;
  quantity?: number;
  showtimeId?: number;
  seat?: string;
  productId?: number;
}

export interface Sale {
  id: string;
  sellerEmail: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}
