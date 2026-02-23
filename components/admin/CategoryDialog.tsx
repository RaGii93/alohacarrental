"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoryFormSchema } from "@/lib/validators";
import { createCategoryAction, updateCategoryAction, uploadCategoryImageAction } from "@/actions/categories";
import { getBlobProxyUrl } from "@/lib/blob";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type Category = {
  id?: string;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  seats?: number;
  transmission?: "AUTOMATIC" | "MANUAL";
  hasAC?: boolean;
  dailyRate?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export function CategoryDialog({
  category,
  locale,
  onClose,
}: {
  category: Category | null;
  locale: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!!category);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      imageUrl: category?.imageUrl || "",
      seats: category?.seats ?? 5,
      transmission: category?.transmission || "AUTOMATIC",
      hasAC: category?.hasAC ?? true,
      dailyRate: category?.dailyRate ? category.dailyRate / 100 : 0,
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  });

  useEffect(() => {
    setIsOpen(!!category);
    if (category) {
      form.reset({
        name: category.name || "",
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        seats: category.seats ?? 5,
        transmission: category.transmission || "AUTOMATIC",
        hasAC: category.hasAC ?? true,
        dailyRate: category.dailyRate ? category.dailyRate / 100 : 0,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive ?? true,
      });
    }
  }, [category, form]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const result = category?.id
        ? await updateCategoryAction(category.id, values, locale)
        : await createCategoryAction(values, locale);

      if (!result.success) {
        toast.error(result.error || "Failed to save category");
      } else {
        toast.success(category?.id ? "Category updated" : "Category created");
        setIsOpen(false);
        onClose();
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category?.id ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Image</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Image URL" />
                  </FormControl>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingImage(true);
                        const fd = new FormData();
                        fd.append("image", file);
                        const uploaded = await uploadCategoryImageAction(fd);
                        setIsUploadingImage(false);
                        if (!uploaded.success || !uploaded.imageUrl) {
                          toast.error(uploaded.error || "Image upload failed");
                          return;
                        }
                        form.setValue("imageUrl", uploaded.imageUrl, { shouldDirty: true });
                        toast.success("Image uploaded");
                      }}
                    />
                  </div>
                  {field.value ? (
                    <img
                      src={field.value.startsWith("/") ? field.value : getBlobProxyUrl(field.value) || field.value}
                      alt="Category preview"
                      className="mt-3 h-24 w-40 rounded-md border object-cover"
                    />
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dailyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value || "0"))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value || "0", 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seats</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={12}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value || "5", 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission</FormLabel>
                    <FormControl>
                      <select
                        className="h-10 w-full rounded-md border px-3 text-sm"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value as "AUTOMATIC" | "MANUAL")}
                      >
                        <option value="AUTOMATIC">Automatic</option>
                        <option value="MANUAL">Manual</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hasAC"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 pt-8">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                    </FormControl>
                    <FormLabel>A/C available</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                  </FormControl>
                  <FormLabel>Active</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isUploadingImage}>
                {isSubmitting ? "Saving..." : isUploadingImage ? "Uploading..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
