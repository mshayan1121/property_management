"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { InvoicePdfDocument, type InvoicePdfData } from "@/components/pdf/invoice-pdf";

interface InvoicePdfButtonProps {
  data: InvoicePdfData;
  companyName: string;
  fileName?: string;
}

export function InvoicePdfButton({
  data,
  companyName,
  fileName,
}: InvoicePdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const doc = (
        <InvoicePdfDocument data={data} companyName={companyName} />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName ?? `invoice-${data.reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={loading}
    >
      <FileDown className="mr-2 size-4" />
      {loading ? "Generating…" : "Download PDF"}
    </Button>
  );
}
