-- Migration: 20261115000004_deadline_email_reminders.sql
-- Description: Schema and RLS for deadline email reminders, preferences, and dispatch logs (Issue #84)

-- 1. Table: wedding_reminder_preferences
CREATE TABLE IF NOT EXISTS public.wedding_reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  task_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  payment_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_tiers JSONB NOT NULL DEFAULT '["H-7", "H-1"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_wedding_reminder_preferences_wedding_user UNIQUE (wedding_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reminder_pref_wedding ON public.wedding_reminder_preferences(wedding_id);

-- 2. Table: wedding_reminder_logs
CREATE TABLE IF NOT EXISTS public.wedding_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'budget_payment')),
  item_id UUID NOT NULL,
  item_title TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_name TEXT,
  reminder_tier TEXT NOT NULL CHECK (reminder_tier IN ('H-7', 'H-3', 'H-1', 'H-0')),
  target_due_date DATE NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  retry_count INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_wedding ON public.wedding_reminder_logs(wedding_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_idempotency ON public.wedding_reminder_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_due_date ON public.wedding_reminder_logs(target_due_date);

-- 3. Row Level Security (RLS)
ALTER TABLE public.wedding_reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Preferences Policies: Active members can view preferences
CREATE POLICY "Active members can view workspace reminder preferences"
  ON public.wedding_reminder_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_members wm
      WHERE wm.wedding_id = wedding_reminder_preferences.wedding_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );

-- Preferences Policies: Owners and editors can update preferences
CREATE POLICY "Owners and editors can manage reminder preferences"
  ON public.wedding_reminder_preferences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_members wm
      WHERE wm.wedding_id = wedding_reminder_preferences.wedding_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'editor')
    )
  );

-- Log Policies: Active members can view reminder logs
CREATE POLICY "Active members can view workspace reminder logs"
  ON public.wedding_reminder_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wedding_members wm
      WHERE wm.wedding_id = wedding_reminder_logs.wedding_id
        AND wm.user_id = auth.uid()
        AND wm.status = 'active'
    )
  );
