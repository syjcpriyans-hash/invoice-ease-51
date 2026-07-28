import { createFileRoute } from '@tanstack/react-router';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';

export const Route = createFileRoute('/api/invoices/$id/download')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const authorization = request.headers.get('authorization');
          const accessToken = authorization?.startsWith('Bearer ')
            ? authorization.slice('Bearer '.length)
            : '';
          if (!accessToken) return new Response('Unauthorized', { status: 401 });

          const admin = getSupabaseAdmin();
          const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
          if (authError || !authData.user) return new Response('Unauthorized', { status: 401 });

          const { data: invoice, error: invoiceError } = await admin
            .from('invoices')
            .select('owner_id, invoice_number, pdf_path')
            .eq('id', params.id)
            .single();
          if (invoiceError || !invoice) return new Response('Invoice not found', { status: 404 });
          if (invoice.owner_id !== authData.user.id) return new Response('Forbidden', { status: 403 });
          if (!invoice.pdf_path) return new Response('PDF has not been generated', { status: 404 });

          const { data: pdf, error: downloadError } = await admin.storage
            .from('invoices')
            .download(invoice.pdf_path);
          if (downloadError) throw downloadError;

          return new Response(await pdf.arrayBuffer(), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${String(invoice.invoice_number).replace(/[^a-zA-Z0-9._-]/g, '-')}.pdf"`,
              'Cache-Control': 'private, no-store',
            },
          });
        } catch (error) {
          console.error('Invoice PDF download failed', error);
          return new Response('Could not download invoice PDF', { status: 500 });
        }
      },
    },
  },
});
