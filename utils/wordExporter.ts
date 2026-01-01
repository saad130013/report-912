
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, PageOrientation, ShadingType } from 'docx';
import * as FileSaverNamespace from 'file-saver';
import { Assignment, PlanConfig } from '../types';

const saveAs = (FileSaverNamespace as any).saveAs || (FileSaverNamespace as any).default || FileSaverNamespace;

export const exportToWord = async (assignments: Assignment[], config: PlanConfig, filterName: string | null = null) => {
  const targetAssignments = filterName 
    ? assignments.filter(a => a.inspector.name === filterName)
    : assignments;

  const sections = targetAssignments.map(assign => {
    const children: any[] = [
      new Paragraph({
        children: [new TextRun({ text: "جدول تفتيش العمالة - التقرير الرسمي", bold: true, size: 36, color: "1E3A8A" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `المفتش: ${assign.inspector.name}`, bold: true, size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `الخطة: ${config.cycle} | البداية: ${config.startDate}`, size: 18, color: "64748B" })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 300 },
      }),
    ];

    assign.areas.forEach(area => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `المنطقة الرئيسية: ${area.name} (إجمالي: ${area.totalWorkers})`, bold: true, size: 22, color: "FFFFFF" })],
          shading: { fill: "1E3A8A", type: ShadingType.CLEAR },
          spacing: { before: 200, after: 100 },
          alignment: AlignmentType.RIGHT,
        })
      );

      area.zones.forEach(zone => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `الموقع (Zone): ${zone.name}`, bold: true, size: 18 })],
            spacing: { before: 100, after: 50 },
            alignment: AlignmentType.RIGHT,
          })
        );

        const tableRows = [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: "م", bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: "الاسم", bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: "ID#", bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: "الرقم الوظيفي", bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: "الشركة", bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: "المسمى", bold: true })] }),
            ],
          })
        ];

        zone.workers.forEach((w, i) => {
          tableRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: String(w.sNo || (i + 1)) })] }),
                new TableCell({ children: [new Paragraph({ text: w.nameAr || w.nameEng })] }),
                new TableCell({ children: [new Paragraph({ text: w.idNo || "-" })] }),
                new TableCell({ children: [new Paragraph({ text: w.empNo || "-" })] }),
                new TableCell({ children: [new Paragraph({ text: w.company || "-" })] }),
                new TableCell({ children: [new Paragraph({ text: w.position || "-" })] }),
              ],
            })
          );
        });

        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        }));
      });
    });

    children.push(new Paragraph({ text: "", spacing: { before: 500 } }));
    children.push(new Paragraph({
      children: [new TextRun({ text: "توقيع المفتش: ___________________          اعتماد الإدارة: ___________________", size: 20 })],
      alignment: AlignmentType.CENTER,
    }));

    return {
      properties: {
        page: {
          orientation: PageOrientation.LANDSCAPE,
          margin: { top: 400, right: 400, bottom: 400, left: 400 },
        }
      },
      children: children,
    };
  });

  const doc = new Document({
    sections: sections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `تقرير_تفتيش_${filterName || 'شامل'}.docx`);
};
