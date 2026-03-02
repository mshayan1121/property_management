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

### properties
- id: uuid PK
- reference: text unique (PROP-000001)
- name: text not null
- type: text (residential/commercial)
- location: text not null
- address: text nullable
- total_units: integer default 0
- status: text (active/inactive) default active
- images: text[] default {}
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### units
- id: uuid PK
- property_id: uuid FK properties cascade delete
- unit_number: text not null
- floor: integer nullable
- size_sqft: numeric(10,2) nullable
- bedrooms: integer nullable
- bathrooms: integer nullable
- type: text (residential/commercial)
- status: text (vacant/occupied) default vacant
- rent_amount: numeric(12,2) default 0
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### tenants
- id: uuid PK
- reference: text unique (TEN-000001)
- contact_id: uuid FK contacts nullable
- unit_id: uuid FK units nullable
- full_name: text not null
- email: text nullable
- phone: text nullable
- lease_start: date not null
- lease_end: date not null
- monthly_rent: numeric(12,2) not null
- payment_day: integer default 1
- status: text (active/expired/terminated) default active
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### amenities
- id: uuid PK
- property_id: uuid FK properties cascade delete
- name: text not null
- description: text nullable
- company_id: uuid FK companies
- created_at: timestamptz

RLS enabled on all Phase 3 tables. Company-based policies: users only see their company's data.

## Phase 4 Tables (Accounts & Finance)
To be added after Phase 3 is complete.

## Phase 5 Tables (HR & Payroll)
To be added after Phase 4 is complete.

## Phase 6 Tables (Operations)
To be added after Phase 5 is complete.