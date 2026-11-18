# Deployment readiness

Reviewed on 2026-11-18. Code checks pass for a university demo deployment using Omise test mode. Complete the browser rehearsal below on the hosted URL before the presentation. Real-money production launch remains out of scope.

## Verified

- Production Next.js build and TypeScript compilation pass.
- All 35 automated tests pass. Updated stale collection/handover fixtures to match payment-before-collection and simulated cancellation refunds. Added coverage for partial/unpaid bookings, issue blocking, fresh repair QR, repeated payment confirmation, pending/failed charges, and amount/currency validation.
- ESLint passes with zero errors and 16 existing warnings, mainly image optimization and unused parameters.
- Prisma schema validates; the configured database connects and all 10 migrations are applied.
- Production dependency audit reports no known vulnerabilities.
- Admin category management is available at `/admin/categories`, with creation, editing, optional icons, duplicate checks, administrator authorization, and atomic audit logs. Owners use these categories in new and edited listings. No schema migration is needed for this feature.
- The build command now generates the ignored Prisma client before compiling, supporting clean deployments.

## Demo deployment and rehearsal

- Keep `OMISE_SECRET_KEY` set to your Omise test secret key (`skey_test_...`). Checkout identifies this mode and shows a test notice and charge ID without exposing the secret. Do not use live keys for this demo: collection cancellation currently simulates refunds in the database and does not send money through Omise.
- Generate a payment QR as the renter, find the displayed charge ID in the Omise test dashboard, and use Actions to mark the charge Successful. Back in GoGoRent, click **Check payment status**. This fetches the charge from Omise on the server and unlocks collection once rental fee and deposit are confirmed. Automatic webhook delivery is not required for this manual check flow.
- Use three separate browser profiles or three different browsers for admin, owner, and renter. Normal tabs within one profile share the `gogorent_session` cookie, so logging in as another role replaces the account for those tabs. Multiple incognito windows in the same browser also share their incognito session. Refresh the other role's page after a status changes.
- Perform browser testing with separate admin, owner, and renter accounts: category creation/editing/duplicates, owner listing submission, admin approval, booking, PromptPay payment, collection, return, issue resolution, refund, and payout. Browser flows have not been verified in this review.
- Verify production Supabase storage configuration: public `device-images`, private `collection-issue-evidence` (at least 10 MB files), and private `settlement-receipts` (at least 5 MB files). Confirm private files cannot be fetched anonymously.
- Configure the hosted environment's `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` (or legacy service-role key), and test `OMISE_SECRET_KEY`. Keep server secrets private. For automatic webhook delivery, configure `OMISE_WEBHOOK_SECRET` and the provider endpoint `/api/payments/omise/webhook`; otherwise use the manual status check described above.
- The image allowlist in `next.config.ts` is tied to the current Supabase host; update it if production uses a different project.
- Verify the selected hosting platform supports the 52 MB Server Action body limit needed by evidence uploads; platform request limits can be lower. Verify HTTPS camera access and QR photo scanning on mobile.
- Confirm an active admin account and prepared owner/renter accounts. Use demonstration data and explain that payment confirmation and cancellation refunds are simulated; live payment activation and real settlement/refund operations are deferred.

## Release commands

```sh
npm ci
npx prisma validate
npx prisma migrate deploy
npm run lint
npm run build
npm start
```

Run migrations in the intended deployment environment before switching traffic. Do not run the demo seed against production. Google fonts require network access during the build. Existing sessions are invalidated when first deploying the secure-session migration.
