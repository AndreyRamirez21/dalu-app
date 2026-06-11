import React, { useState, useEffect } from 'react';
import {
  Sparkles, AlertTriangle, Lightbulb, ShoppingCart,
  RefreshCw, Key, Eye, EyeOff, Zap, CheckCircle2,
  TrendingUp, Loader2, Trash2
} from 'lucide-react';
import { useIA } from '../../api/useIA';
import IAChat from '../IA/IAChat';

// ── Spinner animado con fases ────────────────────────────────────────────────
const LoadingState = ({ fase }) => (
  <div className="flex flex-col items-center justify-center py-24 space-y-6">
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
        <Sparkles size={32} className="text-purple-500 animate-pulse" />
      </div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
    </div>
    <div className="text-center space-y-1">
      <p className="text-gray-700 font-semibold text-base">
        {fase === 'recopilando' ? 'Recopilando datos del negocio...' : 'Analizando con IA...'}
      </p>
      <p className="text-gray-400 text-sm">
        {fase === 'recopilando'
          ? 'Ventas, inventario, gastos, rotación...'
          : 'Claude está procesando la información...'}
      </p>
    </div>
    <div className="flex space-x-2">
      {['recopilando', 'analizando'].map((f, i) => (
        <div
          key={f}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            fase === f
              ? 'bg-purple-100 text-purple-700'
              : i === 0 && fase === 'analizando'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {i === 0 && fase === 'analizando'
            ? <CheckCircle2 size={12} />
            : fase === f
            ? <Loader2 size={12} className="animate-spin" />
            : null}
          <span>{f === 'recopilando' ? '1. Recopilando' : '2. Analizando'}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Tarjeta de resultado ─────────────────────────────────────────────────────
const CardResultado = ({ titulo, descripcion, extra, extraLabel, color }) => {
  const colores = {
    red:    { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',   badge: 'bg-red-100 text-red-700' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',  badge: 'bg-blue-100 text-blue-700' },
  };
  const c = colores[color] || colores.blue;

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4 space-y-2`}>
      <p className={`text-sm font-semibold ${c.text}`}>{titulo}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{descripcion}</p>
      {extra && (
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${c.badge}`}>
          <Zap size={10} />
          <span>{extraLabel}: {extra}</span>
        </div>
      )}
    </div>
  );
};

