-- Phase 6: Roles & Access Control
-- Run in Supabase SQL Editor. If leads/deals already have RLS policies with different names,
-- run: SELECT policyname FROM pg_policies WHERE tablename IN ('leads','deals');
-- then DROP POLICY "name" ON public.leads; etc. before creating the new ones below.

-- Add status column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Helper: current user's role (for RLS)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Profiles: allow read own OR admin read same company
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile or admin read company"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Profiles: update own; admin can update any in same company
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update profiles in company"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first BOOLEAN;
  meta_role TEXT;
  meta_company_id UUID;
  meta_full_name TEXT;
BEGIN
  meta_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  meta_role := NEW.raw_user_meta_data->>'role';
  meta_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first;

  INSERT INTO public.profiles (id, full_name, avatar_url, role, company_id, status)
  VALUES (
    NEW.id,
    meta_full_name,
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN is_first THEN 'admin'
      WHEN meta_role IN ('admin','manager','agent','viewer') THEN meta_role
      ELSE 'agent'
    END,
    meta_company_id,
    'active'
  );
  RETURN NEW;
END;
$$;

-- Agent RLS: leads – only own (assigned_to = auth.uid())
-- Drop existing broad policies on leads if they exist (adjust names to match your project)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Company leads select') THEN
    DROP POLICY "Company leads select" ON public.leads;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Company leads insert') THEN
    DROP POLICY "Company leads insert" ON public.leads;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Company leads update') THEN
    DROP POLICY "Company leads update" ON public.leads;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Company leads delete') THEN
    DROP POLICY "Company leads delete" ON public.leads;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create role-based policies for leads (assumes RLS already enabled)
CREATE POLICY "Leads select by role"
  ON public.leads FOR SELECT TO authenticated
  USING (
    (public.current_user_role() IN ('admin','manager','viewer') AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    OR (public.current_user_role() = 'agent' AND assigned_to = auth.uid())
  );

CREATE POLICY "Leads insert admin manager agent"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('admin','manager','agent')
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Leads update by role"
  ON public.leads FOR UPDATE TO authenticated
  USING (
    (public.current_user_role() IN ('admin','manager') AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    OR (public.current_user_role() = 'agent' AND assigned_to = auth.uid())
  )
  WITH CHECK (true);

CREATE POLICY "Leads delete admin manager"
  ON public.leads FOR DELETE TO authenticated
  USING (
    public.current_user_role() IN ('admin','manager')
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Deals: same pattern
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Company deals select') THEN
    DROP POLICY "Company deals select" ON public.deals;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Company deals insert') THEN
    DROP POLICY "Company deals insert" ON public.deals;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Company deals update') THEN
    DROP POLICY "Company deals update" ON public.deals;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Company deals delete') THEN
    DROP POLICY "Company deals delete" ON public.deals;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Deals select by role"
  ON public.deals FOR SELECT TO authenticated
  USING (
    (public.current_user_role() IN ('admin','manager','viewer') AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    OR (public.current_user_role() = 'agent' AND assigned_to = auth.uid())
  );

CREATE POLICY "Deals insert admin manager agent"
  ON public.deals FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('admin','manager','agent')
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Deals update by role"
  ON public.deals FOR UPDATE TO authenticated
  USING (
    (public.current_user_role() IN ('admin','manager') AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
    OR (public.current_user_role() = 'agent' AND assigned_to = auth.uid())
  )
  WITH CHECK (true);

CREATE POLICY "Deals delete admin manager"
  ON public.deals FOR DELETE TO authenticated
  USING (
    public.current_user_role() IN ('admin','manager')
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Viewers: SELECT only on other tables (contacts, contracts, etc.)
-- If your existing policies are "authenticated can all", add viewer-restriction by ensuring
-- INSERT/UPDATE/DELETE policies require role != 'viewer'. Here we add viewer SELECT for contacts.
-- (Repeat for contracts, properties, units, tenants, vendors, invoices, etc. as needed.)
CREATE POLICY "Contacts select viewer"
  ON public.contacts FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'viewer'
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Contracts select viewer"
  ON public.contracts FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'viewer'
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Note: For contacts, contracts, and all other tables you likely have existing
-- "authenticated can SELECT/INSERT/UPDATE/DELETE where company_id = ..." policies.
-- Viewers must only have SELECT. So either:
-- 1) Change existing policies to "AND current_user_role() != 'viewer'" for INSERT/UPDATE/DELETE, or
-- 2) Add separate SELECT-only policies for viewer and restrict INSERT/UPDATE/DELETE by role.
-- The policies above add viewer SELECT. If your existing policies allow any authenticated
-- user to INSERT/UPDATE/DELETE, you need to drop or alter those to exclude viewers.
