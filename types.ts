
export interface Scorecard {
  technical: number;
  experience: number;
  location: number;
  cost: number;
  stability: number;
  integrity: number;
}

export interface InferredSoftSkill {
  name: string;
  score: number;
  description: string;
}

export interface StrategicPoint {
  title: string;
  description: string;
  tag: string; 
  impactOrMitigation: string; 
}

export interface Discrepancy {
  id: string;
  field: string;
  userInput: string;
  cvDetected: string;
  cvSnippet: string; 
  severity: 'high' | 'medium';
}

export interface InterviewQuestion {
  question: string;
  target: string;
  expectedAnswerHint: string;
  category: 'technical' | 'integrity' | 'behavioral';
}

export interface AnalysisResult {
  matchScore: number;
  scorecard: Scorecard;
  isFit: boolean;
  suitabilityLabel: string;
  meritJudgment: "مستحق بجدارة" | "مستحق بتحفظ" | "غير مستحق حالياً";
  operationalRisk: number; 
  aiFinalRecommendation: 'Hire' | 'No Hire' | 'Waitlist' | 'Potential Hire' | 'Partial Fit';
  recommendationWhy: string; 
  summary: string;
  softSkills: InferredSoftSkill[];
  strengths: StrategicPoint[];
  weaknesses: StrategicPoint[];
  priorityFlags: {
    isSaudi: boolean;
    transferableIqama: boolean;
    rareSkills: boolean;
    iqamaExpired: boolean;
  };
  estimatedJoiningDate: string;
  discrepancies: Discrepancy[];
  interviewGuide: InterviewQuestion[];
  salaryBenchmark: {
    status: string;
    marketRange: string;
    analysis: string;
    suggestedSalary: string;
    comparisonWithExpected: string; 
  };
  alternatives: {
    jobTitle: string;
    score: number;
    reason: string;
  }[];
}

export type JobTitle = string; 

export const JOB_LIST: string[] = [];
