
import React, { useState, useEffect, useCallback } from 'react';
import Oracle from './components/Oracle';
import AIWorkshop from './components/AIWorkshop';
import LoreKeeper from './components/LoreKeeper';
import CharacterBuilder from './components/CharacterBuilder';
import Spellbook from './components/Spellbook';
import CharacterSheetModal from './components/CharacterSheetModal';
import QAFateTable from './components/QAFateTable';
import GameClock from './components/GameClock';
import SpiritGuideLive from './components/SpiritGuideLive';
import { FullCharacter, AppendixEntry, SkillEntry, GameTime } from './types';

export interface PinnedEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

const DEFAULT_STATS = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

const INITIAL_GAME_TIME: GameTime = {
  seconds: 0,
  minutes: 0,
  hours: 8,
  days: 0,
  months: 0,
  years: 124,
  weather: "Clear Skies",
  weatherRoll: 10
};

const INITIAL_SKILLS: SkillEntry[] = [
  { name: 'Acrobatics', rank: 0, ability: 'dex' },
  { name: 'Arcana', rank: 0, ability: 'int' },
  { name: 'Athletics', rank: 0, ability: 'str' },
  { name: 'Crafting', rank: 0, ability: 'int' },
  { name: 'Deception', rank: 0, ability: 'cha' },
  { name: 'Diplomacy', rank: 0, ability: 'cha' },
  { name: 'Intimidation', rank: 0, ability: 'cha' },
  { name: 'Medicine', rank: 0, ability: 'wis' },
  { name: 'Nature', rank: 0, ability: 'wis' },
  { name: 'Occultism', rank: 0, ability: 'int' },
  { name: 'Performance', rank: 0, ability: 'cha' },
  { name: 'Religion', rank: 0, ability: 'wis' },
  { name: 'Society', rank: 0, ability: 'int' },
  { name: 'Stealth', rank: 0, ability: 'dex' },
  { name: 'Survival', rank: 0, ability: 'wis' },
  { name: 'Thievery', rank: 0, ability: 'dex' },
];

const WEATHER_DATA = {
  Spring: [
    { max: 1, label: "Sleet / Blizzard" },
    { max: 4, label: "Rain" },
    { max: 8, label: "Overcast" },
    { max: 11, label: "Clear Skies" },
    { max: 18, label: "Warm" },
    { max: 20, label: "Hot" }
  ],
  Summer: [
    { max: 1, label: "Unseasonably cold" },
    { max: 4, label: "Rainy" },
    { max: 8, label: "Overcast" },
    { max: 11, label: "Clear, Warm" },
    { max: 18, label: "Clear, Hot" },
    { max: 20, label: "Very Hot" }
  ],
  Autumn: [
    { max: 1, label: "Sleet/Blizzard" },
    { max: 4, label: "Rainy" },
    { max: 8, label: "Light rain" },
    { max: 11, label: "Overcast" },
    { max: 18, label: "Clear Skies" },
    { max: 20, label: "Hot" }
  ],
  Winter: [
    { max: 1, label: "Heavy snow" },
    { max: 4, label: "Snowstorm" },
    { max: 8, label: "Rain" },
    { max: 11, label: "Overcast" },
    { max: 18, label: "Clear skies" },
    { max: 20, label: "Unseasonably warm" }
  ]
};

