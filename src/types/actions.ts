import type {
  Player,
  Position,
  InventoryItem,
  Enemy,
  Room,
  GameState,
  Difficulty,
  GameSettings,
  SaveGame,
  GameEvent,
  Dialogue,
  Notification,
  Puzzle,
  StoryNode,
  MultiplayerSession,
} from "./index";

// Base Action Interface
export interface BaseAction {
  type: string;
  timestamp?: number;
  playerId?: string;
}

// Game State Actions
export interface SetGameStateAction extends BaseAction {
  type: "SET_GAME_STATE";
  payload: {
    state: GameState;
  };
}

export interface InitializeGameAction extends BaseAction {
  type: "INITIALIZE_GAME";
  payload: {
    player: Player;
    startingRoomId: string;
    difficulty: Difficulty;
  };
}

export interface PauseGameAction extends BaseAction {
  type: "PAUSE_GAME";
}

export interface ResumeGameAction extends BaseAction {
  type: "RESUME_GAME";
}

export interface EndGameAction extends BaseAction {
  type: "END_GAME";
  payload: {
    reason: "victory" | "defeat" | "quit";
    finalStats?: {
      score: number;
      timeElapsed: number;
      enemiesDefeated: number;
      itemsCollected: number;
      puzzlesSolved: number;
      healthRemaining: number;
      sanityRemaining: number;
    };
  };
}

// Player Actions
export interface MovePlayerAction extends BaseAction {
  type: "MOVE_PLAYER";
  payload: {
    newPosition: Position;
    fromRoomId: string;
    toRoomId: string;
  };
}

export interface UpdatePlayerHealthAction extends BaseAction {
  type: "UPDATE_PLAYER_HEALTH";
  payload: {
    healthChange: number;
    reason?: string;
  };
}

export interface UpdatePlayerSanityAction extends BaseAction {
  type: "UPDATE_PLAYER_SANITY";
  payload: {
    sanityChange: number;
    reason?: string;
  };
}

export interface LevelUpPlayerAction extends BaseAction {
  type: "LEVEL_UP_PLAYER";
  payload: {
    newLevel: number;
    experienceGained: number;
  };
}

export interface KillPlayerAction extends BaseAction {
  type: "KILL_PLAYER";
  payload: {
    cause: string;
  };
}

export interface RevivePlayerAction extends BaseAction {
  type: "REVIVE_PLAYER";
  payload: {
    respawnRoomId: string;
    healthPercentage?: number;
  };
}

// Inventory Actions
export interface AddItemAction extends BaseAction {
  type: "ADD_ITEM";
  payload: {
    item: InventoryItem;
    roomId?: string;
  };
}

export interface RemoveItemAction extends BaseAction {
  type: "REMOVE_ITEM";
  payload: {
    itemId: string;
    quantity?: number;
  };
}

export interface UseItemAction extends BaseAction {
  type: "USE_ITEM";
  payload: {
    itemId: string;
    targetId?: string;
    targetType?: "player" | "enemy" | "object" | "door";
  };
}

export interface DropItemAction extends BaseAction {
  type: "DROP_ITEM";
  payload: {
    itemId: string;
    quantity: number;
    roomId: string;
  };
}

// Room and Environment Actions
export interface EnterRoomAction extends BaseAction {
  type: "ENTER_ROOM";
  payload: {
    roomId: string;
    previousRoomId?: string;
  };
}

export interface UpdateRoomAction extends BaseAction {
  type: "UPDATE_ROOM";
  payload: {
    roomId: string;
    updates: Partial<Room>;
  };
}

export interface UnlockDoorAction extends BaseAction {
  type: "UNLOCK_DOOR";
  payload: {
    roomId: string;
    direction: string;
    keyUsed?: string;
  };
}

export interface ToggleLightAction extends BaseAction {
  type: "TOGGLE_LIGHT";
  payload: {
    roomId: string;
    lightLevel: number;
  };
}

// Enemy Actions
export interface SpawnEnemyAction extends BaseAction {
  type: "SPAWN_ENEMY";
  payload: {
    enemy: Enemy;
    roomId: string;
  };
}

