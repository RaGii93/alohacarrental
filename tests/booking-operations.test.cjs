const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Server actions run against an in-memory database; no customer mail or live writes.
function harness() {
  const state = {
    session: { adminUserId: 'admin', role: 'ROOT' }, customRate: 7000,
    booking: {
      id: 'booking', status: 'CONFIRMED', vehicleId: 'vehicle', categoryId: 'category',
      vehicle: { id: 'vehicle' }, category: { id: 'category', name: 'Compact', dailyRate: 10000, fuelChargePerQuarter: 1500 },
      startDate: new Date('2020-01-01T14:00:00Z'), endDate: new Date('2020-01-03T14:00:00Z'),
      pickupFuelLevel: 4, pickupOdometerKm: 1000, totalAmount: 14000, invoiceUrl: 'https://storage.example/test.pdf',
      deliveredAt: new Date('2020-01-01T14:00:00Z'), returnedAt: null, actualReturnedAt: null,
    },
    writes: [], sql: [], audits: [], uploads: 0, emails: 0, vehicleUpdates: [],
  };
  const db = {
    booking: {
      findUnique: async () => state.booking,
      findMany: async () => [],
      update: async ({ data }) => {
        // Emulate the stale Prisma client that caused return to fail.
        assert.equal('actualReturnedAt' in data, false, 'operational timestamp must also work with older clients');
        state.writes.push(data); Object.assign(state.booking, data); return state.booking;
      },
    },
    $executeRawUnsafe: async () => 0,
    $executeRaw: async (parts, ...values) => {
      const sql = parts.join('?'); state.sql.push({ sql, values });
      if (sql.includes('SET "actualReturnedAt"')) state.booking.actualReturnedAt = values[0];
      return 1;
    },
    $queryRaw: async (parts) => {
      const sql = parts.join('?');
      if (sql.includes('SELECT "deliveredAt"')) return [{ deliveredAt: state.booking.deliveredAt, returnedAt: state.booking.returnedAt, actualReturnedAt: state.booking.actualReturnedAt }];
      if (sql.includes('BookingPriceOverride')) return state.customRate ? [{ dailyRate: state.customRate }] : [];
      return [];
    },
    auditLog: { create: async ({ data }) => state.audits.push(data) },
    vehicle: { updateMany: async (args) => state.vehicleUpdates.push(args) },
  };
  db.$transaction = async (callback) => callback(db);
  const mocks = {
    '@/lib/db': { db }, '@/lib/session': { getSession: async () => state.session },
    '@/lib/license': { isLicenseActive: () => true },
    '@/lib/automations': { triggerAutomationEvent: async () => {} },
    '@/lib/tenant': { getTenantConfig: async () => ({}) },
    '@/lib/email': { sendEmail: async () => { state.emails++; return { success: true }; } },
    '@/lib/uploads': { uploadBuffer: async () => { state.uploads++; throw new Error('Unexpected upload'); } },
    '@/lib/quickbooks-bookings': { ensureQuickBooksBookingColumns: async () => {} },
  };
  const actual = new Set(['lib/booking-price.ts', 'lib/booking-policy.ts', 'lib/return-policy.ts', 'lib/booking-pricing-rules.ts', 'lib/pricing.ts', 'lib/timezone.ts', 'lib/vehicle-status.ts', 'lib/pickup-checklist.ts', 'actions/booking.ts']);
  const cache = new Map();
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative).exports;
    const filename = path.resolve(__dirname, '..', relative);
    const module = { exports: {} }; cache.set(relative, module);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const localRequire = (name) => {
      if (mocks[name]) return mocks[name];
      const key = name.startsWith('@/') ? `${name.slice(2)}.ts` : name.startsWith('.') ? path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${name}.ts`)) : null;
      if (key) return actual.has(key) ? load(key) : {};
      return require(name);
    };
    new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
    return module.exports;
  }
  const actions = load('actions/booking.ts');
  const checklist = load('lib/pickup-checklist.ts');
  const input = { odometerKm: 1100, fuelLevel: 3, hasDamage: true, damageChargeCents: 2500, damageNotes: 'Scratch', acceptedBy: 'Customer', imageUrls: [], checklistItemIds: checklist.getAgrChecklistItems('return'), actualReturnedAt: '2020-01-04T10:00' };
  return { state, actions, load, input };
}

test('custom prices accept cents precisely and reject invalid amounts', () => {
  const { load } = harness();
  const { parseCustomDailyRate } = load('lib/booking-price.ts');
  assert.equal(parseCustomDailyRate('35.50'), 3550);
  assert.equal(parseCustomDailyRate(''), null);
  for (const value of ['0', '-1', 'abc', '12.345', 'Infinity', '1000000.01']) assert.throws(() => parseCustomDailyRate(value));
});

test('custom rate applies to admin pricing, including cruise bookings, and never to public pricing', () => {
  const { load } = harness(); const { resolveCategoryDailyRate } = load('lib/booking-pricing-rules.ts');
  const rates = { dailyRateCents: 10000, cruiseDailyRateCents: 12000, customDailyRateCents: 7000, isCruise: true };
  assert.equal(resolveCategoryDailyRate({ ...rates, bookingSource: 'admin' }), 7000);
  assert.equal(resolveCategoryDailyRate({ ...rates, bookingSource: 'public' }), 10000);
});

test('only authorized admin-form bookings auto-confirm; website requests stay pending even for logged-in owners', () => {
  const { load } = harness(); const { initialBookingStatus } = load('lib/booking-policy.ts');
  assert.equal(initialBookingStatus('admin', 'ROOT'), 'CONFIRMED');
  assert.equal(initialBookingStatus('admin', 'OWNER'), 'CONFIRMED');
  assert.equal(initialBookingStatus('public', 'OWNER'), 'PENDING');
  assert.equal(initialBookingStatus('public'), 'PENDING');
  assert.throws(() => initialBookingStatus('admin'));
  assert.throws(() => initialBookingStatus('admin', 'STAFF'));
});

test('pending bookings cannot generate, upload, send or resend invoices', async () => {
  const { actions, state } = harness(); state.booking.status = 'PENDING';
  assert.equal((await actions.sendInvoiceEstimateAction('booking', 'en')).success, false);
  assert.equal((await actions.sendBillingDocumentEmailAction('booking', 'en')).success, false);
  assert.equal((await actions.createSalesReceiptAction('booking', 'en')).success, false);
  assert.equal((await actions.receiveInvoicePaymentAction('booking', 'en')).success, false);
  assert.equal(state.uploads, 0); assert.equal(state.emails, 0); assert.equal(state.writes.length, 0);
});

test('return succeeds with a manual date, custom late rate, real fuel/damage charges and an older Prisma client', async () => {
  const { actions, state, input } = harness();
  const result = await actions.completeReturnInspectionAction('booking', input, 'en');
  assert.equal(result.success, true, result.error);
  assert.equal(result.lateCharge, 7000); assert.equal(result.fuelCharge, 1500); assert.equal(result.damageCharge, 2500);
  assert.equal(state.booking.totalAmount, 25000);
  assert.equal(state.booking.actualReturnedAt.toISOString(), '2020-01-04T14:00:00.000Z');
  assert.equal(state.booking.returnChecklistData.checklistItemIds.length, 8);
  assert.ok(state.vehicleUpdates.some((update) => update.data.status === 'ACTIVE'));
  assert.equal((await actions.completeReturnInspectionAction('booking', input, 'en')).success, false);
  assert.equal(state.writes.length, 1, 'duplicate returns must not charge twice');
});

test('keeping the agreed price waives all additional return charges and records the reason', async () => {
  const { actions, state, input } = harness();
  const result = await actions.completeReturnInspectionAction('booking', { ...input, keepAgreedPrice: true, overrideReason: 'Agreed with customer' }, 'nl');
  assert.equal(result.success, true, result.error); assert.equal(result.totalAdjustment, 0);
  assert.equal(state.booking.totalAmount, 14000); assert.equal(state.booking.returnLateCharge, 0);
  assert.equal(state.booking.returnFuelCharge, 0); assert.equal(state.booking.returnDamageCharge, 0);
  assert.equal(state.booking.returnChecklistData.overrideReason, 'Agreed with customer');
  assert.equal(state.booking.returnChecklistData.waivedCharges.late, 7000);
});

test('backdating an on-time return prevents an incorrect overdue charge', async () => {
  const { actions, input } = harness();
  const result = await actions.completeReturnInspectionAction('booking', { ...input, actualReturnedAt: '2020-01-03T10:00', fuelLevel: 4, damageChargeCents: 0 }, 'en');
  assert.equal(result.success, true, result.error); assert.equal(result.totalAdjustment, 0);
});

test('normal inspections reject incomplete checklists, invalid dates and missing waiver reasons', async () => {
  for (const patch of [{ checklistItemIds: [] }, { actualReturnedAt: 'bad' }, { actualReturnedAt: '2099-01-01T10:00' }, { actualReturnedAt: '2019-01-01T10:00' }, { keepAgreedPrice: true }, { odometerKm: 900 }]) {
    const { actions, state, input } = harness();
    assert.equal((await actions.completeReturnInspectionAction('booking', { ...input, ...patch }, 'en')).success, false);
    assert.equal(state.writes.length, 0);
  }
});

test('force return bypasses missing pickup/inspection, preserves price and records an explicit audit trail', async () => {
  const { actions, state } = harness(); state.booking.deliveredAt = null;
  const result = await actions.markBookingReturnedAction('booking', 'en', { force: true, actualReturnedAt: '2020-01-04T10:00', keepAgreedPrice: true, reason: 'Legacy pickup was never entered' });
  assert.equal(result.success, true, result.error); assert.equal(state.booking.totalAmount, 14000);
  assert.equal(state.booking.returnChecklistData.inspectionCompleted, false);
  assert.equal(state.booking.returnChecklistData.recordedBy, 'admin');
  assert.ok(state.audits.some((audit) => audit.action === 'BOOKING_FORCE_RETURNED'));
  assert.equal(state.booking.actualReturnedAt.toISOString(), '2020-01-04T14:00:00.000Z');
});

test('force return can charge the custom late rate when keep-price is unchecked', async () => {
  const { actions, state } = harness();
  const result = await actions.markBookingReturnedAction('booking', 'en', { force: true, actualReturnedAt: '2020-01-04T10:00', keepAgreedPrice: false, reason: 'Close overdue rental' });
  assert.equal(result.success, true, result.error); assert.equal(result.lateCharge, 7000); assert.equal(state.booking.totalAmount, 21000);
});

test('force return rejects nonprivileged admins and requires a reason', async () => {
  const { actions, state } = harness();
  assert.equal((await actions.markBookingReturnedAction('booking', 'en', { force: true })).success, false);
  state.session.role = 'STAFF';
  assert.equal((await actions.markBookingReturnedAction('booking', 'en', { force: true, reason: 'Test' })).success, false);
  assert.equal(state.writes.length, 0);
});
