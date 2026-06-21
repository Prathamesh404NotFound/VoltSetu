# VoltSetu — Firebase Database Setup Instructions

## 🔧 Fixing Permission Denied Error

The `PERMISSION_DENIED` error occurs because Firebase Realtime Database has default security rules that prevent writing data. Follow these steps to fix it:

### Option 1: Quick Fix (Development Only)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `charge-nest` (Firebase project ID — unchanged)
3. Navigate to **Realtime Database** from the left menu
4. Click on **Rules** tab
5. Replace the existing rules with:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

6. Click **Publish**

### Option 2: Proper Security Setup (Recommended)

1. Use the provided `database.rules.json` file in your project
2. Deploy using Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only database
   ```

### Option 3: Manual Setup in Console

Copy these rules to your Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    
    "hostRegistrations": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "$registrationId": {
          ".read": "$uid === auth.uid",
          ".write": "$uid === auth.uid && newData.child('userId').val() === auth.uid",
          ".validate": "newData.hasChildren(['userId', 'fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'outletType', 'chargingSpeed', 'availableHours', 'pricePerHour', 'agreeToTerms']) && newData.child('agreeToTerms').val() === true && newData.child('userId').val() === auth.uid"
        }
      }
    },
    
    "chargingSpots": {
      ".read": "auth != null",
      "$spotId": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.uid === data.child('hostId').val() || auth.uid === newData.child('hostId').val())",
        ".validate": "newData.hasChildren(['hostId', 'hostName', 'address', 'city', 'state', 'pincode', 'outletType', 'pricePerHour'])"
      }
    }
  }
}
```

## 🔐 Security Features

- **User Isolation**: Users can only read/write their own data
- **Authentication Required**: All operations require user login
- **Data Validation**: Ensures required fields are present
- **Terms Agreement**: Validates that users agree to terms

## 🚀 After Setup

1. Test the registration flow at `/host`
2. Verify data appears in Firebase Console
3. Check that users can only see their own registrations

## 📱 Testing

1. Sign in with Google
2. Go to Become Host page
3. Click "Register Now"
4. Complete the 5-step form
5. Submit and verify success

The registration should now work without permission errors!
