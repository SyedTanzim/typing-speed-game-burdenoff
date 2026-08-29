import { describe, expect, test } from "bun:test";
import jwt from "jsonwebtoken";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from "../utils/auth";
 
describe("Authentication Utilities (real implementation)", () => {
  test("hashes plain text passwords securely with bcrypt", async () => {
    const plainPassword = "MySecurePassword123!";
    const hash = await hashPassword(plainPassword);
 
    expect(hash).not.toBe(plainPassword);
    expect(typeof hash).toBe("string");
    // bcrypt hashes always start with a $2 version identifier.
    expect(hash.startsWith("$2")).toBe(true);
  });
 
  test("produces a different hash each time (salted)", async () => {
    const plainPassword = "MySecurePassword123!";
    const hash1 = await hashPassword(plainPassword);
    const hash2 = await hashPassword(plainPassword);
 
    expect(hash1).not.toBe(hash2);
  });
 
  test("verifies a valid password against its generated hash", async () => {
    const plainPassword = "MySecurePassword123!";
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword(plainPassword, hash);
 
    expect(isValid).toBe(true);
  });
 
  test("rejects an incorrect password against the hash", async () => {
    const plainPassword = "MySecurePassword123!";
    const wrongPassword = "WrongPassword456!";
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword(wrongPassword, hash);
 
    expect(isValid).toBe(false);
  });
 
  test("signs a token that verifies back to the same userId", () => {
    const token = signToken("user-123");
    const payload = verifyToken(token);
 
    expect(payload?.userId).toBe("user-123");
  });
 
  test("returns null for a malformed or tampered token", () => {
    expect(verifyToken("not.a.valid.jwt")).toBeNull();
    expect(verifyToken("")).toBeNull();
  });
 
  test("returns null for a token signed with a different secret", () => {
    // Simulates a forged token — signing with a bogus secret should
    // never verify successfully against our real JWT_SECRET.
    const forged = jwt.sign({ userId: "attacker" }, "wrong-secret");
 
    expect(verifyToken(forged)).toBeNull();
  });
});