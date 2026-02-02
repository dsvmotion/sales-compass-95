
# Comprehensive Security Review - Moodly Pharmacy Management App

## Executive Summary

This security review identifies **critical, high, and medium severity vulnerabilities** across the database, backend functions, storage, and frontend layers. The application currently operates in a **fully public access mode** with no authentication, making all data accessible to anyone.

---

## Severity Classification

| Level | Count | Description |
|-------|-------|-------------|
| CRITICAL | 4 | Immediate exploitation risk, data breach possible |
| HIGH | 5 | Significant security weakness |
| MEDIUM | 4 | Should be addressed before production |
| LOW | 2 | Best practice improvements |

---

## Critical Findings (MUST FIX)

### 1. No Authentication System

**Risk**: Anyone can access, modify, or delete all pharmacy data without logging in.

**Current State**:
- No user authentication implemented
- No login/signup pages
- No session management
- All database operations available to anonymous users

**Impact**: Complete unauthorized access to sensitive business data including:
- Pharmacy contact information
- Commercial relationships and status
- WooCommerce order data (customer names, emails, phones, addresses)
- Business documents (invoices, receipts)

**Remediation**:
- Implement user authentication with email/password
- Add protected routes for all pages
- Require login before any data operations

---

### 2. Overly Permissive RLS Policies (15 violations)

**Risk**: All database tables use `USING (true)` and `WITH CHECK (true)` policies, bypassing Row-Level Security entirely.

**Affected Tables**:

| Table | Operations | Policy |
|-------|------------|--------|
| `pharmacies` | INSERT, UPDATE, DELETE | `true` (unrestricted) |
| `pharmacy_order_documents` | INSERT, DELETE | `true` (unrestricted) |
| `geography_cities` | INSERT | `true` (unrestricted) |
| `geography_provinces` | INSERT | `true` (unrestricted) |
| `geography_countries` | INSERT | `true` (unrestricted) |

**Impact**: Any anonymous user can:
- Create fake pharmacies
- Modify any pharmacy's commercial status or notes
- Delete any pharmacy records
- Upload/delete documents for any pharmacy

**Remediation**:
- Implement proper RLS policies tied to authenticated user IDs
- Add `user_id` column to `pharmacies` table for ownership
- Create role-based access control for admin/user separation

---

### 3. Unprotected Edge Functions

**Risk**: Backend functions are publicly accessible without JWT verification.

**Configuration in `supabase/config.toml`**:
```toml
[functions.woocommerce-orders]
verify_jwt = false

[functions.google-places-pharmacies]
verify_jwt = false
```

**Functions without JWT verification**:
- `woocommerce-orders` - Exposes WooCommerce customer data
- `woocommerce-orders-detailed` - Exposes detailed order information
- `google-places-pharmacies` - Allows unlimited API usage

**Impact**:
- WooCommerce API credentials exposed through backend logs
- Customer PII (emails, phones, addresses) publicly accessible
- Potential for API abuse and cost escalation (Google Places API)

**Remediation**:
- Set `verify_jwt = true` for all edge functions
- Add authorization checks inside functions
- Validate user permissions before returning sensitive data

---

### 4. Storage Bucket Overly Permissive

**Risk**: Private pharmacy documents accessible and modifiable by anyone.

**Current Storage Policies**:
```text
Bucket: pharmacy-documents (private: true)

Policies:
- "Anon users can view pharmacy documents" - SELECT
- "Anon users can upload pharmacy documents" - INSERT
- "Authenticated users can delete pharmacy documents" - DELETE
```

**Impact**:
- Anyone can view confidential invoices and receipts
- Anyone can upload malicious files
- File path traversal potential (filenames not sanitized)

**Remediation**:
- Remove anonymous access policies
- Implement user-scoped RLS on storage
- Add file type validation beyond just MIME type
- Sanitize file names before upload

---

## High Severity Findings

### 5. Exposed API Key in Environment

**Risk**: Google Maps API key exposed in `.env` file is visible in client-side code.

**Current State**:
```
VITE_GOOGLE_MAPS_API_KEY="AIzaSyCQokqHOGaQ9WNlk3tC5iprOpE-ZcTORGA"
```

**Impact**:
- API key visible in browser network requests
- Potential for quota exhaustion attacks
- Unauthorized usage billed to account

**Remediation**:
- Restrict API key to specific domains in Google Cloud Console
- Add API restrictions for Maps JavaScript API and Places API only
- Consider proxying sensitive API calls through edge functions

---

