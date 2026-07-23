import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser, createTestProperty, createTestBooking } from "../helpers.js";
import app from "../../app.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe("Admin Routes", () => {
  let adminToken, landlord, tenant;

  async function setup() {
    await clearCollections();
    const adminResult = await createTestUser({ email: "admin@test.com", role: "admin" });
    adminToken = adminResult.token;

    const landlordResult = await createTestUser({ email: "landlord@test.com", role: "landlord" });
    landlord = landlordResult.user;

    const tenantResult = await createTestUser({ email: "tenant@test.com", role: "tenant" });
    tenant = tenantResult.user;
  }

  describe("GET /api/admin/summary", () => {
    beforeEach(setup);

    it("should return dashboard summary for admin", async () => {
      const res = await request(app)
        .get("/api/admin/summary")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.users.total).toBe(3);
      expect(res.body.data.summary.properties.total).toBe(0);
      expect(res.body.data.summary.bookings.total).toBe(0);
    });
  });

  describe("PATCH /api/admin/properties/:id/status", () => {
    let property;

    beforeEach(async () => {
      await setup();
      property = await createTestProperty(landlord._id, { moderationStatus: "pending" });
    });

    it("should update moderation status", async () => {
      const res = await request(app)
        .patch(`/api/admin/properties/${property._id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ moderationStatus: "active" });

      expect(res.status).toBe(200);
      expect(res.body.data.property.moderationStatus).toBe("active");
    });
  });

  describe("GET /api/admin/users — pagination & sorting", () => {
    beforeEach(async () => {
      await clearCollections();
      const adminResult = await createTestUser({ email: "admin@test.com", role: "admin" });
      adminToken = adminResult.token;
      // Create 25 users with varied names/emails
      for (let i = 1; i <= 25; i++) {
        await createTestUser({
          name: `User ${String(i).padStart(2, "0")}`,
          email: `user${i}@test.com`,
          role: i <= 10 ? "landlord" : "tenant"
        });
      }
    });

    it("should paginate users with default page=1, limit=20", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(20);
      expect(res.body.data.pagination.total).toBe(26); // 25 + admin
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(20);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });

    it("should return page 2 with remaining users", async () => {
      const res = await request(app)
        .get("/api/admin/users?page=2&limit=20")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(6);
      expect(res.body.data.pagination.page).toBe(2);
    });

    it("should respect custom limit", async () => {
      const res = await request(app)
        .get("/api/admin/users?limit=5")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBe(5);
      expect(res.body.data.pagination.limit).toBe(5);
      expect(res.body.data.pagination.totalPages).toBe(6); // ceil(26/5)
    });

    it("should sort by name ascending", async () => {
      const res = await request(app)
        .get("/api/admin/users?sortBy=name&sortOrder=asc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const names = res.body.data.users.map((u) => u.name);
      // "Test User" (admin) comes first alphabetically, then "User 01", "User 02", ...
      expect(names[0]).toBe("Test User");
      expect(names[1]).toBe("User 01");
    });

    it("should sort by name descending", async () => {
      const res = await request(app)
        .get("/api/admin/users?sortBy=name&sortOrder=desc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const names = res.body.data.users.map((u) => u.name);
      expect(names[0]).toBe("User 25");
    });

    it("should sort by email ascending", async () => {
      const res = await request(app)
        .get("/api/admin/users?sortBy=email&sortOrder=asc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const emails = res.body.data.users.map((u) => u.email);
      expect(emails[0]).toBe("admin@test.com");
    });

    it("should sort by role descending", async () => {
      const res = await request(app)
        .get("/api/admin/users?sortBy=role&sortOrder=desc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const roles = res.body.data.users.map((u) => u.role);
      // desc order: tenant > landlord > admin alphabetically
      expect(roles[0]).toBe("tenant");
    });

    it("should reject invalid sortBy field gracefully (fallback to createdAt)", async () => {
      const res = await request(app)
        .get("/api/admin/users?sortBy=invalidField")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThan(0);
    });

    it("should clamp limit to max 100", async () => {
      const res = await request(app)
        .get("/api/admin/users?limit=999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(100);
    });

    it("should enforce minimum limit of 1", async () => {
      const res = await request(app)
        .get("/api/admin/users?limit=0")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(1);
    });
  });

  describe("GET /api/admin/properties — pagination & sorting", () => {
    beforeEach(async () => {
      await clearCollections();
      const adminResult = await createTestUser({ email: "admin@test.com", role: "admin" });
      adminToken = adminResult.token;
      const landlordResult = await createTestUser({ email: "landlord@test.com", role: "landlord" });
      landlord = landlordResult.user;

      // Create 5 properties with varied data (kept small to avoid geocoding rate limits)
      for (let i = 1; i <= 5; i++) {
        await createTestProperty(landlord._id, {
          title: `Property ${String(i).padStart(2, "0")}`,
          city: i <= 2 ? "London" : i <= 4 ? "Manchester" : "Birmingham",
          pricePerMonth: 500 + i * 50,
          moderationStatus: i <= 2 ? "active" : i <= 4 ? "pending" : "rejected"
        });
      }
    });

    it("should paginate properties with default page=1, limit=20", async () => {
      const res = await request(app)
        .get("/api/admin/properties")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.properties.length).toBe(5);
      expect(res.body.data.pagination.total).toBe(5);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it("should return page 2 with limit=3", async () => {
      const res = await request(app)
        .get("/api/admin/properties?page=2&limit=3")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.properties.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(2);
    });

    it("should sort by pricePerMonth ascending", async () => {
      const res = await request(app)
        .get("/api/admin/properties?sortBy=pricePerMonth&sortOrder=asc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const prices = res.body.data.properties.map((p) => p.pricePerMonth);
      expect(prices[0]).toBeLessThan(prices[prices.length - 1]);
    });

    it("should sort by title descending", async () => {
      const res = await request(app)
        .get("/api/admin/properties?sortBy=title&sortOrder=desc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const titles = res.body.data.properties.map((p) => p.title);
      expect(titles[0]).toBe("Property 05");
    });

    it("should sort by city ascending", async () => {
      const res = await request(app)
        .get("/api/admin/properties?sortBy=city&sortOrder=asc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const cities = res.body.data.properties.map((p) => p.city);
      expect(cities[0]).toBe("Birmingham");
    });

    it("should sort by moderationStatus descending", async () => {
      const res = await request(app)
        .get("/api/admin/properties?sortBy=moderationStatus&sortOrder=desc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const statuses = res.body.data.properties.map((p) => p.moderationStatus);
      // desc: rejected > pending > active
      expect(statuses[0]).toBe("rejected");
    });
  });

  describe("GET /api/admin/bookings — pagination & sorting", () => {
    beforeEach(async () => {
      await clearCollections();
      const adminResult = await createTestUser({ email: "admin@test.com", role: "admin" });
      adminToken = adminResult.token;
      const landlordResult = await createTestUser({ email: "landlord@test.com", role: "landlord" });
      landlord = landlordResult.user;
      const tenantResult = await createTestUser({ email: "tenant@test.com", role: "tenant" });
      tenant = tenantResult.user;

      const property = await createTestProperty(landlord._id);

      // Create 12 bookings with varied statuses and dates
      for (let i = 1; i <= 12; i++) {
        await createTestBooking(property._id, tenant._id, landlord._id, {
          status: i <= 4 ? "pending" : i <= 8 ? "approved" : "rejected",
          requestedDate: new Date(2026, 6, i)
        });
      }
    });

    it("should paginate bookings with default page=1, limit=20", async () => {
      const res = await request(app)
        .get("/api/admin/bookings")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBe(12);
      expect(res.body.data.pagination.total).toBe(12);
    });

    it("should return page 2 with limit=10", async () => {
      const res = await request(app)
        .get("/api/admin/bookings?page=2&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.bookings.length).toBe(2);
      expect(res.body.data.pagination.page).toBe(2);
    });

    it("should sort by status ascending", async () => {
      const res = await request(app)
        .get("/api/admin/bookings?sortBy=status&sortOrder=asc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const statuses = res.body.data.bookings.map((b) => b.status);
      // asc: approved < pending < rejected alphabetically
      expect(statuses[0]).toBe("approved");
    });

    it("should sort by requestedDate descending", async () => {
      const res = await request(app)
        .get("/api/admin/bookings?sortBy=requestedDate&sortOrder=desc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const dates = res.body.data.bookings.map((b) => new Date(b.requestedDate).getDate());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[dates.length - 1]);
    });
  });
});