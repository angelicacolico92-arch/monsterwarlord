import { GoogleGenAI, Type } from "@google/genai";
import { UnitType, EnemyArmy } from "../types";

// Initialize the AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEnemyArmy = async (playerPower: number): Promise<EnemyArmy> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Generate a fantasy monster enemy army configuration for a game. 
    The player's army power rating is roughly ${playerPower}.
    Create an enemy army that is challenging but beatable (roughly 0.8x to 1.2x the player's power).
    
    Unit Power Estimates for calculation:
    Worker: 1
    Slime: 6
    Warrior: 10
    Archer: 15
    Gargoyle: 45
    Mage: 30
    Titan: 150

    Return a JSON object with:
    - name: Creative name for the enemy legion (e.g. "The Obsidian Flock")
    - description: A one-sentence flavor text describing them.
    - units: A map of unit types to counts.
    - difficultyRating: A number 1-10.
    - reward: Gold reward amount (generous).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            units: {
              type: Type.OBJECT,
              properties: {
                [UnitType.WORKER]: { type: Type.INTEGER },
                [UnitType.SLIME]: { type: Type.INTEGER },
                [UnitType.WARRIOR]: { type: Type.INTEGER },
                [UnitType.ARCHER]: { type: Type.INTEGER },
                [UnitType.GARGOYLE]: { type: Type.INTEGER },
                [UnitType.MAGE]: { type: Type.INTEGER },
                [UnitType.TITAN]: { type: Type.INTEGER },
              }
            },
            difficultyRating: { type: Type.NUMBER },
            reward: { type: Type.INTEGER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as EnemyArmy;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("AI Generation failed, falling back to basic enemy", error);
    // Fallback enemy
    return {
      name: "Wild Monsters",
      description: "A loose pack of wandering creatures.",
      units: {
        [UnitType.WORKER]: 0,
        [UnitType.SLIME]: Math.floor(playerPower / 10) + 2,
        [UnitType.WARRIOR]: Math.floor(playerPower / 15),
        [UnitType.ARCHER]: Math.floor(playerPower / 30),
        [UnitType.GARGOYLE]: 0,
        [UnitType.MAGE]: 0,
        [UnitType.TITAN]: 0
      },
      difficultyRating: 1,
      reward: 100
    };
  }
};

export const generateBattleReport = async (winner: string, playerUnitsLost: number, enemyName: string) => {
   const model = "gemini-3-flash-preview";
   try {
     const response = await ai.models.generateContent({
        model,
        contents: `Write a very short, humorous, 2-sentence battle report for a fight between the Player's monster army and ${enemyName}. 
        The winner was: ${winner}. 
        The player lost ${playerUnitsLost} monsters.
        Tone: Epic but silly.`
     });
     return response.text;
   } catch (e) {
     return `The battle against ${enemyName} is over. ${winner} emerged victorious!`;
   }
}