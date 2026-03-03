"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format, parseISO, isValid } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerRight: {
    textAlign: "right",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  billTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#6b7280",
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#374151",
  },
  sectionText: {
    fontSize: 10,
    color: "#111827",
  },
  table: {
    marginTop: 16,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
    paddingBottom: 6,
    marginBottom: 4,
  },
  colDesc: { width: "50%" },
  colAmount: { width: "16%", textAlign: "right" },
  colVat: { width: "17%", textAlign: "right" },
  colTotal: { width: "17%", textAlign: "right" },
  totals: {
    marginTop: 16,
    marginLeft: "50%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#6b7280",
  },
});

function formatDatePdf(dateStr: string): string {
  const d = parseISO(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, "dd/MM/yyyy");
}

function formatMoneyPdf(amount: number): string {
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface BillPdfData {
  reference: string;
  due_date: string;
  status: string;
  category: string;
  description: string | null;
  amount: number;
  vat_amount: number;
  total_amount: number;
  vendor: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  notes?: string | null;
}

interface BillPdfDocumentProps {
  data: BillPdfData;
  companyName: string;
}

export function BillPdfDocument({ data, companyName }: BillPdfDocumentProps) {
  const description = data.description || data.category || "Bill";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.meta}>Property Management</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.billTitle}>BILL</Text>
            <Text style={styles.meta}>Ref: {data.reference}</Text>
            <Text style={styles.meta}>Due: {formatDatePdf(data.due_date)}</Text>
            <Text style={styles.meta}>Status: {data.status}</Text>
            <Text style={styles.meta}>Category: {data.category}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vendor</Text>
          <Text style={styles.sectionText}>{data.vendor.name}</Text>
          {data.vendor.email && (
            <Text style={styles.sectionText}>{data.vendor.email}</Text>
          )}
          {data.vendor.phone && (
            <Text style={styles.sectionText}>{data.vendor.phone}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colAmount}>Amount (AED)</Text>
            <Text style={styles.colVat}>VAT (AED)</Text>
            <Text style={styles.colTotal}>Total (AED)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>{description}</Text>
            <Text style={styles.colAmount}>{data.amount.toFixed(2)}</Text>
            <Text style={styles.colVat}>{data.vat_amount.toFixed(2)}</Text>
            <Text style={styles.colTotal}>{data.total_amount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal (AED)</Text>
            <Text>{data.amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>VAT (AED)</Text>
            <Text>{data.vat_amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Grand Total</Text>
            <Text>{formatMoneyPdf(data.total_amount)}</Text>
          </View>
        </View>

        {data.notes && (
          <View style={[styles.section, { marginTop: 24 }]}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.sectionText}>{data.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Thank you for your business</Text>
        </View>
      </Page>
    </Document>
  );
}
