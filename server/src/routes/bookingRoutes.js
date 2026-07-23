import express from "express";
import { requireAuth, requireRole, requireVerifiedEmail } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import Property from "../models/Property.js";

const router = express.Router();

function populateBooking(query) {
  return query
    .populate("property", "title addressLine1 city postcode pricePerMonth images")
    .populate("tenant", "name email")
    .populate("landlord", "name email");
}

router.get("/mine", requireAuth, requireRole("tenant"), async (req, res, next) => {
  try {
    const bookings = await populateBooking(
      Booking.find({ tenant: req.user._id }).sort({ createdAt: -1 })
    );

    res.status(200).json({
      data: {
        bookings
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/incoming", requireAuth, requireRole("landlord"), async (req, res, next) => {
  try {
    const bookings = await populateBooking(
      Booking.find({ landlord: req.user._id }).sort({ createdAt: -1 })
    );

    res.status(200).json({
      data: {
        bookings
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireVerifiedEmail, requireRole("tenant"), async (req, res, next) => {
  try {
    const { propertyId, requestedDate, message: bookingMessage } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: "Property is required." });
    }

    const property = await Property.findById(propertyId);

    if (!property || property.moderationStatus !== "active") {
      return res.status(404).json({ error: "Property not found." });
    }

    if (property.availability !== "available") {
      return res.status(400).json({ error: "This property is not currently available." });
    }

    if (String(property.landlord) === String(req.user._id)) {
      return res.status(400).json({ error: "You cannot request a booking for your own listing." });
    }

    const booking = await Booking.create({
      property: property._id,
      tenant: req.user._id,
      landlord: property.landlord,
      requestedDate,
      message: bookingMessage
    });

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    // Notify the landlord about the new booking request
    const io = req.app.get("io");
    const notifMsg = `New viewing request for "${property.title}" from ${req.user.name}.`;
    await Notification.create({
      recipient: String(property.landlord),
      type: "booking_request",
      message: notifMsg,
      linkHref: "/landlord"
    });
    if (io) {
      io.to(String(property.landlord)).emit("notification:booking", {
        type: "info",
        message: notifMsg
      });
    }

    res.status(201).json({
      data: {
        booking: populatedBooking
      },
      message: "Booking request sent to the landlord."
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/cancel", requireAuth, requireVerifiedEmail, requireRole("tenant"), async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      tenant: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Only pending booking requests can be cancelled." });
    }

    booking.status = "cancelled";
    booking.decidedAt = new Date();
    booking.landlordResponse = "Cancelled by tenant.";
    await booking.save();

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    // Notify the landlord that the tenant cancelled
    const io = req.app.get("io");
    const cancelMsg = `Tenant cancelled their viewing request for "${populatedBooking.property?.title}".`;
    await Notification.create({
      recipient: String(booking.landlord),
      type: "booking_cancelled",
      message: cancelMsg,
      linkHref: "/landlord"
    });
    if (io) {
      io.to(String(booking.landlord)).emit("notification:booking", {
        type: "warning",
        message: cancelMsg
      });
    }

    res.status(200).json({
      data: {
        booking: populatedBooking
      },
      message: "Booking request cancelled."
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", requireAuth, requireVerifiedEmail, requireRole("landlord"), async (req, res, next) => {
  try {
    const { status, landlordResponse } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be approved or rejected." });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      landlord: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking request not found." });
    }

    booking.status = status;
    booking.landlordResponse = landlordResponse;
    booking.decidedAt = new Date();
    await booking.save();

    const populatedBooking = await populateBooking(Booking.findById(booking._id));

    // Notify the tenant about the landlord's decision
    const io = req.app.get("io");
    const statusMsg = `Your viewing request for "${populatedBooking.property?.title}" has been ${status}.`;
    const notifType = status === "approved" ? "booking_approved" : "booking_rejected";
    await Notification.create({
      recipient: String(booking.tenant),
      type: notifType,
      message: statusMsg,
      linkHref: "/tenant"
    });
    if (io) {
      const notificationType = status === "approved" ? "success" : "error";
      io.to(String(booking.tenant)).emit("notification:booking", {
        type: notificationType,
        message: statusMsg
      });
    }

    res.status(200).json({
      data: {
        booking: populatedBooking
      },
      message: `Booking request ${status}.`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
