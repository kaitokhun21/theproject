import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gkhivciloxgldiwbwmoo.supabase.co";
const SUPABASE_KEY = "sb_publishable_S3GvHVJn_EJq_0zGFqjGsA_c8YYAnaB";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchLeaderboardByLevel(level) {
  try {
    const { data, error } = await supabase
      .from("scores")
      .select("username, score, level, created_at")
      .eq("level", level)
      .order("score", { ascending: false })
      .limit(10);
    if (error) console.error("Select error:", JSON.stringify(error));
    return data || [];
  } catch (e) {
    console.error("Leaderboard fetch error:", e);
    return [];
  }
}

async function saveScore(username, score, level) {
  try {
    const { error } = await supabase
      .from("scores")
      .insert([{ username, score, level }]);
    if (error) console.error("Insert error:", JSON.stringify(error));
  } catch (e) {
    console.error("Score save error:", e);
  }
}

const ALL_LETTERS = ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V","W","Y","Z"];

const CFG = {
  easy:   { rounds: 4, minSeq: 3, maxSeq: 4,  mathMs: 8000, letterMs: 1800, pts: 10, color: "#6af7c8", label: "EASY",   icon: "🌱", tagline: "\"I Did It!\" — Warm up your brain." },
  medium: { rounds: 5, minSeq: 4, maxSeq: 5,  mathMs: 5000, letterMs: 1400, pts: 15, color: "#6aaff7", label: "MEDIUM", icon: "⚡", tagline: "\"Speeding Up.\" — Math gets serious." },
  hard:   { rounds: 6, minSeq: 5, maxSeq: 6,  mathMs: 3500, letterMs: 1200, pts: 20, color: "#f76a8a", label: "HARD",   icon: "🔥", tagline: "\"Stay Focused!\" — No room for mistakes." },
  boss:   { rounds: 6, minSeq: 7, maxSeq: 8,  mathMs: 3500, letterMs: 1200, pts: 30, color: "#f7c46a", label: "BOSS",   icon: "💀", tagline: "\"Pushing My Limits!\" — Touch the edge of your memory." },
  legend: { rounds: 8, minSeq: 9, maxSeq: 12, mathMs: 2000, letterMs: 900,  pts: 50, color: "#ff6b35", label: "LEGEND", icon: "🗿", tagline: "\"I Am A Machine!\" — Pure focused cognition." },
};

function ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function buildLetters(len) {
  const pool = [...ALL_LETTERS], out = [];
  for (let i = 0; i < len; i++) {
    const x = ri(0, pool.length - 1);
    out.push(pool[x]);
    pool.splice(x, 1);
  }
  return out;
}

