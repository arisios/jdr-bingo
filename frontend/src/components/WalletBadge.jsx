import React, { useState, useEffect } from 'react';

const CARTEIRA_API = 'https://api-carteira.festasjuninasdorio.com/api';
const TOKEN_KEY = 'bj_token';

export default function WalletBadge() {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    fetch(`${CARTEIRA_API}/wallet/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setBalance(d.balance))
      .catch(() => {});
  }, []);

  if (balance === null) return null;

  return (
    <a href="https://carteira.festasjuninasdorio.com" target="_blank" rel="noreferrer"
      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all hover:opacity-80"
      style={{ background: 'rgba(199,154,59,0.15)', color: '#C79A3B', border: '1px solid rgba(199,154,59,0.3)', whiteSpace: 'nowrap' }}>
      🪙 {balance}
    </a>
  );
}
