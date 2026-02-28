# Build Phases

## Phase 1 — Foundation
Status: ✅ Complete

### Features
- Supabase auth (login, register, forgot password)
- Protected routes middleware
- App layout (sidebar, topbar, main content area)
- Dark/Light theme toggle
- Role-based access setup (Admin, Manager, Agent, Viewer)
- Overview dashboard (stats shell, placeholder charts)
- User profile + settings page
- Supabase client setup (server + client)

---

## Phase 2 — CRM
Status: In Progress

### Features
- Leads (add, edit, delete, list, filter by source/status)
- Deals (add, edit, delete)
- Deal pipeline views: Kanban, List, Timeline, Chart
- Deal stages: Qualified → Viewed → Negotiation → Contract Draft → Contract Signed
- Commission calculation per deal
- KYC document upload per deal
- Contacts (add, edit, delete, type: buyer/seller/tenant/landlord)
- Contracts (auto-generate from deal, upload/download)
- CRM dashboard (total leads, qualified leads, total deals, win rate)

---

## Phase 3 — Property Management
Status: Pending

### Features
- Properties (add, edit, delete, residential/commercial)
- Property images upload
- Units (add, edit, bulk create, vacant/occupied status)
- Tenants (add, edit, lease dates, rent amount)
- Lease expiry alerts
- Automated rent reminders
- Property reports:
  - Portfolio Overview
  - Monthly Contract Reports
  - Revenue Report
  - Vacancy Loss Report
  - Lease Expiry Report
  - Rent Collection Report
  - Property Performance Report
  - Occupancy Rate Report
  - Portfolio Summary

---

## Phase 4 — Accounts & Finance
Status: Pending

### Features
- Invoices (auto-generated from deals/contracts, status tracking)
- PDC management (post-dated cheques, alerts)
- Payments (receive payment, payment methods, history)
- Bills (property-linked expenses, categories)
- Vendors (database, payment tracking)
- UAE VAT (5%) tracking and reports
- Financial reports:
  - P&L Statement
  - Balance Sheet
  - Cash Flow Statement
  - Outstanding Payments

---

## Phase 5 — HR & Payroll
Status: Pending

### Features
- Employees (database, departments, documents)
- Attendance (check-in/check-out, monthly summary)
- Leave management (requests, types, approval workflow)
- Payroll (monthly processing, payslip generation)
- Recruitment (job postings, candidate pipeline)
- Performance reviews and goal tracking
- HR reports:
  - Employee Reports
  - Payroll Reports
  - Attendance Reports
  - Performance Reports
  - Recruitment Reports
  - Compliance Reports

---

## Phase 6 — Operations
Status: Pending

### Features
- Projects (linked to properties, status, categories)
- Tasks (assigned to employees, priority, due dates)
- Maintenance requests (unit-level, status workflow)
- Work orders (generated from maintenance requests)
- Inventory (items per property, stock levels)
- Amenity bookings (booking calendar)
- Announcements (internal)
- Operations reports:
  - Projects by status
  - Projects by category
  - Task completion rates
  - Maintenance analytics

---

## Out of Scope (for now)
- AI features
- Tenant self-service portal
- Mobile app
- Multi-company/SaaS mode
- Third-party integrations