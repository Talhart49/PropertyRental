import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Property from "../models/Property.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

/**
 * GET /api/admin-management/pending-listings
 * Returns all properties pending moderation, with landlord details populated.
 */
router.get("/pending-listings", async (_req, res, next) => {
  try {
    const properties = await Property.find({ moderationStatus: "pending" })
      .populate("landlord", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ data: { properties } });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/admin-management/users/:id/role
 * Update a user's role (e.g. promote tenant to landlord, etc.)
 */
router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ["landlord", "tenant", "admin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Role must be landlord, tenant, or admin." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      data: { user },
      message: `User role updated to ${role}.`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin-management/users/:id
 * Delete a user account (admin cleanup).
 */
router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin-management/notifications/broadcast
 * Send a notification to all users or a specific role.
 */
router.post("/notifications/broadcast", async (req, res, next) => {
  try {
    const { message, type, linkHref, targetRole } = req.body;

    if (!message || !type) {
      return res.status(400).json({ error: "Message and type are required." });
    }

    const validTypes = [
      "booking_request", "booking_approved", "booking_rejected",
      "booking_cancelled", "message_new", "system_announcement"
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Type must be one of: ${validTypes.join(", ")}` });
    }

    const filter = targetRole ? { role: targetRole } : {};
    const users = await User.find(filter).select("_id");

    if (users.length === 0) {
      return res.status(404).json({ error: "No users found for the specified filter." });
    }

    const notifications = users.map((user) => ({
      recipient: user._id,
      type,
      message,
      linkHref: linkHref || "/",
      read: false
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      message: `Broadcast sent to ${users.length} user(s).`,
      data: { recipientCount: users.length }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin-management/recent-activity
 * Returns a timeline of recent platform activity (new users, new listings, new bookings).
 */
router.get("/recent-activity", async (_req, res, next) => {
  try {
    const [recentUsers, recentProperties, recentBookings] = await Promise.all([
      User.find().select("name email role createdAt").sort({ createdAt: -1 }).limit(10),
      Property.find()
        .populate("landlord", "name email")
        .select("title pricePerMonth moderationStatus createdAt")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const activity = [
      ...recentUsers.map((u) => ({
        type: "user_registered",
        description: `${u.name} (${u.role}) joined the platform.`,
        timestamp: u.createdAt,
        user: u
      })),
      ...recentProperties.map((p) => ({
        type: "property_listed",
        description: `${p.title} listed by ${p.landlord?.name || "Unknown"}.`,
        timestamp: p.createdAt,
        property: p
      })),
    ];

    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activity.splice(20); // cap at 20 items

    res.status(200).json({ data: { activity } });
  } catch (error) {
    next(error);
  }
});

export default router;