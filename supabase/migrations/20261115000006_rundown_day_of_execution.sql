-- ==============================================================================
-- Patemon Database Migration: Rundown Day-of Execution & Real-Time Tracking
-- Corresponds to Issue #88: Day-of Mode, Active/Next Segment & Delay Tracking
-- ==============================================================================

-- 1. Extend rundown_events table with day-of execution tracking columns
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

-- 2. Index on status and wedding for fast querying of active segments
CREATE INDEX IF NOT EXISTS idx_rundown_events_status
  ON public.rundown_events(wedding_id, status);

-- 3. Trigger updated_at consistency
DROP TRIGGER IF EXISTS set_rundown_events_updated_at ON public.rundown_events;
CREATE TRIGGER set_rundown_events_updated_at
  BEFORE UPDATE ON public.rundown_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
