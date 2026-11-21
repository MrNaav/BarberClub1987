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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          barber_id: string
          barber_name: string
          blocked_until: string
          code: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          ends_at: string
          id: string
          notes: string | null
          service_duration_minutes: number
          service_id: string
          service_name: string
          service_price_cents: number
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          status_changed_at: string | null
          updated_at: string
        }
        Insert: {
          barber_id: string
          barber_name: string
          blocked_until: string
          code: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          ends_at: string
          id?: string
          notes?: string | null
          service_duration_minutes: number
          service_id: string
          service_name: string
          service_price_cents: number
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          status_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          barber_id?: string
          barber_name?: string
          blocked_until?: string
          code?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          ends_at?: string
          id?: string
          notes?: string | null
          service_duration_minutes?: number
          service_id?: string
          service_name?: string
          service_price_cents?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          status_changed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_services: {
        Row: {
          barber_id: string
          created_at: string
          service_id: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          service_id: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_weekly_hours: {
        Row: {
          barber_id: string
          break_end: string | null
          break_start: string | null
          end_time: string
          is_working: boolean
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          barber_id: string
          break_end?: string | null
          break_start?: string | null
          end_time?: string
          is_working?: boolean
          start_time?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          barber_id?: string
          break_end?: string | null
          break_start?: string | null
          end_time?: string
          is_working?: boolean
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "barber_weekly_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          bio: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          role: string
          slug: string
          sort_order: number
          specialty: string
          updated_at: string
        }
        Insert: {
          bio?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          role: string
          slug: string
          sort_order?: number
          specialty?: string
          updated_at?: string
        }
        Update: {
          bio?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
          slug?: string
          sort_order?: number
          specialty?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_settings: {
        Row: {
          buffer_minutes: number
          id: number
          max_days_ahead: number
          min_notice_minutes: number
          slot_interval_minutes: number
          timezone: string
          updated_at: string
        }
        Insert: {
          buffer_minutes?: number
          id?: number
          max_days_ahead?: number
          min_notice_minutes?: number
          slot_interval_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          buffer_minutes?: number
          id?: number
          max_days_ahead?: number
          min_notice_minutes?: number
          slot_interval_minutes?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          close_time: string
          is_open: boolean
          open_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string
          is_open?: boolean
          open_time?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string
          is_open?: boolean
          open_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          barber_id: string | null
          created_at: string
          ends_at: string
          id: string
          reason: string
          starts_at: string
        }
        Insert: {
          barber_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          reason?: string
          starts_at: string
        }
        Update: {
          barber_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          reason?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_cents: number
          price_is_demo: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration_minutes: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_cents: number
          price_is_demo?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_cents?: number
          price_is_demo?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_reschedule_appointment: {
        Args: {
          p_appointment_id: string
          p_barber_id: string
          p_starts_at: string
        }
        Returns: undefined
      }
      book_appointment: {
        Args: {
          p_barber_id: string
          p_customer_email?: string
          p_customer_name: string
          p_customer_phone: string
          p_notes?: string
          p_service_id: string
          p_starts_at: string
        }
        Returns: {
          barber_id: string
          barber_name: string
          code: string
          ends_at: string
          id: string
          service_duration_minutes: number
          service_name: string
          service_price_cents: number
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
        }[]
      }
      generate_booking_code: { Args: never; Returns: string }
      get_available_dates: {
        Args: { p_barber_id?: string; p_service_id: string }
        Returns: {
          available_date: string
        }[]
      }
      get_available_slots: {
        Args: {
          p_barber_id?: string
          p_date: string
          p_duration_minutes?: number
          p_exclude_appointment_id?: string
          p_service_id: string
        }
        Returns: {
          barber_id: string
          starts_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      save_barber_profile: {
        Args: { p_barber_id: string; p_profile: Json; p_service_ids: string[] }
        Returns: undefined
      }
      save_business_hours: { Args: { p_rows: Json }; Returns: undefined }
    }
    Enums: {
      app_role: "admin"
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
    },
  },
} as const
