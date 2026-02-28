# PRD — Shaun Property Platform

## 1. Overview
A full-stack internal property management platform for Shaun Daswani's company.
Built to replicate PropExcel's core functionality.
Dubai/UAE focused, single-company use, with clean minimal UI.

## 2. Tech Stack
- Next.js 16.1, TypeScript, App Router
- Supabase (database, auth, storage)
- Tailwind CSS + shadcn/ui
- Recharts
- next-themes (dark/light toggle)
- react-hook-form + zod

## 3. Users & Roles
| Role | Access |
|------|--------|
| Admin | Full access to all modules + settings |
| Manager | All modules except settings |
| Agent | CRM only (own leads/deals) |
| Viewer | Read-only across all modules |

## 4. Modules

### 4.1 CRM
**Leads**
- Add/edit/delete leads
- Fields: name, email, phone, source (website/referral/social/portal), status, assigned agent, notes
- Lead source tracking

**Deals**
- Linked to a lead + property
- Type: Sale or Rental
- Deal stages: Qualified → Viewed → Negotiation → Contract Draft → Contract Signed
- Views: Kanban, List, Timeline, Chart
- Filter by pipeline, property, date range, type
- Commission calculation per deal
- KYC document upload per deal

**Contacts**
- Type: Buyer, Seller, Tenant, Landlord
- Linked to deals and properties
- Full contact history

**Contracts**
- Auto-generated from closed deals
- Fields: parties, property, start/end date, value, status
- Document upload/download
- One-click generation

### 4.2 Property Management
**Properties**
- Type: Residential or Commercial
- Fields: name, location, type, total units, status, images
- Map view

**Units**
- Linked to property
- Fields: unit number, floor, size (sqft), beds/baths, status (vacant/occupied), rent amount
- Bulk unit creation

**Tenants**
- Linked to unit + contact
- Lease start/end dates
- Monthly rent, payment schedule
- Automated rent reminders
- Lease expiry alerts

**Reports (8 types)**
- Portfolio Overview
- Monthly Contract Reports
- Revenue Report
- Vacancy Loss Report
- Lease Expiry Report
- Rent Collection Report
- Property Performance Report
- Occupancy Rate Report
- Portfolio Summary

### 4.3 Accounts & Finance
**Invoices**
- Auto-generated from deals/contracts
- Status: Draft, Sent, Paid, Overdue
- AED currency throughout

**PDC Management**
- Post-dated cheque tracking (Dubai-specific)
- Fields: cheque number, bank, amount, date, status
- Alerts for upcoming PDCs

**Payments**
- Receive payment against invoice
- Payment methods: cash, cheque, bank transfer, PDC
- Payment history

**Bills**
- Property-linked expenses
- Category: maintenance, utilities, insurance, etc.
- Vendor assignment

**Vendors**
- Vendor database
- Payment tracking per vendor

**VAT & Tax**
- UAE VAT (5%) tracking
- VAT reports

**Reports**
- P&L Statement
- Balance Sheet
- Cash Flow Statement
- Outstanding payments

### 4.4 HR & Payroll
**Employees**
- Employee database
- Department assignment
- Documents upload

**Attendance**
- Daily check-in/check-out
- Monthly attendance summary

**Leave Management**
- Leave requests
- Leave types: annual, sick, unpaid
- Approval workflow

**Payroll**
- Monthly payroll processing
- Basic salary + deductions + additions
- Payslip generation

**Recruitment**
- Job postings
- Candidate tracking pipeline

**Performance**
- Performance reviews
- Goal tracking

**Reports (6 categories)**
- Employee Reports
- Payroll Reports
- Attendance Reports
- Performance Reports
- Recruitment Reports
- Compliance Reports

### 4.5 Operations
**Projects**
- Linked to properties
- Status: pending, in progress, completed, cancelled
- Category tracking

**Tasks**
- Linked to projects
- Assigned to employees
- Priority: low, medium, high, urgent
- Due dates

**Maintenance Requests**
- Submitted per unit
- Status workflow: open → assigned → in progress → completed
- Linked to bills for cost tracking

**Work Orders**
- Generated from maintenance requests
- Assigned to vendors or employees

**Inventory**
- Items tracked per property
- Stock levels

**Amenity Bookings**
- Per property amenity management
- Booking calendar

**Announcements**
- Internal company announcements

**Reports**
- Projects by status
- Projects by category
- Task completion rates
- Maintenance analytics

## 5. Global Features
- Dark/Light theme toggle
- Global search
- Notifications (in-app)
- Role-based access on every page
- Responsive (desktop first, tablet friendly)
- AED currency formatting throughout
- UAE date format (DD/MM/YYYY)

## 6. Design
- Minimal and modern
- shadcn/ui defaults, no flashy customization
- Neutral palette, accent only for CTAs and status badges
- No decorative gradients or shadows
- Clean data tables over card grids where possible

## 7. Build Phases
| Phase | Module | Status |
|-------|--------|--------|
| 1 | Foundation (auth, layout, sidebar, overview dashboard) | In Progress |
| 2 | CRM | Pending |
| 3 | Property Management | Pending |
| 4 | Accounts & Finance | Pending |
| 5 | HR & Payroll | Pending |
| 6 | Operations | Pending |

## 8. Out of Scope (for now)
- AI features
- Tenant self-service portal
- Mobile app
- Multi-company/SaaS mode
- Third-party integrations