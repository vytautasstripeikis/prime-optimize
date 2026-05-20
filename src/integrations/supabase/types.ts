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
      body_logs: {
        Row: {
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          left_arm_cm: number | null
          left_calf_cm: number | null
          left_thigh_cm: number | null
          logged_on: string
          neck_cm: number | null
          notes: string | null
          right_arm_cm: number | null
          right_calf_cm: number | null
          right_thigh_cm: number | null
          shoulders_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_calf_cm?: number | null
          left_thigh_cm?: number | null
          logged_on?: string
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_calf_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_calf_cm?: number | null
          left_thigh_cm?: number | null
          logged_on?: string
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_calf_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
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
      daily_tips: {
        Row: {
          created_at: string
          id: string
          tip: string
          tip_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tip: string
          tip_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tip?: string
          tip_date?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          distance_km: number | null
          duration_seconds: number | null
          id: string
          name: string
          reps: number | null
          sets: number | null
          sort_order: number
          user_id: string
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number | null
          id?: string
          name: string
          reps?: number | null
          sets?: number | null
          sort_order?: number
          user_id: string
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number | null
          id?: string
          name?: string
          reps?: number | null
          sets?: number | null
          sort_order?: number
          user_id?: string
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          id: string
          logged_on: string
          meal: string
          name: string
          protein_g: number
          servings: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          logged_on?: string
          meal?: string
          name: string
          protein_g?: number
          servings?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          logged_on?: string
          meal?: string
          name?: string
          protein_g?: number
          servings?: number
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
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: number | null
          tags: string[]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: number | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: number | null
          tags?: string[]
          title?: string | null
          updated_at?: string
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
      mood_logs: {
        Row: {
          energy: number | null
          id: string
          logged_at: string
          mood: number
          notes: string | null
          stress: number | null
          tags: string[]
          user_id: string
        }
        Insert: {
          energy?: number | null
          id?: string
          logged_at?: string
          mood: number
          notes?: string | null
          stress?: number | null
          tags?: string[]
          user_id: string
        }
        Update: {
          energy?: number | null
          id?: string
          logged_at?: string
          mood?: number
          notes?: string | null
          stress?: number | null
          tags?: string[]
          user_id?: string
        }
        Relationships: []
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
      sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string
          duration_hours: number | null
          id: string
          notes: string | null
          quality: number | null
          slept_on: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          duration_hours?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          slept_on?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          duration_hours?: number | null
          id?: string
          notes?: string | null
          quality?: number | null
          slept_on?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          completed_on: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_on?: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_on?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_minutes: number | null
          id: string
          last_completed_date: string | null
          priority: string
          recurrence: string
          recurrence_days: number[]
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          last_completed_date?: string | null
          priority?: string
          recurrence?: string
          recurrence_days?: number[]
          title: string
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_minutes?: number | null
          id?: string
          last_completed_date?: string | null
          priority?: string
          recurrence?: string
          recurrence_days?: number[]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_on: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_on?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_on?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          custom_name: string | null
          distance_km: number | null
          duration_seconds: number | null
          exercise_key: string | null
          id: string
          notes: string | null
          primary_muscle: string | null
          reps: number | null
          secondary_muscles: string[]
          set_number: number
          sets: number | null
          sort_order: number
          user_id: string
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          distance_km?: number | null
          duration_seconds?: number | null
          exercise_key?: string | null
          id?: string
          notes?: string | null
          primary_muscle?: string | null
          reps?: number | null
          secondary_muscles?: string[]
          set_number?: number
          sets?: number | null
          sort_order?: number
          user_id: string
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          distance_km?: number | null
          duration_seconds?: number | null
          exercise_key?: string | null
          id?: string
          notes?: string | null
          primary_muscle?: string | null
          reps?: number | null
          secondary_muscles?: string[]
          set_number?: number
          sets?: number | null
          sort_order?: number
          user_id?: string
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number | null
          created_at: string
          duration_minutes: number | null
          id: string
          intensity: string
          name: string
          notes: string | null
          performed_on: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: string
          name: string
          notes?: string | null
          performed_on?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          intensity?: string
          name?: string
          notes?: string | null
          performed_on?: string
          type?: string
          updated_at?: string
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
