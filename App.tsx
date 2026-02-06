
import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, CheckCircle, Sparkles, Briefcase, FileDown, Printer,
  ShieldCheck, Target, DollarSign, ClipboardList, Moon, Sun, User,
  Banknote, HelpCircle, Award, BrainCircuit, Activity, FileText,
  AlertTriangle, Lock, CloudSun, ArrowLeftRight, MessageSquare,
  Lightbulb, ThumbsUp, ThumbsDown, ShieldAlert, LogOut
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';
import { AnalysisResult, Discrepancy, InterviewQuestion } from './types';
import { analyzeCV, CVContent } from './services/geminiService';
import { CircularProgress } from './components/CircularProgress';
import { useTheme } from './components/ThemeContext';

const AUTHORIZED_USERS = [
  { u: 'faisal', p: '391010', name: 'فيصل السني', role: 'الأدمن الرئيسي' },
  { u: 'turki', p: '123456', name: 'تركي', role: 'مدير HR' },
  { u: 'abdulaziz', p: '123456', name: 'عبدالعزيز', role: 'قسم التوظيف' },
  { u: 'deena', p: '123456', name: 'دينا', role: 'قسم التوظيف' }
];

const Signature: React.FC<{ lang: 'ar' | 'en' }> = ({ lang }) => {
  const { theme } = useTheme();
  return (
    <div className="fixed bottom-6 w-full flex justify-center z-[100] pointer-events-none no-print">
      <a
        href="https://www.linkedin.com/in/falsanea/"
        target="_blank"
        rel="noopener noreferrer"
        className={`
          pointer-events-auto px-6 py-3 rounded-full border backdrop-blur-xl
          transition-all duration-500 hover:scale-110 hover:shadow-2xl flex items-center gap-3 text-sm font-black
          ${theme === 'light' ? 'bg-white/95 border-slate-300 text-[#0F172A] shadow-xl shadow-slate-200/50' :
            theme === 'dark' ? 'bg-[#020617]/90 border-slate-700 text-[#F1F5F9] shadow-2xl' :
              'bg-[#1E1B4B]/95 border-indigo-400/40 text-[#E0E7FF] shadow-[0_0_30px_rgba(79,70,229,0.4)]'}
        `}
      >
        <span className="opacity-60">{lang === 'ar' ? 'تصميم وتطوير' : 'Designed & Developed by'}</span>
        <div className={`w-px h-4 ${theme === 'light' ? 'bg-[#0F172A]/20' : 'bg-white/20'}`} />
        <span className={theme === 'light' ? 'text-indigo-700' : 'text-indigo-300'}>
          {lang === 'ar' ? 'فيصل السني' : 'Faisal Alsanea'}
        </span>
      </a>
    </div>
  );
};

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex bg-black/10 backdrop-blur-xl p-1.5 rounded-2xl border border-current/10 no-print shadow-xl">
      <button onClick={() => setTheme('light')} className={`p-2 rounded-xl transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-md scale-110' : 'opacity-40 hover:opacity-100'}`}><Sun size={18} /></button>
      <button onClick={() => setTheme('dusk')} className={`p-2 rounded-xl transition-all ${theme === 'dusk' ? 'bg-indigo-600 text-white shadow-md scale-110' : 'opacity-40 hover:opacity-100'}`}><CloudSun size={18} /></button>
      <button onClick={() => setTheme('dark')} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-md scale-110' : 'opacity-40 hover:opacity-100'}`}><Moon size={18} /></button>
    </div>
  );
};

