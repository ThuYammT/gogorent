This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Administrators can create and edit rental categories at `/admin/categories`,
accessible from the admin sidebar and dashboard. Owners select these categories
when creating or editing listings. Category names are checked for duplicates
without regard to letter case, and changes are recorded in the admin audit log.

See [DEPLOYMENT.md](DEPLOYMENT.md) for verified checks and outstanding launch blockers.

## Getting Started

Configure the project before starting the development server:

1. Create a Supabase project and a public Storage bucket named `device-images`.
2. Add the following values to your local `.env` file:

   ```dotenv
   DATABASE_URL="your PostgreSQL connection string"
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SECRET_KEY="your Supabase secret key"
   ```

   Find the project URL and secret key in your Supabase project's API settings.
   The legacy `SUPABASE_SERVICE_ROLE_KEY` can be used instead of
   `SUPABASE_SECRET_KEY`. Keep server keys private; do not use a publishable
   or anon key as the server key, and do not commit `.env`.
3. Generate the Prisma client and apply migrations to the configured database:

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   The secure-session migration invalidates existing login cookies; all users
   must sign in again after deployment.

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Restart the development server after changing environment variables.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

When an owner submits a new device, each active administrator receives an
in-app notification linking to the listing review. Administrators can find
their notifications and mark them as read in the admin sidebar.

Owners can generate a collection QR for an approved booking on the Rentals
page. They can show the code or download it as a PNG to share with the
booking's renter. The code expires after five minutes even if saved. If the
code is lost, it cannot be retrieved and a new one can be generated after it
expires. The renter opens the approved booking under Your bookings and scans
the code with their camera or uploads a QR photo. Photos are decoded on the
device; only the QR code is sent for verification. Camera access requires
permission and HTTPS (or localhost). After scanning, the renter confirms
receipt and the listed condition. Collection requires the rental payment and
deposit to have been confirmed through Omise first; confirming receipt activates
the rental without charging again. For the university demo, use Omise test mode,
mark the test charge Successful in its dashboard, and click Check payment status
in GoGoRent. No real-money payment is needed for that demonstration. The current
collection flow does not require owner confirmation or condition photos.

Before accepting a device, the renter can report an issue from the booking.
The owner reviews it and proposes a replacement, repair and reinspection, or
cancellation; the renter must accept or decline. Collection and ordinary
cancellation are blocked while an issue is unresolved. Replacement keeps the
original price and deposit and requires a new collection QR. Cancellation
does not move money; in the current university demo it records simulated refunds
for the completed rental payment and deposit. This is not a real provider refund.

Issue photos and videos are optional. To enable them, create a **private**
Supabase Storage bucket named `collection-issue-evidence`, with a file-size
limit of at least 10 MB. Up to five JPG, PNG, WebP, MP4, MOV or WebM files of
10 MB each are accepted. Without the private bucket, reports without evidence
still work; uploads fail with a configuration message. The server action body
limit is 52 MB to accommodate the files and multipart overhead.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
