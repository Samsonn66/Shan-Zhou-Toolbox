
import React, { useState, useMemo } from 'react';
import { FullCharacter, Feat, Spell, Weapon, Armor, Gear, AppendixEntry } from '../types';
import { GeminiService } from '../services/gemini';
import { PinnedEntry } from '../App';

const ancestries = [
  { name: "Renmin", icon: "🏮", description: "The versatile folk of Shan' Zhou. Resilient and adaptable." },
  { name: "Elf", icon: "🧝", description: "Long-lived and graceful." },
  { name: "Dwarf", icon: "🧔", description: "Stout and hardy." },
  { name: "Halfling", icon: "🦶", description: "Small and lucky." },
  { name: "Gnome", icon: "🧚", description: "Inquisitive and magical." },
  { name: "Goblin", icon: "👺", description: "Scrappy and energetic." }
];

const heritageMap: Record<string, string[]> = {
  "Renmin": ["Scholar-Official", "Silk-Spinner Heritage", "Iron-Skin Labourer", "Jade-Blessed Noble"],
  "Elf": ["Ancient Elf", "Arctic Elf", "Cavern Elf", "Seer Elf", "Whisper Elf"],
  "Dwarf": ["Ancient-Blooded Dwarf", "Death Warden Dwarf", "Forge Dwarf", "Rock Dwarf", "Strong-blooded Dwarf"],
  "Halfling": ["Gutsy Halfling", "Hillock Halfling", "Nomadic Halfling", "Observant Halfling", "Wildwood Halfling"],
  "Gnome": ["Chameleon Gnome", "Fey-touched Gnome", "Sensate Gnome", "Umbral Gnome", "Wellspring Gnome"],
  "Goblin": ["Charhide Goblin", "Razortooth Goblin", "Snowgoblin", "Treetop Goblin", "Unbreakable Goblin"]
};

const backgrounds = [
  { name: "Acolyte", boosts: "WIS/INT", skill: "Religion" },
  { name: "Criminal", boosts: "DEX/INT", skill: "Stealth" },
  { name: "Noble", boosts: "CHA/INT", skill: "Society" },
  { name: "Scholar", boosts: "INT/WIS", skill: "Arcana" },
  { name: "Soldier", boosts: "STR/CON", skill: "Athletics" },
  { name: "Tavern Brawler", boosts: "STR/CON", skill: "Intimidation" }
];

const classes = [
  { name: "Fighter", key: "STR/DEX", hp: 10, tradition: null },
  { name: "Wizard", key: "INT", hp: 6, tradition: "Arcane" },
  { name: "Rogue", key: "DEX", hp: 8, tradition: null },
  { name: "Cleric", key: "WIS", hp: 8, tradition: "Divine" },
  { name: "Barbarian", key: "STR", hp: 12, tradition: null },
  { name: "Bard", key: "CHA", hp: 8, tradition: "Occult" },
  { name: "Ranger", key: "DEX/STR", hp: 10, tradition: "Primal" }
];

const starterSpells: Record<string, string[]> = {
  "Arcane": ["Magic Missile", "Shield", "Mage Hand", "Detect Magic", "Electric Arc", "Burning Hands"],
  "Divine": ["Heal", "Bless", "Forbidding Ward", "Guidance", "Stabilize", "Divine Lance"],
  "Occult": ["Soothe", "Bane", "Daze", "Inspire Courage", "Message", "Telekinetic Projectile"],
  "Primal": ["Magic Fang", "Produce Flame", "Entangle", "Ray of Frost", "Know Direction", "Shillelagh"]
};

interface PreviewState {
  title: string;
  text: string;
  type: 'Ancestry' | 'Background' | 'Class' | 'Heritage' | 'Spell' | 'Weapon' | 'Armor' | 'Gear';
  source: 'World' | 'Archives' | 'AI';
  entryId?: string;
}

interface Props {
  character: FullCharacter;
  onUpdate: (char: FullCharacter) => void;
  pinnedEntries: PinnedEntry[];
  appendixEntries: AppendixEntry[];
  onOpenSheet: () => void;
  onNavigateToLore: (entryId: string) => void;
}

type SortKey = 'name' | 'category' | 'bulk';

