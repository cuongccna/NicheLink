# Mock Authentication Guide

## Overview
The app is currently running in MOCK MODE to allow testing without a real backend server.

## Test Accounts

### For Login Testing:
- **Email**: `test@example.com`
- **Password**: `password123`
- **Role**: Influencer (auto-assigned in mock)

### For Registration Testing:
- Use any valid email format (except `existing@example.com` which will trigger an "email already exists" error)
- Use any password with at least 8 characters
- Choose either Influencer or Business role
- Fill in first name and last name

## Mock Behavior

### Login:
- ✅ Success: Use `test@example.com` with `password123`
- ❌ Failure: Any other email/password combination will show "Invalid email or password"
- ⏱️ Simulated delay: 1 second

### Registration:
- ✅ Success: Any valid data (except existing email)
- ❌ Failure: Use `existing@example.com` to test "email already exists" error
- ❌ Validation: Empty fields will be rejected
- ⏱️ Simulated delay: 1.5 seconds

## Features Working:
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Token storage
- ✅ User session management
- ✅ Navigation after login/register

## To Switch to Real Backend:
1. Open `services/authService.ts`
2. Change `const MOCK_MODE = true;` to `const MOCK_MODE = false;`
3. Update `API_BASE_URL` to your real backend URL
4. Restart the app

## Testing Steps:
1. **Test Registration**: Fill out registration form with any valid data
2. **Test Login**: Use test@example.com / password123
3. **Test Navigation**: After login, you should see the main tabs
4. **Test Logout**: Use logout function to clear session
