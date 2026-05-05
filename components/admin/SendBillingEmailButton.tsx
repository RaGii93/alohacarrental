"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  const [isSending, startSending] = useTransition();
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  const handleClick = () => {
    setDebugMessage(null);
    startSending(async () => {
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}/send-billing-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ locale }),
        });
        const result = await response.json().catch(() => ({
          success: false,
          error: t("admin.bookings.detail.filesActions.sendFailed"),
        }));

        console.log("sendBillingDocumentEmailAction:client_result", {
          bookingId,
          locale,
          status: response.status,
          result,
        });
        if (!result.success) {
          console.error("sendBillingDocumentEmailAction:client_error", {
            bookingId,
            locale,
            error: result.error,
          });
        }

        if (result.success) {
          setDebugMessage("Invoice resend succeeded.");
          toast.success(t("admin.bookings.detail.filesActions.sent"));
          return;
        }

        const rawError =
          result.error ||
          (!response.ok ? `Request failed with status ${response.status}` : "") ||
          t("admin.bookings.detail.filesActions.sendFailed");
        setDebugMessage(`Invoice resend failed: ${rawError}`);
        toast.error(rawError);
      } catch (error: any) {
        const rawError = error?.message || t("admin.bookings.detail.filesActions.sendFailed");
        console.error("sendBillingDocumentEmailAction:client_exception", {
          bookingId,
          locale,
          error: rawError,
        });
        setDebugMessage(`Invoice resend failed: ${rawError}`);
        toast.error(rawError);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant={variant} size="sm" className={className} disabled={isSending} onClick={handleClick}>
        {isSending ? t("admin.bookings.detail.filesActions.sending") : label || t("admin.bookings.detail.filesActions.sendByEmail")}
      </Button>
      {debugMessage ? (
        <p className="text-xs text-slate-500">
          {debugMessage}
        </p>
      ) : null}
    </div>
  );
}
