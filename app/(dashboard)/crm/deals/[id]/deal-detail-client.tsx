"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  FileDown,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useRef } from "react";
import Link from "next/link";

interface DealDetailClientProps {
  deal: {
    id: string;
    reference: string | null;
    lead_id: string | null;
    contact_id: string | null;
    type: string | null;
    stage: string | null;
    value: number;
    commission_rate: number;
    commission_amount: number;
    payment_type: string | null;
    assigned_to: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  contact: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  lead: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  } | null;
  assignee: { id: string; full_name: string } | null;
  kycDocuments: {
    id: string;
    name: string;
    file_url: string;
    file_type: string | null;
    created_at: string;
  }[];
  linkedContracts: { id: string; reference: string | null; status: string }[];
  companyId: string;
}

export function DealDetailClient({
  deal,
  contact,
  lead,
  assignee,
  kycDocuments,
  linkedContracts,
  companyId,
}: DealDetailClientProps) {
  const router = useRouter();
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleGenerateContract() {
    const supabase = createClient();
    const { data: contract, error } = await supabase
      .from("contracts")
      .insert({
        deal_id: deal.id,
        contact_id: deal.contact_id,
        type: deal.type ?? "sale",
        value: deal.value,
        status: "draft",
        company_id: companyId,
      })
      .select("id, reference")
      .single();

    if (error) {
      toast.error("Failed to create contract");
      return;
    }

    toast.success("Contract created");
    router.push(`/crm/contracts?highlight=${contract.id}`);
    router.refresh();
  }

  async function handleDeleteDoc(docId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("kyc_documents")
      .delete()
      .eq("id", docId);

    if (error) {
      toast.error("Failed to delete document");
      return;
    }
    setDeleteDocId(null);
    toast.success("Document deleted");
    router.refresh();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ext = file.name.split(".").pop() ?? "";
    const path = `kyc/${deal.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      toast.error("Failed to upload file. Storage bucket may not be configured.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(path);

    const { error: insertError } = await supabase.from("kyc_documents").insert({
      deal_id: deal.id,
      name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      uploaded_by: user?.id,
    });

    if (insertError) {
      toast.error("Failed to save document record");
    } else {
      toast.success("Document uploaded");
      router.refresh();
    }
    setUploading(false);
    e.target.value = "";
  }

  const activityItems = [
    { label: "Created", date: deal.created_at },
    { label: "Last updated", date: deal.updated_at },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Reference</p>
              <p className="font-medium">{deal.reference ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Type</p>
              <Badge variant="secondary" className="capitalize">
                {deal.type ?? "-"}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Stage</p>
              <p className="capitalize">
                {(deal.stage ?? "-").replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Value</p>
              <p className="font-semibold">{formatCurrency(deal.value)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Commission</p>
              <p>
                {deal.commission_rate}% · {formatCurrency(deal.commission_amount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Payment type</p>
              <p className="capitalize">{deal.payment_type ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Assigned to</p>
              <p>{assignee?.full_name ?? "-"}</p>
            </div>
          </div>
          {deal.notes && (
            <div>
              <p className="text-muted-foreground text-sm">Notes</p>
              <p className="whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked Entities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-muted-foreground text-sm">Contact</p>
            {contact ? (
              <Link
                href={`/crm/contacts?highlight=${contact.id}`}
                className="font-medium text-primary hover:underline"
              >
                {contact.full_name}
              </Link>
            ) : (
              <p>-</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Lead</p>
            {lead ? (
              <Link
                href={`/crm/leads?lead=${lead.id}`}
                className="font-medium text-primary hover:underline"
              >
                {lead.full_name}
              </Link>
            ) : (
              <p>-</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Linked contracts</p>
            {linkedContracts.length > 0 ? (
              <ul className="space-y-1">
                {linkedContracts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/crm/contracts?highlight=${c.id}`}
                      className="text-primary hover:underline"
                    >
                      {c.reference ?? c.id}
                    </Link>
                    <Badge variant="outline" className="ml-2 text-xs capitalize">
                      {c.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">None</p>
            )}
          </div>
          <Button
            className="w-full"
            onClick={handleGenerateContract}
          >
            <FileText className="mr-2 size-4" />
            Generate Contract
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>KYC Documents</CardTitle>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 size-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {kycDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
              <FileDown className="text-muted-foreground mb-2 size-10" />
              <p className="text-muted-foreground text-sm">
                No KYC documents uploaded
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Upload document
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {kycDocuments.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-muted-foreground size-4" />
                    <div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline"
                      >
                        {doc.name}
                      </a>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      asChild
                    >
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDocId(doc.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {activityItems.map((item, i) => (
              <li key={i} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(item.date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteDocId}
        onOpenChange={(o) => !o && setDeleteDocId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this KYC document? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteDocId && handleDeleteDoc(deleteDocId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
