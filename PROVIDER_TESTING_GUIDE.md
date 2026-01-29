# Provider Registration & Authentication Testing Guide

## Summary of Changes Made

### 1. Provider Model Updates ✅
- Added `status` field: 'pending' | 'approved' | 'rejected'
- Added `rejectionReason` field for admin feedback
- Ensures clear provider verification lifecycle

### 2. Authentication Controller Updates ✅
- **Login**: Providers must verify email before login
- **Registration**: Professional data validation (title, registration number, specialties required)
- **Verification Status**: Set to 'pending' on registration
- **Profile Retrieval**: Returns provider data for provider users

### 3. Provider Controller Updates ✅
- **createProviderProfile**: Requires email verification first
- **getProviderById**: Hides unverified providers from unauthorized users
- Only providers themselves and admins can see unverified profiles

### 4. Database Structure ✅
- Providers remain in separate Provider collection (not mixed with User)
- User.role = 'provider' references Provider collection via userId
- Clean separation of concerns

---

## Testing Flow

### Test Case 1: Provider Registration
**Goal**: Register a new provider and verify email is required

**Steps**:
1. Go to provider registration page
2. Fill in all required fields:
   - Email: `test-provider@example.com`
   - Password: `TestPassword123!`
   - First Name: `John`
   - Last Name: `Doe`
   - Title: `Dr`
   - Registration Number: `REG12345678`
   - Specialty: Select at least one (e.g., "emergency_services")
   - Practice Name: `City Wellness Clinic`
   - Address: `123 Main Street, London, UK`
   - Phone: `+44 20 7946 0958`

3. **Expected Result**: 
   - ✅ Registration successful message
   - ✅ Email sent for verification
   - ✅ Provider document created in Provider collection
   - ✅ User document created with role='provider'
   - ✅ verification.status = 'pending'

**Check MongoDB**:
```javascript
// User document should look like:
{
  _id: ObjectId,
  email: "test-provider@example.com",
  role: "provider",
  verification: {
    emailVerified: false,
    emailVerificationToken: "...",
    emailVerificationExpires: Date
  }
}

// Provider document should look like:
{
  _id: ObjectId,
  userId: ObjectId("... ref to user"),
  professionalInfo: {
    title: "Dr",
    registrationNumber: "REG12345678",
    specialties: ["emergency_services"]
  },
  practice: {
    name: "City Wellness Clinic",
    location: {
      type: "Point",
      coordinates: [0, 0]  // Default until updated
    }
  },
  verification: {
    isVerified: false,
    status: "pending",
    documents: []
  }
}
```

---

### Test Case 2: Provider Login Before Email Verification
**Goal**: Verify that login fails without email verification

**Steps**:
1. Try to login with the registered provider credentials
2. Use email: `test-provider@example.com`
3. Use password: `TestPassword123!`

**Expected Result**: ❌
```
Error: "Please verify your email before accessing provider features"
Status: 403 EMAIL_NOT_VERIFIED
```

✅ **This is the correct behavior** - prevents unauthorized access

---

### Test Case 3: Email Verification
**Goal**: Verify the email and enable provider access

**Steps**:
1. Go to the email verification link (in real email or test env)
2. Verify the email
3. User.verification.emailVerified should be set to true

**Check MongoDB**:
```javascript
// User verification should now be:
verification: {
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationExpires: null,
  phoneVerified: false
}
```

---

### Test Case 4: Provider Login After Email Verification
**Goal**: Verify provider can login after email verification

**Steps**:
1. Login with verified email: `test-provider@example.com`
2. Password: `TestPassword123!`

**Expected Result**: ✅
```json
{
  success: true,
  message: "Login successful",
  data: {
    user: { ... },
    accessToken: "...",
    refreshToken: "..."
  }
}
```

✅ **Should redirect to /provider-dashboard**

---

### Test Case 5: Get Profile (Should Include Provider Data)
**Goal**: Verify profile endpoint returns both user and provider data

**Steps**:
1. Login as verified provider
2. Call GET `/api/auth/profile`

**Expected Response**: ✅
```json
{
  success: true,
  data: {
    user: {
      _id: "...",
      email: "test-provider@example.com",
      role: "provider",
      profile: { firstName: "John", lastName: "Doe", ... },
      verification: { emailVerified: true, ... }
    },
    provider: {
      _id: "...",
      userId: "...",
      professionalInfo: { ... },
      practice: { ... },
      verification: {
        isVerified: false,
        status: "pending"  // ← Shows verification status
      }
    }
  }
}
```

---

### Test Case 6: Provider Directory (Before Admin Verification)
**Goal**: Verify unverified providers don't appear in public directory

**Steps**:
1. Login as regular user
2. Go to `/directory` (provider search)
3. Try to search for providers

**Expected Result**: ✅
- Verified providers appear in list
- New provider should NOT appear (status: pending)
- If you try to access by ID: `GET /api/providers/{providerId}`
  - Error: "This provider is not verified yet"

---

### Test Case 7: Admin Verification
**Goal**: Admin approves provider and they appear in directory

