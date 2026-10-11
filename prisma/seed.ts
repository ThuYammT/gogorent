import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding GoGoRent database...");

  // -----------------------------
  // Categories
  // -----------------------------

  const laptop = await prisma.category.upsert({
    where: { name: "Laptop" },
    update: {},
    create: {
      name: "Laptop",
      emoji: "💻",
    },
  });

  const camera = await prisma.category.upsert({
    where: { name: "Camera" },
    update: {},
    create: {
      name: "Camera",
      emoji: "📷",
    },
  });

  const tablet = await prisma.category.upsert({
    where: { name: "Tablet" },
    update: {},
    create: {
      name: "Tablet",
      emoji: "📱",
    },
  });

  const gaming = await prisma.category.upsert({
    where: { name: "Gaming" },
    update: {},
    create: {
      name: "Gaming",
      emoji: "🎮",
    },
  });

  const projector = await prisma.category.upsert({
    where: { name: "Projector" },
    update: {},
    create: {
      name: "Projector",
      emoji: "📽️",
    },
  });

  const creatorGear = await prisma.category.upsert({
    where: { name: "Creator Gear" },
    update: {},
    create: {
      name: "Creator Gear",
      emoji: "🎥",
    },
  });

  // -----------------------------
  // Users
  // -----------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@gogorent.local",
    },
    update: {},
    create: {
      name: "GoGoRent Admin",
      email: "admin@gogorent.local",
      passwordHash: "demo-password-hash",
      role: "ADMIN",
      isVerified: true,
      location: "Bangkok",
    },
  });

  const owner = await prisma.user.upsert({
    where: {
      email: "owner@gogorent.local",
    },
    update: {},
    create: {
      name: "James Lee",
      email: "owner@gogorent.local",
      passwordHash: "demo-password-hash",
      role: "OWNER",
      isVerified: true,
      location: "Bangkok",
      bio: "Tech enthusiast renting out unused gear.",
    },
  });

  const renter = await prisma.user.upsert({
    where: {
      email: "renter@gogorent.local",
    },
    update: {},
    create: {
      name: "Alex Chen",
      email: "renter@gogorent.local",
      passwordHash: "demo-password-hash",
      role: "RENTER",
      isVerified: true,
      location: "Pathum Thani",
    },
  });

  // -----------------------------
  // Devices
  // -----------------------------

  const existingDevices = await prisma.device.count();

  if (existingDevices === 0) {
    await prisma.device.createMany({
      data: [
        {
          ownerId: owner.id,
          categoryId: laptop.id,
          name: "MacBook Air M2",
          description:
            "Lightweight Apple laptop suitable for study, coding, presentations and creative work.",
          brand: "Apple",
          model: "MacBook Air M2",
          condition: "LIKE_NEW",
          pricePerDay: 550,
          depositAmount: 3000,
          location: "AIT Campus",
          emoji: "💻",
          status: "AVAILABLE",
          avgRating: 4.9,
        },
        {
          ownerId: owner.id,
          categoryId: camera.id,
          name: "Sony A6400",
          description:
            "Mirrorless camera suitable for photography, content creation and short video projects.",
          brand: "Sony",
          model: "A6400",
          condition: "GOOD",
          pricePerDay: 420,
          depositAmount: 3000,
          location: "Bangkok",
          emoji: "📷",
          status: "AVAILABLE",
          avgRating: 4.8,
        },
        {
          ownerId: owner.id,
          categoryId: tablet.id,
          name: "iPad Air",
          description:
            "Portable tablet suitable for study, drawing, presentations and entertainment.",
          brand: "Apple",
          model: "iPad Air",
          condition: "LIKE_NEW",
          pricePerDay: 300,
          depositAmount: 2000,
          location: "Pathum Thani",
          emoji: "📱",
          status: "AVAILABLE",
          avgRating: 4.7,
        },
        {
          ownerId: owner.id,
          categoryId: gaming.id,
          name: "Nintendo Switch OLED",
          description:
            "Portable gaming console with OLED display. Includes Joy-Con controllers and charger.",
          brand: "Nintendo",
          model: "Switch OLED",
          condition: "GOOD",
          pricePerDay: 250,
          depositAmount: 2000,
          location: "Bangkok",
          emoji: "🎮",
          status: "AVAILABLE",
          avgRating: 5.0,
        },
        {
          ownerId: owner.id,
          categoryId: projector.id,
          name: "Epson Projector",
          description:
            "Portable projector for presentations, classes and small events.",
          brand: "Epson",
          model: "Portable Projector",
          condition: "GOOD",
          pricePerDay: 350,
          depositAmount: 2500,
          location: "AIT Campus",
          emoji: "📽️",
          status: "AVAILABLE",
          avgRating: 4.6,
        },
        {
          ownerId: owner.id,
          categoryId: creatorGear.id,
          name: "DJI Mini Drone",
          description:
            "Compact lightweight drone for travel videos, content creation and aerial photography.",
          brand: "DJI",
          model: "Mini",
          condition: "GOOD",
          pricePerDay: 650,
          depositAmount: 5000,
          location: "Bangkok",
          emoji: "🚁",
          status: "AVAILABLE",
          avgRating: 4.9,
        },
      ],
    });
  }

  // -----------------------------
  // One sample favorite
  // -----------------------------

  const sony = await prisma.device.findFirst({
    where: {
      name: "Sony A6400",
    },
  });

  if (sony) {
    await prisma.favorite.upsert({
      where: {
        userId_deviceId: {
          userId: renter.id,
          deviceId: sony.id,
        },
      },
      update: {},
      create: {
        userId: renter.id,
        deviceId: sony.id,
      },
    });
  }

  console.log("✅ GoGoRent seed completed.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Owner: ${owner.email}`);
  console.log(`Renter: ${renter.email}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });