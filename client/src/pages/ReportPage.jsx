import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, FileText, Bot, AlertTriangle } from 'lucide-react';
import { getScanDetails } from '../api/client';
import RiskGauge from '../components/RiskGauge';
import VulnerabilityCard from '../components/VulnerabilityCard';

const ReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // summary, dependencies, vulnerabilities

  useEffect(() => {
    let intervalId;

    const fetchScan = async () => {
      try {
        const data = await getScanDetails(id);
        setScan(data);
        
        if (data.status === 'failed') {
          setError(data.errorMessage || 'Scan failed');
          setLoading(false);
          clearInterval(intervalId);
        } else if (data.status === 'completed') {
          setLoading(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load scan report');
        setLoading(false);
        clearInterval(intervalId);
      }
    };

    fetchScan(); // initial fetch
    
    // Poll if not completed
    intervalId = setInterval(() => {
      if (!scan || scan.status === 'pending' || scan.status === 'analyzing') {
        fetchScan();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [id, scan?.status]);

  if (loading || (scan && scan.status !== 'completed' && scan.status !== 'failed')) {
    return (
      <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: '24px' }}>
        <RefreshCw size={48} className="animate-spin" color="var(--accent-cyan)" style={{ animation: 'spin 2s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Analyzing Project...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Our AI is inspecting dependencies and querying OSV.dev.</p>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || (scan && scan.status === 'failed')) {
    return (
      <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: '16px' }}>
        <AlertTriangle size={48} color="var(--status-critical)" />
        <h2>Scan Failed</h2>
        <p style={{ color: 'var(--status-critical)' }}>{error || scan?.errorMessage}</p>
        <button className="glow-btn" onClick={() => navigate('/scan')}>Try Again</button>
      </div>
    );
  }

  if (!scan) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      <button 
        onClick={() => navigate('/')} 
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileText size={28} color="var(--accent-violet)" />
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{scan.fileName}</h1>
            <span className="badge badge-low">{scan.fileType}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Scanned on {new Date(scan.createdAt).toLocaleString()}</p>
        </div>
        <RiskGauge score={scan.riskScore} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
        {['summary', 'dependencies', 'vulnerabilities'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === 'summary' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              {/* AI Analysis Cards */}
              <div className="glass-panel" style={{ padding: '32px', borderLeft: '4px solid var(--accent-violet)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Bot size={28} color="var(--accent-violet)" />
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }} className="text-gradient">AI Risk Summary</h2>
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                  {scan.aiAnalysis?.riskSummary || 'No summary available.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--status-high)' }}>🚨 Priority Upgrades</h3>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {scan.aiAnalysis?.priorityUpgrades || 'None identified.'}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent-cyan)' }}>⚡ Conflict Detection</h3>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {scan.aiAnalysis?.conflictDetection || 'No conflicts detected.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Current</th>
                    <th>Latest</th>
                    <th>Status</th>
                    <th>Vulns</th>
                  </tr>
                </thead>
                <tbody>
                  {scan.dependencies.map((dep, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{dep.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{dep.currentVersion}</td>
                      <td style={{ color: 'var(--text-primary)' }}>{dep.latestVersion || 'Unknown'}</td>
                      <td>
                        <span className={`badge ${
                          dep.status === 'up-to-date' ? 'badge-safe' : 
                          dep.status === 'outdated' ? 'badge-critical' : 'badge-moderate'
                        }`}>
                          {dep.status}
                        </span>
                      </td>
                      <td>
                        {dep.vulnerabilities?.length > 0 ? (
                          <span className="badge badge-critical">{dep.vulnerabilities.length}</span>
                        ) : (
                          <span className="badge badge-safe">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div>
              {scan.vulnerabilities.length === 0 ? (
                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
                  <ShieldCheck size={48} color="var(--status-safe)" style={{ margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>No Vulnerabilities Found!</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Your dependencies are clean based on current OSV data.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {scan.vulnerabilities.map((vuln, i) => (
                    <VulnerabilityCard key={i} vuln={vuln} />
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReportPage;
