import { GoogleGenAI, Type } from "@google/genai";
import { UnitType, EnemyArmy } from "../types";

// Initialize the AI client safely
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateEnemyArmy = async (playerPower: number): Promise<EnemyArmy> => {
  const model = "gemini-3-flash-preview";

  if (!ai) {
      console.warn("API Key missing, using fallback enemy.");
      return getFallbackEnemy(playerPower);
  }

  const prompt = `
    Generate a fantasy SLIME enemy army configuration for a game. 
    The player's army power rating is roughly ${playerPower}.
    Create an enemy army that is challenging but beatable (roughly 0.8x to 1.2x the player's power).
    
    Unit Power Estimates for calculation:
    Slime Miner (WORKER): 1
    Toxic Slime (TOXIC): 8
    Archer Slime (ARCHER): 12
    Gargoyle Slime (GARGOYLE): 15
    Paladin Slime (PALADIN): 20
    Mage Slime (MAGE): 30
    Big Slime (BOSS): 100

    Return a JSON object with:
    - name: Creative name for the slime legion (e.g. "The Ooze Brigade")
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
                [UnitType.TOXIC]: { type: Type.INTEGER },
                [UnitType.ARCHER]: { type: Type.INTEGER },
                [UnitType.GARGOYLE]: { type: Type.INTEGER },
                [UnitType.PALADIN]: { type: Type.INTEGER },
                [UnitType.MAGE]: { type: Type.INTEGER },
                [UnitType.BOSS]: { type: Type.INTEGER },
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
    return getFallbackEnemy(playerPower);
  }
};

export const generateBattleReport = async (winner: string, playerUnitsLost: number, enemyName: string) => {
   if (!ai) {
       return `The battle against ${enemyName} is over. ${winner} emerged victorious!`;
   }
   
   const model = "gemini-3-flash-preview";
   try {
     const response = await ai.models.generateContent({
        model,
        contents: `Write a very short, humorous, 2-sentence battle report for a fight between the Player's slime army and ${enemyName}. 
        The winner was: ${winner}. 
        The player lost ${playerUnitsLost} slimes.
        Tone: Sticky, gooey, epic.`
     });
     return response.text;
   } catch (e) {
     return `The battle against ${enemyName} is over. ${winner} emerged victorious!`;
   }
}

function getFallbackEnemy(playerPower: number): EnemyArmy {
    return {
      name: "Wild Jellies",
      description: "A loose pack of wandering globs.",
      units: {
        [UnitType.WORKER]: 0,
        [UnitType.TOXIC]: Math.floor(playerPower / 12) + 2,
        [UnitType.ARCHER]: Math.floor(playerPower / 20),
        [UnitType.GARGOYLE]: Math.floor(playerPower / 25),
        [UnitType.PALADIN]: Math.floor(playerPower / 30),
        [UnitType.MAGE]: 0,
        [UnitType.BOSS]: 0
      },
      difficultyRating: 1,
      reward: 100
    };
}