
import React from 'react';
import { GameTime } from '../types';

interface Props {
  time: GameTime;
  isRunning: boolean;
  onToggle: () => void;
  onAdvance: (seconds: number) => void;
}

const MONTH_NAMES = [
  "Dragon's Rise", "Peach Blossom", "Vernal Rain", "Radiant Sun",
  "Cicada's Song", "Azure Lotus", "Harvest Moon", "Golden Mum",
  "Frosty Descent", "Sleeping Tiger", "Silver Pine", "Great Void"
];

const GameClock: React.FC<Props> = ({ time, isRunning, onToggle, onAdvance }) => {
  const formatTime = (val: number) => val.toString().padStart(2, '0');
  
  const h = time.hours;
  const isDay = h >= 6 && h < 18;
  const displayHours = h % 12 || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';

  const season = time.months < 3 ? 'Spring' : time.months < 6 ? 'Summer' : time.months < 9 ? 'Autumn' : 'Winter';

  const getWeatherIcon = (weather?: string) => {
    if (!weather) return '🌫️';
    const w = weather.toLowerCase();
    if (w.includes('clear')) return '☀️';
    if (w.includes('hot')) return '🔥';
    if (w.includes('rain')) return '🌧️';
    if (w.includes('overcast')) return '☁️';
    if (w.includes('snow') || w.includes('sleet') || w.includes('blizzard')) return '❄️';
    if (w.includes('cold')) return '🥶';
    if (w.includes('warm')) return '🌤️';
    return '🌫️';
  };

  // Sophisticated Time-of-Day Gradients
  const getTimeOfDayStyles = () => {
    if (h >= 5 && h < 8) return 'from-[#ff9a9e] via-[#fecfef] to-[#7db9e8]'; // Vibrant Dawn
    if (h >= 8 && h < 16) return 'from-[#4facfe] via-[#00f2fe] to-[#7db9e8]'; // Bright Day
    if (h >= 16 && h < 19) return 'from-[#fa709a] to-[#fee140]'; // Golden Hour
    if (h >= 19 && h < 21) return 'from-[#30cfd0] to-[#330867]'; // Twilight
    return 'from-[#09203f] to-[#537895]'; // Deep Night
  };

  const weather = (time.weather || "").toLowerCase();

  return (
    <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded shadow-lg space-y-4">
      <style>{`
        @keyframes rain-fall {
          from { background-position: 0 0; }
          to { background-position: 40px 800px; }
        }
        @keyframes snow-fall {
          0% { background-position: 0 0; transform: translateX(0); }
          25% { transform: translateX(5px); }
          50% { transform: translateX(-5px); }
          100% { background-position: 100px 400px; transform: translateX(0); }
        }
        @keyframes cloud-drift {
          from { transform: translateX(-20%); }
          to { transform: translateX(20%); }
        }
        @keyframes heat-haze {
          0%, 100% { filter: contrast(1) brightness(1) blur(0px); transform: scale(1); }
          50% { filter: contrast(1.1) brightness(1.2) blur(0.5px); transform: scale(1.01); }
        }
        @keyframes lightning-flash {
          0%, 95%, 98%, 100% { background-color: transparent; }
          96%, 99% { background-color: rgba(255, 255, 255, 0.4); }
        }
        @keyframes mist-float {
          from { opacity: 0.2; transform: translateY(0); }
          to { opacity: 0.4; transform: translateY(-10px); }
        }

        .weather-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 5;
        }

        .weather-rain-texture {
          background-image: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
          background-size: 2px 40px;
          animation: rain-fall 0.4s linear infinite;
        }

        .weather-snow-texture {
          background-image: radial-gradient(circle at center, #fff 10%, transparent 20%);
          background-size: 15px 15px;
          animation: snow-fall 4s linear infinite;
        }

        .weather-mist-texture {
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent);
          animation: mist-float 3s ease-in-out infinite alternate;
        }

        .weather-lightning-overlay {
          animation: lightning-flash 8s infinite;
        }

        .clock-glass {
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
      `}</style>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-[#d4af37] serif flex items-center gap-2">
          <span>🕒</span> Chronicles of Time
        </h3>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${isRunning ? 'bg-green-900/20 text-green-500 border-green-500/50' : 'bg-red-900/20 text-red-500 border-red-500/50'}`}>
          {isRunning ? 'Flowing' : 'Paused'}
        </div>
      </div>

      <div className={`p-1 rounded-xl border border-[#333] shadow-2xl relative overflow-hidden group transition-all duration-1000 bg-gradient-to-br ${getTimeOfDayStyles()}`}>
        
        {/* Layered Weather Visuals */}
        
        {/* 1. Clouds / Mist Layer */}
        {(weather.includes('overcast') || weather.includes('rain')) && (
          <div className="weather-layer opacity-40 mix-blend-screen overflow-hidden">
            <div className="w-[200%] h-full bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-30" style={{ animation: 'cloud-drift 40s linear infinite alternate' }} />
          </div>
        )}

        {/* 2. Heat Haze Layer */}
        {weather.includes('hot') && (
          <div className="weather-layer bg-orange-500/5" style={{ animation: 'heat-haze 3s ease-in-out infinite' }} />
        )}

        {/* 3. Rain / Sleet Layer */}
        {(weather.includes('rain') || weather.includes('sleet')) && (
          <>
            <div className="weather-layer weather-rain-texture" />
            <div className="weather-layer weather-lightning-overlay" />
          </>
        )}

        {/* 4. Snow Layer */}
        {(weather.includes('snow') || weather.includes('blizzard')) && (
          <div className="weather-layer weather-snow-texture" />
        )}

        {/* 5. Night Mist */}
        {!isDay && (
          <div className="weather-layer weather-mist-texture" />
        )}

        {/* Sun/Moon Phase Icon */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <div className={`text-3xl transition-all duration-1000 transform ${isDay ? 'text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.9)] scale-110' : 'text-blue-100 drop-shadow-[0_0_15px_rgba(226,232,240,0.7)] rotate-12'}`}>
            {isDay ? '☀️' : '🌙'}
          </div>
        </div>

        {/* Subtle Background Year Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center text-[12rem] serif italic font-black text-white select-none">
          {time.years}
        </div>

        <div className="relative z-10 p-8 clock-glass rounded-lg m-1">
          <div className="flex items-baseline justify-center gap-3">
            <div className="text-6xl font-black serif text-white tracking-tighter tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              {formatTime(displayHours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
            </div>
            <div className="text-lg font-black text-[#d4af37] uppercase tracking-widest tabular-nums drop-shadow-lg">
              {ampm}
            </div>
          </div>
          <div className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em] mt-3 drop-shadow-lg text-center">
            {MONTH_NAMES[time.months]} • Day {time.days + 1} • Year {time.years}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={onToggle}
          className={`col-span-2 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isRunning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#d4af37] hover:bg-[#c19b2e] text-black'}`}
        >
          {isRunning ? 'Halt Progression' : 'Invoke Time Flow'}
        </button>
        <button
          onClick={() => onAdvance(3600)}
          className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 py-3 rounded text-[9px] font-black uppercase border border-[#333] transition-all"
        >
          +1 Hour
        </button>
        <button
          onClick={() => onAdvance(60)}
          className="bg-[#2a2a2a] hover:bg-[#333] text-gray-300 py-3 rounded text-[9px] font-black uppercase border border-[#333] transition-all"
        >
          +1 Min
        </button>
        
        <button
          onClick={() => onAdvance(600)}
          className="col-span-2 bg-[#121212] hover:bg-[#1a1a1a] text-[#3498db] py-3 rounded-lg text-[9px] font-black uppercase border border-[#3498db33] transition-all flex items-center justify-center gap-2"
        >
          <span>🩹</span> Treat Wounds (10m)
        </button>
        <button
          onClick={() => onAdvance(3600 * 8)}
          className="col-span-2 bg-[#121212] hover:bg-[#1a1a1a] text-[#d4af37] py-3 rounded-lg text-[9px] font-black uppercase border border-[#d4af3733] transition-all flex items-center justify-center gap-2"
        >
          <span>💤</span> Meditative Rest (8h)
        </button>
      </div>

      {/* Manifestation Details */}
      <div className="border-t border-[#333] pt-5 mt-2">
        <div className="bg-[#121212]/80 border border-[#d4af3733] rounded-lg p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="text-5xl drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                {getWeatherIcon(time.weather)}
              </div>
              <div>
                <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-1">Celestial State</div>
                <div className="text-xl font-bold serif text-[#d4af37] leading-none uppercase tracking-wide">
                  {time.weather || "Calm Skies"}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] mb-1">Omen Roll</div>
              <div className="text-2xl font-black serif text-white bg-[#d4af3711] px-4 py-1.5 rounded-lg border border-[#d4af3733] shadow-inner">
                {time.weatherRoll || "--"}
              </div>
            </div>
          </div>
          {/* Seasonal Watermark */}
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none select-none text-[3rem] font-black uppercase rotate-[-15deg] leading-none">
            {season}
          </div>
        </div>
        <p className="text-[8px] text-center text-gray-600 font-bold uppercase tracking-widest mt-3 italic opacity-60">
          The Mandate of Heaven dictates the weather with every passing dawn.
        </p>
      </div>
    </div>
  );
};

export default GameClock;
