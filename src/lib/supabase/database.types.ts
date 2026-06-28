export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          at: string
          id: string
          payload: Json
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          at?: string
          id?: string
          payload?: Json
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          at?: string
          id?: string
          payload?: Json
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_events: {
        Row: {
          coram: string | null
          counsel: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          details: Json
          event_type: Database["public"]["Enums"]["case_event_type"]
          id: string
          matter_id: string
          next_date: string | null
          next_set_for: string | null
          notes: string | null
          occurred_at: string
          set_for: string | null
          updated_at: string
        }
        Insert: {
          coram?: string | null
          counsel?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          details?: Json
          event_type: Database["public"]["Enums"]["case_event_type"]
          id?: string
          matter_id: string
          next_date?: string | null
          next_set_for?: string | null
          notes?: string | null
          occurred_at: string
          set_for?: string | null
          updated_at?: string
        }
        Update: {
          coram?: string | null
          counsel?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          details?: Json
          event_type?: Database["public"]["Enums"]["case_event_type"]
          id?: string
          matter_id?: string
          next_date?: string | null
          next_set_for?: string | null
          notes?: string | null
          occurred_at?: string
          set_for?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_events_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      case_types: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_code: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          deleted_at: string | null
          email: string | null
          ic_or_company_no: string | null
          id: string
          name: string
          phone: string | null
          reference_no: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_code?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          deleted_at?: string | null
          email?: string | null
          ic_or_company_no?: string | null
          id?: string
          name: string
          phone?: string | null
          reference_no?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_code?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          deleted_at?: string | null
          email?: string | null
          ic_or_company_no?: string | null
          id?: string
          name?: string
          phone?: string | null
          reference_no?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          file_size: number | null
          filename: string
          id: string
          matter_id: string
          mime_type: string | null
          storage_path: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          file_size?: number | null
          filename: string
          id?: string
          matter_id: string
          mime_type?: string | null
          storage_path: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          matter_id?: string
          mime_type?: string | null
          storage_path?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_settings: {
        Row: {
          bar_council_no: string | null
          id: boolean
          logo_url: string | null
          name: string
          primary_hex: string | null
          read_only: boolean
          retention_years: number
          sender_email: string | null
          updated_at: string
        }
        Insert: {
          bar_council_no?: string | null
          id?: boolean
          logo_url?: string | null
          name?: string
          primary_hex?: string | null
          read_only?: boolean
          retention_years?: number
          sender_email?: string | null
          updated_at?: string
        }
        Update: {
          bar_council_no?: string | null
          id?: boolean
          logo_url?: string | null
          name?: string
          primary_hex?: string | null
          read_only?: boolean
          retention_years?: number
          sender_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      matters: {
        Row: {
          accused: string | null
          assigned_to: string | null
          case_no_committal: string | null
          case_no_trial: string | null
          case_type_id: string | null
          charges: string | null
          client_id: string
          court: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          deleted_at: string | null
          description: string | null
          file_ref: string
          id: string
          next_hearing_at: string | null
          opened_at: string
          opposing_counsel: string | null
          prosecutor_dpp: string | null
          status: Database["public"]["Enums"]["matter_status"]
          title: string
          updated_at: string
        }
        Insert: {
          accused?: string | null
          assigned_to?: string | null
          case_no_committal?: string | null
          case_no_trial?: string | null
          case_type_id?: string | null
          charges?: string | null
          client_id: string
          court?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          deleted_at?: string | null
          description?: string | null
          file_ref: string
          id?: string
          next_hearing_at?: string | null
          opened_at?: string
          opposing_counsel?: string | null
          prosecutor_dpp?: string | null
          status?: Database["public"]["Enums"]["matter_status"]
          title: string
          updated_at?: string
        }
        Update: {
          accused?: string | null
          assigned_to?: string | null
          case_no_committal?: string | null
          case_no_trial?: string | null
          case_type_id?: string | null
          charges?: string | null
          client_id?: string
          court?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          deleted_at?: string | null
          description?: string | null
          file_ref?: string
          id?: string
          next_hearing_at?: string | null
          opened_at?: string
          opposing_counsel?: string | null
          prosecutor_dpp?: string | null
          status?: Database["public"]["Enums"]["matter_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matters_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_case_type_id_fkey"
            columns: ["case_type_id"]
            isOneToOne: false
            referencedRelation: "case_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      case_event_type:
        | "court_attendance"
        | "zoom_attendance"
        | "prison_attendance"
        | "client_interview"
        | "minutes_of_proceedings"
      client_type: "individual" | "corporate"
      matter_status: "active" | "on_hold" | "pending_filing" | "closed"
      user_role: "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      case_event_type: [
        "court_attendance",
        "zoom_attendance",
        "prison_attendance",
        "client_interview",
        "minutes_of_proceedings",
      ],
      client_type: ["individual", "corporate"],
      matter_status: ["active", "on_hold", "pending_filing", "closed"],
      user_role: ["admin", "staff"],
    },
  },
} as const

