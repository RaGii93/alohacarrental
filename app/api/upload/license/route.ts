import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/uploads";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("driverLicense");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPG, PNG, and PDF are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must not exceed 8MB" },
        { status: 400 }
      );
    }

    const uploadResult = await uploadFile(file, "licenses");
    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, driverLicenseUrl: uploadResult.url });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to upload driver license" },
      { status: 500 }
    );
  }
}