export interface MoveEnemyAction extends BaseAction {
  type: "MOVE_ENEMY";
  payload: {
    enemyId: string;
    newPosition: Position;
    newRoomId?: string;
  };
}

export interface AttackEnemyAction extends BaseAction {
  type: "ATTACK_ENEMY";
  payload: {
    enemyId: string;
    damage: number;
    weaponUsed?: string;
  };
}

export interface DefeatEnemyAction extends BaseAction {
  type: "DEFEAT_ENEMY";
  payload: {
    enemyId: string;
    experienceGained: number;
    lootDropped?: InventoryItem[];
  };
}

export interface EnemyAttackPlayerAction extends BaseAction {
  type: "ENEMY_ATTACK_PLAYER";
  payload: {
    enemyId: string;
    damage: number;
    attackType: string;
  };
}

// Puzzle Actions
export interface StartPuzzleAction extends BaseAction {
  type: "START_PUZZLE";
  payload: {
    puzzle: Puzzle;
  };
}

export interface SolvePuzzleAction extends BaseAction {
  type: "SOLVE_PUZZLE";
  payload: {
    puzzleId: string;
    solution: string | number | boolean | Record<string, unknown>;
    reward?: InventoryItem;
  };
}

export interface FailPuzzleAction extends BaseAction {
  type: "FAIL_PUZZLE";
  payload: {
    puzzleId: string;
    attemptsRemaining?: number;
  };
}

// Story and Dialogue Actions
export interface StartDialogueAction extends BaseAction {
  type: "START_DIALOGUE";
  payload: {
    dialogue: Dialogue;
  };
}

export interface ChooseDialogueOptionAction extends BaseAction {
  type: "CHOOSE_DIALOGUE_OPTION";
  payload: {
    optionId: string;
    nextDialogueId?: string;
  };
}

export interface EndDialogueAction extends BaseAction {
  type: "END_DIALOGUE";
}

export interface TriggerStoryEventAction extends BaseAction {
  type: "TRIGGER_STORY_EVENT";
  payload: {
    storyNode: StoryNode;
  };
}

// UI and Notification Actions
export interface ShowNotificationAction extends BaseAction {
  type: "SHOW_NOTIFICATION";
  payload: {
    notification: Notification;
  };
}

export interface HideNotificationAction extends BaseAction {
  type: "HIDE_NOTIFICATION";
  payload: {
    notificationId: string;
  };
}

export interface OpenMenuAction extends BaseAction {
  type: "OPEN_MENU";
  payload: {
    menuType: "main" | "inventory" | "settings" | "save" | "load";
  };
}

export interface CloseMenuAction extends BaseAction {
  type: "CLOSE_MENU";
}

// Settings Actions
export interface UpdateSettingsAction extends BaseAction {
  type: "UPDATE_SETTINGS";
  payload: {
    settings: Partial<GameSettings>;
  };
}

export interface ResetSettingsAction extends BaseAction {
  type: "RESET_SETTINGS";
}

// Save/Load Actions
export interface SaveGameAction extends BaseAction {
  type: "SAVE_GAME";
  payload: {
    saveSlot: number;
    saveName?: string;
  };
}

export interface LoadGameAction extends BaseAction {
  type: "LOAD_GAME";
  payload: {
    saveGame: SaveGame;
  };
}

export interface DeleteSaveAction extends BaseAction {
  type: "DELETE_SAVE";
  payload: {
    saveId: string;
  };
}

// Audio Actions
export interface PlaySoundAction extends BaseAction {
  type: "PLAY_SOUND";
  payload: {
    soundId: string;
    volume?: number;
    loop?: boolean;
  };
}

export interface StopSoundAction extends BaseAction {
  type: "STOP_SOUND";
  payload: {
    soundId: string;
  };
}

export interface SetMasterVolumeAction extends BaseAction {
  type: "SET_MASTER_VOLUME";
  payload: {
    volume: number;
  };
}

// Multiplayer Actions
export interface CreateSessionAction extends BaseAction {
  type: "CREATE_SESSION";
  payload: {
    session: MultiplayerSession;
  };
}

