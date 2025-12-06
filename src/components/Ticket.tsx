import { useRef } from "react";
import { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, FileDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface TicketProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  saleId: string;
  onClose: () => void;
}

// 🌐 Dominio en InfinityFree
const BASE_URL = "https://cinexnova-starlight.wuaze.com";

const Ticket = ({ items, subtotal, tax, total, saleId, onClose }: TicketProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // URL que irá dentro del QR (la que se abre en el cel)
  const getQrData = () => {
    return `${BASE_URL}/boletos.php?folio=${encodeURIComponent(saleId)}`;
  };

  // LOGO STARLIGHT (tira de película + texto)
  const StarlightLogo = () => (
    <div className="flex flex-col items-center mb-4">
      <div className="flex items-center gap-3">
        {/* Icono tipo tira de película morada */}
        <div className="relative h-10 w-10 rounded-lg bg-[#7a3bff] overflow-hidden shadow-sm flex items-center justify-center">
          {/* banda blanca central */}
          <div className="h-7 w-3 bg-white rounded-sm" />

          {/* agujeritos lado izquierdo */}
          <div className="absolute left-1 top-1 flex flex-col gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`left-hole-${i}`}
                className="w-[6px] h-[6px] bg-white rounded-[1px]"
              />
            ))}
          </div>

          {/* agujeritos lado derecho */}
          <div className="absolute right-1 top-1 flex flex-col gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`right-hole-${i}`}
                className="w-[6px] h-[6px] bg-white rounded-[1px]"
              />
            ))}
          </div>
        </div>

        {/* Texto STARLIGHT */}
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-[0.15em] text-[#5a30ff]">
            STARLIGHT
          </p>
          <p className="text-[10px] uppercase tracking-[0.20em] text-gray-500">
            Cinema Experience
          </p>
        </div>
      </div>
    </div>
  );

  // Descargar ticket como PDF con el mismo diseño
  const handleDownloadPDF = async () => {
    const ticketElement = ticketRef.current;
    if (!ticketElement) return;

    try {
      // Hace captura del ticket con el estilo actual
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);

      const marginX = 10; // margen lateral
      const availableWidth = pdfWidth - marginX * 2;
      const imgHeight = (imgProps.height * availableWidth) / imgProps.width;

      // Posición Y (dejamos un margen arriba)
      const posY = 10;

      pdf.addImage(imgData, "PNG", marginX, posY, availableWidth, imgHeight);
      pdf.save(`ticket_${saleId}.pdf`);

      toast.success("Ticket descargado en PDF");
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al generar el PDF");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      {/* CARD CONTENEDOR */}
      <Card className="w-full max-w-md my-8 max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-200">
        <div className="p-6">
          {/* HEADER MODAL */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-purple-700">
                ¡Compra exitosa!
              </h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                Tu experiencia STARLIGHT está lista
              </p>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-700" />
            </Button>
          </div>

          {/* TICKET EN PANTALLA */}
          <div
            ref={ticketRef}
            className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-5 text-gray-900"
          >
            {/* ENCABEZADO MARCA CON LOGO STARLIGHT */}
            <StarlightLogo />

            {/* INFO GENERAL */}
            <div className="mb-4 border-b border-gray-200 pb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-600">Folio</span>
                <span className="font-semibold">{saleId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600">Fecha</span>
                <span>{formatDate()}</span>
              </div>
            </div>

            {/* DETALLE DE COMPRA */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 text-center tracking-wide mb-2">
                Detalle de compra
              </p>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 last:border-none pb-3 mb-3 last:pb-0 last:mb-0"
                >
                  <div className="text-sm font-semibold mb-1">
                    {item.name}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      {item.type === "ticket"
                        ? "Boleto"
                        : `Producto x${item.quantity || 1}`}
                    </span>
                    <span>
                      ${(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* TOTALES */}
            <div className="mt-2 pt-3 border-t border-gray-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IVA (16%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-dashed border-gray-300 mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* QR */}
            <div className="flex flex-col items-center mt-5">
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                    getQrData()
                  )}`}
                  alt="Código QR"
                  className="w-[140px] h-[140px]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Código QR de validación
              </p>
            </div>

            {/* FOOTER */}
            <div className="text-center mt-5 text-[11px] text-gray-600 space-y-1">
              <p className="font-semibold text-purple-700">
                ¡Gracias por tu compra!
              </p>
              <p>Presenta este ticket en tu llegada.</p>
              <p className="text-[10px] text-gray-400">
                www.starlightcinema.com
              </p>
            </div>
          </div>

          {/* BOTÓN DESCARGAR PDF */}
          <Button onClick={handleDownloadPDF} className="w-full mt-6" size="lg">
            <FileDown className="w-5 h-5 mr-2" />
            Descargar ticket (PDF)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Ticket;
