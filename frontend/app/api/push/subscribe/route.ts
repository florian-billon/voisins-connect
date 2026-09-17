import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // Envoyer l'abonnement au backend
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.cookies.get("hello-world.auth.token")?.value}`,
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error("Failed to subscribe to push notifications");
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