**Steps (for Admin User)**:
1. Login as admin
2. Go to admin panel → Providers section
3. Find "John Doe" with status "pending"
4. Review documents and approve
5. Update provider verification:
   ```javascript
   // Admin updates provider:
   {
     verification: {
       isVerified: true,
       status: "approved",
       verifiedAt: new Date(),
       verifiedBy: ObjectId("admin_user_id")
     }
   }
   ```

---

### Test Case 8: Provider Directory (After Admin Verification)
**Goal**: Verified provider now appears in directory

**Steps**:
1. Login as regular user
2. Go to `/directory`
3. Search for providers

**Expected Result**: ✅
- "Dr. John Doe" from "City Wellness Clinic" appears in directory
- Can view full profile
- Can book appointments (if feature enabled)

---

### Test Case 9: Provider Access Control
**Goal**: Verify providers can only create profile after email verification

**Steps**:
1. Register as provider (not yet verified)
2. Try to create/update provider profile endpoint
3. Should fail with: "Please verify your email before creating a provider profile"

**Steps**:
1. Verify email
2. Try to create/update provider profile
3. Should succeed

---

### Test Case 10: Data Isolation
**Goal**: Verify provider and user data are properly isolated

**Checks**:
1. ✅ Providers in separate collection
2. ✅ User.role = 'provider' references Provider via userId
3. ✅ Provider routes only accessible to authenticated users
4. ✅ Provider data not exposed in user endpoints
5. ✅ User data not exposed in provider endpoints

---

## Error Handling Checklist

### During Registration
- ❌ Missing professional data → Error with missing fields
- ❌ Invalid email format → Error
- ❌ Password too short → Error
- ✅ All valid → Provider created with status: pending

### During Login
- ❌ No account → "Invalid email or password"
- ❌ Wrong password → "Invalid email or password"
- ❌ Email not verified → "Please verify your email before accessing provider features"
- ✅ All valid → Login successful, tokens issued

### During Profile Operations
- ❌ Not authenticated → 401 Unauthorized
- ❌ Email not verified → 403 EMAIL_NOT_VERIFIED
- ❌ Provider profile already exists → 409 PROFILE_EXISTS
- ✅ All valid → Operation succeeds

### During Directory Search
- ❌ Try to view unverified provider → 404 NOT_FOUND
- ❌ Search includes only verified → Results filtered
- ✅ Verified providers show up → Full profile visible

---

## Success Criteria

### ✅ Provider Separation
- [ ] User collection has provider entries with role='provider'
- [ ] Provider collection has separate documents
- [ ] No duplicate provider data

### ✅ Email Verification
- [ ] Providers cannot login without email verification
- [ ] Email verification link works
- [ ] After verification, login works

### ✅ Professional Validation
- [ ] Registration requires: title, registration number, specialties
- [ ] If missing, clear error message
- [ ] Data saved correctly to Provider collection

### ✅ Verification Status
- [ ] New providers get status: 'pending'
- [ ] Unverified providers hidden from directory
- [ ] Admin can approve (status: 'approved')
- [ ] Approved providers appear in directory

### ✅ No Errors
- [ ] Provider registration completes without geo errors
- [ ] Provider login completes without database errors
- [ ] Directory displays only verified providers
- [ ] All endpoints return proper error messages

---

## Quick Commands for Testing

### MongoDB Checks
```javascript
// Check users collection
db.users.find({ role: 'provider' })

// Check providers collection
db.providers.find({ verification.status: 'pending' })

// Get a provider with user data
db.providers.findOne().populate('userId')

// Count verified vs unverified
db.providers.countDocuments({ 'verification.isVerified': true })
db.providers.countDocuments({ 'verification.isVerified': false })
```

### API Endpoints to Test
```
POST /api/auth/register-provider     (Register)
POST /api/auth/login                 (Login)
GET  /api/auth/profile               (Get profile with provider data)
POST /api/providers/profile          (Create provider profile)
GET  /api/providers/search           (Search directory - filtered)
GET  /api/providers/:id              (Get by ID - with verification check)
GET  /api/auth/verify-email?token=   (Verify email)
```

---

## Expected Flow Diagram

```
┌─────────────────┐
│ Provider Visit  │
│ Registration    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Submit Registration Form         │
│    - Email, password, name          │
│    - Title, registration number     │
│    - Specialties, practice info     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 2. Validation                       │
│    - Professional data required     │
│    - Location coordinates set       │
│    - Create User (role=provider)    │
│    - Create Provider (status=pend)  │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 3. Send Verification Email          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 4. User Clicks Email Link           │
│    - Email verified = true          │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. Provider Login                   │
│    - Email verified? ✓ Required     │
│    - Login successful               │
│    - Redirect to /provider-dash     │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 6. Admin Reviews & Approves         │
│    - Status: pending → approved     │
│    - isVerified: false → true       │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 7. Provider Appears in Directory    │
│    - Users can find and book        │
└─────────────────────────────────────┘
```

---

## Notes

- Provider data is properly separated in MongoDB
- All validations are in place
- Email verification is mandatory for providers
- Providers can only be found after admin approval
- No more geo-location errors during registration
- Clean error messages for each failure point
