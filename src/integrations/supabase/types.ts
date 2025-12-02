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
      advice_tracking: {
        Row: {
          advice_text: string
          advice_type: string | null
          candidate_id: string | null
          created_at: string | null
          followed_through: boolean | null
          id: string
          responded_at: string | null
          response: string | null
          user_id: string
        }
        Insert: {
          advice_text: string
          advice_type?: string | null
          candidate_id?: string | null
          created_at?: string | null
          followed_through?: boolean | null
          id?: string
          responded_at?: string | null
          response?: string | null
          user_id: string
        }
        Update: {
          advice_text?: string
          advice_type?: string | null
          candidate_id?: string | null
          created_at?: string | null
          followed_through?: boolean | null
          id?: string
          responded_at?: string | null
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advice_tracking_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_patterns: {
        Row: {
          acknowledged: boolean | null
          candidate_id: string
          details: Json | null
          detected_at: string | null
          id: string
          pattern_type: string
          severity: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          candidate_id: string
          details?: Json | null
          detected_at?: string | null
          id?: string
          pattern_type: string
          severity?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          candidate_id?: string
          details?: Json | null
          detected_at?: string | null
          id?: string
          pattern_type?: string
          severity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_patterns_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          age: number | null
          ai_description: string | null
          city: string | null
          compatibility_score: number | null
          country: string | null
          created_at: string | null
          distance_approximation: string | null
          end_reason: string | null
          energy_match: number | null
          first_contact_date: string | null
          first_intimacy_date: string | null
          gender_identity: Database["public"]["Enums"]["gender_identity"] | null
          green_flags: Json | null
          height: string | null
          humor_compatibility: number | null
          id: string
          intellectual_connection: number | null
          last_score_update: string | null
          met_app: string | null
          met_via: string | null
          nickname: string
          no_contact_active: boolean | null
          no_contact_day: number | null
          no_contact_start_date: string | null
          notes: string | null
          overall_chemistry: number | null
          photo_url: string | null
          physical_attraction: number | null
          pronouns: Database["public"]["Enums"]["pronouns"] | null
          red_flags: Json | null
          relationship_ended_at: string | null
          score_breakdown: Json | null
          status: Database["public"]["Enums"]["candidate_status"] | null
          their_ambition_level: number | null
          their_attachment_style:
            | Database["public"]["Enums"]["attachment_style"]
            | null
          their_career_stage: string | null
          their_drinking: string | null
          their_education_level: string | null
          their_exercise: string | null
          their_in_therapy: string | null
          their_kids_desire: Database["public"]["Enums"]["kids_desire"] | null
          their_kids_status: Database["public"]["Enums"]["kids_status"] | null
          their_mental_health_awareness: string | null
          their_neurodivergence_types: Json | null
          their_neurodivergent: string | null
          their_politics: Database["public"]["Enums"]["politics"] | null
          their_relationship_goal:
            | Database["public"]["Enums"]["relationship_goal"]
            | null
          their_relationship_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          their_religion: Database["public"]["Enums"]["religion"] | null
          their_schedule_flexibility: string | null
          their_smoking: string | null
          their_social_style: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          ai_description?: string | null
          city?: string | null
          compatibility_score?: number | null
          country?: string | null
          created_at?: string | null
          distance_approximation?: string | null
          end_reason?: string | null
          energy_match?: number | null
          first_contact_date?: string | null
          first_intimacy_date?: string | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          green_flags?: Json | null
          height?: string | null
          humor_compatibility?: number | null
          id?: string
          intellectual_connection?: number | null
          last_score_update?: string | null
          met_app?: string | null
          met_via?: string | null
          nickname: string
          no_contact_active?: boolean | null
          no_contact_day?: number | null
          no_contact_start_date?: string | null
          notes?: string | null
          overall_chemistry?: number | null
          photo_url?: string | null
          physical_attraction?: number | null
          pronouns?: Database["public"]["Enums"]["pronouns"] | null
          red_flags?: Json | null
          relationship_ended_at?: string | null
          score_breakdown?: Json | null
          status?: Database["public"]["Enums"]["candidate_status"] | null
          their_ambition_level?: number | null
          their_attachment_style?:
            | Database["public"]["Enums"]["attachment_style"]
            | null
          their_career_stage?: string | null
          their_drinking?: string | null
          their_education_level?: string | null
          their_exercise?: string | null
          their_in_therapy?: string | null
          their_kids_desire?: Database["public"]["Enums"]["kids_desire"] | null
          their_kids_status?: Database["public"]["Enums"]["kids_status"] | null
          their_mental_health_awareness?: string | null
          their_neurodivergence_types?: Json | null
          their_neurodivergent?: string | null
          their_politics?: Database["public"]["Enums"]["politics"] | null
          their_relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal"]
            | null
          their_relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          their_religion?: Database["public"]["Enums"]["religion"] | null
          their_schedule_flexibility?: string | null
          their_smoking?: string | null
          their_social_style?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          ai_description?: string | null
          city?: string | null
          compatibility_score?: number | null
          country?: string | null
          created_at?: string | null
          distance_approximation?: string | null
          end_reason?: string | null
          energy_match?: number | null
          first_contact_date?: string | null
          first_intimacy_date?: string | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          green_flags?: Json | null
          height?: string | null
          humor_compatibility?: number | null
          id?: string
          intellectual_connection?: number | null
          last_score_update?: string | null
          met_app?: string | null
          met_via?: string | null
          nickname?: string
          no_contact_active?: boolean | null
          no_contact_day?: number | null
          no_contact_start_date?: string | null
          notes?: string | null
          overall_chemistry?: number | null
          photo_url?: string | null
          physical_attraction?: number | null
          pronouns?: Database["public"]["Enums"]["pronouns"] | null
          red_flags?: Json | null
          relationship_ended_at?: string | null
          score_breakdown?: Json | null
          status?: Database["public"]["Enums"]["candidate_status"] | null
          their_ambition_level?: number | null
          their_attachment_style?:
            | Database["public"]["Enums"]["attachment_style"]
            | null
          their_career_stage?: string | null
          their_drinking?: string | null
          their_education_level?: string | null
          their_exercise?: string | null
          their_in_therapy?: string | null
          their_kids_desire?: Database["public"]["Enums"]["kids_desire"] | null
          their_kids_status?: Database["public"]["Enums"]["kids_status"] | null
          their_mental_health_awareness?: string | null
          their_neurodivergence_types?: Json | null
          their_neurodivergent?: string | null
          their_politics?: Database["public"]["Enums"]["politics"] | null
          their_relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal"]
            | null
          their_relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          their_religion?: Database["public"]["Enums"]["religion"] | null
          their_schedule_flexibility?: string | null
          their_smoking?: string | null
          their_social_style?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          ai_analysis: Json | null
          candidate_id: string
          created_at: string | null
          duration: string | null
          gut_feeling: string | null
          id: string
          interaction_date: string | null
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          notes: string | null
          overall_feeling: number | null
          user_id: string
          who_initiated: string | null
          who_paid: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          candidate_id: string
          created_at?: string | null
          duration?: string | null
          gut_feeling?: string | null
          id?: string
          interaction_date?: string | null
          interaction_type: Database["public"]["Enums"]["interaction_type"]
          notes?: string | null
          overall_feeling?: number | null
          user_id: string
          who_initiated?: string | null
          who_paid?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          candidate_id?: string
          created_at?: string | null
          duration?: string | null
          gut_feeling?: string | null
          id?: string
          interaction_date?: string | null
          interaction_type?: Database["public"]["Enums"]["interaction_type"]
          notes?: string | null
          overall_feeling?: number | null
          user_id?: string
          who_initiated?: string | null
          who_paid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interactions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      no_contact_progress: {
        Row: {
          broke_nc: boolean | null
          candidate_id: string
          created_at: string | null
          day_number: number
          hoover_attempt: boolean | null
          id: string
          message_sent: boolean | null
          user_id: string
        }
        Insert: {
          broke_nc?: boolean | null
          candidate_id: string
          created_at?: string | null
          day_number: number
          hoover_attempt?: boolean | null
          id?: string
          message_sent?: boolean | null
          user_id: string
        }
        Update: {
          broke_nc?: boolean | null
          candidate_id?: string
          created_at?: string | null
          day_number?: number
          hoover_attempt?: boolean | null
          id?: string
          message_sent?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "no_contact_progress_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          ambition_level: number | null
          attachment_style:
            | Database["public"]["Enums"]["attachment_style"]
            | null
          attraction_importance: number | null
          behavioral_monitoring: number | null
          birth_date: string | null
          body_type: string | null
          boundary_strength: number | null
          career_stage: string | null
          chemistry_factors: Json | null
          city: string | null
          communication_style:
            | Database["public"]["Enums"]["communication_style"]
            | null
          conflict_style: string | null
          country: string | null
          created_at: string | null
          custom_pronouns: string | null
          cycle_length: number | null
          cycle_regularity:
            | Database["public"]["Enums"]["cycle_regularity"]
            | null
          dating_history_text: string | null
          dating_motivation: string[] | null
          dating_patterns: Json | null
          dealbreakers: Json | null
          distance_preference: string | null
          education_level: string | null
          education_matters: boolean | null
          exclusivity_before_intimacy: boolean | null
          faith_importance: number | null
          faith_requirements: Json | null
          financial_importance: number | null
          financial_situation: string | null
          financial_vulnerability: number | null
          flexibility_rating: number | null
          gender_identity: Database["public"]["Enums"]["gender_identity"] | null
          height: string | null
          height_preference: string | null
          hormone_profile: string | null
          id: string
          in_therapy: boolean | null
          income_range: string | null
          interested_in: string[] | null
          intimacy_comfort: string | null
          is_neurodivergent: string | null
          is_trans: boolean | null
          kids_desire: Database["public"]["Enums"]["kids_desire"] | null
          kids_status: Database["public"]["Enums"]["kids_status"] | null
          kids_timeline: string | null
          last_period_date: string | null
          lgbtq_connection: number | null
          living_situation: string | null
          location: string | null
          longest_relationship: string | null
          love_bombing_sensitivity: number | null
          love_languages: Json | null
          marriage_before_kids: boolean | null
          match_specificity: number | null
          mental_health_importance: number | null
          mental_health_openness: string | null
          monogamy_required: boolean | null
          name: string | null
          neurodivergence_types: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          open_to_moving: boolean | null
          open_to_single_parenthood: boolean | null
          orientation_custom: string | null
          pattern_recognition: Json | null
          political_dealbreakers: Json | null
          politics: Database["public"]["Enums"]["politics"] | null
          politics_importance: number | null
          post_intimacy_tendency: string | null
          preferred_age_max: number | null
          preferred_age_min: number | null
          preferred_education_level: string | null
          preferred_income_range: string | null
          pronouns: Database["public"]["Enums"]["pronouns"] | null
          red_flag_sensitivity: number | null
          relationship_goal:
            | Database["public"]["Enums"]["relationship_goal"]
            | null
          relationship_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          relationship_structure:
            | Database["public"]["Enums"]["relationship_structure"]
            | null
          religion: Database["public"]["Enums"]["religion"] | null
          religion_practice_level: string | null
          response_time_preference: number | null
          safety_priorities: Json | null
          safety_requirements: Json | null
          schedule_flexibility: string | null
          sexual_orientation:
            | Database["public"]["Enums"]["sexual_orientation"]
            | null
          social_style: Database["public"]["Enums"]["social_style"] | null
          state: string | null
          time_since_last_relationship: string | null
          track_cycle: boolean | null
          transition_stage: string | null
          trauma_experiences: Json | null
          typical_partner_type: string | null
          updated_at: string | null
          user_id: string
          work_schedule_type: string | null
        }
        Insert: {
          activity_level?: string | null
          ambition_level?: number | null
          attachment_style?:
            | Database["public"]["Enums"]["attachment_style"]
            | null
          attraction_importance?: number | null
          behavioral_monitoring?: number | null
          birth_date?: string | null
          body_type?: string | null
          boundary_strength?: number | null
          career_stage?: string | null
          chemistry_factors?: Json | null
          city?: string | null
          communication_style?:
            | Database["public"]["Enums"]["communication_style"]
            | null
          conflict_style?: string | null
          country?: string | null
          created_at?: string | null
          custom_pronouns?: string | null
          cycle_length?: number | null
          cycle_regularity?:
            | Database["public"]["Enums"]["cycle_regularity"]
            | null
          dating_history_text?: string | null
          dating_motivation?: string[] | null
          dating_patterns?: Json | null
          dealbreakers?: Json | null
          distance_preference?: string | null
          education_level?: string | null
          education_matters?: boolean | null
          exclusivity_before_intimacy?: boolean | null
          faith_importance?: number | null
          faith_requirements?: Json | null
          financial_importance?: number | null
          financial_situation?: string | null
          financial_vulnerability?: number | null
          flexibility_rating?: number | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          height?: string | null
          height_preference?: string | null
          hormone_profile?: string | null
          id?: string
          in_therapy?: boolean | null
          income_range?: string | null
          interested_in?: string[] | null
          intimacy_comfort?: string | null
          is_neurodivergent?: string | null
          is_trans?: boolean | null
          kids_desire?: Database["public"]["Enums"]["kids_desire"] | null
          kids_status?: Database["public"]["Enums"]["kids_status"] | null
          kids_timeline?: string | null
          last_period_date?: string | null
          lgbtq_connection?: number | null
          living_situation?: string | null
          location?: string | null
          longest_relationship?: string | null
          love_bombing_sensitivity?: number | null
          love_languages?: Json | null
          marriage_before_kids?: boolean | null
          match_specificity?: number | null
          mental_health_importance?: number | null
          mental_health_openness?: string | null
          monogamy_required?: boolean | null
          name?: string | null
          neurodivergence_types?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          open_to_moving?: boolean | null
          open_to_single_parenthood?: boolean | null
          orientation_custom?: string | null
          pattern_recognition?: Json | null
          political_dealbreakers?: Json | null
          politics?: Database["public"]["Enums"]["politics"] | null
          politics_importance?: number | null
          post_intimacy_tendency?: string | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_education_level?: string | null
          preferred_income_range?: string | null
          pronouns?: Database["public"]["Enums"]["pronouns"] | null
          red_flag_sensitivity?: number | null
          relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal"]
            | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          relationship_structure?:
            | Database["public"]["Enums"]["relationship_structure"]
            | null
          religion?: Database["public"]["Enums"]["religion"] | null
          religion_practice_level?: string | null
          response_time_preference?: number | null
          safety_priorities?: Json | null
          safety_requirements?: Json | null
          schedule_flexibility?: string | null
          sexual_orientation?:
            | Database["public"]["Enums"]["sexual_orientation"]
            | null
          social_style?: Database["public"]["Enums"]["social_style"] | null
          state?: string | null
          time_since_last_relationship?: string | null
          track_cycle?: boolean | null
          transition_stage?: string | null
          trauma_experiences?: Json | null
          typical_partner_type?: string | null
          updated_at?: string | null
          user_id: string
          work_schedule_type?: string | null
        }
        Update: {
          activity_level?: string | null
          ambition_level?: number | null
          attachment_style?:
            | Database["public"]["Enums"]["attachment_style"]
            | null
          attraction_importance?: number | null
          behavioral_monitoring?: number | null
          birth_date?: string | null
          body_type?: string | null
          boundary_strength?: number | null
          career_stage?: string | null
          chemistry_factors?: Json | null
          city?: string | null
          communication_style?:
            | Database["public"]["Enums"]["communication_style"]
            | null
          conflict_style?: string | null
          country?: string | null
          created_at?: string | null
          custom_pronouns?: string | null
          cycle_length?: number | null
          cycle_regularity?:
            | Database["public"]["Enums"]["cycle_regularity"]
            | null
          dating_history_text?: string | null
          dating_motivation?: string[] | null
          dating_patterns?: Json | null
          dealbreakers?: Json | null
          distance_preference?: string | null
          education_level?: string | null
          education_matters?: boolean | null
          exclusivity_before_intimacy?: boolean | null
          faith_importance?: number | null
          faith_requirements?: Json | null
          financial_importance?: number | null
          financial_situation?: string | null
          financial_vulnerability?: number | null
          flexibility_rating?: number | null
          gender_identity?:
            | Database["public"]["Enums"]["gender_identity"]
            | null
          height?: string | null
          height_preference?: string | null
          hormone_profile?: string | null
          id?: string
          in_therapy?: boolean | null
          income_range?: string | null
          interested_in?: string[] | null
          intimacy_comfort?: string | null
          is_neurodivergent?: string | null
          is_trans?: boolean | null
          kids_desire?: Database["public"]["Enums"]["kids_desire"] | null
          kids_status?: Database["public"]["Enums"]["kids_status"] | null
          kids_timeline?: string | null
          last_period_date?: string | null
          lgbtq_connection?: number | null
          living_situation?: string | null
          location?: string | null
          longest_relationship?: string | null
          love_bombing_sensitivity?: number | null
          love_languages?: Json | null
          marriage_before_kids?: boolean | null
          match_specificity?: number | null
          mental_health_importance?: number | null
          mental_health_openness?: string | null
          monogamy_required?: boolean | null
          name?: string | null
          neurodivergence_types?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          open_to_moving?: boolean | null
          open_to_single_parenthood?: boolean | null
          orientation_custom?: string | null
          pattern_recognition?: Json | null
          political_dealbreakers?: Json | null
          politics?: Database["public"]["Enums"]["politics"] | null
          politics_importance?: number | null
          post_intimacy_tendency?: string | null
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_education_level?: string | null
          preferred_income_range?: string | null
          pronouns?: Database["public"]["Enums"]["pronouns"] | null
          red_flag_sensitivity?: number | null
          relationship_goal?:
            | Database["public"]["Enums"]["relationship_goal"]
            | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          relationship_structure?:
            | Database["public"]["Enums"]["relationship_structure"]
            | null
          religion?: Database["public"]["Enums"]["religion"] | null
          religion_practice_level?: string | null
          response_time_preference?: number | null
          safety_priorities?: Json | null
          safety_requirements?: Json | null
          schedule_flexibility?: string | null
          sexual_orientation?:
            | Database["public"]["Enums"]["sexual_orientation"]
            | null
          social_style?: Database["public"]["Enums"]["social_style"] | null
          state?: string | null
          time_since_last_relationship?: string | null
          track_cycle?: boolean | null
          transition_stage?: string | null
          trauma_experiences?: Json | null
          typical_partner_type?: string | null
          updated_at?: string | null
          user_id?: string
          work_schedule_type?: string | null
        }
        Relationships: []
      }
      studio_availability_patterns: {
        Row: {
          created_at: string | null
          day_of_week: number
          id: string
          is_open: boolean | null
          studio_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          id?: string
          is_open?: boolean | null
          studio_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_availability_patterns_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_availability_patterns_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_bookings: {
        Row: {
          booking_date: string
          created_at: string | null
          end_time: string
          id: string
          start_time: string
          status: string
          studio_id: string
          total_amount: number
          total_hours: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string | null
          end_time: string
          id?: string
          start_time: string
          status?: string
          studio_id: string
          total_amount: number
          total_hours: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string | null
          end_time?: string
          id?: string
          start_time?: string
          status?: string
          studio_id?: string
          total_amount?: number
          total_hours?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_bookings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_bookings_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_date_overrides: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          override_date: string
          reason: string | null
          studio_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          override_date: string
          reason?: string | null
          studio_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          override_date?: string
          reason?: string | null
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_date_overrides_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_date_overrides_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          studio_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          studio_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_images_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_images_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          studio_id: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          studio_id: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "studio_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_reviews_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_reviews_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_time_slots: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          hourly_rate: number
          id: string
          slot_type: string | null
          start_time: string
          studio_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          hourly_rate: number
          id?: string
          slot_type?: string | null
          start_time: string
          studio_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          hourly_rate?: number
          id?: string
          slot_type?: string | null
          start_time?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_time_slots_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_time_slots_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios_public"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          amenities: Json | null
          area_sqm: number
          base_hourly_rate: number
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string
          owner_user_id: string
          size: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          area_sqm: number
          base_hourly_rate?: number
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_user_id: string
          size: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          area_sqm?: number
          base_hourly_rate?: number
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_user_id?: string
          size?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          last_reset_at: string
          updated_at: string
          updates_used: number
          user_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          last_reset_at?: string
          updated_at?: string
          updates_used?: number
          user_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          last_reset_at?: string
          updated_at?: string
          updates_used?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          candidates_limit: number
          created_at: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          updates_per_candidate: number
          user_id: string
        }
        Insert: {
          candidates_limit?: number
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          updates_per_candidate?: number
          user_id: string
        }
        Update: {
          candidates_limit?: number
          created_at?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          updates_per_candidate?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      studios_public: {
        Row: {
          amenities: Json | null
          area_sqm: number | null
          base_hourly_rate: number | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string | null
          size: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          area_sqm?: number | null
          base_hourly_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          size?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          area_sqm?: number | null
          base_hourly_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          size?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attachment_style: "secure" | "anxious" | "avoidant" | "disorganized"
      candidate_status:
        | "just_matched"
        | "texting"
        | "planning_date"
        | "dating"
        | "dating_casually"
        | "getting_serious"
        | "no_contact"
        | "archived"
        | "serious_relationship"
      communication_style:
        | "direct"
        | "diplomatic"
        | "emotional"
        | "logical"
        | "adaptable"
      cycle_regularity:
        | "very_regular"
        | "somewhat_regular"
        | "irregular"
        | "pcos_endo"
        | "perimenopause"
        | "not_applicable"
      gender_identity:
        | "woman_cis"
        | "woman_trans"
        | "non_binary"
        | "gender_fluid"
        | "self_describe"
        | "man_cis"
        | "man_trans"
      interaction_type:
        | "coffee"
        | "dinner"
        | "drinks"
        | "movie"
        | "facetime"
        | "texting"
        | "activity"
        | "home_hangout"
        | "group_hang"
        | "trip"
        | "event"
        | "intimate"
        | "phone_call"
      kids_desire: "definitely_yes" | "maybe" | "definitely_no" | "already_have"
      kids_status: "no_kids" | "has_young_kids" | "has_adult_kids"
      politics:
        | "progressive"
        | "liberal"
        | "moderate"
        | "conservative"
        | "traditional"
      pronouns: "she_her" | "he_him" | "they_them" | "other"
      relationship_goal: "casual" | "dating" | "serious" | "marriage" | "unsure"
      relationship_status:
        | "single"
        | "married"
        | "recently_divorced"
        | "ethical_non_monogamy"
      relationship_structure: "monogamous" | "open" | "polyamorous" | "unsure"
      religion:
        | "none"
        | "spiritual"
        | "christian_catholic"
        | "christian_protestant"
        | "christian_other"
        | "jewish"
        | "muslim"
        | "hindu"
        | "buddhist"
        | "other"
      sexual_orientation:
        | "straight"
        | "lesbian"
        | "bisexual"
        | "pansexual"
        | "queer"
        | "asexual"
        | "no_label"
        | "self_describe"
      social_style:
        | "homebody"
        | "social_butterfly"
        | "balanced"
        | "mood_dependent"
      subscription_plan:
        | "free"
        | "new_to_dating"
        | "dating_often"
        | "dating_more"
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
      attachment_style: ["secure", "anxious", "avoidant", "disorganized"],
      candidate_status: [
        "just_matched",
        "texting",
        "planning_date",
        "dating",
        "dating_casually",
        "getting_serious",
        "no_contact",
        "archived",
        "serious_relationship",
      ],
      communication_style: [
        "direct",
        "diplomatic",
        "emotional",
        "logical",
        "adaptable",
      ],
      cycle_regularity: [
        "very_regular",
        "somewhat_regular",
        "irregular",
        "pcos_endo",
        "perimenopause",
        "not_applicable",
      ],
      gender_identity: [
        "woman_cis",
        "woman_trans",
        "non_binary",
        "gender_fluid",
        "self_describe",
        "man_cis",
        "man_trans",
      ],
      interaction_type: [
        "coffee",
        "dinner",
        "drinks",
        "movie",
        "facetime",
        "texting",
        "activity",
        "home_hangout",
        "group_hang",
        "trip",
        "event",
        "intimate",
        "phone_call",
      ],
      kids_desire: ["definitely_yes", "maybe", "definitely_no", "already_have"],
      kids_status: ["no_kids", "has_young_kids", "has_adult_kids"],
      politics: [
        "progressive",
        "liberal",
        "moderate",
        "conservative",
        "traditional",
      ],
      pronouns: ["she_her", "he_him", "they_them", "other"],
      relationship_goal: ["casual", "dating", "serious", "marriage", "unsure"],
      relationship_status: [
        "single",
        "married",
        "recently_divorced",
        "ethical_non_monogamy",
      ],
      relationship_structure: ["monogamous", "open", "polyamorous", "unsure"],
      religion: [
        "none",
        "spiritual",
        "christian_catholic",
        "christian_protestant",
        "christian_other",
        "jewish",
        "muslim",
        "hindu",
        "buddhist",
        "other",
      ],
      sexual_orientation: [
        "straight",
        "lesbian",
        "bisexual",
        "pansexual",
        "queer",
        "asexual",
        "no_label",
        "self_describe",
      ],
      social_style: [
        "homebody",
        "social_butterfly",
        "balanced",
        "mood_dependent",
      ],
      subscription_plan: [
        "free",
        "new_to_dating",
        "dating_often",
        "dating_more",
      ],
    },
  },
} as const
