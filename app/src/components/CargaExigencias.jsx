import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { sendTelegramMessage } from '../utils/telegram';
import { ArrowLeft, Save, List, FileSpreadsheet } from 'lucide-react';
import { exportPlanillaToExcel } from '../utils/excelExport';
import { jerarquias, sortEvaluations } from '../utils/constants';
import { tablasData } from '../data/tablasExigencias';
import './CargaExigencias.css';



const CargaExigencias = ({ userData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    jerarquia: '',
    nombreApellido: '',
    talla: '',
    peso: '',
    fechaNacimiento: '',
    sexo: 'MASCULINO',
    pruebas: {
      carreraAerobica: '',
      planchaIsometrica: '',
      flexoExtensionBrazos: '',
      pliometria: '',
      barraFija: ''
    }
  });

  const [edad, setEdad] = useState(0);
  const [categoria, setCategoria] = useState('');
  const [resultados, setResultados] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [dialogState, setDialogState] = useState({ isOpen: false, type: 'alert', title: '', message: '', inputValue: '', onConfirm: null, onCancel: null });
  
  const showDialog = (type, title, message, onConfirm, onCancel = null) => {
    setDialogState({ isOpen: true, type, title, message, inputValue: '', onConfirm, onCancel });
  };
  const closeDialog = () => setDialogState(prev => ({ ...prev, isOpen: false }));
  
  const [evaluations, setEvaluations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [tipoBarra, setTipoBarra] = useState('NO_REALIZA');

  // Helper to get max date (18 years ago from today)
  const getMaxDate18YearsAgo = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (formData.fechaNacimiento) {
      const today = new Date();
      const birthDate = new Date(formData.fechaNacimiento);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEdad(age);

      if (age <= 30) setCategoria('CAT 1');
      else if (age <= 40) setCategoria('CAT 2');
      else if (age <= 50) setCategoria('CAT 3');
      else setCategoria('CAT 4');
    }
  }, [formData.fechaNacimiento]);

  useEffect(() => {
    const evaluarPruebaGeneral = (valor, tipoPrueba, cat, sexo) => {
      if (!valor || !cat || !sexo) return { banda: '', puntos: 0 };
      
      let tableName = "";
      let isTime = false;
      let lowerIsBetter = false;

      if (tipoPrueba === 'CARRERA') {
        tableName = `CARRERA AERÓBICA 3 KM - ${sexo}`;
        isTime = true;
        lowerIsBetter = true;
      } else if (tipoPrueba === 'PLANCHA') {
        tableName = "PLANCHA ISOMÉTRICA - MASCULINO Y FEMENINO";
        isTime = true;
      } else if (tipoPrueba === 'BRAZOS') {
        tableName = `FLEXO-EXTENSIÓN DE BRAZOS 40” - ${sexo}`;
      } else if (tipoPrueba === 'PLIOMETRIA') {
        tableName = "PLIOMETRÍA-SENTADILLAS CON SALTO 30” - MASCULINO Y FEMENINO";
      }

      const parseVal = (v) => {
        if (!v || v === "-") return -1;
        if (isTime) {
          const s = String(v).trim();
          if (s.includes("'")) {
            const parts = s.replace(/''/g, "").split("'");
            if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
            return parseInt(parts[0]);
          }
          const parts = s.replace(':', '.').split(".");
          if (parts.length === 2) return parseInt(parts[0]) * 60 + (parts[1].length === 1 ? parseInt(parts[1]) * 10 : parseInt(parts[1]));
          return parseInt(parts[0]);
        }
        return parseInt(v);
      };

      const userVal = parseVal(valor);
      if (userVal === -1 || isNaN(userVal)) return { banda: '', puntos: 0 };

      const catIndexMap = { 'CAT 1': 1, 'CAT 2': 2, 'CAT 3': 3, 'CAT 4': 4 };
      const colIdx = catIndexMap[cat];
      if (!colIdx) return { banda: '', puntos: 0 };

      const rows = tablasData[tableName];
      if (!rows) return { banda: '', puntos: 0 };

      let currentBand = "SOBRESALIENTE";
      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        if (row[0]) currentBand = row[0];
        const requiredVal = parseVal(row[colIdx]);
        if (requiredVal !== -1) {
          if (lowerIsBetter) {
            if (userVal <= requiredVal) return { banda: currentBand, puntos: 100 - i * 10 };
          } else {
            if (userVal >= requiredVal) return { banda: currentBand, puntos: 100 - i * 10 };
          }
        }
      }
      return { banda: 'NO APROBÓ', puntos: 0 };
    };

    const evaluarBarra = (valor, tipo, cat) => {
      if (!valor || !cat || tipo === 'NO_REALIZA') return { banda: '', puntos: 0 };
      
      let tableName = "";
      let isTime = false;
      if (tipo === 'DOMINADAS') tableName = "BARRA FIJA DOMINADAS - MASCULINO Y FEMENINO";
      else if (tipo === 'RETRACCION') tableName = "BARRA RETRACCIÓN ESCAPULAR 30” - MASCULINO Y FEMENINO";
      else if (tipo === 'ISOMETRICA') {
        tableName = "BARRA ISOMÉTRICA 90° - MASCULINO Y FEMENINO";
        isTime = true;
      }

      const parseVal = (v) => {
        if (!v || v === "-") return -1;
        if (isTime) {
          const s = String(v).trim();
          if (s.includes("'")) {
            const parts = s.replace(/''/g, "").split("'");
            if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
            return parseInt(parts[0]);
          }
          const parts = s.replace(':', '.').split(".");
          if (parts.length === 2) return parseInt(parts[0]) * 60 + (parts[1].length === 1 ? parseInt(parts[1]) * 10 : parseInt(parts[1]));
          return parseInt(parts[0]);
        }
        return parseInt(v);
      };

      const userVal = parseVal(valor);
      if (userVal === -1 || isNaN(userVal)) return { banda: '', puntos: 0 };

      const catIndexMap = { 'CAT 1': 1, 'CAT 2': 2, 'CAT 3': 3, 'CAT 4': 4 };
      const colIdx = catIndexMap[cat];
      if (!colIdx) return { banda: '', puntos: 0 };

      const rows = tablasData[tableName];
      if (!rows) return { banda: '', puntos: 0 };

      let currentBand = "SOBRESALIENTE";
      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        if (row[0]) currentBand = row[0];
        const requiredVal = parseVal(row[colIdx]);
        if (requiredVal !== -1 && userVal >= requiredVal) {
          return { banda: currentBand, puntos: 100 - i * 10 };
        }
      }
      return { banda: 'NO APROBÓ', puntos: 0 };
    };

    const resCarrera = evaluarPruebaGeneral(formData.pruebas.carreraAerobica, 'CARRERA', categoria, formData.sexo) || {};
    const resPlancha = evaluarPruebaGeneral(formData.pruebas.planchaIsometrica, 'PLANCHA', categoria, formData.sexo) || {};
    const resBrazos = evaluarPruebaGeneral(formData.pruebas.flexoExtensionBrazos, 'BRAZOS', categoria, formData.sexo) || {};
    const resPlio = evaluarPruebaGeneral(formData.pruebas.pliometria, 'PLIOMETRIA', categoria, formData.sexo) || {};
    const resBarra = evaluarBarra(formData.pruebas.barraFija, tipoBarra, categoria) || {};
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResultados({
      carreraAerobica: resCarrera.banda || '',
      carreraAerobicaPts: resCarrera.puntos || 0,
      planchaIsometrica: resPlancha.banda || '',
      planchaIsometricaPts: resPlancha.puntos || 0,
      flexoExtensionBrazos: resBrazos.banda || '',
      flexoExtensionBrazosPts: resBrazos.puntos || 0,
      pliometria: resPlio.banda || '',
      pliometriaPts: resPlio.puntos || 0,
      barraFija: resBarra.banda || '',
      barraFijaPts: resBarra.puntos || 0,
    });
  }, [formData.pruebas, categoria, formData.sexo, tipoBarra]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePruebaChange = (e) => {
    setFormData({
      ...formData,
      pruebas: { ...formData.pruebas, [e.target.name]: e.target.value }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    const newEvaluation = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...formData,
      edad,
      categoria,
      resultados,
      tipoBarra,
      evaluadorId: userData?.email || 'unknown'
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('evaluations').update(newEvaluation).eq('id', editingId);
        if (error) console.warn('Supabase update falló:', error);
      } else {
        const { error } = await supabase.from('evaluations').insert(newEvaluation);
        if (error) console.warn('Supabase guardado falló:', error);
      }
    } catch (error) {
      console.warn('Supabase conexión falló:', error);
    }
    
    const localEvals = JSON.parse(localStorage.getItem('gp_evaluations') || '[]');
    if (editingId) {
      const updatedEvals = localEvals.map(e => e.id === editingId ? { ...e, ...newEvaluation } : e);
      localStorage.setItem('gp_evaluations', JSON.stringify(updatedEvals));
      setMessage('Evaluación actualizada sin novedad');
      sendTelegramMessage(`✏️ <b>Evaluación Editada</b>\n\nEvaluador: ${userData?.email || 'Desconocido'}\nPersona: ${formData.nombreApellido}`);
    } else {
      localStorage.setItem('gp_evaluations', JSON.stringify([newEvaluation, ...localEvals]));
      setMessage('Persona cargada sin novedad');
      sendTelegramMessage(`✅ <b>Nueva Evaluación Guardada</b>\n\nEvaluador: ${userData?.email || 'Desconocido'}\nPersona: ${formData.nombreApellido}`);
    }
    
    setEditingId(null);
    setFormData({
      jerarquia: '',
      nombreApellido: '',
      talla: '',
      peso: '',
      fechaNacimiento: '',
      sexo: 'MASCULINO',
      pruebas: {
        carreraAerobica: '',
        planchaIsometrica: '',
        flexoExtensionBrazos: '',
        pliometria: '',
        barraFija: ''
      }
    });
    setTipoBarra('NO_REALIZA');
    setTimeout(() => setMessage(''), 4000);
    setIsSaving(false);
  };

  const handleEditRow = (ev) => {
    setFormData({
      jerarquia: ev.jerarquia,
      nombreApellido: ev.nombreApellido,
      talla: ev.talla,
      peso: ev.peso,
      fechaNacimiento: ev.fechaNacimiento,
      sexo: ev.sexo,
      pruebas: ev.pruebas || {
        carreraAerobica: '',
        planchaIsometrica: '',
        flexoExtensionBrazos: '',
        pliometria: '',
        barraFija: ''
      }
    });
    setTipoBarra(ev.tipoBarra || 'NO_REALIZA');
    setEditingId(ev.id);
    handleCloseModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRow = async (id) => {
    showDialog('confirm', 'Eliminar Evaluación', '¿Estás seguro que deseas eliminar esta evaluación?', async () => {
      try {
        await supabase.from('evaluations').delete().eq('id', id);
      } catch (err) {
        console.warn('Error deleting from supabase', err);
      }
      
      const localEvals = JSON.parse(localStorage.getItem('gp_evaluations') || '[]');
      const filtered = localEvals.filter(e => e.id !== id);
      localStorage.setItem('gp_evaluations', JSON.stringify(filtered));
      setEvaluations(prev => prev.filter(e => e.id !== id));
      
      closeDialog();
    });
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    setIsClosingModal(false);
    const localEvals = JSON.parse(localStorage.getItem('gp_evaluations') || '[]');
    try {
      const { data, error } = await supabase.from('evaluations').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setEvaluations(data);
      } else {
        setEvaluations(localEvals);
      }
    } catch (err) {
      console.error("Error fetching evaluations", err);
      setEvaluations(localEvals);
    }
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosingModal(false);
    }, 300);
  };

  const handleClearPlanilla = () => {
    showDialog('confirm', 'Limpiar Planilla', '¿Está seguro de limpiar toda la planilla actual?', () => {
      localStorage.removeItem('gp_evaluations');
      setEvaluations([]);
      setMessage('Planilla limpiada exitosamente');
      setTimeout(() => setMessage(''), 3000);
      closeDialog();
    }, closeDialog);
  };

  const handleSavePlanilla = () => {
    if (evaluations.length === 0) return showDialog('alert', 'Error', 'No hay evaluaciones para guardar.', closeDialog);
    
    const todayStr = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    showDialog('prompt', 'Guardar Planilla', `Fecha automática: ${todayStr}\n\nIngrese una descripción de la evaluación (opcional):`, async (descripcion) => {
      const planillaId = Date.now().toString();
      const newPlanilla = {
        id: planillaId,
        fecha_examen: todayStr,
        descripcion: descripcion || 'Sin descripción',
        evaluadorId: userData?.email || 'unknown',
        evaluaciones: evaluations,
        created_at: new Date().toISOString()
      };

      const planillasGuardadas = JSON.parse(localStorage.getItem('gp_planillas') || '[]');
      planillasGuardadas.push(newPlanilla);
      localStorage.setItem('gp_planillas', JSON.stringify(planillasGuardadas));

      try {
        await supabase.from('planillas').insert(newPlanilla);
      } catch {
        console.log("Guardada localmente");
      }

      await sendTelegramMessage(`📋 <b>Planilla Guardada</b>\n\nEvaluador: ${userData?.email || 'Desconocido'}\nFecha: ${todayStr}\nPersonas Evaluadas: ${evaluations.length}`);

      closeDialog();
      showDialog('alert', 'Éxito', `Planilla guardada exitosamente.\nFecha: ${todayStr}`, () => {
        closeDialog();
        localStorage.removeItem('gp_evaluations');
        setEvaluations([]);
        setShowModal(false);
      });
    }, closeDialog);
  };

  const handleDownloadExcel = () => {
    if (!evaluations || evaluations.length === 0) return showDialog('alert', 'Error', 'No hay datos para exportar', closeDialog);
    exportPlanillaToExcel(evaluations, null);
  };

  const baseSorted = sortEvaluations(evaluations);
  
  // Calculate catCount for proper rowSpan rendering
  let currentCat = null;
  let currentCount = 0;
  let startIndex = 0;
  
  const sortedEvaluations = [...baseSorted];
  
  sortedEvaluations.forEach((ev, idx) => {
    ev.nroOrden = idx + 1;
    if (ev.categoria !== currentCat) {
      if (currentCat !== null) {
        sortedEvaluations[startIndex].catCount = currentCount;
      }
      currentCat = ev.categoria;
      currentCount = 1;
      startIndex = idx;
      ev.isFirstInCat = true;
      ev.catLabel = (ev.categoria || '').replace('CAT ', '');
    } else {
      currentCount++;
      ev.isFirstInCat = false;
    }
  });

  if (currentCat !== null && sortedEvaluations.length > 0) {
    sortedEvaluations[startIndex].catCount = currentCount;
  }

  return (
    <div className="carga-layout page-enter">
      <header className="carga-header">
        <div className="header-left">
          <button className="icon-button back-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} /> Volver
          </button>
          <h2>Carga de Exigencias Físicas</h2>
        </div>
        <div className="header-right">
          <button type="button" onClick={handleOpenModal} className="btn-ver-lista">
            <List size={18} />
            Ver Lista
          </button>
        </div>
      </header>

      {message && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 'bold',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeInSlideUp 0.4s ease-out forwards'
        }}>
          ✅ {message}
        </div>
      )}

      <div className="carga-content">
        <div className="card full-width-card">
          <form className="carga-form" onSubmit={handleSubmit}>
            <fieldset style={{ borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px', background: '#f8fafc' }}>
              <legend style={{ fontSize: '1.2em', fontWeight: 'bold', padding: '0 16px', color: 'var(--primary)', background: '#f8fafc', borderRadius: '8px' }}>Datos Personales</legend>
              
              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Jerarquía</label>
                  <select name="jerarquia" value={formData.jerarquia} onChange={handleInputChange} required title="Selecciona la jerarquía o grado actual">
                    <option value="">Seleccione jerarquía...</option>
                    {jerarquias.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nombre y Apellido</label>
                  <input type="text" name="nombreApellido" value={formData.nombreApellido} onChange={handleInputChange} required placeholder="Ej: Juan Pérez" title="Ingresa tu nombre y apellido completos" />
                </div>
              </div>

              <div className="grid-3-cols">
                <div className="form-group">
                  <label>Talla (m)</label>
                  <input type="number" step="0.01" name="talla" value={formData.talla} onChange={handleInputChange} required placeholder="Ej: 1.75" title="Ingresa tu estatura en metros (ej. 1.75)" />
                </div>
                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input type="number" step="0.1" name="peso" value={formData.peso} onChange={handleInputChange} required placeholder="Ej: 75.5" title="Ingresa tu peso corporal en kilogramos (ej. 75.5)" />
                </div>
                <div className="form-group">
                  <label>Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleInputChange} max={getMaxDate18YearsAgo()} required title="Selecciona la fecha de nacimiento para calcular tu edad y categoría automáticamente" />
                </div>
              </div>

              <div className="grid-2-cols">
                <div className="form-group">
                  <label>Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleInputChange} title="Selecciona tu sexo biológico">
                    <option value="MASCULINO">MASCULINO</option>
                    <option value="FEMENINO">FEMENINO</option>
                  </select>
                </div>
                <div className="info-box" style={{ background: 'var(--primary)', color: 'white', padding: '16px 24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '1.1em' }}><strong style={{opacity: 0.8}}>Edad:</strong> <span style={{fontSize: '1.2em', fontWeight: 'bold'}}>{edad} años</span></div>
                  <div className="divider"></div>
                  <div style={{ fontSize: '1.1em' }}><strong style={{opacity: 0.8}}>Categoría:</strong> <span style={{fontSize: '1.2em', fontWeight: 'bold'}}>{categoria}</span></div>
                </div>
              </div>
            </fieldset>

            <fieldset style={{ borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', background: '#f8fafc' }}>
              <legend style={{ fontSize: '1.2em', fontWeight: 'bold', padding: '0 16px', color: 'var(--primary)', background: '#f8fafc', borderRadius: '8px' }}>Resultados de Exigencias</legend>
              <div className="resultados-grid">
                {/* Carrera Aeróbica */}
                <div className="prueba-item" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#334155' }}>Carrera Aeróbica (min.seg)</label>
                  <div className="prueba-input-row">
                    <input type="number" step="0.01" name="carreraAerobica" value={formData.pruebas.carreraAerobica} onChange={handlePruebaChange} placeholder="Ej: 13.45" title="Ingresa el tiempo de la carrera aeróbica en formato minutos.segundos (ej. 13.45)" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                    <span className={`badge ${resultados.carreraAerobica === 'NO APROBÓ' ? 'NO' : (resultados.carreraAerobica || '')}`}>
                      {resultados.carreraAerobica || '---'}
                    </span>
                  </div>
                </div>
                
                {/* Plancha Isométrica */}
                <div className="prueba-item" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#334155' }}>Plancha Isométrica (min.seg)</label>
                  <div className="prueba-input-row">
                    <input type="number" step="0.01" name="planchaIsometrica" value={formData.pruebas.planchaIsometrica} onChange={handlePruebaChange} placeholder="Ej: 1.30" title="Ingresa el tiempo en la plancha isométrica en formato minutos.segundos (ej. 1.30)" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                    <span className={`badge ${resultados.planchaIsometrica === 'NO APROBÓ' ? 'NO' : (resultados.planchaIsometrica || '')}`}>
                      {resultados.planchaIsometrica || '---'}
                    </span>
                  </div>
                </div>
                
                {/* Flexo-Extensión Brazos */}
                <div className="prueba-item" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#334155' }}>Flexo-Extensión Brazos (reps)</label>
                  <div className="prueba-input-row">
                    <input type="number" name="flexoExtensionBrazos" value={formData.pruebas.flexoExtensionBrazos} onChange={handlePruebaChange} placeholder="Ej: 35" title="Ingresa la cantidad exacta de repeticiones de flexo-extensión realizadas" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                    <span className={`badge ${resultados.flexoExtensionBrazos === 'NO APROBÓ' ? 'NO' : (resultados.flexoExtensionBrazos || '')}`}>
                      {resultados.flexoExtensionBrazos || '---'}
                    </span>
                  </div>
                </div>
                
                {/* Pliometría */}
                <div className="prueba-item" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', color: '#334155' }}>Pliometría (reps)</label>
                  <div className="prueba-input-row">
                    <input type="number" name="pliometria" value={formData.pruebas.pliometria} onChange={handlePruebaChange} placeholder="Ej: 40" title="Ingresa la cantidad de sentadillas con salto realizadas" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                    <span className={`badge ${resultados.pliometria === 'NO APROBÓ' ? 'NO' : (resultados.pliometria || '')}`}>
                      {resultados.pliometria || '---'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prueba de Barra */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <div className="prueba-item" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontWeight: '600', color: '#334155' }}>Prueba de Barra (Opcional)</label>
                    <select 
                      value={tipoBarra} 
                      onChange={(e) => { setTipoBarra(e.target.value); handlePruebaChange({target:{name:'barraFija', value:''}}); }}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: 'var(--primary)', fontWeight: 'bold' }}
                      title="Selecciona el tipo de prueba de barra que realizó la persona"
                    >
                      <option value="NO_REALIZA">No realiza barra</option>
                      <option value="DOMINADAS">Dominadas (Reps)</option>
                      <option value="RETRACCION">Retracción Escapular 30" (Reps)</option>
                      <option value="ISOMETRICA">Isométrica 90° (Tiempo)</option>
                    </select>
                  </div>
                  
                  {tipoBarra !== 'NO_REALIZA' && (
                    <div className="prueba-input-row" style={{ marginTop: '12px' }}>
                      <input 
                        type={tipoBarra === 'ISOMETRICA' ? "text" : "number"} 
                        name="barraFija" 
                        value={formData.pruebas.barraFija} 
                        onChange={handlePruebaChange} 
                        placeholder={tipoBarra === 'ISOMETRICA' ? "Ej: 1.20 (min.seg)" : "Ej: 15 (reps)"}
                        title={tipoBarra === 'ISOMETRICA' ? "Ingresa el tiempo sostenido en la barra" : "Ingresa la cantidad de repeticiones en barra"}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                      />
                      <span className={`badge ${resultados.barraFija === 'NO APROBÓ' ? 'NO' : (resultados.barraFija || '')}`}>
                        {resultados.barraFija || '---'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            <div className="form-actions">
              <button type="submit" className="primary" disabled={isSaving}>
                <Save size={20} />
                {isSaving ? 'Guardando...' : 'Guardar Resultados'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={`modal-overlay modal-overlay-anim ${isClosingModal ? 'closing' : ''}`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className={`modal-content modal-content-anim ${isClosingModal ? 'closing' : ''}`} style={{ background: '#fff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '1400px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>Planilla de Resumen</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" onClick={handleDownloadExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(22, 163, 74, 0.2)', transition: 'transform 0.2s, background 0.2s' }} onMouseOver={e => {e.target.style.transform='translateY(-2px)'; e.target.style.background='#15803d'}} onMouseOut={e => {e.target.style.transform='none'; e.target.style.background='#16a34a'}}>
                  <FileSpreadsheet size={18} />
                  Exportar Excel
                </button>
                <button type="button" onClick={handleClearPlanilla} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)' }}>
                  Limpiar Planilla
                </button>
                <button type="button" onClick={handleSavePlanilla} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }}>
                  Guardar Planilla
                </button>
                <button onClick={handleCloseModal} title="Cerrar planilla" style={{ background: 'none', border: 'none', fontSize: '2.5rem', lineHeight: '1', cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#ef4444'} onMouseOut={e => e.target.style.color = '#94a3b8'}>&times;</button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
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
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600', borderRight: '1px solid #cbd5e1' }}>PROMEDIO</th>
                    <th rowSpan="2" style={{ padding: '12px 8px', color: '#334155', fontWeight: '600' }}>ACCIONES</th>
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
                  {sortedEvaluations.length === 0 ? (
                    <tr><td colSpan="19" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '1.1em' }}>No hay evaluaciones cargadas en el sistema.</td></tr>
                  ) : (
                    sortedEvaluations.map(ev => {

                      


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
                          <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditRow(ev)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px', marginRight: '8px' }} title="Editar">
                              ✏️
                            </button>
                            <button onClick={() => handleDeleteRow(ev.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Eliminar">
                              🗑️
                            </button>
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
            
            {dialogState.type === 'prompt' && (
              <input 
                type="text" 
                value={dialogState.inputValue} 
                onChange={e => setDialogState({...dialogState, inputValue: e.target.value})}
                placeholder="Escribe aquí..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px', fontSize: '1rem' }}
                autoFocus
              />
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {(dialogState.type === 'confirm' || dialogState.type === 'prompt') && (
                <button onClick={dialogState.onCancel} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
              <button onClick={() => dialogState.onConfirm(dialogState.type === 'prompt' ? dialogState.inputValue : null)} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {dialogState.type === 'alert' ? 'Aceptar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargaExigencias;
