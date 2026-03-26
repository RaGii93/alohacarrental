"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deactivateDiscountCodeAction } from "@/actions/discounts";
import { DiscountCodeDialog } from "./DiscountCodeDialog";
import { formatDate } from "@/lib/datetime";

export function DiscountCodesTable({ discountCodes, locale }: { discountCodes: any[]; locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"code" | "percentage" | "uses" | "expiresAt" | "status">("code");
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
    const rows = [...discountCodes];
    rows.sort((a, b) => {
      const valA =
        sortKey === "code"
          ? String(a.code || "").toLowerCase()
          : sortKey === "percentage"
            ? Number(a.percentage || 0)
            : sortKey === "uses"
              ? Number(a.usedCount || 0)
              : sortKey === "expiresAt"
                ? (a.expiresAt ? new Date(a.expiresAt).getTime() : 0)
                : (a.isActive ? 1 : 0);
      const valB =
        sortKey === "code"
          ? String(b.code || "").toLowerCase()
          : sortKey === "percentage"
            ? Number(b.percentage || 0)
            : sortKey === "uses"
              ? Number(b.usedCount || 0)
              : sortKey === "expiresAt"
                ? (b.expiresAt ? new Date(b.expiresAt).getTime() : 0)
                : (b.isActive ? 1 : 0);
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [discountCodes, sortKey, sortDir]);

  const pageRows = sorted;

  const handleDeactivate = async (id: string) => {
    setBusyId(id);
    const result = await deactivateDiscountCodeAction(id, locale);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.discounts.messages.deactivateFailed"));
      return;
    }
    toast.success(t("admin.discounts.messages.deactivated"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelected({})}>+ {t("admin.discounts.add")}</Button>
      <DiscountCodeDialog discount={selected} locale={locale} onClose={() => setSelected(null)} />
      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead><button type="button" onClick={() => toggleSort("code")}>{t("admin.discounts.code")}{sortIndicator("code")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("percentage")}>{t("admin.discounts.percentage")}{sortIndicator("percentage")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("uses")}>{t("admin.discounts.table.uses")}{sortIndicator("uses")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("expiresAt")}>{t("admin.discounts.table.expires")}{sortIndicator("expiresAt")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("status")}>{t("admin.vehicles.table.status")}{sortIndicator("status")}</button></TableHead>
              <TableHead>{t("admin.vehicles.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.code}</TableCell>
                <TableCell>{d.percentage}%</TableCell>
                <TableCell>{d.usedCount}{d.maxUses ? `/${d.maxUses}` : ""}</TableCell>
                <TableCell>{d.expiresAt ? formatDate(d.expiresAt) : "-"}</TableCell>
                <TableCell>
                  <Badge className={d.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                    {d.isActive ? t("admin.discounts.status.active") : t("admin.discounts.status.inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(d)}>{t("common.edit")}</Button>
                  {d.isActive && (
                    <Button size="sm" variant="destructive" disabled={busyId === d.id} onClick={() => handleDeactivate(d.id)}>{t("admin.discounts.actions.deactivate")}</Button>
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
