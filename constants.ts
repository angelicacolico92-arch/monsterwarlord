import { UnitType, UnitConfig, MapId } from './types';

// Field settings
export const FIELD_WIDTH = 100; // Percent (Logic scale)
export const STATUE_HP = 2000;
export const SPAWN_X_PLAYER = 2; // Closer to edge
export const SPAWN_X_ENEMY = 98; // Closer to edge

export const STATUE_PLAYER_POS = 2;
export const STATUE_ENEMY_POS = 98;

export const MAX_UNITS = 40;

// Mine Positions (Absolute % on the map)
export const GOLD_MINE_PLAYER_X = 15; 
export const GOLD_MINE_ENEMY_X = 85;

export const ATTACK_RANGE_MELEE = 1.5; 
export const ATTACK_RANGE_RANGED = 15; 
export const ATTACK_RANGE_MAGIC = 12;

export const INITIAL_GOLD = 50;
export const INITIAL_GOLD_SURGE = 2000; // Slime Surge Mode

// Formation Offsets: Relative distance (%) from the frontline unit
export const FORMATION_OFFSETS: Record<UnitType, number> = {
  [UnitType.TOXIC]: 0,    // Frontline
  [UnitType.SMALL]: -1,   // Skirmishers
  [UnitType.PALADIN]: 4,  // 2nd Row
  [UnitType.ARCHER]: 9,   // 3rd Row
  [UnitType.MAGE]: 14,    // 4th Row
  [UnitType.BOSS]: 18,    // Backline
  [UnitType.WORKER]: 0    // Workers ignore formation
};

export const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
  [UnitType.WORKER]: {
    type: UnitType.WORKER,
    name: 'Slime Miner',
    cost: 50,
    stats: { hp: 120, maxHp: 120, damage: 15, range: ATTACK_RANGE_MELEE, speed: 4, attackSpeed: 3000 },
    description: 'Slow, meaningful strikes'
  },
  [UnitType.TOXIC]: {
    type: UnitType.TOXIC,
    name: 'Toxic Slime',
    cost: 120,
    stats: { hp: 320, maxHp: 320, damage: 45, range: 8, speed: 3.5, attackSpeed: 2500 },
    description: 'Poison damage over time'
  },
  [UnitType.PALADIN]: {
    type: UnitType.PALADIN,
    name: 'Paladin Slime',
    cost: 150,
    stats: { hp: 480, maxHp: 480, damage: 55, range: ATTACK_RANGE_MELEE, speed: 2.5, attackSpeed: 2800 },
    description: 'Heavy defensive attacks, high impact'
  },
  [UnitType.ARCHER]: {
    type: UnitType.ARCHER,
    name: 'Archer Slime',
    cost: 130,
    stats: { hp: 200, maxHp: 200, damage: 70, range: ATTACK_RANGE_RANGED, speed: 3, attackSpeed: 2200 },
    description: 'Slow but reliable ranged pressure'
  },
  [UnitType.MAGE]: {
    type: UnitType.MAGE,
    name: 'Mage Slime',
    cost: 140,
    stats: { hp: 170, maxHp: 170, damage: 100, range: ATTACK_RANGE_MAGIC, speed: 2, attackSpeed: 3000 },
    description: 'High-impact magical spells'
  },
  [UnitType.BOSS]: {
    type: UnitType.BOSS,
    name: 'Big Slime',
    cost: 250,
    stats: { hp: 1100, maxHp: 1100, damage: 180, range: ATTACK_RANGE_MELEE, speed: 1.5, attackSpeed: 3500 },
    description: 'Massive impact, very slow'
  },
  [UnitType.SMALL]: {
    type: UnitType.SMALL,
    name: 'Mini Slime',
    cost: 0,
    stats: { hp: 60, maxHp: 60, damage: 20, range: ATTACK_RANGE_MELEE, speed: 5, attackSpeed: 2000 },
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
    specialFeature: 'Tunnels: Ranged units (Archer/Mage) move 20% faster.'
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