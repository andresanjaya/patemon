-- ==============================================================================
-- Patemon Database Migration: Guest RSVP Tokens, Revocation & Catering Headcounts
-- Corresponds to Issue #87: Public RSVP by High-Entropy Personal Guest Token
-- ==============================================================================

-- 1. Ensure pgcrypto is available for cryptographic token generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Extend guests table with RSVP tracking columns
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS rsvp_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  ADD COLUMN IF NOT EXISTS rsvp_token_revoked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rsvp_attending_count INT DEFAULT NULL CHECK (rsvp_attending_count IS NULL OR rsvp_attending_count >= 0),
  ADD COLUMN IF NOT EXISTS rsvp_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rsvp_submitted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rsvp_deadline DATE DEFAULT NULL;

-- 3. Unique index on rsvp_token for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_rsvp_token
  ON public.guests(rsvp_token)
  WHERE deleted_at IS NULL AND rsvp_token IS NOT NULL;

-- 4. Backfill existing guests without token
UPDATE public.guests
SET rsvp_token = encode(gen_random_bytes(24), 'hex')
WHERE rsvp_token IS NULL;
