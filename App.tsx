import React, { useState, useMemo } from 'react';
import { 
  FileUp, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Download,
  Stethoscope,
  LayoutDashboard,
  CheckSquare,
  FileDown,
  MousePointer2,
  Zap,
  UserPlus,
  MapPin,
  ChevronLeft,
  Heart
} from 'lucide-react';
import { Worker, Inspector, Assignment, PlanConfig, PlanCycle, AreaData } from './types';
import { parseWorkersExcel, parseInspectorsExcel } from './utils/excelParser';
import { distributePlans } from './utils/scheduler';
import { exportToWord } from './utils/wordExporter';
import { printAssignments } from './utils/pdfPrinter';

const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PlanConfig>({
    cycle: PlanCycle.WEEKLY,
    startDate: new Date().toISOString().split('T')[0]
  });
  
  const [finalAssignments, setFinalAssignments] = useState<Assignment[]>([]);
  const [selectedManualInspector, setSelectedManualInspector] = useState<string>('');
  const [selectedManualAreas, setSelectedManualAreas] = useState<string[]>([]);

  const availableAreas = useMemo(() => {
    const areaMap: Record<string, AreaData> = {};
    workers.forEach(w => {
      if (!areaMap[w.area]) {
        areaMap[w.area] = { name: w.area, totalWorkers: 0, zones: [] };
      }
      let zoneObj = areaMap[w.area].zones.find(z => z.name === w.zone);
      if (!zoneObj) {
        zoneObj = { name: w.zone, workers: [] };
        areaMap[w.area].zones.push(zoneObj);
      }
      zoneObj.workers.push(w);
      areaMap[w.area].totalWorkers += 1;
    });
    return Object.values(areaMap);
  }, [workers]);

  const handleWorkersUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await parseWorkersExcel(file);
      setWorkers(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل ملف العمالة');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectorsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await parseInspectorsExcel(file);
      setInspectors(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل ملف المفتشين');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = () => {
    if (mode === 'auto') {
      const result = distributePlans(workers, inspectors);
      setFinalAssignments(result);
      setStep(3);
    } else {
      if (!selectedManualInspector || selectedManualAreas.length === 0) {
        setError('يرجى اختيار مفتش ومنطقة واحدة على الأقل');
        return;
      }
      setStep(3);
    }
  };

  const getManualAssignment = (): Assignment[] => {
    const inspector = inspectors.find(i => i.name === selectedManualInspector);
    if (!inspector) return [];
    const areas = availableAreas.filter(a => selectedManualAreas.includes(a.name));
    const totalWorkers = areas.reduce((sum, a) => sum + a.totalWorkers, 0);
    return [{ inspector, areas, totalWorkers }];
  };

  const currentAssignments = mode === 'auto' ? finalAssignments : getManualAssignment();

  const handlePDFExport = (inspectorName: string | null) => {
    printAssignments(currentAssignments, config, inspectorName);
  };

  const handleWordExport = (inspectorName: string | null) => {
    exportToWord(currentAssignments, config, inspectorName);
  };

  const toggleManualArea = (areaName: string) => {
    setSelectedManualAreas(prev => 
      prev.includes(areaName) ? prev.filter(a => a !== areaName) : [...prev, areaName]
    );
  };

  return (
    <div className="min-h-screen pb-20 no-print flex flex-col">
      <nav className="bg-white px-6 py-4 sticky top-0 z-50 glass-morphism shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-700 p-2 rounded-xl text-white shadow-lg shadow-green-200">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-none">إدارة الخدمات البيئية بمستشفى الحرس الوطني</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">حقوق البرنامج: ليلى سفر العتيبي</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="bg-slate-100 p-1 rounded-xl flex">
                <button 
                  onClick={() => setMode('auto')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${mode === 'auto' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500'}`}
                >
                  <Zap size={14} /> توزيع تلقائي
                </button>
                <button 
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500'}`}
                >
                  <MousePointer2 size={14} /> اختيار يدوي
                </button>
             </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 mt-8 flex-grow">
        {error && (
          <div className="max-w-xl mx-auto bg-red-50 border-r-4 border-red-500 p-4 mb-8 flex items-center gap-3 text-red-700 rounded-xl shadow-sm">
            <AlertCircle size={20} />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-800 mb-3">تجهيز بيانات التفتيش</h2>
              <p className="text-slate-500 font-medium">ارفع ملفات (Area & Wards) للمتابعة</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="step-card bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                  <Users size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">كشف العمالة</h3>
                <label className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all">
                    <FileUp size={32} className="text-slate-400" />
                    <span className="text-slate-600 font-black text-sm">اختر ملف Excel</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleWorkersUpload} />
                  </div>
                </label>
                {workers.length > 0 && (
                  <div className="mt-6 flex items-center gap-2 text-green-600 font-black text-sm bg-green-50 p-4 rounded-xl border border-green-100">
                    <CheckCircle2 size={18} />
                    <span>تم التعرف على {workers.length} سجل</span>
                  </div>
                )}
              </div>

              <div className="step-card bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                  <CheckSquare size={28} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">كشف المفتشين</h3>
                <label className="block w-full cursor-pointer">
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all">
                    <FileUp size={32} className="text-slate-400" />
                    <span className="text-slate-600 font-black text-sm">اختر ملف Excel</span>
                    <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleInspectorsUpload} />
                  </div>
                </label>
                {inspectors.length > 0 && (
                  <div className="mt-6 flex items-center gap-2 text-purple-600 font-black text-sm bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <CheckCircle2 size={18} />
                    <span>تم تسجيل {inspectors.length} مفتش</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-12">
              <button 
                onClick={() => setStep(2)}
                disabled={workers.length === 0 || inspectors.length === 0}
                className="bg-green-700 hover:bg-green-800 disabled:bg-slate-300 text-white px-20 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-green-200 transition-all active:scale-95 disabled:shadow-none"
              >
                المتابعة للإعداد
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-xl text-green-700">
                  <LayoutDashboard size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">إعداد تقرير التفتيش ({mode === 'auto' ? 'تلقائي' : 'يدوي'})</h2>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setMode('auto')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${mode === 'auto' ? 'bg-white shadow-sm text-green-700' : 'text-slate-400'}`}>تلقائي</button>
                 <button onClick={() => setMode('manual')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-green-700' : 'text-slate-400'}`}>يدوي</button>
              </div>
            </div>

            {mode === 'manual' ? (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-50">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><UserPlus size={20} className="text-green-600" /> 1. اختر المفتش</h3>
                  <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2">
                    {inspectors.map(ins => (
                      <button
                        key={ins.name}
                        onClick={() => setSelectedManualInspector(ins.name)}
                        className={`w-full text-right p-4 rounded-xl font-bold border-2 transition-all ${
                          selectedManualInspector === ins.name ? 'border-green-700 bg-green-50 text-green-800 shadow-md' : 'border-slate-50 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        {ins.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 bg-white p-8 rounded-[2rem] shadow-lg border border-slate-50">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><MapPin size={20} className="text-red-500" /> 2. حدد الـ Areas والمواقع التابعة لها</h3>
                  <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-2">
                    {availableAreas.map(area => (
                      <div
                        key={area.name}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedManualAreas.includes(area.name) ? 'border-green-700 bg-green-50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                        onClick={() => toggleManualArea(area.name)}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-black text-lg text-slate-800">{area.name}</p>
                            <p className="text-xs text-green-700 font-bold">{area.totalWorkers} موظف إجمالي</p>
                          </div>
                          {selectedManualAreas.includes(area.name) && <CheckCircle2 size={24} className="text-green-700" />}
                        </div>
                        
                        <div className="bg-white/50 rounded-xl p-3 border border-green-100/50">
                          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">المواقع المشمولة (Wards):</p>
                          <div className="flex flex-wrap gap-2">
                            {area.zones.map(z => (
                              <span key={z.name} className="bg-green-100/50 text-green-800 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-200/50">
                                {z.name} ({z.workers.length})
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-[2rem] shadow-lg border border-slate-50 text-center">
                 <div className="max-w-md mx-auto py-10">
                    <Zap size={48} className="text-green-600 mx-auto mb-6" />
                    <h3 className="text-xl font-black mb-2">التوزيع التلقائي الذكي</h3>
                    <p className="text-slate-500 font-bold text-sm mb-8">سيقوم النظام بتوزيع جميع المناطق ({availableAreas.length}) على المفتشين المتاحين ({inspectors.length}) لضمان العدالة وتغطية كاملة للمستشفى.</p>
                 </div>
              </div>
            )}

            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl">
              <div className="grid md:grid-cols-2 gap-10">
                <div>
                  <label className="block text-sm font-black text-slate-400 mb-4 uppercase tracking-widest">نوع الدورة</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(PlanCycle).map(c => (
                      <button
                        key={c}
                        onClick={() => setConfig({ ...config, cycle: c })}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all border-2 ${
                          config.cycle === c ? 'bg-white text-slate-900 border-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-400 mb-4 uppercase tracking-widest">تاريخ البدء</label>
                  <input 
                    type="date"
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white font-black outline-none focus:border-green-700 transition-all"
                  />
                </div>
              </div>
              <div className="mt-10 pt-10 border-t border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between">
                 <div className="text-right">
                    {mode === 'manual' && selectedManualInspector && (
                       <p className="font-bold text-green-400">سيتم إصدار تقرير للمفتش: <span className="text-white underline">{selectedManualInspector}</span></p>
                    )}
                 </div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={() => setStep(1)} className="flex-1 md:px-10 py-5 border-2 border-slate-700 text-slate-400 font-black rounded-2xl hover:bg-slate-800 transition-all">رجوع</button>
                    <button onClick={generatePlan} className="flex-[2] md:px-20 py-5 bg-green-700 text-white font-black rounded-2xl hover:bg-green-800 shadow-xl shadow-green-500/20 transition-all">
                      توليد الخطة
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-800">التقارير الجاهزة</h2>
                <p className="text-slate-500 font-bold mt-1">المناطق المكلفة تم تجميعها حسب الـ AREA والـ Wards التابعة لها.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {mode === 'auto' && (
                  <button onClick={() => handlePDFExport(null)} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl text-sm">
                    <FileDown size={18} /> حفظ PDF الشامل
                  </button>
                )}
                <button onClick={() => setStep(2)} className="text-green-700 px-6 py-4 font-black hover:bg-green-50 rounded-2xl transition-all text-sm">تعديل التوزيع</button>
              </div>
            </div>

            <div className="grid gap-6">
              {currentAssignments.map((assign, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-center gap-8 shadow-sm hover:shadow-2xl transition-all duration-300 group">
                  <div className="bg-slate-50 group-hover:bg-green-50 p-6 rounded-[2rem] flex items-center justify-center min-w-[200px] text-center transition-colors">
                    <div>
                      <span className="text-[10px] text-green-700 font-black uppercase tracking-widest block mb-2">المفتش المسؤول</span>
                      <h3 className="text-xl font-black text-slate-800">{assign.inspector.name}</h3>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    <div className="bg-slate-50/50 p-4 rounded-2xl text-center">
                      <p className="text-slate-400 text-[10px] font-black mb-1">المناطق (Areas)</p>
                      <p className="text-2xl font-black text-slate-800">{assign.areas.length}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl text-center">
                      <p className="text-slate-400 text-[10px] font-black mb-1">المواقع (Wards)</p>
                      <p className="text-2xl font-black text-green-700">
                        {assign.areas.reduce((acc, a) => acc + a.zones.length, 0)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 text-[10px] font-black mb-2">المناطق الرئيسية المكلف بها:</p>
                      <div className="flex flex-wrap gap-2">
                        {assign.areas.map((a, i) => (
                          <span key={i} className="bg-white text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-slate-200">{a.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
                    <button onClick={() => handlePDFExport(assign.inspector.name)} className="flex-1 flex items-center justify-center gap-2 bg-green-700 text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-green-800 transition-all shadow-lg shadow-green-100">
                      <FileDown size={16} /> PDF
                    </button>
                    <button onClick={() => handleWordExport(assign.inspector.name)} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-xs font-black hover:bg-slate-50 transition-all">
                      <Download size={16} /> Word
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 bg-slate-50 border-t border-slate-200 no-print">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 font-bold flex items-center justify-center gap-2">
            تم التطوير بواسطة <Heart size={14} className="text-red-500 fill-current" /> ليلى سفر العتيبي
          </p>
          <p className="text-slate-400 text-xs mt-1">إدارة الخدمات البيئية بمستشفى الحرس الوطني - جميع الحقوق محفوظة &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;