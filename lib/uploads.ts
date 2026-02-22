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
      url: (result as any).downloadUrl || result.url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to upload file",
    };
  }
}
