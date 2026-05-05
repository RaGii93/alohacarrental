/**
 * Automation Engine
 * Handles event-driven and time-based automation for rental operations.
 */

import {
  AutomationActionType,
  AutomationExecutionStatus,
  AutomationTriggerType,
  BookingStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { sendEmail, bookingEmailHtml } from "@/lib/email";
import { getTenantConfig } from "@/lib/tenant";
import { createNotification } from "@/lib/notifications";
import { formatDateTime } from "@/lib/datetime";
import { startOfLaPazDay, addLaPazDays } from "@/lib/timezone";

// ─── Template variable substitution ──────────────────────────────────────────

export type TemplateVariables = {
  customerName?: string;
  bookingCode?: string;
  pickupDate?: string;
  dropoffDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  amountDue?: string;
  vehicleOrCategory?: string;
};

export function renderTemplate(template: string, vars: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String((vars as Record<string, string | undefined>)[key] ?? `{{${key}}}`);
  });
}

// ─── Booking enrichment helpers ───────────────────────────────────────────────

async function getBookingForAutomation(bookingId: string) {
  return db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      customerEmail: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      status: true,
      paymentReceivedAt: true,
      returnedAt: true,
      pickupLocation: true,
      dropoffLocation: true,
      vehicle: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
}

function buildTemplateVars(
  booking: NonNullable<Awaited<ReturnType<typeof getBookingForAutomation>>>
): TemplateVariables {
  return {
    customerName: booking.customerName,
    bookingCode: booking.bookingCode,
    pickupDate: formatDateTime(booking.startDate),
    dropoffDate: formatDateTime(booking.endDate),
    pickupLocation: booking.pickupLocation ?? undefined,
    dropoffLocation: booking.dropoffLocation ?? undefined,
    amountDue: `$${(booking.totalAmount / 100).toFixed(2)}`,
    vehicleOrCategory: booking.vehicle?.name ?? booking.category?.name ?? "—",
  };
}

// ─── Idempotency ──────────────────────────────────────────────────────────────

function makeIdempotencyKey(ruleId: string, entityId: string, suffix = ""): string {
  return `rule:${ruleId}:entity:${entityId}${suffix ? `:${suffix}` : ""}`;
}

async function isAlreadyExecuted(key: string): Promise<boolean> {
  const existing = await db.automationExecutionLog.findUnique({
    where: { idempotencyKey: key },
    select: { status: true },
  });
  return existing !== null && existing.status !== "failed";
}

async function logExecution(params: {
  ruleId: string;
  entityId: string;
  idempotencyKey: string;
  status: AutomationExecutionStatus;
  errorDetails?: string;
}) {
  await db.automationExecutionLog.upsert({
    where: { idempotencyKey: params.idempotencyKey },
    create: {
      ruleId: params.ruleId,
      entityType: "booking",
      entityId: params.entityId,
      idempotencyKey: params.idempotencyKey,
      status: params.status,
      errorDetails: params.errorDetails,
    },
    update: {
      status: params.status,
      errorDetails: params.errorDetails,
      executedAt: new Date(),
    },
  });
}

// ─── Action dispatchers ───────────────────────────────────────────────────────

async function dispatchSendEmail(params: {
  ruleId: string;
  booking: NonNullable<Awaited<ReturnType<typeof getBookingForAutomation>>>;
  actionConfig: Record<string, unknown>;
  idempotencyKey: string;
}) {
  const { booking, actionConfig, idempotencyKey, ruleId } = params;
  const vars = buildTemplateVars(booking);

  const subject = renderTemplate(String(actionConfig.subject ?? ""), vars);
  const bodyTemplate = String(actionConfig.body ?? "");
  const body = renderTemplate(bodyTemplate, vars);
  const title = renderTemplate(String(actionConfig.emailTitle ?? subject), vars);
  const introText = renderTemplate(String(actionConfig.introText ?? body), vars);

  const html = await bookingEmailHtml({
    title,
    customerName: booking.customerName,
    bookingCode: booking.bookingCode,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalAmountCents: booking.totalAmount,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation,
    introText,
    showFinancialSummary: Boolean(actionConfig.showFinancialSummary),
  });

  const result = await sendEmail({
    to: booking.customerEmail,
    subject,
    html,
  });

  if (!result.success) {
    throw new Error(result.error ?? "Email send failed");
  }

  await logExecution({ ruleId, entityId: booking.id, idempotencyKey, status: "success" });
}

