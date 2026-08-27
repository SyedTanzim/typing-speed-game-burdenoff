import { describe, expect, test } from "bun:test";

// Password verification using Bun native crypto engine
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

describe("Authentication Utilities", () => {
  test("hashes plain text passwords securely", async () => {
    const plainPassword = "MySecurePassword123!";
    const hash = await hashPassword(plainPassword);

    expect(hash).not.toBe(plainPassword);
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  test("verifies valid password against generated hash", async () => {
    const plainPassword = "MySecurePassword123!";
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword(plainPassword, hash);

    expect(isValid).toBe(true);
  });

  test("rejects invalid password against hash", async () => {
    const plainPassword = "MySecurePassword123!";
    const wrongPassword = "WrongPassword456!";
    const hash = await hashPassword(plainPassword);
    const isValid = await verifyPassword(wrongPassword, hash);

    expect(isValid).toBe(false);
  });
});