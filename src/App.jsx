import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE CONFIGURATION ───────────────────────────────────────────────────
// These credentials connect to your existing database
const SUPABASE_URL = "https://gkhivciloxgldiwbwmoo.supabase.co";
const SUPABASE_KEY = "sb_publishable_S3GvHVJn_EJq_0zGFqjGsA_c8YYAnaB";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── SECURITY & VALIDATION ─────────────────────────────────────────────────────
const validateUsername = (name) => {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 15) return { valid: false, msg: "3-15 characters required" };
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return { valid: false, msg: "Only letters, numbers, and underscores" };
  return { valid: true, data: trimmed };
};

// ── DOPAMINE-TUNED LEVELS ─────────────────────────────────────────────────────
const ALL_LETTERS = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','Y','Z'];

const CFG = {
  easy:   { rounds:4, minSeq:3, maxSeq:4, mathMs:8000, letterMs:1800, pts:10, color:'#6af7c8', label:'EASY'   },
  medium: { rounds:5, minSeq:4, maxSeq:5, mathMs:5000, letterMs:1400, pts:15, color:'#6aaff7', label:'MEDIUM' },
  hard:   { rounds:6, minSeq:5, maxSeq:6, mathMs:3500, letterMs:1200, pts:20, color:'#f76a8a', label:'HARD'   },
  boss:   { rounds:6, minSeq:7, maxSeq:8, mathMs:3000, letterMs:1100, pts:30, color:'#f7c46a', label:'BOSS'   },
  legend: { rounds:8, minSeq:9, maxSeq:12,mathMs:2000, letterMs:900,  pts:50, color:'#ff6b35', label:'LEGEND' },
};

const LEVEL_ICONS = { easy:'🌱', medium:'⚡', hard:'🔥', boss:'💀', legend:'🗿' };

// ── HELPERS ──────────────────────────────────────────────────────────────────
function ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function buildLetters(len){
  const pool=[...ALL_LETTERS], out=[];
  for(let i=0; i<len; i++){
    const x=ri(0,pool.length-1);
    out.push(pool[x]);
    pool.splice(x,1);
  }
  return out;
}

function buildMath(level){
  const isLegend = level==='legend', isBoss = level==='boss', isHard = level==='hard';
  
  function singleOp(useDiv){
    const ops = useDiv ? ['+','-','*','/'] : ['+','-','*'];
    const op = ops[ri(0, ops.length-1)];
    let a, b, real;
    if(op==='+'){ a=ri(2,20); b=ri(2,20); real=a+b; }
    else if(op==='-'){ a=ri(10,30); b=ri(1,a); real=a-b; }
    else if(op==='*'){ a=ri(2,9); b=ri(2,9); real=a*b; }
    else { b=ri(2,9); real=ri(1,9); a=b*real; }
    return { expr: `${a} ${op} ${b}`, real };
  }

  const { expr, real } = singleOp(isHard || isBoss || isLegend);
  const correct = Math.random() > 0.4;
  return { expr, shown: correct ? real : real + (Math.random() > 0.5 ? ri(1,3) : -ri(1,3)), correct };
}

// ── UI COMPONENTS ─────────────────────────────────────────────────────────────
const Card = ({children, style={}}) => (
  <div style={{background:'#1a1a26', border:'1px solid #2a2a3e', borderRadius:20, padding:'26px 18px', minHeight:260, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, marginBottom:12, ...style}}>{children}</div>
);

const Lbl = ({children}) => (
  <span style={{fontSize:'.62rem', letterSpacing:3, textTransform:'uppercase', color:'#6b6b8a', fontFamily:'monospace', textAlign:'center'}}>{children}</span>
);

const TFBtn = ({label, c, h, onClick}) => (
  <button onClick={onClick} style={{flex:1, padding:'13px 0', borderRadius:12, border:`2px solid ${c}`, background:'transparent', color:c, fontSize:'.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit'}} onMouseEnter={e=>e.currentTarget.style.background=h} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{label}</button>
);

