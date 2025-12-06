import { useState, useEffect } from "react";
import { Product, Category } from "@/types";
import { getProducts, getCategories } from "@/utils/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const Reports = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setProducts(getProducts());
    setCategories(getCategories());
  }, []);

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sin categoría";
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // ============================
    //  ICONO TIRA DE PELÍCULA
    //  estilo logo STARLIGHT
    // ============================
    // === ICONO DE TIRA DE PELÍCULA — ESCALADO PERFECTO ===

const scale = 0.45;

// 🔹 Posición del icono
const iconX = 25;
const iconY = 20;

// 🔹 Tamaños base del icono (sin escala)
const baseSize = 26;
const baseHoleSize = 3;
const baseGap = 2;

// 🔹 Aplicar escala
const size = baseSize * scale;
const holeSize = baseHoleSize * scale;
const gap = baseGap * scale;

// === CUERPO REAL DEL ICONO ===

// Cuadro morado
doc.setFillColor(122, 59, 255);
(doc as any).roundedRect(iconX, iconY, size, size, 3 * scale, 3 * scale, "F");

// Banda blanca central
doc.setFillColor(255, 255, 255);
const bandWidth = size * 0.35;
const bandX = iconX + size / 2 - bandWidth / 2;
doc.rect(bandX, iconY + 2 * scale, bandWidth, size - 4 * scale, "F");

// Agujeros laterales
let holeY = iconY + 2 * scale;
for (let i = 0; i < 5; i++) {
  // izquierda
  doc.rect(iconX + 2 * scale, holeY, holeSize, holeSize, "F");

  // derecha
  doc.rect(iconX + size - 2 * scale - holeSize, holeY, holeSize, holeSize, "F");

  holeY += holeSize + gap;
}

// === TEXTO STARLIGHT ===
doc.setFontSize(18);
doc.setTextColor(90, 48, 255);
doc.text("STARLIGHT", iconX + size + 6, iconY + size - 1);


    // ============================
    //  TÍTULO + FECHA
    // ============================
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Reporte de Productos", 20, 70);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generado: ${new Date().toLocaleDateString("es-ES")}`,
      20,
      78
    );

    // ============================
    //  TABLA DE PRODUCTOS
    // ============================
    const tableData = products.map((p) => [
      p.sku,
      p.name,
      getCategoryName(p.categoryId),
      `$${p.price.toFixed(2)}`,
      p.stock.toString(),
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["SKU", "Nombre", "Categoría", "Precio", "Stock"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [122, 59, 255], // morado STARLIGHT
        textColor: 255,
        fontSize: 11,
        halign: "center",
      },
      styles: {
        fontSize: 9,
      },
    });

    doc.save(`productos_${Date.now()}.pdf`);
    toast.success("PDF generado exitosamente");
  };

  const generateExcel = () => {
    const data = products.map((p) => ({
      SKU: p.sku,
      Nombre: p.name,
      Categoría: getCategoryName(p.categoryId),
      Precio: p.price,
      Stock: p.stock,
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Ancho de columnas
    ws["!cols"] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    XLSX.writeFile(wb, `productos_${Date.now()}.xlsx`);
    toast.success("Excel generado exitosamente");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-gradient-cinema">
            Reportes
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="card-cinema group cursor-pointer"
              onClick={generatePDF}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-destructive/10 p-4 rounded-lg group-hover:bg-destructive/20 transition-colors">
                    <FileText className="w-8 h-8 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Reporte PDF</CardTitle>
                    <p className="text-muted-foreground">
                      Generar reporte en PDF
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporta todos los productos con la información completa en
                  formato PDF.
                </p>
                <Button className="w-full btn-cinema">
                  <FileText className="w-4 h-4 mr-2" />
                  Generar PDF
                </Button>
              </CardContent>
            </Card>

            <Card
              className="card-cinema group cursor-pointer"
              onClick={generateExcel}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-green-500/10 p-4 rounded-lg group-hover:bg-green-500/20 transition-colors">
                    <FileSpreadsheet className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Reporte Excel</CardTitle>
                    <p className="text-muted-foreground">
                      Generar reporte en Excel
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporta todos los productos en formato Excel para análisis y
                  manipulación avanzada.
                </p>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Generar Excel
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="card-cinema mt-6">
            <CardHeader>
              <CardTitle>Resumen de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {products.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Productos
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">
                    {categories.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Categorías</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">
                    {products.reduce((sum, p) => sum + p.stock, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Stock Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">
                    $
                    {products
                      .reduce((sum, p) => sum + p.price * p.stock, 0)
                      .toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valor Inventario
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Reports;
