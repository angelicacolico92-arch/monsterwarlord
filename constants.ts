
import { UnitType, UnitConfig, MapId } from './types';

// Field settings
export const FIELD_WIDTH = 100; // Percent (Logic scale)
export const STATUE_HP = 2000;
export const SPAWN_X_PLAYER = 8; 
export const SPAWN_X_ENEMY = 92; 

export const STATUE_PLAYER_POS = 6; 
export const STATUE_ENEMY_POS = 94; 

export const MAX_UNITS = 30;

// Mine Positions (Absolute % on the map)
export const GOLD_MINE_PLAYER_X = 15; 
export const GOLD_MINE_ENEMY_X = 85;

export const ATTACK_RANGE_MELEE = 1.5; 
export const ATTACK_RANGE_RANGED = 35; // Significantly increased for Archers
export const ATTACK_RANGE_MAGIC = 12;

export const INITIAL_GOLD = 50;
export const INITIAL_GOLD_SURGE = 2000; 

// Formation Offsets: Relative distance (%) from the frontline unit
export const FORMATION_OFFSETS: Record<UnitType, number> = {
  [UnitType.TOXIC]: 0,    // Frontline (Knight)
  [UnitType.SMALL]: 2,    // Skirmishers
  [UnitType.PALADIN]: 6,  // Second Row
  [UnitType.ARCHER]: 12,  // Third Row
  [UnitType.MAGE]: 18,    // Fourth Row
  [UnitType.BOSS]: 24,    // Backline Anchor
  [UnitType.WORKER]: 0    
};

export const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
  [UnitType.WORKER]: {
    type: UnitType.WORKER,
    name: 'Imperial Miner',
    cost: 50,
    stats: { hp: 120, maxHp: 120, damage: 15, range: ATTACK_RANGE_MELEE, speed: 4, attackSpeed: 3000 },
    description: 'Disciplined resource gatherer.'
  },
  [UnitType.TOXIC]: {
    type: UnitType.TOXIC,
    name: 'Imperial Knight',
    cost: 130,
    stats: { hp: 500, maxHp: 500, damage: 50, range: 1.5, speed: 2.8, attackSpeed: 1300 }, // Slightly tankier and stronger than before
    description: 'Elite noble knight. Anime style.'
  },
  [UnitType.PALADIN]: {
    type: UnitType.PALADIN,
    name: 'Paladin Slime',
    cost: 150,
    stats: { hp: 500, maxHp: 500, damage: 55, range: ATTACK_RANGE_MELEE, speed: 2.5, attackSpeed: 2800 },
    description: 'Heavy Tank. Protects backline.'
  },
  [UnitType.ARCHER]: {
    type: UnitType.ARCHER,
    name: 'Imperial Archer',
    cost: 140,
    stats: { hp: 250, maxHp: 250, damage: 85, range: ATTACK_RANGE_RANGED, speed: 2.8, attackSpeed: 2500 }, // Slower speed for disciplined march
    description: 'Elite precision archer. Zen focus.'
  },
  [UnitType.MAGE]: {
    type: UnitType.MAGE,
    name: 'Imperial Mage',
    cost: 140,
    stats: { hp: 170, maxHp: 170, damage: 100, range: ATTACK_RANGE_MAGIC, speed: 2.0, attackSpeed: 3000 },
    description: 'Royal caster with Crystal Core.'
  },
  [UnitType.BOSS]: {
    type: UnitType.BOSS,
    name: 'Big Slime',
    cost: 250,
    stats: { hp: 1100, maxHp: 1100, damage: 50, range: 2.5, speed: 1.5, attackSpeed: 2750 },
    description: 'Heavy unit. Causes knockback.'
  },
  [UnitType.SMALL]: {
    type: UnitType.SMALL,
    name: 'Mini Slime',
    cost: 0,
    stats: { hp: 60, maxHp: 60, damage: 20, range: ATTACK_RANGE_MELEE, speed: 4.5, attackSpeed: 2000 },
    description: 'Summoned skirmisher'
  }
};

export interface MapConfig {
  id: MapId;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  specialFeature: string;
}

export const MAP_CONFIGS: Record<MapId, MapConfig> = {
  [MapId.FOREST]: {
    id: MapId.FOREST,
    name: 'Forest Arena',
    difficulty: 'Easy',
    description: 'Lush forest with rivers and trees.',
    specialFeature: 'Poison Swamp: Units move 50% slower in the center.'
  },
  [MapId.MINE]: {
    id: MapId.MINE,
    name: 'Gold Mine',
    difficulty: 'Medium',
    description: 'Rocky mine with tunnels and cliffs.',
    specialFeature: 'Tunnels: Ranged units (Archer/Mage) move 20% slower.'
  },
  [MapId.SWAMP]: {
    id: MapId.SWAMP,
    name: 'Swamp Battle',
    difficulty: 'Hard',
    description: 'Dark swamp with muddy terrain.',
    specialFeature: 'Deep Mud: Frontline units move 30% slower globally.'
  }
};

export const INITIAL_PLAYER_STATE = {
  gold: INITIAL_GOLD,
  population: 0,
};
