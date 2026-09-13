"use client";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";
import { User } from "@/lib/api-client";
import Button from "@/components/ui/Button";
import { audioManager } from "@/lib/voice/audio-manager";

interface VoiceCallProps {
  currentUser: User | null;
  targetUser: User | null;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export default function VoiceCall({ currentUser, targetUser, onCallStart, onCallEnd }: VoiceCallProps) {
  const { t } = useTranslation();
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  useEffect(() => {
    // Simuler un appel entrant après 5 secondes pour démo
    const timer = setTimeout(() => {
      if (!isInCall && Math.random() > 0.7) {
        setIsIncomingCall(true);
        // Play ringtone for incoming call
        if (ringtoneRef.current) {
          ringtoneRef.current.currentTime = 0;
          ringtoneRef.current.loop = true;
          ringtoneRef.current.play().catch(console.error);
        }
        setTimeout(() => {
          setIsIncomingCall(false);
          // Stop ringtone when call times out
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.loop = false;
          }
        }, 10000); // 10 secondes pour répondre
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      // Stop ringtone on cleanup
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.loop = false;
      }
    };
  }, [isInCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    if (!currentUser || !targetUser) return;

    try {
      // Initialiser l'audio
      await audioManager.initialize();
      audioManager.enableVoiceChat();
      
      setIsInCall(true);
      setIsIncomingCall(false);
      // Stop ringtone when call starts
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.loop = false;
      }
      onCallStart?.();
    } catch (error) {
      console.error("Error starting call:", error);
      alert(t("voice.callError"));
    }
  };

  const handleEndCall = () => {
    audioManager.disableVoiceChat();
    setIsInCall(false);
    setCallDuration(0);
    // Stop ringtone when call ends
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.loop = false;
    }
    onCallEnd?.();
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    // Note: setMuted n'existe pas dans AudioManager, on gère juste l'état local
  };

  const handleAcceptCall = () => {
    handleStartCall();
  };

  const handleRejectCall = () => {
    setIsIncomingCall(false);
    // Stop ringtone when call rejected
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.loop = false;
    }
  };

  if (isIncomingCall && targetUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="bg-[rgba(20,20,20,0.95)] border border-[#4fdfff]/20 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-[#4fdfff]/20 border border-[#4fdfff]/40 flex items-center justify-center mb-6 mx-auto animate-pulse">
              <svg className="w-10 h-10 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              {t("voice.incomingCall")}
            </h3>
            <p className="text-white/80 mb-6">
              {targetUser.username} {t("voice.isCalling")}
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleRejectCall}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t("voice.reject")}
              </Button>
              
              <Button
                onClick={handleAcceptCall}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {t("voice.accept")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isInCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
        <div className="bg-[rgba(20,20,20,0.95)] border border-[#4fdfff]/20 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-[#4fdfff]/20 border border-[#4fdfff]/40 flex items-center justify-center mb-6 mx-auto">
              <svg className="w-12 h-12 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a2 2 0 11-4 0 2 2 0 014 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              {targetUser?.username || t("voice.unknownUser")}
            </h3>
            <p className="text-[#4fdfff] text-lg font-mono mb-6">
              {formatDuration(callDuration)}
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleToggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-[#4fdfff] hover:bg-[#4fdfff]/80'
                }`}
              >
                {isMuted ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </Button>
              
              <Button
                onClick={handleEndCall}
                className="bg-red-600 hover:bg-red-700 text-white w-14 h-14 rounded-full flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-1C21 6.716 14.284 0 6 0H5a2 2 0 00-2 2v1z" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Hidden audio element for ringtone */}
      <audio
        ref={ringtoneRef}
        src="/ringtone.mp3"
        preload="auto"
      />
      <Button
        onClick={handleStartCall}
        className="bg-[#4fdfff] hover:bg-[#4fdfff]/80 text-black px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        {t("voice.call")}
      </Button>
    </div>
  );
}
