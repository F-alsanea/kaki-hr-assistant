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
  const systemInstruction = `أنت محقق توظيف لمجموعة الكعكي. حلل الـ CV بدقة (سنة 2026). الرد JSON فقط حسب السكيما. كن مختصراً جداً جداً في الوصف لتجنب الانقطاع.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          parts: [
            content as any,
            { text: `${systemInstruction}\nالمسمى: ${targetJob}\nالمرشح: ${candidateName}\nسياق: ${additionalContext}` }
          ]
        }
      ],
      config: {
        temperature: 0, // أسرع وأكثر دقة في الهيكلة
        maxOutputTokens: 4096, // زيادة المساحة لتجنب بتر النص
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

    // تنظيف متطور للـ JSON لتجنب أخطاء البارس
    let cleanJson = text;
    if (text.includes('```')) {
      cleanJson = text.split(/```(?:json)?/)[1]?.split('```')[0] || text;
    }
    cleanJson = cleanJson.trim();

    try {
      return JSON.parse(cleanJson) as AnalysisResult;
    } catch (parseError) {
      console.error("Malformed JSON received:", cleanJson);
      throw new Error("حدث خطأ في معالجة البيانات من الذكاء الاصطناعي، يرجى المحاولة مرة أخرى.");
    }
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
