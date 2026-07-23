import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "node:fs";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { sanitizeBody } from "./middleware/sanitize.js";
import adminManagementRoutes from "./routes/adminManagementRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

const app = express();

// Trust the first proxy in front of the app (e.g. Railway, Nginx, Render)
app.set("trust proxy", 1);

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const uploadsPath = path.resolve(__dirname, "../uploads");

fs.mkdirSync(uploadsPath, { recursive: true });

// ── HTTPS enforcement (production only) ──────────────────────────────────────
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    // When behind a reverse proxy (e.g. Nginx, Heroku, Render) the protocol
    // is communicated via the x-forwarded-proto header.
    const proto = req.headers["x-forwarded-proto"];
    if (!proto || proto === "http") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

app.use(helmet());
app.use(
  cors({
    origin: clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(sanitizeBody);

// ── Uploaded images: restrict CORS to the configured client origin ──────────
app.use("/uploads", cors({ origin: clientUrl }));
app.use("/uploads", express.static(uploadsPath));

app.get("/health", (_req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
      service: "property-rental-api"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-management", adminManagementRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;