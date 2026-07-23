import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers.js";
import User from "../../models/User.js";

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearCollections);

describe("User Model", () => {
  const validUserData = {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123",
    role: "tenant"
  };

  it("should create a user with valid data", async () => {
    const user = await User.create(validUserData);
    expect(user.name).toBe("John Doe");
    expect(user.email).toBe("john@example.com");
    expect(user.role).toBe("tenant");
    expect(user.password).not.toBe("Password123"); // should be hashed
  });

  it("should hash password before saving", async () => {
    const user = await User.create(validUserData);
    const isHashed = await user.comparePassword("Password123");
    expect(isHashed).toBe(true);
    const isWrong = await user.comparePassword("WrongPassword");
    expect(isWrong).toBe(false);
  });

  it("should reject a duplicate email", async () => {
    await User.create(validUserData);
    await expect(User.create(validUserData)).rejects.toThrow();
  });

  it("should reject missing required fields", async () => {
    await expect(User.create({})).rejects.toThrow();
  });

  it("should default role to tenant", async () => {
    const user = await User.create({
      name: "Default Role",
      email: "default@example.com",
      password: "Password123"
    });
    expect(user.role).toBe("tenant");
  });

  it("should return safe object without password", () => {
    const user = new User(validUserData);
    const safe = user.toSafeObject();
    expect(safe.password).toBeUndefined();
    expect(safe.name).toBe("John Doe");
  });
});