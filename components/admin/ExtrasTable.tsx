"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { archiveExtraAction } from "@/actions/extras";
import { ExtraDialog } from "./ExtraDialog";

export function ExtrasTable({ extras, locale }: { extras: any[]; locale: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "pricingType" | "amount" | "status">("name");
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
    const rows = [...extras];
    rows.sort((a, b) => {
      const valA =
        sortKey === "name"
          ? String(a.name || "").toLowerCase()
          : sortKey === "pricingType"
            ? String(a.pricingType || "")
            : sortKey === "amount"
              ? Number(a.amount || 0)
              : (a.isActive ? 1 : 0);
      const valB =
        sortKey === "name"
          ? String(b.name || "").toLowerCase()
          : sortKey === "pricingType"
            ? String(b.pricingType || "")
            : sortKey === "amount"
              ? Number(b.amount || 0)
              : (b.isActive ? 1 : 0);
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [extras, sortKey, sortDir]);

  const pageRows = sorted;

  const handleArchive = async (id: string) => {
    setBusyId(id);
    const result = await archiveExtraAction(id, locale);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.extras.messages.archiveFailed"));
      return;
    }
    toast.success(t("admin.extras.messages.archived"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelected({})}>+ {t("admin.extras.add")}</Button>
      <ExtraDialog extra={selected} locale={locale} onClose={() => setSelected(null)} />
      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead><button type="button" onClick={() => toggleSort("name")}>{t("admin.extras.name")}{sortIndicator("name")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("pricingType")}>{t("admin.extras.table.type")}{sortIndicator("pricingType")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("amount")}>{t("admin.extras.amount")}{sortIndicator("amount")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("status")}>{t("admin.vehicles.table.status")}{sortIndicator("status")}</button></TableHead>
              <TableHead>{t("admin.vehicles.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((ex) => (
              <TableRow key={ex.id}>
                <TableCell>{ex.name}</TableCell>
                <TableCell>{ex.pricingType === "DAILY" ? t("admin.extras.dailyRate") : t("admin.extras.flatRate")}</TableCell>
                <TableCell>${(ex.amount / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={ex.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                    {ex.isActive ? t("admin.extras.status.active") : t("admin.extras.status.archived")}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(ex)}>{t("common.edit")}</Button>
                  {ex.isActive && (
                    <Button size="sm" variant="destructive" disabled={busyId === ex.id} onClick={() => handleArchive(ex.id)}>{t("admin.extras.actions.archive")}</Button>
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
