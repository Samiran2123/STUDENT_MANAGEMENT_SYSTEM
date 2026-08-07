import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShield, FiUsers, FiBook, FiAward, FiCheckCircle } from 'react-icons/fi';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section
          style={{
            padding: '6rem 2rem 4rem 2rem',
            textAlign: 'center',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
          className="animate-fade-in"
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid rgba(79, 70, 229, 0.3)',
              color: '#a5b4fc',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}
          >
            <FiAward /> Next-Gen Academic Management Platform
          </div>

          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
            }}
            className="gradient-text"
          >
            Empowering Education with Seamless Digital Governance
          </h1>

          <p
            style={{
              fontSize: '1.2rem',
              color: 'var(--text-muted)',
              maxWidth: '700px',
              margin: '0 auto 2.5rem auto',
              lineHeight: 1.6,
            }}
          >
            A unified, role-based solution designed for Administrators, Educators, and Students. Streamline attendance, academic performance, course management, and fee tracking.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              className="gradient-accent"
              style={{
                padding: '14px 32px',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.2s ease',
              }}
            >
              Get Started <FiArrowRight />
            </Link>

            <Link
              to="/register"
              className="glass-panel glass-panel-hover"
              style={{
                padding: '14px 32px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Create Account
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section style={{ maxWidth: '1200px', margin: '2rem auto 6rem auto', padding: '0 2rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div className="glass-panel glass-panel-hover" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(79, 70, 229, 0.2)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                <FiShield />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Role-Based Security</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Strict JWT token authentication & authorization tailored for Admin, Teacher, and Student roles.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                <FiUsers />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Student Analytics</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Track student profiles, department enrollments, and academic progression with granular statistics.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                <FiBook />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Course & Attendance</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Automated bulk attendance marking, exam grading, course teacher assignments, and announcements.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
