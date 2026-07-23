import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from "@jest/globals";
import request from "supertest";
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser, createTestProperty } from "../helpers.js";
import app from "../../app.js";
import Property from "../../models/Property.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe("Property Routes", () => {
  let landlordToken, landlord, tenantToken;

  // Recreate users before each nested describe to ensure tokens stay valid
  async function setupUsers() {
    await clearCollections();
    const landlordResult = await createTestUser({ email: "landlord@test.com", role: "landlord" });
    landlord = landlordResult.user;
    landlordToken = landlordResult.token;

    const tenantResult = await createTestUser({ email: "tenant@test.com", role: "tenant" });
    tenantToken = tenantResult.token;
  }

  describe("GET /api/properties (public search)", () => {
    beforeEach(async () => {
      await setupUsers();
      await Property.create([
        {
          landlord: landlord._id,
          title: "Modern City Apartment",
          description: "A beautiful modern apartment in the city centre.",
          addressLine1: "123 Main Street",
          city: "Manchester",
          postcode: "M1 1AA",
          pricePerMonth: 950,
          bedrooms: 2,
          bathrooms: 1,
          propertyType: "flat",
          availability: "available",
          moderationStatus: "active"
        },
        {
          landlord: landlord._id,
          title: "Spacious Family House",
          description: "A lovely family house with a big garden.",
          addressLine1: "456 Park Road",
          city: "London",
          postcode: "SW1 1AA",
          pricePerMonth: 1800,
          bedrooms: 4,
          bathrooms: 2,
          propertyType: "house",
          availability: "available",
          moderationStatus: "active"
        }
      ]);
    });

    it("should return all active properties", async () => {
      const res = await request(app).get("/api/properties");
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(2);
    });

    it("should filter by city", async () => {
      const res = await request(app).get("/api/properties?location=London");
      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0].city).toBe("London");
    });
  });

  describe("GET /api/properties/:id", () => {
    let activeProperty;

    beforeEach(async () => {
      await setupUsers();
      activeProperty = await createTestProperty(landlord._id);
    });

    it("should return an active property by ID", async () => {
      const res = await request(app).get(`/api/properties/${activeProperty._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.property.title).toBe("Modern City Apartment");
    });
  });

  describe("GET /api/properties/mine (landlord only)", () => {
    beforeEach(async () => {
      await setupUsers();
    });

    it("should return landlord's own properties", async () => {
      const property = await createTestProperty(landlord._id);
      const res = await request(app)
        .get("/api/properties/mine")
        .set("Authorization", `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.properties).toHaveLength(1);
      expect(res.body.data.properties[0]._id).toBe(String(property._id));
    });
  });

  describe("POST /api/properties (landlord only)", () => {
    beforeEach(async () => {
      await setupUsers();
    });

    it("should create a property listing", async () => {
      const res = await request(app)
        .post("/api/properties")
        .set("Authorization", `Bearer ${landlordToken}`)
        .field("title", "New Apartment")
        .field("description", "A brand new apartment in the city with modern features.")
        .field("addressLine1", "10 Test Street")
        .field("city", "Birmingham")
        .field("postcode", "B1 1AA")
        .field("pricePerMonth", "1200")
        .field("bedrooms", "2")
        .field("bathrooms", "1")
        .field("propertyType", "flat");

      expect(res.status).toBe(201);
      expect(res.body.data.property.title).toBe("New Apartment");
    });
  });

  describe("PATCH /api/properties/:id (landlord only)", () => {
    let property;

    beforeEach(async () => {
      await setupUsers();
      property = await createTestProperty(landlord._id);
    });

    it("should update a property", async () => {
      const res = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${landlordToken}`)
        .field("pricePerMonth", "1100");

      expect(res.status).toBe(200);
      expect(res.body.data.property.pricePerMonth).toBe(1100);
    });

    it("should delete specific images from a property", async () => {
      // Add images to the property first
      property.images.push(
        { filename: "img1.jpg", originalName: "img1.jpg", url: "/uploads/img1.jpg", mimetype: "image/jpeg", size: 1000 },
        { filename: "img2.jpg", originalName: "img2.jpg", url: "/uploads/img2.jpg", mimetype: "image/jpeg", size: 2000 },
        { filename: "img3.jpg", originalName: "img3.jpg", url: "/uploads/img3.jpg", mimetype: "image/jpeg", size: 3000 }
      );
      await property.save();

      const res = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${landlordToken}`)
        .field("imagesToDelete", "img1.jpg,img3.jpg");

      expect(res.status).toBe(200);
      expect(res.body.data.property.images).toHaveLength(1);
      expect(res.body.data.property.images[0].filename).toBe("img2.jpg");
    });

    it("should delete images using JSON array format", async () => {
      // Add images to the property first
      property.images.push(
        { filename: "img-a.jpg", originalName: "img-a.jpg", url: "/uploads/img-a.jpg", mimetype: "image/jpeg", size: 1000 },
        { filename: "img-b.jpg", originalName: "img-b.jpg", url: "/uploads/img-b.jpg", mimetype: "image/jpeg", size: 2000 }
      );
      await property.save();

      const res = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${landlordToken}`)
        .field("imagesToDelete", JSON.stringify(["img-a.jpg"]));

      expect(res.status).toBe(200);
      expect(res.body.data.property.images).toHaveLength(1);
      expect(res.body.data.property.images[0].filename).toBe("img-b.jpg");
    });

    it("should ignore imagesToDelete when no matching images exist", async () => {
      property.images.push(
        { filename: "existing.jpg", originalName: "existing.jpg", url: "/uploads/existing.jpg", mimetype: "image/jpeg", size: 1000 }
      );
      await property.save();

      const res = await request(app)
        .patch(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${landlordToken}`)
        .field("imagesToDelete", "nonexistent.jpg");

      expect(res.status).toBe(200);
      expect(res.body.data.property.images).toHaveLength(1);
      expect(res.body.data.property.images[0].filename).toBe("existing.jpg");
    });
  });

  describe("DELETE /api/properties/:id (landlord only)", () => {
    let property;

    beforeEach(async () => {
      await setupUsers();
      property = await createTestProperty(landlord._id);
    });

    it("should delete own property", async () => {
      const res = await request(app)
        .delete(`/api/properties/${property._id}`)
        .set("Authorization", `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(String(property._id));

      const deleted = await Property.findById(property._id);
      expect(deleted).toBeNull();
    });
  });
});