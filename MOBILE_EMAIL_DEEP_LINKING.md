# Mobile App Email Deep Linking Guide

## ✅ Email Functionality for Mobile Apps

The Invoice App backend now sends emails with **deep links** that open your Expo/React Native mobile app directly!

---

## 📱 How It Works

### Email Verification Flow
```
1. User registers in app
   ↓
2. Backend sends email with deep link
   📧 invoiceapp://verify-email?token=abc123
   ↓
3. User taps link in email
   ↓
4. Link opens your mobile app
   ↓
5. App extracts token from URL
   ↓
6. App calls verification API
   ↓
7. ✅ Email verified!
```

### Password Reset Flow
```
1. User requests password reset in app
   ↓
2. Backend sends email with deep link
   📧 invoiceapp://reset-password?token=abc123
   ↓
3. User taps link in email
   ↓
4. Link opens your mobile app
   ↓
5. App shows reset password screen
   ↓
6. User enters new password
   ↓
7. App calls reset API with token
   ↓
8. ✅ Password reset!
```

---

## 🔧 Backend Configuration

### Step 1: Add to `.env`

```env
# ============================================
# MOBILE APP CONFIGURATION
# ============================================

# App Scheme (must match your app.json scheme)
APP_SCHEME=invoiceapp

# Email Configuration (for sending emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Invoice App
```

**Deep Link Format:**
- Email Verification: `invoiceapp://verify-email?token={token}`
- Password Reset: `invoiceapp://reset-password?token={token}`

---

## 📱 Expo App Configuration

### Step 2: Configure `app.json`

Add the scheme to your Expo config:

```json
{
  "expo": {
    "name": "Invoice App",
    "slug": "invoice-app",
    "scheme": "invoiceapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.invoiceapp"
    },
    "android": {
      "package": "com.yourcompany.invoiceapp"
    }
  }
}
```

**Important:** The `scheme` value must match `APP_SCHEME` in your backend `.env`!

---

## 📝 Frontend Implementation

### Step 3: Install Expo Linking

```bash
npx expo install expo-linking
```

### Step 4: Set Up Deep Link Handling

Create a hook for handling deep links:

```typescript
// hooks/useDeepLinking.ts
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export function useDeepLinking() {
  const router = useRouter();

  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };

    // Handle deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    handleInitialUrl();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    const { hostname, queryParams } = Linking.parse(url);

    if (hostname === 'verify-email') {
      const token = queryParams?.token as string;
      if (token) {
        // Navigate to email verification screen
        router.push(`/verify-email?token=${token}`);
      }
    } else if (hostname === 'reset-password') {
      const token = queryParams?.token as string;
      if (token) {
        // Navigate to password reset screen
        router.push(`/reset-password?token=${token}`);
      }
    }
  };
}
```

### Step 5: Use the Hook in Your Root Layout

```typescript
// app/_layout.tsx
import { useDeepLinking } from '@/hooks/useDeepLinking';

export default function RootLayout() {
  useDeepLinking(); // Set up deep link handling

  return (
    <Stack>
      {/* Your screens */}
    </Stack>
  );
}
```

### Step 6: Create Email Verification Screen

```typescript
// app/verify-email.tsx
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { getApiEndpoints } from '@/app/config/api';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await axios.get(
        `${getApiEndpoints().baseURL}/auth/verify-email/${verificationToken}`
      );

      if (response.data.success) {
        setStatus('success');
        setMessage('✅ Email verified successfully!');
        
        // Redirect to login or home after 2 seconds
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {status === 'loading' && (
        <>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={{ marginTop: 20, fontSize: 16 }}>
            Verifying your email...
          </Text>
        </>
      )}
      
      {status === 'success' && (
        <>
          <Text style={{ fontSize: 48 }}>✅</Text>
          <Text style={{ marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>
            {message}
          </Text>
        </>
      )}
      
      {status === 'error' && (
        <>
          <Text style={{ fontSize: 48 }}>❌</Text>
          <Text style={{ marginTop: 20, fontSize: 18, fontWeight: 'bold', color: 'red' }}>
            {message}
          </Text>
        </>
      )}
    </View>
  );
}
```

### Step 7: Create Password Reset Screen

```typescript
// app/reset-password.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { getApiEndpoints } from '@/app/config/api';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${getApiEndpoints().baseURL}/auth/reset-password`,
        {
          token,
          password,
          userType: 'main', // or 'sub' based on your logic
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Password reset successfully! Please login with your new password.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to reset password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Reset Your Password
      </Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 15,
          borderRadius: 8,
          marginBottom: 15,
        }}
        placeholder="New Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={{
          backgroundColor: '#667eea',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={handleResetPassword}
        disabled={loading}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 🧪 Testing Deep Links

### Test in Development

#### iOS Simulator
```bash
xcrun simctl openurl booted invoiceapp://verify-email?token=test123
xcrun simctl openurl booted invoiceapp://reset-password?token=test456
```

#### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "invoiceapp://verify-email?token=test123"
adb shell am start -W -a android.intent.action.VIEW -d "invoiceapp://reset-password?token=test456"
```

#### Expo Go
```bash
npx uri-scheme open invoiceapp://verify-email?token=test123 --ios
npx uri-scheme open invoiceapp://verify-email?token=test123 --android
```

### Test Full Email Flow

1. **Register a new user** with your real email
2. **Check your email** inbox
3. **Tap the "Open App & Verify" button**
4. **App should open** to verification screen
5. **Email should be verified** automatically

---

## 🔒 Security Considerations

### Token Validation
- ✅ Tokens expire (1 hour for password reset)
- ✅ Tokens are single-use
- ✅ Tokens are cryptographically secure (32 bytes)

### Best Practices
- ✅ Never expose tokens in logs (except dev mode)
- ✅ Use HTTPS for production email links
- ✅ Validate tokens on backend before accepting
- ✅ Clear sensitive data after successful actions

---

## 🌐 Universal Links (Production)

For production, consider using **Universal Links** (iOS) and **App Links** (Android) instead of custom URL schemes. They provide better security and user experience.

### Benefits
- No "Open in App?" prompt
- Work even if app is not installed (fallback to website)
- More secure (verified domain ownership)

### Implementation

1. **Create a website** (or use existing domain)
2. **Add Apple App Site Association** file:
   ```json
   // https://yourdomain.com/.well-known/apple-app-site-association
   {
     "applinks": {
       "apps": [],
       "details": [{
         "appID": "TEAMID.com.yourcompany.invoiceapp",
         "paths": ["/verify-email/*", "/reset-password/*"]
       }]
     }
   }
   ```

3. **Add Digital Asset Links** for Android:
   ```json
   // https://yourdomain.com/.well-known/assetlinks.json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.yourcompany.invoiceapp",
       "sha256_cert_fingerprints": ["YOUR_SHA256_CERT_FINGERPRINT"]
     }
   }]
   ```

4. **Update backend to use your domain:**
   ```env
   APP_SCHEME=https://yourdomain.com
   ```

5. **Configure Expo**:
   ```json
   {
     "expo": {
       "ios": {
         "associatedDomains": ["applinks:yourdomain.com"]
       },
       "android": {
         "intentFilters": [{
           "action": "VIEW",
           "data": [{
             "scheme": "https",
             "host": "yourdomain.com",
             "pathPrefix": "/verify-email"
           }],
           "category": ["BROWSABLE", "DEFAULT"]
         }]
       }
     }
   }
   ```

---

## 🔍 Troubleshooting

### Issue: Deep link doesn't open app

**Solutions:**
1. ✅ Verify `scheme` in `app.json` matches `APP_SCHEME` in `.env`
2. ✅ Rebuild the app after changing `app.json`
3. ✅ Check if scheme is already used by another app
4. ✅ Test with `npx uri-scheme list` to see registered schemes

### Issue: Token not found in URL

**Check:**
```typescript
const { token } = useLocalSearchParams();
console.log('Received token:', token); // Debug

if (!token) {
  console.error('No token in URL');
}
```

### Issue: App opens but doesn't navigate

**Ensure:**
1. ✅ Deep link handler is set up in root layout
2. ✅ Routes exist (`app/verify-email.tsx`, `app/reset-password.tsx`)
3. ✅ Router is properly initialized

---

## 📚 Additional Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Expo Deep Linking Guide](https://docs.expo.dev/guides/deep-linking/)
- [Universal Links (iOS)](https://developer.apple.com/ios/universal-links/)
- [App Links (Android)](https://developer.android.com/training/app-links)
- [Testing Deep Links in Expo](https://docs.expo.dev/guides/linking/#testing-urls)

---

## ✅ Quick Setup Checklist

### Backend
- [ ] Add `APP_SCHEME=invoiceapp` to `.env`
- [ ] Configure email settings in `.env`
- [ ] Restart backend server
- [ ] Test in dev mode (emails log to console)

### Mobile App
- [ ] Add `"scheme": "invoiceapp"` to `app.json`
- [ ] Install `expo-linking`
- [ ] Create `useDeepLinking` hook
- [ ] Add hook to root layout
- [ ] Create `verify-email.tsx` screen
- [ ] Create `reset-password.tsx` screen
- [ ] Rebuild app
- [ ] Test deep links with test tokens

### Testing
- [ ] Register with real email
- [ ] Check email inbox
- [ ] Tap email button
- [ ] Verify app opens
- [ ] Verify email is confirmed
- [ ] Test password reset flow

---

## 🎉 Success!

Your Invoice App now has:
- 📧 Professional email functionality
- 📱 Deep linking to open mobile app from emails
- ✅ Email verification
- 🔐 Password reset
- 🚀 Production-ready implementation

**Implementation Date:** January 17, 2026  
**Status:** 🟢 **Ready for Mobile!**
