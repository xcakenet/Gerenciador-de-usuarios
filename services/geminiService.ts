
import { GoogleGenAI, Type } from "@google/genai";
import { User } from "../types";

export const analyzeAccessData = async (users: User[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Resumo para não estourar o limite de tokens
  const summary = users.map(u => ({
    email: u.email,
    systems: u.accesses.map(a => `${a.systemName}:${a.profile}`)
  })).slice(0, 50); // Analisamos uma amostra ou resumo se for muito grande

  const prompt = `Analise os seguintes dados de acesso de usuários em múltiplos sistemas corporativos. 
  Identifique possíveis riscos de segurança (Ex: usuários com perfis conflitantes em sistemas diferentes), 
  anomalias de acesso ou sugestões de otimização de perfis.
  Retorne em formato JSON estruturado com uma lista de 'riscos', 'observacoes' e 'sugestoes'.
  
  Dados: ${JSON.stringify(summary)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riscos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  titulo: { type: Type.STRING },
                  descricao: { type: Type.STRING },
                  gravidade: { type: Type.STRING, description: "Baixa, Média, Alta" }
                },
                required: ["titulo", "descricao", "gravidade"]
              }
            },
            observacoes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            sugestoes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["riscos", "observacoes", "sugestoes"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
