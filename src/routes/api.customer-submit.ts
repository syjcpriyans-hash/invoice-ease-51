import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { processInvoiceForOrder } from '@/lib/server/invoice-automation';

const addressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(30),
  country: z.string().trim().min(1).max(100),
});

const requestSchema = z.object({
  token: z.string().uuid(),
  information: z.object({
    fullName: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(5).max(50),
    legalBusinessName: z.string().trim().min(2).max(200),
    operatingName: z.string().trim().max(200).optional().default(''),
    poNumber: z.string().trim().max(100).optional().default(''),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    shippingSameAsBilling: z.boolean(),
    confirmedAccurate: z.literal(true),
    confirmedAuthorized: z.literal(true),
  }),
});

export const Route = createFileRoute('/api/customer-submit')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = requestSchema.parse(await request.json());
          const admin = getSupabaseAdmin();

          const { data: order, error: orderError } = await admin
            .from('orders')
            .select('id, token_expires_at, customer_information(id)')
            .eq('public_token', payload.token)
            .maybeSingle();

          if (orderError) throw orderError;
          if (!order || new Date(order.token_expires_at).getTime() <= Date.now()) {
            return Response.json({ error: 'This customer link is invalid or expired.' }, { status: 404 });
          }

          const existingInfo = Array.isArray(order.customer_information)
            ? order.customer_information[0]
            : order.customer_information;

          if (!existingInfo) {
            const info = payload.information;
            const { error: submitError } = await admin.rpc('submit_public_customer_information', {
              p_token: payload.token,
              p_full_name: info.fullName,
              p_email: info.email,
              p_phone: info.phone,
              p_legal_business_name: info.legalBusinessName,
              p_operating_name: info.operatingName ?? '',
              p_po_number: info.poNumber ?? '',
              p_billing_address: info.billingAddress,
              p_shipping_address: info.shippingAddress,
              p_shipping_same_as_billing: info.shippingSameAsBilling,
              p_confirmed_accurate: true,
              p_confirmed_authorized: true,
            });
            if (submitError) throw submitError;
          }

          const automation = await processInvoiceForOrder(order.id);

          return Response.json({
            success: true,
            orderId: order.id,
            invoiceId: automation.invoiceId,
            invoiceNumber: automation.invoiceNumber,
            emailStatus: automation.emailStatus,
            automationError: automation.error ?? null,
          });
        } catch (error) {
          console.error('Customer submission failed', error);
          const message = error instanceof Error ? error.message : 'Could not submit customer information.';
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
