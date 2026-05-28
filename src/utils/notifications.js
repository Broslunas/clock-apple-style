// Broslunas Clock — System Notifications Manager

let notifPermission = Notification.permission;

/**
 * Request notification permission from the user.
 * Returns 'granted', 'denied', or 'default'.
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (notifPermission === 'granted') return 'granted';
    
    try {
        notifPermission = await Notification.requestPermission();
        return notifPermission;
    } catch (e) {
        return 'denied';
    }
}

/**
 * Get current permission status without requesting.
 */
export function getNotificationPermission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

/**
 * Fire a system notification.
 * @param {string} title  - Notification title
 * @param {string} body   - Notification body text
 * @param {string} [icon] - Optional icon URL
 */
export function fireNotification(title, body, icon = '/icon-192.png') {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        const notif = new Notification(title, {
            body,
            icon,
            badge: '/icon-192.png',
            tag: 'broslunas-clock',
            renotify: true,
            silent: false,
        });

        // Auto-close after 8 seconds
        setTimeout(() => notif.close(), 8000);

        return notif;
    } catch (e) {
        console.warn('[Notifications] Failed to fire notification:', e);
    }
}
