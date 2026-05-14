import React,{useEffect,useState} from 'react';
const COLORS=['#C21874','#6F2DA8','#C79A3B','#007C91','#D96C2F','#4B1E6D'];
export default function Confetti({active}){
  const [pieces,setPieces]=useState([]);
  useEffect(()=>{
    if(!active)return;
    setPieces(Array.from({length:100},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*2,color:COLORS[i%COLORS.length],size:6+Math.random()*8,duration:2.5+Math.random()*2,round:Math.random()>0.5})));
    const t=setTimeout(()=>setPieces([]),5000);
    return()=>clearTimeout(t);
  },[active]);
  if(!pieces.length)return null;
  return <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999,overflow:'hidden'}}>
    {pieces.map(p=><div key={p.id} style={{position:'absolute',left:`${p.x}%`,top:-20,width:p.size,height:p.size,background:p.color,borderRadius:p.round?'50%':2,animation:`confettiFall ${p.duration}s ${p.delay}s ease-in forwards`}}/>)}
  </div>
}