function buildMath(level) {
  const isLegend = level === "legend", isBoss = level === "boss", isHard = level === "hard";
  function singleOp(useDiv) {
    const ops = useDiv ? ["+","-","*","/"] : ["+","-","*"];
    const op = ops[ri(0, ops.length - 1)];
    let a, b, real;
    if (op === "+") { a = ri(2,20); b = ri(2,20); real = a+b; }
    else if (op === "-") { a = ri(10,30); b = ri(1,a); real = a-b; }
    else if (op === "*") { a = ri(2,9); b = ri(2,9); real = a*b; }
    else { b = ri(2,9); real = ri(1,9); a = b*real; }
    return { expr: `${a} ${op} ${b}`, real };
  }
  function chainOp(allowFrac) {
    const op1 = ["+","-","*","/"][ri(0,3)];
    let a, b, real1;
    if (op1==="+"){a=ri(2,15);b=ri(2,15);real1=a+b;}
    else if(op1==="-"){a=ri(10,25);b=ri(1,a);real1=a-b;}
    else if(op1==="*"){a=ri(2,9);b=ri(2,9);real1=a*b;}
    else{b=ri(2,9);real1=ri(1,9);a=b*real1;}
    const op2=["+","-","*","/"][ri(0,3)];
    let c, real2;
    if(op2==="+"){c=ri(2,10);real2=real1+c;}
    else if(op2==="-"){c=ri(1,Math.max(1,real1-1));real2=real1-c;}
    else if(op2==="*"){c=ri(2,5);real2=real1*c;}
    else{const d=[2,3,4,5];c=d.find(x=>real1%x===0&&real1/x>=1)||2;real2=real1/c;}
    if (allowFrac && Math.random() > 0.6) {
      const d1=[2,3,4,5][ri(0,3)],n1=ri(1,d1-1),d2=[2,3,4,5][ri(0,3)],n2=ri(1,d2-1);
      const subop=Math.random()>0.5?"+":"-";
      const numR=subop==="+"?n1*d2+n2*d1:n1*d2-n2*d1, denR=d1*d2;
      function gcd(a,b){return b===0?a:gcd(b,a%b);}
      const g=gcd(Math.abs(numR),denR),sNum=numR/g,sDen=denR/g;
      const fStr=sDen===1?`${sNum}`:`${sNum}/${sDen}`;
      const wNum=sNum+(Math.random()>0.5?1:-1);
      const wStr=sDen===1?`${wNum}`:`${wNum}/${sDen}`;
      const correct=Math.random()>0.4;
      return{expr:`${n1}/${d1} ${subop} ${n2}/${d2}`,real:fStr,shown:correct?fStr:wStr,correct};
    }
    const correct=Math.random()>0.4;
    return{expr:`${a} ${op1} ${b} ${op2} ${c}`,real:real2,shown:correct?real2:real2+(Math.random()>0.5?ri(1,4):-ri(1,4)),correct};
  }
  let result;
  if (isLegend) result = chainOp(true);
  else if (isBoss) result = chainOp(false);
  else {
    const { expr, real } = singleOp(isHard);
    const correct = Math.random() > 0.4;
    result = { expr, real, shown: correct ? real : real + (Math.random()>0.5?ri(1,4):-ri(1,4)), correct };
  }
  return { expr: result.expr, shown: result.shown, correct: result.correct };
}

function buildRoundFrames(level, seq) {
  const frames = [];
  for (let i = 0; i < seq.length; i++) {
    frames.push({ type: "math", math: buildMath(level), letterIdx: i, total: seq.length });
    frames.push({ type: "letter", letter: seq[i], letterIdx: i, total: seq.length });
  }
  frames.push({ type: "recall", seq });
  return frames;
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#1a1a26", border: "1px solid #2a2a3e", borderRadius: 20, padding: "26px 18px", minHeight: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function Lbl({ children }) {
  return <span style={{ fontSize: ".62rem", letterSpacing: 3, textTransform: "uppercase", color: "#6b6b8a", fontFamily: "monospace", textAlign: "center" }}>{children}</span>;
}

function TFBtn({ label, c, h, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: `2px solid ${c}`, background: "transparent", color: c, fontSize: ".95rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
      onMouseEnter={e => e.currentTarget.style.background = h}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {label}
    </button>
  );
}

