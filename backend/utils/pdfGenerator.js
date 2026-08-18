const PDFDocument = require('pdfkit');

/**
 * Generate a professional Student Attendance PDF Report
 * 
 * @param {Object} student - Student profile info
 * @param {Object} summary - Attendance aggregate totals
 * @param {Array} courses - Course-wise breakdown array
 * @param {Stream} outputStream - Express res or writable stream
 */
function generateStudentAttendancePDF(student, summary, courses, outputStream) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Attendance Report - ${student.name || 'Student'}`,
      Author: 'Student Management ERP System',
      Subject: 'Official Student Attendance Report',
    },
  });

  doc.pipe(outputStream);

  const primaryColor = '#1e293b'; // Slate dark
  const accentColor = '#4f46e5';  // Indigo
  const successColor = '#059669'; // Emerald
  const dangerColor = '#dc2626';  // Red
  const mutedColor = '#64748b';   // Slate muted
  const lightBg = '#f8fafc';      // Light slate
  const borderColor = '#cbd5e1';  // Light border

  const pageWidth = 595.28;
  const leftMargin = 40;
  const contentWidth = pageWidth - leftMargin * 2;

  // ── HEADER ──────────────────────────────────────────────────
  doc
    .rect(leftMargin, 35, contentWidth, 70)
    .fillAndStroke(lightBg, borderColor);

  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(accentColor)
    .text('CAMPUS ERP - STUDENT ATTENDANCE REPORT', leftMargin + 15, 48, {
      width: contentWidth - 30,
      align: 'center',
    });

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(mutedColor)
    .text(`Official Academic Record  |  Generated on: ${currentDate}`, leftMargin + 15, 78, {
      width: contentWidth - 30,
      align: 'center',
    });

  let curY = 120;

  // ── STUDENT INFORMATION SECTION ─────────────────────────────
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('STUDENT INFORMATION', leftMargin, curY);

  curY += 18;

  // Background card for student info
  doc
    .rect(leftMargin, curY, contentWidth, 90)
    .fillAndStroke('#ffffff', borderColor);

  const col1X = leftMargin + 15;
  const col2X = leftMargin + 260;
  let infoY = curY + 12;

  const renderInfoRow = (label1, val1, label2, val2, y) => {
    // Col 1
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(mutedColor).text(label1, col1X, y);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text(val1 || '—', col1X + 85, y, { width: 145 });

    // Col 2
    if (label2) {
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(mutedColor).text(label2, col2X, y);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text(val2 || '—', col2X + 85, y, { width: 145 });
    }
  };

  renderInfoRow('Student Name:', student.name, 'Class:', student.class_name || `${student.degree || 'BCA'} Sem ${student.semester || 1}`, infoY);
  infoY += 17;
  renderInfoRow('Student ID:', student.student_code || `STU${student.id}`, 'Section:', student.section_name || 'A', infoY);
  infoY += 17;
  renderInfoRow('Roll Number:', student.roll_number, 'Semester:', `Semester ${student.semester || 1}`, infoY);
  infoY += 17;
  renderInfoRow('Degree / Dept:', `${student.degree || 'BCA'} - ${student.department || 'Computer Science'}`, 'Academic Year:', student.academic_year_name || '2026-2027', infoY);

  curY += 105;

  // ── ATTENDANCE SUMMARY SECTION ──────────────────────────────
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('ATTENDANCE SUMMARY', leftMargin, curY);

  curY += 18;

  const cardWidth = (contentWidth - 30) / 4;
  const cards = [
    { label: 'Total Classes', val: summary.total_classes || 0, color: primaryColor },
    { label: 'Present', val: summary.present || 0, color: successColor },
    { label: 'Absent', val: summary.absent || 0, color: dangerColor },
    {
      label: 'Attendance Rate',
      val: `${summary.attendance_percentage || 0}%`,
      color: parseFloat(summary.attendance_percentage || 0) >= 75 ? successColor : dangerColor,
    },
  ];

  cards.forEach((card, idx) => {
    const cardX = leftMargin + idx * (cardWidth + 10);
    doc.rect(cardX, curY, cardWidth, 55).fillAndStroke(lightBg, borderColor);

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(mutedColor)
      .text(card.label.toUpperCase(), cardX, curY + 10, { width: cardWidth, align: 'center' });

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(card.color)
      .text(String(card.val), cardX, curY + 26, { width: cardWidth, align: 'center' });
  });

  curY += 75;

  // ── COURSE-WISE ATTENDANCE SECTION ──────────────────────────
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('COURSE-WISE ATTENDANCE BREAKDOWN', leftMargin, curY);

  curY += 18;

  // Table header
  const tableHeaderHeight = 24;
  doc
    .rect(leftMargin, curY, contentWidth, tableHeaderHeight)
    .fillAndStroke(accentColor, accentColor);

  const cols = [
    { name: 'Course Title', x: leftMargin + 10, w: 200, align: 'left' },
    { name: 'Code', x: leftMargin + 215, w: 65, align: 'left' },
    { name: 'Total', x: leftMargin + 285, w: 50, align: 'center' },
    { name: 'Present', x: leftMargin + 340, w: 50, align: 'center' },
    { name: 'Absent', x: leftMargin + 395, w: 50, align: 'center' },
    { name: 'Presence %', x: leftMargin + 450, w: 60, align: 'right' },
  ];

  cols.forEach((col) => {
    doc
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text(col.name, col.x, curY + 7, { width: col.w, align: col.align });
  });

  curY += tableHeaderHeight;

  // Table Rows
  if (!courses || courses.length === 0) {
    doc
      .rect(leftMargin, curY, contentWidth, 30)
      .fillAndStroke('#ffffff', borderColor);

    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor(mutedColor)
      .text('No course attendance records found for this student.', leftMargin, curY + 9, {
        width: contentWidth,
        align: 'center',
      });
    curY += 30;
  } else {
    const rowHeight = 22;
    courses.forEach((course, idx) => {
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? '#ffffff' : '#f8fafc';

      doc.rect(leftMargin, curY, contentWidth, rowHeight).fillAndStroke(rowBg, borderColor);

      const pct = parseFloat(course.percentage || 0);
      const pctColor = pct >= 75 ? successColor : (pct >= 60 ? '#f59e0b' : dangerColor);

      // Course Name
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(course.course_name || 'General Course', cols[0].x, curY + 6, {
          width: cols[0].w,
          align: cols[0].align,
          lineBreak: false,
          ellipsis: true,
        });

      // Code
      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(mutedColor)
        .text(course.course_code || '—', cols[1].x, curY + 6, { width: cols[1].w, align: cols[1].align });

      // Total
      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(primaryColor)
        .text(String(course.total || 0), cols[2].x, curY + 6, { width: cols[2].w, align: cols[2].align });

      // Present
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(successColor)
        .text(String(course.present || 0), cols[3].x, curY + 6, { width: cols[3].w, align: cols[3].align });

      // Absent
      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor(dangerColor)
        .text(String(course.absent || 0), cols[4].x, curY + 6, { width: cols[4].w, align: cols[4].align });

      // %
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor(pctColor)
        .text(`${pct}%`, cols[5].x, curY + 6, { width: cols[5].w, align: cols[5].align });

      curY += rowHeight;
    });
  }

  // ── FOOTER & VERIFICATION ────────────────────────────────────
  curY = Math.max(curY + 25, 720);

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(mutedColor)
    .text(
      'Note: This document is a computer-generated official attendance record from the PostgreSQL ERP Database. Minimum 75% attendance is required for exam eligibility.',
      leftMargin,
      curY,
      { width: contentWidth, align: 'center' }
    );

  curY += 20;

  // Signature lines
  const sigWidth = 140;
  // Left: Faculty Incharge
  doc
    .moveTo(leftMargin + 20, curY + 25)
    .lineTo(leftMargin + 20 + sigWidth, curY + 25)
    .stroke(borderColor);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(mutedColor)
    .text('Academic Coordinator', leftMargin + 20, curY + 30, { width: sigWidth, align: 'center' });

  // Right: Principal / Dean
  doc
    .moveTo(pageWidth - leftMargin - sigWidth - 20, curY + 25)
    .lineTo(pageWidth - leftMargin - 20, curY + 25)
    .stroke(borderColor);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(mutedColor)
    .text('Dean / Administrator', pageWidth - leftMargin - sigWidth - 20, curY + 30, {
      width: sigWidth,
      align: 'center',
    });

  doc.end();
}

module.exports = {
  generateStudentAttendancePDF,
};
