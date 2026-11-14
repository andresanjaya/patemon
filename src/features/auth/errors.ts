/**
 * Maps Supabase authentication error messages to friendly, localized Indonesian messages.
 */
export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (!error) return "";

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Terjadi kesalahan sistem";

  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Email atau kata sandi yang Anda masukkan tidak sesuai.";
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("email address already in use") ||
    lower.includes("user_already_exists")
  ) {
    return "Email ini sudah terdaftar. Silakan masuk dengan kata sandi Anda.";
  }

  if (lower.includes("email not confirmed")) {
    return "Email Anda belum dikonfirmasi. Silakan periksa tautan verifikasi pada inbox atau spam email Anda.";
  }

  if (
    lower.includes("password should be at least") ||
    lower.includes("weak password")
  ) {
    return "Kata sandi minimal harus terdiri dari 6 karakter.";
  }

  if (lower.includes("rate limit") || lower.includes("60 seconds")) {
    return "Terlalu banyak percobaan. Silakan tunggu 60 detik sebelum mencoba kembali.";
  }

  if (lower.includes("network") || lower.includes("fetch failed")) {
    return "Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.";
  }

  if (lower.includes("session missing") || lower.includes("jwt expired")) {
    return "Sesi login Anda telah berakhir. Silakan masuk kembali.";
  }

  return message;
}

/**
 * Validates signup / login inputs client-side or server-side.
 */
export function validateAuthInput(data: {
  email: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.email || !emailRegex.test(data.email.trim())) {
    return { isValid: false, error: "Format alamat email tidak valid." };
  }

  if (data.fullName !== undefined && data.fullName.trim().length < 2) {
    return { isValid: false, error: "Nama lengkap minimal 2 karakter." };
  }

  if (data.password !== undefined && data.password.length < 6) {
    return { isValid: false, error: "Kata sandi minimal 6 karakter." };
  }

  if (
    data.confirmPassword !== undefined &&
    data.password !== data.confirmPassword
  ) {
    return { isValid: false, error: "Konfirmasi kata sandi tidak cocok." };
  }

  return { isValid: true };
}
