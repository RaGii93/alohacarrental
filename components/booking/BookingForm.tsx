"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { bookingFormSchemaRefined } from "@/lib/validators";
import { isLicenseActive } from "@/lib/license";
import { createBookingAction, uploadPaymentProofAction } from "@/actions/booking";
import { useRouter } from "next/navigation";

interface Vehicle {
  id: string;
  name: string;
  dailyRate: number;
  category?: string | null;
  imageUrl?: string | null;
}

interface Location {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
}

export function BookingForm({ locale, vehicles, locations }: { locale: string; vehicles: Vehicle[]; locations: Location[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0: select, 1: customer, 2: review, 3: confirmation
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [bookingId, setBookingId] = useState<string | null>(null);

  const extrasOptions = useMemo(
    () => [
      { id: "gps", label: t("extras.gps") || "GPS", price: 500 },
      { id: "child-seat", label: t("extras.childSeat") || "Child Seat", price: 1000 },
      { id: "additional-driver", label: t("extras.additionalDriver") || "Additional Driver", price: 1500 },
    ],
    [t]
  );

  const toggleExtra = (id: string) =>
    setSelectedExtras((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const form = useForm({
    resolver: zodResolver(bookingFormSchemaRefined),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      vehicleId: "",
      startDate: new Date(),
      endDate: new Date(),
      pickupLocation: "",
      dropoffLocation: "",
      notes: "",
    },
  });

  const licenseActive = isLicenseActive();

  const selectedVehicle = vehicles.find((v) => v.id === form.getValues("vehicleId"));
  const start = form.getValues("startDate");
  const end = form.getValues("endDate");

  const days = useMemo(() => {
    try {
      const s = start instanceof Date ? start : new Date(start);
      const e = end instanceof Date ? end : new Date(end);
      const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, diff);
    } catch {
      return 1;
    }
  }, [start, end]);

  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce((sum, id) => {
      const opt = extrasOptions.find((e) => e.id === id);
      return sum + (opt ? opt.price : 0);
    }, 0);
  }, [selectedExtras, extrasOptions]);

  const totalAmountCents = (selectedVehicle ? selectedVehicle.dailyRate : 0) * days + extrasTotal;

  const categories = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => v.category && set.add(v.category));
    return ["all", ...Array.from(set)];
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (categoryFilter && categoryFilter !== "all" && v.category !== categoryFilter) return false;
      const min = minPrice ? Math.round(Number(minPrice) * 100) : 0;
      const max = maxPrice ? Math.round(Number(maxPrice) * 100) : Infinity;
      if (typeof v.dailyRate === "number") {
        if (v.dailyRate < min || v.dailyRate > max) return false;
      }
      return true;
    });
  }, [vehicles, categoryFilter, minPrice, maxPrice]);

  const handleCreateBooking = async (values: any) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("customerName", values.customerName);
      formData.append("customerEmail", values.customerEmail);
      formData.append("customerPhone", values.customerPhone);
      formData.append("vehicleId", values.vehicleId);
      formData.append("startDate", values.startDate.toISOString());
      formData.append("endDate", values.endDate.toISOString());
      formData.append("pickupLocation", values.pickupLocation || "");
      formData.append("dropoffLocation", values.dropoffLocation || "");
      formData.append("notes", values.notes || "");
      if (driverLicenseFile) formData.append("driverLicense", driverLicenseFile);
      for (const id of selectedExtras) formData.append("extras", id);
      formData.append("extrasTotal", String(extrasTotal));

      const result = await createBookingAction(formData, locale);
      if (!result.success) {
        toast.error(result.error || t("common.error"));
      } else {
        toast.success(t("booking.created") || t("common.success"));
        setBookingId(result.bookingId);
        setStep(3);
        // redirectUrl available in success case will be used if step goes to 3 and payment uploaded
      }
    } catch (err: any) {
      toast.error(err?.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!bookingId) return toast.error(t("booking.noBookingYet"));
    if (!paymentProofFile) return toast.error(t("booking.noPaymentFile"));
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("bookingId", bookingId);
      fd.append("paymentProof", paymentProofFile);
      const res = await uploadPaymentProofAction(fd);
      if (!res.success) {
        toast.error(res.error || t("common.error"));
      } else {
        toast.success(t("booking.paymentUploaded") || "Uploaded");
        router.push(`/${locale}/book/success/${bookingId}`);
      }
    } catch (err: any) {
      toast.error(err?.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full mx-auto p-6">
      {!licenseActive && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("booking.errors.bookingDisabled")}</AlertDescription>
        </Alert>
      )}

      <h2 className="text-2xl font-bold mb-6">{t("booking.title")}</h2>

      <div className="md:flex md:gap-8">
        <div className="md:flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateBooking)} className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center gap-4 mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`px-3 py-1 rounded ${step === i ? "bg-primary text-white" : "bg-muted"}`}>{i + 1}</div>
                ))}
              </div>

              {/* Step 0: Vehicle selection & filters */}
              {step === 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="md:col-span-1">
                      <Label>{t("filter.category") || "Category"}</Label>
                      <select className="w-full p-2 border rounded" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        {categories.map((c) => (
                          <option key={c} value={c}>{c === "all" ? t("filter.all") || "All" : c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>{t("filter.minPrice") || "Min Price"}</Label>
                      <Input placeholder="0.00" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                    </div>
                    <div>
                      <Label>{t("filter.maxPrice") || "Max Price"}</Label>
                      <Input placeholder="999.99" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredVehicles.map((v) => (
                      <div key={v.id} className={`p-3 border rounded flex items-center justify-between ${form.getValues("vehicleId") === v.id ? "ring-2 ring-primary" : ""}`}>
                        <div>
                          <div className="font-medium">{v.name}</div>
                          <div className="text-sm text-muted-foreground">{v.category ?? ""}</div>
                          <div className="text-sm">${(v.dailyRate / 100).toFixed(2)} / day</div>
                        </div>
                        <div>
                          <Button variant={form.getValues("vehicleId") === v.id ? "secondary" : "default"} onClick={() => form.setValue("vehicleId", v.id)}>
                            {form.getValues("vehicleId") === v.id ? t("booking.selected") || "Selected" : t("booking.select") || "Select"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" onClick={() => setStep(1)} disabled={!form.getValues("vehicleId")}>{t("booking.next")}</Button>
                  </div>
                </>
              )}

              {/* Step 1: Customer info + driver license */}
              {step === 1 && (
                <>
                  <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("booking.customerName")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!licenseActive} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="customerEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("booking.customerEmail")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled={!licenseActive} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="customerPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("booking.customerPhone")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!licenseActive} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("booking.startDate")}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ""} onChange={(e) => field.onChange(new Date(e.target.value))} disabled={!licenseActive} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("booking.endDate")}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ""} onChange={(e) => field.onChange(new Date(e.target.value))} disabled={!licenseActive} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="pickupLocation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("booking.pickupLocation")}</FormLabel>
                      <FormControl>
                        <select {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} className="w-full p-2 border rounded" disabled={!licenseActive}>
                          <option value="">{t("booking.selectLocation") || "Select location"}</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.name}>{loc.name}{loc.address ? ` — ${loc.address}` : ""}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dropoffLocation" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("booking.dropoffLocation")}</FormLabel>
                      <FormControl>
                        <select {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} className="w-full p-2 border rounded" disabled={!licenseActive}>
                          <option value="">{t("booking.selectLocation") || "Select location"}</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.name}>{loc.name}{loc.address ? ` — ${loc.address}` : ""}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <FormLabel>{t("booking.driverLicense")}</FormLabel>
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => setDriverLicenseFile(e.target.files?.[0] ?? null)} className="mt-2" />
                    </div>
                  </div>

                  <div className="flex justify-between gap-2">
                    <Button variant="outline" onClick={() => setStep(0)}>{t("booking.back")}</Button>
                    <Button onClick={async () => {
                      // validate only current step fields before advancing
                      const ok = await form.trigger(["customerName", "customerEmail", "customerPhone", "startDate", "endDate", "pickupLocation", "dropoffLocation"]);
                      if (ok) setStep(2);
                    }}>{t("booking.next")}</Button>
                  </div>
                </>
              )}

              {/* Step 2: Review & extras (submit) */}
              {step === 2 && (
                <>
                  <div className="space-y-4">
                    <div className="font-medium">{selectedVehicle ? selectedVehicle.name : t("booking.noVehicleSelected")}</div>
                    <div className="text-sm text-muted-foreground">{selectedVehicle?.category}</div>
                    <div className="text-sm">{t("booking.days")}: {days}</div>
                    <div className="text-sm">{t("booking.pricePerDay")}: ${(selectedVehicle ? (selectedVehicle.dailyRate / 100).toFixed(2) : "0.00")}</div>
                    <div className="mt-2 text-lg font-semibold">{t("booking.total")}: ${(totalAmountCents / 100).toFixed(2)}</div>

                    <div className="grid grid-cols-1 gap-2">
                      {extrasOptions.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-2">
                          <input type="checkbox" checked={selectedExtras.includes(opt.id)} onChange={() => toggleExtra(opt.id)} />
                          <span>{opt.label} (+${(opt.price / 100).toFixed(2)})</span>
                        </label>
                      ))}
                    </div>

                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("booking.notes")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} disabled={!licenseActive} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}>{t("booking.back")}</Button>
                      <Button type="submit" disabled={isSubmitting || !licenseActive}>{isSubmitting ? t("common.loading") : t("booking.submit")}</Button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Confirmation & payment proof upload */}
              {step === 3 && (
                <>
                  <div className="space-y-4">
                    {bookingId ? (
                      <div className="p-3 border rounded">
                        <div className="font-medium">{t("booking.number")}: {bookingId}</div>
                        <div className="text-sm text-muted-foreground">{t("booking.checkEmail")}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">{t("booking.noBookingYet")}</div>
                    )}

                    <div>
                      <FormLabel>{t("booking.paymentProof")}</FormLabel>
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => setPaymentProofFile(e.target.files?.[0] ?? null)} className="mt-2" />
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(2)}>{t("booking.back")}</Button>
                      <Button onClick={handleUploadPaymentProof} disabled={isSubmitting}>{isSubmitting ? t("common.loading") : t("booking.upload")}</Button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </Form>
        </div>

        {/* Price summary on the right for whole process */}
        <aside className="mt-6 md:mt-0 md:w-80">
          <div className="sticky top-24 p-4 border rounded bg-background">
            <h3 className="text-lg font-semibold mb-2">{t("booking.summary") || "Summary"}</h3>
            <div className="space-y-2">
              {selectedVehicle ? (
                <>
                  <div className="font-medium">{selectedVehicle.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedVehicle.category}</div>
                  <div className="text-sm">{t("booking.days")}: {days}</div>
                  <div className="text-sm">{t("booking.pricePerDay")}: ${(selectedVehicle.dailyRate / 100).toFixed(2)}</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">{t("booking.noVehicleSelected") || "No vehicle selected"}</div>
              )}

              {selectedExtras.length > 0 && (
                <div>
                  <div className="text-sm font-medium mt-2">{t("booking.extras.label") || "Extras"}</div>
                  <ul className="text-sm list-disc ml-4">
                    {selectedExtras.map((id) => {
                      const opt = extrasOptions.find((e) => e.id === id);
                      return <li key={id}>{opt ? `${opt.label} (+$${(opt.price / 100).toFixed(2)})` : id}</li>;
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-4 border-t pt-3">
                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">{t("booking.total")}</div>
                  <div className="font-semibold">${(totalAmountCents / 100).toFixed(2)}</div>
                </div>
                <div className="mt-3">
                  <Button className="w-full" disabled={!selectedVehicle || isSubmitting} onClick={() => setStep((s) => Math.min(3, s + 1))}>
                    {t("booking.continue") || "Continue"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Card>
  );
}
