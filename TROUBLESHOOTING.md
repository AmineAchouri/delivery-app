# Troubleshooting Guide

## Issue: Getting kicked out / 404 error after login

### Solution:
1. **Clear browser data:**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear all localStorage
   - Clear all cookies
   - Close DevTools

2. **Restart both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd admin
   npm run dev
   ```

3. **Try logging in again:**
   - Go to http://localhost:3001/login
   - Select "Restaurant User" tab
   - Use: `owner@bella-italia.com` / `owner123`

## Issue: Features not showing correctly

### Solution:
Make sure you're logged in with the correct account type:
- **Platform Admin** → Use "Platform Admin" tab on login
- **Restaurant Owner** → Use "Restaurant User" tab on login
- **Customers** → Cannot access admin dashboard (this is correct)

## Issue: "Token refresh failed"

### Solution:
1. Logout completely
2. Clear localStorage
3. Login again

## Common Mistakes:

### ❌ Wrong: Trying to login as customer to admin dashboard
Customers (`john.doe@example.com`, etc.) cannot access the admin dashboard.

### ✅ Correct: Login as restaurant owner
Use owner accounts: `owner@bella-italia.com`, `owner@sushi-master.com`, etc.

### ❌ Wrong: Using wrong login tab
If you're a restaurant owner, use "Restaurant User" tab, not "Platform Admin"

### ✅ Correct: Match account type to login tab
- Platform admins → "Platform Admin" tab
- Restaurant owners → "Restaurant User" tab

## Quick Test:
1. Go to http://localhost:3001/login
2. Click "Restaurant User" tab
3. Email: `owner@bella-italia.com`
4. Password: `owner123`
5. Should see dashboard with all features enabled

## Still having issues?

Check the browser console (F12) for errors and the terminal for backend errors.