export interface JoinSessionAction extends BaseAction {
  type: "JOIN_SESSION";
  payload: {
    sessionId: string;
    player: Player;
  };
}

export interface LeaveSessionAction extends BaseAction {
  type: "LEAVE_SESSION";
  payload: {
    sessionId: string;
    playerId: string;
  };
}

export interface SyncGameStateAction extends BaseAction {
  type: "SYNC_GAME_STATE";
  payload: {
    gameState: GameState;
    timestamp: number;
  };
}

// Error Actions
export interface GameErrorAction extends BaseAction {
  type: "GAME_ERROR";
  payload: {
    error: string;
    code?: string;
    recoverable: boolean;
  };
}

export interface ClearErrorAction extends BaseAction {
  type: "CLEAR_ERROR";
}

// Analytics Actions
export interface TrackEventAction extends BaseAction {
  type: "TRACK_EVENT";
  payload: {
    event: GameEvent;
  };
}

export interface UpdateStatsAction extends BaseAction {
  type: "UPDATE_STATS";
  payload: {
    statType: string;
    value: number;
    operation: "set" | "increment" | "decrement";
  };
}

// Union Type for All Actions
export type GameAction =
  // Game State
  | SetGameStateAction
  | InitializeGameAction
  | PauseGameAction
  | ResumeGameAction
  | EndGameAction
  // Player
  | MovePlayerAction
  | UpdatePlayerHealthAction
  | UpdatePlayerSanityAction
  | LevelUpPlayerAction
  | KillPlayerAction
  | RevivePlayerAction
  // Inventory
  | AddItemAction
  | RemoveItemAction
  | UseItemAction
  | DropItemAction
  // Room
  | EnterRoomAction
  | UpdateRoomAction
  | UnlockDoorAction
  | ToggleLightAction
  // Enemy
  | SpawnEnemyAction
  | MoveEnemyAction
  | AttackEnemyAction
  | DefeatEnemyAction
  | EnemyAttackPlayerAction
  // Puzzle
  | StartPuzzleAction
  | SolvePuzzleAction
  | FailPuzzleAction
  // Story
  | StartDialogueAction
  | ChooseDialogueOptionAction
  | EndDialogueAction
  | TriggerStoryEventAction
  // UI
  | ShowNotificationAction
  | HideNotificationAction
  | OpenMenuAction
  | CloseMenuAction
  // Settings
  | UpdateSettingsAction
  | ResetSettingsAction
  // Save/Load
  | SaveGameAction
  | LoadGameAction
  | DeleteSaveAction
  // Audio
  | PlaySoundAction
  | StopSoundAction
  | SetMasterVolumeAction
  // Multiplayer
  | CreateSessionAction
  | JoinSessionAction
  | LeaveSessionAction
  | SyncGameStateAction
  // Error
  | GameErrorAction
  | ClearErrorAction
  // Analytics
  | TrackEventAction
  | UpdateStatsAction;

// Action Creators Type
export type ActionCreator<T extends GameAction> = (
  ...args: T extends (...args: infer P) => GameAction ? P : never
) => T;

// Async Action Type (for Redux Thunk)
export type AsyncAction = (
  dispatch: (action: GameAction) => void,
  getState: () => GameState,
) => Promise<void> | void;

// Action Creator Helpers
export const createAction = <T extends GameAction>(type: T["type"]) => {
  return (payload?: T extends { payload: unknown } ? T["payload"] : never): T =>
    ({
      type,
      payload,
      timestamp: Date.now(),
    }) as T;
};

export const createAsyncAction = <T extends GameAction>(
  actionCreator: ActionCreator<T>,
) => {
  return (...args: Parameters<typeof actionCreator>): AsyncAction => {
    return async (dispatch) => {
      try {
        const action = actionCreator(...args);
        dispatch(action);
      } catch (error) {
        dispatch({
          type: "GAME_ERROR",
          payload: {
            error: error instanceof Error ? error.message : "Unknown error",
            recoverable: true,
          },
          timestamp: Date.now(),
        } as GameErrorAction);
      }
    };
  };
};
