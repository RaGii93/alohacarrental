"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

  useEffect(() => {
    let active = true;

    params.then(({ locale }) => {
      if (active) setLocale(locale);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfaf6] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,191,0,0.18),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(7,26,54,0.08),transparent_26%),linear-gradient(135deg,rgba(247,191,0,0.08)_0%,transparent_28%,rgba(7,26,54,0.04)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(7,26,54,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(7,26,54,0.04)_1px,transparent_1px)] [background-size:52px_52px]" />

      <Card className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/86 p-0 shadow-[0_40px_110px_-52px_rgba(7,26,54,0.5)] backdrop-blur-xl">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden min-h-[640px] overflow-hidden bg-[linear-gradient(145deg,#071a36_0%,#123965_42%,#1f588f_72%,#f7bf00_100%)] p-10 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,191,0,0.26),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_28%)]" />
            <div className="absolute -left-14 top-24 h-40 w-40 rounded-full border border-white/12 bg-white/8 blur-3xl" />
            <div className="absolute bottom-10 right-8 h-56 w-56 rounded-full bg-[#f7bf00]/20 blur-3xl" />

            <div className="relative space-y-10">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/14 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur">
                  <Image
                    src="/home/logo.png"
                    alt="Aloha Car Rental"
                    width={84}
                    height={84}
                    className="h-20 w-20 object-contain"
                    priority
                  />
                </div>
                <div>
                  <p className="text-2xl font-black uppercase tracking-[0.24em]">Aloha</p>
                  <p className="mt-1 text-sm uppercase tracking-[0.34em] text-white/68">Car Rental</p>
                </div>
              </div>

              <div className="max-w-lg space-y-5">
                <div className="inline-flex rounded-full border border-white/16 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white/78 backdrop-blur">
                  Operations Console
                </div>
                <h1 className="max-w-md text-5xl font-black leading-[1.02] tracking-tight">
                  Admin access for your daily workflow.
                </h1>
                <p className="max-w-md text-base leading-7 text-white/74">
                  Review bookings, manage vehicle availability, update pricing, and keep the rental operation
                  synchronized from one place.
                </p>
              </div>

              <div className="grid max-w-md grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-2xl font-black">24/7</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/62">Access</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-2xl font-black">Fleet</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/62">Control</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-2xl font-black">Live</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/62">Bookings</p>
                </div>
              </div>
            </div>

            <div className="relative flex w-fit items-center gap-3 rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur">
              <Lock className="h-4 w-4 text-[#f7bf00]" />
              Protected admin portal
            </div>
          </div>

          <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#071a36_0%,#f7bf00_48%,#071a36_100%)] md:hidden" />

            <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center">
              <div className="mb-8 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#f7bf00]/25 bg-[linear-gradient(180deg,#fff8e4_0%,#fff1bf_100%)] shadow-[0_20px_45px_-28px_rgba(247,191,0,0.7)] md:hidden">
                  <Image
                    src="/home/logo.png"
                    alt="Aloha Car Rental"
                    width={64}
                    height={64}
                    className="h-14 w-14 object-contain"
                    priority
                  />
                </div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#b17c00]">
                  Admin Portal
                </p>
                <h2 className="text-4xl font-black tracking-tight text-[#071a36]">
                  {t("admin.login.title")}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#62768c]">
                  Sign in with your staff account to access bookings, fleet management, and operational tools.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#071a36]">
                          <Mail className="h-4 w-4 text-[#d89a00]" />
                          {t("admin.login.email")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t("admin.login.email")}
                            {...field}
                            disabled={isSubmitting}
                            className="h-14 rounded-2xl border-[#d7e4ef] bg-[#fcfdff] px-4 text-base shadow-[0_14px_30px_-24px_rgba(7,26,54,0.28)] focus-visible:border-[#f7bf00] focus-visible:bg-white focus-visible:ring-[#f7bf00]/35"
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
                        <FormLabel className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#071a36]">
                          <Lock className="h-4 w-4 text-[#d89a00]" />
                          {t("admin.login.password")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t("admin.login.password")}
                            {...field}
                            disabled={isSubmitting}
                            className="h-14 rounded-2xl border-[#d7e4ef] bg-[#fcfdff] px-4 text-base shadow-[0_14px_30px_-24px_rgba(7,26,54,0.28)] focus-visible:border-[#f7bf00] focus-visible:bg-white focus-visible:ring-[#f7bf00]/35"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#d89a00_0%,#f7bf00_55%,#ffd85a_100%)] text-base font-bold text-[#071a36] shadow-[0_24px_50px_-28px_rgba(247,191,0,0.8)] hover:bg-[linear-gradient(135deg,#c78d00_0%,#efb700_55%,#ffd24a_100%)]"
                  >
                    <LogIn className="h-4 w-4" />
                    {isSubmitting ? t("common.loading") : t("admin.login.submit")}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
