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
| status | text | active, inactive (default: active) |
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

### vendors
- id: uuid PK
- name: text not null
- email: text nullable
- phone: text nullable
- category: text (maintenance/utilities/insurance/cleaning/security/management/other)
- address: text nullable
- trn: text nullable
- status: text (active/inactive) default active
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### invoices
- id: uuid PK
- reference: text unique (INV-000001)
- contract_id: uuid FK contracts nullable
- tenant_id: uuid FK tenants nullable
- contact_id: uuid FK contacts nullable
- type: text (rent/sale/service/other)
- amount: numeric(12,2) not null
- vat_amount: numeric(12,2) default 0
- total_amount: numeric(12,2) not null
- due_date: date not null
- status: text (draft/sent/paid/overdue/cancelled) default draft
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### payments
- id: uuid PK
- reference: text unique (PAY-000001)
- invoice_id: uuid FK invoices nullable
- amount: numeric(12,2) not null
- payment_date: date not null
- method: text (cash/cheque/bank_transfer/pdc)
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz

### pdcs
- id: uuid PK
- reference: text unique (PDC-000001)
- invoice_id: uuid FK invoices nullable
- tenant_id: uuid FK tenants nullable
- cheque_number: text not null
- bank_name: text not null
- amount: numeric(12,2) not null
- cheque_date: date not null
- status: text (pending/deposited/cleared/bounced/cancelled) default pending
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### bills
- id: uuid PK
- reference: text unique (BILL-000001)
- property_id: uuid FK properties nullable
- vendor_id: uuid FK vendors nullable
- category: text (maintenance/utilities/insurance/cleaning/security/management/other)
- description: text nullable
- amount: numeric(12,2) not null
- vat_amount: numeric(12,2) default 0
- total_amount: numeric(12,2) not null
- due_date: date not null
- status: text (pending/paid/overdue/cancelled) default pending
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

RLS enabled on all Phase 4 tables. Company-based policies: users only see their company's data.

## Phase 5 Tables (Operations)

### projects
- id: uuid PK
- reference: text unique (PROJ-000001)
- name: text not null
- description: text nullable
- property_id: uuid FK properties nullable
- category: text (maintenance/renovation/inspection/construction/other)
- status: text (pending/in_progress/completed/cancelled)
- priority: text (low/medium/high/urgent) default medium
- start_date: date nullable
- due_date: date nullable
- budget: numeric(12,2) default 0
- assigned_to: uuid FK profiles nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### tasks
- id: uuid PK
- reference: text unique (TASK-000001)
- title: text not null
- description: text nullable
- project_id: uuid FK projects nullable
- assigned_to: uuid FK profiles nullable
- priority: text (low/medium/high/urgent) default medium
- status: text (todo/in_progress/completed/cancelled) default todo
- due_date: date nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### maintenance_requests
- id: uuid PK
- reference: text unique (MR-000001)
- unit_id: uuid FK units nullable
- property_id: uuid FK properties nullable
- tenant_id: uuid FK tenants nullable
- title: text not null
- description: text nullable
- category: text (plumbing/electrical/hvac/structural/appliance/cleaning/other)
- priority: text (low/medium/high/urgent) default medium
- status: text (open/assigned/in_progress/completed/cancelled) default open
- assigned_to: uuid FK profiles nullable
- estimated_cost: numeric(12,2) default 0
- actual_cost: numeric(12,2) default 0
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### work_orders
- id: uuid PK
- reference: text unique (WO-000001)
- maintenance_request_id: uuid FK maintenance_requests nullable
- title: text not null
- description: text nullable
- vendor_id: uuid FK vendors nullable
- assigned_to: uuid FK profiles nullable
- status: text (pending/in_progress/completed/cancelled) default pending
- scheduled_date: date nullable
- completed_date: date nullable
- estimated_cost: numeric(12,2) default 0
- actual_cost: numeric(12,2) default 0
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### inventory_items
- id: uuid PK
- name: text not null
- description: text nullable
- category: text (furniture/appliance/equipment/supplies/other)
- property_id: uuid FK properties nullable
- quantity: integer default 0
- unit: text default pieces
- minimum_quantity: integer default 0
- status: text (available/low_stock/out_of_stock) default available
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### amenity_bookings
- id: uuid PK
- reference: text unique (BK-000001)
- amenity_id: uuid FK amenities nullable
- tenant_id: uuid FK tenants nullable
- booking_date: date not null
- start_time: time not null
- end_time: time not null
- status: text (pending/confirmed/cancelled) default pending
- notes: text nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

### announcements
- id: uuid PK
- title: text not null
- content: text not null
- type: text (general/maintenance/emergency/event) default general
- property_id: uuid FK properties nullable
- published_at: timestamptz nullable
- status: text (draft/published/archived) default draft
- created_by: uuid FK profiles nullable
- company_id: uuid FK companies
- created_at: timestamptz
- updated_at: timestamptz

RLS enabled on all Phase 5 tables. Company-based policies: users only see their company's data.