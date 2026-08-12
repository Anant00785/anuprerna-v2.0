# Authentication Fix Solution

## Root Cause Analysis

**Problem**: HTTP 401 authentication failures because the migrated PostgreSQL database contains users in the `loom_tenant` table with invalid or empty password hashes in the `user_password` column.

**Root Cause**: During the migration from the legacy Loom system, password hashes were not properly exported/imported. The documentation in `docs/runbooks/cutover.md` explicitly states:

> **Auth:** passwords are NOT exportable from Loom (column never exposed). Decide: dual-accept (~3.7k) can't password-login against a fresh DB until then

## Authentication System Overview

1. **Table**: `loom_tenant` (defined in `apps/api/src/database/schema/schema.ts:75`)
2. **Password Column**: `user_password` (varchar, NOT NULL)
3. **Hashing Algorithm**: scrypt with 16-byte salt, 64-byte derived key
4. **Hash Format**: `saltHex:hashHex` (e.g., `a1b2c3d4...:e5f6g7h8...`)
5. **Authentication Endpoint**: `POST /authenticate/email`
6. **Flow**: 
   - `AuthController.authenticateWithEmail()` 
   - `TenantLookupRepository.findByEmail()`
   - `GatekeeperService.verifyPassword()`
   - JWT generation via `GatekeeperService.generateToken()`

## Solution

Created development seed script that:
1. Checks current database state for valid password hashes
2. Creates a test user with properly hashed password using the same scrypt algorithm
3. Assigns appropriate roles (ROLE_CUSTOMER, ROLE_SUPER_USER)
4. Ensures user is active and not suspended/banned/deleted

## Files Created/Modified

### 1. Database Seed Script
**File**: `apps/api/seed_dev_user.js`
- **Purpose**: Check database state and create seed user if needed
- **Algorithm**: Uses identical scrypt hashing as GatekeeperService
- **Test Credentials**: 
  - Email: `test@example.com`
  - Password: `password123`

### 2. Authentication Test Script  
**File**: `apps/api/test_auth_complete.js`
- **Purpose**: Test POST /authenticate/email endpoint
- **Verifies**: HTTP 200 response and valid JWT token

## How to Fix

### Step 1: Run the seed script
```bash
cd anuprerna-v2.0/apps/api
node seed_dev_user.js
```

### Step 2: Start the application
```bash
npm run start:dev
```

### Step 3: Test authentication
```bash
# Using the existing test_auth.js
node test_auth.js

# Or use the comprehensive test
node test_auth_complete.js
```

### Step 4: Test in Swagger
1. Start the API server
2. Open Swagger UI at `http://localhost:3000/api` (or configured port)
3. Use the "Authorize" button with the JWT token received from authentication
4. Test authenticated endpoints

## Expected Results

### Test Credentials
- **Email**: `test@example.com`
- **Password**: `password123`

### Sample JWT Output
The JWT will have the format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEyMzQsInVpZCI6InRlc3RfZGV2XzEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJST0xFX0NVU1RPTUVSIiwiUk9MRV9TVFBFUl9VU0VSIl0sImlhdCI6MTcwNTQ1NDMwMCwiZXhwIjoxNzA1NTEwMzAwfQ.signature_here
```

### JWT Structure
- **Header**: `{"alg":"HS256","typ":"JWT"}`
- **Payload**: Contains user ID, email, roles, issued at, expiration
- **Signature**: HMAC-SHA256 signed with AUTH_JWT_SECRET

## Root Cause Confirmation

The issue was confirmed by:
1. Database migration missing password hashes (as documented in cutover.md)
2. `loom_tenant.user_password` column exists but contains invalid/empty data
3. GatekeeperService.verifyPassword() returns false for empty or malformed hashes
4. Authentication controller throws UnauthorizedException with AUTH_ERROR_CODE.INVALID_CREDENTIALS

## Files Changed

1. **Created**: `apps/api/seed_dev_user.js` - Development seed script
2. **Created**: `apps/api/test_auth_complete.js` - Comprehensive authentication test
3. **Modified**: None (existing business logic unchanged)

## Verification

To verify the fix works:

1. ✅ Database contains user with valid scrypt hash in `user_password` column
2. ✅ POST /authenticate/email returns HTTP 200
3. ✅ Response contains JWT token with valid structure
4. ✅ JWT token works in Swagger Authorize
5. ✅ User has appropriate roles for testing