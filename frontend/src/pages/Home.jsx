import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasRound, setHasRound] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/rounds/active').then(r => setHasRound(!!r.data.round)).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Informe seu nome');
    setLoading(true);
    try {
      const { data } = await api.post('/cards/join', { playerName: name.trim() });
      navigate('/jogo', { state: { card: data.card, round: data.round, drawn: data.drawn } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao entrar no jogo');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-6">
            <img src="/logojuninas.png" alt="Juninas do Rio" className="h-20 mx-auto object-contain mb-3 animate-float"/>
            <h1 className="font-display text-3xl font-bold" style={{color:'#4B1E6D'}}>Bingo</h1>
            <p className="text-sm font-semibold tracking-widest uppercase mt-1" style={{color:'#C79A3B'}}>Temporada 2026</p>
          </div>

          {checking ? (
            <div className="flex justify-center py-8"><LoadingSpinner text="Verificando rodada..."/></div>
          ) : !hasRound ? (
            <div className="card-junina p-8 text-center">
              <span className="text-5xl block mb-3">🎲</span>
              <p className="font-display text-lg font-bold" style={{color:'#4B1E6D'}}>Nenhuma rodada ativa</p>
              <p className="text-sm mt-2" style={{color:'rgba(58,31,20,0.5)'}}>Aguarde o admin iniciar o jogo</p>
            </div>
          ) : (
            <div className="card-junina p-6 animate-pop">
              <div className="text-center mb-5">
                <span className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full" style={{background:'rgba(0,124,145,0.12)',color:'#007C91'}}>
                  🟢 Rodada ativa — entre agora!
                </span>
              </div>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{color:'#4B1E6D'}}>Seu nome</label>
                  <input className="input-junina" placeholder="Como quer ser chamado(a)" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
                </div>
                <button type="submit" className="btn-primary text-lg py-4" disabled={loading}>
                  {loading ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm"/>Gerando cartela...</span> : '🎲 Pegar minha cartela!'}
                </button>
              </form>
            </div>
          )}

          <div className="text-center mt-6">
            <a href="/projecao" className="text-xs font-medium" style={{color:'rgba(58,31,20,0.35)'}}>📺 Tela de projeção</a>
            <span style={{color:'rgba(58,31,20,0.2)'}}> · </span>
            <a href="/admin/login" className="text-xs font-medium" style={{color:'rgba(58,31,20,0.35)'}}>⚙️ Admin</a>
          </div>
        </div>
      </div>
      <Bandeirinhas />
    </div>
  );
}
