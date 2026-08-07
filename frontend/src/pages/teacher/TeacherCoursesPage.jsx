import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiCheckSquare, FiAward } from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const TeacherCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  const fetchTeacherCourses = async () => {
    setLoading(true);
    try {
      const res = await courseService.getAll({ limit: 100 });
      if (res.success) {
        setCourses(res.data || []);
      }
    } catch (err) {
      showToast.error('Failed to load assigned courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Assigned Courses</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Courses assigned to you for instruction, attendance tracking, and grading.
        </p>
      </div>

      {loading ? (
        <Spinner text="Loading courses..." />
      ) : courses.length === 0 ? (
        <EmptyState title="No Courses Assigned" message="You currently have no course sections assigned to your account." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {courses.map((c) => (
            <div key={c.id} className="glass-panel glass-panel-hover" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.82rem' }}>
                    {c.course_code}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem {c.semester}</span>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  {c.course_name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Department: <strong style={{ color: 'var(--text-main)' }}>{c.department}</strong> • {c.credits} Credits
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <Link
                  to={`/teacher/attendance`}
                  className="gradient-accent"
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FiCheckSquare /> Take Attendance
                </Link>

                <Link
                  to={`/teacher/marks`}
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', color: '#fff', fontWeight: 600, fontSize: '0.82rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <FiAward /> Upload Marks
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherCoursesPage;
