-- ==============================================================================
-- Patemon — Bali Hindu Wedding Planner
-- Migration: 20261114000002_auth_and_rls.sql
-- Description: Authentication profile synchronization trigger, role hierarchy
--              functions, and strict Row Level Security (RLS) policies for
--              workspace tenant isolation.
-- ==============================================================================

-- ==============================================================================
-- 1. AUTHENTICATION TRIGGER: SYNC auth.users -> public.profiles
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if already exists and create fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. WORKSPACE ROLE RESOLUTION & PERMISSION FUNCTIONS
-- ==============================================================================

-- Resolve the role of current user (auth.uid()) in a given wedding workspace
CREATE OR REPLACE FUNCTION public.get_wedding_role(p_wedding_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Check direct active membership
  SELECT role INTO v_role
  FROM public.wedding_members
  WHERE wedding_id = p_wedding_id
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;

  -- 2. Fallback: check if the user is the original wedding creator
  IF v_role IS NULL THEN
    SELECT 'owner' INTO v_role
    FROM public.weddings
    WHERE id = p_wedding_id
      AND created_by = auth.uid()
      AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Verify if current user meets or exceeds the required role
-- Role hierarchy: 'owner' > 'editor' > 'viewer'
CREATE OR REPLACE FUNCTION public.has_wedding_role(p_wedding_id UUID, p_required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := public.get_wedding_role(p_wedding_id);

  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF p_required_role = 'viewer' THEN
    RETURN v_role IN ('owner', 'editor', 'viewer');
  ELSIF p_required_role = 'editor' THEN
    RETURN v_role IN ('owner', 'editor');
  ELSIF p_required_role = 'owner' THEN
    RETURN v_role = 'owner';
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Returns set of wedding IDs accessible to the current user
CREATE OR REPLACE FUNCTION public.get_user_wedding_ids()
RETURNS TABLE(wedding_id UUID) AS $$
BEGIN
  RETURN QUERY
    SELECT wm.wedding_id
    FROM public.wedding_members wm
    WHERE wm.user_id = auth.uid()
      AND wm.status = 'active'
    UNION
    SELECT w.id
    FROM public.weddings w
    WHERE w.created_by = auth.uid()
      AND w.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceremony_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_ceremonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_ritual_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rundown_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. POLICIES: PROFILES & WORKSPACES
-- ==============================================================================

-- Profiles: Authenticated users can view profiles; users can update only their own profile
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Weddings: Access governed by workspace membership
CREATE POLICY "weddings_select_member"
  ON public.weddings FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(id, 'viewer'));

CREATE POLICY "weddings_insert_authenticated"
  ON public.weddings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "weddings_update_owner"
  ON public.weddings FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(id, 'owner'))
  WITH CHECK (public.has_wedding_role(id, 'owner'));

CREATE POLICY "weddings_delete_owner"
  ON public.weddings FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(id, 'owner'));

-- Wedding Members: Owners manage members; members can view team; invitees see pending invites
CREATE POLICY "wedding_members_select"
  ON public.wedding_members FOR SELECT
  TO authenticated
  USING (
    public.has_wedding_role(wedding_id, 'viewer')
    OR user_id = auth.uid()
    OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "wedding_members_insert"
  ON public.wedding_members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_wedding_role(wedding_id, 'owner')
    OR (
      -- Automatically allow creator to register initial owner membership
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.weddings
        WHERE id = wedding_id AND created_by = auth.uid()
      )
    )
  );

CREATE POLICY "wedding_members_update"
  ON public.wedding_members FOR UPDATE
  TO authenticated
  USING (
    public.has_wedding_role(wedding_id, 'owner')
    OR (user_id = auth.uid())
  )
  WITH CHECK (
    public.has_wedding_role(wedding_id, 'owner')
    OR (user_id = auth.uid())
  );

CREATE POLICY "wedding_members_delete"
  ON public.wedding_members FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'owner'));

-- ==============================================================================
-- 5. POLICIES: GLOBAL MASTER CATALOGS (READ-ONLY FOR USERS)
-- ==============================================================================

