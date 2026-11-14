"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFriendlyAuthErrorMessage, validateAuthInput } from "./errors";
import { captureError } from "@/lib/observability/logger";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Signs in user using Email and Password.
 */
export async function signInWithEmailAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirectTo =
    (formData.get("redirectTo") as string) || "/workspace/demo";

  const validation = validateAuthInput({ email, password });
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: getFriendlyAuthErrorMessage(error) };
    }
  } catch (err) {
    captureError(err, { action: "signInWithEmail", email });
    return { success: false, error: getFriendlyAuthErrorMessage(err) };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

/**
 * Registers new user using Email, Password, and Full Name.
 */
export async function signUpWithEmailAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validation = validateAuthInput({
    email,
    password,
    confirmPassword,
    fullName,
  });
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${origin}/auth/callback?next=/workspace/demo`,
      },
    });

    if (error) {
      return { success: false, error: getFriendlyAuthErrorMessage(error) };
    }

    // If confirmation is required, notify user
    if (data.session === null) {
      return {
        success: true,
        message:
          "Pendaftaran berhasil! Silakan periksa inbox email Anda untuk mengonfirmasi akun sebelum masuk.",
      };
    }
  } catch (err) {
    captureError(err, { action: "signUpWithEmail", email });
    return { success: false, error: getFriendlyAuthErrorMessage(err) };
  }

  revalidatePath("/", "layout");
  redirect("/workspace/demo");
}

/**
 * Initiates Google OAuth authentication URL.
 */
export async function getGoogleAuthUrl(
  nextUrl: string = "/workspace/demo"
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });

    if (error) {
      captureError(error, { action: "signInWithGoogle" });
      return null;
    }

    return data.url;
  } catch (err) {
    captureError(err, { action: "getGoogleAuthUrl" });
    return null;
  }
}

/**
 * Signs out current user session.
 */
export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    captureError(err, { action: "signOut" });
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Sends password reset email.
 */
export async function requestPasswordResetAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();

  const validation = validateAuthInput({ email });
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/update-password`,
    });

    if (error) {
      return { success: false, error: getFriendlyAuthErrorMessage(error) };
    }

    return {
      success: true,
      message:
        "Tautan untuk mengatur ulang kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau spam.",
    };
  } catch (err) {
    captureError(err, { action: "requestPasswordReset", email });
    return { success: false, error: getFriendlyAuthErrorMessage(err) };
  }
}

/**
 * Updates password after following reset link.
 */
export async function updatePasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    return { success: false, error: "Kata sandi minimal 6 karakter." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Konfirmasi kata sandi tidak cocok." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: getFriendlyAuthErrorMessage(error) };
    }

    return {
      success: true,
      message: "Kata sandi Anda berhasil diperbarui! Silakan masuk kembali.",
    };
  } catch (err) {
    captureError(err, { action: "updatePassword" });
    return { success: false, error: getFriendlyAuthErrorMessage(err) };
  }
}

/**
 * Updates user profile details in public.profiles.
 */
export async function updateProfileAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!fullName || fullName.length < 2) {
    return { success: false, error: "Nama lengkap minimal 2 karakter." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Sesi login tidak ditemukan." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
      })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/profile");
    return {
      success: true,
      message: "Profil Anda berhasil diperbarui.",
    };
  } catch (err) {
    captureError(err, { action: "updateProfile" });
    return { success: false, error: "Gagal memperbarui profil." };
  }
}
