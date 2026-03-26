import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  deleteDriverLicenseForBooking,
  findDriverLicenseRecordByUrl,
  isDriverLicenseExpired,
} from "@/lib/driver-license-retention";

function fileNameFromPath(pathname: string): string {
  const clean = pathname.split("?")[0];
  const parts = clean.split("/");
  return decodeURIComponent(parts[parts.length - 1] || "file");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const src = searchParams.get("src");
    const download = searchParams.get("download") === "1";

    if (!src) {
      return NextResponse.json({ error: "Missing src parameter" }, { status: 400 });
    }

    const driverLicenseRecord = await findDriverLicenseRecordByUrl(src);
    if (driverLicenseRecord && isDriverLicenseExpired(driverLicenseRecord)) {
      if (driverLicenseRecord.driverLicenseUrl && !driverLicenseRecord.driverLicenseDeletedAt) {
        try {
          await deleteDriverLicenseForBooking(driverLicenseRecord);
        } catch {
          // Best-effort cleanup. Access is still denied once retention is reached.
        }
      }

      return NextResponse.json({ error: "File no longer available" }, { status: 410 });
    }

    const blob = await get(src, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      useCache: false,
    });

    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const filename = fileNameFromPath(blob.blob.pathname);
    const headers = new Headers();
    headers.set("Content-Type", blob.blob.contentType || "application/octet-stream");
    headers.set("Content-Disposition", `${download ? "attachment" : "inline"}; filename="${filename}"`);
    headers.set("Cache-Control", "private, no-store, max-age=0");

    return new NextResponse(blob.stream, { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to read file" },
      { status: 500 }
    );
  }
}
