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
    google-beta = {
      source  = "hashicorp/google-beta"
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
provider "google-beta" {
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

resource "google_project_service" "firebase" {
  service = "firebase.googleapis.com"
}

resource "google_project_service" "firebasehosting" {
  service = "firebasehosting.googleapis.com"
}

# ============================================
# Service Account for sheet sync
# ============================================

resource "google_service_account" "sheet_sync" {
  account_id   = "sheet-sync"
  display_name = "Sheet Sync Service Account"
}

# ============================================
# Firebase Hosting Site
# ============================================

resource "google_firebase_hosting_site" "soarpoints" {
  provider = google-beta
  project  = var.project_id
  site_id  = "soarpoints"

  depends_on = [google_project_service.firebasehosting]
}

# ============================================
# Service Account for Firebase GitHub Actions deploys
# ============================================

resource "google_service_account" "firebase_deploy" {
  account_id   = "firebase-deploy"
  display_name = "Firebase Deploy (GitHub Actions)"
}

# ============================================
# IAM Role Bindings
# ============================================
# These define what each service account is allowed
# to do within the GCP project.

# Sheet sync account: read/write Google Sheets and Drive
resource "google_project_iam_member" "sheet_sync_sheets" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.sheet_sync.email}"
}

# Firebase deploy account: manage hosting deployments
resource "google_project_iam_member" "firebase_deploy_hosting" {
  project = var.project_id
  role    = "roles/firebasehosting.admin"
  member  = "serviceAccount:${google_service_account.firebase_deploy.email}"
}

resource "google_project_iam_member" "firebase_deploy_sa_user" {
  project = var.project_id
  role    = "roles/iam.serviceAccountUser"
  member  = "serviceAccount:${google_service_account.firebase_deploy.email}"
}

# ============================================
# Outputs
# ============================================

output "sheet_sync_email" {
  description = "Service account email for Google Sheet sharing"
  value       = google_service_account.sheet_sync.email
}

output "firebase_deploy_email" {
  description = "Service account email for GitHub Actions deploys"
  value       = google_service_account.firebase_deploy.email
}

output "hosting_url" {
  description = "Firebase Hosting URL"
  value       = google_firebase_hosting_site.soarpoints.default_url
}