-- Migration: Enhanced Activity Logs & Concurrency Auditing (Issue #90)
-- Adds actor_type ('user', 'admin', 'system'), actor_name, entity_title, and summary columns.
-- Adds composite performance indexes for multi-tenant isolation, filtering, and pagination.

ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'admin', 'system')),
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS entity_title TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT;

-- Composite performance indexes for multi-tenant filtering & pagination
CREATE INDEX IF NOT EXISTS idx_activity_logs_wedding_filtering
  ON public.activity_logs(wedding_id, entity_type, actor_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_wedding_pagination
  ON public.activity_logs(wedding_id, created_at DESC);

-- Ensure Row Level Security remains strictly fail-closed
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
