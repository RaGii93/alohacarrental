import { hashPassword } from "../lib/password.ts";
import { db as prisma } from "../lib/db.ts";
import type { BookingStatus, Role, VehicleStatus } from "@prisma/client";

function atHour(daysFromNow: number, hour: number, minute = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromNow);
  dt.setHours(hour, minute, 0, 0);
  return dt;
}

async function main() {
  console.log("Seeding database...");

  const users: Array<{ email: string; password: string; role: Role }> = [
    { email: "root@endlessedget.com", password: "3dGe123$", role: "ROOT" },
    { email: "owner@edgerent.com", password: "Owner123!", role: "OWNER" },
    { email: "staff1@edgerent.com", password: "Staff123!", role: "STAFF" },
    { email: "staff2@edgerent.com", password: "Staff123!", role: "STAFF" },
    { email: "staff3@edgerent.com", password: "Staff123!", role: "STAFF" },
  ];

  for (const user of users) {
    const passwordHash = await hashPassword(user.password);
    await prisma.adminUser.upsert({
      where: { email: user.email },
      update: { passwordHash, role: user.role },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }
  console.log(`✓ Upserted ${users.length} users`);

  const categoriesData = [
    {
      id: "cat_economy",
      name: "Economy",
      description: "Compact and fuel-efficient vehicles",
      dailyRate: 2500,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "cat_compact",
      name: "Compact",
      description: "Balanced city and highway option",
      dailyRate: 3000,
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "cat_suv",
      name: "SUV",
      description: "Spacious vehicles for families and groups",
      dailyRate: 4500,
      isActive: true,
      sortOrder: 3,
    },
    {
      id: "cat_pickup",
      name: "Pickup",
      description: "Utility trucks for cargo and work",
      dailyRate: 4200,
      isActive: true,
      sortOrder: 4,
    },
    {
      id: "cat_luxury",
      name: "Luxury",
      description: "Premium comfort and performance",
      dailyRate: 8500,
      isActive: true,
      sortOrder: 5,
    },
  ];

  for (const category of categoriesData) {
    await prisma.vehicleCategory.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        description: category.description,
        dailyRate: category.dailyRate,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      },
      create: category,
    });
  }
  console.log(`✓ Upserted ${categoriesData.length} categories`);

  const locationsData = [
    { code: "AIRPORT", name: "Airport Terminal", address: "Airport Rd, City" },
    { code: "DOWNTOWN", name: "Downtown Office", address: "123 Main St, City" },
    { code: "STATION", name: "Central Train Station", address: "Station Ave, City" },
    { code: "NORTH", name: "North Hub", address: "88 North Blvd, City" },
    { code: "SOUTH", name: "South Hub", address: "45 South Ave, City" },
  ];

  for (const location of locationsData) {
    await prisma.location.upsert({
      where: { code: location.code },
      update: { name: location.name, address: location.address },
      create: location,
    });
  }
  console.log(`✓ Upserted ${locationsData.length} locations`);

  const vehiclesData: Array<{
    name: string;
    plateNumber: string;
    categoryId: string;
    imageUrl: string;
    dailyRate: number;
    status: VehicleStatus;
  }> = [
    {
      name: "Kia Picanto #1",
      plateNumber: "ECO-1001",
      categoryId: "cat_economy",
      imageUrl: "https://via.placeholder.com/240x140?text=Kia+Picanto",
      dailyRate: 2500,
      status: "ACTIVE",
    },
    {
      name: "Toyota Yaris #1",
      plateNumber: "ECO-1002",
      categoryId: "cat_economy",
      imageUrl: "https://via.placeholder.com/240x140?text=Toyota+Yaris",
      dailyRate: 2500,
      status: "ACTIVE",
    },
    {
      name: "Honda City #1",
      plateNumber: "COM-2001",
      categoryId: "cat_compact",
      imageUrl: "https://via.placeholder.com/240x140?text=Honda+City",
      dailyRate: 3000,
      status: "ACTIVE",
    },
    {
      name: "Mazda 3 #1",
      plateNumber: "COM-2002",
      categoryId: "cat_compact",
      imageUrl: "https://via.placeholder.com/240x140?text=Mazda+3",
      dailyRate: 3000,
      status: "MAINTENANCE",
    },
    {
      name: "Toyota RAV4 #1",
      plateNumber: "SUV-3001",
      categoryId: "cat_suv",
      imageUrl: "https://via.placeholder.com/240x140?text=Toyota+RAV4",
      dailyRate: 4500,
      status: "ACTIVE",
    },
    {
      name: "Honda CR-V #1",
      plateNumber: "SUV-3002",
      categoryId: "cat_suv",
      imageUrl: "https://via.placeholder.com/240x140?text=Honda+CR-V",
      dailyRate: 4500,
      status: "ACTIVE",
    },
    {
      name: "Ford Ranger #1",
      plateNumber: "PUP-4001",
      categoryId: "cat_pickup",
      imageUrl: "https://via.placeholder.com/240x140?text=Ford+Ranger",
      dailyRate: 4200,
      status: "ACTIVE",
    },
    {
      name: "Isuzu D-Max #1",
      plateNumber: "PUP-4002",
      categoryId: "cat_pickup",
      imageUrl: "https://via.placeholder.com/240x140?text=Isuzu+D-Max",
      dailyRate: 4200,
      status: "INACTIVE",
    },
    {
      name: "BMW 3 Series #1",
      plateNumber: "LUX-5001",
      categoryId: "cat_luxury",
      imageUrl: "https://via.placeholder.com/240x140?text=BMW+3+Series",
      dailyRate: 8500,
      status: "ACTIVE",
    },
    {
      name: "Mercedes C-Class #1",
      plateNumber: "LUX-5002",
      categoryId: "cat_luxury",
      imageUrl: "https://via.placeholder.com/240x140?text=Mercedes+C-Class",
      dailyRate: 8500,
      status: "ACTIVE",
    },
  ];

  for (const vehicle of vehiclesData) {
    await prisma.vehicle.upsert({
      where: { plateNumber: vehicle.plateNumber },
      update: {
        name: vehicle.name,
        categoryId: vehicle.categoryId,
        imageUrl: vehicle.imageUrl,
        dailyRate: vehicle.dailyRate,
        status: vehicle.status,
      },
      create: vehicle,
    });
  }
  console.log(`✓ Upserted ${vehiclesData.length} vehicles`);

  const locationByCode = Object.fromEntries(
    (await prisma.location.findMany({ where: { code: { in: locationsData.map((loc) => loc.code) } } }))
      .map((loc) => [loc.code as string, loc])
  );
  const vehicleByPlate = Object.fromEntries(
    (await prisma.vehicle.findMany({ where: { plateNumber: { in: vehiclesData.map((v) => v.plateNumber) } } }))
      .map((vehicle) => [vehicle.plateNumber as string, vehicle])
  );

  const bookingsData: Array<{
    bookingCode: string;
    vehiclePlate: string;
    categoryId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    birthDate: Date;
    driverLicenseNumber: string;
    licenseExpiryDate: Date;
    startDate: Date;
    endDate: Date;
    pickupLocationCode: string;
    dropoffLocationCode: string;
    status: BookingStatus;
  }> = [
    {
      bookingCode: "BK100001",
      vehiclePlate: "ECO-1001",
      categoryId: "cat_economy",
      customerName: "Alex Carter",
      customerEmail: "alex.carter@example.com",
      customerPhone: "+1-555-1001",
      birthDate: atHour(-9000, 0, 0),
      driverLicenseNumber: "DLA-1001",
      licenseExpiryDate: atHour(500, 0, 0),
      startDate: atHour(2, 9, 0),
      endDate: atHour(5, 11, 0),
      pickupLocationCode: "AIRPORT",
      dropoffLocationCode: "DOWNTOWN",
      status: "PENDING",
    },
    {
      bookingCode: "BK100002",
      vehiclePlate: "COM-2001",
      categoryId: "cat_compact",
      customerName: "Maria Nguyen",
      customerEmail: "maria.nguyen@example.com",
      customerPhone: "+1-555-1002",
      birthDate: atHour(-11000, 0, 0),
      driverLicenseNumber: "DLB-1002",
      licenseExpiryDate: atHour(700, 0, 0),
      startDate: atHour(3, 10, 30),
      endDate: atHour(6, 10, 30),
      pickupLocationCode: "DOWNTOWN",
      dropoffLocationCode: "STATION",
      status: "CONFIRMED",
    },
    {
      bookingCode: "BK100003",
      vehiclePlate: "SUV-3001",
      categoryId: "cat_suv",
      customerName: "Chris Lopez",
      customerEmail: "chris.lopez@example.com",
      customerPhone: "+1-555-1003",
      birthDate: atHour(-10000, 0, 0),
      driverLicenseNumber: "DLC-1003",
      licenseExpiryDate: atHour(650, 0, 0),
      startDate: atHour(4, 8, 0),
      endDate: atHour(8, 8, 0),
      pickupLocationCode: "STATION",
      dropoffLocationCode: "AIRPORT",
      status: "PENDING",
    },
    {
      bookingCode: "BK100004",
      vehiclePlate: "PUP-4001",
      categoryId: "cat_pickup",
      customerName: "Jordan Bell",
      customerEmail: "jordan.bell@example.com",
      customerPhone: "+1-555-1004",
      birthDate: atHour(-9500, 0, 0),
      driverLicenseNumber: "DLD-1004",
      licenseExpiryDate: atHour(550, 0, 0),
      startDate: atHour(5, 7, 45),
      endDate: atHour(7, 18, 15),
      pickupLocationCode: "NORTH",
      dropoffLocationCode: "SOUTH",
      status: "DECLINED",
    },
    {
      bookingCode: "BK100005",
      vehiclePlate: "LUX-5001",
      categoryId: "cat_luxury",
      customerName: "Taylor Brooks",
      customerEmail: "taylor.brooks@example.com",
      customerPhone: "+1-555-1005",
      birthDate: atHour(-10500, 0, 0),
      driverLicenseNumber: "DLE-1005",
      licenseExpiryDate: atHour(800, 0, 0),
      startDate: atHour(6, 12, 0),
      endDate: atHour(9, 14, 0),
      pickupLocationCode: "AIRPORT",
      dropoffLocationCode: "NORTH",
      status: "CONFIRMED",
    },
  ];

  for (const booking of bookingsData) {
    const vehicle = vehicleByPlate[booking.vehiclePlate];
    const pickupLoc = locationByCode[booking.pickupLocationCode];
    const dropoffLoc = locationByCode[booking.dropoffLocationCode];
    if (!vehicle || !pickupLoc || !dropoffLoc) continue;

    const days = Math.max(
      1,
      Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalAmount = vehicle.dailyRate * days;
    const holdExpiresAt =
      booking.status === "PENDING" ? new Date(Date.now() + 2 * 60 * 60 * 1000) : new Date(Date.now() - 1000);

    await prisma.booking.upsert({
      where: { bookingCode: booking.bookingCode },
      update: {
        categoryId: booking.categoryId,
        vehicleId: vehicle.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        birthDate: booking.birthDate,
        driverLicenseNumber: booking.driverLicenseNumber,
        licenseExpiryDate: booking.licenseExpiryDate,
        driverLicenseUrl: "https://example.com/licenses/sample-license.pdf",
        startDate: booking.startDate,
        endDate: booking.endDate,
        pickupLocationId: pickupLoc.id,
        dropoffLocationId: dropoffLoc.id,
        pickupLocation: pickupLoc.name,
        dropoffLocation: dropoffLoc.name,
        totalAmount,
        status: booking.status,
        holdExpiresAt,
        termsAcceptedAt: new Date(),
      },
      create: {
        categoryId: booking.categoryId,
        vehicleId: vehicle.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        birthDate: booking.birthDate,
        driverLicenseNumber: booking.driverLicenseNumber,
        licenseExpiryDate: booking.licenseExpiryDate,
        driverLicenseUrl: "https://example.com/licenses/sample-license.pdf",
        startDate: booking.startDate,
        endDate: booking.endDate,
        pickupLocationId: pickupLoc.id,
        dropoffLocationId: dropoffLoc.id,
        pickupLocation: pickupLoc.name,
        dropoffLocation: dropoffLoc.name,
        totalAmount,
        status: booking.status,
        bookingCode: booking.bookingCode,
        holdExpiresAt,
        termsAcceptedAt: new Date(),
      },
    });
  }
  console.log(`✓ Upserted ${bookingsData.length} bookings`);

  console.log("✅ Seeding completed");
}

main()
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
