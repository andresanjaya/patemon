-- ==============================================================================
-- Patemon — Bali Hindu Wedding Planner
-- Migration: 20261115000001_fix_workspace_creation_rls.sql
-- Description: Fixes RLS violation on wedding workspace creation (Issue #74).
--              1. Adds created_by = auth.uid() check to weddings_select_member
--                 policy to satisfy INSERT ... RETURNING evaluation.
--              2. Tightens weddings_insert_authenticated policy.
--              3. Adds atomic trigger to register creator as owner in wedding_members.
--              4. Backfills existing orphan workspaces safely.
-- ==============================================================================

-- 1. Ensure created_by defaults to auth.uid() if omitted
ALTER TABLE public.weddings
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 2. Fix weddings SELECT policy for INSERT ... RETURNING and creator visibility
DROP POLICY IF EXISTS "weddings_select_member" ON public.weddings;
CREATE POLICY "weddings_select_member"
  ON public.weddings FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_wedding_role(id, 'viewer')
  );

-- 3. Tighten weddings INSERT policy to strictly allow authenticated creator
DROP POLICY IF EXISTS "weddings_insert_authenticated" ON public.weddings;
CREATE POLICY "weddings_insert_authenticated"
  ON public.weddings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- 4. Atomic trigger function: register creator as active owner member
CREATE OR REPLACE FUNCTION public.handle_new_wedding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.wedding_members (
      wedding_id,
      user_id,
      role,
      status,
      joined_at
    )
    VALUES (
      NEW.id,
      NEW.created_by,
      'owner',
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

-- Drop trigger if already exists and create fresh
DROP TRIGGER IF EXISTS on_wedding_created ON public.weddings;
CREATE TRIGGER on_wedding_created
  AFTER INSERT ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_wedding();

-- 5. Backfill existing orphan workspaces: ensure every wedding has active owner
INSERT INTO public.wedding_members (
  wedding_id,
  user_id,
  role,
  status,
  joined_at
)
SELECT
  w.id,
  w.created_by,
  'owner',
  'active',
  COALESCE(w.created_at, NOW())
FROM public.weddings w
WHERE w.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.wedding_members wm
    WHERE wm.wedding_id = w.id AND wm.user_id = w.created_by
  )
ON CONFLICT (wedding_id, user_id) DO NOTHING;
