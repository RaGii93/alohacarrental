"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { archiveExtraAction } from "@/actions/extras";
import { ExtraDialog } from "./ExtraDialog";
import { TablePaginationControls } from "@/components/admin/TablePaginationControls";

export function ExtrasTable({ extras, locale }: { extras: any[]; locale: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleArchive = async (id: string) => {
    setBusyId(id);
    const result = await archiveExtraAction(id, locale);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error || "Failed to archive");
      return;
    }
    toast.success("Extra archived");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelected({})}>+ Add Extra</Button>
      <ExtraDialog extra={selected} locale={locale} onClose={() => setSelected(null)} />
      <TablePaginationControls
        page={currentPage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><button type="button" onClick={() => toggleSort("name")}>Name{sortIndicator("name")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("pricingType")}>Type{sortIndicator("pricingType")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("amount")}>Amount{sortIndicator("amount")}</button></TableHead>
            <TableHead><button type="button" onClick={() => toggleSort("status")}>Status{sortIndicator("status")}</button></TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((ex) => (
            <TableRow key={ex.id}>
              <TableCell>{ex.name}</TableCell>
              <TableCell>{ex.pricingType}</TableCell>
              <TableCell>${(ex.amount / 100).toFixed(2)}</TableCell>
              <TableCell>
                <Badge className={ex.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                  {ex.isActive ? "ACTIVE" : "ARCHIVED"}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(ex)}>Edit</Button>
                {ex.isActive && (
                  <Button size="sm" variant="destructive" disabled={busyId === ex.id} onClick={() => handleArchive(ex.id)}>Archive</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
