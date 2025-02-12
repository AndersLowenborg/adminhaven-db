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
      ANSWER: {
        Row: {
          agreement_level: number | null
          comment: string | null
          confidence_level: number | null
          created_at: string | null
          id: number
          respondant_id: number | null
          respondant_type: Database["public"]["Enums"]["respondant_type"] | null
          round_id: number | null
        }
        Insert: {
          agreement_level?: number | null
          comment?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id: number
          respondant_id?: number | null
          respondant_type?:
            | Database["public"]["Enums"]["respondant_type"]
            | null
          round_id?: number | null
        }
        Update: {
          agreement_level?: number | null
          comment?: string | null
          confidence_level?: number | null
          created_at?: string | null
          id?: number
          respondant_id?: number | null
          respondant_type?:
            | Database["public"]["Enums"]["respondant_type"]
            | null
          round_id?: number | null
        }
        Relationships: []
      }
      GROUP: {
        Row: {
          id: number
          leader: number | null
        }
        Insert: {
          id: number
          leader?: number | null
        }
        Update: {
          id?: number
          leader?: number | null
        }
        Relationships: []
      }
      GROUP_MEMBERS: {
        Row: {
          id: number
          member_id: number | null
          member_type: Database["public"]["Enums"]["respondant_type"] | null
          parent_group_id: number | null
        }
        Insert: {
          id: number
          member_id?: number | null
          member_type?: Database["public"]["Enums"]["respondant_type"] | null
          parent_group_id?: number | null
        }
        Update: {
          id?: number
          member_id?: number | null
          member_type?: Database["public"]["Enums"]["respondant_type"] | null
          parent_group_id?: number | null
        }
        Relationships: []
      }
      ROUND: {
        Row: {
          ended_at: string | null
          id: number
          respondant_id: number | null
          respondant_type: Database["public"]["Enums"]["respondant_type"] | null
          round_number: number | null
          started_at: string | null
          statement_id: number | null
          status: Database["public"]["Enums"]["round_status"] | null
        }
        Insert: {
          ended_at?: string | null
          id: number
          respondant_id?: number | null
          respondant_type?:
            | Database["public"]["Enums"]["respondant_type"]
            | null
          round_number?: number | null
          started_at?: string | null
          statement_id?: number | null
          status?: Database["public"]["Enums"]["round_status"] | null
        }
        Update: {
          ended_at?: string | null
          id?: number
          respondant_id?: number | null
          respondant_type?:
            | Database["public"]["Enums"]["respondant_type"]
            | null
          round_number?: number | null
          started_at?: string | null
          statement_id?: number | null
          status?: Database["public"]["Enums"]["round_status"] | null
        }
        Relationships: []
      }
      ROUND_GROUPS: {
        Row: {
          group_id: number | null
          id: number
          round_id: number | null
        }
        Insert: {
          group_id?: number | null
          id: number
          round_id?: number | null
        }
        Update: {
          group_id?: number | null
          id?: number
          round_id?: number | null
        }
        Relationships: []
      }
      SESSION: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: number
          name: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["session_status"] | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: number
          name?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: number
          name?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
        }
        Relationships: []
      }
      SESSION_USERS: {
        Row: {
          id: number
          name: string | null
          session_id: number | null
        }
        Insert: {
          id: number
          name?: string | null
          session_id?: number | null
        }
        Update: {
          id?: number
          name?: string | null
          session_id?: number | null
        }
        Relationships: []
      }
      STATEMENT: {
        Row: {
          description: string | null
          id: number
          session_id: number | null
          statement: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          session_id?: number | null
          statement?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          session_id?: number | null
          statement?: string | null
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
      respondant_type: "SESSION_USER" | "GROUP"
      round_status: "NOT_STARTED" | "STARTED" | "COMPLETED"
      session_status: "UNPUBLISHED" | "PUBLISHED" | "STARTED" | "ENDED"
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
