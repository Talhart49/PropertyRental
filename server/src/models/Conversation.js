import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    lastMessage: {
      type: String,
      default: ""
    },
    lastMessageAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index(
  {
    property: 1,
    landlord: 1,
    tenant: 1
  },
  {
    unique: true
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
