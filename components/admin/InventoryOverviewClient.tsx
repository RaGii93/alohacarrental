"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Boxes, CircleDollarSign, PackagePlus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { createInventoryPartAction, createInventoryTransactionAction } from "@/actions/fleet-operations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/datetime";
import { formatCurrency } from "@/lib/pricing";

type PartRow = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  brand: string | null;
  unit: string | null;
  quantityInStock: number;
  reorderThreshold: number | null;
  averageUnitCost: number | null;
  defaultSupplierName: string | null;
  isTireRelated: boolean;
};

type TransactionRow = {
  id: string;
  type: "PURCHASE" | "USAGE" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  transactionDate: string;
  notes: string | null;
  inventoryPartName: string;
};

type Summary = {
  activeParts: number;
  lowStockParts: number;
  stockUnits: number;
  stockValue: number;
};

export function InventoryOverviewClient({
  locale,
  summary,
  parts,
  transactions,
}: {
  locale: string;
  summary: Summary;
  parts: PartRow[];
  transactions: TransactionRow[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [partDialogOpen, setPartDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [quantityInStock, setQuantityInStock] = useState("");
  const [reorderThreshold, setReorderThreshold] = useState("");
  const [averageUnitCost, setAverageUnitCost] = useState("");
  const [defaultSupplierName, setDefaultSupplierName] = useState("");
  const [isTireRelated, setIsTireRelated] = useState(false);
  const [tireBrandModel, setTireBrandModel] = useState("");

  const [transactionPartId, setTransactionPartId] = useState(parts[0]?.id ?? "");
  const [transactionType, setTransactionType] = useState<"PURCHASE" | "USAGE" | "ADJUSTMENT" | "RETURN">("PURCHASE");
  const [transactionQuantity, setTransactionQuantity] = useState("");
  const [transactionUnitCost, setTransactionUnitCost] = useState("");
  const [transactionNotes, setTransactionNotes] = useState("");

  const submitPart = () => {
    startTransition(async () => {
      const result = await createInventoryPartAction({
        name,
        sku,
        category,
        brand,
        unit,
        quantityInStock: quantityInStock ? Number(quantityInStock) : undefined,
        reorderThreshold: reorderThreshold ? Number(reorderThreshold) : undefined,
        averageUnitCost: averageUnitCost ? Number(averageUnitCost) : undefined,
        defaultSupplierName,
        isTireRelated,
        tireBrandModel,
      }, locale);

      if (!result.success) {
        toast.error(result.error || t("admin.inventory.messages.createPartFailed"));
        return;
      }

      toast.success(t("admin.inventory.messages.partCreated"));
      setPartDialogOpen(false);
      router.refresh();
    });
  };

  const submitTransaction = () => {
    startTransition(async () => {
      const result = await createInventoryTransactionAction({
        inventoryPartId: transactionPartId,
        type: transactionType,
        quantity: Number(transactionQuantity || 0),
        unitCost: transactionUnitCost ? Number(transactionUnitCost) : undefined,
        notes: transactionNotes,
      }, locale);

      if (!result.success) {
        toast.error(result.error || t("admin.inventory.messages.saveTransactionFailed"));
        return;
      }

      toast.success(t("admin.inventory.messages.transactionSaved"));
      setTransactionDialogOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {[
          { label: t("admin.inventory.cards.activeParts"), value: summary.activeParts, icon: Boxes, tone: "text-sky-600 bg-sky-50" },
          { label: t("admin.inventory.cards.lowStock"), value: summary.lowStockParts, icon: TriangleAlert, tone: "text-amber-600 bg-amber-50" },
          { label: t("admin.inventory.cards.unitsOnHand"), value: summary.stockUnits, icon: PackagePlus, tone: "text-emerald-600 bg-emerald-50" },
          { label: t("admin.inventory.cards.stockValue"), value: formatCurrency(summary.stockValue), icon: CircleDollarSign, tone: "text-violet-600 bg-violet-50" },
        ].map((item) => (
          <Card key={item.label} className="admin-surface-soft rounded-[1.6rem] border-transparent p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{item.value}</p>
              </div>
              <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.tone}`}>
                <item.icon className="size-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="admin-surface rounded-[1.8rem] border-transparent p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">{t("admin.inventory.workspace.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              {t("admin.inventory.workspace.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={partDialogOpen} onOpenChange={setPartDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl">{t("admin.inventory.actions.newPart")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t("admin.inventory.dialogs.part.title")}</DialogTitle>
                  <DialogDescription>{t("admin.inventory.dialogs.part.description")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.inventory.form.partName")} />
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder={t("admin.inventory.form.sku")} />
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("admin.inventory.form.category")} />
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t("admin.inventory.form.brand")} />
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={t("admin.inventory.form.unit")} />
                  <Input value={defaultSupplierName} onChange={(e) => setDefaultSupplierName(e.target.value)} placeholder={t("admin.inventory.form.defaultSupplier")} />
                  <Input type="number" min={0} step="0.01" value={quantityInStock} onChange={(e) => setQuantityInStock(e.target.value)} placeholder={t("admin.inventory.form.openingStock")} />
                  <Input type="number" min={0} step="0.01" value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} placeholder={t("admin.inventory.form.reorderThreshold")} />
                  <Input type="number" min={0} step="0.01" value={averageUnitCost} onChange={(e) => setAverageUnitCost(e.target.value)} placeholder={t("admin.inventory.form.averageUnitCost")} />
                  <Input value={tireBrandModel} onChange={(e) => setTireBrandModel(e.target.value)} placeholder={t("admin.inventory.form.tireBrandModel")} />
                </div>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input type="checkbox" checked={isTireRelated} onChange={(e) => setIsTireRelated(e.target.checked)} className="mt-1" />
                  <span>{t("admin.inventory.form.tireRelatedHint")}</span>
                </label>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPartDialogOpen(false)}>{t("common.cancel")}</Button>
                  <Button type="button" onClick={submitPart} disabled={isPending}>{t("admin.inventory.actions.createPart")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="admin-outline-button rounded-xl border-transparent">{t("admin.inventory.actions.addStockMovement")}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>{t("admin.inventory.dialogs.transaction.title")}</DialogTitle>
                  <DialogDescription>{t("admin.inventory.dialogs.transaction.description")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <Select value={transactionPartId} onValueChange={setTransactionPartId}>
                    <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder={t("admin.inventory.form.inventoryPart")} /></SelectTrigger>
                    <SelectContent>{parts.map((part) => <SelectItem key={part.id} value={part.id}>{part.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                    <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PURCHASE">{t("admin.inventory.transactionTypes.purchase")}</SelectItem>
                      <SelectItem value="RETURN">{t("admin.inventory.transactionTypes.return")}</SelectItem>
                      <SelectItem value="ADJUSTMENT">{t("admin.inventory.transactionTypes.adjustment")}</SelectItem>
                      <SelectItem value="USAGE">{t("admin.inventory.transactionTypes.usage")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} step="0.01" value={transactionQuantity} onChange={(e) => setTransactionQuantity(e.target.value)} placeholder={t("admin.inventory.form.quantity")} />
                  <Input type="number" min={0} step="0.01" value={transactionUnitCost} onChange={(e) => setTransactionUnitCost(e.target.value)} placeholder={t("admin.inventory.form.unitCost")} />
                  <Textarea value={transactionNotes} onChange={(e) => setTransactionNotes(e.target.value)} placeholder={t("admin.inventory.form.transactionNotes")} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setTransactionDialogOpen(false)}>{t("common.cancel")}</Button>
                  <Button type="button" onClick={submitTransaction} disabled={isPending}>{t("admin.inventory.actions.saveMovement")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <Card className="admin-surface rounded-[1.8rem] border-transparent p-6">
          <h3 className="text-lg font-bold text-slate-900">{t("admin.inventory.tables.partsCatalog")}</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-3 font-medium">{t("admin.inventory.table.part")}</th>
                  <th className="pb-3 font-medium">{t("admin.inventory.table.stock")}</th>
                  <th className="pb-3 font-medium">{t("admin.inventory.table.threshold")}</th>
                  <th className="pb-3 font-medium">{t("admin.inventory.table.avgCost")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td className="py-3">
                      <div className="font-medium text-slate-900">{part.name}</div>
                      <div className="text-xs text-slate-500">{part.category || t("admin.inventory.table.uncategorized")} {part.isTireRelated ? `· ${t("admin.inventory.table.tireRelated")}` : ""}</div>
                    </td>
                    <td className="py-3 text-slate-600">{part.quantityInStock} {part.unit || ""}</td>
                    <td className="py-3 text-slate-600">{part.reorderThreshold ?? "-"}</td>
                    <td className="py-3 font-semibold text-slate-900">{part.averageUnitCost ? formatCurrency(part.averageUnitCost) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900">{t("admin.inventory.tables.recentStockMovements")}</h3>
          <div className="mt-4 space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{transaction.inventoryPartName}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {t(`admin.inventory.transactionTypes.${transaction.type.toLowerCase()}` as any)} · {formatDate(transaction.transactionDate)} · {t("admin.inventory.table.qty")} {transaction.quantity}
                    </p>
                    {transaction.notes ? <p className="mt-2 text-sm text-slate-600">{transaction.notes}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{transaction.totalCost ? formatCurrency(transaction.totalCost) : "-"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
