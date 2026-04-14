import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://gkhivciloxgldiwbwmoo.supabase.co";
const SUPABASE_KEY = "sb_publishable_S3GvHVJn_EJq_0zGFqjGsA_c8YYAnaB";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CONFIG & DOPAMINE LEVELS ────────────────────────────────────────────────
const ALL_LETTERS = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','Y','Z'];

const CFG = {
  easy:   { rounds:4, minSeq:3, maxSeq:4, mathMs:8000, letterMs:1800, pts:10, color:'#6af7c8', label:'EASY'   },
  medium: { rounds:5, minSeq:4, maxSeq:5, mathMs:5000, letterMs:1400, pts:15, color:'#6aaff7', label:'MEDIUM' },
  hard:   { rounds:6, minSeq:5, maxSeq:6, mathMs:3500, letterMs:1200, pts:20, color:'#f76a8a', label:'HARD'   },
  boss:   { rounds:6, minSeq:7, maxSeq:8, mathMs:3000, letterMs:1100, pts:30, color:'#f7c46a', label:'BOSS'   },
  legend: { rounds:8, minSeq:9, maxSeq:12,mathMs:2000, letterMs:900,  pts:50, color:'#ff6b35', label:'LEGEND' },
};

// ── HELPERS ──────────────────────────────────────────────────────────────────
function ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function buildLetters(len){
  let p=[...ALL_LETTERS], o=[];
  for(let i=0;i<len;i++){ let x=ri(0,p.length-1); o.push(p[x]); p.splice(x,1); }
  return o;
}
function buildMath(lvl){
  let op=['+','-','*'][ri(0,2)];
  let a,b,real;
  if(op==='+'){ a=ri(2,20); b=ri(2,20); real=a+b; }
  else if(op==='-'){ a=ri(10,30); b=ri(1,a); real=a-b; }
  else { a=ri(2,9); b=ri(2,9); real=a*b; }
  let corr=Math.random()>0.4;
  return { expr:`${a}${op}${b}`, shown: corr?real:real+ri(1,3), corr };
}

// ── UI COMPONENTS ─────────────────────────────────────────────────────────────
const Card = ({children}) => <div style={{background:'#1a1a26',border:'1px solid #2a2a3e',borderRadius:20,padding:20,display:'flex',flexDirection:'column',alignItems:'center',gap:15}}>{children}</div>;
const Lbl = ({children}) => <span style={{fontSize:'.6rem',letterSpacing:2,color:'#6b6b8a',textTransform:'uppercase'}}>{children}</span>;

// ── GAME ENGINE ───────────────────────────────────────────────────────────────
function Game({level, username, onFinish}){
  const c = CFG[level];
  const [step,setStep] = useState('memo'); // memo, math, recall
  const [round,setRound] = useState(1);
  const [seq,setSeq] = useState([]);
  const [curIdx,setCurIdx] = useState(0);
  const [mathData,setMathData] = useState(null);
  const [correctMaths,setCorrectMaths] = useState(0);
  const [totalMaths,setTotalMaths] = useState(0);
  const [userLetters,setUserLetters] = useState([]);

  useEffect(()=>{ startRound(); },[]);

  function startRound(){
    setSeq(buildLetters(ri(c.minSeq, c.maxSeq)));
    setCurIdx(0);
    setStep('memo');
  }

  useEffect(()=>{
    if(step==='memo'){
      let t = setTimeout(()=>{
        if(curIdx < seq.length-1){ setCurIdx(v=>v+1); }
        else { setMathData(buildMath(level)); setStep('math'); }
      }, c.letterMs);
      return ()=>clearTimeout(t);
    }
  },[step,curIdx,seq]);

  function handleMath(ans){
    setTotalMaths(v=>v+1);
    if(ans === mathData.corr) setCorrectMaths(v=>v+1);
    setStep('recall');
  }

  function handleRecall(letter){
    let newList = [...userLetters, letter];
    setUserLetters(newList);
    if(newList.length === seq.length){
      if(round < c.rounds){
        setRound(v=>v+1);
        setUserLetters([]);
        startRound();
      } else {
        onFinish({ score: Math.round((correctMaths/totalMaths)*100), mathAcc: correctMaths });
      }
    }
  }

  return (
    <Card>
      <div style={{color:c.color, fontWeight:800}}>{c.label} - Round {round}/{c.rounds}</div>
      {step==='memo' && <div style={{fontSize:'4rem', fontWeight:900}}>{seq[curIdx]}</div>}
      {step==='math' && (
        <div style={{width:'100%'}}>
          <div style={{fontSize:'2rem', marginBottom:20}}>{mathData.expr} = {mathData.shown}?</div>
          <div style={{display:'flex', gap:10}}>
            <button onClick={()=>handleMath(true)} style={{flex:1, padding:15, background:'#6af7c8', border:'none', borderRadius:10, fontWeight:700}}>YES</button>
            <button onClick={()=>handleMath(false)} style={{flex:1, padding:15, background:'#f76a8a', border:'none', borderRadius:10, fontWeight:700}}>NO</button>
          </div>
        </div>
      )}
      {step==='recall' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8}}>
          {ALL_LETTERS.map(l => (
            <button key={l} disabled={userLetters.includes(l)} onClick={()=>handleRecall(l)} style={{padding:10, background:userLetters.includes(l)?'#111':'#2a2a3e', color:'#fff', border:'none', borderRadius:8}}>{l}</button>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen] = useState('username');
  const [user,setUser] = useState('');
  const [lvl,setLvl] = useState(null);

  const saveToSupabase = async (res) => {
    await supabase.from('scores').insert([{ username: user, score: res.score, level: lvl }]);
    setScreen('menu');
  };

  return(
    <div style={{background:'#0a0a0f', minHeight:'100vh', padding:20, color:'#fff', fontFamily:'sans-serif'}}>
      <div style={{maxWidth:500, margin:'0 auto'}}>
        {screen==='username' && (
          <Card>
            <div style={{fontSize:'2rem', fontWeight:900}}>NEUROSPAN</div>
            <input placeholder="Username" onChange={e=>setUser(e.target.value)} style={{padding:12, borderRadius:10, border:'1px solid #333', background:'#000', color:'#fff', width:'80%'}} />
            <button onClick={()=>setScreen('menu')} style={{padding:12, width:'85%', background:'#7c6af7', border:'none', borderRadius:10, color:'#fff', fontWeight:700}}>START</button>
          </Card>
        )}
        {screen==='menu' && (
          <div style={{display:'grid', gap:10}}>
            <div style={{textAlign:'center', fontSize:'1.5rem', marginBottom:10}}>Select Training</div>
            {Object.keys(CFG).map(k => (
              <button key={k} onClick={()=>{setLvl(k); setScreen('game');}} style={{padding:20, background:'#1a1a26', border:`1px solid ${CFG[k].color}`, borderRadius:15, color:'#fff', fontWeight:700}}>{CFG[k].label.toUpperCase()}</button>
            ))}
          </div>
        )}
        {screen==='game' && <Game level={lvl} username={user} onFinish={saveToSupabase} />}
      </div>
    </div>
  );
}
