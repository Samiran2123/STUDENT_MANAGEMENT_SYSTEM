import React, { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiEye } from 'react-icons/fi';
import { studentService } from '../../services/studentService';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';

const DEPARTMENTS = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Electrical Engineering'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const TeacherStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentService.getAll({
        page,
        limit: 10,
        department: selectedDept || undefined,
        semester: selectedSem || undefined,
        search: search || undefined,
      });
      if (res.success) {
        setStudents(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error('Failed to load student directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, selectedDept, selectedSem, search]);

  const handleViewClick = (s) => {
    setSelectedStudent(s);
    setDetailModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Roster</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Browse students enrolled across departments and academic terms.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search student name or roll number..." />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        <select
          value={selectedSem}
          onChange={(e) => { setSelectedSem(e.target.value); setPage(1); }}
          style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner text="Loading students..." />
      ) : students.length === 0 ? (
        <EmptyState title="No Students Found" message="No student records match your criteria." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Roll No</th>
                <th style={{ padding: '14px 18px' }}>Student Name</th>
                <th style={{ padding: '14px 18px' }}>Department</th>
                <th style={{ padding: '14px 18px' }}>Semester</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--primary)' }}>{s.roll_number}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{s.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff' }}>{s.department}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>Sem {s.semester}</td>
                  <td style={{ padding: '14px 18px' }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleViewClick(s)}
                      style={{ padding: '6px 12px', color: 'var(--secondary)', backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                    >
                      <FiEye /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Student Details Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Student Profile: ${selectedStudent?.name}`}>
        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll Number</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedStudent.roll_number}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Department</div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{selectedStudent.department}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Semester & Year</div>
                <div style={{ fontWeight: 600, color: '#fff' }}>Sem {selectedStudent.semester} ({selectedStudent.year})</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email</div>
              <div style={{ fontWeight: 600, color: '#fff' }}>{selectedStudent.email}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Guardian Name</div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{selectedStudent.guardian_name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Guardian Phone</div>
                <div style={{ fontWeight: 600, color: '#fff' }}>{selectedStudent.guardian_phone || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherStudentsPage;
