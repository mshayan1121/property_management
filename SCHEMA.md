# Database Schema

## Status
Being built phase by phase. Updated after each phase is complete.

## Phase 1 Tables (Foundation)

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | References auth.users |
| full_name | text | |
| avatar_url | text | nullable |
| role | text | admin, manager, agent, viewer |
| company_id | uuid | FK to companies |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### companies
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | |
| logo_url | text | nullable |
| timezone | text | default: Asia/Dubai |
| currency | text | default: AED |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## Phase 2 Tables (CRM)

### leads
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| full_name | text | not null |
| email | text | nullable |
| phone | text | nullable |
| source | text | website, referral, social, portal, other |
| status | text | new, contacted, qualified, lost (default: new) |
| assigned_to | uuid | FK to profiles, nullable |
| notes | text | nullable |
| company_id | uuid | FK to companies |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### contacts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| full_name | text | not null |
| email | text | nullable |
| phone | text | nullable |
| type | text | buyer, seller, tenant, landlord |
| notes | text | nullable |
| company_id | uuid | FK to companies |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### deals
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| reference | text | unique, format DEAL-000001 |
| lead_id | uuid | FK to leads, nullable |
| contact_id | uuid | FK to contacts, nullable |
| type | text | sale, rental |
| stage | text | qualified, viewed, negotiation, contract_draft, contract_signed |
| value | numeric(12,2) | default 0 |
| commission_rate | numeric(5,2) | default 0 |
| commission_amount | numeric(12,2) | default 0 |
| payment_type | text | cash, mortgage, bank_transfer, cheque |
| assigned_to | uuid | FK to profiles, nullable |
| notes | text | nullable |
| company_id | uuid | FK to companies |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### kyc_documents
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| deal_id | uuid | FK to deals, on delete cascade |
| name | text | not null |
| file_url | text | not null |
| file_type | text | nullable |
| uploaded_by | uuid | FK to profiles |
| created_at | timestamptz | default now() |

### contracts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| reference | text | unique, format CON-000001 |
| deal_id | uuid | FK to deals, nullable |
| contact_id | uuid | FK to contacts, nullable |
| type | text | sale, rental |
| start_date | date | nullable |
| end_date | date | nullable |
| value | numeric(12,2) | default 0 |
| status | text | draft, active, expired, terminated (default: draft) |
| document_url | text | nullable |
| notes | text | nullable |
| company_id | uuid | FK to companies |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS enabled on all Phase 2 tables. Company-based policies: users only see their company's data.

## Phase 3 Tables (Property Management)
To be added after Phase 2 is complete.

## Phase 4 Tables (Accounts & Finance)
To be added after Phase 3 is complete.

## Phase 5 Tables (HR & Payroll)
To be added after Phase 4 is complete.

## Phase 6 Tables (Operations)
To be added after Phase 5 is complete.