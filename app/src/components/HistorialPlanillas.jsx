import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Calendar, User, Download, ArrowLeft, Trash2, X } from 'lucide-react';
import { exportPlanillaToExcel } from '../utils/excelExport';
import { sortEvaluations } from '../utils/constants';
import './AdminPanel.css'; // Reusing some admin panel styles for consistency

const HistorialPlanillas = ({ userData }) => {
  const navigate = useNavigate();
  const [planillas, setPlanillas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPlanillaToView, setSelectedPlanillaToView] = useState(null);
  const [isClosingModal, setIsClosingModal] = useState(false);

  // Custom Alert/Confirm Modal
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, onCancel: null });
  const showDialog = (type, title, message, onConfirm, onCancel = null) => setDialogState({ isOpen: true, type, title, message, onConfirm, onCancel });
  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }));

  const fetchPlanillas = async () => {
    setLoading(true);
    try {
      // 1. Cargar locales
      const localPlanillas = JSON.parse(localStorage.getItem('gp_planillas') || '[]');
      
      // 2. Intentar cargar de Supabase
      let supaPlanillas = [];
      try {
        const { data, error } = await supabase.from('planillas').select('*');
        if (!error && data) {
          supaPlanillas = data;
        }
      } catch {
        console.warn("Supabase planillas no disponible, usando local");
      }

      // Fusionar asegurando no duplicados
      const combined = [...localPlanillas];
      supaPlanillas.forEach(sp => {
        if (!combined.find(c => c.id === sp.id)) {
          combined.push(sp);
        }
      });

      // Filtrar por rol: El admin ve todo, el usuario normal solo las suyas
      const filtered = combined.filter(p => {
        if (userData?.role === 'admin') return true;
        return p.evaluadorId === userData?.email;
      });

      // Ordenar por fecha de creación (más reciente primero)
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setPlanillas(filtered);
    } catch (error) {
      console.error("Error fetching planillas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlanillas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleDelete = (id) => {
    showDialog('confirm', 'Eliminar Planilla', '¿Está seguro de eliminar esta planilla? Esta acción no se puede deshacer.', async () => {
      // Eliminar local
      let local = JSON.parse(localStorage.getItem('gp_planillas') || '[]');
      local = local.filter(p => p.id !== id);
      localStorage.setItem('gp_planillas', JSON.stringify(local));

      // Intentar eliminar en Supabase
      try {
        await supabase.from('planillas').delete().eq('id', id);
      } catch {
        console.log('Error deleting from supabase');
      }

      setPlanillas(planillas.filter(p => p.id !== id));
      closeDialog();
    }, closeDialog);
  };

  const handleExportExcel = (planilla) => {
    exportPlanillaToExcel(planilla.evaluaciones || [], planilla.fecha_examen);
  };

  const filteredPlanillas = planillas.filter(p => 
    (p.fecha_examen || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (planilla) => {
    setSelectedPlanillaToView(planilla);
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setSelectedPlanillaToView(null);
      setIsClosingModal(false);
    }, 300);
  };

  // Calcula celdas unidas por categoria
  const getSortedEvaluationsForView = () => {
    if (!selectedPlanillaToView || !selectedPlanillaToView.evaluaciones) return [];
    
    let sorted = sortEvaluations(selectedPlanillaToView.evaluaciones);

    // Añadir counts para rowspan
    let currentCat = null;
    let currentCount = 0;
    let startIndex = 0;

    sorted.forEach((ev, idx) => {
      ev.nroOrden = idx + 1;
      if (ev.categoria !== currentCat) {
        if (currentCat !== null) {
          sorted[startIndex].catCount = currentCount;
        }
        currentCat = ev.categoria;
        currentCount = 1;
        startIndex = idx;
        ev.isFirstInCat = true;
        ev.catLabel = ev.categoria;
      } else {
        currentCount++;
        ev.isFirstInCat = false;
      }
    });

    if (currentCat !== null) {
      sorted[startIndex].catCount = currentCount;
    }

    return sorted;
  };

  return (
    <div className="admin-layout page-enter">
      <header className="admin-header">
        <div className="header-left">
          <button className="icon-button back-btn-admin" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={20} /> Volver
          </button>
          <h2>Historial de Planillas</h2>
        </div>
        <div className="search-container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'white', 
          padding: '12px 20px', 
          borderRadius: '50px', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
          width: '350px',
          maxWidth: '100%'
        }}>
          <Search size={20} color="#64748b" />
          <input 
            type="text" 
            placeholder="Buscar por fecha..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              border: 'none', 
              outline: 'none', 
              background: 'transparent', 
              marginLeft: '12px', 
              width: '100%',
              fontSize: '1rem',
              color: '#334155'
            }}
          />
        </div>
      </header>

      <div className="admin-content" style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', paddingTop: '40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando planillas...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredPlanillas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ color: '#475569', marginBottom: '8px' }}>No hay planillas registradas</h3>
                <p style={{ color: '#94a3b8' }}>Las planillas que guardes aparecerán aquí.</p>
              </div>
            ) : (
              filteredPlanillas.map(planilla => (
                <div className="planilla-card" key={planilla.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between', transition: 'box-shadow 0.2s, transform 0.2s' }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'} onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', flex: '1' }} onClick={() => handleOpenModal(planilla)}>
                    <div style={{ background: '#20604b', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={28} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '6px', color: '#002855' }}>
                        Examen del {planilla.fecha_examen || 'Sin fecha'}
                      </h3>
                      {planilla.descripcion && planilla.descripcion !== 'Sin descripción' && (
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#334155' }}>
                          {planilla.descripcion}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}>
                          <User size={14} style={{ flexShrink: 0 }} /> 
                          Guardado por: {planilla.evaluadorId}
                        </span>
                        <span>• {(planilla.evaluaciones || []).length} personas evaluadas</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="planilla-actions" style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <button onClick={() => handleExportExcel(planilla)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background='#059669'} onMouseOut={e => e.target.style.background='#10b981'}>
                      <Download size={16} />
                      Exportar Excel
                    </button>
                    {userData?.role === 'admin' && (
                      <button onClick={() => handleDelete(planilla.id)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e => e.target.style.background='#fecaca'} onMouseOut={e => e.target.style.background='#fee2e2'} title="Eliminar Planilla">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedPlanillaToView && (
        <div className={`modal-overlay modal-overlay-anim ${isClosingModal ? 'closing' : ''}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className={`modal-content modal-content-anim ${isClosingModal ? 'closing' : ''}`} style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '1400px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', color: '#0f172a', marginBottom: '8px' }}>Vista Previa de Planilla</h2>
                <p style={{ color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} /> Examen del {selectedPlanillaToView.fecha_examen} • {(selectedPlanillaToView.evaluaciones || []).length} personas evaluadas
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={() => handleExportExcel(selectedPlanillaToView)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }} onMouseOver={e => e.target.style.transform='translateY(-2px)'} onMouseOut={e => e.target.style.transform='none'}>
                  <Download size={18} />
                  Exportar Excel
                </button>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '8px' }} onMouseOver={e => e.currentTarget.style.color = '#ef4444'} onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                  <X size={28} />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '1200px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>CAT</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>NRO DE<br/>ORDEN</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>GRADO</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1', textAlign: 'left' }}>APELLIDO Y NOMBRES</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>EDAD</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PESO</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>TALLA</th>
                    <th colSpan="10" style={{ padding: '8px', color: '#334155', fontWeight: '600', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}>RENDIMIENTO Y PUNTAJE DE PRUEBAS</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PUNTAJE</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600' }}>PROMEDIO</th>
                  </tr>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px dotted #cbd5e1' }}>CARRERA<br/>AERÓBICA</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PTS</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px dotted #cbd5e1' }}>BARRA</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PTS</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px dotted #cbd5e1' }}>PLANCHA<br/>ISOMÉTRICA</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PTS</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px dotted #cbd5e1' }}>FLEXO EXT.<br/>BRAZOS</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PTS</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px dotted #cbd5e1' }}>PLIOMETRÍA</th>
                    <th style={{ padding: '8px 4px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedEvaluationsForView().length === 0 ? (
                    <tr><td colSpan="19" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '1.1em' }}>No hay evaluaciones cargadas.</td></tr>
                  ) : (
                    getSortedEvaluationsForView().map(ev => {
                      return (
                        <tr key={ev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {ev.isFirstInCat && (
                            <td rowSpan={ev.catCount} style={{ padding: '8px', color: '#1e293b', fontWeight: 'bold', borderRight: '2px solid #cbd5e1', background: '#f8fafc', fontSize: '1.2em' }}>
                              {ev.catLabel}
                            </td>
                          )}
                          <td style={{ padding: '8px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{ev.nroOrden}</td>
                          <td style={{ padding: '8px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{ev.jerarquia}</td>
                          <td style={{ padding: '8px', color: '#1e293b', fontWeight: '600', borderRight: '1px solid #e2e8f0', textAlign: 'left' }}>{ev.nombreApellido}</td>
                          <td style={{ padding: '8px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{ev.edad}</td>
                          <td style={{ padding: '8px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{ev.peso}</td>
                          <td style={{ padding: '8px', color: '#475569', borderRight: '1px solid #e2e8f0' }}>{ev.talla}</td>
                          
                          <td style={{ padding: '8px', borderRight: '1px dotted #e2e8f0' }}>{ev.pruebas?.carreraAerobica || '-'}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b' }}>{ev.resultados?.carreraAerobicaPts || '-'}</td>
                          
                          <td style={{ padding: '8px', borderRight: '1px dotted #e2e8f0' }}>{ev.pruebas?.barraFija || '-'}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b' }}>{ev.resultados?.barraFijaPts || '-'}</td>
                          
                          <td style={{ padding: '8px', borderRight: '1px dotted #e2e8f0' }}>{ev.pruebas?.planchaIsometrica || '-'}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b' }}>{ev.resultados?.planchaIsometricaPts || '-'}</td>
                          
                          <td style={{ padding: '8px', borderRight: '1px dotted #e2e8f0' }}>{ev.pruebas?.flexoExtensionBrazos || '-'}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b' }}>{ev.resultados?.flexoExtensionBrazosPts || '-'}</td>
                          
                          <td style={{ padding: '8px', borderRight: '1px dotted #e2e8f0' }}>{ev.pruebas?.pliometria || '-'}</td>
                          <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#1e293b' }}>{ev.resultados?.pliometriaPts || '-'}</td>
                          
                          <td style={{ padding: '8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '1.1em', color: '#0f172a' }}>
                            {(() => {
                              let t = 0;
                              if (ev.resultados?.carreraAerobicaPts) t += ev.resultados.carreraAerobicaPts;
                              if (ev.resultados?.planchaIsometricaPts) t += ev.resultados.planchaIsometricaPts;
                              if (ev.resultados?.flexoExtensionBrazosPts) t += ev.resultados.flexoExtensionBrazosPts;
                              if (ev.resultados?.pliometriaPts) t += ev.resultados.pliometriaPts;
                              if (ev.resultados?.barraFijaPts) t += ev.resultados.barraFijaPts;
                              return t > 0 ? t : '-';
                            })()}
                          </td>
                          <td style={{ padding: '8px', fontWeight: 'bold', fontSize: '1.1em', color: '#0f172a' }}>
                            {(() => {
                              let t = 0, n = 0;
                              if (ev.resultados?.carreraAerobicaPts) { t += ev.resultados.carreraAerobicaPts; n++; }
                              if (ev.resultados?.planchaIsometricaPts) { t += ev.resultados.planchaIsometricaPts; n++; }
                              if (ev.resultados?.flexoExtensionBrazosPts) { t += ev.resultados.flexoExtensionBrazosPts; n++; }
                              if (ev.resultados?.pliometriaPts) { t += ev.resultados.pliometriaPts; n++; }
                              if (ev.resultados?.barraFijaPts) { t += ev.resultados.barraFijaPts; n++; }
                              return n > 0 ? (t / n).toFixed(2) : '-';
                            })()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Custom Dialog Modal */}
      {dialogState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: '12px' }}>{dialogState.title}</h3>
            <p style={{ color: '#475569', marginBottom: '24px', fontSize: '1rem', lineHeight: '1.5' }}>{dialogState.message}</p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {dialogState.type === 'confirm' && (
                <button onClick={dialogState.onCancel} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
              <button onClick={dialogState.onConfirm} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {dialogState.type === 'alert' ? 'Aceptar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialPlanillas;
