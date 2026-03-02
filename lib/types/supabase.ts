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
          status: string;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          company_id?: string | null;
          status?: string;
          must_change_password?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          company_id?: string | null;
          status?: string;
          must_change_password?: boolean;
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
      properties: {
        Row: {
          id: string;
          reference: string;
          name: string;
          type: string | null;
          location: string;
          address: string | null;
          total_units: number;
          status: string;
          images: string[] | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["properties"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      units: {
        Row: {
          id: string;
          property_id: string;
          unit_number: string;
          floor: number | null;
          size_sqft: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          type: string | null;
          status: string;
          rent_amount: number;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["units"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
      };
      tenants: {
        Row: {
          id: string;
          reference: string;
          contact_id: string | null;
          unit_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          lease_start: string;
          lease_end: string;
          monthly_rent: number;
          payment_day: number;
          status: string;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tenants"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
      };
      amenities: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          description: string | null;
          company_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["amenities"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["amenities"]["Insert"]>;
      };
      invoices: {
        Row: {
          id: string;
          reference: string;
          contract_id: string | null;
          tenant_id: string | null;
          contact_id: string | null;
          type: string;
          amount: number;
          vat_amount: number;
          total_amount: number;
          due_date: string;
          status: string;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          reference: string;
          invoice_id: string | null;
          amount: number;
          payment_date: string;
          method: string;
          notes: string | null;
          company_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      pdcs: {
        Row: {
          id: string;
          reference: string;
          invoice_id: string | null;
          tenant_id: string | null;
          cheque_number: string;
          bank_name: string;
          amount: number;
          cheque_date: string;
          status: string;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["pdcs"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pdcs"]["Insert"]>;
      };
      bills: {
        Row: {
          id: string;
          reference: string;
          property_id: string | null;
          vendor_id: string | null;
          category: string;
          description: string | null;
          amount: number;
          vat_amount: number;
          total_amount: number;
          due_date: string;
          status: string;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bills"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bills"]["Insert"]>;
      };
      vendors: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          category: string | null;
          address: string | null;
          trn: string | null;
          status: string;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["vendors"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          reference: string;
          name: string;
          description: string | null;
          property_id: string | null;
          category: string | null;
          status: string;
          priority: string;
          start_date: string | null;
          due_date: string | null;
          budget: number;
          assigned_to: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          reference: string;
          title: string;
          description: string | null;
          project_id: string | null;
          assigned_to: string | null;
          priority: string;
          status: string;
          due_date: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      maintenance_requests: {
        Row: {
          id: string;
          reference: string;
          unit_id: string | null;
          property_id: string | null;
          tenant_id: string | null;
          title: string;
          description: string | null;
          category: string | null;
          priority: string;
          status: string;
          assigned_to: string | null;
          estimated_cost: number;
          actual_cost: number;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["maintenance_requests"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["maintenance_requests"]["Insert"]>;
      };
      work_orders: {
        Row: {
          id: string;
          reference: string;
          maintenance_request_id: string | null;
          title: string;
          description: string | null;
          vendor_id: string | null;
          assigned_to: string | null;
          status: string;
          scheduled_date: string | null;
          completed_date: string | null;
          estimated_cost: number;
          actual_cost: number;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["work_orders"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["work_orders"]["Insert"]>;
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          property_id: string | null;
          quantity: number;
          unit: string;
          minimum_quantity: number;
          status: string;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["inventory_items"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
      };
      amenity_bookings: {
        Row: {
          id: string;
          reference: string;
          amenity_id: string | null;
          tenant_id: string | null;
          booking_date: string;
          start_time: string;
          end_time: string;
          status: string;
          notes: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["amenity_bookings"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["amenity_bookings"]["Insert"]>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          type: string;
          property_id: string | null;
          published_at: string | null;
          status: string;
          created_by: string | null;
          company_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["announcements"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          link: string | null;
          is_read: boolean;
          company_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          link?: string | null;
          is_read?: boolean;
          company_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
  };
}
