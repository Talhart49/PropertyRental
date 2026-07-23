import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Notification from "../models/Notification.js";

const router = express.Router();

// GET /api/notifications — fetch all notifications for the current user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ data: { notifications } });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all — mark all notifications as read
// NOTE: This route must be defined BEFORE the /:id/read route to avoid
// Express matching "read-all" as an :id parameter.
router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      data: { modifiedCount: result.modifiedCount },
      message: "All notifications marked as read."
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found." });
    }

    res.status(200).json({ data: { notification }, message: "Marked as read." });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications — clear all notifications
router.delete("/", requireAuth, async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    res.status(200).json({ message: "All notifications cleared." });
  } catch (error) {
    next(error);
  }
});

export default router;