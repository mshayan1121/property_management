# Shaun Property Platform

## Overview
A full-stack property management platform for Shaun Daswani's company.
Replicates PropExcel functionality for internal use.
Dubai/UAE focused with AED currency and VAT compliance.

## Stack
- Next.js 16.1 (App Router, TypeScript)
- Supabase (database, auth, storage)
- Tailwind CSS + shadcn/ui
- Recharts
- next-themes

## Modules
1. CRM — Leads, Deals, Contacts, Contracts
2. Property Management — Listings, Units, Tenants, Reports
3. Accounts & Finance — Invoices, PDC, VAT, Vendors, P&L
4. HR & Payroll — Employees, Attendance, Leave, Payroll
5. Operations — Projects, Tasks, Maintenance, Vendors, Inventory

## Users
- Single company (Shaun's business)
- Role-based access: Admin, Manager, Agent, Viewer

## Theme
- Dark/Light toggle using shadcn + next-themes

## Folder Structure
/app
  /(auth)
    /login
    /register
  /(dashboard)
    /overview
    /crm
      /leads
      /deals
      /contacts
      /contracts
    /properties
      /listings
      /units
      /tenants
    /accounts
      /invoices
      /bills
      /payments
      /reports
    /hr
      /employees
      /payroll
      /attendance
      /recruitment
    /operations
      /tasks
      /projects
      /maintenance
    /settings
/components
  /ui
  /shared
  /crm
  /properties
  /accounts
  /hr
  /operations
/lib
  /supabase
  /types
  /utils
/hooks