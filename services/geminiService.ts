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

  // استخدام الـ SDK الجديد والمحرك الموضح في صورتك من AI Studio
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  console.time("Gemini_Analysis_Time");
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

  const generationConfig = {
    temperature: 1,
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
        description: { type: SchemaType.STRING },
        strengths: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              impactOrMitigation: { type: SchemaType.STRING }
            }
          }
        },
        weaknesses: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              impactOrMitigation: { type: SchemaType.STRING }
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
              target: { type: SchemaType.STRING },
              expectedAnswerHint: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING }
            }
          }
        },
        priorityFlags: {
          type: SchemaType.OBJECT,
          properties: {
            isSaudi: { type: SchemaType.BOOLEAN },
            transferableIqama: { type: SchemaType.BOOLEAN }
          }
        },
        discrepancies: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              field: { type: SchemaType.STRING },
              cvDetected: { type: SchemaType.STRING },
              severity: { type: SchemaType.STRING }
            }
          }
        }
      },
      required: ["matchScore", "meritJudgment", "operationalRisk", "salaryBenchmark", "interviewGuide"]
    },
  };

  const tryGenerate = async (modelName: string) => {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
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
      return result.response.text();
    } catch (error) {
      console.warn(`Failed with model ${modelName}:`, error);
      return null;
    }
  };

  try {
    if (!content.inlineData && !content.text) {
      throw new Error("محتوى السيرة الذاتية فارغ أو غير صالح (Empty Content)");
    }

    // المحاولة الأولى: الموديل السريع والحديث
    let text = await tryGenerate("gemini-1.5-flash-latest");

    // المحاولة الثانية: الموديل المستقر (Fallback)
    if (!text) {
      console.log("Switching to fallback model (gemini-pro)...");
      text = await tryGenerate("gemini-pro");
    }

    if (!text) {
      throw new Error("فشل التحليل باستخدام جميع الموديلات المتاحة. يرجى التحقق من مفتاح API أو المحاولة لاحقاً.");
    }

    // Clean JSON if AI includes markdown backticks
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as AnalysisResult;

  } catch (error: any) {
    console.error("Gemini Analysis Error Full Object:", JSON.stringify(error, null, 2));
    if (error.message?.includes("400")) {
      throw new Error("طلب غير صالح (400) - ربما الملف كبير جداً أو تالف.");
    }
    throw error;
  }
};

