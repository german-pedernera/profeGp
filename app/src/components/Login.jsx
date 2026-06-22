import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { sendTelegramMessage } from '../utils/telegram';
import { LogIn, UserPlus, X, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = ({ user, userData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState(location.state?.error || '');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Recovery Modal State
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);

  // Registration Modal State
  const [showRegister, setShowRegister] = useState(false);
  const [regData, setRegData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    fechaNacimiento: '',
    email: '',
    password: ''
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Redirect if already logged in and approved
  useEffect(() => {
    if (user && userData && (userData.status === 'approved' || userData.role === 'admin')) {
      navigate('/dashboard');
    }
  }, [user, userData, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setErrorMsg('');
    try {
      const now = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
      
      let emailForAuth = email.trim();
      if (emailForAuth !== 'Ger25$' && !emailForAuth.includes('@')) {
         emailForAuth = `${emailForAuth}@gendarmeria.gob.ar`;
      }

      if ((emailForAuth === 'Ger25$' && password === 'Emi25$') || emailForAuth === 'pederneragerman@gmail.com') {
         // BYPASS DE SEGURIDAD LOCAL: Evitar los límites de Supabase para el administrador
         localStorage.setItem('mock_admin', 'true');
         
         const usersData = localStorage.getItem('gp_users');
         let userName = 'Admin';
         if (usersData) {
            let usersList = JSON.parse(usersData);
            const userIndex = usersList.findIndex(u => u.email === emailForAuth);
            if (userIndex !== -1) {
               usersList[userIndex].lastLogin = now;
               userName = `${usersList[userIndex].nombre} ${usersList[userIndex].apellido}`;
               localStorage.setItem('gp_users', JSON.stringify(usersList));
            }
         }
         
         const adminSession = { id: 'admin-id', email: emailForAuth, role: 'admin', status: 'approved', nombre: 'German', apellido: 'Pedernera' };
         sessionStorage.setItem('gp_session', JSON.stringify(adminSession));
         
         try {
           const message = `🟢 <b>Admin Inició Sesión</b>\n\n👤 <b>Usuario:</b> ${userName}\n📧 <b>Email:</b> ${emailForAuth}\n⏱ <b>Hora:</b> ${now}`;
           await sendTelegramMessage(message);
         } catch (err) {
           console.error("Telegram notification error:", err);
         }
         
         window.location.href = '/dashboard'; // Redirige directamente forzando recarga de App.jsx
         return;
      } else {
         let authSuccess = false;
         const { error } = await supabase.auth.signInWithPassword({ email: emailForAuth, password });
         if (error) {
            // Fallback: check if the user exists in the 'users' table directly (for manually added users)
            const { data: fallbackUser } = await supabase.from('users').select('*').eq('email', emailForAuth).single();
            if (fallbackUser && fallbackUser.password === password) {
               if (fallbackUser.status !== 'approved') {
                  throw new Error('Su cuenta aún no ha sido aprobada por el administrador.');
               }
               authSuccess = true;
            } else {
               throw new Error('Credenciales inválidas.');
            }
         } else {
            // Check status for auth users too
            const { data: authDbUser } = await supabase.from('users').select('*').eq('email', emailForAuth).single();
            if (authDbUser && authDbUser.status !== 'approved') {
               await supabase.auth.signOut();
               throw new Error('Su cuenta aún no ha sido aprobada por el administrador.');
            }
            authSuccess = true;
         }
         
         if (authSuccess) {
            let userName = 'Usuario Desconocido';
            const { data: dbUser } = await supabase.from('users').select('*').eq('email', emailForAuth).single();
            
            if (dbUser) {
               userName = `${dbUser.nombre} ${dbUser.apellido}`;
               const sessionUser = { ...dbUser };
               delete sessionUser.password;
               sessionStorage.setItem('gp_session', JSON.stringify(sessionUser));
            }
            
            // Notification
            try {
               const now = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
               const message = `🟢 <b>Usuario Inició Sesión</b>\n\n👤 <b>Usuario:</b> ${userName}\n📧 <b>Email:</b> ${emailForAuth}\n⏱ <b>Hora:</b> ${now}`;
               await sendTelegramMessage(message);
            } catch (err) {
               console.error("Telegram notification error:", err);
            }
            
            // Redirect
            window.location.href = '/dashboard';
            return;
         }
      }
    } catch (error) {
      console.error("Login error details:", error);
      setErrorMsg('Error: ' + (error.message || 'Verifique sus credenciales.'));
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    setIsRecoveryLoading(true);
    setErrorMsg('');
    try {
      let emailForAuth = recoveryEmail;
      if (!emailForAuth.includes('@')) {
         emailForAuth = `${emailForAuth}@gendarmeria.gob.ar`;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(emailForAuth, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      
      setShowRecovery(false);
      setErrorMsg('Se ha enviado un enlace de recuperación a su correo electrónico.');
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al solicitar recuperación: ' + error.message);
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegLoading(true);
    setErrorMsg('');
    try {
      let emailForAuth = regData.email;
      if (!emailForAuth.includes('@')) {
         emailForAuth = `${emailForAuth}@gendarmeria.gob.ar`;
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailForAuth,
        password: regData.password
      });
      if (error) throw error;
      
      const newUser = data.user;
      if (newUser) {
        // Save extra data to PostgreSQL
        const { error: insertError } = await supabase.from('users').insert({
          id: newUser.id,
          nombre: regData.nombre,
          apellido: regData.apellido,
          telefono: regData.telefono,
          fechaNacimiento: regData.fechaNacimiento,
          email: emailForAuth,
          password: regData.password,
          status: 'pending',
          role: 'user'
        });
        if (insertError) throw insertError;
      }

      try {
        const message = `🔔 <b>Nuevo Registro Pendiente</b>\n\n👤 <b>Nombre:</b> ${regData.nombre} ${regData.apellido}\n📧 <b>Email:</b> ${emailForAuth}\n📱 <b>Teléfono:</b> ${regData.telefono}\n\nPor favor, ingresa al panel de administración para aceptar o rechazar a este usuario.`;
        await sendTelegramMessage(message);
      } catch (err) {
        console.error("Error enviando notificacion a Telegram:", err);
      }

      setShowRegister(false);
      setErrorMsg('Registro exitoso. Debe esperar la aprobación del administrador para ingresar.');
      // Sign out the newly created user so they can't bypass approval
      await supabase.auth.signOut();
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al registrar usuario: ' + error.message);
    } finally {
      setIsRegLoading(false);
    }
  };

  const handleRegChange = (e) => {
    setRegData({...regData, [e.target.name]: e.target.value});
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <h2 style={{ textAlign: 'center', marginTop: '16px', marginBottom: '24px' }}>Sistema de Registro</h2>
        
        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Usuario / Email</label>
            <input 
              type="text" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Ingrese su usuario o email"
              autoComplete="off"
              required 
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Ingrese su contraseña"
                autoComplete="new-password"
                required 
              />
              <button 
                type="button" 
                className="eye-icon-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="primary full-width" disabled={isLoginLoading}>
            <LogIn size={20} />
            {isLoginLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
          
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', marginTop: '12px', width: '100%', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setShowRecovery(true)}
          >
            ¿Olvidó su contraseña?
          </button>
        </form>



        <button 
          type="button" 
          className="outline full-width" 
          onClick={() => setShowRegister(true)}
        >
          <UserPlus size={20} />
          Registro Nuevo Usuario
        </button>
      </div>

      {showRegister && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Registro Nuevo Usuario</h3>
              <button className="icon-button" onClick={() => setShowRegister(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label>Nombre y Apellido</label>
                <input type="text" name="nombre" onChange={handleRegChange} placeholder="Ej: Juan y Pérez" autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input type="tel" name="telefono" onChange={handleRegChange} placeholder="Ej: 3811234567" autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" name="fechaNacimiento" onChange={handleRegChange} autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Correo electrónico</label>
                <input type="text" name="email" onChange={handleRegChange} placeholder="Ej: correo@ejemplo.com" autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Contraseña</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showRegPassword ? "text" : "password"} 
                    name="password" 
                    onChange={handleRegChange} 
                    placeholder="Escriba su contraseña"
                    autoComplete="new-password"
                    required 
                    minLength="6" 
                  />
                  <button 
                    type="button" 
                    className="eye-icon-btn" 
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button type="button" className="outline" onClick={() => setShowRegister(false)} style={{ flex: 1 }}>
                  Volver atrás
                </button>
                <button type="submit" className="primary" disabled={isRegLoading} style={{ flex: 1 }}>
                  Enviar información
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecovery && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Recuperar Contraseña</h3>
              <button className="icon-button" onClick={() => setShowRecovery(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleRecovery}>
              <div className="input-group">
                <label>Correo electrónico o Usuario</label>
                <input 
                  type="text" 
                  value={recoveryEmail} 
                  onChange={(e) => setRecoveryEmail(e.target.value)} 
                  placeholder="Ingrese su correo electrónico"
                  required 
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                Nota: Por seguridad, se enviará un enlace de restablecimiento a su correo. No se puede cambiar la contraseña directamente sin verificación del correo mediante Supabase.
              </p>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="button" className="outline" onClick={() => setShowRecovery(false)} style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="primary" disabled={isRecoveryLoading} style={{ flex: 1 }}>
                  {isRecoveryLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
