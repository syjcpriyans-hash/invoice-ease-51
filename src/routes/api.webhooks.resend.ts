import { createFileRoute } from '@tanstack/react-router';
import { Webhook } from 'svix';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

type ResendEmailEvent = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    created_at?: string;
    from?: string;
    to?: string[];
    subject?: string;
    tags?: Record<string, string>;
    bounce?: {
      message?: string;
      type?: string;
      subType?: string;
      diagnosticCode?: string[];
    };
  };
};

type InvoiceEventStatus = 'sent' | 'delivered' | 'bounced' | 'failed';

function eventDescription(event: ResendEmailEvent): string {
  const recipient = event.data.to?.[0];
  const bounceMessage = event.data.bounce?.message;

  switch (event.type) {
    case 'email.delivered':
      return recipient ? `Invoice email delivered to ${recipient}.` : 'Invoice email delivered.';
    case 'email.delivery_delayed':
      return recipient
        ? `Invoice email delivery to ${recipient} is delayed.`
        : 'Invoice email delivery is delayed.';
    case 'email.bounced':
      return (
        bounceMessage ||
        (recipient ? `Invoice email to ${recipient} bounced.` : 'Invoice email bounced.')
      );
    case 'email.failed':
      return recipient ? `Invoice email to ${recipient} failed.` : 'Invoice email failed.';
    case 'email.suppressed':
      return recipient
        ? `Invoice email to ${recipient} was suppressed.`
        : 'Invoice email was suppressed.';
    case 'email.complained':
      return recipient
        ? `The recipient ${recipient} reported the invoice email as spam.`
        : 'The invoice email was reported as spam.';
    default:
      return `Resend event received: ${event.type}.`;
  }
}

function invoiceStatusForEvent(eventType: string): InvoiceEventStatus | null {
  switch (eventType) {
    case 'email.sent':
      return 'sent';
    case 'email.delivered':
      return 'delivered';
    case 'email.bounced':
      return 'bounced';
    case 'email.failed':
    case 'email.suppressed':
    case 'email.complained':
      return 'failed';
    default:
      return null;
  }
}

async function addTimeline(orderId: string, status: string, note: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('order_timeline').insert({
    order_id: orderId,
    status,
    note,
  });
  if (error) throw error;
}

async function findInvoice(event: ResendEmailEvent) {
  const admin = getSupabaseAdmin();
  const invoiceId = event.data.tags?.invoice_id;

  let query = admin
    .from('invoices')
    .select('id, order_id, invoice_number, email_status, email_provider_id, last_error');

  query = invoiceId
    ? query.eq('id', invoiceId)
    : query.eq('email_provider_id', event.data.email_id);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function applyInvoiceEvent(event: ResendEmailEvent): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const invoice = await findInvoice(event);
  if (!invoice) return false;

  const description = eventDescription(event);

  if (event.type === 'email.delivery_delayed') {
    const { error } = await admin
      .from('invoices')
      .update({
        email_provider_id: event.data.email_id,
        last_error: description,
      })
      .eq('id', invoice.id);
    if (error) throw error;
    return true;
  }

  const nextStatus = invoiceStatusForEvent(event.type);
  if (!nextStatus) return true;

  const alreadyApplied =
    invoice.email_status === nextStatus && invoice.email_provider_id === event.data.email_id;
  if (alreadyApplied) return true;

  const invoiceUpdate: Record<string, string | null> = {
    email_status: nextStatus,
    email_provider_id: event.data.email_id,
    last_error: ['bounced', 'failed'].includes(nextStatus) ? description : null,
  };

  if (nextStatus === 'sent') {
    invoiceUpdate.sent_at =
      event.created_at || event.data.created_at || new Date().toISOString();
  }

  const { error: invoiceError } = await admin
    .from('invoices')
    .update(invoiceUpdate)
    .eq('id', invoice.id);
  if (invoiceError) throw invoiceError;

  if (nextStatus === 'delivered') {
    const { error: orderError } = await admin
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', invoice.order_id);
    if (orderError) throw orderError;

    await addTimeline(
      invoice.order_id,
      'delivered',
      `Invoice ${invoice.invoice_number} was delivered to the recipient's mail server.`,
    );
  } else if (nextStatus === 'bounced' || nextStatus === 'failed') {
    const { error: orderError } = await admin
      .from('orders')
      .update({ status: 'failed' })
      .eq('id', invoice.order_id);
    if (orderError) throw orderError;

    await addTimeline(
      invoice.order_id,
      'failed',
      `Invoice ${invoice.invoice_number} email failed: ${description}`,
    );
  }

  return true;
}

