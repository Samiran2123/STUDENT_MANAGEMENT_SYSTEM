import React, { useState, useEffect } from 'react';
import { FiBell, FiAward, FiDollarSign, FiVolume2, FiCheckSquare } from 'react-icons/fi';
import { announcementService } from '../../services/announcementService';
import { marksService } from '../../services/marksService';
import { feesService } from '../../services/feesService';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';

const StudentNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [annRes, marksRes, feesRes] = await Promise.all([
        announcementService.getAll({ limit: 10 }),
        marksService.getAll({ limit: 5 }),
        feesService.getAll({ status: 'pending', limit: 5 }),
      ]);

      const items = [];

      // Add Announcements
      (annRes.data || []).forEach((a) => {
        items.push({
          id: `ann-${a.id}`,
          title: a.title,
          description: a.description,
          date: a.created_at,
          type: 'announcement',
          icon: <FiVolume2 style={{ color: 'var(--accent)' }} />,
        });
      });

      // Add Fee Reminders
      (feesRes.data || []).forEach((f) => {
        items.push({
          id: `fee-${f.id}`,
          title: 'Fee Payment Pending Notice',
          description: `Tuition fee invoice of ₹${f.amount} is currently pending payment.`,
          date: f.created_at || new Date().toISOString(),
          type: 'fee',
          icon: <FiDollarSign style={{ color: 'var(--warning)' }} />,
        });
      });

      // Add Marks Updates
      (marksRes.data || []).forEach((m) => {
        items.push({
          id: `mark-${m.id}`,
          title: `Grade Published: ${m.course_name}`,
          description: `Score recorded: ${m.marks}/${m.total_marks} for ${m.exam_type} exam.`,
          date: m.created_at || new Date().toISOString(),
          type: 'mark',
          icon: <FiAward style={{ color: 'var(--success)' }} />,
        });
      });

      // Sort by date descending
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Notifications & Alerts</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Personalized real-time notification stream for grades, fee reminders, and notices.
        </p>
      </div>

      {loading ? (
        <Spinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState title="No Notifications" message="You have no unread notifications at this time." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((n) => (
            <div key={n.id} className="glass-panel glass-panel-hover" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '10px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '1.25rem', flexShrink: 0 }}>
                {n.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{n.title}</h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(n.date)}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  {n.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotificationsPage;
