import { ClassSession } from '@/context/AttendanceContext';
import { ClassRegister } from '@/context/RegisterContext';
import { format, getDaysInMonth } from 'date-fns';
import { enrollmentIdsEqual } from '@/lib/enrollmentUtils';

export const exportToCSV = (sessions: ClassSession[], filename: string) => {
  // Create CSV content
  const headers = ['Date', 'Class Name', 'Enrollment Number', 'Time'];
  const rows: string[][] = [];

  sessions.forEach(session => {
    session.attendance.forEach(record => {
      rows.push([
        format(new Date(session.date), 'yyyy-MM-dd'),
        session.className,
        record.enrollmentNumber,
        format(new Date(record.timestamp), 'HH:mm:ss')
      ]);
    });
  });

  // Sort rows by date, class, enrollment number
  rows.sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    if (a[1] !== b[1]) return a[1].localeCompare(b[1]);
    return a[2].localeCompare(b[2], undefined, { numeric: true });
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

export const exportSessionToCSV = (session: ClassSession) => {
  const headers = ['S.No', 'Enrollment Number', 'Time'];
  const rows = session.attendance.map((record, index) => [
    (index + 1).toString(),
    record.enrollmentNumber,
    format(new Date(record.timestamp), 'HH:mm:ss')
  ]);

  const csvContent = [
    `Class: ${session.className}`,
    `Date: ${format(new Date(session.date), 'MMMM d, yyyy')}`,
    `Total Students: ${session.attendance.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const filename = `${session.className}_${format(new Date(session.date), 'yyyy-MM-dd')}`;
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

export const exportClassToCSV = (sessions: ClassSession[], className: string) => {
  const headers = ['Date', 'Enrollment Number', 'Time'];
  const rows: string[][] = [];

  sessions.forEach(session => {
    session.attendance.forEach(record => {
      rows.push([
        format(new Date(session.date), 'yyyy-MM-dd'),
        record.enrollmentNumber,
        format(new Date(record.timestamp), 'HH:mm:ss')
      ]);
    });
  });

  // Sort by date then enrollment number
  rows.sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    return a[1].localeCompare(b[1], undefined, { numeric: true });
  });

  const totalAttendance = sessions.reduce((sum, s) => sum + s.attendance.length, 0);

  const csvContent = [
    `Class: ${className}`,
    `Total Sessions: ${sessions.length}`,
    `Total Attendance: ${totalAttendance}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(csvContent, `${className}_attendance.csv`, 'text/csv');
};

// Register Export functions - Traditional format with dates as columns
export const exportRegisterToCSV = (register: ClassRegister, month: Date) => {
  const daysInMonth = getDaysInMonth(month);
  const monthName = format(month, 'MMMM yyyy');
  
  // Create header row: Roll No, Name, 1, 2, 3, ..., 31, Total
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  const headers = ['Roll No', 'Name', ...dayHeaders, 'Total'];
  
  const rows = register.students.map(student => {
    const row = [student.rollNumber, student.name];
    let total = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = format(new Date(month.getFullYear(), month.getMonth(), day), 'yyyy-MM-dd');
       const isPresent = (register.attendance[dateStr] || []).some(e => enrollmentIdsEqual(e, student.enrollmentNumber));
      row.push(isPresent ? 'P' : '');
      if (isPresent) total++;
    }
    
    row.push(total.toString());
    return row;
  });

  const csvContent = [
    `Class Register: ${register.className}`,
    `Month: ${monthName}`,
    `Total Students: ${register.students.length}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const filename = `${register.className}_Register_${format(month, 'yyyy-MM')}`;
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

export const exportRegisterToPDF = (register: ClassRegister, month: Date) => {
  const daysInMonth = getDaysInMonth(month);
  const monthName = format(month, 'MMMM yyyy');
  
  const title = `Class Register - ${register.className}`;
  const subtitle = `Month: ${monthName}`;
  const summary = `Total Students: ${register.students.length}`;
  
  // Create header row
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  const headers = ['Roll', 'Name', ...dayHeaders, 'Total'];
  
  const rows = register.students.map(student => {
    const row = [student.rollNumber, student.name];
    let total = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = format(new Date(month.getFullYear(), month.getMonth(), day), 'yyyy-MM-dd');
       const isPresent = (register.attendance[dateStr] || []).some(e => enrollmentIdsEqual(e, student.enrollmentNumber));
      row.push(isPresent ? 'P' : '-');
      if (isPresent) total++;
    }
    
    row.push(total.toString());
    return row;
  });

  generateRegisterPDF(title, subtitle, summary, headers, rows, 
    `${register.className}_Register_${format(month, 'yyyy-MM')}`);
};

// PDF Export functions
export const exportSessionToPDF = (session: ClassSession) => {
  const title = `Attendance Report - ${session.className}`;
  const subtitle = `Date: ${format(new Date(session.date), 'MMMM d, yyyy')}`;
  const summary = `Total Students Present: ${session.attendance.length}`;
  
  const tableHeaders = ['S.No', 'Enrollment Number', 'Time'];
  const tableRows = session.attendance.map((record, index) => [
    (index + 1).toString(),
    record.enrollmentNumber,
    format(new Date(record.timestamp), 'HH:mm:ss')
  ]);

  generatePDF(title, subtitle, summary, tableHeaders, tableRows, 
    `${session.className}_${format(new Date(session.date), 'yyyy-MM-dd')}`);
};

export const exportClassToPDF = (sessions: ClassSession[], className: string) => {
  const title = `Attendance Report - ${className}`;
  const subtitle = `Total Sessions: ${sessions.length}`;
  const totalAttendance = sessions.reduce((sum, s) => sum + s.attendance.length, 0);
  const summary = `Total Attendance Records: ${totalAttendance}`;
  
  const tableHeaders = ['S.No', 'Date', 'Enrollment Number', 'Time'];
  const rows: string[][] = [];
  
  sessions.forEach(session => {
    session.attendance.forEach(record => {
      rows.push([
        format(new Date(session.date), 'yyyy-MM-dd'),
        record.enrollmentNumber,
        format(new Date(record.timestamp), 'HH:mm:ss')
      ]);
    });
  });

  // Sort by date then enrollment number
  rows.sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    return a[1].localeCompare(b[1], undefined, { numeric: true });
  });

  const tableRows = rows.map((row, index) => [(index + 1).toString(), ...row]);

  generatePDF(title, subtitle, summary, tableHeaders, tableRows, `${className}_attendance`);
};

export const exportToPDF = (sessions: ClassSession[], filename: string) => {
  const title = 'Complete Attendance Report';
  const subtitle = `Generated on: ${format(new Date(), 'MMMM d, yyyy')}`;
  const totalAttendance = sessions.reduce((sum, s) => sum + s.attendance.length, 0);
  const summary = `Total Sessions: ${sessions.length} | Total Attendance: ${totalAttendance}`;
  
  const tableHeaders = ['S.No', 'Date', 'Class', 'Enrollment Number', 'Time'];
  const rows: string[][] = [];
  
  sessions.forEach(session => {
    session.attendance.forEach(record => {
      rows.push([
        format(new Date(session.date), 'yyyy-MM-dd'),
        session.className,
        record.enrollmentNumber,
        format(new Date(record.timestamp), 'HH:mm:ss')
      ]);
    });
  });

  // Sort rows
  rows.sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    if (a[1] !== b[1]) return a[1].localeCompare(b[1]);
    return a[2].localeCompare(b[2], undefined, { numeric: true });
  });

  const tableRows = rows.map((row, index) => [(index + 1).toString(), ...row]);

  generatePDF(title, subtitle, summary, tableHeaders, tableRows, filename);
};

const generateRegisterPDF = (
  title: string, 
  subtitle: string, 
  summary: string, 
  headers: string[], 
  rows: string[][], 
  filename: string
) => {
  // Create HTML content for register-style PDF (landscape for many columns)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: landscape;
          margin: 15mm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
          font-size: 10px;
        }
        h1 {
          color: #0d9488;
          margin-bottom: 5px;
          font-size: 16px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 3px;
          font-size: 12px;
        }
        .summary {
          color: #666;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #0d9488;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 9px;
        }
        th {
          background-color: #0d9488;
          color: white;
          padding: 6px 3px;
          text-align: center;
          font-weight: 600;
          font-size: 8px;
        }
        th:first-child, th:nth-child(2) {
          text-align: left;
          min-width: 60px;
        }
        td {
          padding: 5px 3px;
          border: 1px solid #ddd;
          text-align: center;
        }
        td:first-child, td:nth-child(2) {
          text-align: left;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .present {
          color: #0d9488;
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          color: #999;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
      <p class="summary">${summary}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map((cell, i) => `<td${cell === 'P' ? ' class="present"' : ''}>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p class="footer">Generated by QR Attendance System</p>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

const generatePDF = (
  title: string, 
  subtitle: string, 
  summary: string, 
  headers: string[], 
  rows: string[][], 
  filename: string
) => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
        }
        h1 {
          color: #0d9488;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 5px;
        }
        .summary {
          color: #666;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #0d9488;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #0d9488;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
        }
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #f0f0f0;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
      <p class="summary">${summary}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p class="footer">Generated by QR Attendance System</p>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
