import React,{createContext,useContext,useState,useEffect} from 'react';
import api from '../utils/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
  const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{const t=localStorage.getItem('bj_token'),s=localStorage.getItem('bj_user');if(t&&s)try{setUser(JSON.parse(s))}catch{localStorage.removeItem('bj_token')}setLoading(false)},[]);
  const login=async(id,pw)=>{const{data}=await api.post('/auth/login',{identifier:id,password:pw});localStorage.setItem('bj_token',data.token);localStorage.setItem('bj_user',JSON.stringify(data.user));setUser(data.user);return data.user};
  const logout=()=>{localStorage.removeItem('bj_token');localStorage.removeItem('bj_user');setUser(null)};
  return <AuthContext.Provider value={{user,loading,login,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
