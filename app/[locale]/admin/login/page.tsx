"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginFormSchema } from "@/lib/validators";
import { loginAction } from "@/actions/auth";
import { Lock, LogIn, Mail } from "lucide-react";

export default function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locale, setLocale] = useState("");
  const t = useTranslations();
  const router = useRouter();

  // Get locale from params
  if (!locale) {
    params.then(({ locale }) => setLocale(locale));
  }

  const form = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);

    try {
      const result = await loginAction(values.email, values.password, locale);

      if (!result.success) {
        toast.error(result.error || t("common.error"));
      } else {
        toast.success(t("common.success"));
        router.push(`/${locale}/admin`);
      }
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          {t("admin.login.title")}
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t("admin.login.email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("admin.login.email")}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t("admin.login.password")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("admin.login.password")}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? t("common.loading") : t("admin.login.submit")}
            </Button>
          </form>
        </Form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Demo: <strong>root</strong> / <strong>3dGe123$</strong>
        </p>
      </Card>
    </div>
  );
}
