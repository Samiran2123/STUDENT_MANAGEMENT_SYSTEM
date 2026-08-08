import React, { useState, useEffect, useCallback } from 'react';
import { FiAward } from 'react-icons/fi';
import { marksService } from '../../services/marksService';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const EXAM_TYPES = ['midterm', 'final', 'quiz', 'assignment', 'practical'];

const StudentMarksPage = () => {
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamType, setSelectedExamType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await marksService.getAll({
        page,
        limit: 15,
        exam_type: selectedExamType || undefined,
      });
      if (res.success) {
        setMarksList(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch {
      showToast.error('Failed to load marks report card');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExamType]); // Memoized via useCallback

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  let totalScore = 0;
  let totalMax = 0;
  marksList.forEach((m) => {
    totalScore += parseFloat(m.marks) || 0;
    totalMax += parseFloat(m.total_marks) || 0;
  });
  const overallPct = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : 'N/A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Academic Report Card</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Official evaluation transcripts for examinations, assignments, and quizzes.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAward style={{ color: 'var(--accent)', fontSize: '1.25rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aggregate Score</div>
            <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{overallPct}%</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
        <select
          value={selectedExamType}
          onChange={(e) => { setSelectedExamType(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Exam Types</option>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading grade transcript..." />
      ) : marksList.length === 0 ? (
        <EmptyState title="No Marks Entries" message="No exam grades recorded for your account." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Course Title</th>
                <th style={{ padding: '14px 18px' }}>Code</th>
                <th style={{ padding: '14px 18px' }}>Exam Type</th>
                <th style={{ padding: '14px 18px' }}>Score</th>
                <th style={{ padding: '14px 18px' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {marksList.map((item) => {
                const pct = ((item.marks / item.total_marks) * 100).toFixed(1);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>{item.course_name}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--primary)', fontWeight: 700 }}>{item.course_code}</td>
                    <td style={{ padding: '14px 18px', textTransform: 'capitalize', fontWeight: 600 }}>{item.exam_type}</td>
                    <td style={{ padding: '14px 18px', fontWeight: 700 }}>{item.marks} / {item.total_marks}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: pct >= 75 ? 'var(--success-bg)' : pct >= 50 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                        }}
                      >
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default StudentMarksPage;
