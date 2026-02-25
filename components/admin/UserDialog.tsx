"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAdminUserAction, updateAdminUserAction } from "@/actions/users";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "STAFF"]),
  password: z.string().optional(),
});

type User = {
  id?: string;
  email?: string;
  role?: "ROOT" | "OWNER" | "STAFF";
};

export function UserDialog({
  user,
  locale,
  onClose,
}: {
  user: User | null;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const isEdit = !!user?.id;
  const [isOpen, setIsOpen] = useState(!!user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tOr = (key: string, fallback: string) => (t.has(key as any) ? t(key as any) : fallback);

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || "",
      role: (user?.role === "OWNER" || user?.role === "STAFF" ? user.role : "STAFF") as "OWNER" | "STAFF",
      password: "",
    },
  });

  useEffect(() => {
    setIsOpen(!!user);
    if (user) {
      form.reset({
        email: user.email || "",
        role: (user.role === "OWNER" || user.role === "STAFF" ? user.role : "STAFF") as "OWNER" | "STAFF",
        password: "",
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (!isEdit && (!values.password || String(values.password).trim().length < 8)) {
        toast.error(tOr("admin.users.password", "Password") + ": minimum 8 characters");
        return;
      }
      const result = user?.id
        ? await updateAdminUserAction(user.id, values, locale)
        : await createAdminUserAction(values, locale);

      if (!result.success) {
        if (result.error === "ROOT_PROTECTED") {
          toast.error(tOr("admin.users.rootProtected", "ROOT user cannot be modified or deleted"));
        } else {
          toast.error(result.error || tOr("common.error", "Error"));
        }
        return;
      }

      toast.success(
        user?.id
          ? tOr("admin.users.updated", "User updated")
          : tOr("admin.users.created", "User created")
      );
      setIsOpen(false);
      onClose();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? tOr("admin.users.edit", "Edit User")
              : tOr("admin.users.add", "Add User")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOr("admin.users.email", "Email")}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOr("admin.users.role", "Role")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OWNER">OWNER</SelectItem>
                      <SelectItem value="STAFF">STAFF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEdit
                      ? tOr("admin.users.passwordOptional", "Password (optional)")
                      : tOr("admin.users.password", "Password")}
                  </FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {tOr("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tOr("common.loading", "Loading...") : tOr("common.save", "Save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
