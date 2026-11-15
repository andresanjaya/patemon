-- Migration: Ritual Items / Banten Local Review Status (Issue #91)
-- Adds family & local practitioner review workflow columns to wedding_ritual_items

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

-- Index for filtering by review status per wedding
CREATE INDEX IF NOT EXISTS idx_wedding_ritual_items_review_status
  ON public.wedding_ritual_items(wedding_id, review_status);
