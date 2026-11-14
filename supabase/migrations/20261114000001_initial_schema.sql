-- ==============================================================================
-- Patemon — Bali Hindu Wedding Planner
-- Migration: 20261114000001_initial_schema.sql
-- Description: Core schema modeling wedding workspaces, master templates,
--              ceremonies, banten/sarana, tasks, budget, vendors, guests,
--              rundown, checkout orders, entitlements, and audit logs.
-- ==============================================================================

-- 1. EXTENSIONS & COMMON FUNCTIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. ACCOUNTS & USER PROFILES
-- ==============================================================================

-- Public profiles extending Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. WEDDING WORKSPACES & MEMBERSHIPS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  couple_names TEXT NOT NULL,
  groom_name TEXT,
  bride_name TEXT,
  -- Solar calendar date for ceremony day in Bali (Asia/Makassar)
  prospective_date DATE,
  location_region TEXT,
  marriage_form TEXT NOT NULL DEFAULT 'memadik' CHECK (marriage_form IN ('memadik', 'ngerorod', 'nyentana', 'custom')),
  -- All monetary values stored in integer IDR (BIGINT)
  target_budget BIGINT NOT NULL DEFAULT 0 CHECK (target_budget >= 0),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_weddings_updated_at
  BEFORE UPDATE ON public.weddings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.wedding_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'revoked')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_wedding_members_user UNIQUE (wedding_id, user_id),
  CONSTRAINT uq_wedding_members_email UNIQUE (wedding_id, invited_email)
);

