import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ExternalLink } from 'lucide-react';
import { getScans, deleteScan } from '../api/client';

const HistoryPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchHistory = async (p) => {
    try {
      setLoading(true);
      const data = await getScans(p, 10);
      setScans(data.scans);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this scan report?')) {
      try {
        await deleteScan(id);
        fetchHistory(page);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Scan History</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review past dependency analysis reports.</p>
      </motion.div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div className="text-center" style={{ padding: '48px', color: 'var(--text-secondary)' }}>Loading history...</div>
        ) : scans.length === 0 ? (
          <div className="text-center" style={{ padding: '48px', color: 'var(--text-muted)' }}>No scans found.</div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Risk Score</th>
                <th>Issues</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scans.map(scan => (
                <tr key={scan._id} onClick={() => navigate(`/report/${scan._id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{scan.fileName}</td>
                  <td><span className="badge badge-low">{scan.fileType}</span></td>
                  <td>
                    <span className={`badge ${scan.riskScore >= 70 ? 'badge-critical' : scan.riskScore >= 40 ? 'badge-high' : scan.riskScore > 20 ? 'badge-moderate' : 'badge-safe'}`}>
                      {scan.riskScore}/100
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {scan.vulnerableCount > 0 && <span style={{ color: 'var(--status-critical)', fontSize: '0.85rem' }}>{scan.vulnerableCount} Vulns</span>}
                      {scan.outdatedCount > 0 && <span style={{ color: 'var(--status-moderate)', fontSize: '0.85rem' }}>{scan.outdatedCount} Outdated</span>}
                      {scan.vulnerableCount === 0 && scan.outdatedCount === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/report/${scan._id}`); }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, scan._id)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--status-critical)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              style={{ background: 'transparent', border: '1px solid var(--border-glass)', padding: '8px 16px', borderRadius: '8px', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              style={{ background: 'transparent', border: '1px solid var(--border-glass)', padding: '8px 16px', borderRadius: '8px', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
