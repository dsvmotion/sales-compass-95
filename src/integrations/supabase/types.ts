export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      geography_cities: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          name_local: string | null
          population: number | null
          province_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          name_local?: string | null
          population?: number | null
          province_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          name_local?: string | null
          population?: number | null
          province_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geography_cities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "geography_provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_countries: {
        Row: {
          code: string
          created_at: string
          name: string
          name_local: string | null
        }
        Insert: {
          code: string
          created_at?: string
          name: string
          name_local?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          name?: string
          name_local?: string | null
        }
        Relationships: []
      }
      geography_provinces: {
        Row: {
          code: string | null
          country_code: string
          created_at: string
          id: string
          name: string
          name_local: string | null
        }
        Insert: {
          code?: string | null
          country_code: string
          created_at?: string
          id?: string
          name: string
          name_local?: string | null
        }
        Update: {
          code?: string | null
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          name_local?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geography_provinces_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "geography_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string | null
          city: string | null
          commercial_status: Database["public"]["Enums"]["pharmacy_status"]
          country: string | null
          created_at: string
          email: string | null
          google_data: Json | null
          google_place_id: string
          id: string
          lat: number
          lng: number
          name: string
          notes: string | null
          opening_hours: Json | null
          phone: string | null
          province: string | null
          saved_at: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          commercial_status?: Database["public"]["Enums"]["pharmacy_status"]
          country?: string | null
          created_at?: string
          email?: string | null
          google_data?: Json | null
          google_place_id: string
          id?: string
          lat: number
          lng: number
          name: string
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          province?: string | null
          saved_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          commercial_status?: Database["public"]["Enums"]["pharmacy_status"]
          country?: string | null
          created_at?: string
          email?: string | null
          google_data?: Json | null
          google_place_id?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          province?: string | null
          saved_at?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      pharmacy_order_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          order_id: string
          pharmacy_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          order_id: string
          pharmacy_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          order_id?: string
          pharmacy_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_order_documents_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pharmacy_status: "not_contacted" | "contacted" | "client"
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
  public: {
    Enums: {
      pharmacy_status: ["not_contacted", "contacted", "client"],
    },
  },
} as const
