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

  const currentDate = "2026-02-07";
  const systemInstruction = `أنت "المحقق الفني الأول" واستشاري التوظيف الاستراتيجي لمجموعة الكعكي. التاريخ الحالي هو ${currentDate}.
مهمتك: تحليل السيرة الذاتية المرفوعة بدقة متناهية بناءً على تاريخ اليوم وتقديم تقرير استراتيجي كامل.
يجب أن يكون الرد JSON فقط متوافقاً تماماً مع السكيما المعطاة.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            content as any,
            { text: `${systemInstruction}\n\nسياق إضافي: ${additionalContext}\nالوظيفة المستهدفة: ${targetJob}\nاسم المرشح: ${candidateName}` }
          ]
        }
      ],
      config: {
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
            },
            discrepancies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  field: { type: Type.STRING },
                  cvDetected: { type: Type.STRING },
                  severity: { type: Type.STRING }
                }
              }
            }
          },
          required: ["matchScore", "meritJudgment", "operationalRisk", "salaryBenchmark", "interviewGuide", "aiFinalRecommendation"]
        }
      }
    });

    // تنظيف النص والتأكد من أنه JSON صالح
    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini 3 Analysis Error:", error);
    throw error;
  }
};
