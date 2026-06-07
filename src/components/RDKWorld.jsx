import { useState, useEffect, useRef, useCallback } from "react";

const PIXEL = `'Press Start 2P', monospace`;
const VT    = `'VT323', monospace`;
const MONO  = `'ui-monospace','Courier New',monospace`;

const C = {
  bg:"#0c0a12", bg2:"#14111e", panel:"#1e1830", panel2:"#261f3a",
  border:"#3a3055", text:"#f0ebff", dim:"#8878a8",
  yellow:"#e8c84a", cyan:"#48c0f8", green:"#39FF6A",
  pink:"#f048c0", red:"#f06060", gold:"#d4a820", purple:"#a855f7",
};

const Sound = (() => {
  let ctx = null;
  const get = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
  const beep = (freq=440, dur=0.08, vol=0.05, type="square", delay=0) => {
    try {
      const c=get(), o=c.createOscillator(), g=c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type=type; o.frequency.value=freq;
      g.gain.setValueAtTime(vol, c.currentTime+delay);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+delay+dur);
      o.start(c.currentTime+delay); o.stop(c.currentTime+delay+dur+0.01);
    } catch(e) {}
  };
  return {
    click:    () => beep(440,0.06,0.05,"square"),
    type:     () => beep(80+Math.random()*40,0.06,0.01,"sine"),
    advance:  () => { beep(660,0.07,0.05,"square"); beep(880,0.07,0.05,"square",0.08); },
    complete: () => { [523,659,784,1047].forEach((f,i)=>beep(f,0.15,0.07,"triangle",i*0.12)); },
    unlock:   () => { [392,494,587,784,988].forEach((f,i)=>beep(f,0.18,0.08,"triangle",i*0.1)); },
    success:  () => { beep(660,0.1,0.06,"sine"); beep(880,0.12,0.06,"sine",0.1); },
    error:    () => { beep(220,0.1,0.05,"sawtooth"); beep(180,0.15,0.05,"sawtooth",0.08); },
    scan:     () => { for(let i=0;i<6;i++) beep(200+i*80,0.12,0.03,"sine",i*0.18); },
  };
})();

const RDK_ASCII = `
    ██████╗ ██████╗ ██╗  ██╗
    ██╔══██╗██╔══██╗██║ ██╔╝
    ██████╔╝██║  ██║█████╔╝
    ██╔══██╗██║  ██║██╔═██╗
    ██║  ██║██████╔╝██║  ██╗
    ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝

   Retrieval Development Kit
   Decentralized Knowledge Network`;

function useTypewriter(text, speed=24, active=true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef({ i:0, timer:null });

  useEffect(() => {
    if (!active) { setDisplayed(text); setDone(true); return; }
    setDisplayed(""); setDone(false); ref.current.i=0;
    clearInterval(ref.current.timer);
    ref.current.timer = setInterval(() => {
      const r=ref.current;
      if (r.i < text.length) {
        setDisplayed(text.slice(0, r.i+1));
        if (r.i%2===0 && text[r.i]!==" ") Sound.type();
        r.i++;
      } else { clearInterval(r.timer); setDone(true); }
    }, speed);
    return () => clearInterval(ref.current.timer);
  }, [text, active]);

  const skip = useCallback(() => { clearInterval(ref.current.timer); setDisplayed(text); setDone(true); }, [text]);
  return { displayed, done, skip };
}

const CLASSES = {
  operator: {
    id:"operator", name:"NODE OPERATOR", color:C.yellow,
    tagline:"You run infrastructure. You think in systems.",
    desc:"You've managed systems before. RDK is another node in your stack — except this one pays you every time another agent queries it.",
    stats:{Infrastructure:9,Systems:8,Reliability:9},
    intro: "You're here to run infrastructure, not read about it. By the end of this session, you'll have an RDK node running, a private vault indexed with your domain knowledge, Claude Desktop connected to your vault, and a live demo of the network paying tips to your node. Your machine earns while you work on other things.",
  },
  enterprise: {
    id:"enterprise", name:"ENTERPRISE", color:C.cyan,
    tagline:"You're burning money on tokens. You need to stop.",
    desc:"Every LLM call against your knowledge base is a cost you don't have to pay. Index it once. Query it forever. The savings compound daily.",
    stats:{Scale:9,CostControl:8,Velocity:9},
    intro: "You're paying for LLM calls that could be answered from your own indexed knowledge. By the end of this session, you'll know exactly how much you're wasting, have your first private vault indexed, and see a live demo of Claude Desktop pulling from your vault instead of burning tokens. The savings start on the first query.",
  },
  builder: {
    id:"builder", name:"BUILDER", color:C.green,
    tagline:"You ship products. You want to build on the network.",
    desc:"The network is a knowledge layer your products can query. Index your domain. Earn on retrievals. Build tools that tap the collective intelligence.",
    stats:{Technical:9,Creativity:8,Precision:9},
    intro: "You're here to build on the network, not just use it. By the end of this session, you'll have an RDK node running, private and public indexing configured, Claude Desktop wired to your vault, and a clear picture of what the network earns per retrieval. Then you build on top of it.",
  },
};

function Btn({ children, onClick, color=C.green, disabled, sm, outline, full }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={() => { if(!disabled){ Sound.click(); onClick?.(); } }}
      disabled={disabled}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{
        fontFamily:PIXEL, fontSize:sm?9:11, letterSpacing:1,
        background: outline?"transparent": h&&!disabled?color:C.panel2,
        color: outline?(h?color:C.dim): h&&!disabled?C.bg:color,
        padding:sm?"8px 14px":"13px 22px",
        width:full?"100%":"auto",
        cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.35:1,
        border:`3px solid ${disabled?C.border:color}`,
        boxShadow:disabled?"none":`4px 4px 0 rgba(0,0,0,0.5)`,
        transition:"background 60ms steps(2),color 60ms steps(2)",
        textTransform:"uppercase",
      }}>{children}</button>
  );
}

function InputField({ label, value, onChange, placeholder, mono, hint, validate, type="text" }) {
  const valid = validate ? validate(value) : null;
  const borderColor = value ? (valid === false ? C.red : valid === true ? C.green : C.border) : C.border;
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:PIXEL, fontSize:9, color:C.dim, marginBottom:8, letterSpacing:1 }}>{label}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", fontFamily:mono?MONO:VT, fontSize:mono?14:20,
          padding:"10px 14px", background:"#000", color:C.text,
          border:`2px solid ${borderColor}`, outline:"none",
          transition:"border-color 0.2s" }} />
      {hint && <div style={{ fontFamily:VT, fontSize:15, color:C.dim, marginTop:6 }}>{hint}</div>}
      {value && valid===true && <div style={{ fontFamily:VT, fontSize:15, color:C.green, marginTop:4 }}>✓ Looks good</div>}
      {value && valid===false && <div style={{ fontFamily:VT, fontSize:15, color:C.red, marginTop:4 }}>✗ Check this field</div>}
    </div>
  );
}

function CopyBlock({ label, code, color=C.green, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background:"#000", border:`2px solid ${color}`, marginTop:10, width:"100%", maxWidth:760 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"8px 14px", borderBottom:`1px solid ${color}33`,
        background:`${color}0a` }}>
        <span style={{ fontFamily:PIXEL, fontSize:8, color, letterSpacing:1 }}>{lang||label}</span>
        <button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); Sound.success(); setTimeout(()=>setCopied(false),1800); }}
          style={{ fontFamily:PIXEL, fontSize:8, background:copied?color:"transparent",
            color:copied?C.bg:color, border:`2px solid ${color}`,
            padding:"4px 8px", cursor:"pointer" }}>
          {copied?"COPIED ✓":"COPY"}
        </button>
      </div>
      <pre style={{ margin:0, padding:"12px 14px", fontFamily:MONO, fontSize:13,
        color, lineHeight:1.7, overflowX:"auto", whiteSpace:"pre" }}>{code}</pre>
    </div>
  );
}

function StepIndicator({ steps, current, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:20, maxWidth:760, width:"100%" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", flex: i < steps.length-1 ? 1 : "none" }}>
          <div style={{
            width:28, height:28, flexShrink:0,
            background: i<current?color: i===current?`${color}33`:"transparent",
            border:`2px solid ${i<=current?color:C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:PIXEL, fontSize:8,
            color: i<current?C.bg: i===current?color:C.dim,
            transition:"all 0.3s",
          }}>
            {i<current?"✓":i+1}
          </div>
          {i < steps.length-1 && (
            <div style={{ flex:1, height:2, background: i<current?color:C.border, transition:"background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Terminal({ lines, color=C.green, speed=240 }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown>=lines.length) return;
    const t = setTimeout(() => { Sound.scan(); setShown(s=>s+1); }, speed);
    return () => clearTimeout(t);
  }, [shown, lines.length, speed]);
  const getColor = l => l.startsWith("✓")?C.green:l.startsWith("✗")?C.red:l.startsWith("→")?C.cyan:l.startsWith("!")?C.yellow:l.startsWith("#")?C.dim:color;
  return (
    <div style={{ background:"#000", border:`2px solid ${C.border}`, padding:16,
      fontFamily:MONO, fontSize:13, lineHeight:1.8, marginTop:10,
      maxWidth:760, width:"100%", minHeight:80 }}>
      {lines.slice(0,shown).map((l,i)=>(
        <div key={i} style={{ color:getColor(l), opacity:i<shown-1?0.8:1 }}>{l}</div>
      ))}
      {shown<lines.length && <span style={{ color:C.green, animation:"blink 0.6s steps(2) infinite" }}>▌</span>}
    </div>
  );
}

function NPCDialogue({ npc, avatar, color, text, onContinue, onBack, continueLabel="Continue ▶", isLast, extra, noAuto }) {
  const { displayed, done, skip } = useTypewriter(text, 22);
  const [blink, setBlink] = useState(true);
  useEffect(() => { if(!done)return; const t=setInterval(()=>setBlink(b=>!b),500); return()=>clearInterval(t); }, [done]);
  const handle = useCallback(() => { if(!done){skip();return;} Sound.advance(); onContinue?.(); }, [done,skip,onContinue]);
  useEffect(() => {
    const down = e => {
      if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName||"")) return;
      if(e.key===" "||e.key==="Enter") { e.preventDefault(); handle(); }
    };
    window.addEventListener("keydown",down); return()=>window.removeEventListener("keydown",down);
  }, [handle]);

  return (
    <div style={{ width:"100%", maxWidth:780 }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:-2 }}>
        <div style={{ width:64, height:64, flexShrink:0, background:`${color}22`,
          border:`3px solid ${color}`, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:30,
          boxShadow:`0 0 20px ${color}44`, animation:"portraitPulse 2.5s ease infinite" }}>
          {avatar}
        </div>
        <div style={{ fontFamily:PIXEL, fontSize:9, color, background:C.bg2,
          border:`2px solid ${color}`, padding:"4px 10px", marginBottom:4 }}>{npc}</div>
      </div>
      <div onClick={handle} style={{ background:C.panel, border:`3px solid ${color}`,
        boxShadow:`0 0 20px ${color}18`, padding:"20px 22px",
        cursor:"pointer", userSelect:"none", minHeight:90 }}>
        <div style={{ fontFamily:VT, fontSize:23, color:C.text, lineHeight:1.55, position:"relative" }}>
          {displayed}
          {!done && <span style={{ color }}>█</span>}
          {done && (
            <span style={{
              position:"absolute",
              color,
              opacity: blink ? 1 : 0,
              marginLeft:3,
              pointerEvents:"none",
            }}>▮</span>
          )}
        </div>
        <div style={{ fontFamily:PIXEL, fontSize:8, color:C.dim, marginTop:8 }}>
          {!done?"[ click or SPACE to skip ]":`[ SPACE / click to ${continueLabel} ]`}
        </div>
      </div>
      {done && extra && <div style={{ animation:"fadeUp 0.4s ease forwards", opacity:0 }}>{extra}</div>}
      {done && !noAuto && (
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:12,
          animation:"fadeUp 0.3s ease forwards", opacity:0 }}>
          <div>{onBack && <Btn sm outline color={C.dim} onClick={onBack}>◀ Back</Btn>}</div>
          <Btn sm color={color} onClick={handle}>{isLast?"Complete Module ★":continueLabel}</Btn>
        </div>
      )}
    </div>
  );
}

function Shell({ title, color, step, total, badge, onLeave, children }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.bg2, borderBottom:`3px solid ${C.border}`,
        padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
        <button onClick={()=>{Sound.click();onLeave();}} style={{ fontFamily:PIXEL, fontSize:9,
          background:"transparent", color:C.dim, border:`2px solid ${C.border}`,
          padding:"5px 9px", cursor:"pointer" }}>← HUB</button>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {badge && <span style={{ fontSize:20 }}>{badge}</span>}
          <div style={{ fontFamily:PIXEL, fontSize:11, color, letterSpacing:2 }}>{title}</div>
        </div>
        <div style={{ fontFamily:PIXEL, fontSize:9, color:C.dim }}>{step}/{total}</div>
      </div>
      <div style={{ height:4, background:C.panel }}>
        <div style={{ width:`${(step/total)*100}%`, height:"100%", background:color,
          transition:"width 400ms ease", boxShadow:`0 0 8px ${color}` }} />
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        padding:"28px 20px 40px", gap:0 }}>
        {children}
      </div>
    </div>
  );
}

function IntroScene({ classKey, onDone }) {
  const cls = CLASSES[classKey];
  const [step, setStep] = useState(0);

  const deliverables = [
    { icon:"⚡", label:"RDK Node installed & configured", cmd:"npm install -g rdk && rdk init" },
    { icon:"🔒", label:"Private vault indexed with your knowledge", cmd:"rdk index ./my-docs/ --private" },
    { icon:"🌐", label:"Public contributions on the network", cmd:"rdk index ./my-guide.md" },
    { icon:"🔌", label:"Claude Desktop connected to vault", cmd:"rdk mcp:serve --stdio" },
    { icon:"💰", label:"Earning tips on network retrievals", cmd:"rdk earnings --status" },
    { icon:"📊", label:"Token savings tracked + visualized", cmd:"rdk stats --savings" },
  ];

  const STEPS = [
    {
      npc:"THE SYSTEM", avatar:"⚡", color:C.cyan,
      text:`Welcome, ${cls.name}. Before we begin — I want to be direct about what this is. This isn't a presentation. This is a build session.`,
    },
    {
      npc:"THE SYSTEM", avatar:"⚡", color:C.cyan,
      text:cls.intro,
    },
    {
      npc:"THE SYSTEM", avatar:"⚡", color:C.cyan,
      text:"Here is exactly what you will ship by the time you reach the Portal. Every item below is a real, working piece of infrastructure — not a concept.",
      extra:(
        <div style={{ marginTop:14, maxWidth:760, width:"100%" }}>
          {deliverables.map((d,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14,
              padding:"12px 16px", marginBottom:6,
              background:C.panel, border:`2px solid ${C.border}`,
              animation:`fadeUp 0.3s ease ${i*0.08}s forwards`, opacity:0 }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{d.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:VT, fontSize:20, color:C.text }}>{d.label}</div>
                <code style={{ fontFamily:MONO, fontSize:12, color:C.dim }}>{d.cmd}</code>
              </div>
              <div style={{ fontFamily:PIXEL, fontSize:8, color:C.border }}>PENDING</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      npc:"THE SYSTEM", avatar:"⚡", color:C.cyan,
      text:"Five modules. Each one hands you a working piece. Town Hall first — that's where you understand the token cost problem and set your baseline. Every number we project is based on your real spend. Let's go.",
      isLast:true,
    },
  ];

  const cur = STEPS[step];
  const next = () => { if(step<STEPS.length-1) setStep(s=>s+1); else { Sound.complete(); onDone(); } };
  const back = () => step>0 && setStep(s=>s-1);

  return (
    <div style={{ minHeight:"100vh", background:C.bg,
      backgroundImage:`radial-gradient(ellipse at 50% 30%, #1a0f3a 0%, ${C.bg} 60%)`,
      display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.bg2, borderBottom:`3px solid ${C.border}`, padding:"10px 20px",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:PIXEL, fontSize:11, color:C.cyan, letterSpacing:2 }}>INTRO</div>
        <div style={{ fontFamily:PIXEL, fontSize:9, color:C.dim }}>{step+1}/{STEPS.length}</div>
      </div>
      <div style={{ height:4, background:C.panel }}>
        <div style={{ width:`${((step+1)/STEPS.length)*100}%`, height:"100%", background:C.cyan }} />
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"28px 20px" }}>
        <NPCDialogue key={step} npc={cur.npc} avatar={cur.avatar} color={C.cyan}
          text={cur.text} extra={cur.extra||null}
          onContinue={next} onBack={step>0?back:null}
          isLast={cur.isLast} />
      </div>
    </div>
  );
}



// ── Animated counter ──────────────────────────────────────
function Counter({ to, suffix="", duration=1800, color=C.green, size=32 }) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);
  return (
    <span style={{ fontFamily:PIXEL, fontSize:size, color,
      textShadow:`0 0 16px ${color}88`, display:"inline-block" }}>
      {val.toLocaleString()}{suffix}
    </span>
  );
}

function StatCard({ label, to, suffix="", color, sub }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) setVisible(true); }, { threshold:0.3 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ background:C.panel, border:`2px solid ${color}`, padding:14,
      animation: visible ? "fadeUp 0.4s ease forwards" : "none", opacity:0 }}>
      <div style={{ fontFamily:PIXEL, fontSize:9, color, marginBottom:8, letterSpacing:1 }}>{label}</div>
      {visible
        ? <Counter to={to} suffix={suffix} color={color} size={28} duration={1600} />
        : <span style={{ fontFamily:PIXEL, fontSize:28, color }}>0</span>}
      {sub && <div style={{ fontFamily:VT, fontSize:15, color:C.dim, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function PhaseTag({ isLesson, isBuild, color, learnCount, buildCount }) {
  return (
    <div style={{ display:"flex", gap:8, marginBottom:16, maxWidth:780, width:"100%" }}>
      <div style={{ fontFamily:PIXEL, fontSize:8, padding:"4px 10px",
        background:isLesson?color:C.panel, color:isLesson?C.bg:C.dim,
        border:`2px solid ${color}` }}>LEARN ({learnCount})</div>
      <div style={{ fontFamily:PIXEL, fontSize:8, padding:"4px 10px",
        background:isBuild?color:C.panel, color:isBuild?C.bg:C.dim,
        border:`2px solid ${isBuild?color:C.border}` }}>BUILD ({buildCount})</div>
    </div>
  );
}

function Confetti({active}) {
  if (!active) return null;
  const pieces = Array.from({length:60}, (_,i) => ({
    id:i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2 + Math.random() * 2,
    rotate: Math.random() * 720,
    color: [C.green, C.yellow, C.pink, C.cyan, C.gold, C.purple][i%6],
    shape: i % 3,
    drift: -30 + Math.random() * 60,
  }));
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:10000 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left: `${p.left}%`,
          top: -20,
          width: p.shape === 0 ? 8 : 10,
          height: p.shape === 1 ? 14 : p.shape === 2 ? 8 : 10,
          background: p.color,
          borderRadius: p.shape === 2 ? "50%" : 0,
          opacity: 0.9,
          boxShadow: `0 0 8px ${p.color}`,
          animation: `confettiFall ${p.duration}s cubic-bezier(0.3,0.7,0.5,1) ${p.delay}s forwards`,
          transform: `translateX(${p.drift}px) rotate(${p.rotate}deg)`,
        }}/>
      ))}
    </div>
  );
}

