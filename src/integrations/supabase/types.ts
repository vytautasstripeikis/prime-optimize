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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          priority: string
          progress: number
          status: string
          target_date: string | null
          timeframe: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string
          progress?: number
          status?: string
          target_date?: string | null
          timeframe?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string
          progress?: number
          status?: string
          target_date?: string | null
          timeframe?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          count: number
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          habit_id: string
          id?: string
          log_date?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          category: string
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          target_per_day: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          category?: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          target_per_day?: number
          user_id: string
        }
        Update: {
          archived?: boolean
          category?: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          target_per_day?: number
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          goal_id: string
          id: string
          sort_order: number
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          goal_id: string
          id?: string
          sort_order?: number
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          goal_id?: string
          id?: string
          sort_order?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string | null
          body_fat_pct: number | null
          calorie_goal: number | null
          career_goals: string | null
          created_at: string
          daily_routine: string | null
          diet_preferences: string[] | null
          display_name: string | null
          financial_goals: string | null
          fitness_goals: string | null
          fitness_level: string | null
          focus_times: string[] | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          injuries: string | null
          level: number
          medical_notes: string | null
          motivation_style: string | null
          onboarded: boolean
          personality_style: string | null
          productivity_level: number | null
          sleep_end: string | null
          sleep_goal_hours: number | null
          sleep_start: string | null
          streak_days: number
          stress_level: number | null
          timezone: string | null
          updated_at: string
          water_goal_ml: number | null
          weight_kg: number | null
          work_schedule: string | null
          workout_preferences: string[] | null
          xp: number
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          body_fat_pct?: number | null
          calorie_goal?: number | null
          career_goals?: string | null
          created_at?: string
          daily_routine?: string | null
          diet_preferences?: string[] | null
          display_name?: string | null
          financial_goals?: string | null
          fitness_goals?: string | null
          fitness_level?: string | null
          focus_times?: string[] | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          injuries?: string | null
          level?: number
          medical_notes?: string | null
          motivation_style?: string | null
          onboarded?: boolean
          personality_style?: string | null
          productivity_level?: number | null
          sleep_end?: string | null
          sleep_goal_hours?: number | null
          sleep_start?: string | null
          streak_days?: number
          stress_level?: number | null
          timezone?: string | null
          updated_at?: string
          water_goal_ml?: number | null
          weight_kg?: number | null
          work_schedule?: string | null
          workout_preferences?: string[] | null
          xp?: number
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          body_fat_pct?: number | null
          calorie_goal?: number | null
          career_goals?: string | null
          created_at?: string
          daily_routine?: string | null
          diet_preferences?: string[] | null
          display_name?: string | null
          financial_goals?: string | null
          fitness_goals?: string | null
          fitness_level?: string | null
          focus_times?: string[] | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string | null
          level?: number
          medical_notes?: string | null
          motivation_style?: string | null
          onboarded?: boolean
          personality_style?: string | null
          productivity_level?: number | null
          sleep_end?: string | null
          sleep_goal_hours?: number | null
          sleep_start?: string | null
          streak_days?: number
          stress_level?: number | null
          timezone?: string | null
          updated_at?: string
          water_goal_ml?: number | null
          weight_kg?: number | null
          work_schedule?: string | null
          workout_preferences?: string[] | null
          xp?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
