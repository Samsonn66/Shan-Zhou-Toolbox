
import React from 'react';
import { FullCharacter } from '../types';

interface Props {
  character: FullCharacter;
  onClose: () => void;
}

const CharacterSheetModal: React.FC<Props> = ({ character, onClose }) => {
  const getModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : mod);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative bg-[#1e1e1e] border-2 border-[#d4af37] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-[#d4af37] p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black text-[#d4af37] rounded flex items-center justify-center font-black serif text-xl overflow-hidden">
              {character.portrait ? (
                <img src={character.portrait} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                character.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-black font-black text-xl serif leading-none uppercase">{character.name || "UNNAMED HERO"}</h2>
              <p className="text-black text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-80">
                LEVEL {character.level} • {character.ancestry || "???"} {character.class || "???"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-black/10 hover:bg-black/20 text-black rounded-full flex items-center justify-center font-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-visible">
          
          {/* Main Info Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left Col: Core Stats */}
            <div className="space-y-8">
              <section>
                <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Ability Scores</h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(character.stats).map(([stat, score]) => (
                    <div key={stat} className="bg-black/30 border border-[#333] p-3 rounded-lg text-center flex flex-col items-center">
                      <div className="text-[9px] font-black text-gray-500 uppercase tracking-tighter mb-1">{stat}</div>
                      <div className="text-2xl font-black serif text-[#d4af37] leading-none">{formatMod(getModifier(score))}</div>
                      <div className="text-[10px] font-bold text-gray-600 mt-2 border-t border-[#222] w-full pt-1">SCORE: {score}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Defense & Vitals</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg flex justify-between items-center">
                      <div>
                         <div className="text-[10px] font-black text-red-500 uppercase">Hit Points</div>
                         <div className="text-3xl font-black serif text-red-400">
                           {character.class ? 10 + getModifier(character.stats.con) : "--"}
                         </div>
                      </div>
                      <div className="text-2xl opacity-50">❤️</div>
                   </div>
                   <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg flex justify-between items-center">
                      <div>
                         <div className="text-[10px] font-black text-blue-500 uppercase">Armor Class</div>
                         <div className="text-3xl font-black serif text-blue-400">
                           {10 + getModifier(character.stats.dex)}
                         </div>
                      </div>
                      <div className="text-2xl opacity-50">🛡️</div>
                   </div>
                </div>
              </section>
            </div>

            {/* Right Col: Details */}
            <div className="space-y-8">
              <section>
                <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Character Bio</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#2a2a2a] p-3 rounded border border-[#333]">
                    <span className="text-[9px] font-black text-gray-500 uppercase">Ancestry & Heritage</span>
                    <span className="text-sm font-bold text-gray-200">{character.heritage || character.ancestry || "Not Defined"}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2a2a2a] p-3 rounded border border-[#333]">
                    <span className="text-[9px] font-black text-gray-500 uppercase">Background</span>
                    <span className="text-sm font-bold text-gray-200">{character.background || "Not Defined"}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#2a2a2a] p-3 rounded border border-[#333]">
                    <span className="text-[9px] font-black text-gray-500 uppercase">Class Dedication</span>
                    <span className="text-sm font-bold text-gray-200">{character.class || "Not Defined"}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Inventory Summary</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/20 p-2 rounded text-center">
                    <div className="text-[8px] font-black text-gray-500 uppercase">Weapons</div>
                    <div className="text-lg font-black text-[#d4af37]">{character.equipment.weapons.length}</div>
                  </div>
                  <div className="bg-black/20 p-2 rounded text-center">
                    <div className="text-[8px] font-black text-gray-500 uppercase">Armor</div>
                    <div className="text-lg font-black text-[#d4af37]">{character.equipment.armor.length}</div>
                  </div>
                  <div className="bg-black/20 p-2 rounded text-center">
                    <div className="text-[8px] font-black text-gray-500 uppercase">Gear</div>
                    <div className="text-lg font-black text-[#d4af37]">{character.equipment.gear.length}</div>
                  </div>
                </div>
              </section>
            </div>

          </div>

          {/* Combat & Equipment Section */}
          <section>
            <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-6 border-b border-[#333] pb-2">Equipment & Arms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-l-2 border-[#d4af37] pl-2">Weapons</h4>
                {character.equipment.weapons.map(w => (
                  <div key={w.id} className="p-3 bg-black/10 border border-[#333] rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[#d4af37]">{w.name}</span>
                      <span className="text-[10px] font-bold text-red-400">{w.damage}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {w.traits.map(t => <span key={t} className="text-[8px] text-gray-500 font-bold uppercase">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-l-2 border-blue-400 pl-2">Armor</h4>
                {character.equipment.armor.map(a => (
                  <div key={a.id} className="p-3 bg-black/10 border border-[#333] rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-blue-400">{a.name}</span>
                      <span className="text-[10px] font-bold text-white">AC +{a.acBonus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Feats & Abilities Section */}
          <section>
            <h3 className="text-[10px] font-black uppercase text-[#d4af37] tracking-[0.2em] mb-6 border-b border-[#333] pb-2">Feats & Abilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {character.feats.map(feat => (
                <div key={feat.id} className="p-4 bg-black/20 border border-[#333] rounded-lg relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-[#d4af37] text-sm">{feat.name}</h4>
                    <span className="text-[8px] bg-[#d4af3722] text-[#d4af37] px-1.5 py-0.5 rounded font-black">LVL {feat.level}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-3 leading-relaxed">{feat.description}</p>
                </div>
              ))}
              {character.feats.length === 0 && (
                <div className="col-span-2 text-center py-10 border border-dashed border-[#333] rounded-lg opacity-30 italic text-sm">
                  No specialized feats recorded for this adventurer.
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-black/50 border-t border-[#333] p-4 flex justify-between items-center">
          <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
            Shan' Zhou Chronicles • {character.id}
          </div>
          <button 
            onClick={() => window.print()}
            className="text-[10px] font-black uppercase text-[#d4af37] hover:underline"
          >
            Export Sheet
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetModal;
