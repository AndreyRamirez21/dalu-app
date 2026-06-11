import { useState } from 'react';

const getIPC = () => {
  try {
    if (typeof window !== 'undefined' && window.require)
      return window.require('electron').ipcRenderer;
    return null;
  } catch { return null; }
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const nombreMes = (s) => {
  if (!s) return s;
  const [a, m] = s.split('-');
  return `${MESES[parseInt(m)-1]} ${a}`;
};

const formatearContexto = (datos) => {
  const {
    ventas_por_mes = [], top_productos = [], gastos = [],
    inventario = [], agotados = [], deudas_clientes = [],
    top_clientes = [], caja = {}, productos_por_mes = []
  } = datos;

  const gastosMes = {};
  gastos.forEach(g => {
    if (!gastosMes[g.mes]) gastosMes[g.mes] = { total: 0, cats: {} };
    gastosMes[g.mes].total += g.total;
    gastosMes[g.mes].cats[g.categoria] = g.total;
  });

  const productosPorMes = {};
  productos_por_mes.forEach(p => {
    if (!productosPorMes[p.mes]) productosPorMes[p.mes] = [];
    productosPorMes[p.mes].push(p);
  });

  const stockCritico = inventario.filter(i => i.stock <= 3);
  let ctx = '';

  ctx += `HISTORIAL COMPLETO DE VENTAS POR MES:\n`;
  ventas_por_mes.forEach(v => {
    ctx += `\n▶ ${nombreMes(v.mes)}: ${v.num_ventas} ventas — $${parseInt(v.ingresos||0).toLocaleString('es-CO')} cobrados`;
    if (v.pendiente > 0) ctx += ` — $${parseInt(v.pendiente).toLocaleString('es-CO')} pendiente`;
    ctx += '\n';
    (productosPorMes[v.mes] || []).forEach(p => {
      ctx += `   - ${p.producto} (${p.categoria}): ${p.unidades} uds — $${parseInt(p.ingresos||0).toLocaleString('es-CO')}\n`;
    });
  });

  ctx += `\nTOP PRODUCTOS MÁS VENDIDOS (HISTÓRICO):\n`;
  top_productos.forEach((p, i) => {
    ctx += `${i+1}. ${p.nombre} (${p.categoria}): ${p.unidades} uds — $${parseInt(p.ingresos||0).toLocaleString('es-CO')}\n`;
  });

  ctx += `\nHISTORIAL DE GASTOS POR MES:\n`;
  Object.keys(gastosMes).sort().reverse().forEach(mes => {
    const g = gastosMes[mes];
    const cats = Object.entries(g.cats).sort((a,b)=>b[1]-a[1])
      .map(([cat,t]) => `${cat}: $${parseInt(t).toLocaleString('es-CO')}`).join(', ');
    ctx += `• ${nombreMes(mes)}: $${parseInt(g.total).toLocaleString('es-CO')} (${cats})\n`;
  });

  ctx += `\nINVENTARIO ACTUAL:\n`;
  ctx += `• Items con stock: ${inventario.length} | Stock crítico (≤3): ${stockCritico.length} | Agotados: ${agotados.length}\n`;

  if (agotados.length > 0) {
    ctx += `\nPRODUCTOS AGOTADOS:\n`;
    agotados.slice(0, 25).forEach(p => {
      ctx += `• ${p.nombre} talla ${p.talla}${p.fecha_ultima_venta ? ` (última venta: ${p.fecha_ultima_venta.slice(0,10)})` : ''}\n`;
    });
  }
  if (stockCritico.length > 0) {
    ctx += `\nSTOCK CRÍTICO (≤3 uds):\n`;
    stockCritico.slice(0, 15).forEach(p => {
      ctx += `• ${p.nombre} talla ${p.talla}: ${p.stock} ud\n`;
    });
  }

  if (deudas_clientes.length > 0) {
    ctx += `\nDEUDAS PENDIENTES DE CLIENTES:\n`;
    deudas_clientes.forEach(d => {
      ctx += `• ${d.cliente_nombre}: $${parseInt(d.monto_pendiente).toLocaleString('es-CO')} pendiente\n`;
    });
  }

  ctx += `\nTOP CLIENTES:\n`;
  top_clientes.forEach((c, i) => {
    ctx += `${i+1}. ${c.nombre}: ${c.numero_compras} compras — $${parseInt(c.total_compras||0).toLocaleString('es-CO')}\n`;
  });

  ctx += `\nSALDO DE CAJA: $${parseInt(caja?.saldo_actual||0).toLocaleString('es-CO')}\n`;
  return ctx.trim();
};

export const useIAChat = (apiKey) => {
  const [mensajes, setMensajes]           = useState([]);
  const [cargando, setCargando]           = useState(false);
  const [contexto, setContexto]           = useState(null);
  const [sesionActual, setSesionActual]   = useState(null);
  const [sesiones, setSesiones]           = useState([]);

  const cargarSesiones = async () => {
    const ipc = getIPC();
    if (!ipc) return;
    try {
      const s = await ipc.invoke('ia-obtener-sesiones-chat');
      setSesiones(s || []);
    } catch {}
  };

  const cargarContexto = async () => {
    const ipc = getIPC();
    if (!ipc) return null;
    try {
      const datos = await ipc.invoke('ia-obtener-contexto-completo');
      const ctx = formatearContexto(datos);
      setContexto(ctx);
      return ctx;
    } catch { return null; }
  };

  const guardarSesion = async (id, titulo, fecha, msgs) => {
    const ipc = getIPC();
    if (!ipc || msgs.length === 0) return;
    try {
      const sesion = { id, titulo, fecha, mensajes: msgs };
      await ipc.invoke('ia-guardar-sesion-chat', sesion);
      setSesiones(prev => {
        const idx = prev.findIndex(s => s.id === id);
        if (idx >= 0) { const u = [...prev]; u[idx] = sesion; return u; }
        return [sesion, ...prev].slice(0, 10);
      });
    } catch {}
  };

  const nuevaConversacion = () => {
    setMensajes([]);
    setSesionActual(null);
    setContexto(null);
  };

  const cargarConversacion = (sesion) => {
    setMensajes(sesion.mensajes || []);
    setSesionActual({ id: sesion.id, titulo: sesion.titulo, fecha: sesion.fecha });
  };

  const eliminarSesion = async (sesionId) => {
    const ipc = getIPC();
    if (!ipc) return;
    try {
      await ipc.invoke('ia-eliminar-sesion-chat', sesionId);
      setSesiones(prev => prev.filter(s => s.id !== sesionId));
      if (sesionActual?.id === sesionId) nuevaConversacion();
    } catch {}
  };

  const enviarMensaje = async (texto) => {
    if (!texto.trim() || cargando || !apiKey) return;
    const ipc = getIPC();
    if (!ipc) return;

    const nuevosMensajes = [...mensajes, { role: 'user', content: texto }];
    setMensajes(nuevosMensajes);
    setCargando(true);

    let sesId = sesionActual?.id;
    let sesTitulo = sesionActual?.titulo;
    let sesFecha = sesionActual?.fecha;
    if (!sesId) {
      sesId = Date.now();
      sesTitulo = texto.length > 45 ? texto.slice(0, 42) + '...' : texto;
      sesFecha = new Date().toISOString();
      setSesionActual({ id: sesId, titulo: sesTitulo, fecha: sesFecha });
    }

    try {

      // ✅ Limitar a últimos 20 mensajes para no sobrecargar el API
      const historialLimitado = nuevosMensajes.slice(-20);

        // ✅ Así debe quedar — handler nuevo con acceso total a la BD:
        const resultado = await ipc.invoke('ia-chat-completo', {
          mensajes: historialLimitado,
          apiKey
        });

      const respuesta = resultado.success
        ? { role: 'assistant', content: resultado.respuesta }
        : { role: 'assistant', content: `Error: ${resultado.error}`, error: true };

      const mensajesFinales = [...nuevosMensajes, respuesta];
      setMensajes(mensajesFinales);
      await guardarSesion(sesId, sesTitulo, sesFecha, mensajesFinales);

    } catch (err) {
      setMensajes(prev => [...prev, {
        role: 'assistant', content: `Error: ${err.message}`, error: true
      }]);
    } finally {
      setCargando(false);
    }
  };

  return {
    mensajes, cargando, sesionActual, sesiones,
    enviarMensaje, nuevaConversacion, cargarConversacion,
    eliminarSesion, cargarSesiones,
  };
};