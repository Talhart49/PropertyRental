import crypto from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { authLimiter, strictAuthLimiter } from "../middleware/rateLimiter.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/email.js";
import User, { roles } from "../models/User.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

function requireJwtSecret(req, res, next) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "JWT_SECRET is not configured." });
  }

  next();
}

router.post("/register", requireJwtSecret, authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, role = "tenant" } = req.body;

    if (!roles.includes(role)) {
      return res.status(400).json({ error: "Role must be landlord, tenant, or admin." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    const user = await User.create({
      name,
      email,
      password,
      role,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendVerificationEmail({ to: user.email, verificationUrl });
    } catch (emailError) {
      console.warn(`  ⚠️  Failed to send verification email — auto-verifying user as fallback.`, emailError.message);
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    }

    return res.status(201).json({
      data: {
        user: user.toSafeObject()
      },
      message: user.isVerified
        ? "Account created successfully. (Email verification unavailable — you can log in directly.)"
        : "Account created successfully. Please check your email to verify your account before logging in."
    });
  } catch (error) {
    next(error);
  }
});

// Verify email — accepts a raw token + email
router.post("/verify-email", authLimiter, async (req, res, next) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: "Email and verification token are required." });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token." });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. You can now access all features."
    });
  } catch (error) {
    next(error);
  }
});

// Resend verification email
router.post("/resend-verification", requireAuth, authLimiter, async (req, res, next) => {
  try {
    if (req.user.isVerified) {
      return res.status(400).json({ error: "Your email is already verified." });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    req.user.emailVerificationToken = hashedVerificationToken;
    req.user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await req.user.save();

    const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(req.user.email)}`;

    try {
      await sendVerificationEmail({ to: req.user.email, verificationUrl });
    } catch (emailError) {
      console.error(`  ❌  Resend verification email failed:`, emailError.message);
      return res.status(500).json({ error: "Failed to send verification email. Please try again later." });
    }

    return res.status(200).json({
      message: "Verification email sent. Please check your inbox."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", requireJwtSecret, strictAuthLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email address before logging in.",
        needsVerification: true
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      data: {
        token,
        user: user.toSafeObject()
      },
      message: "Logged in successfully."
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password — generates a reset token and sends it via email
router.post("/forgot-password", strictAuthLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Always return the same message whether user exists or not (security best practice)
    if (!user) {
      return res.status(200).json({
        message: "If an account with that email exists, a reset link has been sent."
      });
    }

    // Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing (so DB compromise doesn't leak valid tokens)
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Build the reset URL the user will receive in their email
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send the email via Resend SMTP
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return res.status(200).json({
      message: "If an account with that email exists, a reset link has been sent."
    });
  } catch (error) {
    next(error);
  }
});

// Reset password — accepts the raw token + new password
router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({ error: "Email, token, and new password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    data: {
      user: req.user
    }
  });
});

router.get("/admin-check", requireAuth, requireRole("admin"), (req, res) => {
  res.status(200).json({
    data: {
      status: "ok",
      role: req.user.role
    }
  });
});

export default router;