const createNewCharacter = (name: string = "New Hero"): FullCharacter => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  title: "Wandering Martialist",
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
  },
  wealth: {
    qin: 0,
    ling: 0,
    yu: 0,
    tian: 0,
    huang: 0
  },
  skills: [...INITIAL_SKILLS],
  notes: "",
  actions: [],
  heroPoints: 1,
  destinyPoints: 0,
  headerStatus: "",
  sheetLocked: true,
  mainLayout: ['ancestry', 'background', 'class', 'traits', 'stats']
});

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeTab, setActiveTab] = useState<'toolbox' | 'artist' | 'lore' | 'builder' | 'spells'>('toolbox');
  const [characters, setCharacters] = useState<FullCharacter[]>([createNewCharacter("Shan' Zhou")]);
  const [activeCharId, setActiveCharId] = useState<string>(characters[0].id);
  const [pinnedEntries, setPinnedEntries] = useState<PinnedEntry[]>([]);
  const [appendixEntries, setAppendixEntries] = useState<AppendixEntry[]>([]);
  
  // Navigation / Focus State for Lore
  const [loreFocusId, setLoreFocusId] = useState<string | null>(null);

  // Game Time State
  const [gameTime, setGameTime] = useState<GameTime>(INITIAL_GAME_TIME);
  const [isClockRunning, setIsClockRunning] = useState(false);

  // Modal State
  const [sheetModalCharId, setSheetModalCharId] = useState<string | null>(null);

  const activeChar = characters.find(c => c.id === activeCharId) || characters[0];
  const sheetChar = characters.find(c => c.id === sheetModalCharId);

  const getSeason = (monthIndex: number) => {
    if (monthIndex < 3) return 'Spring';
    if (monthIndex < 6) return 'Summer';
    if (monthIndex < 9) return 'Autumn';
    return 'Winter';
  };

  const performWeatherRoll = useCallback((monthIndex: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const season = getSeason(monthIndex);
    const table = WEATHER_DATA[season];
    const outcome = table.find(entry => roll <= entry.max) || table[table.length - 1];
    return { roll, text: outcome.label };
  }, []);

  // Time Logic
  const advanceTime = useCallback((totalSecondsToAdd: number) => {
    setGameTime(prev => {
      let { seconds, minutes, hours, days, months, years, weather, weatherRoll } = prev;
      const oldDays = days;
      
      seconds += totalSecondsToAdd;
      
      if (seconds >= 60) {
        minutes += Math.floor(seconds / 60);
        seconds %= 60;
      }
      if (minutes >= 60) {
        hours += Math.floor(minutes / 60);
        minutes %= 60;
      }
      if (hours >= 24) {
        days += Math.floor(hours / 24);
        hours %= 24;
      }
      if (days >= 30) {
        months += Math.floor(days / 30);
        days %= 30;
      }
      if (months >= 12) {
        years += Math.floor(months / 12);
        months %= 12;
      }

      // Roll weather if a day has passed
      if (days !== oldDays) {
        const result = performWeatherRoll(months);
        weather = result.text;
        weatherRoll = result.roll;
      }

      return { seconds, minutes, hours, days, months, years, weather, weatherRoll };
    });
  }, [performWeatherRoll]);

  useEffect(() => {
    let interval: any;
    if (isClockRunning) {
      interval = setInterval(() => {
        advanceTime(1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockRunning, advanceTime]);

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

  const navigateToLoreEntry = (entryId: string) => {
    setLoreFocusId(entryId);
    setActiveTab('lore');
  };

  // Session Management Functions
  const saveSession = () => {
    const sessionData = {
      version: "1.7",
      timestamp: Date.now(),
      characters,
      pinnedEntries,
      appendixEntries,
      gameTime
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shan-zhou-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          
          if (data.characters && Array.isArray(data.characters)) {
            setCharacters(data.characters);
            if (data.characters.length > 0) {
              setActiveCharId(data.characters[0].id);
            }
          }
          if (data.pinnedEntries && Array.isArray(data.pinnedEntries)) {
            setPinnedEntries(data.pinnedEntries);
          }
          if (data.appendixEntries && Array.isArray(data.appendixEntries)) {
            setAppendixEntries(data.appendixEntries);
          }
          if (data.gameTime) {
            setGameTime(data.gameTime);
          }
          
          alert("Session loaded successfully!");
        } catch (err) {
          console.error("Failed to load session:", err);
          alert("Error loading session file. Ensure it is a valid Shan' Zhou session JSON.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!hasStarted) {
    return <SpiritGuideLive onEnterToolbox={() => setHasStarted(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] animate-in fade-in duration-1000">
      {/* Top Header */}
      <header className="h-20 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-6 sticky top-0 z-[60] shadow-xl">
        {/* Top-Left: Logo & Party Icons */}
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-[#d4af37] rounded-lg flex items-center justify-center text-black font-black text-lg serif shadow-lg flex-shrink-0 cursor-pointer" onClick={() => setHasStarted(false)}>
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
                  <label htmlFor={`upload-${char.id}`} className="absolute -bottom-1 -left-1 bg-black/80 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-[#333] cursor-pointer hover:bg-[#d4af37] hover:text-black" title="Upload Portrait">
                    <span className="text-[10px]">📷</span>
                  </label>
                  <input type="file" id={`upload-${char.id}`} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(char.id, e)} />
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black border border-[#333] px-2 py-1 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-bold uppercase shadow-2xl">
                    {char.name} • Lvl {char.level}
                  </div>
                  {characters.length > 1 && (
                    <button onClick={(e) => removeCharacter(char.id, e)} className="absolute -top-1 -right-1 bg-red-600 text-white w-3.5 h-3.5 rounded-full text-[7px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 border border-black">
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {characters.length < 10 && (
              <button onClick={addCharacter} className="w-8 h-8 rounded-full border border-dashed border-[#444] text-gray-500 flex items-center justify-center hover:border-[#d4af37] hover:text-[#d4af37] transition-all ml-2" title="Add Party Member">
                <span className="text-lg">+</span>
              </button>
            )}
          </div>
        </div>

        {/* Top-Right: Toolbar */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setActiveTab('toolbox')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'toolbox' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}>
            <span>🎲</span> <span className="hidden lg:inline">Toolbox</span>
          </button>
          <button onClick={() => setActiveTab('builder')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'builder' ? 'bg-[#d4af37] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}>
            <span>👤</span> <span className="hidden lg:inline">Builder</span>
          </button>
          <button onClick={() => setActiveTab('spells')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'spells' ? 'bg-[#9b59b6] text-white shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}>
            <span>📖</span> <span className="hidden lg:inline">Spells</span>
          </button>
          <button onClick={() => setActiveTab('lore')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'lore' ? 'bg-[#2ecc71] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}>
            <span>📜</span> <span className="hidden lg:inline">Lore</span>
          </button>
          <button onClick={() => setActiveTab('artist')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tight ${activeTab === 'artist' ? 'bg-[#3498db] text-black shadow-lg' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'}`}>
            <span>🎨</span> <span className="hidden lg:inline">Artificer</span>
          </button>
          <div className="h-8 w-px bg-[#333] mx-2"></div>
          <div className="flex items-center gap-1">
            <button onClick={saveSession} className="p-2 text-gray-500 hover:text-[#d4af37] transition-colors" title="Save Session (Export JSON)">
              <span className="text-lg">💾</span>
            </button>
            <button onClick={loadSession} className="p-2 text-gray-500 hover:text-[#2ecc71] transition-colors" title="Load Session (Import JSON)">
              <span className="text-lg">📁</span>
            </button>
            <button className="p-2 text-gray-500 hover:text-white transition-colors" title="Settings">
              <span className="text-lg">⚙️</span>
            </button>
          </div>
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
              <GameClock time={gameTime} isRunning={isClockRunning} onToggle={() => setIsClockRunning(!isClockRunning)} onAdvance={advanceTime} />
              <Oracle />
              <QAFateTable />
              <div className="bg-[#1e1e1e] border border-[#333] p-4 rounded shadow-lg lg:col-span-2">
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
              appendixEntries={appendixEntries}
              onOpenSheet={() => setSheetModalCharId(activeChar.id)}
              onNavigateToLore={navigateToLoreEntry}
            />
          </div>
        )}

        {activeTab === 'spells' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Spellbook character={activeChar} onUpdate={updateActiveChar} />
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
              characters={characters}
              focusId={loreFocusId}
              onClearFocus={() => setLoreFocusId(null)}
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
        <CharacterSheetModal character={sheetChar} onUpdate={updateActiveChar} onClose={() => setSheetModalCharId(null)} />
      )}
      
      {/* Persistent Roll Component */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none z-40">
        <div className="pointer-events-auto bg-[#d4af37] text-black px-4 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-transform border-2 border-black/20" onClick={() => {
          const roll = Math.floor(Math.random() * 20) + 1;
          alert(`The Heavens reveal: ${roll}`);
        }}>
          <span>🎲</span> Quick Roll d20
        </div>
      </div>
    </div>
  );
};

export default App;
