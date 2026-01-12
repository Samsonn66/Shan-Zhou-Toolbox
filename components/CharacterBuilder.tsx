
import React, { useState, useMemo } from 'react';
import { FullCharacter, Feat, Spell, Weapon, Armor, Gear } from '../types';
import { GeminiService } from '../services/gemini';
import { PinnedEntry } from '../App';

const ancestries = [
  { name: "Renmin", icon: "🏮", description: "The versatile folk of Shan' Zhou. Resilient and adaptable." },
  { name: "Human", icon: "👤", description: "Versatile and ambitious." },
  { name: "Elf", icon: "🧝", description: "Long-lived and graceful." },
  { name: "Dwarf", icon: "🧔", description: "Stout and hardy." },
  { name: "Halfling", icon: "🦶", description: "Small and lucky." },
  { name: "Gnome", icon: "🧚", description: "Inquisitive and magical." },
  { name: "Goblin", icon: "👺", description: "Scrappy and energetic." }
];

const heritageMap: Record<string, string[]> = {
  "Renmin": ["Scholar-Official", "Silk-Spinner Heritage", "Iron-Skin Labourer", "Jade-Blessed Noble"],
  "Human": ["Versatile Human", "Skilled Human", "Half-Elf", "Half-Orc"],
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

interface Props {
  character: FullCharacter;
  onUpdate: (char: FullCharacter) => void;
  pinnedEntries: PinnedEntry[];
  onOpenSheet: () => void;
}

const CharacterBuilder: React.FC<Props> = ({ character, onUpdate, pinnedEntries, onOpenSheet }) => {
  const [activeSubTab, setActiveSubTab] = useState<'ancestry' | 'background' | 'class' | 'spells' | 'feats' | 'equipment' | 'stats'>('ancestry');
  const [activeEquipSubTab, setActiveEquipSubTab] = useState<'weapons' | 'armor' | 'gear'>('weapons');
  const [previewContent, setPreviewContent] = useState<{ title: string; text: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const [featSearch, setFeatSearch] = useState("");
  const [addingFeat, setAddingFeat] = useState(false);
  const [spellSearch, setSpellSearch] = useState("");
  const [addingSpell, setAddingSpell] = useState(false);
  const [equipSearch, setEquipSearch] = useState("");
  const [addingEquip, setAddingEquip] = useState(false);

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

  const handlePreview = async (type: 'Ancestry' | 'Background' | 'Class' | 'Heritage' | 'Spell' | 'Weapon' | 'Armor' | 'Gear', selection: string) => {
    setLoadingPreview(true);
    setPreviewContent({ title: selection, text: "Consulting archives..." });

    const archivedEntry = pinnedEntries.find(e => 
      e.title.toLowerCase().includes(selection.toLowerCase()) || 
      e.content.toLowerCase().startsWith(selection.toLowerCase())
    );

    if (archivedEntry) {
      setPreviewContent({ title: selection, text: `[FROM ARCHIVES]\n\n${archivedEntry.content}` });
      setLoadingPreview(false);
      return;
    }

    try {
      const res = await GeminiService.getSelectionPreview(type, selection);
      setPreviewContent({ title: selection, text: res });
    } catch (error) {
      setPreviewContent({ title: selection, text: "Failed to load preview." });
    } finally {
      setLoadingPreview(false);
    }
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

  const removeSpell = (id: string) => {
    onUpdate({ ...character, spells: character.spells.filter(s => s.id !== id) });
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
        newEquipment.weapons = [...newEquipment.weapons, { id, ...details, bulk: details.bulk || "1" }];
      } else if (activeEquipSubTab === 'armor') {
        newEquipment.armor = [...newEquipment.armor, { id, ...details, bulk: details.bulk || "1" }];
      } else {
        newEquipment.gear = [...newEquipment.gear, { id, ...details, bulk: details.bulk || "L" }];
      }

      onUpdate({ ...character, equipment: newEquipment });
      setEquipSearch("");
    } catch (error) {
      console.error(error);
    } finally {
      setAddingEquip(false);
    }
  };

  // Fix: Explicitly handle equipment removal by category to satisfy TypeScript's strict indexing requirements
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
                    {ancestries.map(a => (
                      <div key={a.name} className="relative group">
                        <button 
                          onClick={() => selectAncestry(a.name)}
                          className={`w-full p-4 rounded border transition-all text-left flex items-center gap-4 border-[#333] bg-[#2a2a2a] hover:border-gray-500`}
                        >
                          <span className="text-3xl bg-[#121212] w-12 h-12 flex items-center justify-center rounded-lg border border-[#333]">{a.icon}</span>
                          <div>
                            <div className="font-bold text-[#d4af37]">{a.name}</div>
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
                    ))}
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
                        {heritageMap[character.ancestry]?.map(h => (
                          <div key={h} className="relative group">
                            <button 
                              onClick={() => selectHeritage(h)}
                              className={`w-full p-4 rounded border transition-all text-left flex items-center gap-4 ${
                                character.heritage === h ? 'border-[#d4af37] bg-[#d4af3711]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                              }`}
                            >
                              <div>
                                <div className="font-bold group-hover:text-[#d4af37] transition-colors">{h}</div>
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
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'background' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {backgrounds.map(b => (
                  <div key={b.name} className="relative group">
                    <button 
                      onClick={() => onUpdate({...character, background: b.name})}
                      className={`w-full p-4 rounded border transition-all text-left group ${
                        character.background === b.name ? 'border-[#d4af37] bg-[#d4af3711]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                      }`}
                    >
                      <div className="font-bold group-hover:text-[#d4af37] transition-colors">{b.name}</div>
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
                ))}
              </div>
            )}

            {activeSubTab === 'class' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classes.map(c => (
                  <div key={c.name} className="relative group">
                    <button 
                      onClick={() => onUpdate({...character, class: c.name})}
                      className={`w-full p-4 rounded border transition-all text-left flex justify-between items-center ${
                        character.class === c.name ? 'border-[#d4af37] bg-[#d4af3711]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{c.name}</div>
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
                ))}
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
                      onClick={() => setActiveEquipSubTab(tab)}
                      className={`flex-1 py-2 text-[9px] font-black uppercase transition-all rounded ${
                        activeEquipSubTab === tab ? 'bg-[#d4af37] text-black' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={`Search for a ${activeEquipSubTab.slice(0, -1)}...`}
                    className="flex-1 bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#d4af37]"
                    value={equipSearch}
                    onChange={(e) => setEquipSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEquipment()}
                  />
                  <button onClick={addEquipment} disabled={addingEquip} className="bg-[#d4af37] text-black px-4 rounded font-bold text-xs uppercase disabled:opacity-50">
                    {addingEquip ? '...' : 'Add'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {character.equipment[activeEquipSubTab].map((item: any) => (
                    <div key={item.id} className="p-4 bg-[#2a2a2a] border border-[#333] rounded group relative">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                           <h4 className="font-bold text-[#d4af37]">{item.name}</h4>
                           <div className="text-[9px] text-gray-500 font-bold uppercase">{item.category}</div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
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
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-[#d4af37] serif">{previewContent.title}</h3>
                  <button onClick={() => setPreviewContent(null)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-[#222] pt-4">
                  {previewContent.text}
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
