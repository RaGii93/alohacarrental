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
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });

    const result = await put(`${folderPath}/${file.name}`, blob, {
      access: "private",
    });

    return {
      success: true,
      url: result.url,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to upload file",
    };
  }
}
