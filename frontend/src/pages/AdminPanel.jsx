import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useGameSocket } from '../hooks/useGameSocket';
import { getColumn } from '../utils/bingo';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';
import BrandMark from '../components/BrandMark';

const COL_COLORS = { B:'#C21874', I:'#6F2DA8', N:'#007C91', G:'#D96C2F', O:'#C79A3B' };

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [manualNum, setManualNum] = useState('');
  const [mode, setMode] = useState('auto');
  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundPremio, setNewRoundPremio] = useState('');
  const [creatingRound, setCreatingRound] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch { if (!silent) toast.error('Erro ao carregar'); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); const t = setInterval(() => fetchStats(true), 5000); return () => clearInterval(t); }, [fetchStats]);

  useGameSocket((msg) => {
    if (['number_drawn','bingo_winner','round_started','round_finished'].includes(msg.type)) fetchStats(true);
  });

  const handleDraw = async () => {
    setDrawing(true);
    try {
      const body = mode === 'manual' ? { mode: 'manual', number: parseInt(manualNum) } : { mode: 'auto' };
      const { data } = await api.post('/draw', body);
      toast.success(`Sorteado: ${data.column}-${data.number}`);
      setManualNum('');
      fetchStats(true);
    } catch (err) { toast.error(err.response?.data?.error || 'Erro no sorteio'); }
    finally { setDrawing(false); }
  };

  const handleCreateRound = async () => {
    if (!newRoundName.trim()) return toast.error('Informe o nome da rodada');
    setCreatingRound(true);
    try {
      await api.post('/rounds', { name: newRoundName.trim(), premio: newRoundPremio.trim() });
      toast.success('Rodada criada!');
      setShowCreateModal(false); setNewRoundName(''); setNewRoundPremio('');
      fetchStats();
    } catch (err) { toast.error(err.response?.data?.error || 'Erro'); }
    finally { setCreatingRound(false); }
  };

  const handleFinishRound = async () => {
    if (!confirm('Encerrar esta rodada?')) return;
    try { await api.patch(`/rounds/${stats.round.id}/finish`); toast.success('Rodada encerrada!'); fetchStats(); }
    catch { toast.error('Erro'); }
  };

  if (loading) return <div className="min-h-screen bg-junina flex items-center justify-center"><LoadingSpinner size="lg" text="Carregando..."/></div>;

  const round = stats?.round;
  const drawn = stats?.drawn || [];
  const cards = stats?.cards || [];
  const drawnSet = new Set(drawn);
  const lastDrawn = drawn[0];
  const lastCol = lastDrawn ? getColumn(lastDrawn) : null;
  const bingoCount = cards.filter(c => c.has_bingo).length;

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />

      <header className="px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" showSub={false} />
            <div style={{borderLeft:'1px solid rgba(199,154,59,0.3)', paddingLeft:10, marginLeft:4}}>
              <p className="text-xs font-semibold" style={{color:'#4B1E6D'}}>Admin</p>
              <p className="text-xs" style={{color:'#C79A3B'}}>@{user?.instagram || user?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/projecao" target="_blank" className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{background:'rgba(0,124,145,0.1)',color:'#007C91'}}>📺 Telão</a>
            <button onClick={logout} className="text-xs font-medium px-2 py-1.5 rounded-lg" style={{color:'#6F2DA8'}}>Sair</button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Controle da rodada */}
          <div className="card-junina p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold" style={{color:'#4B1E6D'}}>Rodada</h2>
              <span className="text-xs px-2 py-1 rounded-full font-semibold"
                style={{background:round?'rgba(0,124,145,0.12)':'rgba(58,31,20,0.08)',color:round?'#007C91':'rgba(58,31,20,0.4)'}}>
                {round ? '🟢 Ativa' : '⚫ Sem rodada'}
              </span>
            </div>
            {round ? (
              <>
                <p className="font-semibold mb-1" style={{color:'#3A1F14'}}>{round.name}</p>
                {round.premio && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mb-2"
                    style={{background:'linear-gradient(135deg,rgba(199,154,59,0.2),rgba(217,108,47,0.15))',color:'#C79A3B',border:'1px solid rgba(199,154,59,0.3)'}}>
                    🏆 {round.premio}
                  </div>
                )}
                <div className="flex gap-3 text-sm mb-3" style={{color:'rgba(58,31,20,0.5)'}}>
                  <span>👥 {cards.length} jogadores</span>
                  <span>🎲 {drawn.length}/50 sorteados</span>
                  <span>🏆 {bingoCount} bingo(s)</span>
                  <span>📡 {stats?.online || 0} online</span>
                </div>
                <button onClick={handleFinishRound} className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                  style={{background:'rgba(194,24,116,0.1)',color:'#C21874'}}>
                  🏁 Encerrar Rodada
                </button>
              </>
            ) : (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                + Criar Nova Rodada
              </button>
            )}
          </div>

          {/* Sorteio */}
          {round && (
            <div className="card-junina p-4">
              <h2 className="font-display font-bold mb-3" style={{color:'#4B1E6D'}}>Sortear Número</h2>

              {lastDrawn && (
                <div className="text-center mb-4 py-3 rounded-xl" style={{background:'linear-gradient(135deg,#C21874,#6F2DA8)'}}>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{lastCol} · Último</p>
                  <p className="text-5xl font-black text-white">{lastDrawn}</p>
                </div>
              )}

              <div className="flex rounded-xl p-1 mb-3" style={{background:'rgba(199,154,59,0.15)'}}>
                {['auto','manual'].map(m => (
                  <button key={m} onClick={() => setMode(m)} className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
                    style={mode===m?{background:'#fff',color:'#4B1E6D',boxShadow:'0 2px 8px rgba(75,30,109,0.1)'}:{color:'#6F2DA8'}}>
                    {m === 'auto' ? '🎲 Automático' : '✍️ Manual'}
                  </button>
                ))}
              </div>

              {mode === 'manual' && (
                <input type="number" min="1" max="50" className="input-junina mb-3" placeholder="Digite o número (1-50)"
                  value={manualNum} onChange={e => setManualNum(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDraw()} />
              )}

              <button className="btn-primary py-4 text-lg" onClick={handleDraw}
                disabled={drawing || drawn.length >= 50 || (mode==='manual' && !manualNum)}>
                {drawing ? <LoadingSpinner size="sm"/> : mode === 'auto' ? '🎲 Sortear!' : `✅ Sortear B${manualNum||'?'}`}
              </button>

              {drawn.length >= 50 && <p className="text-center text-sm mt-2" style={{color:'#C21874'}}>Todos os números sorteados!</p>}
            </div>
          )}

          {/* Grid de números */}
          {round && drawn.length > 0 && (
            <div className="card-junina p-4">
              <h2 className="font-display font-bold mb-3" style={{color:'#4B1E6D'}}>Números Sorteados</h2>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({length:50},(_,i)=>i+1).map(n => (
                  <div key={n} className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                    style={{background:drawnSet.has(n)?COL_COLORS[getColumn(n)||'B']:'rgba(58,31,20,0.05)',color:drawnSet.has(n)?'white':'rgba(58,31,20,0.3)'}}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participantes */}
          {cards.length > 0 && (
            <div className="card-junina p-4">
              <h2 className="font-display font-bold mb-3" style={{color:'#4B1E6D'}}>Participantes ({cards.length})</h2>
              <div className="space-y-2">
                {cards.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{background:c.has_bingo?'rgba(199,154,59,0.15)':'rgba(58,31,20,0.04)'}}>
                    <span className="text-sm font-semibold" style={{color:'#3A1F14'}}>{c.player_name}</span>
                    {c.has_bingo
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:'#C79A3B',color:'white'}}>🏆 BINGO!</span>
                      : <span className="text-xs" style={{color:'rgba(58,31,20,0.4)'}}>jogando</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats gerais */}
          {stats?.stats && (
            <div className="grid grid-cols-3 gap-3">
              {[{emoji:'🎲',label:'Rodadas',value:stats.stats.totalRounds},{emoji:'🃏',label:'Cartelas',value:stats.stats.totalCards},{emoji:'🏆',label:'Bingos',value:stats.stats.totalBingos}].map(s=>(
                <div key={s.label} className="card-junina p-4 text-center">
                  <span className="text-2xl block mb-1">{s.emoji}</span>
                  <p className="text-2xl font-bold" style={{color:'#4B1E6D'}}>{s.value}</p>
                  <p className="text-xs" style={{color:'#C79A3B'}}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal criar rodada */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{background:'rgba(75,30,109,0.5)',backdropFilter:'blur(4px)'}}
          onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="card-junina p-6 w-full max-w-sm animate-pop">
            <h3 className="font-display text-lg font-bold mb-4" style={{color:'#4B1E6D'}}>Nova Rodada</h3>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'#4B1E6D'}}>Nome da rodada</label>
            <input className="input-junina mb-3" placeholder="Ex: Rodada 1 — Junina da Urca" value={newRoundName} onChange={e => setNewRoundName(e.target.value)} autoFocus/>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'#C79A3B'}}>🏆 Prêmio</label>
            <input className="input-junina mb-4" placeholder="Ex: Kit festa, Cesta junina..." value={newRoundPremio} onChange={e => setNewRoundPremio(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateRound()}/>
            <div className="flex gap-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{border:'1.5px solid rgba(199,154,59,0.3)',color:'#6F2DA8'}}>Cancelar</button>
              <button onClick={handleCreateRound} className="btn-primary flex-1 py-2.5 text-sm" disabled={creatingRound}>
                {creatingRound ? <LoadingSpinner size="sm"/> : 'Criar e Iniciar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Bandeirinhas />
    </div>
  );
}
