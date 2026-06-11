import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, User, Loader2, Plus, MessageSquare, Clock } from 'lucide-react';
import { useIAChat } from '../../api/useIAChat';

const SUGERENCIAS = [
  '¿Qué productos debo reponer urgentemente?',
  '¿Cuánto vendí este mes?',
  '¿Qué productos tienen rotación lenta?',
  '¿Cuánto me deben los clientes?',
  '¿Cuáles son mis productos más rentables?',
  '¿En qué estoy gastando más este mes?',
];

const IAChat = ({ apiKey }) => {
  const chat = useIAChat(apiKey);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { chat.cargarSesiones(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); },
    [chat.mensajes, chat.cargando]);

  const handleSend = () => {
    if (!input.trim() || chat.cargando) return;
    chat.enviarMensaje(input.trim());
    setInput('');
  };
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatFecha = (f) => {
    const d = new Date(f), hoy = new Date(), ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString())
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex bg-white rounded-2xl border border-gray-200 overflow-hidden"
         style={{ height: '680px' }}>

      {/* ── SIDEBAR ── */}
      <div className="w-52 border-r border-gray-100 flex flex-col flex-shrink-0 bg-gray-50">
        <div className="p-3 border-b border-gray-200">
          <button onClick={chat.nuevaConversacion}
            className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold transition">
            <Plus size={14} /> Nueva conversación
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chat.sesiones.length === 0 ? (
            <div className="text-center py-10 px-2">
              <MessageSquare size={18} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 leading-snug">Las conversaciones aparecerán aquí</p>
            </div>
          ) : chat.sesiones.map(sesion => {
            const activa = chat.sesionActual?.id === sesion.id;
            return (
              <div key={sesion.id} onClick={() => chat.cargarConversacion(sesion)}
                className={`group relative p-2.5 rounded-lg cursor-pointer transition-all ${
                  activa ? 'bg-white border border-purple-200 shadow-sm' : 'hover:bg-white border border-transparent'
                }`}>
                <p className={`text-xs font-medium truncate pr-4 leading-snug ${
                  activa ? 'text-purple-700' : 'text-gray-700'}`}>
                  {sesion.titulo}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={9} className="text-gray-400" />
                  <p className="text-xs text-gray-400">{formatFecha(sesion.fecha)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); chat.eliminarSesion(sesion.id); }}
                  className="absolute right-1 top-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-gray-400 transition">
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-2 border-t border-gray-200">
          <p className="text-center text-xs text-gray-400">Últimas {chat.sesiones.length}/10</p>
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <Bot size={15} className="text-purple-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-700 truncate">
              {chat.sesionActual?.titulo || 'Chat con tu negocio'}
            </span>
          </div>
          {chat.mensajes.length > 0 && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {chat.mensajes.filter(m => m.role === 'user').length} preguntas
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chat.mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Bot size={22} className="text-purple-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600 mb-1">¿Qué quieres saber sobre Dalú?</p>
                <p className="text-xs text-gray-400">Tengo acceso a todo el historial de ventas, inventario y gastos</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                {SUGERENCIAS.map((s, i) => (
                  <button key={i} onClick={() => chat.enviarMensaje(s)}
                    className="text-left px-3 py-2 rounded-xl border border-purple-100 bg-purple-50 text-xs text-purple-700 hover:bg-purple-100 transition leading-snug">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {chat.mensajes.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-purple-600' : 'bg-gray-100'}`}>
                    {msg.role === 'user'
                      ? <User size={13} className="text-white" />
                      : <Bot size={13} className="text-gray-600" />}
                  </div>
                  <div className={`max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-sm'
                      : msg.error
                      ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                      : 'bg-gray-100 text-gray-700 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chat.cargando && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Bot size={13} className="text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <Loader2 size={13} className="text-gray-500 animate-spin" />
                    <span className="text-xs text-gray-500">Analizando...</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </div>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu pregunta... (Enter para enviar)"
              rows={1} disabled={chat.cargando}
              className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              style={{ minHeight: '38px', maxHeight: '96px' }} />
            <button onClick={handleSend} disabled={!input.trim() || chat.cargando}
              className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
              <Send size={15} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-center">Shift+Enter para nueva línea</p>
        </div>
      </div>
    </div>
  );
};

export default IAChat;