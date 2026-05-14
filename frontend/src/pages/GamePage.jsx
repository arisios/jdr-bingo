import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { hasBingo, countMissing, announceNumber } from '../utils/bingo';
import { useGameSocket } from '../hooks/useGameSocket';
import BingoCard from '../components/BingoCard';
import Confetti from '../components/Confetti';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';

export default function GamePage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [card] = useState(state?.card);
  const [round] = useState(state?.round);
  const [drawn, setDrawn] = useState(state?.drawn || []);
  const [lastDrawn, setLastDrawn] = useState(null);
  const [lastColumn, setLastColumn] = useState('');
  const [roundActive, setRoundActive] = useState(true);
  const [winners, setWinners] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [claimingBingo, setClaimingBingo] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  useEffect(() => {
    if (!card) navigate('/');
  }, [card]);

  useGameSocket((msg) => {
    if (msg.type === 'number_drawn') {
      setDrawn(msg.drawn);
      setLastDrawn(msg.number);
      setLastColumn(msg.column);
      if (soundRef.current) announceNumber(msg.number, msg.column);
    }
    if (msg.type === 'bingo_winner') {
      setWinners(w => [...w, msg.playerName]);
      toast.success(`🏆 BINGO! ${msg.playerName} ganhou!`, { duration: 6000 });
      if (msg.playerName === card?.player_name) { setConfetti(true); setTimeout(() => setConfetti(false), 6000); }
    }
    if (msg.type === 'round_finished') {
      setRoundActive(false);
      toast('🎲 Rodada encerrada!', { duration: 5000 });
    }
  });

  const claimBingo = async () => {
    setClaimingBingo(true);
    try {
      await api.post(`/cards/${card.id}/bingo`);
      toast.success('🏆 BINGO confirmado!');
      setConfetti(true);
      setTimeout(() => setConfetti(false), 6000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bingo inválido');
    } finally { setClaimingBingo(false); }
  };

  if (!card) return null;

  const drawnSet = new Set(drawn);
  const isBingo = hasBingo(card.numbers, drawnSet);
  const missing = countMissing(card.numbers, drawnSet);
  const nearBingo = missing <= 2 && missing > 0;

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <Confetti active={confetti} />
      <Bandeirinhas />

      {/* Header */}
      <header className="px-4 py-3">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-base" style={{color:'#4B1E6D'}}>{round?.name}</h1>
            <p className="text-xs font-medium" style={{color:'#C79A3B'}}>@{card.player_name}</p>
          </div>
          <button onClick={() => setSoundEnabled(s => !s)}
            className="text-xl p-2 rounded-xl transition-all"
            style={{background:soundEnabled?'rgba(194,24,116,0.1)':'rgba(58,31,20,0.05)',color:soundEnabled?'#C21874':'rgba(58,31,20,0.3)'}}>
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      {/* Último número sorteado */}
      <div className="px-4 mb-3">
        <div className="max-w-sm mx-auto">
          {lastDrawn ? (
            <div className="rounded-2xl p-3 text-center animate-pop" style={{background:'linear-gradient(135deg,#C21874,#6F2DA8)'}}>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{lastColumn} · Último sorteado</p>
              <p className="text-5xl font-black text-white leading-none mt-1">{lastDrawn}</p>
            </div>
          ) : (
            <div className="rounded-2xl p-3 text-center" style={{background:'rgba(199,154,59,0.1)',border:'1px solid rgba(199,154,59,0.2)'}}>
              <p className="text-sm" style={{color:'rgba(58,31,20,0.4)'}}>Aguardando primeiro sorteio...</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerta near-bingo */}
      {nearBingo && !isBingo && (
        <div className="px-4 mb-2">
          <div className="max-w-sm mx-auto rounded-xl p-2.5 text-center animate-bounce-in" style={{background:'rgba(194,24,116,0.15)',border:'2px solid #C21874'}}>
            <p className="font-black text-sm" style={{color:'#C21874'}}>
              🔥 Falta{missing>1?'m':''} só {missing} número{missing>1?'s':''}!
            </p>
          </div>
        </div>
      )}

      {/* Bingo! */}
      {isBingo && !claimingBingo && (
        <div className="px-4 mb-2">
          <div className="max-w-sm mx-auto rounded-xl p-3 text-center animate-bounce-in" style={{background:'linear-gradient(135deg,#C79A3B,#D96C2F)'}}>
            <p className="font-black text-xl text-white">🏆 BINGO!</p>
            <button onClick={claimBingo} className="mt-2 px-6 py-2 bg-white rounded-xl font-black text-sm" style={{color:'#C79A3B'}}>
              Confirmar BINGO!
            </button>
          </div>
        </div>
      )}

      {/* Cartela */}
      <div className="flex-1 px-4 pb-4">
        <div className="max-w-sm mx-auto">
          <div className="card-junina p-3">
            <BingoCard grid={card.numbers} drawn={drawn} lastDrawn={lastDrawn} />
          </div>

          {/* Progresso */}
          <div className="mt-3 px-1">
            <div className="flex justify-between text-xs mb-1" style={{color:'rgba(58,31,20,0.5)'}}>
              <span>{drawn.length} de {50} sorteados</span>
              <span style={{color:nearBingo?'#C21874':'rgba(58,31,20,0.5)'}}>
                {isBingo ? '✅ Bingo!' : `Faltam ${missing} na sua cartela`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(199,154,59,0.2)'}}>
              <div className="h-full rounded-full transition-all" style={{width:`${(drawn.length/50)*100}%`,background:'linear-gradient(90deg,#C21874,#6F2DA8)'}}/>
            </div>
          </div>

          {/* Últimos sorteados */}
          {drawn.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{color:'#C79A3B'}}>Últimos sorteados</p>
              <div className="flex flex-wrap gap-1.5">
                {[...drawn].reverse().slice(0,20).map((n,i) => (
                  <span key={n} className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{background:i===0?'linear-gradient(135deg,#C21874,#6F2DA8)':'rgba(199,154,59,0.15)',color:i===0?'#fff':'#C79A3B'}}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!roundActive && (
            <div className="mt-4 card-junina p-4 text-center">
              <span className="text-3xl block mb-2">🏁</span>
              <p className="font-bold" style={{color:'#4B1E6D'}}>Rodada encerrada!</p>
              <button onClick={() => navigate('/')} className="btn-primary mt-3 text-sm">Voltar ao início</button>
            </div>
          )}
        </div>
      </div>
      <Bandeirinhas />
    </div>
  );
}
