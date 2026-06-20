import { useState, useEffect } from 'react';
import { LogIn, UserPlus, X, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo-gendarmeria.png';
import './Login.css';

const AuthLogin = () => {
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Recovery State
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recData, setRecData] = useState({
    email: '',
    telefono: '',
    fechaNacimiento: '',
    newPassword: ''
  });
  const [showRecPassword, setShowRecPassword] = useState(false);

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

  useEffect(() => {
    // Ensure admin user exists in localStorage so they can be viewed and edited in the Admin Panel
    const usersData = localStorage.getItem('gp_users');
    let users = usersData ? JSON.parse(usersData) : [];
    const adminIndex = users.findIndex(u => u.role === 'admin' || u.email === 'pederneragerman@gmail.com' || u.email === 'pederneragerman@mail.com');
    if (adminIndex === -1) {
      users.push({
        id: 'admin-id',
        email: 'pederneragerman@gmail.com',
        password: 'Emi25$',
        role: 'admin',
        status: 'approved',
        nombre: 'German',
        apellido: 'Pedernera',
        fechaNacimiento: '1980-01-01',
        telefono: '1234567890',
        lastLogin: 'Nunca'
      });
      localStorage.setItem('gp_users', JSON.stringify(users));
    }
  }, []);

  // Helper to get max date (18 years ago from today)
  const getMaxDate18YearsAgo = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  };
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setErrorMsg('');
    
    try {
      const usersData = localStorage.getItem('gp_users');
      let users = usersData ? JSON.parse(usersData) : [];

      let user = users.find(u => u.email === email && u.password === password);
      
      // Fallback in case the admin user was deleted from localStorage
      if (!user && (email === 'pederneragerman@mail.com' || email === 'pederneragerman@gmail.com') && password === 'Emi25$') {
         user = { id: 'admin-id', email: email, role: 'admin', status: 'approved', nombre: 'German', apellido: 'Pedernera' };
         users.push(user);
         localStorage.setItem('gp_users', JSON.stringify(users));
      }

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      if (user.status !== 'approved') {
        throw new Error('Su cuenta está pendiente de aprobación por el administrador');
      }

      // Record last login
      const now = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
      user.lastLogin = now;
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].lastLogin = now;
        localStorage.setItem('gp_users', JSON.stringify(users));
      }

      // Login exitoso
      const sessionUser = { ...user };
      delete sessionUser.password; // No guardar la contraseña en la sesión activa
      document.querySelector('.login-container').classList.add('page-exit');

      try {
        const token = "8828507915:AAGMoiBuuRAwozHqYKnq1Vf56k2b33bEsTM";
        const chatId = "1222847704";
        const message = `🟢 <b>Nuevo Inicio de Sesión</b>\n\n👤 <b>Usuario:</b> ${user.nombre} ${user.apellido}\n📧 <b>Email:</b> ${user.email}\n⏱ <b>Hora:</b> ${now}`;
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
        });
      } catch (err) {
        console.error("Telegram notification error:", err);
      }

      setTimeout(() => {
        sessionStorage.setItem('gp_session', JSON.stringify(sessionUser));
        window.location.href = '/dashboard';
      }, 300);

    } catch (error) {
      console.error("Login error details:", error);
      setErrorMsg('Error: ' + (error.message || 'Verifique sus credenciales.'));
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegChange = (e) => {
    setRegData({ ...regData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegLoading(true);
    setErrorMsg('');
    try {
      let emailForAuth = regData.email;
      
      const usersData = localStorage.getItem('gp_users');
      let users = [];
      if (usersData) {
        users = JSON.parse(usersData);
      }

      // Validar si el email ya existe
      if (users.find(u => u.email === emailForAuth)) {
        throw new Error('El correo ya está registrado');
      }

      const newUser = {
        id: crypto.randomUUID(),
        nombre: regData.nombre,
        apellido: regData.apellido,
        telefono: regData.telefono,
        fechaNacimiento: regData.fechaNacimiento,
        email: emailForAuth,
        password: regData.password, // Solo para el simulador local
        status: 'pending',
        role: 'user'
      };

      users.push(newUser);
      localStorage.setItem('gp_users', JSON.stringify(users));

      try {
        const token = "8828507915:AAGMoiBuuRAwozHqYKnq1Vf56k2b33bEsTM";
        const chatId = "1222847704";
        const message = `🔔 <b>Nuevo Registro Pendiente</b>\n\n👤 <b>Nombre:</b> ${newUser.nombre} ${newUser.apellido}\n📧 <b>Email:</b> ${newUser.email}\n📱 <b>Teléfono:</b> ${newUser.telefono}\n\nPor favor, ingresa al panel de administración para aceptar o rechazar a este usuario.`;
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
          })
        });
      } catch (err) {
        console.error("Error enviando notificacion a Telegram:", err);
      }

      setShowRegister(false);
      setErrorMsg('Registro exitoso. Debe esperar la aprobación del administrador para ingresar.');
    } catch (error) {
      console.error(error);
      setErrorMsg('Error al registrar usuario: ' + error.message);
    } finally {
      setIsRegLoading(false);
    }
  };

  const handleRecChange = (e) => {
    setRecData({...recData, [e.target.name]: e.target.value});
  };

  const handleValidateRecovery = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const usersData = localStorage.getItem('gp_users');
    let users = usersData ? JSON.parse(usersData) : [];
    
    let emailForRec = recData.email;
    if (emailForRec && !emailForRec.includes('@')) {
       emailForRec = `${emailForRec}@gendarmeria.gob.ar`;
    }

    const user = users.find(u => 
      u.email === emailForRec && 
      u.telefono === recData.telefono && 
      u.fechaNacimiento === recData.fechaNacimiento
    );

    if (user) {
      setRecoveryStep(2);
      setErrorMsg('');
    } else {
      setErrorMsg('Los datos ingresados no coinciden con ningún usuario registrado.');
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    const usersData = localStorage.getItem('gp_users');
    let users = usersData ? JSON.parse(usersData) : [];
    
    let emailForRec = recData.email;
    if (emailForRec && !emailForRec.includes('@')) {
       emailForRec = `${emailForRec}@gendarmeria.gob.ar`;
    }

    const userIndex = users.findIndex(u => u.email === emailForRec);
    if (userIndex !== -1) {
      users[userIndex].password = recData.newPassword;
      localStorage.setItem('gp_users', JSON.stringify(users));
      setShowRecovery(false);
      setRecoveryStep(1);
      setRecData({ email: '', telefono: '', fechaNacimiento: '', newPassword: '' });
      setErrorMsg('Contraseña actualizada exitosamente. Ya puede ingresar con su nueva clave.');
    } else {
      setErrorMsg('Hubo un error al actualizar la contraseña.');
    }
  };

  return (
    <div className="login-container page-enter">
      <div className="login-card card">
        <div className="logo-container">
          <div className="round-logo">
            <img src={logo} alt="Logo" />
          </div>
        </div>
        
        <h2 className="text-center" style={{ marginBottom: '24px', color: 'var(--primary)' }}>
          Sistema de Registro Profe Gp
        </h2>
        
        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Ej: juan.perez@gmail.com"
              title="Ingresa tu correo electrónico registrado"
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
                placeholder="Ingresa tu contraseña"
                title="Ingresa tu contraseña de acceso secreto"
                autoComplete="new-password"
                required 
              />
              <button 
                type="button" 
                className="eye-icon-btn" 
                onClick={() => setShowPassword(!showPassword)}
                title="Mostrar/Ocultar contraseña"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="primary full-width" disabled={isLoginLoading} title="Haz clic para iniciar sesión en el sistema">
            <LogIn size={20} />
            {isLoginLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
          
          <button 
            type="button" 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', marginTop: '12px', width: '100%', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => { setShowRecovery(true); setRecoveryStep(1); setErrorMsg(''); }}
          >
            ¿Olvidó su contraseña?
          </button>
        </form>

        <div className="divider"></div>

        <button 
          className="outline full-width" 
          onClick={() => { setShowRegister(true); setErrorMsg(''); }}
        >
          <UserPlus size={20} />
          Registro Nuevo Usuario
        </button>
      </div>

      {showRegister && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h3>Registro de Nuevo Usuario</h3>
              <button className="icon-button" onClick={() => setShowRegister(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label>Nombre</label>
                <input type="text" name="nombre" onChange={handleRegChange} placeholder="Ej: Juan" autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Apellido</label>
                <input type="text" name="apellido" onChange={handleRegChange} placeholder="Ej: Pérez" autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input type="tel" name="telefono" onChange={handleRegChange} placeholder="Ej: 3811234567" autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" name="fechaNacimiento" onChange={handleRegChange} max={getMaxDate18YearsAgo()} autoComplete="off" required />
              </div>
              <div className="input-group">
                <label>Correo electrónico</label>
                <input type="text" name="email" onChange={handleRegChange} placeholder="Ej: jperez@gmail.com" autoComplete="off" required />
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
                <button type="button" className="outline full-width" onClick={() => setShowRegister(false)}>
                  Volver atrás
                </button>
                <button type="submit" className="primary full-width" disabled={isRegLoading}>
                  {isRegLoading ? 'Registrando...' : 'Enviar información'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecovery && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h3>Recuperar Contraseña</h3>
              <button className="icon-button" onClick={() => { setShowRecovery(false); setRecoveryStep(1); }}>
                <X size={24} />
              </button>
            </div>
            
            {recoveryStep === 1 ? (
              <form onSubmit={handleValidateRecovery}>
                <div className="input-group">
                  <label>Correo Electrónico</label>
                  <input type="text" name="email" value={recData.email} onChange={handleRecChange} placeholder="Email o usuario" required />
                </div>
                <div className="input-group">
                  <label>Teléfono Registrado</label>
                  <input type="tel" name="telefono" value={recData.telefono} onChange={handleRecChange} placeholder="Su teléfono" required />
                </div>
                <div className="input-group">
                  <label>Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={recData.fechaNacimiento} onChange={handleRecChange} required />
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button type="button" className="outline full-width" onClick={() => { setShowRecovery(false); setRecoveryStep(1); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="primary full-width">
                    Validar Datos
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword}>
                <div className="input-group">
                  <label>Nueva Contraseña</label>
                  <div className="password-input-wrapper">
                    <input 
                      type={showRecPassword ? "text" : "password"} 
                      name="newPassword" 
                      value={recData.newPassword}
                      onChange={handleRecChange} 
                      placeholder="Ingrese su nueva contraseña"
                      required 
                      minLength="6" 
                    />
                    <button 
                      type="button" 
                      className="eye-icon-btn" 
                      onClick={() => setShowRecPassword(!showRecPassword)}
                    >
                      {showRecPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button type="button" className="outline full-width" onClick={() => setRecoveryStep(1)}>
                    Volver atrás
                  </button>
                  <button type="submit" className="primary full-width">
                    Cambiar Contraseña
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthLogin;
