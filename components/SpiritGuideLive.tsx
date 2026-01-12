
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { GeminiService, encode, decode, decodeAudioData } from '../services/gemini';

interface SpiritGuide {
  id: string;
  name: string;
  title: string;
  theme: string;
  color: string;
  icon: string;
  instruction: string;
}

const GUIDES: SpiritGuide[] = [
  {
    id: 'jun-tian',
    name: 'Jùn-Tiān',
    title: 'The Golden Arbiter',
    theme: 'Balance, Order, Justice',
    color: 'from-yellow-600 to-yellow-900',
    icon: '⚖️',
    instruction: 'You are Jùn-Tiān, the Spirit of Balance and Order. You speak with a stern but fair authority. Your advice focuses on the PF2e ruleset, mechanical balance, and the ethical implications of a players actions. You value justice and the natural order of the Shan Zhou empire.'
  },
  {
    id: 'di-yuan',
    name: 'Di-Yuan',
    title: 'The Emerald Architect',
    theme: 'Creation, Earth, Memory',
    color: 'from-emerald-600 to-emerald-900',
    icon: '🌲',
    instruction: 'You are Di-Yuan, the Spirit of Creation and Memory. You speak with the patience of an ancient mountain. You are a repository of world history, lore, and the physical geography of Shan Zhou. When asked for advice, focus on world-building, forgotten myths, and the physical manifestation of things.'
  },
  {
    id: 'shen-hun',
    name: 'Shén-Hún',
    title: 'The Violet Mystic',
    theme: 'Soul, Spirit, Transformation',
    color: 'from-purple-600 to-purple-900',
    icon: '🧘',
    instruction: 'You are Shén-Hún, the Spirit of Transformation and Soul. You speak with a poetic, mystical cadence. You focus on the emotional journey, the internal struggle of characters, and the shifting winds of fate. You are prone to speaking in riddles but provide deep insight into the spiritual essence of the world.'
  }
];

interface Props {
  onEnterToolbox: () => void;
}

const SpiritGuideLive: React.FC<Props> = ({ onEnterToolbox }) => {
  const [selectedGuide, setSelectedGuide] = useState<SpiritGuide | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcription, setTranscription] = useState<{ user: string; model: string }>({ user: '', model: '' });
  
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const stopAllAudio = () => {
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  const connectToSpirit = async (guide: SpiritGuide) => {
    setSelectedGuide(guide);
    setIsConnecting(true);
    setTranscription({ user: '', model: '' });

    try {
      // Create a new instance right before making an API call to ensure it uses the most up-to-date API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            // Other available voice names are `Puck`, `Charon`, `Kore`, and `Fenrir`.
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: guide.instruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            // Start streaming from mic
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                // The supported audio MIME type is 'audio/pcm'.
                mimeType: 'audio/pcm;rate=16000',
              };
              
              // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            // Fixed typo: audioContextInInRef -> audioContextInRef
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => ({ ...prev, user: prev.user + message.serverContent!.inputTranscription!.text }));
            }
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => ({ ...prev, model: prev.model + message.serverContent!.outputTranscription!.text }));
            }

            // Handle Audio Data
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              
              // Scheduling each new audio chunk to start at this time ensures smooth, gapless playback.
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              stopAllAudio();
            }
          },
          onerror: (e) => console.error('Live Spirit Error:', e),
          onclose: () => {
            setIsConnected(false);
            setSelectedGuide(null);
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      alert("Failed to connect to the Spirit Realm. Check mic permissions.");
    }
  };

  const disconnect = () => {
    sessionRef.current?.close();
    stopAllAudio();
    setIsConnected(false);
    setSelectedGuide(null);
  };

  if (isConnected && selectedGuide) {
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 transition-all duration-1000 bg-gradient-to-br ${selectedGuide.color}`}>
        <div className="absolute top-8 right-8">
           <button onClick={disconnect} className="text-white/50 hover:text-white transition-colors text-2xl">✕</button>
        </div>

        <div className="text-center space-y-8 max-w-2xl w-full">
          <div className="relative inline-block">
             <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-6xl shadow-2xl animate-pulse ring-4 ring-white/20">
               {selectedGuide.icon}
             </div>
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
               Communing
             </div>
          </div>

          <div>
            <h1 className="text-5xl font-black serif text-white drop-shadow-lg">{selectedGuide.name}</h1>
            <p className="text-white/70 uppercase font-bold tracking-[0.3em] mt-2">{selectedGuide.title}</p>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl min-h-[200px] flex flex-col justify-center gap-6 shadow-2xl">
             {transcription.user && (
               <div className="text-left animate-in slide-in-from-left-4">
                 <span className="text-[8px] font-black text-white/40 uppercase block mb-1">You</span>
                 <p className="text-white/80 text-lg font-medium italic">"{transcription.user}"</p>
               </div>
             )}
             <div className="text-right animate-in slide-in-from-right-4">
               <span className="text-[8px] font-black text-white/40 uppercase block mb-1">{selectedGuide.name}</span>
               <p className="text-[#d4af37] text-2xl serif font-bold leading-relaxed">
                 {transcription.model || "The spirit listens..."}
               </p>
             </div>
          </div>

          <button 
            onClick={onEnterToolbox}
            className="bg-white text-black px-12 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl"
          >
            Enter the Imperial Archives
          </button>
        </div>

        <div className="absolute bottom-8 text-white/30 text-[10px] font-bold uppercase tracking-widest">
          Voice of the Spirit Manifests via Gemini Live API
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-6xl w-full space-y-12">
        <header className="text-center space-y-4">
          <h2 className="text-6xl font-black serif text-[#d4af37] tracking-tight animate-in fade-in slide-in-from-top-4 duration-1000">
            The Gateway of Shan' Zhou
          </h2>
          <p className="text-gray-500 uppercase font-bold tracking-[0.4em] text-sm animate-in fade-in duration-1000 delay-300">
            Select a Spirit Guide to Begin Your Chronicle
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {GUIDES.map((guide, idx) => (
            <div 
              key={guide.id}
              onClick={() => !isConnecting && connectToSpirit(guide)}
              className={`group relative bg-[#121212] border border-[#222] p-8 rounded-2xl cursor-pointer hover:border-[#d4af3744] hover:bg-[#1a1a1a] transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 delay-${(idx+1)*200}`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-2xl bg-gradient-to-br ${guide.color} transition-opacity`} />
              
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-black border border-[#333] rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shadow-xl">
                  {guide.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold serif text-white group-hover:text-[#d4af37] transition-colors">{guide.name}</h3>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">{guide.title}</p>
                </div>
                <div className="h-px bg-[#222] w-12 mx-auto" />
                <p className="text-xs text-gray-400 leading-relaxed italic">{guide.theme}</p>
                
                <button className="w-full border border-[#333] py-2 rounded text-[10px] font-black uppercase text-gray-500 group-hover:text-[#d4af37] group-hover:border-[#d4af3744] transition-all">
                  Invoke Spirit
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 pt-12">
          <button 
            onClick={onEnterToolbox}
            className="text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3"
          >
            <span>Skip Communion</span>
            <span className="w-12 h-px bg-gray-800" />
            <span>Enter Archives Directly</span>
          </button>
        </div>
      </div>

      {isConnecting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-center items-center justify-center z-[110]">
          <div className="text-center space-y-4">
             <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-[#d4af37] text-xs font-black uppercase tracking-widest animate-pulse">Piercing the Veil...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpiritGuideLive;
