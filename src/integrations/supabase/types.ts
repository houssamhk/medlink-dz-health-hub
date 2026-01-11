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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_learning_data: {
        Row: {
          created_at: string
          diagnosis_given: string | null
          doctor_specialty_id: string | null
          evaluation_id: string
          id: string
          is_verified: boolean | null
          lab_values: Json | null
          patient_age: number | null
          patient_gender: string | null
          symptoms: string[] | null
          urgency_given: string
        }
        Insert: {
          created_at?: string
          diagnosis_given?: string | null
          doctor_specialty_id?: string | null
          evaluation_id: string
          id?: string
          is_verified?: boolean | null
          lab_values?: Json | null
          patient_age?: number | null
          patient_gender?: string | null
          symptoms?: string[] | null
          urgency_given: string
        }
        Update: {
          created_at?: string
          diagnosis_given?: string | null
          doctor_specialty_id?: string | null
          evaluation_id?: string
          id?: string
          is_verified?: boolean | null
          lab_values?: Json | null
          patient_age?: number | null
          patient_gender?: string | null
          symptoms?: string[] | null
          urgency_given?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_data_doctor_specialty_id_fkey"
            columns: ["doctor_specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_learning_data_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "doctor_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_triage_sessions: {
        Row: {
          ai_response: string | null
          created_at: string | null
          id: string
          recommended_specialty_id: string | null
          symptoms: string[]
          urgency_level: string | null
          user_id: string | null
        }
        Insert: {
          ai_response?: string | null
          created_at?: string | null
          id?: string
          recommended_specialty_id?: string | null
          symptoms: string[]
          urgency_level?: string | null
          user_id?: string | null
        }
        Update: {
          ai_response?: string | null
          created_at?: string | null
          id?: string
          recommended_specialty_id?: string | null
          symptoms?: string[]
          urgency_level?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_triage_sessions_recommended_specialty_id_fkey"
            columns: ["recommended_specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string | null
          doctor_id: string
          id: string
          is_telemedicine: boolean | null
          notes: string | null
          patient_id: string
          reason: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string | null
          doctor_id: string
          id?: string
          is_telemedicine?: boolean | null
          notes?: string | null
          patient_id: string
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_telemedicine?: boolean | null
          notes?: string | null
          patient_id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_capacity: {
        Row: {
          available_beds: number | null
          available_rooms: number | null
          clinic_id: string
          created_at: string
          date: string
          id: string
          total_beds: number | null
          total_rooms: number | null
          updated_at: string
        }
        Insert: {
          available_beds?: number | null
          available_rooms?: number | null
          clinic_id: string
          created_at?: string
          date?: string
          id?: string
          total_beds?: number | null
          total_rooms?: number | null
          updated_at?: string
        }
        Update: {
          available_beds?: number | null
          available_rooms?: number | null
          clinic_id?: string
          created_at?: string
          date?: string
          id?: string
          total_beds?: number | null
          total_rooms?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_capacity_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          bio: string | null
          consultation_price: number | null
          created_at: string | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          specialty_id: string | null
          updated_at: string | null
          user_id: string
          wilaya: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          consultation_price?: number | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          specialty_id?: string | null
          updated_at?: string | null
          user_id: string
          wilaya?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          consultation_price?: number | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          specialty_id?: string | null
          updated_at?: string | null
          user_id?: string
          wilaya?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_capacity: {
        Row: {
          created_at: string
          current_appointments: number
          current_file_reviews: number
          date: string
          doctor_id: string
          id: string
          max_appointments: number
          max_file_reviews: number
        }
        Insert: {
          created_at?: string
          current_appointments?: number
          current_file_reviews?: number
          date: string
          doctor_id: string
          id?: string
          max_appointments?: number
          max_file_reviews?: number
        }
        Update: {
          created_at?: string
          current_appointments?: number
          current_file_reviews?: number
          date?: string
          doctor_id?: string
          id?: string
          max_appointments?: number
          max_file_reviews?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_capacity_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_capacity_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_capacity_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_evaluations: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string
          id: string
          medical_record_id: string
          notes: string | null
          recommendations: string[] | null
          urgency_level: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          id?: string
          medical_record_id: string
          notes?: string | null
          recommendations?: string[] | null
          urgency_level: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          medical_record_id?: string
          notes?: string | null
          recommendations?: string[] | null
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_evaluations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_evaluations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_evaluations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_evaluations_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          accepts_insurance: boolean | null
          bio: string | null
          clinic_address: string | null
          clinic_name: string | null
          consultation_price: number | null
          created_at: string | null
          experience_years: number | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          license_number: string | null
          rating: number | null
          specialty_id: string | null
          telemedicine_enabled: boolean | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          wilaya: string
          working_hours: Json | null
        }
        Insert: {
          accepts_insurance?: boolean | null
          bio?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_price?: number | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          rating?: number | null
          specialty_id?: string | null
          telemedicine_enabled?: boolean | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          wilaya: string
          working_hours?: Json | null
        }
        Update: {
          accepts_insurance?: boolean | null
          bio?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          consultation_price?: number | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          rating?: number | null
          specialty_id?: string | null
          telemedicine_enabled?: boolean | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          wilaya?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_requests: {
        Row: {
          created_at: string
          description: string | null
          emergency_type: string
          id: string
          latitude: number
          longitude: number
          responded_at: string | null
          responder_notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emergency_type: string
          id?: string
          latitude: number
          longitude: number
          responded_at?: string | null
          responder_notes?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emergency_type?: string
          id?: string
          latitude?: number
          longitude?: number
          responded_at?: string | null
          responder_notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          can_book_appointments: boolean | null
          chronic_conditions: string[] | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          id: string
          member_name: string
          primary_user_id: string
          relationship: string
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          can_book_appointments?: boolean | null
          chronic_conditions?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          member_name: string
          primary_user_id: string
          relationship: string
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          can_book_appointments?: boolean | null
          chronic_conditions?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          member_name?: string
          primary_user_id?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          ai_analysis: string | null
          ai_recommendations: string[] | null
          analyzed_at: string | null
          appointment_id: string | null
          assigned_doctor_id: string | null
          barcode: string | null
          created_at: string | null
          data: Json | null
          description: string | null
          doctor_id: string | null
          file_url: string | null
          id: string
          lab_id: string | null
          patient_id: string
          record_type: Database["public"]["Enums"]["record_type"]
          review_status: string | null
          title: string
          urgency_level: string | null
        }
        Insert: {
          ai_analysis?: string | null
          ai_recommendations?: string[] | null
          analyzed_at?: string | null
          appointment_id?: string | null
          assigned_doctor_id?: string | null
          barcode?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          doctor_id?: string | null
          file_url?: string | null
          id?: string
          lab_id?: string | null
          patient_id: string
          record_type: Database["public"]["Enums"]["record_type"]
          review_status?: string | null
          title: string
          urgency_level?: string | null
        }
        Update: {
          ai_analysis?: string | null
          ai_recommendations?: string[] | null
          analyzed_at?: string | null
          appointment_id?: string | null
          assigned_doctor_id?: string | null
          barcode?: string | null
          created_at?: string | null
          data?: Json | null
          description?: string | null
          doctor_id?: string | null
          file_url?: string | null
          id?: string
          lab_id?: string | null
          patient_id?: string
          record_type?: Database["public"]["Enums"]["record_type"]
          review_status?: string | null
          title?: string
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_assigned_doctor_id_fkey"
            columns: ["assigned_doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          appointment_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          appointment_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          appointment_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          phone_number: string | null
          related_id: string | null
          related_type: string | null
          sms_sent: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          phone_number?: string | null
          related_id?: string | null
          related_type?: string | null
          sms_sent?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          phone_number?: string | null
          related_id?: string | null
          related_type?: string | null
          sms_sent?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string
          clinic_latitude: number | null
          clinic_longitude: number | null
          created_at: string | null
          duty_date: string | null
          id: string
          is_on_duty: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
          wilaya: string
        }
        Insert: {
          address: string
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          created_at?: string | null
          duty_date?: string | null
          id?: string
          is_on_duty?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          wilaya: string
        }
        Update: {
          address?: string
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          created_at?: string | null
          duty_date?: string | null
          id?: string
          is_on_duty?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          wilaya?: string
        }
        Relationships: []
      }
      pharmacy_inventory: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          medication_name: string
          min_quantity: number | null
          pharmacy_id: string
          price: number | null
          quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          medication_name: string
          min_quantity?: number | null
          pharmacy_id: string
          price?: number | null
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          medication_name?: string
          min_quantity?: number | null
          pharmacy_id?: string
          price?: number | null
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          id: string
          medications: Json
          notes: string | null
          patient_id: string
          pharmacy_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          id?: string
          medications?: Json
          notes?: string | null
          patient_id: string
          pharmacy_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          id?: string
          medications?: Json
          notes?: string | null
          patient_id?: string
          pharmacy_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string[] | null
          avatar_url: string | null
          blood_type: string | null
          chronic_conditions: string[] | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          updated_at: string | null
          wilaya: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          wilaya?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          wilaya?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          doctor_id: string
          id: string
          patient_id: string
          rating: number
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          doctor_id: string
          id?: string
          patient_id: string
          rating: number
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          patient_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name_ar: string
          name_fr: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name_ar: string
          name_fr: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name_ar?: string
          name_fr?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      telemedicine_sessions: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_id: string
          ended_at: string | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_at: string
          session_token: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_id: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_at: string
          session_token?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_id?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          session_token?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      doctors_full: {
        Row: {
          accepts_insurance: boolean | null
          avatar_url: string | null
          bio: string | null
          clinic_address: string | null
          clinic_name: string | null
          consultation_price: number | null
          created_at: string | null
          experience_years: number | null
          full_name: string | null
          id: string | null
          is_available: boolean | null
          is_verified: boolean | null
          license_number: string | null
          rating: number | null
          specialty_id: string | null
          specialty_name_ar: string | null
          specialty_name_fr: string | null
          telemedicine_enabled: boolean | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          wilaya: string | null
          working_hours: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors_public: {
        Row: {
          clinic_name: string | null
          full_name: string | null
          id: string | null
          is_available: boolean | null
          rating: number | null
          specialty_id: string | null
          specialty_name_ar: string | null
          specialty_name_fr: string | null
          telemedicine_enabled: boolean | null
          total_reviews: number | null
          wilaya: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_basic_info: {
        Row: {
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          wilaya: string | null
        }
        Insert: {
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          wilaya?: string | null
        }
        Update: {
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          wilaya?: string | null
        }
        Relationships: []
      }
      pharmacies_full: {
        Row: {
          address: string | null
          clinic_latitude: number | null
          clinic_longitude: number | null
          created_at: string | null
          duty_date: string | null
          id: string | null
          is_on_duty: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          opening_hours: Json | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
          wilaya: string | null
        }
        Insert: {
          address?: string | null
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          created_at?: string | null
          duty_date?: string | null
          id?: string | null
          is_on_duty?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          opening_hours?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          wilaya?: string | null
        }
        Update: {
          address?: string | null
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          created_at?: string | null
          duty_date?: string | null
          id?: string | null
          is_on_duty?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          opening_hours?: Json | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
          wilaya?: string | null
        }
        Relationships: []
      }
      pharmacies_public: {
        Row: {
          duty_date: string | null
          id: string | null
          is_on_duty: boolean | null
          name: string | null
          wilaya: string | null
        }
        Insert: {
          duty_date?: string | null
          id?: string | null
          is_on_duty?: boolean | null
          name?: string | null
          wilaya?: string | null
        }
        Update: {
          duty_date?: string | null
          id?: string | null
          is_on_duty?: boolean | null
          name?: string | null
          wilaya?: string | null
        }
        Relationships: []
      }
      pharmacy_inventory_public: {
        Row: {
          id: string | null
          in_stock: boolean | null
          medication_name: string | null
          pharmacy_id: string | null
          pharmacy_name: string | null
          wilaya: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stats: {
        Row: {
          completed_appointments: number | null
          total_appointments: number | null
          total_pharmacies: number | null
          total_records: number | null
          total_users: number | null
          verified_doctors: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "patient" | "doctor" | "pharmacist" | "lab_admin" | "admin"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      record_type:
        | "prescription"
        | "lab_result"
        | "imaging"
        | "consultation"
        | "other"
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
    Enums: {
      app_role: ["patient", "doctor", "pharmacist", "lab_admin", "admin"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      record_type: [
        "prescription",
        "lab_result",
        "imaging",
        "consultation",
        "other",
      ],
    },
  },
} as const
