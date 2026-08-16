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
          id: string
          is_pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
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
          attempt_count: number
          channel: string
          correlation_id: string | null
          created_at: string
          delivery_status: Database['public']['Enums']['notification_delivery_status']
          error_code: string | null
          failure_reason: string | null
          id: string
          last_attempt_at: string | null
          lease_token: string | null
          locked_at: string | null
          locked_until: string | null
          next_attempt_at: string
          provider_message_id: string | null
          recipient_id: string
          sent_at: string | null
          shift_id: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Insert: {
          assignment_id?: string | null
          attempt_count?: number
          channel?: string
          correlation_id?: string | null
          created_at?: string
          delivery_status?: Database['public']['Enums']['notification_delivery_status']
          error_code?: string | null
          failure_reason?: string | null
          id?: string
          last_attempt_at?: string | null
          lease_token?: string | null
          locked_at?: string | null
          locked_until?: string | null
          next_attempt_at?: string
          provider_message_id?: string | null
          recipient_id: string
          sent_at?: string | null
          shift_id?: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Update: {
          assignment_id?: string | null
          attempt_count?: number
          channel?: string
          correlation_id?: string | null
          created_at?: string
          delivery_status?: Database['public']['Enums']['notification_delivery_status']
          error_code?: string | null
          failure_reason?: string | null
          id?: string
          last_attempt_at?: string | null
          lease_token?: string | null
          locked_at?: string | null
          locked_until?: string | null
          next_attempt_at?: string
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
          attendance_record_id: string | null
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
          attendance_record_id?: string | null
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
          attendance_record_id?: string | null
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
          hired_at: string
          hourly_wage: number
          id: string
          is_active: boolean
          name: string
          phone: string
          role: Database['public']['Enums']['app_role']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          hired_at: string
          hourly_wage?: number
          id: string
          is_active?: boolean
          name: string
          phone: string
          role?: Database['public']['Enums']['app_role']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          hired_at?: string
          hourly_wage?: number
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          role?: Database['public']['Enums']['app_role']
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          key_auth: string
          key_p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          key_auth: string
          key_p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          key_auth?: string
          key_p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      schedule_application_dates: {
        Row: {
          application_period_id: string
          created_at: string
          work_date: string
        }
        Insert: {
          application_period_id: string
          created_at?: string
          work_date: string
        }
        Update: {
          application_period_id?: string
          created_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_application_dates_application_period_id_fkey'
            columns: ['application_period_id']
            isOneToOne: false
            referencedRelation: 'schedule_application_periods'
            referencedColumns: ['id']
          },
        ]
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
          application_period_id: string
          cancelled_at: string | null
          created_at: string
          id: string
          status: Database['public']['Enums']['application_status']
          updated_at: string
          work_date: string
          worker_id: string
        }
        Insert: {
          application_period_id: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          status?: Database['public']['Enums']['application_status']
          updated_at?: string
          work_date: string
          worker_id: string
        }
        Update: {
          application_period_id?: string
          cancelled_at?: string | null
          created_at?: string
          id?: string
          status?: Database['public']['Enums']['application_status']
          updated_at?: string
          work_date?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_applications_application_period_id_fkey'
            columns: ['application_period_id']
            isOneToOne: false
            referencedRelation: 'schedule_application_periods'
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
          cancelled_by: string | null
          confirmed_at: string | null
          created_at: string
          hourly_wage_snapshot: number
          id: string
          is_training: boolean
          position_id: string
          shift_id: string
          slot_index: number
          status: Database['public']['Enums']['assignment_status']
          updated_at: string
          worker_id: string
        }
        Insert: {
          assigned_by: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          hourly_wage_snapshot: number
          id?: string
          is_training?: boolean
          position_id: string
          shift_id: string
          slot_index: number
          status?: Database['public']['Enums']['assignment_status']
          updated_at?: string
          worker_id: string
        }
        Update: {
          assigned_by?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string
          hourly_wage_snapshot?: number
          id?: string
          is_training?: boolean
          position_id?: string
          shift_id?: string
          slot_index?: number
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
            foreignKeyName: 'shift_assignments_cancelled_by_fkey'
            columns: ['cancelled_by']
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
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
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
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
            foreignKeyName: 'shifts_cancelled_by_fkey'
            columns: ['cancelled_by']
            isOneToOne: false
            referencedRelation: 'profiles'
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
          candidate_hired_at: string
          candidate_hourly_wage: number
          candidate_name: string
          candidate_position_ids: string[]
          target_worker_id: string
        }
        Returns: undefined
      }
      cancel_daily_schedule: {
        Args: {
          p_expected_shift_updated_at: string
          p_reason: string
          p_request_id: string
          p_shift_id: string
        }
        Returns: Json
      }
      cancel_schedule_application_period: {
        Args: {
          p_expected_updated_at: string
          p_period_id: string
          p_request_id: string
        }
        Returns: Json
      }
      check_signup_identity: {
        Args: {
          candidate_invite_code: string
          candidate_name: string
          candidate_phone: string
        }
        Returns: {
          is_invite_code_valid: boolean
          is_name_available: boolean
          is_phone_available: boolean
        }[]
      }
      claim_invite_code: {
        Args: { candidate_code: string }
        Returns: undefined
      }
      claim_pending_notifications: {
        Args: { p_batch_size?: number; p_lease_seconds?: number }
        Returns: Json
      }
      complete_notification: {
        Args: {
          p_lease_token: string
          p_notification_id: string
          p_provider_message_id: string
        }
        Returns: Json
      }
      create_invite_code: {
        Args: {
          p_code: string
          p_expires_at: string
          p_label: string
          p_max_uses: number
          p_request_id: string
        }
        Returns: Json
      }
      create_notice: {
        Args: {
          p_content: string
          p_is_pinned: boolean
          p_request_id: string
          p_title: string
        }
        Returns: Json
      }
      deactivate_invite_code: {
        Args: { p_invite_id: string; p_request_id: string }
        Returns: Json
      }
      deactivate_own_profile: { Args: never; Returns: undefined }
      delete_notice: {
        Args: {
          p_expected_updated_at: string
          p_notice_id: string
          p_request_id: string
        }
        Returns: Json
      }
      delete_push_subscription: {
        Args: { p_endpoint: string }
        Returns: undefined
      }
      get_active_profile_names: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      get_admin_month_schedule_workers: {
        Args: {
          p_month_end: string
          p_month_start: string
          p_previous_month_start: string
        }
        Returns: {
          applied_dates: string[]
          position_ids: string[]
          previous_position_ids: string[]
          worker_id: string
          worker_name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      mark_notice_read: {
        Args: { p_notice_id: string; p_request_id: string }
        Returns: Json
      }
      retry_or_fail_notification: {
        Args: {
          p_error_code: string
          p_failure_reason: string
          p_is_transient: boolean
          p_lease_token: string
          p_notification_id: string
        }
        Returns: Json
      }
      save_monthly_schedule_registration: {
        Args: {
          p_application_deadline: string
          p_expected_period_updated_at: string
          p_request_id: string
          p_schedules: Json
          p_year_month: string
        }
        Returns: Json
      }
      save_own_monthly_schedule_applications: {
        Args: {
          p_expected_period_updated_at: string
          p_period_id: string
          p_request_id: string
          p_selected_dates: string[]
        }
        Returns: Json
      }
      save_schedule_application_period: {
        Args: {
          p_application_deadline: string
          p_expected_updated_at: string
          p_period_id: string
          p_request_id: string
          p_year_month: string
        }
        Returns: Json
      }
      save_schedule_application_period_with_dates: {
        Args: {
          p_application_dates: string[]
          p_application_deadline: string
          p_expected_updated_at: string
          p_period_id: string
          p_request_id: string
          p_year_month: string
        }
        Returns: Json
      }
      set_schedule_application_period_status: {
        Args: {
          p_expected_updated_at: string
          p_next_status: Database['public']['Enums']['application_period_status']
          p_period_id: string
          p_request_id: string
        }
        Returns: Json
      }
      update_daily_schedule: {
        Args: {
          p_assignments: Json
          p_ceremony_count: number
          p_end_time: string
          p_expected_shift_updated_at: string
          p_request_id: string
          p_shift_id: string
          p_start_time: string
        }
        Returns: Json
      }
      update_notice: {
        Args: {
          p_content: string
          p_expected_updated_at: string
          p_is_pinned: boolean
          p_notice_id: string
          p_request_id: string
          p_title: string
        }
        Returns: Json
      }
      update_own_profile: {
        Args: { candidate_name: string; candidate_phone: string }
        Returns: undefined
      }
      upsert_push_subscription: {
        Args: { p_endpoint: string; p_key_auth: string; p_key_p256dh: string }
        Returns: string
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
