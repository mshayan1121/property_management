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
To be added after Phase 1 is complete.

## Phase 3 Tables (Property Management)
To be added after Phase 2 is complete.

## Phase 4 Tables (Accounts & Finance)
To be added after Phase 3 is complete.

## Phase 5 Tables (HR & Payroll)
To be added after Phase 4 is complete.

## Phase 6 Tables (Operations)
To be added after Phase 5 is complete.