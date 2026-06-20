import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AuthLogin from './components/AuthLogin';
import Dashboard from './components/Dashboard';
import CargaExigencias from './components/CargaExigencias';
import AdminPanel from './components/AdminPanel';
import HistorialPlanillas from './components/HistorialPlanillas';
import Layout from './components/Layout';
import './app-animations.css';
import logo from './assets/logo-gendarmeria.png';

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
      }, 4000); // Mínimo 4s para apreciar la cascada de logos
    };

    checkSession();
  }, []);

  if (loading) {
    return (
      <div className={`splash-screen ${isExitingSplash ? 'exiting' : ''}`}>
        <div className="logo-cascade-container">
          <img src={logo} alt="Profe Gp Logo" className="splash-logo-cascade cascade-1" />
          <img src={logo} alt="Profe Gp Logo" className="splash-logo-cascade cascade-2" />
          <img src={logo} alt="Profe Gp Logo" className="splash-logo-cascade cascade-3" />
          <img src={logo} alt="Profe Gp Logo" className="splash-logo-cascade cascade-4" />
          <img src={logo} alt="Profe Gp Logo" className="splash-logo-cascade cascade-main" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <AuthLogin /> : <Navigate to="/dashboard" replace />} />
        
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
