/**
 * Patemon Supabase Database Schema Definition
 * Generated for PostgreSQL Migration 20261114000001_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      weddings: {
        Row: {
          id: string;
          slug: string | null;
          couple_names: string;
          groom_name: string | null;
          bride_name: string | null;
          prospective_date: string | null;
          location_region: string | null;
          marriage_form: "memadik" | "ngerorod" | "nyentana" | "custom";
          target_budget: number; // Integer IDR (BIGINT)
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          is_frozen: boolean;
          frozen_reason: string | null;
          frozen_at: string | null;
          frozen_by: string | null;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          couple_names: string;
          groom_name?: string | null;
          bride_name?: string | null;
          prospective_date?: string | null;
          location_region?: string | null;
          marriage_form?: "memadik" | "ngerorod" | "nyentana" | "custom";
          target_budget?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          is_frozen?: boolean;
          frozen_reason?: string | null;
          frozen_at?: string | null;
          frozen_by?: string | null;
        };
        Update: {
          id?: string;
          slug?: string | null;
          couple_names?: string;
          groom_name?: string | null;
          bride_name?: string | null;
          prospective_date?: string | null;
          location_region?: string | null;
          marriage_form?: "memadik" | "ngerorod" | "nyentana" | "custom";
          target_budget?: number;
          notes?: string | null;
          created_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
          is_frozen?: boolean;
          frozen_reason?: string | null;
          frozen_at?: string | null;
          frozen_by?: string | null;
        };
        Relationships: [];
      };
      wedding_members: {
        Row: {
          id: string;
          wedding_id: string;
          user_id: string | null;
          role: "owner" | "editor" | "viewer";
          invited_email: string;
          invited_by: string | null;
          status: "invited" | "active" | "revoked";
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          user_id?: string | null;
          role?: "owner" | "editor" | "viewer";
          invited_email: string;
          invited_by?: string | null;
          status?: "invited" | "active" | "revoked";
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          user_id?: string | null;
          role?: "owner" | "editor" | "viewer";
          invited_email?: string;
          status?: "invited" | "active" | "revoked";
          joined_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          title: string;
          source_type: string;
          usage_notes: string | null;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          source_type: string;
          usage_notes?: string | null;
          source_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          source_type?: string;
          usage_notes?: string | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ceremony_templates: {
        Row: {
          id: string;
          phase: string;
          name: string;
          aliases: string[];
          description: string | null;
          applicability: string;
          default_pic: string | null;
          validation_status: string;
          source_id: string | null;
          source_url: string | null;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phase: string;
          name: string;
          aliases?: string[];
          description?: string | null;
          applicability?: string;
          default_pic?: string | null;
          validation_status?: string;
          source_id?: string | null;
          source_url?: string | null;
          order_index?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phase?: string;
          name?: string;
          aliases?: string[];
          description?: string | null;
          applicability?: string;
          default_pic?: string | null;
          validation_status?: string;
          source_id?: string | null;
          source_url?: string | null;
          order_index?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      ritual_catalog: {
        Row: {
          id: string;
          item_type: string;
          name: string;
          used_in_phase: string | null;
          notes: string | null;
          obligation_level: string;
          default_quantity: number | null;
          unit: string;
          default_provider: string | null;
          validation_status: string;
          source_id: string | null;
          source_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          item_type: string;
          name: string;
          used_in_phase?: string | null;
          notes?: string | null;
          obligation_level?: string;
          default_quantity?: number | null;
          unit?: string;
          default_provider?: string | null;
          validation_status?: string;
          source_id?: string | null;
          source_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_type?: string;
          name?: string;
          used_in_phase?: string | null;
          notes?: string | null;
          obligation_level?: string;
          default_quantity?: number | null;
          unit?: string;
          default_provider?: string | null;
          validation_status?: string;
          source_id?: string | null;
          source_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      task_templates: {
        Row: {
          id: string;
          phase: string;
          target_timeline: string | null;
          category: string;
          title: string;
          default_pic: string | null;
          applicability: string;
          priority: "low" | "medium" | "high" | "urgent";
          notes: string | null;
          source_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phase: string;
          target_timeline?: string | null;
          category: string;
          title: string;
          default_pic?: string | null;
          applicability?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          notes?: string | null;
          source_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phase?: string;
          target_timeline?: string | null;
          category?: string;
          title?: string;
          default_pic?: string | null;
          applicability?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          notes?: string | null;
          source_url?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      wedding_ceremonies: {
        Row: {
          id: string;
          wedding_id: string;
          template_id: string | null;
          title: string;
          description: string | null;
          phase: string | null;
          scheduled_date: string | null;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          person_in_charge: string | null;
          order_index: number;
          status: "draft" | "confirmed" | "completed" | "skipped";
          custom_notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          template_id?: string | null;
          title: string;
          description?: string | null;
          phase?: string | null;
          scheduled_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          person_in_charge?: string | null;
          order_index?: number;
          status?: "draft" | "confirmed" | "completed" | "skipped";
          custom_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          template_id?: string | null;
          title?: string;
          description?: string | null;
          phase?: string | null;
          scheduled_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          person_in_charge?: string | null;
          order_index?: number;
          status?: "draft" | "confirmed" | "completed" | "skipped";
          custom_notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      wedding_ritual_items: {
        Row: {
          id: string;
          wedding_id: string;
          ceremony_id: string | null;
          catalog_id: string | null;
          name: string;
          category: string | null;
          quantity: number;
          unit: string;
          sourcing_method:
            | "self_made"
            | "purchased_package"
            | "family_assigned"
            | "vendor_order";
          status: "needed" | "ordered" | "making" | "ready" | "not_needed";
          assignee_name: string | null;
          estimated_price: number;
          actual_price: number;
          notes: string | null;
          review_status:
            "draft" | "needs_review" | "needs_revision" | "approved";
          reviewer_name: string | null;
          reviewer_type: "internal_member" | "external_practitioner" | null;
          recorded_by_user_id: string | null;
          recorded_by_name: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          source_reference: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          ceremony_id?: string | null;
          catalog_id?: string | null;
          name: string;
          category?: string | null;
          quantity?: number;
          unit?: string;
          sourcing_method?:
            | "self_made"
            | "purchased_package"
            | "family_assigned"
            | "vendor_order";
          status?: "needed" | "ordered" | "making" | "ready" | "not_needed";
          assignee_name?: string | null;
          estimated_price?: number;
          actual_price?: number;
          notes?: string | null;
          review_status?:
            "draft" | "needs_review" | "needs_revision" | "approved";
          reviewer_name?: string | null;
          reviewer_type?: "internal_member" | "external_practitioner" | null;
          recorded_by_user_id?: string | null;
          recorded_by_name?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          source_reference?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          ceremony_id?: string | null;
          catalog_id?: string | null;
          name?: string;
          category?: string | null;
          quantity?: number;
          unit?: string;
          sourcing_method?:
            | "self_made"
            | "purchased_package"
            | "family_assigned"
            | "vendor_order";
          status?: "needed" | "ordered" | "making" | "ready" | "not_needed";
          assignee_name?: string | null;
          estimated_price?: number;
          actual_price?: number;
          notes?: string | null;
          review_status?:
            "draft" | "needs_review" | "needs_revision" | "approved";
          reviewer_name?: string | null;
          reviewer_type?: "internal_member" | "external_practitioner" | null;
          recorded_by_user_id?: string | null;
          recorded_by_name?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          source_reference?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      wedding_tasks: {
        Row: {
          id: string;
          wedding_id: string;
          template_id: string | null;
          ceremony_id: string | null;
          title: string;
          description: string | null;
          category: string | null;
          priority: "low" | "medium" | "high" | "urgent";
          status: "todo" | "in_progress" | "done" | "canceled";
          due_date: string | null;
          assigned_to_user_id: string | null;
          assignee_name: string | null;
          order_index: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          template_id?: string | null;
          ceremony_id?: string | null;
          title: string;
          description?: string | null;
          category?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "todo" | "in_progress" | "done" | "canceled";
          due_date?: string | null;
          assigned_to_user_id?: string | null;
          assignee_name?: string | null;
          order_index?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          ceremony_id?: string | null;
          title?: string;
          description?: string | null;
          category?: string | null;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "todo" | "in_progress" | "done" | "canceled";
          due_date?: string | null;
          assigned_to_user_id?: string | null;
          assignee_name?: string | null;
          order_index?: number;
          completed_at?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      budget_items: {
        Row: {
          id: string;
          wedding_id: string;
          category: string;
          title: string;
          unit: string | null;
          quantity: number;
          unit_price: number;
          planned_amount: number;
          actual_amount: number;
          paid_by: string | null;
          status:
            "estimated" | "booked" | "paid_partial" | "paid_full" | "canceled";
          linked_ritual_item_id: string | null;
          linked_vendor_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          category: string;
          title: string;
          unit?: string | null;
          quantity?: number;
          unit_price?: number;
          planned_amount?: number;
          actual_amount?: number;
          paid_by?: string | null;
          status?:
            "estimated" | "booked" | "paid_partial" | "paid_full" | "canceled";
          linked_ritual_item_id?: string | null;
          linked_vendor_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          category?: string;
          title?: string;
          unit?: string | null;
          quantity?: number;
          unit_price?: number;
          planned_amount?: number;
          actual_amount?: number;
          paid_by?: string | null;
          status?:
            "estimated" | "booked" | "paid_partial" | "paid_full" | "canceled";
          linked_ritual_item_id?: string | null;
          linked_vendor_id?: string | null;
          notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      budget_payments: {
        Row: {
          id: string;
          wedding_id: string;
          budget_item_id: string;
          amount: number;
          payment_date: string;
          payment_method: string | null;
          recipient: string | null;
          notes: string | null;
          receipt_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          budget_item_id: string;
          amount: number;
          payment_date: string;
          payment_method?: string | null;
          recipient?: string | null;
          notes?: string | null;
          receipt_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: string | null;
          recipient?: string | null;
          notes?: string | null;
          receipt_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          wedding_id: string;
          category: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          social_link: string | null;
          quote_amount: number;
          status:
            | "prospect"
            | "contacted"
            | "quoted"
            | "booked"
            | "completed"
            | "canceled";
          pic_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          category: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          social_link?: string | null;
          quote_amount?: number;
          status?:
            | "prospect"
            | "contacted"
            | "quoted"
            | "booked"
            | "completed"
            | "canceled";
          pic_name?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          category?: string;
          name?: string;
          contact_person?: string | null;
          phone?: string | null;
          social_link?: string | null;
          quote_amount?: number;
          status?:
            | "prospect"
            | "contacted"
            | "quoted"
            | "booked"
            | "completed"
            | "canceled";
          pic_name?: string | null;
          notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          wedding_id: string;
          name: string;
          side: "groom" | "bride" | "both" | "mutual";
          group_household: string | null;
          headcount: number;
          invitation_status: "draft" | "sent" | "confirmed" | "declined";
          phone: string | null;
          notes: string | null;
          rsvp_token: string | null;
          rsvp_token_revoked_at: string | null;
          rsvp_attending_count: number | null;
          rsvp_notes: string | null;
          rsvp_submitted_at: string | null;
          rsvp_deadline: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          name: string;
          side?: "groom" | "bride" | "both" | "mutual";
          group_household?: string | null;
          headcount?: number;
          invitation_status?: "draft" | "sent" | "confirmed" | "declined";
          phone?: string | null;
          notes?: string | null;
          rsvp_token?: string | null;
          rsvp_token_revoked_at?: string | null;
          rsvp_attending_count?: number | null;
          rsvp_notes?: string | null;
          rsvp_submitted_at?: string | null;
          rsvp_deadline?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          side?: "groom" | "bride" | "both" | "mutual";
          group_household?: string | null;
          headcount?: number;
          invitation_status?: "draft" | "sent" | "confirmed" | "declined";
          phone?: string | null;
          notes?: string | null;
          rsvp_token?: string | null;
          rsvp_token_revoked_at?: string | null;
          rsvp_attending_count?: number | null;
          rsvp_notes?: string | null;
          rsvp_submitted_at?: string | null;
          rsvp_deadline?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      rundown_events: {
        Row: {
          id: string;
          wedding_id: string;
          ceremony_id: string | null;
          segment_title: string;
          scheduled_date: string | null;
          start_time: string;
          end_time: string;
          location: string | null;
          person_in_charge: string | null;
          pic_phone: string | null;
          order_index: number;
          notes: string | null;
          status:
            "pending" | "in_progress" | "completed" | "delayed" | "skipped";
          actual_start_time: string | null;
          actual_end_time: string | null;
          actual_start_at: string | null;
          actual_end_at: string | null;
          delay_minutes: number;
          notes_day_of: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          ceremony_id?: string | null;
          segment_title: string;
          scheduled_date?: string | null;
          start_time: string;
          end_time: string;
          location?: string | null;
          person_in_charge?: string | null;
          pic_phone?: string | null;
          order_index?: number;
          notes?: string | null;
          status?:
            "pending" | "in_progress" | "completed" | "delayed" | "skipped";
          actual_start_time?: string | null;
          actual_end_time?: string | null;
          actual_start_at?: string | null;
          actual_end_at?: string | null;
          delay_minutes?: number;
          notes_day_of?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ceremony_id?: string | null;
          segment_title?: string;
          scheduled_date?: string | null;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          person_in_charge?: string | null;
          pic_phone?: string | null;
          order_index?: number;
          notes?: string | null;
          status?:
            "pending" | "in_progress" | "completed" | "delayed" | "skipped";
          actual_start_time?: string | null;
          actual_end_time?: string | null;
          actual_start_at?: string | null;
          actual_end_at?: string | null;
          delay_minutes?: number;
          notes_day_of?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      checkout_orders: {
        Row: {
          id: string;
          wedding_id: string;
          user_id: string;
          order_number: string;
          amount: number;
          status: "pending" | "settlement" | "expire" | "cancel" | "deny";
          snap_token: string | null;
          snap_redirect_url: string | null;
          payment_type: string | null;
          transaction_time: string | null;
          settlement_time: string | null;
          raw_response: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          user_id: string;
          order_number: string;
          amount: number;
          status?: "pending" | "settlement" | "expire" | "cancel" | "deny";
          snap_token?: string | null;
          snap_redirect_url?: string | null;
          payment_type?: string | null;
          transaction_time?: string | null;
          settlement_time?: string | null;
          raw_response?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: "pending" | "settlement" | "expire" | "cancel" | "deny";
          snap_token?: string | null;
          snap_redirect_url?: string | null;
          payment_type?: string | null;
          transaction_time?: string | null;
          settlement_time?: string | null;
          raw_response?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          order_id: string;
          event_type: string;
          provider_status: string | null;
          signature_key: string | null;
          payload: Json;
          is_verified: boolean;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          event_type: string;
          provider_status?: string | null;
          signature_key?: string | null;
          payload: Json;
          is_verified?: boolean;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_verified?: boolean;
          processed_at?: string | null;
        };
        Relationships: [];
      };
      access_grants: {
        Row: {
          id: string;
          wedding_id: string;
          order_id: string | null;
          status: "active" | "expired" | "revoked";
          granted_at: string;
          valid_until: string | null;
          revoked_at: string | null;
          grant_type: "payment" | "manual_override" | "promotional";
          granted_by: string | null;
          override_reason: string | null;
          reference_proof: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          order_id?: string | null;
          status?: "active" | "expired" | "revoked";
          granted_at?: string;
          valid_until?: string | null;
          revoked_at?: string | null;
          grant_type?: "payment" | "manual_override" | "promotional";
          granted_by?: string | null;
          override_reason?: string | null;
          reference_proof?: string | null;
        };
        Update: {
          id?: string;
          status?: "active" | "expired" | "revoked";
          valid_until?: string | null;
          revoked_at?: string | null;
          grant_type?: "payment" | "manual_override" | "promotional";
          granted_by?: string | null;
          override_reason?: string | null;
          reference_proof?: string | null;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          role: "superadmin" | "support_operator";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          role?: "superadmin" | "support_operator";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          role?: "superadmin" | "support_operator";
          is_active?: boolean;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          admin_user_id: string | null;
          admin_email: string;
          action: string;
          target_type: string;
          target_id: string;
          reason: string;
          reference_note: string | null;
          before_state: Json | null;
          after_state: Json | null;
          correlation_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id?: string | null;
          admin_email: string;
          action: string;
          target_type: string;
          target_id: string;
          reason: string;
          reference_note?: string | null;
          before_state?: Json | null;
          after_state?: Json | null;
          correlation_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reason?: string;
          reference_note?: string | null;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          wedding_id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json | null;
          created_at: string;
          actor_type: "user" | "admin" | "system";
          actor_name: string | null;
          entity_title: string | null;
          summary: string | null;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json | null;
          created_at?: string;
          actor_type?: "user" | "admin" | "system";
          actor_name?: string | null;
          entity_title?: string | null;
          summary?: string | null;
        };
        Update: {
          id?: string;
          action?: string;
          details?: Json | null;
          actor_type?: "user" | "admin" | "system";
          actor_name?: string | null;
          entity_title?: string | null;
          summary?: string | null;
        };
        Relationships: [];
      };
      wedding_reminder_preferences: {
        Row: {
          id: string;
          wedding_id: string;
          user_id: string | null;
          email_notifications_enabled: boolean;
          task_reminders_enabled: boolean;
          payment_reminders_enabled: boolean;
          reminder_tiers: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          user_id?: string | null;
          email_notifications_enabled?: boolean;
          task_reminders_enabled?: boolean;
          payment_reminders_enabled?: boolean;
          reminder_tiers?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          user_id?: string | null;
          email_notifications_enabled?: boolean;
          task_reminders_enabled?: boolean;
          payment_reminders_enabled?: boolean;
          reminder_tiers?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      wedding_reminder_logs: {
        Row: {
          id: string;
          wedding_id: string;
          item_type: "task" | "budget_payment";
          item_id: string;
          item_title: string;
          recipient_email: string;
          recipient_user_id: string | null;
          recipient_name: string | null;
          reminder_tier: "H-7" | "H-3" | "H-1" | "H-0";
          target_due_date: string;
          idempotency_key: string;
          status: "sent" | "failed" | "skipped";
          retry_count: number;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          item_type: "task" | "budget_payment";
          item_id: string;
          item_title: string;
          recipient_email: string;
          recipient_user_id?: string | null;
          recipient_name?: string | null;
          reminder_tier: "H-7" | "H-3" | "H-1" | "H-0";
          target_due_date: string;
          idempotency_key: string;
          status: "sent" | "failed" | "skipped";
          retry_count?: number;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          status?: "sent" | "failed" | "skipped";
          retry_count?: number;
          error_message?: string | null;
          sent_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
