import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon, color = 'var(--accent-cyan)', delay = 0 }) => {
  return (
    <motion.div 
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}
    >
      <div style={{
        width: '56px', height: '56px',
        borderRadius: '16px',
        background: `rgba(${color === 'var(--accent-cyan)' ? '0, 240, 255' : 
                          color === 'var(--status-critical)' ? '239, 68, 68' : 
                          color === 'var(--accent-violet)' ? '138, 43, 226' : '255,255,255'}, 0.1)`,
        color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ color: 'var(--text-primary)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-1px' }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
