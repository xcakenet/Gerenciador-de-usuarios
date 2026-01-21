
import { GoogleGenAI, Type } from "@google/genai";
import { User } from "../types";

export const analyzeAccessData = async (users: User[]) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("Análise IA desabilitada: API_KEY não configurada.");
    return {
      riscos: [{ titulo: "IA Desativada", descricao: "Configure uma API Key para habilitar análises profundas.", gravidade: "Info" }],
      observacoes: ["A análise local continua funcionando normalmente."],
      sugestoes: ["Adicione a variável de ambiente API_KEY."]
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const summary = users.map(u => ({
    email: u.email,
    systems: u.accesses.map(a => `${a.systemName}:${a.profile}`)
  })).slice(0, 50);

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