async function dispatchCreateAdminAlert(params: {
  ruleId: string;
  booking: NonNullable<Awaited<ReturnType<typeof getBookingForAutomation>>>;
  actionConfig: Record<string, unknown>;
  idempotencyKey: string;
}) {
  const { booking, actionConfig, idempotencyKey, ruleId } = params;
  const vars = buildTemplateVars(booking);
  const title = renderTemplate(String(actionConfig.title ?? "Automation alert"), vars);
  const message = renderTemplate(String(actionConfig.message ?? ""), vars);
  const href = `/admin/bookings/${booking.id}`;
  const severity = (actionConfig.severity as string) ?? "WARNING";

  await createNotification({
    type: "automation",
    title,
    message,
    href,
    severity: severity as "INFO" | "SUCCESS" | "WARNING" | "ERROR",
  });

  await logExecution({ ruleId, entityId: booking.id, idempotencyKey, status: "success" });
}

async function dispatchCreateCrmLog(params: {
  ruleId: string;
  booking: NonNullable<Awaited<ReturnType<typeof getBookingForAutomation>>>;
  actionConfig: Record<string, unknown>;
  idempotencyKey: string;
}) {
  // CRM log stored as a notification with type "crm_log"
  const { booking, actionConfig, idempotencyKey, ruleId } = params;
  const vars = buildTemplateVars(booking);
  const note = renderTemplate(String(actionConfig.note ?? "CRM log entry"), vars);

  await createNotification({
    type: "crm_log",
    title: `CRM: ${booking.customerName}`,
    message: note,
    href: `/admin/bookings/${booking.id}`,
    severity: "INFO",
  });

  await logExecution({ ruleId, entityId: booking.id, idempotencyKey, status: "success" });
}

async function dispatchEnqueueWebhook(params: {
  ruleId: string;
  booking: NonNullable<Awaited<ReturnType<typeof getBookingForAutomation>>>;
  actionConfig: Record<string, unknown>;
  idempotencyKey: string;
}) {
  // Placeholder — log intention; actual webhook delivery would be handled externally
  const { booking, actionConfig, idempotencyKey, ruleId } = params;
  const webhookUrl = String(actionConfig.webhookUrl ?? "");

  console.log("[AutomationEngine] webhook enqueued", {
    ruleId,
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    webhookUrl,
  });

  await logExecution({ ruleId, entityId: booking.id, idempotencyKey, status: "success" });
}

async function dispatchMarkFollowUp(params: {
  ruleId: string;
  booking: NonNullable<Awaited<ReturnType<typeof getBookingForAutomation>>>;
  actionConfig: Record<string, unknown>;
  idempotencyKey: string;
}) {
  const { booking, actionConfig, idempotencyKey, ruleId } = params;
  const vars = buildTemplateVars(booking);
  const note = renderTemplate(String(actionConfig.note ?? "Follow-up needed"), vars);

  await createNotification({
    type: "follow_up",
    title: `Follow-up: ${booking.customerName} (${booking.bookingCode})`,
    message: note,
    href: `/admin/bookings/${booking.id}`,
    severity: "INFO",
  });

  await logExecution({ ruleId, entityId: booking.id, idempotencyKey, status: "success" });
}

async function dispatchSendReviewRequest(params: {
  ruleId: string;
  booking: NonNullable<Awaited<ReturnType<typeof getBookingForAutomation>>>;
  actionConfig: Record<string, unknown>;
  idempotencyKey: string;
}) {
  const { booking, actionConfig, idempotencyKey, ruleId } = params;
  const tenant = await getTenantConfig();

  const reviewUrl =
    actionConfig.reviewUrl
      ? String(actionConfig.reviewUrl)
      : `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ""}/review/${booking.bookingCode}`;

  const subject = `How was your experience? - ${tenant.tenantName}`;
  const html = await bookingEmailHtml({
    title: "How was your rental experience?",
    customerName: booking.customerName,
    bookingCode: booking.bookingCode,
    startDate: booking.startDate,
    endDate: booking.endDate,
    introText: `We hope you enjoyed your rental! We'd love to hear your feedback. Please take a moment to leave a review.`,
    outroText: `<p style="margin:0 0 12px">Leave your review here: <a href="${reviewUrl}" target="_blank" style="color:#0f766e">${reviewUrl}</a></p>`,
    showFinancialSummary: false,
  });

  const result = await sendEmail({
    to: booking.customerEmail,
    subject,
    html,
  });

  if (!result.success) {
    throw new Error(result.error ?? "Email send failed");
  }

  await logExecution({ ruleId, entityId: booking.id, idempotencyKey, status: "success" });
}

