import { describe, it, expect } from "vitest";
import {
  getFriendlyAuthErrorMessage,
  validateAuthInput,
} from "../src/features/auth/errors";

describe("Authentication Flows & Input Validation", () => {
  describe("Form Input Validation", () => {
    it("should accept valid registration inputs", () => {
      const result = validateAuthInput({
        email: "dharma@pawiwahan.id",
        password: "securePassword123",
        confirmPassword: "securePassword123",
        fullName: "I Gede Dharma",
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject invalid email formats", () => {
      const result = validateAuthInput({
        email: "invalid-email-format",
        password: "password123",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Format alamat email tidak valid");
    });

    it("should reject passwords shorter than 6 characters", () => {
      const result = validateAuthInput({
        email: "shanti@pawiwahan.id",
        password: "123",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("minimal 6 karakter");
    });

    it("should reject mismatched confirmation passwords", () => {
      const result = validateAuthInput({
        email: "shanti@pawiwahan.id",
        password: "passwordA",
        confirmPassword: "passwordB",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Konfirmasi kata sandi tidak cocok");
    });

    it("should reject full names shorter than 2 characters", () => {
      const result = validateAuthInput({
        email: "shanti@pawiwahan.id",
        password: "validPassword",
        fullName: "A",
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Nama lengkap minimal 2 karakter");
    });
  });

  describe("Friendly Error Message Translation", () => {
    it("should translate duplicate account errors", () => {
      const msg = getFriendlyAuthErrorMessage("User already registered");
      expect(msg).toContain("Email ini sudah terdaftar");
    });

    it("should translate invalid credentials errors", () => {
      const msg = getFriendlyAuthErrorMessage("Invalid login credentials");
      expect(msg).toContain(
        "Email atau kata sandi yang Anda masukkan tidak sesuai"
      );
    });

    it("should translate unconfirmed email errors", () => {
      const msg = getFriendlyAuthErrorMessage("Email not confirmed");
      expect(msg).toContain("Email Anda belum dikonfirmasi");
    });

    it("should translate rate limit errors", () => {
      const msg = getFriendlyAuthErrorMessage(
        "For security purposes, you can only request this once every 60 seconds"
      );
      expect(msg).toContain("tunggu 60 detik");
    });

    it("should translate expired session errors", () => {
      const msg = getFriendlyAuthErrorMessage("Auth session missing!");
      expect(msg).toContain("Sesi login Anda telah berakhir");
    });
  });

  describe("Middleware Route Protection Rules", () => {
    const isProtected = (path: string) =>
      path.startsWith("/workspace") ||
      path.startsWith("/profile") ||
      path.startsWith("/settings");

    const isAuthPage = (path: string) =>
      path === "/login" || path === "/register" || path === "/reset-password";

    it("should identify protected workspace and user routes", () => {
      expect(isProtected("/workspace/abc-123")).toBe(true);
      expect(isProtected("/profile")).toBe(true);
      expect(isProtected("/settings/billing")).toBe(true);
      expect(isProtected("/")).toBe(false);
      expect(isProtected("/login")).toBe(false);
    });

    it("should identify authentication routes", () => {
      expect(isAuthPage("/login")).toBe(true);
      expect(isAuthPage("/register")).toBe(true);
      expect(isAuthPage("/reset-password")).toBe(true);
      expect(isAuthPage("/profile")).toBe(false);
    });
  });
});
