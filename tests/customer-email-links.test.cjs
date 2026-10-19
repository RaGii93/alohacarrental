const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Load the server helpers with tenant settings stubbed; never send mail or use the database.
const tenant = {
  tenantName: 'Aloha', currency: 'USD', termsPdfUrl: '/terms.pdf',
  theme: {
    primary: '294 64% 46%', primaryForeground: '0 0% 98%',
    accent: '314 100% 97%', accentForeground: '304 42% 24%',
  },
};
const cache = new Map();
const savedLocales = new Map();
const dbStub = {
  $executeRawUnsafe: async () => 0,
  $executeRaw: async (sql, bookingId, locale) => {
    if (!savedLocales.has(bookingId)) savedLocales.set(bookingId, locale);
    return 1;
  },
  $queryRaw: async (sql, bookingId) => [{ locale: savedLocales.get(bookingId) }],
};
function load(relativePath) {
  const filename = path.resolve(__dirname, '..', relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const localRequire = (name) => {
    if (name === '@/lib/datetime') return { formatDateTime: (date) => date.toISOString() };
    if (name === '@/lib/tenant' || name === './tenant') {
      return { ...load('lib/tenant.ts'), getTenantConfig: async () => tenant };
    }
    if (name === '@/lib/settings') return {};
    if (name === '@/lib/db') return { db: dbStub };
    if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`);
    if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), `${name}.ts`)));
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}

process.env.NEXT_PUBLIC_APP_URL = 'https://rental.example';
const { bookingEmailHtml } = load('lib/email.ts');
const { getTermsEmailAttachment } = load('lib/terms.ts');
const { GET } = load('app/terms.pdf/route.ts');
const booking = {
  title: 'Invoice ready', customerName: 'Customer', bookingCode: 'TEST',
  startDate: new Date('2026-10-19T12:00:00Z'), endDate: new Date('2026-10-20T12:00:00Z'),
};
const unescape = (value) => value.replaceAll('&amp;', '&');

test('private invoices use an absolute app download link and readable button colors', async () => {
  const source = 'https://store.private.blob.vercel-storage.com/invoices/test.pdf?download=1';
  const html = await bookingEmailHtml({ ...booking, invoiceUrl: source, termsUrl: '/terms-en.pdf' });
  const links = [...html.matchAll(/<a href="([^"]+)"/g)].map((match) => unescape(match[1]));
  const invoice = new URL(links[0]);
  assert.equal(invoice.origin, 'https://rental.example');
  assert.equal(invoice.pathname, '/api/blob/file');
  assert.equal(invoice.searchParams.get('src'), source);
  assert.equal(invoice.searchParams.get('download'), '1');
  assert.equal(links[1], 'https://rental.example/terms-en.pdf');
  assert.match(html, /bgcolor="#b12ac0"/);
  assert.match(html, /<span style="color:#fafafa;">Open Billing document<\/span>/);
});

test('resending an invoice keeps existing relative proxy links usable', async () => {
  const source = '/api/blob/file?src=https%3A%2F%2Fstore.private.blob.vercel-storage.com%2Ftest.pdf&download=1';
  const html = await bookingEmailHtml({ ...booking, invoiceUrl: source });
  const link = unescape(html.match(/<a href="([^"]+)"/)[1]);
  const url = new URL(link);
  assert.equal(url.pathname, '/api/blob/file');
  assert.equal(url.searchParams.get('src'), 'https://store.private.blob.vercel-storage.com/test.pdf');
});

test('legacy terms settings produce an available PDF attachment and absolute link', async () => {
  const terms = await getTermsEmailAttachment();
  assert.equal(new URL(terms.url).pathname, '/terms-en.pdf');
  assert.equal(new URL(terms.url).origin, 'https://rental.example');
  assert.equal(terms.attachment.content.subarray(0, 4).toString(), '%PDF');
});

test('terms links in old emails redirect to the available PDF', async () => {
  const response = await GET(new Request('https://rental.example/terms.pdf?download=1'));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://rental.example/terms-en.pdf');
});

test('custom terms URLs remain the redirect destination', async () => {
  tenant.termsPdfUrl = 'https://documents.example/rental-terms.pdf';
  try {
    const response = await GET(new Request('https://rental.example/terms.pdf'));
    assert.equal(response.headers.get('location'), tenant.termsPdfUrl);
  } finally {
    tenant.termsPdfUrl = '/terms.pdf';
  }
});

for (const [locale, filename] of [
  ['en', 'terms-en.pdf'], ['es', 'terms-es.pdf'], ['nl', 'terms-nl.pdf'],
  ['es-ES', 'terms-es.pdf'], ['nl-NL', 'terms-nl.pdf'],
]) {
  test(`${locale} emails link and attach the matching website terms PDF`, async () => {
    const terms = await getTermsEmailAttachment(locale);
    assert.equal(new URL(terms.url).pathname, `/${filename}`);
    assert.equal(terms.attachment.filename, filename);
    assert.deepEqual(terms.attachment.content, fs.readFileSync(path.resolve(__dirname, '..', 'public', filename)));
    const html = await bookingEmailHtml({ ...booking, termsUrl: terms.url });
    const link = new URL(unescape(html.match(/<a href="([^"]+)"/)[1]));
    assert.equal(link.origin, 'https://rental.example');
    assert.equal(link.pathname, `/${filename}`);
  });
}

test('unsupported languages fall back to the available English terms', async () => {
  const terms = await getTermsEmailAttachment('de');
  assert.equal(new URL(terms.url).pathname, '/terms-en.pdf');
});

const {
  getCustomerEmailContent, getEmailLabels, formatEmailDateTime,
  localizeAutomationEmailConfig, formatEmailText,
} = load('lib/email-locale.ts');
const { resolveBookingEmailLocale } = load('lib/booking-email-locale.ts');

for (const [locale, subject, hello, invoice, termsLabel, month] of [
  ['en', 'Invoice for Payment', 'Hello', 'Invoice', 'Terms and Conditions', 'Oct'],
  ['es', 'Factura pendiente de pago', 'Hola', 'Factura', 'Términos y condiciones', 'oct'],
  ['nl', 'Factuur ter betaling', 'Hallo', 'Factuur', 'Algemene voorwaarden', 'okt'],
]) {
  test(`${locale} invoice subject, body, labels, dates, buttons and terms match`, async () => {
    const content = getCustomerEmailContent('invoice', locale);
    assert.equal(content.subject, subject);
    const terms = await getTermsEmailAttachment(locale);
    const html = await bookingEmailHtml({
      ...booking, ...content, locale, invoiceUrl: 'https://store.private.blob.vercel-storage.com/test.pdf',
      documentLabel: getEmailLabels(locale).invoice, termsUrl: terms.url,
      totalAmountCents: 12500, extras: [{ name: 'GPS', quantity: 1, lineTotal: 500 }],
    });
    assert.ok(html.includes(`lang="${locale}"`));
    assert.ok(html.includes(`${hello} Customer,`));
    assert.ok(html.includes(`${getEmailLabels(locale).open} ${invoice}`));
    assert.ok(html.includes(termsLabel));
    assert.ok(html.includes(`terms-${locale}.pdf`));
    assert.ok(formatEmailDateTime(booking.startDate, locale).includes(month));
    if (locale !== 'en') {
      for (const english of ['CUSTOMER INFORMATION', 'BOOKING INFORMATION', 'Total Amount', 'Please do not reply', 'Thank you for choosing']) {
        assert.equal(html.includes(english), false, english);
      }
    }
  });

  test(`${locale} supports every standard customer email with no unresolved placeholders`, async () => {
    for (const kind of ['confirmed', 'created', 'invoice', 'billing', 'receipt', 'payment', 'partner', 'expired', 'declined', 'agreement', 'review']) {
      const content = getCustomerEmailContent(kind, locale, {
        bookingCode: 'TEST', agreementNumber: 'AGR-1', reviewUrl: 'https://rental.example/review/TEST',
      });
      assert.ok(content.subject.length > 0, kind);
      assert.ok(content.title.length > 0, kind);
      const html = await bookingEmailHtml({ ...booking, ...content, locale });
      assert.equal(html.includes('{{'), false, kind);
    }
  });
}

test('saved booking language wins over staff language and is used by scheduled emails', async () => {
  assert.equal(await resolveBookingEmailLocale('new-spanish-booking', 'es-ES'), 'es');
  assert.equal(await resolveBookingEmailLocale('new-spanish-booking', 'nl'), 'es');
  assert.equal(await resolveBookingEmailLocale('new-spanish-booking'), 'es');
  assert.equal(await resolveBookingEmailLocale('legacy-booking', 'nl'), 'nl');
  assert.equal(await resolveBookingEmailLocale('unknown-language', 'de'), 'en');
});

test('standard automated email templates are translated before substituting booking values', () => {
  for (const locale of ['es', 'nl']) {
    for (const [subject, emailTitle] of [
      ['Your booking {{bookingCode}} is confirmed!', 'Booking Confirmed'],
      ['Reminder: Your rental pickup is tomorrow ({{bookingCode}})', 'Pickup Reminder'],
      ['Reminder: Your vehicle return is tomorrow ({{bookingCode}})', 'Return Reminder'],
    ]) {
      const result = localizeAutomationEmailConfig({ subject, emailTitle }, locale);
      assert.notEqual(result.subject, subject);
      assert.notEqual(result.emailTitle, emailTitle);
      assert.ok(formatEmailText(result.subject, { bookingCode: 'TEST' }).includes('TEST'));
    }
  }
});

test('custom automation copy is preserved and explicit translations are supported', () => {
  const config = { subject: 'Custom offer', introText: 'Custom message', translations: { es: { subject: 'Oferta especial', introText: 'Mensaje personalizado' } } };
  assert.equal(localizeAutomationEmailConfig(config, 'nl').subject, 'Custom offer');
  assert.equal(localizeAutomationEmailConfig(config, 'es').subject, 'Oferta especial');
  assert.equal(config.subject, 'Custom offer');
});

test('customer values and custom decline reasons stay escaped in translated emails', async () => {
  const reason = '<img src=x onerror=alert(1)>';
  const content = getCustomerEmailContent('reason', 'es', { reason });
  const html = await bookingEmailHtml({ ...booking, locale: 'es', customerName: '<script>bad</script>', outroText: content.outroText });
  assert.equal(html.includes(reason), false);
  assert.equal(html.includes('<script>'), false);
  assert.ok(html.includes('Motivo indicado: &lt;img'));
});
