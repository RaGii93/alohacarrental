"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendBillingDocumentEmailAction } from "@/actions/booking";

export function SendBillingEmailButton({
  bookingId,
  locale,
  label = "Send by Email",
  className,
  variant = "link",
}: {
  bookingId: string;
  locale: string;
  label?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}) {
  const [isSending, setIsSending] = useState(false);

  const handleClick = async () => {
    setIsSending(true);
    const result = await sendBillingDocumentEmailAction(bookingId, locale);
    setIsSending(false);

    if (result.success) {
      toast.success("Billing document sent via email.");
      return;
    }

    toast.error(result.error || "Failed to send billing document email.");
  };

  return (
    <Button type="button" variant={variant} size="sm" className={className} disabled={isSending} onClick={handleClick}>
      {isSending ? "Sending..." : label}
    </Button>
  );
}
