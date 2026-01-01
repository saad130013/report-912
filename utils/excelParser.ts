
import * as XLSX from 'xlsx';
import { Worker, Inspector } from '../types';

export const parseWorkersExcel = async (file: File): Promise<Worker[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

        const workers: Worker[] = json.map((row) => {
          // Mandatory Logic based on user prompt and image
          const nameAr = row['NAME (AR)'] || row['اسم العامل'] || '';
          const nameEng = row['NAME (ENG)'] || '';
          const area = row['Area'] || row['AREA'] || row['المنطقة'] || 'غير مصنف';
          const zone = row['LOCATION'] || row['Zone'] || row['الموقع'] || 'غير محدد';

          // Additional fields from image
          const category = row['Category'] || row['الفئة'];
          const sNo = row['S No'] || row['م'];
          const gender = row['G'] || row['الجنس'];
          const nationality = row['Nationality'] || row['الجنسية'];
          const idNo = row['ID#'] || row['رقم الهوية'];
          const empNo = row['EMP'] || row['الرقم الوظيفي'];
          const company = row['COMPANY'] || row['الشركة'];
          const position = row['POSITION'] || row['المسمى الوظيفي'];
          const mrn = row['MRN'] || row['رقم السجل الطبي'];

          if (!nameAr && !nameEng) return null;
          
          return {
            nameAr: String(nameAr).trim(),
            nameEng: String(nameEng).trim(),
            area: String(area).trim(),
            zone: String(zone).trim(),
            category: category ? String(category).trim() : undefined,
            sNo: sNo,
            gender: gender ? String(gender).trim() : undefined,
            nationality: nationality ? String(nationality).trim() : undefined,
            idNo: idNo ? String(idNo).trim() : undefined,
            empNo: empNo ? String(empNo).trim() : undefined,
            company: company ? String(company).trim() : undefined,
            position: position ? String(position).trim() : undefined,
            mrn: mrn ? String(mrn).trim() : undefined
          };
        }).filter(w => w !== null) as Worker[];

        if (workers.length === 0) {
          throw new Error("لم يتم العثور على بيانات صالحة. تأكد من توافق الأعمدة مع الصورة.");
        }
        resolve(workers);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};

export const parseInspectorsExcel = async (file: File): Promise<Inspector[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];

        const inspectors: Inspector[] = json.map((row) => {
          const name = row['الاسم'] || row['اسم المفتش'] || row['Inspector Name'] || '';
          if (!name || String(name).trim() === '') return null;
          return {
            name: String(name).trim(),
            note: row['ملاحظة'] || row['Note']
          };
        }).filter(i => i !== null) as Inspector[];

        if (inspectors.length === 0) throw new Error("الملف فارغ أو لا يحتوي على أسماء مفتشين.");
        resolve(inspectors);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
};
