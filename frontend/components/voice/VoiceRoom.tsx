"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { VoiceChannel } from "@/lib/api-client";
import Button from "@/components/ui/Button";
import { audioManager } from "@/lib/voice/audio-manager";

interface VoiceRoomProps {
  voiceChannel: VoiceChannel | null;
  onLeave: () => void;
}

export default function VoiceRoom({ voiceChannel, onLeave }: VoiceRoomProps) {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (voiceChannel) {
      // Simuler des participants pour le salon
      setParticipants([
        { id: '1', name: 'Vous', speaking: false, muted: false },
        { id: '2', name: 'Utilisateur 2', speaking: false, muted: true },
        { id: '3', name: 'Utilisateur 3', speaking: true, muted: false }
      ]);
      
      // Activer l'audio pour le salon vocal
      audioManager.enableVoiceChat();
    } else {
      // Désactiver l'audio quand on quitte
      audioManager.disableVoiceChat();
      setParticipants([]);
    }

    return () => {
      audioManager.disableVoiceChat();
    };
  }, [voiceChannel]);

  useEffect(() => {
    // Simuler la détection de parole
    const interval = setInterval(() => {
      const level = audioManager.getAudioLevel();
      setIsSpeaking(level > 0.1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioManager.setMuted(newMuted);
  };

  const handleLeave = () => {
    audioManager.disableVoiceChat();
    onLeave();
  };

  if (!voiceChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/40">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#4fdfff]/10 border border-[#4fdfff]/20 flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Salon Vocal</p>
          <p className="text-sm">Rejoignez un salon vocal pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[rgba(5,10,15,0.95)]">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#4fdfff]/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4fdfff]/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-semibold">{voiceChannel.name}</h2>
            <p className="text-white/60 text-sm">{participants.length} participants</p>
          </div>
        </div>
        
        <Button
          onClick={handleLeave}
          variant="outline"
          className="border-red-500 text-red-400 hover:bg-red-500/10"
        >
          {t("voice.leave")}
        </Button>
      </div>

      {/* Participants */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="bg-[rgba(20,20,20,0.8)] border border-[#4fdfff]/20 rounded-lg p-4 flex flex-col items-center"
            >
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-[#4fdfff]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                
                {/* Indicateur de parole */}
                {participant.speaking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-[rgba(5,10,15,0.95)]"></div>
                )}
                
                {/* Indicateur de mute */}
                {participant.muted && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[rgba(5,10,15,0.95)] flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-white font-medium mb-1">{participant.name}</p>
                <div className="flex items-center justify-center gap-2 text-xs">
                  {participant.speaking && (
                    <span className="text-green-400">Parle</span>
                  )}
                  {participant.muted && (
                    <span className="text-red-400">Muet</span>
                  )}
                  {!participant.muted && !participant.speaking && (
                    <span className="text-gray-400">Silence</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="h-20 px-6 flex items-center justify-center border-t border-[#4fdfff]/20">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-[#4fdfff] hover:bg-[#4fdfff]/80'
            } text-white flex items-center justify-center`}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </Button>
          
          <div className="text-white/60 text-sm">
            {isMuted ? 'Micro muet' : 'Micro actif'}
          </div>
        </div>
      </div>
    </div>
  );
}
