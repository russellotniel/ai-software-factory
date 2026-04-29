// Hand-stubbed to match baseline + 20260429220000_submit_registration migrations.
// Will be overwritten by `supabase gen types typescript --local > src/types/database.ts`
// once a live Supabase database is connected.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type RegistrationStatus = "pending" | "approved" | "rejected";
type AppRole = "superadmin" | "admin" | "dealer" | "customer" | "auditor" | "user";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          global_role: AppRole;
          region_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          global_role?: AppRole;
          region_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          full_name: string | null;
          avatar_url: string | null;
          global_role: AppRole;
          region_code: string | null;
        }>;
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          customer_id: string;
          nik_encrypted: string; // bytea encoded as base64 by Supabase
          kk_encrypted: string;
          selfie_url: string;
          phone_number: string;
          region_code: string;
          status: RegistrationStatus;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
          created_by: string;
          updated_by: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          nik_encrypted: string;
          kk_encrypted: string;
          selfie_url: string;
          phone_number: string;
          region_code: string;
          status?: RegistrationStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by: string;
          updated_by: string;
        };
        Update: Partial<{
          status: RegistrationStatus;
          rejection_reason: string | null;
          updated_at: string;
          updated_by: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "registrations_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_registration: {
        Args: {
          p_nik: string;
          p_kk: string;
          p_selfie_url: string;
          p_phone: string;
        };
        Returns: string; // uuid
      };
    };
    Enums: {
      app_role: AppRole;
    };
  };
};
