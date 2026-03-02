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
      agent_analytics: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          last_active_at: string | null
          request_count: number
          total_tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          last_active_at?: string | null
          request_count?: number
          total_tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          last_active_at?: string | null
          request_count?: number
          total_tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_analytics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_positions: {
        Row: {
          agent_id: string
          buy_tx_signature: string | null
          closed_at: string | null
          created_at: string
          entry_amount_sol: number
          entry_price: number
          exit_price: number | null
          id: string
          pnl_sol: number | null
          status: string
          token_address: string
          token_amount: number
          token_symbol: string
          user_id: string
        }
        Insert: {
          agent_id: string
          buy_tx_signature?: string | null
          closed_at?: string | null
          created_at?: string
          entry_amount_sol?: number
          entry_price?: number
          exit_price?: number | null
          id?: string
          pnl_sol?: number | null
          status?: string
          token_address: string
          token_amount?: number
          token_symbol: string
          user_id: string
        }
        Update: {
          agent_id?: string
          buy_tx_signature?: string | null
          closed_at?: string | null
          created_at?: string
          entry_amount_sol?: number
          entry_price?: number
          exit_price?: number | null
          id?: string
          pnl_sol?: number | null
          status?: string
          token_address?: string
          token_amount?: number
          token_symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_positions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_strategy_configs: {
        Row: {
          agent_id: string
          created_at: string
          entry_strategy: string
          exit_strategy: string
          id: string
          max_hold_minutes: number
          max_market_cap_usd: number
          max_open_positions: number
          max_pair_age_hours: number
          max_price_change_1h: number
          min_buy_sell_ratio: number
          min_liquidity_usd: number
          min_market_cap_usd: number
          min_price_change_1h: number
          min_volume_24h: number
          trade_amount_sol: number
          trailing_stop_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          entry_strategy?: string
          exit_strategy?: string
          id?: string
          max_hold_minutes?: number
          max_market_cap_usd?: number
          max_open_positions?: number
          max_pair_age_hours?: number
          max_price_change_1h?: number
          min_buy_sell_ratio?: number
          min_liquidity_usd?: number
          min_market_cap_usd?: number
          min_price_change_1h?: number
          min_volume_24h?: number
          trade_amount_sol?: number
          trailing_stop_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          entry_strategy?: string
          exit_strategy?: string
          id?: string
          max_hold_minutes?: number
          max_market_cap_usd?: number
          max_open_positions?: number
          max_pair_age_hours?: number
          max_price_change_1h?: number
          min_buy_sell_ratio?: number
          min_liquidity_usd?: number
          min_market_cap_usd?: number
          min_price_change_1h?: number
          min_volume_24h?: number
          trade_amount_sol?: number
          trailing_stop_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_wallets: {
        Row: {
          agent_id: string
          balance_sol: number
          created_at: string
          encrypted_private_key: string
          id: string
          public_key: string
          user_id: string
        }
        Insert: {
          agent_id: string
          balance_sol?: number
          created_at?: string
          encrypted_private_key: string
          id?: string
          public_key: string
          user_id: string
        }
        Update: {
          agent_id?: string
          balance_sol?: number
          created_at?: string
          encrypted_private_key?: string
          id?: string
          public_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_wallets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          category: string
          created_at: string
          id: string
          is_public: boolean
          model: string
          name: string
          status: string
          stop_loss_pct: number
          system_prompt: string | null
          take_profit_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_public?: boolean
          model?: string
          name: string
          status?: string
          stop_loss_pct?: number
          system_prompt?: string | null
          take_profit_pct?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_public?: boolean
          model?: string
          name?: string
          status?: string
          stop_loss_pct?: number
          system_prompt?: string | null
          take_profit_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pnl_snapshots: {
        Row: {
          agent_id: string
          id: string
          pnl_sol: number
          snapshot_at: string
          total_trades: number
          user_id: string
          win_rate: number | null
        }
        Insert: {
          agent_id: string
          id?: string
          pnl_sol?: number
          snapshot_at?: string
          total_trades?: number
          user_id: string
          win_rate?: number | null
        }
        Update: {
          agent_id?: string
          id?: string
          pnl_sol?: number
          snapshot_at?: string
          total_trades?: number
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pnl_snapshots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_history: {
        Row: {
          action: string
          agent_id: string
          amount_sol: number
          created_at: string
          id: string
          pnl_sol: number | null
          price: number
          signal: string | null
          token_address: string | null
          token_amount: number
          token_symbol: string
          tx_signature: string | null
          user_id: string
        }
        Insert: {
          action: string
          agent_id: string
          amount_sol?: number
          created_at?: string
          id?: string
          pnl_sol?: number | null
          price?: number
          signal?: string | null
          token_address?: string | null
          token_amount?: number
          token_symbol: string
          tx_signature?: string | null
          user_id: string
        }
        Update: {
          action?: string
          agent_id?: string
          amount_sol?: number
          created_at?: string
          id?: string
          pnl_sol?: number | null
          price?: number
          signal?: string | null
          token_address?: string | null
          token_amount?: number
          token_symbol?: string
          tx_signature?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
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
