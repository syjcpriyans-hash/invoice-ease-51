import { getSupabaseAdmin } from './supabase-admin';

type CustomerLinkEmailResult = {
  orderId: string;
  emailStatus: 'sent' | 'failed';
  providerId?: string;
  sentAt?: string;
  error?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatMoney(amount: unknown, currency: string): string {
  const numericAmount = Number(amount ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0);
}

function formatExpiry(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

async function addTimeline(orderId: string, status: string, note: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('order_timeline').insert({
    order_id: orderId,
    status,
    note,
  });
  if (error) console.error('Could not add customer-link timeline event', error);
}

export async function sendCustomerLinkEmail(orderId: string): Promise<CustomerLinkEmailResult> {
  const admin = getSupabaseAdmin();

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select(
      'id, owner_id, order_number, customer_email, public_token, token_expires_at, currency, total, customer_link_email_status, customer_link_email_provider_id, customer_link_email_sent_at',
    )
    .eq('id', orderId)
    .single();
  if (orderError) throw orderError;

  if (order.customer_link_email_status === 'sent') {
    return {
      orderId: order.id,
      emailStatus: 'sent',
      providerId: order.customer_link_email_provider_id ?? undefined,
      sentAt: order.customer_link_email_sent_at ?? undefined,
    };
  }

  const { data: settings, error: settingsError } = await admin
    .from('business_settings')
    .select('display_name, legal_business_name, business_email, phone')
    .eq('owner_id', order.owner_id)
    .single();
  if (settingsError) throw settingsError;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.APP_URL?.replace(/\/$/, '');

  if (!apiKey || !from || !appUrl) {
    const message =
      'Customer-link email configuration is missing. Add RESEND_API_KEY, RESEND_FROM_EMAIL, and APP_URL in Vercel.';
    await admin
      .from('orders')
      .update({
        status: 'link_email_failed',
        customer_link_email_status: 'failed',
        customer_link_email_last_error: message,
      })
      .eq('id', order.id);
    await addTimeline(order.id, 'link_email_failed', `Customer-link email failed: ${message}`);
    return { orderId: order.id, emailStatus: 'failed', error: message };
  }

  const customerUrl = `${appUrl}/customer/${order.public_token}`;
  const businessName = String(
    settings.display_name || settings.legal_business_name || 'Invoice Ease customer',
  );
  const subject = `Complete billing information for order ${order.order_number}`;
  const supportLine = [settings.business_email, settings.phone].filter(Boolean).join(' · ');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#172033;line-height:1.6;max-width:640px;margin:0 auto;padding:24px">
      <div style="margin-bottom:24px">
        <p style="font-size:20px;font-weight:700;margin:0">${escapeHtml(businessName)}</p>
      </div>
      <p>Hello,</p>
      <p>Your order <strong>${escapeHtml(order.order_number)}</strong> has been confirmed.</p>
      <p>Please use the secure button below to provide the billing and shipping information required to prepare your invoice.</p>
      <div style="margin:28px 0">
        <a href="${escapeHtml(customerUrl)}" style="display:inline-block;background:#153b5c;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700">
          Complete billing information
        </a>
      </div>
      <div style="background:#f5f7fa;border:1px solid #e4e8ee;border-radius:8px;padding:16px;margin:20px 0">
        <p style="margin:0"><strong>Order:</strong> ${escapeHtml(order.order_number)}</p>
        <p style="margin:6px 0 0"><strong>Order total:</strong> ${escapeHtml(formatMoney(order.total, order.currency))}</p>
      </div>
      <p style="font-size:13px;color:#5e6878">This secure link expires on ${escapeHtml(formatExpiry(order.token_expires_at))} UTC. If you did not expect this request, please contact the sender.</p>
      ${supportLine ? `<p style="font-size:13px;color:#5e6878">${escapeHtml(supportLine)}</p>` : ''}
    </div>
  `;

  await admin
    .from('orders')
    .update({
      customer_link_email_status: 'queued',
      customer_link_email_last_error: null,
    })
    .eq('id', order.id);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `customer-link-${order.id}`,
      },
      body: JSON.stringify({
        from,
        to: [order.customer_email],
        subject,
        html,
        tags: [
          { name: 'message_type', value: 'customer_link' },
          { name: 'order_id', value: order.id },
        ],
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: { message?: string };
    };

    if (!response.ok || !payload.id) {
      throw new Error(
        payload.message || payload.error?.message || `Resend returned HTTP ${response.status}.`,
      );
    }

    const sentAt = new Date().toISOString();
    const { error: updateError } = await admin
      .from('orders')
      .update({
        status: 'link_sent',
        customer_link_email_status: 'sent',
        customer_link_email_provider_id: payload.id,
        customer_link_email_sent_at: sentAt,
        customer_link_email_last_error: null,
      })
      .eq('id', order.id);
    if (updateError) throw updateError;

    await addTimeline(
      order.id,
      'link_sent',
      `Customer information link emailed to ${order.customer_email}.`,
    );

    return {
      orderId: order.id,
      emailStatus: 'sent',
      providerId: payload.id,
      sentAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Customer-link email failed.';
    await admin
      .from('orders')
      .update({
        status: 'link_email_failed',
        customer_link_email_status: 'failed',
        customer_link_email_last_error: message,
      })
      .eq('id', order.id);
    await addTimeline(order.id, 'link_email_failed', `Customer-link email failed: ${message}`);

    return { orderId: order.id, emailStatus: 'failed', error: message };
  }
}
