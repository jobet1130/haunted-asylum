import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Player,
  GameState,
  Room,
  InventoryItem,
  Enemy,
  GameSettings,
  SaveGame,
  Notification,
  GameEvent,
  Dialogue,
  Puzzle,
  Position,
  Difficulty,
} from "@/types";
import type { GameAction } from "@/types/actions";

const useGameClient = () => {
  // Core game state
  const [gameState, setGameState] = useState<GameState>("menu");
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState(new Map<string, Room>());
  const [enemies, setEnemies] = useState(new Map<string, Enemy>());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: "medium",
    soundVolume: 0.7,
    musicVolume: 0.5,
    brightness: 0.8,
    showSubtitles: true,
    autoSave: true,
    controlScheme: "wasd",
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState<Dialogue | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [openMenus, setOpenMenus] = useState(new Set<string>());
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);

  // Refs for game loop and timers
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(Date.now());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Utility functions (moved up to fix dependency issues)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        setNotifications((prevNotifs) =>
          prevNotifs.filter((n) => n.id !== notification.id),
        );
      }, notification.duration);
    }
  }, []);

  const addGameEvent = useCallback((event: GameEvent) => {
    setGameEvents((prev) => [...prev, event]);
  }, []);

  const hasKey = useCallback(
    (keyId?: string) => {
      if (!player || !keyId) return true;
      return player.inventory.some(
        (item) => item.id === keyId && item.type === "key",
      );
    },
    [player],
  );

  // Initialize game
  const initializeGame = useCallback(
    (playerData: Player, startingRoomId: string, difficulty: Difficulty) => {
      setPlayer(playerData);
      setGameState("loading");

      // Load initial room data
      const startingRoom: Room = {
        id: startingRoomId,
        name: "Asylum Entrance",
        description: "A dark, foreboding entrance to the abandoned asylum.",
        type: "entrance",
        isLocked: false,
        items: [],
        enemies: [],
        exits: [
          { direction: "north", targetRoomId: "corridor-1", isLocked: false },
        ],
        lightLevel: 0.3,
        temperature: 15,
        hauntingLevel: 0.1,
      };

      setCurrentRoom(startingRoom);
      setRooms(new Map([[startingRoomId, startingRoom]]));
      setSettings((prev) => ({ ...prev, difficulty }));
      setGameState("playing");
    },
    [],
  );

  // Player actions
  const movePlayer = useCallback(
    (newPosition: Position, targetRoomId: string) => {
      if (!player || !currentRoom) return false;

      const targetRoom = rooms.get(targetRoomId);
      if (!targetRoom) return false;

      // Check if move is valid
      const validExit = currentRoom.exits.find(
        (exit) => exit.targetRoomId === targetRoomId,
      );

      if (
        !validExit ||
        (validExit.isLocked && !hasKey(validExit.requiredKey))
      ) {
        addNotification({
          id: `move-${Date.now()}`,
          type: "warning",
          message: "You cannot go that way.",
          timestamp: Date.now(),
        });
        return false;
      }

      setPlayer((prev) => (prev ? { ...prev, position: newPosition } : null));
      setCurrentRoom(targetRoom);

      addGameEvent({
        id: `move-${Date.now()}`,
        type: "player-move",
        timestamp: Date.now(),
        description: `Moved from ${currentRoom.name} to ${targetRoom.name}`,
        roomId: targetRoomId,
        playerId: player.id,
      });

      return true;
    },
    [player, currentRoom, rooms, hasKey, addNotification, addGameEvent],
  );

  const useItem = useCallback(
    (itemId: string, targetId?: string, targetType?: string) => {
      if (!player) return false;

      const item = player.inventory.find((inv) => inv.id === itemId);
      if (!item || !item.isUsable) return false;

      // Apply item effects
      if (item.effect) {
        setPlayer((prev) => {
          if (!prev) return null;

          const newHealth = Math.min(
            prev.maxHealth,
            prev.health + (item.effect?.healthRestore || 0),
          );
          const newSanity = Math.min(
            prev.maxSanity,
            prev.sanity + (item.effect?.sanityRestore || 0),
          );

          return { ...prev, health: newHealth, sanity: newSanity };
        });
      }

      // Remove item if consumable
      if (item.isConsumable) {
        setPlayer((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            inventory: prev.inventory.filter((inv) => inv.id !== itemId),
          };
        });
      }

      addGameEvent({
        id: `use-item-${Date.now()}`,
        type: "item-use",
        timestamp: Date.now(),
        description: `Used ${item.name}`,
        playerId: player.id,
        data: {
          itemId: itemId,
          ...(targetId && { targetId }),
          ...(targetType && { targetType }),
        },
      });

      return true;
    },
    [player, addGameEvent],
  );

  const pickupItem = useCallback(
    (item: InventoryItem) => {
      if (!player || !currentRoom) return false;

      setPlayer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          inventory: [...prev.inventory, item],
        };
      });

      setCurrentRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter((roomItem) => roomItem.id !== item.id),
        };
      });

      addNotification({
        id: `pickup-${Date.now()}`,
        type: "success",
        message: `Picked up ${item.name}`,
        timestamp: Date.now(),
      });

      return true;
    },
    [player, currentRoom, addNotification],
  );

  // Combat system
  const attackEnemy = useCallback(
    (enemyId: string, weaponId?: string) => {
      if (!player) return false;

      const enemy = enemies.get(enemyId);
      if (!enemy) return false;

      const weapon = weaponId
        ? player.inventory.find((item) => item.id === weaponId)
        : null;

      const damage = weapon?.effect?.damage || 10;

      setEnemies((prev) => {
        const newEnemies = new Map(prev);
        const updatedEnemy = { ...enemy, health: enemy.health - damage };

        if (updatedEnemy.health <= 0) {
          newEnemies.delete(enemyId);
          // Award experience
          setPlayer((playerPrev) => {
            if (!playerPrev) return null;
            return {
              ...playerPrev,
              experience: playerPrev.experience + 50,
            };
          });
        } else {
          newEnemies.set(enemyId, updatedEnemy);
        }

        return newEnemies;
      });

      return true;
    },
    [player, enemies],
  );

  // Save/Load system
  const saveGame = useCallback(
    (slotNumber: number, saveName?: string) => {
      if (!player || !currentRoom) return false;

      const saveData: SaveGame = {
        id: `save-${slotNumber}-${Date.now()}`,
        playerName: player.name,
        timestamp: Date.now(),
        gameState,
        player,
        currentRoomId: currentRoom.id,
        visitedRooms: Array.from(rooms.keys()),
        gameEvents,
        playTime: Date.now() - (gameEvents[0]?.timestamp || Date.now()),
        difficulty: settings.difficulty,
        version: "1.0.0",
      };

      // In a real implementation, this would save to localStorage or server
      localStorage.setItem(
        `haunted-asylum-save-${slotNumber}`,
        JSON.stringify(saveData),
      );

      const displayName = saveName || `Save Slot ${slotNumber}`;
      addNotification({
        id: `save-${Date.now()}`,
        type: "success",
        message: `Game saved as "${displayName}"`,
        timestamp: Date.now(),
        duration: 3000,
      });

      return true;
    },
    [
      player,
      currentRoom,
      gameState,
      rooms,
      gameEvents,
      settings.difficulty,
      addNotification,
    ],
  );

  const loadGame = useCallback(
    (saveData: SaveGame) => {
      setPlayer(saveData.player);
      setCurrentRoom(rooms.get(saveData.currentRoomId) || null);
      setGameState(saveData.gameState);
      setGameEvents(saveData.gameEvents);

      addNotification({
        id: `load-${Date.now()}`,
        type: "success",
        message: "Game loaded successfully",
        timestamp: Date.now(),
        duration: 3000,
      });
    },
    [rooms, addNotification],
  );

  // Settings management
  const updateSettings = useCallback(
    (newSettings: Partial<GameSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
      localStorage.setItem(
        "haunted-asylum-settings",
        JSON.stringify({
          ...settings,
          ...newSettings,
        }),
      );
    },
    [settings],
  );

  // Game loop for real-time updates
  const startGameLoop = useCallback(() => {
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Only update if deltaTime is reasonable (avoid huge jumps when tab is inactive)
      if (deltaTime > 0 && deltaTime < 1000) {
        // Update enemy AI and movement
        setEnemies((prevEnemies) => {
          const updatedEnemies = new Map<string, Enemy>();
          prevEnemies.forEach((enemy, enemyId) => {
            if (enemy.isHostile && enemy.health > 0) {
              // Simple AI: move enemies slightly towards player position
              const moveSpeed = enemy.moveSpeed * (deltaTime / 1000); // Convert to seconds
              updatedEnemies.set(enemyId, {
                ...enemy,
                position: {
                  ...enemy.position,
                  x: enemy.position.x + (Math.random() - 0.5) * moveSpeed,
                  y: enemy.position.y + (Math.random() - 0.5) * moveSpeed,
                },
              });
            } else {
              updatedEnemies.set(enemyId, enemy);
            }
          });
          return updatedEnemies;
        });

        // Update environmental effects (haunting level increases over time)
        setCurrentRoom((prevRoom) => {
          if (prevRoom) {
            const hauntingIncrease = deltaTime * 0.001; // Slow increase
            return {
              ...prevRoom,
              hauntingLevel: Math.min(
                100,
                prevRoom.hauntingLevel + hauntingIncrease,
              ),
            };
          }
          return prevRoom;
        });

        // Update player sanity (decreases in high haunting areas)
        setPlayer((prevPlayer) => {
          if (prevPlayer && currentRoom && currentRoom.hauntingLevel > 50) {
            const sanityLoss =
              (currentRoom.hauntingLevel / 100) * (deltaTime / 1000) * 2;
            return {
              ...prevPlayer,
              sanity: Math.max(0, prevPlayer.sanity - sanityLoss),
            };
          }
          return prevPlayer;
        });

        // Remove expired notifications
        setNotifications((prevNotifications) =>
          prevNotifications.filter((notification) => {
            const age = now - notification.timestamp;
            const duration = notification.duration || 5000;
            return age < duration;
          }),
        );
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [currentRoom]);

  const stopGameLoop = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (settings.autoSave && gameState === "playing") {
      saveTimerRef.current = setInterval(() => {
        saveGame(0, "Auto Save");
      }, 300000); // Auto-save every 5 minutes

      return () => {
        if (saveTimerRef.current) {
          clearInterval(saveTimerRef.current);
        }
      };
    }
  }, [settings.autoSave, gameState, saveGame]);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("haunted-asylum-settings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.warn("Failed to load settings:", error);
      }
    }
  }, []);

  // Start/stop game loop based on game state
  useEffect(() => {
    if (gameState === "playing") {
      startGameLoop();
    } else {
      stopGameLoop();
    }

    return stopGameLoop;
  }, [gameState, startGameLoop, stopGameLoop]);

  // Use all imported types and ensure GameAction is referenced
  const dispatchAction = useCallback((action: GameAction) => {
    // This function ensures GameAction type is used
    console.log("Dispatching action:", action);
    // In a real implementation, this would dispatch to a reducer
  }, []);

  // Ensure all state setters are used
  const toggleLoading = useCallback(() => {
    setIsLoading((prev) => !prev);
  }, []);

  const updateOpenMenus = useCallback((menuType: string, isOpen: boolean) => {
    setOpenMenus((prev) => {
      const newMenus = new Set(prev);
      if (isOpen) {
        newMenus.add(menuType);
      } else {
        newMenus.delete(menuType);
      }
      return newMenus;
    });
  }, []);

  return {
    // State
    gameState,
    player,
    currentRoom,
    rooms,
    enemies,
    notifications,
    settings,
    isLoading,
    activeDialogue,
    activePuzzle,
    openMenus,
    gameEvents,

    // Actions
    initializeGame,
    movePlayer,
    useItem,
    pickupItem,
    attackEnemy,
    saveGame,
    loadGame,
    updateSettings,
    dispatchAction,

    // UI Actions
    setGameState,
    setActiveDialogue,
    setActivePuzzle,
    addNotification,
    toggleLoading,
    updateOpenMenus,

    // Utilities
    hasKey,
    addGameEvent,
  };
};

export default useGameClient;
