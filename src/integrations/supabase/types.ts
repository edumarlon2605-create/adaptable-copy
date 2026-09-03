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
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      carta_modelos: {
        Row: {
          administradora: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          nome: string
          parcelas_totais: number
          percentual_administrativo: number
          updated_at: string
          valor_bem: number
        }
        Insert: {
          administradora?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome: string
          parcelas_totais: number
          percentual_administrativo?: number
          updated_at?: string
          valor_bem: number
        }
        Update: {
          administradora?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          parcelas_totais?: number
          percentual_administrativo?: number
          updated_at?: string
          valor_bem?: number
        }
        Relationships: []
      }
      carta_parcelas: {
        Row: {
          carta_id: string
          created_at: string
          id: string
          numero: number
          observacoes: string | null
          pago_em: string | null
          pago_por: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          carta_id: string
          created_at?: string
          id?: string
          numero: number
          observacoes?: string | null
          pago_em?: string | null
          pago_por?: string | null
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          carta_id?: string
          created_at?: string
          id?: string
          numero?: number
          observacoes?: string | null
          pago_em?: string | null
          pago_por?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "carta_parcelas_carta_id_fkey"
            columns: ["carta_id"]
            isOneToOne: false
            referencedRelation: "cartas"
            referencedColumns: ["id"]
          },
        ]
      }
      cartas: {
        Row: {
          administradora: string
          bem_especifico: string | null
          categoria: string | null
          cliente_id: string | null
          cota: string
          created_at: string
          credito_contemplacao: number | null
          credito_disponivel: number
          data_adesao: string | null
          data_contemplacao: string | null
          descricao: string | null
          dia_vencimento: number | null
          grupo: string
          id: string
          parcela: number | null
          parcelas_pagas: number
          parcelas_totais: number | null
          percentual_administrativo: number
          prazo: number | null
          previsao_encerramento: string | null
          primeiro_vencimento: string | null
          saldo_devedor: number | null
          situacao: string
          taxa_mensal: number
          updated_at: string
          valor: number | null
          valor_administrativo: number | null
          valor_bem: number | null
          valor_entrada: number | null
          valor_total: number | null
          valores_pagos: number
          versao: string | null
        }
        Insert: {
          administradora: string
          bem_especifico?: string | null
          categoria?: string | null
          cliente_id?: string | null
          cota: string
          created_at?: string
          credito_contemplacao?: number | null
          credito_disponivel?: number
          data_adesao?: string | null
          data_contemplacao?: string | null
          descricao?: string | null
          dia_vencimento?: number | null
          grupo: string
          id?: string
          parcela?: number | null
          parcelas_pagas?: number
          parcelas_totais?: number | null
          percentual_administrativo?: number
          prazo?: number | null
          previsao_encerramento?: string | null
          primeiro_vencimento?: string | null
          saldo_devedor?: number | null
          situacao?: string
          taxa_mensal?: number
          updated_at?: string
          valor?: number | null
          valor_administrativo?: number | null
          valor_bem?: number | null
          valor_entrada?: number | null
          valor_total?: number | null
          valores_pagos?: number
          versao?: string | null
        }
        Update: {
          administradora?: string
          bem_especifico?: string | null
          categoria?: string | null
          cliente_id?: string | null
          cota?: string
          created_at?: string
          credito_contemplacao?: number | null
          credito_disponivel?: number
          data_adesao?: string | null
          data_contemplacao?: string | null
          descricao?: string | null
          dia_vencimento?: number | null
          grupo?: string
          id?: string
          parcela?: number | null
          parcelas_pagas?: number
          parcelas_totais?: number | null
          percentual_administrativo?: number
          prazo?: number | null
          previsao_encerramento?: string | null
          primeiro_vencimento?: string | null
          saldo_devedor?: number | null
          situacao?: string
          taxa_mensal?: number
          updated_at?: string
          valor?: number | null
          valor_administrativo?: number | null
          valor_bem?: number | null
          valor_entrada?: number | null
          valor_total?: number | null
          valores_pagos?: number
          versao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cartas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number | null
          carta_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          event_type: string
          id: string
          installment_number: number | null
          notes: string | null
          payment_date: string | null
          status: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number | null
          carta_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          event_type: string
          id?: string
          installment_number?: number | null
          notes?: string | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number | null
          carta_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          event_type?: string
          id?: string
          installment_number?: number | null
          notes?: string | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_carta_id_fkey"
            columns: ["carta_id"]
            isOneToOne: false
            referencedRelation: "cartas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_proof_path: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          cnh_doc_path: string | null
          complement: string | null
          consultor_id: string | null
          consultor_user_id: string | null
          country: string | null
          cpf: string | null
          created_at: string
          email: string
          id: string
          marital_status: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          number: string | null
          phone: string | null
          profession: string | null
          rg: string | null
          rg_doc_path: string | null
          state: string | null
          status: string
          street: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          address_proof_path?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          cnh_doc_path?: string | null
          complement?: string | null
          consultor_id?: string | null
          consultor_user_id?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          marital_status?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          profession?: string | null
          rg?: string | null
          rg_doc_path?: string | null
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          address_proof_path?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          cnh_doc_path?: string | null
          complement?: string | null
          consultor_id?: string | null
          consultor_user_id?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          marital_status?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          phone?: string | null
          profession?: string | null
          rg?: string | null
          rg_doc_path?: string | null
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      simulacao_leads: {
        Row: {
          categoria: string
          cpf: string
          created_at: string
          credito: number
          email: string
          id: string
          nascimento: string | null
          nome: string
          observacoes: string | null
          parcela: number
          prazo: number
          status: string
          telefone: string
          updated_at: string
        }
        Insert: {
          categoria: string
          cpf: string
          created_at?: string
          credito: number
          email: string
          id?: string
          nascimento?: string | null
          nome: string
          observacoes?: string | null
          parcela: number
          prazo: number
          status?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          cpf?: string
          created_at?: string
          credito?: number
          email?: string
          id?: string
          nascimento?: string | null
          nome?: string
          observacoes?: string | null
          parcela?: number
          prazo?: number
          status?: string
          telefone?: string
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "consultor" | "cliente"
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
      app_role: ["admin", "consultor", "cliente"],
    },
  },
} as const
