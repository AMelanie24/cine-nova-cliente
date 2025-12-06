// src/pages/admin/Products.tsx
import { useState, useEffect } from "react";
import { Product, Category } from "@/types";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct as apiDeleteProduct,
  uploadProductImage,
} from "@/api/products";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Search,
  Plus,
  Image as ImageIcon,
} from "lucide-react";

const ProductsAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Cargar productos + categorías desde la BD
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
        console.error("Error cargando productos/categorías:", err);
        toast.error(
          "Error al cargar productos/categorías desde la base de datos"
        );
      }
    };

    load();
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Subir imagen al servidor y guardar URL en el producto
  const handleImageUpload = async (file: File) => {
    if (!editingProduct) return;

    try {
      setUploadingImage(true);
      const url = await uploadProductImage(file);
      setEditingProduct({
        ...editingProduct,
        image: url,
      });
      toast.success("Imagen subida correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.sku.trim()) {
      toast.error("El SKU es obligatorio");
      return;
    }
    if (!editingProduct.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (editingProduct.price <= 0) {
      toast.error("El precio debe ser mayor a 0");
      return;
    }
    if (editingProduct.stock < 0) {
      toast.error("El stock no puede ser negativo");
      return;
    }
    if (!editingProduct.categoryId) {
      toast.error("Selecciona una categoría");
      return;
    }

    try {
      if (isCreating) {
        const created = await createProduct(editingProduct);
        setProducts((prev) => [...prev, created]);
        toast.success("Producto creado");
      } else {
        await updateProduct(editingProduct);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
        );
        toast.success("Producto actualizado");
      }

      setIsOpen(false);
      setEditingProduct(null);
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el producto en la base de datos");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDeleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Producto eliminado");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar producto");
    }
  };

  const handleCreateNew = () => {
    setEditingProduct({
      id: 0,
      sku: "",
      name: "",
      price: 100,
      stock: 10,
      categoryId: categories[0]?.id ?? 1,
      image: "",
    });
    setIsCreating(true);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gradient-cinema">
              Administrar Productos
            </h1>

            <Button onClick={handleCreateNew} className="btn-cinema">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>

          {/* Buscador */}
          <Card className="card-cinema mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Grid productos */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="card-cinema group">
                <div className="aspect-square bg-muted/20 rounded-t-xl overflow-hidden flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold line-clamp-1">
                      {product.name}
                    </h3>
                    <Badge variant="secondary">{product.sku}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
                    <Badge
                      variant={product.stock > 20 ? "secondary" : "destructive"}
                    >
                      Stock: {product.stock}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {categories.find((c) => c.id === product.categoryId)?.name ??
                      "Sin categoría"}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingProduct(product);
                        setIsCreating(false);
                        setIsOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Modal Crear / Editar */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isCreating ? "Crear Producto" : "Editar Producto"}
                </DialogTitle>
                <DialogDescription>
                  {isCreating
                    ? "Ingresa los datos del nuevo producto de dulcería."
                    : "Modifica los datos del producto seleccionado."}
                </DialogDescription>
              </DialogHeader>

              {editingProduct && (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <Label>SKU *</Label>
                    <Input
                      value={editingProduct.sku}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          sku: e.target.value,
                        })
                      }
                      disabled={!isCreating}
                      required
                    />
                  </div>

                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Precio * (debe ser mayor a 0)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={editingProduct.price}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            price: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Stock * (no puede ser negativo)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={editingProduct.stock}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            stock: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Categoría *</Label>
                    <Select
                      value={editingProduct.categoryId.toString()}
                      onValueChange={(v) =>
                        setEditingProduct({
                          ...editingProduct,
                          categoryId: parseInt(v),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Imagen */}
                  <div className="space-y-2">
                    <Label>Imagen del producto</Label>
                    <Input
                      type="text"
                      placeholder="URL de imagen (opcional)"
                      value={editingProduct.image || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          image: e.target.value,
                        })
                      }
                    />

                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      La imagen se sube al servidor y se guarda la URL en la
                      base de datos.
                    </p>

                    {editingProduct.image && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Vista previa:
                        </p>
                        <img
                          src={editingProduct.image}
                          alt={editingProduct.name}
                          className="w-24 h-24 object-cover rounded-md border"
                        />
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full btn-cinema">
                    {isCreating ? "Crear Producto" : "Guardar Cambios"}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default ProductsAdmin;
