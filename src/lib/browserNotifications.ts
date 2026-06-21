/**
 * browserNotifications.ts
 *
 * Provides wrappers for the native browser Notification API.
 *
 * CRITICAL LIMITATION:
 * This ONLY works while the ChargeNest tab is open (either active or backgrounded).
 * If the user closes the tab or the entire browser process, no notification will
 * fire. This is a lightweight, zero-infrastructure alternative to Firebase
 * Cloud Messaging (FCM).
 */

/**
 * Checks if browser support exists and requests permission from the user.
 * Returns true if permission is granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
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
