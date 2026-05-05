"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAutomationRule, testAutomationRule } from "@/actions/automations";
import { Badge } from "@/components/ui/badge";

type Log = {
  id: string;
  entityId: string;
  status: string;
  executedAt: Date;
  errorDetails: string | null;
  idempotencyKey: string;
};

type Rule = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: string;
  triggerOffsetMinutes: number | null;
  actionType: string;
  conditions: unknown;
  actionConfig: unknown;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  executionLogs: Log[];
};

function statusBadge(status: string) {
  if (status === "success") return <Badge className="bg-green-100 text-green-700">Success</Badge>;
  if (status === "failed") return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
  return <Badge className="bg-slate-100 text-slate-600">Skipped</Badge>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AutomationDetailClient({ rule, locale }: { rule: Rule; locale: string }) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();

  const [name, setName] = useState(rule.name);
  const [description, setDescription] = useState(rule.description ?? "");
  const [isActive, setIsActive] = useState(rule.isActive);
  const [offsetMinutes, setOffsetMinutes] = useState(
    rule.triggerOffsetMinutes !== null ? String(rule.triggerOffsetMinutes) : ""
  );
  const [conditionsJson, setConditionsJson] = useState(
    JSON.stringify(rule.conditions, null, 2)
  );
  const [actionConfigJson, setActionConfigJson] = useState(
    JSON.stringify(rule.actionConfig, null, 2)
  );
  const [testBookingId, setTestBookingId] = useState("");
  const [testResult, setTestResult] = useState<{ status: string; error?: string } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleSave() {
    let conditions: Record<string, unknown>;
    let actionConfig: Record<string, unknown>;
    try {
      conditions = JSON.parse(conditionsJson);
      actionConfig = JSON.parse(actionConfigJson);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON in conditions or action config.");
      return;
    }

    startSave(async () => {
      await updateAutomationRule(locale, rule.id, {
        name,
        description: description || undefined,
        isActive,
        triggerOffsetMinutes: offsetMinutes !== "" ? Number(offsetMinutes) : null,
        conditions,
        actionConfig,
      });
      router.refresh();
    });
  }

  function handleTest() {
    if (!testBookingId.trim()) return;
    setTestResult(null);
    startTest(async () => {
      const res = await testAutomationRule(locale, rule.id, testBookingId.trim());
      setTestResult(res as { status: string; error?: string });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Edit form — spans 2 cols */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Rule Configuration</h2>

          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </Field>

          <Field label="Description">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Optional description..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Trigger Type">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {rule.triggerType}
              </div>
            </Field>

            <Field label="Trigger Offset (minutes)">
              <input
                type="number"
                value={offsetMinutes}
                onChange={(e) => setOffsetMinutes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g. -1440 for 24h before"
              />
            </Field>
          </div>

          <Field label="Action Type">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {rule.actionType}
            </div>
          </Field>

          <Field label="Active">
            <button
              type="button"
              aria-label={isActive ? "Deactivate rule" : "Activate rule"}
              onClick={() => setIsActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                isActive ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </Field>

          <Field label="Conditions (JSON)">
            <textarea
              rows={4}
              value={conditionsJson}
              onChange={(e) => setConditionsJson(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </Field>

          <Field label="Action Config (JSON)">
            <textarea
              rows={8}
              value={actionConfigJson}
              onChange={(e) => setActionConfigJson(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </Field>

          {jsonError && (
            <p className="text-sm text-red-600">{jsonError}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Test rule */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900">Test Rule</h2>
          <p className="text-sm text-slate-500">
            Run this rule against a specific booking. Uses a unique test idempotency key so it won't block real execution.
          </p>
          <div className="flex gap-2">
            <input
              value={testBookingId}
              onChange={(e) => setTestBookingId(e.target.value)}
              placeholder="Booking ID (cuid)"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              onClick={handleTest}
              disabled={testing || !testBookingId.trim()}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              {testing ? "Running…" : "Test"}
            </button>
          </div>
          {testResult && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                testResult.status === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : testResult.status === "skipped"
                  ? "border-slate-200 bg-slate-50 text-slate-700"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <span className="font-semibold capitalize">{testResult.status}</span>
              {testResult.error && <span className="ml-2 text-xs">— {testResult.error}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Execution logs — right col */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Execution Log</h2>
          {rule.executionLogs.length === 0 ? (
            <p className="text-sm text-slate-400">No executions yet.</p>
          ) : (
            <ul className="space-y-2">
              {rule.executionLogs.map((log) => (
                <li key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    {statusBadge(log.status)}
                    <span className="text-slate-400 text-[11px]">
                      {new Date(log.executedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate" title={log.entityId}>
                    Booking: <span className="font-mono">{log.entityId.slice(0, 12)}…</span>
                  </p>
                  {log.errorDetails && (
                    <p className="text-red-600 truncate" title={log.errorDetails}>
                      {log.errorDetails}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
