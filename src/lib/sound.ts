import type { SoundEffect, SoundCategory, GameSettings } from '@/types';

// Custom audio node wrapper for advanced audio processing
interface CustomAudioNode {
  audio: HTMLAudioElement;
  gainNode?: GainNode;
  source?: MediaElementAudioSourceNode;
}

// Sound manager configuration
interface SoundConfig {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  ambientVolume: number;
  voiceVolume: number;
  muted: boolean;
  fadeTime: number;
}

// Sound instance for tracking playing sounds
interface SoundInstance {
  id: string;
  audio: HTMLAudioElement;
  category: SoundCategory;
  startTime: number;
  fadeInterval?: NodeJS.Timeout;
  audioNode?: CustomAudioNode;
}

class SoundManager {
  private config: SoundConfig;
  private loadedSounds: Map<string, HTMLAudioElement> = new Map();
  private playingSounds: Map<string, SoundInstance> = new Map();
  private audioContext?: AudioContext;
  private masterGainNode?: GainNode;
  private categoryGainNodes: Map<SoundCategory, GainNode> = new Map();
  private audioNodes: Map<string, CustomAudioNode> = new Map();
  private isInitialized = false;

  constructor() {
    this.config = {
      masterVolume: 1.0,
      sfxVolume: 1.0,
      musicVolume: 0.7,
      ambientVolume: 0.5,
      voiceVolume: 1.0,
      muted: false,
      fadeTime: 1000, // 1 second
    };
  }

  // Initialize audio context and gain nodes
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context with browser compatibility
      this.audioContext = new AudioContext();
      
      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = this.config.masterVolume;

      // Create category-specific gain nodes
      const categories: SoundCategory[] = ['sfx', 'music', 'ambient', 'voice'];
      categories.forEach(category => {
        const gainNode = this.audioContext!.createGain();
        gainNode.connect(this.masterGainNode!);
        gainNode.gain.value = this.getCategoryVolume(category);
        this.categoryGainNodes.set(category, gainNode);
      });

