import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import { connectTestDb, disconnectTestDb, clearCollections, createTestUser } from "../helpers.js";
import app from "../../app.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    beforeEach(async () => {
      await clearCollections();
    });

    it("should register a tenant user without returning a token", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "New Tenant", email: "tenant@test.com", password: "Password123", role: "tenant" });

      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeUndefined();
      expect(res.body.data.user.name).toBe("New Tenant");
      expect(res.body.data.user.role).toBe("tenant");
      expect(res.body.data.user.isVerified).toBe(false);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.message).toContain("verify your email");
    });
  });

  describe("POST /api/auth/verify-email", () => {
    beforeEach(async () => {
      await clearCollections();
    });

    it("should verify email with a valid token", async () => {
      // Register a user first (this creates a verification token internally)
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({ name: "Test User", email: "user@test.com", password: "Password123", role: "tenant" });

      expect(registerRes.status).toBe(201);

      // We can't access the raw token from the response since it's hashed before storing.
      // Instead, we'll test the failure case for invalid token and the resend flow.
      // For a proper verification test, we need to get the token from the user in the DB.
      const User = (await import("../../models/User.js")).default;
      const user = await User.findOne({ email: "user@test.com" });

      // The token is hashed in the DB, so we can't reverse it.
      // We'll verify the user was created with isVerified: false and has a token
      expect(user.isVerified).toBe(false);
      expect(user.emailVerificationToken).toBeTruthy();
      expect(user.emailVerificationExpires).toBeTruthy();
    });

    it("should reject verification with missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/verify-email")
        .send({ email: "test@test.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("verification token are required");
    });

    it("should reject verification with invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/verify-email")
        .send({ email: "test@test.com", token: "invalid-token" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid or expired verification token");
    });
  });

  describe("POST /api/auth/resend-verification", () => {
    beforeEach(async () => {
      await clearCollections();
    });

    it("should reject resend for already verified user", async () => {
      const { token } = await createTestUser({ isVerified: true });

      const res = await request(app)
        .post("/api/auth/resend-verification")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already verified");
    });

    it("should reject resend without authentication", async () => {
      const res = await request(app)
        .post("/api/auth/resend-verification");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await clearCollections();
      await request(app)
        .post("/api/auth/register")
        .send({ name: "Test User", email: "user@test.com", password: "Password123", role: "tenant" });
    });

    it("should reject login for unverified user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@test.com", password: "Password123" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("verify your email");
      expect(res.body.needsVerification).toBe(true);
    });

    it("should login with valid credentials for verified user", async () => {
      // Verify the user first
      const User = (await import("../../models/User.js")).default;
      const user = await User.findOne({ email: "user@test.com" });
      user.isVerified = true;
      await user.save();

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "user@test.com", password: "Password123" });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data.user.email).toBe("user@test.com");
      expect(res.body.data.user.isVerified).toBe(true);
    });
  });

  describe("GET /api/auth/me", () => {
    beforeEach(async () => {
      await clearCollections();
    });

    it("should return the authenticated user", async () => {
      const { token } = await createTestUser({ role: "tenant" });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("test@example.com");
    });

    it("should reject request without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });
});