CREATE POLICY "sources_select_all"
  ON public.sources FOR SELECT
  TO authenticated, anon
  USING (TRUE);

CREATE POLICY "ceremony_templates_select_all"
  ON public.ceremony_templates FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "ritual_catalog_select_all"
  ON public.ritual_catalog FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "task_templates_select_all"
  ON public.task_templates FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

CREATE POLICY "budget_item_templates_select_all"
  ON public.budget_item_templates FOR SELECT
  TO authenticated, anon
  USING (is_active = TRUE);

-- ==============================================================================
-- 6. POLICIES: WEDDING-SCOPED OPERATIONAL TABLES
-- Viewers can read; Editors & Owners can read/insert/update/delete
-- ==============================================================================

-- 6.1 Wedding Ceremonies
CREATE POLICY "ceremonies_select"
  ON public.wedding_ceremonies FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "ceremonies_insert"
  ON public.wedding_ceremonies FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "ceremonies_update"
  ON public.wedding_ceremonies FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "ceremonies_delete"
  ON public.wedding_ceremonies FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

-- 6.2 Wedding Ritual Items (Banten & Sarana)
CREATE POLICY "ritual_items_select"
  ON public.wedding_ritual_items FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "ritual_items_insert"
  ON public.wedding_ritual_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "ritual_items_update"
  ON public.wedding_ritual_items FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "ritual_items_delete"
  ON public.wedding_ritual_items FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

-- 6.3 Tasks & Checklist
CREATE POLICY "tasks_select"
  ON public.wedding_tasks FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "tasks_insert"
  ON public.wedding_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "tasks_update"
  ON public.wedding_tasks FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "tasks_delete"
  ON public.wedding_tasks FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

-- 6.4 Vendors
CREATE POLICY "vendors_select"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "vendors_insert"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "vendors_update"
  ON public.vendors FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "vendors_delete"
  ON public.vendors FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

-- 6.5 Budget Items & Payments
CREATE POLICY "budget_items_select"
  ON public.budget_items FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "budget_items_insert"
  ON public.budget_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "budget_items_update"
  ON public.budget_items FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "budget_items_delete"
  ON public.budget_items FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "budget_payments_select"
  ON public.budget_payments FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "budget_payments_insert"
  ON public.budget_payments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "budget_payments_update"
  ON public.budget_payments FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "budget_payments_delete"
  ON public.budget_payments FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

-- 6.6 Guests
CREATE POLICY "guests_select"
  ON public.guests FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "guests_insert"
  ON public.guests FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "guests_update"
  ON public.guests FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "guests_delete"
  ON public.guests FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

-- 6.7 Rundown Segments
CREATE POLICY "rundown_select"
  ON public.rundown_events FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "rundown_insert"
  ON public.rundown_events FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "rundown_update"
  ON public.rundown_events FOR UPDATE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'))
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor'));

CREATE POLICY "rundown_delete"
  ON public.rundown_events FOR DELETE
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'editor'));

-- ==============================================================================
-- 7. POLICIES: MONETIZATION, ENTITLEMENTS & AUDIT LOGS
-- ==============================================================================

-- Checkout Orders: Members can view orders for their wedding; editors can create orders
CREATE POLICY "orders_select"
  ON public.checkout_orders FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer') OR user_id = auth.uid());

CREATE POLICY "orders_insert"
  ON public.checkout_orders FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'editor') AND user_id = auth.uid());

-- Payment Events: Webhook event records are strictly server-only (no public/authenticated policies)

-- Access Grants: Wedding members can view active entitlements
CREATE POLICY "access_grants_select"
  ON public.access_grants FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

-- Activity Logs: Members can view logs; authenticated members can insert log entries
CREATE POLICY "activity_logs_select"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.has_wedding_role(wedding_id, 'viewer'));

CREATE POLICY "activity_logs_insert"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_wedding_role(wedding_id, 'viewer') AND (user_id IS NULL OR user_id = auth.uid()));

