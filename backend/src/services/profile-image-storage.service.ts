import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

type SupportedImage = {
  format: "jpg" | "png" | "webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

function configuredCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Profile image storage is not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName };
}

export function detectProfileImage(buffer: Buffer): SupportedImage | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { format: "jpg", mimeType: "image/jpeg" };
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (
    buffer.length >= pngSignature.length &&
    pngSignature.every((byte, index) => buffer[index] === byte)
  ) {
    return { format: "png", mimeType: "image/png" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { format: "webp", mimeType: "image/webp" };
  }

  return null;
}

export async function uploadProfileImage(
  userId: number,
  file: Express.Multer.File,
) {
  const detected = detectProfileImage(file.buffer);
  if (!detected || detected.mimeType !== file.mimetype.toLowerCase()) {
    throw new Error(
      "The uploaded file is not a valid JPEG, PNG, or WebP image",
    );
  }

  configuredCloudinary();

  const publicId = `scms/profile-images/user-${userId}-${randomUUID()}`;
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        format: detected.format,
        overwrite: false,
        transformation: [
          { width: 1024, height: 1024, crop: "limit", quality: "auto" },
        ],
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error("Cloudinary did not return an upload"));
          return;
        }
        resolve(uploaded);
      },
    );

    stream.end(file.buffer);
  });

  if (!result.secure_url.startsWith("https://")) {
    await cloudinary.uploader.destroy(result.public_id).catch(() => undefined);
    throw new Error("Image storage returned an insecure URL");
  }

  return { secureUrl: result.secure_url, publicId: result.public_id };
}

export async function deleteProfileImage(publicId: string) {
  configuredCloudinary();
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

export function profileImagePublicId(url: string | null) {
  if (!url) return null;

  try {
    const { cloudName } = configuredCloudinary();
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "res.cloudinary.com"
    )
      return null;

    const prefix = `/${cloudName}/image/upload/`;
    if (!parsed.pathname.startsWith(prefix)) return null;

    const path = parsed.pathname.slice(prefix.length).replace(/^v\d+\//, "");
    const publicId = decodeURIComponent(path).replace(/\.[^.\/]+$/, "");
    return publicId.startsWith("scms/profile-images/") ? publicId : null;
  } catch {
    return null;
  }
}
