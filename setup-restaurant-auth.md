# Restaurant Dashboard Authentication Setup

## Overview
The restaurant dashboard now requires authentication to ensure only authorized staff can access it. This guide will help you set up user accounts for restaurant staff.

## Setup Steps

### 1. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** in the left sidebar
4. Click **Get started** if not already enabled
5. Go to **Sign-in method** tab
6. Enable **Email/Password** authentication
7. Click **Save**

### 2. Create Restaurant Staff Accounts

#### Option A: Using Firebase Console (Recommended for initial setup)

1. In Firebase Console, go to **Authentication** → **Users**
2. Click **Add user**
3. Enter the staff member's email and password
4. Click **Add user**
5. Repeat for all staff members

#### Option B: Using Admin Panel (Future enhancement)

You can create a simple admin panel to manage staff accounts, but for now, use the Firebase Console method.

### 3. Recommended Staff Accounts

Create these accounts for your restaurant:

```
Email: manager@nagisceylon.com.au
Password: [secure password]

Email: kitchen@nagisceylon.com.au  
Password: [secure password]

Email: staff@nagisceylon.com.au
Password: [secure password]
```

### 4. Security Best Practices

- Use strong passwords (at least 8 characters, mix of letters, numbers, symbols)
- Each staff member should have their own account
- Regularly update passwords
- Remove accounts for staff who no longer work at the restaurant
- Consider enabling 2-factor authentication for additional security

### 5. Testing the Authentication

1. Navigate to `/restaurant-dashboard` in your app
2. You should see a login form
3. Enter the credentials you created
4. You should be redirected to the dashboard
5. Test the logout functionality

## Features

### ✅ Authentication Features
- **Secure Login**: Email/password authentication
- **Session Management**: Users stay logged in until they logout
- **Logout Function**: Clear logout button in dashboard header
- **Error Handling**: Clear error messages for invalid credentials
- **Loading States**: Proper loading indicators during authentication

### ✅ Security Features
- **Firebase Security**: Industry-standard authentication
- **Protected Routes**: Dashboard only accessible to authenticated users
- **Session Persistence**: Users don't need to login repeatedly
- **Secure Logout**: Proper session cleanup

### ✅ User Experience
- **Clean Login Form**: Professional, branded login interface
- **Responsive Design**: Works on all devices
- **Clear Messaging**: Helpful error messages and instructions
- **Smooth Transitions**: Loading states and animations

## Troubleshooting

### Common Issues

1. **"Invalid email or password"**
   - Check that the user account exists in Firebase Console
   - Verify the email and password are correct
   - Ensure Email/Password authentication is enabled

2. **"Firebase not initialized"**
   - Check your environment variables are set correctly
   - Verify Firebase configuration in `src/firebase/config.js`

3. **"Permission denied"**
   - Check Firebase Authentication rules
   - Ensure the user account is properly created

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase Console settings
3. Test with a simple email/password combination
4. Check that all environment variables are set correctly

## Next Steps

Once authentication is working:

1. **Train Staff**: Show staff how to login and use the dashboard
2. **Monitor Usage**: Check Firebase Console for login activity
3. **Regular Maintenance**: Update passwords and remove old accounts
4. **Consider Enhancements**: Add user roles, activity logging, etc.

The restaurant dashboard is now secure and only accessible to authorized staff members! 🔐
