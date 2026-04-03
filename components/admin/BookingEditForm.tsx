"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgeDollarSign, Banknote, CalendarClock, CarFront, FileText, MapPin, Plane, Plus, Receipt, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { updateCategoryBookingAction } from "@/actions/booking";
import { calculateBookingAmounts, calculateDays, formatCurrency } from "@/lib/pricing";
import {
  parseKralendijkDate,
  parseKralendijkDateTime,
} from "@/lib/datetime";

export function BookingEditForm({
  booking,
  locale,
  categories,
  locations,
  vehicles,
  bookingExtras,
  availableExtras,
  bookingDiscount,
  taxPercentage,
  vehicleRatesIncludeTax,
}: {
  booking: {
    id: string;
    bookingCode: string;
    categoryId: string;
    vehicleId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    flightNumber: string;
    birthDate: string;
    driverLicenseNumber: string;
    licenseExpiryDate: string;
    startDate: string;
    endDate: string;
    pickupLocationId: string;
    dropoffLocationId: string;
    notes: string;
  };
  locale: string;
  categories: Array<{ id: string; name: string; dailyRate: number }>;
  locations: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; name: string; categoryId: string; plateNumber?: string | null }>;
  bookingExtras: Array<{ id: string; quantity: number; lineTotal: number; extraId: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number }>;
  availableExtras: Array<{ id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }>;
  bookingDiscount: { id: string; percentage: number; amount: number; code: string } | null;
  taxPercentage: number;
  vehicleRatesIncludeTax: boolean;
}) {
  const router = useRouter();
  const t = useTranslations();
  const [isSaving, setIsSaving] = useState(false);
  const [categoryId, setCategoryId] = useState(booking.categoryId);
  const [vehicleId, setVehicleId] = useState(booking.vehicleId);
  const [pickupLocationId, setPickupLocationId] = useState(booking.pickupLocationId);
  const [dropoffLocationId, setDropoffLocationId] = useState(booking.dropoffLocationId);
  const [customerName, setCustomerName] = useState(booking.customerName);
  const [customerEmail, setCustomerEmail] = useState(booking.customerEmail);
  const [customerPhone, setCustomerPhone] = useState(booking.customerPhone);
  const [flightNumber, setFlightNumber] = useState(booking.flightNumber);
  const [birthDate, setBirthDate] = useState(booking.birthDate);
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(booking.driverLicenseNumber);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(booking.licenseExpiryDate);
  const [startDate, setStartDate] = useState(booking.startDate);
  const [endDate, setEndDate] = useState(booking.endDate);
  const [notes, setNotes] = useState(booking.notes);
  const [draftExtraId, setDraftExtraId] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Array<{
    extraId: string;
    name: string;
    pricingType: "DAILY" | "FLAT";
    amount: number;
    quantity: number;
  }>>(
    bookingExtras.map((line) => ({
      extraId: line.extraId,
      name: line.name,
      pricingType: line.pricingType,
      amount: line.amount,
      quantity: line.quantity,
    }))
  );

  const handleSubmit = async () => {
    if (!birthDate || !licenseExpiryDate || !startDate || !endDate || !pickupLocationId || !dropoffLocationId) {
      toast.error(t("admin.bookings.edit.messages.completeRequired"));
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("vehicleId", vehicleId);
      formData.append("customerName", customerName);
      formData.append("customerEmail", customerEmail);
      formData.append("customerPhone", customerPhone);
      formData.append("flightNumber", flightNumber);
      const parsedBirthDate = parseKralendijkDate(birthDate);
      const parsedLicenseExpiryDate = parseKralendijkDate(licenseExpiryDate, true);
      const parsedStartDate = parseKralendijkDateTime(startDate);
      const parsedEndDate = parseKralendijkDateTime(endDate);
      if (!parsedBirthDate || !parsedLicenseExpiryDate || !parsedStartDate || !parsedEndDate) {
        toast.error(t("admin.bookings.edit.messages.completeRequired"));
        return;
      }

      formData.append("birthDate", parsedBirthDate.toISOString());
      formData.append("driverLicenseNumber", driverLicenseNumber);
      formData.append("licenseExpiryDate", parsedLicenseExpiryDate.toISOString());
      formData.append("startDate", parsedStartDate.toISOString());
      formData.append("endDate", parsedEndDate.toISOString());
      formData.append("pickupLocationId", pickupLocationId);
      formData.append("dropoffLocationId", dropoffLocationId);
      formData.append("notes", notes);
      formData.append("selectedExtras", JSON.stringify(selectedExtras.map((line) => ({
        extraId: line.extraId,
        quantity: line.quantity,
      }))));

      const result = await updateCategoryBookingAction(booking.id, formData, locale);
      if (!result.success) {
        toast.error(result.error || t("admin.bookings.edit.messages.updateFailed"));
        return;
      }
      toast.success(t("admin.bookings.edit.messages.updated"));
      router.push(result.redirectUrl!);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const sectionClass = "rounded-[1.6rem] border p-6 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.28)]";
  const fieldClass = "space-y-2";
  const inputClass = "rounded-xl border-slate-200 bg-white/90 focus-visible:border-sky-300 focus-visible:ring-sky-200";
  const vehicleOptions = vehicles.filter((vehicle) => vehicle.categoryId === categoryId);
  const selectedCategory = categories.find((category) => category.id === categoryId) || null;
  const parsedStartDate = startDate ? parseKralendijkDateTime(startDate) : null;
  const parsedEndDate = endDate ? parseKralendijkDateTime(endDate) : null;
  const rentalDays =
    parsedStartDate && parsedEndDate && parsedEndDate > parsedStartDate
      ? calculateDays(parsedStartDate, parsedEndDate)
      : 1;
  const baseAmount = (selectedCategory?.dailyRate || 0) * rentalDays;
  const recalculatedExtras = selectedExtras.map((line) => ({
    ...line,
    previewLineTotal:
      line.pricingType === "DAILY"
        ? line.amount * rentalDays * line.quantity
        : line.amount * line.quantity,
  }));
  const extrasAmount = recalculatedExtras.reduce((sum, line) => sum + line.previewLineTotal, 0);
  const discountAmount = bookingDiscount ? Math.round((baseAmount * bookingDiscount.percentage) / 100) : 0;
  const { subtotalBeforeTax, taxAmount, totalAmount } = calculateBookingAmounts({
    baseRentalCents: baseAmount,
    extrasCents: extrasAmount,
    discountCents: discountAmount,
    taxPercentage,
    baseRentalIncludesTax: vehicleRatesIncludeTax,
  });

  useEffect(() => {
    if (!vehicleOptions.some((vehicle) => vehicle.id === vehicleId)) {
      setVehicleId(vehicleOptions[0]?.id || "");
    }
  }, [vehicleId, vehicleOptions]);

  const addExtra = () => {
    const extra = availableExtras.find((item) => item.id === draftExtraId);
    if (!extra) return;
    setSelectedExtras((prev) => {
      const existing = prev.find((item) => item.extraId === extra.id);
      if (existing) {
        return prev.map((item) =>
          item.extraId === extra.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          extraId: extra.id,
          name: extra.name,
          pricingType: extra.pricingType,
          amount: extra.amount,
          quantity: 1,
        },
      ];
    });
    setDraftExtraId("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
      <div className="space-y-6">
        <Card className={`${sectionClass} border-sky-200 bg-[linear-gradient(180deg,#ffffff,#f4faff)]`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-2.5 text-sky-700 ring-1 ring-sky-200"><UserRound className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.edit.sections.customer.title")}</h2>
              <p className="text-sm text-slate-600">{t("admin.bookings.edit.sections.customer.description")}</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className={fieldClass}>
              <Label>{t("common.name")}</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
            </div>
            <div className={fieldClass}>
              <Label>{t("common.email")}</Label>
              <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} />
            </div>
            <div className={fieldClass}>
              <Label>{t("common.phone")}</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputClass} />
            </div>
            <div className={fieldClass}>
              <Label className="flex items-center gap-2"><Plane className="h-4 w-4" />{t("admin.bookings.detail.customerProfile.fields.flightNumber")}</Label>
              <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} className={inputClass} />
            </div>
            <div className={fieldClass}>
              <Label>{t("admin.bookings.detail.customerProfile.fields.birthDate")}</Label>
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
            </div>
            <div className={fieldClass}>
              <Label>{t("admin.bookings.detail.customerProfile.fields.licenseNumber")}</Label>
              <Input value={driverLicenseNumber} onChange={(e) => setDriverLicenseNumber(e.target.value)} className={inputClass} />
            </div>
            <div className={fieldClass}>
              <Label>{t("admin.bookings.detail.customerProfile.fields.licenseExpiry")}</Label>
              <Input type="date" value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)} className={inputClass} />
            </div>
          </div>
        </Card>

        <Card className={`${sectionClass} border-violet-200 bg-[linear-gradient(180deg,#ffffff,#f8f5ff)]`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100 p-2.5 text-violet-700 ring-1 ring-violet-200"><CalendarClock className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.summaryCards.rentalWindow")}</h2>
              <p className="text-sm text-slate-600">{t("admin.bookings.edit.sections.window.description")}</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className={fieldClass}>
              <Label>{t("admin.bookings.edit.fields.pickupDateTime")}</Label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div className={fieldClass}>
              <Label>{t("admin.bookings.edit.fields.dropoffDateTime")}</Label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
        </Card>

        <Card className={`${sectionClass} border-amber-200 bg-[linear-gradient(180deg,#ffffff,#fff9ef)]`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-2.5 text-amber-700 ring-1 ring-amber-200"><CarFront className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.edit.sections.routing.title")}</h2>
              <p className="text-sm text-slate-600">{t("admin.bookings.edit.sections.routing.description")}</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className={fieldClass}>
              <Label>{t("admin.bookings.detail.trip.fields.category")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={t("admin.vehicles.placeholders.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <Label>{t("admin.bookings.edit.fields.assignedVehicle")}</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={t("admin.bookings.edit.fields.selectVehicle")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleOptions.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}{vehicle.plateNumber ? ` · ${vehicle.plateNumber}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <Label>{t("admin.bookings.detail.trip.fields.pickupLocation")}</Label>
              <Select value={pickupLocationId} onValueChange={setPickupLocationId}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={t("admin.bookings.edit.fields.selectPickupLocation")} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={fieldClass}>
              <Label>{t("admin.bookings.detail.trip.fields.dropoffLocation")}</Label>
              <Select value={dropoffLocationId} onValueChange={setDropoffLocationId}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={t("admin.bookings.edit.fields.selectDropoffLocation")} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className={`${sectionClass} border-emerald-200 bg-[linear-gradient(180deg,#ffffff,#f1fcf7)]`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 ring-1 ring-emerald-200"><FileText className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.notesCard.title")}</h2>
              <p className="text-sm text-slate-600">{t("admin.bookings.edit.sections.notes.description")}</p>
            </div>
          </div>
          <div className={fieldClass}>
            <Label>{t("admin.bookings.detail.notesCard.title")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className={inputClass} />
          </div>
        </Card>

        <Card className={`${sectionClass} border-cyan-200 bg-[linear-gradient(180deg,#ffffff,#f2fbff)]`}>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700 ring-1 ring-cyan-200"><Plus className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("admin.extras.title")}</h2>
              <p className="text-sm text-slate-600">{t("admin.bookings.edit.sections.extras.description")}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className={fieldClass}>
              <Label>{t("admin.bookings.edit.fields.addExtra")}</Label>
              <Select value={draftExtraId} onValueChange={setDraftExtraId}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={t("admin.bookings.detail.pricing.selectExtra")} />
                </SelectTrigger>
                <SelectContent>
                  {availableExtras
                    .filter((extra) => !selectedExtras.some((line) => line.extraId === extra.id))
                    .map((extra) => (
                      <SelectItem key={extra.id} value={extra.id}>
                        {extra.name} · {extra.pricingType === "DAILY" ? t("admin.extras.dailyRate") : t("admin.extras.flatRate")} · {formatCurrency(extra.amount)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addExtra}
                disabled={!draftExtraId}
                className="rounded-xl bg-[linear-gradient(135deg,#0891b2,#0e7490)] text-white shadow-[0_14px_28px_-18px_rgba(8,145,178,0.7)] hover:opacity-95 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:opacity-100"
              >
                <Plus className="h-4 w-4" />
                {t("admin.bookings.detail.pricing.add")}
              </Button>
            </div>
          </div>

          {selectedExtras.length > 0 ? (
            <div className="mt-5 space-y-3">
              {selectedExtras.map((line) => {
                const lineTotal =
                  line.pricingType === "DAILY"
                    ? line.amount * rentalDays * line.quantity
                    : line.amount * line.quantity;
                return (
                  <div key={line.extraId} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_110px_120px_auto] md:items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{line.name}</p>
                      <p className="text-sm text-slate-600">
                        {line.pricingType === "DAILY" ? t("admin.bookings.edit.fields.dailyExtra") : t("admin.bookings.edit.fields.flatExtra")} · {formatCurrency(line.amount)}
                      </p>
                    </div>
                    <div className={fieldClass}>
                      <Label>{t("admin.bookings.edit.fields.qty")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => {
                          const nextQty = Math.max(1, Number.parseInt(e.target.value || "1", 10));
                          setSelectedExtras((prev) =>
                            prev.map((item) =>
                              item.extraId === line.extraId ? { ...item, quantity: nextQty } : item
                            )
                          );
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.edit.fields.lineTotal")}</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(lineTotal)}</p>
                    </div>
                    <div className="flex items-end md:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setSelectedExtras((prev) => prev.filter((item) => item.extraId !== line.extraId))
                        }
                        className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("admin.bookings.edit.fields.removeExtra")}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500">
              {t("admin.bookings.edit.fields.noExtras")}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[1.65rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#eef6ff)] p-6 shadow-[0_22px_52px_-30px_rgba(15,23,42,0.35)] xl:sticky xl:top-24">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-2.5 text-sky-700 ring-1 ring-sky-200"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.edit.sidebar.title")}</h2>
              <p className="text-sm text-slate-600">{t("admin.bookings.edit.sidebar.description")}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.edit.sidebar.booking")}</p>
              <p className="mt-1 font-semibold text-slate-900">{booking.bookingCode}</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
              {t("admin.bookings.edit.sidebar.points.recalculate")}
            </div>
            <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
              {t("admin.bookings.edit.sidebar.points.availability")}
            </div>
            <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
              {t("admin.bookings.edit.sidebar.points.history")}
            </div>
            <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 shadow-sm">
              {t("admin.bookings.edit.sidebar.points.invoice")}
            </div>
          </div>

          <div className="mt-6 rounded-[1.45rem] border border-cyan-200 bg-[linear-gradient(180deg,#ffffff,#f3fbff)] p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700 ring-1 ring-cyan-200"><Receipt className="h-5 w-5" /></div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{t("admin.bookings.edit.preview.title")}</h3>
                <p className="text-sm text-slate-600">{t("admin.bookings.edit.preview.description")}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <span className="text-slate-600">{t("admin.bookings.edit.preview.rentalDays")}</span>
                <span className="font-semibold text-slate-900">{rentalDays}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <span className="text-slate-600">{t("admin.bookings.detail.billing.baseRental")}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(baseAmount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <span className="text-slate-600">{t("admin.bookings.detail.billing.extras")}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(extrasAmount)}</span>
              </div>
              {bookingDiscount && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                  <span className="text-slate-600">{t("admin.bookings.edit.preview.discount", { code: bookingDiscount.code })}</span>
                  <span className="font-semibold text-slate-900">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <span className="text-slate-600">{vehicleRatesIncludeTax ? t("admin.bookings.detail.billing.subtotalBeforeExtraTax") : t("admin.bookings.detail.billing.subtotalBeforeTax")}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotalBeforeTax)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <span className="text-slate-600">{vehicleRatesIncludeTax ? t("admin.bookings.detail.billing.taxOnExtras", { tax: taxPercentage }) : t("admin.bookings.detail.billing.taxOnBooking", { tax: taxPercentage })}</span>
                <span className="font-semibold text-slate-900">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[rgb(19,120,152)] px-4 py-4 text-white shadow-[0_16px_32px_-20px_rgba(19,120,152,0.42)]">
                <span className="font-semibold">{t("admin.bookings.edit.preview.projectedTotal")}</span>
                <span className="text-lg font-black">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {recalculatedExtras.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex items-center gap-2 text-slate-900">
                  <BadgeDollarSign className="h-4 w-4 text-cyan-700" />
                  <span className="font-semibold">{t("admin.bookings.edit.preview.includedExtras")}</span>
                </div>
                {recalculatedExtras.map((line) => (
                  <div key={line.extraId} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                    <span className="text-slate-600">{line.name} x{line.quantity}</span>
                    <span className="font-medium text-slate-900">{formatCurrency(line.previewLineTotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button variant="outline" onClick={() => router.push(`/${locale}/admin/bookings/${booking.id}`)} disabled={isSaving} className="rounded-xl border-slate-300 bg-white hover:bg-slate-50">
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="rounded-xl bg-[rgb(19,120,152)] text-white shadow-[0_16px_30px_-18px_rgba(19,120,152,0.42)] hover:opacity-95">
              {isSaving ? t("admin.settings.saving") : t("admin.bookings.edit.actions.saveChanges")}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
