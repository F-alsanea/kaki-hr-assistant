import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

export interface CVContent {
  inlineData?: {
    data: string;
    mimeType: string;
  };
  text?: string;
}

export const analyzeCV = async (
  content: CVContent,
  targetJob: string,
  candidateName: string = '',
  additionalContext: string = ''
): Promise<AnalysisResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('مفتاح الـ API مفقود، يرجى ضبطه في إعدادات Vercel باسم VITE_GEMINI_API_KEY');
  }

  // استخدام الـ SDK الجديد والمحرك الموضح في صورتك من AI Studio
  const ai = new GoogleGenAI({ apiKey });

  console.time("Gemini_Analysis_Time");
  const systemInstruction = `أنت خبير توظيف لمجموعة الكعكي. حلل السيرة الذاتية بدقة استناداً لعام 2026.
الرد يجب أن يكون JSON فقط حسب السكيما. كن مختصراً ومهنياً جداً.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          parts: [
            content as any,
            { text: `${systemInstruction}\nالمسمى المستهدف: ${targetJob}\nالمرشح: ${candidateName}\nسياق: ${additionalContext}` }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            suitabilityLabel: { type: Type.STRING },
            meritJudgment: { type: Type.STRING },
            operationalRisk: { type: Type.NUMBER },
            aiFinalRecommendation: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            weaknesses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jobTitle: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                }
              }
            },
            salaryBenchmark: {
              type: Type.OBJECT,
              properties: {
                suggestedSalary: { type: Type.STRING },
                analysis: { type: Type.STRING }
              }
            },
            interviewGuide: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  expectedAnswerHint: { type: Type.STRING }
                }
              }
            },
            priorityFlags: {
              type: Type.OBJECT,
              properties: {
                isSaudi: { type: Type.BOOLEAN },
                transferableIqama: { type: Type.BOOLEAN }
              }
            }
          },
          required: ["matchScore", "meritJudgment", "aiFinalRecommendation"]
        }
      }
    });

    console.timeEnd("Gemini_Analysis_Time");
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
