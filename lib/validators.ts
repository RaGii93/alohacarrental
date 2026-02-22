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
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleFormSchema = z.object({
  name: z.string().min(2, "Vehicle name must be at least 2 characters"),
  plateNumber: z.string().optional(),
  categoryId: z.string().min(1, "Please select a category"),
  dailyRate: z.number().min(1, "Daily rate must be greater than 0"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]),
  notes: z.string().optional(),
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
  driverLicenseNumber: z.string().min(1, "Driver license number is required"),
  startDate: z.date().refine((date) => date > new Date(), {
    message: "Start date must be in the future",
  }),
  endDate: z.date(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  driverLicenseUrl: z.string().url("Driver license upload is required"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  notes: z.string().optional(),
});

// Refine to ensure endDate > startDate
export const categoryBookingFormSchemaRefined = categoryBookingFormSchema.refine(
  (data) => data.endDate > data.startDate,
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type BookingFormInput = z.infer<typeof bookingFormSchemaRefined>;
export type CategoryBookingFormInput = z.infer<typeof categoryBookingFormSchemaRefined>;
export type VehicleFormInput = z.infer<typeof vehicleFormSchema>;
