
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';

interface PinnedEntry {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

const LoreKeeper: React.FC = () => {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, type: 'fast' | 'think' }[]>([]);
  const [pinnedEntries, setPinnedEntries] = useState<PinnedEntry[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [showArchives, setShowArchives] = useState(true);

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
    // Try to extract a title from the first line or first 20 chars
    const firstLine = text.split('\n')[0].replace(/[#*]/g, '').trim();
    const title = firstLine.length > 30 ? firstLine.substring(0, 30) + "..." : firstLine || "Unnamed Archive";
    
    const newEntry: PinnedEntry = {
      id,
      title,
      content: text,
      timestamp: Date.now()
    };
    setPinnedEntries(prev => [newEntry, ...prev]);
  };

  const unpinEntry = (id: string) => {
    setPinnedEntries(prev => prev.filter(e => e.id !== id));
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
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">Assistant for Custom Ancestries & Rules</p>
          </div>
          <button 
            onClick={() => setShowArchives(!showArchives)}
            className={`text-[10px] font-bold uppercase px-3 py-1 rounded border transition-all ${showArchives ? 'bg-[#2ecc71] text-black border-[#2ecc71]' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
          >
            {showArchives ? 'Hide Archives' : 'Show Archives'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#161616]">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 space-y-2">
              <span className="text-4xl">🦉</span>
              <p className="text-sm">Speak to the Lorekeeper about rules or custom creations.</p>
              <p className="text-[10px] uppercase font-bold text-center max-w-xs">Tip: Ask "Help me design a custom Ancestry for a half-dragon" then pin the result.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm group relative ${
                m.role === 'user' 
                  ? 'bg-[#2ecc71] text-black font-medium' 
                  : 'bg-[#2a2a2a] border border-[#333] text-gray-200'
              }`}>
                {m.role === 'ai' && (
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] uppercase font-bold px-1 rounded ${m.type === 'think' ? 'bg-purple-900 text-purple-200' : 'bg-gray-700 text-gray-300'}`}>
                      {m.type === 'think' ? 'Deep Think' : 'Flash'}
                    </span>
                    <button 
                      onClick={() => pinEntry(m.text)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-[#d4af37] flex items-center gap-1 hover:underline transition-all"
                    >
                      <span>📌</span> PIN AS CUSTOM LORE
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
                <span className="text-[10px] text-gray-500 font-bold uppercase">Consulting Archives...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#121212] border-t border-[#333]">
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              className="w-full bg-[#1e1e1e] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#2ecc71]"
              placeholder="Design an ancestry, clarify rules, or build lore..."
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
                className="flex-1 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 rounded text-xs transition-all disabled:opacity-50"
              >
                Deep Reasoning (Lore Craft)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Archives Sidebar */}
      {showArchives && (
        <div className="w-full lg:w-80 bg-[#1e1e1e] border border-[#d4af3733] rounded shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-300">
          <div className="bg-[#121212] p-4 border-b border-[#333] flex items-center gap-2">
            <span className="text-[#d4af37]">📌</span>
            <h4 className="text-sm font-black uppercase text-[#d4af37] tracking-widest">Custom Archives</h4>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#121212]">
            {pinnedEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
                <span className="text-3xl mb-2">🏺</span>
                <p className="text-[10px] font-bold uppercase tracking-tighter leading-tight">Your custom lore and ancestries will appear here when pinned.</p>
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
                  <div className="mt-2 text-[8px] text-gray-600 font-bold uppercase">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoreKeeper;
