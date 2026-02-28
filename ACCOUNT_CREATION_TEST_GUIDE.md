# 🧪 Account Creation Test Guide

## Current Status: ✅ READY TO TEST

Your application is configured to use **mock authentication** in development mode. This means you can create accounts and login without needing AWS Cognito.

## 🎯 Quick Test Steps

### 1. Open the Application
Navigate to: **http://localhost:5173**

### 2. Test Account Creation

#### Step-by-Step:
1. You should see the login/signup page
2. Click on **"Sign Up"** or **"Create Account"** tab
3. Fill in the form:
   - **Email**: `test@example.com` (or any email format)
   - **Password**: `password123` (or any password)
   - **Name**: `Test User` (or your name)
4. Click **"Sign Up"** button
5. Watch the browser console (F12 → Console tab)

### 3. Expected Results

#### ✅ Success Indicators:
- Console shows: `🔐 Auth Mode: DEVELOPMENT (Mock API)`
- No error messages in console
- You're redirected to the dashboard or main app
- You see your name/email in the header
- Account is created successfully

#### ❌ If You See Errors:
Check the console for specific error messages and report them.

## 🔍 What to Check in Browser Console

Open DevTools (F12) and look for these messages:

### Good Signs ✅
```
🔐 Auth Mode: DEVELOPMENT (Mock API)
```

### Network Tab
1. Open DevTools → Network tab
2. Click "Sign Up"
3. Look for request to: `http://localhost:3001/api/auth/signup`
4. Should return status: `200 OK`
5. Response should contain: `{ user: {...}, token: "..." }`

## 🧪 Test Scenarios

### Test 1: Create New Account
```
Email: user1@test.com
Password: pass123
Name: User One
Expected: Success, redirected to dashboard
```

### Test 2: Try Duplicate Email
```
1. Create account with: user2@test.com
2. Logout
3. Try to create another account with same email
Expected: Error message "User already exists"
```

### Test 3: Login with Created Account
```
1. Create account with: user3@test.com / pass123
2. Logout
3. Login with same credentials
Expected: Success, redirected to dashboard
```

### Test 4: Invalid Credentials
```
1. Try to login with: wrong@test.com / wrongpass
Expected: Error message "Invalid credentials"
```

## 🔧 Troubleshooting

### Problem: "Network Error" or "Failed to fetch"

**Cause**: Mock backend server not running

**Solution**:
```bash
cd frontend
# Check if mock server is running
curl http://localhost:3001/api/health

# If not running, restart:
./START_APP.sh
```

### Problem: "CORS Error"

**Cause**: CORS not configured properly

**Solution**: Mock server already has CORS enabled. Try:
1. Clear browser cache
2. Restart both servers
3. Use Chrome/Edge (better CORS handling)

### Problem: "Cannot read property of undefined"

**Cause**: TypeScript/React error in code

**Solution**:
1. Check browser console for exact error
2. Check frontend server logs
3. Report the specific error message

### Problem: Page doesn't load

**Cause**: Frontend server not running

**Solution**:
```bash
cd frontend
# Check if Vite is running
curl http://localhost:5173

# If not running, restart:
./START_APP.sh
```

## 📊 Verification Checklist

After testing, verify these work:

- [ ] Can access http://localhost:5173
- [ ] Can see login/signup page
- [ ] Can fill in signup form
- [ ] Can click "Sign Up" button
- [ ] Console shows "DEVELOPMENT (Mock API)"
- [ ] Network request to `/api/auth/signup` succeeds
- [ ] Redirected to dashboard after signup
- [ ] Can see user name in header
- [ ] Can logout
- [ ] Can login again with same credentials
- [ ] Session persists on page refresh

## 🎯 What Should Work Now

### ✅ Authentication Features
- Create new account (stored in memory)
- Login with credentials
- Logout
- Session persistence (localStorage)
- Token management
- Auth state changes

### ✅ After Login
- Access dashboard
- Send chat messages
- Upload documents
- View statistics
- Use all app features

## 📝 How Mock Auth Works

### Architecture
```
Browser Form
    ↓
mockAuthService.ts (signUp function)
    ↓
HTTP POST to http://localhost:3001/api/auth/signup
    ↓
mock-server.cjs (Express.js)
    ↓
Store in memory (users Map)
    ↓
Return { user, token }
    ↓
Store in localStorage
    ↓
Update React state
    ↓
Redirect to dashboard
```

### Data Storage
- **Server Side**: In-memory Map (lost on restart)
- **Client Side**: localStorage (persists in browser)
- **Keys**: `mock-auth-user`, `mock-auth-token`

### Session Persistence
When you refresh the page:
1. `mockAuthService` checks localStorage
2. Finds `mock-auth-user` and `mock-auth-token`
3. Restores session automatically
4. You stay logged in!

## 🔐 Security Note

**Important**: This is DEVELOPMENT MODE only!

- ❌ Not secure for production
- ❌ No password hashing
- ❌ No token validation
- ❌ Data lost on server restart
- ❌ No rate limiting
- ❌ No email verification

For production, you'll need to:
- Deploy AWS Cognito
- Use real authentication
- Enable password hashing
- Add security features

## 🎉 Success Criteria

You'll know it's working when:

1. ✅ Console shows "DEVELOPMENT (Mock API)"
2. ✅ Can create account without errors
3. ✅ Redirected to dashboard after signup
4. ✅ Can see your name in the app
5. ✅ Can logout and login again
6. ✅ Session persists on refresh

## 📞 If You Need Help

If account creation still doesn't work:

1. **Check browser console** - Look for error messages
2. **Check Network tab** - See if API request succeeds
3. **Check server logs** - Look at terminal output
4. **Verify servers running**:
   ```bash
   curl http://localhost:3001/api/health
   curl http://localhost:5173
   ```
5. **Report specific error** - Share console error message

## 🚀 Next Steps After Successful Test

Once account creation works:

1. ✅ Test all authentication flows
2. ✅ Explore chat features
3. ✅ Try document upload
4. ✅ Check dashboard statistics
5. ✅ Test PWA features
6. ✅ Try voice features (Chrome/Edge)
7. ✅ Test offline mode

---

**Status**: Ready for Testing  
**Mode**: Development (Mock API)  
**Servers**: Both Running  
**Action Required**: Open http://localhost:5173 and test signup!

