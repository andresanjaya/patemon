-- ==============================================================================
-- Patemon — Bali Hindu Wedding Planner
-- Migration: 20261115000002_atomic_webhook_and_grant_idempotency.sql
-- Description: Enforces database-level idempotency and concurrency guards on
--              access grants (Issue #76).
--              1. Unique index on order_id prevents multiple grants per order.
--              2. Unique partial index on active status prevents concurrent duplicate
--                 active grants per wedding workspace.
-- ==============================================================================

-- 1. Ensure each checkout order can produce at most one access grant
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_grants_order_id
  ON public.access_grants (order_id)
  WHERE order_id IS NOT NULL;

-- 2. Concurrency guard: Ensure at most one ACTIVE access grant exists per wedding
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_grants_active_wedding
  ON public.access_grants (wedding_id)
  WHERE status = 'active';
