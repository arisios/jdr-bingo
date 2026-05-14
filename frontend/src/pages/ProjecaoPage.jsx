import React, { useState, useEffect } from 'react';
import api, { WS_URL } from '../utils/api';
import { getColumn, TOTAL } from '../utils/bingo';

const COL_COLORS = { B:'#C21874', I:'#6F2DA8', N:'#007C91', G:'#D96C2F', O:'#C79A3B' };
const COLS = ['B','I','N','G','O'];
const RANGES = { B:[1,10], I:[11,20], N:[21,30], G:[31,40], O:[41,50] };

export default function ProjecaoPage() {
  const [lastNumber, setLastNumber] = useState(null);
  const [lastColumn, setLastColumn] = useState('');
  const [drawn, setDrawn] = useState([]);
  const [round, setRound] = useState(null);
  const [online, setOnline] = useState(0);
  const [winner, setWinner] = useState(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    api.get('/rounds/active').then(r => { setRound(r.data.round); setDrawn(r.data.drawn || []); setOnline(r.data.online || 0); });
    const ws = new WebSocket(WS_URL);
    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'number_drawn') {
        setDrawn(msg.drawn); setLastNumber(msg.number); setLastColumn(msg.column);
        setAnimate(true); setTimeout(() => setAnimate(false), 800);
      }
      if (msg.type === 'bingo_winner') { setWinner(msg.playerName); setTimeout(() => setWinner(null), 8000); }
      if (msg.type === 'round_started') { setRound(msg.round); setDrawn([]); setLastNumber(null); setWinner(null); }
      if (msg.type === 'round_finished') setRound(r => r ? { ...r, status: 'finished' } : r);
      if (msg.type === 'connected') setOnline(msg.clients || 0);
    };
    return () => ws.close();
  }, []);

  const drawnByCol = {};
  COLS.forEach(c => { drawnByCol[c] = drawn.filter(n => getColumn(n) === c).sort((a,b) => a-b); });
  const colColor = lastColumn ? COL_COLORS[lastColumn] : '#C21874';

  return (
    <div className="projecao-bg min-h-screen flex flex-col" style={{fontFamily:'DM Sans, sans-serif'}}>
      {/* Vencedor */}
      {winner && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{textAlign:'center',animation:'bounceIn 0.5s ease-out'}}>
            <div style={{fontSize:100}}>🏆</div>
            <div style={{fontSize:64,fontWeight:900,color:'#C79A3B',fontFamily:'Playfair Display,serif',lineHeight:1.1}}>BINGO!</div>
            <div style={{fontSize:36,color:'white',marginTop:12,fontWeight:700}}>{winner}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(199,154,59,0.15)'}}>
        <img src="/logojuninas.png" alt="Juninas do Rio" style={{height:48,objectFit:'contain'}}/>
        <div style={{textAlign:'center'}}>
          <div style={{color:'#C79A3B',fontSize:14,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase'}}>{round?.name || 'Aguardando rodada'}</div>
          <div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>{drawn.length}/{TOTAL} sorteados · {online} jogadores</div>
        </div>
        <div style={{textAlign:'right',color:'rgba(255,255,255,0.3)',fontSize:11}}>Bingo 50<br/>Juninas do Rio</div>
      </div>

      {/* Número principal */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',flex:1,gap:40,padding:'24px'}}>
        <div style={{textAlign:'center'}}>
          {lastNumber ? (
            <>
              <div style={{fontSize:24,fontWeight:900,color:colColor,letterSpacing:'0.3em',textTransform:'uppercase',marginBottom:8}}>{lastColumn}</div>
              <div style={{fontSize:200,fontWeight:900,color:'white',lineHeight:0.85,fontFamily:'DM Sans,sans-serif',textShadow:`0 0 60px ${colColor}80`,transition:'all 0.3s',transform:animate?'scale(1.1)':'scale(1)'}}>{lastNumber}</div>
              <div style={{fontSize:18,color:'rgba(255,255,255,0.4)',marginTop:16}}>Último número sorteado</div>
            </>
          ) : (
            <div style={{fontSize:48,color:'rgba(255,255,255,0.2)',textAlign:'center'}}>
              🎲<br/><span style={{fontSize:24,fontWeight:600}}>Aguardando...</span>
            </div>
          )}
        </div>

        {/* Grid de sorteados por coluna */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,minWidth:320}}>
          {COLS.map(col => (
            <div key={col}>
              <div style={{textAlign:'center',fontSize:20,fontWeight:900,color:COL_COLORS[col],marginBottom:6,letterSpacing:'0.1em'}}>{col}</div>
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {Array.from({length:10}).map((_,i) => {
                  const [min] = RANGES[col];
                  const num = min + i;
                  const drawn_num = drawnByCol[col]?.includes(num);
                  return <div key={num} style={{width:48,height:28,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,background:drawn_num?COL_COLORS[col]:'rgba(255,255,255,0.05)',color:drawn_num?'white':'rgba(255,255,255,0.2)',transition:'all 0.3s'}}>{num}</div>;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos 8 */}
      {drawn.length > 1 && (
        <div style={{padding:'12px 24px',borderTop:'1px solid rgba(199,154,59,0.1)',display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:'rgba(255,255,255,0.3)',fontSize:12,marginRight:4}}>Anteriores:</span>
          {[...drawn].reverse().slice(1,9).map(n => (
            <span key={n} style={{fontSize:14,fontWeight:700,padding:'4px 10px',borderRadius:20,background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)'}}>{n}</span>
          ))}
        </div>
      )}
    </div>
  );
}
