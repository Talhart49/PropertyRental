import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication token is required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to access this resource." });
    }

    next();
  };
}

export function requireVerifiedEmail(req, res, next) {
  if (!req.user.isVerified) {
    return res.status(403).json({
      error: "Please verify your email address before accessing this resource.",
      needsVerification: true
    });
  }

  next();
}
