"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { BillPdfDocument, type BillPdfData } from "@/components/pdf/bill-pdf";

interface BillPdfButtonProps {
  data: BillPdfData;
  companyName: string;
  fileName?: string;
}

export function BillPdfButton({
  data,
  companyName,
  fileName,
}: BillPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const doc = (
        <BillPdfDocument data={data} companyName={companyName} />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName ?? `bill-${data.reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={handleDownload}
      disabled={loading}
      title="Download PDF"
    >
      <FileDown className="size-4" />
    </Button>
  );
}
