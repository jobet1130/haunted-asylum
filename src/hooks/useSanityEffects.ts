import { useState, useEffect, useCallback, useRef } from "react";
import type { Player, VisualEffect } from "@/types";

interface SanityEffectConfig {
  intensity: number;
  duration: number;
  frequency: number;
}

interface HallucinationEffect {
  id: string;
  type:
    | "flicker"
    | "distortion"
    | "shadow"
    | "text-scramble"
    | "false-enemy"
    | "phantom-sound";
  intensity: number;
  duration: number;
  timestamp: number;
  visualEffect?: VisualEffect;
}

interface UseSanityEffectsReturn {
  activeEffects: HallucinationEffect[];
  screenDistortion: number;
  textScramble: boolean;
  phantomShadows: boolean;
  audioDistortion: number;
  falseEnemies: string[];
  activeVisualEffects: VisualEffect[];
  triggerHallucination: (type: HallucinationEffect["type"]) => void;
  clearAllEffects: () => void;
}

const useSanityEffects = (player: Player | null): UseSanityEffectsReturn => {
  const [activeEffects, setActiveEffects] = useState<HallucinationEffect[]>([]);
  const [activeVisualEffects, setActiveVisualEffects] = useState<
    VisualEffect[]
  >([]);
  const [screenDistortion, setScreenDistortion] = useState(0);
  const [textScramble, setTextScramble] = useState(false);
  const [phantomShadows, setPhantomShadows] = useState(false);
  const [audioDistortion, setAudioDistortion] = useState(0);
  const [falseEnemies, setFalseEnemies] = useState<string[]>([]);

  const effectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTriggerRef = useRef(0);

  // Calculate sanity-based effect configuration
  const getSanityEffectConfig = useCallback(
    (sanity: number): SanityEffectConfig => {
      const sanityPercentage = sanity / 100;

      if (sanityPercentage > 0.8) {
        return { intensity: 0, duration: 0, frequency: 0 };
      } else if (sanityPercentage > 0.6) {
        return { intensity: 0.2, duration: 1000, frequency: 10000 };
      } else if (sanityPercentage > 0.4) {
        return { intensity: 0.4, duration: 2000, frequency: 7000 };
      } else if (sanityPercentage > 0.2) {
        return { intensity: 0.6, duration: 3000, frequency: 5000 };
      } else {
        return { intensity: 0.8, duration: 5000, frequency: 3000 };
      }
    },
    [],
  );

  // Clear all active effects
  const clearAllEffects = useCallback(() => {
    setActiveEffects([]);
    setActiveVisualEffects([]);
    setScreenDistortion(0);
    setTextScramble(false);
    setPhantomShadows(false);
    setAudioDistortion(0);
    setFalseEnemies([]);

    if (effectTimerRef.current) {
      clearInterval(effectTimerRef.current);
      effectTimerRef.current = null;
    }
  }, []);

  // Trigger a specific hallucination effect
  const triggerHallucination = useCallback(
    (type: HallucinationEffect["type"]) => {
      if (!player) return;

      const config = getSanityEffectConfig(player.sanity);
      const effectId = `${type}-${Date.now()}`;

      // Create visual effect based on hallucination type
      let visualEffect: VisualEffect | undefined;

      switch (type) {
        case "flicker":
          visualEffect = {
            id: `visual-${effectId}`,
            type: "flash",
            duration: config.duration,
            intensity: config.intensity,
            color: "#ffffff",
          };
          break;
        case "distortion":
          visualEffect = {
            id: `visual-${effectId}`,
            type: "distortion",
            duration: config.duration,
            intensity: config.intensity,
          };
          setScreenDistortion((prev) => Math.min(prev + config.intensity, 1));
          break;
        case "shadow":
          visualEffect = {
            id: `visual-${effectId}`,
            type: "fade",
            duration: config.duration,
            intensity: config.intensity,
            color: "#000000",
          };
          setPhantomShadows(true);
          break;
        case "text-scramble":
          setTextScramble(true);
          break;
        case "false-enemy":
          setFalseEnemies((prev) => [...prev, effectId]);
          break;
        case "phantom-sound":
          setAudioDistortion((prev) => Math.min(prev + config.intensity, 1));
          break;
      }

      const newEffect: HallucinationEffect = {
        id: effectId,
        type,
        intensity: config.intensity,
        duration: config.duration,
        timestamp: Date.now(),
        visualEffect,
      };

      setActiveEffects((prev) => [...prev, newEffect]);

      // Add visual effect if created
      if (visualEffect) {
        setActiveVisualEffects((prev) => [...prev, visualEffect]);
      }

      // Remove effect after duration
      setTimeout(() => {
        setActiveEffects((prev) =>
          prev.filter((effect) => effect.id !== effectId),
        );

        // Clean up specific effect states
        switch (type) {
          case "distortion":
            setScreenDistortion((prev) => Math.max(prev - config.intensity, 0));
            break;
          case "shadow":
            setPhantomShadows(false);
            break;
          case "text-scramble":
            setTextScramble(false);
            break;
          case "false-enemy":
            setFalseEnemies((prev) => prev.filter((id) => id !== effectId));
            break;
          case "phantom-sound":
            setAudioDistortion((prev) => Math.max(prev - config.intensity, 0));
            break;
        }

        if (visualEffect) {
          setActiveVisualEffects((prev) =>
            prev.filter((effect) => effect.id !== visualEffect.id),
          );
        }
      }, config.duration);
    },
    [player, getSanityEffectConfig],
  );

  // Auto-trigger effects based on sanity level
  useEffect(() => {
    if (!player) return;

    const config = getSanityEffectConfig(player.sanity);
    if (config.frequency === 0) {
      clearAllEffects();
      return;
    }

    const scheduleNextEffect = () => {
      const now = Date.now();
      if (now - lastTriggerRef.current < config.frequency) return;

      // Randomly select effect type based on sanity level
      const effectTypes: HallucinationEffect["type"][] = [
        "flicker",
        "distortion",
      ];

      if (player.sanity < 60) {
        effectTypes.push("shadow", "text-scramble");
      }

      if (player.sanity < 40) {
        effectTypes.push("false-enemy", "phantom-sound");
      }

      const randomType =
        effectTypes[Math.floor(Math.random() * effectTypes.length)];

      // Random chance to trigger based on sanity
      const triggerChance = (100 - player.sanity) / 100;
      if (Math.random() < triggerChance) {
        triggerHallucination(randomType);
        lastTriggerRef.current = now;
      }
    };

    // Set up recurring effect triggers
    effectTimerRef.current = setInterval(scheduleNextEffect, 1000);

    return () => {
      if (effectTimerRef.current) {
        clearInterval(effectTimerRef.current);
        effectTimerRef.current = null;
      }
    };
  }, [player, getSanityEffectConfig, triggerHallucination, clearAllEffects]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearAllEffects();
    };
  }, [clearAllEffects]);

  return {
    activeEffects,
    screenDistortion,
    textScramble,
    phantomShadows,
    audioDistortion,
    falseEnemies,
    activeVisualEffects,
    triggerHallucination,
    clearAllEffects,
  };
};

export default useSanityEffects;
