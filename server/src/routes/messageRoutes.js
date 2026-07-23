import express from "express";
import { requireAuth, requireVerifiedEmail } from "../middleware/auth.js";
import Booking from "../models/Booking.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Property from "../models/Property.js";

const router = express.Router();

function conversationAccessQuery(user) {
  if (user.role === "landlord") {
    return { landlord: user._id };
  }

  if (user.role === "tenant") {
    return { tenant: user._id };
  }

  return {};
}

function populateConversation(query) {
  return query
    .populate("property", "title addressLine1 city postcode pricePerMonth images")
    .populate("booking", "status requestedDate")
    .populate("landlord", "name email")
    .populate("tenant", "name email");
}

async function findConversationForUser(conversationId, user) {
  return populateConversation(
    Conversation.findOne({
      _id: conversationId,
      ...conversationAccessQuery(user)
    })
  );
}

router.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    const conversations = await populateConversation(
      Conversation.find(conversationAccessQuery(req.user)).sort({
        lastMessageAt: -1,
        updatedAt: -1
      })
    );

    res.status(200).json({
      data: {
        conversations
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/conversations/unread-counts", requireAuth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find(
      conversationAccessQuery(req.user)
    ).select("_id");

    const conversationIds = conversations.map((c) => c._id);

    const counts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds },
          readBy: { $ne: req.user._id }
        }
      },
      {
        $group: {
          _id: "$conversation",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = {};
    counts.forEach(({ _id, count }) => {
      unreadMap[String(_id)] = count;
    });

    res.status(200).json({
      data: {
        unreadCounts: unreadMap
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/conversations", requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const { propertyId, bookingId } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: "Property is required." });
    }

    const property = await Property.findById(propertyId);

    if (!property || property.moderationStatus !== "active") {
      return res.status(404).json({ error: "Property not found." });
    }

    let tenant = req.user._id;
    let booking = null;

    if (bookingId) {
      booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ error: "Booking request not found." });
      }

      const isParticipant =
        String(booking.tenant) === String(req.user._id) ||
        String(booking.landlord) === String(req.user._id);

      if (!isParticipant) {
        return res.status(403).json({ error: "You cannot access this booking conversation." });
      }

      tenant = booking.tenant;
    } else if (req.user.role !== "tenant") {
      return res.status(400).json({ error: "Landlords must start conversations from a booking." });
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        property: property._id,
        landlord: property.landlord,
        tenant
      },
      {
        $setOnInsert: {
          property: property._id,
          booking: booking?._id,
          landlord: property.landlord,
          tenant
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    const populatedConversation = await populateConversation(
      Conversation.findById(conversation._id)
    );

    res.status(200).json({
      data: {
        conversation: populatedConversation
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/conversations/:id/messages", requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const conversation = await findConversationForUser(req.params.id, req.user);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate("sender", "name email role")
      .sort({ createdAt: 1 });

    res.status(200).json({
      data: {
        conversation,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/conversations/:id/read", requireAuth, async (req, res, next) => {
  try {
    const conversation = await findConversationForUser(req.params.id, req.user);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const result = await Message.updateMany(
      {
        conversation: conversation._id,
        readBy: { $ne: req.user._id }
      },
      {
        $addToSet: { readBy: req.user._id }
      }
    );

    res.status(200).json({
      data: {
        markedRead: result.modifiedCount
      },
      message: "Messages marked as read."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/conversations/:id/messages", requireAuth, requireVerifiedEmail, async (req, res, next) => {
  try {
    const conversation = await findConversationForUser(req.params.id, req.user);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      body: req.body.body,
      readBy: [req.user._id]
    });

    conversation.lastMessage = message.body;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "name email role"
    );
    const io = req.app.get("io");

    // conversation.landlord and conversation.tenant are populated objects,
    // so we need ._id to get the actual ID string
    const recipientId =
      String(req.user._id) === String(conversation.landlord._id)
        ? String(conversation.tenant._id)
        : String(conversation.landlord._id);
    const otherName = populatedMessage.sender?.name || "Someone";

    // Persist notification to DB so the recipient sees it on next login
    await Notification.create({
      recipient: recipientId,
      type: "message_new",
      message: `New message from ${otherName}`,
      linkHref: `/messages?conversation=${conversation._id}`
    });

    if (io) {
      io.to(String(conversation._id)).emit("message:new", {
        conversationId: String(conversation._id),
        message: populatedMessage
      });

      // Also emit to the recipient's personal room so the NotificationProvider
      // (which joins the user room, not conversation rooms) receives the event
      // and can show a toast popup + add a notification to the bell dropdown.
      io.to(recipientId).emit("message:new", {
        conversationId: String(conversation._id),
        message: populatedMessage
      });
    }

    res.status(201).json({
      data: {
        message: populatedMessage
      },
      message: "Message sent."
    });
  } catch (error) {
    next(error);
  }
});

export default router;