function InstallCeremony({os, setOs, phase, setPhase, onComplete, userState}) {
  const INSTALL_CMDS = {
    mac:     `curl -fsSL https://rdk.network/install.sh | sh`,
    linux:   `curl -fsSL https://rdk.network/install.sh | sh`,
    windows: `iwr -useb https://rdk.network/install.ps1 | iex`,
  };

  const installLines = {
    mac: [
      `$ ${INSTALL_CMDS.mac}`,
      ``,
      `→ Downloading RDK CLI for darwin-arm64...`,
      `  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 24.8 MB / 24.8 MB`,
      `→ Verifying signature (sha256)...`,
      `  ✓ Signature valid`,
      `→ Installing to /usr/local/bin/rdk...`,
      `  ✓ Installed`,
      `→ Setting up shell completions...`,
      `  ✓ zsh completions installed`,
      `  ✓ bash completions installed`,
      ``,
      `✓ RDK installed successfully.`,
      `  Run 'rdk --version' to verify.`,
    ],
    linux: [
      `$ ${INSTALL_CMDS.linux}`,
      ``,
      `→ Downloading RDK CLI for linux-x86_64...`,
      `  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 23.4 MB / 23.4 MB`,
      `→ Verifying signature (sha256)...`,
      `  ✓ Signature valid`,
      `→ Installing to /usr/local/bin/rdk...`,
      `  ✓ Installed`,
      `→ Setting up shell completions...`,
      `  ✓ bash completions installed`,
      ``,
      `✓ RDK installed successfully.`,
      `  Run 'rdk --version' to verify.`,
    ],
    windows: [
      `PS> ${INSTALL_CMDS.windows}`,
      ``,
      `→ Downloading RDK CLI for windows-x86_64...`,
      `  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 25.1 MB / 25.1 MB`,
      `→ Verifying signature (sha256)...`,
      `  ✓ Signature valid`,
      `→ Installing to %USERPROFILE%\\.rdk\\bin\\rdk.exe...`,
      `  ✓ Installed`,
      `→ Adding to PATH...`,
      `  ✓ PATH updated (restart terminal to take effect)`,
      ``,
      `✓ RDK installed successfully.`,
      `  Run 'rdk --version' to verify.`,
    ],
  };

  const versionLines = [
    `$ rdk --version`,
    ``,
    ...RDK_ASCII.split("\n"),
    ``,
    `  CLI version:    1.0.0`,
    `  Embedding:      all-MiniLM-L6-v2 (local)`,
    `  Network:        api.rdk.network`,
    `  Status:         ready`,
    ``,
  ];

  const nodeId = useRef(`rdk-node-${Math.random().toString(36).slice(2,10)}`).current;
  const initLines = [
    `$ rdk init`,
    ``,
    `Welcome to RDK. Let's set up your node.`,
    ``,
    `? Your email:                    ${userState.companyName||"you"}@example.com`,
    `? Display name for your node:    ${userState.companyName||"my-node"}`,
    `? Contribution domain:           ${userState.useCase||"general"}`,
    `? Vault tool:                    obsidian`,
    `? Vault path:                    ~/Documents/vault`,
    `? EVM wallet for tips (optional): skip for now`,
    ``,
    `→ Creating account on RDK Central...`,
    `  ✓ Node ID: ${nodeId}`,
    `  ✓ API key: rdk_live_•••••••••••••••••••••• (saved to ~/.rdk/config.json)`,
    ``,
    `→ Installing embedding model (all-MiniLM-L6-v2, 80MB)...`,
    `  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 80 MB / 80 MB`,
    `  ✓ Model ready`,
    ``,
    `→ Starting MCP server on port 3000...`,
    `  ✓ Listening on http://localhost:3000/mcp`,
    ``,
    `→ Connecting to RDK network...`,
    `  ✓ Connected — 1,204 peer nodes online`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  ✦  YOUR NODE IS LIVE  ✦`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  return (
    <div style={{maxWidth:760, width:"100%", marginTop:14}}>

      {phase === 0 && (
        <div style={{animation:"fadeUp 0.3s ease forwards", opacity:0}}>
          <div style={{fontFamily:PIXEL, fontSize:9, color:C.dim, marginBottom:10, letterSpacing:1}}>
            STEP 1 — CHOOSE YOUR OS
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14}}>
            {[
              {id:"mac",     label:"macOS",   icon:"🍎"},
              {id:"linux",   label:"Linux",   icon:"🐧"},
              {id:"windows", label:"Windows", icon:"⊞"},
            ].map(o => (
              <div key={o.id} onClick={() => { setOs(o.id); Sound.click(); }}
                style={{
                  background: os===o.id ? `${C.yellow}18` : C.panel,
                  border: `3px solid ${os===o.id ? C.yellow : C.border}`,
                  padding:"14px 10px", textAlign:"center",
                  cursor:"pointer", transition:"all 0.15s",
                  boxShadow: os===o.id ? `0 0 16px ${C.yellow}44` : "none",
                }}>
                <div style={{fontSize:28, marginBottom:6}}>{o.icon}</div>
                <div style={{fontFamily:PIXEL, fontSize:10, color: os===o.id ? C.yellow : C.text}}>{o.label}</div>
              </div>
            ))}
          </div>
          <div style={{fontFamily:PIXEL, fontSize:9, color:C.dim, marginBottom:8, letterSpacing:1}}>
            STEP 2 — RUN THIS COMMAND
          </div>
          <CopyBlock lang={os.toUpperCase()} color={C.yellow} code={INSTALL_CMDS[os]}/>
          <div style={{display:"flex", justifyContent:"flex-end", marginTop:12}}>
            <Btn color={C.yellow} onClick={() => { setPhase(1); Sound.scan(); }}>I've Run It →</Btn>
          </div>
        </div>
      )}

      {phase === 1 && (
        <div style={{animation:"fadeUp 0.3s ease forwards", opacity:0}}>
          <div style={{fontFamily:PIXEL, fontSize:9, color:C.dim, marginBottom:8, letterSpacing:1}}>
            INSTALLING...
          </div>
          <Terminal lines={installLines[os]} color={C.green} speed={180}/>
          <div style={{display:"flex", justifyContent:"flex-end", marginTop:14}}>
            <Btn color={C.yellow} onClick={() => { setPhase(2); Sound.success(); }}>Verify Installation →</Btn>
          </div>
        </div>
      )}

      {phase === 2 && (
        <div style={{animation:"fadeUp 0.3s ease forwards", opacity:0}}>
          <div style={{fontFamily:PIXEL, fontSize:9, color:C.dim, marginBottom:8, letterSpacing:1}}>
            VERIFY INSTALLATION
          </div>
          <div style={{background:"#000", border:`2px solid ${C.green}`,
            padding:18, fontFamily:MONO, fontSize:13,
            color:C.green, lineHeight:1.6, whiteSpace:"pre",
            boxShadow:`0 0 24px ${C.green}33`, overflowX:"auto"}}>
            {versionLines.join("\n")}
            <span style={{animation:"blink 0.6s steps(2) infinite"}}>▌</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:14}}>
            <div style={{fontFamily:VT, fontSize:17, color:C.green}}>✓ Installation confirmed</div>
            <Btn color={C.yellow} onClick={() => { setPhase(3); Sound.scan(); }}>Run rdk init →</Btn>
          </div>
        </div>
      )}

      {phase === 3 && (
        <div style={{animation:"fadeUp 0.3s ease forwards", opacity:0}}>
          <div style={{fontFamily:PIXEL, fontSize:9, color:C.dim, marginBottom:8, letterSpacing:1}}>
            CREATING YOUR ACCOUNT + NODE
          </div>
          <Terminal lines={initLines} color={C.green} speed={140}/>
          <div style={{display:"flex", justifyContent:"flex-end", marginTop:14}}>
            <Btn color={C.green} onClick={() => { setPhase(5); onComplete(); }}>✦ My Node Is Live ✦</Btn>
          </div>
        </div>
      )}

      {phase >= 5 && (
        <div style={{
          background:C.panel, border:`3px solid ${C.green}`,
          padding:24, textAlign:"center",
          boxShadow:`0 0 40px ${C.green}55`,
          animation:"fadeUp 0.5s ease forwards", opacity:0,
        }}>
          <div style={{fontFamily:PIXEL, fontSize:11, color:C.green,
            letterSpacing:3, marginBottom:14, textShadow:`0 0 16px ${C.green}`}}>
            ✦ WELCOME TO THE NETWORK ✦
          </div>
          <div style={{fontFamily:MONO, fontSize:11, color:C.green,
            lineHeight:1.4, whiteSpace:"pre", marginBottom:14,
            textShadow:`0 0 8px ${C.green}66`}}>
            {RDK_ASCII}
          </div>
          <div style={{fontFamily:VT, fontSize:19, color:C.text,
            lineHeight:1.5, maxWidth:560, margin:"0 auto"}}>
            You're one of 1,204 nodes online right now. Your private vault is initialized.
            Your MCP server is running. Your earnings wallet is ready when you want to add one.
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10,
            marginTop:18, maxWidth:480, margin:"18px auto 0"}}>
            {[
              {l:"NODE ID",  v:"rdk-node-•••"},
              {l:"VAULT",    v:"initialized"},
              {l:"NETWORK",  v:"connected"},
            ].map(s => (
              <div key={s.l} style={{background:C.bg, border:`1px solid ${C.green}66`, padding:10}}>
                <div style={{fontFamily:PIXEL, fontSize:7, color:C.dim, marginBottom:6}}>{s.l}</div>
                <div style={{fontFamily:PIXEL, fontSize:10, color:C.green}}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TownHall({ classKey, onComplete, onLeave, userState, setUserState }) {
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState(userState.companyName||"");
  const [monthlySpend, setMonthlySpend] = useState(userState.monthlySpend||"");
  const [useCase, setUseCase] = useState(userState.useCase||"");
  const [installOs, setInstallOs] = useState("mac");
  const [installPhase, setInstallPhase] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const companyValid = companyName.length > 2;
  const spendValid = parseFloat(monthlySpend) > 0;
  const useCaseValid = useCase.length > 5;

  const monthlyNum = parseFloat(monthlySpend) || 5000;
  const saving85 = Math.round(monthlyNum * 0.85);

  const STEPS = [
    {
      phase:"LESSON", label:"The Token Problem",
      npc:"MAYOR PIX", avatar:"🏛", color:C.yellow,
      text:"Every time an agent answers a question, it sends tokens to an LLM. Tokens cost money. And most of those tokens are your own knowledge — docs, policies, research — being rebuilt from scratch on every single call. You're paying to re-derive what you already know.",
      extra:(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14,maxWidth:760,width:"100%"}}>
          <StatCard label="Avg LLM Cost / 1M tokens" to={15} suffix="$" color={C.red} sub="GPT-4o input pricing. Every query burns through tokens you already own." />
          <StatCard label="Tokens per knowledge query" to={8200} color={C.yellow} sub="Typical context window for an enterprise knowledge query. 82% could be pre-retrieved." />
          <StatCard label="Enterprise monthly token spend" to={47000} suffix="$" color={C.pink} sub="Average for teams with 10+ active AI workflows. Growing 40% per quarter." />
          <StatCard label="Queries answerable from vault" to={83} suffix="%" color={C.green} sub="Queries where indexed knowledge has the answer — no LLM call required at all." />
        </div>
      ),
    },
    {
      phase:"LESSON", label:"The Retrieval Solution",
      npc:"MAYOR PIX", avatar:"🏛", color:C.yellow,
      text:"Instead of sending your entire knowledge base to the LLM on every query, you index it once — locally, privately. When a question arrives, you retrieve only the 200–400 relevant tokens. The LLM sees a tiny context. Your cost drops 80–90%. On the first query.",
      extra:(
        <div style={{background:"#000",border:`2px solid ${C.yellow}`,padding:16,marginTop:14,maxWidth:760,width:"100%",fontFamily:MONO,fontSize:13,lineHeight:2}}>
          {[
            [C.dim,    `// WITHOUT vault — every query sends the full doc`],
            [C.red,    `Agent query → full knowledge base → LLM: 8,200 tokens → cost: $0.123`],
            [C.dim,    ``],
            [C.dim,    `// WITH vault — only the relevant chunk retrieved`],
            [C.green,  `Agent query → vault search → 3 chunks: 380 tokens → LLM: $0.006`],
            [C.yellow, `→ Reduction: 95.1% · Savings: $0.117 on this one query`],
            [C.dim,    ``],
            [C.green,  `→ At 1,000 queries/day: $117/day saved · $42,705/year`],
          ].map(([col,line],i)=>(
            <div key={i} style={{color:col}}>{line}</div>
          ))}
        </div>
      ),
    },
    {
      phase:"LESSON", label:"Three-Tier Routing",
      npc:"MAYOR PIX", avatar:"🏛", color:C.yellow,
      text:"RDK routes every query through three layers in order. Private vault first — your indexed docs, free and instant. Public network second — other nodes' knowledge at a micro-tip. LLM fallback last — only when neither vault nor network has the answer. Most queries never reach the LLM.",
      extra:(
        <div style={{marginTop:14,maxWidth:760,width:"100%"}}>
          {[
            {tier:"1",label:"PRIVATE VAULT",icon:"🔒",color:C.cyan,  pct:68,desc:"Queries answered from your own indexed knowledge. Zero LLM cost.",cost:"$0.000"},
            {tier:"2",label:"PUBLIC NETWORK",icon:"🌐",color:C.green, pct:19,desc:"Answered by another node's indexed knowledge. Micro-tip only.",cost:"$0.005"},
            {tier:"3",label:"LLM FALLBACK",  icon:"🤖",color:C.yellow,pct:13,desc:"Neither vault nor network had it. Full LLM call. Still cheaper with context.",cost:"$0.038"},
          ].map((t,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"12px 16px",marginBottom:8,
              background:C.panel,border:`2px solid ${t.color}22`,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${t.pct}%`,background:`${t.color}08`}}/>
              <div style={{fontFamily:PIXEL,fontSize:20,width:24,flexShrink:0,position:"relative"}}>{t.icon}</div>
              <div style={{flex:1,position:"relative"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontFamily:PIXEL,fontSize:8,color:t.color}}>{t.tier}. {t.label}</div>
                  <div style={{fontFamily:PIXEL,fontSize:8,color:t.color}}>{t.pct}% of queries</div>
                </div>
                <div style={{fontFamily:VT,fontSize:17,color:C.dim}}>{t.desc}</div>
              </div>
              <div style={{fontFamily:PIXEL,fontSize:11,color:t.color,flexShrink:0,alignSelf:"center",position:"relative"}}>{t.cost}</div>
            </div>
          ))}
          <div style={{fontFamily:VT,fontSize:18,color:C.dim,marginTop:8,textAlign:"center"}}>
            Combined avg cost per query: <span style={{color:C.green,fontFamily:PIXEL,fontSize:10}}>~$0.006</span> · vs raw LLM: <span style={{color:C.red}}>$0.123</span>
          </div>
        </div>
      ),
    },
    {
      phase:"BUILD", label:"Your Baseline",
      npc:"MAYOR PIX", avatar:"🏛", color:C.yellow,
      text:"Tell me about your operation. This sets the context for every module — the vault, the network, the connector. Your numbers, your use case. Every projection we show uses your real spend.",
      extra:(
        <div style={{marginTop:14,maxWidth:760,width:"100%"}}>
          <InputField label="COMPANY / PROJECT / HANDLE"
            value={companyName} onChange={setCompanyName}
            placeholder="Acme Corp · my-project · @handle"
            hint="How agents will identify your node on the network." />
          <InputField label="ESTIMATED MONTHLY LLM SPEND (USD)"
            value={monthlySpend} onChange={setMonthlySpend}
            type="number"
            placeholder="5000"
            hint="What you're currently paying for LLM API calls. Ballpark is fine."
            validate={v=>v.length===0?null:parseFloat(v)>0} />
          <InputField label="PRIMARY USE CASE"
            value={useCase} onChange={setUseCase}
            placeholder="e.g. customer support, code review, research, internal docs"
            hint="What your agents mostly do. Shapes your vault indexing strategy." />
          {companyValid && spendValid && useCaseValid && (
            <div style={{marginTop:12,background:"#0a1a08",border:`2px solid ${C.green}`,
              padding:14,animation:"fadeUp 0.3s ease forwards",opacity:0}}>
              <div style={{fontFamily:PIXEL,fontSize:8,color:C.green,marginBottom:8}}>★ YOUR PROJECTION</div>
              <div style={{fontFamily:VT,fontSize:20,color:C.text,lineHeight:1.5}}>
                At 85% retrieval rate: <span style={{color:C.green,fontFamily:PIXEL,fontSize:12}}>${saving85.toLocaleString()}/mo</span> saved.
                <br/>That's <span style={{color:C.green}}>${(saving85*12).toLocaleString()}/year</span> you stop sending to OpenAI.
              </div>
            </div>
          )}
        </div>
      ),
      noAuto:true, canNext:()=>companyValid&&spendValid&&useCaseValid,
    },
    {
      phase:"BUILD", label:"Install RDK",
      npc:"MAYOR PIX", avatar:"🏛", color:C.yellow,
      text:"Time to install. This is one command — and it works on any machine. Pick your OS, copy the line, run it. We'll verify it together, then bring your node online.",
      extra: <InstallCeremony
        os={installOs} setOs={setInstallOs}
        phase={installPhase} setPhase={setInstallPhase}
        onComplete={() => {
          setShowConfetti(true);
          Sound.unlock();
          setTimeout(() => setShowConfetti(false), 3500);
        }}
        userState={userState}
      />,
      noAuto:true,
      canNext:()=>installPhase >= 5,
    },
    {
      phase:"BUILD", label:"Your First Query",
      npc:"MAYOR PIX", avatar:"🏛", color:C.yellow,
      text:"Your vault is configured. Let's run a query and prove three-tier routing works right now — local context retrieval, no LLM call. Watch it in action.",
      extra:(
        <div style={{maxWidth:760,width:"100%",marginTop:14}}>
          <CopyBlock lang="TERMINAL" color={C.yellow}
            code={`rdk query "${useCase||"what have I indexed"}"`}/>
          <Terminal speed={220} color={C.green} lines={[
            `→ Embedding query locally (all-MiniLM-L6-v2)...`,
            `→ Tier 1: checking private vault...`,
            `  ✓ 2 relevant chunks found (similarity: 0.87)`,
            `→ Tier 2: network query skipped — vault sufficient`,
            `→ Tier 3: LLM call skipped`,
            `→ Context assembled: 312 tokens (vs 8,200 without vault)`,
            ``,
            `✓ Query resolved via vault`,
            `✓ Savings on this query: $0.117`,
          ]}/>
          <div style={{
            marginTop:14,background:C.panel,
            border:`2px solid ${C.green}`,
            padding:18,textAlign:"center",
            animation:"fadeUp 0.5s ease forwards",
            boxShadow:`0 0 30px ${C.green}22`,
          }}>
            <div style={{fontFamily:PIXEL,fontSize:9,color:C.green,marginBottom:10,letterSpacing:2}}>
              ✦ ROUTING WORKS ✦
            </div>
            <div style={{fontFamily:VT,fontSize:18,color:C.text,marginBottom:14}}>
              That single query saved $0.117 by skipping the LLM.
              <br/>Stack that across your actual workload:
            </div>
            <div style={{fontFamily:PIXEL,fontSize:32,color:C.green,
              textShadow:`0 0 24px ${C.green}`,lineHeight:1.1}}>
              ${saving85.toLocaleString()}<span style={{fontSize:14}}>/mo</span>
            </div>
            <div style={{fontFamily:VT,fontSize:17,color:C.dim,marginTop:6}}>
              Projected at 85% reduction on your ${monthlyNum.toLocaleString()}/mo spend.
            </div>
            <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`,
              display:"flex",justifyContent:"space-around",gap:10}}>
              {[
                {l:"YEAR 1",v:`$${(saving85*12).toLocaleString()}`},
                {l:"3 YEARS",v:`$${(saving85*36).toLocaleString()}`},
                {l:"BREAK-EVEN",v:"Day 1"},
              ].map(s=>(
                <div key={s.l}>
                  <div style={{fontFamily:PIXEL,fontSize:8,color:C.dim}}>{s.l}</div>
                  <div style={{fontFamily:PIXEL,fontSize:16,color:C.green,marginTop:4}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      noAuto:true, canNext:()=>true, isLast:true,
    },
  ];

  const cur = STEPS[step];
  const isLesson = cur.phase==="LESSON";
  const isBuild = cur.phase==="BUILD";
  const lessonCount = STEPS.filter(s=>s.phase==="LESSON").length;
  const buildCount  = STEPS.filter(s=>s.phase==="BUILD").length;
  const isLastLesson = isLesson && (step===STEPS.length-1 || STEPS[step+1]?.phase==="BUILD");

  const canNext = () => { if(cur.canNext) return cur.canNext(); return true; };
  const next = () => {
    if(!canNext()) return;
    if(isBuild && step===lessonCount) setUserState(s=>({...s,companyName,monthlySpend,useCase}));
    if(step<STEPS.length-1) setStep(s=>s+1);
    else { Sound.complete(); onComplete(); }
  };

  return (
    <Shell title="TOWN HALL" color={C.yellow} step={step+1} total={STEPS.length} badge="🏛" onLeave={onLeave}>
      <PhaseTag isLesson={isLesson} isBuild={isBuild}
        color={C.yellow} learnCount={lessonCount} buildCount={buildCount}/>
      <NPCDialogue key={step} npc={cur.npc} avatar={cur.avatar} color={C.yellow}
        text={cur.text} extra={cur.extra||null}
        onContinue={next} onBack={step>0?()=>setStep(s=>s-1):null}
        isLast={cur.isLast||step===STEPS.length-1} noAuto={cur.noAuto||false}
        continueLabel={isLastLesson?"Start Building ▶":"Continue ▶"} />
      {cur.noAuto && (
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,maxWidth:780,width:"100%"}}>
          <div>{step>0 && <Btn sm outline color={C.dim} onClick={()=>setStep(s=>s-1)}>◀ Back</Btn>}</div>
          <Btn sm color={C.yellow} disabled={!canNext()} onClick={next}>
            {step===STEPS.length-1?"Complete Module ★":"Continue ▶"}
          </Btn>
        </div>
      )}
      <Confetti active={showConfetti}/>
    </Shell>
  );
}

function Vault({ onComplete, onLeave }) {
  const [step, setStep] = useState(0);
  const [privateContent, setPrivateContent] = useState('');
  const [indexed, setIndexed] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [goPublic, setGoPublic] = useState(undefined);

  const SAMPLE_DOC = `Our refund policy: Enterprise clients receive a full refund within 30 days, no questions asked. Standard tier clients receive store credit only within 14 days. Refund requests must be submitted via email to billing@company.com with the order ID. Processing takes 3-5 business days. Crypto payments are refunded in USDC at the exchange rate at time of purchase.`;

  function runIndex() {
    setIndexing(true); Sound.scan();
    setTimeout(() => { setIndexing(false); setIndexed(true); Sound.complete(); }, 2800);
  }
  function runSearch() {
    Sound.scan();
    setTimeout(() => { setSearched(true); Sound.success(); }, 1800);
  }

  const STEPS = [
    {
      phase:"LESSON", label:"The Intelligence Gap",
      npc:"ARCHIVIST", avatar:"📓", color:C.cyan,
      text:"AI agents are brilliant — but blind to anything you haven't told them. Your team's decisions, your product history, your private research — none of it exists to the agent unless you index it. The Vault fixes that. It's your private, local knowledge store that agents query before calling any LLM.",
    },
    {
      phase:"LESSON", label:"How Your Vault Works",
      npc:"ARCHIVIST", avatar:"📓", color:C.cyan,
      text:"When you index content, RDK chunks it into semantic units, generates embeddings locally, and stores everything in ~/.rdk/index.db. When an agent queries, it checks your vault first. If the answer's there, no LLM call is made. You save tokens. You save money. The answer is faster.",
      extra:(
        <div style={{background:"#000",border:`2px solid ${C.cyan}`,padding:16,marginTop:14,maxWidth:760,width:"100%",fontFamily:MONO,fontSize:13,lineHeight:1.9}}>
          {[
            [C.dim,   `// Query enters your local stack`],
            [C.cyan,  `rdk.query("what is our refund policy")`],
            [C.dim,   `→ Step 1: embed query locally (no API call)`],
            [C.cyan,  `→ Step 2: search vault... match found (0.91)`],
            [C.green, `→ Returning 2 chunks · 280 tokens`],
            [C.dim,   `→ LLM call: skipped`],
            [C.green, `→ Saved: ~$0.006 on this query`],
          ].map(([col,line],i)=>(
            <div key={i} style={{color:col}}>{line}</div>
          ))}
        </div>
      ),
    },
    {
      phase:"LESSON", label:"Private vs Public",
      npc:"ARCHIVIST", avatar:"📓", color:C.cyan,
      text:"Every piece of content you index has one setting: public or private. Public is the default for contribution — your embedding goes to the network, other agents can retrieve it, and you earn tips. Private is for content that should never leave your machine — client files, internal pricing, anything sensitive. The choice is per-document, not vault-wide.",
      extra:(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14,maxWidth:760,width:"100%"}}>
          <div style={{background:"#081a08",border:`2px solid ${C.green}`,padding:16}}>
            <div style={{fontFamily:PIXEL,fontSize:9,color:C.green,marginBottom:8}}>🌐 PUBLIC (DEFAULT FOR CONTRIBUTORS)</div>
            <div style={{fontFamily:VT,fontSize:17,color:C.dim,lineHeight:1.5}}>
              Embedding + summary on network<br/>
              Raw content stays on your machine<br/>
              Any agent can retrieve it<br/>
              You earn tips on every retrieval
            </div>
          </div>
          <div style={{background:"#081a1a",border:`2px solid ${C.cyan}`,padding:16}}>
            <div style={{fontFamily:PIXEL,fontSize:9,color:C.cyan,marginBottom:8}}>🔒 PRIVATE (FOR SENSITIVE DATA)</div>
            <div style={{fontFamily:VT,fontSize:17,color:C.dim,lineHeight:1.5}}>
              Stored in ~/.rdk/index.db only<br/>
              Never synced to any server<br/>
              Only your agents can query it<br/>
              No tips earned
            </div>
          </div>
        </div>
      ),
    },
    {
      phase:"LESSON", label:"What to Index",
      npc:"ARCHIVIST", avatar:"📓", color:C.cyan,
      text:"Any text you reference repeatedly is worth indexing. Company policies, API docs, your own writing, research notes, product guides. The vault works best with dense, specific knowledge — the kind that would take an LLM 2,000 tokens to reason about from scratch, but only 300 tokens to retrieve directly.",
    },
    {
      phase:"BUILD", label:"Index Something Private",
      npc:"ARCHIVIST", avatar:"📓", color:C.cyan,
      text:"Start simple. Paste any text you want to keep private — a note, a doc, anything. RDK will chunk it, embed it, and store it locally. It never leaves your machine.",
      extra:(
        <div style={{maxWidth:760,width:"100%",marginTop:14}}>
          <div style={{fontFamily:PIXEL,fontSize:9,color:C.dim,marginBottom:8,letterSpacing:1}}>
            PASTE YOUR CONTENT (or use the sample)
          </div>
          <textarea
            value={privateContent}
            onChange={e=>setPrivateContent(e.target.value)}
            rows={5}
            placeholder={`Paste any text here — a note, a doc, a guide.\n\nExample: "Our refund policy states that enterprise clients receive a full refund within 30 days, no questions asked..."`}
            style={{width:"100%",fontFamily:VT,fontSize:18,
              padding:"10px 14px",background:"#000",color:C.text,
              border:`2px solid ${C.cyan}`,outline:"none",
              resize:"vertical",lineHeight:1.5}}
          />
          <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
            <Btn sm color={C.dim} outline onClick={()=>setPrivateContent(SAMPLE_DOC)}>
              Use Sample Doc
            </Btn>
            {privateContent.length>20 && !indexed && (
              <Btn sm color={C.cyan} onClick={runIndex}>
                Index It →
              </Btn>
            )}
          </div>
          {(indexing||indexed) && (
            <Terminal speed={160} color={C.cyan} lines={[
              `→ Chunking content into semantic units...`,
              `  ✓ ${Math.ceil(privateContent.split(' ').length/80)} chunks created`,
              `→ Generating embeddings (local model, no API needed)...`,
              `  ✓ Embeddings complete`,
              `→ Storing in private vault (~/.rdk/index.db)...`,
              `  ✓ Stored. Content never leaves this machine.`,
              ``,
              `✓ Private vault: ${Math.ceil(privateContent.split(' ').length/80)} chunks indexed`,
            ]}/>
          )}
          {indexed && (
            <div style={{marginTop:10,background:"#0a1e2e",
              border:`2px solid ${C.cyan}`,padding:12,
              animation:"fadeUp 0.4s ease forwards",opacity:0}}>
              <div style={{fontFamily:PIXEL,fontSize:9,color:C.cyan,marginBottom:6}}>
                ✓ INDEXED PRIVATELY
              </div>
              <div style={{fontFamily:VT,fontSize:18,color:C.text}}>
                Your content is chunked, embedded, and stored locally.
                No cloud. No server. Just your machine.
              </div>
            </div>
          )}
        </div>
      ),
      noAuto:true, canNext:()=>indexed,
    },
    {
      phase:"BUILD", label:"Search It",
      npc:"ARCHIVIST", avatar:"📓", color:C.cyan,
      text:"Now find it. Type any question related to what you just indexed. This is what happens when an agent queries your vault — before the LLM ever fires.",
      extra:(
        <div style={{maxWidth:760,width:"100%",marginTop:14}}>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <input
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              placeholder="e.g. What is our refund policy?"
              style={{flex:1,fontFamily:VT,fontSize:20,padding:"10px 14px",
                background:"#000",color:C.text,
                border:`2px solid ${C.cyan}`,outline:"none"}}
            />
            <Btn sm color={C.cyan}
              disabled={searchQuery.length<5}
              onClick={runSearch}>
              Search →
            </Btn>
          </div>
          {!searched && (
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              {["What is our refund policy?","How long does refund processing take?",
                "Do crypto payments get refunded?"].map(q=>(
                <button key={q} onClick={()=>setSearchQuery(q)}
                  style={{fontFamily:VT,fontSize:15,color:C.dim,background:"transparent",
                    border:`1px solid ${C.border}`,padding:"4px 10px",cursor:"pointer"}}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {searched && (
            <Terminal speed={120} color={C.green} lines={[
              `→ Embedding query...`,
              `→ Searching private vault...`,
              ``,
              `Result 1 (similarity: 0.91)`,
              `  "${(privateContent||SAMPLE_DOC).slice(0,80).trim()}..."`,
              ``,
              `Result 2 (similarity: 0.74)`,
              `  "...${(privateContent||SAMPLE_DOC).slice(80,150).trim()}..."`,
              ``,
              `→ Context assembled: ${Math.round((privateContent||SAMPLE_DOC).split(' ').length * 0.35)} tokens`,
              `→ Full document: ${(privateContent||SAMPLE_DOC).split(' ').length} tokens`,
              `→ Reduction: ${Math.round((1-0.35)*100)}% fewer tokens sent to LLM`,
              `→ LLM call cost: $${((privateContent||SAMPLE_DOC).split(' ').length*0.35*0.000003).toFixed(5)}`,
              `→ vs full doc cost: $${((privateContent||SAMPLE_DOC).split(' ').length*0.000003).toFixed(5)}`,
            ]}/>
          )}
        </div>
      ),
      noAuto:true, canNext:()=>searched,
    },
    {
      phase:"BUILD", label:"Go Public (Optional)",
      npc:"ARCHIVIST", avatar:"📓", color:C.cyan,
      text:"Private is great. Public earns. Index something you'd share with the world — a guide, a template, research you've done. Other agents retrieve it. You earn a tip every time.",
      extra:(
        <div style={{maxWidth:760,width:"100%",marginTop:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div
              onClick={()=>setGoPublic(true)}
              style={{background:goPublic?"#081a08":C.panel,
                border:`3px solid ${goPublic?C.green:C.border}`,
                padding:16,cursor:"pointer",transition:"all 0.2s",
                boxShadow:goPublic?`0 0 20px ${C.green}33`:"none"}}>
              <div style={{fontFamily:PIXEL,fontSize:9,color:C.green,marginBottom:8}}>
                ✓ YES — GO PUBLIC
              </div>
              <div style={{fontFamily:VT,fontSize:17,color:C.text,lineHeight:1.4}}>
                I have knowledge worth sharing. Index it publicly and start earning tips.
              </div>
            </div>
            <div
              onClick={()=>setGoPublic(false)}
              style={{background:goPublic===false?"#1a0808":C.panel,
                border:`3px solid ${goPublic===false?C.dim:C.border}`,
                padding:16,cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{fontFamily:PIXEL,fontSize:9,color:C.dim,marginBottom:8}}>
                SKIP FOR NOW
              </div>
              <div style={{fontFamily:VT,fontSize:17,color:C.text,lineHeight:1.4}}>
                Stay private for now. You can always contribute later with{" "}
                <code style={{fontFamily:MONO,fontSize:14}}>rdk index --public</code>
              </div>
            </div>
          </div>
          {goPublic && (
            <div style={{animation:"fadeUp 0.3s ease forwards",opacity:0}}>
              <CopyBlock lang="INDEX A PUBLIC CONTRIBUTION (DEFAULT)" color={C.green}
                code={`# Public is the default — contributes to the network\nrdk index ./my-guide.md\n\n# Explicitly private — for sensitive content\nrdk index ./client-contract.md --private`}/>
              <div style={{fontFamily:VT,fontSize:17,color:C.dim,marginTop:8,lineHeight:1.5}}>
                Only the embedding and a summary sync to the network.<br/>
                Raw content stays on your machine. Always.
              </div>
            </div>
          )}
        </div>
      ),
      noAuto:true, canNext:()=>goPublic!==undefined, isLast:true,
    },
  ];

  const cur = STEPS[step];
  const isLesson = cur.phase==="LESSON";
  const isBuild = cur.phase==="BUILD";
  const lessonCount = STEPS.filter(s=>s.phase==="LESSON").length;
  const buildCount = STEPS.filter(s=>s.phase==="BUILD").length;
  const isLastLesson = step===lessonCount-1;
  const canNext = ()=>{ if(cur.canNext) return cur.canNext(); return true; };
  const next = ()=>{
    if(!canNext()) return;
    if(step<STEPS.length-1) setStep(s=>s+1);
    else { Sound.complete(); onComplete(); }
  };

  return (
    <Shell title="THE VAULT" color={C.cyan} step={step+1} total={STEPS.length} badge="📓" onLeave={onLeave}>
      <PhaseTag isLesson={isLesson} isBuild={isBuild}
        color={C.cyan} learnCount={lessonCount} buildCount={buildCount}/>
      <NPCDialogue key={step} npc={cur.npc} avatar={cur.avatar} color={C.cyan}
        text={cur.text} extra={cur.extra||null}
        onContinue={next} onBack={step>0?()=>setStep(s=>s-1):null}
        isLast={cur.isLast||step===STEPS.length-1} noAuto={cur.noAuto||false}
        continueLabel={isLastLesson?"Start Building ▶":"Continue ▶"}/>
      {cur.noAuto&&(
        <div style={{display:"flex",justifyContent:"space-between",
          marginTop:12,maxWidth:780,width:"100%"}}>
          <div>{step>0&&<Btn sm outline color={C.dim}
            onClick={()=>setStep(s=>s-1)}>◀ Back</Btn>}</div>
          <Btn sm color={C.cyan} disabled={!canNext()} onClick={next}>
            {step===STEPS.length-1?"Complete Module ★":"Next Step ▶"}
          </Btn>
        </div>
      )}
    </Shell>
  );
}

const BRAIN_COLORS = [
  "#48c0f8","#f048c0","#68d870","#e8c84a","#a855f7",
  "#f06060","#48f0c0","#f08048","#c0f048","#4880f0",
  "#f0c048","#48f080","#c048f0","#f04880","#80f048",
  "#4848f0","#f0f048","#48c0c0","#c08048","#8048c0",
];
const MACHINE_NAMES = [
  "BDev.iMac.local",  "Vault.mbp.local",  "Mesh.relay.local",
  "Kaia.studio.lan",  "Atlas.win.local",   "Nova.linux.srv",
  "Helix.mac.local",  "Forge.dev.local",   "Cipher.mbp.lan",
  "Echo.win.local",   "Prism.mac.local",   "Nexus.relay.srv",
  "Sage.linux.lan",   "Flux.iMac.local",   "Orbit.mbp.local",
  "Dusk.dev.local",   "Arc.win.local",     "Root.linux.srv",
  "Lynx.mac.local",   "Grid.relay.lan",
];
const SUBJECT_TAGS = [
  "fintech","legal","health","engineering","ecommerce",
  "design","research","compliance","marketing","security",
  "devops","ai-ml","data","crypto","product","sales",
  "hr","ops","infra","privacy",
];

function DecentralizedIntelligenceMap({userState}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    nodes:[], edges:[], mouse:{x:0,y:0},
    hoveredNode:null, selectedNode:null,
    dragging:null, offset:{x:0,y:0},
    tick:0, tips:[],
  });
  const [tooltip, setTooltip] = useState(null);
  const [stats, setStats] = useState({nodes:21,chunks:0,online:0});

  useEffect(()=>{
    let n=0,c=0,o=0;
    const t=setInterval(()=>{
      n=Math.min(21,n+1);
      c=Math.min(18420,c+Math.floor(Math.random()*200+100));
      o=Math.min(1204,o+Math.floor(Math.random()*30+10));
      setStats({nodes:n,chunks:c,online:o});
      if(n>=21&&c>=18000&&o>=1200) clearInterval(t);
    },80);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    const ctx=canvas.getContext("2d");
    const W=canvas.width=760;
    const H=canvas.height=480;
    const cx=W/2, cy=H/2;
    const S=stateRef.current;

    S.nodes=[{
      id:"rdk", type:"rdk", label:"RDK CENTRAL",
      x:cx, y:cy, vx:0, vy:0,
      r:22, color:"#39FF6A", authority:1.0,
      fixed:true, ci:0,
    }];

    MACHINE_NAMES.forEach((name,i)=>{
      const angle=(i/20)*Math.PI*2;
      const dist=130+Math.random()*30;
      const authority=0.3+Math.random()*0.7;
      const color=BRAIN_COLORS[i];
      const isUser=i===0;
      const brainId=`brain_${i}`;
      S.nodes.push({
        id:brainId, type:"brain",
        label:isUser
          ? `${userState.displayName||"your-node"} ← YOU`
          : name.split(".")[0]+"."+name.split(".")[1],
        x:cx+Math.cos(angle)*dist+Math.random()*20-10,
        y:cy+Math.sin(angle)*dist+Math.random()*20-10,
        vx:0, vy:0,
        r:(isUser?12:8)+authority*6,
        color:isUser?"#39FF6A":color,
        authority, ci:i,
        isUser, fixed:false,
        chunks:Math.floor(authority*2000+200),
        domain:SUBJECT_TAGS[i%SUBJECT_TAGS.length],
      });
      S.edges.push({a:"rdk",b:brainId,type:"brain-rdk",color:isUser?"#39FF6A":color});

      for(let j=0;j<10;j++){
        const subAngle=angle+(j-4.5)*0.22+Math.random()*0.1;
        const subDist=55+Math.random()*20;
        const subId=`sub_${i}_${j}`;
        S.nodes.push({
          id:subId, type:"subject",
          label:SUBJECT_TAGS[(i*3+j)%SUBJECT_TAGS.length],
          x:cx+Math.cos(angle)*dist+Math.cos(subAngle)*subDist,
          y:cy+Math.sin(angle)*dist+Math.sin(subAngle)*subDist,
          vx:0,vy:0, r:4,
          color:isUser?"#39FF6A":color,
          authority:0.1+Math.random()*0.4,
          ci:i, parentId:brainId, fixed:false,
        });
        S.edges.push({a:brainId,b:subId,type:"subject-brain",color:isUser?"#39FF6A":color});
      }
    });

    const subjectsByTag={};
    S.nodes.filter(n=>n.type==="subject").forEach(n=>{
      if(!subjectsByTag[n.label]) subjectsByTag[n.label]=[];
      subjectsByTag[n.label].push(n.id);
    });
    Object.values(subjectsByTag).forEach(ids=>{
      if(ids.length<2) return;
      for(let k=0;k<Math.min(2,ids.length-1);k++){
        const a=ids[Math.floor(Math.random()*ids.length)];
        const b=ids[Math.floor(Math.random()*ids.length)];
        if(a!==b) S.edges.push({a,b,type:"affinity",color:"#ffffff",opacity:0.06,dashed:true});
      }
    });

    const nodeById={};
    S.nodes.forEach(n=>{nodeById[n.id]=n;});

    const REPULSION=750, SPRING_BRAIN=0.045, SPRING_SUB=0.07;
    const DAMPING=0.62, MAX_V=1.0, GRAVITY=0.014;
    const REST_BRAIN=118, REST_SUB=62;

    function simulate(){
      const ns=S.nodes;
      for(let i=0;i<ns.length;i++){
        for(let j=i+1;j<ns.length;j++){
          const a=ns[i],b=ns[j];
          if(a.fixed&&b.fixed) continue;
          const dx=b.x-a.x, dy=b.y-a.y;
          const dist2=dx*dx+dy*dy+0.01;
          const dist=Math.sqrt(dist2);
          const minDist=a.r+b.r+8;
          if(dist<minDist*3){
            const f=REPULSION/dist2;
            const fx=dx/dist*f, fy=dy/dist*f;
            if(!a.fixed){a.vx-=fx;a.vy-=fy;}
            if(!b.fixed){b.vx+=fx;b.vy+=fy;}
          }
        }
      }
      S.edges.forEach(e=>{
        const a=nodeById[e.a],b=nodeById[e.b];
        if(!a||!b) return;
        const dx=b.x-a.x, dy=b.y-a.y;
        const dist=Math.sqrt(dx*dx+dy*dy)+0.01;
        const rest=e.type==="brain-rdk"?REST_BRAIN:e.type==="subject-brain"?REST_SUB:80;
        const k=e.type==="brain-rdk"?SPRING_BRAIN:e.type==="subject-brain"?SPRING_SUB:0.02;
        const stretch=(dist-rest)*k;
        const fx=dx/dist*stretch, fy=dy/dist*stretch;
        if(!a.fixed){a.vx+=fx;a.vy+=fy;}
        if(!b.fixed){b.vx-=fx;b.vy-=fy;}
      });
      ns.forEach(n=>{
        if(n.fixed||(S.dragging&&S.dragging===n.id)) return;
        n.vx+=(cx-n.x)*GRAVITY; n.vy+=(cy-n.y)*GRAVITY;
        n.vx*=DAMPING; n.vy*=DAMPING;
        const speed=Math.sqrt(n.vx*n.vx+n.vy*n.vy);
        if(speed>MAX_V){n.vx=n.vx/speed*MAX_V;n.vy=n.vy/speed*MAX_V;}
        n.x+=n.vx; n.y+=n.vy;
        const margin=n.r+10;
        n.x=Math.max(margin,Math.min(W-margin,n.x));
        n.y=Math.max(margin,Math.min(H-margin,n.y));
      });
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="#080812"; ctx.fillRect(0,0,W,H);
      const t=S.tick*0.016; S.tick++;

      S.edges.forEach(e=>{
        const a=nodeById[e.a],b=nodeById[e.b]; if(!a||!b) return;
        const isHovered=S.hoveredNode&&(S.hoveredNode===e.a||S.hoveredNode===e.b);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        if(e.dashed){
          ctx.setLineDash([4,2]);
          ctx.strokeStyle=`rgba(255,255,255,${isHovered?0.15:0.05})`;
          ctx.lineWidth=0.5;
        } else {
          ctx.setLineDash([]);
          const baseOp=e.type==="brain-rdk"?0.25:e.type==="subject-brain"?0.18:0.08;
          ctx.strokeStyle=e.color+Math.round((isHovered?0.6:baseOp)*255).toString(16).padStart(2,"0");
          ctx.lineWidth=isHovered?1.5:e.type==="brain-rdk"?0.8:0.5;
        }
        ctx.stroke(); ctx.setLineDash([]);
        if(isHovered&&e.type!=="affinity"){
          const progress=(t*0.4)%1;
          const px=a.x+(b.x-a.x)*progress, py=a.y+(b.y-a.y)*progress;
          ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2);
          ctx.fillStyle=e.color; ctx.globalAlpha=0.8; ctx.fill(); ctx.globalAlpha=1;
        }
      });

      const rdkNode=nodeById["rdk"];
      if(rdkNode){
        [72,50,34].forEach((r,i)=>{
          const pulse=Math.sin(t*1.2+i*0.8)*0.5+0.5;
          const alpha=[0.04,0.07,0.12][i]*(0.6+pulse*0.4);
          ctx.beginPath(); ctx.arc(rdkNode.x,rdkNode.y,r,0,Math.PI*2);
          ctx.strokeStyle=`rgba(57,255,106,${alpha})`; ctx.lineWidth=1; ctx.stroke();
        });
        const rippleR=22+((t*0.5)%1)*60;
        const rippleA=Math.max(0,0.3-(((t*0.5)%1)*0.3));
        ctx.beginPath(); ctx.arc(rdkNode.x,rdkNode.y,rippleR,0,Math.PI*2);
        ctx.strokeStyle=`rgba(57,255,106,${rippleA})`; ctx.lineWidth=1.5; ctx.stroke();
      }

      S.nodes.filter(n=>n.type==="brain").forEach(n=>{
        const isHov=S.hoveredNode===n.id, isSel=S.selectedNode===n.id;
        const pulse=Math.sin(t*1.4+n.ci*0.52)*0.5+0.5;
        const pulseR=n.r+8+pulse*12;
        const pulseA=(0.08+pulse*0.1)*(isHov?2:1);
        ctx.beginPath(); ctx.arc(n.x,n.y,pulseR,0,Math.PI*2);
        ctx.strokeStyle=n.color+Math.round(pulseA*255).toString(16).padStart(2,"0");
        ctx.lineWidth=0.8; ctx.stroke();
        if(isHov||isSel||n.isUser){ctx.shadowColor=n.color;ctx.shadowBlur=n.isUser?24:isHov?16:8;}
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle=n.color+Math.round((0.85+pulse*0.1)*255).toString(16).padStart(2,"0");
        ctx.fill(); ctx.strokeStyle=n.color; ctx.lineWidth=isHov||n.isUser?2:1.5; ctx.stroke();
        ctx.shadowBlur=0;
        if(n.isUser){
          ctx.font="bold 12px monospace"; ctx.fillStyle="#39FF6A"; ctx.textAlign="center";
          ctx.fillText("★",n.x,n.y-n.r-6);
        }
        ctx.font=`${n.isUser?"bold ":""}10px monospace`;
        ctx.fillStyle=n.isUser?"#39FF6A":n.color; ctx.textAlign="center"; ctx.globalAlpha=0.9;
        ctx.fillText(n.label,n.x,n.y+n.r+14); ctx.globalAlpha=1;
      });

      S.nodes.filter(n=>n.type==="subject").forEach(n=>{
        const isHov=S.hoveredNode===n.id;
        ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle=n.color+Math.round(0.7*255).toString(16).padStart(2,"0"); ctx.fill();
        if(isHov){
          ctx.strokeStyle=n.color; ctx.lineWidth=1; ctx.stroke();
          ctx.font="9px monospace"; ctx.fillStyle=n.color; ctx.textAlign="center"; ctx.globalAlpha=0.9;
          ctx.fillText(n.label,n.x,n.y-8); ctx.globalAlpha=1;
        }
      });

      if(rdkNode){
        ctx.shadowColor="#39FF6A"; ctx.shadowBlur=20;
        ctx.beginPath(); ctx.arc(rdkNode.x,rdkNode.y,rdkNode.r,0,Math.PI*2);
        ctx.fillStyle="#39FF6A"; ctx.fill(); ctx.shadowBlur=0;
        ctx.font="bold 10px monospace"; ctx.fillStyle="#080812";
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("RDK",rdkNode.x,rdkNode.y); ctx.textBaseline="alphabetic";
        ctx.font="9px monospace"; ctx.fillStyle="#39FF6A"; ctx.globalAlpha=0.8;
        ctx.fillText("CENTRAL",rdkNode.x,rdkNode.y+rdkNode.r+12); ctx.globalAlpha=1;
      }

      S.tips=S.tips.filter(tp=>{
        tp.age+=1; if(tp.age>60) return false;
        const alpha=Math.max(0,1-tp.age/60);
        ctx.font="bold 10px monospace"; ctx.fillStyle=`rgba(57,255,106,${alpha})`;
        ctx.textAlign="center"; ctx.fillText(`+$${tp.amount}`,tp.x,tp.y-tp.age*0.5);
        return true;
      });
      if(S.tick%90===0){
        const brains=S.nodes.filter(n=>n.type==="brain");
        const rnd=brains[Math.floor(Math.random()*brains.length)];
        if(rnd) S.tips.push({x:rnd.x,y:rnd.y,age:0,amount:(Math.random()*0.015+0.001).toFixed(4)});
      }
    }

    function getNodeAt(x,y){
      const ordered=[
        ...S.nodes.filter(n=>n.type==="brain"),
        ...S.nodes.filter(n=>n.type==="subject"),
        ...S.nodes.filter(n=>n.type==="rdk"),
      ];
      for(const n of ordered){
        const dx=x-n.x,dy=y-n.y;
        if(Math.sqrt(dx*dx+dy*dy)<n.r+4) return n;
      }
      return null;
    }

    canvas.onmousemove=e=>{
      const rect=canvas.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      S.mouse={x:mx,y:my};
      if(S.dragging){
        const n=nodeById[S.dragging];
        if(n){n.x=mx-S.offset.x;n.y=my-S.offset.y;n.vx=0;n.vy=0;}
      } else {
        const hit=getNodeAt(mx,my);
        S.hoveredNode=hit?hit.id:null;
        canvas.style.cursor=hit?"pointer":"grab";
        if(hit&&hit.type!=="rdk"){
          setTooltip({x:hit.x,y:hit.y-hit.r-40,name:hit.label,type:hit.type,
            chunks:hit.chunks||Math.floor(Math.random()*500+50),
            domain:hit.domain||hit.label,isUser:hit.isUser});
        } else if(hit&&hit.type==="rdk"){
          setTooltip({x:hit.x,y:hit.y-hit.r-40,name:"RDK CENTRAL",type:"rdk",isRdk:true});
        } else { setTooltip(null); }
      }
    };
    canvas.onmousedown=e=>{
      const rect=canvas.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      const hit=getNodeAt(mx,my);
      if(hit&&!hit.fixed){
        S.dragging=hit.id; S.offset={x:mx-hit.x,y:my-hit.y};
        S.selectedNode=hit.id; canvas.style.cursor="grabbing";
      }
    };
    canvas.onmouseup=()=>{S.dragging=null;canvas.style.cursor="grab";};
    canvas.onmouseleave=()=>{S.dragging=null;S.hoveredNode=null;setTooltip(null);};

    let raf;
    function loop(){simulate();draw();raf=requestAnimationFrame(loop);}
    loop();
    return()=>cancelAnimationFrame(raf);
  },[]);

  return (
    <div style={{width:"100%",maxWidth:760,marginTop:14}}>
      <div style={{display:"flex",gap:20,marginBottom:10,fontFamily:PIXEL,fontSize:8,color:C.dim}}>
        <span>NODES ONLINE: <span style={{color:C.green}}>{stats.nodes}</span></span>
        <span>CHUNKS INDEXED: <span style={{color:C.cyan}}>{stats.chunks.toLocaleString()}</span></span>
        <span>NETWORK PEERS: <span style={{color:C.pink}}>{stats.online.toLocaleString()}</span></span>
        <span style={{marginLeft:"auto",color:C.green,animation:"blink 1.2s steps(2) infinite"}}>● LIVE</span>
      </div>
      <div style={{position:"relative",border:`2px solid ${C.border}`,background:"#080812"}}>
        <canvas ref={canvasRef} width={760} height={480} style={{display:"block",cursor:"grab"}}/>
        {tooltip && (
          <div style={{
            position:"absolute",
            left:Math.min(tooltip.x+10,660),
            top:Math.max(tooltip.y-10,5),
            background:C.panel,
            border:`2px solid ${tooltip.isUser?"#39FF6A":tooltip.isRdk?"#39FF6A":C.border}`,
            padding:"10px 14px",pointerEvents:"none",
            animation:"fadeUp 0.15s ease forwards",minWidth:160,
            boxShadow:tooltip.isUser||tooltip.isRdk?`0 0 20px #39FF6A44`:"none",
          }}>
            <div style={{fontFamily:PIXEL,fontSize:8,
              color:tooltip.isUser||tooltip.isRdk?"#39FF6A":C.text,marginBottom:6}}>
              {tooltip.name}
            </div>
            {tooltip.isRdk?(
              <div style={{fontFamily:VT,fontSize:16,color:C.dim}}>
                api.rdk.network<br/>Total nodes: {stats.nodes}<br/>Uptime: 99.9%
              </div>
            ):(
              <div style={{fontFamily:VT,fontSize:16,color:C.dim,lineHeight:1.5}}>
                {tooltip.isUser&&<span style={{color:"#39FF6A"}}>← YOUR NODE<br/></span>}
                Domain: {tooltip.domain}<br/>
                Chunks: {tooltip.chunks?.toLocaleString()}<br/>
                Status: <span style={{color:C.green}}>LIVE</span>
              </div>
            )}
          </div>
        )}
        <div style={{position:"absolute",bottom:10,left:10,display:"flex",gap:14,flexWrap:"wrap"}}>
          {[
            {col:"#39FF6A",label:"RDK Central"},
            {col:"#48c0f8",label:"Network Nodes"},
            {col:"#39FF6A",label:"Your Node ★",bold:true},
            {col:"#8878a8",label:"Knowledge Domains"},
          ].map(l=>(
            <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:l.col,boxShadow:`0 0 6px ${l.col}`}}/>
              <span style={{fontFamily:PIXEL,fontSize:7,color:l.bold?"#39FF6A":C.dim}}>{l.label}</span>
            </div>
          ))}
          <span style={{fontFamily:PIXEL,fontSize:7,color:C.border,marginLeft:"auto"}}>
            DRAG NODES · CLICK TO INSPECT
          </span>
        </div>
      </div>
      <div style={{fontFamily:VT,fontSize:17,color:C.dim,marginTop:10,textAlign:"center"}}>
        Every glowing point is a machine contributing knowledge.
        Find <span style={{color:"#39FF6A"}}>★ your node</span> in the network.
      </div>
    </div>
  );
}

function MapModule({onComplete, onLeave, userState}) {
  const [step, setStep] = useState(0);

  const STEPS = [
    {
      phase:"LESSON", label:"You Are Now Part of Something Bigger",
      npc:"NEXUS", avatar:"🌐", color:C.pink,
      text:"When you ran rdk init, you didn't just start a local tool. You joined a distributed network of knowledge nodes — each one a different machine, a different domain, a different piece of collective intelligence. Your node is live. The network already knows you're here.",
    },
    {
      phase:"LESSON", label:"How the Network Routes Intelligence",
      npc:"NEXUS", avatar:"🌐", color:C.pink,
      text:"Every query finds the best match across the entire network automatically. Private vault first. Closest domain node second. LLM only if nothing matches. Your node is one of those domain nodes — contributing to answers you'll never even see being asked.",
      extra:(
        <div style={{background:"#000",border:`2px solid ${C.pink}`,
          padding:16,marginTop:14,maxWidth:760,width:"100%",
          fontFamily:MONO,fontSize:13,lineHeight:2}}>
          {[
            [C.dim,    `// Query enters the network`],
            [C.cyan,   `rdk.query("GDPR article 17 requirements")`],
            [C.dim,    `→ Step 1: private vault... not found`],
            [C.pink,   `→ Step 2: network... fintech-node-a1b2c3 matched (0.94)`],
            [C.green,  `→ Serving 3 chunks · 420 tokens`],
            [C.dim,    `→ Tip queued: 0.005 USDC to node operator`],
            [C.yellow, `→ LLM fallback: skipped`],
            [C.green,  `→ Saved: $0.041 on this query`],
          ].map(([col,line],i)=>(
            <div key={i} style={{color:col}}>{line}</div>
          ))}
        </div>
      ),
    },
    {
      phase:"BUILD", label:"Find Your Node on the Map",
      npc:"NEXUS", avatar:"🌐", color:C.pink,
      text:"Here is the live RDK network. Your node just appeared. Every glowing point is another machine contributing knowledge. Drag nodes. Click yours. See where you fit.",
      extra:<DecentralizedIntelligenceMap userState={userState}/>,
      noAuto:true, canNext:()=>true, isLast:true,
    },
  ];

  const cur = STEPS[step];
  const isLesson = cur.phase==="LESSON";
  const isBuild = cur.phase==="BUILD";
  const lessonCount = STEPS.filter(s=>s.phase==="LESSON").length;
  const buildCount = STEPS.filter(s=>s.phase==="BUILD").length;
  const isLastLesson = step===lessonCount-1;
  const canNext = ()=>{ if(cur.canNext) return cur.canNext(); return true; };
  const next = ()=>{
    if(!canNext()) return;
    if(step<STEPS.length-1) setStep(s=>s+1);
    else { Sound.complete(); onComplete(); }
  };

  return (
    <Shell title="THE MAP" color={C.pink} step={step+1}
      total={STEPS.length} badge="🌐" onLeave={onLeave}>
      <PhaseTag isLesson={isLesson} isBuild={isBuild}
        color={C.pink} learnCount={lessonCount} buildCount={buildCount}/>
      <NPCDialogue key={step} npc={cur.npc} avatar={cur.avatar}
        color={C.pink} text={cur.text} extra={cur.extra||null}
        onContinue={next} onBack={step>0?()=>setStep(s=>s-1):null}
        isLast={cur.isLast||step===STEPS.length-1} noAuto={cur.noAuto||false}
        continueLabel={isLastLesson?"Show Me The Map ▶":"Continue ▶"}/>
      {cur.noAuto&&(
        <div style={{display:"flex",justifyContent:"space-between",
          marginTop:12,maxWidth:780,width:"100%"}}>
          <div>{step>0&&<Btn sm outline color={C.dim}
            onClick={()=>setStep(s=>s-1)}>◀ Back</Btn>}</div>
          <Btn sm color={C.pink} onClick={next}>
            {step===STEPS.length-1?"Complete Module ★":"Next Step ▶"}
          </Btn>
        </div>
      )}
    </Shell>
  );
}

function FakeChatPanel({userState}) {
  const [phase, setPhase] = useState(0);
  const timersRef = useRef([]);

  const question = userState.useCase
    ? `What do you know about ${userState.useCase}?`
    : "What knowledge have I indexed?";

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  }, []);

  const send = useCallback(() => {
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    Sound.scan(); setPhase(1);
    timersRef.current.push(setTimeout(() => setPhase(2), 1200));
    timersRef.current.push(setTimeout(() => { setPhase(3); Sound.success(); }, 2800));
  }, []);

  const reset = useCallback(() => {
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setPhase(0);
  }, []);

  return (
    <div style={{background:"#0a0a0f",border:`2px solid ${C.border}`,
      padding:16,marginTop:14,maxWidth:760,width:"100%",fontFamily:VT,fontSize:18}}>
      <div style={{display:"flex",alignItems:"center",gap:8,
        marginBottom:14,borderBottom:`1px solid ${C.border}`,paddingBottom:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",
          background:C.green,boxShadow:`0 0 8px ${C.green}`}}/>
        <span style={{fontFamily:PIXEL,fontSize:9,color:C.dim}}>
          CLAUDE DESKTOP — RDK CONNECTED
        </span>
        <span style={{fontFamily:PIXEL,fontSize:8,color:C.green,marginLeft:"auto"}}>
          ● 6 TOOLS ACTIVE
        </span>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <div style={{background:C.panel2,padding:"10px 14px",
          maxWidth:"70%",color:C.text,lineHeight:1.4,border:`1px solid ${C.border}`}}>
          {question}
        </div>
      </div>

      {phase===0 && (
        <div style={{textAlign:"center",padding:20}}>
          <Btn sm color={C.green} onClick={send}>Send Message →</Btn>
        </div>
      )}

      {phase>=1 && (
        <div style={{display:"flex",justifyContent:"flex-start",marginBottom:12}}>
          <div style={{maxWidth:"85%",width:"100%"}}>
            {phase===1 && (
              <div style={{color:C.dim,padding:"10px 14px",
                border:`1px solid ${C.border}`,background:C.panel}}>
                <span style={{animation:"blink 0.6s steps(2) infinite"}}>Claude is thinking▌</span>
              </div>
            )}
            {phase>=2 && (
              <div style={{background:"#0a1a0a",border:`1px solid ${C.green}33`,
                padding:"10px 14px",marginBottom:6,fontFamily:MONO,fontSize:12,
                color:C.dim,lineHeight:1.8}}>
                <div><span style={{color:C.green}}>→ calling rdk_query</span>{` ("${question.slice(0,50)}...")`}</div>
                {phase>=3 && (
                  <>
                    <div><span style={{color:C.green}}>→ retrieved 3 chunks (score: 0.89)</span></div>
                    <div style={{color:C.dim}}>→ context: 380 tokens assembled</div>
                    <div style={{color:C.yellow}}>→ LLM call tokens reduced by ~85%</div>
                  </>
                )}
              </div>
            )}
            {phase>=3 && (
              <div style={{background:C.panel,padding:"12px 16px",
                border:`1px solid ${C.border}`,color:C.text,lineHeight:1.5,
                animation:"fadeUp 0.4s ease forwards",opacity:0}}>
                <div>Based on your indexed knowledge, here's what I found in your vault...</div>
                <div style={{color:C.dim,fontSize:16,marginTop:8,fontStyle:"italic"}}>
                  [Response drawn from your vault — not from training data]
                </div>
                <div style={{marginTop:10,borderTop:`1px solid ${C.border}`,paddingTop:8,
                  fontFamily:PIXEL,fontSize:8,color:C.green}}>
                  ✓ VAULT CONTEXT USED · SAVED ~$0.034 · LLM CALL MINIMIZED
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {phase===3 && (
        <div style={{textAlign:"center",marginTop:14}}>
          <Btn sm outline color={C.dim} onClick={reset}>↻ Try another query</Btn>
        </div>
      )}
    </div>
  );
}

function Connector({ onComplete, onLeave, userState, setUserState }) {
  const [step, setStep] = useState(0);
  const [os, setOs] = useState("mac");
  const [systemPrompt, setSystemPrompt] = useState(
    `You are a personal assistant with access to my private knowledge vault via RDK tools.\n\nWhen answering questions, ALWAYS call rdk_query first before using your training data.\nMy domain: ${userState.useCase||"general knowledge"}\nContribution area: ${userState.contributionDomain||"research"}`
  );

  const configPath = {
    mac:"~/Library/Application Support/Claude/claude_desktop_config.json",
    windows:"%APPDATA%\\Claude\\claude_desktop_config.json",
    linux:"~/.config/Claude/claude_desktop_config.json",
  }[os];

  const configBlock = `{
  "mcpServers": {
    "rdk": {
      "command": "rdk",
      "args": ["mcp:serve", "--stdio"]
    }
  }
}`;

  const MCP_TOOLS = [
    {name:"rdk_query",    icon:"🔍", desc:"Search your vault and the network for relevant chunks"},
    {name:"rdk_index",    icon:"📥", desc:"Index a local file or text into your private vault"},
    {name:"rdk_index_url",icon:"🌐", desc:"Fetch and index a URL into your vault"},
    {name:"rdk_index_vault",icon:"🔒",desc:"Index content as private — never leaves your machine"},
    {name:"rdk_status",   icon:"📊", desc:"Show vault stats: chunk count, domains, last indexed"},
    {name:"rdk_earnings", icon:"💰", desc:"Show tips earned from network retrievals this session"},
  ];

  const STEPS = [
    {
      phase:"LESSON", label:"What a Connector Actually Is",
      npc:"DR. SCHEMA", avatar:"⚗", color:C.green,
      text:"The RDK MCP connector gives Claude Desktop six tools it can call on your behalf. Every time Claude needs to answer a question about your domain, it reaches into your vault first — not the open web, not its training data. Your knowledge. Your answers.",
      extra:(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14,maxWidth:760,width:"100%"}}>
          {MCP_TOOLS.map(t=>(
            <div key={t.name} style={{background:C.panel,border:`1px solid ${C.border}`,
              padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:20,flexShrink:0}}>{t.icon}</span>
              <div>
                <div style={{fontFamily:MONO,fontSize:12,color:C.green,marginBottom:4}}>{t.name}</div>
                <div style={{fontFamily:VT,fontSize:16,color:C.dim}}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      phase:"LESSON", label:"Why Claude Needs to Be Told",
      npc:"DR. SCHEMA", avatar:"⚗", color:C.green,
      text:"Claude doesn't call your vault automatically — you configure a system prompt that tells it to. One line of instruction: 'always call rdk_query first.' That's all it takes. From that point on, every session starts with your knowledge loaded, not guessed.",
      extra:(
        <div style={{background:"#000",border:`2px solid ${C.green}`,padding:16,marginTop:14,maxWidth:760,width:"100%",fontFamily:MONO,fontSize:13,lineHeight:1.9}}>
          {[
            [C.dim,   `// Without system prompt`],
            [C.red,   `User: "What's our cancellation policy?"`],
            [C.dim,   `Claude: [guesses from training data]`],
            [C.dim,   ``],
            [C.dim,   `// With system prompt + rdk_query`],
            [C.cyan,  `User: "What's our cancellation policy?"`],
            [C.green, `Claude: [calls rdk_query → retrieves exact policy → answers precisely]`],
          ].map(([col,line],i)=>(
            <div key={i} style={{color:col}}>{line}</div>
          ))}
        </div>
      ),
    },
    {
      phase:"BUILD", label:"Add the Config",
      npc:"DR. SCHEMA", avatar:"⚗", color:C.green,
      text:"One JSON file tells Claude Desktop where to find the RDK MCP server. Pick your OS — the file path changes, the config doesn't.",
      extra:(
        <div style={{maxWidth:760,width:"100%",marginTop:14}}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {["mac","windows","linux"].map(o=>(
              <button key={o} onClick={()=>setOs(o)}
                style={{fontFamily:PIXEL,fontSize:8,padding:"8px 12px",cursor:"pointer",
                  background:os===o?C.green:C.panel,color:os===o?C.bg:C.dim,
                  border:`2px solid ${os===o?C.green:C.border}`,textTransform:"uppercase"}}>
                {o==="mac"?"macOS":o==="windows"?"Windows":"Linux"}
              </button>
            ))}
          </div>
          <div style={{fontFamily:PIXEL,fontSize:8,color:C.dim,marginBottom:6}}>
            CONFIG FILE PATH
          </div>
          <div style={{fontFamily:MONO,fontSize:13,color:C.cyan,background:"#000",
            padding:"10px 14px",border:`1px solid ${C.border}`,marginBottom:12}}>
            {configPath}
          </div>
          <CopyBlock lang="claude_desktop_config.json" color={C.green} code={configBlock}/>
          <div style={{fontFamily:VT,fontSize:17,color:C.dim,marginTop:10}}>
            Restart Claude Desktop after saving. The RDK tools will appear in the toolbar.
          </div>
        </div>
      ),
      noAuto:true, canNext:()=>true,
    },
    {
      phase:"BUILD", label:"Set Your System Prompt",
      npc:"DR. SCHEMA", avatar:"⚗", color:C.green,
      text:"Paste this into Claude Desktop's system prompt field. It tells Claude to always reach for your vault before guessing. Edit it to match your context.",
      extra:(
        <div style={{maxWidth:760,width:"100%",marginTop:14}}>
          <textarea
            value={systemPrompt}
            onChange={e=>{setSystemPrompt(e.target.value);setUserState(s=>({...s,systemPrompt:e.target.value}));}}
            rows={6}
            style={{width:"100%",fontFamily:MONO,fontSize:13,
              padding:"10px 14px",background:"#000",color:C.green,
              border:`2px solid ${C.green}`,outline:"none",
              resize:"vertical",lineHeight:1.6}}
          />
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <Btn sm color={C.green} onClick={()=>{navigator.clipboard?.writeText(systemPrompt);Sound.success();}}>
              Copy System Prompt
            </Btn>
          </div>
          <div style={{fontFamily:VT,fontSize:17,color:C.dim,marginTop:10,lineHeight:1.5}}>
            In Claude Desktop: Settings → Claude.ai → System Prompt → paste above.
          </div>
        </div>
      ),
      noAuto:true, canNext:()=>true,
    },
    {
      phase:"BUILD", label:"Fire Your First Query",
      npc:"DR. SCHEMA", avatar:"⚗", color:C.green,
      text:"This is what it looks like. Claude receives your question, calls rdk_query, retrieves your indexed context, and answers from your vault — not its training data. Hit Send.",
      extra:<FakeChatPanel userState={userState}/>,
      noAuto:true, canNext:()=>true, isLast:true,
    },
  ];

  const cur = STEPS[step];
  const isLesson = cur.phase==="LESSON";
  const isBuild  = cur.phase==="BUILD";
  const lessonCount = STEPS.filter(s=>s.phase==="LESSON").length;
  const buildCount  = STEPS.filter(s=>s.phase==="BUILD").length;
  const isLastLesson = step===lessonCount-1;
  const canNext = ()=>{ if(cur.canNext) return cur.canNext(); return true; };
  const next = ()=>{
    if(!canNext()) return;
    if(step<STEPS.length-1) setStep(s=>s+1);
    else { Sound.complete(); onComplete(); }
  };

  return (
    <Shell title="THE CONNECTOR" color={C.green} step={step+1} total={STEPS.length} badge="🔌" onLeave={onLeave}>
      <PhaseTag isLesson={isLesson} isBuild={isBuild}
        color={C.green} learnCount={lessonCount} buildCount={buildCount}/>
      <NPCDialogue key={step} npc={cur.npc} avatar={cur.avatar} color={C.green}
        text={cur.text} extra={cur.extra||null}
        onContinue={next} onBack={step>0?()=>setStep(s=>s-1):null}
        isLast={cur.isLast||step===STEPS.length-1} noAuto={cur.noAuto||false}
        continueLabel={isLastLesson?"Start Building ▶":"Continue ▶"}/>
      {cur.noAuto&&(
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,maxWidth:780,width:"100%"}}>
          <div>{step>0&&<Btn sm outline color={C.dim} onClick={()=>setStep(s=>s-1)}>◀ Back</Btn>}</div>
          <Btn sm color={C.green} disabled={!canNext()} onClick={next}>
            {step===STEPS.length-1?"Complete Module ★":"Next Step ▶"}
          </Btn>
        </div>
      )}
    </Shell>
  );
}

const DEMO_COLORS = {
  architecture:C.cyan, fashion:C.yellow, design:C.pink,
  legal:C.purple, media:C.green, research:C.red,
};

const USE_CASE_TAGLINES = {
  architecture:"Claude Code builds a full stack from your indexed patterns. Faster, cheaper, exact match.",
  fashion:"Agents helping users shop find your curated outfits. Tips on retrieval + product links.",
  design:"Components materialize from your design system tokens. Index once, earn passively.",
  legal:"Clauses drop into contracts agents are drafting. Premium tips on specialized legal content.",
  media:"Semantic search finds your photos for content producers. License sales on top of every tip.",
  research:"Pre-reasoned reports populate pitch decks. Higher tips for premium domain knowledge.",
};

function DemoArchitecture({ frame, color }) {

  const codeLines = [
    { n:1,  t:"comment",  c:"// auth.module.ts — generated from RDK pattern" },
    { n:2,  t:"keyword",  c:"import { Module } from '@nestjs/common';" },
    { n:3,  t:"keyword",  c:"import { JwtModule } from '@nestjs/jwt';" },
    { n:4,  t:"keyword",  c:"import { PassportModule } from '@nestjs/passport';" },
    { n:5,  t:"keyword",  c:"import { AuthService } from './auth.service';" },
    { n:6,  t:"keyword",  c:"import { AuthController } from './auth.controller';" },
    { n:7,  t:"keyword",  c:"import { JwtStrategy } from './jwt.strategy';" },
    { n:8,  t:"blank",    c:"" },
    { n:9,  t:"decorator",c:"@Module({" },
    { n:10, t:"prop",     c:"  imports: [" },
    { n:11, t:"value",    c:"    PassportModule," },
    { n:12, t:"value",    c:"    JwtModule.register({" },
    { n:13, t:"value",    c:"      secret: process.env.JWT_SECRET," },
    { n:14, t:"value",    c:"      signOptions: { expiresIn: '15m' }," },
    { n:15, t:"value",    c:"    })," },
    { n:16, t:"prop",     c:"  ]," },
    { n:17, t:"prop",     c:"  controllers: [AuthController]," },
    { n:18, t:"prop",     c:"  providers: [AuthService, JwtStrategy]," },
    { n:19, t:"prop",     c:"  exports: [AuthService]," },
    { n:20, t:"decorator",c:"})" },
    { n:21, t:"class",    c:"export class AuthModule {}" },
  ];

  const fileTree = [
    { name:"src",                 type:"folder", depth:0, frameRevealed:0 },
    { name:"main.ts",             type:"file",   depth:1, frameRevealed:0 },
    { name:"app.module.ts",       type:"file",   depth:1, frameRevealed:0 },
    { name:"auth",                type:"folder", depth:1, frameRevealed:2 },
    { name:"auth.module.ts",      type:"file",   depth:2, frameRevealed:2, active:true },
    { name:"auth.service.ts",     type:"file",   depth:2, frameRevealed:5 },
    { name:"auth.controller.ts",  type:"file",   depth:2, frameRevealed:5 },
    { name:"jwt.strategy.ts",     type:"file",   depth:2, frameRevealed:5 },
    { name:"dto",                 type:"folder", depth:2, frameRevealed:6 },
    { name:"login.dto.ts",        type:"file",   depth:3, frameRevealed:6 },
    { name:"users",               type:"folder", depth:1, frameRevealed:7 },
    { name:"users.module.ts",     type:"file",   depth:2, frameRevealed:7 },
    { name:"users.service.ts",    type:"file",   depth:2, frameRevealed:7 },
    { name:"docker-compose.yml",  type:"file",   depth:0, frameRevealed:8 },
  ];

  const linesTyped = frame >= 3 ? Math.min(codeLines.length, (frame - 2) * 4) : 0;

  const SYN = {
    comment:  "#6a9955",
    keyword:  "#569cd6",
    string:   "#ce9178",
    decorator:"#dcdcaa",
    prop:     "#9cdcfe",
    value:    "#ce9178",
    class:    "#4ec9b0",
    blank:    "#cccccc",
  };

  const colorize = (line) => {
    if (line.t === "blank") return null;
    const base = SYN[line.t] || "#cccccc";
    const html = line.c
      .replace(/'([^']*)'/g, `<span style="color:${SYN.string}">'$1'</span>`)
      .replace(/\b(import|export|class|from)\b/g,
        `<span style="color:${SYN.keyword}">$1</span>`);
    return <span style={{ color: base }} dangerouslySetInnerHTML={{ __html: html }}/>;
  };

  return (
    <div style={{
      display:"flex", flexDirection:"column",
      width:"100%", height:"100%", minHeight:560,
      background:"#1e1e1e",
      border:"1px solid #3e3e42",
      fontFamily:"'Cascadia Code','SF Mono','Menlo','Consolas',monospace",
      fontSize:13,
    }}>

      {/* TITLE BAR */}
      <div style={{
        display:"flex", alignItems:"center",
        background:"#323233", padding:"8px 14px",
        borderBottom:"1px solid #1e1e1e",
        fontSize:11, color:"#cccccc", flexShrink:0,
      }}>
        <div style={{ display:"flex", gap:7, marginRight:16 }}>
          <div style={{ width:13, height:13, borderRadius:"50%", background:"#ff5f57" }}/>
          <div style={{ width:13, height:13, borderRadius:"50%", background:"#febc2e" }}/>
          <div style={{ width:13, height:13, borderRadius:"50%", background:"#28c840" }}/>
        </div>
        <span style={{ flex:1, textAlign:"center", color:"#888" }}>
          my-nestjs-api — Claude Code
        </span>
        <span style={{
          fontFamily:PIXEL, fontSize:8, color:C.green,
          background:"#252526", padding:"4px 10px",
          border:`1px solid ${C.green}66`,
        }}>● RDK CONNECTED</span>
      </div>

      <div style={{ display:"flex", flex:1, minHeight:0 }}>

        {/* ACTIVITY BAR */}
        <div style={{
          width:52, background:"#333333",
          borderRight:"1px solid #1e1e1e",
          display:"flex", flexDirection:"column",
          alignItems:"center", paddingTop:10, gap:12,
          flexShrink:0,
        }}>
          {["📁","🔍","⎇","🐛","⊞","⚙"].map((ic, i) => (
            <div key={i} style={{
              fontSize:20,
              opacity: i === 0 ? 1 : 0.45,
              padding:"6px 0", width:"100%",
              textAlign:"center",
              borderLeft: i === 0 ? "2px solid #fff" : "2px solid transparent",
            }}>{ic}</div>
          ))}
        </div>

        {/* FILE EXPLORER */}
        <div style={{
          width:240, background:"#252526",
          borderRight:"1px solid #1e1e1e",
          color:"#cccccc", padding:"10px 0",
          overflow:"auto", flexShrink:0,
        }}>
          <div style={{
            padding:"4px 18px", fontSize:11, color:"#888",
            textTransform:"uppercase", letterSpacing:1, marginBottom:8,
          }}>Explorer</div>
          <div style={{
            padding:"4px 18px 8px", fontSize:11, color:"#cccccc",
            fontWeight:"bold", textTransform:"uppercase", letterSpacing:0.5,
          }}>▼ MY-NESTJS-API</div>
          {fileTree.map((f, i) => {
            const visible = frame >= f.frameRevealed;
            return (
              <div key={f.name} style={{
                padding:"4px 14px",
                paddingLeft: 14 + f.depth * 14,
                fontSize:12,
                color: f.active ? "#fff" : "#cccccc",
                background: f.active ? "#37373d" : "transparent",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-8px)",
                transition: `all 0.28s ease ${i * 0.04}s`,
                display:"flex", alignItems:"center", gap:6,
              }}>
                <span style={{ fontSize:10, opacity:0.7, width:10 }}>
                  {f.type === "folder" ? "▾" : ""}
                </span>
                <span style={{ opacity:0.8 }}>
                  {f.type === "folder" ? "📁" : "📄"}
                </span>
                <span>{f.name}</span>
                {f.active && (
                  <span style={{
                    marginLeft:"auto", width:7, height:7,
                    borderRadius:"50%", background:"#fff",
                  }}/>
                )}
              </div>
            );
          })}
        </div>

        {/* EDITOR + TERMINAL COLUMN */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          background:"#1e1e1e", minWidth:0,
        }}>

          {/* TAB BAR */}
          <div style={{
            display:"flex", background:"#252526",
            borderBottom:"1px solid #1e1e1e", flexShrink:0,
          }}>
            <div style={{
              padding:"9px 16px", fontSize:12,
              background:"#1e1e1e", color:"#fff",
              borderRight:"1px solid #252526",
              borderTop:`2px solid ${color}`,
              display:"flex", alignItems:"center", gap:8,
            }}>
              <span>📄</span>
              <span>auth.module.ts</span>
              <span style={{ marginLeft:10, color:"#888", fontSize:14 }}>×</span>
            </div>
            {frame >= 5 && (
              <div style={{
                padding:"9px 16px", fontSize:12,
                background:"#2d2d2d", color:"#888",
                borderRight:"1px solid #252526",
                display:"flex", alignItems:"center", gap:8,
                animation:"fadeUp 0.3s ease forwards", opacity:0,
              }}>
                <span>📄</span><span>auth.service.ts</span>
                <span style={{ color:"#666" }}>○</span>
              </div>
            )}
            {frame >= 6 && (
              <div style={{
                padding:"9px 16px", fontSize:12,
                background:"#2d2d2d", color:"#888",
                borderRight:"1px solid #252526",
                display:"flex", alignItems:"center", gap:8,
                animation:"fadeUp 0.3s ease forwards", opacity:0,
              }}>
                <span>📄</span><span>jwt.strategy.ts</span>
                <span style={{ color:"#666" }}>○</span>
              </div>
            )}
          </div>

          {/* CODE EDITOR */}
          <div style={{
            flex:1, display:"flex",
            overflow:"auto", padding:"12px 0",
            minHeight:0,
            justifyContent:"flex-start",
            alignItems:"flex-start",
            textAlign:"left",
          }}>
            <div style={{
              padding:"0 16px 0 20px",
              color:"#858585", fontSize:13, lineHeight:1.65,
              textAlign:"right", userSelect:"none",
              minWidth:44, flexShrink:0,
            }}>
              {codeLines.map((l, i) => (
                <div key={i} style={{
                  opacity: i < linesTyped ? 1 : 0.3,
                  color: i === linesTyped - 1 ? "#fff" : "#858585",
                }}>{l.n}</div>
              ))}
            </div>
            <div style={{
              flex:1, lineHeight:1.65, paddingRight:20,
              minWidth:0, overflow:"hidden",
              textAlign:"left",
              fontFamily:"'Cascadia Code','SF Mono','Menlo','Consolas',monospace",
            }}>
              {codeLines.map((line, i) => {
                if (i >= linesTyped) return <div key={i} style={{ height:"1.65em" }}/>;
                const isLatest = i === linesTyped - 1;
                return (
                  <div key={i} style={{
                    whiteSpace:"pre",
                    animation: isLatest ? "fadeUp 0.15s ease forwards" : undefined,
                    opacity: isLatest ? 0 : 1,
                  }}>
                    {colorize(line)}
                    {isLatest && (
                      <span style={{
                        background:"#fff",
                        animation:"blink 0.5s steps(2) infinite",
                        width:8, height:14, display:"inline-block",
                        marginLeft:1, verticalAlign:"middle",
                      }}/>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TERMINAL PANEL */}
          <div style={{
            height:170, background:"#181818",
            borderTop:"1px solid #3e3e42",
            display:"flex", flexDirection:"column", flexShrink:0,
          }}>
            <div style={{
              display:"flex", borderBottom:"1px solid #1e1e1e",
              background:"#252526",
            }}>
              {["TERMINAL","RDK ACTIVITY","PROBLEMS","OUTPUT"].map((t, i) => (
                <div key={t} style={{
                  padding:"7px 16px", fontSize:10,
                  color: i === 1 ? "#fff" : "#888",
                  borderBottom: i === 1 ? `2px solid ${color}` : "none",
                  textTransform:"uppercase", letterSpacing:1,
                }}>{t}</div>
              ))}
            </div>
            <div style={{
              flex:1, padding:"12px 16px", fontSize:11,
              color:"#cccccc",
              fontFamily:"'Cascadia Code','SF Mono','Menlo',monospace",
              lineHeight:1.75, overflow:"auto",
              textAlign:"left",
            }}>
              <div style={{ color:"#888" }}>
                $ claude-code "build a nestjs api with jwt auth"
              </div>
              {frame >= 1 && (
                <div style={{ color:C.green }}>
                  → rdk_query("nestjs jwt auth module structure")
                </div>
              )}
              {frame >= 2 && (
                <>
                  <div style={{ color:"#888" }}>
                    → matched: nestjs-auth-pattern.md (rdk-node-engineering-a1b2c3)
                  </div>
                  <div style={{ color:"#888" }}>
                    → 4 chunks · 580 tokens · similarity 0.94
                  </div>
                  <div style={{ color:"#dcdcaa" }}>
                    → tip queued: 0.005 USDC to node operator
                  </div>
                </>
              )}
              {frame >= 3 && (
                <div style={{ color, marginTop:4 }}>
                  → writing auth.module.ts from retrieved pattern...
                </div>
              )}
              {frame >= 7 && (
                <div style={{
                  color:C.green, marginTop:8,
                  paddingTop:8, borderTop:"1px solid #3e3e42",
                }}>
                  ✓ Stack scaffolded · 14 files · matches indexed pattern<br/>
                  ✓ LLM tokens used: 1,240 · saved vs cold start: ~12,800<br/>
                  ✓ Cost: $0.0037 · would have been $0.038 without RDK
                </div>
              )}
            </div>
          </div>

          {/* STATUS BAR */}
          <div style={{
            height:26, background:color,
            display:"flex", alignItems:"center",
            padding:"0 14px", fontSize:11, color:"#000",
            gap:16, fontFamily:"system-ui,-apple-system,sans-serif",
            flexShrink:0,
          }}>
            <span>⎇ main</span>
            <span>● RDK · 1 retrieval · 0.005 USDC paid</span>
            <span style={{ marginLeft:"auto" }}>TypeScript · UTF-8 · LF</span>
            <span>Ln {linesTyped} · Col 1</span>
          </div>

        </div>
      </div>
    </div>
  );
}

function ClothingSprite({ type, accent }) {
  const sprites = {
    blazer: (
      <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet"
        style={{ width:"100%", height:"100%", shapeRendering:"crispEdges" }}>
        <rect x="2"  y="2"  width="3" height="2" fill={accent}/>
        <rect x="11" y="2"  width="3" height="2" fill={accent}/>
        <rect x="3"  y="4"  width="10" height="9" fill={accent}/>
        <polygon points="6,4 8,7 10,4" fill="#1a1530"/>
        <rect x="7"  y="7"  width="2" height="6" fill="#1a1530"/>
        <rect x="8"  y="8"  width="1" height="1" fill="#d4a020"/>
        <rect x="8"  y="10" width="1" height="1" fill="#d4a020"/>
        <rect x="8"  y="12" width="1" height="1" fill="#d4a020"/>
        <rect x="1"  y="9"  width="2" height="4" fill={accent}/>
        <rect x="13" y="9"  width="2" height="4" fill={accent}/>
        <rect x="3"  y="13" width="10" height="1" fill="#1a1530"/>
      </svg>
    ),
    trousers: (
      <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet"
        style={{ width:"100%", height:"100%", shapeRendering:"crispEdges" }}>
        <rect x="3"  y="2"  width="10" height="2" fill="#1a1530"/>
        <rect x="3"  y="2"  width="10" height="1" fill={accent}/>
        <rect x="7"  y="2"  width="2" height="2" fill="#d4a020"/>
        <rect x="3"  y="4"  width="4" height="10" fill={accent}/>
        <rect x="9"  y="4"  width="4" height="10" fill={accent}/>
        <rect x="7"  y="4"  width="2" height="7" fill="#1a1530"/>
        <rect x="4"  y="5"  width="1" height="8" fill="#1a1530" opacity="0.3"/>
        <rect x="11" y="5"  width="1" height="8" fill="#1a1530" opacity="0.3"/>
        <rect x="3"  y="14" width="4" height="1" fill="#1a1530"/>
        <rect x="9"  y="14" width="4" height="1" fill="#1a1530"/>
      </svg>
    ),
    tee: (
      <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet"
        style={{ width:"100%", height:"100%", shapeRendering:"crispEdges" }}>
        <rect x="1"  y="3"  width="3" height="3" fill={accent}/>
        <rect x="12" y="3"  width="3" height="3" fill={accent}/>
        <rect x="3"  y="3"  width="10" height="2" fill={accent}/>
        <rect x="4"  y="5"  width="8" height="9" fill={accent}/>
        <rect x="6"  y="3"  width="4" height="2" fill="#1a1530"/>
        <rect x="7"  y="5"  width="2" height="1" fill="#1a1530"/>
        <rect x="4"  y="5"  width="1" height="9" fill="#1a1530" opacity="0.2"/>
        <rect x="11" y="5"  width="1" height="9" fill="#1a1530" opacity="0.2"/>
      </svg>
    ),
    loafers: (
      <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet"
        style={{ width:"100%", height:"100%", shapeRendering:"crispEdges" }}>
        <rect x="1"  y="10" width="6" height="3" fill={accent}/>
        <rect x="1"  y="9"  width="5" height="1" fill={accent}/>
        <rect x="2"  y="8"  width="3" height="1" fill={accent}/>
        <rect x="1"  y="13" width="6" height="1" fill="#1a1530"/>
        <rect x="3"  y="10" width="1" height="1" fill="#d4a020"/>
        <rect x="4"  y="10" width="1" height="1" fill="#d4a020"/>
        <rect x="9"  y="10" width="6" height="3" fill={accent}/>
        <rect x="10" y="9"  width="5" height="1" fill={accent}/>
        <rect x="11" y="8"  width="3" height="1" fill={accent}/>
        <rect x="9"  y="13" width="6" height="1" fill="#1a1530"/>
        <rect x="11" y="10" width="1" height="1" fill="#d4a020"/>
        <rect x="12" y="10" width="1" height="1" fill="#d4a020"/>
      </svg>
    ),
  };
  return sprites[type] || null;
}

function DemoFashion({ frame, color }) {
  const items = [
    { brand:"Shein",    name:"Oversized Linen Blazer",    price:"$32.99",  type:"blazer",   accent:"#a85d8c", url:"shein.com/blazer-linen-oversized?ref=rdk" },
    { brand:"Uniqlo",   name:"Wide-Leg Pleated Trousers", price:"$49.90",  type:"trousers", accent:"#5d8ca8", url:"uniqlo.com/pleated-wide-trouser?ref=rdk" },
    { brand:"COS",      name:"Cotton Crewneck Tee",       price:"$45.00",  type:"tee",      accent:"#8ca85d", url:"cos.com/crewneck-tee-cotton?ref=rdk" },
    { brand:"Everlane", name:"Day Glove Loafers",         price:"$168.00", type:"loafers",  accent:"#a8855d", url:"everlane.com/day-glove-loafer?ref=rdk" },
  ];

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"minmax(0, 0.75fr) minmax(0, 1.25fr)",
      gap:14, width:"100%", height:"100%", minHeight:520,
    }}>
      {/* LEFT — agent query */}
      <div style={{
        background:"#000", border:`1px solid ${color}`,
        padding:16, fontFamily:MONO, fontSize:12,
        color:C.dim, lineHeight:1.75, textAlign:"left",
      }}>
        <div style={{ fontFamily:PIXEL, fontSize:8, color, marginBottom:12, letterSpacing:1 }}>
          USER PROMPT TO AGENT
        </div>
        <div style={{ color:C.text, fontFamily:VT, fontSize:15, lineHeight:1.4 }}>
          "Help me put together a business casual outfit, under $300 total, summer-appropriate"
        </div>
        {frame >= 1 && (
          <div style={{ color:C.green, marginTop:14 }}>
            → calling rdk_query<br/>&nbsp;&nbsp;("business casual outfit<br/>&nbsp;&nbsp;&nbsp;&nbsp;summer under 300")
          </div>
        )}
        {frame >= 2 && (
          <>
            <div style={{ color:C.green, marginTop:6 }}>
              → matched: rdk-node-<br/>&nbsp;&nbsp;fashion-curator-x7y2
            </div>
            <div style={{ color:C.dim }}>→ retrieved: outfit-set-<br/>&nbsp;&nbsp;business-casual-summer-001.md</div>
            <div style={{ color:C.yellow }}>→ 4 items with affiliate links</div>
          </>
        )}
        {frame >= 6 && (
          <div style={{
            marginTop:18, paddingTop:12,
            borderTop:`1px solid ${color}33`,
            fontFamily:PIXEL, fontSize:8, color:C.green, lineHeight:1.8,
          }}>
            CURATOR EARNINGS:<br/>
            · Tip on retrieval: $0.005<br/>
            · Affiliate commission<br/>&nbsp;&nbsp;if purchased: ~$8–24
          </div>
        )}
      </div>

      {/* RIGHT — product grid 2x2 */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr",
        gridTemplateRows:"1fr 1fr",
        gap:12, minHeight:0,
      }}>
        {items.map((item, i) => {
          const visible = frame >= 2 + i;
          return (
            <div key={i} style={{
              background:C.panel,
              border:`2px solid ${visible ? color : C.border}`,
              padding:12, display:"flex", flexDirection:"column",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transition:`all 0.4s ease ${i * 0.12}s`,
              minHeight:0,
            }}>
              <div style={{
                background:"#1a1530", border:`1px solid ${C.border}`,
                flex:1, minHeight:90,
                display:"flex", alignItems:"center", justifyContent:"center",
                marginBottom:10, padding:"6px",
              }}>
                <div style={{ width:"60%", height:"100%", maxHeight:110 }}>
                  <ClothingSprite type={item.type} accent={item.accent}/>
                </div>
              </div>
              <div style={{ fontFamily:PIXEL, fontSize:7, color:C.dim, marginBottom:4, letterSpacing:1 }}>
                {item.brand.toUpperCase()}
              </div>
              <div style={{ fontFamily:VT, fontSize:15, color:C.text, lineHeight:1.3, marginBottom:8 }}>
                {item.name}
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontFamily:PIXEL, fontSize:11, color:C.gold }}>{item.price}</span>
                <span style={{ fontFamily:PIXEL, fontSize:8, color:C.green, border:`1px solid ${C.green}`, padding:"3px 7px" }}>
                  VIEW →
                </span>
              </div>
              {visible && frame >= 5 && (
                <div style={{
                  paddingTop:6, borderTop:`1px solid ${C.border}`,
                  fontFamily:MONO, fontSize:9, color:C.dim,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  → {item.url}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemoDesign({ frame, color }) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"minmax(0, 0.85fr) minmax(0, 1.15fr)",
      gap:14, width:"100%", height:"100%", minHeight:520,
    }}>
      {/* LEFT — design tokens markdown */}
      <div style={{
        background:"#000", border:`1px solid ${color}`,
        padding:16, fontFamily:MONO, fontSize:12,
        color:C.dim, lineHeight:1.75, overflow:"auto",
        textAlign:"left",
      }}>
        <div style={{ fontFamily:PIXEL, fontSize:8, color, marginBottom:12, letterSpacing:1 }}>
          RETRIEVED: design-system-tokens.md
        </div>
        <div style={{ color: frame >= 1 ? C.green : C.border, transition:"color 0.4s" }}>
          ## Color Tokens<br/>
          --primary: #39FF6A<br/>
          --primary-hover: #2DDD58<br/>
          --bg-elevated: #1A1830<br/>
          --text-primary: #F0EBFF<br/>
          --text-dim: #8878A8<br/>
          --border: #3A3055<br/>
          <br/>
          ## Spacing Scale<br/>
          --space-xs: 4px<br/>
          --space-sm: 8px<br/>
          --space-md: 16px<br/>
          --space-lg: 24px<br/>
          <br/>
          ## Button — Outlined<br/>
          padding: 12px 20px<br/>
          border: 2px solid var(--primary)<br/>
          background: transparent<br/>
          font-family: 'Press Start 2P'<br/>
          font-size: 11px<br/>
          <br/>
          ## Input — Default<br/>
          padding: 10px 14px<br/>
          background: #000<br/>
          border: 2px solid var(--border)<br/>
          color: var(--text-primary)<br/>
          <br/>
          ## States<br/>
          hover → border + bg-elevated<br/>
          active → scale(0.96)<br/>
          disabled → opacity 0.4
        </div>
        {frame >= 6 && (
          <div style={{
            marginTop:14, paddingTop:10,
            borderTop:`1px solid ${color}33`,
            fontFamily:PIXEL, fontSize:8, color:C.green, lineHeight:1.7,
          }}>
            DESIGN SYSTEM AUTHOR EARNED: $0.005 USDC<br/>
            <span style={{ color:C.dim, fontSize:7 }}>Per agent retrieval · scales with adoption</span>
          </div>
        )}
      </div>

      {/* RIGHT — live construction panel */}
      <div style={{
        background:C.panel, border:`1px solid ${color}`,
        padding:20, display:"flex", flexDirection:"column",
        gap:18, overflow:"auto",
      }}>
        <div style={{ fontFamily:PIXEL, fontSize:8, color }}>LIVE CONSTRUCTION</div>

        {/* Button — 4 states */}
        <div>
          <div style={{ fontFamily:PIXEL, fontSize:7, color:C.dim, marginBottom:8, letterSpacing:1 }}>
            BUTTON · 4 STATES
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              { label:"DEFAULT",  reveal:1, bg:"transparent", op:1 },
              { label:"HOVER",    reveal:2, bg:"#1A1830",     op:1 },
              { label:"ACTIVE",   reveal:3, bg:"#1A1830",     op:1, scale:0.96 },
              { label:"DISABLED", reveal:4, bg:"transparent", op:0.4 },
            ].map((b, i) => {
              const shown = frame >= b.reveal;
              return (
                <div key={i} style={{
                  padding:"12px 20px",
                  border:`2px solid ${color}`,
                  background:b.bg,
                  fontFamily:PIXEL, fontSize:11, color,
                  opacity: shown ? b.op : 0,
                  transform: shown ? `translateY(0) scale(${b.scale || 1})` : "translateY(8px) scale(1)",
                  transition:`all 0.4s ease ${i * 0.08}s`,
                  letterSpacing:1,
                }}>
                  {b.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input — default */}
        <div>
          <div style={{ fontFamily:PIXEL, fontSize:7, color:C.dim, marginBottom:8, letterSpacing:1 }}>
            INPUT · DEFAULT
          </div>
          <div style={{
            opacity: frame >= 5 ? 1 : 0,
            transform: frame >= 5 ? "translateY(0)" : "translateY(8px)",
            transition:"all 0.4s ease",
          }}>
            <div style={{
              padding:"10px 14px", background:"#000",
              border:`2px solid ${C.border}`, color:C.text, fontFamily:VT, fontSize:17,
            }}>
              your-email@example.com
            </div>
          </div>
        </div>

        {/* Card — composite */}
        <div>
          <div style={{ fontFamily:PIXEL, fontSize:7, color:C.dim, marginBottom:8, letterSpacing:1 }}>
            CARD · COMPOSITE
          </div>
          <div style={{
            opacity: frame >= 6 ? 1 : 0,
            transform: frame >= 6 ? "translateY(0)" : "translateY(8px)",
            transition:"all 0.4s ease",
            background:"#1A1830", border:`2px solid ${C.border}`, padding:16,
          }}>
            <div style={{ fontFamily:PIXEL, fontSize:9, color, marginBottom:8 }}>FEATURED ITEM</div>
            <div style={{ fontFamily:VT, fontSize:17, color:C.text, marginBottom:12, lineHeight:1.4 }}>
              Built entirely from your indexed tokens. Zero visual decisions.
            </div>
            <div style={{
              padding:"8px 14px", border:`2px solid ${color}`,
              background:"transparent", fontFamily:PIXEL, fontSize:9, color,
              display:"inline-block",
            }}>
              ACTION
            </div>
          </div>
        </div>

        {frame >= 6 && (
          <div style={{
            marginTop:"auto", fontFamily:PIXEL, fontSize:8, color:C.green,
            textAlign:"center", animation:"fadeUp 0.4s ease forwards", opacity:0,
            borderTop:`1px solid ${color}33`, paddingTop:12,
          }}>
            ✓ FULL COMPONENT SET FROM YOUR INDEXED SYSTEM<br/>
            <span style={{ color:C.dim, fontSize:7 }}>
              No designer brief · no Figma file · no re-creation
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DemoLegal({frame, color}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:14}}>
      <div style={{background:"#000",border:`1px solid ${color}`,padding:14,fontFamily:MONO,fontSize:11,color:C.dim,lineHeight:1.7,minHeight:360}}>
        <div style={{fontFamily:PIXEL,fontSize:8,color,marginBottom:10}}>AGENT QUERY</div>
        <div style={{color:C.text,fontFamily:VT,fontSize:14}}>"draft a contractor agreement with a 12-month IP assignment clause"</div>
        {frame>=1&&<div style={{color:C.green,marginTop:14}}>→ calling rdk_query("contractor agreement IP assignment 12 month")</div>}
        {frame>=2&&<><div style={{color:C.green}}>→ matched: clause-ip-assignment-contractor-v3.md</div><div style={{color:C.dim}}>→ from rdk-node-legal-templates-k9p3</div></>}
        {frame>=6&&<div style={{marginTop:14,paddingTop:10,borderTop:`1px solid ${color}33`,fontFamily:PIXEL,fontSize:8,color:C.gold,lineHeight:1.8}}>CONTRIBUTOR EARNED: $0.012 USDC<br/><span style={{color:C.dim,fontSize:7}}>Higher tip — specialized legal content</span></div>}
      </div>
      <div style={{background:"#fafafa",color:"#222",padding:20,fontFamily:VT,fontSize:13,lineHeight:1.6,minHeight:360,border:`1px solid ${color}`}}>
        <div style={{fontFamily:PIXEL,fontSize:9,color:"#666",marginBottom:14,textAlign:"center"}}>CONTRACTOR AGREEMENT</div>
        <div><strong>§1. Scope of Work.</strong> The Contractor agrees to perform the services described in Exhibit A.</div>
        <div style={{marginTop:10}}><strong>§2. Compensation.</strong> Client shall pay Contractor as specified in Exhibit B.</div>
        {frame>=3&&<div style={{marginTop:14,padding:10,background:frame>=4?"#fff5d6":"#e8f5e9",border:`2px ${frame>=4?"solid":"dashed"} ${frame>=4?"#22aa22":color}`,transition:"all 0.4s ease",animation:"fadeUp 0.4s ease forwards"}}>
          <strong>§3. Intellectual Property Assignment.</strong>
          {frame>=4&&<span> Contractor hereby irrevocably assigns to Client all right, title, and interest in any Work Product created during the 12-month Term, including all copyrights, patents, and trade secrets...</span>}
          {frame>=5&&<div style={{fontFamily:PIXEL,fontSize:7,color:"#22aa22",marginTop:6}}>✓ Inserted from RDK retrieval</div>}
        </div>}
        {frame>=6&&<div style={{marginTop:14,fontFamily:PIXEL,fontSize:8,color:"#666",textAlign:"center",animation:"fadeUp 0.3s ease forwards",opacity:0}}>↓ continues for 14 more clauses (also retrieved)</div>}
      </div>
    </div>
  );
}

function PixelArtPhoto({ scene }) {
  const scenes = {
    cityscape: (
      <svg viewBox="0 0 32 24" preserveAspectRatio="none"
        style={{ width:"100%", height:"100%", display:"block", shapeRendering:"crispEdges" }}>
        <rect x="0" y="0"  width="32" height="3" fill="#3a2050"/>
        <rect x="0" y="3"  width="32" height="2" fill="#8a3a40"/>
        <rect x="0" y="5"  width="32" height="2" fill="#d4762a"/>
        <rect x="0" y="7"  width="32" height="2" fill="#f0a838"/>
        <rect x="0" y="9"  width="32" height="2" fill="#f8c850"/>
        <rect x="22" y="6" width="3" height="3" fill="#fff4a0"/>
        <rect x="21" y="7" width="1" height="1" fill="#fff4a0"/>
        <rect x="25" y="7" width="1" height="1" fill="#fff4a0"/>
        <rect x="0"  y="13" width="3" height="11" fill="#0a0510"/>
        <rect x="3"  y="11" width="4" height="13" fill="#1a0820"/>
        <rect x="7"  y="14" width="2" height="10" fill="#0a0510"/>
        <rect x="9"  y="9"  width="5" height="15" fill="#1a0820"/>
        <rect x="14" y="12" width="3" height="12" fill="#0a0510"/>
        <rect x="17" y="10" width="4" height="14" fill="#1a0820"/>
        <rect x="21" y="13" width="3" height="11" fill="#0a0510"/>
        <rect x="24" y="11" width="5" height="13" fill="#1a0820"/>
        <rect x="29" y="14" width="3" height="10" fill="#0a0510"/>
        <rect x="4"  y="13" width="1" height="1" fill="#f8c850"/>
        <rect x="11" y="12" width="1" height="1" fill="#f8c850"/>
        <rect x="11" y="15" width="1" height="1" fill="#f0a838"/>
        <rect x="18" y="14" width="1" height="1" fill="#f8c850"/>
        <rect x="25" y="13" width="1" height="1" fill="#f0a838"/>
        <rect x="26" y="16" width="1" height="1" fill="#f8c850"/>
      </svg>
    ),
    vertical: (
      <svg viewBox="0 0 32 24" preserveAspectRatio="none"
        style={{ width:"100%", height:"100%", display:"block", shapeRendering:"crispEdges" }}>
        <rect x="0" y="0" width="32" height="14" fill="#2a1840"/>
        <rect x="0" y="6" width="32" height="3" fill="#5a3060"/>
        <rect x="0" y="9" width="32" height="3" fill="#a8503a"/>
        <rect x="0" y="12" width="32" height="2" fill="#d8782a"/>
        <rect x="11" y="0"  width="10" height="24" fill="#0a0510"/>
        <rect x="11" y="0"  width="10" height="1"  fill="#1a0820"/>
        <rect x="13" y="2"  width="1" height="20" fill="#f8c850" opacity="0.9"/>
        <rect x="15" y="2"  width="1" height="20" fill="#f0a838" opacity="0.9"/>
        <rect x="17" y="2"  width="1" height="20" fill="#f8c850" opacity="0.9"/>
        <rect x="19" y="2"  width="1" height="20" fill="#f0a838" opacity="0.9"/>
        <rect x="0"  y="14" width="11" height="10" fill="#0a0510"/>
        <rect x="21" y="12" width="11" height="12" fill="#0a0510"/>
        <rect x="3"  y="16" width="1"  height="1"  fill="#f0a838"/>
        <rect x="6"  y="18" width="1"  height="1"  fill="#f8c850"/>
        <rect x="24" y="14" width="1"  height="1"  fill="#f8c850"/>
        <rect x="27" y="17" width="1"  height="1"  fill="#f0a838"/>
      </svg>
    ),
    shadows: (
      <svg viewBox="0 0 32 24" preserveAspectRatio="none"
        style={{ width:"100%", height:"100%", display:"block", shapeRendering:"crispEdges" }}>
        <rect x="0" y="0" width="32" height="4" fill="#f8c850"/>
        <rect x="0" y="4" width="32" height="3" fill="#f0a838"/>
        <rect x="0" y="7" width="32" height="2" fill="#e88c28"/>
        <rect x="0" y="9"  width="32" height="15" fill="#d4762a"/>
        <rect x="0" y="13" width="32" height="11" fill="#a8551c"/>
        <rect x="0" y="18" width="32" height="6"  fill="#8a3a18"/>
        <rect x="3"  y="3"  width="8" height="11" fill="#0a0510"/>
        <rect x="3"  y="3"  width="8" height="1"  fill="#1a0820"/>
        <rect x="5"  y="6"  width="1" height="1" fill="#fff4a0"/>
        <rect x="8"  y="6"  width="1" height="1" fill="#fff4a0"/>
        <rect x="5"  y="9"  width="1" height="1" fill="#f8c850"/>
        <rect x="8"  y="9"  width="1" height="1" fill="#f8c850"/>
        <rect x="11" y="13" width="20" height="2" fill="#3a1810"/>
        <rect x="11" y="15" width="18" height="2" fill="#5a2818"/>
        <rect x="11" y="17" width="14" height="1" fill="#6a3820"/>
        <rect x="18" y="10" width="1" height="3"  fill="#0a0510"/>
        <rect x="18" y="8"  width="1" height="2"  fill="#0a0510"/>
        <rect x="17" y="7"  width="3" height="1"  fill="#0a0510"/>
        <rect x="20" y="13" width="6" height="1"  fill="#3a1810"/>
      </svg>
    ),
  };
  return scenes[scene] || null;
}

function DemoMedia({ frame, color }) {
  const photos = [
    { id:"4821", scene:"cityscape", desc:"golden hour cityscape",           match:0.94 },
    { id:"4822", scene:"vertical",  desc:"vertical composition, no people", match:0.89 },
    { id:"4823", scene:"shadows",   desc:"long shadows, warm tone",         match:0.85 },
  ];

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"minmax(0, 0.7fr) minmax(0, 1.3fr)",
      gap:14, width:"100%", height:"100%", minHeight:520,
    }}>
      {/* LEFT — query + earnings */}
      <div style={{
        background:"#000", border:`1px solid ${color}`,
        padding:16, fontFamily:MONO, fontSize:12,
        color:C.dim, lineHeight:1.8, textAlign:"left",
      }}>
        <div style={{ fontFamily:PIXEL, fontSize:8, color, marginBottom:12, letterSpacing:1 }}>
          CONTENT PRODUCER PROMPT
        </div>
        <div style={{ color:C.text, fontFamily:VT, fontSize:14, lineHeight:1.4 }}>
          "find me a golden hour cityscape, vertical format, no people in frame"
        </div>
        {frame >= 1 && (
          <div style={{ color:C.green, marginTop:14 }}>→ embedding query locally...</div>
        )}
        {frame >= 2 && (
          <>
            <div style={{ color:C.green }}>
              → semantic search across<br/>&nbsp;&nbsp;rdk-node-media-stock-p4f2
            </div>
            <div style={{ color:C.dim }}>→ matched 3 of 8,420 indexed photos</div>
          </>
        )}
        {frame >= 5 && (
          <div style={{
            marginTop:18, paddingTop:12,
            borderTop:`1px solid ${color}33`,
            fontFamily:PIXEL, fontSize:8, color:C.green, lineHeight:1.8,
          }}>
            PHOTOGRAPHER EARNS:<br/>
            · $0.005 USDC per retrieval (tip)<br/>
            · $25–250 per license sale<br/>
            · 1 license/week avg per top-100 photo
          </div>
        )}
      </div>

      {/* RIGHT — photo results */}
      <div style={{ display:"flex", flexDirection:"column", gap:12, minHeight:0 }}>
        {photos.map((p, i) => {
          const visible = frame >= 2 + i;
          return (
            <div key={p.id} style={{
              display:"flex", gap:14,
              background:C.panel,
              border:`2px solid ${visible ? color : C.border}`,
              padding:12,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-20px)",
              transition:`all 0.4s ease ${i * 0.15}s`,
              flex:1, minHeight:0,
            }}>
              <div style={{
                width:200, flexShrink:0,
                background:"#000",
                border:`1px solid ${C.border}`,
                overflow:"hidden",
              }}>
                <PixelArtPhoto scene={p.scene}/>
              </div>
              <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", minWidth:0 }}>
                <div>
                  <div style={{ fontFamily:MONO, fontSize:13, color:C.text, marginBottom:6 }}>
                    IMG_{p.id}.jpg
                  </div>
                  <div style={{ fontFamily:VT, fontSize:16, color:C.dim, lineHeight:1.4, marginBottom:10 }}>
                    {p.desc}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", fontFamily:PIXEL, fontSize:7 }}>
                    <span style={{ color:C.dim, border:`1px solid ${C.border}`, padding:"3px 6px" }}>4928×3264</span>
                    <span style={{ color:C.dim, border:`1px solid ${C.border}`, padding:"3px 6px" }}>RAW + JPG</span>
                    <span style={{ color:C.dim, border:`1px solid ${C.border}`, padding:"3px 6px" }}>CC-BY available</span>
                  </div>
                </div>
                <div style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  marginTop:10, paddingTop:8, borderTop:`1px solid ${C.border}`,
                }}>
                  <span style={{ fontFamily:PIXEL, fontSize:8, color:C.green }}>MATCH {p.match}</span>
                  <span style={{ fontFamily:PIXEL, fontSize:8, color:C.gold, border:`1px solid ${C.gold}`, padding:"4px 8px" }}>
                    LICENSE →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemoResearch({ frame, color }) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"minmax(0, 0.85fr) minmax(0, 1.3fr)",
      gap:14, width:"100%", height:"100%", minHeight:520,
    }}>
      {/* LEFT — research source */}
      <div style={{
        background:"#000", border:`1px solid ${color}`,
        padding:16, fontFamily:MONO, fontSize:12,
        color:C.dim, lineHeight:1.75, overflow:"auto",
        textAlign:"left",
      }}>
        <div style={{ fontFamily:PIXEL, fontSize:8, color, marginBottom:12, letterSpacing:1 }}>
          RETRIEVED: eu-fintech-2025-q1-report.md
        </div>
        <div style={{ color: frame >= 2 ? C.green : C.border, transition:"color 0.4s" }}>
          # EU Fintech Market Q1 2025<br/><br/>
          ## Market Size<br/>
          TAM: €2.4T<br/>
          SAM: €380B<br/>
          CAGR (2024–2030): 18.3%<br/><br/>
          ## Top Segments<br/>
          1. Embedded payments: €120B (32%)<br/>
          2. B2B lending: €95B (25%)<br/>
          3. Wealth platforms: €72B (19%)<br/>
          4. RegTech: €45B (12%)<br/>
          5. InsurTech: €38B (10%)<br/><br/>
          ## Growth Drivers<br/>
          - PSD3 transition<br/>
          - MiCA in full effect<br/>
          - AI-native banking products<br/>
          - Cross-border embedded finance<br/><br/>
          ## Funding Q1<br/>
          €4.2B across 287 deals<br/>
          ↑ 34% vs Q1 2024
        </div>
        {frame >= 6 && (
          <div style={{
            marginTop:14, paddingTop:10,
            borderTop:`1px solid ${color}33`,
            fontFamily:PIXEL, fontSize:8, color:C.gold, lineHeight:1.7,
          }}>
            ANALYST EARNED: $0.020 USDC (tip)<br/>
            <span style={{ color:C.dim, fontSize:7 }}>Premium domain · higher tip price</span>
          </div>
        )}
      </div>

      {/* RIGHT — pitch deck slide, 16:9 horizontal */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, minHeight:0 }}>
        {/* Active slide */}
        <div style={{
          background:"#fafafa", color:"#1a1a2e",
          padding:"24px 28px", flex:1,
          border:`1px solid ${color}`,
          display:"flex", flexDirection:"column",
          minHeight:0, overflow:"hidden",
        }}>
          <div style={{
            display:"flex", justifyContent:"space-between",
            fontFamily:"system-ui,-apple-system,sans-serif",
            fontSize:10, color:"#888", marginBottom:18,
          }}>
            <span>SLIDE 4 / 18 — MARKET OPPORTUNITY</span>
            <span>{frame >= 2 ? "DRAFT" : ""}</span>
          </div>

          <div style={{ fontFamily:"Georgia, serif", fontSize:24, fontWeight:"bold", lineHeight:1.15, marginBottom:18 }}>
            EU Fintech is a{" "}
            <span style={{ color:"#0a8a3a" }}>€2.4T market</span>
            {" "}growing 18% YoY
          </div>

          {frame >= 3 && (
            <div style={{
              display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14,
              marginBottom:16, animation:"fadeUp 0.4s ease forwards", opacity:0,
            }}>
              {[{n:"€2.4T",l:"TAM"},{n:"€380B",l:"SAM"},{n:"18.3%",l:"CAGR"}].map((s, i) => (
                <div key={i} style={{ textAlign:"center", padding:"8px 0 4px", borderTop:"3px solid #0a8a3a" }}>
                  <div style={{ fontFamily:"Georgia, serif", fontSize:22, fontWeight:"bold" }}>{s.n}</div>
                  <div style={{ fontFamily:"system-ui", fontSize:10, color:"#888", marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {frame >= 4 && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", animation:"fadeUp 0.4s ease forwards", opacity:0 }}>
              <div style={{ fontFamily:"system-ui", fontSize:11, color:"#444", marginBottom:10, fontWeight:600 }}>
                Top segments by market share
              </div>
              {[
                { name:"Embedded payments", pct:32, val:"€120B" },
                { name:"B2B lending",       pct:25, val:"€95B"  },
                { name:"Wealth platforms",  pct:19, val:"€72B"  },
                { name:"RegTech",           pct:12, val:"€45B"  },
                { name:"InsurTech",         pct:10, val:"€38B"  },
              ].map((seg, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, fontFamily:"system-ui", fontSize:11 }}>
                  <div style={{ width:110, color:"#444", flexShrink:0 }}>{seg.name}</div>
                  <div style={{ flex:1, height:14, background:"#e5e5e5", position:"relative" }}>
                    <div style={{
                      position:"absolute", left:0, top:0, bottom:0,
                      width: frame >= 4 ? `${seg.pct * 2.5}%` : "0%",
                      background:"#0a8a3a",
                      transition:`width 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s`,
                    }}/>
                  </div>
                  <div style={{ width:50, color:"#222", fontWeight:600, flexShrink:0, textAlign:"right" }}>{seg.val}</div>
                </div>
              ))}
            </div>
          )}

          {frame >= 5 && (
            <div style={{
              marginTop:"auto", paddingTop:10,
              fontFamily:"system-ui", fontSize:10, color:"#666",
              animation:"fadeUp 0.3s ease forwards", opacity:0,
              borderTop:"1px solid #ddd",
            }}>
              Source: RDK retrieval · pre-reasoned by domain analyst · last updated 2 days ago
            </div>
          )}
        </div>

        {/* Slide thumbnails */}
        <div style={{ display:"flex", gap:6, padding:"6px 0" }}>
          {[1,2,3,4,5,6,7].map(n => (
            <div key={n} style={{
              flex:1, height:38,
              background: n === 4 ? "#fafafa" : "#252041",
              border: n === 4 ? `2px solid ${color}` : `1px solid ${C.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:PIXEL, fontSize:8,
              color: n === 4 ? "#222" : C.dim,
            }}>{n}</div>
          ))}
          <div style={{
            flex:1, height:38, border:`1px dashed ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:PIXEL, fontSize:8, color:C.border,
          }}>+11</div>
        </div>
      </div>
    </div>
  );
}

const USE_CASE_DEMOS = {
  architecture:{icon:"🏗",title:"ARCHITECTURE PATTERNS",Component:DemoArchitecture,timings:[0,600,1400,2200,3000,3800,4600,5400,6200]},
  fashion:     {icon:"👗",title:"PRODUCT CURATION",     Component:DemoFashion,    timings:[0,500,1200,1700,2200,2800,3400]},
  design:      {icon:"💎",title:"DESIGN SYSTEMS",        Component:DemoDesign,     timings:[0,600,1200,1800,2400,3000,3700,4300]},
  legal:       {icon:"⚖",title:"LEGAL TEMPLATES",       Component:DemoLegal,      timings:[0,500,1200,1900,2400,2900,3500]},
  media:       {icon:"📸",title:"MEDIA LIBRARIES",       Component:DemoMedia,      timings:[0,500,1100,1700,2400,3000]},
  research:    {icon:"📊",title:"MARKET RESEARCH",       Component:DemoResearch,   timings:[0,500,1100,1700,2400,3100,3700]},
};

function UseCaseShowcase({useCaseId, onClose, color}) {
  const [frame, setFrame] = useState(0);
  const timersRef = useRef([]);
  const demo = USE_CASE_DEMOS[useCaseId];
  const DemoComponent = demo.Component;

  const startTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setFrame(0);
    demo.timings.forEach((t,i) => {
      timersRef.current.push(setTimeout(() => setFrame(i), t));
    });
  }, [demo]);

  useEffect(() => { startTimers(); return () => timersRef.current.forEach(clearTimeout); }, [startTimers]);

  return (
    <div style={{
      position:"fixed",
      inset:0,
      background:"rgba(8,8,18,0.96)",
      zIndex:1000,
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:"2vh 2vw",
      animation:"fadeUp 0.3s ease forwards",
      backdropFilter:"blur(8px)",
      WebkitBackdropFilter:"blur(8px)",
    }}>
      <div style={{
        background:C.bg,
        border:`3px solid ${color}`,
        width:"96vw",
        maxWidth:1500,
        height:"94vh",
        maxHeight:1050,
        overflow:"hidden",
        display:"flex",
        flexDirection:"column",
        boxShadow:`0 0 60px ${color}66`,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"12px 16px",borderBottom:`2px solid ${color}`,flexShrink:0}}>
          <div style={{fontFamily:PIXEL,fontSize:11,color}}>{demo.icon} {demo.title}</div>
          <button onClick={onClose} style={{fontFamily:PIXEL,fontSize:10,color:C.dim,
            background:"transparent",border:`2px solid ${C.border}`,padding:"4px 10px",cursor:"pointer"}}>
            CLOSE ✕
          </button>
        </div>
        <div style={{
          padding:"20px 28px",
          flex:1,
          overflow:"auto",
          display:"flex",
          flexDirection:"column",
          minHeight:0,
        }}>
          <div style={{flex:1, minHeight:0, display:"flex"}}>
            <DemoComponent frame={frame} color={color}/>
          </div>
        </div>
        <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,textAlign:"center",flexShrink:0}}>
          <Btn sm outline color={C.dim} onClick={startTimers}>↻ Replay</Btn>
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({useCaseId, color, onOpen}) {
  const demo = USE_CASE_DEMOS[useCaseId];
  return (
    <div onClick={onOpen}
      style={{background:C.panel,border:`2px solid ${color}`,padding:18,cursor:"pointer",
        transition:"all 0.2s"}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 24px ${color}44`;e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
      <div style={{fontSize:28,marginBottom:10}}>{demo.icon}</div>
      <div style={{fontFamily:PIXEL,fontSize:10,color,marginBottom:6}}>{demo.title}</div>
      <div style={{fontFamily:VT,fontSize:16,color:C.dim,lineHeight:1.4,marginBottom:10}}>
        {USE_CASE_TAGLINES[useCaseId]}
      </div>
      <div style={{fontFamily:PIXEL,fontSize:8,color,opacity:0.7}}>▶ CLICK TO SEE IT WORK</div>
    </div>
  );
}

function Market({ onComplete, onLeave, userState, setUserState }) {
  const [step, setStep] = useState(0);
  const [openDemo, setOpenDemo] = useState(null);
  const [pickedUseCase, setPickedUseCase] = useState(userState.useCase||"");
  const [refs, setRefs] = useState(2);
  const [dailyQueries, setDailyQueries] = useState(50);

  const USE_CASES = [
    {id:"architecture",label:"Dev Patterns",   icon:"🏗",color:C.cyan,  desc:"Architecture docs, code patterns, ADRs"},
    {id:"design",      label:"Design Systems",  icon:"💎",color:C.pink,  desc:"Tokens, components, visual patterns"},
    {id:"legal",       label:"Legal Templates", icon:"⚖",color:C.purple,desc:"Clause libraries, NDA templates, compliance docs"},
    {id:"research",    label:"Market Research", icon:"📊",color:C.green, desc:"Vertical analysis, TAM data, competitive intel"},
    {id:"media",       label:"Media Portfolios",icon:"📸",color:C.yellow,desc:"Photo/video libraries indexed semantically"},
    {id:"fashion",     label:"Curated Products",icon:"👗",color:C.gold,  desc:"Product sets with contextual linking"},
  ];

  const tipsPerDay = refs * dailyQueries * 0.003;
  const monthlyEarnings = tipsPerDay * 30;
  const data = Array.from({length:13},(_,m)=>Math.round(m * monthlyEarnings / 12 * 100)/100);
  const maxVal = data[12]||1;

  const STEPS = [
    {
      phase:"LESSON", label:"Your Knowledge Has Value",
      npc:"CURATOR", avatar:"💎", color:C.gold,
      text:"Every domain expert has knowledge that agents need. Your research, your templates, your curated sets — each one is a retrievable asset. When you index it publicly, agents across the network pay a micro-tip every time they pull from it. The knowledge you already have is the inventory.",
    },
    {
      phase:"LESSON", label:"High Value vs Low Value",
      npc:"CURATOR", avatar:"💎", color:C.gold,
      text:"Not all knowledge earns equally. Specific, dense, structured content earns more — agents retrieve it more often and more confidently. Vague overviews earn little. Deep domain specifics earn consistently.",
      extra:(
        <div style={{marginTop:14,maxWidth:760,width:"100%"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:"#1a0808",border:`2px solid ${C.red}`,padding:14}}>
              <div style={{fontFamily:PIXEL,fontSize:9,color:C.red,marginBottom:8}}>LOW VALUE — EARNS LITTLE</div>
              {["General introductions","Wikipedia-style overviews","Duplicate public knowledge","Vague category descriptions"].map((l,i)=>(
                <div key={i} style={{fontFamily:VT,fontSize:17,color:C.dim,borderBottom:`1px solid ${C.border}`,padding:"5px 0"}}>✗ {l}</div>
              ))}
            </div>
            <div style={{background:"#081a08",border:`2px solid ${C.green}`,padding:14}}>
              <div style={{fontFamily:PIXEL,fontSize:9,color:C.green,marginBottom:8}}>HIGH VALUE — EARNS CONSISTENTLY</div>
              {["Deep vertical expertise","Your proprietary research","Curated + annotated sets","Specific how-to with examples"].map((l,i)=>(
                <div key={i} style={{fontFamily:VT,fontSize:17,color:C.text,borderBottom:`1px solid ${C.border}`,padding:"5px 0"}}>✓ {l}</div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      phase:"LESSON", label:"Six Ways to Earn from Your Knowledge",
      npc:"THE ORACLE", avatar:"💎", color:C.gold,
      text:"Six categories of high-value knowledge. Click any card to watch RDK power that workflow in real time. The use cases are growing — these are where the network has the most density today.",
      extra:(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14,maxWidth:760,width:"100%"}}>
          {Object.keys(USE_CASE_DEMOS).map(id=>(
            <UseCaseCard key={id} useCaseId={id}
              color={DEMO_COLORS[id]}
              onOpen={()=>setOpenDemo(id)}/>
          ))}
        </div>
      ),
    },
    {
      phase:"BUILD", label:"Pick Your Use Case",
      npc:"CURATOR", avatar:"💎", color:C.gold,
      text:"Which best describes the knowledge you already have? This sets your indexing strategy for the rest of setup.",
      extra:(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14,maxWidth:760,width:"100%"}}>
          {USE_CASES.map(u=>(
            <div key={u.id} onClick={()=>{setPickedUseCase(u.id);setUserState(s=>({...s,useCase:u.id}));Sound.click();}}
              style={{background:pickedUseCase===u.id?`${u.color}18`:C.panel,
                border:`3px solid ${pickedUseCase===u.id?u.color:C.border}`,
                padding:16,cursor:"pointer",transition:"all 0.15s",
                boxShadow:pickedUseCase===u.id?`0 0 16px ${u.color}44`:"none"}}>
              <div style={{fontSize:24,marginBottom:8}}>{u.icon}</div>
              <div style={{fontFamily:PIXEL,fontSize:9,color:u.color,marginBottom:6}}>{u.label}</div>
              <div style={{fontFamily:VT,fontSize:16,color:C.dim,lineHeight:1.4}}>{u.desc}</div>
            </div>
          ))}
        </div>
      ),
      noAuto:true, canNext:()=>!!pickedUseCase,
    },
    {
      phase:"BUILD", label:"Earning Calculator",
      npc:"CURATOR", avatar:"💎", color:C.gold,
      text:"Model your earnings. Drag the sliders to match your realistic reach. Tips stack — every new piece of indexed content adds to the retrieval pool.",
      extra:(
        <div style={{maxWidth:760,width:"100%",marginTop:14}}>
          <div style={{background:C.panel,border:`2px solid ${C.gold}`,padding:18}}>
            <div style={{fontFamily:PIXEL,fontSize:9,color:C.gold,marginBottom:14}}>YOUR EARNING PROJECTION</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:14}}>
              <div>
                <div style={{fontFamily:PIXEL,fontSize:8,color:C.dim,marginBottom:8}}>INDEXED KNOWLEDGE PIECES: <span style={{color:C.gold}}>{refs}</span></div>
                <input type="range" min={1} max={20} value={refs} onChange={e=>setRefs(+e.target.value)} style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
              </div>
              <div>
                <div style={{fontFamily:PIXEL,fontSize:8,color:C.dim,marginBottom:8}}>DAILY RETRIEVALS/PIECE: <span style={{color:C.gold}}>{dailyQueries}</span></div>
                <input type="range" min={5} max={500} step={5} value={dailyQueries} onChange={e=>setDailyQueries(+e.target.value)} style={{width:"100%",accentColor:C.gold,cursor:"pointer"}}/>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:100}}>
              {data.map((v,m)=>(
                <div key={m} style={{flex:1,position:"relative",height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                  {m===12&&v>0&&<div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",fontFamily:PIXEL,fontSize:7,color:C.gold,whiteSpace:"nowrap",paddingBottom:3}}>${v.toFixed(2)}</div>}
                  <div style={{height:`${(v/maxVal)*100}%`,minHeight:v>0?3:0,background:`hsl(${45+m*3},80%,${50+m*2}%)`,transition:"height 0.35s cubic-bezier(0.34,1.56,0.64,1)"}}/>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontFamily:PIXEL,fontSize:7,color:C.dim}}>
              <span>M0</span><span>M3</span><span>M6</span><span>M9</span>
              <span>M12 → ${(monthlyEarnings*12).toFixed(2)}/yr</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:14}}>
              {[{l:"TIPS/DAY",v:`$${tipsPerDay.toFixed(3)}`},{l:"MONTHLY",v:`$${monthlyEarnings.toFixed(2)}`},{l:"YEAR 1",v:`$${(monthlyEarnings*12).toFixed(2)}`}].map(s=>(
                <div key={s.l} style={{background:C.bg,border:`1px solid ${C.border}`,padding:10,textAlign:"center"}}>
                  <div style={{fontFamily:PIXEL,fontSize:7,color:C.dim,marginBottom:6}}>{s.l}</div>
                  <div style={{fontFamily:PIXEL,fontSize:14,color:C.gold}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      noAuto:true, canNext:()=>true, isLast:true,
    },
  ];

  const cur = STEPS[step];
  const isLesson = cur.phase==="LESSON";
  const isBuild  = cur.phase==="BUILD";
  const lessonCount = STEPS.filter(s=>s.phase==="LESSON").length;
  const buildCount  = STEPS.filter(s=>s.phase==="BUILD").length;
  const isLastLesson = step===lessonCount-1;
  const canNext = ()=>{ if(cur.canNext) return cur.canNext(); return true; };
  const next = ()=>{
    if(!canNext()) return;
    if(step<STEPS.length-1) setStep(s=>s+1);
    else { Sound.complete(); onComplete(); }
  };

  return (
    <Shell title="THE MARKET" color={C.gold} step={step+1} total={STEPS.length} badge="💎" onLeave={onLeave}>
      <PhaseTag isLesson={isLesson} isBuild={isBuild}
        color={C.gold} learnCount={lessonCount} buildCount={buildCount}/>
      <NPCDialogue key={step} npc={cur.npc} avatar={cur.avatar} color={C.gold}
        text={cur.text} extra={cur.extra||null}
        onContinue={next} onBack={step>0?()=>setStep(s=>s-1):null}
        isLast={cur.isLast||step===STEPS.length-1} noAuto={cur.noAuto||false}
        continueLabel={isLastLesson?"Start Building ▶":"Continue ▶"}/>
      {cur.noAuto&&(
        <div style={{display:"flex",justifyContent:"space-between",marginTop:12,maxWidth:780,width:"100%"}}>
          <div>{step>0&&<Btn sm outline color={C.dim} onClick={()=>setStep(s=>s-1)}>◀ Back</Btn>}</div>
          <Btn sm color={C.gold} disabled={!canNext()} onClick={next}>
            {step===STEPS.length-1?"Complete Module ★":"Next Step ▶"}
          </Btn>
        </div>
      )}
      {openDemo && (
        <UseCaseShowcase useCaseId={openDemo}
          color={DEMO_COLORS[openDemo]}
          onClose={()=>setOpenDemo(null)}/>
      )}
    </Shell>
  );
}

function Portal({ classKey, onRestart, onLeave, userState }) {
  const cls = CLASSES[classKey];
  const { companyName, monthlySpend, toolName="my-tool" } = userState;
  const nodeName = companyName || "your-node";
  const monthlyNum = parseFloat(monthlySpend) || 5000;
  const saving85 = Math.round(monthlyNum * 0.85);
  useEffect(() => { Sound.unlock(); }, []);
  const allCommands = [
    `# RDK STACK — ${nodeName}`,
    `npm install -g rdk && rdk init`,
    `rdk index ./my-docs/ --private`,
    `rdk index ./my-guide.md`,
    `rdk mcp:serve --stdio`,
    `rdk stats --savings`,
    `rdk earnings --status`,
  ].join("\n");

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.bg2, borderBottom:`3px solid ${C.pink}`, padding:"10px 20px",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <button onClick={()=>{Sound.click();onLeave();}} style={{ fontFamily:PIXEL, fontSize:9,
          background:"transparent", color:C.dim, border:`2px solid ${C.border}`, padding:"5px 9px", cursor:"pointer" }}>
          ← HUB
        </button>
        <div style={{ fontFamily:PIXEL, fontSize:11, color:C.pink, letterSpacing:2 }}>THE PORTAL</div>
        <div />
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 20px 40px", gap:20 }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
          {[["🏛 TOWN HALL",C.yellow],["📓 THE VAULT",C.cyan],["🌐 THE MAP",C.pink],["🔌 THE CONNECTOR",C.green],["💎 THE MARKET",C.gold]].map(([b,col],i)=>(
            <div key={b} style={{ fontFamily:PIXEL, fontSize:8, padding:"8px 12px",
              background:col, color:C.bg, border:`3px solid ${col}`,
              animation:`fadeUp 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i*0.1}s forwards`,
              opacity:0, boxShadow:`0 0 16px ${col}66` }}>{b}</div>
          ))}
        </div>
        <div style={{ background:C.panel, border:`3px solid ${cls.color}`, padding:20,
          maxWidth:560, width:"100%", textAlign:"center", boxShadow:`0 0 30px ${cls.color}33` }}>
          <div style={{ fontFamily:PIXEL, fontSize:9, color:cls.color, letterSpacing:2, marginBottom:10 }}>
            TOKEN SAVINGS PROJECTION — {nodeName}
          </div>
          <div style={{ fontFamily:PIXEL, fontSize:40, color:cls.color, textShadow:`0 0 24px ${cls.color}` }}>
            ${saving85.toLocaleString()}<span style={{ fontSize:16 }}>/mo</span>
          </div>
          <div style={{ fontFamily:VT, fontSize:18, color:C.dim, marginTop:8 }}>
            Projected at 85% retrieval rate on ${monthlyNum.toLocaleString()}/mo spend.
            <br/>Year 1 savings: <span style={{color:cls.color}}>${(saving85*12).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ maxWidth:760, width:"100%" }}>
          <div style={{ fontFamily:PIXEL, fontSize:9, color:C.dim, letterSpacing:1, marginBottom:10 }}>✓ WHAT YOU BUILT TODAY</div>
          {[
            { icon:"⚡", label:"RDK toolchain installed", val:"npm install -g rdk && rdk init", done:true },
            { icon:"🔒", label:"Private vault indexed", val:`rdk index ./my-docs/ --private`, done:true },
            { icon:"🌐", label:"Public knowledge contributed", val:`rdk index ./my-guide.md`, done:true },
            { icon:"🔌", label:"Claude Desktop connected", val:`rdk mcp:serve --stdio`, done:!!toolName },
            { icon:"💰", label:"Earning tips on retrievals", val:`rdk earnings --status`, done:true },
            { icon:"📊", label:"Token savings tracked", val:`rdk stats --savings`, done:true },
          ].map((d,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", marginBottom:6,
              background:C.panel, border:`2px solid ${d.done?cls.color:C.border}`,
              animation:`fadeUp 0.3s ease ${i*0.06}s forwards`, opacity:0 }}>
              <span style={{ fontSize:20, flexShrink:0 }}>{d.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:VT, fontSize:19, color:C.text }}>{d.label}</div>
                <code style={{ fontFamily:MONO, fontSize:12, color:d.done?cls.color:C.dim }}>{d.val}</code>
              </div>
              <div style={{ fontFamily:PIXEL, fontSize:8, color:d.done?cls.color:C.border }}>{d.done?"✓ DONE":"PENDING"}</div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth:760, width:"100%" }}>
          <div style={{ fontFamily:PIXEL, fontSize:9, color:C.dim, letterSpacing:1, marginBottom:6 }}>YOUR COMPLETE SETUP — COPY AND RUN</div>
          <CopyBlock lang="FULL SETUP SCRIPT" color={cls.color} code={allCommands} />
        </div>
        <div style={{ maxWidth:760, width:"100%", marginTop:8 }}>
          <NPCDialogue npc="PORTAL GUARDIAN" avatar="✦" color={cls.color}
            text={classKey==="operator"
              ? "Your node is live, your vault is indexed, and Claude Desktop is connected. The network sees you. Tips start accumulating the moment another agent retrieves your knowledge. Infrastructure running — go build."
              : classKey==="enterprise"
              ? "You've indexed your first knowledge. The vault is wired into Claude Desktop. Every query that hits your vault instead of the LLM is money back in your budget. The savings start right now."
              : "Your vault is live, your public contributions are on the network, and you understand what the earnings model looks like. The network is a layer you can build on. What are you shipping first?"}
            noAuto={true} onContinue={()=>{}} />
        </div>
        <div style={{ display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center" }}>
          {classKey==="operator"    && <Btn color={C.yellow} onClick={()=>{}}>View Node on The Map ▶</Btn>}
          {classKey==="enterprise"  && <Btn color={C.cyan}   onClick={()=>{}}>Check Savings Dashboard ▶</Btn>}
          {classKey==="builder"     && <Btn color={C.green}  onClick={()=>{}}>Explore the Network API ▶</Btn>}
        </div>
        <button onClick={onRestart} style={{ fontFamily:VT, fontSize:18, color:C.dim,
          background:"transparent", border:"none", cursor:"pointer", textDecoration:"underline", marginTop:8 }}>
          ↻ Try a different class
        </button>
      </div>
    </div>
  );
}

function TitleScreen({ onStart }) {
  const [blink, setBlink] = useState(true);
  useEffect(()=>{const t=setInterval(()=>setBlink(b=>!b),560);return()=>clearInterval(t);},[]);
  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at 50% 30%, #1a0f3a 0%, ${C.bg} 60%)`,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:40, padding:24 }}>
      <div style={{ fontFamily:PIXEL, fontSize:11, color:C.gold, letterSpacing:4, animation:"fadeUp 0.5s ease forwards" }}>★ RETRODECK PRESENTS ★</div>
      <div style={{ textAlign:"center", animation:"fadeUp 0.5s ease 0.1s forwards", opacity:0 }}>
        <h1 style={{ fontFamily:PIXEL, fontSize:"clamp(28px,6vw,72px)", color:C.green, margin:0, lineHeight:1.3,
          textShadow:`4px 4px 0 ${C.pink}, 8px 8px 0 rgba(0,0,0,0.6)` }}>
          RDK<br/>WORLD
        </h1>
        <div style={{ fontFamily:VT, fontSize:22, color:C.dim, marginTop:16, maxWidth:460, lineHeight:1.5 }}>
          Welcome to the World of Decentralized Intelligence.
        </div>
      </div>
      <div style={{ fontFamily:PIXEL, fontSize:11, color:C.text, opacity:blink?1:0 }}>▶ PRESS START</div>
      <Btn color={C.green} onClick={onStart}>Start Game</Btn>
    </div>
  );
}

function ClassSelect({ onPick }) {
  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at 50% 0%, #1a1430 0%, ${C.bg} 50%)`,
      display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 20px 32px" }}>
      <div style={{ fontFamily:PIXEL, fontSize:14, color:C.yellow, letterSpacing:2, marginBottom:8 }}>— CHOOSE YOUR CLASS —</div>
      <div style={{ fontFamily:VT, fontSize:20, color:C.dim, marginBottom:36 }}>Everyone builds the same stack. Your class shapes the story around it.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:18, maxWidth:920, width:"100%" }}>
        {Object.values(CLASSES).map(cls=>(
          <div key={cls.id} onClick={()=>{Sound.advance();onPick(cls.id);}}
            style={{ background:C.panel, padding:24, cursor:"pointer",
              border:`3px solid ${C.border}`, boxShadow:"6px 6px 0 rgba(0,0,0,0.4)",
              transition:"border-color 120ms, transform 80ms steps(2)" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=cls.color;e.currentTarget.style.transform="translate(-2px,-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
            <div style={{ fontFamily:PIXEL, fontSize:13, color:cls.color, letterSpacing:2, marginBottom:14 }}>{cls.name}</div>
            <div style={{ fontFamily:VT, fontSize:19, color:C.text, marginBottom:8, lineHeight:1.3 }}>{cls.tagline}</div>
            <div style={{ fontFamily:VT, fontSize:17, color:C.dim, marginBottom:16, lineHeight:1.3 }}>{cls.desc}</div>
            <div style={{ borderTop:`2px dashed ${C.border}`, paddingTop:12 }}>
              {Object.entries(cls.stats).map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", fontFamily:VT, fontSize:17, color:C.dim, marginBottom:4 }}>
                  <span>{k}</span>
                  <span style={{ color:cls.color, letterSpacing:1 }}>{"█".repeat(v)}{"░".repeat(10-v)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleHub({ classKey, completed, onSelect }) {
  const cls = CLASSES[classKey];
  const allDone = ["townhall","vault","network","lab","bank"].every(k=>completed[k]);
  const MODS = [
    { id:"townhall", name:"TOWN HALL",     icon:"🏛", sub:"The Token Crisis — understand the problem",         color:C.yellow },
    { id:"vault",    name:"THE VAULT",     icon:"📓", sub:"Index content · Private vs public · See it work",   color:C.cyan   },
    { id:"network",  name:"THE MAP",       icon:"🌐", sub:"Your node on the Decentralized Intelligence Network", color:C.pink  },
    { id:"lab",      name:"THE CONNECTOR", icon:"🔌", sub:"Connect Claude Desktop · Fire your first query",    color:C.green  },
    { id:"bank",     name:"THE MARKET",    icon:"💎", sub:"What to index · Use cases · Earn from knowledge",   color:C.gold   },
    { id:"portal",   name:"THE PORTAL",    icon:"✦", sub:"Your complete stack + deploy commands",              color:C.pink, isPortal:true },
  ];
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"36px 20px 32px" }}>
      <div style={{ maxWidth:720, width:"100%", marginBottom:24 }}>
        <div style={{ fontFamily:PIXEL, fontSize:9, color:C.dim, marginBottom:6 }}>PLAYING AS</div>
        <div style={{ fontFamily:PIXEL, fontSize:16, color:cls.color, marginBottom:4 }}>{cls.name}</div>
        <div style={{ fontFamily:VT, fontSize:18, color:C.dim }}>{cls.tagline}</div>
        <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
          {MODS.filter(m=>!m.isPortal).map(m=>(
            <span key={m.id} style={{ fontFamily:PIXEL, fontSize:8, letterSpacing:1,
              background:completed[m.id]?m.color+"22":"transparent",
              color:completed[m.id]?m.color:C.border,
              border:`2px solid ${completed[m.id]?m.color:C.border}`, padding:"3px 7px" }}>
              {completed[m.id]?"✓ ":"○ "}{m.name.replace("THE ","")}
            </span>
          ))}
        </div>
        {allDone && <div style={{ fontFamily:VT, fontSize:20, color:C.green, marginTop:10, animation:"fadeUp 0.4s ease forwards" }}>★ Build complete — The Portal is open!</div>}
      </div>
      <div style={{ maxWidth:720, width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
        {MODS.map(m=>{
          const locked=m.isPortal&&!allDone;
          const done=completed[m.id];
          return (
            <div key={m.id} onClick={()=>{if(!locked){Sound.click();onSelect(m.id);}}}
              style={{ background:done?C.panel2:C.panel,
                border:`3px solid ${done?m.color:locked?C.border+"44":C.border}`,
                padding:"16px 20px", cursor:locked?"not-allowed":"pointer", opacity:locked?0.4:1,
                display:"flex", alignItems:"center", gap:16,
                boxShadow:done?`0 0 16px ${m.color}18`:"none",
                transition:"border-color 120ms, transform 80ms steps(2)" }}
              onMouseEnter={e=>{if(!locked){e.currentTarget.style.borderColor=m.color;e.currentTarget.style.transform="translateX(4px)";}}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=done?m.color:locked?C.border+"44":C.border;e.currentTarget.style.transform="none";}}>
              <div style={{ width:52, height:52, flexShrink:0, background:done?m.color+"22":C.bg,
                border:`3px solid ${done?m.color:C.border}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:26, boxShadow:done?`0 0 12px ${m.color}44`:"none" }}>
                {locked?"🔒":done?"★":m.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <div style={{ fontFamily:PIXEL, fontSize:11, color:done?m.color:locked?C.border:C.text }}>{m.name}</div>
                  {done && <span style={{ fontFamily:PIXEL, fontSize:8, color:m.color, background:m.color+"22", border:`2px solid ${m.color}`, padding:"2px 6px" }}>COMPLETE</span>}
                  {locked && <span style={{ fontFamily:PIXEL, fontSize:8, color:C.dim, border:`2px solid ${C.border}`, padding:"2px 6px" }}>LOCKED</span>}
                </div>
                <div style={{ fontFamily:VT, fontSize:17, color:C.dim }}>{m.sub}</div>
              </div>
              {!locked && <div style={{ fontFamily:PIXEL, fontSize:16, color:done?m.color:C.dim }}>▶</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CSS = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none} }
  @keyframes portraitPulse { 0%,100%{box-shadow:0 0 10px currentColor}50%{box-shadow:0 0 26px currentColor} }
  @keyframes blink { 50%{opacity:0} }
  @keyframes nodeGlow {
    0%,100% { filter: drop-shadow(0 0 4px currentColor); }
    50% { filter: drop-shadow(0 0 16px currentColor) drop-shadow(0 0 32px currentColor); }
  }
  @keyframes nucleusPulse {
    0%,100% { transform: scale(1); opacity: 0.15; }
    50% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes dataFlow {
    0% { stroke-dashoffset: 24; opacity: 0.8; }
    100% { stroke-dashoffset: 0; opacity: 0.2; }
  }
  @keyframes tipPop {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
  }
  @keyframes scanLine {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes tokenSave {
    0% { opacity: 0; transform: scale(0.5) translateY(0); }
    50% { opacity: 1; transform: scale(1.2) translateY(-10px); }
    100% { opacity: 0; transform: scale(1) translateY(-30px); }
  }
  @keyframes connectionPulse {
    0% { stroke-opacity: 0.15; stroke-width: 0.5; }
    50% { stroke-opacity: 0.6; stroke-width: 1.5; }
    100% { stroke-opacity: 0.15; stroke-width: 0.5; }
  }
  @keyframes ripple {
    0% { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(3); opacity: 0; }
  }
  @keyframes confettiFall {
    0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(110vh) translateX(var(--drift, 0)) rotate(720deg); opacity: 0.4; }
  }
  *{box-sizing:border-box}
  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-track{background:#0c0a12}
  ::-webkit-scrollbar-thumb{background:#3a3055}
  input,textarea,select{box-sizing:border-box}
`;

export default function RDKWorld() {
  const [screen, setScreen]     = useState("title");
  const [classKey, setClassKey] = useState(null);
  const [active, setActive]     = useState(null);
  const [completed, setCompleted] = useState({ townhall:false, vault:false, network:false, lab:false, bank:false, portal:false });
  const [userState, setUserState] = useState({});

  const goHub   = () => { setActive(null); setScreen("hub"); };
  const finish  = () => { setCompleted(c=>({...c,[active]:true})); goHub(); };
  const enter   = id => { setActive(id); setScreen("module"); };
  const restart = () => {
    setScreen("title"); setClassKey(null); setActive(null);
    setCompleted({townhall:false,vault:false,network:false,lab:false,bank:false,portal:false});
    setUserState({});
  };

  const mergeUserState = useCallback((updater) => {
    setUserState(s => typeof updater==="function" ? updater(s) : {...s,...updater});
  }, []);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet"/>
      <style>{CSS}</style>
      <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:VT }}>
        {screen==="title"  && <TitleScreen onStart={()=>{Sound.advance();setScreen("class");}}/>}
        {screen==="class"  && <ClassSelect onPick={id=>{setClassKey(id);setScreen("intro");}}/>}
        {screen==="intro"  && <IntroScene classKey={classKey} onDone={()=>setScreen("hub")}/>}
        {screen==="hub"    && <ModuleHub classKey={classKey} completed={completed} onSelect={enter}/>}
        {screen==="module"&&active==="townhall" && <TownHall   classKey={classKey} onComplete={finish} onLeave={goHub} userState={userState} setUserState={mergeUserState}/>}
        {screen==="module"&&active==="vault"    && <Vault      onComplete={finish} onLeave={goHub} userState={userState} setUserState={mergeUserState}/>}
        {screen==="module"&&active==="network"  && <MapModule  onComplete={finish} onLeave={goHub} userState={userState} setUserState={mergeUserState}/>}
        {screen==="module"&&active==="lab"      && <Connector  onComplete={finish} onLeave={goHub} userState={userState} setUserState={mergeUserState}/>}
        {screen==="module"&&active==="bank"     && <Market     onComplete={finish} onLeave={goHub} userState={userState} setUserState={mergeUserState}/>}
        {screen==="module"&&active==="portal"   && <Portal     classKey={classKey} onRestart={restart} onLeave={goHub} userState={userState}/>}
        <div style={{ position:"fixed",inset:0,pointerEvents:"none",
          background:"repeating-linear-gradient(0deg,rgba(0,0,0,0.1) 0px,rgba(0,0,0,0.1) 1px,transparent 1px,transparent 4px)",
          zIndex:9999 }}/>
      </div>
    </>
  );
}