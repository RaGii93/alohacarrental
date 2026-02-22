import { hashPassword } from "../lib/password.ts";
import { db as prisma } from "../lib/db.ts";

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
        email: "root@endlessedget.com",
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

  // Create vehicle categories
  const categoriesData = [
    {
      id: "cat_economy",
      name: "Economy",
      description: "Compact and fuel-efficient vehicles",
      dailyRate: 2500, // $25.00 in cents
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "cat_suv",
      name: "SUV",
      description: "Spacious vehicles for families and adventures",
      dailyRate: 4500, // $45.00 in cents
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "cat_pickup",
      name: "Pickup",
      description: "Versatile trucks for work and transport",
      dailyRate: 4000, // $40.00 in cents
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const cat of categoriesData) {
    const existing = await prisma.vehicleCategory.findUnique({ where: { id: cat.id } });
    if (!existing) {
      const created = await prisma.vehicleCategory.create({ data: cat });
      console.log("✓ Category created:", created.name);
    }
  }

  // Create sample vehicles
  const vehiclesData = [
    {
      name: "Kia Picanto #1",
      plateNumber: "ABC-1234",
      categoryId: "cat_economy",
      imageUrl: "https://via.placeholder.com/240x140?text=Kia+Picanto",
      dailyRate: 2500, // $25.00 in cents
      status: "ACTIVE" as const,
    },
    {
      name: "Toyota Corolla #1",
      plateNumber: "XYZ-5678",
      categoryId: "cat_economy",
      imageUrl: "https://via.placeholder.com/240x140?text=Toyota+Corolla",
      dailyRate: 2500, // $25.00 in cents
      status: "ACTIVE" as const,
    },
    {
      name: "Honda Civic #1",
      plateNumber: "DEF-9012",
      categoryId: "cat_economy",
      imageUrl: "https://via.placeholder.com/240x140?text=Honda+Civic",
      dailyRate: 2500, // $25.00 in cents
      status: "MAINTENANCE" as const,
    },
    {
      name: "Toyota RAV4 #1",
      plateNumber: "SUV-1234",
      categoryId: "cat_suv",
      imageUrl: "https://via.placeholder.com/240x140?text=Toyota+RAV4",
      dailyRate: 4500, // $45.00 in cents
      status: "ACTIVE" as const,
    },
    {
      name: "Ford Ranger #1",
      plateNumber: "PIC-5678",
      categoryId: "cat_pickup",
      imageUrl: "https://via.placeholder.com/240x140?text=Ford+Ranger",
      dailyRate: 4000, // $40.00 in cents
      status: "ACTIVE" as const,
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

  // Create sample pickup/dropoff locations
  const locationsData = [
    { code: "AIRPORT", name: "Airport Terminal", address: "Airport Rd, City" },
    { code: "DOWNTOWN", name: "Downtown Office", address: "123 Main St" },
    { code: "STATION", name: "Train Station", address: "Station Ave" },
  ];

  for (const loc of locationsData) {
    const existing = await prisma.location.findUnique({ where: { code: loc.code } });
    if (!existing) {
      const created = await prisma.location.create({ data: loc });
      console.log("✓ Location created:", created.name);
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
