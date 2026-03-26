"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "./CategoryDialog";
import { archiveCategoryAction } from "@/actions/categories";
import { getBlobProxyUrl } from "@/lib/blob";
import { CompactText } from "@/components/shared/CompactText";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { getCategoryFeatureNames } from "@/lib/vehicle-features";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  seats?: number;
  transmission?: "AUTOMATIC" | "MANUAL";
  features?: Array<{ featureId?: string; feature?: { id?: string; name?: string | null } | null }>;
  dailyRate: number;
  fuelChargePerQuarter?: number;
  sortOrder: number;
  isActive: boolean;
  _count?: { vehicles?: number; bookings?: number };
};

export function CategoriesTable({
  categories,
  availableFeatures,
  locale,
}: {
  categories: Category[];
  availableFeatures: Array<{ id: string; name: string; isActive: boolean }>;
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<Partial<Category> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "dailyRate" | "vehicles" | "bookings" | "status">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key: typeof sortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const sorted = useMemo(() => {
    const rows = [...categories];
    rows.sort((a, b) => {
      const valA =
        sortKey === "name"
          ? a.name.toLowerCase()
          : sortKey === "dailyRate"
            ? a.dailyRate
            : sortKey === "vehicles"
              ? (a._count?.vehicles ?? 0)
              : sortKey === "bookings"
                ? (a._count?.bookings ?? 0)
                : (a.isActive ? 1 : 0);
      const valB =
        sortKey === "name"
          ? b.name.toLowerCase()
          : sortKey === "dailyRate"
            ? b.dailyRate
            : sortKey === "vehicles"
              ? (b._count?.vehicles ?? 0)
              : sortKey === "bookings"
                ? (b._count?.bookings ?? 0)
                : (b.isActive ? 1 : 0);
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [categories, sortKey, sortDir]);

  const pageRows = sorted;

  const handleArchive = async (categoryId: string) => {
    setBusyId(categoryId);
    const result = await archiveCategoryAction(categoryId, locale);
    setBusyId(null);
    setPendingArchiveId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.categories.messages.archiveFailed"));
      return;
    }
    toast.success(t("admin.categories.messages.archived"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <ConfirmActionDialog
        open={Boolean(pendingArchiveId)}
        onOpenChange={(open) => {
          if (!open && !busyId) setPendingArchiveId(null);
        }}
        title={t("admin.categories.confirm.archiveTitle")}
        description={t("admin.categories.confirm.archiveDescription")}
        confirmLabel={t("admin.categories.actions.archive")}
        destructive
        loading={Boolean(busyId)}
        onConfirm={() => pendingArchiveId ? handleArchive(pendingArchiveId) : undefined}
      />
      <Button onClick={() => setSelected({})}>+ {t("admin.categories.add")}</Button>

      <CategoryDialog category={selected as any} availableFeatures={availableFeatures} locale={locale} onClose={() => setSelected(null)} />

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead><button type="button" onClick={() => toggleSort("name")}>{t("admin.categories.name")}{sortIndicator("name")}</button></TableHead>
              <TableHead>{t("admin.categories.table.image")}</TableHead>
              <TableHead>{t("admin.categories.description")}</TableHead>
              <TableHead>{t("admin.categories.table.features")}</TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("dailyRate")}>{t("admin.categories.dailyRate")}{sortIndicator("dailyRate")}</button></TableHead>
              <TableHead>{t("admin.categories.table.fuelCharge")}</TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("vehicles")}>{t("admin.categories.table.vehicles")}{sortIndicator("vehicles")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("bookings")}>{t("admin.categories.table.bookings")}{sortIndicator("bookings")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("status")}>{t("admin.vehicles.table.status")}{sortIndicator("status")}</button></TableHead>
              <TableHead>{t("admin.vehicles.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl.startsWith("/") ? category.imageUrl : getBlobProxyUrl(category.imageUrl) || category.imageUrl}
                      alt={category.name}
                      className="h-10 w-16 rounded border object-cover"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <CompactText text={category.description} expandedTitle={t("admin.categories.table.fullDescription")} />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      {t("admin.categories.table.featuresSummary", {
                        seats: category.seats ?? 5,
                        transmission: category.transmission === "MANUAL" ? t("admin.categories.manual") : t("admin.categories.automatic"),
                        features: "",
                      }).replace(/\s•\s$/, "")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {getCategoryFeatureNames(category).length > 0 ? (
                        getCategoryFeatureNames(category).map((feature) => (
                          <Badge key={feature} variant="secondary" className="rounded-full px-2.5 py-1 text-xs">
                            {feature}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">{t("admin.categories.table.noFeatures")}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>${(category.dailyRate / 100).toFixed(2)}</TableCell>
                <TableCell>{t("admin.categories.table.fuelChargeValue", { amount: ((category.fuelChargePerQuarter ?? 2500) / 100).toFixed(2) })}</TableCell>
                <TableCell>{category._count?.vehicles ?? 0}</TableCell>
                <TableCell>{category._count?.bookings ?? 0}</TableCell>
                <TableCell>
                  <Badge className={category.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                    {category.isActive ? t("admin.categories.status.active") : t("admin.categories.status.archived")}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(category)}>{t("common.edit")}</Button>
                  {category.isActive && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === category.id}
                      onClick={() => setPendingArchiveId(category.id)}
                    >
                      {t("admin.categories.actions.archive")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
