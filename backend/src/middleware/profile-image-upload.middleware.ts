import { NextFunction, Request, Response } from "express";
import multer from "multer";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const acceptedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PROFILE_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!acceptedMimeTypes.has(file.mimetype.toLowerCase())) {
      callback(new Error("Profile photo must be a JPEG, PNG, or WebP image"));
      return;
    }
    callback(null, true);
  },
}).single("image");

export function profileImageUpload(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  upload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const message =
      error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "Profile photo must be 5 MB or smaller"
        : error instanceof Error
          ? error.message
          : "Invalid profile photo upload";

    res.status(400).json({ success: false, message });
  });
}
