# Quick Fix for "Invalid Token" Error

## The Problem
Restaurant owners are getting "401 Unauthorized - Invalid token" when accessing the dashboard.

## Root Cause
The multi-tenant login is generating tokens, but they might not be in the correct format for tenant API endpoints.

## Immediate Solution

### Step 1: Clear Everything
1. Open browser DevTools (F12)
2. Go to Application → Storage → Clear site data
3. Close browser completely

### Step 2: Test with Direct Tenant Login (Bypass Multi-Login)
Instead of using the multi-tenant login, let's test if single-tenant login works.

**Temporarily modify the login to use single-tenant:**

In `admin/src/app/login/page.tsx`, when clicking "Restaurant User", we need to:
1. First call `/api/auth/find-tenants` to get the user's restaurants
2. Then call `/auth/login` with the specific tenant ID

### Step 3: Verify Backend is Running
Make sure backend is running on port 3000:
```bash
cd backend
npm run dev
```

### Step 4: Check Token in Browser
After login:
1. Open DevTools → Application → Local Storage
2. Check if `accessToken` exists
3. Copy the token
4. Go to https://jwt.io
5. Paste the token to decode it
6. Verify it has:
   - `typ: "tenant"` (not "platform_admin")
   - `tenant_id: "some-uuid"`
   - `sub: "user-id"`

## Alternative: Use Platform Admin Login
If restaurant owner login isn't working, you can:
1. Login as Platform Admin
2. Select a restaurant from the dropdown
3. This should work because platform admins have proper tokens

## Debug Steps
If still not working:

1. **Check backend logs** - Look for JWT errors
2. **Check browser console** - Look for 401 errors
3. **Verify JWT_SECRET** - Make sure `.env` has `JWT_SECRET` set in backend
4. **Check token expiry** - Tokens expire after 15 minutes

## Expected Flow
1. User logs in → Gets `access_token` and `refresh_token`
2. Token stored in localStorage
3. Every API call includes: `Authorization: Bearer <token>`
4. Backend verifies token and allows access

## If Nothing Works
The safest option is to use **Platform Admin** login for now, which we know works correctly.
