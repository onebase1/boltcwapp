export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'manager' | 'staff' | 'admin'
          full_name: string
          phone: string | null
          email: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'manager' | 'staff' | 'admin'
          full_name: string
          phone?: string | null
          email: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'manager' | 'staff' | 'admin'
          full_name?: string
          phone?: string | null
          email?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      care_homes: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          geofence_radius: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          geofence_radius?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          geofence_radius?: number
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          care_home_id: string
          staff_id: string | null
          status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          start_time: string
          end_time: string
          check_in_time: string | null
          check_out_time: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          care_home_id: string
          staff_id?: string | null
          status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          start_time: string
          end_time: string
          check_in_time?: string | null
          check_out_time?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          care_home_id?: string
          staff_id?: string | null
          status?: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
          start_time?: string
          end_time?: string
          check_in_time?: string | null
          check_out_time?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shift_feedback: {
        Row: {
          id: string
          shift_id: string
          manager_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          manager_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          manager_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_shift_overlap: {
        Args: {
          p_staff_id: string
          p_start_time: string
          p_end_time: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'manager' | 'staff' | 'admin'
      shift_status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
    }
  }
}