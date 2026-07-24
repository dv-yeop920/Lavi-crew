export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          actual_ended_at: string | null
          actual_started_at: string | null
          assignment_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          corrected_at: string | null
          corrected_by: string | null
          correction_reason: string | null
          created_at: string
          id: string
          status: Database['public']['Enums']['attendance_status']
          updated_at: string
        }
        Insert: {
          actual_ended_at?: string | null
          actual_started_at?: string | null
          assignment_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string
          id?: string
          status?: Database['public']['Enums']['attendance_status']
          updated_at?: string
        }
        Update: {
          actual_ended_at?: string | null
          actual_started_at?: string | null
          assignment_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string
          id?: string
          status?: Database['public']['Enums']['attendance_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_records_assignment_id_fkey'
            columns: ['assignment_id']
            isOneToOne: true
            referencedRelation: 'shift_assignments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_records_confirmed_by_fkey'
            columns: ['confirmed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_records_corrected_by_fkey'
            columns: ['corrected_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          label: string
          max_uses: number
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          is_active?: boolean
          label?: string
          max_uses: number
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          label?: string
          max_uses?: number
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'invite_codes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      monthly_payrolls: {
        Row: {
          created_at: string
          id: string
          status: Database['public']['Enums']['payroll_status']
          total_amount: number
          updated_at: string
          worker_id: string
          year_month: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database['public']['Enums']['payroll_status']
          total_amount?: number
          updated_at?: string
          worker_id: string
          year_month: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database['public']['Enums']['payroll_status']
          total_amount?: number
          updated_at?: string
          worker_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: 'monthly_payrolls_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notice_reads: {
        Row: {
          notice_id: string
          read_at: string
          worker_id: string
        }
        Insert: {
          notice_id: string
          read_at?: string
          worker_id: string
        }
        Update: {
          notice_id?: string
          read_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notice_reads_notice_id_fkey'
            columns: ['notice_id']
            isOneToOne: false
            referencedRelation: 'notices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notice_reads_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notices: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_pinned: boolean
          status: Database['public']['Enums']['notice_status']
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          status?: Database['public']['Enums']['notice_status']
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_pinned?: boolean
          status?: Database['public']['Enums']['notice_status']
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notices_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notification_logs: {
        Row: {
          assignment_id: string | null
          channel: string
          created_at: string
          delivery_status: Database['public']['Enums']['notification_delivery_status']
          failure_reason: string | null
          id: string
          provider_message_id: string | null
          recipient_id: string
          sent_at: string | null
          shift_id: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Insert: {
          assignment_id?: string | null
          channel?: string
          created_at?: string
          delivery_status?: Database['public']['Enums']['notification_delivery_status']
          failure_reason?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_id: string
          sent_at?: string | null
          shift_id?: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Update: {
          assignment_id?: string | null
          channel?: string
          created_at?: string
          delivery_status?: Database['public']['Enums']['notification_delivery_status']
          failure_reason?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_id?: string
          sent_at?: string | null
          shift_id?: string | null
          type?: Database['public']['Enums']['notification_type']
        }
        Relationships: [
          {
            foreignKeyName: 'notification_logs_assignment_id_fkey'
            columns: ['assignment_id']
            isOneToOne: false
            referencedRelation: 'shift_assignments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_logs_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_logs_shift_id_fkey'
            columns: ['shift_id']
            isOneToOne: false
            referencedRelation: 'shifts'
            referencedColumns: ['id']
          },
        ]
      }
      payroll_items: {
        Row: {
          amount: number
          assignment_id: string
          attendance_record_id: string
          created_at: string
          id: string
          overtime_minutes: number
          payroll_id: string
          regular_minutes: number
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          assignment_id: string
          attendance_record_id: string
          created_at?: string
          id?: string
          overtime_minutes: number
          payroll_id: string
          regular_minutes: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          assignment_id?: string
          attendance_record_id?: string
          created_at?: string
          id?: string
          overtime_minutes?: number
          payroll_id?: string
          regular_minutes?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payroll_items_assignment_id_fkey'
            columns: ['assignment_id']
            isOneToOne: false
            referencedRelation: 'shift_assignments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payroll_items_attendance_record_id_fkey'
            columns: ['attendance_record_id']
            isOneToOne: false
            referencedRelation: 'attendance_records'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payroll_items_payroll_id_fkey'
            columns: ['payroll_id']
            isOneToOne: false
            referencedRelation: 'monthly_payrolls'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payroll_items_voided_by_fkey'
            columns: ['voided_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      positions: {
        Row: {
          default_assignee_count: number
          id: string
          name: string
        }
        Insert: {
          default_assignee_count: number
          id: string
          name: string
        }
        Update: {
          default_assignee_count?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          hourly_wage: number
          id: string
          is_active: boolean
          kakao_consent: boolean
          name: string
          phone: string
          role: Database['public']['Enums']['app_role']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          hourly_wage?: number
          id: string
          is_active?: boolean
          kakao_consent?: boolean
          name: string
          phone: string
          role?: Database['public']['Enums']['app_role']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          hourly_wage?: number
          id?: string
          is_active?: boolean
          kakao_consent?: boolean
          name?: string
          phone?: string
          role?: Database['public']['Enums']['app_role']
          updated_at?: string
        }
        Relationships: []
      }
      schedule_application_periods: {
        Row: {
          application_deadline: string
          closed_at: string | null
          created_at: string
          id: string
          managed_by: string
          status: Database['public']['Enums']['application_period_status']
          updated_at: string
          year_month: string
        }
        Insert: {
          application_deadline: string
          closed_at?: string | null
          created_at?: string
          id?: string
          managed_by: string
          status?: Database['public']['Enums']['application_period_status']
          updated_at?: string
          year_month: string
        }
        Update: {
          application_deadline?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          managed_by?: string
          status?: Database['public']['Enums']['application_period_status']
          updated_at?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_application_periods_managed_by_fkey'
            columns: ['managed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      schedule_applications: {
        Row: {
          cancelled_at: string | null
          created_at: string
          id: string
          shift_id: string
          status: Database['public']['Enums']['application_status']
          updated_at: string
          worker_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          shift_id: string
          status?: Database['public']['Enums']['application_status']
          updated_at?: string
          worker_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          shift_id?: string
          status?: Database['public']['Enums']['application_status']
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_applications_shift_id_fkey'
            columns: ['shift_id']
            isOneToOne: false
            referencedRelation: 'shifts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schedule_applications_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      shift_assignments: {
        Row: {
          assigned_by: string
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          hourly_wage_snapshot: number
          id: string
          is_training: boolean
          position_id: string
          shift_id: string
          status: Database['public']['Enums']['assignment_status']
          updated_at: string
          worker_id: string
        }
        Insert: {
          assigned_by: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          hourly_wage_snapshot: number
          id?: string
          is_training?: boolean
          position_id: string
          shift_id: string
          status?: Database['public']['Enums']['assignment_status']
          updated_at?: string
          worker_id: string
        }
        Update: {
          assigned_by?: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          hourly_wage_snapshot?: number
          id?: string
          is_training?: boolean
          position_id?: string
          shift_id?: string
          status?: Database['public']['Enums']['assignment_status']
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shift_assignments_assigned_by_fkey'
            columns: ['assigned_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shift_assignments_position_id_fkey'
            columns: ['position_id']
            isOneToOne: false
            referencedRelation: 'positions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shift_assignments_shift_id_fkey'
            columns: ['shift_id']
            isOneToOne: false
            referencedRelation: 'shifts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shift_assignments_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      shifts: {
        Row: {
          application_period_id: string
          ceremony_count: number
          created_at: string
          created_by: string
          end_time: string
          id: string
          start_time: string
          status: Database['public']['Enums']['shift_status']
          updated_at: string
          work_date: string
        }
        Insert: {
          application_period_id: string
          ceremony_count: number
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          start_time: string
          status?: Database['public']['Enums']['shift_status']
          updated_at?: string
          work_date: string
        }
        Update: {
          application_period_id?: string
          ceremony_count?: number
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: Database['public']['Enums']['shift_status']
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shifts_application_period_id_fkey'
            columns: ['application_period_id']
            isOneToOne: false
            referencedRelation: 'schedule_application_periods'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shifts_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      worker_position_skills: {
        Row: {
          assigned_by: string
          created_at: string
          position_id: string
          worker_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          position_id: string
          worker_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          position_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'worker_position_skills_assigned_by_fkey'
            columns: ['assigned_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'worker_position_skills_position_id_fkey'
            columns: ['position_id']
            isOneToOne: false
            referencedRelation: 'positions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'worker_position_skills_worker_id_fkey'
            columns: ['worker_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_deactivate_worker: {
        Args: { target_worker_id: string }
        Returns: undefined
      }
      admin_update_worker_profile: {
        Args: {
          candidate_hourly_wage: number
          candidate_name: string
          candidate_position_ids: string[]
          target_worker_id: string
        }
        Returns: undefined
      }
      cancel_own_schedule_application: {
        Args: { application_id: string }
        Returns: undefined
      }
      claim_invite_code: {
        Args: { candidate_code: string }
        Returns: undefined
      }
      close_application_period: {
        Args: { period_id: string }
        Returns: undefined
      }
      complete_worker_onboarding: {
        Args: {
          candidate_invite_code: string
          candidate_name: string
          candidate_phone: string
          consent: boolean
        }
        Returns: undefined
      }
      confirm_attendance_and_payroll: {
        Args: {
          actual_end?: string
          actual_start?: string
          correction_note?: string
          next_status: Database['public']['Enums']['attendance_status']
          record_id: string
        }
        Returns: undefined
      }
      deactivate_own_profile: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      update_own_profile: {
        Args: {
          candidate_name: string
          candidate_phone: string
          consent: boolean
        }
        Returns: undefined
      }
      validate_invite_code: {
        Args: { candidate_code: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'worker' | 'admin'
      application_period_status: 'open' | 'closed'
      application_status: 'applied' | 'cancelled'
      assignment_status: 'draft' | 'confirmed' | 'cancelled'
      attendance_status: 'pending' | 'present' | 'absent'
      notice_status: 'published' | 'deleted'
      notification_delivery_status: 'pending' | 'sent' | 'failed'
      notification_type: 'schedule_confirmed' | 'schedule_changed' | 'schedule_cancelled'
      payroll_status: 'calculated' | 'closed'
      shift_status: 'draft' | 'published' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ['worker', 'admin'],
      application_period_status: ['open', 'closed'],
      application_status: ['applied', 'cancelled'],
      assignment_status: ['draft', 'confirmed', 'cancelled'],
      attendance_status: ['pending', 'present', 'absent'],
      notice_status: ['published', 'deleted'],
      notification_delivery_status: ['pending', 'sent', 'failed'],
      notification_type: ['schedule_confirmed', 'schedule_changed', 'schedule_cancelled'],
      payroll_status: ['calculated', 'closed'],
      shift_status: ['draft', 'published', 'cancelled'],
    },
  },
} as const
