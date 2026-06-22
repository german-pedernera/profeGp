import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CargaExigencias from './components/CargaExigencias';
import AdminPanel from './components/AdminPanel';
import HistorialPlanillas from './components/HistorialPlanillas';
import Layout from './components/Layout';
import './app-animations.css';

const ProtectedRoute = ({ user, userData, requiredRole, children }) => {
  if (!user) return <Navigate to="/login" />;
  
  if (userData) {
     if (userData.status !== 'approved' && userData.role !== 'admin') {
        return <Navigate to="/login" state={{ error: 'Su cuenta está pendiente de aprobación por el administrador.' }} />;
     }
     if (requiredRole && userData.role !== requiredRole) {
        return <Navigate to="/dashboard" />;
     }
  }
  
  return <Layout userData={userData}>{children}</Layout>;
};

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExitingSplash, setIsExitingSplash] = useState(false);

  useEffect(() => {

    const checkSession = () => {
      const sessionData = sessionStorage.getItem('gp_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setUser({ id: parsed.id, email: parsed.email });
        setUserData(parsed);
      } else {
        setUser(null);
        setUserData(null);
      }
      setTimeout(() => {
        setIsExitingSplash(true);
        setTimeout(() => setLoading(false), 500);
      }, 1000);
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className={`splash-screen ${isExitingSplash ? 'exiting' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div className="modern-spinner" style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#ffffff',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '500', letterSpacing: '1px', opacity: 0.8 }}>
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login user={user} userData={userData} /> : <Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute user={user} userData={userData}>
            <Dashboard userData={userData} />
          </ProtectedRoute>
        } />
        
        <Route path="/carga-exigencias" element={
          <ProtectedRoute user={user} userData={userData}>
            <CargaExigencias userData={userData} />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute user={user} userData={userData} requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="/historial" element={
          <ProtectedRoute user={user} userData={userData}>
            <HistorialPlanillas userData={userData} />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
