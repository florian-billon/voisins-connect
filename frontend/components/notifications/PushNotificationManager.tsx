"use client";

import { useEffect, useState } from "react";

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check current permission
    setPermission(Notification.permission);

    // Check existing subscription
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Ce navigateur ne supporte pas les notifications");
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await subscribeToPush();
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Convertir la clé VAPID en Uint8Array
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("VAPID public key not configured");
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      setSubscription(subscription);

      // Envoyer l'abonnement au backend
      await sendSubscriptionToBackend(subscription);
    } catch (error) {
      console.error("Error subscribing to push:", error);
    }
  };

  const sendSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error("Failed to send subscription to backend");
      }
    } catch (error) {
      console.error("Error sending subscription:", error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      await checkSubscription();
    } catch (error) {
      console.error("Error unsubscribing:", error);
    }
  };

  // Helper function pour convertir la clé VAPID
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Ne rien afficher si les notifications ne sont pas supportées
  if (!("Notification" in window)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {permission === "default" && (
        <div className="bg-[#1f1f1f] border-2 border-[#4fdfff] rounded-lg p-4 shadow-[0_0_20px_rgba(79,223,255,0.3)]">
          <p className="text-white text-sm mb-3">
            Activez les notifications pour recevoir les messages de vos voisins
          </p>
          <button
            onClick={requestPermission}
            disabled={loading}
            className="w-full py-2 px-4 bg-[#4fdfff] text-black font-bold rounded-lg hover:bg-[#3bc5e8] disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Activer les notifications"}
          </button>
        </div>
      )}

      {permission === "granted" && !subscription && (
        <div className="bg-[#1f1f1f] border-2 border-[#4fdfff] rounded-lg p-4 shadow-[0_0_20px_rgba(79,223,255,0.3)]">
          <p className="text-white text-sm mb-3">
            Abonnez-vous aux notifications push
          </p>
          <button
            onClick={subscribeToPush}
            disabled={loading}
            className="w-full py-2 px-4 bg-[#4fdfff] text-black font-bold rounded-lg hover:bg-[#3bc5e8] disabled:opacity-50"
          >
            {loading ? "Chargement..." : "S'abonner"}
          </button>
        </div>
      )}

      {permission === "denied" && (
        <div className="bg-red-900/80 border-2 border-red-500 rounded-lg p-4">
          <p className="text-white text-sm">
            Les notifications sont bloquées. Activez-les dans les paramètres du navigateur.
          </p>
        </div>
      )}
    </div>
  );
}
