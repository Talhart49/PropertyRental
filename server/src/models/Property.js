import mongoose from "mongoose";
import { geocodePropertyAddress } from "../utils/geocode.js";

const propertyTypes = ["flat", "house", "studio", "room", "bungalow", "maisonette"];
const availabilityStatuses = ["available", "unavailable"];
const moderationStatuses = ["active", "pending", "rejected"];

const imageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  },
  {
    _id: false
  }
);

const propertySchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Title is required."],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long."]
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      trim: true,
      minlength: [20, "Description must be at least 20 characters long."]
    },
    addressLine1: {
      type: String,
      required: [true, "Address line 1 is required."],
      trim: true
    },
    city: {
      type: String,
      required: [true, "City is required."],
      trim: true,
      index: true
    },
    postcode: {
      type: String,
      required: [true, "Postcode is required."],
      uppercase: true,
      trim: true
    },
    pricePerMonth: {
      type: Number,
      required: [true, "Monthly rent is required."],
      min: [1, "Monthly rent must be greater than 0."]
    },
    bedrooms: {
      type: Number,
      required: [true, "Bedrooms are required."],
      min: [0, "Bedrooms cannot be negative."]
    },
    bathrooms: {
      type: Number,
      required: [true, "Bathrooms are required."],
      min: [0, "Bathrooms cannot be negative."]
    },
    propertyType: {
      type: String,
      enum: propertyTypes,
      required: [true, "Property type is required."]
    },
    availability: {
      type: String,
      enum: availabilityStatuses,
      default: "available"
    },
    moderationStatus: {
      type: String,
      enum: moderationStatuses,
      default: "active"
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    images: {
      type: [imageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Auto-geocode address to lat/lng when coordinates are missing
propertySchema.pre("save", async function () {
  if (!this.latitude || !this.longitude) {
    const coords = await geocodePropertyAddress({
      addressLine1: this.addressLine1,
      city: this.city,
      postcode: this.postcode
    });

    if (coords) {
      this.latitude = coords.latitude;
      this.longitude = coords.longitude;
    }
  }
});

propertySchema.index({
  title: "text",
  description: "text",
  city: "text",
  postcode: "text"
});

const Property = mongoose.model("Property", propertySchema);

export { availabilityStatuses, moderationStatuses, propertyTypes };
export default Property;
