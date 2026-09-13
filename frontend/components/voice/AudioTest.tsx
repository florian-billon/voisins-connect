"use client";
import { useState, useEffect, useRef } from "react";
import { audioManager } from "@/lib/voice/audio-manager";
import Button from "@/components/ui/Button";

export default function AudioTest() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [audioLevel, setAudioLevel] = useState(0);
  const [monitoringMode, setMonitoringMode] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Initialiser l'audio au montage
  useEffect(() => {
    initializeAudio();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioManager.cleanup();
    };
  }, []);

  // Initialiser l'audio
  const initializeAudio = async () => {
    const success = await audioManager.initialize();
    setIsInitialized(success);
    
    if (success) {
      // Démarrer l'animation pour le niveau audio
      updateAudioLevel();
    }
  };

  // Mettre à jour le niveau audio
  const updateAudioLevel = () => {
    const level = audioManager.getAudioLevel();
    setAudioLevel(level);
    
    // Log de débug pour voir les valeurs
    if (level > 0.01) {
      console.log("Audio level detected:", level);
    }
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  // Gérer le mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioManager.setMuted(newMuted);
  };

  // Gérer le mode monitoring
  const toggleMonitoring = () => {
    const newMonitoring = !monitoringMode;
    setMonitoringMode(newMonitoring);
    audioManager.setMonitoringMode(newMonitoring);
  };

  // Gérer le volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
      <h3 className="text-white text-lg font-semibold mb-4">Test Audio</h3>
      
      {!isInitialized ? (
        <div className="text-center">
          <Button onClick={initializeAudio} className="bg-blue-600 hover:bg-blue-700 text-white">
            Initialiser l'Audio
          </Button>
          <p className="text-white/60 mt-2 text-sm">
            Cliquez pour activer votre microphone
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Indicateur de niveau audio */}
          <div className="space-y-2">
            <div className="flex justify-between text-white/60 text-sm">
              <span>Niveau Audio</span>
              <span>{Math.round(audioLevel * 100)}%</span>
            </div>
            <div className="w-full bg-[#333] rounded-full h-2 overflow-hidden">
              <div 
                className="bg-green-500 h-full transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          </div>

          {/* Contrôles */}
          <div className="space-y-3">
            {/* Mode Monitoring */}
            <Button
              onClick={toggleMonitoring}
              className={`w-full ${monitoringMode ? 'bg-green-600 hover:bg-green-700' : 'bg-[#333] hover:bg-[#444]'} text-white`}
            >
              {monitoringMode ? "🔊 Monitoring ON" : "🔇 Monitoring OFF"}
            </Button>

            {/* Bouton Mute */}
            <Button
              onClick={toggleMute}
              className={`w-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-[#333] hover:bg-[#444]'} text-white`}
            >
              {isMuted ? "🔇 Micro désactivé" : "🎤 Micro activé"}
            </Button>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex justify-between text-white/60 text-sm">
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

                  </div>
      )}
    </div>
  );
}
