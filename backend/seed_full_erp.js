const { pool } = require('./config/db');

const classesData = [
  { name: 'BCA 1st Year', degree: 'BCA', department: 'Computer Science', year_level: 1 },
  { name: 'BCA 2nd Year', degree: 'BCA', department: 'Computer Science', year_level: 2 },
  { name: 'BCA 3rd Year', degree: 'BCA', department: 'Computer Science', year_level: 3 },
  { name: 'BBA 1st Year', degree: 'BBA', department: 'Management', year_level: 1 },
  { name: 'BBA 2nd Year', degree: 'BBA', department: 'Management', year_level: 2 },
  { name: 'BBA 3rd Year', degree: 'BBA', department: 'Management', year_level: 3 },
  { name: 'B.Tech 1st Year', degree: 'B.Tech', department: 'Computer Science', year_level: 1 },
  { name: 'B.Tech 2nd Year', degree: 'B.Tech', department: 'Computer Science', year_level: 2 },
  { name: 'B.Tech 3rd Year', degree: 'B.Tech', department: 'Computer Science', year_level: 3 },
  { name: 'B.Tech 4th Year', degree: 'B.Tech', department: 'Computer Science', year_level: 4 },
];

const subjectsData = [
  // BCA 1st Year
  { name: 'Programming Fundamentals in C', code: 'BCA101', department: 'Computer Science', semester: 1, degree: 'BCA' },
  { name: 'Discrete Mathematics', code: 'BCA102', department: 'Computer Science', semester: 1, degree: 'BCA' },
  { name: 'Computer Fundamentals & IT', code: 'BCA103', department: 'Computer Science', semester: 1, degree: 'BCA' },
  { name: 'English & Technical Communication', code: 'BCA104', department: 'Computer Science', semester: 1, degree: 'BCA' },
  { name: 'Digital Electronics', code: 'BCA105', department: 'Computer Science', semester: 1, degree: 'BCA' },

  // BCA 2nd Year
  { name: 'Data Structures & Algorithms', code: 'BCA301', department: 'Computer Science', semester: 3, degree: 'BCA' },
  { name: 'Object Oriented Programming with C++', code: 'BCA302', department: 'Computer Science', semester: 3, degree: 'BCA' },
  { name: 'Database Management Systems', code: 'BCA303', department: 'Computer Science', semester: 3, degree: 'BCA' },
  { name: 'Computer Networks', code: 'BCA304', department: 'Computer Science', semester: 3, degree: 'BCA' },
  { name: 'Operating Systems', code: 'BCA305', department: 'Computer Science', semester: 3, degree: 'BCA' },

  // BCA 3rd Year
  { name: 'Web Technologies & Frameworks', code: 'BCA501', department: 'Computer Science', semester: 5, degree: 'BCA' },
  { name: 'Java Programming', code: 'BCA502', department: 'Computer Science', semester: 5, degree: 'BCA' },
  { name: 'Software Engineering', code: 'BCA503', department: 'Computer Science', semester: 5, degree: 'BCA' },
  { name: 'Cloud Computing', code: 'BCA504', department: 'Computer Science', semester: 5, degree: 'BCA' },
  { name: 'Major Project & Seminar', code: 'BCA505', department: 'Computer Science', semester: 5, degree: 'BCA' },

  // BBA 1st Year
  { name: 'Principles of Management', code: 'BBA101', department: 'Management', semester: 1, degree: 'BBA' },
  { name: 'Business Economics', code: 'BBA102', department: 'Management', semester: 1, degree: 'BBA' },
  { name: 'Financial Accounting', code: 'BBA103', department: 'Management', semester: 1, degree: 'BBA' },
  { name: 'Business Communication', code: 'BBA104', department: 'Management', semester: 1, degree: 'BBA' },
  { name: 'Business Mathematics', code: 'BBA105', department: 'Management', semester: 1, degree: 'BBA' },

  // BBA 2nd Year
  { name: 'Organizational Behavior', code: 'BBA301', department: 'Management', semester: 3, degree: 'BBA' },
  { name: 'Marketing Management', code: 'BBA302', department: 'Management', semester: 3, degree: 'BBA' },
  { name: 'Human Resource Management', code: 'BBA303', department: 'Management', semester: 3, degree: 'BBA' },
  { name: 'Cost & Management Accounting', code: 'BBA304', department: 'Management', semester: 3, degree: 'BBA' },
  { name: 'Business Statistics', code: 'BBA305', department: 'Management', semester: 3, degree: 'BBA' },

  // BBA 3rd Year
  { name: 'Strategic Management', code: 'BBA501', department: 'Management', semester: 5, degree: 'BBA' },
  { name: 'Financial Management', code: 'BBA502', department: 'Management', semester: 5, degree: 'BBA' },
  { name: 'International Business', code: 'BBA503', department: 'Management', semester: 5, degree: 'BBA' },
  { name: 'Entrepreneurship Development', code: 'BBA504', department: 'Management', semester: 5, degree: 'BBA' },
  { name: 'Corporate Governance & Ethics', code: 'BBA505', department: 'Management', semester: 5, degree: 'BBA' },

  // B.Tech 1st Year
  { name: 'Engineering Physics', code: 'BT101', department: 'Computer Science', semester: 1, degree: 'B.Tech' },
  { name: 'Engineering Mathematics I', code: 'BT102', department: 'Computer Science', semester: 1, degree: 'B.Tech' },
  { name: 'Basic Electrical Engineering', code: 'BT103', department: 'Computer Science', semester: 1, degree: 'B.Tech' },
  { name: 'Engineering Graphics & Design', code: 'BT104', department: 'Computer Science', semester: 1, degree: 'B.Tech' },
  { name: 'Programming for Problem Solving', code: 'BT105', department: 'Computer Science', semester: 1, degree: 'B.Tech' },

  // B.Tech 2nd Year
  { name: 'Data Structures using C++', code: 'BT301', department: 'Computer Science', semester: 3, degree: 'B.Tech' },
  { name: 'Computer Organization & Architecture', code: 'BT302', department: 'Computer Science', semester: 3, degree: 'B.Tech' },
  { name: 'Discrete Structures', code: 'BT303', department: 'Computer Science', semester: 3, degree: 'B.Tech' },
  { name: 'Object Oriented Programming', code: 'BT304', department: 'Computer Science', semester: 3, degree: 'B.Tech' },
  { name: 'Digital Systems & Logic Design', code: 'BT305', department: 'Computer Science', semester: 3, degree: 'B.Tech' },

  // B.Tech 3rd Year
  { name: 'Design & Analysis of Algorithms', code: 'BT501', department: 'Computer Science', semester: 5, degree: 'B.Tech' },
  { name: 'Database Systems', code: 'BT502', department: 'Computer Science', semester: 5, degree: 'B.Tech' },
  { name: 'Operating Systems', code: 'BT503', department: 'Computer Science', semester: 5, degree: 'B.Tech' },
  { name: 'Formal Language & Automata Theory', code: 'BT504', department: 'Computer Science', semester: 5, degree: 'B.Tech' },
  { name: 'Computer Networks', code: 'BT505', department: 'Computer Science', semester: 5, degree: 'B.Tech' },

  // B.Tech 4th Year
  { name: 'Compiler Design', code: 'BT701', department: 'Computer Science', semester: 7, degree: 'B.Tech' },
  { name: 'Artificial Intelligence & Machine Learning', code: 'BT702', department: 'Computer Science', semester: 7, degree: 'B.Tech' },
  { name: 'Information & Cyber Security', code: 'BT703', department: 'Computer Science', semester: 7, degree: 'B.Tech' },
  { name: 'Distributed Systems', code: 'BT704', department: 'Computer Science', semester: 7, degree: 'B.Tech' },
  { name: 'Capstone Major Project', code: 'BT705', department: 'Computer Science', semester: 7, degree: 'B.Tech' },
];

