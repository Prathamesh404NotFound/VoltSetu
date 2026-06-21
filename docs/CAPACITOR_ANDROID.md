# ChargeNest Android Build & Workflow (Capacitor)

This project uses **Capacitor** to package the React/Vite web application as a native Android app.

## Prerequisites

1.  **Android Studio** installed on your machine.
2.  **Android SDK** and **Build Tools** configured.
3.  **Gradle** (managed by Android Studio).

## Developer Workflow

Whenever you make changes to the web code (React components, CSS, services), you must sync those changes into the Android native project:

1.  **Build the Web Project**:
    ```bash
    npm run build
    ```
    This generates the latest production assets in the `dist/` folder.

2.  **Sync to Android**:
    ```bash
    npx cap sync android
    ```
    This copies the `dist/` folder into the Android platform and updates any native plugins.

3.  **Run/Build in Android Studio**:
    *   Open the native project: `npx cap open android`
    *   In Android Studio, click **"Run"** (green play icon) or **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## Key Files

*   `capacitor.config.ts`: Capacitor configuration (app ID, name, etc.).
*   `android/`: The native Android Gradle project.
*   `src/lib/browserNotifications.ts`: Handles both web notifications and native LocalNotifications.
*   `src/components/Auth/AuthProvider.tsx`: Automatically switches between Firebase Web SDK and Native Authentication.

## Native Plugin Highlights

*   **Firebase Authentication**: Uses native Google Sign-In flows for better reliability.
*   **Geolocation**: Uses native GPS for faster and more accurate positioning.
*   **Local Notifications**: Triggers OS notifications that work even when the app is backgrounded.

## Troubleshooting

### Firebase Auth Errors
Ensure `androidScheme: 'https'` is set in `capacitor.config.ts`. If using deep links, ensure your SHA-1 fingerprints are added to the Firebase Console.

### Location Issues
Check `android/app/src/main/AndroidManifest.xml` for `ACCESS_FINE_LOCATION` permissions. Ensure GPS is enabled on the device/emulator.
