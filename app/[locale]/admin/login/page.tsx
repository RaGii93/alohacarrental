"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
import { Lock, LogIn, Mail, ShieldCheck, Sparkles } from "lucide-react";

export default function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locale, setLocale] = useState("");
  const t = useTranslations();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    params.then(({ locale }) => {
      if (active) {
        setLocale(locale);
      }
    });

    return () => {
      active = false;
    };
  }, [params]);

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
    <div className="relative min-h-[calc(100vh-100px)] overflow-hidden bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_42%),linear-gradient(180deg,_#f7fbff,_#eef5ff_55%,_#ffffff)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--primary)/0.06),transparent_35%,hsl(var(--accent)/0.35))]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_minmax(0,480px)] lg:items-center">
        <div className="hidden overflow-hidden rounded-[2rem] border border-[hsl(var(--primary)/0.12)] bg-[linear-gradient(180deg,hsl(var(--primary)/0.1),rgba(255,255,255,0.95)_38%,rgba(255,255,255,0.98))] p-10 shadow-[0_32px_90px_-48px_hsl(var(--foreground)/0.25)] lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.14)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
            <ShieldCheck className="size-4" />
            Admin Access
          </div>
          <div className="mt-8">
            <Image
              src="/logo.png"
              alt="edgeRent Lite"
              width={320}
              height={88}
              priority
              className="h-16 w-auto"
            />
          </div>
          <h1 className="mt-8 max-w-xl text-5xl font-black tracking-[-0.05em] text-[hsl(var(--foreground))]">
            Secure control panel with the same polished project branding
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[hsl(var(--foreground)/0.72)]">
            Manage reservations, pricing, vehicles, locations, reviews, and support operations from one clean admin workspace.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-[hsl(var(--primary)/0.12)] bg-white/90 p-5">
              <Sparkles className="size-5 text-[hsl(var(--primary))]" />
              <h2 className="mt-4 text-lg font-bold text-[hsl(var(--foreground))]">Modern UI</h2>
              <p className="mt-2 text-sm leading-7 text-[hsl(var(--foreground)/0.68)]">
                Matching light surfaces, stronger contrast, and consistent token-driven components.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[hsl(var(--primary)/0.12)] bg-white/90 p-5">
              <ShieldCheck className="size-5 text-[hsl(var(--primary))]" />
              <h2 className="mt-4 text-lg font-bold text-[hsl(var(--foreground))]">Protected Access</h2>
              <p className="mt-2 text-sm leading-7 text-[hsl(var(--foreground)/0.68)]">
                Role-based admin login for operations, billing, fleet control, and customer support.
              </p>
            </div>
          </div>
        </div>

        <Card className="w-full rounded-[2rem] border-[hsl(var(--primary)/0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.96))] p-8 shadow-[0_32px_90px_-48px_hsl(var(--foreground)/0.28)] sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo.png"
              alt="edgeRent Lite"
              width={260}
              height={72}
              priority
              className="h-14 w-auto"
            />
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/0.12)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--primary))]">
              <ShieldCheck className="size-4" />
              Admin portal
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[hsl(var(--foreground))]">
              {t("admin.login.title")}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-[hsl(var(--foreground)/0.72)]">
              Sign in to manage bookings, fleet availability, pricing, invoices, and day-to-day rental operations.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8 space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                      <Mail className="h-4 w-4 text-[hsl(var(--primary))]" />
                      {t("admin.login.email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("admin.login.email")}
                        {...field}
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl border-[hsl(var(--border))] px-4"
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
                    <FormLabel className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                      <Lock className="h-4 w-4 text-[hsl(var(--primary))]" />
                      {t("admin.login.password")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("admin.login.password")}
                        {...field}
                        disabled={isSubmitting}
                        className="h-12 rounded-2xl border-[hsl(var(--border))] px-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl text-sm font-bold shadow-[0_16px_36px_-20px_hsl(var(--primary)/0.65)]"
              >
                <LogIn className="h-4 w-4" />
                {isSubmitting ? t("common.loading") : t("admin.login.submit")}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
