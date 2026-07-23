import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "booking_request",
        "booking_approved",
        "booking_rejected",
        "booking_cancelled",
        "message_new"
      ],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    linkHref: {
      type: String,
      default: "/"
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficiently fetching unread notifications for a user
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;