const CharacterBuilder: React.FC<Props> = ({ character, onUpdate, pinnedEntries, appendixEntries, onOpenSheet, onNavigateToLore }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ancestry' | 'background' | 'class' | 'spells' | 'feats' | 'equipment' | 'stats'>('ancestry');
  const [activeEquipSubTab, setActiveEquipSubTab] = useState<'weapons' | 'armor' | 'gear'>('weapons');
  const [previewContent, setPreviewContent] = useState<PreviewState | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const [featSearch, setFeatSearch] = useState("");
  const [addingFeat, setAddingFeat] = useState(false);
  const [spellSearch, setSpellSearch] = useState("");
  const [addingSpell, setAddingSpell] = useState(false);
  const [equipSearch, setEquipSearch] = useState("");
  const [addingEquip, setAddingEquip] = useState(false);
  const [equipSort, setEquipSort] = useState<SortKey>('name');

  // Custom Equipment Form State
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customItem, setCustomItem] = useState<any>({
    name: "",
    category: "",
    description: "",
    bulk: "1",
    damage: "",
    traits: "",
    acBonus: 0,
    dexCap: 0
  });

  const getModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : mod);

  const activeClassTradition = useMemo(() => {
    return classes.find(c => c.name === character.class)?.tradition || null;
  }, [character.class]);

  const updateStat = (stat: keyof typeof character.stats, val: number) => {
    onUpdate({
      ...character,
      stats: { ...character.stats, [stat]: Math.max(8, Math.min(18, character.stats[stat] + val)) }
    });
  };

  const hasLoreEntry = (selection: string) => {
    let target = selection;
    if (selection === "Renmin") target = "Renmin Ancestry Details";
    return appendixEntries.find(e => e.title.toLowerCase().includes(target.toLowerCase()));
  };

  const handlePreview = async (type: 'Ancestry' | 'Background' | 'Class' | 'Heritage' | 'Spell' | 'Weapon' | 'Armor' | 'Gear', selection: string) => {
    setLoadingPreview(true);
    setPreviewContent({ title: selection, text: "Consulting archives...", type, source: 'AI' });

    // 1. Check world lore first (Appendix)
    const worldEntry = hasLoreEntry(selection);

    if (worldEntry) {
      setPreviewContent({ 
        title: worldEntry.title, 
        text: worldEntry.content, 
        type, 
        source: 'World', 
        entryId: worldEntry.id 
      });
      setLoadingPreview(false);
      return;
    }

    // 2. Check pinned AI snippets
    const archivedEntry = pinnedEntries.find(e => 
      e.title.toLowerCase().includes(selection.toLowerCase()) || 
      e.content.toLowerCase().startsWith(selection.toLowerCase())
    );

    if (archivedEntry) {
      setPreviewContent({ 
        title: selection, 
        text: archivedEntry.content, 
        type, 
        source: 'Archives' 
      });
      setLoadingPreview(false);
      return;
    }

    // 3. Consult Gemini for dynamic summary
    try {
      const res = await GeminiService.getSelectionPreview(type, selection);
      setPreviewContent({ title: selection, text: res, type, source: 'AI' });
    } catch (error) {
      setPreviewContent({ title: selection, text: "Failed to load preview.", type, source: 'AI' });
    } finally {
      setLoadingPreview(false);
    }
  };

  const saveToAppendix = () => {
    if (!previewContent || previewContent.source === 'World') return;
    
    // Auto-map category based on preview type
    let category: AppendixEntry['category'] = 'Lore';
    if (previewContent.type === 'Ancestry') category = 'Ancestry';
    if (previewContent.type === 'Background') category = 'Background';
    if (previewContent.type === 'Class') category = 'Class';
    
    const newEntry: AppendixEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title: previewContent.title,
      content: previewContent.text,
      category,
      timestamp: Date.now()
    };
    
    alert("Visions solidified! This entry is now part of your permanent Appendix.");
  };

  const addSpellByName = async (name: string) => {
    setAddingSpell(true);
    try {
      const details = await GeminiService.getSpellDetails(name);
      const newSpell: Spell = {
        id: Math.random().toString(36).substr(2, 9),
        ...details,
        prepared: false
      };
      onUpdate({ ...character, spells: [...character.spells, newSpell] });
      setSpellSearch("");
    } catch (error) {
      console.error(error);
    } finally {
      setAddingSpell(false);
    }
  };

  const addFeat = async () => {
    if (!featSearch.trim()) return;
    setAddingFeat(true);
    try {
      const details = await GeminiService.getFeatDetails(featSearch);
      const newFeat: Feat = {
        id: Math.random().toString(36).substr(2, 9),
        ...details
      };
      onUpdate({ ...character, feats: [...character.feats, newFeat] });
      setFeatSearch("");
    } catch (error) {
      console.error(error);
    } finally {
      setAddingFeat(false);
    }
  };

  const removeFeat = (id: string) => {
    onUpdate({ ...character, feats: character.feats.filter(f => f.id !== id) });
  };

  const addEquipment = async () => {
    if (!equipSearch.trim()) return;
    setAddingEquip(true);
    try {
      const type = activeEquipSubTab === 'weapons' ? 'Weapon' : activeEquipSubTab === 'armor' ? 'Armor' : 'Gear';
      const details = await GeminiService.getEquipmentDetails(equipSearch, type);
      const id = Math.random().toString(36).substr(2, 9);
      
      const newEquipment = { ...character.equipment };
      if (activeEquipSubTab === 'weapons') {
        newEquipment.weapons = [...newEquipment.weapons, { id, ...details, bulk: details.bulk || "1", equipped: false }];
      } else if (activeEquipSubTab === 'armor') {
        newEquipment.armor = [...newEquipment.armor, { id, ...details, bulk: details.bulk || "1", equipped: false }];
      } else {
        newEquipment.gear = [...newEquipment.gear, { id, ...details, bulk: details.bulk || "L", equipped: false }];
      }

      onUpdate({ ...character, equipment: newEquipment });
      setEquipSearch("");
    } catch (error) {
      console.error(error);
    } finally {
      setAddingEquip(false);
    }
  };

  const toggleEquip = (id: string, type: 'weapons' | 'armor' | 'gear') => {
    const newEquipment = { ...character.equipment };
    if (type === 'weapons') {
      newEquipment.weapons = newEquipment.weapons.map(item => item.id === id ? { ...item, equipped: !item.equipped } : item);
    } else if (type === 'armor') {
      newEquipment.armor = newEquipment.armor.map(item => item.id === id ? { ...item, equipped: !item.equipped } : item);
    } else if (type === 'gear') {
      newEquipment.gear = newEquipment.gear.map(item => item.id === id ? { ...item, equipped: !item.equipped } : item);
    }
    onUpdate({ ...character, equipment: newEquipment });
  };

  const addCustomEquipment = () => {
    if (!customItem.name.trim()) return;

    const id = Math.random().toString(36).substr(2, 9);
    const newEquipment = { ...character.equipment };
    const traitsArray = customItem.traits.split(',').map((t: string) => t.trim()).filter((t: string) => t !== "");

    if (activeEquipSubTab === 'weapons') {
      const item: Weapon = {
        id,
        name: customItem.name,
        category: customItem.category || "Simple",
        damage: customItem.damage || "1d4",
        traits: traitsArray,
        description: customItem.description,
        bulk: customItem.bulk || "1",
        equipped: false
      };
      newEquipment.weapons = [...newEquipment.weapons, item];
    } else if (activeEquipSubTab === 'armor') {
      const item: Armor = {
        id,
        name: customItem.name,
        category: customItem.category || "Light",
        acBonus: Number(customItem.acBonus) || 0,
        dexCap: Number(customItem.dexCap) || 0,
        traits: traitsArray,
        description: customItem.description,
        bulk: customItem.bulk || "1",
        equipped: false
      };
      newEquipment.armor = [...newEquipment.armor, item];
    } else {
      const item: Gear = {
        id,
        name: customItem.name,
        description: customItem.description,
        bulk: customItem.bulk || "L",
        equipped: false
      };
      newEquipment.gear = [...newEquipment.gear, item];
    }

    onUpdate({ ...character, equipment: newEquipment });
    setIsCreatingCustom(false);
    setCustomItem({
      name: "",
      category: "",
      description: "",
      bulk: "1",
      damage: "",
      traits: "",
      acBonus: 0,
      dexCap: 0
    });
  };

  const removeEquipment = (id: string, type: 'weapons' | 'armor' | 'gear') => {
    const newEquipment = { ...character.equipment };
    if (type === 'weapons') {
      newEquipment.weapons = newEquipment.weapons.filter(item => item.id !== id);
    } else if (type === 'armor') {
      newEquipment.armor = newEquipment.armor.filter(item => item.id !== id);
    } else if (type === 'gear') {
      newEquipment.gear = newEquipment.gear.filter(item => item.id !== id);
    }
    onUpdate({ ...character, equipment: newEquipment });
  };

  const selectAncestry = (name: string) => {
    onUpdate({ ...character, ancestry: name, heritage: "" });
  };

  const selectHeritage = (name: string) => {
    onUpdate({ ...character, heritage: name });
  };

  const parseBulkValue = (bulkStr: string): number => {
    if (!bulkStr || bulkStr === '-' || bulkStr === '0') return 0;
    if (bulkStr.toUpperCase() === 'L') return 0.1;
    const val = parseFloat(bulkStr);
    return isNaN(val) ? 0 : val;
  };

  const sortedEquipment = useMemo(() => {
    const list = [...character.equipment[activeEquipSubTab]];
    return list.sort((a: any, b: any) => {
      if (equipSort === 'name') return a.name.localeCompare(b.name);
      if (equipSort === 'category') return (a.category || "").localeCompare(b.category || "");
      if (equipSort === 'bulk') return parseBulkValue(a.bulk) - parseBulkValue(b.bulk);
      return 0;
    });
  }, [character.equipment, activeEquipSubTab, equipSort]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Builder Workspace */}
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
        
        {/* Workspace Toolbar */}
        <div className="flex justify-between items-center bg-[#252525] border-b border-[#333] px-6">
          <div className="flex overflow-x-auto">
            {(['ancestry', 'background', 'class', 'spells', 'feats', 'equipment', 'stats'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`py-4 px-6 text-[10px] font-black uppercase tracking-tighter transition-all border-b-2 whitespace-nowrap ${
                  activeSubTab === tab 
                    ? 'bg-[#d4af371a] text-[#d4af37] border-[#d4af37]' 
                    : 'text-gray-500 border-transparent hover:bg-[#2a2a2a]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <button 
            onClick={onOpenSheet}
            className="flex items-center gap-2 bg-[#d4af37] text-black px-4 py-1.5 rounded text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-transform flex-shrink-0"
          >
            <span>📄</span> View Full Sheet
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main List */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-[#333] scrollbar-visible">
            {activeSubTab === 'ancestry' && (
              <div className="space-y-6">
                {!character.ancestry ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ancestries.map(a => {
                      const lore = hasLoreEntry(a.name);
                      return (
                        <div key={a.name} className="relative group">
                          <button 
                            onClick={() => selectAncestry(a.name)}
                            className={`w-full p-4 rounded border transition-all text-left flex items-center gap-4 border-[#333] bg-[#2a2a2a] hover:border-gray-500`}
                          >
                            <span className="text-3xl bg-[#121212] w-12 h-12 flex items-center justify-center rounded-lg border border-[#333]">{a.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-[#d4af37]">{a.name}</div>
                                {lore && <span className="text-[7px] bg-[#2ecc7133] text-[#2ecc71] px-1 rounded uppercase font-black" title="World Lore Exists">World Lore</span>}
                              </div>
                              <div className="text-[10px] text-gray-500 uppercase">{a.description}</div>
                            </div>
                          </button>
                          <button 
                            onClick={() => handlePreview('Ancestry', a.name)}
                            className="absolute right-2 top-2 text-[10px] bg-[#333] hover:bg-[#444] text-gray-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            PREVIEW
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#121212] p-4 rounded border border-[#d4af37]">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{ancestries.find(a => a.name === character.ancestry)?.icon}</span>
                        <div>
                          <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Selected Ancestry</div>
                          <div className="font-bold text-[#d4af37] text-lg">{character.ancestry}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => selectAncestry("")}
                        className="text-[10px] font-black uppercase text-red-500 hover:underline"
                      >
                        Change Ancestry
                      </button>
                    </div>

                    <div className="pt-4">
                      <h4 className="text-xs font-black uppercase text-gray-500 mb-4 tracking-widest">Select Heritage</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {heritageMap[character.ancestry]?.map(h => {
                          const lore = hasLoreEntry(h);
                          return (
                            <div key={h} className="relative group">
                              <button 
                                onClick={() => selectHeritage(h)}
                                className={`w-full p-4 rounded border transition-all text-left flex items-center gap-4 ${
                                  character.heritage === h ? 'border-[#d4af37] bg-[#d4af3711]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="font-bold group-hover:text-[#d4af37] transition-colors">{h}</div>
                                    {lore && <span className="text-[7px] bg-[#2ecc7133] text-[#2ecc71] px-1 rounded uppercase font-black">World Lore</span>}
                                  </div>
                                  <div className="text-[9px] text-gray-500 font-bold uppercase">Heritage Selection</div>
                                </div>
                              </button>
                              <button 
                                onClick={() => handlePreview('Heritage', h)}
                                className="absolute right-2 top-2 text-[10px] bg-[#333] hover:bg-[#444] text-gray-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                PREVIEW
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'background' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {backgrounds.map(b => {
                  const lore = hasLoreEntry(b.name);
                  return (
                    <div key={b.name} className="relative group">
                      <button 
                        onClick={() => onUpdate({...character, background: b.name})}
                        className={`w-full p-4 rounded border transition-all text-left group ${
                          character.background === b.name ? 'border-[#d4af37] bg-[#d4af3711]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-bold group-hover:text-[#d4af37] transition-colors">{b.name}</div>
                          {lore && <span className="text-[7px] bg-[#2ecc7133] text-[#2ecc71] px-1 rounded uppercase font-black">World Lore</span>}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] bg-black px-1.5 py-0.5 rounded text-gray-400 font-bold">BOOSTS: {b.boosts}</span>
                          <span className="text-[9px] bg-[#d4af3733] px-1.5 py-0.5 rounded text-[#d4af37] font-bold">SKILL: {b.skill}</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => handlePreview('Background', b.name)}
                        className="absolute right-2 top-2 text-[10px] bg-[#333] hover:bg-[#444] text-gray-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        PREVIEW
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSubTab === 'class' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map(c => {
                  const lore = hasLoreEntry(c.name);
                  return (
                    <div key={c.name} className="relative group">
                      <button 
                        onClick={() => onUpdate({...character, class: c.name})}
                        className={`w-full p-4 rounded border transition-all text-left flex justify-between items-center ${
                          character.class === c.name ? 'border-[#d4af37] bg-[#d4af3711]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-bold">{c.name}</div>
                            {lore && <span className="text-[7px] bg-[#2ecc7133] text-[#2ecc71] px-1 rounded uppercase font-black">World Lore</span>}
                          </div>
                          <div className="text-[9px] text-gray-500 font-bold uppercase">Key: {c.key} • {c.hp} HP/LVL</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => handlePreview('Class', c.name)}
                        className="absolute right-2 top-2 text-[10px] bg-[#333] hover:bg-[#444] text-gray-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        PREVIEW
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSubTab === 'spells' && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search for a specific spell..."
                    className="flex-1 bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#d4af37]"
                    value={spellSearch}
                    onChange={(e) => setSpellSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSpellByName(spellSearch)}
                  />
                  <button 
                    onClick={() => addSpellByName(spellSearch)}
                    disabled={addingSpell || !spellSearch}
                    className="bg-[#d4af37] text-black px-4 rounded font-bold text-xs uppercase disabled:opacity-50"
                  >
                    {addingSpell ? '...' : 'Add'}
                  </button>
                </div>

                {activeClassTradition ? (
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-widest">Starter Spells ({activeClassTradition})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {starterSpells[activeClassTradition].map(spellName => {
                        const isAdded = character.spells.some(s => s.name.toLowerCase() === spellName.toLowerCase());
                        return (
                          <div key={spellName} className="relative group">
                            <button 
                              onClick={() => !isAdded && addSpellByName(spellName)}
                              className={`w-full p-4 rounded border transition-all text-left flex justify-between items-center ${
                                isAdded ? 'border-[#d4af37] bg-[#d4af3711]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                              }`}
                            >
                              <div className="font-bold">{spellName}</div>
                            </button>
                            <button 
                              onClick={() => handlePreview('Spell', spellName)}
                              className="absolute right-2 top-2 text-[10px] bg-[#333] hover:bg-[#444] text-gray-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              PREVIEW
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#121212] rounded border border-dashed border-[#333]">
                    <span className="text-2xl">⚔️</span>
                    <p className="text-xs text-gray-500 mt-2 uppercase font-black">Spells are for magical classes.</p>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'feats' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search for a feat (e.g., Toughness)..."
                    className="flex-1 bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#d4af37]"
                    value={featSearch}
                    onChange={(e) => setFeatSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addFeat()}
                  />
                  <button onClick={addFeat} disabled={addingFeat} className="bg-[#d4af37] text-black px-4 rounded font-bold text-xs uppercase disabled:opacity-50">
                    {addingFeat ? '...' : 'Add'}
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {character.feats.map(feat => (
                    <div key={feat.id} className="p-4 bg-[#2a2a2a] border border-[#333] rounded group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-[#d4af37]">{feat.name}</h4>
                        <button onClick={() => removeFeat(feat.id)} className="text-red-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100">✕</button>
                      </div>
                      <p className="text-[10px] text-gray-400 italic mb-2">LVL {feat.level} • {feat.traits.join(', ')}</p>
                      <p className="text-xs text-gray-300 line-clamp-3">{feat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'equipment' && (
              <div className="space-y-6">
                <div className="flex bg-[#252525] rounded p-1">
                  {(['weapons', 'armor', 'gear'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveEquipSubTab(tab); setIsCreatingCustom(false); }}
                      className={`flex-1 py-2 text-[9px] font-black uppercase transition-all rounded ${
                        activeEquipSubTab === tab ? 'bg-[#d4af37] text-black' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 bg-[#121212] p-2 rounded-lg border border-[#333]">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Sort by:</span>
                    {(['name', 'category', 'bulk'] as const).map(key => (
                      <button
                        key={key}
                        onClick={() => setEquipSort(key)}
                        className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all border ${
                          equipSort === key ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'border-[#333] text-gray-500 hover:text-white'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                {!isCreatingCustom ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Search for a ${activeEquipSubTab.slice(0, -1)}...`}
                      className="flex-1 bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#d4af37]"
                      value={equipSearch}
                      onChange={(e) => setEquipSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addEquipment()}
                    />
                    <button onClick={addEquipment} disabled={addingEquip} className="bg-[#2a2a2a] text-[#d4af37] border border-[#d4af3733] px-4 rounded font-bold text-xs uppercase disabled:opacity-50 hover:bg-[#333]">
                      {addingEquip ? '...' : 'Find'}
                    </button>
                    <button 
                      onClick={() => setIsCreatingCustom(true)}
                      className="bg-[#d4af37] text-black px-4 rounded font-bold text-xs uppercase shadow-lg hover:scale-105 transition-all"
                    >
                      Custom
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#121212] border border-[#d4af3744] p-4 rounded space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-[10px] font-black uppercase text-[#d4af37] tracking-widest">Create Custom {activeEquipSubTab.slice(0, -1)}</h4>
                      <button onClick={() => setIsCreatingCustom(false)} className="text-gray-500 hover:text-white text-[10px] uppercase font-bold">Cancel</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Item Name</label>
                        <input 
                          type="text"
                          className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          value={customItem.name}
                          onChange={(e) => setCustomItem({...customItem, name: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Category</label>
                        <input 
                          type="text"
                          placeholder={activeEquipSubTab === 'weapons' ? "Simple, Martial..." : activeEquipSubTab === 'armor' ? "Light, Heavy..." : "Consumable..."}
                          className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          value={customItem.category}
                          onChange={(e) => setCustomItem({...customItem, category: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Bulk</label>
                        <input 
                          type="text"
                          className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                          value={customItem.bulk}
                          onChange={(e) => setCustomItem({...customItem, bulk: e.target.value})}
                        />
                      </div>

                      {activeEquipSubTab === 'weapons' && (
                        <>
                          <div>
                            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Damage</label>
                            <input 
                              type="text"
                              placeholder="1d6 P"
                              className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                              value={customItem.damage}
                              onChange={(e) => setCustomItem({...customItem, damage: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Traits (Comma Separated)</label>
                            <input 
                              type="text"
                              placeholder="Finesse, Agile..."
                              className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                              value={customItem.traits}
                              onChange={(e) => setCustomItem({...customItem, traits: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      {activeEquipSubTab === 'armor' && (
                        <>
                          <div>
                            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">AC Bonus</label>
                            <input 
                              type="number"
                              className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                              value={customItem.acBonus}
                              onChange={(e) => setCustomItem({...customItem, acBonus: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Dex Cap</label>
                            <input 
                              type="number"
                              className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                              value={customItem.dexCap}
                              onChange={(e) => setCustomItem({...customItem, dexCap: e.target.value})}
                            />
                          </div>
                        </>
                      )}

                      <div className="col-span-2">
                        <label className="text-[8px] font-black text-gray-500 uppercase block mb-1">Description</label>
                        <textarea 
                          className="w-full bg-black border border-[#333] p-2 text-xs text-white focus:outline-none focus:border-[#d4af37] min-h-[60px]"
                          value={customItem.description}
                          onChange={(e) => setCustomItem({...customItem, description: e.target.value})}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={addCustomEquipment}
                      className="w-full bg-[#d4af37] text-black font-black uppercase text-[10px] py-2 rounded shadow-lg hover:bg-[#c19b2e] transition-colors"
                    >
                      Craft Item
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {sortedEquipment.map((item: any) => (
                    <div key={item.id} className={`p-4 bg-[#2a2a2a] border rounded group relative transition-all ${
                      item.equipped ? 'border-[#d4af37] ring-1 ring-[#d4af3722] bg-[#d4af3708]' : 'border-[#333]'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                           <div className="flex items-center gap-2">
                             <h4 className="font-bold text-[#d4af37]">{item.name}</h4>
                             {item.equipped && (
                               <span className="text-[7px] font-black bg-[#d4af37] text-black px-1.5 rounded uppercase tracking-tighter">Mandated</span>
                             )}
                           </div>
                           <div className="text-[9px] text-gray-500 font-bold uppercase">{item.category}</div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleEquip(item.id, activeEquipSubTab)} className={`text-[9px] font-black px-2 py-0.5 rounded border transition-colors ${
                            item.equipped ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'text-gray-400 border-[#333] hover:text-white'
                          }`}>
                            {item.equipped ? 'SHEATHE' : 'EQUIP'}
                          </button>
                          <button onClick={() => handlePreview(activeEquipSubTab === 'weapons' ? 'Weapon' : activeEquipSubTab === 'armor' ? 'Armor' : 'Gear', item.name)} className="text-[#3498db] text-[9px] font-black">PRV</button>
                          <button onClick={() => removeEquipment(item.id, activeEquipSubTab)} className="text-red-500 text-[9px] font-black">✕</button>
                        </div>
                      </div>
                      
                      {activeEquipSubTab === 'weapons' && (
                        <div className="flex gap-2 mb-2">
                          <span className="text-[9px] bg-black px-1.5 py-0.5 rounded text-red-400 font-bold">{item.damage}</span>
                          {(item.traits || []).slice(0, 2).map((t: string) => <span key={t} className="text-[9px] bg-[#d4af371a] px-1.5 py-0.5 rounded text-[#d4af37] font-bold">{t}</span>)}
                        </div>
                      )}

                      {activeEquipSubTab === 'armor' && (
                        <div className="flex gap-2 mb-2">
                          <span className="text-[9px] bg-black px-1.5 py-0.5 rounded text-blue-400 font-bold">AC +{item.acBonus}</span>
                          <span className="text-[9px] bg-black px-1.5 py-0.5 rounded text-gray-400 font-bold">CAP {item.dexCap}</span>
                        </div>
                      )}

                      <div className="mb-2">
                        <span className="text-[9px] bg-black px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase">BULK {item.bulk}</span>
                      </div>

                      <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                  {character.equipment[activeEquipSubTab].length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-600 italic text-xs">No {activeEquipSubTab} in inventory.</div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'stats' && (
              <div className="space-y-4 max-w-xl mx-auto">
                <div className="bg-[#121212] p-4 border border-[#333] rounded mb-6 text-center">
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Base Ability Scores</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(character.stats).map((s) => (
                    <div key={s} className="flex items-center justify-between bg-[#2a2a2a] p-4 rounded border border-[#333] shadow-inner">
                      <div className="flex flex-col">
                        <span className="uppercase font-black text-[#d4af37] text-xs tracking-tighter">{s}</span>
                        <span className="text-[10px] text-gray-500 font-bold">{formatMod(getModifier(character.stats[s as keyof typeof character.stats]))}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => updateStat(s as any, -2)} className="w-8 h-8 rounded-full border border-[#444] bg-[#1a1a1a] hover:bg-red-900 transition-colors font-black flex items-center justify-center">-</button>
                        <span className="text-xl font-black w-8 text-center serif">{character.stats[s as keyof typeof character.stats]}</span>
                        <button onClick={() => updateStat(s as any, 2)} className="w-8 h-8 rounded-full border border-[#444] bg-[#1a1a1a] hover:bg-green-900 transition-colors font-black flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contextual Preview Panel */}
          <div className={`w-80 bg-[#121212] border-l border-[#333] transition-all overflow-y-auto scrollbar-visible ${previewContent ? 'translate-x-0' : 'translate-x-full absolute right-0 shadow-[-20px_0_30px_rgba(0,0,0,0.5)]'}`}>
            {previewContent ? (
              <div className="p-6 space-y-4 flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-[#d4af37] serif">{previewContent.title}</h3>
                    <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">Source: {previewContent.source}</span>
                  </div>
                  <button onClick={() => setPreviewContent(null)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                
                <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-[#222] pt-4 flex-1">
                  {previewContent.text}
                </div>

                <div className="pt-4 border-t border-[#222] flex flex-col gap-2">
                  {previewContent.source === 'World' && previewContent.entryId && (
                    <button 
                      onClick={() => onNavigateToLore(previewContent.entryId!)}
                      className="w-full bg-[#2ecc71] text-black text-[10px] font-black uppercase py-2 rounded shadow-lg hover:bg-[#27ae60] transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📜</span> View in Lorekeeper
                    </button>
                  )}
                  {previewContent.source === 'AI' && (
                    <button 
                      onClick={saveToAppendix}
                      className="w-full border border-[#2ecc7133] text-[#2ecc71] text-[10px] font-black uppercase py-2 rounded hover:bg-[#2ecc7111] transition-colors flex items-center justify-center gap-2"
                    >
                      <span>💾</span> Add to Appendix
                    </button>
                  )}
                </div>

                {loadingPreview && (
                  <div className="flex items-center gap-2 text-[#d4af37] animate-pulse">
                    <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Consulting Tomes...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-700 p-10 text-center">
                <span className="text-4xl mb-4">✨</span>
                <p className="text-[10px] uppercase font-bold tracking-widest leading-loose">Archives Ready</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-[#121212] border-t border-[#333] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#2a2a2a] border border-[#333] rounded overflow-hidden flex items-center justify-center">
              {character.portrait ? (
                <img src={character.portrait} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#d4af37] font-black text-xs">{character.name.charAt(0)}</span>
              )}
            </div>
             <input 
              type="text" 
              placeholder="CHARACTER NAME..."
              className="bg-[#2a2a2a] border border-[#333] px-4 py-2 rounded text-xs font-bold focus:outline-none focus:border-[#d4af37] w-48 transition-colors"
              value={character.name}
              onChange={(e) => onUpdate({...character, name: e.target.value})}
            />
            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              ID: {character.id}
            </div>
          </div>
          
          <div className="flex gap-2 h-1.5 w-48">
            {[character.ancestry, character.background, character.class, character.feats.length > 0].map((item, i) => (
              <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${item ? 'bg-[#d4af37]' : 'bg-[#333]'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterBuilder;
