import { useSearchParams } from 'react-router-dom';
import { tablasData } from '../data/tablasExigencias';
import './Dashboard.css';

const Dashboard = ({ userData }) => {
  const [searchParams] = useSearchParams();
  const selectedTabla = searchParams.get('tabla');

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
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
              <div className="card full-width-card">
                <h3 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '16px', fontSize: '1.8rem' }}>Educación y Entrenamiento</h3>
                <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#475569', marginBottom: '8px' }}>A continuación se presenta un video instructivo sobre las exigencias físicas y la correcta ejecución de los ejercicios según el PON 06/25.</p>
                
                <div className="video-container" style={{ 
              margin: '24px auto 0 auto',
              maxWidth: '800px',
              borderRadius: '16px', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#000'
            }}>
                    <video 
                      controls 
                      preload="metadata"
                      style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '500px' }}
                    >
                      <source src="/video_instructivo.mp4" type="video/mp4" />
                      Tu navegador no soporta el formato de video.
                    </video>
                  </div>
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
