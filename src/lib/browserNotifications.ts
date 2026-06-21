/**
 * browserNotifications.ts
 *
 * Provides wrappers for the native browser Notification API.
 *
 * CRITICAL LIMITATION:
 * This ONLY works while the VoltSetu tab is open (either active or backgrounded).
 * If the user closes the tab or the entire browser process, no notification will
 * fire. This is a lightweight, zero-infrastructure alternative to Firebase
 * Cloud Messaging (FCM).
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Checks if browser support exists and requests permission from the user.
 * Returns true if permission is granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (error) {
      console.error("Native notification permission error:", error);
      return false;
    }
  }

  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

/**
 * Shows a native OS-level notification if permissions are granted.
 *
 * @param title    The notification title
 * @param body     The notification body text
 * @param onClick  Optional callback when the notification is clicked
 */
export function showBrowserNotification(
  title: string,
  body: string,
  onClick?: () => void
) {
  if (Capacitor.isNativePlatform()) {
    LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 1000000),
          schedule: { at: new Date(Date.now() + 100) }, // basically immediate
          extra: { onClick }
        }
      ]
    });

    // Handle standard capacitor click listener globally or just let it fire
    // Note: LocalNotifications.addListener('localNotificationActionPerformed', ...)
    // would be needed in a central place like App.tsx to handle the 'extra' onClick.
    return;
  }

  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/placeholder.svg", // Reusing placeholder from public/
    });

    notification.onclick = () => {
      // Focus the window if it exists
      window.focus();
      if (onClick) {
        onClick();
      }
      notification.close();
    };
  }
}
