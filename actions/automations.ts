"use server";

import { db } from "@/lib/db";
import { requireAdminSection } from "@/app/[locale]/admin/_lib";
import { DEFAULT_AUTOMATION_RULES, executeAutomationRule } from "@/lib/automations";
import type { Prisma } from "@prisma/client";

export async function listAutomationRules(locale: string) {
  await requireAdminSection(locale, "automations");
  const data = await db.automationRule.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { executionLogs: true } },
      executionLogs: {
        orderBy: { executedAt: "desc" },
        take: 1,
        select: { status: true, executedAt: true, errorDetails: true },
      },
    },
  });
  return { success: true as const, data };
}

export async function getAutomationRule(locale: string, id: string) {
  await requireAdminSection(locale, "automations");
  return db.automationRule.findUnique({
    where: { id },
    include: {
      executionLogs: {
        orderBy: { executedAt: "desc" },
        take: 50,
        select: { id: true, entityId: true, status: true, executedAt: true, errorDetails: true, idempotencyKey: true },
      },
    },
  });
}

export async function updateAutomationRule(
  locale: string,
  id: string,
  data: {
    name?: string;
    description?: string;
    isActive?: boolean;
    triggerOffsetMinutes?: number | null;
    conditions?: Record<string, unknown>;
    actionConfig?: Record<string, unknown>;
  }
) {
  await requireAdminSection(locale, "automations");

  const updateData: Prisma.AutomationRuleUpdateInput = {
    updatedAt: new Date(),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    ...(data.triggerOffsetMinutes !== undefined ? { triggerOffsetMinutes: data.triggerOffsetMinutes } : {}),
    ...(data.conditions !== undefined ? { conditions: data.conditions as Prisma.InputJsonValue } : {}),
    ...(data.actionConfig !== undefined ? { actionConfig: data.actionConfig as Prisma.InputJsonValue } : {}),
  };

  return db.automationRule.update({
    where: { id },
    data: updateData,
  });
}

export async function toggleAutomationRule(locale: string, id: string, isActive: boolean) {
  await requireAdminSection(locale, "automations");
  return db.automationRule.update({
    where: { id },
    data: { isActive, updatedAt: new Date() },
  });
}

export async function testAutomationRule(locale: string, ruleId: string, bookingId: string) {
  await requireAdminSection(locale, "automations");
  const rule = await db.automationRule.findUnique({ where: { id: ruleId } });
  if (!rule) return { status: "failed", error: "Rule not found" };
  // Use a unique test suffix so it doesn't consume the real idempotency slot
  const testSuffix = `test:${Date.now()}`;
  const result = await executeAutomationRule(rule, bookingId, testSuffix);
  return result;
}

export async function seedDefaultAutomationRules(locale: string) {
  await requireAdminSection(locale, "automations");
  let created = 0;
  for (const rule of DEFAULT_AUTOMATION_RULES) {
    const existing = await db.automationRule.findFirst({
      where: { name: rule.name },
      select: { id: true },
    });
    if (!existing) {
      await db.automationRule.create({ data: rule });
      created++;
    }
  }
  return { created };
}

export async function getAutomationExecutionLogs(
  locale: string,
  options?: { ruleId?: string; limit?: number }
) {
  await requireAdminSection(locale, "automations");
  return db.automationExecutionLog.findMany({
    where: options?.ruleId ? { ruleId: options.ruleId } : undefined,
    orderBy: { executedAt: "desc" },
    take: options?.limit ?? 100,
    include: {
      rule: { select: { name: true, triggerType: true, actionType: true } },
    },
  });
}