// ── Sección de resultados ────────────────────────────────────────────────────
const SeccionResultados = ({ titulo, icono: Icono, items, color, campoExtra, labelExtra }) => {
  if (!items?.length) return null;
  return (
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <Icono size={18} className={
          color === 'red' ? 'text-red-500' :
          color === 'green' ? 'text-green-500' : 'text-blue-500'
        } />
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{titulo}</h4>
        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <CardResultado
            key={i}
            titulo={item.titulo}
            descripcion={item.descripcion}
            extra={campoExtra ? item[campoExtra] : null}
            extraLabel={labelExtra}
            color={color}
          />
        ))}
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const IA = () => {
  const ia = useIA();
  const [keyInput, setKeyInput]         = useState('');
  const [mostrarKey, setMostrarKey]     = useState(false);
  const [editandoKey, setEditandoKey]   = useState(false);
  const [tab, setTab] = useState('analisis');

  useEffect(() => {
      ia.cargarApiKey();
      ia.cargarHistorial();
        }, []);

  const handleGuardarKey = async () => {
    if (!keyInput.trim()) return;
    await ia.guardarApiKey(keyInput.trim());
    setKeyInput('');
    setEditandoKey(false);
  };

  const handleBorrarKey = async () => {
    await ia.guardarApiKey('');
    ia.setApiKey('');
    ia.setApiKeyGuardada(false);
    ia.limpiarHistorial();
  };

  // ── Pantalla: configurar API key ─────────────────────────────────────
  if (!ia.apiKeyGuardada && !editandoKey) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto">
            <Sparkles size={28} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Asistente IA de Dalú</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Conecta tu cuenta de Anthropic para obtener análisis inteligentes de ventas,
              inventario y recomendaciones de compra personalizadas.
            </p>
          </div>
          <div className="text-left space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Key size={14} />
              <span>API Key de Anthropic</span>
            </label>
            <div className="relative">
              <input
                type={mostrarKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuardarKey()}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <button
                onClick={() => setMostrarKey(!mostrarKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Obtén tu key en{' '}
            <span className="text-purple-500 font-medium">aistudio.google.com/app/apikey</span>
             Se guarda localmente en tu equipo.
            </p>
          </div>
          <button
            onClick={handleGuardarKey}
            disabled={!keyInput.trim()}
            className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar y continuar
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla: editar API key ─────────────────────────────────────────
  if (editandoKey) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full p-8 space-y-5">
          <h3 className="font-bold text-gray-800">Actualizar API Key</h3>
          <div className="relative">
            <input
              type={mostrarKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
            <button
              onClick={() => setMostrarKey(!mostrarKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {mostrarKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => { setEditandoKey(false); setKeyInput(''); }}
              className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarKey}
              disabled={!keyInput.trim()}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-40"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla principal ───────────────────────────────────────────────
  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Cabecera */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Asistente IA de Dalú</h2>
              <p className="text-purple-200 text-sm">
                {ia.ultimoAnalisis
                  ? `Último análisis: ${ia.ultimoAnalisis.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Análisis inteligente de tu negocio'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {ia.analisis && (
              <button
                onClick={ia.limpiarHistorial}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                title="Limpiar historial"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={() => setEditandoKey(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              title="Cambiar API key"
            >
              <Key size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('analisis')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'analisis'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          📊 Análisis automático
        </button>
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'chat'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}>
          💬 Chat con IA
        </button>
      </div>

      {/* Contenido según tab */}
      {tab === 'chat' && <IAChat apiKey={ia.apiKey} />}

        {tab === 'analisis' && (
          <div className="space-y-6">
      {/* Panel de historial */}
      {ia.historial.length > 0 && !ia.loading && (
        <div className="
        bg-white border border-gray-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Historial</span>
            <span className="text-xs text-gray-400">({ia.historial.length} análisis guardados)</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ia.historial.map((entrada, index) => {
              const fecha = new Date(entrada.fecha);
              const esActivo = ia.historialActivo === index;
              return (
                <button
                  key={entrada.id}
                  onClick={() => ia.verEntradaHistorial(index)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    esActivo
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-purple-50 hover:border-purple-200'
                  }`}
                >
                  <div className="font-semibold">
                    {index === 0 ? '● Último' : `#${ia.historial.length - index}`}
                  </div>
                  <div className="opacity-75">
                    {fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} {fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado: cargando */}
      {ia.loading && <LoadingState fase={ia.fase} />}

      {/* Estado: error */}
      {ia.error && !ia.loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error al analizar</p>
            <p className="text-xs text-red-600 mt-1">{ia.error}</p>
            {ia.error.toLowerCase().includes('api') && (
              <p className="text-xs text-red-500 mt-1">
                Verifica que tu API key sea correcta y tenga crédito disponible.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Estado: sin análisis → botón prominente */}
      {!ia.loading && !ia.analisis && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto">
            <TrendingUp size={28} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-700 mb-1">Listo para analizar</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              El asistente revisará tus ventas, inventario y gastos para darte
              recomendaciones concretas de qué hacer y qué comprar.
            </p>
          </div>
          <button
            onClick={ia.recopilarYAnalizar}
            className="inline-flex items-center space-x-2 px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition shadow-sm shadow-purple-200"
          >
            <Sparkles size={18} />
            <span>Analizar ahora</span>
          </button>
        </div>
      )}

      {/* Estado: resultados */}
      {!ia.loading && ia.analisis && (
        <div className="space-y-6">

          {/* Resumen ejecutivo */}
          {ia.analisis.resumen_ejecutivo && (
            <div className="bg-white border border-purple-200 rounded-xl p-5 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Resumen ejecutivo</p>
                <p className="text-sm text-gray-700 leading-relaxed">{ia.analisis.resumen_ejecutivo}</p>
              </div>
            </div>
          )}

          {/* Grid de resultados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SeccionResultados
                titulo="Alertas"
                icono={AlertTriangle}
                items={ia.analisis.alertas}
                color="red"
                campoExtra="accion"
                labelExtra="Acción"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SeccionResultados
                titulo="Oportunidades"
                icono={Lightbulb}
                items={ia.analisis.oportunidades}
                color="green"
                campoExtra="accion"
                labelExtra="Cómo"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <SeccionResultados
                titulo="Comprar"
                icono={ShoppingCart}
                items={ia.analisis.recomendaciones_compra}
                color="blue"
                campoExtra="cantidad_sugerida"
                labelExtra="Sugerido"
              />
            </div>
          </div>

          {/* Botón re-analizar */}
          <div className="flex justify-center pt-2">
            <button
              onClick={ia.recopilarYAnalizar}
              className="inline-flex items-center space-x-2 px-5 py-2.5 border border-purple-200 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-50 transition"
            >
              <RefreshCw size={15} />
              <span>Volver a analizar</span>
            </button>
          </div>
        </div>
)}
    </div>
        )}
    </div>
  );
};

export default IA;