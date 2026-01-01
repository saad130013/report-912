
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
    <div class="inspector-page">
      <div class="header no-break">
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
          <p class="hospital-name">إدارة الخدمات البيئية بمستشفى الحرس الوطني</p>
          <div class="print-meta">
            <p>تاريخ البدء: ${config.startDate}</p>
            <p>إجمالي العمالة: ${assign.totalWorkers}</p>
          </div>
          <p class="credits">حقوق البرنامج: ليلى سفر العتيبي</p>
        </div>
      </div>

      <div class="areas-container">
        ${assign.areas.map(area => `
          <div class="area-group">
            <div class="area-banner">
              <div class="area-title">
                <span class="label-white">المنطقة الرئيسية (AREA):</span>
                <span class="area-name">${area.name}</span>
              </div>
              <div class="area-stats">
                <span>${area.zones.length} مواقع/أجنحة</span>
                <span class="separator">|</span>
                <span>${area.totalWorkers} عامل إجمالي</span>
              </div>
            </div>
            
            <div class="zones-container">
              ${area.zones.map(zone => `
                <div class="zone-card">
                  <div class="zone-header">
                    <span>الموقع/الجناح (Ward): <strong>${zone.name}</strong></span>
                    <span class="zone-count">عدد العمال: ${zone.workers.length}</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 35px;">م</th>
                        <th style="width: 200px;">الاسم (AR)</th>
                        <th>ID#</th>
                        <th>الرقم الوظيفي</th>
                        <th>الشركة</th>
                        <th>المسمى الوظيفي</th>
                        <th>الجنسية</th>
                        <th style="width: 45px;">الجنس</th>
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
          </div>
        `).join('')}
      </div>

      <div class="footer-signatures no-break">
        <div class="signature">
          <p class="sig-label">توقيع المفتش المسؤول</p>
          <div class="sig-line"></div>
          <p class="sig-name">${assign.inspector.name}</p>
        </div>
        <div class="signature">
          <p class="sig-label">اعتماد إدارة الخدمات البيئية</p>
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
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
        body { 
          font-family: 'Cairo', sans-serif; 
          margin: 0; 
          padding: 0; 
          color: #1e293b; 
          font-size: 11px;
          background: white;
        }
        @page { 
          size: A4 landscape; 
          margin: 10mm; 
        }
        .inspector-page { 
          page-break-after: always; 
          padding-bottom: 20px;
        }
        .inspector-page:last-child { page-break-after: auto; }

        .no-break { page-break-inside: avoid; }

        .header { 
          display: flex; 
          justify-content: space-between; 
          border-bottom: 3px solid #15803d; 
          padding-bottom: 15px; 
          margin-bottom: 20px; 
          align-items: flex-start;
        }
        h1 { margin: 0; font-size: 24px; font-weight: 900; color: #15803d; letter-spacing: -0.5px; }
        .hospital-name { color: #15803d; font-weight: 700; font-size: 14px; margin: 0 0 5px 0; }
        .print-meta { font-size: 10px; color: #475569; display: flex; gap: 15px; }
        .credits { font-size: 8px; color: #94a3b8; margin-top: 8px; font-weight: bold; }

        .meta-box { display: flex; gap: 12px; margin-top: 10px; }
        .meta-item { background: #f1f5f9; padding: 6px 14px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .label { font-size: 9px; color: #64748b; display: block; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-size: 14px; font-weight: 900; color: #0f172a; }

        .area-group { 
          margin-bottom: 25px; 
          page-break-inside: auto;
        }
        
        .area-banner { 
          background: #15803d; 
          color: white; 
          padding: 10px 20px; 
          border-radius: 10px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 15px;
          page-break-inside: avoid;
          page-break-after: avoid; /* يمنع انفصال العنوان عن الجداول */
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .area-title { display: flex; flex-direction: column; }
        .label-white { font-size: 10px; font-weight: 600; opacity: 0.9; }
        .area-name { font-size: 18px; font-weight: 900; }
        .area-stats { font-size: 12px; font-weight: 700; display: flex; gap: 10px; align-items: center; }
        .separator { opacity: 0.5; }

        .zone-card { 
          margin-bottom: 20px; 
          border: 1px solid #e2e8f0; 
          border-radius: 10px; 
          overflow: hidden; 
          page-break-inside: avoid; /* يضمن بقاء الجدول الواحد في صفحة واحدة إن أمكن */
        }
        .zone-header { 
          background: #f8fafc; 
          padding: 10px 15px; 
          font-weight: 700; 
          border-bottom: 1px solid #e2e8f0; 
          color: #334155;
          font-size: 13px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .zone-count { background: #15803d; color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px; }

        table { width: 100%; border-collapse: collapse; background: white; table-layout: fixed; }
        th { 
          background: #f1f5f9; 
          border: 1px solid #e2e8f0; 
          padding: 8px; 
          text-align: right; 
          font-size: 10px; 
          font-weight: 800; 
          color: #475569;
        }
        td { 
          border: 1px solid #e2e8f0; 
          padding: 8px; 
          font-size: 10px; 
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .font-bold { font-weight: 700; color: #0f172a; }
        .center { text-align: center; }

        .footer-signatures { 
          display: flex; 
          justify-content: space-around; 
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
        }
        .signature { text-align: center; width: 280px; }
        .sig-label { font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 45px; }
        .sig-line { border-top: 2px solid #334155; width: 100%; margin-bottom: 8px; }
        .sig-name { font-weight: 900; font-size: 13px; color: #0f172a; }

        @media print {
          body { margin: 0; }
          .inspector-page { margin: 0; }
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
