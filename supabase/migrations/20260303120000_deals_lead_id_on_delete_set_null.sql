-- Allow deleting leads when deals reference them: set deal.lead_id to NULL
ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_lead_id_fkey,
  ADD CONSTRAINT deals_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
