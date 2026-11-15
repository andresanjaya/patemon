-- ==============================================================================
-- Patemon MVP 2 — All-In-One Database Migration & Fixes
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- Project: https://egvddkmycfbzmlafdwoc.supabase.co
-- ==============================================================================

-- 1. Fix workspace creation: allow creator to have nullable invited_email
ALTER TABLE IF EXISTS public.wedding_members
  ALTER COLUMN invited_email DROP NOT NULL;

-- 2. Update trigger to populate owner membership cleanly with email fallback
CREATE OR REPLACE FUNCTION public.handle_new_wedding()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    SELECT email INTO v_email FROM public.profiles WHERE id = NEW.created_by;

    INSERT INTO public.wedding_members (
      wedding_id,
      user_id,
      role,
      invited_email,
      status,
      joined_at
    )
    VALUES (
      NEW.id,
      NEW.created_by,
      'owner',
      COALESCE(v_email, ''),
      'active',
      NOW()
    )
    ON CONFLICT (wedding_id, user_id) DO UPDATE
    SET
      role = 'owner',
      status = 'active',
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_wedding_created ON public.weddings;
CREATE TRIGGER on_wedding_created
  AFTER INSERT ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wedding();

-- 3. Add admin operational columns to weddings table
ALTER TABLE IF EXISTS public.weddings
  ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_reason TEXT,
  ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS frozen_by TEXT;

-- 4. Add grant type & operational tracking to access_grants
ALTER TABLE IF EXISTS public.access_grants
  ADD COLUMN IF NOT EXISTS grant_type TEXT DEFAULT 'payment' CHECK (grant_type IN ('payment', 'manual_override', 'promotional')),
  ADD COLUMN IF NOT EXISTS granted_by TEXT,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS reference_proof TEXT;

-- 5. Platform administrators table (Service-role only RLS)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'support_operator' CHECK (role IN ('superadmin', 'support_operator')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_admins_service_role_only" ON public.platform_admins;
CREATE POLICY "platform_admins_service_role_only"
  ON public.platform_admins
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- 6. Platform admin audit logs table
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

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_logs_service_role_only" ON public.admin_audit_logs;
CREATE POLICY "admin_audit_logs_service_role_only"
  ON public.admin_audit_logs
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target
  ON public.admin_audit_logs(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created
  ON public.admin_audit_logs(created_at DESC);

-- 7. Atomic payment grant activation function (Issue #76)
CREATE OR REPLACE FUNCTION public.grant_wedding_access_atomic(
  p_order_id UUID,
  p_wedding_id UUID,
  p_valid_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_existing_grant UUID;
  v_grant_id UUID;
BEGIN
  -- 1. Idempotency check: see if active grant already exists for this wedding
  SELECT id INTO v_existing_grant
  FROM public.access_grants
  WHERE wedding_id = p_wedding_id
    AND status = 'active'
    AND (valid_until IS NULL OR valid_until > NOW())
  LIMIT 1;

  IF v_existing_grant IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_duplicate', true,
      'grant_id', v_existing_grant
    );
  END IF;

  -- 2. Insert new access grant
  INSERT INTO public.access_grants (
    wedding_id,
    order_id,
    status,
    grant_type,
    granted_at,
    valid_until
  )
  VALUES (
    p_wedding_id,
    p_order_id,
    'active',
    'payment',
    NOW(),
    p_valid_until
  )
  RETURNING id INTO v_grant_id;

  RETURN jsonb_build_object(
    'success', true,
    'is_duplicate', false,
    'grant_id', v_grant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 10. Guest RSVP Tokens, Revocation & Catering Headcounts (Issue #87)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS rsvp_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  ADD COLUMN IF NOT EXISTS rsvp_token_revoked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rsvp_attending_count INT DEFAULT NULL CHECK (rsvp_attending_count IS NULL OR rsvp_attending_count >= 0),
  ADD COLUMN IF NOT EXISTS rsvp_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rsvp_submitted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rsvp_deadline DATE DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_rsvp_token
  ON public.guests(rsvp_token)
  WHERE deleted_at IS NULL AND rsvp_token IS NOT NULL;

UPDATE public.guests
SET rsvp_token = encode(gen_random_bytes(24), 'hex')
WHERE rsvp_token IS NULL;

-- ==============================================================================
-- 11. Rundown Day-of Execution & Real-Time Tracking (Issue #88)
-- ==============================================================================
ALTER TABLE public.rundown_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'skipped')),
  ADD COLUMN IF NOT EXISTS actual_start_time TIME WITHOUT TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS actual_end_time TIME WITHOUT TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS actual_start_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS actual_end_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pic_phone TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delay_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes_day_of TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_rundown_events_status
  ON public.rundown_events(wedding_id, status);

-- ==============================================================================
-- 12. Activity Logs & Change History Auditing (Issue #90)
-- ==============================================================================
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'admin', 'system')),
  ADD COLUMN IF NOT EXISTS actor_name TEXT,
  ADD COLUMN IF NOT EXISTS entity_title TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT;

CREATE INDEX IF NOT EXISTS idx_activity_logs_wedding_filtering
  ON public.activity_logs(wedding_id, entity_type, actor_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_wedding_pagination
  ON public.activity_logs(wedding_id, created_at DESC);

-- ==============================================================================
-- 13. Ritual Items / Banten Local Review Status (Issue #91)
-- ==============================================================================
ALTER TABLE public.wedding_ritual_items
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'needs_review'
    CHECK (review_status IN ('draft', 'needs_review', 'needs_revision', 'approved')),
  ADD COLUMN IF NOT EXISTS reviewer_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewer_type TEXT DEFAULT NULL
    CHECK (reviewer_type IS NULL OR reviewer_type IN ('internal_member', 'external_practitioner')),
  ADD COLUMN IF NOT EXISTS recorded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS review_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_reference TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_wedding_ritual_items_review_status
  ON public.wedding_ritual_items(wedding_id, review_status);




