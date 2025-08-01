import jsPDF from 'jspdf';

interface InvoiceItem {
  date: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  projectName: string;
  fromDate: string;
  toDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export function generateInvoicePDF(invoiceData: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Colors
  const primaryColor = [59, 130, 246]; // Primary blue
  const darkGray = [51, 65, 85]; // Slate-700
  const lightGray = [148, 163, 184]; // Slate-400
  
  // Header
  doc.setFontSize(28);
  doc.setTextColor(...primaryColor);
  doc.text('INVOICE', 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(...darkGray);
  doc.text(`Invoice #${invoiceData.invoiceNumber}`, 20, 45);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 55);
  
  // From/To Section
  let yPos = 80;
  
  // From
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('From:', 20, yPos);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Dr. Sarah Chen', 20, yPos + 15);
  doc.text('Statistical Consultant', 20, yPos + 25);
  doc.text('123 University Ave', 20, yPos + 35);
  doc.text('City, State 12345', 20, yPos + 45);
  doc.text('sarah.chen@email.com', 20, yPos + 55);
  
  // To
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('To:', pageWidth / 2, yPos);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(invoiceData.clientName, pageWidth / 2, yPos + 15);
  doc.text('Client Address', pageWidth / 2, yPos + 25);
  doc.text('City, State 12345', pageWidth / 2, yPos + 35);
  
  // Project Details
  yPos += 80;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Project: ${invoiceData.projectName}`, 20, yPos);
  doc.text(`Period: ${invoiceData.fromDate} to ${invoiceData.toDate}`, 20, yPos + 15);
  
  // Table Header
  yPos += 40;
  const tableHeaders = ['Date', 'Description', 'Hours', 'Rate', 'Amount'];
  const colWidths = [30, 80, 20, 25, 25];
  let xPos = 20;
  
  // Header background
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.rect(20, yPos - 8, pageWidth - 40, 15, 'F');
  
  // Header text
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...darkGray);
  
  tableHeaders.forEach((header, index) => {
    doc.text(header, xPos, yPos);
    xPos += colWidths[index];
  });
  
  // Table Rows
  yPos += 15;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  
  invoiceData.items.forEach((item, index) => {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 30;
    }
    
    xPos = 20;
    const rowData = [
      item.date,
      item.description.length > 40 ? item.description.substring(0, 37) + '...' : item.description,
      item.hours.toFixed(1),
      `$${item.rate.toFixed(2)}`,
      `$${item.amount.toFixed(2)}`
    ];
    
    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos - 8, pageWidth - 40, 12, 'F');
    }
    
    rowData.forEach((data, colIndex) => {
      if (colIndex === 2 || colIndex === 3 || colIndex === 4) {
        // Right align numbers
        const textWidth = doc.getTextWidth(data);
        doc.text(data, xPos + colWidths[colIndex] - textWidth - 2, yPos);
      } else {
        doc.text(data, xPos, yPos);
      }
      xPos += colWidths[colIndex];
    });
    
    yPos += 12;
  });
  
  // Totals
  yPos += 20;
  const totalsX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  
  // Subtotal
  doc.text('Subtotal:', totalsX - 30, yPos);
  doc.text(`$${invoiceData.subtotal.toFixed(2)}`, totalsX, yPos);
  
  // Tax
  yPos += 15;
  doc.text(`Tax (${invoiceData.taxRate}%):`, totalsX - 30, yPos);
  doc.text(`$${invoiceData.taxAmount.toFixed(2)}`, totalsX, yPos);
  
  // Total
  yPos += 20;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX - 30, yPos);
  doc.setTextColor(...primaryColor);
  doc.text(`$${invoiceData.total.toFixed(2)}`, totalsX, yPos);
  
  // Footer
  const footerY = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.text('Thank you for your business!', 20, footerY);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - 60, footerY);
  
  // Save the PDF
  doc.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
}
