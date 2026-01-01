export enum UnitType {
  WORKER = 'WORKER',
  SLIME = 'SLIME',
  WARRIOR = 'WARRIOR',
  ARCHER = 'ARCHER',
  GARGOYLE = 'GARGOYLE',
  MAGE = 'MAGE',
  TITAN = 'TITAN'
}

export interface UnitStats {
  hp: number;
  maxHp: number;
  damage: number;
  range: number; // Distance in % of field width (approx)
  speed: number; // Movement speed
  attackSpeed: number; // ms between attacks
}

export interface UnitConfig {
  type: UnitType;
  name: string;
  cost: number;
  stats: UnitStats;
  description: string;
}

// Represents a single unit on the field
export interface GameUnit {
  id: string;
  type: UnitType;
  side: 'player' | 'enemy';
  x: number; // Position 0-100%
  hp: number;
  maxHp: number;
  state: 'IDLE' | 'WALKING' | 'ATTACKING' | 'DYING' | 'MINING' | 'DEPOSITING';
  lastAttackTime: number; // Used for attack cooldown OR mining/depositing timer
  deathTime?: number; // Timestamp when death animation started
  targetId?: string | null;
  currentSpeed: number; // Current velocity
  hasGold?: boolean; // For workers
}

export interface PlayerState {
  gold: number;
  population: number;
}

export interface GameState {
  units: GameUnit[];
  playerStatueHP: number;
  enemyStatueHP: number;
  p1Gold: number; // Host Gold
  p2Gold: number; // Client Gold
  lastTick: number;
  gameStatus: 'PLAYING' | 'VICTORY' | 'DEFEAT';
}

export enum GameCommand {
  ATTACK = 'ATTACK', // Charge enemy
  DEFEND = 'DEFEND', // Hold line
  RETREAT = 'RETREAT', // Fall back to base
}

export interface BattleLogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'victory' | 'defeat';
  timestamp: number;
}

export interface EnemyArmy {
  name: string;
  description: string;
  units: Record<UnitType, number>;
  difficultyRating: number;
  reward: number;
}

// --- MULTIPLAYER TYPES ---

export enum PlayerRole {
  HOST = 'HOST',
  CLIENT = 'CLIENT'
}

export type NetworkMessage = 
  | { type: 'GAME_STATE_UPDATE'; payload: GameState }
  | { type: 'RECRUIT_REQUEST'; payload: { unitType: UnitType } }
  | { type: 'COMMAND_UPDATE'; payload: { command: GameCommand } }
  | { type: 'GAME_RESET'; payload: {} };
