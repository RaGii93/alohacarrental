"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { getBlobProxyUrl } from "@/lib/blob";
import { formatDateTime } from "@/lib/datetime";
import {
  generateRentalAgreementAction,
  markAgreementReadyForSignaturesAction,
  captureAgreementSignatureAction,
  voidRentalAgreementAction,
  emailAgreementToCustomerAction,
} from "@/actions/agreements";
import {
  FileText,
  Download,
  Mail,
  PenLine,
  RefreshCw,
  ShieldOff,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

type Agreement = {
  id: string;
  agreementNumber: string;
  status: string;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  signedAt: Date | string | null;
  termsVersion: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  signatures: Array<{
    id: string;
    signerName: string;
    signerEmail: string | null;
    signerRole: string;
    signedAt: Date | string;
    ipAddress: string | null;
  }>;
} | null;

type Props = {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  locale: string;
  agreement: Agreement;
  role: string;
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  GENERATED: { label: "Generated", className: "bg-blue-100 text-blue-700" },
  AWAITING_SIGNATURES: { label: "Awaiting Signatures", className: "bg-amber-100 text-amber-700" },
  SIGNED: { label: "Fully Signed", className: "bg-green-100 text-green-700" },
  VOID: { label: "Void", className: "bg-red-100 text-red-700" },
};

type SignatureCapture = "CUSTOMER" | "AGENT" | null;

export function RentalAgreementPanel({ bookingId, bookingCode, customerName, customerEmail, locale, agreement: initialAgreement, role }: Props) {
  const router = useRouter();
  const [agreement, setAgreement] = useState(initialAgreement);
  const [capturing, setCapturing] = useState<SignatureCapture>(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isEmailing, startEmail] = useTransition();
  const [isVoiding, startVoid] = useTransition();

  const canWrite = role === "ROOT" || role === "OWNER";
  const statusMeta = STATUS_BADGES[agreement?.status ?? ""] ?? { label: agreement?.status ?? "Unknown", className: "bg-slate-100 text-slate-600" };

  const pdfDownloadUrl = getBlobProxyUrl(agreement?.signedPdfUrl || agreement?.pdfUrl, { download: true });
  const hasCustomerSig = agreement?.signatures.some((s) => s.signerRole === "CUSTOMER");
  const hasAgentSig = agreement?.signatures.some((s) => s.signerRole === "AGENT");

  function refresh() {
    router.refresh();
  }

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateRentalAgreementAction(locale, bookingId);
      if (result.success) {
        toast.success("Agreement generated successfully");
        refresh();
      } else {
        toast.error(result.error || "Failed to generate agreement");
      }
    });
  }

  function handleMarkReady() {
    if (!agreement) return;
    startTransition(async () => {
      await markAgreementReadyForSignaturesAction(locale, agreement.id);
      toast.success("Marked as awaiting signatures");
      refresh();
    });
  }

  function handleBeginCapture(role: "CUSTOMER" | "AGENT") {
    setCapturing(role);
    setSignerName(role === "CUSTOMER" ? customerName : "");
    setSignerEmail(role === "CUSTOMER" ? customerEmail : "");
  }

  function handleSignatureConfirmed(dataUrl: string) {
    if (!agreement || !capturing) return;
    startTransition(async () => {
      const result = await captureAgreementSignatureAction(locale, {
        agreementId: agreement.id,
        signerName,
        signerEmail: signerEmail || undefined,
        signerRole: capturing,
        signatureDataUrl: dataUrl,
      });
      if (result.success) {
        toast.success(result.allSigned ? "Agreement fully signed!" : "Signature captured");
        setCapturing(null);
        refresh();
      } else {
        toast.error(result.error || "Failed to capture signature");
      }
    });
  }

  function handleEmail() {
    if (!agreement) return;
    startEmail(async () => {
      const result = await emailAgreementToCustomerAction(locale, agreement.id);
      if (result.success) {
        toast.success("Agreement emailed to customer");
      } else {
        toast.error(result.error || "Failed to send email");
      }
    });
  }

  function handleVoid() {
    if (!agreement) return;
    if (!confirm("Are you sure you want to void this agreement? This cannot be undone.")) return;
    startVoid(async () => {
      await voidRentalAgreementAction(locale, agreement.id, "Voided by admin");
      toast.success("Agreement voided");
      refresh();
    });
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-0 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-900">Rental Agreement</span>
          {agreement && (
            <Badge className={`text-xs ${statusMeta.className}`}>{statusMeta.label}</Badge>
          )}
        </div>
        {canWrite && !agreement && (
          <Button size="sm" onClick={handleGenerate} disabled={isPending}>
            <PenLine className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? "Generating…" : "Generate Agreement"}
          </Button>
        )}
        {canWrite && agreement && agreement.status !== "VOID" && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isPending}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Empty state */}
        {!agreement && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No rental agreement has been generated yet for this booking.</p>
            {canWrite && (
              <Button onClick={handleGenerate} disabled={isPending}>
                {isPending ? "Generating…" : "Generate Agreement"}
              </Button>
            )}
          </div>
        )}

        {/* Agreement detail */}
        {agreement && (
          <>
            {/* Meta row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase text-slate-400">Agreement #</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{agreement.agreementNumber}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase text-slate-400">Created</p>
                <p className="mt-0.5 text-sm text-slate-700">{formatDateTime(agreement.createdAt as Date)}</p>
              </div>
              {agreement.termsVersion && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-slate-400">Terms Version</p>
                  <p className="mt-0.5 text-sm text-slate-700">{agreement.termsVersion}</p>
                </div>
              )}
              {agreement.signedAt && (
                <div>
                  <p className="text-[11px] font-medium uppercase text-slate-400">Signed At</p>
                  <p className="mt-0.5 text-sm text-slate-700">{formatDateTime(agreement.signedAt as Date)}</p>
                </div>
              )}
            </div>

            {/* PDF actions */}
            <div className="flex flex-wrap gap-2">
              {pdfDownloadUrl && (
                <a
                  href={pdfDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {agreement.signedPdfUrl ? "Download Signed PDF" : "Download PDF"}
                </a>
              )}
              {canWrite && (agreement.status === "GENERATED" || agreement.status === "SIGNED") && (
                <button
                  onClick={handleEmail}
                  disabled={isEmailing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {isEmailing ? "Sending…" : "Email to Customer"}
                </button>
              )}
              {canWrite && agreement.status === "GENERATED" && (
                <button
                  onClick={handleMarkReady}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Mark Ready for Signatures
                </button>
              )}
              {canWrite && agreement.status !== "VOID" && agreement.status !== "SIGNED" && (
                <button
                  onClick={handleVoid}
                  disabled={isVoiding}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                  Void
                </button>
              )}
            </div>

            <Separator />

            {/* Signatures */}
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-900">Signatures</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Customer signature */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
                    {hasCustomerSig ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  {hasCustomerSig ? (
                    (() => {
                      const sig = agreement.signatures.find((s) => s.signerRole === "CUSTOMER")!;
                      return (
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900">{sig.signerName}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(sig.signedAt as Date)}</p>
                          {sig.ipAddress && <p className="text-xs text-slate-400">IP: {sig.ipAddress}</p>}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Not yet signed</p>
                      {canWrite && agreement.status !== "VOID" && (
                        <button
                          onClick={() => handleBeginCapture("CUSTOMER")}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          <PenLine className="h-3 w-3" />
                          Capture
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Agent signature */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Agent</p>
                    {hasAgentSig ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  {hasAgentSig ? (
                    (() => {
                      const sig = agreement.signatures.find((s) => s.signerRole === "AGENT")!;
                      return (
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-900">{sig.signerName}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(sig.signedAt as Date)}</p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Not yet signed</p>
                      {canWrite && agreement.status !== "VOID" && (
                        <button
                          onClick={() => handleBeginCapture("AGENT")}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          <PenLine className="h-3 w-3" />
                          Capture
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Signature capture modal */}
            {capturing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Capture {capturing === "CUSTOMER" ? "Customer" : "Agent"} Signature
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {capturing === "CUSTOMER"
                        ? "Ask the customer to draw their signature below."
                        : "Sign as the handling agent for this rental."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                      <Input
                        value={signerName}
                        onChange={(e) => setSignerName(e.target.value)}
                        placeholder="Full name"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Email (optional)</label>
                      <Input
                        value={signerEmail}
                        onChange={(e) => setSignerEmail(e.target.value)}
                        placeholder="email@example.com"
                        type="email"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <SignaturePad
                    label={`Draw ${capturing === "CUSTOMER" ? "customer" : "agent"} signature`}
                    onConfirm={handleSignatureConfirmed}
                    onCancel={() => setCapturing(null)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
