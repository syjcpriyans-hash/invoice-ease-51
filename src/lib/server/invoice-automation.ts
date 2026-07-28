import { Buffer } from 'node:buffer';
import { createInvoicePdf } from './invoice-pdf';
import { getSupabaseAdmin } from './supabase-admin';

type AutomationResult = {
  invoiceId: string;
  invoiceNumber: string;
  emailStatus: 'sent' | 'failed';
  providerId?: string;
  error?: string;
};

type InvoiceRow = {
  id: string;
  owner_id: string;
  order_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  subtotal: number | string;
  discount_amount: number | string;
  shipping: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total: number | string;
  pdf_path: string | null;
  email_status: string;
  email_provider_id: string | null;
};

function numberValue(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'invoice';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template,
  );
}

async function addTimeline(orderId: string, status: string, note: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('order_timeline').insert({
    order_id: orderId,
    status,
    note,
  });
  if (error) console.error('Could not add order timeline event', error);
}

async function updateOrderStatus(orderId: string, status: string, note: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
  await addTimeline(orderId, status, note);
}

async function sendInvoiceEmail(args: {
  invoice: InvoiceRow;
  pdfBytes: Uint8Array;
  recipient: string;
  customerName: string;
  businessName: string;
  subjectTemplate: string;
  greetingTemplate: string;
  bodyTemplate: string;
  closingTemplate: string;
}): Promise<{ providerId: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error('Email configuration is missing. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel.');
  }

  const replacements = {
    invoice_number: args.invoice.invoice_number,
    customer_name: args.customerName,
    business_name: args.businessName,
  };

  const subject = renderTemplate(args.subjectTemplate, replacements);
  const greeting = renderTemplate(args.greetingTemplate, replacements);
  const body = renderTemplate(args.bodyTemplate, replacements);
  const closing = renderTemplate(args.closingTemplate, replacements);
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#172033;line-height:1.6;max-width:640px;margin:0 auto">
      <p>${escapeHtml(greeting)}</p>
      <p>${escapeHtml(body).replaceAll('\n', '<br />')}</p>
      <p><strong>Invoice:</strong> ${escapeHtml(args.invoice.invoice_number)}<br />
      <strong>Total:</strong> ${escapeHtml(
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: args.invoice.currency,
        }).format(numberValue(args.invoice.total)),
      )}</p>
      <p>The PDF invoice is attached to this email.</p>
      <p>${escapeHtml(closing).replaceAll('\n', '<br />')}</p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `invoice-${args.invoice.id}-initial-send`,
    },
    body: JSON.stringify({
      from,
      to: [args.recipient],
      subject,
      html,
      attachments: [
        {
          filename: `${safeFilename(args.invoice.invoice_number)}.pdf`,
          content: Buffer.from(args.pdfBytes).toString('base64'),
        },
      ],
      tags: [
        { name: 'invoice_id', value: args.invoice.id },
        { name: 'order_id', value: args.invoice.order_id },
      ],
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.id) {
    throw new Error(payload.message || payload.error?.message || `Resend returned HTTP ${response.status}.`);
  }

  return { providerId: payload.id };
}

async function loadAutomationData(orderId: string) {
  const admin = getSupabaseAdmin();
  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('*, order_items(*), customer_information(*)')
    .eq('id', orderId)
    .single();
  if (orderError) throw orderError;

  const { data: settings, error: settingsError } = await admin
    .from('business_settings')
    .select('*')
    .eq('owner_id', order.owner_id)
    .single();
  if (settingsError) throw settingsError;

  return { order, settings };
}

async function getOrCreateInvoice(order: any, settings: any): Promise<InvoiceRow> {
  const admin = getSupabaseAdmin();
  const { data: existing, error: existingError } = await admin
    .from('invoices')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing as InvoiceRow;

  const { data: reserved, error: reserveError } = await admin.rpc('reserve_next_invoice_number', {
    p_owner_id: order.owner_id,
  });
  if (reserveError) throw reserveError;

  const reservation = Array.isArray(reserved) ? reserved[0] : reserved;
  if (!reservation) throw new Error('Could not reserve an invoice number.');

  const invoiceNumber = `${reservation.invoice_prefix}${reservation.invoice_number}`;
  const invoiceDate = new Date();
  const dueDate = addDays(invoiceDate, numberValue(order.due_in_days));

  const { data: invoice, error: invoiceError } = await admin
    .from('invoices')
    .insert({
      owner_id: order.owner_id,
      order_id: order.id,
      invoice_number: invoiceNumber,
      invoice_date: isoDate(invoiceDate),
      due_date: isoDate(dueDate),
      currency: order.currency,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      shipping: order.shipping,
      tax_rate: order.tax_rate,
      tax_amount: order.tax_amount,
      total: order.total,
      email_status: 'queued',
    })
    .select('*')
    .single();

  if (invoiceError) {
    // A parallel request may have inserted the one-per-order invoice first.
    if ((invoiceError as { code?: string }).code === '23505') {
      const { data: racedInvoice, error: racedError } = await admin
        .from('invoices')
        .select('*')
        .eq('order_id', order.id)
        .single();
      if (racedError) throw racedError;
      return racedInvoice as InvoiceRow;
    }
    throw invoiceError;
  }

  return invoice as InvoiceRow;
}

