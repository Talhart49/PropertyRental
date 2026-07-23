import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from "../helpers.js";
import Property from "../../models/Property.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearCollections);

describe("Property Model", () => {
  let landlord;

  beforeAll(async () => {
    const result = await createTestUser({ role: "landlord" });
    landlord = result.user;
  });

  const validPropertyData = () => ({
    landlord: landlord._id,
    title: "Modern City Apartment",
    description: "A beautiful modern apartment in the city centre with great views and amenities.",
    addressLine1: "123 Main Street",
    city: "Manchester",
    postcode: "M1 1AA",
    pricePerMonth: 950,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: "flat"
  });

  it("should create a property with valid data", async () => {
    const property = await Property.create(validPropertyData());
    expect(property.title).toBe("Modern City Apartment");
    expect(property.city).toBe("Manchester");
    expect(property.pricePerMonth).toBe(950);
    expect(property.availability).toBe("available");
    expect(property.moderationStatus).toBe("active");
  });

  it("should reject missing required fields", async () => {
    await expect(Property.create({})).rejects.toThrow();
  });

  it("should store images array", async () => {
    const property = await Property.create({
      ...validPropertyData(),
      images: [
        {
          filename: "test.jpg",
          originalName: "test.jpg",
          url: "/uploads/test.jpg",
          mimetype: "image/jpeg",
          size: 1024
        }
      ]
    });
    expect(property.images).toHaveLength(1);
    expect(property.images[0].filename).toBe("test.jpg");
  });

  it("should default images to empty array", async () => {
    const property = await Property.create(validPropertyData());
    expect(property.images).toEqual([]);
  });
});