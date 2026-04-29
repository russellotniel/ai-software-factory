---
project_name: SIM Registration Portal
project_code: SIMREG
version: 0.1
effective_date: TBA
status: draft
prepared_by: []
reviewed_by: []
approved_by: []
---

# Project Detail

## Project Overview

The SIM Registration Portal is XLSmart's customer-and-dealer-facing tool for
prepaid SIM card registration in Indonesia. It replaces the existing
spreadsheet-and-WhatsApp dealer workflow with a regulated, auditable system
that complies with Kominfo PP No. 28/2017.

## Objective

Provide a compliant, auditable registration flow that validates NIK and KK
data, enforces role separation between customer / dealer / admin / auditor,
and produces an immutable audit trail acceptable to Kominfo.

## Project Scope

- Customer-facing self-service registration with NIK, KK, and selfie capture.
- Dealer-facing approval queue, scoped to assigned region.
- Admin-facing read-only dashboard with cross-regional reporting.
- Auditor-facing read-only audit log access.
- Encryption at rest for NIK and KK; immutable audit log retained 5 years.
- Deferred to later releases: Dukcapil API integration, SAP billing
  integration, SMS / WhatsApp notification, multi-language UI.

## System Description

A single Next.js + Supabase web application deployed in XLSmart's existing
Kubernetes infrastructure. Supabase Auth for identity. Object storage for
selfie images with a 30-day retention lifecycle rule. Role-based access
control enforced through RLS policies and validated at the Server Action
layer.

# User Matrix

| Module       | Feature                  | Customer | Dealer | Admin | Auditor |
|--------------|--------------------------|:--------:|:------:|:-----:|:-------:|
| Registration | Submit registration      |    v     |        |   v   |         |
| Registration | View own status          |    v     |        |   v   |         |
| Approval     | Review queue (regional)  |          |   v    |   v   |         |
| Approval     | Approve / reject         |          |   v    |       |         |
| Reporting    | Cross-regional dashboard |          |        |   v   |         |
| Reporting    | Export CSV (masked PII)  |          |        |   v   |         |
| Audit        | View audit log           |          |        |       |    v    |

# Functional Requirements

## Registration

| URS ID | Type       | Requirement                                                                                                                                | Rank |
|--------|------------|--------------------------------------------------------------------------------------------------------------------------------------------|------|
| FR-01  | Functional | **Submit registration**: Customer can submit a SIM registration with NIK, KK, selfie image, and target phone number.                       | C    |
| FR-02  | Functional | **Validate NIK format**: System rejects submissions where NIK is not 16 digits or fails Dukcapil format checks before persisting the row.   | C    |
| FR-03  | Functional | **View own status**: Customer can view the current state of their own registration (pending, approved, rejected with reason).               | C    |

## Approval

| URS ID | Type       | Requirement                                                                                                                                | Rank |
|--------|------------|--------------------------------------------------------------------------------------------------------------------------------------------|------|
| FR-04  | Functional | **Regional review queue**: Dealer can view pending registrations only within their assigned region; other regions are not visible.          | C    |
| FR-05  | Functional | **Approve registration**: Dealer can approve a valid registration; on approval the SIM is activated and an audit log entry is written.       | C    |
| FR-06  | Functional | **Reject registration**: Dealer can reject a registration with a mandatory reason; customer is notified and can resubmit.                    | C    |

## Reporting

| URS ID | Type       | Requirement                                                                                                                                | Rank |
|--------|------------|--------------------------------------------------------------------------------------------------------------------------------------------|------|
| FR-07  | Functional | **Cross-regional dashboard**: Admin can view a read-only dashboard with registration counts and rejection breakdowns across all regions.    | I    |
| FR-08  | Functional | **CSV export**: Admin can export the registration registry as a CSV with PII fields masked.                                                 | I    |

## Audit

| URS ID | Type       | Requirement                                                                                                                                | Rank |
|--------|------------|--------------------------------------------------------------------------------------------------------------------------------------------|------|
| FR-09  | Functional | **View audit log**: Auditor can view the append-only audit log; sees only hashed identifiers and the full action trail.                     | C    |

# Non-Functional Requirements

| URS ID  | Type           | Requirement                                                                                                                  | Rank |
|---------|----------------|------------------------------------------------------------------------------------------------------------------------------|------|
| NFR-01  | Security       | **NIK and KK encryption**: NIK and KK fields are encrypted at rest using AES-256; deterministic encryption is acceptable for exact-match search. | C    |
| NFR-02  | Auditability   | **Append-only audit log**: Every state transition writes to the audit log; rows are never updated or deleted; retention 5 years per regulation. | C    |
| NFR-03  | Performance    | **Approval latency**: Dealer approval action completes within 2 seconds at p95.                                              | I    |
| NFR-04  | Availability   | **Business-hours uptime**: System availability is 99.5% during published business hours.                                      | I    |
| NFR-05  | Data lifecycle | **Selfie retention**: Selfie images in object storage are deleted 30 days after the registration is finalized (approved or rejected). | I    |

# User Role Requirements

| URS ID | Type      | Requirement                                                                                                          | Rank |
|--------|-----------|----------------------------------------------------------------------------------------------------------------------|------|
| UR-01  | User Role | **Customer**: can submit own registration, view own status, resubmit a rejected registration. Cannot see others' data. | C    |
| UR-02  | User Role | **Dealer**: can view and decide registrations within assigned region only. Cannot view other regions or other dealers' decisions. | C    |
| UR-03  | User Role | **Admin**: has read-only access to all registrations and reports across all regions. Cannot decide or modify registrations. | I    |
| UR-04  | User Role | **Auditor**: has read-only access to the audit log. PII is shown as hashed identifiers only.                          | C    |

# Validation & Audit Requirements

| URS ID | Type       | Requirement                                                                                                                                  | Rank |
|--------|------------|----------------------------------------------------------------------------------------------------------------------------------------------|------|
| VR-01  | Validation | **Every decision is logged**: every approval and every rejection writes an audit log entry with actor, timestamp, action, registration ID, and reason (rejection only). | C    |
| VR-02  | Validation | **Rejection reason required**: rejecting a registration without a non-empty reason is rejected by the API.                                   | C    |
| VR-03  | Validation | **No re-decide**: a dealer cannot decide a registration they have already approved or rejected; subsequent attempts are rejected.            | C    |
| VR-04  | Validation | **PII masking on export**: the CSV export masks NIK to last 4 digits, masks KK to last 4 digits, and replaces phone numbers with hashed identifiers. | I    |

# Related Documents

| No.  | Title                                                                  |
|------|------------------------------------------------------------------------|
| 001  | Kominfo Peraturan Pemerintah No. 28/2017 — Pendaftaran Kartu Prabayar  |
| 002  | XLSmart Internal SOP — Dealer Registration Handling v2.3 (2025)        |
| 003  | Dukcapil NIK Format Reference — 16-digit Schema                        |

# Glossary

| Acronym  | Definition                                                                            |
|----------|---------------------------------------------------------------------------------------|
| NIK      | Nomor Induk Kependudukan — Indonesian 16-digit national identity number               |
| KK       | Kartu Keluarga — Indonesian family card document                                      |
| Kominfo  | Kementerian Komunikasi dan Informatika — Indonesian Ministry of Communications        |
| Dukcapil | Direktorat Jenderal Kependudukan dan Pencatatan Sipil — civil registration directorate |
| PII      | Personally Identifiable Information                                                   |
| KYC      | Know Your Customer                                                                    |
| RLS      | Row Level Security (PostgreSQL)                                                       |
| SOP      | Standard Operating Procedure                                                          |