const feeStructuresData = [
  // BCA
  { class_name: 'BCA 1st Year', total: 50000, tuition: 44000, exam: 3000, library: 1500, other: 1500, desc: 'BCA 1st Year Annual Fee' },
  { class_name: 'BCA 2nd Year', total: 52000, tuition: 46000, exam: 3000, library: 1500, other: 1500, desc: 'BCA 2nd Year Annual Fee' },
  { class_name: 'BCA 3rd Year', total: 55000, tuition: 48000, exam: 3500, library: 1500, other: 2000, desc: 'BCA 3rd Year Annual Fee' },

  // BBA
  { class_name: 'BBA 1st Year', total: 45000, tuition: 40000, exam: 2500, library: 1200, other: 1300, desc: 'BBA 1st Year Annual Fee' },
  { class_name: 'BBA 2nd Year', total: 48000, tuition: 42000, exam: 2500, library: 1500, other: 2000, desc: 'BBA 2nd Year Annual Fee' },
  { class_name: 'BBA 3rd Year', total: 50000, tuition: 44000, exam: 3000, library: 1500, other: 1500, desc: 'BBA 3rd Year Annual Fee' },

  // B.Tech
  { class_name: 'B.Tech 1st Year', total: 65000, tuition: 58000, exam: 3500, library: 2000, other: 1500, desc: 'B.Tech 1st Year Annual Fee' },
  { class_name: 'B.Tech 2nd Year', total: 68000, tuition: 60000, exam: 4000, library: 2000, other: 2000, desc: 'B.Tech 2nd Year Annual Fee' },
  { class_name: 'B.Tech 3rd Year', total: 72000, tuition: 64000, exam: 4000, library: 2000, other: 2000, desc: 'B.Tech 3rd Year Annual Fee' },
  { class_name: 'B.Tech 4th Year', total: 75000, tuition: 66000, exam: 4500, library: 2000, other: 2500, desc: 'B.Tech 4th Year Annual Fee' },
];

