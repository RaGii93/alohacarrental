/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { bookingFormSchemaRefined } from "@/lib/validators";
import { uploadFile } from "@/lib/uploads";

export async function cancelExpiredHolds() {
  // Cancel PENDING bookings where holdExpiresAt < now
  const result = await db.booking.updateMany({
    where: {
      status: "PENDING",
      holdExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: "CANCELLED",
    },
  });

  return result.count;
}

export async function createBookingAction(
  formData: FormData,
  locale: string
) {
  try {
    // Cancel expired holds first
    await cancelExpiredHolds();

    // Check license (allow if ACTIVE or ROOT)
    const session = await getSession();
    if (!isLicenseActive() && session?.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    // Extract form fields
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const vehicleId = formData.get("vehicleId") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const pickupLocation = formData.get("pickupLocation") as string | null;
    const dropoffLocation = formData.get("dropoffLocation") as string | null;
    const notes = formData.get("notes") as string | null;
    const driverLicenseFile = formData.get("driverLicense") as File | null;
    const paymentProofFile = formData.get("paymentProof") as File | null;

    // Validate with Zod
    const validated = await bookingFormSchemaRefined.parseAsync({
      customerName,
      customerEmail,
      customerPhone,
      vehicleId,
      startDate,
      endDate,
      pickupLocation: pickupLocation || undefined,
      dropoffLocation: dropoffLocation || undefined,
      notes: notes || undefined,
    });

    // Verify vehicle exists and is ACTIVE
    const vehicle = await db.vehicle.findUnique({
      where: { id: validated.vehicleId },
    });

    if (!vehicle || vehicle.status !== "ACTIVE") {
      return { success: false, error: "VEHICLE_UNAVAILABLE" };
    }

    // Upload files
    let driverLicenseUrl: string | undefined;
    let paymentProofUrl: string | undefined;

    if (driverLicenseFile && driverLicenseFile.size > 0) {
      const uploadResult = await uploadFile(
        driverLicenseFile,
        `bookings/${validated.vehicleId}`
      );
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error || "File upload failed" };
      }
      driverLicenseUrl = uploadResult.url;
    }

    if (paymentProofFile && paymentProofFile.size > 0) {
      const uploadResult = await uploadFile(
        paymentProofFile,
        `bookings/${validated.vehicleId}`
      );
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error || "File upload failed" };
      }
      paymentProofUrl = uploadResult.url;
    }

    // Calculate total amount (for now, using a simple formula - can be enhanced)
    const days = Math.ceil(
      (validated.endDate.getTime() - validated.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const totalAmount = vehicle.dailyRate * days;

    // Database transaction with lock
    let booking;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      booking = await db.$transaction(async (tx: any) => {
        // Lock the vehicle row
        const lockedVehicle = await tx.$queryRaw`
          SELECT id FROM "Vehicle" WHERE id = ${validated.vehicleId} FOR UPDATE
        `;

        // Re-check overlap count for this vehicle
        const overlappingCount = await tx.booking.count({
          where: {
            vehicleId: validated.vehicleId,
            startDate: {
              lt: validated.endDate,
            },
            endDate: {
              gt: validated.startDate,
            },
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
            holdExpiresAt: {
              gt: new Date(),
            },
          },
        });

        if (overlappingCount > 0) {
          throw new Error("VEHICLE_UNAVAILABLE");
        }

        // Create booking
        return tx.booking.create({
          data: {
            vehicleId: validated.vehicleId,
            customerName: validated.customerName,
            customerEmail: validated.customerEmail,
            customerPhone: validated.customerPhone,
            startDate: validated.startDate,
            endDate: validated.endDate,
            pickupLocation: validated.pickupLocation,
            dropoffLocation: validated.dropoffLocation,
            totalAmount,
            status: "PENDING",
            holdExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            driverLicenseUrl,
            paymentProofUrl,
            notes: validated.notes,
          },
        });
      });
    } catch (error: any) {
      if (error.message === "VEHICLE_UNAVAILABLE") {
        return { success: false, error: "VEHICLE_UNAVAILABLE" };
      }
      throw error;
    }

    return {
      success: true,
      bookingId: booking.id,
      redirectUrl: `/${locale}/book/success/${booking.id}`,
    };
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create booking",
    };
  }
}

export async function confirmBookingAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license (allow if ACTIVE or ROOT)
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "BOOKING_CONFIRMED",
        bookingId,
      },
    });

    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to confirm booking" };
  }
}

export async function declineBookingAction(
  bookingId: string,
  reason: string,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "DECLINED",
        notes: reason,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "BOOKING_DECLINED",
        bookingId,
      },
    });

    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to decline booking" };
  }
}

export async function addBookingNoteAction(
  bookingId: string,
  note: string,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        notes: note,
      },
    });

    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add note" };
  }
}

export async function generateInvoiceAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { vehicle: true },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // TODO: Generate PDF and upload to Blob
    // For now, just return success
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate invoice" };
  }
}
