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
- id: uuid PK
- full_name: text not null
- email: text nullable
- phone: text nullable
- source: text (website/referral/social/portal/other)
- status: text (new/contacted/qualified/lost) default new
- assigned_to: uuid FK profiles nullable
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### contacts
- id: uuid PK
- full_name: text not null
- email: text nullable
- phone: text nullable
- type: text (buyer/seller/tenant/landlord)
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### deals
- id: uuid PK
- reference: text unique (DEAL-000001)
- lead_id: uuid FK leads nullable
- contact_id: uuid FK contacts nullable
- type: text (sale/rental)
- stage: text (qualified/viewed/negotiation/contract_draft/contract_signed)
- value: numeric(12,2)
- commission_rate: numeric(5,2)
- commission_amount: numeric(12,2)
- payment_type: text (cash/mortgage/bank_transfer/cheque)
- assigned_to: uuid FK profiles nullable
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### kyc_documents
- id: uuid PK
- deal_id: uuid FK deals cascade delete
- name: text not null
- file_url: text not null
- file_type: text nullable
- uploaded_by: uuid FK profiles
- created_at: timestamptz

### contracts
- id: uuid PK
- reference: text unique (CON-000001)
- deal_id: uuid FK deals nullable
- contact_id: uuid FK contacts nullable
- type: text (sale/rental)
- start_date: date nullable
- end_date: date nullable
- value: numeric(12,2)
- status: text (draft/active/expired/terminated)
- document_url: text nullable
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

RLS enabled on all Phase 2 tables. Company-based policies: users only see their company's data.

## Phase 3 Tables (Property Management)
To be added after Phase 2 is complete.

## Phase 4 Tables (Accounts & Finance)
To be added after Phase 3 is complete.

## Phase 5 Tables (HR & Payroll)
To be added after Phase 4 is complete.

## Phase 6 Tables (Operations)
To be added after Phase 5 is complete.