### 6. No Input Validation on Forms

**Risk**: User inputs not validated before database operations.

**Affected Components**:
- `PharmacyDetailPanel.tsx` - Email and notes fields
- `PharmacyOperationsDetail.tsx` - Notes and status updates
- File upload handlers - No file size limits

**Missing Validations**:
- Email format validation
- Notes length limits
- File size restrictions (could upload huge files)
- No XSS sanitization

**Remediation**:
- Add Zod schema validation for all inputs
- Implement client-side and server-side validation
- Add file size limits (e.g., 10MB max)
- Sanitize text inputs before database storage

---

### 7. WooCommerce Credentials in Edge Functions

**Risk**: WooCommerce credentials stored as secrets but error messages may leak info.

**Current Implementation**:
```typescript
const wooUrl = Deno.env.get('WOOCOMMERCE_URL');
const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
```

**Issues**:
- Error responses include `details` field with potential sensitive info
- No rate limiting on API calls
- No request validation

**Remediation**:
- Sanitize error messages before returning to client
- Add rate limiting
- Validate input parameters

---

### 8. Missing Update RLS on Documents Table

**Risk**: No UPDATE policy exists for `pharmacy_order_documents`.

**Current State**:
- Users can INSERT and DELETE but cannot UPDATE
- This may cause orphaned records or force delete/recreate patterns

**Remediation**:
- Add appropriate UPDATE RLS policy if needed
- Document intentional absence if by design

---

### 9. Wildcard CORS Headers

**Risk**: Edge functions allow requests from any origin.

**Current Implementation**:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Impact**:
- Any website can call your edge functions
- Enables CSRF-like attacks

**Remediation**:
- Restrict origins to your application domain
- Use dynamic origin validation

---

## Medium Severity Findings

### 10. No Rate Limiting

**Risk**: APIs vulnerable to abuse and denial of service.

**Affected**:
- Google Places search (could exhaust quota)
- WooCommerce order fetching
- Pharmacy save operations

---

### 11. Missing File Type Validation

**Risk**: Only MIME type checked on file uploads.

**Current State**:
```tsx
accept=".pdf"  // HTML attribute only
accept=".pdf,.jpg,.jpeg,.png"
```

**Issue**: MIME type can be spoofed. Need server-side validation.

---

### 12. No Audit Logging

**Risk**: No tracking of who performs sensitive operations.

**Missing**:
- Document upload/delete logs
- Status change history
- Login attempts (once auth is added)

---

### 13. Pharmacy Notes Stored in Plain Text

**Risk**: Sensitive business notes may contain confidential information.

**Consider**: Encryption at rest for notes field.

---

## Low Severity Findings

### 14. Console Logging in Production

**Risk**: Sensitive data logged to console.

**Examples**:
```typescript
console.log('Searching Google Places for pharmacies at:', location);
console.log('Found pharmacies:', data?.pharmacies?.length);
```

---

### 15. Missing Security Headers

**Risk**: Standard security headers not configured.

**Missing**:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options

---

## Recommended Implementation Priority

### Phase 1: Critical (Week 1)
1. Implement user authentication (email/password)
2. Add protected routes to all pages
3. Rewrite RLS policies with user ownership
4. Enable JWT verification on edge functions
5. Fix storage bucket policies

### Phase 2: High (Week 2)
6. Add input validation with Zod
7. Restrict Google Maps API key
8. Sanitize error messages in edge functions
9. Restrict CORS origins
10. Add file type server-side validation

### Phase 3: Medium (Week 3)
11. Implement rate limiting
12. Add audit logging table
13. Consider notes encryption
14. Remove console.log statements

---

## Technical Implementation Details

### Database Schema Changes Required

```sql
-- Add user ownership to pharmacies
ALTER TABLE pharmacies ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Create user roles table (for admin access)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);
```

### New RLS Policies Required

```sql
-- Example: Pharmacies owned by users
CREATE POLICY "Users can view their pharmacies"
ON pharmacies FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their pharmacies"
ON pharmacies FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Edge Function Config Update

```toml
[functions.woocommerce-orders]
verify_jwt = true

[functions.woocommerce-orders-detailed]
verify_jwt = true

[functions.google-places-pharmacies]
verify_jwt = true
```

---

## Summary

The application has significant security vulnerabilities that must be addressed before production deployment. The most critical issue is the complete lack of authentication combined with permissive RLS policies, effectively making all data public.

**Immediate Action Required**: Do not expose this application to the internet without implementing authentication and proper access controls.

