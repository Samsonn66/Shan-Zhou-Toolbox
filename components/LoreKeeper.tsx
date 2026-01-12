
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { PinnedEntry } from '../App';
import { AppendixEntry, FullCharacter } from '../types';
import ObsidianSync from './ObsidianSync';

const LORE_CATEGORIES = [
  'Ancestry', 'Background', 'Class', 'Feats', 'Lore', 'Places', 'People', 'Factions', 'Government'
] as const;

type LoreCategory = typeof LORE_CATEGORIES[number];

const RENMIN_LORE = `Renmin Ancestry (The Common Folk)
Traits: Humanoid, Renmin

The Renmin are the core population of the Shan’ Zhou empire. They are defined by their hard work, communal bonds, and a spirit that has weathered a thousand years of shifting dynasties.

Hit Points: 8
Size: Medium
Speed: 25 feet
Ability Boosts: Two Free
Languages: Common, Regional Dialect

Special: Adaptable Resilience
Renmin gain a +1 circumstance bonus to saving throws against effects that would cause them to become fatigued or sickened.

Heritages:
- Scholar-Official: You have studied for the imperial exams. You gain the Trained proficiency in Society and a Lore skill related to your studies.
- Iron-Skin Labourer: Years of toil have hardened you. You gain the Toughness general feat.
- Jade-Blessed Noble: You carry the lineage of a minor house. You start with 5gp extra and gain a +1 circumstance bonus to Diplomacy checks to Request.`;

const GOVERNMENT_LORE_ENTRIES: Omit<AppendixEntry, 'timestamp'>[] = [
  {
    id: "gov-core-001",
    title: "Structure: The Celestial-Mandate Empire",
    category: 'Government',
    content: `Maxim: “The Celestial Mandate flows downward; duty returns upward.”

Shan’ Zhou is ruled by a Mandated Emperor, the intermediary between the Mortal Realm, Spirit Courts, and Ancestral Heavens.

The Mandate of Balance:
The Emperor must maintain harmony between:
1. Humans (Civil governance)
2. Spirits (Supernatural legitimacy)
3. Martial Orders (Military and cultivation authority)

The Imperial Capital: Baoshi (Seat of the Emperor and the Six Ministries).
Provincial Capitals: Jingxian (Northwest), Luoyan (Northeast), Yun’An (West), Xiangdu (Southwest).`
  },
  {
    id: "gov-ministries-002",
    title: "The Six Ministries of Baoshi",
    category: 'Government',
    content: `1. Ministry of Heaven & Rituals: Oversees omens, celestial calendars, and communicates with Spirit Courts. Verifies the Mandate stability.
2. Ministry of Records: Population rolls, census, Civil Service Exams, and censorship. Often infiltrated by spy-sects.
3. Ministry of War & Cultivation: National military, garrisons, Martial Sect Licensure, Monster-Hunting Mandates, and official Martial Academies.
4. Ministry of Justice: Court system, exile, executions. Hosts Shadow Magistrates for supernatural crimes.
5. Ministry of Works: Infrastructure (roads, irrigation, city walls). Contracts to engineering clans and artificer guilds.
6. Ministry of Revenue: Manages grain taxes, mountain-spirit tribute, jade reserves, and Salt & Iron Monopolies.`
  },
  {
    id: "gov-provincial-003",
    title: "Provincial Government & Nine Protectorates",
    category: 'Government',
    content: `The Empire is divided into provinces, including Nine Protectorates ruled by Governor-Protectors (Jiedushi) with high military autonomy.

Official Structures:
A. Administrative Provinces: Standard Imperial model (Governor + magistrates).
B. Dual-Authority Provinces: Shared power with a major sect or noble house (e.g., Xiangdu).
C. Spirit-First Provinces: Spirit Court acts as the primary ruler (common in jungles/mountains).
D. Militarized Provinces: Warlords or Legions dominate (e.g., Western Marches).

Local Authority:
- Provincial Governor (Cishi): Imperial appointee, commands local armies.
- District Magistrate (Zhixian): Directly administers towns and minor criminal cases.
- County Magistrate: The "face of the Empire," handling local law and spirit negotiations.`
  },
  {
    id: "gov-justice-004",
    title: "Judicial System & Shadow Magistrates",
    category: 'Government',
    content: `Jurisdiction is split across four primary courts:
1. The Imperial Court: Treason, taxes, crimes against the state, forbidden cultivation.
2. The Provincial Court: Land disputes, trade conflicts, clan issues.
3. The Sect Court: Crimes involving cultivators, duels, martial misconduct.
4. The Spirit Court: Omen violations, spiritual pollution, breaking spirit pacts.

Shadow Magistrates:
Elite investigators often trained by hidden sects. They handle ghost crimes, demon sorcery, cult infiltration, and spirit-human treaty breaches.`
  },
  {
    id: "gov-military-005",
    title: "Imperial Military & Guardian Constructs",
    category: 'Government',
    content: `The Empire maintains its peace through three tiers of force:

1. Imperial Standing Army: Infantry, Shield formations, Archer corps, and Talon Riders (light cavalry).
2. Cultivator Battalions: Elite combat units like the Fire Lotus Brigade, Iron-Body Vanguard, and Cloudstride Scouts.
3. Guardian Constructs: Created by artificer clans. Includes Clockwork soldiers, Spirit-jade automatons, and Flying siege engines.`
  }
];

