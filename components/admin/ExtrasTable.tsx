"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { archiveExtraAction } from "@/actions/extras";
import { ExtraDialog } from "./ExtraDialog";

export function ExtrasTable({ extras, locale }: { extras: any[]; locale: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {extras.map((ex) => (
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
