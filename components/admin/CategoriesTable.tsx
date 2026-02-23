"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "./CategoryDialog";
import { archiveCategoryAction } from "@/actions/categories";
import { TablePaginationControls } from "@/components/admin/TablePaginationControls";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  dailyRate: number;
  sortOrder: number;
  isActive: boolean;
  _count?: { vehicles?: number; bookings?: number };
};

export function CategoriesTable({
  categories,
  locale,
}: {
  categories: Category[];
  locale: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Partial<Category> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleArchive = async (categoryId: string) => {
    if (!window.confirm("Archive this category?")) return;
    setBusyId(categoryId);
    const result = await archiveCategoryAction(categoryId, locale);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error || "Failed to archive category");
      return;
    }
    toast.success("Category archived");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelected({})}>+ Add Category</Button>

      <CategoryDialog category={selected as any} locale={locale} onClose={() => setSelected(null)} />

      <div className="overflow-x-auto">
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
              <TableHead>Description</TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("dailyRate")}>Daily Rate{sortIndicator("dailyRate")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("vehicles")}>Vehicles{sortIndicator("vehicles")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("bookings")}>Bookings{sortIndicator("bookings")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("status")}>Status{sortIndicator("status")}</button></TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description || "-"}</TableCell>
                <TableCell>${(category.dailyRate / 100).toFixed(2)}</TableCell>
                <TableCell>{category._count?.vehicles ?? 0}</TableCell>
                <TableCell>{category._count?.bookings ?? 0}</TableCell>
                <TableCell>
                  <Badge className={category.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                    {category.isActive ? "ACTIVE" : "ARCHIVED"}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(category)}>Edit</Button>
                  {category.isActive && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === category.id}
                      onClick={() => handleArchive(category.id)}
                    >
                      Archive
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
