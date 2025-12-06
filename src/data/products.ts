import { Product, Category } from "@/types";

export const categories: Category[] = [
  { id: 1, name: "Combos" },
  { id: 2, name: "Snacks" },
  { id: 3, name: "Bebidas" },
  { id: 4, name: "Palomitas" },
  { id: 5, name: "Dulces" },
];

// Nombres de productos
const comboNames = [
  "Mega Combo",
  "Combo Familiar",
  "Combo Pareja",
  "Combo Individual",
  "Combo XL",
];

const snackNames = [
  "Nachos",
  "Hot Dog",
  "Pizza",
  "Pretzel",
  "Alitas",
  "Nuggets",
  "Papas",
  "Dedos de Queso",
];

const drinkNames = [
  "Coca-Cola",
  "Pepsi",
  "Sprite",
  "Fanta",
  "Dr Pepper",
  "Agua",
  "Jugo",
  "Té Helado",
];

const popcornNames = [
  "Palomitas Chicas",
  "Palomitas Medianas",
  "Palomitas Grandes",
  "Palomitas Jumbo",
  "Palomitas Caramelo",
];

const candyNames = [
  "M&Ms",
  "Skittles",
  "Snickers",
  "Kit Kat",
  "Twix",
  "Reese's",
  "Milky Way",
  "Gummy Bears",
];

// Imágenes (rutas dentro de /public)
const comboImages = [
  "/dulceria/combo1.jpg",
  "/dulceria/combo2.jpg",
  "/dulceria/combo3.jpg",
  "/dulceria/combo4.jpg",
  "/dulceria/combo5.jpg",
];

const snackImages = [
  "/dulceria/nachos.jpg",
  "/dulceria/hot-dog.jpg",
  "/dulceria/pizza.jpg",
  "/dulceria/pretzel.jpg",
  "/dulceria/alitas.jpg",
  "/dulceria/nuggets.jpg",
  "/dulceria/papas.jpg",
  "/dulceria/dedos-queso.jpg",
];

// Puedes crear estos tres archivos después
const drinkImage = "/dulceria/bebida.jpg";
const popcornImage = "/dulceria/palomitas.jpg";
const candyImage = "/dulceria/dulces.jpg";

export const generateProducts = (): Product[] => {
  const products: Product[] = [];
  let id = 1;

  // Combos (30 productos)
  for (let i = 0; i < 30; i++) {
    products.push({
      id: id++,
      sku: `CMB${String(i + 1).padStart(3, "0")}`,
      name: `${comboNames[i % comboNames.length]} ${
        Math.floor(i / comboNames.length) + 1
      }`,
      price: 100 + i * 10,
      stock: 30 + (i % 20),
      categoryId: 1,
      image: comboImages[i % comboImages.length],
    });
  }

  // Snacks (50 productos)
  for (let i = 0; i < 50; i++) {
    products.push({
      id: id++,
      sku: `SNK${String(i + 1).padStart(3, "0")}`,
      name: `${snackNames[i % snackNames.length]} ${
        i > 7 ? `Variedad ${Math.floor(i / snackNames.length) + 1}` : ""
      }`.trim(),
      price: 40 + i * 5,
      stock: 20 + (i % 30),
      categoryId: 2,
      // Nachos, Hot Dog, Pizza, etc. se repiten cíclicamente
      image: snackImages[i % snackImages.length],
    });
  }

  // Bebidas (50 productos)
  for (let i = 0; i < 50; i++) {
    const sizes = ["Chica", "Mediana", "Grande", "Jumbo"];
    products.push({
      id: id++,
      sku: `BEB${String(i + 1).padStart(3, "0")}`,
      name: `${drinkNames[i % drinkNames.length]} ${
        sizes[i % sizes.length]
      }`,
      price: 25 + i * 3,
      stock: 40 + (i % 25),
      categoryId: 3,
      image: drinkImage,
    });
  }

  // Palomitas (30 productos)
  for (let i = 0; i < 30; i++) {
    products.push({
      id: id++,
      sku: `POP${String(i + 1).padStart(3, "0")}`,
      name: `${popcornNames[i % popcornNames.length]} ${
        i > 4 ? `Sabor ${Math.floor(i / popcornNames.length) + 1}` : ""
      }`.trim(),
      price: 50 + i * 8,
      stock: 50 + (i % 20),
      categoryId: 4,
      image: popcornImage,
    });
  }

  // Dulces (40 productos)
  for (let i = 0; i < 40; i++) {
    products.push({
      id: id++,
      sku: `DUL${String(i + 1).padStart(3, "0")}`,
      name: `${candyNames[i % candyNames.length]} ${
        i > 7 ? `Pack ${Math.floor(i / candyNames.length) + 1}` : ""
      }`.trim(),
      price: 20 + i * 4,
      stock: 35 + (i % 15),
      categoryId: 5,
      image: candyImage,
    });
  }

  return products;
};
