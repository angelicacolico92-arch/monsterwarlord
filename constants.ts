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

export const ATTACK_RANGE_MELEE = 1; // Reduced % because map is 3x wider
export const ATTACK_RANGE_RANGED = 15; // Reduced % because map is 3x wider

export const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
  [UnitType.WORKER]: {
    type: UnitType.WORKER,
    name: 'Goblin Miner',
    cost: 50,
    stats: { hp: 50, maxHp: 50, damage: 2, range: ATTACK_RANGE_MELEE, speed: 4, attackSpeed: 1000 },
    description: 'Greedy goblin. Mines gold quickly.'
  },
  [UnitType.SLIME]: {
    type: UnitType.SLIME,
    name: 'Toxic Slime',
    cost: 80,
    stats: { hp: 100, maxHp: 100, damage: 15, range: ATTACK_RANGE_MELEE, speed: 2.5, attackSpeed: 1000 },
    description: 'Resilient blob that absorbs damage.'
  },
  [UnitType.WARRIOR]: {
    type: UnitType.WARRIOR,
    name: 'Orc Grunt',
    cost: 125,
    stats: { hp: 120, maxHp: 120, damage: 20, range: ATTACK_RANGE_MELEE, speed: 3, attackSpeed: 1000 },
    description: 'Tough infantry with a brutal axe.'
  },
  [UnitType.ARCHER]: {
    type: UnitType.ARCHER,
    name: 'Skeleton Archer',
    cost: 300,
    stats: { hp: 80, maxHp: 80, damage: 15, range: ATTACK_RANGE_RANGED, speed: 3.5, attackSpeed: 1200 },
    description: 'Ranged undead attacker.'
  },
  [UnitType.GARGOYLE]: {
    type: UnitType.GARGOYLE,
    name: 'Stone Gargoyle',
    cost: 450,
    stats: { hp: 300, maxHp: 300, damage: 35, range: ATTACK_RANGE_MELEE, speed: 4.5, attackSpeed: 1200 },
    description: 'Fast flying unit made of stone.'
  },
  [UnitType.MAGE]: {
    type: UnitType.MAGE,
    name: 'Shadow Shaman',
    cost: 1000,
    stats: { hp: 200, maxHp: 200, damage: 60, range: 12, speed: 1.5, attackSpeed: 2500 },
    description: 'Casts dark spells.'
  },
  [UnitType.TITAN]: {
    type: UnitType.TITAN,
    name: 'Ogre Behemoth',
    cost: 600,
    stats: { hp: 400, maxHp: 400, damage: 40, range: ATTACK_RANGE_MELEE, speed: 2, attackSpeed: 1500 },
    description: 'Massive tank unit.'
  }
};

export const INITIAL_PLAYER_STATE = {
  gold: 200,
  population: 0,
};