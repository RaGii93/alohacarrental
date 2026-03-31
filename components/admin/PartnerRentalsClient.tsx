"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CreditCard,
  HandCoins,
  Mail,
  MapPin,
  PackageCheck,
  Plus,
  ReceiptText,
  Send,
  Undo2,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createExternalRentalAction, markExternalRentalTransferredAction, updateExternalRentalFlowAction } from "@/actions/external-rentals";
import { formatDateTime } from "@/lib/datetime";
import { calculateDays, formatCurrency } from "@/lib/pricing";

type PartnerRentalRow = {
  id: string;
  bookingCode: string;
  supplierCompany: string;
  vehicleLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  incomeAmount: number;
  expenseAmount: number;
  profitAmount: number;
  financialTransferStatus: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentReceivedAt: string | null;
  pickedUpAt: string | null;
  returnedAt: string | null;
  pickupNotes: string | null;
  returnNotes: string | null;
  createdAt: string;
};

type DraftPartnerRental = {
  supplierCompany: string;
  vehicleLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  startDate: string;
  endDate: string;
  dailyIncomeRate: string;
  dailyExpenseRate: string;
  paymentStatus: "UNPAID" | "PAID";
  paymentMethod: string;
  paymentReference: string;
  notes: string;
};

type FlowDialogState =
  | { open: false }
  | {
      open: true;
      id: string;
      action: "PAID" | "PICKED_UP" | "RETURNED";
      bookingCode: string;
      paymentMethod: string;
      paymentReference: string;
      note: string;
    };

const emptyDraft: DraftPartnerRental = {
  supplierCompany: "",
  vehicleLabel: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  pickupLocation: "",
  dropoffLocation: "",
  startDate: "",
  endDate: "",
  dailyIncomeRate: "",
  dailyExpenseRate: "",
  paymentStatus: "UNPAID",
  paymentMethod: "",
  paymentReference: "",
  notes: "",
};

const creationSteps = [
  { key: "supplier", labelKey: "admin.partnerRentals.steps.supplier" },
  { key: "customer", labelKey: "admin.partnerRentals.steps.customer" },
  { key: "payment", labelKey: "admin.partnerRentals.steps.payment" },
  { key: "review", labelKey: "admin.partnerRentals.steps.review" },
] as const;