// ─── Core executor ────────────────────────────────────────────────────────────

export async function executeAutomationRule(
  rule: {
    id: string;
    actionType: AutomationActionType;
    actionConfig: unknown;
    conditions: unknown;
  },
  bookingId: string,
  idempotencySuffix = ""
): Promise<{ status: "success" | "skipped" | "failed"; error?: string }> {
  const idempotencyKey = makeIdempotencyKey(rule.id, bookingId, idempotencySuffix);

  try {
    // Idempotency guard
    if (await isAlreadyExecuted(idempotencyKey)) {
      return { status: "skipped" };
    }

    const booking = await getBookingForAutomation(bookingId);
    if (!booking) {
      await logExecution({ ruleId: rule.id, entityId: bookingId, idempotencyKey, status: "skipped", errorDetails: "Booking not found" });
      return { status: "skipped" };
    }

    // Do not execute for cancelled or declined bookings unless rule explicitly allows it
    const conditions = (rule.conditions ?? {}) as Record<string, unknown>;
    const allowCancelled = Boolean(conditions.allowCancelled);
    if (!allowCancelled && (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.DECLINED)) {
      await logExecution({ ruleId: rule.id, entityId: bookingId, idempotencyKey, status: "skipped", errorDetails: "Booking cancelled/declined" });
      return { status: "skipped" };
    }

    // Status condition check
    if (conditions.requiredStatus && booking.status !== conditions.requiredStatus) {
      await logExecution({ ruleId: rule.id, entityId: bookingId, idempotencyKey, status: "skipped", errorDetails: `Status mismatch: ${booking.status}` });
      return { status: "skipped" };
    }

    // Payment required check
    if (conditions.requiresPayment && !booking.paymentReceivedAt) {
      await logExecution({ ruleId: rule.id, entityId: bookingId, idempotencyKey, status: "skipped", errorDetails: "Payment not received" });
      return { status: "skipped" };
    }

    const actionConfig = (rule.actionConfig ?? {}) as Record<string, unknown>;
    const dispatchParams = { ruleId: rule.id, booking, actionConfig, idempotencyKey };

    switch (rule.actionType) {
      case "send_email":
        await dispatchSendEmail(dispatchParams);
        break;
      case "create_admin_alert":
        await dispatchCreateAdminAlert(dispatchParams);
        break;
      case "create_crm_log":
        await dispatchCreateCrmLog(dispatchParams);
        break;
      case "enqueue_webhook":
        await dispatchEnqueueWebhook(dispatchParams);
        break;
      case "mark_follow_up":
        await dispatchMarkFollowUp(dispatchParams);
        break;
      case "send_review_request":
        await dispatchSendReviewRequest(dispatchParams);
        break;
      default:
        await logExecution({ ruleId: rule.id, entityId: bookingId, idempotencyKey, status: "skipped", errorDetails: "Unknown action type" });
        return { status: "skipped" };
    }

    return { status: "success" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[AutomationEngine] rule execution failed", { ruleId: rule.id, bookingId, error: msg });
    await logExecution({ ruleId: rule.id, entityId: bookingId, idempotencyKey, status: "failed", errorDetails: msg }).catch(() => {});
    return { status: "failed", error: msg };
  }
}

// ─── Event-based trigger ──────────────────────────────────────────────────────

export async function triggerAutomationEvent(
  triggerType: AutomationTriggerType,
  bookingId: string
): Promise<void> {
  const rules = await db.automationRule.findMany({
    where: { isActive: true, triggerType, triggerOffsetMinutes: null },
    orderBy: { sortOrder: "asc" },
  });

  for (const rule of rules) {
    await executeAutomationRule(rule, bookingId).catch((err) =>
      console.error("[AutomationEngine] uncaught in triggerAutomationEvent", err)
    );
  }
}

// ─── Cron-based polling runner ────────────────────────────────────────────────
// Called from /api/cron/automations. Polls DB for bookings matching time-based triggers.

export async function runScheduledAutomations(): Promise<{
  processed: number;
  errors: number;
}> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  let processed = 0;
  let errors = 0;

  async function exec(
    rule: { id: string; actionType: AutomationActionType; actionConfig: unknown; conditions: unknown },
    bookingId: string,
    suffix: string
  ) {
    const result = await executeAutomationRule(rule, bookingId, suffix);
    if (result.status === "success") processed++;
    if (result.status === "failed") errors++;
  }

  // Fetch all active scheduled rules grouped by trigger
  const scheduledRules = await db.automationRule.findMany({
    where: { isActive: true, triggerOffsetMinutes: { not: null } },
    orderBy: { sortOrder: "asc" },
  });

  const rulesByTrigger = new Map<AutomationTriggerType, typeof scheduledRules>();
  for (const rule of scheduledRules) {
    const list = rulesByTrigger.get(rule.triggerType) ?? [];
    list.push(rule);
    rulesByTrigger.set(rule.triggerType, list);
  }

  // pickup_due_24h — bookings with startDate in next 24h, CONFIRMED, not yet delivered
  const pickupRules = rulesByTrigger.get("pickup_due_24h") ?? [];
  if (pickupRules.length) {
    const bookings = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        startDate: { gte: now, lte: in25h },
        deliveredAt: null,
      },
      select: { id: true },
    });
    for (const b of bookings) {
      for (const rule of pickupRules) {
        await exec(rule, b.id, `pickup_due_24h:${b.id}`);
      }
    }
  }

  // return_due_24h — bookings with endDate in next 24h, CONFIRMED, delivered, not yet returned
  const returnRules = rulesByTrigger.get("return_due_24h") ?? [];
  if (returnRules.length) {
    const bookings = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        endDate: { gte: now, lte: in25h },
        deliveredAt: { not: null },
        returnedAt: null,
      },
      select: { id: true },
    });
    for (const b of bookings) {
      for (const rule of returnRules) {
        await exec(rule, b.id, `return_due_24h:${b.id}`);
      }
    }
  }

  // booking_overdue — endDate is past, delivered, not returned, not cancelled
  const overdueRules = rulesByTrigger.get("booking_overdue") ?? [];
  if (overdueRules.length) {
    const bookings = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        endDate: { lt: now },
        deliveredAt: { not: null },
        returnedAt: null,
      },
      select: { id: true },
    });
    for (const b of bookings) {
      for (const rule of overdueRules) {
        // Use daily suffix to avoid re-firing every minute
        const daySuffix = `overdue:${b.id}:${now.toISOString().slice(0, 10)}`;
        await exec(rule, b.id, daySuffix);
      }
    }
  }

  // review_request_due — returnedAt is >= 12h ago, no review yet
  const reviewRules = rulesByTrigger.get("review_request_due") ?? [];
  if (reviewRules.length) {
    for (const rule of reviewRules) {
      const offsetMins = rule.triggerOffsetMinutes ?? 720;
      const offsetMs = offsetMins * 60 * 1000;
      const cutoff = new Date(now.getTime() - offsetMs);
      // returnedAt must be before cutoff (i.e., at least offsetMins ago)
      const bookings = await db.booking.findMany({
        where: {
          status: "CONFIRMED",
          returnedAt: { not: null, lte: cutoff },
          review: null,
        },
        select: { id: true },
      });
      for (const b of bookings) {
        await exec(rule, b.id, `review_request:${b.id}`);
      }
    }
  }

  // unpaid_booking_before_pickup — CONFIRMED, not paid, pickup within 24h
  const unpaidRules = rulesByTrigger.get("unpaid_booking_before_pickup") ?? [];
  if (unpaidRules.length) {
    const bookings = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        paymentReceivedAt: null,
        startDate: { gte: now, lte: in25h },
      },
      select: { id: true },
    });
    for (const b of bookings) {
      for (const rule of unpaidRules) {
        await exec(rule, b.id, `unpaid_before_pickup:${b.id}`);
      }
    }
  }

  return { processed, errors };
}

