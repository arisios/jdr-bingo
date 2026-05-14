import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import GamePage from './pages/GamePage';
import ProjecaoPage from './pages/ProjecaoPage';
import AuthPage from './pages/AuthPage';
import AdminPanel from './pages/AdminPanel';
import LoadingSpinner from './components/LoadingSpinner';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-junina flex items-center justify-center"><LoadingSpinner size="lg"/></div>;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace/>;
  return children;
}

function PlayerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-junina flex items-center justify-center"><LoadingSpinner size="lg"/></div>;
  if (!user) return <Navigate to="/" replace/>;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/jogo" element={<PlayerRoute><GamePage/></PlayerRoute>}/>
          <Route path="/projecao" element={<ProjecaoPage/>}/>
          <Route path="/admin/login" element={<AuthPage/>}/>
          <Route path="/admin" element={<AdminRoute><AdminPanel/></AdminRoute>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        duration: 3500,
        style: { fontFamily:'DM Sans,sans-serif', borderRadius:12, border:'1px solid rgba(199,154,59,0.25)', boxShadow:'0 4px 20px rgba(58,31,20,0.1)' },
        success: { iconTheme: { primary:'#C21874', secondary:'#fff' } },
      }}/>
    </AuthProvider>
  );
}
