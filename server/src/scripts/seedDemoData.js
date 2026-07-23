import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Booking from "../models/Booking.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Property from "../models/Property.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const demoPassword = "Password123";
const demoUsers = [
  {
    name: "Demo Landlord",
    email: "demo.landlord@propertyrental.local",
    role: "landlord"
  },
  {
    name: "Demo Tenant",
    email: "demo.tenant@propertyrental.local",
    role: "tenant"
  },
  {
    name: "Demo Admin",
    email: "demo.admin@propertyrental.local",
    role: "admin"
  }
];

async function upsertDemoUser(userData) {
  let user = await User.findOne({ email: userData.email });

  if (!user) {
    user = new User({
      ...userData,
      password: demoPassword
    });
  } else {
    user.name = userData.name;
    user.role = userData.role;
    user.password = demoPassword;
  }

  await user.save();
  return user;
}

async function seed() {
  if (process.env.DEMO_SEED_CONFIRM !== "true") {
    throw new Error("Set DEMO_SEED_CONFIRM=true before running the demo seed script.");
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const [landlord, tenant, admin] = await Promise.all(
    demoUsers.map((user) => upsertDemoUser(user))
  );

  await Property.deleteMany({ title: /^Demo / });
  await Booking.deleteMany({ tenant: tenant._id, landlord: landlord._id });
  const conversations = await Conversation.find({
    tenant: tenant._id,
    landlord: landlord._id
  });
  await Message.deleteMany({
    conversation: { $in: conversations.map((conversation) => conversation._id) }
  });
  await Conversation.deleteMany({
    tenant: tenant._id,
    landlord: landlord._id
  });

  const properties = await Property.create([
    {
      landlord: landlord._id,
      title: "Demo Manchester City Flat",
      description:
        "A bright two bedroom flat close to public transport, shops, and city centre offices.",
      addressLine1: "10 Oxford Road",
      city: "Manchester",
      postcode: "M1 1AA",
      pricePerMonth: 1250,
      bedrooms: 2,
      bathrooms: 1,
      propertyType: "flat",
      availability: "available",
      moderationStatus: "active",
      latitude: 53.474,
      longitude: -2.2426
    },
    {
      landlord: landlord._id,
      title: "Demo Leeds Studio",
      description:
        "A compact studio suitable for a single tenant, located near the station and local amenities.",
      addressLine1: "22 Park Row",
      city: "Leeds",
      postcode: "LS1 5HD",
      pricePerMonth: 850,
      bedrooms: 0,
      bathrooms: 1,
      propertyType: "studio",
      availability: "available",
      moderationStatus: "active",
      latitude: 53.7997,
      longitude: -1.5492
    }
  ]);

  const booking = await Booking.create({
    property: properties[0]._id,
    tenant: tenant._id,
    landlord: landlord._id,
    requestedDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    message: "I would like to view this property this week.",
    status: "pending"
  });

  const conversation = await Conversation.create({
    property: properties[0]._id,
    booking: booking._id,
    tenant: tenant._id,
    landlord: landlord._id,
    lastMessage: "I would like to view this property this week.",
    lastMessageAt: new Date()
  });

  await Message.create({
    conversation: conversation._id,
    sender: tenant._id,
    body: "I would like to view this property this week.",
    readBy: [tenant._id]
  });

  console.log("Demo data seeded.");
  console.log("Landlord:", landlord.email, demoPassword);
  console.log("Tenant:", tenant.email, demoPassword);
  console.log("Admin:", admin.email, demoPassword);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
