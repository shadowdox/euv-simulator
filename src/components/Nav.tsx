import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const LINKS = [
  { to: '/',          label: 'OVERVIEW'  },
  { to: '/simulator', label: 'SIMULATOR' },
  { to: '/model',     label: 'MODEL'     },
  { to: '/results',   label: 'RESULTS'   },
];

export default function Nav() {
  const loc = useLocation();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(3,5,10,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(124,111,238,0.12)',
      display: 'flex', alignItems: 'center',
      padding: '0 2rem', height: 52,
      gap: '2rem',
    }}>
      {/* Logo */}
      <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="1" width="20" height="20" rx="2"
            stroke="#7c6fee" strokeWidth="1.5" fill="none" />
          <rect x="5" y="5" width="5" height="5"  fill="#f5a623" opacity="0.8" />
          <rect x="5" y="12" width="5" height="5" fill="#7c6fee" opacity="0.6" />
          <rect x="12" y="5" width="5" height="5" fill="#00ff88" opacity="0.6" />
          <rect x="12" y="12" width="5" height="5" fill="#ff3b3b" opacity="0.7" />
        </svg>
        <span className="font-display" style={{ fontSize: 11, letterSpacing: '0.12em', color: '#7c6fee' }}>
          EUV·M4
        </span>
      </div>

      {/* Links */}
      {LINKS.map(({ to, label }) => {
        const active = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to);
        return (
          <NavLink key={to} to={to} style={{ position: 'relative', padding: '0 2px' }}>
            <span className="font-display" style={{
              fontSize: 10, letterSpacing: '0.14em',
              color: active ? '#7c6fee' : '#4a6070',
              transition: 'color 0.2s',
            }}>
              {label}
            </span>
            {active && (
              <motion.div
                layoutId="nav-indicator"
                style={{
                  position: 'absolute', bottom: -18, left: 0, right: 0,
                  height: 2, background: '#7c6fee',
                  boxShadow: '0 0 8px #7c6fee',
                  borderRadius: 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </NavLink>
        );
      })}

      {/* Status pill */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,255,136,0.08)',
        border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: 4, padding: '3px 8px',
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#00ff88',
          boxShadow: '0 0 6px #00ff88',
          animation: 'blink 2s step-end infinite',
        }} />
        <span className="font-mono" style={{ fontSize: 9, color: '#00ff88', letterSpacing: '0.1em' }}>
          TSMC N3E
        </span>
      </div>
    </nav>
  );
}
