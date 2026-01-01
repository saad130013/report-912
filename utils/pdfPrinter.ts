
import { Assignment, PlanConfig } from '../types';

export const printAssignments = (assignments: Assignment[], config: PlanConfig, filterName: string | null = null) => {
  const targetAssignments = filterName 
    ? assignments.filter(a => a.inspector.name === filterName)
    : assignments;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة التقرير');
    return;
  }

  const title = filterName ? `تقرير_تفتيش_${filterName}` : 'تقرير_تفتيش_شامل';
  
  const content = targetAssignments.map(assign => `
    <div class="page-break">
      <div class="header">
        <div class="header-right">
          <h1>جدول مهام تفتيش العمالة</h1>
          <div class="meta-box">
            <div class="meta-item">
              <span class="label">المفتش المسؤول:</span>
              <span class="value">${assign.inspector.name}</span>
            </div>
            <div class="meta-item">
              <span class="label">دورة التفتيش:</span>
              <span class="value">${config.cycle}</span>
            </div>
          </div>
        </div>
        <div class="header-left">
          <p class="hospital-name">مستشفى الرعاية الذكية</p>
          <p>تاريخ البدء: ${config.startDate}</p>
          <p>إجمالي العمالة: ${assign.totalWorkers}</p>
        </div>
      </div>

      ${assign.areas.map(area => `
        <div class="area-section">
          <div class="area-banner">
            <h2>المنطقة الرئيسية (AREA): ${area.name}</h2>
            <span>${area.zones.length} مواقع | ${area.totalWorkers} عامل</span>
          </div>
          
          ${area.zones.map(zone => `
            <div class="zone-wrapper">
              <div class="zone-header">الموقع (Zone): ${zone.name} | عدد العمال: ${zone.workers.length}</div>
              <table>
                <thead>
                  <tr>
                    <th>م</th>
                    <th>الاسم (AR)</th>
                    <th>ID#</th>
                    <th>الرقم الوظيفي</th>
                    <th>الشركة</th>
                    <th>المسمى الوظيفي</th>
                    <th>الجنسية</th>
                    <th>الجنس</th>
                  </tr>
                </thead>
                <tbody>
                  ${zone.workers.map((worker, index) => `
                    <tr>
                      <td class="center">${worker.sNo || (index + 1)}</td>
                      <td class="font-bold">${worker.nameAr || worker.nameEng}</td>
                      <td>${worker.idNo || '-'}</td>
                      <td>${worker.empNo || '-'}</td>
                      <td>${worker.company || '-'}</td>
                      <td>${worker.position || '-'}</td>
                      <td>${worker.nationality || '-'}</td>
                      <td class="center">${worker.gender || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      `).join('')}

      <div class="footer-signatures">
        <div class="signature">
          <p class="sig-label">توقيع المفتش</p>
          <div class="sig-line"></div>
          <p class="sig-name">${assign.inspector.name}</p>
        </div>
        <div class="signature">
          <p class="sig-label">اعتماد المشرف العام</p>
          <div class="sig-line"></div>
          <p class="sig-name">ختم الإدارة</p>
        </div>
      </div>
    </div>
  `).join('');

  printWindow.document.write(`
    <html dir="rtl" lang="ar">
    <head>
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; color: #1a202c; font-size: 11px; }
        @page { size: A4 landscape; margin: 8mm; }
        .page-break { page-break-after: always; padding: 10px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1a202c; padding-bottom: 10px; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 22px; font-weight: 900; color: #1e3a8a; }
        .hospital-name { color: #2563eb; font-weight: 700; font-size: 16px; margin: 0; }
        .meta-box { display: flex; gap: 15px; margin-top: 10px; }
        .meta-item { background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .label { font-size: 10px; color: #64748b; display: block; font-weight: bold; }
        .value { font-size: 13px; font-weight: 900; color: #1e293b; }
        
        .area-section { margin-bottom: 20px; }
        .area-banner { background: #1e3a8a; color: white; padding: 8px 15px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .area-banner h2 { margin: 0; font-size: 16px; font-weight: 700; }
        
        .zone-wrapper { margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; }
        .zone-header { background: #f1f5f9; padding: 6px 12px; font-weight: 900; border-bottom: 1px solid #cbd5e1; color: #334155; }
        
        table { width: 100%; border-collapse: collapse; background: white; }
        th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px; text-align: right; font-size: 10px; font-weight: 900; color: #475569; }
        td { border: 1px solid #cbd5e1; padding: 6px; font-size: 10px; vertical-align: middle; }
        .font-bold { font-weight: 700; }
        .center { text-align: center; }
        
        .footer-signatures { display: flex; justify-content: space-around; margin-top: 30px; }
        .signature { text-align: center; width: 200px; }
        .sig-label { font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 30px; }
        .sig-line { border-top: 1.5px solid #1e293b; width: 100%; margin-bottom: 5px; }
        .sig-name { font-weight: 900; font-size: 12px; }
        
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .area-banner { background-color: #1e3a8a !important; color: white !important; }
          .zone-header { background-color: #f1f5f9 !important; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
            window.onafterprint = () => window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};
