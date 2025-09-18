const PUBLIC_VAPID_KEY = 'YOUR_PUBLIC_VAPID_KEY'; // Replace with your actual VAPID key

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('User is already subscribed.');
      return subscription;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
    });

    console.log('User subscribed:', subscription);

    // Here you would typically send the subscription to your backend
    // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(subscription), ... })

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe the user: ', error);
  }
}
