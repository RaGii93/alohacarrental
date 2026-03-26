"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPinPlus, Pencil, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createLocationAction, updateLocationAction } from "@/actions/locations";

const locationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  code: z.string().max(20, "Location code must be 20 characters or less").optional(),
  address: z.string().max(255, "Address must be 255 characters or less").optional(),
});

type Location = {
  id?: string;
  name?: string;
  code?: string | null;
  address?: string | null;
};

export function LocationDialog({
  location,
  locale,
  onClose,
}: {
  location: Location | null;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const isEdit = !!location?.id;
  const [isOpen, setIsOpen] = useState(!!location);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || "",
      code: location?.code || "",
      address: location?.address || "",
    },
  });

  useEffect(() => {
    setIsOpen(!!location);
    if (location) {
      form.reset({
        name: location.name || "",
        code: location.code || "",
        address: location.address || "",
      });
    }
  }, [location, form]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const result = location?.id
        ? await updateLocationAction(location.id, values, locale)
        : await createLocationAction(values, locale);

      if (!result.success) {
        toast.error(result.error || t("common.error"));
        return;
      }

      toast.success(
        location?.id
          ? t("admin.locations.updated")
          : t("admin.locations.created")
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
            {isEdit ? <Pencil className="mr-2 inline h-5 w-5" /> : <MapPinPlus className="mr-2 inline h-5 w-5" />}
            {isEdit
              ? t("admin.locations.edit")
              : t("admin.locations.add")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.locations.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.locations.code")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("admin.locations.address")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                {isSubmitting ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
