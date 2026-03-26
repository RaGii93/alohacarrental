"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendBillingDocumentEmailAction } from "@/actions/booking";

export function SendBillingEmailButton({
  bookingId,
  locale,
  label,
  className,
  variant = "link",
}: {
  bookingId: string;
  locale: string;
  label?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}) {
  const t = useTranslations();
  const [isSending, setIsSending] = useState(false);

  const handleClick = async () => {
    setIsSending(true);
    const result = await sendBillingDocumentEmailAction(bookingId, locale);
    setIsSending(false);

    if (result.success) {
      toast.success(t("admin.bookings.detail.filesActions.sent"));
      return;
    }

    toast.error(result.error || t("admin.bookings.detail.filesActions.sendFailed"));
  };

  return (
    <Button type="button" variant={variant} size="sm" className={className} disabled={isSending} onClick={handleClick}>
      {isSending ? t("admin.bookings.detail.filesActions.sending") : label || t("admin.bookings.detail.filesActions.sendByEmail")}
    </Button>
  );
}
