"use client";
import { useState, useEffect, useRef } from "react";
import { User, VoiceCall } from "@/lib/api-client";
import Button from "@/components/ui/Button";
import { API_URL } from "@/lib/config";

interface VoiceCallManagerProps {
  user: User | null;
  onIncomingCall: (call: VoiceCall) => void;
  onCallEnded: (callId: string) => void;
}

export default function VoiceCallManager({ user, onIncomingCall, onCallEnded }: VoiceCallManagerProps) {
  const [currentCall, setCurrentCall] = useState<VoiceCall | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebRTC peer connection
  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to other peer via WebSocket
        // This would be implemented with the WebSocket connection
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
        }
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Start a voice call
  const startCall = async (recipientId: string, voiceChannelId?: string) => {
    try {
      const response = await fetch(`${API_URL}/calls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          voice_channel_id: voiceChannelId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initiate call");
      }

      const call: VoiceCall = await response.json();
      setCurrentCall(call);
      
      // Initialize WebRTC
      const pc = initializePeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Send offer to other peer via WebSocket
      // This would be implemented with the WebSocket connection
      
      setIsInCall(true);
      startCallTimer();
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  // Accept an incoming call
  const acceptCall = async (callId: string) => {
    try {
      const response = await fetch(`${API_URL}/calls/${callId}/accept`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to accept call");
      }

      const call: VoiceCall = await response.json();
      setCurrentCall(call);
      
      // Initialize WebRTC and create answer
      const pc = initializePeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      // Handle incoming offer and create answer
      // This would be implemented with the WebSocket connection
      
      setIsInCall(true);
      startCallTimer();
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  // Reject an incoming call
  const rejectCall = async (callId: string) => {
    try {
      await fetch(`${API_URL}/calls/${callId}/reject`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  // End current call
  const endCall = async () => {
    if (!currentCall) return;

    try {
      await fetch(`${API_URL}/calls/${currentCall.id}/end`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      cleanupCall();
      onCallEnded(currentCall.id);
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle deafen
  const toggleDeafen = () => {
    if (localStreamRef.current && remoteStreamRef.current) {
      const localAudioTracks = localStreamRef.current.getAudioTracks();
      const remoteAudioTracks = remoteStreamRef.current.getAudioTracks();
      
      localAudioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = !isDeafened;
      }
      
      setIsDeafened(!isDeafened);
      setIsMuted(!isDeafened);
    }
  };

  // Start call timer
  const startCallTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Cleanup call
  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    setCurrentCall(null);
    setIsInCall(false);
    setCallDuration(0);
    setIsMuted(false);
    setIsDeafened(false);
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, []);

  return (
    <>
      {/* Hidden audio elements */}
      <audio ref={localAudioRef} autoPlay muted playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Call UI */}
      {currentCall && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center mb-6">
              <h3 className="text-white text-lg font-semibold mb-2">
                {currentCall.status === "pending" ? "Incoming Call" : "Voice Call"}
              </h3>
              <p className="text-white/60">
                {currentCall.status === "pending" 
                  ? "Someone is calling you..." 
                  : formatDuration(callDuration)
                }
              </p>
            </div>

            {currentCall.status === "pending" ? (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => acceptCall(currentCall.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => rejectCall(currentCall.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                >
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={toggleMute}
                    className={`p-3 ${isMuted ? 'bg-red-600' : 'bg-[#333]'} hover:opacity-80 text-white`}
                  >
                    {isMuted ? "🔇" : "🎤"}
                  </Button>
                  <Button
                    onClick={toggleDeafen}
                    className={`p-3 ${isDeafened ? 'bg-red-600' : 'bg-[#333]'} hover:opacity-80 text-white`}
                  >
                    {isDeafened ? "🔇" : "🔊"}
                  </Button>
                  <Button
                    onClick={endCall}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                  >
                    End Call
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
