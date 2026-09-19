import multer from "multer";
import path from "path";
import fs from "fs";


const uploadDirectory = path.join(process.cwd(), "uploads", "submissions");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}


const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);

    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "_");

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1_000_000,
    )}-${baseName}${extension}`;

    cb(null, uniqueName);
  },
});


const allowedExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".zip",
];

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return cb(
      new Error(
        "Invalid file type. Allowed files: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT and ZIP.",
      ),
    );
  }

  cb(null, true);
};


export const submissionUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});
