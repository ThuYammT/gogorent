This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
