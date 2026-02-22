"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "./CategoryDialog";
import { archiveCategoryAction } from "@/actions/categories";

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
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