// ─── Default rules seed data ──────────────────────────────────────────────────

export const DEFAULT_AUTOMATION_RULES = [
  {
    name: "Booking Confirmed – Send Confirmation Email",
    description: "Sends a confirmation email to the customer when a booking is confirmed.",
    isActive: true,
    triggerType: "booking_confirmed" as AutomationTriggerType,
    triggerOffsetMinutes: null,
    conditions: { requiredStatus: "CONFIRMED" },
    actionType: "send_email" as AutomationActionType,
    actionConfig: {
      subject: "Your booking {{bookingCode}} is confirmed!",
      emailTitle: "Booking Confirmed",
      introText: "Great news, {{customerName}}! Your rental booking has been confirmed. We look forward to seeing you on {{pickupDate}}.",
      showFinancialSummary: true,
    },
    sortOrder: 10,
  },
  {
    name: "Pickup Reminder – 24h Before",
    description: "Sends a pickup reminder email 24 hours before the scheduled pickup.",
    isActive: true,
    triggerType: "pickup_due_24h" as AutomationTriggerType,
    triggerOffsetMinutes: -1440,
    conditions: {},
    actionType: "send_email" as AutomationActionType,
    actionConfig: {
      subject: "Reminder: Your rental pickup is tomorrow ({{bookingCode}})",
      emailTitle: "Pickup Reminder",
      introText: "Hi {{customerName}}, just a reminder that your vehicle pickup is scheduled for {{pickupDate}} at {{pickupLocation}}. Please have your driver's license and booking code {{bookingCode}} ready.",
      showFinancialSummary: false,
    },
    sortOrder: 20,
  },
  {
    name: "Return Reminder – 24h Before",
    description: "Sends a return reminder email 24 hours before the scheduled return.",
    isActive: true,
    triggerType: "return_due_24h" as AutomationTriggerType,
    triggerOffsetMinutes: -1440,
    conditions: {},
    actionType: "send_email" as AutomationActionType,
    actionConfig: {
      subject: "Reminder: Your vehicle return is tomorrow ({{bookingCode}})",
      emailTitle: "Return Reminder",
      introText: "Hi {{customerName}}, your rental period ends tomorrow on {{dropoffDate}}. Please return the vehicle to {{dropoffLocation}}. Safe travels!",
      showFinancialSummary: false,
    },
    sortOrder: 30,
  },
  {
    name: "Overdue Return – Admin Alert",
    description: "Creates an admin alert when a rental is past its return date and not yet returned.",
    isActive: true,
    triggerType: "booking_overdue" as AutomationTriggerType,
    triggerOffsetMinutes: 0,
    conditions: {},
    actionType: "create_admin_alert" as AutomationActionType,
    actionConfig: {
      title: "Overdue Return: {{customerName}} ({{bookingCode}})",
      message: "The rental for {{vehicleOrCategory}} was due back on {{dropoffDate}} and has not been returned yet.",
      severity: "WARNING",
    },
    sortOrder: 40,
  },
  {
    name: "Review Request – 24h After Return",
    description: "Sends a review request email 24 hours after the rental is returned.",
    isActive: true,
    triggerType: "review_request_due" as AutomationTriggerType,
    triggerOffsetMinutes: 1440,
    conditions: {},
    actionType: "send_review_request" as AutomationActionType,
    actionConfig: {},
    sortOrder: 50,
  },
  {
    name: "Unpaid Confirmed Booking – Admin Alert Before Pickup",
    description: "Creates an admin alert when a confirmed booking has no payment 24h before pickup.",
    isActive: true,
    triggerType: "unpaid_booking_before_pickup" as AutomationTriggerType,
    triggerOffsetMinutes: -1440,
    conditions: {},
    actionType: "create_admin_alert" as AutomationActionType,
    actionConfig: {
      title: "Unpaid Booking Before Pickup: {{customerName}} ({{bookingCode}})",
      message: "Booking {{bookingCode}} is confirmed but payment has not been received. Pickup is scheduled for {{pickupDate}}.",
      severity: "ERROR",
    },
    sortOrder: 60,
  },
];
