
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/gemini';

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
      const res = await GeminiService.askOracleWithAudio(base64Audio, mimeType);
      setResult(res);
    } catch (error) {
      console.error(error);
      setResult("The spirits are confused. Try speaking again.");
    } finally {
      setLoading(false);
    }
  };

  const askOracle = async (bias: string = "") => {
    if (!prompt && !loading) return;
    setLoading(true);
    try {
      const fullPrompt = `As a PF2e Solo Oracle, answer the following question: "${prompt || "What happens next?"}". Assume ${bias || "even odds"}. Use PF2e terminology (DC checks, proficiency, etc.) where appropriate. Give a concise 'Yes/No' with a twist.`;
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
    <div className="bg-[#1e1e1e] border border-[#333] p-4 rounded shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-[#d4af37] serif flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔮</span> The Fate Oracle
        </div>
        {isRecording && (
          <span className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            LISTENING...
          </span>
        )}
      </h3>
      
      <div className="relative mb-4">
        <textarea
          className="w-full bg-[#121212] border border-[#333] p-3 pr-12 rounded text-sm focus:outline-none focus:border-[#d4af37] min-h-[100px] resize-none"
          placeholder="Ask a question or use the mic..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
          onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
          className={`absolute right-3 bottom-3 p-3 rounded-full transition-all ${
            isRecording 
            ? 'bg-red-600 text-white scale-110 shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
            : 'bg-[#2a2a2a] text-[#d4af37] hover:bg-[#333]'
          }`}
          title="Hold to speak your question"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        <button 
          onClick={() => askOracle("unlikely")} 
          className="bg-[#2a2a2a] hover:bg-[#333] p-2 text-xs font-semibold rounded transition-colors disabled:opacity-50"
          disabled={loading || isRecording}
        >
          Unlikely
        </button>
        <button 
          onClick={() => askOracle()} 
          className="bg-[#2a2a2a] hover:bg-[#333] p-2 text-xs font-semibold rounded transition-colors disabled:opacity-50"
          disabled={loading || isRecording}
        >
          Even Odds
        </button>
        <button 
          onClick={() => askOracle("likely")} 
          className="bg-[#2a2a2a] hover:bg-[#333] p-2 text-xs font-semibold rounded transition-colors disabled:opacity-50"
          disabled={loading || isRecording}
        >
          Likely
        </button>
        <button 
          onClick={() => askOracle("certain")} 
          className="bg-[#d4af37] hover:bg-[#c19b2e] text-black p-2 text-xs font-bold rounded transition-colors disabled:opacity-50"
          disabled={loading || isRecording}
        >
          Certain
        </button>
      </div>

      {result && (
        <div className="bg-[#2a2a2a] border-l-4 border-[#d4af37] p-4 rounded-r animate-fade-in">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
      
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d4af37]"></div>
          <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-widest">Consulting the Beyond...</p>
        </div>
      )}
    </div>
  );
};

export default Oracle;