// ── SCREENS ───────────────────────────────────────────────────────────────────
function UsernameScreen({onEnter}) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const val = validateUsername(name);
    if (!val.valid) { setErr(val.msg); return; }
    onEnter(val.data);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:24}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3.2rem', fontWeight:900, background:'linear-gradient(135deg,#7c6af7,#f76a8a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>NEUROSPAN</div>
        <Lbl>Cognitive Memory Lab</Lbl>
      </div>
      <Card style={{width:'100%', maxWidth:380, minHeight:'auto'}}>
        <div style={{fontSize:'1.1rem', fontWeight:700, marginBottom:15}}>Enter Pilot Name</div>
        <input value={name} onChange={e=>{setName(e.target.value); setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()}
          placeholder="BrainMaster_01" style={{width:'100%', padding:'14px', borderRadius:12, border:`1px solid ${err?'#f76a8a':'#2a2a3e'}`, background:'#12121a', color:'#fff', outline:'none', marginBottom:10, boxSizing:'border-box'}} autoFocus/>
        {err && <div style={{color:'#f76a8a', fontSize:'.75rem', marginBottom:10}}>{err}</div>}
        <button onClick={submit} style={{width:'100%', padding:14, background:'#7c6af7', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer'}}>INITIATE →</button>
      </Card>
    </div>
  );
}

function MenuScreen({username, onStart}) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("scores").select("*").order("score", {ascending:false}).limit(10);
      setBoard(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div style={{textAlign:'center', marginBottom:20}}>
        <div style={{fontSize:'2.5rem', fontWeight:900, color:'#7c6af7'}}>NEUROSPAN</div>
        <div style={{color:'#6af7c8', fontSize:'.8rem'}}>Welcome, Agent <b>{username}</b></div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10}}>
        {['easy','medium','hard','boss'].map(k => (
          <button key={k} onClick={()=>onStart(k)} style={{background:'#1a1a26', border:`2px solid ${CFG[k].color}`, borderRadius:16, padding:15, cursor:'pointer', color:'#fff', textAlign:'left'}}>
            <div style={{fontSize:'1.2rem'}}>{LEVEL_ICONS[k]}</div>
            <div style={{fontWeight:800, color:CFG[k].color}}>{CFG[k].label}</div>
            <div style={{fontSize:'.65rem', color:'#6b6b8a'}}>{CFG[k].rounds} Rounds</div>
          </button>
        ))}
      </div>
      <button onClick={()=>onStart('legend')} style={{width:'100%', background:'linear-gradient(135deg,#1a0f00,#2a1500)', border:'2px solid #ff6b35', borderRadius:16, padding:20, cursor:'pointer', color:'#fff', marginBottom:20, display:'flex', alignItems:'center', gap:15}}>
        <div style={{fontSize:'1.8rem'}}>🗿</div>
        <div style={{textAlign:'left'}}>
          <div style={{fontWeight:800, color:'#ff6b35'}}>THE LEGEND</div>
          <div style={{fontSize:'.65rem', color:'#6b6b8a'}}>Maximum cognitive load test</div>
        </div>
      </button>
      <Card style={{minHeight:'auto', alignItems:'stretch'}}>
        <Lbl>GLOBAL LEADERBOARD</Lbl>
        {loading ? <div style={{textAlign:'center', padding:10}}>Loading...</div> : 
          board.map((row, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #2a2a3e'}}>
              <span style={{fontSize:'.85rem'}}>{i+1}. {row.username}</span>
              <span style={{fontWeight:800, color:'#7c6af7'}}>{row.score}</span>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

// ── MAIN APP EXPORT ───────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('username');
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState(null);

  const handleStart = (lvl) => { setLevel(lvl); setScreen('game'); };

  return (
    <div style={{background:'#0a0a0f', minHeight:'100vh', padding:'20px 16px', fontFamily:"'Segoe UI', sans-serif", color:'#e8e8f0'}}>
      <div style={{maxWidth:500, margin:'0 auto'}}>
        {screen === 'username' && <UsernameScreen onEnter={(n)=>{setUsername(n); setScreen('menu');}} />}
        {screen === 'menu' && <MenuScreen username={username} onStart={handleStart} />}
        {screen === 'game' && <div style={{textAlign:'center'}}>Game logic starting for {level}... (Connect Game Component Here)</div>}
      </div>
    </div>
  );
}
