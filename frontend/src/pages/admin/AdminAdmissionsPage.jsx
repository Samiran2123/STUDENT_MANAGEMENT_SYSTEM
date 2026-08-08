import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiFilePlus, FiChevronRight, FiChevronLeft, FiBookOpen, FiDollarSign, FiUser, FiCalendar, FiBriefcase } from 'react-icons/fi';
import { erpService } from '../../services/erpService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/formatters';

const AdminAdmissionsPage = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Dropdown options loaded from DB
  const [academicYears, setAcademicYears] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [autoSubjects, setAutoSubjects] = useState([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [feeStructure, setFeeStructure] = useState(null);

  // Form selections
  const [academicYearId, setAcademicYearId] = useState('');
  const [degree, setDegree] = useState('');
  const [department, setDepartment] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [semester, setSemester] = useState(1);

  const fetchPendingAdmissions = async () => {
    setLoading(true);
    try {
      const res = await erpService.getPendingAdmissions();
      if (res.success) {
        let data = res.data || [];
        if (search) {
          data = data.filter(a => 
            (a.user_name && a.user_name.toLowerCase().includes(search.toLowerCase())) ||
            (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
          );
        }
        setTotalPages(Math.ceil(data.length / 10) || 1);
        setAdmissions(data.slice((page - 1) * 10, page * 10));
      }
    } catch (err) {
      showToast.error('Failed to fetch pending admissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [yrRes, progRes, deptRes] = await Promise.all([
        erpService.getAcademicYears(),
        erpService.getPrograms(),
        erpService.getDepartments()
      ]);
      if (yrRes.success) {
        setAcademicYears(yrRes.data || []);
        const activeYear = (yrRes.data || []).find(y => y.is_active);
        if (activeYear) setAcademicYearId(activeYear.id);
      }
      if (progRes.success) setPrograms(progRes.data || []);
      if (deptRes.success) setDepartments(deptRes.data || []);
    } catch (err) {
      showToast.error('Failed to load ERP lookup data');
    }
  };

  useEffect(() => {
    fetchPendingAdmissions();
  }, [page, search]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch classes based on Degree and Department
  useEffect(() => {
    if (degree || department) {
      erpService.getClasses({ degree, department }).then(res => {
        if (res.success) setClasses(res.data || []);
      }).catch(() => setClasses([]));
    } else {
      erpService.getClasses().then(res => {
        if (res.success) setClasses(res.data || []);
      }).catch(() => setClasses([]));
    }
  }, [degree, department]);

  // Fetch sections & subjects when classId changes
  useEffect(() => {
    if (classId) {
      // Fetch sections
      erpService.getSections(classId).then(res => {
        if (res.success) setSections(res.data || []);
      }).catch(() => setSections([]));

      // Fetch subjects linked to class from DB
      erpService.getSubjects({ class_id: classId }).then(res => {
        if (res.success) {
          const subs = res.data || [];
          setAutoSubjects(subs);
          setSelectedSubjectIds(subs.map(s => s.id));
        }
      }).catch(() => setAutoSubjects([]));

      // Fetch Fee Structure from DB
      if (academicYearId) {
        erpService.getFeeStructures({ class_id: classId, academic_year_id: academicYearId }).then(res => {
          if (res.success) setFeeStructure(res.data || null);
        }).catch(() => setFeeStructure(null));
      }
    } else {
      setSections([]);
      setAutoSubjects([]);
      setSelectedSubjectIds([]);
      setFeeStructure(null);
    }
  }, [classId, academicYearId]);

  const handleOpenWizard = (student) => {
    setSelectedStudent(student);
    setCurrentStep(1);
    setAcademicYearId(student.academic_year_id || academicYearId || '');
    setDegree(student.degree || '');
    setDepartment(student.department || '');
    setClassId(student.class_id || '');
    setSectionId(student.section_id || '');
    setSemester(student.semester || 1);
    setWizardOpen(true);
  };

  const handleApprove = async () => {
    try {
      const selectedClass = classes.find(c => c.id == classId);
      const payload = {
        class_id: parseInt(classId),
        section_id: parseInt(sectionId),
        academic_year_id: parseInt(academicYearId),
        degree: degree || selectedClass?.degree,
        department: department || selectedClass?.department,
        semester: parseInt(semester),
        subject_ids: selectedSubjectIds
      };

      const res = await erpService.approveAdmission(selectedStudent.student_id, payload);
      if (res.success) {
        showToast.success(`Admission Approved! Roll No: ${res.data?.roll_number}`);
        setWizardOpen(false);
        fetchPendingAdmissions();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (studentId) => {
    if (window.confirm('Are you sure you want to reject this student admission?')) {
      try {
        const res = await erpService.rejectAdmission(studentId, {});
        if (res.success) {
          showToast.success('Admission rejected');
          fetchPendingAdmissions();
        }
      } catch (err) {
        showToast.error('Rejection failed');
      }
    }
  };

  const toggleSubjectSelect = (subId) => {
    if (selectedSubjectIds.includes(subId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subId));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, subId]);
    }
  };

  const selectedClassObj = classes.find(c => c.id == classId);
  const selectedSectionObj = sections.find(s => s.id == sectionId);
  const selectedYearObj = academicYears.find(y => y.id == academicYearId);

  const renderWizardStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiUser /> Step 1: Student Information
            </h3>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>{selectedStudent?.user_name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Email: {selectedStudent?.email}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Phone: {selectedStudent?.phone || 'Not provided'}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>Registered: {new Date(selectedStudent?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCalendar /> Step 2: Academic Year
            </h3>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name} {y.is_active ? '(Active)' : ''}</option>)}
            </select>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBriefcase /> Step 3: Select Degree / Program
            </h3>
            <select
              value={degree}
              onChange={(e) => { setDegree(e.target.value); setClassId(''); setSectionId(''); }}
              style={{ width: '100%', padding: '12px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <option value="">Select Program / Degree</option>
              {programs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Step 4: Select Department</h3>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setClassId(''); setSectionId(''); }}
              style={{ width: '100%', padding: '12px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <option value="">Select Department</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        );
      case 5:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Step 5: Select Class & Semester</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Class / Year</label>
                <select
                  value={classId}
                  onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.degree})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Step 6: Select Section</h3>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff' }}
            >
              <option value="">Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
            {sections.length === 0 && classId && <p style={{ color: 'var(--warning)', marginTop: '8px', fontSize: '0.85rem' }}>No sections found for this class.</p>}
          </div>
        );
      case 7:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBookOpen /> Step 7: Auto-Assigned Subjects (DB)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              Fetched automatically from database for <strong>{selectedClassObj?.name}</strong>. Toggle to customize assigned subjects:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {autoSubjects.length === 0 ? (
                <div style={{ color: 'var(--warning)', padding: '1rem', border: '1px dashed var(--border-glass)' }}>
                  No subjects linked to this class in the database.
                </div>
              ) : (
                autoSubjects.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={selectedSubjectIds.includes(s.id)}
                      onChange={() => toggleSubjectSelect(s.id)}
                    />
                    <div>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{s.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '8px' }}>({s.code})</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiDollarSign /> Step 8: Fee Structure Breakdown (DB)
            </h3>
            {feeStructure ? (
              <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tuition Fee:</span>
                  <strong style={{ color: '#fff' }}>{formatCurrency(feeStructure.tuition_fee || 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Exam Fee:</span>
                  <strong style={{ color: '#fff' }}>{formatCurrency(feeStructure.exam_fee || 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Library Fee:</span>
                  <strong style={{ color: '#fff' }}>{formatCurrency(feeStructure.library_fee || 0)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Other Charges:</span>
                  <strong style={{ color: '#fff' }}>{formatCurrency(feeStructure.other_fee || 0)}</strong>
                </div>
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Fee Invoice:</span>
                  <strong style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>{formatCurrency(feeStructure.amount)}</strong>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--warning)', padding: '1.5rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: 'var(--radius-md)' }}>
                No fee structure mapped in DB for this Class & Academic Year. Fees will remain unassigned.
              </div>
            )}
          </div>
        );
      case 9:
        const generatedCodePreview = `${(degree || selectedClassObj?.degree || 'BCA').replace(/[^a-zA-Z0-9]/g, '')}2026${String(selectedStudent?.student_id || 1).padStart(3, '0')}`;
        const generatedRollPreview = `${(degree || selectedClassObj?.degree || 'BCA').replace(/[^a-zA-Z0-9]/g, '')}/2026/${String(selectedStudent?.student_id || 1).padStart(3, '0')}`;
        return (
          <div className="animate-fade-in">
            <h3 style={{ marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle style={{ color: 'var(--success)' }} /> Step 9: Final Review & Confirm
            </h3>
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>
                <div style={{ color: '#fff', fontWeight: 700 }}>{selectedStudent?.user_name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Generated Student ID:</span>
                <div style={{ color: 'var(--primary)', fontWeight: 800 }}>{generatedCodePreview}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Generated Roll Number:</span>
                <div style={{ color: 'var(--accent)', fontWeight: 800 }}>{generatedRollPreview}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Academic Year:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{selectedYearObj?.year_name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Program / Degree:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{degree || selectedClassObj?.degree || 'BCA'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{department || selectedClassObj?.department || 'Computer Science'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Class & Section:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{selectedClassObj?.name} - Sec {selectedSectionObj?.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Subjects:</span>
                <div style={{ color: '#fff', fontWeight: 600 }}>{selectedSubjectIds.length} Subjects</div>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Initial Fee Balance:</span>
                <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.2rem' }}>
                  {feeStructure ? formatCurrency(feeStructure.amount) : '₹0'}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 2 && !academicYearId) return true;
    if (currentStep === 3 && !degree) return true;
    if (currentStep === 4 && !department) return true;
    if (currentStep === 5 && !classId) return true;
    if (currentStep === 6 && !sectionId) return true;
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiFilePlus /> Pending Admissions (ERP)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Review pending student registrations and complete full academic ERP setup.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by student name or email..." />
        </div>
      </div>

      {loading ? (
        <Spinner text="Loading pending admissions..." />
      ) : admissions.length === 0 ? (
        <EmptyState title="No Pending Admissions" message="There are currently no student registrations awaiting admin approval." />
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Student Name</th>
                <th style={{ padding: '14px 18px' }}>Contact</th>
                <th style={{ padding: '14px 18px' }}>Degree & Department</th>
                <th style={{ padding: '14px 18px' }}>Applied Class / Sec</th>
                <th style={{ padding: '14px 18px' }}>Reg Date</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((adm) => (
                <tr key={adm.student_id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#fff' }}>
                    {adm.user_name}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    <div>{adm.email}</div>
                    <div style={{ fontSize: '0.78rem' }}>{adm.phone || 'No phone'}</div>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#fff' }}>
                    {adm.degree ? `${adm.degree} (${adm.department || 'N/A'})` : 'Not specified'}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {adm.class_name ? `${adm.class_name} ${adm.section_name ? `(Sec ${adm.section_name})` : ''}` : 'Not specified'}
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    {new Date(adm.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(234, 179, 8, 0.15)', color: 'var(--warning)', textTransform: 'uppercase' }}>
                      Pending Admission
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => handleOpenWizard(adm)} style={{ padding: '6px 14px', color: '#fff', backgroundColor: 'var(--success)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.82rem' }}>
                        Review / Approve
                      </button>
                      <button onClick={() => handleReject(adm.student_id)} style={{ padding: '6px 14px', color: '#fff', backgroundColor: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.82rem' }}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* 9-Step Approval Wizard Modal */}
      {wizardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '650px', padding: '2rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Admission Approval Wizard</h2>
                <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>Step {currentStep} of 9</span>
              </div>
              <button onClick={() => setWizardOpen(false)} style={{ color: 'var(--text-muted)', fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ minHeight: '220px' }}>
              {renderWizardStep()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)} 
                disabled={currentStep === 1}
                style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.05)', color: currentStep === 1 ? 'rgba(255,255,255,0.2)' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: currentStep === 1 ? 'not-allowed' : 'pointer' }}
              >
                <FiChevronLeft /> Back
              </button>
              
              {currentStep < 9 ? (
                <button 
                  onClick={() => setCurrentStep(prev => prev + 1)} 
                  disabled={isNextDisabled()}
                  className="gradient-accent"
                  style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', opacity: isNextDisabled() ? 0.5 : 1, cursor: isNextDisabled() ? 'not-allowed' : 'pointer' }}
                >
                  Next <FiChevronRight />
                </button>
              ) : (
                <button 
                  onClick={handleApprove} 
                  style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
                >
                  Confirm & Approve Admission
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdmissionsPage;
