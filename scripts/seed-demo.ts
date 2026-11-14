import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const camera = await prisma.category.upsert({
    where: { name: "Camera" }, update: {}, create: { name: "Camera", emoji: "📷" },
  });
  const laptop = await prisma.category.upsert({
    where: { name: "Laptop" }, update: {}, create: { name: "Laptop", emoji: "💻" },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@gogorent.test" }, update: {},
    create: { name: "Mali Owner", email: "owner@gogorent.test", passwordHash: "demo-not-a-real-hash", role: "OWNER", isVerified: true },
  });
  const renter = await prisma.user.upsert({
    where: { email: "renter@gogorent.test" }, update: {},
    create: { name: "Alex Renter", email: "renter@gogorent.test", passwordHash: "demo-not-a-real-hash", role: "RENTER" },
  });

  async function device(name: string, categoryId: string, emoji: string, price: number, deposit: number) {
    const found = await prisma.device.findFirst({ where: { name, ownerId: owner.id } });
    return found ?? prisma.device.create({
      data: { name, categoryId, emoji, ownerId: owner.id, description: `${name} in great condition.`,
              pricePerDay: price, depositAmount: deposit, location: "Bangkok", status: "AVAILABLE" },
    });
  }
  const sony = await device("Sony A6400", camera.id, "📷", 420, 3000);
  const mac = await device("MacBook Air M2", laptop.id, "💻", 550, 5000);

  const rentals = [
    { d: sony, start: "2026-12-10", end: "2026-12-13", status: "REQUESTED" as const },
    { d: mac, start: "2026-11-20", end: "2026-11-22", status: "ACTIVE" as const },
    { d: sony, start: "2026-10-01", end: "2026-10-05", status: "COMPLETED" as const },
  ];
  for (const r of rentals) {
    const days = Math.round((Date.parse(r.end) - Date.parse(r.start)) / 86400000);
    const price = Number(r.d.pricePerDay), deposit = Number(r.d.depositAmount);
    await prisma.rental.create({
      data: { deviceId: r.d.id, renterId: renter.id, ownerId: owner.id,
              startDate: new Date(r.start), endDate: new Date(r.end), totalDays: days,
              pricePerDay: price, rentalAmount: price * days, depositAmount: deposit,
              totalAmount: price * days + deposit, status: r.status },
    });
  }
  console.log("✅ Added 2 users, 2 devices and 3 rentals");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); })
      .finally(() => prisma.$disconnect());
