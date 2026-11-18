import { NextResponse } from "next/server";

/**
 * Health check endpoint for uptime monitoring, synthetic health probes,
 * and production load balancer readiness verification.
 */
export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const isHealthy = hasSupabaseUrl && hasSupabaseKey;

  const payload = {
    status: isHealthy ? "healthy" : "degraded",
    service: "patemon-wedding-planner",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      application: "ok",
      databaseConfigured: isHealthy,
      manualPaymentConfigured: true,
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
