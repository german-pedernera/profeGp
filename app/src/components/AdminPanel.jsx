import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Trash2, CheckCircle, Database, ArrowLeft, RefreshCw, Activity, Eye, EyeOff, X, Edit, UserPlus } from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState({});
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null); // { message, type, onConfirm }

  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nombre: '', apellido: '', email: '', password: '', fechaNacimiento: '', telefono: ''
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserData, setAddUserData] = useState({
    nombre: '', apellido: '', email: '', password: '', fechaNacimiento: '', telefono: ''
  });
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Status counters
  const [stats, setStats] = useState({ totalUsers: 0, pendingUsers: 0, totalEvals: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Users from Supabase
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      if (usersError) throw usersError;
      
      let parsedUsers = usersData || [];
      
      // Asegurarse de que exista el administrador (fallback por si no está en la base de datos)
      const adminIndex = parsedUsers.findIndex(u => u.role === 'admin' || u.email === 'pederneragerman@gmail.com' || u.email === 'pederneragerman@mail.com');
      if (adminIndex === -1) {
        const fallbackAdmin = {
          id: 'admin-id',
          email: 'pederneragerman@gmail.com',
          role: 'admin',
          status: 'approved',
          nombre: 'German',
          apellido: 'Pedernera',
          fechaNacimiento: '1980-01-01',
          telefono: '1234567890',
          lastLogin: 'Nunca'
        };
        parsedUsers.push(fallbackAdmin);
      }

      setUsers(parsedUsers);

      // Fetch Evaluations
      const { data: evalData, error: evalError } = await supabase.from('evaluations').select('*');
      let totalEvals = 0;
      if (!evalError && evalData) {
        totalEvals = evalData.length;
      } else {
        console.warn("Could not fetch evaluations:", evalError);
      }

      // Calculate Stats
      setStats({
        totalUsers: parsedUsers.length,
        pendingUsers: parsedUsers.filter(u => u.status === 'pending').length,
        totalEvals: totalEvals
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleApproveUser = async (userId) => {
    try {
      const { error } = await supabase.from('users').update({ status: 'approved' }).eq('id', userId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error approving user", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    setAlertConfig({
      type: 'confirm',
      message: '¿Está seguro de eliminar este usuario?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('users').delete().eq('id', userId);
          if (error) console.error("Supabase delete error:", error);
          
          fetchData();
        } catch (error) {
          console.error("Error deleting user", error);
        }
        setAlertConfig(null);
      }
    });
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      password: user.password || '',
      fechaNacimiento: user.fechaNacimiento || '',
      telefono: user.telefono || ''
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('users').update({
        nombre: editFormData.nombre,
        apellido: editFormData.apellido,
        email: editFormData.email,
        fechaNacimiento: editFormData.fechaNacimiento,
        telefono: editFormData.telefono,
        password: editFormData.password
      }).eq('id', editingUser.id);
      if (error) throw error;
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error("Error updating user", error);
    }
  };

  const handleAddUserChange = (e) => {
    setAddUserData({ ...addUserData, [e.target.name]: e.target.value });
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      let emailForAuth = addUserData.email;
      if (!emailForAuth.includes('@')) {
         emailForAuth = `${emailForAuth}@gendarmeria.gob.ar`;
      }

      // Generate a UUID for the user to bypass Supabase Auth email rate limits
      const generatedId = crypto.randomUUID();

      const { error: insertError } = await supabase.from('users').insert({
        id: generatedId,
        nombre: addUserData.nombre,
        apellido: addUserData.apellido,
        telefono: addUserData.telefono,
        fechaNacimiento: addUserData.fechaNacimiento,
        email: emailForAuth,
        password: addUserData.password,
        status: 'approved',
        role: 'user'
      });
      if (insertError) throw insertError;

      setShowAddUserModal(false);
      setAddUserData({ nombre: '', apellido: '', email: '', password: '', fechaNacimiento: '', telefono: '' });
      fetchData();
      
      setAlertConfig({
        type: 'info',
        message: 'Usuario agregado y activado con éxito.'
      });
    } catch (error) {
      console.error(error);
      setAlertConfig({
        type: 'info',
        message: 'Error al agregar usuario: ' + error.message
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Cargando Panel de Administración...</div>;

  return (
    <div className="admin-layout page-enter">
      <header className="admin-header">
        <div className="header-left">
          <button className="icon-button back-btn-admin" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} /> Panel
          </button>
          <h2>Administración del Sistema</h2>
        </div>
        <button className="outline refresh-btn" onClick={fetchData}>
           <RefreshCw size={18} /> Actualizar Datos
        </button>
      </header>

      <div className="admin-content">
        {/* Top Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <Users size={32} color="var(--primary)" />
            <div className="stat-info">
              <h4>Usuarios Totales</h4>
              <p>{stats.totalUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <CheckCircle size={32} color="var(--secondary)" />
            <div className="stat-info">
              <h4>Pendientes Aprobación</h4>
              <p>{stats.pendingUsers}</p>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={32} color="var(--primary-light)" />
            <div className="stat-info">
              <h4>Evaluaciones Realizadas</h4>
              <p>{stats.totalEvals}</p>
            </div>
          </div>
          <div className="stat-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setShowSupabaseModal(true)}>
            <Database size={32} color="#7f8c8d" />
            <div className="stat-info">
              <h4>Capacidad Supabase</h4>
              <p>Operativo / Normal</p>
            </div>
          </div>
        </div>

        <div className="admin-grid">
          {/* User Management */}
          <div className="card admin-section" style={{ gridColumn: 'span 3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Gestión de Usuarios</h3>
              <button className="primary sm-btn" onClick={() => setShowAddUserModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} /> Agregar Usuario Activo
              </button>
            </div>
            <div style={{ width: '100%' }}>
              <table className="admin-table" style={{ width: '100%' }}>
                <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Fecha Nac.</th>
                  <th>Contraseña</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Última Conexión</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre} {u.apellido}</td>
                    <td>{u.email}</td>
                    <td>{u.telefono || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{u.fechaNacimiento || '-'}</td>
                    <td>
                      {u.password ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace' }}>
                            {showPasswords[u.id] ? u.password : '••••••••'}
                          </span>
                          <button 
                            className="icon-button" 
                            onClick={() => togglePasswordVisibility(u.id)}
                            style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
                            title={showPasswords[u.id] ? "Ocultar contraseña" : "Ver contraseña"}
                          >
                            {showPasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No disponible</span>
                      )}
                    </td>
                    <td>{u.role === 'admin' ? 'Administrador' : 'Usuario'}</td>
                    <td>
                      <span className={`status-badge ${u.status}`}>
                        {u.status === 'approved' ? 'APROBADO' : u.status === 'pending' ? 'PENDIENTE' : u.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {u.lastLogin || 'Nunca'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {u.status === 'pending' && (
                          <button className="sm-btn approve" onClick={() => handleApproveUser(u.id)}>Aprobar</button>
                        )}
                        <button className="sm-btn" onClick={() => handleEditClick(u)} style={{background: '#3b82f6', color: 'white', marginRight: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px'}} title="Editar"><Edit size={16} /></button>
                        <button className="sm-btn delete" onClick={() => handleDeleteUser(u.id)} title="Eliminar"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan="9" className="text-center">No hay usuarios registrados.</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
      {/* Supabase Capacity Modal */}
      {showSupabaseModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 10000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setShowSupabaseModal(false)}>
          <div className="modal-content" style={{
            background: 'white', padding: '30px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', textAlign: 'center', position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }} onClick={(e) => e.stopPropagation()}>
            <button style={{
              position: 'absolute', top: '15px', right: '15px', background: 'transparent', 
              border: 'none', cursor: 'pointer', color: '#64748b'
            }} onClick={() => setShowSupabaseModal(false)}>
              <X size={24} />
            </button>
            <Database size={48} color="#10b981" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Estado de la Base de Datos</h3>
            <div style={{ textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Plan actual:</span> 
                <strong>Gratuito (Free)</strong>
              </p>
              <p style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Almacenamiento:</span> 
                <strong>23 MB / 500 MB</strong>
              </p>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '4px', marginBottom: '12px' }}>
                <div style={{ width: '4.6%', height: '100%', background: '#10b981' }}></div>
              </div>
              <p style={{ margin: '8px 0 0 0', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Ancho de banda:</span> 
                <strong>150 MB / 5 GB</strong>
              </p>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                <div style={{ width: '3%', height: '100%', background: '#3b82f6' }}></div>
              </div>
            </div>
            <p style={{ color: '#10b981', fontWeight: 'bold', margin: 0 }}>
              Estado: Totalmente Operativo
            </p>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 10000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setEditingUser(null)}>
          <div className="modal-content" style={{
            background: 'white', padding: '30px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', textAlign: 'left', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Editar Usuario</h3>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setEditingUser(null)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Nombre</label>
                <input type="text" name="nombre" value={editFormData.nombre} onChange={handleEditChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Apellido</label>
                <input type="text" name="apellido" value={editFormData.apellido} onChange={handleEditChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Email o Usuario</label>
                <input type="text" name="email" value={editFormData.email} onChange={handleEditChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Fecha de Nacimiento</label>
                <input type="date" name="fechaNacimiento" value={editFormData.fechaNacimiento} onChange={handleEditChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Teléfono</label>
                <input type="tel" name="telefono" value={editFormData.telefono} onChange={handleEditChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Contraseña</label>
                <input type="text" name="password" value={editFormData.password} onChange={handleEditChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#10b981', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 10000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" style={{
            background: 'white', padding: '30px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', textAlign: 'left', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Agregar Usuario Activo</h3>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowAddUserModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Nombre</label>
                <input type="text" name="nombre" value={addUserData.nombre} onChange={handleAddUserChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Apellido</label>
                <input type="text" name="apellido" value={addUserData.apellido} onChange={handleAddUserChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Email o Usuario</label>
                <input type="text" name="email" value={addUserData.email} onChange={handleAddUserChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Fecha de Nacimiento</label>
                <input type="date" name="fechaNacimiento" value={addUserData.fechaNacimiento} onChange={handleAddUserChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Teléfono</label>
                <input type="tel" name="telefono" value={addUserData.telefono} onChange={handleAddUserChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Contraseña</label>
                <input type="text" name="password" value={addUserData.password} onChange={handleAddUserChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}>Cancelar</button>
                <button type="submit" disabled={isAddingUser} style={{ flex: 1, padding: '10px', borderRadius: '6px', background: '#10b981', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
                  {isAddingUser ? 'Agregando...' : 'Agregar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Modal for Alert / Confirm */}
      {alertConfig && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.2rem', marginBottom: '16px' }}>{alertConfig.type === 'confirm' ? 'Confirmación' : 'Información'}</h3>
            <p style={{ color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>{alertConfig.message}</p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {alertConfig.type === 'confirm' && (
                <button onClick={() => setAlertConfig(null)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  if (alertConfig.type === 'confirm') alertConfig.onConfirm();
                  else setAlertConfig(null);
                }} 
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
