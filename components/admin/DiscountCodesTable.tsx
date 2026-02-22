"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deactivateDiscountCodeAction } from "@/actions/discounts";
import { DiscountCodeDialog } from "./DiscountCodeDialog";

export function DiscountCodesTable({ discountCodes, locale }: { discountCodes: any[]; locale: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
            <TableHead>Code</TableHead>
            <TableHead>%</TableHead>
            <TableHead>Uses</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discountCodes.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.code}</TableCell>
              <TableCell>{d.percentage}%</TableCell>
              <TableCell>{d.usedCount}{d.maxUses ? `/${d.maxUses}` : ""}</TableCell>
              <TableCell>{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "-"}</TableCell>
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
