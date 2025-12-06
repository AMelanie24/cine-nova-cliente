import { useState, useEffect } from "react";
import { Product, Category } from "@/types";
import { getProducts, getCategories } from "@/utils/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, FileSpreadsheet, TrendingUp, Package, Calendar, DollarSign, ShoppingCart, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_BASE = "https://cinexnova-starlight.wuaze.com";

// Tipos para ventas
interface SaleItem {
  item_name: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: number;
  folio: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  sale_date: string;
  items: SaleItem[];
}

interface SalesData {
  sales: Sale[];
  stats: {
    totalVentas: number;
    totalIngresos: number;
    totalImpuestos: number;
    promedioVenta: number;
  };
  chartData: {
    byDay: { date: string; count: number; total: number }[];
    byMonth: { month: string; count: number; total: number }[];
  };
}

const COLORS = ["#7A3BFF", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];

const Reports = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [salesPeriod, setSalesPeriod] = useState<string>("month");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProducts(getProducts());
    setCategories(getCategories());
    fetchSalesData("month");
  }, []);

  const fetchSalesData = async (period: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/get_sales.php?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setSalesData(data);
      }
    } catch (err) {
      console.error("Error fetching sales:", err);
      toast.error("Error al cargar datos de ventas");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setSalesPeriod(value);
    fetchSalesData(value);
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || "Sin categoría";
  };

  // Datos para gráfica de categorías
  const categoryChartData = categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    return {
      name: cat.name,
      productos: catProducts.length,
      stock: catProducts.reduce((sum, p) => sum + p.stock, 0),
      valor: catProducts.reduce((sum, p) => sum + p.price * p.stock, 0),
    };
  });

  // ============================
  // PDF VENTAS
  // ============================
  const generateSalesPDF = () => {
    if (!salesData) return;

    const doc = new jsPDF();

    // Logo
    const scale = 0.45;
    const iconX = 25;
    const iconY = 20;
    const size = 26 * scale;
    const holeSize = 3 * scale;
    const gap = 2 * scale;

    doc.setFillColor(122, 59, 255);
    (doc as any).roundedRect(iconX, iconY, size, size, 3 * scale, 3 * scale, "F");

    doc.setFillColor(255, 255, 255);
    const bandWidth = size * 0.35;
    const bandX = iconX + size / 2 - bandWidth / 2;
    doc.rect(bandX, iconY + 2 * scale, bandWidth, size - 4 * scale, "F");

    let holeY = iconY + 2 * scale;
    for (let i = 0; i < 5; i++) {
      doc.rect(iconX + 2 * scale, holeY, holeSize, holeSize, "F");
      doc.rect(iconX + size - 2 * scale - holeSize, holeY, holeSize, holeSize, "F");
      holeY += holeSize + gap;
    }

    doc.setFontSize(18);
    doc.setTextColor(90, 48, 255);
    doc.text("STARLIGHT", iconX + size + 6, iconY + size - 1);

    // Título
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("REPORTE DE VENTAS", 20, 50);

    const periodLabel = salesPeriod === "day" ? "Diario" : salesPeriod === "month" ? "Mensual" : salesPeriod === "year" ? "Anual" : "General";
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${periodLabel} | Generado: ${new Date().toLocaleDateString("es-ES")}`, 20, 58);

    // Resumen
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumen:", 20, 70);

    doc.setFontSize(10);
    doc.text(`Total Ventas: ${salesData.stats.totalVentas}`, 25, 78);
    doc.text(`Ingresos Totales: $${salesData.stats.totalIngresos.toFixed(2)}`, 25, 85);
    doc.text(`Impuestos: $${salesData.stats.totalImpuestos.toFixed(2)}`, 25, 92);
    doc.text(`Promedio por Venta: $${salesData.stats.promedioVenta.toFixed(2)}`, 25, 99);

    // Tabla de ventas
    const tableData = salesData.sales.map((s) => [
      s.folio,
      new Date(s.created_at).toLocaleDateString("es-ES"),
      s.items.length.toString(),
      `$${Number(s.subtotal).toFixed(2)}`,
      `$${Number(s.tax).toFixed(2)}`,
      `$${Number(s.total).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 108,
      head: [["Folio", "Fecha", "Items", "Subtotal", "IVA", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [122, 59, 255],
        textColor: 255,
        fontSize: 10,
        halign: "center",
      },
      styles: { fontSize: 8 },
    });

    doc.save(`ventas_${salesPeriod}_${Date.now()}.pdf`);
    toast.success("PDF de ventas generado");
  };

  // ============================
  // EXCEL VENTAS
  // ============================
  const generateSalesExcel = async () => {
    if (!salesData) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "STARLIGHT Cinema";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Ventas", {
      properties: { tabColor: { argb: "7A3BFF" } },
    });

    // Encabezado
    worksheet.mergeCells("A1:F3");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "🎬 STARLIGHT CINEMA";
    titleCell.font = { name: "Arial", size: 24, bold: true, color: { argb: "7A3BFF" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F5F0FF" } };

    worksheet.mergeCells("A4:F4");
    const subtitleCell = worksheet.getCell("A4");
    const periodLabel = salesPeriod === "day" ? "DIARIO" : salesPeriod === "month" ? "MENSUAL" : salesPeriod === "year" ? "ANUAL" : "GENERAL";
    subtitleCell.value = `REPORTE DE VENTAS - ${periodLabel}`;
    subtitleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "333333" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
    subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8E0FF" } };

    // Fecha
    worksheet.mergeCells("A5:F5");
    const dateCell = worksheet.getCell("A5");
    dateCell.value = `Generado: ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
    dateCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "666666" } };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };

    // Estadísticas
    worksheet.addRow([]);
    const statsRow = worksheet.addRow([
      "RESUMEN",
      `${salesData.stats.totalVentas} ventas`,
      "",
      `Subtotal: $${(salesData.stats.totalIngresos - salesData.stats.totalImpuestos).toFixed(2)}`,
      `IVA: $${salesData.stats.totalImpuestos.toFixed(2)}`,
      `Total: $${salesData.stats.totalIngresos.toFixed(2)}`,
    ]);
    statsRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8FFE8" } };
    });

    worksheet.addRow([]);

    // Encabezados tabla
    const headerRow = worksheet.addRow(["Folio", "Fecha", "Items", "Subtotal", "IVA", "Total"]);
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "7A3BFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "5A30FF" } },
        left: { style: "thin", color: { argb: "5A30FF" } },
        bottom: { style: "thin", color: { argb: "5A30FF" } },
        right: { style: "thin", color: { argb: "5A30FF" } },
      };
    });
    headerRow.height = 25;

    // Datos
    salesData.sales.forEach((s, index) => {
      const row = worksheet.addRow([
        s.folio,
        new Date(s.created_at).toLocaleDateString("es-ES"),
        s.items.length,
        Number(s.subtotal),
        Number(s.tax),
        Number(s.total),
      ]);

      const bgColor = index % 2 === 0 ? "FFFFFF" : "F5F0FF";
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: "thin", color: { argb: "DDDDDD" } },
          left: { style: "thin", color: { argb: "DDDDDD" } },
          bottom: { style: "thin", color: { argb: "DDDDDD" } },
          right: { style: "thin", color: { argb: "DDDDDD" } },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        if (colNumber >= 4) cell.numFmt = '"$"#,##0.00';
      });
    });

    // Ancho columnas
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 10;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `ventas_${salesPeriod}_${Date.now()}.xlsx`);
    toast.success("Excel de ventas generado");
  };

  // ============================
  // PDF INVENTARIO
  // ============================
  const generateInventoryPDF = () => {
    const doc = new jsPDF();

    // Logo
    const scale = 0.45;
    const iconX = 25;
    const iconY = 20;
    const size = 26 * scale;
    const holeSize = 3 * scale;
    const gap = 2 * scale;

    doc.setFillColor(122, 59, 255);
    (doc as any).roundedRect(iconX, iconY, size, size, 3 * scale, 3 * scale, "F");

    doc.setFillColor(255, 255, 255);
    const bandWidth = size * 0.35;
    const bandX = iconX + size / 2 - bandWidth / 2;
    doc.rect(bandX, iconY + 2 * scale, bandWidth, size - 4 * scale, "F");

    let holeY = iconY + 2 * scale;
    for (let i = 0; i < 5; i++) {
      doc.rect(iconX + 2 * scale, holeY, holeSize, holeSize, "F");
      doc.rect(iconX + size - 2 * scale - holeSize, holeY, holeSize, holeSize, "F");
      holeY += holeSize + gap;
    }

    doc.setFontSize(18);
    doc.setTextColor(90, 48, 255);
    doc.text("STARLIGHT", iconX + size + 6, iconY + size - 1);

    // Título
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("REPORTE DE INVENTARIO", 20, 50);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 20, 58);

    // Resumen
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
    const lowStock = products.filter((p) => p.stock < 10).length;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Resumen:", 20, 70);

    doc.setFontSize(10);
    doc.text(`Total Productos: ${products.length}`, 25, 78);
    doc.text(`Categorías: ${categories.length}`, 25, 85);
    doc.text(`Stock Total: ${totalStock} unidades`, 25, 92);
    doc.text(`Valor del Inventario: $${totalValue.toFixed(2)}`, 25, 99);
    doc.text(`Productos con bajo stock (<10): ${lowStock}`, 25, 106);

    // Tabla
    const tableData = products.map((p) => [
      p.sku,
      p.name,
      getCategoryName(p.categoryId),
      `$${p.price.toFixed(2)}`,
      p.stock.toString(),
      `$${(p.price * p.stock).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 115,
      head: [["SKU", "Nombre", "Categoría", "Precio", "Stock", "Valor"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [122, 59, 255],
        textColor: 255,
        fontSize: 10,
        halign: "center",
      },
      styles: { fontSize: 8 },
    });

    doc.save(`inventario_${Date.now()}.pdf`);
    toast.success("PDF de inventario generado");
  };

  // ============================
  // EXCEL INVENTARIO
  // ============================
  const generateInventoryExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "STARLIGHT Cinema";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Inventario", {
      properties: { tabColor: { argb: "7A3BFF" } },
    });

    // Encabezado
    worksheet.mergeCells("A1:F3");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "🎬 STARLIGHT CINEMA";
    titleCell.font = { name: "Arial", size: 24, bold: true, color: { argb: "7A3BFF" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F5F0FF" } };

    worksheet.mergeCells("A4:F4");
    const subtitleCell = worksheet.getCell("A4");
    subtitleCell.value = "REPORTE DE INVENTARIO";
    subtitleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "333333" } };
    subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
    subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8E0FF" } };

    // Fecha
    worksheet.mergeCells("A5:F5");
    const dateCell = worksheet.getCell("A5");
    dateCell.value = `Generado: ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
    dateCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "666666" } };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };

    // Estadísticas
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    worksheet.addRow([]);
    const statsRow = worksheet.addRow([
      "RESUMEN",
      `${products.length} productos`,
      `${categories.length} categorías`,
      `Stock: ${totalStock}`,
      "",
      `Valor: $${totalValue.toFixed(2)}`,
    ]);
    statsRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 10, bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8FFE8" } };
    });

    worksheet.addRow([]);

    // Encabezados tabla
    const headerRow = worksheet.addRow(["SKU", "Nombre", "Categoría", "Precio", "Stock", "Valor Total"]);
    headerRow.eachCell((cell) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "7A3BFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "5A30FF" } },
        left: { style: "thin", color: { argb: "5A30FF" } },
        bottom: { style: "thin", color: { argb: "5A30FF" } },
        right: { style: "thin", color: { argb: "5A30FF" } },
      };
    });
    headerRow.height = 25;

    // Datos
    products.forEach((p, index) => {
      const row = worksheet.addRow([
        p.sku,
        p.name,
        getCategoryName(p.categoryId),
        p.price,
        p.stock,
        p.price * p.stock,
      ]);

      const bgColor = index % 2 === 0 ? "FFFFFF" : "F5F0FF";
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: "thin", color: { argb: "DDDDDD" } },
          left: { style: "thin", color: { argb: "DDDDDD" } },
          bottom: { style: "thin", color: { argb: "DDDDDD" } },
          right: { style: "thin", color: { argb: "DDDDDD" } },
        };
        cell.alignment = { vertical: "middle", horizontal: colNumber === 2 ? "left" : "center" };
        if (colNumber === 4 || colNumber === 6) cell.numFmt = '"$"#,##0.00';
      });

      // Resaltar bajo stock
      if (p.stock < 10) {
        row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCCC" } };
        row.getCell(5).font = { name: "Arial", size: 10, bold: true, color: { argb: "CC0000" } };
      }
    });

    // Fila total
    worksheet.addRow([]);
    const totalRow = worksheet.addRow(["", "", "", "TOTAL", totalStock, totalValue]);
    totalRow.eachCell((cell, colNumber) => {
      if (colNumber >= 4) {
        cell.font = { name: "Arial", size: 11, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E8E0FF" } };
        cell.border = { top: { style: "medium", color: { argb: "7A3BFF" } }, bottom: { style: "medium", color: { argb: "7A3BFF" } } };
        if (colNumber === 6) cell.numFmt = '"$"#,##0.00';
      }
    });

    // Ancho columnas
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 35;
    worksheet.getColumn(3).width = 18;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 10;
    worksheet.getColumn(6).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `inventario_${Date.now()}.xlsx`);
    toast.success("Excel de inventario generado");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold mb-8 text-gradient-cinema">Reportes</h1>

          <Tabs defaultValue="ventas" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="ventas" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Ventas
              </TabsTrigger>
              <TabsTrigger value="inventario" className="gap-2">
                <Package className="w-4 h-4" />
                Inventario
              </TabsTrigger>
            </TabsList>

            {/* ======================== TAB VENTAS ======================== */}
            <TabsContent value="ventas" className="space-y-6">
              {/* Controles */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Período:</span>
                  <Select value={salesPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Hoy</SelectItem>
                      <SelectItem value="month">Este Mes</SelectItem>
                      <SelectItem value="year">Este Año</SelectItem>
                      <SelectItem value="all">Todo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateSalesPDF} variant="outline" className="gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    PDF
                  </Button>
                  <Button onClick={generateSalesExcel} variant="outline" className="gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-500" />
                    Excel
                  </Button>
                </div>
              </div>

              {/* Estadísticas */}
              {salesData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="card-cinema">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <ShoppingCart className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{salesData.stats.totalVentas}</p>
                          <p className="text-sm text-muted-foreground">Ventas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-cinema">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">${salesData.stats.totalIngresos.toFixed(0)}</p>
                          <p className="text-sm text-muted-foreground">Ingresos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-cinema">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-500/10 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">${salesData.stats.promedioVenta.toFixed(0)}</p>
                          <p className="text-sm text-muted-foreground">Promedio</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="card-cinema">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                          <Calendar className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">${salesData.stats.totalImpuestos.toFixed(0)}</p>
                          <p className="text-sm text-muted-foreground">IVA</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Gráficas */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="card-cinema">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Ventas por Día
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {salesData && salesData.chartData.byDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={salesData.chartData.byDay.slice(-7)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #7A3BFF" }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]}
                          />
                          <Bar dataKey="total" fill="#7A3BFF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No hay datos para mostrar
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="card-cinema">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Tendencia Mensual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {salesData && salesData.chartData.byMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={salesData.chartData.byMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #7A3BFF" }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]}
                          />
                          <Line type="monotone" dataKey="total" stroke="#7A3BFF" strokeWidth={3} dot={{ fill: "#7A3BFF" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        No hay datos para mostrar
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de ventas recientes */}
              <Card className="card-cinema">
                <CardHeader>
                  <CardTitle>Ventas Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2">Folio</th>
                          <th className="text-left py-3 px-2">Fecha</th>
                          <th className="text-center py-3 px-2">Items</th>
                          <th className="text-right py-3 px-2">Subtotal</th>
                          <th className="text-right py-3 px-2">IVA</th>
                          <th className="text-right py-3 px-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesData?.sales.slice(0, 10).map((sale) => (
                          <tr key={sale.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-2 font-mono text-xs">{sale.folio}</td>
                            <td className="py-3 px-2">{new Date(sale.created_at).toLocaleDateString("es-ES")}</td>
                            <td className="py-3 px-2 text-center">{sale.items.length}</td>
                            <td className="py-3 px-2 text-right">${Number(sale.subtotal).toFixed(2)}</td>
                            <td className="py-3 px-2 text-right">${Number(sale.tax).toFixed(2)}</td>
                            <td className="py-3 px-2 text-right font-semibold text-primary">${Number(sale.total).toFixed(2)}</td>
                          </tr>
                        ))}
                        {(!salesData || salesData.sales.length === 0) && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              No hay ventas registradas
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ======================== TAB INVENTARIO ======================== */}
            <TabsContent value="inventario" className="space-y-6">
              {/* Controles */}
              <div className="flex justify-end gap-2">
                <Button onClick={generateInventoryPDF} variant="outline" className="gap-2">
                  <FileText className="w-4 h-4 text-red-500" />
                  PDF
                </Button>
                <Button onClick={generateInventoryExcel} variant="outline" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                  Excel
                </Button>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-cinema">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{products.length}</p>
                        <p className="text-sm text-muted-foreground">Productos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-cinema">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{categories.length}</p>
                        <p className="text-sm text-muted-foreground">Categorías</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-cinema">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
                        <p className="text-sm text-muted-foreground">Stock Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-cinema">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          ${products.reduce((sum, p) => sum + p.price * p.stock, 0).toFixed(0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficas */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="card-cinema">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Stock por Categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #7A3BFF" }} />
                        <Bar dataKey="stock" fill="#7A3BFF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="card-cinema">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Valor por Categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="valor"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #7A3BFF" }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, "Valor"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de productos */}
              <Card className="card-cinema">
                <CardHeader>
                  <CardTitle>Inventario de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2">SKU</th>
                          <th className="text-left py-3 px-2">Nombre</th>
                          <th className="text-left py-3 px-2">Categoría</th>
                          <th className="text-right py-3 px-2">Precio</th>
                          <th className="text-right py-3 px-2">Stock</th>
                          <th className="text-right py-3 px-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-2 font-mono text-xs">{p.sku}</td>
                            <td className="py-3 px-2">{p.name}</td>
                            <td className="py-3 px-2">{getCategoryName(p.categoryId)}</td>
                            <td className="py-3 px-2 text-right">${p.price.toFixed(2)}</td>
                            <td className={`py-3 px-2 text-right ${p.stock < 10 ? "text-red-500 font-bold" : ""}`}>
                              {p.stock}
                            </td>
                            <td className="py-3 px-2 text-right font-semibold text-primary">
                              ${(p.price * p.stock).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Reports;
