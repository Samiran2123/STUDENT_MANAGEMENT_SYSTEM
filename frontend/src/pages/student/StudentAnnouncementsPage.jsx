import React, { useState, useEffect } from 'react';
import { FiVolume2, FiClock, FiUser } from 'react-icons/fi';
import { announcementService } from '../../services/announcementService';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { formatDate } from '../../utils/formatters';

const StudentAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAll({
        page,
        limit: 10,
        search: search || undefined,
      });
      if (res.success) {
        setAnnouncements(res.data || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      showToast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Campus Announcements</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Official academic announcements, exam schedules, and campus activities.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search announcement title or content..." />
      </div>

      {loading ? (
        <Spinner text="Loading notices..." />
      ) : announcements.length === 0 ? (
        <EmptyState title="No Announcements" message="No campus notices published." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {announcements.map((ann) => (
            <div key={ann.id} className="glass-panel glass-panel-hover" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                {ann.title}
              </h3>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiUser /> {ann.created_by_name || 'Admin'}</span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiClock /> {formatDate(ann.created_at)}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.85rem', lineHeight: 1.6 }}>
                {ann.description}
              </p>
            </div>
          ))}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncementsPage;
