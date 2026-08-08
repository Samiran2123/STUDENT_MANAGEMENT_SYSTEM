const { pool } = require('./config/db');

async function seedSections() {
  try {
    const classes = await pool.query('SELECT * FROM classes');
    console.log('Found classes:', classes.rows.map(c => ({ id: c.id, name: c.name })));

    for (const c of classes.rows) {
      await pool.query(`
        INSERT INTO sections (class_id, name) VALUES
          ($1, 'A'),
          ($1, 'B'),
          ($1, 'C')
        ON CONFLICT DO NOTHING
      `, [c.id]);
    }

    const sections = await pool.query(`
      SELECT s.id, s.class_id, s.name as section_name, c.name as class_name
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      ORDER BY s.class_id, s.name
    `);
    console.log('Seeded Sections Total:', sections.rows.length);
    console.log(sections.rows);
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seedSections();
