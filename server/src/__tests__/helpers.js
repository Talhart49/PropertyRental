import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Booking from "../models/Booking.js";

let mongoServer;

/**
 * Connect to an in-memory MongoDB instance.
 * Call in beforeAll() of each test suite.
 */
export async function connectTestDb() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = "test-jwt-secret-key";
}

/**
 * Disconnect and stop the in-memory MongoDB instance.
 * Call in afterAll() of each test suite.
 */
export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Clear all collections between tests.
 * Call in afterEach() of each test suite.
 */
export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Generate a JWT for a given user ID and role.
 */
export function generateToken(userId, role = "tenant") {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

/**
 * Create a test user in the DB and return the user + token.
 */
export async function createTestUser(overrides = {}) {
  const userData = {
    name: overrides.name || "Test User",
    email: overrides.email || "test@example.com",
    password: "Password123",
    role: overrides.role || "tenant",
    isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true
  };

  if (overrides.isVerified === false) {
    delete userData.isVerified;
  }

  const user = await User.create(userData);
  const token = generateToken(user._id, user.role);
  return { user, token };
}

/**
 * Create a test property owned by a given landlord user.
 */
export async function createTestProperty(landlordId, overrides = {}) {
  const propertyData = {
    landlord: landlordId,
    title: overrides.title || "Modern City Apartment",
    description: overrides.description || "A beautiful modern apartment in the city centre with great views.",
    addressLine1: overrides.addressLine1 || "123 Main Street",
    city: overrides.city || "Manchester",
    postcode: overrides.postcode || "M1 1AA",
    pricePerMonth: overrides.pricePerMonth || 950,
    bedrooms: overrides.bedrooms || 2,
    bathrooms: overrides.bathrooms || 1,
    propertyType: overrides.propertyType || "flat",
    availability: overrides.availability || "available",
    moderationStatus: overrides.moderationStatus || "active"
  };

  return Property.create(propertyData);
}

/**
 * Create a test booking for a given property, tenant, and landlord.
 */
export async function createTestBooking(propertyId, tenantId, landlordId, overrides = {}) {
  const bookingData = {
    property: propertyId,
    tenant: tenantId,
    landlord: landlordId,
    requestedDate: overrides.requestedDate || new Date("2026-07-15T10:00:00Z"),
    message: overrides.message || "I would like to view this property.",
    status: overrides.status || "pending"
  };

  return Booking.create(bookingData);
}