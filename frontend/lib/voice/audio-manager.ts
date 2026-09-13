// Gestionnaire audio pour les appels vocaux
export class AudioManager {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isInitialized = false;

  // Initialiser l'audio
  async initialize(): Promise<boolean> {
    try {
      // Demander l'accès au microphone
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: false
      });

      console.log("Microphone access granted, tracks:", this.localStream.getAudioTracks().length);

      // Créer le contexte audio
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Créer les noeuds audio
      this.gainNode = this.audioContext.createGain();
      this.analyser = this.audioContext.createAnalyser();
      
      // Connecter le stream audio au contexte
      this.source = this.audioContext.createMediaStreamSource(this.localStream);
      this.source.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      // Connecter le gain node à la destination SEULEMENT si monitoring mode est activé
      // this.gainNode.connect(this.audioContext.destination);
      
      // Configurer l'analyser pour une meilleure détection
      this.analyser.fftSize = 2048; // Augmenter pour une meilleure résolution
      this.analyser.smoothingTimeConstant = 0.3; // Réduire pour une meilleure réactivité
      this.analyser.minDecibels = -90; // Configurer la plage de décibels
      this.analyser.maxDecibels = -10;
      
      this.isInitialized = true;
      console.log("Audio manager initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      return false;
    }
  }

  // Obtenir le stream local
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Vérifier si l'audio est initialisé
  isReady(): boolean {
    return this.isInitialized && this.localStream !== null;
  }

  // Mettre en sourdine (mute)
  setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  // Ajuster le volume
  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Activer/désactiver le mode monitoring
  setMonitoringMode(enabled: boolean): void {
    if (!this.gainNode || !this.audioContext) return;
    
    // Déconnecter d'abord
    this.gainNode.disconnect();
    
    if (enabled) {
      // Connecter au destination pour entendre le micro
      this.gainNode.connect(this.audioContext.destination);
      console.log("Monitoring mode enabled");
    } else {
      // Ne pas connecter pour éviter l'écho
      console.log("Monitoring mode disabled");
    }
  }

  // Activer l'audio pour le salon vocal
  enableVoiceChat(): void {
    if (!this.gainNode || !this.audioContext) return;
    
    // NE PAS activer le monitoring pour éviter l'écho
    // Le monitoring ne sert que pour les tests, pas pour les appels réels
    this.setMonitoringMode(false);
    console.log("Voice chat enabled - monitoring disabled to prevent echo");
  }

  // Désactiver l'audio du salon vocal
  disableVoiceChat(): void {
    if (!this.gainNode || !this.audioContext) return;
    
    // Désactiver le monitoring
    this.setMonitoringMode(false);
    console.log("Voice chat disabled - monitoring deactivated");
  }

  // Obtenir le niveau audio actuel
  getAudioLevel(): number {
    if (!this.analyser) return 0;
    
    // Utiliser getByteTimeDomainData pour une meilleure détection du niveau audio
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    
    // Calculer la moyenne des valeurs absolues
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      // Normaliser entre -1 et 1, puis prendre la valeur absolue
      const normalizedValue = (dataArray[i] - 128) / 128;
      sum += Math.abs(normalizedValue);
    }
    
    const average = sum / bufferLength;
    
    // Appliquer une courbe logarithmique pour une meilleure perception
    const logarithmicLevel = Math.log10(1 + average * 9) / Math.log10(10);
    
    return Math.min(1, Math.max(0, logarithmicLevel));
  }

  // Créer un stream de monitoring (sans sortie audio)
  createMonitoringStream(): MediaStream | null {
    if (!this.audioContext || !this.gainNode) return null;
    
    // Créer un script processor pour le monitoring
    const bufferSize = 4096;
    const scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    scriptProcessor.onaudioprocess = (event) => {
      // Le traitement audio se fait ici si nécessaire
      // Pour l'instant, on laisse passer les données
    };
    
    // Connecter le gain node au script processor
    this.gainNode.connect(scriptProcessor);
    
    // Créer un stream de destination
    const destination = this.audioContext.createMediaStreamDestination();
    scriptProcessor.connect(destination);
    
    return destination.stream;
  }

  // Obtenir les informations de débug
  getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      hasStream: !!this.localStream,
      streamActive: this.localStream?.active || false,
      audioTracksCount: this.localStream?.getAudioTracks().length || 0,
      audioContextState: this.audioContext?.state,
      analyserFftSize: this.analyser?.fftSize
    };
  }

  // Nettoyer les ressources
  cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.gainNode = null;
    this.analyser = null;
    this.isInitialized = false;
  }
}

export const audioManager = new AudioManager();
