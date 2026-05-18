# ============================================
# Terraform configuration
# ============================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# ============================================
# Provider configuration
# ============================================

provider "google" {
  project = var.project_id
  region  = "us-east1"
}

# ============================================
# Variables
# ============================================

variable "project_id" {
  description = "GCP project ID"
  type        = string
  default     = "soar-house-points"
}

variable "supabase_callback_url" {
  description = "Supabase OAuth callback URL"
  type        = string
  default     = "https://apoxspnbxngsnqwpelaa.supabase.co/auth/v1/callback"
}

# ============================================
# Enabled APIs
# ============================================

resource "google_project_service" "sheets" {
  service = "sheets.googleapis.com"
}

resource "google_project_service" "drive" {
  service = "drive.googleapis.com"
}

# ============================================
# Service Account for sheet sync
# ============================================

resource "google_service_account" "sheet_sync" {
  account_id   = "sheet-sync"
  display_name = "Sheet Sync Service Account"
}
