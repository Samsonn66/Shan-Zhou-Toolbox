
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { PinnedEntry } from '../App';
import { AppendixEntry } from '../types';

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

interface Props {
  pinnedEntries: PinnedEntry[];
  onUpdatePinnedEntries: (entries: PinnedEntry[]) => void;
  appendixEntries: AppendixEntry[];
  onUpdateAppendixEntries: (entries: AppendixEntry[]) => void;
}

const LoreKeeper: React.FC<Props> = ({ 
  pinnedEntries, 
  onUpdatePinnedEntries, 
  appendixEntries, 
  onUpdateAppendixEntries 
}) => {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, type: 'fast' | 'think' }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'pinned' | 'appendix'>('pinned');
  
  // Appendix Editing State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Sync Renmin Lore on mount if not present
  useEffect(() => {
    const renminId = "renmin-archive-001";
    if (!pinnedEntries.find(e => e.id === renminId)) {
      const newEntry: PinnedEntry = {
        id: renminId,
        title: "PULLED: Renmin Ancestry Details",
        content: RENMIN_LORE,
        timestamp: Date.now()
      };
      onUpdatePinnedEntries([newEntry, ...pinnedEntries]);
    }
  }, []);

  const handleSend = async (mode: 'fast' | 'think') => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg, type: mode }]);
    setChatInput("");
    setIsThinking(true);

    try {
      let res = "";
      if (mode === 'fast') {
        res = await GeminiService.getQuickResponse(userMsg);
      } else {
        res = await GeminiService.getThinkerResponse(`You are a PF2e Lorekeeper. Use deep reasoning to solve this complex solo RPG dilemma or help design custom mechanics like ancestries. Question: ${userMsg}`);
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
  const startNewAppendixEntry = () => {
    setEditingEntryId("new");
    setEditTitle("");
    setEditContent("");
    setSidebarTab('appendix');
  };

  const startEditAppendixEntry = (entry: AppendixEntry) => {
    setEditingEntryId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  };

  const saveAppendixEntry = () => {
    if (!editTitle.trim()) return;

    if (editingEntryId === "new") {
      const newEntry: AppendixEntry = {
        id: Math.random().toString(36).substr(2, 9),
        title: editTitle,
        content: editContent,
        timestamp: Date.now()
      };
      onUpdateAppendixEntries([newEntry, ...appendixEntries]);
    } else {
      onUpdateAppendixEntries(appendixEntries.map(e => 
        e.id === editingEntryId 
          ? { ...e, title: editTitle, content: editContent, timestamp: Date.now() } 
          : e
      ));
    }
    setEditingEntryId(null);
  };

  const deleteAppendixEntry = (id: string) => {
    onUpdateAppendixEntries(appendixEntries.filter(e => e.id !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[700px]">
      {/* Main Chat Area */}
      <div className="flex-1 bg-[#1e1e1e] border border-[#333] rounded shadow-lg overflow-hidden flex flex-col">
        <div className="bg-[#2a2a2a] p-4 border-b border-[#333] flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#2ecc71] serif flex items-center gap-2">
              <span>📜</span> Lorekeeper's Archive
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">AI Assistant & World Records</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={startNewAppendixEntry}
              className="text-[10px] font-bold uppercase px-3 py-1 rounded border border-[#2ecc7133] text-[#2ecc71] hover:bg-[#2ecc7111] transition-colors"
            >
              + New Note
            </button>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className={`text-[10px] font-bold uppercase px-3 py-1 rounded border transition-all ${showSidebar ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
            >
              {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
            </button>
          </div>
        </div>

        {/* Chat Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#161616] scrollbar-visible">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-2">
              <span className="text-4xl">🦉</span>
              <p className="text-sm italic">The Lorekeeper awaits your questions...</p>
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
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Consulting Archives...</span>
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
              placeholder="Ask about rules, design ancestries, or clarify lore..."
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

      {/* Sidebar - Archives & Appendix - Scrollable */}
      {showSidebar && (
        <div className="w-full lg:w-80 bg-[#1e1e1e] border border-[#333] rounded shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-300">
          <div className="flex bg-[#121212] border-b border-[#333]">
            <button 
              onClick={() => setSidebarTab('pinned')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'pinned' ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af370a]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Archives
            </button>
            <button 
              onClick={() => setSidebarTab('appendix')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'appendix' ? 'text-[#2ecc71] border-b-2 border-[#2ecc71] bg-[#2ecc710a]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Appendix
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212] scrollbar-visible">
            {sidebarTab === 'pinned' ? (
              pinnedEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                  <span className="text-3xl mb-2">🏺</span>
                  <p className="text-[10px] font-bold uppercase tracking-tighter leading-tight">Your pinned AI responses will appear here.</p>
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
            ) : (
              /* Appendix Tab Content */
              <div className="space-y-4">
                {editingEntryId ? (
                  <div className="bg-[#1a1a1a] border border-[#2ecc71] p-3 rounded-sm animate-in fade-in duration-200">
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
                      placeholder="Enter custom lore, NPC stats, or mechanical notes..."
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
                    <button 
                      onClick={startNewAppendixEntry}
                      className="w-full border-2 border-dashed border-[#333] p-6 text-center rounded hover:border-[#2ecc7133] hover:bg-[#2ecc7105] transition-all group"
                    >
                      <span className="text-xl text-gray-600 group-hover:text-[#2ecc71] transition-colors">+</span>
                      <p className="text-[10px] font-bold uppercase text-gray-600 group-hover:text-[#2ecc71] mt-1 transition-colors">Create Manual Entry</p>
                    </button>

                    {appendixEntries.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 px-6">
                        <span className="text-3xl mb-2">📓</span>
                        <p className="text-[10px] font-bold uppercase tracking-tighter leading-tight">Your manual world records will be archived here.</p>
                      </div>
                    ) : (
                      appendixEntries.map(entry => (
                        <div key={entry.id} className="p-3 bg-[#1e1e1e] border border-[#333] rounded-sm shadow-inner group relative">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-[11px] font-black uppercase text-[#2ecc71] tracking-tight pr-4 line-clamp-1">
                              {entry.title}
                            </h5>
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
                          <div className="text-[10px] text-gray-400 line-clamp-3 hover:line-clamp-none transition-all cursor-default leading-relaxed whitespace-pre-wrap border-t border-[#333] pt-2 mt-2">
                            {entry.content}
                          </div>
                          <div className="mt-2 text-[8px] text-gray-700 font-bold uppercase">
                            LAST UPDATED: {new Date(entry.timestamp).toLocaleDateString()}
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
