import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileSearch, History, ShieldAlert } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/scan', icon: <FileSearch size={20} />, label: 'New Scan' },
    { to: '/history', icon: <History size={20} />, label: 'Scan History' },
  ];

  return (
    <aside style={{
      width: '260px',
      borderRight: '1px solid var(--border-glass)',
      background: 'rgba(10, 14, 23, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      zIndex: 10
    }}>
      <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white'
        }}>
          <ShieldAlert size={20} />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
          <span className="text-gradient">DepRisk</span> AI
        </h1>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s ease'
            })}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Powered by OSV.dev & Gemini AI
      </div>
    </aside>
  );
};

export default Sidebar;
