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
    throw new Error('API Key is missing. Please set VITE_GEMINI_API_KEY in Vercel settings.');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // تأكد من استخدام هذا الاسم الصافي للمحرك
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  const currentDate = "2026-02-07";
  const systemInstruction = `أنت "المحقق الفني الأول" واستشاري التوظيف الاستراتيجي لمجموعة الكعكي. التاريخ الحالي هو ${currentDate}.
مهمتك: تحليل السيرة الذاتية المرفوعة بدقة متناهية بناءً على تاريخ اليوم وتقديم تقرير احترافي بصرياً ومنطقياً.

قواعد المعالجة الذكية:
1. الوعي الزمني: نحن في عام 2026. أي خبرة بدأت في 2025 هي خبرة جارية ومستمرة.
2. الدقة والتحقيق والمطابقة: قارن بدقة بين سنوات التخرج وتواريخ التوظيف.
3. الإيجاز والمهنية: استخدم لغة عربية فصحى ومختصرة جداً في النقاط.

الحقول المطلوبة في الرد (JSON فقط):
- matchScore: نسبة المطابقة (0-100).
- suitabilityLabel: وصف قصير (مثل: "مطابق تماماً"، "يحتاج تطوير").
- meritJudgment: حكم تفصيلي بالعربي يوضح لماذا يستحق المرشح الوظيفة.
- operationalRisk: مؤشر المخاطر (0-100).
- strengths: قائمة من 3 نقاط قوة.
- weaknesses: قائمة من 3 فجوات.
- alternatives: 2-3 وظائف بديلة تناسب مهاراته.
- salaryBenchmark: تحليل الراتب المقترح.
- interviewGuide: 4 أسئلة استراتيجية.`;

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
      contents: [
        {
          role: "user",
          parts: [
            content as any,
            { text: `${systemInstruction}\n\nسياق إضافي: ${additionalContext}\nالوظيفة المستهدفة: ${targetJob}\nاسم المرشح: ${candidateName}` }
          ],
        },
      ],
      generationConfig,
    });

    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
