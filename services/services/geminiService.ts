import { GoogleGenAI, Type } from "@google/genai";
import { Message, Song } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAiResponse = async (
  currentMessage: string,
  history: Message[],
  usersInSpace: string[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "I'm having trouble connecting to my brain right now. Please check the API key.";

  const contextPrompt = `
    You are the DuoSpace Assistant. A private, cozy, and safe AI companion for a small group of best friends.
    The users in this space are: ${usersInSpace.join(', ')}.
    
    Guidelines:
    1. Be warm, friendly, and casual. Keep it brief.
    2. Do not act like a corporate bot. Act like a helpful mutual friend.
    3. You can help with conversation starters, settling friendly debates, or planning hangouts.
    4. Never reveal you are an AI unless asked directly.
    5. This is NOT a real-time chat.
    
    Recent conversation history:
    ${history.slice(-10).map(m => `${m.senderId === 'ai' ? 'You' : 'Friend'}: ${m.content}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: currentMessage,
      config: {
        systemInstruction: contextPrompt,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    
    return response.text || "I'm thinking...";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I couldn't quite catch that. Try again?";
  }
};

export const extractMusicMetadata = async (url: string): Promise<Partial<Song>> => {
  const ai = getAiClient();
  if (!ai) return { title: 'Unknown Track', artist: 'Unknown Artist', platform: 'other' };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this URL: ${url}. Return a JSON object with title, artist, platform (spotify, youtube, apple, soundcloud, or other), and a generic coverArt description.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            platform: { type: Type.STRING },
            coverArt: { type: Type.STRING },
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini Metadata Error:", error);
    return {
      title: 'Shared Link',
      artist: 'Unknown Source',
      platform: 'other',
      coverArt: 'https://picsum.photos/200/200'
    };
  }
};
