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
  const systemInstruction = `أنت خبير توظيف لمجموعة الكعكي. حلل الـ CV لعام 2026.
شروط الرد:
1. اللغة: عربية فصحى مهنية 100%.
2. الراتب: نطاق منطقي (مثلاً 10,000 - 12,000) بناءً على مهارات المرشح وسوق السعودية 2026.
3. المخاطر: رقم من 0 لـ 100 فقط.
الرد يجب أن يكون JSON فقط مطابق تماماً للسكيما.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            content as any,
            { text: `${systemInstruction}\nالوظيفة: ${targetJob}\nالمرشح: ${candidateName}\nسياق: ${additionalContext}` }
          ]
        }
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 2048,
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
          required: ["matchScore", "meritJudgment", "aiFinalRecommendation", "operationalRisk", "salaryBenchmark"]
        }
      }
    });

    console.timeEnd("Gemini_Analysis_Time");
    const text = response.text || '';

    // استخراج الـ JSON بشكل أكثر عدوانية لضمان النجاح
    let cleanJson = text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = text.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(cleanJson.trim());
      // تصحيح أوتوماتيكي للمخاطر لو جاءت ككسر عشري
      if (parsed.operationalRisk < 1 && parsed.operationalRisk > 0) {
        parsed.operationalRisk = Math.round(parsed.operationalRisk * 100);
      }
      return parsed as AnalysisResult;
    } catch (parseError) {
      console.error("Malformed JSON detected:", cleanJson);
      throw new Error("تلقينا بيانات غير مكتملة، يرجى المحاولة مرة أخرى أو اختصار الطلب.");
    }
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
