import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Activity, Calendar, Shield, ChevronDown, ChevronUp, ChevronRight, Menu, FileText } from 'lucide-react';
import { tablasData } from '../data/tablasExigencias';
import './Dashboard.css'; // Reusing dashboard styles for sidebar

const Layout = ({ userData, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-close menu after 3 seconds of inactivity on mobile
  useEffect(() => {
    let timeout;
    if (isMobileMenuOpen) {
      const closeMenu = () => setIsMobileMenuOpen(false);
      timeout = setTimeout(closeMenu, 3000);
      
      const handleActivity = () => {
        clearTimeout(timeout);
        timeout = setTimeout(closeMenu, 3000);
      };

      window.addEventListener('touchstart', handleActivity, { passive: true });
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('click', handleActivity);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('touchstart', handleActivity);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('click', handleActivity);
      };
    }
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem('gp_session');
    window.location.href = '/login';
  };

  const tablasExigencias = Object.keys(tablasData);



  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-color)', position: 'relative' }}>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-hamburger" 
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileMenuOpen(true);
        }}
        style={{
          background: location.pathname === '/dashboard' ? 'var(--primary)' : 'transparent',
          color: 'var(--white)',
          boxShadow: location.pathname === '/dashboard' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
          padding: '8px',
          top: '16px',
          left: '16px',
        }}
      >
        <Menu size={28} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ width: '280px', flexShrink: 0, overflowY: 'auto' }}>
        <div className="sidebar-header" style={{ padding: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--white)', letterSpacing: '0.5px' }}>Evaluación Física</h3>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`nav-item ${location.pathname === '/dashboard' && !new URLSearchParams(location.search).get('tabla') ? 'active' : ''}`} onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }}>
            <Home size={20} />
            Pantalla Principal
          </button>
          
          <div className="nav-group">
            <button className={`nav-item ${showSubMenu || new URLSearchParams(location.search).get('tabla') ? 'active' : ''}`} onClick={() => setShowSubMenu(!showSubMenu)}>
              <FileText size={20} />
              <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>Tablas de Exigencias</span>
              {showSubMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {(showSubMenu || new URLSearchParams(location.search).get('tabla')) && (
              <div className="submenu">
                {tablasExigencias.map((tabla, index) => (
                  <button 
                    key={index} 
                    className={`submenu-item ${new URLSearchParams(location.search).get('tabla') === tabla ? 'active' : ''}`}
                    onClick={() => {
                      navigate(`/dashboard?tabla=${encodeURIComponent(tabla)}`);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <ChevronRight size={14} />
                    <span>{tabla}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className={`nav-item ${location.pathname === '/carga-exigencias' ? 'active' : ''}`} onClick={() => { navigate('/carga-exigencias'); setIsMobileMenuOpen(false); }}>
            <Activity size={20} />
            Carga de Examen
          </button>

          <button className={`nav-item ${location.pathname === '/historial' ? 'active' : ''}`} onClick={() => { navigate('/historial'); setIsMobileMenuOpen(false); }}>
            <Calendar size={20} />
            Buscar Planillas
          </button>

          {userData?.role === 'admin' && (
            <button className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`} onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }} style={{ marginTop: 'auto', background: 'var(--primary-dark)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Shield size={20} />
              Panel Administrador
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ width: '100%', marginBottom: '16px' }}>
            <LogOut size={20} />
            Cerrar Sesión
          </button>
          
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', overflow: 'hidden' }}>
            <div className="user-avatar" style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
              {userData?.email?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userData?.email || 'Usuario'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                {userData?.role === 'admin' ? 'Administrador' : 'Evaluador'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, height: '100%', overflowY: 'auto', position: 'relative' }}>
        {children}
      </main>



      {/* Custom Alert Modal */}
      {alertMessage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.2rem', marginBottom: '16px' }}>Información</h3>
            <p style={{ color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
