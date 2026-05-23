
import { jsPDF } from 'jspdf';
import { Project, File } from '../types';

export const exportToPDF = (project: Project, files: File[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(22);
  doc.text(project.name, 20, 20);
  
  // Table of Contents
  doc.setFontSize(14);
  doc.text("Table of Contents", 20, 40);
  
  let currentY = 50;
  files.forEach((file, index) => {
    doc.setFontSize(12);
    doc.text(`${index + 1}. ${file.name}`, 20, currentY);
    currentY += 10;
  });

  // Content
  files.forEach((file) => {
    doc.addPage();
    doc.setFontSize(16);
    doc.text(file.name, 20, 20);
    doc.setFontSize(12);
    
    // Split text to pages
    const lines = doc.splitTextToSize(file.content || "", 170);
    doc.text(lines, 20, 30);
  });

  doc.save(`${project.name}.pdf`);
};
