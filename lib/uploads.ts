import { put } from "@vercel/blob";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadFile(
  file: File,
  folderPath: string
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Only JPG, PNG, and PDF files are allowed",
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "File size must not exceed 8MB",
    };
  }

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken && !process.env.VERCEL) {
      return {
        success: false,
        error: "Missing BLOB_READ_WRITE_TOKEN environment variable",
      };
    }

    const buffer = await file.arrayBuffer();
    if (!hasValidFileSignature(buffer, file.type)) {
      return {
        success: false,
        error: "File appears corrupted or does not match its extension",
      };
    }
    const blob = new Blob([buffer], { type: file.type });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${folderPath}/${Date.now()}-${safeName}`;

    const result = await put(key, blob, {
      access: "private",
      addRandomSuffix: true,
      token: blobToken,
      contentType: file.type,
    });

    return {
      success: true,
      url: result.url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to upload file",
    };
  }
}

function hasValidFileSignature(buffer: ArrayBuffer, type: string): boolean {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return false;

  if (type === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47];
    return png.every((b, i) => bytes[i] === b);
  }

  if (type === "image/jpeg" || type === "image/jpg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8;
  }

  if (type === "application/pdf") {
    const pdf = [0x25, 0x50, 0x44, 0x46]; // %PDF
    return pdf.every((b, i) => bytes[i] === b);
  }

  return false;
}
