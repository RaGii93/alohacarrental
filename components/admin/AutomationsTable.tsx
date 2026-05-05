"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAutomationRule } from "@/actions/automations";
import { Badge } from "@/components/ui/badge";

type Rule = {
  id: string;
  isActive: boolean;
  name: string;
  triggerType: string;
  actionType: string;
  triggerOffsetMinutes: number | null;
  description: string | null;
  sortOrder: number;
  executionLogs: Array<{ status: string; executedAt: Date; errorDetails: string | null }>;
  _count: { executionLogs: number };
};

function triggerLabel(triggerType: string, offsetMinutes: number | null) {
  const labels: Record<string, string> = {
    booking_created: "Booking Created",
    booking_confirmed: "Booking Confirmed",
    invoice_sent: "Invoice Sent",
    payment_received: "Payment Received",
    pickup_due_24h: "Pickup Due (24h)",
    return_due_24h: "Return Due (24h)",
    booking_overdue: "Booking Overdue",
    review_request_due: "Review Request Due",
    unpaid_booking_before_pickup: "Unpaid Before Pickup",
    return_completed: "Return Completed",
  };
  const base = labels[triggerType] ?? triggerType;
  if (offsetMinutes !== null) {
    if (offsetMinutes < 0) return `${base} — ${Math.abs(offsetMinutes) / 60}h before`;
    if (offsetMinutes > 0) return `${base} — ${offsetMinutes / 60}h after`;
  }
  return base;
}

function actionLabel(actionType: string) {
  const labels: Record<string, string> = {
    send_email: "Send Email",
    create_admin_alert: "Admin Alert",
    create_crm_log: "CRM Log",
    enqueue_webhook: "Webhook",
    mark_follow_up: "Flag Follow-up",
    send_review_request: "Review Request Email",
  };
  return labels[actionType] ?? actionType;
}

function statusBadge(status: string) {
  if (status === "success") return <Badge className="bg-green-100 text-green-700">Success</Badge>;
  if (status === "failed") return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
  return <Badge className="bg-slate-100 text-slate-600">Skipped</Badge>;
}

export function AutomationsTable({ rules, locale }: { rules: Rule[]; locale: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    startTransition(async () => {
      await toggleAutomationRule(locale, id, !current);
      router.refresh();
      setTogglingId(null);
    });
  }

  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No automation rules configured.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Rule</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Trigger</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Run</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Executions</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-700">Active</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => {
            const lastLog = rule.executionLogs[0];
            return (
              <tr
                key={rule.id}
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                onClick={() => router.push(`/${locale}/admin/automations/${rule.id}`)}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{rule.name}</p>
                  {rule.description && (
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{rule.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {triggerLabel(rule.triggerType, rule.triggerOffsetMinutes)}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {actionLabel(rule.actionType)}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                  {lastLog
                    ? new Date(lastLog.executedAt).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {rule._count.executionLogs}
                </td>
                <td className="px-4 py-3">
                  {lastLog ? statusBadge(lastLog.status) : <span className="text-slate-400">—</span>}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(rule.id, rule.isActive);
                  }}
                >
                  <button
                    disabled={pending && togglingId === rule.id}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      rule.isActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    aria-label={rule.isActive ? "Disable rule" : "Enable rule"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        rule.isActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
