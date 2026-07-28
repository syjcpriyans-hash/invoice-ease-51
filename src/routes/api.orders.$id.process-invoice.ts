import { createFileRoute } from '@tanstack/react-router';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { processInvoiceForOrder } from '@/lib/server/invoice-automation';

export const Route = createFileRoute('/api/orders/$id/process-invoice')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const authorization = request.headers.get('authorization');
          const accessToken = authorization?.startsWith('Bearer ')
            ? authorization.slice('Bearer '.length)
            : '';
          if (!accessToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });

          const admin = getSupabaseAdmin();
          const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
          if (authError || !authData.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const { data: order, error: orderError } = await admin
            .from('orders')
            .select('id, owner_id, customer_information(id)')
            .eq('id', params.id)
            .single();
          if (orderError || !order) return Response.json({ error: 'Order not found' }, { status: 404 });
          if (order.owner_id !== authData.user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

          const info = Array.isArray(order.customer_information)
            ? order.customer_information[0]
            : order.customer_information;
          if (!info) {
            return Response.json({ error: 'Customer information has not been submitted.' }, { status: 400 });
          }

          const result = await processInvoiceForOrder(order.id);
          return Response.json(result, { status: result.emailStatus === 'sent' ? 200 : 202 });
        } catch (error) {
          console.error('Manual invoice processing failed', error);
          return Response.json(
            { error: error instanceof Error ? error.message : 'Could not process invoice.' },
            { status: 500 },
          );
        }
      },
    },
  },
});