      this.isInitialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported, falling back to HTML5 audio:', error);
      this.isInitialized = true; // Still allow basic functionality
    }
  }

  // Load a sound effect
  async loadSound(soundEffect: SoundEffect): Promise<void> {
    if (this.loadedSounds.has(soundEffect.id)) return;

    try {
      const audio = new Audio(soundEffect.url);
      audio.preload = 'auto';
      audio.volume = this.calculateVolume(soundEffect.category, soundEffect.volume);
      audio.loop = soundEffect.loop;
      
      // Wait for the audio to be ready
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });

      this.loadedSounds.set(soundEffect.id, audio);
    } catch (error) {
      console.error(`Failed to load sound: ${soundEffect.name}`, error);
    }
  }

  // Load multiple sounds
  async loadSounds(soundEffects: SoundEffect[]): Promise<void> {
    const loadPromises = soundEffects.map(sound => this.loadSound(sound));
    await Promise.allSettled(loadPromises);
  }

  // Enhanced method to create CustomAudioNode for advanced audio processing
  private createAudioNode(audio: HTMLAudioElement, category: SoundCategory): CustomAudioNode {
    const audioNode: CustomAudioNode = {
      audio,
    };

    if (this.audioContext) {
      try {
        // Create media element source
        const source = this.audioContext.createMediaElementSource(audio);
        audioNode.source = source;

        // Create gain node for this specific audio
        const gainNode = this.audioContext.createGain();
        audioNode.gainNode = gainNode;

        // Connect: source -> gainNode -> categoryGainNode -> masterGainNode -> destination
        const categoryGainNode = this.categoryGainNodes.get(category);
        if (categoryGainNode) {
          source.connect(gainNode);
          gainNode.connect(categoryGainNode);
        } else {
          source.connect(gainNode);
          gainNode.connect(this.masterGainNode!);
        }
      } catch (error) {
        console.warn('Failed to create Web Audio API nodes:', error);
      }
    }

    return audioNode;
  }

  // Enhanced playSound method using CustomAudioNode
  async playSound(
    soundId: string, 
    options: {
      volume?: number;
      loop?: boolean;
      fadeIn?: boolean;
      category?: SoundCategory;
      spatialAudio?: { x: number; y: number; z: number };
    } = {}
  ): Promise<string | null> {
    await this.initialize();

    const audio = this.loadedSounds.get(soundId);
    if (!audio) {
      console.warn(`Sound not found: ${soundId}`);
      return null;
    }

    // Clone the audio for multiple simultaneous plays
    const audioClone = audio.cloneNode() as HTMLAudioElement;
    const instanceId = `${soundId}_${Date.now()}_${Math.random()}`;
    const category = options.category || 'sfx';
    
    // Create CustomAudioNode for advanced processing
    const audioNode = this.createAudioNode(audioClone, category);
    this.audioNodes.set(instanceId, audioNode);

    // Apply options
    if (options.volume !== undefined) {
      if (audioNode.gainNode) {
        audioNode.gainNode.gain.value = options.volume;
      } else {
        audioClone.volume = this.calculateVolume(category, options.volume);
      }
    }
    if (options.loop !== undefined) {
      audioClone.loop = options.loop;
    }

    // Apply spatial audio if supported and requested
    if (options.spatialAudio && this.audioContext && audioNode.source) {
      try {
        const panner = this.audioContext.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        
        panner.positionX.setValueAtTime(options.spatialAudio.x, this.audioContext.currentTime);
        panner.positionY.setValueAtTime(options.spatialAudio.y, this.audioContext.currentTime);
        panner.positionZ.setValueAtTime(options.spatialAudio.z, this.audioContext.currentTime);

        // Reconnect with panner
        if (audioNode.gainNode) {
          audioNode.source.disconnect();
          audioNode.source.connect(panner);
          panner.connect(audioNode.gainNode);
        }
      } catch (error) {
        console.warn('Failed to apply spatial audio:', error);
      }
    }

    // Create sound instance with CustomAudioNode
    const instance: SoundInstance = {
      id: instanceId,
      audio: audioClone,
      category,
      startTime: Date.now(),
      audioNode,
    };

    // Handle fade in
    if (options.fadeIn) {
      if (audioNode.gainNode) {
        audioNode.gainNode.gain.value = 0;
        this.fadeInWithGainNode(audioNode.gainNode, this.config.fadeTime, options.volume || 1);
      } else {
        audioClone.volume = 0;
        this.fadeIn(instance, this.config.fadeTime);
      }
    }

    // Clean up when sound ends
    audioClone.addEventListener('ended', () => {
      this.stopSound(instanceId);
    });

    this.playingSounds.set(instanceId, instance);
    
    try {
      await audioClone.play();
      return instanceId;
    } catch (error) {
      console.error(`Failed to play sound: ${soundId}`, error);
      this.playingSounds.delete(instanceId);
      this.audioNodes.delete(instanceId);
      return null;
    }
  }

  // Enhanced fade methods for Web Audio API
  private fadeInWithGainNode(gainNode: GainNode, duration: number, targetVolume: number): void {
    if (!this.audioContext) return;
    
    const currentTime = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000);
  }

  private fadeOutWithGainNode(gainNode: GainNode, duration: number): void {
    if (!this.audioContext) return;
    
    const currentTime = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);
  }

  // Method to apply audio effects using CustomAudioNode
  applyAudioEffect(
    instanceId: string, 
    effect: 'reverb' | 'delay' | 'distortion' | 'lowpass' | 'highpass',
    intensity: number = 0.5
  ): void {
    const audioNode = this.audioNodes.get(instanceId);
    if (!audioNode?.source || !this.audioContext) return;

    try {
      let effectNode: AudioNode;
      
      switch (effect) {
        case 'lowpass':
          const lowpass = this.audioContext.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = 1000 * (1 - intensity);
          effectNode = lowpass;
          break;
          
        case 'highpass':
          const highpass = this.audioContext.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 1000 * intensity;
          effectNode = highpass;
          break;
          
        case 'delay':
          const delay = this.audioContext.createDelay();
          delay.delayTime.value = intensity * 0.5;
          effectNode = delay;
          break;
          
        default:
          return;
      }

      // Reconnect with effect
      if (audioNode.gainNode && effectNode) {
        audioNode.source.disconnect();
        audioNode.source.connect(effectNode);
        effectNode.connect(audioNode.gainNode);
      }
    } catch (error) {
      console.warn(`Failed to apply ${effect} effect:`, error);
    }
  }

  // Stop a specific sound instance
  stopSound(instanceId: string, fadeOut = false): void {
    const instance = this.playingSounds.get(instanceId);
    if (!instance) return;

    if (fadeOut) {
      this.fadeOut(instance, this.config.fadeTime);
    } else {
      instance.audio.pause();
      instance.audio.currentTime = 0;
      this.cleanupInstance(instanceId);
    }
  }

  // Stop all sounds of a specific category
  stopSoundsByCategory(category: SoundCategory, fadeOut = false): void {
    this.playingSounds.forEach((instance, instanceId) => {
      if (instance.category === category) {
        this.stopSound(instanceId, fadeOut);
      }
    });
  }

  // Stop all sounds
  stopAllSounds(fadeOut = false): void {
    this.playingSounds.forEach((_, instanceId) => {
      this.stopSound(instanceId, fadeOut);
    });
  }

  // Pause/Resume functionality
  pauseSound(instanceId: string): void {
    const instance = this.playingSounds.get(instanceId);
    if (instance && !instance.audio.paused) {
      instance.audio.pause();
    }
  }

  resumeSound(instanceId: string): void {
    const instance = this.playingSounds.get(instanceId);
    if (instance && instance.audio.paused) {
      instance.audio.play().catch(console.error);
    }
  }

  // Volume controls
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.config.masterVolume;
    }
    this.updateAllVolumes();
  }

  setCategoryVolume(category: SoundCategory, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    switch (category) {
      case 'sfx':
        this.config.sfxVolume = clampedVolume;
        break;
      case 'music':
        this.config.musicVolume = clampedVolume;
        break;
      case 'ambient':
        this.config.ambientVolume = clampedVolume;
        break;
      case 'voice':
        this.config.voiceVolume = clampedVolume;
        break;
    }

    const gainNode = this.categoryGainNodes.get(category);
    if (gainNode) {
      gainNode.gain.value = clampedVolume;
    }
    
    this.updateCategoryVolumes(category);
  }

  // Mute controls
  setMuted(muted: boolean): void {
    this.config.muted = muted;
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = muted ? 0 : this.config.masterVolume;
    } else {
      this.updateAllVolumes();
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.config.muted);
    return this.config.muted;
  }

  // Apply game settings
  applyGameSettings(settings: Partial<GameSettings>): void {
    if (settings.soundVolume !== undefined) {
      this.setCategoryVolume('sfx', settings.soundVolume);
    }
    if (settings.musicVolume !== undefined) {
      this.setCategoryVolume('music', settings.musicVolume);
    }
  }

  // Getters
  getMasterVolume(): number {
    return this.config.masterVolume;
  }

  getCategoryVolume(category: SoundCategory): number {
    switch (category) {
      case 'sfx': return this.config.sfxVolume;
      case 'music': return this.config.musicVolume;
      case 'ambient': return this.config.ambientVolume;
      case 'voice': return this.config.voiceVolume;
      default: return 1.0;
    }
  }

  isMuted(): boolean {
    return this.config.muted;
  }

  getPlayingSounds(): string[] {
    return Array.from(this.playingSounds.keys());
  }

  isPlaying(instanceId: string): boolean {
    const instance = this.playingSounds.get(instanceId);
    return instance ? !instance.audio.paused : false;
  }

  // Private helper methods
  private calculateVolume(category: SoundCategory, soundVolume: number): number {
    if (this.config.muted) return 0;
    
    const categoryVolume = this.getCategoryVolume(category);
    return this.config.masterVolume * categoryVolume * soundVolume;
  }

  private updateAllVolumes(): void {
    this.playingSounds.forEach(instance => {
      const originalAudio = this.loadedSounds.get(instance.id.split('_')[0]);
      if (originalAudio) {
        instance.audio.volume = this.calculateVolume(
          instance.category,
          originalAudio.volume
        );
      }
    });
  }

  private updateCategoryVolumes(category: SoundCategory): void {
    this.playingSounds.forEach(instance => {
      if (instance.category === category) {
        const originalAudio = this.loadedSounds.get(instance.id.split('_')[0]);
        if (originalAudio) {
          instance.audio.volume = this.calculateVolume(
            category,
            originalAudio.volume
          );
        }
      }
    });
  }

  private fadeIn(instance: SoundInstance, duration: number): void {
    const targetVolume = instance.audio.volume;
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    instance.fadeInterval = setInterval(() => {
      currentStep++;
      instance.audio.volume = Math.min(targetVolume, volumeStep * currentStep);
      
      if (currentStep >= steps) {
        if (instance.fadeInterval) {
          clearInterval(instance.fadeInterval);
          instance.fadeInterval = undefined;
        }
      }
    }, stepTime);
  }

  private fadeOut(instance: SoundInstance, duration: number): void {
    const initialVolume = instance.audio.volume;
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = initialVolume / steps;
    let currentStep = 0;

    instance.fadeInterval = setInterval(() => {
      currentStep++;
      instance.audio.volume = Math.max(0, initialVolume - (volumeStep * currentStep));
      
      if (currentStep >= steps || instance.audio.volume <= 0) {
        instance.audio.pause();
        instance.audio.currentTime = 0;
        this.cleanupInstance(instance.id);
      }
    }, stepTime);
  }

  private cleanupInstance(instanceId: string): void {
    const instance = this.playingSounds.get(instanceId);
    if (instance?.fadeInterval) {
      clearInterval(instance.fadeInterval);
    }
    
    // Clean up CustomAudioNode connections
    const audioNode = this.audioNodes.get(instanceId);
    if (audioNode?.source) {
      try {
        audioNode.source.disconnect();
      } catch (error) {
        console.log(error);
      }
    }
    if (audioNode?.gainNode) {
      try {
        audioNode.gainNode.disconnect();
      } catch (error) {
        console.log(error);
      }
    }
    
    this.playingSounds.delete(instanceId);
    this.audioNodes.delete(instanceId);
  }

  // Cleanup method
  dispose(): void {
    this.stopAllSounds();
    this.loadedSounds.clear();
    this.playingSounds.clear();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Create and export singleton instance
export const soundManager = new SoundManager();

// Export utility functions
export const playSound = (soundId: string, options?: Parameters<typeof soundManager.playSound>[1]) => 
  soundManager.playSound(soundId, options);

export const stopSound = (instanceId: string, fadeOut?: boolean) => 
  soundManager.stopSound(instanceId, fadeOut);

export const setMasterVolume = (volume: number) => 
  soundManager.setMasterVolume(volume);

export const setCategoryVolume = (category: SoundCategory, volume: number) => 
  soundManager.setCategoryVolume(category, volume);

export const toggleMute = () => 
  soundManager.toggleMute();

// Preload common game sounds
export const preloadGameSounds = async (sounds: SoundEffect[]) => {
  await soundManager.initialize();
  await soundManager.loadSounds(sounds);
};

// Horror game specific utilities
export const playHorrorAmbient = async (ambientSoundId: string) => {
  return soundManager.playSound(ambientSoundId, {
    category: 'ambient',
    loop: true,
    fadeIn: true,
    volume: 0.3
  });
};

export const playJumpScare = async (scareSoundId: string) => {
  return soundManager.playSound(scareSoundId, {
    category: 'sfx',
    volume: 1.0
  });
};

export const playFootsteps = async (footstepSoundId: string) => {
  return soundManager.playSound(footstepSoundId, {
    category: 'sfx',
    volume: 0.7
  });
};

export const playBackgroundMusic = async (musicId: string) => {
  // Stop any existing music first
  soundManager.stopSoundsByCategory('music', true);
  
  return soundManager.playSound(musicId, {
    category: 'music',
    loop: true,
    fadeIn: true,
    volume: 0.6
  });
};

export default soundManager;