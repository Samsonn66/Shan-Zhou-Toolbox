
export interface SoloAction {
  id: string;
  name: string;
  type: 'Oracle' | 'Encounter' | 'Loot' | 'Lore';
  result?: string;
  timestamp: number;
}

export enum ImageSize {
  S_1K = '1K',
  S_2K = '2K',
  S_4K = '4K'
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  tradition: string;
  description: string;
  prepared: boolean;
  actions: string;
}

export interface Feat {
  id: string;
  name: string;
  level: number;
  traits: string[];
  prerequisites: string;
  description: string;
}

export interface Weapon {
  id: string;
  name: string;
  category: string;
  damage: string;
  traits: string[];
  description: string;
  bulk: string;
}

export interface Armor {
  id: string;
  name: string;
  category: string;
  acBonus: number;
  dexCap?: number;
  traits: string[];
  description: string;
  bulk: string;
}

export interface Gear {
  id: string;
  name: string;
  description: string;
  bulk: string;
}

export interface Equipment {
  weapons: Weapon[];
  armor: Armor[];
  gear: Gear[];
}

export interface Wealth {
  qin: number;   // cp equivalent
  ling: number;  // sp equivalent
  yu: number;    // gp equivalent
  tian: number;  // 10gp equivalent
  huang: number; // 100gp equivalent
}

export interface CharacterStats {
  str: number; dex: number; con: number;
  int: number; wis: number; cha: number;
}

export interface SkillEntry {
  name: string;
  rank: number; // 0: Untrained, 1: Trained, 2: Expert, 3: Master, 4: Legendary
  ability: keyof CharacterStats;
}

export interface CharacterAction {
  id: string;
  name: string;
  type: 'action' | 'reaction' | 'free' | 'exploration';
  cost?: number; // 1, 2, 3 actions
  traits: string[];
  description: string;
}

export interface FullCharacter {
  id: string;
  name: string;
  level: number;
  ancestry: string;
  heritage: string;
  background: string;
  class: string;
  stats: CharacterStats;
  feats: Feat[];
  spells: Spell[];
  equipment: Equipment;
  wealth: Wealth;
  skills: SkillEntry[];
  notes: string;
  actions: CharacterAction[];
  heroPoints: number;
  headerStatus: string;
  sheetLocked: boolean;
  mainLayout?: string[]; // Order of keys: 'stats', 'ancestry', 'background', 'class', 'traits'
  portrait?: string; // Base64 encoded image string
}

export interface AppendixEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}
