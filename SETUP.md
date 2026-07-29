# Resend delivery webhooks — activation checklist

## Files
1. Add `src/routes/api.webhooks.resend.ts`.
2. Add `"svix": "^1.99.1"` to `dependencies` in `package.json`.
3. Run `npm install`.
4. Deploy the application.

## Resend configuration
Create a webhook with this endpoint:

`https://YOUR-CURRENT-VERCEL-URL/api/webhooks/resend`

Select these events:
- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.bounced`
- `email.failed`
- `email.suppressed`
- `email.complained`

Copy the webhook signing secret.

## Vercel configuration
Add this Production environment variable:

`RESEND_WEBHOOK_SECRET=whsec_...`

Redeploy after saving the variable.

## Test
1. Send a customer link or invoice through Invoice Ease.
2. Open the Resend webhook message log.
3. Confirm the endpoint responds with HTTP 200.
4. Confirm:
   - delivered invoice → invoice status `delivered`, order status `delivered`
   - bounced invoice → invoice status `bounced`, order status `failed`
   - failed/suppressed/complained invoice → invoice status `failed`, order status `failed`
   - failed customer-link email → status `link_email_failed`
5. Replay one successful webhook and confirm it does not create another status transition.

No database migration is required because the implementation uses the existing status fields.
