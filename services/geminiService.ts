
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
    throw new Error('API Key is missing. Please set VITE_GEMINI_API_KEY.');
  }
  const ai = new GoogleGenAI({ apiKey });

  const currentDate = "2026-02-06";
  const systemInstruction = `أنت "المحقق الفني الأول" واستشاري التوظيف الاستراتيجي لمجموعة الكعكي. التاريخ الحالي هو ${currentDate}.
مهمتك: تحليل السيرة الذاتية المرفوعة بدقة متناهية بناءً على تاريخ اليوم وتقديم تقرير احترافي بصرياً ومنطقياً.

قواعد المعالجة الذكية:
1. الوعي الزمني: نحن في عام 2026. أي خبرة بدأت في 2025 هي خبرة جارية ومستمرة.
2. الدقة والتحقيق: قارن بين سنوات التخرج وتواريخ التوظيف لاكتشاف أي فجوات زمنية أو تعارضات منطقية.
3. التقييم الاستراتيجي:
   - "النقاط الحقيقية للقوة": ركز على المهارات التي تميز المرشح فعلياً عن غيره (خبرة نوعية، شهادات احترافية، استقرار وظيفي).
   - "الفجوات ونقاط التحسين": كن صريحاً ومهنياً في ذكر ما ينقص المرشح للوصول للمثالية في الدور الوظيفي.
   - "بدائل ذكية": اقترح وظائف أخرى قد يكون المرشح "أنسب لها" بناءً على مهاراته الفعلية إذا لم يكن مناسباً تماماً للوظيفة الحالية.
4. الشخصية: كن صارماً في تقييم المخاطر (operationalRisk) ومبدعاً في "بدائل ذكية".
5. الإيجاز والمهنية: استخدم لغة عربية فصحى، مهنية، ومختصرة جداً في النقاط.

الحقول المطلوبة في الرد (JSON فقط):
- matchScore: نسبة المطابقة (0-100).
- suitabilityLabel: وصف قصير جداً (مثل: "مطابق تماماً"، "يحتاج تطوير"، "غير مناسب").
- meritJudgment: حكم تفصيلي بالعربي يوضح لماذا يستحق المرشح الوظيفة.
- operationalRisk: مؤشر المخاطر التشغيلية (0-100) بناءً على الاستقرار الوظيفي وصحة البيانات.
- strengths: قائمة من 3 نقاط قوة حقيقية مع تأثيرها.
- weaknesses: قائمة من 3 فجوات ونقاط تستحق التحسين مع طريقة معالجتها.
- alternatives: 2-3 وظائف بديلة تناسب مهارات المرشح فعلياً مع نسبة المطابقة لكل منها.
- salaryBenchmark: تحليل الراتب المقترح.
- interviewGuide: 4 أسئلة استراتيجية مع أهدافها.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [content, { text: `${systemInstruction}\n\nسياق إضافي: ${additionalContext}\nالوظيفة المستهدفة: ${targetJob}\nاسم المرشح: ${candidateName}` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchScore: { type: Type.NUMBER },
          suitabilityLabel: { type: Type.STRING },
          meritJudgment: { type: Type.STRING },
          operationalRisk: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          recommendationWhy: { type: Type.STRING },
          aiFinalRecommendation: { type: Type.STRING },
          strengths: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impactOrMitigation: { type: Type.STRING }
              }
            }
          },
          weaknesses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                impactOrMitigation: { type: Type.STRING }
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
                target: { type: Type.STRING },
                expectedAnswerHint: { type: Type.STRING },
                category: { type: Type.STRING }
              }
            }
          },
          discrepancies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                field: { type: Type.STRING },
                userInput: { type: Type.STRING },
                cvDetected: { type: Type.STRING },
                cvSnippet: { type: Type.STRING },
                severity: { type: Type.STRING }
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
        required: ["matchScore", "meritJudgment", "operationalRisk", "salaryBenchmark", "interviewGuide"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as AnalysisResult;
};
