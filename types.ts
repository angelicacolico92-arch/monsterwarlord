export enum UnitType {
  WORKER = 'WORKER',    // Slime Miner
  TOXIC = 'TOXIC',      // Toxic Slime (Ranged/Poison)
  ARCHER = 'ARCHER',    // Archer Slime
  PALADIN = 'PALADIN',  // Paladin Slime (Tank)
  MAGE = 'MAGE',        // Mage Slime
  BOSS = 'BOSS',        // Big Slime
  SMALL = 'SMALL'       // Summoned Minion
}

export interface UnitStats {
  hp: number;
  maxHp: number;
  damage: number;
  range: number; // Distance in % of field width
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
  lastAttackTime: number; 
  deathTime?: number;
  targetId?: string | null;
  currentSpeed: number;
  hasGold?: boolean;
  lastDamageTime?: number;
  lastDamageAmount?: number;
  lastSummonTime?: number;
  ownerId?: string;
  
  // Tactical Effects
  poisonTicks?: number;
  lastPoisonTickTime?: number;
  
  // Boss Abilities & Status
  lastAbility1Time?: number; // Slime Wave
  lastAbility2Time?: number; // Mega Crash
  attackCount?: number;
  isEnraged?: boolean; // Last Goo Stand active
  stunnedUntil?: number;
  slowedUntil?: number;
}

export interface PlayerState {
  gold: number;
  population: number;
}

export enum GameCommand {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  RETREAT = 'RETREAT',
}

export enum MapId {
  FOREST = 'FOREST',
  MINE = 'MINE',
  SWAMP = 'SWAMP'
}

export interface GameState {
  units: GameUnit[];
  playerStatueHP: number;
  enemyStatueHP: number;
  p1Gold: number;
  p2Gold: number;
  p1Command: GameCommand;
  p2Command: GameCommand;
  lastTick: number;
  gameStatus: 'PLAYING' | 'VICTORY' | 'DEFEAT';
  mapId: MapId;
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

export enum PlayerRole {
  HOST = 'HOST',
  CLIENT = 'CLIENT',
  OFFLINE = 'OFFLINE'
}

export type NetworkMessage = 
  | { type: 'GAME_STATE_UPDATE'; payload: GameState }
  | { type: 'RECRUIT_REQUEST'; payload: { unitType: UnitType } }
  | { type: 'CLIENT_COMMAND_REQUEST'; payload: { command: GameCommand } }
  | { type: 'GAME_RESET'; payload: {} }
  | { type: 'SURRENDER'; payload: {} };