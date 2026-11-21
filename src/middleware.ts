import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Validates and sanitizes internal redirect target paths to prevent open-redirect vulnerabilities.
 * Strictly permits only relative paths starting with single slash '/'. Rejects absolute URLs,
 * protocol handlers, double slashes, and control characters.
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/workspaces"
): string {
  if (!path) return fallback;
  const trimmed = path.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\")
  ) {
    return fallback;
  }
  if (
    trimmed.includes("://") ||
    trimmed.includes(":") ||
    trimmed.includes("\n") ||
    trimmed.includes("\r")
  ) {
    return fallback;
  }
  return trimmed;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const path = request.nextUrl.pathname;
  if (path === "/workspace/demo" || path.startsWith("/workspace/demo/")) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected paths requiring active authentication
  const isProtectedPath =
    path.startsWith("/workspace") ||
    path.startsWith("/profile") ||
    path.startsWith("/settings") ||
    path.startsWith("/admin");

  // Auth pages (login, register, reset-password)
  const isAuthPage =
    path === "/login" || path === "/register" || path === "/reset-password";

  // 1. If unauthenticated user tries to access protected page, redirect to login
  if (isProtectedPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Extra guard for /admin: if user is authenticated and PLATFORM_ADMIN_EMAILS is configured, reject non-admins
  if (path.startsWith("/admin") && user) {
    const rawConfig = process.env.PLATFORM_ADMIN_EMAILS || "";
    const allowedEmails = rawConfig
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const userEmail = (user.email || "").trim().toLowerCase();

    if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.searchParams.set("error", "unauthorized_admin");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. If logged-in user visits auth pages, redirect to workspace (sanitized against open-redirect)
  if (isAuthPage && user) {
    const rawRedirectTo = request.nextUrl.searchParams.get("redirectTo");
    const safeRedirectTo = sanitizeRedirectPath(rawRedirectTo, "/workspaces");
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = safeRedirectTo;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