async function seedFullErp() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Full ERP Database Seeding...');
    await client.query('BEGIN');

    // 1. Get or Create Active Academic Year (2026-2027)
    let ayRes = await client.query("SELECT id FROM academic_years WHERE year_name = '2026-2027'");
    let academicYearId;
    if (ayRes.rows.length === 0) {
      const newAy = await client.query(
        "INSERT INTO academic_years (year_name, start_date, end_date, is_active) VALUES ('2026-2027', '2026-04-01', '2027-03-31', true) RETURNING id"
      );
      academicYearId = newAy.rows[0].id;
    } else {
      academicYearId = ayRes.rows[0].id;
    }
    console.log(`✅ Active Academic Year: 2026-2027 [ID: ${academicYearId}]`);

    // 2. Insert Classes
    for (const c of classesData) {
      await client.query(
        `INSERT INTO classes (name, degree, department, year_level)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE 
         SET degree = EXCLUDED.degree, department = EXCLUDED.department, year_level = EXCLUDED.year_level`,
        [c.name, c.degree, c.department, c.year_level]
      );
    }
    console.log(`✅ Classes Seeded: ${classesData.length} classes`);

    // Fetch updated classes mapping
    const allClassesRes = await client.query('SELECT id, name, degree, year_level FROM classes');
    const classMapByName = {};
    const classMapByDegreeYear = {};
    allClassesRes.rows.forEach(c => {
      classMapByName[c.name] = c.id;
      if (c.degree && c.year_level) {
        classMapByDegreeYear[`${c.degree}_${c.year_level}`] = c.id;
      }
    });

    // 3. Insert Sections (A, B, C for each class)
    for (const c of allClassesRes.rows) {
      await client.query(
        `INSERT INTO sections (class_id, name)
         VALUES ($1, 'A'), ($1, 'B'), ($1, 'C')
         ON CONFLICT DO NOTHING`,
        [c.id]
      );
    }
    console.log('✅ Sections Seeded: A, B, C for all classes');

    // 4. Insert Subjects
    const subjectIdMapByCode = {};
    for (const s of subjectsData) {
      const subRes = await client.query(
        `INSERT INTO subjects (name, code, department, semester, degree)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO UPDATE 
         SET name = EXCLUDED.name, department = EXCLUDED.department, semester = EXCLUDED.semester, degree = EXCLUDED.degree
         RETURNING id`,
        [s.name, s.code, s.department, s.semester, s.degree]
      );
      subjectIdMapByCode[s.code] = subRes.rows[0].id;
    }
    console.log(`✅ Subjects Seeded: ${subjectsData.length} subjects`);

    // 5. Map Subjects to Classes in class_subjects
    await client.query('DELETE FROM class_subjects'); // Refresh clean mappings
    let mappedCount = 0;
    for (const s of subjectsData) {
      const yearLevel = Math.ceil(s.semester / 2);
      const key = `${s.degree}_${yearLevel}`;
      const classId = classMapByDegreeYear[key];

      if (classId && subjectIdMapByCode[s.code]) {
        await client.query(
          `INSERT INTO class_subjects (class_id, subject_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [classId, subjectIdMapByCode[s.code]]
        );
        mappedCount++;
      }
    }
    console.log(`✅ Class-Subject Mappings Created: ${mappedCount} mappings`);

    // 6. Insert Fee Structures
    for (const fs of feeStructuresData) {
      const classId = classMapByName[fs.class_name];
      if (classId) {
        // Delete existing fee structure for class to avoid duplicates
        await client.query(
          'DELETE FROM fee_structures WHERE class_id = $1 AND academic_year_id = $2',
          [classId, academicYearId]
        );
        await client.query(
          `INSERT INTO fee_structures 
            (class_id, academic_year_id, amount, tuition_fee, exam_fee, library_fee, other_fee, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [classId, academicYearId, fs.total, fs.tuition, fs.exam, fs.library, fs.other, fs.desc]
        );
      }
    }
    console.log(`✅ Fee Structures Created: ${feeStructuresData.length} structures`);

    await client.query('COMMIT');
    console.log('\n======================================================');
    console.log('  ✅ FULL ERP DATABASE SEEDING COMPLETED SUCCESSFULLY!  ');
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedFullErp();
