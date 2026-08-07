import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiUser } from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const StudentCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await courseService.getAll({ limit: 100 });
      if (res.success) {
        setCourses(res.data || []);
      }
    } catch (err) {
      showToast.error('Failed to load enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Enrolled Academic Courses</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Courses available for your department and current semester curriculum.
        </p>
      </div>

      {loading ? (
        <Spinner text="Loading courses..." />
      ) : courses.length === 0 ? (
        <EmptyState title="No Courses Available" message="There are no courses listed for your semester yet." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {courses.map((c) => (
            <div key={c.id} className="glass-panel glass-panel-hover" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.82rem' }}>
                  {c.course_code}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem {c.semester}</span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                {c.course_name}
              </h3>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Department: <strong style={{ color: 'var(--text-main)' }}>{c.department}</strong></div>
                <div>Credits: <strong style={{ color: 'var(--text-main)' }}>{c.credits} Credits</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem', color: 'var(--secondary)', fontWeight: 600 }}>
                  <FiUser /> Instructor: {c.teacher_name || 'Unassigned'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCoursesPage;
