import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const owner = await prisma.user.findFirst({
    where: {
      role: "OWNER",
    },
  });

  const category = await prisma.category.findFirst({
    where: {
      name: "Camera",
    },
  });

  if (!owner) {
    throw new Error("No OWNER user found.");
  }

  if (!category) {
    throw new Error("Camera category not found.");
  }

  const device = await prisma.device.create({
    data: {
      ownerId: owner.id,
      categoryId: category.id,

      name: "Canon EOS R50",
      description:
        "Compact mirrorless camera for photography and video.",

      brand: "Gucci",
      model: "EOS R50",

      condition: "GOOD",

      pricePerDay: 700,
      depositAmount: 4000,

      location: "Bangkok",
      emoji: "📷",

      status: "AVAILABLE",

      avgRating: 4.8,
    },
  });

  console.log("✅ Device added successfully!");
  console.log(device);
}

main()
  .catch((error) => {
    console.error("❌ Error adding device:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });