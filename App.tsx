
import React, { useState, useEffect } from 'react';
import Oracle from './components/Oracle';
import AIWorkshop from './components/AIWorkshop';
import LoreKeeper from './components/LoreKeeper';
import CharacterBuilder from './components/CharacterBuilder';
import Spellbook from './components/Spellbook';
import { FullCharacter } from './types';

const DEFAULT_STATS = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

const createNewCharacter = (name: string = "New Hero"): FullCharacter => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  level: 1,
  ancestry: "",
  heritage: "",
  background: "",
  class: "",
  stats: { ...DEFAULT_STATS },
  feats: [],
  spells: []
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'toolbox' | 'artist' | 'lore' | 'builder' | 'spells'>('toolbox');
  const [characters, setCharacters] = useState<FullCharacter[]>([createNewCharacter("Shan' Zhou")]);
  const [activeCharId, setActiveCharId] = useState<string>(characters[0].id);

  const activeChar = characters.find(c => c.id === activeCharId) || characters[0];

  const updateActiveChar = (updatedChar: FullCharacter) => {
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const addCharacter = () => {
    if (characters.length >= 6) return;
    const newChar = createNewCharacter(`Hero ${characters.length + 1}`);
    setCharacters(prev => [...prev, newChar]);
    setActiveCharId(newChar.id);
    setActiveTab('builder');
  };

  const removeCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (characters.length <= 1) return;
    const newChars = characters.filter(c => c.id !== id);
    setCharacters(newChars);
    if (activeCharId === id) {
      setActiveCharId(newChars[0].id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Pathbuilder style */}
      <nav className="w-full md:w-64 bg-[#1e1e1e] border-r border-[#333] flex flex-col p-4 space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-[#d4af37] rounded flex items-center justify-center text-black font-black text-xl serif">
            SZ
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Shan' Zhou</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Solo Toolbox</p>
          </div>
        </div>

        {/* Character Management Section */}
        <div className="space-y-2">
          <div className="px-2 flex justify-between items-center">
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Your Party ({characters.length}/6)</p>
            {characters.length < 6 && (
              <button 
                onClick={addCharacter}
                className="text-[#d4af37] text-lg hover:scale-110 transition-transform"
                title="Add Character"
              >
                +
              </button>
            )}
          </div>
          <div className="space-y-1">
            {characters.map((char) => (
              <div 
                key={char.id}
                onClick={() => setActiveCharId(char.id)}
                className={`group flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all border ${
                  activeCharId === char.id 
                  ? 'bg-[#d4af371a] border-[#d4af3733] text-[#d4af37]' 
                  : 'border-transparent text-gray-500 hover:bg-[#2a2a2a]'
                }`}
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                   activeCharId === char.id ? 'bg-[#d4af37] text-black' : 'bg-[#333] text-gray-400'
                }`}>
                  {char.name.charAt(0)}
                </div>
                <span className="text-xs font-bold truncate flex-1">{char.name || "Unnamed"}</span>
                {characters.length > 1 && (
                  <button 
                    onClick={(e) => removeCharacter(char.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1 pt-4 border-t border-[#333]">
          <button 
            onClick={() => setActiveTab('toolbox')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-semibold ${activeTab === 'toolbox' ? 'bg-[#d4af37] text-black' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
          >
            <span>🎲</span> Solo Toolbox
          </button>
          <button 
            onClick={() => setActiveTab('builder')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-semibold ${activeTab === 'builder' ? 'bg-[#d4af37] text-black' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
          >
            <span>👤</span> Character Builder
          </button>
          <button 
            onClick={() => setActiveTab('spells')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-semibold ${activeTab === 'spells' ? 'bg-[#9b59b6] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
          >
            <span>📖</span> Spellbook
          </button>
          <button 
            onClick={() => setActiveTab('lore')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-semibold ${activeTab === 'lore' ? 'bg-[#2ecc71] text-black' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
          >
            <span>📜</span> Lorekeeper
          </button>
          <button 
            onClick={() => setActiveTab('artist')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-semibold ${activeTab === 'artist' ? 'bg-[#3498db] text-black' : 'text-gray-400 hover:bg-[#2a2a2a]'}`}
          >
            <span>🎨</span> Artificer
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-[#333]">
          <div className="bg-[#121212] p-4 rounded text-xs text-gray-500 space-y-2">
            <p className="font-bold text-gray-400 uppercase tracking-tighter">Current Session</p>
            <div className="flex justify-between">
              <span>Level {activeChar.level}</span>
              <span className="text-[#d4af37]">{activeChar.class || "Pathfinder"}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl mx-auto w-full">
        {activeTab === 'toolbox' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            <header>
              <h2 className="text-3xl font-bold serif text-[#d4af37]">The Solo Toolbox</h2>
              <p className="text-gray-400 text-sm mt-1">Harness the randomness of the universe for {activeChar.name}.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Oracle />
              <div className="bg-[#1e1e1e] border border-[#333] p-4 rounded shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-[#e74c3c] serif flex items-center gap-2">
                  <span>⚔️</span> Random Encounter
                </h3>
                <p className="text-sm text-gray-400 mb-6 italic">Generate a PF2e balanced encounter for Level {activeChar.level}.</p>
                <div className="space-y-4">
                  <div className="bg-[#121212] p-4 rounded border-l-4 border-[#e74c3c]">
                    <p className="text-sm font-medium">Party Context: {characters.map(c => c.name).join(', ')}</p>
                  </div>
                  <button className="w-full bg-[#2a2a2a] hover:bg-[#333] py-2 rounded text-xs font-bold uppercase tracking-widest text-[#e74c3c] border border-[#e74c3c]">
                    Generate Level {activeChar.level} Combat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <CharacterBuilder 
              character={activeChar} 
              onUpdate={updateActiveChar} 
            />
          </div>
        )}

        {activeTab === 'spells' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Spellbook 
              character={activeChar} 
              onUpdate={updateActiveChar} 
            />
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <header>
              <h2 className="text-3xl font-bold serif text-[#2ecc71]">The Lorekeeper's Sanctorum</h2>
              <p className="text-gray-400 text-sm mt-1">Consult the archives regarding {activeChar.name}'s journey.</p>
            </header>
            <LoreKeeper />
          </div>
        )}

        {activeTab === 'artist' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <header>
              <h2 className="text-3xl font-bold serif text-[#3498db]">The Artificer's Forge</h2>
              <p className="text-gray-400 text-sm mt-1">Visualize {activeChar.name}, foes, and locations.</p>
            </header>
            <AIWorkshop />
          </div>
        )}
      </main>
      
      {/* Persistent Call to Action */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-[#d4af37] text-black px-4 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
          <span>🎲</span> Quick Roll d20
        </div>
      </div>
    </div>
  );
};

export default App;
