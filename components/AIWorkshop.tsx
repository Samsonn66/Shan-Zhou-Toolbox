
import React, { useState } from 'react';
import { GeminiService, decodeAudioData } from '../services/gemini';
import { ImageSize } from '../types';

const AIWorkshop: React.FC = () => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [selectedSize, setSelectedSize] = useState<ImageSize>(ImageSize.S_1K);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

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

  return (
    <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded shadow-lg space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4 text-[#3498db] serif flex items-center gap-2">
          <span>🎨</span> Artificer's Workshop
        </h3>
        <p className="text-xs text-gray-400 mb-4 italic">Create characters, landscapes, or magical items.</p>
        
        <div className="space-y-4">
          <textarea
            className="w-full bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#3498db] min-h-[100px]"
            placeholder="Describe your vision (e.g., 'A Human Fighter in plate armor wielding a glowing sun blade, dramatic lighting')"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {[ImageSize.S_1K, ImageSize.S_2K, ImageSize.S_4K].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    selectedSize === size ? 'bg-[#3498db] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              onClick={checkBillingAndGenerate}
              disabled={loading || !imagePrompt}
              className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold py-2 px-6 rounded transition-colors disabled:opacity-50"
            >
              Generate Image
            </button>

            <button
              onClick={handleTTS}
              disabled={loading || !imagePrompt}
              className="bg-[#2a2a2a] hover:bg-[#333] text-[#3498db] border border-[#3498db] font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              🔊 Read Prompt
            </button>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-[#121212] p-4 border border-[#333] rounded text-center animate-pulse">
          <p className="text-sm text-[#3498db]">{statusMsg}</p>
        </div>
      )}

      {generatedImg && (
        <div className="border border-[#333] p-2 rounded bg-[#121212] relative group">
          <img src={generatedImg} alt="Generated" className="w-full rounded shadow-2xl" />
          
          <div className="mt-4 p-4 border-t border-[#333]">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full bg-[#2a2a2a] hover:bg-[#333] text-sm py-2 rounded font-semibold transition-colors"
              >
                Modify Image (Magic Edit)
              </button>
            ) : (
              <div className="space-y-3">
                <input 
                  type="text"
                  placeholder="What should change? (e.g., 'Add a background of a tavern', 'Make armor gold')"
                  className="w-full bg-[#1e1e1e] border border-[#444] p-2 rounded text-sm focus:outline-none focus:border-[#3498db]"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleEdit}
                    className="flex-1 bg-[#3498db] text-white py-2 rounded text-sm font-bold"
                    disabled={loading || !editPrompt}
                  >
                    Apply Magic
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 bg-[#2a2a2a] py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWorkshop;
