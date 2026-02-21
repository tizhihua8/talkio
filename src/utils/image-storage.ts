import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";

const IMAGE_DIR = `${FileSystem.documentDirectory}images/`;

/**
 * Ensure the images directory exists.
 */
async function ensureImageDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

/**
 * Save a base64 data URI to the file system and return the file:// URI.
 * If the input is already a file:// URI, returns it as-is.
 */
export async function saveImageToFile(dataUri: string): Promise<string> {
  // Already a file URI — no conversion needed
  if (dataUri.startsWith("file://")) return dataUri;

  // Not a data URI — return as-is (could be a remote URL)
  if (!dataUri.startsWith("data:")) return dataUri;

  await ensureImageDir();

  // Extract mime type and base64 data
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return dataUri;

  const mimeType = match[1];
  const base64Data = match[2];
  const ext = mimeType.split("/")[1] ?? "jpg";

  // Generate a unique filename using a hash of the content
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    base64Data.slice(0, 1024) + base64Data.length,
  );
  const fileName = `${hash.slice(0, 16)}.${ext}`;
  const filePath = `${IMAGE_DIR}${fileName}`;

  // Skip if file already exists (dedup)
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(filePath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  return filePath;
}

/**
 * Convert a file:// URI back to a base64 data URI.
 * Used when sending images to the API (which expects data URIs).
 */
export async function fileToDataUri(fileUri: string, mimeType = "image/jpeg"): Promise<string> {
  if (fileUri.startsWith("data:")) return fileUri;

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Delete an image file. Silently ignores errors.
 */
export async function deleteImageFile(fileUri: string): Promise<void> {
  if (!fileUri.startsWith("file://") && !fileUri.startsWith(IMAGE_DIR)) return;
  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  } catch {
    // Ignore — file may not exist
  }
}
