export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "admin" | "manager" | "agent" | "viewer";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          role: ProfileRole;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          source: string | null;
          status: string;
          assigned_to: string | null;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      contacts: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          type: string | null;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["contacts"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
      };
      deals: {
        Row: {
          id: string;
          reference: string | null;
          lead_id: string | null;
          contact_id: string | null;
          type: string | null;
          stage: string | null;
          value: number;
          commission_rate: number;
          commission_amount: number;
          payment_type: string | null;
          assigned_to: string | null;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deals"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      kyc_documents: {
        Row: {
          id: string;
          deal_id: string;
          name: string;
          file_url: string;
          file_type: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["kyc_documents"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["kyc_documents"]["Insert"]>;
      };
      contracts: {
        Row: {
          id: string;
          reference: string | null;
          deal_id: string | null;
          contact_id: string | null;
          type: string | null;
          start_date: string | null;
          end_date: string | null;
          value: number;
          status: string;
          document_url: string | null;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["contracts"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contracts"]["Insert"]>;
      };
    };
  };
}