const App: React.FC = () => {
  const { theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  const [candidateName, setCandidateName] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [nationality, setNationality] = useState('سعودي');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [fileName, setFileName] = useState('');
  const [cvContent, setCvContent] = useState<CVContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = AUTHORIZED_USERS.find(x => x.u === loginUser.toLowerCase().trim() && x.p === loginPass);
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
      setLoginError('');
    }
    else setLoginError('بيانات الدخول غير صحيحة');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setResult(null);
    setFileName('');
    setCvContent(null);
    setCandidateName('');
    setTargetJob('');
    setExpectedSalary('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const mimeType = file.type;
    try {
      if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setCvContent({ inlineData: { data: base64, mimeType } });
        };
        reader.readAsDataURL(file);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        setCvContent({ text: res.value });
      } else {
        const text = await file.text();
        setCvContent({ text });
      }
    } catch (err) { setError('خطأ في قراءة الملف'); }
  };

  const handleAnalyze = async () => {
    if (!cvContent || !targetJob) { setError('يرجى التأكد من المسمى الوظيفي ورفع السيرة الذاتية'); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    setAnalysisStep('جاري استخراج بيانات السيرة الذاتية...');
    const step1 = setTimeout(() => setAnalysisStep('المحقق الفني يطابق المهارات مع متطلبات الكعكي...'), 1200);
    const step2 = setTimeout(() => setAnalysisStep('جاري تقدير الراتب العادل في سوق 2026...'), 2400);
    const step3 = setTimeout(() => setAnalysisStep('توليد دليل المقابلة والوظائف البديلة...'), 3600);

    try {
      const context = `الاسم: ${candidateName}, الوظيفة: ${targetJob}, الجنسية: ${nationality}, الراتب المتوقع: ${expectedSalary}`;
      const data = await analyzeCV(cvContent, targetJob, candidateName, context);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(`فشل التحليل: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
      clearTimeout(step1); clearTimeout(step2); clearTimeout(step3);
      setAnalysisStep('');
    }
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setLoading(true);
    setAnalysisStep('جاري تجهيز تقرير الكعكي بدقة عالية...');

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: theme === 'light' ? '#F8FAFC' : theme === 'dark' ? '#020617' : '#1E1B4B',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`AlKaaki_Professional_Analysis_${candidateName || 'Candidate'}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setError('فشل تصدير PDF. يرجى محاولة استخدام خيار "الطباعة" بدلاً من ذلك.');
    } finally {
      setLoading(false);
      setAnalysisStep('');
    }
  };

  const cardStyle = theme === 'light'
    ? 'bg-white border-[#0F172A]/15 shadow-xl transition-all duration-300 hover:shadow-2xl'
    : theme === 'dark'
      ? 'bg-[#020617]/80 border-white/10 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30'
      : 'bg-white/5 border-white/20 backdrop-blur-xl transition-all duration-300 hover:bg-white/10';

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-all duration-700">
        <form onSubmit={handleLogin} className={`max-w-md w-full p-12 rounded-[3.5rem] border z-10 animate-fade-in text-right ${cardStyle}`}>
          <div className="flex justify-between items-center mb-10">
            <ThemeSwitcher />
            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl"><ShieldCheck size={40} /></div>
          </div>
          <h2 className="text-3xl font-black mb-1">مجموعة الكعكي</h2>
          <p className="text-[10px] font-black opacity-40 mb-10 uppercase tracking-widest">Executive Intelligence Portal 2026</p>
          <div className="space-y-6">
            <div className="relative group">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} className={`w-full p-4 pr-12 rounded-2xl border font-black outline-none transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-black/20 border-white/10'}`} placeholder="اسم المستخدم" required />
            </div>
            <div className="relative group">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
              <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className={`w-full p-4 pr-12 rounded-2xl border font-black outline-none transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-black/20 border-white/10'}`} placeholder="كلمة المرور" required />
            </div>
            {loginError && <div className="text-rose-500 text-xs font-black text-center">{loginError}</div>}
            <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-xl">دخول النظام</button>
          </div>
        </form>
        <Signature lang="ar" />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-all duration-700">
      <header className={`p-6 border-b sticky top-0 z-50 glass-effect no-print ${theme === 'light' ? 'border-slate-300 bg-white/90' : 'border-white/10 bg-current/10'}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeSwitcher />

            <div className="flex items-center gap-4 border-r border-current/10 pr-6">
              <button
                onClick={handleLogout}
                className={`p-3 rounded-2xl transition-all border flex items-center justify-center gap-2 group hover:scale-105 active:scale-95 ${theme === 'light' ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white'}`}
                title="تسجيل الخروج"
              >
                <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden md:block font-black text-xs">خروج</span>
              </button>

              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-tighter">{currentUser?.role}</p>
                <h3 className="font-black text-sm">{currentUser?.name}</h3>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter">مساعد الكعكي الذكي 2026</h1>
            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest hidden sm:block">Smart Audit Engine v12.0</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3 space-y-8 no-print sticky top-32 h-fit">
          <div className={`p-8 rounded-[3rem] border ${cardStyle}`}>
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-indigo-400"><ClipboardList /> مدخلات التحقيق</h2>
            <div className="space-y-6 text-right">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">اسم المرشح</label>
                <input type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none font-bold ${theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-black/30 border-white/10'}`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">الوظيفة المستهدفة</label>
                <input type="text" value={targetJob} onChange={e => setTargetJob(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none font-black ${theme === 'light' ? 'bg-indigo-50' : 'bg-indigo-900/20 border-indigo-500/30'}`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">رفع السيرة الذاتية</label>
                <div className={`p-8 border-2 border-dashed rounded-[2rem] text-center cursor-pointer transition-all ${fileName ? 'border-emerald-500 bg-emerald-500/5' : 'border-current/20'}`}>
                  <input type="file" id="cv-upload" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="cv-upload" className="cursor-pointer block">
                    <Upload className="mx-auto mb-3 opacity-40" size={24} />
                    <p className="text-[10px] font-black truncate">{fileName || 'ملف PDF / DOCX'}</p>
                  </label>
                </div>
              </div>
              <button onClick={handleAnalyze} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-500 disabled:opacity-50 transition-all active:scale-95">
                {loading ? 'جاري التحقيق...' : 'بدء التحليل الفني'}
              </button>
              {error && <div className="p-3 bg-rose-500/10 text-rose-500 text-[10px] font-black rounded-xl text-center">{error}</div>}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          {!result && !loading ? (
            <div className={`h-[600px] border-2 border-dashed rounded-[4rem] flex flex-col items-center justify-center ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
              <FileText size={120} className="opacity-10 mb-6" />
              <p className="text-3xl font-black opacity-20 tracking-tighter">بانتظار البيانات لبدء التحقيق</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-[600px] text-center">
              <Sparkles size={80} className="text-indigo-400 mb-8 animate-spin" />
              <p className="text-2xl font-black tracking-tight mb-4">{analysisStep}</p>
              <div className="w-64 h-2 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-[loading_2s_infinite]" style={{ width: '40%' }}></div>
              </div>
            </div>
          ) : result && (
            <div ref={reportRef} className="space-y-12 animate-fade-in animate-slide-up pb-28 relative text-right">
              {/* Profile Header */}
              <div className={`p-16 rounded-[5rem] border-b-[20px] border-indigo-600 flex flex-col md:flex-row justify-between items-center gap-16 relative overflow-hidden ${cardStyle}`}>
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full -translate-x-20 -translate-y-20" />
                <div className="text-right flex-1 z-10">
                  <div className="flex items-center gap-4 justify-end mb-8">
                    <span className="px-6 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black border border-indigo-500/20">Executive Dossier 2026</span>
                    {result.priorityFlags?.isSaudi && <span className="px-6 py-2 bg-emerald-600 text-white rounded-full text-xs font-black shadow-lg">كادر وطني</span>}
                  </div>
                  <h2 className="text-7xl font-black tracking-tighter leading-none mb-8">{candidateName || 'مرشح معتمد'}</h2>
                  <div className={`px-10 py-4 rounded-[2.5rem] border-2 inline-flex items-center gap-5 text-2xl font-black ${theme === 'light' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-100'}`}>
                    <Briefcase size={32} className="text-indigo-400" /> {targetJob}
                  </div>
                </div>
                <div className="relative z-10 p-4 bg-black/5 rounded-full border border-white/5 backdrop-blur-md">
                  <CircularProgress percentage={result.matchScore} size={300} strokeWidth={28} />
                </div>
              </div>

              {/* Rationale & Judgment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className={`p-12 rounded-[4.5rem] border relative overflow-hidden ${theme === 'light' ? 'bg-[#0F172A] text-[#F1F5F9]' : 'bg-indigo-600/20 border-indigo-500/40'}`}>
                  <h3 className="text-4xl font-black mb-10 tracking-tight flex items-center gap-5 justify-end">حكم المحقق الفني <ShieldCheck size={32} /></h3>
                  <div className="bg-black/30 p-10 rounded-[3rem] border border-white/10 backdrop-blur-2xl">
                    <p className="text-2xl font-bold leading-[2]">{result.meritJudgment}</p>
                  </div>
                </div>
                <div className={`p-12 rounded-[4.5rem] border flex flex-col items-center justify-center text-center ${cardStyle}`}>
                  <p className="text-xs font-black opacity-40 uppercase tracking-[0.4em] mb-12">التوصية النهائية</p>
                  <div className={`w-52 h-52 rounded-full flex items-center justify-center text-white text-5xl font-black shadow-2xl transition-all duration-700
                    ${result.matchScore >= 80 ? 'bg-emerald-600' : result.matchScore >= 50 ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                    {result.matchScore}%
                  </div>
                  <h4 className="text-4xl font-black mt-8 tracking-tighter">{result.suitabilityLabel}</h4>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className={`p-10 rounded-[3rem] border-t-[12px] border-emerald-500 relative overflow-hidden ${cardStyle}`}>
                  <div className="flex items-center gap-4 justify-end mb-8">
                    <h3 className="text-3xl font-black text-[#0F172A] dark:text-white">النقاط الحقيقية للقوة</h3>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                      <CheckCircle size={28} />
                    </div>
                  </div>
                  <div className="space-y-6">
                    {result.strengths?.map((s, idx) => (
                      <div key={idx} className="flex gap-4 items-start justify-end">
                        <div className="text-right flex-1">
                          <p className="text-sm font-bold opacity-80 leading-relaxed text-[#0F172A] dark:text-gray-300">{s.description}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>

                <section className={`p-10 rounded-[3rem] border-t-[12px] border-amber-500 relative overflow-hidden ${cardStyle}`}>
                  <div className="flex items-center gap-4 justify-end mb-8">
                    <h3 className="text-3xl font-black text-[#0F172A] dark:text-white">الفجوات ونقاط التحسين</h3>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                      <AlertTriangle size={28} />
                    </div>
                  </div>
                  <div className="space-y-6">
                    {result.weaknesses?.map((w, idx) => (
                      <div key={idx} className="flex gap-4 items-start justify-end">
                        <div className="text-right flex-1">
                          <p className="text-sm font-bold opacity-80 leading-relaxed text-[#0F172A] dark:text-gray-300">{w.description}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Smart Alternatives Section */}
              <section className={`p-12 rounded-[4rem] bg-[#0F172A] border border-white/5 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                <h3 className="text-3xl font-black mb-12 text-white flex items-center gap-5 justify-end z-10 relative">
                  بدائل ذكية (أنت أنسب لهذه الأدوار) <Sparkles className="text-indigo-400" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {result.alternatives?.map((alt, idx) => (
                    <div key={idx} className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between gap-6 mb-6">
                        <span className="px-6 py-2 bg-indigo-600 text-white rounded-full font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                          {alt.score}% مطابقة
                        </span>
                        <h4 className="text-3xl font-black text-white">{alt.jobTitle}</h4>
                      </div>
                      <p className="text-right text-gray-400 font-bold leading-relaxed">{alt.reason}</p>
                    </div>
                  ))}
                </div>
              </section>

              {result.discrepancies && result.discrepancies.length > 0 && (
                <section className={`p-10 rounded-[4rem] border ${cardStyle} border-rose-500/30`}>
                  <h3 className="text-3xl font-black mb-8 text-rose-500 flex items-center gap-4 justify-end">التعارضات المكتشفة <ShieldAlert /></h3>
                  <div className="space-y-4">
                    {result.discrepancies.map((d, idx) => (
                      <div key={idx} className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-[2rem]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black bg-rose-600 text-white px-3 py-1 rounded-full">{d.severity}</span>
                          <h4 className="font-black text-base">{d.field}</h4>
                        </div>
                        <p className="text-xs opacity-70">المكتشف: <span className="text-rose-500 font-bold">{d.cvDetected}</span></p>
                      </div>
                    ))}
                  </div>
                </section>
              )}


              {/* Interview Guide */}
              <section className={`p-12 rounded-[4.5rem] border ${cardStyle}`}>
                <h3 className="text-3xl font-black mb-12 flex items-center gap-4 justify-end text-[#0F172A] dark:text-white">دليل المقابلة الاستراتيجي <MessageSquare /></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {result.interviewGuide?.map((q, idx) => (
                    <div key={idx} className="p-8 bg-black/5 rounded-[3rem] border border-current/5 space-y-4">
                      <p className="text-xl font-black leading-relaxed text-[#0F172A] dark:text-gray-200">"{q.question}"</p>
                      <div className="flex items-start gap-4 p-4 bg-emerald-500/5 rounded-2xl">
                        <Lightbulb size={18} className="text-emerald-500 shrink-0 mt-1" />
                        <p className="text-sm font-bold opacity-80 text-[#0F172A] dark:text-gray-400">{q.expectedAnswerHint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className={`p-10 rounded-[3.5rem] border flex flex-col items-center justify-center text-center ${cardStyle}`}>
                  <Activity className="text-rose-500 mb-4" size={36} />
                  <div className="text-5xl font-black mb-2 text-[#0F172A] dark:text-white">{result.operationalRisk}%</div>
                  <p className="text-[10px] font-black opacity-50 uppercase tracking-widest text-[#0F172A] dark:text-gray-400">مخاطر التشغيل</p>
                </div>
                <div className={`p-10 rounded-[3.5rem] border flex flex-col items-center justify-center text-center ${cardStyle}`}>
                  <Banknote className="text-emerald-500 mb-4" size={36} />
                  <div className="text-2xl font-black mb-2 text-[#0F172A] dark:text-white">{result.salaryBenchmark?.suggestedSalary}</div>
                  <p className="text-[10px] font-black opacity-50 uppercase tracking-widest text-[#0F172A] dark:text-gray-400">الراتب المقترح 2026</p>
                </div>
                <div className={`p-10 rounded-[3.5rem] border flex flex-col items-center justify-center text-center ${cardStyle}`}>
                  <Target className="text-indigo-400 mb-4" size={36} />
                  <div className="text-2xl font-black mb-2 text-[#0F172A] dark:text-white">{result.aiFinalRecommendation}</div>
                  <p className="text-[10px] font-black opacity-50 uppercase tracking-widest text-[#0F172A] dark:text-gray-400">التوصية النهائية</p>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-8 py-16 no-print">
                <button onClick={() => window.print()} className={`flex items-center gap-5 px-16 py-8 rounded-[3rem] font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 ${theme === 'light' ? 'bg-white text-slate-800 border-4 border-slate-100' : 'bg-white/10 text-white border-2 border-white/10'}`}><Printer size={32} /> معاينة</button>
                <button onClick={exportPDF} className="flex items-center gap-5 px-16 py-8 bg-indigo-700 text-white rounded-[3rem] font-black text-xl hover:bg-indigo-600 transition-all shadow-2xl hover:scale-105 active:scale-95 border-2 border-indigo-500/30"><FileDown size={32} /> تصدير PDF</button>
              </div>
            </div>
          )}
        </main>
      </div >
      <Signature lang={lang} />
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          main { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
          .lg\\:col-span-9 { width: 100% !important; grid-column: span 12 / span 12 !important; }
          
          /* Remove glass effects and blurs for printing */
          .glass-effect, .backdrop-blur-xl, .backdrop-blur-md { 
            backdrop-filter: none !important; 
            background: white !important; 
            border-color: #e2e8f0 !important;
          }
          
          /* Ensure colors are printed */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Section breaks */
          section, .rounded-\\[5rem\\], .grid { 
            break-inside: avoid !important; 
            page-break-inside: avoid !important;
            margin-bottom: 2rem !important;
          }
          
          /* Force light theme colors for printing */
          .dark, .dusk { 
            background: white !important; 
            color: black !important; 
          }
          .dark .text-white, .dusk .text-white { color: #0f172a !important; }
          .dark .bg-\\[\\#0F172A\\], .dusk .bg-\\[\\#1E1B4B\\] { 
            background: #f8fafc !important; 
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div >
  );
};

export default App;
