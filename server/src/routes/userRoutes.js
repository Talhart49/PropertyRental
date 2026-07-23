import bcrypt from "bcryptjs";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireAuth } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Property from "../models/Property.js";
import User from "../models/User.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDirectory = path.resolve(__dirname, "../../uploads");

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name && !email && phone === undefined) {
      return res.status(400).json({ error: "At least one of name, email, or phone must be provided." });
    }

    if (email) {
      const duplicate = await User.findOne({ email, _id: { $ne: req.user._id } });

      if (duplicate) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
    }

    const updates = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (email !== undefined) {
      updates.email = email;
    }

    if (phone !== undefined) {
      updates.phone = phone;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      data: { user },
      message: "Profile updated successfully."
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      message: "Password changed successfully."
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.role === "landlord") {
      const properties = await Property.find({ landlord: user._id });

      await Promise.all(
        properties.map((property) =>
          Promise.all(
            property.images.map((image) =>
              fs.unlink(path.join(uploadDirectory, image.filename)).catch(() => undefined)
            )
          )
        )
      );

      await Property.deleteMany({ landlord: user._id });
    }

    await Conversation.deleteMany({
      $or: [{ landlord: user._id }, { tenant: user._id }]
    });

    await Message.deleteMany({ sender: user._id });

    await Booking.deleteMany({
      $or: [{ landlord: user._id }, { tenant: user._id }]
    });

    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      data: { id: user._id },
      message: "Account deleted successfully."
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me/export", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password -emailVerificationToken -emailVerificationExpires -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const properties = await Property.find({ landlord: user._id }).lean();
    const bookings = await Booking.find({
      $or: [{ landlord: user._id }, { tenant: user._id }]
    }).lean();
    const conversations = await Conversation.find({
      $or: [{ landlord: user._id }, { tenant: user._id }]
    }).lean();
    const messages = await Message.find({ sender: user._id }).lean();

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user.toSafeObject(),
      properties,
      bookings,
      conversations,
      messages
    };

    res.status(200).json({
      data: exportData,
      message: "Data exported successfully."
    });
  } catch (error) {
    next(error);
  }
});

export default router;
