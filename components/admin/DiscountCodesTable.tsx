"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deactivateDiscountCodeAction } from "@/actions/discounts";
import { DiscountCodeDialog } from "./DiscountCodeDialog";
import { formatDate } from "@/lib/datetime";

export function DiscountCodesTable({ discountCodes, locale }: { discountCodes: any[]; locale: string }) {
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
      toast.error(result.error || "Failed to deactivate code");
      return;
    }
    toast.success("Discount deactivated");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelected({})}>+ Add Discount Code</Button>
      <DiscountCodeDialog discount={selected} locale={locale} onClose={() => setSelected(null)} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><button type="button" onClick={() => toggleSort("code")}>Code{sortIndicator("code")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("percentage")}>%{sortIndicator("percentage")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("uses")}>Uses{sortIndicator("uses")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("expiresAt")}>Expires{sortIndicator("expiresAt")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("status")}>Status{sortIndicator("status")}</button></TableHead>
            <TableHead>Actions</TableHead>
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
                  {d.isActive ? "ACTIVE" : "INACTIVE"}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(d)}>Edit</Button>
                {d.isActive && (
                  <Button size="sm" variant="destructive" disabled={busyId === d.id} onClick={() => handleDeactivate(d.id)}>Deactivate</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
