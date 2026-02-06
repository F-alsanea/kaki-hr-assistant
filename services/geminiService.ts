import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
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
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // الرجوع للاسم المستقر والأساسي لضمان التوافق
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const currentDate = "2026-02-07";
  const systemInstruction = `أنت "المحقق الفني الأول" واستشاري التوظيف الاستراتيجي لمجموعة الكعكي. التاريخ الحالي هو ${currentDate}.
مهمتك: تحليل السيرة الذاتية المرفوعة بدقة متناهية بناءً على تاريخ اليوم وتقديم تقرير احترافي بصرياً ومنطقياً.

قواعد المعالجة الذكية:
1. الوعي الزمني: نحن في عام 2026. أي خبرة بدأت في 2025 هي خبرة جارية ومستمرة.
2. الدقة والتحقيق: قارن بين سنوات التخرج وتواريخ التوظيف لاكتشاف أي فجوات زمنية أو تعارضات منطقية.
3. التقييم الاستراتيجي:
   - "النقاط الحقيقية للقوة": ركز على المهارات التي تميز المرشح فعلياً (خبرة نوعية، شهادات، استقرار وظيفي).
   - "الفجوات ونقاط التحسين": ذكر ما ينقص المرشح للوصول للمثالية في الدور الوظيفي.
   - "بدائل ذكية": اقترح وظائف أخرى أنسب للمرشح لو لم يكن مناسباً تماماً للوظيفة الحالية.
4. الشخصية: كن صارماً في تقييم المخاطر (operationalRisk) ومبدعاً في "بدائل ذكية".
5. الإيجاز والمهنية: استخدم لغة عربية فصحى ومختصرة جداً.

الحقول المطلوبة في الرد (JSON فقط):
- matchScore: نسبة المطابقة (0-100).
- suitabilityLabel: وصف قصير (مثل: "مطابق تماماً"، "يحتاج تطوير").
- meritJudgment: حكم تفصيلي بالعربي يوضح لماذا يستحق المرشح الوظيفة.
- operationalRisk: مؤشر المخاطر (0-100).
- strengths: قائمة من 3 نقاط قوة.
- weaknesses: قائمة من 3 فجوات.
- alternatives: 2-3 وظائف بديلة.
- salaryBenchmark: تحليل الراتب المقترح.
- interviewGuide: 4 أسئلة استراتيجية مع أهدافها.`;

  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        matchScore: { type: SchemaType.NUMBER },
        suitabilityLabel: { type: SchemaType.STRING },
        meritJudgment: { type: SchemaType.STRING },
        operationalRisk: { type: SchemaType.NUMBER },
        strengths: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING }
            }
          }
        },
        weaknesses: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING }
            }
          }
        },
        alternatives: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              jobTitle: { type: SchemaType.STRING },
              score: { type: SchemaType.NUMBER },
              reason: { type: SchemaType.STRING }
            }
          }
        },
        salaryBenchmark: {
          type: SchemaType.OBJECT,
          properties: {
            suggestedSalary: { type: SchemaType.STRING },
            analysis: { type: SchemaType.STRING }
          }
        },
        interviewGuide: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              question: { type: SchemaType.STRING },
              expectedAnswerHint: { type: SchemaType.STRING }
            }
          }
        }
      },
      required: ["matchScore", "meritJudgment", "operationalRisk", "salaryBenchmark", "interviewGuide"]
    },
  };

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [content as any, { text: systemInstruction }] }],
      generationConfig,
    });
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim()) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
