import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Package, AlertTriangle } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import StatsCard from '../components/StatsCard';
import { getStats, getScans } from '../api/client';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, scansData] = await Promise.all([
          getStats(),
          getScans(1, 5) // Get 5 most recent
        ]);
        setStats(statsData);
        setRecentScans(scansData.scans);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex-center" style={{ height: '100%' }}>Loading dashboard...</div>;
  }

  const chartData = {
    labels: ['Safe Packages', 'Vulnerable Packages'],
    datasets: [
      {
        data: [
          (stats?.totalPackagesAnalyzed || 0) - (stats?.totalVulnerabilities || 0),
          stats?.totalVulnerabilities || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8' } }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-secondary)' }}>High-level view of your dependency security posture.</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatsCard title="Total Scans" value={stats?.totalScans || 0} icon={<Activity size={24} />} color="var(--accent-cyan)" delay={0.1} />
        <StatsCard title="Avg Risk Score" value={Math.round(stats?.avgRiskScore || 0)} icon={<ShieldAlert size={24} />} color="var(--status-critical)" delay={0.2} />
        <StatsCard title="Total Critical Vulns" value={stats?.totalCritical || 0} icon={<AlertTriangle size={24} />} color="var(--status-high)" delay={0.3} />
        <StatsCard title="Packages Analyzed" value={stats?.totalPackagesAnalyzed || 0} icon={<Package size={24} />} color="var(--accent-violet)" delay={0.4} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Chart */}
        <motion.div className="glass-panel" style={{ padding: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Risk Distribution</h2>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxHeight: '300px', margin: '0 auto' }}>
            <Doughnut data={chartData} options={chartOptions} />
            <div style={{ position: 'absolute', top: '45%', left: '0', width: '100%', textAlign: 'center', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>
              {stats?.totalPackagesAnalyzed || 0}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Total</div>
            </div>
          </div>
        </motion.div>

        {/* Recent Scans */}
        <motion.div className="glass-panel" style={{ padding: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div className="flex-between mb-4">
            <h2 style={{ fontSize: '1.2rem' }}>Recent Scans</h2>
            <button onClick={() => navigate('/history')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>View All</button>
          </div>
          <table className="glass-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map((scan) => (
                <tr key={scan._id} onClick={() => navigate(`/report/${scan._id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500 }}>{scan.fileName}</td>
                  <td>
                    <span className="badge badge-low">{scan.fileType}</span>
                  </td>
                  <td>
                    <span className={`badge ${scan.riskScore > 70 ? 'badge-critical' : scan.riskScore > 30 ? 'badge-moderate' : 'badge-safe'}`}>
                      {scan.riskScore}/100
                    </span>
                  </td>
                  <td>
                    <span style={{ color: scan.status === 'completed' ? 'var(--status-safe)' : 'var(--status-moderate)' }}>
                      {scan.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(scan.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentScans.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '32px', color: 'var(--text-muted)' }}>
                    No scans found. Run your first scan to see data here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
