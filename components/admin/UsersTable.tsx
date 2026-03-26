"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteAdminUserAction } from "@/actions/users";
import { formatDateTime } from "@/lib/datetime";
import { UserDialog } from "@/components/admin/UserDialog";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";

type AdminUserRow = {
  id: string;
  email: string;
  role: "ROOT" | "OWNER" | "STAFF";
  createdAt: Date;
};

export function UsersTable({
  users,
  locale,
}: {
  users: AdminUserRow[];
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<AdminUserRow | Record<string, never> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; role: string } | null>(null);
  const [sortKey, setSortKey] = useState<"email" | "role" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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
    const rows = [...users];
    rows.sort((a, b) => {
      const valA =
        sortKey === "email"
          ? a.email.toLowerCase()
          : sortKey === "role"
            ? a.role
            : new Date(a.createdAt).getTime();
      const valB =
        sortKey === "email"
          ? b.email.toLowerCase()
          : sortKey === "role"
            ? b.role
            : new Date(b.createdAt).getTime();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [users, sortKey, sortDir]);

  const handleDelete = async (id: string, role: string) => {
    if (role === "ROOT") {
      toast.error(t("admin.users.rootProtected"));
      return;
    }
    setBusyId(id);
    const result = await deleteAdminUserAction(id, locale);
    setBusyId(null);
    setPendingDelete(null);
    if (!result.success) {
      if (result.error === "ROOT_PROTECTED") {
        toast.error(t("admin.users.rootProtected"));
      } else {
        toast.error(result.error || t("admin.users.errors.delete"));
      }
      return;
    }
    toast.success(t("admin.users.deleted"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <ConfirmActionDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !busyId) setPendingDelete(null);
        }}
        title={t("admin.users.deleteTitle")}
        description={t("admin.users.deleteConfirm")}
        confirmLabel={t("common.delete")}
        destructive
        loading={Boolean(busyId)}
        onConfirm={() => pendingDelete ? handleDelete(pendingDelete.id, pendingDelete.role) : undefined}
      />
      <Button onClick={() => setSelected({})}>
        <UserPlus className="h-4 w-4" />
        {t("admin.users.add")}
      </Button>
      <UserDialog user={(selected as any) || null} locale={locale} onClose={() => setSelected(null)} />

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" onClick={() => toggleSort("email")}>
                  {t("admin.users.email")}
                  {sortIndicator("email")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("role")}>
                  {t("admin.users.role")}
                  {sortIndicator("role")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("createdAt")}>
                  {t("admin.users.createdAt")}
                  {sortIndicator("createdAt")}
                </button>
              </TableHead>
              <TableHead>{t("admin.users.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((user) => {
              const isRoot = user.role === "ROOT";
              const roleBadgeClass =
                user.role === "ROOT"
                  ? "bg-slate-900 text-white"
                  : user.role === "OWNER"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-emerald-100 text-emerald-800";
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={roleBadgeClass}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRoot}
                      onClick={() => {
                        if (isRoot) return;
                        setSelected(user);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isRoot || busyId === user.id}
                      onClick={() => setPendingDelete({ id: user.id, role: user.role })}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                    {isRoot && (
                      <Badge className="bg-slate-100 text-slate-700">
                        {t("admin.users.protected")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-[1.3rem] border border-dashed border-[hsl(var(--border))] bg-white/85 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t("admin.users.empty")}
        </div>
      )}
    </div>
  );
}
