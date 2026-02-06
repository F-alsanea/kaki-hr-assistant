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
  const systemInstruction = `أنت "كبير مستشاري التوظيف" لمجموعة الكعكي في العام 2026.
مهمتك: تحليل السيرة الذاتية (CV) بدقة استراتيجية فائقة.

قواعد صارمة والزامية:
1. اللغة: يجب أن يكون الرد باللغة العربية الفصحى والمهنية 100% لكافة الحقول (بدون استثناء).
2. الراتب المقترح وجدول الرواتب: لا تعطِ أرقاماً عشوائية. اعتمد على:
   - متوسط الرواتب في السوق السعودي لعام 2026.
   - مهارات المرشح النوعية (كلما زادت المهارات التقنية، زاد الراتب).
   - الشهادات الاحترافية وسنوات الخبرة الفعلية.
   - المسمى الوظيفي المستهدف ومستوى المسؤولية.
   - اذكر نطاقاً منطقياً (مثلاً: 12,000 - 15,000) مع تحليل للأسباب.
3. مخاطر التشغيل (operationalRisk): أعطِ رقماً من "0 إلى 100" يمثل مدى خطورة توظيف المرشح (مثلاً: 10 يعني استقرار عالي، 90 يعني خطورة عالية بسبب فجوات زمنية أو ضعف مهارات).
4. البدائل الذكية: إذا كان المرشح غير مناسب للوظيفة الحالية، اقترح له أدواراً في المجموعة يكون "أنسب" لها بناءً على خلفيته.

الرد يجب أن يكون JSON فقط حسب السكيما المحددة.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            content as any,
            { text: `${systemInstruction}\nالمسمى المستهدف حالياً: ${targetJob}\nاسم المرشح: ${candidateName}\nسياق إضافي من المستخدم: ${additionalContext}` }
          ]
        }
      ],
      config: {
        temperature: 0.1, // أسرع وأكثر دقة في الهيكلة
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
          required: ["matchScore", "meritJudgment", "aiFinalRecommendation", "operationalRisk", "salaryBenchmark"]
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
      const parsed = JSON.parse(cleanJson);
      // ضمان أن الـ risk هو رقم من 100
      if (parsed.operationalRisk < 1 && parsed.operationalRisk > 0) {
        parsed.operationalRisk = Math.round(parsed.operationalRisk * 100);
      }
      return parsed as AnalysisResult;
    } catch (parseError) {
      console.error("Malformed JSON:", cleanJson);
      throw new Error("حدث خطأ في معالجة البيانات بالعربي، يرجى المحاولة مرة أخرى.");
    }
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
