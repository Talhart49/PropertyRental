import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers.js";
import app from "../../app.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearCollections);

describe("Middleware & Error Handling", () => {
  describe("GET /health", () => {
    it("should return status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ok");
      expect(res.body.data.service).toBe("property-rental-api");
    });
  });

  describe("404 Not Found", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request(app).get("/api/nonexistent");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Route not found.");
    });
  });

  describe("Authentication", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Authentication token is required.");
    });
  });

  describe("Input Validation", () => {
    it("should return 400 for validation errors on register", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "A", email: "not-email", password: "short" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Please fix the highlighted listing details.");
      expect(res.body.details).toBeTruthy();
      expect(res.body.details.length).toBeGreaterThan(0);
    });
  });
});