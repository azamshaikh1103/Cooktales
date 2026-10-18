import { notificationClient } from '@/lib/api/notificationClient';

type PushSubscriptionJson = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: { p256dh?: string; auth?: string };
};

const SERVICE_WORKER_PATH = '/cooktale-push-sw.js';

export function isBrowserPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function browserPushPermission() {
  return isBrowserPushSupported() ? Notification.permission : 'unsupported';
}

export async function enableBrowserPush() {
  if (!isBrowserPushSupported()) {
    throw new Error('Browser notifications are not supported on this device.');
  }

  if (Notification.permission === 'denied') {
    throw new Error('Browser alerts are blocked. Allow notifications in this site’s browser settings first.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Browser notification permission was not granted.');
  }

  const config = await notificationClient.pushConfig();
  if (!config.enabled || !config.publicKey) {
    throw new Error('Browser notifications are not available right now.');
  }

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' });
  await registration.update();
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(config.publicKey),
    });
  }

  const data = subscription.toJSON() as PushSubscriptionJson;
  if (!data.endpoint || !data.keys?.p256dh || !data.keys.auth) {
    throw new Error('The browser returned an incomplete notification subscription.');
  }
  await notificationClient.subscribePush({
    endpoint: data.endpoint,
    p256dh: data.keys.p256dh,
    auth: data.keys.auth,
    expirationTime: data.expirationTime || null,
  });
}

export async function sendBrowserPushTest() {
  if (!isBrowserPushSupported()) {
    throw new Error('Browser notifications are not supported on this device.');
  }
  if (Notification.permission !== 'granted') {
    throw new Error('Allow browser alerts first, then save your notification settings.');
  }

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' });
  await registration.update();
  const activeRegistration = await navigator.serviceWorker.ready;
  await activeRegistration.showNotification('CookTale', {
    body: 'Browser alerts are ready for your kitchen activity.',
    icon: '/favicon-512x512.png',
    badge: '/favicon-512x512.png',
    tag: `cooktale-browser-test-${Date.now()}`,
    data: { url: '/notifications' },
  });
}

export async function disableBrowserPush() {
  if (!isBrowserPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await notificationClient.unsubscribePush(subscription.endpoint);
  await subscription.unsubscribe();
}

function base64UrlToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}
