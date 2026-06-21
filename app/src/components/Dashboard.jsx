import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tablasData } from '../data/tablasExigencias';
import { supabase } from '../supabaseClient';
import { 
  Activity, 
  Shield, 
  Award, 
  Users, 
  ArrowRight, 
  ClipboardList, 
  TrendingUp, 
  Layers 
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ userData }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedTabla = searchParams.get('tabla');

  const [stats, setStats] = useState({ total: 0, promedio: '0.0', aprobadosPercent: 0, sobresalientes: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      let evals = [];
      try {
        const { data, error } = await supabase.from('evaluations').select('*');
        if (!error && data && data.length > 0) {
          evals = data;
        } else {
          evals = JSON.parse(localStorage.getItem('gp_evaluations') || '[]');
        }
      } catch (err) {
        evals = JSON.parse(localStorage.getItem('gp_evaluations') || '[]');
      }

      if (evals.length > 0) {
        let totalPromedio = 0;
        let aprobadosCount = 0;
        let sobresalienteCount = 0;
        
        evals.forEach(ev => {
          let t = 0, n = 0;
          if (ev.resultados?.carreraAerobicaPts) { t += ev.resultados.carreraAerobicaPts; n++; }
          if (ev.resultados?.planchaIsometricaPts) { t += ev.resultados.planchaIsometricaPts; n++; }
          if (ev.resultados?.flexoExtensionBrazosPts) { t += ev.resultados.flexoExtensionBrazosPts; n++; }
          if (ev.resultados?.pliometriaPts) { t += ev.resultados.pliometriaPts; n++; }
          if (ev.resultados?.barraFijaPts) { t += ev.resultados.barraFijaPts; n++; }
          const avg = n > 0 ? (t / n) : 0;
          totalPromedio += avg;

          if (avg >= 90) {
            sobresalienteCount++;
          }
          if (avg >= 40) {
            aprobadosCount++;
          }
        });

        setStats({
          total: evals.length,
          promedio: (totalPromedio / evals.length).toFixed(1),
          aprobadosPercent: Math.round((aprobadosCount / evals.length) * 100),
          sobresalientes: sobresalienteCount
        });
      }
      setLoadingStats(false);
    };

    fetchStats();
  }, []);

  const programaPruebas = [
    {
      id: 'carrera',
      title: 'Carrera Aeróbica 3 KM',
      metric: 'Tiempo (min:seg)',
      description: 'Evalúa la capacidad aeróbica máxima y resistencia cardiovascular en carrera continua de 3000 metros.',
      categories: 'Diferenciado por género y rangos de edad (CAT 1-4)',
      icon: <Activity size={24} style={{ color: '#0ea5e9' }} />,
      color: '#e0f2fe'
    },
    {
      id: 'plancha',
      title: 'Plancha Isométrica',
      metric: 'Tiempo (min:seg)',
      description: 'Mide la fuerza y resistencia estática del core (recto abdominal, oblicuos y estabilizadores lumbares).',
      categories: 'Mismo baremo para masculino y femenino',
      icon: <Shield size={24} style={{ color: '#10b981' }} />,
      color: '#d1fae5'
    },
    {
      id: 'brazos',
      title: 'Flexo-Extensión de Brazos',
      metric: 'Repeticiones en 40"',
      description: 'Evalúa la resistencia muscular y fuerza dinámica de los músculos de empuje del tren superior (brazos, pecho).',
      categories: 'Diferenciado por género y rangos de edad (CAT 1-4)',
      icon: <Layers size={24} style={{ color: '#f59e0b' }} />,
      color: '#fef3c7'
    },
    {
      id: 'pliometria',
      title: 'Pliometría (Sentadillas con Salto)',
      metric: 'Repeticiones en 30"',
      description: 'Mide la potencia muscular, reactividad y fuerza explosiva del tren inferior mediante sentadillas con salto.',
      categories: 'Mismo baremo para masculino y femenino',
      icon: <TrendingUp size={24} style={{ color: '#8b5cf6' }} />,
      color: '#ede9fe'
    },
    {
      id: 'barra',
      title: 'Prueba de Barra Fija',
      metric: 'Variante según aptitud',
      description: 'Evaluación de fuerza de tracción y agarre. Permite elegir entre Dominadas, Retracción Escapular o Isométrica 90°.',
      categories: 'Opcional según capacidades y categoría',
      icon: <Award size={24} style={{ color: '#ec4899' }} />,
      color: '#fce7f3'
    }
  ];

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        .stat-card-custom {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .stat-card-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
        }
        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }
        .stat-info-custom h4 {
          margin: 0;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-info-custom .stat-number {
          margin: 4px 0 0 0;
          font-size: 1.6rem;
          font-weight: 800;
          color: #0f172a;
        }
        
        .program-section-title {
          font-size: 1.4rem;
          font-weight: 750;
          color: #0f172a;
          margin-top: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .program-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .program-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: transform 0.25s, box-shadow 0.25s;
        }
        
        .program-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.08);
        }
        
        .program-card-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .program-icon-container {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .program-card-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }
        
        .program-card-metric {
          font-size: 0.8rem;
          color: var(--primary);
          font-weight: 600;
          background: rgba(11, 66, 50, 0.08);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
          margin-top: 4px;
        }
        
        .program-card-body {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.5;
          margin-bottom: 16px;
          flex-grow: 1;
        }
        
        .program-card-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 500;
        }
        
        .action-banner {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          border-radius: 20px;
          padding: 32px;
          color: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          margin-bottom: 32px;
        }
        
        .action-banner-content h3 {
          margin: 0 0 8px 0;
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .action-banner-content p {
          margin: 0;
          font-size: 1.05rem;
          opacity: 0.9;
        }
        
        .action-banner-btn {
          background: #ffffff;
          color: var(--primary) !important;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .action-banner-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px rgba(0,0,0,0.15);
          background: #f8fafc;
        }
      `}</style>

      {/* Main Content Area */}
      <div className="main-content" style={{ overflowY: 'visible', flex: 1 }}>
        <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2>Bienvenido/a, {userData ? `${userData.nombre} ${userData.apellido}` : 'Usuario'}</h2>
            <div className="user-role">{userData?.role === 'admin' ? 'Administrador' : 'Personal'}</div>
          </div>
        </header>

        <div className="content-body">
          {selectedTabla === null ? (
            <div className="welcome-section">
              {/* Action Banner */}
              <div className="action-banner">
                <div className="action-banner-content">
                  <h3>Evaluación de Rendimiento Físico</h3>
                  <p>Gestione y registre las marcas de los exámenes físicos de acuerdo al PON 06/25 de la fuerza.</p>
                </div>
                <button className="action-banner-btn" onClick={() => navigate('/carga-exigencias')}>
                  Comenzar Carga <ArrowRight size={18} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="dashboard-grid">
                <div className="stat-card-custom">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(11, 66, 50, 0.1)', color: 'var(--primary)' }}>
                    <Users size={24} />
                  </div>
                  <div className="stat-info-custom">
                    <h4>Evaluaciones Cargadas</h4>
                    <div className="stat-number">{loadingStats ? '...' : stats.total}</div>
                  </div>
                </div>

                <div className="stat-card-custom">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                    <Activity size={24} />
                  </div>
                  <div className="stat-info-custom">
                    <h4>Promedio General</h4>
                    <div className="stat-number">{loadingStats ? '...' : `${stats.promedio} pts`}</div>
                  </div>
                </div>

                <div className="stat-card-custom">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <Shield size={24} />
                  </div>
                  <div className="stat-info-custom">
                    <h4>Tasa de Aprobación</h4>
                    <div className="stat-number">{loadingStats ? '...' : `${stats.aprobadosPercent}%`}</div>
                  </div>
                </div>

                <div className="stat-card-custom">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                    <Award size={24} />
                  </div>
                  <div className="stat-info-custom">
                    <h4>Sobresalientes (&gt;=90)</h4>
                    <div className="stat-number">{loadingStats ? '...' : stats.sobresalientes}</div>
                  </div>
                </div>
              </div>

              {/* Program Section */}
              <h3 className="program-section-title">
                <ClipboardList size={22} style={{ color: 'var(--primary)' }} />
                Programa de Exigencias Físicas (Baremos)
              </h3>
              
              <div className="program-grid">
                {programaPruebas.map((prueba) => (
                  <div key={prueba.id} className="program-card">
                    <div>
                      <div className="program-card-header">
                        <div className="program-icon-container" style={{ backgroundColor: prueba.color }}>
                          {prueba.icon}
                        </div>
                        <div>
                          <h4 className="program-card-title">{prueba.title}</h4>
                          <span className="program-card-metric">{prueba.metric}</span>
                        </div>
                      </div>
                      <p className="program-card-body">{prueba.description}</p>
                    </div>
                    <div className="program-card-footer">
                      {prueba.categories}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="tablas-section">
               <div className="card full-width-card" style={{ padding: '32px', background: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
                 <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedTabla}</h2>
                 <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                   <table className="exigencias-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#334155', backgroundColor: '#ffffff' }}>
                     <thead>
                       <tr>
                         <th rowSpan="2" style={{ padding: '16px', background: 'var(--primary)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontWeight: '600' }}>PUNTAJE</th>
                         <th style={{ padding: '16px', background: 'var(--primary)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontWeight: '600' }}>CAT 1</th>
                         <th style={{ padding: '16px', background: 'var(--primary)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontWeight: '600' }}>CAT 2</th>
                         <th style={{ padding: '16px', background: 'var(--primary)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontWeight: '600' }}>CAT 3</th>
                         <th style={{ padding: '16px', background: 'var(--primary)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontWeight: '600' }}>CAT 4</th>
                       </tr>
                       <tr>
                         <th style={{ padding: '12px', background: 'var(--accent)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontSize: '0.9em', fontWeight: '500' }}>HASTA 30 AÑOS</th>
                         <th style={{ padding: '12px', background: 'var(--accent)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontSize: '0.9em', fontWeight: '500' }}>31 A 40 AÑOS</th>
                         <th style={{ padding: '12px', background: 'var(--accent)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontSize: '0.9em', fontWeight: '500' }}>41 A 50 AÑOS</th>
                         <th style={{ padding: '12px', background: 'var(--accent)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', fontSize: '0.9em', fontWeight: '500' }}>51 AÑOS EN ADELANTE</th>
                       </tr>
                     </thead>
                     <tbody>
                       {(() => {
                         let currentCategory = "";
                         return tablasData[selectedTabla]?.map((row, index) => {
                           if (row[0]) {
                             currentCategory = row[0];
                           }
                           
                           const rowBgColor = currentCategory === "SOBRESALIENTE" ? '#d1fae5' : 
                                              currentCategory === "APROBÓ" ? '#dbeafe' : 
                                              currentCategory === "NO APROBÓ" ? '#fee2e2' : '#ffffff';

                           const hoverBgColor = currentCategory === "SOBRESALIENTE" ? '#bbf7d0' : 
                                                currentCategory === "APROBÓ" ? '#bfdbfe' : 
                                                currentCategory === "NO APROBÓ" ? '#fecaca' : '#f1f5f9';

                           const textColor = currentCategory === "SOBRESALIENTE" ? '#065f46' : 
                                             currentCategory === "APROBÓ" ? '#1e40af' : 
                                             currentCategory === "NO APROBÓ" ? '#991b1b' : '#334155';

                           return (
                             <tr key={index} style={{ backgroundColor: rowBgColor, color: textColor, transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hoverBgColor} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowBgColor}>
                               {row[0] && <td rowSpan={row[0] === "SOBRESALIENTE" ? 2 : row[0] === "APROBÓ" ? 5 : 3} style={{ padding: '16px', borderRight: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', fontWeight: 'bold', verticalAlign: 'middle', textAlign: 'center' }}>
                                 <div style={{ fontSize: '1.1em', letterSpacing: '0.5px' }}>{row[0]}</div>
                                 {row[0] === "SOBRESALIENTE" && <div style={{fontSize:'0.85em', marginTop:'6px', fontWeight:'600', opacity: 0.8}}>(100-90)</div>}
                                 {row[0] === "APROBÓ" && <div style={{fontSize:'0.85em', marginTop:'6px', fontWeight:'600', opacity: 0.8}}>(80-70-60-50-40)</div>}
                                 {row[0] === "NO APROBÓ" && <div style={{fontSize:'0.85em', marginTop:'6px', fontWeight:'600', opacity: 0.8}}>(30-20-10)</div>}
                               </td>}
                               <td style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', fontWeight: '600', fontSize: '1.05em' }}>{row[1]}</td>
                               <td style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', fontWeight: '600', fontSize: '1.05em' }}>{row[2]}</td>
                               <td style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', fontWeight: '600', fontSize: '1.05em' }}>{row[3]}</td>
                               <td style={{ padding: '14px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center', fontWeight: '600', fontSize: '1.05em' }}>{row[4]}</td>
                             </tr>
                           );
                         });
                       })()}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
