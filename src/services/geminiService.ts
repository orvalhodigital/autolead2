
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Vehicle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMatchingInsights = async (vehicle: Vehicle, qualifiedLeads: Lead[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o novo veículo em estoque: ${JSON.stringify(vehicle)}
      E os seguintes leads qualificados: ${JSON.stringify(qualifiedLeads)}
      
      Gere um resumo curto explicando por que esses leads combinam com esse carro e uma sugestão de mensagem personalizada para enviar a eles via WhatsApp.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  leadId: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  whatsappPitch: { type: Type.STRING }
                },
                required: ["leadId", "reason", "whatsappPitch"]
              }
            }
          }
        }
      }
    });
    
    // Fixed: The .text property is a getter that can return undefined. Trim and fallback to empty state safely.
    const jsonStr = response.text?.trim() || '{"matches":[]}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Match Error:", error);
    return { matches: [] };
  }
};
