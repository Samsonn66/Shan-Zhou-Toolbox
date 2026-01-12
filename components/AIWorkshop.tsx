
import React, { useState, useEffect } from 'react';
import { GeminiService, decodeAudioData } from '../services/gemini';
import { ImageSize } from '../types';

interface CollectedVision {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

const STORAGE_KEY = "shan_zhou_visions";
const MAX_COLLECTION_SIZE = 6; // Limit to prevent localStorage quota issues

const AIWorkshop: React.FC = () => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState<ImageSize>(ImageSize.S_1K);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [collection, setCollection] = useState<CollectedVision[]>([]);

  // Load collection from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCollection(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse collection", e);
      }
    }
  }, []);

  // Save collection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  }, [collection]);

  const checkBillingAndGenerate = async () => {
    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      
      setLoading(true);
      setStatusMsg("Manifesting your vision through the Ether...");
      const url = await GeminiService.generateImage(imagePrompt, selectedSize);
      setGeneratedImg(url);
      setStatusMsg("");
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        setStatusMsg("Failed to generate image. Please check API settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!generatedImg) return;
    setLoading(true);
    setStatusMsg("Weaving the threads of reality...");
    try {
      const editedUrl = await GeminiService.editImage(generatedImg, editPrompt);
      setGeneratedImg(editedUrl);
      setEditPrompt("");
      setIsEditing(false);
      setStatusMsg("");
    } catch (error) {
      console.error(error);
      setStatusMsg("Edit failed. Please try a different prompt.");
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = async () => {
    if (!imagePrompt) return;
    try {
      const audioBytes = await GeminiService.speak(imagePrompt);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (error) {
      console.error("Audio failed", error);
    }
  };

  const saveToCollection = () => {
    if (!generatedImg) return;
    const newVision: CollectedVision = {
      id: Math.random().toString(36).substr(2, 9),
      url: generatedImg,
      prompt: imagePrompt || editPrompt || "Unnamed Vision",
      timestamp: Date.now()
    };

    setCollection(prev => {
      const updated = [newVision, ...prev];
      if (updated.length > MAX_COLLECTION_SIZE) {
        return updated.slice(0, MAX_COLLECTION_SIZE);
      }
      return updated;
    });
    setStatusMsg("Vision bound to your permanent collection.");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const removeFromCollection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollection(prev => prev.filter(v => v.id !== id));
  };

  const loadFromCollection = (vision: CollectedVision) => {
    setGeneratedImg(vision.url);
    setImagePrompt(vision.prompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded shadow-lg space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#3498db] serif flex items-center gap-2">
            <span>🎨</span> Artificer's Workshop
          </h3>
          <p className="text-xs text-gray-400 mb-4 italic">Create characters, landscapes, or magical items for Shan' Zhou.</p>
          
          <div className="space-y-4">
            <textarea
              className="w-full bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#3498db] min-h-[100px] transition-colors leading-relaxed"
              placeholder="Describe your vision (e.g., 'A Renmin Monk meditating under a peach tree with jade leaves')"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-[#333]">
                  {[ImageSize.S_1K, ImageSize.S_2K, ImageSize.S_4K].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter transition-all ${
                        selectedSize === size ? 'bg-[#3498db] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleTTS}
                  disabled={loading || !imagePrompt}
                  className="bg-[#2a2a2a] hover:bg-[#333] text-[#3498db] border border-[#3498db33] font-bold py-2 px-4 rounded text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  🔊 Speak
                </button>
              </div>

              <button
                onClick={checkBillingAndGenerate}
                disabled={loading || !imagePrompt}
                className="bg-[#3498db] hover:bg-[#2980b9] text-white font-black py-2.5 px-8 rounded text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Manifesting...' : 'Manifest Vision'}
              </button>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-[#121212] p-4 border border-[#333] rounded text-center animate-in fade-in duration-300">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3498db]">{statusMsg}</p>
          </div>
        )}

        {generatedImg && (
          <div className="border border-[#333] p-2 rounded bg-[#121212] relative animate-in zoom-in-95 duration-500">
            <img src={generatedImg} alt="Generated" className="w-full rounded shadow-2xl" />
            
            <div className="mt-4 p-4 border-t border-[#333] flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                {!isEditing ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[10px] font-black uppercase py-3 rounded tracking-widest transition-all border border-[#444]"
                    >
                      Refine with Magic
                    </button>
                    <button 
                      onClick={saveToCollection}
                      className="flex-1 bg-[#2ecc7122] hover:bg-[#2ecc7133] text-[#2ecc71] text-[10px] font-black uppercase py-3 rounded tracking-widest transition-all border border-[#2ecc7144]"
                    >
                      Save to Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                    <input 
                      type="text"
                      placeholder="What should change? (e.g., 'Make the moon brighter', 'Add a dragon')"
                      className="w-full bg-[#1e1e1e] border border-[#444] p-3 rounded text-sm focus:outline-none focus:border-[#3498db] transition-colors"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleEdit}
                        className="flex-1 bg-[#3498db] text-white py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-lg"
                        disabled={loading || !editPrompt}
                      >
                        Apply Threads
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="px-6 bg-[#2a2a2a] py-2 rounded text-[10px] font-black uppercase tracking-widest text-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Collection Gallery */}
      <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-[#333] pb-4">
          <h3 className="text-lg font-bold text-gray-300 serif flex items-center gap-2">
            <span>🏺</span> Collection of Visions
          </h3>
          <span className="text-[9px] font-black uppercase text-gray-600 bg-black/40 px-2 py-1 rounded">
            {collection.length} / {MAX_COLLECTION_SIZE} Slots Filled
          </span>
        </div>

        {collection.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center opacity-30 grayscale pointer-events-none">
            <span className="text-4xl mb-2">🖼️</span>
            <p className="text-[10px] font-bold uppercase tracking-widest">No visions bound to the archive yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {collection.map(vision => (
              <div 
                key={vision.id} 
                onClick={() => loadFromCollection(vision)}
                className="group relative aspect-square bg-black rounded border border-[#333] overflow-hidden cursor-pointer hover:border-[#3498db] transition-all"
              >
                <img src={vision.url} alt={vision.prompt} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-[8px] font-bold text-white uppercase line-clamp-2 mb-2 leading-tight">
                    {vision.prompt}
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-[8px] font-black uppercase py-1 rounded backdrop-blur-sm transition-colors">
                      View
                    </button>
                    <button 
                      onClick={(e) => removeFromCollection(vision.id, e)}
                      className="bg-red-900/40 hover:bg-red-900/60 text-red-200 px-2 py-1 rounded transition-colors"
                      title="Shatter Vision"
                    >
                      <span className="text-[10px]">✕</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {collection.length > 0 && (
          <p className="text-[8px] text-center text-gray-600 font-bold uppercase tracking-widest">
            Visions are stored in your local memory (localStorage). Clearing browser data will lose them.
          </p>
        )}
      </div>
    </div>
  );
};

export default AIWorkshop;
