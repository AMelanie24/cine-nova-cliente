// src/pages/Products.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Product, Category } from "@/types";
import { fetchProducts, fetchCategories } from "@/api/products";
import { getCart, saveCart } from "@/utils/storage";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, cats] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar productos/categorías");
      }
    };

    load();
  }, []);

  const addToCart = (product: Product) => {
    const cart = getCart();
    const existingItem = cart.find(
      (item) => item.type === "product" && item.productId === product.id
    );

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 0) + 1;
    } else {
      cart.push({
        type: "product",
        name: product.name,
        price: product.price,
        quantity: 1,
        productId: product.id,
      });
    }

    saveCart(cart);
    toast.success(`${product.name} agregado al carrito`);
  };

  const filteredProducts =
    selectedCategory === 0
      ? products
      : products.filter((p) => p.categoryId === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gradient-cinema">
              Dulcería STARLIGHT
            </h1>
            <p className="text-muted-foreground">
              Completa tu experiencia con nuestros deliciosos productos
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Button
              onClick={() => navigate("/customer/cart")}
              className="btn-cinema gap-2"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Ver carrito ({getCart().length})
            </Button>
          </div>

          <Tabs
            value={selectedCategory.toString()}
            onValueChange={(v) => setSelectedCategory(parseInt(v))}
          >
            <TabsList className="w-full justify-start flex-wrap h-auto mb-8">
              <TabsTrigger value="0">Todos</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id.toString()}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory.toString()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="card-cinema group">
                    <CardContent className="p-4">
                      {/* Imagen del producto */}
                      <div className="aspect-square bg-muted/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>

                      <h3 className="font-semibold mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {product.sku}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-primary">
                          ${product.price}
                        </span>
                        <Badge
                          variant={
                            product.stock > 20 ? "secondary" : "destructive"
                          }
                        >
                          Stock: {product.stock}
                        </Badge>
                      </div>

                      <Button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full btn-cinema"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Products;
