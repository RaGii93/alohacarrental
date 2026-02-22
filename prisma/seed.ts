import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Check if ROOT user exists
  const rootExists = await prisma.adminUser.findUnique({
    where: { email: "root" },
  });

  if (!rootExists) {
    const rootPasswordHash = await hashPassword("3dGe123$");
    const root = await prisma.adminUser.create({
      data: {
        email: "root",
        passwordHash: rootPasswordHash,
        role: "ROOT",
      },
    });
    console.log("✓ ROOT user created:", root.email);
  } else {
    console.log("✓ ROOT user already exists");
  }

  // Create sample OWNER user (optional)
  const ownerExists = await prisma.adminUser.findUnique({
    where: { email: "owner@edgerent.com" },
  });

  if (!ownerExists) {
    const ownerPasswordHash = await hashPassword("Owner123!");
    const owner = await prisma.adminUser.create({
      data: {
        email: "owner@edgerent.com",
        passwordHash: ownerPasswordHash,
        role: "OWNER",
      },
    });
    console.log("✓ OWNER user created:", owner.email);
  }

  // Create sample vehicles
  const vehiclesData = [
    {
      name: "Kia Picanto #1",
      plateNumber: "ABC-1234",
      category: "Economy",
      dailyRate: 5000, // $50.00 in cents
      status: "ACTIVE" as const,
    },
    {
      name: "Toyota Corolla #1",
      plateNumber: "XYZ-5678",
      category: "Sedan",
      dailyRate: 7500, // $75.00 in cents
      status: "ACTIVE" as const,
    },
    {
      name: "Honda Civic #1",
      plateNumber: "DEF-9012",
      category: "Compact",
      dailyRate: 6500, // $65.00 in cents
      status: "MAINTENANCE" as const,
    },
  ];

  for (const vehicleData of vehiclesData) {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plateNumber: vehicleData.plateNumber },
    });

    if (!existingVehicle) {
      const vehicle = await prisma.vehicle.create({
        data: vehicleData,
      });
      console.log("✓ Vehicle created:", vehicle.name);
    }
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
