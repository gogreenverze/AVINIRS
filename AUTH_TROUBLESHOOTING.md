# Authentication Troubleshooting Guide

## Overview
This guide helps diagnose and fix authentication issues in the AVINI Labs application, particularly the "Invalid token" error that occurs during navigation.

## Common Issues and Solutions

### 1. "Invalid token" Error During Navigation

**Symptoms:**
- User can log in successfully
- After navigating to different pages, receives "Invalid token" error
- User gets redirected to login page unexpectedly

**Root Causes:**
- Token expiration (1 hour default)
- User ID type mismatch in token validation
- Inconsistent axios instance usage
- File I/O race conditions when reading users.json

**Solutions Implemented:**
- Enhanced token validation with detailed logging
- Added user ID type compatibility (string/integer)
- Unified axios instance usage across frontend
- Added token refresh mechanism
- Improved error handling and debugging

### 2. Token Validation Process

The authentication flow now includes:

1. **Token Generation** (Login)
   - JWT token created with user ID in payload
   - 1-hour expiration time
   - Stored in localStorage

2. **Token Validation** (Each Request)
   - Extract token from Authorization header
   - Decode and verify JWT signature
   - Look up user in users.json with ID compatibility
   - Check user active status
   - Add user to request context

3. **Token Refresh** (Automatic)
   - Attempt refresh on 401 errors
   - Generate new token if current token is valid but expired
   - Retry original request with new token

## Debugging Tools

### 1. Backend Logging
The backend now includes detailed authentication logging:
```
[AUTH DEBUG] Token decoded successfully. User ID: 1, Type: <class 'int'>
[AUTH SUCCESS] User admin authenticated for /api/patients
[AUTH ERROR] User not found in database. Looking for ID: 1
```

### 2. Frontend Logging
The frontend includes API request/response logging:
```
[API] Request: GET /auth/user Token: Present
[API] Response: 200 GET /auth/user
[AUTH] Login successful for user: admin
```

### 3. Token Validation Endpoint
New endpoint for debugging token issues:
```bash
POST /api/auth/validate
Authorization: Bearer <token>
```

Response:
```json
{
  "valid": true,
  "user_id": 1,
  "username": "admin",
  "role": "admin",
  "is_active": true,
  "exp": 1640995200,
  "iat": 1640991600
}
```

### 4. Test Script
Run the authentication test script:
```bash
python test_auth.py
```

## Configuration

### Environment Variables
- `JWT_SECRET_KEY`: Set a strong secret key for production
  ```bash
  export JWT_SECRET_KEY="your-super-secure-secret-key-here"
  ```

### Token Expiration
Default: 1 hour (3600 seconds)
To modify, update `JWT_EXPIRATION` in `backend/utils.py`

## Troubleshooting Steps

### Step 1: Check Backend Logs
1. Start the backend server
2. Attempt to reproduce the issue
3. Check console output for authentication logs
4. Look for specific error patterns:
   - `[AUTH ERROR] User not found`
   - `[AUTH ERROR] Token expired`
   - `[AUTH ERROR] Invalid token`

### Step 2: Validate Token
Use the validation endpoint to check token status:
```bash
curl -X POST http://localhost:5001/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 3: Check User Data
Verify user exists in `backend/data/users.json`:
- User ID matches token payload
- User is active (`is_active: true`)
- User has required fields

### Step 4: Test Token Refresh
```bash
curl -X POST http://localhost:5001/api/auth/refresh \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 5: Frontend Network Tab
1. Open browser developer tools
2. Go to Network tab
3. Reproduce the issue
4. Check for:
   - 401 responses
   - Missing Authorization headers
   - Failed token refresh attempts

## Prevention

### 1. Regular Token Refresh
The frontend now automatically refreshes tokens on 401 errors, reducing login interruptions.

### 2. Better Error Handling
Improved error messages help identify specific authentication issues.

### 3. Consistent API Usage
All frontend requests now use the same axios instance with proper interceptors.

### 4. Enhanced Logging
Detailed logging helps track authentication flow and identify issues quickly.

## Security Considerations

1. **Secret Key**: Use a strong, unique secret key in production
2. **Token Expiration**: Consider shorter expiration times for sensitive applications
3. **HTTPS**: Always use HTTPS in production to protect tokens in transit
4. **Token Storage**: Consider more secure storage options than localStorage for sensitive applications

## Support

If issues persist after following this guide:
1. Check the backend console for detailed error logs
2. Run the test script to verify basic functionality
3. Use the token validation endpoint to debug specific tokens
4. Review the network tab for failed requests
