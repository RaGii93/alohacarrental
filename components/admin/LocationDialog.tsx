"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  const tOr = (key: string, fallback: string) => (t.has(key as any) ? t(key as any) : fallback);

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
        toast.error(result.error || tOr("common.error", "Error"));
        return;
      }

      toast.success(
        location?.id
          ? tOr("admin.locations.updated", "Location updated")
          : tOr("admin.locations.created", "Location created")
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
              ? tOr("admin.locations.edit", "Edit Location")
              : tOr("admin.locations.add", "Add Location")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tOr("admin.locations.name", "Name")}</FormLabel>
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
                  <FormLabel>{tOr("admin.locations.code", "Code")}</FormLabel>
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
                  <FormLabel>{tOr("admin.locations.address", "Address")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
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