async function findCustomerLinkOrder(event: ResendEmailEvent) {
  const admin = getSupabaseAdmin();
  const taggedOrderId = event.data.tags?.order_id;

  let query = admin
    .from('orders')
    .select(
      'id, customer_email, status, customer_link_email_status, customer_link_email_provider_id, customer_link_email_last_error',
    );

  query = taggedOrderId
    ? query.eq('id', taggedOrderId)
    : query.eq('customer_link_email_provider_id', event.data.email_id);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function applyCustomerLinkEvent(event: ResendEmailEvent): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const order = await findCustomerLinkOrder(event);
  if (!order) return false;

  const description = eventDescription(event).replaceAll(
    'Invoice email',
    'Customer-link email',
  );

  if (event.type === 'email.delivery_delayed') {
    const { error } = await admin
      .from('orders')
      .update({
        customer_link_email_provider_id: event.data.email_id,
        customer_link_email_last_error: description,
      })
      .eq('id', order.id);
    if (error) throw error;
    return true;
  }

  if (event.type === 'email.sent' || event.type === 'email.delivered') {
    const alreadyApplied =
      order.customer_link_email_status === 'sent' &&
      order.customer_link_email_provider_id === event.data.email_id &&
      !order.customer_link_email_last_error;
    if (alreadyApplied) return true;

    const { error } = await admin
      .from('orders')
      .update({
        status: 'link_sent',
        customer_link_email_status: 'sent',
        customer_link_email_provider_id: event.data.email_id,
        customer_link_email_last_error: null,
      })
      .eq('id', order.id);
    if (error) throw error;
    return true;
  }

  if (
    event.type === 'email.bounced' ||
    event.type === 'email.failed' ||
    event.type === 'email.suppressed' ||
    event.type === 'email.complained'
  ) {
    const alreadyApplied =
      order.customer_link_email_status === 'failed' &&
      order.customer_link_email_provider_id === event.data.email_id &&
      order.customer_link_email_last_error === description;
    if (alreadyApplied) return true;

    const { error } = await admin
      .from('orders')
      .update({
        status: 'link_email_failed',
        customer_link_email_status: 'failed',
        customer_link_email_provider_id: event.data.email_id,
        customer_link_email_last_error: description,
      })
      .eq('id', order.id);
    if (error) throw error;

    await addTimeline(order.id, 'link_email_failed', description);
    return true;
  }

  return true;
}

async function handleEvent(event: ResendEmailEvent): Promise<boolean> {
  const messageType = event.data.tags?.message_type;

  if (messageType === 'customer_link') {
    return applyCustomerLinkEvent(event);
  }

  if (messageType === 'invoice' || event.data.tags?.invoice_id) {
    return applyInvoiceEvent(event);
  }

  if (await applyInvoiceEvent(event)) return true;
  return applyCustomerLinkEvent(event);
}

export const Route = createFileRoute('/api/webhooks/resend')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RESEND_WEBHOOK_SECRET;
        if (!secret) {
          console.error('RESEND_WEBHOOK_SECRET is not configured.');
          return Response.json({ error: 'Webhook is not configured.' }, { status: 500 });
        }

        const svixId = request.headers.get('svix-id');
        const svixTimestamp = request.headers.get('svix-timestamp');
        const svixSignature = request.headers.get('svix-signature');

        if (!svixId || !svixTimestamp || !svixSignature) {
          return Response.json(
            { error: 'Missing webhook signature headers.' },
            { status: 400 },
          );
        }

        const rawBody = await request.text();
        let event: ResendEmailEvent;

        try {
          event = new Webhook(secret).verify(rawBody, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
          }) as ResendEmailEvent;
        } catch (error) {
          console.warn('Rejected an invalid Resend webhook signature.', error);
          return Response.json(
            { error: 'Invalid webhook signature.' },
            { status: 400 },
          );
        }

        try {
          const matched = await handleEvent(event);
          return Response.json({ received: true, matched });
        } catch (error) {
          console.error('Could not process Resend webhook.', error);
          return Response.json(
            { error: 'Webhook processing failed.' },
            { status: 500 },
          );
        }
      },
    },
  },
});
