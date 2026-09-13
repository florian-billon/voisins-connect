"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { VoiceChannel } from "@/lib/api-client";

interface VoiceContextType {
  currentUserVoiceChannel: VoiceChannel | null;
  setCurrentUserVoiceChannel: (channel: VoiceChannel | null) => void;
  isInVoiceChannel: boolean;
  resetVoiceChannel: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [currentUserVoiceChannel, setCurrentUserVoiceChannel] = useState<VoiceChannel | null>(null);

  const isInVoiceChannel = currentUserVoiceChannel !== null;

  const resetVoiceChannel = () => {
    setCurrentUserVoiceChannel(null);
  };

  return (
    <VoiceContext.Provider value={{
      currentUserVoiceChannel,
      setCurrentUserVoiceChannel,
      isInVoiceChannel,
      resetVoiceChannel
    }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
