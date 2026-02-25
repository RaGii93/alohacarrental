"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
  const [sortKey, setSortKey] = useState<"email" | "role" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const tOr = (key: string, fallback: string) => (t.has(key as any) ? t(key as any) : fallback);

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
      toast.error(tOr("admin.users.rootProtected", "ROOT user cannot be modified or deleted"));
      return;
    }
    if (!window.confirm(tOr("admin.users.deleteConfirm", "Delete this user?"))) return;
    setBusyId(id);
    const result = await deleteAdminUserAction(id, locale);
    setBusyId(null);
    if (!result.success) {
      if (result.error === "ROOT_PROTECTED") {
        toast.error(tOr("admin.users.rootProtected", "ROOT user cannot be modified or deleted"));
      } else {
        toast.error(result.error || tOr("admin.users.errors.delete", "Failed to delete user"));
      }
      return;
    }
    toast.success(tOr("admin.users.deleted", "User deleted"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelected({})}>+ {tOr("admin.users.add", "Add User")}</Button>
      <UserDialog user={(selected as any) || null} locale={locale} onClose={() => setSelected(null)} />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" onClick={() => toggleSort("email")}>
                  {tOr("admin.users.email", "Email")}
                  {sortIndicator("email")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("role")}>
                  {tOr("admin.users.role", "Role")}
                  {sortIndicator("role")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("createdAt")}>
                  {tOr("admin.users.createdAt", "Created")}
                  {sortIndicator("createdAt")}
                </button>
              </TableHead>
              <TableHead>{tOr("admin.users.actions", "Actions")}</TableHead>
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
                      {tOr("common.edit", "Edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isRoot || busyId === user.id}
                      onClick={() => handleDelete(user.id, user.role)}
                    >
                      {tOr("common.delete", "Delete")}
                    </Button>
                    {isRoot && (
                      <Badge className="bg-slate-100 text-slate-700">
                        {tOr("admin.users.protected", "Protected")}
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
        <div className="py-8 text-center text-sm text-muted-foreground">
          {tOr("admin.users.empty", "No users found")}
        </div>
      )}
    </div>
  );
}
