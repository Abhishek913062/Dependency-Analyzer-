import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileJson, FileCode, CheckCircle, XCircle } from 'lucide-react';

const FileUpload = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const allowedTypes = ['application/json', 'text/xml', 'text/plain', ''];
  const allowedNames = ['package.json', 'pom.xml', 'requirements.txt', 'build.gradle'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    
    // Check filename ending to be more lenient than exact match
    const isValidName = allowedNames.some(name => file.name.endsWith(name));
    
    if (!isValidName) {
      setError(`Invalid file type. Supported: ${allowedNames.join(', ')}`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <UploadCloud size={48} />;
    if (filename.includes('json')) return <FileJson size={48} className="text-blue-400" />;
    return <FileCode size={48} className="text-orange-400" />;
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <div 
        className="glass-panel"
        style={{
          border: `2px dashed ${dragActive ? 'var(--accent-cyan)' : 'var(--border-glass)'}`,
          background: dragActive ? 'rgba(0, 240, 255, 0.05)' : 'var(--bg-glass)',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
            >
              <div style={{ color: dragActive ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                <UploadCloud size={64} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                  Drag & drop your manifest file here
                </h3>
                <p style={{ color: 'var(--text-muted)' }}>
                  or click to browse from your computer
                </p>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {allowedNames.map(name => (
                  <span key={name} className="badge badge-low" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
            >
              <div style={{ color: 'var(--accent-cyan)' }}>
                {getFileIcon(selectedFile.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {selectedFile.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  onFileSelect(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  marginTop: '16px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
              >
                Change File
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: 'var(--status-critical)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}
        >
          <XCircle size={16} />
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;
