
import React, { useState, useMemo } from 'react';
import { 
  FileUp, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  Users,
  FileText,
  Info,
  Download,
  Stethoscope,
  LayoutDashboard,
  CheckSquare,
  FileDown,
  MousePointer2,
  Zap,
  UserPlus,
  MapPin
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
  
  // Auto mode results
  const [finalAssignments, setFinalAssignments] = useState<Assignment[]>([]);
  
  // Manual mode state
  const [selectedManualInspector, setSelectedManualInspector] = useState<string>('');
  const [selectedManualAreas, setSelectedManualAreas] = useState<string[]>([]);

  // Derived data for manual mode
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
      // Fix: Push the whole worker object 'w' instead of 'w.workerName' 
      // which was causing the undefined error in reports
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
      // Manual Mode validation
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
    
    return [{
      inspector,
      areas,
      totalWorkers
    }];
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
    <div className="min-h-screen pb-20 no-print">
      {/* Navbar */}
      <nav className="bg-white px-6 py-4 sticky top-0 z-50 glass-morphism shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-none">مستشفى الرعاية الذكية</h1>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">إدارة الجودة والتفتيش</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <div className="bg-slate-100 p-1 rounded-xl flex">
                <button 
                  onClick={() => setMode('auto')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${mode === 'auto' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                  <Zap size={14} /> توزيع تلقائي
                </button>
                <button 
                  onClick={() => setMode('manual')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                >
                  <MousePointer2 size={14} /> اختيار يدوي
                </button>
             </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 mt-8">
        {error && (
          <div className="max-w-xl mx-auto bg-red-50 border-r-4 border-red-500 p-4 mb-8 flex items-center gap-3 text-red-700 rounded-xl shadow-sm">
            <AlertCircle size={20} />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {/* Step 1: Uploads */}
        {step === 1 && (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-slate-800 mb-3">تجهيز بيانات التفتيش</h2>
              <p className="text-slate-500 font-medium">ارفع كشوفات العمالة والمفتشين للمتابعة</p>
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
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-20 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:shadow-none"
              >
                المتابعة للإعداد
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Config / Manual Selection */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                  <LayoutDashboard size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">إعداد تقرير التفتيش ({mode === 'auto' ? 'تلقائي' : 'يدوي'})</h2>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setMode('auto')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${mode === 'auto' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>تلقائي</button>
                 <button onClick={() => setMode('manual')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>يدوي</button>
              </div>
            </div>

            {mode === 'manual' ? (
              <div className="grid md:grid-cols-3 gap-8">
                {/* Manual: Inspector Select */}
                <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-50">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><UserPlus size={20} className="text-blue-500" /> 1. اختر المفتش</h3>
                  <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
                    {inspectors.map(ins => (
                      <button
                        key={ins.name}
                        onClick={() => setSelectedManualInspector(ins.name)}
                        className={`w-full text-right p-4 rounded-xl font-bold border-2 transition-all ${
                          selectedManualInspector === ins.name ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-md' : 'border-slate-50 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        {ins.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual: Areas Selection */}
                <div className="md:col-span-2 bg-white p-8 rounded-[2rem] shadow-lg border border-slate-50">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><MapPin size={20} className="text-red-500" /> 2. حدد المناطق المكلف بها</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2">
                    {availableAreas.map(area => (
                      <button
                        key={area.name}
                        onClick={() => toggleManualArea(area.name)}
                        className={`text-right p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                          selectedManualAreas.includes(area.name) ? 'border-blue-600 bg-blue-50' : 'border-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex-1">
                          <p className={`font-black ${selectedManualAreas.includes(area.name) ? 'text-blue-900' : 'text-slate-700'}`}>{area.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">{area.totalWorkers} عامل | {area.zones.length} مواقع</p>
                        </div>
                        {selectedManualAreas.includes(area.name) && <CheckCircle2 size={20} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-[2rem] shadow-lg border border-slate-50 text-center">
                 <div className="max-w-md mx-auto py-10">
                    <Zap size={48} className="text-blue-500 mx-auto mb-6" />
                    <h3 className="text-xl font-black mb-2">التوزيع التلقائي الذكي</h3>
                    <p className="text-slate-500 font-bold text-sm mb-8">سيقوم النظام بتوزيع جميع المناطق ({availableAreas.length}) على المفتشين المتاحين ({inspectors.length}) لضمان العدالة وتغطية كاملة للمستشفى.</p>
                 </div>
              </div>
            )}

            {/* General Config Footer */}
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
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white font-black outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="mt-10 pt-10 border-t border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between">
                 <div className="text-right">
                    {mode === 'manual' && selectedManualInspector && (
                       <p className="font-bold text-blue-400">سيتم إصدار تقرير للمفتش: <span className="text-white underline">{selectedManualInspector}</span></p>
                    )}
                    {mode === 'manual' && selectedManualAreas.length > 0 && (
                       <p className="text-xs font-bold text-slate-500 mt-1">المناطق المختارة يدوياً: {selectedManualAreas.length} منطقة</p>
                    )}
                 </div>
                 <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={() => setStep(1)} className="flex-1 md:px-10 py-5 border-2 border-slate-700 text-slate-400 font-black rounded-2xl hover:bg-slate-800 transition-all">رجوع</button>
                    <button onClick={generatePlan} className="flex-[2] md:px-20 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">
                      {mode === 'auto' ? 'توليد الخطة كاملة' : 'إصدار التقرير المخصص'}
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Final Reports Dashboard */}
        {step === 3 && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-800">التقارير الجاهزة</h2>
                <p className="text-slate-500 font-bold mt-1">الوضع المستخدم: {mode === 'auto' ? 'تلقائي' : 'يدوي مخصص'}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {mode === 'auto' && (
                  <button 
                    onClick={() => handlePDFExport(null)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-xl text-sm"
                  >
                    <FileDown size={18} />
                    حفظ PDF الشامل
                  </button>
                )}
                <button 
                  onClick={() => setStep(2)}
                  className="text-blue-600 px-6 py-4 font-black hover:bg-blue-50 rounded-2xl transition-all text-sm"
                >
                  {mode === 'auto' ? 'تعديل التوزيع' : 'تغيير المفتش / المناطق'}
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {currentAssignments.map((assign, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-center gap-8 shadow-sm hover:shadow-2xl transition-all duration-300 group">
                  <div className="bg-slate-50 group-hover:bg-blue-50 p-6 rounded-[2rem] flex items-center justify-center min-w-[200px] text-center transition-colors">
                    <div>
                      <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest block mb-2">المفتش المسؤول</span>
                      <h3 className="text-xl font-black text-slate-800">{assign.inspector.name}</h3>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    <div className="bg-slate-50/50 p-4 rounded-2xl">
                      <p className="text-slate-400 text-[10px] font-black mb-1">المناطق</p>
                      <p className="text-2xl font-black text-slate-800">{assign.areas.length}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl">
                      <p className="text-slate-400 text-[10px] font-black mb-1">العمالة</p>
                      <p className="text-2xl font-black text-blue-600">{assign.totalWorkers}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 text-[10px] font-black mb-2">النطاق المكلف به</p>
                      <div className="flex flex-wrap gap-2">
                        {assign.areas.map((a, i) => (
                          <span key={i} className="bg-white text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-slate-200">{a.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
                    <button 
                      onClick={() => handlePDFExport(assign.inspector.name)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <FileDown size={16} />
                      PDF عرضي
                    </button>
                    <button 
                      onClick={() => handleWordExport(assign.inspector.name)}
                      className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-xs font-black hover:bg-slate-50 transition-all"
                    >
                      <Download size={16} />
                      Word
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
