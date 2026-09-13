"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "message" | "friend" | "call";
  timestamp: Date;
}

export default function NotificationSystem() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for custom notification events
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { title, message, type } = event.detail;
      const newNotification: Notification = {
        id: Date.now().toString(),
        title,
        message,
        type: type || "message",
        timestamp: new Date(),
      };
      
      setNotifications((prev) => [newNotification, ...prev].slice(0, 5)); // Keep only last 5
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 5000);
    };

    window.addEventListener("notification", handleNotification as EventListener);
    return () => window.removeEventListener("notification", handleNotification as EventListener);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case "friend":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case "call":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "message":
        return "bg-[#4fdfff]/20 border-[#4fdfff]/50";
      case "friend":
        return "bg-green-500/20 border-green-500/50";
      case "call":
        return "bg-purple-500/20 border-purple-500/50";
      default:
        return "bg-white/10 border-white/30";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto max-w-sm w-full ${getColor(notification.type)} border rounded-lg p-4 shadow-lg backdrop-blur-md animate-in slide-in-from-right duration-300`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-[#4fdfff]">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{notification.title}</p>
              <p className="text-sm text-white/70 mt-1">{notification.message}</p>
              <p className="text-xs text-white/40 mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to trigger notifications
export function showNotification(title: string, message: string, type: "message" | "friend" | "call" = "message") {
  const event = new CustomEvent("notification", { detail: { title, message, type } });
  window.dispatchEvent(event);
}
