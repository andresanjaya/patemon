-- ==============================================================================
-- Patemon Database Migration: Platform Admin Operations & Access Overrides
-- Corresponds to Issue #81: Operational Admin Panel, Audited Manual Overrides,
-- and Account / Wedding Freezing Guardrails.
-- ==============================================================================

-- 1. Extend weddings table with operational freeze / suspension controls
ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_reason TEXT,
  ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS frozen_by TEXT;

-- 2. Extend access_grants with manual override tracking
ALTER TABLE public.access_grants
  ADD COLUMN IF NOT EXISTS grant_type TEXT NOT NULL DEFAULT 'payment'
    CHECK (grant_type IN ('payment', 'manual_override', 'promotional')),
  ADD COLUMN IF NOT EXISTS granted_by TEXT,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS reference_proof TEXT;

-- 3. Create platform_admins table for server-enforced operational identities
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'support_operator')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Secure platform_admins table with Row Level Security (Service-role only)
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
-- No public or authenticated user policies: only service role / admin client can read or write

-- 4. Create admin_audit_logs table for immutable auditability
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  reference_note TEXT,
  before_state JSONB,
  after_state JSONB,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Secure admin_audit_logs table with Row Level Security (Service-role only)
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
-- No public or authenticated user policies: only service role / admin client can read or write

-- 5. Indexes for fast operational audit inspection
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target
  ON public.admin_audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON public.admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weddings_is_frozen
  ON public.weddings(is_frozen) WHERE is_frozen = true;
