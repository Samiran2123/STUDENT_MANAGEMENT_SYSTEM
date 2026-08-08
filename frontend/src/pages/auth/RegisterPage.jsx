import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiUserCheck, FiBookOpen, FiCalendar, FiBriefcase, FiLayers, FiList } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { erpService } from '../../services/erpService';
import { showToast } from '../../components/common/Toast';
import Spinner from '../../components/common/Spinner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'student',
    degree: '',
    department: '',
    academic_year_id: '',
    class_id: '',
    semester: 1,
    section_id: '',
  });

  // ERP Lookup Data
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Load ERP options when role is student
  useEffect(() => {
    if (formData.role === 'student') {
      const loadErpLookups = async () => {
        try {
          const [progRes, deptRes, yrRes, clsRes] = await Promise.all([
            erpService.getPrograms(),
            erpService.getDepartments(),
            erpService.getAcademicYears(),
            erpService.getClasses(),
          ]);

          if (progRes.success && progRes.data?.length > 0) {
            setPrograms(progRes.data);
            setFormData(prev => ({ ...prev, degree: prev.degree || progRes.data[0] }));
          }
          if (deptRes.success && deptRes.data?.length > 0) {
            setDepartments(deptRes.data);
            setFormData(prev => ({ ...prev, department: prev.department || deptRes.data[0] }));
          }
          if (yrRes.success && yrRes.data?.length > 0) {
            setAcademicYears(yrRes.data);
            const activeYr = yrRes.data.find(y => y.is_active) || yrRes.data[0];
            setFormData(prev => ({ ...prev, academic_year_id: prev.academic_year_id || activeYr.id }));
          }
          if (clsRes.success && clsRes.data?.length > 0) {
            setClasses(clsRes.data);
            setFormData(prev => ({ ...prev, class_id: prev.class_id || clsRes.data[0].id }));
          }
        } catch {
          // Keep defaults if lookups fail
        }
      };
      loadErpLookups();
    }
  }, [formData.role]);

  const [sectionError, setSectionError] = useState(null);

  // Load sections when class_id changes
  useEffect(() => {
    if (formData.role === 'student' && formData.class_id) {
      setSectionError(null);
      setFormData(prev => ({ ...prev, section_id: '' }));
      erpService.getSections(formData.class_id)
        .then(res => {
          if (res.success && res.data && res.data.length > 0) {
            setSections(res.data);
            setFormData(prev => ({ ...prev, section_id: res.data[0].id }));
          } else {
            setSections([]);
            setSectionError('No sections available for this class');
          }
        })
        .catch(err => {
          console.error('Failed to load sections for class:', formData.class_id, err);
          setSections([]);
          setSectionError('Unable to load sections');
        });
    } else {
      setSections([]);
    }
  }, [formData.class_id, formData.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      showToast.error('Please fill in all required personal information.');
      return;
    }

    if (formData.role === 'student') {
      if (!formData.degree || !formData.department || !formData.academic_year_id || !formData.class_id || !formData.section_id) {
        showToast.error('Please complete all required Academic / Admission details.');
        return;
      }
    }

    setSubmitting(true);
    const result = await register(formData);
    setSubmitting(false);

    if (result.success) {
      if (formData.role === 'student') {
        showToast.success('Registration successful. Your admission application is pending admin approval.');
        navigate('/login', { replace: true });
      } else {
        showToast.success('Account created successfully!');
        const roleRedirects = {
          admin: '/admin',
          teacher: '/teacher',
        };
        navigate(roleRedirects[result.user.role] || '/', { replace: true });
      }
    } else {
      showToast.error(result.message || 'Registration failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: formData.role === 'student' ? '640px' : '480px',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {formData.role === 'student' ? 'Student Admission Application' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {formData.role === 'student' ? 'Submit your academic profile for admin review & enrollment' : 'Join the EduPulse Academic ERP'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Account Role Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Select Account Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '11px 14px',
                backgroundColor: '#121a2b',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
                fontWeight: 600,
              }}
            >
              <option value="student">Student (Admission Application)</option>
              <option value="teacher">Teacher Account</option>
              <option value="admin">Administrator Account</option>
            </select>
          </div>

          {/* SECTION 1: PERSONAL INFORMATION */}
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Personal Information
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px 11px 40px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 chars"
                      required
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 40px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiPhone style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+919876543210"
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 40px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC / ADMISSION DETAILS (STUDENT ONLY) */}
          {formData.role === 'student' && (
            <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Academic / Admission Details
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Degree / Program *
                  </label>
                  <select
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="">Select Degree / Program</option>
                    {programs.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Academic Year *
                  </label>
                  <select
                    name="academic_year_id"
                    value={formData.academic_year_id}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name} {y.is_active ? '(Active)' : ''}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Year / Class *
                  </label>
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="">Select Class / Year</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.degree})</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Semester *
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Section *
                  </label>
                  <select
                    name="section_id"
                    value={formData.section_id}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '11px 14px', backgroundColor: '#121a2b', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="">{sectionError ? sectionError : 'Select Section'}</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="gradient-accent"
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '0.5rem',
              boxShadow: 'var(--shadow-glow)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <Spinner size="sm" center={false} />
            ) : (
              <>
                <FiUserCheck />
                {formData.role === 'student' ? 'Submit Admission Application' : 'Register Account'}
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
