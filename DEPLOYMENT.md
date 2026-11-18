# Deployment readiness

Reviewed on 2026-11-18. Code checks pass for a university demo deployment using Omise test mode. Complete the browser rehearsal below on the hosted URL before the presentation. Real-money production launch remains out of scope.

## Verified

- Production Next.js build and TypeScript compilation pass.
- All 55 automated tests pass, including pickup/return meeting validation, meeting authorization, return QR planning requirements and overdue returns, independent tab sessions, administrator listing removal, and payment/handover regression checks.
- Login and all registration screens share the homepage’s ivory, sage, and amber styling. Admins can open an item under Listings and remove it with a required reason. This hides it publicly, marks it Rejected for the owner, sends an owner notification, and retains rental history. Unresolved bookings and proposed replacements block removal until resolved. No database migration is required.
- Admin and owner portals share the same ivory/sage theme across dashboards, navigation, forms, cards, and tables. Navigation retains notification counts and active states; mobile menus support Escape, focus containment, and background scroll locking. Status colors and operational actions remain intact.
- ESLint passes with zero errors and 16 existing warnings, mainly image optimization and unused parameters.
- Prisma schema validates; the configured database connects and all 11 migrations are applied, including `20261118140000_booking_meetings`.
- Production dependency audit reports no known vulnerabilities.
- Admin category management is available at `/admin/categories`, with creation, editing, optional icons, duplicate checks, administrator authorization, and atomic audit logs. Owners use these categories in new and edited listings. No schema migration is needed for this feature.
- The build command now generates the ignored Prisma client before compiling, supporting clean deployments.
- New rental requests include a pickup time and map meeting point for owner review. After confirmed collection, a popup collects the return time and map meeting point on the existing end date. Both parties see the plans; return changes notify the owner and expire unscanned return QRs. Times are explicitly Bangkok (UTC+7). Past-due rentals retain return QR access. Browser-tested with disposable users and rentals; all temporary data was removed.

## Demo deployment and rehearsal

- Keep `OMISE_SECRET_KEY` set to your Omise test secret key (`skey_test_...`). Checkout identifies this mode and shows a test notice and charge ID without exposing the secret. Do not use live keys for this demo: collection cancellation currently simulates refunds in the database and does not send money through Omise.
- Generate a payment QR as the renter, find the displayed charge ID in the Omise test dashboard, and use Actions to mark the charge Successful. Back in GoGoRent, click **Check payment status**. This fetches the charge from Omise on the server and unlocks collection once rental fee and deposit are confirmed. Automatic webhook delivery is not required for this manual check flow.
- Each browser tab now has its own login. Open `/login` in three normal tabs in one browser and sign in separately as admin, owner, and renter. A fresh tab starts logged out, even if another tab is logged in. Refresh and same-tab navigation retain that tab's account; logout affects only that tab. Two tabs may also use different accounts with the same role. Refresh the relevant page after another account updates a booking.
- Independent tabs require HTTPS (or localhost), JavaScript, service workers, and browser storage. Chrome/Edge are supported for the demo. On first visit the app installs a small session-routing worker and reloads once. The worker stores only opaque tab routing identifiers in IndexedDB; authentication tokens remain in server-validated HttpOnly cookies. It does not cache pages or API responses. Existing shared-cookie logins must sign in again after this deployment. Serve `/tab-sessions.js` with the configured no-store header. Private settlement receipts open in the same tab to retain the correct account context.
- Perform browser testing with separate admin, owner, and renter accounts: category creation/editing/duplicates, owner listing submission, admin approval, booking, PromptPay payment, collection, return, issue resolution, refund, and payout. Browser flows have not been verified in this review.
- Verify production Supabase storage configuration: public `device-images`, private `collection-issue-evidence` (at least 10 MB files), and private `settlement-receipts` (at least 5 MB files). Confirm private files cannot be fetched anonymously.
- Configure the hosted environment's `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` (or legacy service-role key), and test `OMISE_SECRET_KEY`. Keep server secrets private. For automatic webhook delivery, configure `OMISE_WEBHOOK_SECRET` and the provider endpoint `/api/payments/omise/webhook`; otherwise use the manual status check described above.
- The image allowlist in `next.config.ts` is tied to the current Supabase host; update it if production uses a different project.
- Verify the selected hosting platform supports the 52 MB Server Action body limit needed by evidence uploads; platform request limits can be lower. Verify HTTPS camera access and QR photo scanning on mobile.
- Confirm an active admin account and prepared owner/renter accounts. Use demonstration data and explain that payment confirmation and cancellation refunds are simulated; live payment activation and real settlement/refund operations are deferred.

## Release commands

The configured database already has the additive meeting migration. If a deployment uses a different database, apply its pending migrations before switching to this version; old bookings have nullable meeting fields and remain readable.

```sh
npm ci
npx prisma validate
npx prisma migrate deploy
npm run lint
npm run build
npm start
```

Run migrations in the intended deployment environment before switching traffic. Do not run the demo seed against production. Google fonts require network access during the build. Existing sessions are invalidated when first deploying the secure-session migration.