async function generateAndStorePdf(order: any, settings: any, invoice: InvoiceRow): Promise<Uint8Array> {
  const admin = getSupabaseAdmin();
  const customer = Array.isArray(order.customer_information)
    ? order.customer_information[0]
    : order.customer_information;
  if (!customer) throw new Error('Customer information is missing for this order.');

  const items = [...(order.order_items ?? [])]
    .sort((a, b) => numberValue(a.position) - numberValue(b.position))
    .map((item) => ({
      description: String(item.description ?? ''),
      sku: String(item.sku ?? '') || undefined,
      quantity: numberValue(item.quantity),
      unitPrice: numberValue(item.unit_price),
      lineTotal: numberValue(item.line_total),
    }));

  const pdfBytes = await createInvoicePdf({
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    currency: invoice.currency,
    orderNumber: order.order_number,
    seller: {
      legalBusinessName: String(settings.legal_business_name ?? ''),
      displayName: String(settings.display_name ?? ''),
      businessEmail: String(settings.business_email ?? ''),
      phone: String(settings.phone ?? ''),
      address: String(settings.address ?? ''),
      taxId: String(settings.tax_id ?? ''),
      paymentInstructions: String(settings.payment_instructions ?? ''),
      footerNotes: String(settings.footer_notes ?? ''),
    },
    customer: {
      fullName: String(customer.full_name ?? ''),
      email: String(customer.email ?? order.customer_email ?? ''),
      phone: String(customer.phone ?? ''),
      legalBusinessName: String(customer.legal_business_name ?? ''),
      operatingName: String(customer.operating_name ?? '') || undefined,
      poNumber: String(customer.po_number ?? '') || undefined,
      billingAddress: customer.billing_address ?? {},
      shippingAddress: customer.shipping_address ?? {},
    },
    items,
    subtotal: numberValue(invoice.subtotal),
    discountAmount: numberValue(invoice.discount_amount),
    shipping: numberValue(invoice.shipping),
    taxRate: numberValue(invoice.tax_rate),
    taxAmount: numberValue(invoice.tax_amount),
    total: numberValue(invoice.total),
  });

  const path = `${order.owner_id}/${invoice.id}/${safeFilename(invoice.invoice_number)}.pdf`;
  const { error: uploadError } = await admin.storage.from('invoices').upload(path, pdfBytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { error: invoiceUpdateError } = await admin
    .from('invoices')
    .update({ pdf_path: path, email_status: 'queued', last_error: null })
    .eq('id', invoice.id);
  if (invoiceUpdateError) throw invoiceUpdateError;

  invoice.pdf_path = path;
  invoice.email_status = 'queued';
  return pdfBytes;
}

async function loadStoredPdf(path: string): Promise<Uint8Array> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from('invoices').download(path);
  if (error) throw error;
  return new Uint8Array(await data.arrayBuffer());
}

export async function processInvoiceForOrder(orderId: string): Promise<AutomationResult> {
  const admin = getSupabaseAdmin();
  const { order, settings } = await loadAutomationData(orderId);
  const customer = Array.isArray(order.customer_information)
    ? order.customer_information[0]
    : order.customer_information;
  if (!customer) throw new Error('Customer information has not been submitted.');

  let invoice = await getOrCreateInvoice(order, settings);

  if (['sent', 'delivered'].includes(invoice.email_status)) {
    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      emailStatus: 'sent',
      providerId: invoice.email_provider_id ?? undefined,
    };
  }

  try {
    await updateOrderStatus(order.id, 'invoice_generating', 'Automatic invoice generation started.');

    const pdfBytes = invoice.pdf_path
      ? await loadStoredPdf(invoice.pdf_path)
      : await generateAndStorePdf(order, settings, invoice);

    await updateOrderStatus(order.id, 'invoice_generated', `Invoice ${invoice.invoice_number} generated.`);

    const businessName = String(settings.display_name || settings.legal_business_name || 'Business');
    const result = await sendInvoiceEmail({
      invoice,
      pdfBytes,
      recipient: String(customer.email || order.customer_email),
      customerName: String(customer.full_name || customer.legal_business_name || 'Customer'),
      businessName,
      subjectTemplate: String(settings.email_subject || 'Your invoice {{invoice_number}}'),
      greetingTemplate: String(settings.email_greeting || 'Hello {{customer_name}},'),
      bodyTemplate: String(settings.email_body || 'Thank you for your order. Your invoice is attached.'),
      closingTemplate: String(settings.email_closing || 'Regards,\n{{business_name}}'),
    });

    const sentAt = new Date().toISOString();
    const { error: invoiceUpdateError } = await admin
      .from('invoices')
      .update({
        email_status: 'sent',
        email_provider_id: result.providerId,
        sent_at: sentAt,
        last_error: null,
      })
      .eq('id', invoice.id);
    if (invoiceUpdateError) throw invoiceUpdateError;

    await updateOrderStatus(order.id, 'email_sent', `Invoice ${invoice.invoice_number} emailed to ${customer.email}.`);

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      emailStatus: 'sent',
      providerId: result.providerId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invoice automation failed.';
    await admin
      .from('invoices')
      .update({ email_status: 'failed', last_error: message })
      .eq('id', invoice.id);
    await updateOrderStatus(order.id, 'failed', `Invoice automation failed: ${message}`).catch(console.error);

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      emailStatus: 'failed',
      error: message,
    };
  }
}

export async function resendInvoice(invoiceId: string): Promise<AutomationResult> {
  const admin = getSupabaseAdmin();
  const { data: invoice, error } = await admin
    .from('invoices')
    .select('order_id')
    .eq('id', invoiceId)
    .single();
  if (error) throw error;
  return processInvoiceForOrder(invoice.order_id);
}
