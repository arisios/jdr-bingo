import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';
import BrandMark from '../components/BrandMark';
import WalletBadge from '../components/WalletBadge';

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasRound, setHasRound] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [authLoading, user]);

  useEffect(() => {
    api.get('/rounds/active')
      .then(r => setHasRound(!!r.data.round))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/cards/join');
      navigate('/jogo', { state: { card: data.card, round: data.round, drawn: data.drawn } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao entrar no jogo');
    } finally { setLoading(false); }
  };

  if (authLoading) return null;
  if (!user) return null;

  const firstName = (user.name || user.instagram || '').split(' ')[0];

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Bandeirinhas />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm animate-slide-up">

          <div className="text-center mb-6 animate-float">
            <BrandMark size="lg" />
          </div>

          <div className="text-center mb-5">
            <span className="text-sm font-medium" style={{ color: 'rgba(58,31,20,0.5)' }}>
              Olá, <strong style={{ color: '#4B1E6D' }}>{firstName}</strong>! 👋
            </span>
          </div>

          {checking ? (
            <div className="flex justify-center py-8"><LoadingSpinner text="Verificando rodada..." /></div>
          ) : !hasRound ? (
            <div className="card-junina p-8 text-center">
              <span className="text-5xl block mb-3">🎲</span>
              <p className="font-display text-lg font-bold" style={{ color: '#4B1E6D' }}>Nenhuma rodada ativa</p>
              <p className="text-sm mt-2" style={{ color: 'rgba(58,31,20,0.5)' }}>Aguarde o admin iniciar o jogo</p>
            </div>
          ) : (
            <div className="card-junina p-6 animate-pop">
              <div className="text-center mb-5">
                <span className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,124,145,0.12)', color: '#007C91' }}>
                  🟢 Rodada ativa — entre agora!
                </span>
              </div>
              <button className="btn-primary text-lg py-4" disabled={loading} onClick={handleJoin}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />Gerando cartela...</span>
                  : '🎲 Pegar minha cartela!'}
              </button>
            </div>
          )}

          <div className="text-center mt-6 flex justify-center items-center gap-4 flex-wrap">
            <WalletBadge />
            <a href="/projecao" className="text-xs font-medium" style={{ color: 'rgba(58,31,20,0.35)' }}>📺 Telão</a>
            {user.role === 'admin' && (
              <a href="/admin" className="text-xs font-medium" style={{ color: 'rgba(58,31,20,0.35)' }}>⚙️ Admin</a>
            )}
            <button onClick={logout} className="text-xs font-medium" style={{ color: 'rgba(58,31,20,0.35)' }}>Sair</button>
          </div>
        </div>
      </div>
      <Bandeirinhas />
    </div>
  );
}
