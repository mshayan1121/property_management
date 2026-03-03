import { z } from "zod";

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email too long");

export const phoneSchema = z
  .string()
  .regex(/^[+]?[0-9\s\-\(\)]{7,20}$/, "Invalid phone number")
  .optional();

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name too long")
  .regex(/^[a-zA-Z\s\-\.\']+$/, "Name contains invalid characters");

export const amountSchema = z
  .number()
  .min(0, "Amount cannot be negative")
  .max(999999999, "Amount too large");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

export const uuidSchema = z.string().uuid("Invalid ID");

export const notesSchema = z
  .string()
  .max(2000, "Notes too long")
  .optional();

export const referenceSchema = z
  .string()
  .max(50, "Reference too long")
  .optional();
