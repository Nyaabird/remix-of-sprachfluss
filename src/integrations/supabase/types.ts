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
      exercise_attempts: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_correct: boolean
          lesson_id: string
          response: string | null
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_correct: boolean
          lesson_id: string
          response?: string | null
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_correct?: boolean
          lesson_id?: string
          response?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_attempts_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          content: Json
          created_at: string
          dimension: Database["public"]["Enums"]["dimension"]
          explanation: string
          id: string
          lesson_id: string
          order_index: number
          phase: Database["public"]["Enums"]["phase"]
          prompt: string
          skill: Database["public"]["Enums"]["skill"]
          type: Database["public"]["Enums"]["exercise_type"]
        }
        Insert: {
          content: Json
          created_at?: string
          dimension: Database["public"]["Enums"]["dimension"]
          explanation: string
          id?: string
          lesson_id: string
          order_index: number
          phase: Database["public"]["Enums"]["phase"]
          prompt: string
          skill: Database["public"]["Enums"]["skill"]
          type: Database["public"]["Enums"]["exercise_type"]
        }
        Update: {
          content?: Json
          created_at?: string
          dimension?: Database["public"]["Enums"]["dimension"]
          explanation?: string
          id?: string
          lesson_id?: string
          order_index?: number
          phase?: Database["public"]["Enums"]["phase"]
          prompt?: string
          skill?: Database["public"]["Enums"]["skill"]
          type?: Database["public"]["Enums"]["exercise_type"]
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          id: string
          level: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          slug: string
          summary: string
          theme: string
          title: string
          title_de: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          order_index: number
          slug: string
          summary: string
          theme: string
          title: string
          title_de: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["cefr_level"]
          order_index?: number
          slug?: string
          summary?: string
          theme?: string
          title?: string
          title_de?: string
        }
        Relationships: []
      }
      mastery_scores: {
        Row: {
          attempts: number
          dimension: Database["public"]["Enums"]["dimension"]
          id: string
          score: number
          skill: Database["public"]["Enums"]["skill"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          dimension: Database["public"]["Enums"]["dimension"]
          id?: string
          score?: number
          skill: Database["public"]["Enums"]["skill"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          dimension?: Database["public"]["Enums"]["dimension"]
          id?: string
          score?: number
          skill?: Database["public"]["Enums"]["skill"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_minutes: number
          display_name: string | null
          goals: string[]
          id: string
          last_study_date: string | null
          onboarded: boolean
          playback_speed: number
          reminders_enabled: boolean
          self_level: string
          streak: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_minutes?: number
          display_name?: string | null
          goals?: string[]
          id: string
          last_study_date?: string | null
          onboarded?: boolean
          playback_speed?: number
          reminders_enabled?: boolean
          self_level?: string
          streak?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_minutes?: number
          display_name?: string | null
          goals?: string[]
          id?: string
          last_study_date?: string | null
          onboarded?: boolean
          playback_speed?: number
          reminders_enabled?: boolean
          self_level?: string
          streak?: number
          updated_at?: string
        }
        Relationships: []
      }
      review_queue: {
        Row: {
          box: number
          due_on: string
          exercise_id: string
          id: string
          resolved: boolean
          times_missed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          box?: number
          due_on?: string
          exercise_id: string
          id?: string
          resolved?: boolean
          times_missed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          box?: number
          due_on?: string
          exercise_id?: string
          id?: string
          resolved?: boolean
          times_missed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
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
      cefr_level: "A0" | "A1" | "A1+" | "A2" | "A2+"
      dimension:
        | "phonology"
        | "morphology"
        | "syntax"
        | "semantics"
        | "pragmatics"
      exercise_type:
        | "audio_dialogue"
        | "reading_passage"
        | "pronounce"
        | "fill_blank"
        | "word_order"
        | "vocab_match"
        | "pragmatics_choice"
        | "writing_prompt"
      phase: "input" | "output" | "feedback"
      skill: "listening" | "speaking" | "reading" | "writing"
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
      cefr_level: ["A0", "A1", "A1+", "A2", "A2+"],
      dimension: [
        "phonology",
        "morphology",
        "syntax",
        "semantics",
        "pragmatics",
      ],
      exercise_type: [
        "audio_dialogue",
        "reading_passage",
        "pronounce",
        "fill_blank",
        "word_order",
        "vocab_match",
        "pragmatics_choice",
        "writing_prompt",
      ],
      phase: ["input", "output", "feedback"],
      skill: ["listening", "speaking", "reading", "writing"],
    },
  },
} as const
