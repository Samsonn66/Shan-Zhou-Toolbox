
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/gemini';

const LIKELIHOOD_DATA = [
  { label: 'Impossible', mod: -6, color: 'text-red-600' },
  { label: 'Highly Unlikely', mod: -4, color: 'text-red-400' },
  { label: 'Unlikely', mod: -2, color: 'text-orange-400' },
  { label: 'Possible', mod: 0, color: 'text-blue-400' },
  { label: 'Likely', mod: 2, color: 'text-green-400' },
  { label: 'Highly Likely', mod: 4, color: 'text-emerald-400' },
  { label: 'A Certainty', mod: 6, color: 'text-[#d4af37]' },
];

const Oracle: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64Audio = await blobToBase64(audioBlob);
        handleAudioQuery(base64Audio, audioBlob.type);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioQuery = async (base64Audio: string, mimeType: string) => {
    setLoading(true);
    setResult(null);
    try {
      // Default context for audio queries
      const res = await GeminiService.askOracleWithAudio(base64Audio, mimeType, "Possible (Modifier: 0)");
      setResult(res);
    } catch (error) {
      console.error(error);
      setResult("The spirits are confused. Try speaking again.");
    } finally {
      setLoading(false);
    }
  };

  const askOracle = async (likelihood: string, modifier: number) => {
    if (!prompt && !loading) return;
    setLoading(true);
    try {
      const fullPrompt = `As a PF2e Solo Oracle, answer the following question: "${prompt || "What happens next?"}". 
      The likelihood of a "Yes" is "${likelihood}" with a difficulty modifier of ${modifier >= 0 ? '+' : ''}${modifier}. 
      Use PF2e terminology (DC checks, proficiency, etc.) where appropriate. 
      Give a concise 'Yes/No' with a twist based on these exact odds.`;
      
      const res = await GeminiService.getQuickResponse(fullPrompt);
      setResult(res);
    } catch (error) {
      console.error(error);
      setResult("The stars are cloudy. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded shadow-lg space-y-6">
      <h3 className="text-xl font-bold text-[#d4af37] serif flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔮</span> The Fate Oracle
        </div>
        {isRecording && (
          <span className="flex items-center gap-2 text-red-500 text-[10px] font-black animate-pulse uppercase tracking-widest">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Listening...
          </span>
        )}
      </h3>

      {/* Difficulty Modifier Table Reference */}
      <div className="bg-black/20 border border-[#333] rounded overflow-hidden">
        <table className="w-full text-[10px] font-bold uppercase tracking-tighter">
          <thead>
            <tr className="bg-[#2a2a2a] text-[#d4af37] border-b border-[#333]">
              <th className="px-4 py-2 text-left">Likelihood</th>
              <th className="px-4 py-2 text-right">Modifier</th>
            </tr>
          </thead>
          <tbody className="text-gray-500">
            {LIKELIHOOD_DATA.map((item) => (
              <tr key={item.label} className="border-b border-[#222] hover:bg-white/5 transition-colors">
                <td className={`px-4 py-1.5 ${item.color}`}>{item.label}</td>
                <td className="px-4 py-1.5 text-right font-mono">{item.mod >= 0 ? '+' : ''}{item.mod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="relative">
        <textarea
          className="w-full bg-[#121212] border border-[#333] p-4 pr-12 rounded text-sm focus:outline-none focus:border-[#d4af37] min-h-[120px] resize-none leading-relaxed transition-colors placeholder:text-gray-700"
          placeholder="What do you wish to know? Type your query or hold the mic..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
          className={`absolute right-4 bottom-4 p-3 rounded-full transition-all duration-300 ${
            isRecording 
            ? 'bg-red-600 text-white scale-110 shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse' 
            : 'bg-[#2a2a2a] text-[#d4af37] hover:bg-[#333] hover:scale-105 shadow-lg'
          }`}
          title="Hold to speak your question"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {LIKELIHOOD_DATA.map((item) => (
          <button 
            key={item.label}
            onClick={() => askOracle(item.label, item.mod)} 
            className={`bg-[#2a2a2a] hover:bg-[#333] p-2 text-[9px] font-black uppercase rounded transition-all border border-transparent hover:border-[#d4af3744] disabled:opacity-30 ${item.label === 'Possible' ? 'md:col-span-2 bg-[#d4af3722] text-[#d4af37] border-[#d4af3744]' : ''}`}
            disabled={loading || isRecording}
          >
            {item.label} ({item.mod >= 0 ? '+' : ''}{item.mod})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6 animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-10 h-10 border-t-2 border-b-2 border-[#d4af37] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-4 uppercase font-black tracking-[0.2em] animate-pulse">Consulting the Beyond...</p>
        </div>
      )}

      {result && !loading && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="bg-[#2a2a2a] border-l-4 border-[#d4af37] p-5 rounded shadow-inner">
            <p className="text-sm text-gray-200 leading-relaxed italic whitespace-pre-wrap">
              {result}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Oracle;