function parseMoneyInput(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

function statusPillClass(status: string) {
  if (status === "TRANSFERRED") return "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "PAID") return "rounded-full border-sky-200 bg-sky-50 text-sky-700";
  if (status === "UNPAID") return "rounded-full border-amber-200 bg-amber-50 text-amber-700";
  return "rounded-full border-slate-200 bg-slate-100 text-slate-700";
}

export function PartnerRentalsClient({
  locale,
  rows,
  summary,
}: {
  locale: string;
  rows: PartnerRentalRow[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    totalProfit: number;
    totalCount: number;
    pendingTransferCount: number;
  };
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [savingTransferId, setSavingTransferId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftPartnerRental>(emptyDraft);
  const [currentStep, setCurrentStep] = useState(0);
  const [flowDialog, setFlowDialog] = useState<FlowDialogState>({ open: false });
  const [isUpdatingFlow, startUpdatingFlow] = useTransition();

  const statCard =
    "rounded-[1.6rem] border-0 bg-white p-5 shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]";
  const inputClass =
    "rounded-xl border-slate-200 bg-white/95 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.55)] transition focus-visible:border-sky-300 focus-visible:ring-sky-200";

  const startDate = draft.startDate ? new Date(draft.startDate) : null;
  const endDate = draft.endDate ? new Date(draft.endDate) : null;
  const validRange = Boolean(startDate && endDate && endDate > startDate);
  const rentalDays = validRange && startDate && endDate ? calculateDays(startDate, endDate) : 0;
  const dailyIncomeCents = parseMoneyInput(draft.dailyIncomeRate);
  const dailyExpenseCents = parseMoneyInput(draft.dailyExpenseRate);
  const incomeTotal = rentalDays > 0 ? dailyIncomeCents * rentalDays : 0;
  const expenseTotal = rentalDays > 0 ? dailyExpenseCents * rentalDays : 0;
  const profitTotal = incomeTotal - expenseTotal;

  const currency = (amountCents: number) => formatCurrency(amountCents, "USD");

  const completionSummary = useMemo(() => {
    const required = [
      draft.supplierCompany,
      draft.vehicleLabel,
      draft.customerName,
      draft.customerEmail,
      draft.customerPhone,
      draft.pickupLocation,
      draft.dropoffLocation,
      draft.startDate,
      draft.endDate,
      draft.dailyIncomeRate,
      draft.dailyExpenseRate,
    ];
    const filled = required.filter((value) => String(value).trim().length > 0).length;
    return Math.round((filled / required.length) * 100);
  }, [draft]);

  const updateDraft = <K extends keyof DraftPartnerRental>(key: K, value: DraftPartnerRental[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const resetDraft = () => {
    setDraft(emptyDraft);
    setCurrentStep(0);
    setModalOpen(false);
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      if (!draft.supplierCompany.trim() || !draft.vehicleLabel.trim()) {
        toast.error(t("admin.partnerRentals.messages.completeSupplier"));
        return false;
      }
    }
    if (step === 1) {
      if (
        !draft.customerName.trim() ||
        !draft.customerEmail.trim() ||
        !draft.customerPhone.trim() ||
        !draft.pickupLocation.trim() ||
        !draft.dropoffLocation.trim() ||
        !validRange
      ) {
        toast.error(t("admin.partnerRentals.messages.completeCustomer"));
        return false;
      }
    }
    if (step === 2) {
      if (!draft.dailyIncomeRate || !draft.dailyExpenseRate) {
        toast.error(t("admin.partnerRentals.messages.completePricing"));
        return false;
      }
      if (draft.paymentStatus === "PAID" && !draft.paymentMethod.trim()) {
        toast.error(t("admin.partnerRentals.messages.paymentMethodRequired"));
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, creationSteps.length - 1));
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCreate = async (formData: FormData) => {
    if (!validateStep(2) || !validRange) return;

    startSaving(async () => {
      const result = await createExternalRentalAction(formData, locale);
      if (!result.success) {
        toast.error(result.error || t("admin.partnerRentals.messages.createFailed"));
        return;
      }
      toast.success(t("admin.partnerRentals.messages.created", { code: result.bookingCode }));
      resetDraft();
      router.refresh();
    });
  };

  const handleMarkTransferred = async (id: string) => {
    setSavingTransferId(id);
    const result = await markExternalRentalTransferredAction(id, locale);
    setSavingTransferId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.partnerRentals.messages.transferFailed"));
      return;
    }
    toast.success(t("admin.partnerRentals.messages.transferred"));
    router.refresh();
  };

  const submitFlowUpdate = () => {
    if (!flowDialog.open) return;

    if (flowDialog.action === "PAID" && !flowDialog.paymentMethod.trim()) {
      toast.error(t("admin.partnerRentals.messages.paymentMethodRequired"));
      return;
    }

    startUpdatingFlow(async () => {
      const result = await updateExternalRentalFlowAction(
        {
          id: flowDialog.id,
          action: flowDialog.action,
          paymentMethod: flowDialog.paymentMethod,
          paymentReference: flowDialog.paymentReference,
          note: flowDialog.note,
        },
        locale
      );
      if (!result.success) {
        toast.error(result.error || t("admin.partnerRentals.messages.updateFailed"));
        return;
      }
      toast.success(t("admin.partnerRentals.messages.updated"));
      setFlowDialog({ open: false });
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.partnerRentals.cards.income")}</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{currency(summary.totalIncome)}</p>
        </Card>
        <Card className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.partnerRentals.cards.expenses")}</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{currency(summary.totalExpense)}</p>
        </Card>
        <Card className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.partnerRentals.cards.profit")}</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{currency(summary.totalProfit)}</p>
        </Card>
        <Card className={statCard}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.partnerRentals.cards.pendingTransfer")}</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{summary.pendingTransferCount}</p>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.98))] shadow-[0_28px_70px_-46px_rgba(15,23,42,0.28)]">
        <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">{t("admin.partnerRentals.bucket.title")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("admin.partnerRentals.bucket.description")}
            </p>
          </div>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="h-4 w-4" />
                {t("admin.partnerRentals.actions.new")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto p-0 sm:max-w-5xl">
              <form action={handleCreate}>
                <input type="hidden" name="supplierCompany" value={draft.supplierCompany} />
                <input type="hidden" name="vehicleLabel" value={draft.vehicleLabel} />
                <input type="hidden" name="customerName" value={draft.customerName} />
                <input type="hidden" name="customerEmail" value={draft.customerEmail} />
                <input type="hidden" name="customerPhone" value={draft.customerPhone} />
                <input type="hidden" name="pickupLocation" value={draft.pickupLocation} />
                <input type="hidden" name="dropoffLocation" value={draft.dropoffLocation} />
                <input type="hidden" name="startDate" value={draft.startDate} />
                <input type="hidden" name="endDate" value={draft.endDate} />
                <input type="hidden" name="dailyIncomeRate" value={draft.dailyIncomeRate} />
                <input type="hidden" name="dailyExpenseRate" value={draft.dailyExpenseRate} />
                <input type="hidden" name="paymentStatus" value={draft.paymentStatus} />
                <input type="hidden" name="paymentMethod" value={draft.paymentMethod} />
                <input type="hidden" name="paymentReference" value={draft.paymentReference} />
                <input type="hidden" name="notes" value={draft.notes} />

                <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-5">
                  <DialogTitle className="text-2xl font-black text-slate-900">{t("admin.partnerRentals.dialogs.createTitle")}</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    {t("admin.partnerRentals.dialogs.createDescription")}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {creationSteps.map((step, index) => (
                        <div
                          key={step.key}
                          className={`rounded-2xl border px-3 py-3 text-center text-sm ${
                            index === currentStep
                              ? "border-slate-900 bg-slate-900 text-white"
                              : index < currentStep
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          <div className="font-semibold">{index + 1}</div>
                          <div className="mt-1 text-xs">{t(step.labelKey as any)}</div>
                        </div>
                      ))}
                    </div>

                    {currentStep === 0 ? (
                      <Card className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700"><Building2 className="h-5 w-5" /></div>
                          <div>
                            <h3 className="font-bold text-slate-900">{t("admin.partnerRentals.sections.supplierTitle")}</h3>
                            <p className="text-sm text-slate-500">{t("admin.partnerRentals.sections.supplierDescription")}</p>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.supplierCompany")}</label>
                            <Input value={draft.supplierCompany} onChange={(e) => updateDraft("supplierCompany", e.target.value)} className={inputClass} placeholder={t("admin.partnerRentals.placeholders.supplierCompany")} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.vehicleDetails")}</label>
                            <Input value={draft.vehicleLabel} onChange={(e) => updateDraft("vehicleLabel", e.target.value)} className={inputClass} placeholder={t("admin.partnerRentals.placeholders.vehicleDetails")} />
                          </div>
                        </div>
                      </Card>
                    ) : null}

                    {currentStep === 1 ? (
                      <Card className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><UserRound className="h-5 w-5" /></div>
                          <div>
                            <h3 className="font-bold text-slate-900">{t("admin.partnerRentals.sections.customerTitle")}</h3>
                            <p className="text-sm text-slate-500">{t("admin.partnerRentals.sections.customerDescription")}</p>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.customerName")}</label>
                            <Input value={draft.customerName} onChange={(e) => updateDraft("customerName", e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.customerPhone")}</label>
                            <Input value={draft.customerPhone} onChange={(e) => updateDraft("customerPhone", e.target.value)} className={inputClass} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.customerEmail")}</label>
                            <Input type="email" value={draft.customerEmail} onChange={(e) => updateDraft("customerEmail", e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.pickupDateTime")}</label>
                            <Input type="datetime-local" value={draft.startDate} onChange={(e) => updateDraft("startDate", e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.dropoffDateTime")}</label>
                            <Input type="datetime-local" value={draft.endDate} onChange={(e) => updateDraft("endDate", e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.pickupLocation")}</label>
                            <Input value={draft.pickupLocation} onChange={(e) => updateDraft("pickupLocation", e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.dropoffLocation")}</label>
                            <Input value={draft.dropoffLocation} onChange={(e) => updateDraft("dropoffLocation", e.target.value)} className={inputClass} />
                          </div>
                        </div>
                      </Card>
                    ) : null}

                    {currentStep === 2 ? (
                      <Card className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><CreditCard className="h-5 w-5" /></div>
                          <div>
                            <h3 className="font-bold text-slate-900">{t("admin.partnerRentals.sections.pricingTitle")}</h3>
                            <p className="text-sm text-slate-500">{t("admin.partnerRentals.sections.pricingDescription")}</p>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.clientDayPrice")}</label>
                            <Input type="number" min="0" step="0.01" value={draft.dailyIncomeRate} onChange={(e) => updateDraft("dailyIncomeRate", e.target.value)} className={inputClass} placeholder={t("admin.partnerRentals.placeholders.clientDayPrice")} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.supplierDayPrice")}</label>
                            <Input type="number" min="0" step="0.01" value={draft.dailyExpenseRate} onChange={(e) => updateDraft("dailyExpenseRate", e.target.value)} className={inputClass} placeholder={t("admin.partnerRentals.placeholders.supplierDayPrice")} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.paymentStatus")}</label>
                            <div className="flex gap-2">
                              <Button type="button" variant={draft.paymentStatus === "UNPAID" ? "default" : "outline"} onClick={() => updateDraft("paymentStatus", "UNPAID")} className="flex-1 rounded-xl">{t("admin.partnerRentals.statuses.unpaid")}</Button>
                              <Button type="button" variant={draft.paymentStatus === "PAID" ? "default" : "outline"} onClick={() => updateDraft("paymentStatus", "PAID")} className="flex-1 rounded-xl">{t("admin.partnerRentals.statuses.paid")}</Button>
                            </div>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.paymentMethod")}</label>
                            <Input value={draft.paymentMethod} onChange={(e) => updateDraft("paymentMethod", e.target.value)} className={inputClass} placeholder={t("admin.partnerRentals.placeholders.paymentMethod")} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.paymentReference")}</label>
                            <Input value={draft.paymentReference} onChange={(e) => updateDraft("paymentReference", e.target.value)} className={inputClass} placeholder={t("admin.partnerRentals.placeholders.paymentReference")} />
                          </div>
                        </div>
                      </Card>
                    ) : null}

                    {currentStep === 3 ? (
                      <Card className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-5">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><ReceiptText className="h-5 w-5" /></div>
                          <div>
                            <h3 className="font-bold text-slate-900">{t("admin.partnerRentals.sections.reviewTitle")}</h3>
                            <p className="text-sm text-slate-500">{t("admin.partnerRentals.sections.reviewDescription")}</p>
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.internalNotes")}</label>
                          <Textarea value={draft.notes} onChange={(e) => updateDraft("notes", e.target.value)} className={`${inputClass} min-h-28`} />
                        </div>
                      </Card>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <Card className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] shadow-[0_24px_56px_-36px_rgba(15,23,42,0.26)]">
                      <div className="border-b border-slate-200 px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{t("admin.partnerRentals.summary.title")}</h3>
                            <p className="mt-1 text-sm text-slate-500">{t("admin.partnerRentals.summary.description")}</p>
                          </div>
                          <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">
                            {t("admin.partnerRentals.summary.ready", { percent: completionSummary })}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-4 px-5 py-5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center gap-2 text-slate-700"><CarFront className="h-4 w-4" /><span className="text-sm font-semibold">{t("admin.partnerRentals.summary.supplierVehicle")}</span></div>
                          <p className="mt-2 font-semibold text-slate-900">{draft.vehicleLabel || t("admin.partnerRentals.summary.vehiclePending")}</p>
                          <p className="mt-1 text-sm text-slate-500">{draft.supplierCompany || t("admin.partnerRentals.summary.supplierPending")}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center gap-2 text-slate-700"><MapPin className="h-4 w-4" /><span className="text-sm font-semibold">{t("admin.partnerRentals.summary.tripPlan")}</span></div>
                          <p className="mt-2 font-semibold text-slate-900">
                            {validRange && startDate && endDate
                              ? t("admin.partnerRentals.summary.range", { start: formatDateTime(startDate), end: formatDateTime(endDate) })
                              : t("admin.partnerRentals.summary.chooseDates")}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {rentalDays > 0 ? t("admin.partnerRentals.summary.rentalDays", { count: rentalDays }) : t("admin.partnerRentals.summary.dayCountAuto")}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{draft.pickupLocation || t("admin.partnerRentals.summary.pickup")} → {draft.dropoffLocation || t("admin.partnerRentals.summary.dropoff")}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                          <p className="text-sm font-semibold text-slate-300">{t("admin.partnerRentals.summary.financeSnapshot")}</p>
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between text-sm"><span className="text-slate-300">{t("admin.partnerRentals.summary.clientDayPrice")}</span><span className="font-semibold">{currency(dailyIncomeCents)}</span></div>
                            <div className="flex items-center justify-between text-sm"><span className="text-slate-300">{t("admin.partnerRentals.summary.supplierDayPrice")}</span><span className="font-semibold">{currency(dailyExpenseCents)}</span></div>
                            <div className="flex items-center justify-between text-sm"><span className="text-slate-300">{t("admin.partnerRentals.cards.income")}</span><span className="font-semibold">{currency(incomeTotal)}</span></div>
                            <div className="flex items-center justify-between text-sm"><span className="text-slate-300">{t("admin.partnerRentals.cards.expenses")}</span><span className="font-semibold">{currency(expenseTotal)}</span></div>
                            <div className="border-t border-white/10 pt-3">
                              <div className="flex items-center justify-between text-base"><span className="font-semibold text-slate-200">{t("admin.partnerRentals.summary.estimatedProfit")}</span><span className="font-black text-white">{currency(profitTotal)}</span></div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-700">{t("admin.partnerRentals.summary.initialPaymentState")}</p>
                          <p className="mt-2 font-semibold text-slate-900">{draft.paymentStatus === "PAID" ? t("admin.partnerRentals.statuses.paid") : t("admin.partnerRentals.statuses.unpaid")}</p>
                          <p className="mt-1 text-sm text-slate-500">{draft.paymentMethod || t("admin.partnerRentals.summary.paymentMethodPending")}</p>
                          <p className="mt-1 text-xs text-slate-400">{draft.paymentReference || t("admin.partnerRentals.summary.paymentReferencePending")}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <Button type="button" variant="outline" onClick={currentStep === 0 ? resetDraft : previousStep}>
                    {currentStep === 0 ? t("common.cancel") : t("common.back")}
                  </Button>
                  {currentStep < creationSteps.length - 1 ? (
                    <Button type="button" onClick={nextStep} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                      {t("admin.partnerRentals.actions.continue")}
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSaving || !validRange} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                      <Send className="h-4 w-4" />
                      {isSaving ? t("admin.partnerRentals.actions.creating") : t("admin.partnerRentals.actions.create")}
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3 border-t border-slate-200 p-6">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">{t("admin.partnerRentals.empty")}</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{row.bookingCode}</p>
                      <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700">{row.supplierCompany}</Badge>
                      <Badge variant="outline" className={statusPillClass(row.paymentStatus)}>{row.paymentStatus === "PAID" ? t("admin.partnerRentals.statuses.paid") : t("admin.partnerRentals.statuses.unpaid")}</Badge>
                      <Badge variant="outline" className={statusPillClass(row.financialTransferStatus)}>{row.financialTransferStatus === "TRANSFERRED" ? t("admin.partnerRentals.statuses.transferred") : t("admin.partnerRentals.statuses.pendingTransfer")}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{row.customerName} · {row.vehicleLabel}</p>
                    <p className="text-sm text-slate-500">{t("admin.partnerRentals.summary.range", { start: formatDateTime(row.startDate), end: formatDateTime(row.endDate) })}</p>
                    <p className="text-xs text-slate-500">{row.pickupLocation} → {row.dropoffLocation}</p>
                    <div className="grid gap-2 pt-2 text-sm text-slate-700 md:grid-cols-3">
                      <span className="inline-flex items-center gap-1"><BadgeDollarSign className="h-4 w-4" /> {t("admin.partnerRentals.cards.income")} {currency(row.incomeAmount)}</span>
                      <span className="inline-flex items-center gap-1"><ReceiptText className="h-4 w-4" /> {t("admin.partnerRentals.cards.expenses")} {currency(row.expenseAmount)}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900"><HandCoins className="h-4 w-4" /> {t("admin.partnerRentals.cards.profit")} {currency(row.profitAmount)}</span>
                    </div>
                    <div className="grid gap-2 pt-2 text-xs text-slate-500 md:grid-cols-3">
                      <span>{t("admin.partnerRentals.row.payment", { value: row.paymentReceivedAt ? formatDateTime(row.paymentReceivedAt) : t("admin.partnerRentals.row.notReceived") })}</span>
                      <span>{t("admin.partnerRentals.row.pickup", { value: row.pickedUpAt ? formatDateTime(row.pickedUpAt) : t("admin.partnerRentals.row.notMarked") })}</span>
                      <span>{t("admin.partnerRentals.row.dropoff", { value: row.returnedAt ? formatDateTime(row.returnedAt) : t("admin.partnerRentals.row.notMarked") })}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 xl:max-w-[360px] xl:justify-end">
                    <a href={`mailto:${row.customerEmail}`} className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900">
                      <ArrowUpRight className="h-4 w-4" />
                      {t("admin.partnerRentals.actions.emailCustomer")}
                    </a>
                    {row.paymentStatus !== "PAID" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFlowDialog({
                            open: true,
                            id: row.id,
                            action: "PAID",
                            bookingCode: row.bookingCode,
                            paymentMethod: row.paymentMethod || "",
                            paymentReference: row.paymentReference || "",
                            note: "",
                          })
                        }
                      >
                        <CreditCard className="h-4 w-4" />
                        {t("admin.partnerRentals.actions.markPaid")}
                      </Button>
                    ) : null}
                    {!row.pickedUpAt ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFlowDialog({
                            open: true,
                            id: row.id,
                            action: "PICKED_UP",
                            bookingCode: row.bookingCode,
                            paymentMethod: "",
                            paymentReference: "",
                            note: row.pickupNotes || "",
                          })
                        }
                      >
                        <PackageCheck className="h-4 w-4" />
                        {t("admin.partnerRentals.actions.markPickup")}
                      </Button>
                    ) : null}
                    {!row.returnedAt ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFlowDialog({
                            open: true,
                            id: row.id,
                            action: "RETURNED",
                            bookingCode: row.bookingCode,
                            paymentMethod: "",
                            paymentReference: "",
                            note: row.returnNotes || "",
                          })
                        }
                      >
                        <Undo2 className="h-4 w-4" />
                        {t("admin.partnerRentals.actions.markDropoff")}
                      </Button>
                    ) : null}
                    {row.financialTransferStatus !== "TRANSFERRED" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={savingTransferId === row.id}
                        onClick={() => handleMarkTransferred(row.id)}
                      >
                        {savingTransferId === row.id ? t("admin.partnerRentals.actions.saving") : t("admin.partnerRentals.actions.markTransferred")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={flowDialog.open} onOpenChange={(nextOpen) => !nextOpen && setFlowDialog({ open: false })}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {flowDialog.open && flowDialog.action === "PAID"
                ? t("admin.partnerRentals.flow.markPaidTitle", { code: flowDialog.bookingCode })
                : flowDialog.open && flowDialog.action === "PICKED_UP"
                  ? t("admin.partnerRentals.flow.markPickupTitle", { code: flowDialog.bookingCode })
                  : flowDialog.open && flowDialog.action === "RETURNED"
                    ? t("admin.partnerRentals.flow.markDropoffTitle", { code: flowDialog.bookingCode })
                    : t("admin.partnerRentals.flow.updateTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.partnerRentals.flow.description")}
            </DialogDescription>
          </DialogHeader>

          {flowDialog.open ? (
            <div className="space-y-4">
              {flowDialog.action === "PAID" ? (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.paymentMethod")}</label>
                    <Input
                      value={flowDialog.paymentMethod}
                      onChange={(e) => setFlowDialog({ ...flowDialog, paymentMethod: e.target.value })}
                      className={inputClass}
                      placeholder={t("admin.partnerRentals.placeholders.paymentMethod")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.partnerRentals.fields.paymentReference")}</label>
                    <Input
                      value={flowDialog.paymentReference}
                      onChange={(e) => setFlowDialog({ ...flowDialog, paymentReference: e.target.value })}
                      className={inputClass}
                      placeholder={t("admin.partnerRentals.placeholders.paymentReference")}
                    />
                  </div>
                </>
              ) : null}
              {flowDialog.action === "PICKED_UP" || flowDialog.action === "RETURNED" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {flowDialog.action === "PICKED_UP" ? t("admin.partnerRentals.fields.pickupNotes") : t("admin.partnerRentals.fields.dropoffNotes")}
                  </label>
                  <Textarea
                    value={flowDialog.note}
                    onChange={(e) => setFlowDialog({ ...flowDialog, note: e.target.value })}
                    className={`${inputClass} min-h-28`}
                    placeholder={t("admin.partnerRentals.placeholders.operationalNotes")}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFlowDialog({ open: false })}>
              {t("common.cancel")}
            </Button>
            <Button type="button" disabled={isUpdatingFlow} onClick={submitFlowUpdate}>
              {isUpdatingFlow ? t("admin.partnerRentals.actions.saving") : t("admin.partnerRentals.actions.saveUpdate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