function UsernameScreen({ onEnter }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  function submit() {
    const t = name.trim();
    if (t.length < 2) { setErr("At least 2 characters required"); return; }
    if (t.length > 16) { setErr("Maximum 16 characters"); return; }
    if (!/^[a-zA-Z0-9_\-]+$/.test(t)) { setErr("Only letters, numbers, _ and - allowed"); return; }
    onEnter(t);
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3.2rem", fontWeight: 900, background: "linear-gradient(135deg,#7c6af7,#f76a8a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OSPAN</div>
        <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".7rem", letterSpacing: 3, textTransform: "uppercase", marginTop: 6 }}>Working Memory Test</div>
      </div>
      <div style={{ background: "#1a1a26", border: "1px solid #2a2a3e", borderRadius: 20, padding: "32px 24px", width: "100%", maxWidth: 380 }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6, textAlign: "center" }}>Enter Your Username</div>
        <div style={{ color: "#6b6b8a", fontSize: ".78rem", textAlign: "center", marginBottom: 20, fontFamily: "monospace" }}>This name will appear on the global leaderboard</div>
        <input value={name} onChange={e => { setName(e.target.value); setErr(""); }} onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="e.g. BrainMaster42" maxLength={16}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1px solid ${err ? "#f76a8a" : "#2a2a3e"}`, background: "#12121a", color: "#e8e8f0", fontSize: "1rem", fontFamily: "monospace", outline: "none", marginBottom: 8, boxSizing: "border-box" }}
          autoFocus />
        {err && <div style={{ color: "#f76a8a", fontSize: ".75rem", fontFamily: "monospace", marginBottom: 8 }}>{err}</div>}
        <button onClick={submit} style={{ width: "100%", padding: 14, background: "#7c6af7", color: "#fff", border: "none", borderRadius: 12, fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>START GAME</button>
      </div>
    </div>
  );
}

function LevelBoard({ levelKey, username }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const cfg = CFG[levelKey];
  const medals = ["🥇","🥈","🥉"];
  useEffect(() => {
    fetchLeaderboardByLevel(levelKey).then(d => { setBoard(d); setLoading(false); });
  }, [levelKey]);
  return (
    <div style={{ background: "#1a1a26", border: `1px solid ${cfg.color}33`, borderRadius: 16, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: "1.2rem" }}>{cfg.icon}</span>
        <span style={{ color: cfg.color, fontFamily: "monospace", fontSize: ".68rem", letterSpacing: 3, textTransform: "uppercase", fontWeight: 800 }}>{cfg.label} — TOP 10</span>
      </div>
      {loading && <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".8rem", textAlign: "center", padding: 10 }}>Loading...</div>}
      {!loading && board.length === 0 && <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".8rem", textAlign: "center", padding: 10 }}>No records yet — be the first!</div>}
      {!loading && board.map((row, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < board.length - 1 ? "1px solid #1e1e2e" : "none" }}>
          <div style={{ minWidth: 30, textAlign: "center", fontFamily: "monospace", fontSize: ".9rem", fontWeight: 700, color: i < 3 ? ["#f7c46a","#c0c0c0","#cd7f32"][i] : "#6b6b8a" }}>
            {i < 3 ? medals[i] : `#${i+1}`}
          </div>
          <div style={{ flex: 1, fontWeight: 700, fontSize: ".88rem", color: row.username === username ? "#7c6af7" : "#e8e8f0" }}>
            {row.username}{row.username === username ? " 👈" : ""}
          </div>
          <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: ".95rem", color: cfg.color }}>{row.score} <span style={{ fontSize: ".6rem", color: "#6b6b8a" }}>CP</span></div>
        </div>
      ))}
    </div>
  );
}

function MenuScreen({ username, onStart }) {
  const levels = ["easy","medium","hard","boss","legend"];
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: "2.8rem", fontWeight: 900, background: "linear-gradient(135deg,#7c6af7,#f76a8a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OSPAN</div>
        <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".7rem", letterSpacing: 3, textTransform: "uppercase", marginTop: 4 }}>Working Memory Test</div>
        <div style={{ marginTop: 10, color: "#6af7c8", fontFamily: "monospace", fontSize: ".78rem" }}>Welcome back, <b>{username}</b></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {["easy","medium","hard","boss"].map(k => {
          const l = CFG[k];
          return (
            <button key={k} onClick={() => onStart(k)}
              style={{ background: "#1a1a26", border: `2px solid ${l.color}`, borderRadius: 16, padding: "18px 14px", cursor: "pointer", textAlign: "left", color: "#e8e8f0", transition: "transform .2s", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{l.icon}</div>
              <div style={{ fontWeight: 800, fontSize: ".95rem", color: l.color, marginBottom: 4 }}>{l.label}</div>
              <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".64rem", lineHeight: 1.5 }}>{l.rounds} rounds · {l.minSeq}-{l.maxSeq} letters</div>
            </button>
          );
        })}
      </div>

      <button onClick={() => onStart("legend")}
        style={{ width: "100%", background: "linear-gradient(135deg,#1a0f00,#2a1500)", border: "2px solid #ff6b35", borderRadius: 16, padding: "18px 20px", cursor: "pointer", textAlign: "left", color: "#e8e8f0", marginBottom: 20, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 16, transition: "transform .2s" }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "none"}>
        <div style={{ fontSize: "2rem" }}>🗿👑</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#ff6b35", marginBottom: 4 }}>THE LEGEND</div>
          <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".66rem" }}>8 rounds · 9-12 letters · fractions included</div>
        </div>
      </button>

      <div style={{ background: "#1a1a26", border: "1px solid #2a2a3e", borderRadius: 16, padding: 18, marginBottom: 20 }}>
        <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".62rem", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>HOW TO PLAY</div>
        {[["1","See a math equation — is it TRUE or FALSE?"],["2","A LETTER appears — memorize it"],["3","Math + Letter steps repeat in sequence"],["4","At the end of each round, recall ALL letters in order!"]].map(([n,t]) => (
          <div key={n} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ background: "#7c6af7", color: "#fff", minWidth: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".65rem", fontWeight: 700, fontFamily: "monospace" }}>{n}</span>
            <span style={{ fontSize: ".83rem", lineHeight: 1.5 }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".62rem", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>🌍 GLOBAL LEADERBOARDS</div>
        {levels.map(lk => <LevelBoard key={lk} levelKey={lk} username={username} />)}
      </div>
    </div>
  );
}

