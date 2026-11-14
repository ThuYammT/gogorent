import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

prisma.$queryRaw`SELECT now() AS time`
  .then((r) => console.log("✅ Connected! Database time:", r))
  .catch((e) => { console.error("❌ Could not connect:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
