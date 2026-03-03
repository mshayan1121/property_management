-- Fix RLS DELETE policies (Phase 7 follow-up)
-- Ensures leads can be deleted by admin/manager (any in company) and agents (own only).
-- Ensures all listed tables allow admin and manager to DELETE any row in their company.

-- ============== LEADS ==============
DROP POLICY IF EXISTS "Leads delete admin manager" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own company leads" ON public.leads;

CREATE POLICY "Admin manager can delete leads"
ON public.leads FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = leads.company_id
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Agent can delete own leads"
ON public.leads FOR DELETE
TO authenticated
USING (assigned_to = auth.uid());

-- ============== DEALS ==============
DROP POLICY IF EXISTS "Deals delete admin manager" ON public.deals;
DROP POLICY IF EXISTS "Users can delete own company deals" ON public.deals;

CREATE POLICY "Admin manager can delete deals"
ON public.deals FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = deals.company_id
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Agent can delete own deals"
ON public.deals FOR DELETE
TO authenticated
USING (assigned_to = auth.uid());

-- ============== CONTACTS ==============
-- Ensure admin/manager can delete (keep existing policy; add explicit role-based)
DROP POLICY IF EXISTS "Admin manager can delete contacts" ON public.contacts;
CREATE POLICY "Admin manager can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = contacts.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== CONTRACTS ==============
DROP POLICY IF EXISTS "Admin manager can delete contracts" ON public.contracts;
CREATE POLICY "Admin manager can delete contracts"
ON public.contracts FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = contracts.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== PROPERTIES ==============
DROP POLICY IF EXISTS "Admin manager can delete properties" ON public.properties;
CREATE POLICY "Admin manager can delete properties"
ON public.properties FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = properties.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== UNITS ==============
DROP POLICY IF EXISTS "Admin manager can delete units" ON public.units;
CREATE POLICY "Admin manager can delete units"
ON public.units FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = units.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== TENANTS ==============
DROP POLICY IF EXISTS "Admin manager can delete tenants" ON public.tenants;
CREATE POLICY "Admin manager can delete tenants"
ON public.tenants FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = tenants.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== INVOICES ==============
DROP POLICY IF EXISTS "Admin manager can delete invoices" ON public.invoices;
CREATE POLICY "Admin manager can delete invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = invoices.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== BILLS ==============
DROP POLICY IF EXISTS "Admin manager can delete bills" ON public.bills;
CREATE POLICY "Admin manager can delete bills"
ON public.bills FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = bills.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== PAYMENTS ==============
DROP POLICY IF EXISTS "Admin manager can delete payments" ON public.payments;
CREATE POLICY "Admin manager can delete payments"
ON public.payments FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = payments.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== PDCs ==============
DROP POLICY IF EXISTS "Admin manager can delete pdcs" ON public.pdcs;
CREATE POLICY "Admin manager can delete pdcs"
ON public.pdcs FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = pdcs.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== VENDORS ==============
DROP POLICY IF EXISTS "Admin manager can delete vendors" ON public.vendors;
CREATE POLICY "Admin manager can delete vendors"
ON public.vendors FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = vendors.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== PROJECTS ==============
-- Replace generic delete with explicit admin/manager (table already has projects_delete)
DROP POLICY IF EXISTS "Admin manager can delete projects" ON public.projects;
CREATE POLICY "Admin manager can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = projects.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== TASKS ==============
DROP POLICY IF EXISTS "Admin manager can delete tasks" ON public.tasks;
CREATE POLICY "Admin manager can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = tasks.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== MAINTENANCE_REQUESTS ==============
DROP POLICY IF EXISTS "Admin manager can delete maintenance_requests" ON public.maintenance_requests;
CREATE POLICY "Admin manager can delete maintenance_requests"
ON public.maintenance_requests FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = maintenance_requests.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== WORK_ORDERS ==============
DROP POLICY IF EXISTS "Admin manager can delete work_orders" ON public.work_orders;
CREATE POLICY "Admin manager can delete work_orders"
ON public.work_orders FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = work_orders.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== INVENTORY_ITEMS ==============
DROP POLICY IF EXISTS "Admin manager can delete inventory_items" ON public.inventory_items;
CREATE POLICY "Admin manager can delete inventory_items"
ON public.inventory_items FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = inventory_items.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== AMENITY_BOOKINGS ==============
DROP POLICY IF EXISTS "Admin manager can delete amenity_bookings" ON public.amenity_bookings;
CREATE POLICY "Admin manager can delete amenity_bookings"
ON public.amenity_bookings FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = amenity_bookings.company_id
    AND role IN ('admin', 'manager')
  )
);

-- ============== ANNOUNCEMENTS ==============
DROP POLICY IF EXISTS "Admin manager can delete announcements" ON public.announcements;
CREATE POLICY "Admin manager can delete announcements"
ON public.announcements FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles
    WHERE company_id = announcements.company_id
    AND role IN ('admin', 'manager')
  )
);
