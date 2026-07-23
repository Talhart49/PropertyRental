import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser, createTestProperty } from "../helpers.js";
import app from "../../app.js";
import Booking from "../../models/Booking.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe("Booking Routes", () => {
  let landlord, landlordToken, tenant, tenantToken, property;

  async function setup() {
    await clearCollections();
    const landlordResult = await createTestUser({ email: "landlord@test.com", role: "landlord" });
    landlord = landlordResult.user;
    landlordToken = landlordResult.token;

    const tenantResult = await createTestUser({ email: "tenant@test.com", role: "tenant" });
    tenant = tenantResult.user;
    tenantToken = tenantResult.token;

    property = await createTestProperty(landlord._id);
  }

  describe("POST /api/bookings (tenant only)", () => {
    beforeEach(setup);

    it("should create a booking request", async () => {
      const res = await request(app)
        .post("/api/bookings")
        .set("Authorization", `Bearer ${tenantToken}`)
        .send({
          propertyId: property._id,
          requestedDate: "2026-07-20T10:00:00Z",
          message: "I would like to view this property."
        });

      expect(res.status).toBe(201);
      expect(res.body.data.booking.status).toBe("pending");
      expect(res.body.data.booking.tenant.email).toBe("tenant@test.com");
    });
  });

  describe("GET /api/bookings/mine (tenant only)", () => {
    beforeEach(async () => {
      await setup();
      await Booking.create({
        property: property._id,
        tenant: tenant._id,
        landlord: landlord._id,
        requestedDate: new Date("2026-07-20T10:00:00Z"),
        message: "Test booking"
      });
    });

    it("should return tenant's bookings", async () => {
      const res = await request(app)
        .get("/api/bookings/mine")
        .set("Authorization", `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings).toHaveLength(1);
    });
  });

  describe("GET /api/bookings/incoming (landlord only)", () => {
    beforeEach(async () => {
      await setup();
      await Booking.create({
        property: property._id,
        tenant: tenant._id,
        landlord: landlord._id,
        requestedDate: new Date("2026-07-20T10:00:00Z"),
        message: "Test booking"
      });
    });

    it("should return landlord's incoming bookings", async () => {
      const res = await request(app)
        .get("/api/bookings/incoming")
        .set("Authorization", `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings).toHaveLength(1);
    });
  });

  describe("PATCH /api/bookings/:id/cancel (tenant only)", () => {
    let booking;

    beforeEach(async () => {
      await setup();
      booking = await Booking.create({
        property: property._id,
        tenant: tenant._id,
        landlord: landlord._id,
        requestedDate: new Date("2026-07-20T10:00:00Z"),
        message: "Test booking"
      });
    });

    it("should cancel a pending booking", async () => {
      const res = await request(app)
        .patch(`/api/bookings/${booking._id}/cancel`)
        .set("Authorization", `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe("cancelled");
    });
  });

  describe("PATCH /api/bookings/:id/status (landlord only)", () => {
    let booking;

    beforeEach(async () => {
      await setup();
      booking = await Booking.create({
        property: property._id,
        tenant: tenant._id,
        landlord: landlord._id,
        requestedDate: new Date("2026-07-20T10:00:00Z"),
        message: "Test booking"
      });
    });

    it("should approve a booking", async () => {
      const res = await request(app)
        .patch(`/api/bookings/${booking._id}/status`)
        .set("Authorization", `Bearer ${landlordToken}`)
        .send({ status: "approved", landlordResponse: "Looking forward to showing you around!" });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe("approved");
      expect(res.body.data.booking.landlordResponse).toBe("Looking forward to showing you around!");
    });

    it("should reject a booking", async () => {
      const res = await request(app)
        .patch(`/api/bookings/${booking._id}/status`)
        .set("Authorization", `Bearer ${landlordToken}`)
        .send({ status: "rejected" });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe("rejected");
    });
  });
});