// Game State Types
export type GameState =
  | "menu"
  | "playing"
  | "paused"
  | "game-over"
  | "victory"
  | "loading";

export type Difficulty = "easy" | "medium" | "hard" | "nightmare";

export type GameMode = "single-player" | "multiplayer" | "co-op";

// Player Types
export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  sanity: number;
  maxSanity: number;
  position: Position;
  inventory: InventoryItem[];
  isAlive: boolean;
  level: number;
  experience: number;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
  roomId: string;
}

// Room and Environment Types
export interface Room {
  id: string;
  name: string;
  description: string;
  type: RoomType;
  isLocked: boolean;
  requiredKey?: string;
  items: InventoryItem[];
  enemies: Enemy[];
  exits: Exit[];
  lightLevel: number;
  temperature: number;
  hauntingLevel: number;
}

export type RoomType =
  | "entrance"
  | "corridor"
  | "patient-room"
  | "operating-room"
  | "basement"
  | "attic"
  | "cafeteria"
  | "office"
  | "morgue"
  | "chapel"
  | "garden"
  | "laboratory";

export interface Exit {
  direction: Direction;
  targetRoomId: string;
  isLocked: boolean;
  requiredKey?: string;
}

export type Direction = "north" | "south" | "east" | "west" | "up" | "down";

// Inventory and Items
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  quantity: number;
  isUsable: boolean;
  isConsumable: boolean;
  effect?: ItemEffect;
}

export type ItemType =
  | "key"
  | "weapon"
  | "tool"
  | "medicine"
  | "document"
  | "artifact"
  | "food"
  | "light-source"
  | "protective-gear";

export interface ItemEffect {
  healthRestore?: number;
  sanityRestore?: number;
  lightRadius?: number;
  protection?: number;
  damage?: number;
}

// Enemy and Threat Types
export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  health: number;
  damage: number;
  position: Position;
  isHostile: boolean;
  detectionRadius: number;
  moveSpeed: number;
  description: string;
}

export type EnemyType =
  | "ghost"
  | "shadow"
  | "possessed-patient"
  | "demon"
  | "poltergeist"
  | "wraith"
  | "nightmare"
  | "cursed-doctor";

// Game Events and Actions
export interface GameEvent {
  id: string;
  type: EventType;
  timestamp: number;
  description: string;
  roomId?: string;
  playerId?: string;
  data?: Record<string, string | number | boolean | object>;
}

export type EventType =
  | "player-move"
  | "item-pickup"
  | "item-use"
  | "enemy-encounter"
  | "door-unlock"
  | "health-change"
  | "sanity-change"
  | "game-save"
  | "game-load"
  | "puzzle-solve"
  | "story-trigger";

export interface Action {
  type: ActionType;
  payload?: Record<string, unknown>;
}

export type ActionType =
  | "MOVE_PLAYER"
  | "USE_ITEM"
  | "PICKUP_ITEM"
  | "ATTACK_ENEMY"
  | "OPEN_DOOR"
  | "EXAMINE_OBJECT"
  | "SAVE_GAME"
  | "LOAD_GAME"
  | "CHANGE_SETTINGS";

// Game Settings and Configuration
export interface GameSettings {
  difficulty: Difficulty;
  soundVolume: number;
  musicVolume: number;
  brightness: number;
  showSubtitles: boolean;
  autoSave: boolean;
  controlScheme: ControlScheme;
}

export type ControlScheme = "wasd" | "arrow-keys" | "custom";

// Save Game Data
export interface SaveGame {
  id: string;
  playerName: string;
  timestamp: number;
  gameState: GameState;
  player: Player;
  currentRoomId: string;
  visitedRooms: string[];
  gameEvents: GameEvent[];
  playTime: number;
  difficulty: Difficulty;
  version: string;
}

// UI and Component Types
export interface DialogueOption {
  id: string;
  text: string;
  action?: () => void;
  condition?: (gameState: GameState) => boolean;
}

export interface Dialogue {
  id: string;
  speaker: string;
  text: string;
  options?: DialogueOption[];
  autoAdvance?: boolean;
  delay?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  timestamp: number;
}

export type NotificationType =
  | "info"
  | "warning"
  | "error"
  | "success"
  | "story";

// Audio and Visual Effects
export interface SoundEffect {
  id: string;
  name: string;
  url: string;
  volume: number;
  loop: boolean;
  category: SoundCategory;
}

export type SoundCategory = "sfx" | "music" | "ambient" | "voice";

export interface VisualEffect {
  id: string;
  type: EffectType;
  duration: number;
  intensity: number;
  color?: string;
}

export type EffectType = "flash" | "shake" | "fade" | "blur" | "distortion";

// Puzzle and Interaction Types
export interface Puzzle {
  id: string;
  name: string;
  description: string;
  type: PuzzleType;
  isCompleted: boolean;
  requiredItems?: string[];
  solution: string | number | boolean | string[] | Record<string, unknown>;
  reward?: InventoryItem;
}

export type PuzzleType =
  | "combination-lock"
  | "key-sequence"
  | "pattern-matching"
  | "riddle"
  | "memory-game"
  | "logic-puzzle";

// Story and Narrative
export interface StoryNode {
  id: string;
  title: string;
  content: string;
  choices?: StoryChoice[];
  conditions?: Record<string, string | number | boolean | object>;
  effects?: Record<string, string | number | boolean | object>;
}

export interface StoryChoice {
  id: string;
  text: string;
  nextNodeId: string;
  requirements?: Record<string, string | number | boolean | object>;
}

// Multiplayer Types (if applicable)
export interface MultiplayerSession {
  id: string;
  hostId: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  gameMode: GameMode;
  difficulty: Difficulty;
  status: SessionStatus;
}

export type SessionStatus =
  | "waiting"
  | "starting"
  | "in-progress"
  | "paused"
  | "ended";

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GameStats {
  totalPlayTime: number;
  roomsExplored: number;
  itemsCollected: number;
  enemiesDefeated: number;
  puzzlesSolved: number;
  deathCount: number;
  completionPercentage: number;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type GameComponent<
  Props extends Record<string, unknown> = Record<string, never>,
> = React.ComponentType<Props>;

export type EventHandler<T = unknown> = (event: T) => void;

export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;
