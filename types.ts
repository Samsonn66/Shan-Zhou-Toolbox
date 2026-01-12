
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

export interface CharacterStats {
  str: number; dex: number; con: number;
  int: number; wis: number; cha: number;
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
}
