'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Building2, User, Users, FileText, Receipt, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { createClient } from '@/lib/supabase/client'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2
const LIMIT_PER_CATEGORY = 3

type SearchResults = {
  properties: { id: string; name: string; location: string | null }[]
  tenants: { id: string; full_name: string; email: string | null; unit_id: string | null }[]
  contacts: { id: string; full_name: string; email: string | null; phone: string | null }[]
  deals: { id: string; reference: string | null }[]
  invoices: { id: string; reference: string | null }[]
  maintenance_requests: { id: string; title: string; reference: string | null }[]
}

const emptyResults: SearchResults = {
  properties: [],
  tenants: [],
  contacts: [],
  deals: [],
  invoices: [],
  maintenance_requests: [],
}

function escapeIlikePattern(q: string): string {
  return q
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '')
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResults>(emptyResults)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!open) return
    const loadCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCompanyId(null)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()
      setCompanyId(profile?.company_id ?? null)
    }
    loadCompany()
  }, [open, supabase])

  const runSearch = useCallback(
    async (q: string) => {
      if (!companyId || q.length < MIN_QUERY_LENGTH) {
        setResults(emptyResults)
        return
      }
      setLoading(true)
      const pattern = `%${escapeIlikePattern(q)}%`

      const [propertiesRes, tenantsRes, contactsRes, dealsRes, invoicesRes, maintenanceRes] =
        await Promise.all([
          supabase
            .from('properties')
            .select('id, name, location')
            .eq('company_id', companyId)
            .or(`name.ilike.${pattern},location.ilike.${pattern}`)
            .limit(LIMIT_PER_CATEGORY),
          supabase
            .from('tenants')
            .select('id, full_name, email, unit_id')
            .eq('company_id', companyId)
            .or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
            .limit(LIMIT_PER_CATEGORY),
          supabase
            .from('contacts')
            .select('id, full_name, email, phone')
            .eq('company_id', companyId)
            .or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
            .limit(LIMIT_PER_CATEGORY),
          supabase
            .from('deals')
            .select('id, reference')
            .eq('company_id', companyId)
            .ilike('reference', pattern)
            .limit(LIMIT_PER_CATEGORY),
          supabase
            .from('invoices')
            .select('id, reference')
            .eq('company_id', companyId)
            .ilike('reference', pattern)
            .limit(LIMIT_PER_CATEGORY),
          supabase
            .from('maintenance_requests')
            .select('id, title, reference')
            .eq('company_id', companyId)
            .or(`title.ilike.${pattern},reference.ilike.${pattern}`)
            .limit(LIMIT_PER_CATEGORY),
        ])

      setResults({
        properties: (propertiesRes.data ?? []) as SearchResults['properties'],
        tenants: (tenantsRes.data ?? []) as SearchResults['tenants'],
        contacts: (contactsRes.data ?? []) as SearchResults['contacts'],
        deals: (dealsRes.data ?? []) as SearchResults['deals'],
        invoices: (invoicesRes.data ?? []) as SearchResults['invoices'],
        maintenance_requests: (maintenanceRes.data ?? []) as SearchResults['maintenance_requests'],
      })
      setLoading(false)
    },
    [companyId, supabase]
  )

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setResults(emptyResults)
      return
    }
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query, runSearch])

  const hasAnyResults =
    results.properties.length > 0 ||
    results.tenants.length > 0 ||
    results.contacts.length > 0 ||
    results.deals.length > 0 ||
    results.invoices.length > 0 ||
    results.maintenance_requests.length > 0

  const navigate = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm
        text-muted-foreground border rounded-md hover:bg-accent
        w-48 justify-between"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search...</span>
        </div>
        <kbd className="text-xs border rounded px-1">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search across properties, tenants, deals and more
          </DialogDescription>
        </VisuallyHidden>
        <CommandInput
          placeholder="Search properties, tenants, deals..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < MIN_QUERY_LENGTH && (
            <CommandGroup heading="Quick Links">
              <CommandItem onSelect={() => navigate('/properties/listings')}>
                <Building2 className="h-4 w-4" />
                Properties
              </CommandItem>
              <CommandItem onSelect={() => navigate('/properties/tenants')}>
                <User className="h-4 w-4" />
                Tenants
              </CommandItem>
              <CommandItem onSelect={() => navigate('/crm/deals')}>
                <FileText className="h-4 w-4" />
                Deals
              </CommandItem>
              <CommandItem onSelect={() => navigate('/accounts/invoices')}>
                <Receipt className="h-4 w-4" />
                Invoices
              </CommandItem>
            </CommandGroup>
          )}

          {query.length >= MIN_QUERY_LENGTH && loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {query.length >= MIN_QUERY_LENGTH && !loading && !hasAnyResults && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {query.length >= MIN_QUERY_LENGTH && !loading && hasAnyResults && (
            <>
              {results.properties.length > 0 && (
                <CommandGroup heading="Properties">
                  {results.properties.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`property ${p.name} ${p.location ?? ''}`}
                      onSelect={() => navigate(`/properties/listings/${p.id}`)}
                    >
                      <Building2 className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        {p.location && (
                          <span className="text-xs text-muted-foreground">{p.location}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.tenants.length > 0 && (
                <CommandGroup heading="Tenants">
                  {results.tenants.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`tenant ${t.full_name} ${t.email ?? ''}`}
                      onSelect={() => navigate('/properties/tenants')}
                    >
                      <User className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{t.full_name}</span>
                        {t.email && (
                          <span className="text-xs text-muted-foreground">{t.email}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.contacts.length > 0 && (
                <CommandGroup heading="Contacts">
                  {results.contacts.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`contact ${c.full_name} ${c.email ?? ''} ${c.phone ?? ''}`}
                      onSelect={() => navigate('/crm/contacts')}
                    >
                      <Users className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{c.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.deals.length > 0 && (
                <CommandGroup heading="Deals">
                  {results.deals.map((d) => (
                    <CommandItem
                      key={d.id}
                      value={`deal ${d.reference ?? d.id}`}
                      onSelect={() => navigate(`/crm/deals/${d.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{d.reference ?? d.id}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.invoices.length > 0 && (
                <CommandGroup heading="Invoices">
                  {results.invoices.map((inv) => (
                    <CommandItem
                      key={inv.id}
                      value={`invoice ${inv.reference ?? inv.id}`}
                      onSelect={() => navigate(`/accounts/invoices/${inv.id}`)}
                    >
                      <Receipt className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{inv.reference ?? inv.id}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results.maintenance_requests.length > 0 && (
                <CommandGroup heading="Maintenance">
                  {results.maintenance_requests.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={`maintenance ${m.title} ${m.reference ?? ''}`}
                      onSelect={() => navigate('/operations/maintenance')}
                    >
                      <Wrench className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{m.title}</span>
                        {m.reference && (
                          <span className="text-xs text-muted-foreground">{m.reference}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
