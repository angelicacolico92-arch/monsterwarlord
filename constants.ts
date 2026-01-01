import { UnitType, UnitConfig } from './types';

// Field settings
export const FIELD_WIDTH = 100; // Percent (Logic scale)
export const STATUE_HP = 2000;
export const SPAWN_X_PLAYER = 2; // Closer to edge
export const SPAWN_X_ENEMY = 98; // Closer to edge

export const STATUE_PLAYER_POS = 2;
export const STATUE_ENEMY_POS = 98;

// Mine Positions (Absolute % on the 300% width map)
export const GOLD_MINE_PLAYER_X = 12; 
export const GOLD_MINE_ENEMY_X = 88;

export const ATTACK_RANGE_MELEE = 1.5; 
export const ATTACK_RANGE_RANGED = 15; 
export const ATTACK_RANGE_MAGIC = 12;

export const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
  [UnitType.WORKER]: {
    type: UnitType.WORKER,
    name: 'Slime Miner',
    cost: 50,
    stats: { hp: 60, maxHp: 60, damage: 5, range: ATTACK_RANGE_MELEE, speed: 4, attackSpeed: 1000 },
    description: 'Hard-working slime with a mining hat. Gathers gold.'
  },
  [UnitType.TOXIC]: {
    type: UnitType.TOXIC,
    name: 'Toxic Slime',
    cost: 90,
    stats: { hp: 100, maxHp: 100, damage: 12, range: 8, speed: 3.5, attackSpeed: 1200 },
    description: 'Spits corrosive acid from a distance.'
  },
  [UnitType.ARCHER]: {
    type: UnitType.ARCHER,
    name: 'Archer Slime',
    cost: 150,
    stats: { hp: 90, maxHp: 90, damage: 18, range: ATTACK_RANGE_RANGED, speed: 3, attackSpeed: 1100 },
    description: 'Equipped with a gelatinous bow.'
  },
  [UnitType.PALADIN]: {
    type: UnitType.PALADIN,
    name: 'Paladin Slime',
    cost: 250,
    stats: { hp: 350, maxHp: 350, damage: 25, range: ATTACK_RANGE_MELEE, speed: 2.5, attackSpeed: 1300 },
    description: 'Holy tank slime with a shield. Absorbs damage.'
  },
  [UnitType.MAGE]: {
    type: UnitType.MAGE,
    name: 'Mage Slime',
    cost: 500,
    stats: { hp: 150, maxHp: 150, damage: 45, range: ATTACK_RANGE_MAGIC, speed: 2, attackSpeed: 2000 },
    description: 'Casts powerful arcane blobs.'
  },
  [UnitType.BOSS]: {
    type: UnitType.BOSS,
    name: 'Big Slime',
    cost: 900,
    stats: { hp: 1000, maxHp: 1000, damage: 80, range: ATTACK_RANGE_MELEE, speed: 1.5, attackSpeed: 1800 },
    description: 'The massive King of Slimes.'
  }
};

export const INITIAL_PLAYER_STATE = {
  gold: 200,
  population: 0,
};