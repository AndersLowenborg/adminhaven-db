export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Answers: {
        Row: {
          agreement_level: number | null
          confidence_level: number | null
          content: string
          created_at: string | null
          id: number
          statement_id: number | null
          status: string | null
        }
        Insert: {
          agreement_level?: number | null
          confidence_level?: number | null
          content: string
          created_at?: string | null
          id?: number
          statement_id?: number | null
          status?: string | null
        }
        Update: {
          agreement_level?: number | null
          confidence_level?: number | null
          content?: string
          created_at?: string | null
          id?: number
          statement_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Answers_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "Statements"
            referencedColumns: ["id"]
          },
        ]
      }
      GroupAnswers: {
        Row: {
          agreement_level: number | null
          created_at: string | null
          group_id: number | null
          id: number
          round_id: number | null
          statement_id: number | null
          uncertainty_comment: string | null
          uncertainty_level: number | null
        }
        Insert: {
          agreement_level?: number | null
          created_at?: string | null
          group_id?: number | null
          id?: never
          round_id?: number | null
          statement_id?: number | null
          uncertainty_comment?: string | null
          uncertainty_level?: number | null
        }
        Update: {
          agreement_level?: number | null
          created_at?: string | null
          group_id?: number | null
          id?: never
          round_id?: number | null
          statement_id?: number | null
          uncertainty_comment?: string | null
          uncertainty_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "GroupAnswers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "Groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "GroupAnswers_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "Rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "GroupAnswers_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "Statements"
            referencedColumns: ["id"]
          },
        ]
      }
      GroupMembers: {
        Row: {
          created_at: string | null
          group_id: number | null
          id: number
          session_user_id: number | null
        }
        Insert: {
          created_at?: string | null
          group_id?: number | null
          id?: never
          session_user_id?: number | null
        }
        Update: {
          created_at?: string | null
          group_id?: number | null
          id?: never
          session_user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "GroupMembers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "Groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "GroupMembers_session_user_id_fkey"
            columns: ["session_user_id"]
            isOneToOne: false
            referencedRelation: "SessionUsers"
            referencedColumns: ["id"]
          },
        ]
      }
      Groups: {
        Row: {
          created_at: string | null
          id: number
          leader_id: number | null
          merged_into_group_id: number | null
          round_id: number | null
          session_id: number | null
          status: Database["public"]["Enums"]["group_status"] | null
          uncertainty_comment: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          leader_id?: number | null
          merged_into_group_id?: number | null
          round_id?: number | null
          session_id?: number | null
          status?: Database["public"]["Enums"]["group_status"] | null
          uncertainty_comment?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          leader_id?: number | null
          merged_into_group_id?: number | null
          round_id?: number | null
          session_id?: number | null
          status?: Database["public"]["Enums"]["group_status"] | null
          uncertainty_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "SessionUsers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Groups_merged_into_group_id_fkey"
            columns: ["merged_into_group_id"]
            isOneToOne: false
            referencedRelation: "Groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Groups_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "Rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Groups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      Rounds: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: number
          round_number: number
          session_id: number | null
          started_at: string | null
          status: string | null
          time_limit: number | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: never
          round_number: number
          session_id?: number | null
          started_at?: string | null
          status?: string | null
          time_limit?: number | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: never
          round_number?: number
          session_id?: number | null
          started_at?: string | null
          status?: string | null
          time_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      Sessions: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      SessionUsers: {
        Row: {
          created_at: string | null
          id: number
          name: string
          session_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          session_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          session_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "SessionUsers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      Statements: {
        Row: {
          background: string | null
          content: string
          created_at: string | null
          id: number
          session_id: number | null
          status: string | null
        }
        Insert: {
          background?: string | null
          content: string
          created_at?: string | null
          id?: number
          session_id?: number | null
          status?: string | null
        }
        Update: {
          background?: string | null
          content?: string
          created_at?: string | null
          id?: number
          session_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Statements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "Sessions"
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
      group_status: "active" | "merged" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
