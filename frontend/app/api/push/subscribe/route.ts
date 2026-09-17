import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/config";
import { getStoredToken } from "@/lib/token-storage";

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    const token = getStoredToken();

    // Envoyer l'abonnement au backend
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      console.error("Backend subscription failed, but continuing locally");
      // On continue même si le backend échoue
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to push notifications" },
      { status: 500 }
    );
  }
}
