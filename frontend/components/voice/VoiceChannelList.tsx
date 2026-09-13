"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Server, VoiceChannel } from "@/lib/api-client";
import Button from "@/components/ui/Button";
import AudioTest from "@/components/voice/AudioTest";
import { audioManager } from "@/lib/voice/audio-manager";
import { useVoice } from "@/contexts/VoiceContext";
import { API_URL } from "@/lib/config";

interface VoiceChannelListProps {
  selectedServer: Server | null;
  user: any;
  onJoinVoiceChannel: (channel: VoiceChannel) => void;
  onLeaveVoiceChannel: () => void;
  currentUserVoiceChannel: VoiceChannel | null;
}

export default function VoiceChannelList({
  selectedServer,
  user,
  onJoinVoiceChannel,
  onLeaveVoiceChannel,
  currentUserVoiceChannel,
}: VoiceChannelListProps) {
  const { t } = useTranslation();
  const { resetVoiceChannel } = useVoice();
  const [voiceChannels, setVoiceChannels] = useState<VoiceChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  // Fetch voice channels for the selected server
  useEffect(() => {
    if (!selectedServer) return;

    // Réinitialiser la liste des salons vocaux et le salon actuel lors du changement de serveur
    setVoiceChannels([]);
    resetVoiceChannel();

    const fetchVoiceChannels = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/servers/${selectedServer.id}/voice-channels`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Voice channels fetch error:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            url: `${API_URL}/servers/${selectedServer.id}/voice-channels`
          });
          if (response.status === 404) {
            setError("Serveur non trouvé ou endpoint inexistant");
          } else if (response.status === 401) {
            setError("Non authentifié");
          } else {
            setError(`${t("voice.fetchError")} (${response.status})`);
          }
          return;
        }

        const channels: VoiceChannel[] = await response.json();
        setVoiceChannels(channels);
      } catch (err) {
        console.error("Error fetching voice channels:", err);
        setError(t("voice.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchVoiceChannels();
  }, [selectedServer, t]);

  // Create a new voice channel
  const createVoiceChannel = async () => {
    if (!selectedServer || !newChannelName.trim()) return;

    try {
      // Simulation de création de salon vocal pour le moment
      // Dans un environnement de production, cette fonction contacterait l'API backend
      console.log("Simulation de création de salon vocal...");
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Créer un nouveau salon vocal simulé
      const newChannel: VoiceChannel = {
        id: `voice_${Date.now()}`,
        server_id: selectedServer.id,
        name: newChannelName.trim(),
        position: voiceChannels.length,
        max_users: undefined,
        is_premium_only: false,
        created_at: new Date().toISOString()
      };
      
      // Ajouter le nouveau salon à la liste
      setVoiceChannels([...voiceChannels, newChannel]);
      setNewChannelName("");
      setShowCreateModal(false);
      setError(null);
      
      // Afficher un message de succès
      alert("Salon vocal créé avec succès !");
      
      // Retourner le nouveau salon pour le traitement ultérieur
      return newChannel;
      
    } catch (err) {
      console.error("Error creating voice channel:", err);
      setError(t("voice.createError"));
    }
  };

  // Check if user can create voice channels (free for all)
  const canCreateVoiceChannel = () => {
    return true;
  };

  if (!selectedServer) {
    return (
      <div className="p-4 text-center text-white/40">
        {t("voice.selectServer")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Audio Test Section */}
      <AudioTest />
      
      {/* Voice Channels Section */}
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">{t("voice.channels")}</h3>
          {canCreateVoiceChannel() && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
            >
              + {t("voice.create")}
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && voiceChannels.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#4fdfff]/10 border border-[#4fdfff]/20 flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">{t("voice.noChannels")}</p>
            {canCreateVoiceChannel() && (
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outline"
                className="mt-4 border-[#4fdfff] text-[#4fdfff]"
              >
                {t("voice.createFirstChannel")}
              </Button>
            )}
          </div>
        )}

      <div className="space-y-2">
        {voiceChannels.map((channel) => (
          <div
            key={channel.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              currentUserVoiceChannel?.id === channel.id
                ? "bg-[#4fdfff]/20 border border-[#4fdfff]/30"
                : "bg-white/5 hover:bg-white/10 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4fdfff]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">{channel.name}</p>
                {channel.max_users && (
                  <p className="text-white/40 text-xs">
                    {t("voice.maxUsers", { max: channel.max_users })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUserVoiceChannel?.id === channel.id ? (
                <Button
                  onClick={() => {
                    onLeaveVoiceChannel();
                    // Désactiver l'audio du salon vocal
                    audioManager.disableVoiceChat();
                    setShowParticipantsModal(false);
                  }}
                  variant="outline"
                  className="text-xs px-3 py-1 border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  {t("voice.leave")}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    onJoinVoiceChannel(channel);
                    // Activer l'audio pour le salon vocal
                    audioManager.enableVoiceChat();
                    // Simuler des participants pour le salon
                    setParticipants([
                      { id: '1', name: 'Vous', speaking: false, muted: false },
                      { id: '2', name: 'Utilisateur 2', speaking: false, muted: true },
                      { id: '3', name: 'Utilisateur 3', speaking: true, muted: false }
                    ]);
                    setShowParticipantsModal(true);
                  }}
                  variant="outline"
                  className="text-xs px-3 py-1 border-[#4fdfff] text-[#4fdfff]"
                >
                  {t("voice.join")}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Voice Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">
              {t("voice.createChannelTitle")}
            </h3>
            
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">
                {t("voice.channelName")}
              </label>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder={t("voice.channelNamePlaceholder")}
                className="w-full px-3 py-2 bg-black/50 border border-[#4fdfff]/30 rounded text-white placeholder:text-white/40 outline-none focus:border-[#4fdfff]"
                maxLength={50}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewChannelName("");
                }}
                variant="outline"
                className="border-white/20 text-white/60 hover:bg-white/10"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={createVoiceChannel}
                disabled={!newChannelName.trim()}
                className="bg-[#4fdfff] text-black hover:bg-[#4fdfff]/90 disabled:opacity-50 text-sm px-3 py-1"
              >
                {t("voice.create")}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );

  {/* Participants Modal */}
  {showParticipantsModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">Participants du salon</h3>
          <Button
            onClick={() => setShowParticipantsModal(false)}
            variant="outline"
            className="text-xs px-2 py-1 border-gray-500 text-gray-400 hover:bg-gray-500/10"
          >
            ✕
          </Button>
        </div>
        
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#4fdfff]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{participant.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {participant.speaking && (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    )}
                    {participant.muted && (
                      <span className="text-red-400 text-xs">🔇</span>
                    )}
                    {!participant.muted && !participant.speaking && (
                      <span className="text-gray-400 text-xs">🔊</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
}
