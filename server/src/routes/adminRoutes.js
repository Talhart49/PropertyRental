import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Conversation from "../models/Conversation.js";
import Property, { moderationStatuses } from "../models/Property.js";
import User from "../models/User.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

/**
 * Parse pagination and sorting query parameters.
 */
function parseListOptions(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10);
  const limit = Math.min(100, Math.max(1, Number.isNaN(rawLimit) ? 20 : rawLimit));
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  return { page, limit, skip, sortBy, sortOrder };
}

router.get("/summary", async (_req, res, next) => {
  try {
    const [
      totalUsers,
      landlords,
      tenants,
      admins,
      totalProperties,
      activeProperties,
      pendingProperties,
      rejectedProperties,
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      totalConversations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "landlord" }),
      User.countDocuments({ role: "tenant" }),
      User.countDocuments({ role: "admin" }),
      Property.countDocuments(),
      Property.countDocuments({ moderationStatus: "active" }),
      Property.countDocuments({ moderationStatus: "pending" }),
      Property.countDocuments({ moderationStatus: "rejected" }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "approved" }),
      Booking.countDocuments({ status: "rejected" }),
      Conversation.countDocuments()
    ]);

    res.status(200).json({
      data: {
        summary: {
          users: {
            total: totalUsers,
            landlords,
            tenants,
            admins
          },
          properties: {
            total: totalProperties,
            active: activeProperties,
            pending: pendingProperties,
            rejected: rejectedProperties
          },
          bookings: {
            total: totalBookings,
            pending: pendingBookings,
            approved: approvedBookings,
            rejected: rejectedBookings
          },
          conversations: {
            total: totalConversations
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = parseListOptions(req.query);

    const allowedSortFields = ["name", "email", "role", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [users, total] = await Promise.all([
      User.find()
        .select("-password")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    res.status(200).json({
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/properties", async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = parseListOptions(req.query);

    const allowedSortFields = ["title", "city", "pricePerMonth", "moderationStatus", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [properties, total] = await Promise.all([
      Property.find()
        .populate("landlord", "name email")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Property.countDocuments()
    ]);

    res.status(200).json({
      data: {
        properties,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/properties/:id/status", async (req, res, next) => {
  try {
    const { moderationStatus } = req.body;

    if (!moderationStatuses.includes(moderationStatus)) {
      return res.status(400).json({
        error: "Moderation status must be active, pending, or rejected."
      });
    }

    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { moderationStatus },
      { new: true, runValidators: true }
    ).populate("landlord", "name email");

    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    res.status(200).json({
      data: {
        property
      },
      message: "Listing moderation status updated."
    });
  } catch (error) {
    next(error);
  }
});

router.get("/bookings", async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = parseListOptions(req.query);

    const allowedSortFields = ["status", "requestedDate", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [bookings, total] = await Promise.all([
      Booking.find()
        .populate("property", "title addressLine1 city postcode pricePerMonth")
        .populate("tenant", "name email")
        .populate("landlord", "name email")
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments()
    ]);

    res.status(200).json({
      data: {
        bookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;