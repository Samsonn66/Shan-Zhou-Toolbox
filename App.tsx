
import React, { useState } from 'react';
import Oracle from './components/Oracle';
import AIWorkshop from './components/AIWorkshop';
import LoreKeeper from './components/LoreKeeper';
import CharacterBuilder from './components/CharacterBuilder';
import Spellbook from './components/Spellbook';
import CharacterSheetModal from './components/CharacterSheetModal';
import { FullCharacter, AppendixEntry } from './types';

export interface PinnedEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

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
  spells: [],
  equipment: {
    weapons: [],
    armor: [],
    gear: []
  }
});

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'toolbox' | 'artist' | 'lore' | 'builder' | 'spells'>('toolbox');
  const [characters, setCharacters] = useState<FullCharacter[]>([createNewCharacter("Shan' Zhou")]);
  const [activeCharId, setActiveCharId] = useState<string>(characters[0].id);
  const [pinnedEntries, setPinnedEntries] = useState<PinnedEntry[]>([]);
  const [appendixEntries, setAppendixEntries] = useState<AppendixEntry[]>([]);
  
  // Modal State
  const [sheetModalCharId, setSheetModalCharId] = useState<string | null>(null);

  const activeChar = characters.find(c => c.id === activeCharId) || characters[0];
  const sheetChar = characters.find(c => c.id === sheetModalCharId);

  const updateActiveChar = (updatedChar: FullCharacter) => {
    setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  };

  const addCharacter = () => {
    if (characters.length >= 10) return;
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

  const handleImageUpload = (charId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCharacters(prev => prev.map(c => c.id === charId ? { ...c, portrait: base64String } : c));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top Header - Consolidated Navigation and Party */}
      <header className="h-20 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-6 sticky top-0 z-[60] shadow-xl">
        
        {/* Top-Left: Logo & Party Icons */}
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-[#d4af37] rounded-lg flex items-center justify-center text-black font-black text-lg serif shadow-lg flex-shrink-0">
            SZ
          </div>
          
          <div className="h-10 w-px bg-[#333]"></div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {characters.map((char) => (
                <div key={char.id} className="relative group">
                  <button 
                    onClick={() => {
                      setActiveCharId(char.id);
                      setSheetModalCharId(char.id);
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center font-black text-xs relative overflow-hidden ${
                      activeCharId === char.id 
                      ? 'border-[#d4af37] bg-[#d4af37] text-black scale-110 z-10 shadow-lg' 
                      : 'border-[#333] bg-[#121212] text-gray-500 hover:border-gray-400 hover:z-20'
                    }`}
                  >
                    {char.portrait ? (
                      <img src={char.portrait} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      char.name.charAt(0)
                    )}
                  </button>
                  
                  {/* Image Upload Trigger */}
                  <label 
                    htmlFor={`upload-${char.id}`}
                    className="absolute -bottom-1 -left-1 bg-black/80 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-[#333] cursor-pointer hover:bg-[#d4af37] hover:text-black"
                    title="Upload Portrait"
                  >
                    <span className="text-[10px]">📷</span>
                  </label>
                  <input 
                    type="file" 
                    id={`upload-${char.id}`} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(char.id, e)} 
                  />

                  {/* Tooltip */}
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black border border-[#333] px-2 py-1 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-bold uppercase shadow-2xl">
                    {char.name} • Lvl {char.level}
                  </div>
                  
                  {/* Remove icon on hover */}
                  {characters.length > 1 && (
                    <button 
                      onClick={(e) => removeCharacter(char.id, e)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white w-3.5 h-3.5 rounded-full text-[7px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-black"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {characters.length < 10 && (
              <button 
                onClick={addCharacter}
                className="w-8 h-8 rounded-full border border-dashed border-[#444] text-gray-500 flex items-center justify-center hover:border-[#d4af37] hover:text-[#d4af37] transition-all ml-2"
                title="Add Party Member"
              >
                <span className="text-lg">+</span>
              </button>
            )}
          </div>
        </div>

        {/* Top-Right: Toolbar / App Navigation */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('toolbox')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'toolbox' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}
          >
            <span>🎲</span> <span className="hidden lg:inline">Toolbox</span>
          </button>
          <button 
            onClick={() => setActiveTab('builder')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'builder' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}
          >
            <span>👤</span> <span className="hidden lg:inline">Builder</span>
          </button>
          <button 
            onClick={() => setActiveTab('spells')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'spells' ? 'bg-[#9b59b6] text-white shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}
          >
            <span>📖</span> <span className="hidden lg:inline">Spells</span>
          </button>
          <button 
            onClick={() => setActiveTab('lore')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'lore' ? 'bg-[#2ecc71] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}
          >
            <span>📜</span> <span className="hidden lg:inline">Lore</span>
          </button>
          <button 
            onClick={() => setActiveTab('artist')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'artist' ? 'bg-[#3498db] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}
          >
            <span>🎨</span> <span className="hidden lg:inline">Artificer</span>
          </button>
          
          <div className="h-8 w-px bg-[#333] mx-2"></div>
          
          <button className="p-2 text-gray-500 hover:text-white transition-colors" title="Settings">
            <span className="text-lg">⚙️</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-7xl mx-auto scrollbar-visible">
        {activeTab === 'toolbox' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                  <button className="w-full bg-[#2a2a2a] hover:bg-[#333] py-2 rounded text-xs font-bold uppercase tracking-widest text-[#e74c3c] border border-[#e74c3c] transition-colors">
                    Generate Level {activeChar.level} Combat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <CharacterBuilder 
              character={activeChar} 
              onUpdate={updateActiveChar} 
              pinnedEntries={pinnedEntries}
              onOpenSheet={() => setSheetModalCharId(activeChar.id)}
            />
          </div>
        )}

        {activeTab === 'spells' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Spellbook 
              character={activeChar} 
              onUpdate={updateActiveChar} 
            />
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header>
              <h2 className="text-3xl font-bold serif text-[#2ecc71]">The Lorekeeper's Sanctorum</h2>
              <p className="text-gray-400 text-sm mt-1">Consult the archives regarding your party's journey.</p>
            </header>
            <LoreKeeper 
              pinnedEntries={pinnedEntries} 
              onUpdatePinnedEntries={setPinnedEntries}
              appendixEntries={appendixEntries}
              onUpdateAppendixEntries={setAppendixEntries}
            />
          </div>
        )}

        {activeTab === 'artist' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header>
              <h2 className="text-3xl font-bold serif text-[#3498db]">The Artificer's Forge</h2>
              <p className="text-gray-400 text-sm mt-1">Visualize {activeChar.name}, foes, and locations.</p>
            </header>
            <AIWorkshop />
          </div>
        )}
      </main>

      {/* Character Sheet Modal Overlay */}
      {sheetChar && (
        <CharacterSheetModal 
          character={sheetChar} 
          onClose={() => setSheetModalCharId(null)} 
        />
      )}
      
      {/* Persistent Roll Component */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none z-40">
        <div className="pointer-events-auto bg-[#d4af37] text-black px-4 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform border-2 border-black/20">
          <span>🎲</span> Quick Roll d20
        </div>
      </div>
    </div>
  );
};

export default App;
