import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import Bandeirinhas from '../components/Bandeirinhas';
import LoadingSpinner from '../components/LoadingSpinner';
import BrandMark from '../components/BrandMark';

const formatPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

export default function AuthPage({ adminOnly = false }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState('instagram');
  const [form, setForm] = useState({ name: '', identifier: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhone = (e) => setForm({ ...form, identifier: formatPhone(e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.identifier, form.password);
        toast.success(`Bem-vindo(a), ${(user.name || user.instagram || '').split(' ')[0]}! 🎉`);
        navigate(user.role === 'admin' ? '/admin' : '/');
      } else {
        if (!form.name.trim()) return toast.error('Informe seu nome');
        const payload = tipo === 'instagram'
          ? { name: form.name, instagram: form.identifier, password: form.password }
          : { name: form.name, phone: form.identifier, password: form.password };
        const user = await register(payload);
        toast.success(`Conta criada! Bem-vindo(a), ${user.name.split(' ')[0]}! 🎉`);
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Algo deu errado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-junina flex flex-col">
      <div className="pt-4"><Bandeirinhas /></div>
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="text-center mb-8">
            <BrandMark size="lg" />
          </div>

          <div className="card-junina p-6">
            {!adminOnly && (
              <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(199,154,59,0.12)' }}>
                {['login', 'register'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={mode === m
                      ? { background: '#fff', color: '#4B1E6D', boxShadow: '0 2px 8px rgba(75,30,109,0.12)' }
                      : { color: '#6F2DA8' }}>
                    {m === 'login' ? 'Entrar' : 'Cadastrar'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#4B1E6D' }}>Seu nome</label>
                    <input name="name" type="text" className="input-junina" placeholder="Como quer ser chamado(a)" value={form.name} onChange={handleChange} autoFocus />
                  </div>
                  <div className="flex rounded-xl p-1" style={{ background: 'rgba(199,154,59,0.08)' }}>
                    {['instagram','telefone'].map(t => (
                      <button key={t} type="button" onClick={() => { setTipo(t); setForm(f=>({...f,identifier:''})); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={tipo===t ? { background:'#fff', color:'#4B1E6D', boxShadow:'0 1px 4px rgba(75,30,109,0.1)' } : { color:'#6F2DA8' }}>
                        {t === 'instagram' ? '@ Instagram' : '📱 Telefone'}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#4B1E6D' }}>
                  {mode === 'login' ? 'Instagram ou Telefone' : tipo === 'instagram' ? '@ Instagram' : 'Telefone'}
                </label>
                <input name="identifier" type={mode === 'register' && tipo === 'telefone' ? 'tel' : 'text'} className="input-junina"
                  placeholder={mode === 'login' ? 'Instagram ou (21) 99999-9999' : tipo === 'instagram' ? 'seuinstagram' : '(21) 99999-9999'}
                  value={form.identifier}
                  onChange={mode === 'register' && tipo === 'telefone' ? handlePhone : handleChange}
                  autoCapitalize="none" required />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#4B1E6D' }}>
                  Senha
                </label>
                <input name="password" type="password" className="input-junina"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={form.password} onChange={handleChange} required />
              </div>

              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading
                  ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" />{mode === 'login' ? 'Entrando...' : 'Criando conta...'}</span>
                  : mode === 'login' ? 'Entrar na festa 🎉' : 'Criar minha conta 🎲'
                }
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(199,154,59,0.6)' }}>
            Juninas do Rio 2026 · Bingo
          </p>
        </div>
      </div>
      <div className="pb-4"><Bandeirinhas /></div>
    </div>
  );
}