interface Props {
  pinnedEntries: PinnedEntry[];
  onUpdatePinnedEntries: (entries: PinnedEntry[]) => void;
  appendixEntries: AppendixEntry[];
  onUpdateAppendixEntries: (entries: AppendixEntry[]) => void;
  characters: FullCharacter[];
  focusId?: string | null;
  onClearFocus?: () => void;
}

const LoreKeeper: React.FC<Props> = ({ 
  pinnedEntries, 
  onUpdatePinnedEntries, 
  appendixEntries, 
  onUpdateAppendixEntries,
  characters,
  focusId,
  onClearFocus
}) => {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, type: 'fast' | 'think' }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'pinned' | 'appendix' | 'vault'>('pinned');
  const [vaultHandle, setVaultHandle] = useState<FileSystemDirectoryHandle | null>(null);
  
  // Appendix State
  const [selectedCategory, setSelectedCategory] = useState<LoreCategory | 'All'>('All');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<LoreCategory>('Lore');

  // Sync Lore on mount
  useEffect(() => {
    let updated = false;
    let entries = [...appendixEntries];

    // Add Renmin Lore
    const renminId = "renmin-archive-001";
    if (!entries.find(e => e.id === renminId)) {
      entries.unshift({
        id: renminId,
        title: "Renmin Ancestry Details",
        content: RENMIN_LORE,
        category: 'Ancestry',
        timestamp: Date.now()
      });
      updated = true;
    }

    // Add Government Lore
    GOVERNMENT_LORE_ENTRIES.forEach(govEntry => {
      if (!entries.find(e => e.id === govEntry.id)) {
        entries.unshift({
          ...govEntry,
          timestamp: Date.now()
        } as AppendixEntry);
        updated = true;
      }
    });

    if (updated) {
      onUpdateAppendixEntries(entries);
    }
  }, []);

  // Effect to handle navigation from other tabs
  useEffect(() => {
    if (focusId) {
      const entry = appendixEntries.find(e => e.id === focusId);
      if (entry) {
        setSidebarTab('appendix');
        setSelectedCategory('All');
        setShowSidebar(true);
      }
    }
  }, [focusId, appendixEntries]);

  const handleSend = async (mode: 'fast' | 'think') => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg, type: mode }]);
    setChatInput("");
    setIsThinking(true);

    try {
      const contextLore = appendixEntries
        .slice(0, 15) 
        .map(e => `[Category: ${e.category}] ${e.title}: ${e.content.substring(0, 200)}...`)
        .join('\n');

      const systemInstruction = `You are a PF2e Lorekeeper for the world of Shan' Zhou.
      Here is some existing world lore you should be aware of:
      ${contextLore}
      
      Always respect this existing lore when answering. If asked to design new things, stay within the wuxia-inspired PF2e framework.`;

      let res = "";
      if (mode === 'fast') {
        res = await GeminiService.getQuickResponse(`${systemInstruction}\n\nUser Question: ${userMsg}`);
      } else {
        res = await GeminiService.getThinkerResponse(`${systemInstruction}\n\nUse deep reasoning to solve this complex solo RPG dilemma or help design custom mechanics. Question: ${userMsg}`);
      }
      setMessages(prev => [...prev, { role: 'ai', text: res, type: mode }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "The archives are currently inaccessible...", type: mode }]);
    } finally {
      setIsThinking(false);
    }
  };

  const pinEntry = (text: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const firstLine = text.split('\n')[0].replace(/[#*]/g, '').trim();
    const title = firstLine.length > 30 ? firstLine.substring(0, 30) + "..." : firstLine || "Unnamed Archive";
    
    const newEntry: PinnedEntry = {
      id,
      title,
      content: text,
      timestamp: Date.now()
    };
    onUpdatePinnedEntries([newEntry, ...pinnedEntries]);
  };

  const unpinEntry = (id: string) => {
    onUpdatePinnedEntries(pinnedEntries.filter(e => e.id !== id));
  };

  // Appendix Actions
  const startNewAppendixEntry = (category?: LoreCategory) => {
    setEditingEntryId("new");
    setEditTitle("");
    setEditContent("");
    setEditCategory(category || 'Lore');
    setSidebarTab('appendix');
  };

  const startEditAppendixEntry = (entry: AppendixEntry) => {
    setEditingEntryId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditCategory(entry.category);
  };

  const saveAppendixEntry = () => {
    if (!editTitle.trim()) return;

    if (editingEntryId === "new") {
      const newEntry: AppendixEntry = {
        id: Math.random().toString(36).substr(2, 9),
        title: editTitle,
        content: editContent,
        category: editCategory,
        timestamp: Date.now()
      };
      onUpdateAppendixEntries([newEntry, ...appendixEntries]);
    } else {
      onUpdateAppendixEntries(appendixEntries.map(e => 
        e.id === editingEntryId 
          ? { ...e, title: editTitle, content: editContent, category: editCategory, timestamp: Date.now() } 
          : e
      ));
    }
    setEditingEntryId(null);
  };

  const deleteAppendixEntry = (id: string) => {
    onUpdateAppendixEntries(appendixEntries.filter(e => e.id !== id));
  };

  const filteredAppendix = appendixEntries.filter(e => 
    selectedCategory === 'All' || e.category === selectedCategory
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
      {/* Main Chat Area */}
      <div className="flex-1 bg-[#1e1e1e] border border-[#333] rounded shadow-lg overflow-hidden flex flex-col">
        <div className="bg-[#2a2a2a] p-4 border-b border-[#333] flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#2ecc71] serif flex items-center gap-2">
              <span>📜</span> Lorekeeper's Archive
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">AI World-Aware Assistant</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => startNewAppendixEntry()}
              className="text-[10px] font-bold uppercase px-3 py-1 rounded border border-[#2ecc7133] text-[#2ecc71] hover:bg-[#2ecc7111] transition-colors"
            >
              + Quick Note
            </button>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className={`text-[10px] font-bold uppercase px-3 py-1 rounded border transition-all ${showSidebar ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
            >
              {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#161616] scrollbar-visible">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-2">
              <span className="text-4xl">🦉</span>
              <p className="text-sm italic">The Lorekeeper has read your Appendix and is ready to assist...</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm group relative ${
                m.role === 'user' 
                  ? 'bg-[#2ecc71] text-black font-medium shadow-md' 
                  : 'bg-[#2a2a2a] border border-[#333] text-gray-200'
              }`}>
                {m.role === 'ai' && (
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] uppercase font-bold px-1 rounded ${m.type === 'think' ? 'bg-purple-900 text-purple-200' : 'bg-gray-700 text-gray-300'}`}>
                      {m.type === 'think' ? 'Reasoning' : 'Flash'}
                    </span>
                    <button 
                      onClick={() => pinEntry(m.text)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-[#d4af37] flex items-center gap-1 hover:underline transition-all"
                    >
                      <span>📌</span> PIN
                    </button>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-[#2a2a2a] p-3 rounded-lg flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-[#2ecc71] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#2ecc71] rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#2ecc71] rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Consulting World Records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-[#121212] border-t border-[#333]">
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              className="w-full bg-[#1e1e1e] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#2ecc71] transition-colors"
              placeholder="The AI now references your Appendix entries below!"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend('fast')}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => handleSend('fast')}
                disabled={isThinking || !chatInput}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#2ecc71] font-bold py-2 rounded text-xs border border-[#2ecc71] transition-all disabled:opacity-50"
              >
                Fast Assist
              </button>
              <button 
                onClick={() => handleSend('think')}
                disabled={isThinking || !chatInput}
                className="flex-1 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 rounded text-xs transition-all shadow-lg disabled:opacity-50"
              >
                Deep Reasoning
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Archives & Appendix */}
      {showSidebar && (
        <div className="w-full lg:w-96 bg-[#1e1e1e] border border-[#333] rounded shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-300">
          <div className="flex bg-[#121212] border-b border-[#333] shrink-0">
            <button 
              onClick={() => setSidebarTab('pinned')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'pinned' ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af370a]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Pins
            </button>
            <button 
              onClick={() => setSidebarTab('appendix')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'appendix' ? 'text-[#2ecc71] border-b-2 border-[#2ecc71] bg-[#2ecc710a]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Appendix
            </button>
            <button 
              onClick={() => setSidebarTab('vault')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'vault' ? 'text-[#9b59b6] border-b-2 border-[#9b59b6] bg-[#9b59b60a]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Vault
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212] scrollbar-visible">
            {sidebarTab === 'pinned' && (
              pinnedEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                  <span className="text-3xl mb-2">🏺</span>
                  <p className="text-[10px] font-bold uppercase tracking-tighter leading-tight">Pinned AI responses appear here.</p>
                </div>
              ) : (
                pinnedEntries.map(entry => (
                  <div key={entry.id} className="p-3 bg-[#1e1e1e] border border-[#333] rounded-sm shadow-inner group relative">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-[11px] font-black uppercase text-[#d4af37] tracking-tight pr-4 line-clamp-1">
                        {entry.title}
                      </h5>
                      <button 
                        onClick={() => unpinEntry(entry.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 text-[10px] hover:text-red-400 p-0.5 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-[10px] text-gray-400 line-clamp-3 hover:line-clamp-none transition-all cursor-default leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </div>
                  </div>
                ))
              )
            )}

            {sidebarTab === 'vault' && (
              <ObsidianSync 
                appendixEntries={appendixEntries} 
                characters={characters} 
                vaultHandle={vaultHandle}
                onVaultConnected={setVaultHandle}
              />
            )}

            {sidebarTab === 'appendix' && (
              /* Appendix Tab Content */
              <div className="space-y-4">
                {editingEntryId ? (
                  <div className="bg-[#1a1a1a] border border-[#2ecc71] p-3 rounded-sm animate-in fade-in duration-200">
                    <div className="mb-4">
                      <label className="text-[8px] font-black text-[#2ecc71] uppercase block mb-1">Category</label>
                      <select 
                        className="w-full bg-black border border-[#333] text-[10px] font-bold text-gray-300 p-2 rounded focus:outline-none focus:border-[#2ecc71]"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as LoreCategory)}
                      >
                        {LORE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <input 
                      type="text"
                      className="w-full bg-black border border-[#333] p-2 text-xs font-bold text-[#2ecc71] mb-2 focus:outline-none focus:border-[#2ecc71]"
                      placeholder="ENTRY TITLE..."
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <textarea 
                      className="w-full bg-black border border-[#333] p-2 text-[10px] text-gray-300 min-h-[200px] resize-none focus:outline-none focus:border-[#2ecc71]"
                      placeholder="Enter details..."
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={saveAppendixEntry} className="flex-1 bg-[#2ecc71] text-black text-[10px] font-black uppercase py-2 rounded shadow-lg hover:bg-[#27ae60] transition-colors">Save</button>
                      <button onClick={() => setEditingEntryId(null)} className="px-3 border border-[#333] text-gray-500 text-[10px] font-black uppercase rounded hover:bg-[#222]">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1 pb-4 border-b border-[#222]">
                      <button 
                        onClick={() => setSelectedCategory('All')}
                        className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter border transition-all ${selectedCategory === 'All' ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'border-[#333] text-gray-500 hover:border-gray-400'}`}
                      >
                        All
                      </button>
                      {LORE_CATEGORIES.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter border transition-all ${selectedCategory === cat ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'border-[#333] text-gray-500 hover:border-gray-400'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => startNewAppendixEntry(selectedCategory !== 'All' ? selectedCategory : 'Lore')}
                      className="w-full border-2 border-dashed border-[#333] p-6 text-center rounded hover:border-[#2ecc7133] hover:bg-[#2ecc7105] transition-all group"
                    >
                      <span className="text-xl text-gray-600 group-hover:text-[#2ecc71] transition-colors">+</span>
                      <p className="text-[10px] font-bold uppercase text-gray-600 group-hover:text-[#2ecc71] mt-1 transition-colors">
                        Create {selectedCategory !== 'All' ? selectedCategory : 'Lore'} Entry
                      </p>
                    </button>

                    {filteredAppendix.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 px-6">
                        <span className="text-3xl mb-2">📓</span>
                        <p className="text-[10px] font-bold uppercase tracking-tighter leading-tight">No entries in this category.</p>
                      </div>
                    ) : (
                      filteredAppendix.map(entry => (
                        <div 
                          key={entry.id} 
                          id={`appendix-${entry.id}`}
                          className={`p-3 border rounded-sm shadow-inner group relative transition-all duration-500 ${
                            focusId === entry.id 
                            ? 'bg-[#2ecc7111] border-[#2ecc71] ring-2 ring-[#2ecc7133] ring-offset-2 ring-offset-[#121212] scale-[1.02]' 
                            : 'bg-[#1e1e1e] border-[#333]'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{entry.category}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEditAppendixEntry(entry)}
                                className="text-[#2ecc71] text-[10px] font-black hover:underline"
                              >
                                EDIT
                              </button>
                              <button 
                                onClick={() => deleteAppendixEntry(entry.id)}
                                className="text-red-500 text-[10px] font-black hover:underline"
                              >
                                DEL
                              </button>
                            </div>
                          </div>
                          <h5 className="text-[11px] font-black uppercase text-[#2ecc71] tracking-tight pr-4 line-clamp-1 mb-2">
                            {entry.title}
                          </h5>
                          <div className="text-[10px] text-gray-400 line-clamp-3 hover:line-clamp-none transition-all cursor-default leading-relaxed whitespace-pre-wrap border-t border-[#333] pt-2">
                            {entry.content}
                          </div>
                          <div className="mt-2 text-[8px] text-gray-700 font-bold uppercase flex justify-between items-center">
                            <span>UPDATED: {new Date(entry.timestamp).toLocaleDateString()}</span>
                            {focusId === entry.id && (
                              <button onClick={onClearFocus} className="text-gray-500 hover:text-white">✕</button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoreKeeper;
