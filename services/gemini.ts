
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ImageSize } from '../types';

// Manual implementation of base64 decoding for PCM audio and image processing
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Exported for component use to handle raw PCM streams from Gemini
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const GeminiService = {
  async getQuickResponse(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No response generated.";
  },

  async getThinkerResponse(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text || "No response generated.";
  },

  async askOracleWithAudio(audioBase64: string, mimeType: string, bias: string = ""): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType
            }
          },
          {
            text: `As a PF2e Solo Oracle, listen to the question in this audio. Assume ${bias || "even odds"}. Use PF2e terminology (DC checks, proficiency, etc.). Give a concise 'Yes/No' with a twist. First, repeat the question you heard in italics, then provide the answer.`
          }
        ]
      }
    });
    return response.text || "The oracle is silent.";
  },

  async getSpellDetails(spellName: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide PF2e spell details for "${spellName}" in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            level: { type: Type.NUMBER },
            tradition: { type: Type.STRING },
            actions: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "level", "tradition", "description", "actions"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async getFeatDetails(featName: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide PF2e feat details for "${featName}" in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            level: { type: Type.NUMBER },
            traits: { type: Type.ARRAY, items: { type: Type.STRING } },
            prerequisites: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "level", "traits", "prerequisites", "description"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  async getSelectionPreview(type: 'Ancestry' | 'Background' | 'Class' | 'Heritage' | 'Spell', selection: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a detailed PF2e mechanical and lore summary for the ${type}: "${selection}". Include typical ability boosts, HP, and special features in a clean, professional summary. If it is a Spell, include Level, Tradition, Actions, and a concise mechanical effect description.`,
    });
    return response.text || "No preview available.";
  },

  async generateImage(prompt: string, size: ImageSize): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = (size === ImageSize.S_2K || size === ImageSize.S_4K) 
      ? 'gemini-3-pro-image-preview' 
      : 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          ...(model === 'gemini-3-pro-image-preview' ? { imageSize: size } : {})
        }
      }
    });
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("Failed to generate image.");
  },

  async editImage(imageUrl: string, prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const [header, data] = imageUrl.split(',');
    const mimeType = header.split(':')[1].split(';')[0];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });
    
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("Failed to edit image.");
  },

  async speak(text: string): Promise<Uint8Array> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) return decode(base64Audio);
    throw new Error("Failed to generate audio.");
  }
};