function Game({ level, onDone }) {
  const cfg = CFG[level];
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [frame, setFrame] = useState(null);
  const [mathPct, setMathPct] = useState(100);
  const [recall, setRecall] = useState([]);
  const R = useRef({ round: 0, score: 0, streak: 0, tm: 0, tmc: 0, frames: [], frameIdx: 0, seq: [], answered: false, timerStart: 0 });
  const timerRef = useRef(null);
  const barRef = useRef(null);

  function stopAll() { clearTimeout(timerRef.current); clearInterval(barRef.current); }

  function nextFrame() {
    const r = R.current; r.frameIdx++;
    if (r.frameIdx >= r.frames.length) return;
    showFrame(r.frames[r.frameIdx]);
  }

  function showFrame(f) {
    const r = R.current;
    if (f.type === "math") {
      r.answered = false; r.timerStart = Date.now();
      setFrame(f); setMathPct(100);
      clearInterval(barRef.current);
      barRef.current = setInterval(() => {
        const pct = Math.max(0, 1 - (Date.now() - R.current.timerStart) / cfg.mathMs);
        setMathPct(pct * 100);
        if (pct <= 0) { clearInterval(barRef.current); if (!R.current.answered) { R.current.answered = true; R.current.tm++; showFeedback(false); } }
      }, 80);
    } else if (f.type === "letter") {
      stopAll(); setFrame(f);
      timerRef.current = setTimeout(() => nextFrame(), cfg.letterMs);
    } else if (f.type === "recall") {
      stopAll(); setRecall([]); setFrame(f);
    }
  }

  function handleMathAnswer(userAns) {
    const r = R.current; if (r.answered) return;
    r.answered = true; clearInterval(barRef.current);
    const f = r.frames[r.frameIdx];
    const ok = (userAns === f.math.correct);
    r.tm++; if (ok) r.tmc++;
    showFeedback(ok);
  }

  function showFeedback(ok) {
    setFrame({ type: "feedback", ok });
    timerRef.current = setTimeout(() => nextFrame(), 450);
  }

  function handleRecallSubmit(inp) {
    const r = R.current; const seq = r.seq;
    let correct = 0; seq.forEach((l, i) => { if (inp[i] === l) correct++; });
    const pct = correct / seq.length;
    const pts = Math.round(cfg.pts * pct * seq.length + (pct === 1 ? cfg.pts : 0));
    const ns = pct === 1 ? r.streak + 1 : 0; const bon = pct === 1 ? ns * 2 : 0;
    r.score += pts + bon; r.streak = ns;
    setScore(r.score); setStreak(r.streak);
    setFrame({ type: "roundResult", correct, total: seq.length, pts: pts + bon, inp: [...inp], seq: [...seq] });
    timerRef.current = setTimeout(() => startRound(), 2500);
  }

  function startRound() {
    const r = R.current; r.round++; setRound(r.round);
    if (r.round > cfg.rounds) { stopAll(); onDone({ score: r.score, tm: r.tm, tmc: r.tmc }); return; }
    const seq = buildLetters(ri(cfg.minSeq, cfg.maxSeq));
    r.seq = seq; r.frames = buildRoundFrames(level, seq); r.frameIdx = 0;
    showFrame(r.frames[0]);
  }

  useEffect(() => { startRound(); return () => stopAll(); }, []);

  if (!frame) return <div style={{ textAlign: "center", padding: 40, color: "#6b6b8a", fontFamily: "monospace" }}>Loading...</div>;
  const progress = Math.max(0, ((round - 1) / cfg.rounds) * 100);
  const seqLen = R.current.seq.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", background: "#1a1a26", border: "1px solid #2a2a3e", borderRadius: 14, padding: "12px 16px", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        {[["CP", score, "#7c6af7"],["ROUND", `${round}/${cfg.rounds}`, "#e8e8f0"],["STREAK", streak + "🔥", "#6af7c8"],["LEVEL", cfg.label, cfg.color]].map(([l, v, c]) => (
          <div key={l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: ".56rem", letterSpacing: 2, textTransform: "uppercase", color: "#6b6b8a", fontFamily: "monospace" }}>{l}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "monospace", color: c }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 4, background: "#2a2a3e", borderRadius: 99, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#7c6af7,#f76a8a)", borderRadius: 99, width: progress + "%", transition: "width .4s" }} />
      </div>
      <div style={{ textAlign: "center", fontSize: ".6rem", color: "#6b6b8a", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
        {frame.type === "math" ? `ROUND ${round} — MATH ${frame.letterIdx + 1}/${frame.total}` : frame.type === "letter" ? `ROUND ${round} — LETTER ${frame.letterIdx + 1}/${frame.total}` : (frame.type === "recall" || frame.type === "roundResult") ? `ROUND ${round} — RECALL` : `ROUND ${round}`}
      </div>

      {frame.type === "math" && frame.math && (
        <Card>
          <Lbl>MATH — TRUE OR FALSE?</Lbl>
          <div style={{ fontFamily: "monospace", fontSize: "2rem", fontWeight: 700, color: "#e8e8f0", textAlign: "center" }}>{frame.math.expr} = {frame.math.shown}</div>
          <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 320 }}>
            <TFBtn label="TRUE" c="#6af7c8" h="rgba(106,247,200,.12)" onClick={() => handleMathAnswer(true)} />
            <TFBtn label="FALSE" c="#f76a8a" h="rgba(247,106,138,.12)" onClick={() => handleMathAnswer(false)} />
          </div>
          <div style={{ width: "100%", maxWidth: 320, height: 4, background: "#2a2a3e", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,#6af7c8,#f76a8a)", borderRadius: 99, width: mathPct + "%", transition: "width .08s linear" }} />
          </div>
        </Card>
      )}

      {frame.type === "feedback" && (
        <div style={{ background: frame.ok ? "rgba(106,247,200,.08)" : "rgba(247,106,138,.08)", border: `1px solid ${frame.ok ? "#6af7c8" : "#f76a8a"}`, borderRadius: 20, minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <div style={{ fontSize: "7rem", color: frame.ok ? "#6af7c8" : "#f76a8a" }}>{frame.ok ? "✓" : "✗"}</div>
        </div>
      )}

      {frame.type === "letter" && (
        <Card>
          <Lbl>MEMORIZE THE LETTER — {frame.letterIdx + 1} / {frame.total}</Lbl>
          <div style={{ fontFamily: "monospace", fontSize: "6rem", fontWeight: 700, color: "#7c6af7", textShadow: "0 0 60px rgba(124,106,247,.7)", userSelect: "none" }}>{frame.letter}</div>
        </Card>
      )}

      {frame.type === "recall" && (
        <Card style={{ minHeight: "auto" }}>
          <Lbl>RECALL ALL LETTERS IN ORDER — {seqLen} LETTERS</Lbl>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {Array.from({ length: seqLen }).map((_, i) => (
              <div key={i} style={{ width: 46, height: 50, border: `2px solid ${recall[i] ? "#7c6af7" : "#2a2a3e"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "1.2rem", fontWeight: 700, color: "#7c6af7", background: recall[i] ? "rgba(124,106,247,.1)" : "#12121a" }}>
                {recall[i] || ""}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, width: "100%", maxWidth: 370 }}>
            {ALL_LETTERS.map(l => {
              const used = recall.includes(l);
              return (
                <button key={l} onClick={() => { if (!used && recall.length < seqLen) setRecall(p => [...p, l]); }} disabled={used || recall.length >= seqLen}
                  style={{ padding: "10px 0", borderRadius: 8, border: "1px solid #2a2a3e", background: "#12121a", color: used ? "#3a3a5a" : "#e8e8f0", fontFamily: "monospace", fontSize: ".82rem", fontWeight: 700, cursor: used ? "default" : "pointer", opacity: used ? 0.3 : 1 }}>
                  {l}
                </button>
              );
            })}
            <button onClick={() => setRecall(p => p.slice(0, -1))} style={{ gridColumn: "span 2", padding: "10px 0", borderRadius: 8, border: "1px solid rgba(247,106,138,.3)", background: "rgba(247,106,138,.08)", color: "#f76a8a", fontFamily: "monospace", fontSize: ".82rem", fontWeight: 700, cursor: "pointer" }}>DEL</button>
            <button disabled={recall.length !== seqLen} onClick={() => { if (recall.length === seqLen) handleRecallSubmit(recall); }}
              style={{ gridColumn: "span 4", padding: "10px 0", borderRadius: 8, border: "none", background: recall.length === seqLen ? "#7c6af7" : "#2a2a3e", color: "#fff", fontFamily: "monospace", fontSize: ".82rem", fontWeight: 700, cursor: recall.length === seqLen ? "pointer" : "default", transition: "background .2s" }}>
              SUBMIT
            </button>
          </div>
        </Card>
      )}

      {frame.type === "roundResult" && frame.seq && (
        <Card>
          <Lbl>RESULT — {frame.correct}/{frame.total} CORRECT · +{frame.pts} CP</Lbl>
          <div style={{ width: "100%" }}>
            {["YOUR ANSWER","CORRECT"].map((lbl, pass) => (
              <div key={lbl}>
                <div style={{ fontSize: ".6rem", color: "#6b6b8a", fontFamily: "monospace", letterSpacing: 2, marginBottom: 6, textAlign: "center", marginTop: pass ? 10 : 0 }}>{lbl}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {frame.seq.map((l, i) => {
                    const ok = pass === 0 ? (frame.inp[i] === l) : true;
                    const val = pass === 0 ? (frame.inp[i] || "?") : l;
                    return (
                      <div key={i} style={{ width: 46, height: 50, border: `2px solid ${ok ? "#6af7c8" : "#f76a8a"}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "1.2rem", fontWeight: 700, color: ok ? "#6af7c8" : "#f76a8a", background: ok ? "rgba(106,247,200,.1)" : "rgba(247,106,138,.1)" }}>
                        {val}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".7rem" }}>Next round starting...</div>
        </Card>
      )}
    </div>
  );
}

function ResultScreen({ level, data, username, onMenu, onRetry }) {
  const cfg = CFG[level];
  const { score, tm, tmc } = data;
  const mathPct = tm > 0 ? Math.round(tmc / tm * 100) : 0;
  const maxP = cfg.rounds * cfg.pts * cfg.maxSeq * 2;
  const pct = Math.min(100, Math.round(score / maxP * 100));
  const [fill, setFill] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTimeout(() => setFill(pct), 150);
    saveScore(username, score, level).then(() => setSaved(true));
  }, []);

  let icon, title, assess;
  if (pct >= 85) { icon = "🧠✨"; title = "Extraordinary!"; assess = "Your working memory is exceptionally strong. Your attention control and executive function capacity are at the highest level."; }
  else if (pct >= 65) { icon = "🔥"; title = "Strong Performance"; assess = "Your working memory is quite good. You are strong at managing divided attention."; }
  else if (pct >= 40) { icon = "⚡"; title = "Developing"; assess = "Holding memory under dual-task conditions is exactly what OSPAN measures. Practice makes a real difference."; }
  else { icon = "🌱"; title = "Starting Point"; assess = "This test is tough — working memory can genuinely improve with practice."; }

  return (
    <div>
      <div style={{ background: "#1a1a26", border: "1px solid #2a2a3e", borderRadius: 20, padding: "32px 20px", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 10 }}>{icon}</div>
        <div style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: 6 }}>{title}</div>
        <div style={{ color: "#6b6b8a", fontFamily: "monospace", fontSize: ".75rem", marginBottom: 20 }}>{username} · {cfg.label}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          {[["COGNITIVE POWER", score, "#7c6af7"],["MATH ACC.", mathPct + "%", "#6aaff7"],["PERFORMANCE", pct + "%", "#6af7c8"]].map(([l, v, c]) => (
            <div key={l} style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 12, padding: "14px 8px" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "monospace", color: c, marginBottom: 4 }}>{v}</div>
              <div style={{ fontSize: ".52rem", color: "#6b6b8a", textTransform: "uppercase", letterSpacing: 1, fontFamily: "monospace" }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#12121a", borderRadius: 12, height: 10, overflow: "hidden", marginBottom: 6, border: "1px solid #2a2a3e" }}>
          <div style={{ height: "100%", borderRadius: 12, background: "linear-gradient(90deg,#7c6af7,#6af7c8)", width: fill + "%", transition: "width 1s ease" }} />
        </div>
        <div style={{ fontSize: ".7rem", color: "#6b6b8a", fontFamily: "monospace", textAlign: "right", marginBottom: 12 }}>{pct}/100 performance</div>
        {saved && <div style={{ fontSize: ".72rem", color: "#6af7c8", fontFamily: "monospace", marginBottom: 16 }}>Score saved to global leaderboard</div>}
        <div style={{ background: "#12121a", border: "1px solid #2a2a3e", borderRadius: 12, padding: "14px 16px", textAlign: "left" }}>
          <div style={{ fontSize: ".58rem", letterSpacing: 2, textTransform: "uppercase", color: "#6b6b8a", fontFamily: "monospace", marginBottom: 8 }}>MEMORY ASSESSMENT</div>
          <p style={{ fontSize: ".85rem", lineHeight: 1.6, color: "#e8e8f0", margin: 0 }}>{assess}</p>
        </div>
      </div>
      <button onClick={onMenu} style={{ width: "100%", padding: 15, background: "#7c6af7", color: "#fff", border: "none", borderRadius: 14, fontSize: ".95rem", fontWeight: 700, cursor: "pointer", marginBottom: 10, fontFamily: "inherit" }}>Main Menu & Leaderboard</button>
      <button onClick={onRetry} style={{ width: "100%", padding: 13, background: "transparent", color: "#6b6b8a", border: "1px solid #2a2a3e", borderRadius: 14, fontSize: ".88rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Play Same Level Again</button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("username");
  const [username, setUsername] = useState("");
  const [level, setLevel] = useState(null);
  const [result, setResult] = useState(null);
  const [gameKey, setGameKey] = useState(0);

  function handleUsername(name) { setUsername(name); setScreen("menu"); }
  function startGame(lvl) { setLevel(lvl); setScreen("game"); setGameKey(k => k + 1); }

  return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", padding: "20px 16px 48px", fontFamily: "'Segoe UI',sans-serif", color: "#e8e8f0", backgroundImage: "radial-gradient(ellipse 60% 40% at 20% 20%,rgba(124,106,247,.08) 0%,transparent 60%)" }}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        {screen === "username" && <UsernameScreen onEnter={handleUsername} />}
        {screen === "menu" && <MenuScreen username={username} onStart={startGame} />}
        {screen === "game" && <Game key={gameKey} level={level} onDone={r => { setResult(r); setScreen("result"); }} />}
        {screen === "result" && result && <ResultScreen level={level} data={result} username={username} onMenu={() => setScreen("menu")} onRetry={() => startGame(level)} />}
      </div>
    </div>
  );
}
