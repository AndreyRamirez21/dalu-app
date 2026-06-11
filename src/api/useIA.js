import { useState } from 'react';

const getIPC = () => {
  try {
    if (typeof window !== 'undefined' && window.require) {
      return window.require('electron').ipcRenderer;
    }
    return null;
  } catch { return null; }
};

export const useIA = () => {
  const [loading, setLoading]               = useState(false);
  const [analisis, setAnalisis]             = useState(null);
  const [error, setError]                   = useState(null);
  const [apiKey, setApiKey]                 = useState('');
  const [apiKeyGuardada, setApiKeyGuardada] = useState(false);
  const [fase, setFase]                     = useState('');
  const [ultimoAnalisis, setUltimoAnalisis] = useState(null);
  const [historial, setHistorial]           = useState([]);
  const [historialActivo, setHistorialActivo] = useState(null);

  const cargarApiKey = async () => {
    const ipc = getIPC();
    if (!ipc) return;
    try {
      const key = await ipc.invoke('ia-obtener-apikey');
      if (key) { setApiKey(key); setApiKeyGuardada(true); }
    } catch {}
  };

  const guardarApiKey = async (key) => {
    const ipc = getIPC();
    if (!ipc) return;
    await ipc.invoke('ia-guardar-apikey', key);
    setApiKey(key);
    setApiKeyGuardada(true);
  };

  const cargarHistorial = async () => {
    const ipc = getIPC();
    if (!ipc) return;
    try {
      const h = await ipc.invoke('ia-obtener-historial');
      if (h && h.length > 0) {
        setHistorial(h);
        setAnalisis(h[0].analisis);
        setUltimoAnalisis(new Date(h[0].fecha));
        setHistorialActivo(0);
        setFase('listo');
      }
    } catch {}
  };

  const verEntradaHistorial = (index) => {
    const entrada = historial[index];
    if (!entrada) return;
    setAnalisis(entrada.analisis);
    setUltimoAnalisis(new Date(entrada.fecha));
    setHistorialActivo(index);
    setFase('listo');
    setError(null);
  };

  const limpiarHistorial = async () => {
    const ipc = getIPC();
    if (!ipc) return;
    await ipc.invoke('ia-limpiar-historial');
    setHistorial([]);
    setAnalisis(null);
    setHistorialActivo(null);
    setFase('');
    setUltimoAnalisis(null);
    setError(null);
  };

  const construirResumen = ({ statsVentas, topProductos, statsInventario, rotacion, gastos }) => {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const gastosMes = (gastos || []).filter(g => new Date(g.fecha) >= inicioMes);
    const gastosPorCat = {};
    gastosMes.forEach(g => {
      gastosPorCat[g.categoria] = (gastosPorCat[g.categoria] || 0) + parseFloat(g.monto || 0);
    });
    const gastosResumen = Object.entries(gastosPorCat)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([categoria, total]) => ({ categoria, total: Math.round(total) }));

    const rotacionLenta = [], rotacionRapida = [], agotados = [], stockBajo = [];
    (rotacion || []).forEach(p => {
      p.variantes.forEach(v => {
        const label = `${p.nombre} talla ${v.talla}`;
        if (v.estado_rotacion === 'Rotación lenta' && v.stock_actual > 0)
          rotacionLenta.push(`${label} — ${v.dias_en_inventario} días, ${v.total_unidades_vendidas} vendidas`);
        if (v.estado_rotacion === 'Rotación rápida')
          rotacionRapida.push(`${label} — ${v.total_unidades_vendidas} vendidas`);
        if (v.stock_actual === 0 && v.total_unidades_vendidas > 0)
          agotados.push(`${p.nombre} (${v.talla})`);
        else if (v.stock_actual > 0 && v.stock_actual <= 2)
          stockBajo.push(`${p.nombre} (${v.talla}): ${v.stock_actual} ud`);
      });
    });

    return {
      periodo: 'Mes actual',
      ventas: {
        total_mes:        statsVentas?.total_ventas   || 0,
        ingresos_mes:     Math.round(statsVentas?.total_vendido   || 0),
        pendiente_cobrar: Math.round(statsVentas?.total_pendiente || 0),
      },
      top_productos: (topProductos || []).map(p => ({
        nombre: p.nombre, unidades: Math.round(p.cantidad || 0), ingresos: Math.round(p.total_ventas || 0),
      })),
      inventario: {
        total_productos: statsInventario?.total || 0,
        stock_bajo:      statsInventario?.stock_bajo || 0,
        agotados:        statsInventario?.agotados || 0,
        productos_agotados:   agotados.slice(0, 6),
        productos_stock_bajo: stockBajo.slice(0, 6),
        rotacion_lenta:       rotacionLenta.slice(0, 6),
        rotacion_rapida:      rotacionRapida.slice(0, 5),
      },
      gastos: gastosResumen,
    };
  };

  const recopilarYAnalizar = async () => {
    const ipc = getIPC();
    if (!ipc) { setError('IPC no disponible'); return; }
    if (!apiKey) { setError('Configura tu API key primero'); return; }

    setLoading(true);
    setError(null);
    setAnalisis(null);
    setFase('recopilando');
    setHistorialActivo(null);

    try {
      const [statsVentas, topProductos, statsInventario, rotacion, gastos] =
        await Promise.all([
          ipc.invoke('obtener-estadisticas-ventas'),
          ipc.invoke('obtener-top-productos'),
          ipc.invoke('obtener-estadisticas'),
          ipc.invoke('obtener-rotacion-inventario'),
          ipc.invoke('obtener-gastos'),
        ]);

      const resumen = construirResumen({ statsVentas, topProductos, statsInventario, rotacion, gastos });
      setFase('analizando');

      const resultado = await ipc.invoke('ia-analizar', { resumen, apiKey });

      if (resultado.success) {
        const clean = resultado.respuesta.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);
        const ahora = new Date();

        setAnalisis(parsed);
        setUltimoAnalisis(ahora);
        setFase('listo');

        const nuevaEntrada = { id: Date.now(), fecha: ahora.toISOString(), analisis: parsed };
        const nuevoHistorial = [nuevaEntrada, ...historial].slice(0, 10);
        setHistorial(nuevoHistorial);
        setHistorialActivo(0);

        await ipc.invoke('ia-guardar-en-historial', nuevaEntrada);
      } else {
        setError(resultado.error || 'Error al analizar con IA');
        setFase('');
      }
    } catch (err) {
      setError('Error inesperado: ' + err.message);
      setFase('');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, analisis, error, apiKey, setApiKey, apiKeyGuardada, setApiKeyGuardada,
    fase, ultimoAnalisis, historial, historialActivo,
    cargarApiKey, guardarApiKey, cargarHistorial,
    verEntradaHistorial, limpiarHistorial, recopilarYAnalizar,
    limpiarAnalisis: () => { setAnalisis(null); setFase(''); setError(null); setHistorialActivo(null); },
  };
};