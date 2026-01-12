
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';
import { Spell, FullCharacter } from '../types';

interface Props {
  character: FullCharacter;
  onUpdate: (char: FullCharacter) => void;
}

const Spellbook: React.FC<Props> = ({ character, onUpdate }) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewSpell, setPreviewSpell] = useState<Spell | null>(null);

  const addSpell = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const details = await GeminiService.getSpellDetails(search);
      const newSpell: Spell = {
        id: Math.random().toString(36).substr(2, 9),
        name: details.name,
        level: details.level,
        tradition: details.tradition,
        description: details.description,
        actions: details.actions,
        prepared: false
      };
      onUpdate({ ...character, spells: [...character.spells, newSpell] });
      setSearch("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrepared = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...character,
      spells: character.spells.map(s => s.id === id ? {...s, prepared: !s.prepared} : s)
    });
  };

  const removeSpell = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...character,
      spells: character.spells.filter(s => s.id !== id)
    });
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#333] rounded shadow-xl overflow-hidden flex flex-col h-[700px]">
      <div className="bg-[#2a2a2a] p-6 border-b border-[#333]">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold serif text-[#9b59b6]">Spellbook: {character.name}</h2>
          <span className="text-[10px] font-black text-[#9b59b6] uppercase bg-[#9b59b61a] px-3 py-1 rounded">
            {character.spells.length} Spells Known
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <input 
            type="text" 
            placeholder="Search for a spell (e.g., Magic Missile)..."
            className="flex-1 bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#9b59b6] transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSpell()}
          />
          <button 
            onClick={addSpell}
            disabled={loading}
            className="bg-[#9b59b6] text-white px-6 py-2 rounded font-bold text-sm hover:bg-[#8e44ad] transition-colors disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Adding...' : 'Add Spell'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Spell List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-[#333] scrollbar-visible">
          {character.spells.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-10">
              <span className="text-6xl mb-4">📖</span>
              <p className="text-sm italic">Your spellbook is empty. Search to find spells.</p>
            </div>
          )}
          
          {[...character.spells].sort((a,b) => a.level - b.level).map(spell => (
            <div 
              key={spell.id} 
              onClick={() => setPreviewSpell(spell)}
              className={`p-4 rounded border cursor-pointer transition-all relative group ${
                previewSpell?.id === spell.id ? 'border-[#9b59b6] bg-[#9b59b622]' : 'border-[#333] bg-[#2a2a2a] hover:border-gray-500'
              } ${spell.prepared ? 'border-l-4 border-l-[#9b59b6]' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#333] px-2 py-0.5 rounded text-gray-400">LVL {spell.level}</span>
                    <h4 className="font-bold text-lg">{spell.name}</h4>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold text-[#9b59b6]">{spell.tradition}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-500">• {spell.actions}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => togglePrepared(spell.id, e)}
                    className={`text-[10px] font-bold px-3 py-1 rounded border transition-colors ${spell.prepared ? 'bg-[#9b59b6] text-white border-[#9b59b6]' : 'border-[#444] text-gray-500 hover:border-gray-400'}`}
                  >
                    {spell.prepared ? 'PREPARED' : 'PREPARE'}
                  </button>
                  <button 
                    onClick={(e) => removeSpell(spell.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                {spell.description}
              </p>
            </div>
          ))}
        </div>

        {/* Side Preview Panel - Scrollable */}
        <div className={`w-80 bg-[#121212] transition-all overflow-y-auto scrollbar-visible ${previewSpell ? 'translate-x-0' : 'translate-x-full absolute right-0'}`}>
          {previewSpell ? (
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-[#9b59b6] serif">{previewSpell.name}</h3>
                <button onClick={() => setPreviewSpell(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="flex flex-wrap gap-2">
                 <span className="text-[10px] font-black bg-[#9b59b6] text-white px-2 py-0.5 rounded uppercase tracking-wider">LVL {previewSpell.level}</span>
                 <span className="text-[10px] font-black bg-[#333] text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider">{previewSpell.tradition}</span>
                 <span className="text-[10px] font-black bg-[#333] text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider">{previewSpell.actions}</span>
              </div>
              <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap border-t border-[#222] pt-4 italic">
                {previewSpell.description}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 p-10 text-center opacity-50">
              <span className="text-4xl mb-4">✨</span>
              <p className="text-[10px] uppercase font-bold tracking-widest leading-loose">Select a spell to view its full arcane transcription.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Spellbook;
