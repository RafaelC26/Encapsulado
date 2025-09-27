import './App.css';

import { useState, useEffect } from 'react';

// Evalúa la fórmula lógica para cada combinación de sensores
function evaluateFormula(p, q, r, s) {
  // Fórmula: ¬((¬p ∧ q ∧ r) ∨ ¬s)
  return !((!p && q && r) || !s);
}


// Genera solo la fila actual según los sensores seleccionados
function generateCurrentRow(sensors) {
  const { p, q, r, s } = sensors;
  const f = evaluateFormula(p, q, r, s);
  return [
    ['p', 'q', 'r', 's', 'f'],
    [
      p ? 'V' : 'F',
      q ? 'V' : 'F',
      r ? 'V' : 'F',
      s ? 'V' : 'F',
      f ? 'V' : 'F',
    ],
  ];
}

function App() {
  // Estado de los sensores
  const [sensors, setSensors] = useState({
    p: true,
    q: true,
    r: true,
    s: true,
  });
  // Estado del sistema
  const [status, setStatus] = useState({
    label: 'VENTILACIÓN: ÓPTIMA',
    msg: 'Mensaje: El flujo de aire es adecuado.',
    color: 'green-glow',
  });
  // Tabla de verdad: solo la fila actual
  const [truthTable, setTruthTable] = useState(generateCurrentRow({
    p: true, q: true, r: true, s: true,
  }));

  // Enviar mensaje a WinForms (WebView2)
  const sendToHost = (data) => {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.postMessage(data);
    }
  };

  // Recibir mensajes de WinForms
  useEffect(() => {
    if (window.chrome && window.chrome.webview) {
      window.chrome.webview.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.type === 'updateSensors') {
          setSensors(msg.sensors);
        } else if (msg.type === 'updateStatus') {
          setStatus(msg.status);
        } else if (msg.type === 'updateTruthTable') {
          setTruthTable(msg.table);
        }
      });
    }
  }, []);

  // Actualiza la fila automáticamente cuando cambian los sensores
  useEffect(() => {
    setTruthTable(generateCurrentRow(sensors));
  }, [sensors]);

  // Manejar cambio de sensores
  const handleSensorChange = (varName, checked) => {
    const newSensors = { ...sensors, [varName]: checked };
    setSensors(newSensors);
    sendToHost({ type: 'sensorChange', sensors: newSensors });
  };

  // Manejar generación de tabla de verdad
  const handleGenerateTable = () => {
    sendToHost({ type: 'generateTruthTable', sensors });
  };

  return (
    <div className="main-container">
      <header className="header">
        <span className="title">Ventilación Aula Universitaria</span>
        <span className="authors">- CRISTANCHO, LOZANO, MUNEVAR, GUEVARA</span>
      </header>
      <div className="content">
        {/* Panel izquierdo: Sensores */}
        <section className="panel panel-sensors">
          <h3>Sensores de Entrada</h3>
          <div className="sensor-list">
            <SensorSwitch label="Temperatura Alta" varName="p" checked={sensors.p} onChange={handleSensorChange} />
            <SensorSwitch label="Nivel CO₂ Alto" varName="q" checked={sensors.q} onChange={handleSensorChange} />
            <SensorSwitch label="Ocupación Detectada" varName="r" checked={sensors.r} onChange={handleSensorChange} highlight />
            <SensorSwitch label="Ventanas Abiertas" varName="s" checked={sensors.s} onChange={handleSensorChange} />
          </div>
        </section>
        {/* Panel central: Estado del sistema */}
        <section className="panel panel-status">
          <div className={`status-circle ${status.color}`}>
            <span className="status-icon" />
          </div>
          <div className="status-label">{status.label}</div>
          <div className="status-msg">{status.msg}</div>
        </section>
        {/* Panel derecho: Lógica y tabla */}
        <section className="panel panel-logic">
          <div className="logic-formula">
            <span>Lógica del Sistema</span>
            <div className="formula">&not;((&not;p &and; q &and; r) &or; &not;s)</div>
            <button className="truth-table-btn" onClick={handleGenerateTable}>Generar Tabla de Verdad</button>
          </div>
          <div className="truth-table-container">
            <TruthTable table={truthTable} />
          </div>
        </section>
      </div>
      
    </div>
  );
}

function SensorSwitch({ label, varName, highlight, checked, onChange }) {
  return (
    <div className={`sensor-switch${highlight ? ' highlight' : ''}`}>
      <span className="sensor-var">{varName}:</span>
      <span className="sensor-label">{label}</span>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(varName, e.target.checked)}
        />
        <span className="slider" />
      </label>
    </div>
  );
}

// Cambia el renderizado de la tabla para aplicar colores
function TruthTable({ table }) {
  if (!table || table.length === 0) return null;
  return (
    <table className="truth-table">
      <thead>
        <tr>{table[0].map((h, i) => <th key={i}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {table.slice(1).map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td
                key={j}
                style={{
                  background:
                    cell === 'V'
                      ? '#4caf50' // verde
                      : cell === 'F'
                      ? '#bdbdbd' // gris
                      : undefined,
                  color: cell === 'F' ? '#333' : '#fff',
                  fontWeight: 'bold',
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default App;