CREATE TRIGGER set_wedding_members_updated_at
  BEFORE UPDATE ON public.wedding_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. MASTER CATALOGS & SOURCED REFERENCES (GLOBAL / CURATED)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sources (
  id TEXT PRIMARY KEY, -- e.g. 'R01', 'R02'
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  usage_notes TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_sources_updated_at
  BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.ceremony_templates (
  id TEXT PRIMARY KEY, -- e.g. 'PR-001'
  phase TEXT NOT NULL,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  applicability TEXT NOT NULL DEFAULT 'Umum',
  default_pic TEXT,
  validation_status TEXT NOT NULL DEFAULT 'Perlu validasi keluarga/pemangku',
  source_id TEXT REFERENCES public.sources(id) ON DELETE SET NULL,
  source_url TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_ceremony_templates_updated_at
  BEFORE UPDATE ON public.ceremony_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.ritual_catalog (
  id TEXT PRIMARY KEY, -- e.g. 'BN-001'
  item_type TEXT NOT NULL,
  name TEXT NOT NULL,
  used_in_phase TEXT,
  notes TEXT,
  obligation_level TEXT NOT NULL DEFAULT 'Kondisional; validasi sebelum dipakai',
  default_quantity NUMERIC(10, 2),
  unit TEXT NOT NULL DEFAULT 'set',
  default_provider TEXT,
  validation_status TEXT NOT NULL DEFAULT 'Belum diverifikasi serati/pemangku',
  source_id TEXT REFERENCES public.sources(id) ON DELETE SET NULL,
  source_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_ritual_catalog_updated_at
  BEFORE UPDATE ON public.ritual_catalog
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.task_templates (
  id TEXT PRIMARY KEY, -- e.g. 'CK-001'
  phase TEXT NOT NULL,
  target_timeline TEXT, -- e.g. 'H-365 s.d. H-180'
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  default_pic TEXT,
  applicability TEXT NOT NULL DEFAULT 'Umum',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  source_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.budget_item_templates (
  id TEXT PRIMARY KEY, -- e.g. 'BG-001'
  phase TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  unit TEXT,
  default_qty NUMERIC(10, 2),
  estimated_price BIGINT NOT NULL DEFAULT 0 CHECK (estimated_price >= 0),
  source_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_budget_item_templates_updated_at
  BEFORE UPDATE ON public.budget_item_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. WEDDING-SCOPED OPERATIONAL DATA
-- ==============================================================================

-- 5.1 Ceremonies
CREATE TABLE IF NOT EXISTS public.wedding_ceremonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES public.ceremony_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  phase TEXT,
  scheduled_date DATE,
  start_time TIME WITHOUT TIME ZONE,
  end_time TIME WITHOUT TIME ZONE,
  location TEXT,
  person_in_charge TEXT,
  order_index INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'skipped')),
  custom_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_wedding_ceremonies_updated_at
  BEFORE UPDATE ON public.wedding_ceremonies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.2 Banten & Sarana Ritual
CREATE TABLE IF NOT EXISTS public.wedding_ritual_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  ceremony_id UUID REFERENCES public.wedding_ceremonies(id) ON DELETE SET NULL,
  catalog_id TEXT REFERENCES public.ritual_catalog(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'set',
  sourcing_method TEXT NOT NULL DEFAULT 'purchased_package'
    CHECK (sourcing_method IN ('self_made', 'purchased_package', 'family_assigned', 'vendor_order')),
  status TEXT NOT NULL DEFAULT 'needed'
    CHECK (status IN ('needed', 'ordered', 'making', 'ready', 'not_needed')),
  assignee_name TEXT,
  estimated_price BIGINT NOT NULL DEFAULT 0 CHECK (estimated_price >= 0),
  actual_price BIGINT NOT NULL DEFAULT 0 CHECK (actual_price >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_wedding_ritual_items_updated_at
  BEFORE UPDATE ON public.wedding_ritual_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.3 Tasks & Checklist
CREATE TABLE IF NOT EXISTS public.wedding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  template_id TEXT REFERENCES public.task_templates(id) ON DELETE SET NULL,
  ceremony_id UUID REFERENCES public.wedding_ceremonies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'canceled')),
  due_date DATE,
  assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee_name TEXT,
  order_index INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_wedding_tasks_updated_at
  BEFORE UPDATE ON public.wedding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.4 Vendors
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  social_link TEXT,
  quote_amount BIGINT NOT NULL DEFAULT 0 CHECK (quote_amount >= 0),
  status TEXT NOT NULL DEFAULT 'prospect'
    CHECK (status IN ('prospect', 'contacted', 'quoted', 'booked', 'completed', 'canceled')),
  pic_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.5 Budget Items & Payments
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  unit TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price BIGINT NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  planned_amount BIGINT NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  actual_amount BIGINT NOT NULL DEFAULT 0 CHECK (actual_amount >= 0),
  paid_by TEXT,
  status TEXT NOT NULL DEFAULT 'estimated'
    CHECK (status IN ('estimated', 'booked', 'paid_partial', 'paid_full', 'canceled')),
  linked_ritual_item_id UUID REFERENCES public.wedding_ritual_items(id) ON DELETE SET NULL,
  linked_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_budget_items_updated_at
  BEFORE UPDATE ON public.budget_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.budget_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  budget_item_id UUID NOT NULL REFERENCES public.budget_items(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  payment_method TEXT,
  recipient TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_budget_payments_updated_at
  BEFORE UPDATE ON public.budget_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.6 Guests
CREATE TABLE IF NOT EXISTS public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  side TEXT NOT NULL DEFAULT 'both' CHECK (side IN ('groom', 'bride', 'both', 'mutual')),
  group_household TEXT,
  headcount INT NOT NULL DEFAULT 1 CHECK (headcount > 0),
  invitation_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (invitation_status IN ('draft', 'sent', 'confirmed', 'declined')),
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TRIGGER set_guests_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.7 Rundown Segments
CREATE TABLE IF NOT EXISTS public.rundown_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  ceremony_id UUID REFERENCES public.wedding_ceremonies(id) ON DELETE SET NULL,
  segment_title TEXT NOT NULL,
  scheduled_date DATE,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  location TEXT,
  person_in_charge TEXT,
  order_index INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_rundown_events_updated_at
  BEFORE UPDATE ON public.rundown_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. MONETIZATION, ENTITLEMENTS & AUDIT LOGS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.checkout_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  order_number TEXT UNIQUE NOT NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'settlement', 'expire', 'cancel', 'deny')),
  snap_token TEXT,
  snap_redirect_url TEXT,
  payment_type TEXT,
  transaction_time TIMESTAMPTZ,
  settlement_time TIMESTAMPTZ,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_checkout_orders_updated_at
  BEFORE UPDATE ON public.checkout_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.checkout_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider_status TEXT,
  signature_key TEXT,
  payload JSONB NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.checkout_orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. PERFORMANCE & ISOLATION INDEXES
-- ==============================================================================

-- Wedding Isolation Indexes (Essential for multi-tenant performance and RLS queries)
CREATE INDEX IF NOT EXISTS idx_weddings_slug ON public.weddings(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_weddings_created_by ON public.weddings(created_by) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wedding_members_wedding_id ON public.wedding_members(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_members_user_id ON public.wedding_members(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_members_email ON public.wedding_members(invited_email);

CREATE INDEX IF NOT EXISTS idx_ceremony_templates_phase ON public.ceremony_templates(phase);
CREATE INDEX IF NOT EXISTS idx_ritual_catalog_item_type ON public.ritual_catalog(item_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_phase ON public.task_templates(phase);

CREATE INDEX IF NOT EXISTS idx_wedding_ceremonies_wedding_id ON public.wedding_ceremonies(wedding_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wedding_ceremonies_date ON public.wedding_ceremonies(wedding_id, scheduled_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wedding_ritual_items_wedding_id ON public.wedding_ritual_items(wedding_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wedding_ritual_items_ceremony_id ON public.wedding_ritual_items(ceremony_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wedding_ritual_items_status ON public.wedding_ritual_items(wedding_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wedding_tasks_wedding_id ON public.wedding_tasks(wedding_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_status ON public.wedding_tasks(wedding_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wedding_tasks_due_date ON public.wedding_tasks(wedding_id, due_date) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_wedding_id ON public.vendors(wedding_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_budget_items_wedding_id ON public.budget_items(wedding_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(wedding_id, category) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budget_payments_wedding_id ON public.budget_payments(wedding_id);
CREATE INDEX IF NOT EXISTS idx_budget_payments_item_id ON public.budget_payments(budget_item_id);

CREATE INDEX IF NOT EXISTS idx_guests_wedding_id ON public.guests(wedding_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rundown_events_wedding_id ON public.rundown_events(wedding_id);
CREATE INDEX IF NOT EXISTS idx_rundown_events_schedule ON public.rundown_events(wedding_id, scheduled_date, start_time);

CREATE INDEX IF NOT EXISTS idx_checkout_orders_wedding_id ON public.checkout_orders(wedding_id);
CREATE INDEX IF NOT EXISTS idx_checkout_orders_number ON public.checkout_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_access_grants_wedding_id ON public.access_grants(wedding_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_wedding_id ON public.activity_logs(wedding_id, created_at DESC);

