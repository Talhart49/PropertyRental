import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser, createTestProperty } from "../helpers.js";
import Booking from "../../models/Booking.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearCollections);

describe("Booking Model", () => {
  let landlord, tenant, property;

  beforeAll(async () => {
    const landlordResult = await createTestUser({ email: "landlord@test.com", role: "landlord" });
    landlord = landlordResult.user;
    const tenantResult = await createTestUser({ email: "tenant@test.com", role: "tenant" });
    tenant = tenantResult.user;
    property = await createTestProperty(landlord._id);
  });

  const validBookingData = () => ({
    property: property._id,
    tenant: tenant._id,
    landlord: landlord._id,
    requestedDate: new Date("2026-07-15T10:00:00Z"),
    message: "I would like to view this property."
  });

  it("should create a booking with valid data", async () => {
    const booking = await Booking.create(validBookingData());
    expect(booking.status).toBe("pending");
    expect(booking.message).toBe("I would like to view this property.");
    expect(booking.requestedDate).toBeTruthy();
  });

  it("should reject missing required fields", async () => {
    await expect(Booking.create({})).rejects.toThrow();
  });

  it("should default status to pending", async () => {
    const booking = await Booking.create(validBookingData());
    expect(booking.status).toBe("pending");
  });
});