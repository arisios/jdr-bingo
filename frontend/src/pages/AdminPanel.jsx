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

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';

function RoundDetail({ r, onClose, onFinish, isActive }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
      style={{background:'rgba(75,30,109,0.55)',backdropFilter:'blur(6px)'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card-junina w-full max-w-lg max-h-[88vh] overflow-y-auto animate-slide-up">
        {/* Cabeçalho */}
        <div className="p-5 border-b" style={{borderColor:'rgba(199,154,59,0.15)'}}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{background:isActive?'rgba(0,124,145,0.15)':r.status==='finished'?'rgba(58,31,20,0.08)':'rgba(199,154,59,0.15)',
                          color:isActive?'#007C91':r.status==='finished'?'rgba(58,31,20,0.4)':'#C79A3B'}}>
                  {isActive ? '🟢 Ativa' : r.status === 'finished' ? '✅ Encerrada' : '⏳ Aguardando'}
                </span>
                <span className="text-xs" style={{color:'rgba(58,31,20,0.4)'}}>#{r.id}</span>
              </div>
              <h2 className="font-display text-xl font-bold" style={{color:'#4B1E6D'}}>{r.name}</h2>
              {r.premio && (
                <div className="inline-flex items-center gap-1 text-sm font-bold mt-1"
                  style={{color:'#C79A3B'}}>🏆 {r.premio}</div>
              )}
            </div>
            <button onClick={onClose} className="text-xl p-1" style={{color:'rgba(58,31,20,0.3)'}}>✕</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{background:'rgba(199,154,59,0.08)'}}>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color:'#C79A3B'}}>Início</p>
              <p className="text-sm font-semibold" style={{color:'#3A1F14'}}>{fmtDate(r.created_at)}</p>
            </div>
            <div className="rounded-xl p-3" style={{background:'rgba(199,154,59,0.08)'}}>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{color:'#C79A3B'}}>Encerramento</p>
              <p className="text-sm font-semibold" style={{color:'#3A1F14'}}>{fmtDate(r.finished_at)}</p>
            </div>
          </div>

          {/* Números */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Jogadores', value: r.playerCount, emoji: '👥' },
              { label: 'Sorteados', value: `${r.drawnCount}/50`, emoji: '🎲' },
              { label: 'Bingos', value: r.winners?.length || 0, emoji: '🏆' },
              { label: 'Restantes', value: 50 - r.drawnCount, emoji: '🔢' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{background:'rgba(75,30,109,0.06)'}}>
                <span className="text-lg block">{s.emoji}</span>
                <p className="font-black text-lg" style={{color:'#4B1E6D'}}>{s.value}</p>
                <p className="text-xs" style={{color:'#C79A3B'}}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Vencedores */}
          {r.winners?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#C79A3B'}}>🏆 Vencedores</p>
              <div className="space-y-1">
                {r.winners.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{background:'rgba(199,154,59,0.12)',color:'#3A1F14'}}>
                    <span className="text-sm">🥇</span>
                    <span className="font-semibold text-sm">{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jogadores */}
          {r.players?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#C79A3B'}}>
                Participantes ({r.playerCount})
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {r.players.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{background:p.has_bingo?'rgba(199,154,59,0.15)':'rgba(58,31,20,0.04)'}}>
                    <span className="text-xs">{p.has_bingo ? '🏆' : '🎴'}</span>
                    <span className="text-xs font-medium truncate" style={{color:'#3A1F14'}}>{p.player_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimos números sorteados */}
          {r.lastNumbers?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#C79A3B'}}>
                Últimos {r.lastNumbers.length} números sorteados
              </p>
              <div className="flex flex-wrap gap-1.5">
                {r.lastNumbers.map((n, i) => {
                  const col = getColumn(n);
                  return (
                    <span key={i} className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{background:i===0?COL_COLORS[col]:'rgba(58,31,20,0.06)',color:i===0?'white':'#3A1F14'}}>
                      {col}-{n}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Encerrar se ativa */}
          {isActive && (
            <button onClick={onFinish} className="w-full py-3 rounded-xl font-bold text-sm"
              style={{background:'rgba(194,24,116,0.1)',color:'#C21874',border:'1.5px solid rgba(194,24,116,0.2)'}}>
              🏁 Encerrar esta Rodada
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [selectedRound, setSelectedRound] = useState(null);

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
      // Atualizar rodada selecionada se ainda aberta
      if (selectedRound) {
        const updated = data.allRounds?.find(r => r.id === selectedRound.id);
        if (updated) setSelectedRound(updated);
      }
    } catch { if (!silent) toast.error('Erro ao carregar'); }
    finally { if (!silent) setLoading(false); }
  }, [selectedRound]);

  useEffect(() => {
    fetchStats();
    const t = setInterval(() => fetchStats(true), 5000);
    return () => clearInterval(t);
  }, [fetchStats]);

  useGameSocket((msg) => {
    if (['number_drawn','bingo_winner','round_started','round_finished'].includes(msg.type)) fetchStats(true);
  });

  const handleDraw = async () => {
    setDrawing(true);
    try {
      const body = mode === 'manual' ? { mode: 'manual', number: parseInt(manualNum) } : { mode: 'auto' };
      const { data } = await api.post('/draw', body);
      toast.success(`${data.column}-${data.number} sorteado!`);
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
    try {
      await api.patch(`/rounds/${stats.round.id}/finish`);
      toast.success('Rodada encerrada!');
      setSelectedRound(null);
      fetchStats();
    } catch { toast.error('Erro'); }
  };

  if (loading) return <div className="min-h-screen bg-junina flex items-center justify-center"><LoadingSpinner size="lg" text="Carregando..."/></div>;

  const round = stats?.round;
  const drawn = stats?.drawn || [];
  const cards = stats?.cards || [];
  const allRounds = stats?.allRounds || [];
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

          {/* Cards de resumo geral */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { emoji:'🎲', label:'Rodadas',  value: stats?.stats?.totalRounds || 0 },
              { emoji:'👥', label:'Cartelas', value: stats?.stats?.totalCards  || 0 },
              { emoji:'🏆', label:'Bingos',   value: stats?.stats?.totalBingos || 0 },
              { emoji:'📡', label:'Online',   value: stats?.online || 0 },
            ].map(s => (
              <div key={s.label} className="card-junina p-3 text-center">
                <span className="text-xl block mb-0.5">{s.emoji}</span>
                <p className="text-xl font-black" style={{color:'#4B1E6D'}}>{s.value}</p>
                <p className="text-xs" style={{color:'#C79A3B'}}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Rodada ativa — controles */}
          <div className="card-junina p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold" style={{color:'#4B1E6D'}}>Rodada Ativa</h2>
              <span className="text-xs px-2 py-1 rounded-full font-semibold"
                style={{background:round?'rgba(0,124,145,0.12)':'rgba(58,31,20,0.08)',color:round?'#007C91':'rgba(58,31,20,0.4)'}}>
                {round ? '🟢 Em andamento' : '⚫ Nenhuma'}
              </span>
            </div>

            {round ? (
              <>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-bold" style={{color:'#3A1F14'}}>{round.name}</p>
                    {round.premio && <p className="text-sm font-semibold mt-0.5" style={{color:'#C79A3B'}}>🏆 {round.premio}</p>}
                  </div>
                  <button onClick={() => setSelectedRound(allRounds.find(r => r.id === round.id) || round)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0"
                    style={{background:'rgba(75,30,109,0.1)',color:'#6F2DA8'}}>
                    Ver detalhes
                  </button>
                </div>
                <div className="flex gap-3 text-sm mb-4 flex-wrap" style={{color:'rgba(58,31,20,0.5)'}}>
                  <span>👥 {cards.length} jogadores</span>
                  <span>🎲 {drawn.length}/50 sorteados</span>
                  <span>🏆 {bingoCount} bingo(s)</span>
                </div>

                {/* Sorteio */}
                {lastDrawn && (
                  <div className="text-center mb-3 py-3 rounded-xl" style={{background:'linear-gradient(135deg,#C21874,#6F2DA8)'}}>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{lastCol} · Último sorteado</p>
                    <p className="text-5xl font-black text-white leading-none mt-1">{lastDrawn}</p>
                  </div>
                )}

                <div className="flex rounded-xl p-1 mb-3" style={{background:'rgba(199,154,59,0.15)'}}>
                  {['auto','manual'].map(m => (
                    <button key={m} onClick={() => setMode(m)} className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={mode===m?{background:'#fff',color:'#4B1E6D',boxShadow:'0 2px 8px rgba(75,30,109,0.1)'}:{color:'#6F2DA8'}}>
                      {m === 'auto' ? '🎲 Automático' : '✍️ Manual'}
                    </button>
                  ))}
                </div>

                {mode === 'manual' && (
                  <input type="number" min="1" max="50" className="input-junina mb-3" placeholder="Digite o número (1-50)"
                    value={manualNum} onChange={e => setManualNum(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDraw()} />
                )}

                <div className="flex gap-2">
                  <button className="btn-primary flex-1 py-3 text-base" onClick={handleDraw}
                    disabled={drawing || drawn.length >= 50 || (mode==='manual' && !manualNum)}>
                    {drawing ? <LoadingSpinner size="sm"/> : mode === 'auto' ? '🎲 Sortear!' : `✅ Sortear ${manualNum||'?'}`}
                  </button>
                  <button onClick={handleFinishRound} className="px-4 py-3 rounded-xl text-sm font-bold"
                    style={{background:'rgba(194,24,116,0.1)',color:'#C21874'}}>
                    🏁 Encerrar
                  </button>
                </div>

                {drawn.length >= 50 && <p className="text-center text-sm mt-2" style={{color:'#C21874'}}>Todos os números sorteados!</p>}

                {/* Grid de números sorteados */}
                {drawn.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#C79A3B'}}>
                      Números sorteados ({drawn.length}/50)
                    </p>
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({length:50},(_,i)=>i+1).map(n => (
                        <div key={n} className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{background:drawnSet.has(n)?COL_COLORS[getColumn(n)||'B']:'rgba(58,31,20,0.05)',color:drawnSet.has(n)?'white':'rgba(58,31,20,0.25)'}}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cartelas em tempo real */}
                {cards.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{color:'#C79A3B'}}>
                      Cartelas ({cards.length}) — tempo real
                    </p>
                    <div className="space-y-2">
                      {[...cards].sort((a,b) => b.marked - a.marked).map(c => {
                        const pct = Math.round((c.marked / c.total) * 100);
                        return (
                          <div key={c.id} className="rounded-xl p-3"
                            style={{background:c.has_bingo?'rgba(199,154,59,0.15)':'rgba(58,31,20,0.04)',border:`1px solid ${c.has_bingo?'rgba(199,154,59,0.4)':'rgba(199,154,59,0.1)'}`}}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-bold" style={{color:'#3A1F14'}}>{c.player_name}</span>
                              <span className="text-xs font-bold" style={{color:c.has_bingo?'#C79A3B':pct>=80?'#C21874':pct>=50?'#6F2DA8':'rgba(58,31,20,0.4)'}}>
                                {c.has_bingo ? '🏆 BINGO!' : `${c.marked}/${c.total} • ${pct}%`}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(58,31,20,0.08)'}}>
                              <div className="h-full rounded-full transition-all duration-500"
                                style={{width:`${pct}%`,background:c.has_bingo?'linear-gradient(90deg,#C79A3B,#D96C2F)':pct>=80?'linear-gradient(90deg,#C21874,#6F2DA8)':'linear-gradient(90deg,#6F2DA8,#007C91)'}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                + Criar Nova Rodada
              </button>
            )}
          </div>

          {/* Lista de todas as rodadas */}
          <div className="card-junina p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold" style={{color:'#4B1E6D'}}>
                Todas as Rodadas
                <span className="ml-2 text-sm font-normal" style={{color:'#C79A3B'}}>({allRounds.length})</span>
              </h2>
              {!round && (
                <button onClick={() => setShowCreateModal(true)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold"
                  style={{background:'linear-gradient(135deg,#C21874,#6F2DA8)',color:'white'}}>
                  + Nova
                </button>
              )}
            </div>

            {allRounds.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">🎲</span>
                <p style={{color:'rgba(58,31,20,0.4)'}}>Nenhuma rodada ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allRounds.map(r => {
                  const isActive = r.status === 'active';
                  return (
                    <button key={r.id} onClick={() => setSelectedRound(r)}
                      className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.01]"
                      style={{background:isActive?'rgba(0,124,145,0.08)':'rgba(58,31,20,0.04)',border:`1.5px solid ${isActive?'rgba(0,124,145,0.25)':'rgba(199,154,59,0.15)'}`}}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{background:isActive?'rgba(0,124,145,0.15)':'rgba(58,31,20,0.08)',color:isActive?'#007C91':'rgba(58,31,20,0.4)'}}>
                              {isActive ? '🟢' : '✅'} {isActive ? 'Ativa' : 'Encerrada'}
                            </span>
                            <span className="text-xs" style={{color:'rgba(58,31,20,0.35)'}}>#{r.id} · {fmtDate(r.created_at)}</span>
                          </div>
                          <p className="font-bold text-sm truncate" style={{color:'#3A1F14'}}>{r.name}</p>
                          {r.premio && <p className="text-xs mt-0.5" style={{color:'#C79A3B'}}>🏆 {r.premio}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex gap-2 text-xs" style={{color:'rgba(58,31,20,0.5)'}}>
                            <span>👥 {r.playerCount}</span>
                            <span>🎲 {r.drawnCount}</span>
                            {r.winners?.length > 0 && <span style={{color:'#C79A3B'}}>🏆 {r.winners.length}</span>}
                          </div>
                          <span className="text-xs mt-1 block" style={{color:'rgba(75,30,109,0.4)'}}>ver detalhes →</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Modal: detalhes da rodada */}
      {selectedRound && (
        <RoundDetail
          r={selectedRound}
          isActive={selectedRound.status === 'active'}
          onClose={() => setSelectedRound(null)}
          onFinish={handleFinishRound}
        />
      )}

      {/* Modal: criar rodada */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{background:'rgba(75,30,109,0.5)',backdropFilter:'blur(4px)'}}
          onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="card-junina p-6 w-full max-w-sm animate-pop">
            <h3 className="font-display text-lg font-bold mb-4" style={{color:'#4B1E6D'}}>Nova Rodada</h3>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'#4B1E6D'}}>Nome da rodada</label>
            <input className="input-junina mb-3" placeholder="Ex: Rodada 1 — Junina da Urca"
              value={newRoundName} onChange={e => setNewRoundName(e.target.value)} autoFocus />
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'#C79A3B'}}>🏆 Prêmio</label>
            <input className="input-junina mb-5" placeholder="Ex: Kit festa, Cesta junina..."
              value={newRoundPremio} onChange={e => setNewRoundPremio(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateRound()} />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{border:'1.5px solid rgba(199,154,59,0.3)',color:'#6F2DA8'}}>Cancelar</button>
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
