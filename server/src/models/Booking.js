import mongoose from "mongoose";

const bookingStatuses = ["pending", "approved", "rejected", "cancelled"];

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    requestedDate: {
      type: Date,
      required: [true, "Requested viewing date is required."]
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message must be 1000 characters or fewer."]
    },
    status: {
      type: String,
      enum: bookingStatuses,
      default: "pending",
      index: true
    },
    landlordResponse: {
      type: String,
      trim: true,
      maxlength: [1000, "Landlord response must be 1000 characters or fewer."]
    },
    decidedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.index({
  property: 1,
  tenant: 1,
  requestedDate: 1
});

const Booking = mongoose.model("Booking", bookingSchema);

export { bookingStatuses };
export default Booking;
