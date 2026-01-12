
import React, { useState } from 'react';
import { GeminiService } from '../services/gemini';

const QAFateTable: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [rollResult, setRollResult] = useState<{ roll: number; category: string; content: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const getCategory = (roll: number) => {
    if (roll <= 5) return "No";
    if (roll <= 10) return "Maybe";
    if (roll <= 15) return "Yes";
    return "Yes, and...";
  };

  const handleRoll = async () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const category = getCategory(roll);
    setLoading(true);
    setRollResult(null);

    const prompt = `
      Question: ${question || "Does something significant happen?"}
      Roll Result: ${roll} (${category})
      Rules for this result:
      ${roll <= 5 ? "- Describe why the answer is 'No'." : ""}
      ${roll > 5 && roll <= 10 ? "- Offer 2–3 possible interpretations of the uncertainty for this 'Maybe'." : ""}
      ${roll > 10 && roll <= 15 ? "- Describe the successful 'Yes' outcome." : ""}
      ${roll > 15 ? "- Describe the successful outcome and a significant additional 'and...' event." : ""}
      
      Setting: Shan' Zhou (PF2e high fantasy, wuxia-inspired).
      Style: Concise, immersive, second-person.
    `;

    try {
      const response = await GeminiService.getQuickResponse(prompt);
      setRollResult({ roll, category, content: response });
    } catch (error) {
      console.error(error);
      setRollResult({ roll, category, content: "The winds of fate are obscured. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded shadow-lg space-y-6">
      <header className="flex justify-between items-center border-b border-[#333] pb-4">
        <h3 className="text-xl font-bold text-[#d4af37] serif flex items-center gap-2">
          <span>📜</span> Q/A Roll Result Table (d20)
        </h3>
      </header>

      <div className="overflow-hidden rounded border border-[#333] bg-black/20">
        <table className="w-full text-xs font-bold uppercase tracking-tighter">
          <thead>
            <tr className="bg-[#2a2a2a] text-[#d4af37] border-b border-[#333]">
              <th className="px-4 py-2 text-left">Roll</th>
              <th className="px-4 py-2 text-left">Outcome</th>
            </tr>
          </thead>
          <tbody className="text-gray-400">
            <tr className="border-b border-[#222] hover:bg-white/5 transition-colors">
              <td className="px-4 py-2 text-[#e74c3c]">1–5</td>
              <td className="px-4 py-2">No</td>
            </tr>
            <tr className="border-b border-[#222] hover:bg-white/5 transition-colors">
              <td className="px-4 py-2 text-blue-400">6–10</td>
              <td className="px-4 py-2">Maybe</td>
            </tr>
            <tr className="border-b border-[#222] hover:bg-white/5 transition-colors">
              <td className="px-4 py-2 text-[#2ecc71]">11–15</td>
              <td className="px-4 py-2">Yes</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-2 text-[#f1c40f]">16–20</td>
              <td className="px-4 py-2">Yes, and...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            className="w-full bg-[#121212] border border-[#333] p-3 rounded text-sm focus:outline-none focus:border-[#d4af37]"
            placeholder="What do you ask the heavens? (e.g., Is the temple guarded?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
          />
        </div>

        <button
          onClick={handleRoll}
          disabled={loading}
          className="w-full bg-[#d4af37] hover:bg-[#c19b2e] text-black font-black py-3 rounded text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Consulting the Tides...' : 'Roll for Fate'}
        </button>
      </div>

      {rollResult && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="bg-[#2a2a2a] border-l-4 border-[#d4af37] p-5 rounded shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <span className="bg-black text-[#d4af37] w-8 h-8 flex items-center justify-center rounded-full font-black border border-[#d4af3733]">
                  {rollResult.roll}
                </span>
                <span className="font-black serif text-lg uppercase tracking-widest text-[#d4af37]">
                  {rollResult.category}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed italic whitespace-pre-wrap">
              {rollResult.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAFateTable;
