import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { submitScan } from '../api/client';

const ScanPage = () => {
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStartScan = async () => {
    if (!file) return;

    setIsScanning(true);
    setError('');
    setScanStatus('Uploading and parsing manifest...');

    try {
      const response = await submitScan(file);
      const scanId = response.scanId;

      setScanStatus('Checking vulnerabilities and analyzing with AI...');
      
      // Navigate to report page which will poll for completion
      setTimeout(() => {
        navigate(`/report/${scanId}`);
      }, 1500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to start scan');
      setIsScanning(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{ 
            width: '64px', height: '64px', 
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            color: 'white',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)'
          }}
        >
          <ShieldCheck size={32} />
        </motion.div>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>
          Analyze Dependencies
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Upload your project manifest file. We'll scan for vulnerabilities, version drifts, and provide an AI-powered upgrade plan.
        </p>
      </div>

      <FileUpload onFileSelect={setFile} />

      <motion.div 
        style={{ marginTop: '48px', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: file ? 1 : 0 }}
      >
        {error && (
          <div style={{ color: 'var(--status-critical)', marginBottom: '16px' }}>{error}</div>
        )}
        
        <button
          className="glow-btn"
          onClick={handleStartScan}
          disabled={!file || isScanning}
          style={{ 
            padding: '16px 48px', 
            fontSize: '1.1rem',
            opacity: (!file || isScanning) ? 0.7 : 1,
            cursor: (!file || isScanning) ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {isScanning ? (
            <>
              <Loader2 className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
              {scanStatus}
            </>
          ) : (
            'Start Deep Scan'
          )}
        </button>
      </motion.div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ScanPage;
