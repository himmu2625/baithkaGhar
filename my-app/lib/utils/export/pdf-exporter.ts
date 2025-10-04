import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to PDF format with table
 */
export function exportToPDF(
  data: any[],
  title: string,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
    columnStyles?: Record<string, any>;
  }
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const doc = new jsPDF({
    orientation: options?.orientation || 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Prepare table data
  const headers = Object.keys(data[0]);
  const tableData = data.map(row => headers.map(header => row[header] ?? ''));

  // Add table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: options?.columnStyles || {},
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 35, left: 14, right: 14 }
  });

  // Save PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export analytics chart as PDF
 */
export function exportChartToPDF(
  chartElement: HTMLElement,
  title: string,
  filename: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Add date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Convert chart to image and add to PDF
  import('html2canvas').then(({ default: html2canvas }) => {
    html2canvas(chartElement).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, 'PNG', 14, 35, imgWidth, imgHeight);
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  });
}
