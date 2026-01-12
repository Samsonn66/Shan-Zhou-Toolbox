
import React, { useState, useMemo, useRef } from 'react';
import { FullCharacter, Wealth, SkillEntry, Weapon, Armor, Gear, CharacterAction } from '../types';
import { GeminiService } from '../services/gemini';

interface Props {
  character: FullCharacter;
  onUpdate?: (char: FullCharacter) => void;
  onClose: () => void;
}

type TabType = 'main' | 'combat' | 'skills' | 'abilities' | 'inventory' | 'notes' | 'actions';

const CharacterSheetModal: React.FC<Props> = ({ character, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [actionSearch, setActionSearch] = useState("");
  const [actionCost, setActionCost] = useState<number>(1);
  const [loadingAction, setLoadingAction] = useState(false);
  const dragItem = useRef<string | null>(null);

  const getModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : mod);

  const isLocked = character.sheetLocked;
  // Ensure 'portrait' is included in the layout keys if not present
  const layout = useMemo(() => {
    const baseLayout = character.mainLayout || ['ancestry', 'background', 'class', 'traits', 'stats'];
    if (!baseLayout.includes('portrait')) {
      return [...baseLayout, 'portrait'];
    }
    return baseLayout;
  }, [character.mainLayout]);

  const toggleLock = () => {
    if (!onUpdate) return;
    onUpdate({ ...character, sheetLocked: !isLocked });
  };

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdate) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onUpdate({ ...character, portrait: base64String });
    };
    reader.readAsDataURL(file);
  };

  const calculateBulk = useMemo(() => {
    const parseBulk = (bulkStr: string): number => {
      if (!bulkStr || bulkStr === '-' || bulkStr === '0') return 0;
      if (bulkStr.toUpperCase() === 'L') return 0.1;
      const val = parseFloat(bulkStr);
      return isNaN(val) ? 0 : val;
    };

    let total = 0;
    character.equipment.weapons.forEach(w => total += parseBulk(w.bulk));
    character.equipment.armor.forEach(a => total += parseBulk(a.bulk));
    character.equipment.gear.forEach(g => total += parseBulk(g.bulk));
    
    return Math.floor(total * 10) / 10; // Round to 1 decimal
  }, [character.equipment]);

  const updateWealth = (coin: keyof Wealth, val: number) => {
    if (!onUpdate) return;
    onUpdate({
      ...character,
      wealth: {
        ...character.wealth,
        [coin]: Math.max(0, character.wealth[coin] + val)
      }
    });
  };

  const updateSkillRank = (skillName: string) => {
    if (!onUpdate) return;
    onUpdate({
      ...character,
      skills: character.skills.map(s => 
        s.name === skillName ? { ...s, rank: (s.rank + 1) % 5 } : s
      )
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!onUpdate) return;
    onUpdate({ ...character, notes: e.target.value });
  };

  const addAction = async () => {
    if (!actionSearch.trim() || !onUpdate) return;
    setLoadingAction(true);
    try {
      const details = await GeminiService.getActionDetails(actionSearch);
      const newAction: CharacterAction = {
        id: Math.random().toString(36).substr(2, 9),
        ...details,
        // Override cost if details from AI are missing or if user specifically selected one
        cost: details.cost || actionCost 
      };
      onUpdate({ ...character, actions: [...(character.actions || []), newAction] });
      setActionSearch("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(false);
    }
  };

  const removeAction = (id: string) => {
    if (!onUpdate) return;
    onUpdate({ ...character, actions: character.actions.filter(a => a.id !== id) });
  };

  const updateHeroPoints = (val: number) => {
    if (!onUpdate) return;
    onUpdate({ ...character, heroPoints: Math.max(0, (character.heroPoints || 0) + val) });
  };

  const updateDestinyPoints = (val: number) => {
    if (!onUpdate) return;
    onUpdate({ ...character, destinyPoints: Math.max(0, (character.destinyPoints || 0) + val) });
  };

  const updateTitle = (title: string) => {
    if (!onUpdate) return;
    onUpdate({ ...character, title });
  };

  const updateCharacterName = (name: string) => {
    if (!onUpdate) return;
    onUpdate({ ...character, name });
  };

  const getRankName = (rank: number) => {
    switch(rank) {
      case 1: return 'T';
      case 2: return 'E';
      case 3: return 'M';
      case 4: return 'L';
      default: return 'U';
    }
  };

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return 'text-blue-400';
      case 2: return 'text-green-400';
      case 3: return 'text-purple-400';
      case 4: return 'text-[#d4af37]';
      default: return 'text-gray-600';
    }
  };

  const renderActionIcon = (cost?: number) => {
    if (cost === 1) return <span className="text-[#d4af37] font-black">[1]</span>;
    if (cost === 2) return <span className="text-[#d4af37] font-black">[2]</span>;
    if (cost === 3) return <span className="text-[#d4af37] font-black">[3]</span>;
    return null;
  };

  const statNames: Record<string, string> = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma"
  };

  // Drag and Drop implementation for widgets
  const handleDragStart = (e: React.DragEvent, key: string) => {
    if (isLocked) return;
    dragItem.current = key;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, targetKey: string) => {
    if (isLocked || !dragItem.current || dragItem.current === targetKey || !onUpdate) return;
    const newLayout = [...layout];
    const dragIdx = newLayout.indexOf(dragItem.current);
    const targetIdx = newLayout.indexOf(targetKey);
    newLayout.splice(dragIdx, 1);
    newLayout.splice(targetIdx, 0, dragItem.current);
    onUpdate({ ...character, mainLayout: newLayout });
  };

  const handleLoreLink = (query: string) => {
    alert(`Searching Appendix for: ${query}. Open Lore tab to see detailed world archives.`);
  };

  const renderWidget = (key: string) => {
    const commonStyles = `bg-[#1a1a1a] border border-[#333] p-6 rounded-lg shadow-inner group hover:border-[#d4af3744] transition-colors relative flex flex-col w-full ${!isLocked ? 'cursor-move border-dashed border-[#d4af3755] resize overflow-auto min-h-[100px]' : ''}`;
    
    const dragHandle = !isLocked && (
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-700 opacity-50 select-none">
        ⋮⋮
      </div>
    );

    switch (key) {
      case 'stats':
        return (
          <div 
            key={key} 
            draggable={!isLocked} 
            onDragStart={(e) => handleDragStart(e, key)}
            onDragEnter={(e) => handleDragEnter(e, key)}
            className={commonStyles}
          >
            {dragHandle}
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Ability Scores</h4>
              <button onClick={() => handleLoreLink('Ability Checks')} className="text-[10px] font-black uppercase text-[#d4af37] hover:underline">Link</button>
            </div>
            <div className="space-y-2">
              {Object.entries(character.stats).map(([stat, score]) => (
                <div key={stat} className="flex justify-between items-center border-b border-[#222] pb-1.5 last:border-0 last:pb-0">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{statNames[stat] || stat}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-600 tracking-tighter">MOD: {formatMod(getModifier(score as number))}</span>
                    <span className="text-xl font-black serif text-[#d4af37] w-8 text-right leading-none">{score as number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'ancestry':
        return (
          <div 
            key={key} 
            draggable={!isLocked} 
            onDragStart={(e) => handleDragStart(e, key)}
            onDragEnter={(e) => handleDragEnter(e, key)}
            className={commonStyles}
          >
            {dragHandle}
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Ancestry / Heritage</h4>
              <button onClick={() => handleLoreLink(character.ancestry)} className="text-[10px] font-black uppercase text-[#d4af37] hover:underline">Link</button>
            </div>
            <div className="text-xl font-bold serif text-white">
              {character.ancestry || "---"} 
              <span className="text-gray-500 mx-2 text-sm italic">({character.heritage || "No Heritage Selected"})</span>
            </div>
          </div>
        );
      case 'background':
        return (
          <div 
            key={key} 
            draggable={!isLocked} 
            onDragStart={(e) => handleDragStart(e, key)}
            onDragEnter={(e) => handleDragEnter(e, key)}
            className={commonStyles}
          >
            {dragHandle}
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Background</h4>
              <button onClick={() => handleLoreLink(character.background)} className="text-[10px] font-black uppercase text-[#d4af37] hover:underline">Link</button>
            </div>
            <div className="text-xl font-bold serif text-white">
              {character.background || "No Background Selected"}
            </div>
          </div>
        );
      case 'class':
        return (
          <div 
            key={key} 
            draggable={!isLocked} 
            onDragStart={(e) => handleDragStart(e, key)}
            onDragEnter={(e) => handleDragEnter(e, key)}
            className={commonStyles}
          >
            {dragHandle}
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Class / Level</h4>
              <button onClick={() => handleLoreLink(character.class)} className="text-[10px] font-black uppercase text-[#d4af37] hover:underline">Link</button>
            </div>
            <div className="text-xl font-bold serif text-white">
              <span className="text-[#d4af37]">LVL {character.level}</span> {character.class || "No Class Selected"}
            </div>
          </div>
        );
      case 'traits':
        return (
          <div 
            key={key} 
            draggable={!isLocked} 
            onDragStart={(e) => handleDragStart(e, key)}
            onDragEnter={(e) => handleDragEnter(e, key)}
            className={commonStyles}
          >
            {dragHandle}
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Traits</h4>
              <button onClick={() => handleLoreLink('Traits')} className="text-[10px] font-black uppercase text-[#d4af37] hover:underline">Link</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {character.ancestry && (
                <span className="bg-[#2a2a2a] text-xs font-bold px-3 py-1 border border-[#333] rounded uppercase text-gray-400">
                  {character.ancestry}
                </span>
              )}
              <span className="bg-[#2a2a2a] text-xs font-bold px-3 py-1 border border-[#333] rounded uppercase text-gray-400">
                Humanoid
              </span>
              {character.class && (
                <span className="bg-[#2a2a2a] text-xs font-bold px-3 py-1 border border-[#333] rounded uppercase text-gray-400">
                  {character.class}
                </span>
              )}
              {!character.ancestry && !character.class && (
                <span className="text-xs text-gray-600 italic">No traits assigned.</span>
              )}
            </div>
          </div>
        );
      case 'portrait':
        return (
          <div 
            key={key} 
            draggable={!isLocked} 
            onDragStart={(e) => handleDragStart(e, key)}
            onDragEnter={(e) => handleDragEnter(e, key)}
            className={commonStyles}
          >
            {dragHandle}
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Portrait</h4>
              <label className="text-[10px] font-black uppercase text-[#d4af37] hover:underline cursor-pointer">
                Upload
                <input type="file" className="hidden" accept="image/*" onChange={handlePortraitUpload} />
              </label>
            </div>
            <div className="flex-1 min-h-[200px] flex items-center justify-center bg-black/20 rounded-lg overflow-hidden border border-[#222]">
              {character.portrait ? (
                <img src={character.portrait} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <span className="text-4xl opacity-10 mb-2 block">👤</span>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">No Portrait Uploaded</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <div className="animate-in fade-in duration-300">
            {/* Split layout into two columns for Main tab */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: All non-portrait widgets */}
              <div className="space-y-4">
                {layout.filter(k => k !== 'portrait').map(key => renderWidget(key))}
              </div>
              {/* Right Column: Portrait widget */}
              <div className="space-y-4">
                {layout.filter(k => k === 'portrait').map(key => renderWidget(key))}
              </div>
            </div>
          </div>
        );
      case 'combat':
        return (
          <div className="space-y-10 animate-in fade-in duration-300">
            <section>
              <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-6 border-b border-[#333] pb-2">Defense & Vitals</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className={`bg-red-900/10 border border-red-900/30 p-4 rounded-lg ${!isLocked ? 'resize overflow-auto' : ''}`}>
                    <div className="text-[10px] font-black text-red-500 uppercase mb-1">HP</div>
                    <div className="text-3xl font-black serif text-red-400">{character.class ? 10 + getModifier(character.stats.con) : "--"}</div>
                 </div>
                 <div className={`bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg ${!isLocked ? 'resize overflow-auto' : ''}`}>
                    <div className="text-[10px] font-black text-blue-500 uppercase mb-1">AC</div>
                    <div className="text-3xl font-black serif text-blue-400">{10 + getModifier(character.stats.dex)}</div>
                 </div>
                 <div className={`bg-gray-800/30 border border-gray-700 p-4 rounded-lg ${!isLocked ? 'resize overflow-auto' : ''}`}>
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Speed</div>
                    <div className="text-3xl font-black serif text-white">25ft</div>
                 </div>
                 <div className={`bg-gray-800/30 border border-gray-700 p-4 rounded-lg ${!isLocked ? 'resize overflow-auto' : ''}`}>
                    <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Init</div>
                    <div className="text-3xl font-black serif text-white">{formatMod(getModifier(character.stats.wis))}</div>
                 </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-6 border-b border-[#333] pb-2">Weapon Proficiencies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {character.equipment.weapons.map(w => (
                  <div key={w.id} className={`p-4 bg-black/20 border border-[#333] rounded-lg flex justify-between items-center group ${!isLocked ? 'resize-y overflow-auto' : ''}`}>
                    <div>
                      <h4 className="font-bold text-[#d4af37] text-sm">{w.name}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold text-red-400">{w.damage}</span>
                        <span className="text-[9px] text-gray-500 uppercase font-black">{w.traits.join(', ')}</span>
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white pr-4">
                      {formatMod(getModifier(character.stats.str) + 2 + character.level)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      case 'skills':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Skills & Proficiencies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {character.skills.map(s => {
                const abilityMod = getModifier(character.stats[s.ability]);
                const proficiencyBonus = s.rank > 0 ? 2 + (s.rank - 1) * 2 + character.level : 0;
                const totalMod = abilityMod + proficiencyBonus;
                return (
                  <div key={s.name} className={`flex items-center justify-between bg-black/20 p-2 rounded border border-[#333] hover:border-[#d4af3733] transition-colors ${!isLocked ? 'resize-y overflow-auto' : ''}`}>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateSkillRank(s.name)}
                        className={`w-6 h-6 rounded flex items-center justify-center font-black text-[10px] border border-gray-800 transition-colors ${getRankColor(s.rank)} bg-black/40 hover:bg-black/60`}
                      >
                        {getRankName(s.rank)}
                      </button>
                      <span className="text-xs font-bold text-gray-300">{s.name}</span>
                    </div>
                    <span className="text-sm font-black text-[#d4af37] w-8 text-right">
                      {formatMod(totalMod)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'abilities':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-6 border-b border-[#333] pb-2">Ancestry, Class & General Feats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {character.feats.map(feat => (
                <div key={feat.id} className={`p-4 bg-black/20 border border-[#333] rounded-lg ${!isLocked ? 'resize-y overflow-auto' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-[#d4af37] text-sm">{feat.name}</h4>
                    <span className="text-[8px] bg-[#d4af3722] text-[#d4af37] px-1.5 py-0.5 rounded font-black">LVL {feat.level}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-4 leading-relaxed">{feat.description}</p>
                </div>
              ))}
              {character.feats.length === 0 && (
                <div className="col-span-2 text-center py-20 border border-dashed border-[#333] rounded-lg opacity-30 italic text-sm">
                  No specialized abilities recorded.
                </div>
              )}
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Wealth Tracker */}
            <section>
              <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-6 border-b border-[#333] pb-2">The Treasury (Spirit Coins)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { key: 'qin' as keyof Wealth, label: 'Qìn', sub: '1 cp', color: 'text-orange-500' },
                  { key: 'ling' as keyof Wealth, label: 'Líng', sub: '1 sp', color: 'text-gray-400' },
                  { key: 'yu' as keyof Wealth, label: 'Yù', sub: '1 gp', color: 'text-yellow-500' },
                  { key: 'tian' as keyof Wealth, label: 'Tiān', sub: '10 gp', color: 'text-cyan-400' },
                  { key: 'huang' as keyof Wealth, label: 'Huáng', sub: '100 gp', color: 'text-purple-500' }
                ].map(coin => (
                  <div key={coin.key} className="bg-black/30 border border-[#333] p-3 rounded-lg flex flex-col items-center">
                    <div className={`text-[9px] font-black uppercase tracking-tighter mb-1 ${coin.color}`}>{coin.label}</div>
                    <div className="flex items-center gap-3 my-1">
                      <button onClick={() => updateWealth(coin.key, -1)} className="text-gray-600 hover:text-white font-black">-</button>
                      <span className="text-lg font-black text-white">{character.wealth[coin.key]}</span>
                      <button onClick={() => updateWealth(coin.key, 1)} className="text-gray-600 hover:text-white font-black">+</button>
                    </div>
                    <div className="text-[8px] font-bold text-gray-700 uppercase">{coin.sub}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bulk Tracking */}
            <section>
              <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-2">
                <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em]">Inventory Items</h3>
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-black text-gray-500 uppercase">Current Bulk:</span>
                   <span className={`text-xs font-black ${calculateBulk > 5 + getModifier(character.stats.str) ? 'text-red-500' : 'text-[#d4af37]'}`}>
                     {calculateBulk} / {5 + getModifier(character.stats.str)}
                   </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                   ...character.equipment.weapons.map(w => ({ ...w, icon: '⚔️' })),
                   ...character.equipment.armor.map(a => ({ ...a, icon: '🛡️' })),
                   ...character.equipment.gear.map(g => ({ ...g, icon: '🎒' }))
                 ].map((item, idx) => (
                   <div key={idx} className={`flex justify-between items-center p-3 bg-black/10 border border-[#333] rounded group ${!isLocked ? 'resize-y overflow-auto' : ''}`}>
                     <div className="flex items-center gap-3">
                       <span className="text-lg opacity-40">{item.icon}</span>
                       <div>
                         <div className="text-sm font-bold text-gray-200">{item.name}</div>
                         <div className="text-[9px] text-gray-600 font-bold uppercase">{item.bulk ? `Bulk ${item.bulk}` : '---'}</div>
                       </div>
                     </div>
                   </div>
                 ))}
                 {([...character.equipment.weapons, ...character.equipment.armor, ...character.equipment.gear].length === 0) && (
                   <div className="col-span-full py-10 text-center text-xs text-gray-600 italic">Inventory is empty.</div>
                 )}
              </div>
            </section>
          </div>
        );
      case 'notes':
        return (
          <div className="h-full flex flex-col animate-in fade-in duration-300">
            <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Character Notes</h3>
            <textarea
              className="flex-1 w-full bg-black/20 border border-[#333] p-6 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#d4af37] resize-none leading-relaxed"
              placeholder="Record your deeds, goals, and secrets here..."
              value={character.notes || ""}
              onChange={handleNotesChange}
            />
          </div>
        );
      case 'actions':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Actions & Reactions</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Search for a PF2e action (e.g. Tumble Behind, Grapple)..."
                  className="flex-1 bg-black/20 border border-[#333] p-3 rounded text-xs focus:outline-none focus:border-[#d4af37]"
                  value={actionSearch}
                  onChange={(e) => setActionSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAction()}
                />
                
                <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded border border-[#333]">
                  <span className="text-[8px] font-black text-gray-600 uppercase mr-1">Cost:</span>
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => setActionCost(num)}
                      className={`w-8 h-8 rounded text-[10px] font-black transition-all ${
                        actionCost === num ? 'bg-[#d4af37] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={addAction} 
                  disabled={loadingAction || !actionSearch}
                  className="bg-[#d4af37] text-black px-4 rounded font-bold text-[10px] uppercase disabled:opacity-50 transition-all hover:bg-[#c19b2e]"
                >
                  {loadingAction ? '...' : 'Add'}
                </button>
              </div>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest italic ml-1">AI search will favor your selected action cost if no specific rule exists.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(character.actions || []).map(action => (
                <div key={action.id} className={`p-4 bg-black/20 border border-[#333] rounded-lg relative group ${!isLocked ? 'resize-y overflow-auto' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {renderActionIcon(action.cost)}
                      <h4 className="font-bold text-[#d4af37] text-sm">{action.name}</h4>
                    </div>
                    <button onClick={() => removeAction(action.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-[8px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-black uppercase">{action.type}</span>
                    {action.traits.map(t => <span key={t} className="text-[8px] bg-[#d4af3711] text-[#d4af37] px-1.5 py-0.5 rounded font-black uppercase">{t}</span>)}
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-3 leading-relaxed italic">{action.description}</p>
                </div>
              ))}
              {(character.actions || []).length === 0 && (
                <div className="col-span-2 text-center py-20 border border-dashed border-[#333] rounded-lg opacity-30 italic text-sm">
                  No specific quick actions defined. Use the search to find core rules actions.
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className={`relative bg-[#1e1e1e] border-2 border-[#d4af37] w-full max-w-6xl h-full max-h-[90vh] rounded-lg shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col animate-in zoom-in-95 duration-300 ${!isLocked ? 'resize overflow-auto' : 'overflow-hidden'}`}>
        
        {/* Header */}
        <div className="bg-[#d4af37] p-5 flex items-center justify-between shadow-lg shrink-0">
          <div className="flex items-center gap-5">
            <div className={`relative group/portrait ${!isLocked ? 'cursor-move' : ''}`}>
              <div className="w-12 h-12 bg-black text-[#d4af37] rounded-lg flex items-center justify-center font-black serif text-2xl overflow-hidden shadow-inner border border-black/20">
                {character.portrait ? (
                  <img src={character.portrait} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  character.name.charAt(0)
                )}
              </div>
              {/* Duplicated Icon as a Badge */}
              {character.portrait && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-black overflow-hidden bg-black">
                  <img src={character.portrait} alt="Icon" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <input
                type="text"
                value={character.name}
                onChange={(e) => updateCharacterName(e.target.value)}
                placeholder="UNNAMED HERO"
                className="bg-transparent text-black font-black text-2xl serif leading-none uppercase tracking-tight focus:outline-none border-b border-transparent focus:border-black/20 w-full md:w-80"
              />
              <input
                type="text"
                value={character.title || ""}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="CHARACTER TITLE"
                className="bg-transparent text-black text-[11px] font-bold uppercase tracking-[0.15em] mt-1 opacity-70 focus:outline-none border-b border-transparent focus:border-black/20"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-black/50 uppercase">Destiny Points</span>
                  <div className="flex items-center bg-black/10 rounded px-2 py-0.5 border border-black/5">
                    <button onClick={() => updateDestinyPoints(-1)} className="text-black font-black px-1 hover:text-white transition-colors">-</button>
                    <span className="mx-2 text-sm font-black text-black">{character.destinyPoints || 0}</span>
                    <button onClick={() => updateDestinyPoints(1)} className="text-black font-black px-1 hover:text-white transition-colors">+</button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-black/50 uppercase">Hero Points</span>
                  <div className="flex items-center bg-black/10 rounded px-2 py-0.5 border border-black/5">
                    <button onClick={() => updateHeroPoints(-1)} className="text-black font-black px-1 hover:text-white transition-colors">-</button>
                    <span className="mx-2 text-sm font-black text-black">{character.heroPoints || 0}</span>
                    <button onClick={() => updateHeroPoints(1)} className="text-black font-black px-1 hover:text-white transition-colors">+</button>
                  </div>
                </div>
             </div>

             <div className="flex items-center gap-2">
                {/* Lock Toggle Button */}
                <button 
                  onClick={toggleLock}
                  title={isLocked ? "Unlock layout to move and resize elements" : "Lock layout to prevent accidental changes"}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all border-2 ${
                    isLocked 
                    ? 'bg-black/10 border-transparent text-black hover:bg-black/20' 
                    : 'bg-red-500 border-red-700 text-white shadow-inner scale-105'
                  }`}
                >
                  {isLocked ? '🔒' : '🔓'}
                </button>

                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-black/10 hover:bg-black/20 text-black rounded-full flex items-center justify-center font-black transition-colors"
                >
                  ✕
                </button>
             </div>
          </div>
        </div>

        {/* Horizontal Tab Bar */}
        <div className="bg-[#121212] border-b border-[#333] flex flex-row overflow-x-auto shrink-0">
           {[
             { id: 'main', label: 'Main' },
             { id: 'combat', label: 'Combat' },
             { id: 'skills', label: 'Skills' },
             { id: 'abilities', label: 'Abilities' },
             { id: 'inventory', label: 'Inventory' },
             { id: 'notes', label: 'Notes' },
             { id: 'actions', label: 'Actions' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as TabType)}
               className={`flex-1 min-w-[100px] flex flex-col items-center justify-center py-4 px-2 transition-all relative ${
                 activeTab === tab.id 
                 ? 'bg-[#d4af37] text-black shadow-inner font-black' 
                 : 'text-gray-500 hover:text-white hover:bg-white/5'
               }`}
             >
               <span className="text-[10px] font-bold uppercase tracking-widest text-center whitespace-nowrap leading-tight">
                 {tab.label}
               </span>
               {activeTab === tab.id && (
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20"></div>
               )}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-visible">
          {!isLocked && (
             <div className="mb-6 bg-red-900/10 border border-red-900/30 p-4 rounded text-[10px] font-black uppercase text-red-500 tracking-widest text-center animate-pulse">
               Layout Unlocked: Drag boxes to reorder • Use bottom-right handles to resize
             </div>
          )}
          {renderTabContent()}
        </div>

        {/* Footer Bar */}
        <div className="h-12 bg-black/40 border-t border-[#333] px-6 flex items-center justify-between text-[9px] font-bold text-gray-600 uppercase tracking-widest shrink-0">
          <div>Shan' Zhou Chronicles • V1.5</div>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => window.print()}>Print / PDF</span>
            <span className="text-gray-800">|</span>
            <span className="text-[#d4af37]">ID: {character.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetModal;
