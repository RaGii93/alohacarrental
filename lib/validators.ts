import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const bookingFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(5, "Invalid phone number"),
  vehicleId: z.string().min(1, "Please select a vehicle"),
  startDate: z.date().refine((date) => date > new Date(), {
    message: "Start date must be in the future",
  }),
  endDate: z.date(),
  pickupLocationId: z.string().optional(),
  dropoffLocationId: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleFormSchema = z.object({
  name: z.string().min(2, "Vehicle name must be at least 2 characters"),
  plateNumber: z.string().optional(),
  categoryId: z.string().min(1, "Please select a category"),
  dailyRate: z.number().min(1, "Daily rate must be greater than 0"),
  status: z.enum(["ACTIVE", "ON_RENT", "MAINTENANCE", "INACTIVE"]),
  notes: z.string().optional(),
});

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  seats: z.number().int().min(2, "Seats must be at least 2").max(12, "Seats must be 12 or less"),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  featureIds: z.array(z.string()).default([]),
  dailyRate: z.number().min(1, "Daily rate must be greater than 0"),
  fuelChargePerQuarter: z.number().min(0, "Fuel charge must be 0 or greater"),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const locationFormSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  code: z
    .string()
    .trim()
    .max(20, "Location code must be 20 characters or less")
    .optional()
    .or(z.literal("")),
  address: z.string().max(255, "Address must be 255 characters or less").optional().or(z.literal("")),
});

// Refine booking schema to ensure endDate > startDate
export const bookingFormSchemaRefined = bookingFormSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export const categoryBookingFormSchema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(5, "Invalid phone number"),
  flightNumber: z.string().trim().max(50, "Flight number must be 50 characters or less").optional(),
  birthDate: z.date(),
  driverLicenseNumber: z.string().min(1, "Driver license number is required"),
  licenseExpiryDate: z.date(),
  startDate: z.date().refine((date) => date > new Date(), {
    message: "Start date must be in the future",
  }),
  endDate: z.date(),
  pickupLocationId: z.string().optional(),
  dropoffLocationId: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  driverLicenseUrl: z.string().url("Driver license upload is required"),
  privacyConsentAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the privacy consent",
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  notes: z.string().optional(),
});

export const adminCategoryBookingUpdateSchema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  vehicleId: z.string().optional(),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(5, "Invalid phone number"),
  flightNumber: z.string().trim().max(50, "Flight number must be 50 characters or less").optional(),
  birthDate: z.date(),
  driverLicenseNumber: z.string().min(1, "Driver license number is required"),
  licenseExpiryDate: z.date(),
  startDate: z.date(),
  endDate: z.date(),
  pickupLocationId: z.string().min(1, "Pickup location is required"),
  dropoffLocationId: z.string().min(1, "Dropoff location is required"),
  notes: z.string().optional(),
});

// Refine to ensure endDate > startDate
export const categoryBookingFormSchemaRefined = categoryBookingFormSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    const today = new Date();
    const threshold = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
    return data.birthDate <= threshold;
  },
  {
    message: "Renter must be at least 21 years old",
    path: ["birthDate"],
  }
).refine(
  (data) => data.licenseExpiryDate > data.startDate,
  {
    message: "License must be valid for the rental period start date",
    path: ["licenseExpiryDate"],
  }
);

export const adminCategoryBookingUpdateSchemaRefined = adminCategoryBookingUpdateSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    const today = new Date();
    const threshold = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
    return data.birthDate <= threshold;
  },
  {
    message: "Renter must be at least 21 years old",
    path: ["birthDate"],
  }
).refine(
  (data) => data.licenseExpiryDate > data.startDate,
  {
    message: "License must be valid for the rental period start date",
    path: ["licenseExpiryDate"],
  }
);

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type BookingFormInput = z.infer<typeof bookingFormSchemaRefined>;
export type CategoryBookingFormInput = z.infer<typeof categoryBookingFormSchemaRefined>;
export type AdminCategoryBookingUpdateInput = z.infer<typeof adminCategoryBookingUpdateSchemaRefined>;
export type VehicleFormInput = z.infer<typeof vehicleFormSchema>;
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
export type LocationFormInput = z.infer<typeof locationFormSchema>;
