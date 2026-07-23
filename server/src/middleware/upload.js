import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${safeBaseName || "property"}-${uniqueSuffix}${extension}`);
  }
});

function fileFilter(_req, file, callback) {
  if (!allowedTypes.has(file.mimetype)) {
    callback(new Error("Only JPG, PNG, and WEBP images are allowed."));
    return;
  }

  callback(null, true);
}

export const propertyImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8
  }
});
