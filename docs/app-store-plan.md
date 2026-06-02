# App Store Publishing Plan

## Overview
Package the existing PWA for iOS App Store and Google Play Store using Capacitor.
Capacitor wraps the web app in a native shell with full app store compliance.

## Prerequisites
- [ ] Apple Developer Program ($99/year) — enroll at developer.apple.com
- [ ] Google Play Console account ($25 one-time) — play.google.com/console
- [ ] Mac with Xcode installed (required for iOS builds)
- [ ] Android Studio installed (for Play Store builds)

## Step 1: Add Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "SOAR House Points" "org.soarcharteracademy.housepoints"
npx cap add ios
npx cap add android
```

## Step 2: Build and Sync

```bash
npm run build
npx cap sync
```

## Step 3: iOS (App Store)
1. Open `npx cap open ios` — opens Xcode
2. Set bundle ID: `org.soarcharteracademy.housepoints`
3. Set team to your Apple Developer account
4. Create App ID and provisioning profile in developer.apple.com
5. Add app icons (1024×1024 PNG, no alpha)
6. Add launch screen
7. Product → Archive → Distribute to App Store Connect
8. In App Store Connect: add screenshots, description, age rating (4+), submit for review

## Step 4: Android (Play Store)
1. Open `npx cap open android` — opens Android Studio
2. Build → Generate Signed Bundle/APK → Android App Bundle
3. Create keystore (save this permanently — losing it means you can never update the app)
4. Upload .aab to Play Console → Create new release
5. Add screenshots, description, content rating, submit for review

## Timeline
- Apple review: 1-3 days typically
- Google review: hours to a few days

## App Store Requirements Checklist
- [ ] Privacy policy URL (required by both stores)
- [ ] App icons at all required sizes
- [ ] Screenshots for each device size
- [ ] Age rating completed (this app: 4+, no objectionable content)
- [ ] Description and keywords
- [ ] Support URL

## Notes
- The app uses Google OAuth for login. Apple requires apps to also offer "Sign in with Apple" 
  if they offer other social logins. This may require adding Apple Sign-In via Supabase.
- Consider a separate `capacitor.config.ts` pointing to `soarpoints.web.app` for the 
  server URL so updates to the web app propagate without App Store resubmission.