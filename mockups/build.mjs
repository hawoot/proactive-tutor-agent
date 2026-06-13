import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'fs';

/* ----------------------------------------------------------------------------
   Tnejjem redesign — visual direction mockups
   Two screens (Today, Practice) rendered in three aesthetic directions:
     A · Bold & Playful   (Duolingo)
     B · Calm & Premium   (Headspace / Oura)
     C · Bold & Editorial (Brilliant / Linear)
   No emoji anywhere — a custom inline-SVG icon set, on purpose.
---------------------------------------------------------------------------- */

// --- icon set (Lucide-style, stroke = currentColor) -------------------------
const I = {
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  brain: 'M12 5a3 3 0 0 0-5.99-.14 3 3 0 0 0-2.01 5.3A3 3 0 0 0 5 16a3 3 0 0 0 6 .5V5zM12 5a3 3 0 0 1 5.99-.14 3 3 0 0 1 2.01 5.3A3 3 0 0 1 19 16a3 3 0 0 1-6 .5V5z',
  chevR: 'm9 18 6-6-6-6',
  mic: 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v1a7 7 0 0 1-14 0v-1 M12 18v4',
  cam: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z',
  arrowUp: 'm5 12 7-7 7 7 M12 19V5',
  book: 'M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  chart: 'M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M6 21v-1a6 6 0 0 1 12 0v1',
  home: 'm3 10 9-7 9 7 M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9',
  check: 'M20 6 9 17l-5-5',
  star: 'M12 2.5l2.9 6.1 6.6.6-5 4.4 1.5 6.5L12 17.3 6.5 20.6 8 14.1l-5-4.4 6.6-.6z',
  clock: 'M12 8v4l3 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
};
const icon = (name, { size = 24, sw = 2, fill = 'none', cls = '' } = {}) =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${
    I[name].split(' M').map((p, i) => `<path d="${i ? 'M' + p : p}"/>`).join('')
  }</svg>`;

// --- fox mascot, drawn three ways -------------------------------------------
// playful: full-colour, friendly. premium: soft single-tone. editorial: line-art.
const fox = (variant) => {
  const palettes = {
    play:  { face: '#F0613A', faceShade: '#D94A24', cheek: '#FFF3E9', ear: '#1f2330', eye: '#1f2330', star: '#F4B73F', stroke: 'none' },
    calm:  { face: '#C9836B', faceShade: '#BC7259', cheek: '#FBF4EC', ear: '#6E5A50', eye: '#5C4A40', star: '#C9A24B', stroke: 'none' },
  };
  if (variant === 'edit') {
    // line-art fox, stroke = currentColor (inherits accent)
    return `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" width="100%" height="100%">
      <path d="M30 34 24 16l20 10z"/><path d="M90 34 96 16 76 26z"/>
      <path d="M30 34c-4 16-2 30 8 40 6 6 14 9 22 9s16-3 22-9c10-10 12-24 8-40-8 6-18 8-30 8s-22-2-30-8z"/>
      <path d="M44 64h12l-6 7z" fill="currentColor" stroke="none"/>
      <circle cx="44" cy="54" r="2.4" fill="currentColor" stroke="none"/><circle cx="76" cy="54" r="2.4" fill="currentColor" stroke="none"/>
      <path d="M60 9l2.4 5 5.4.5-4.1 3.6 1.2 5.3L60 26l-4.9 2.9 1.2-5.3-4.1-3.6 5.4-.5z"/>
    </svg>`;
  }
  const p = palettes[variant];
  return `<svg viewBox="0 0 120 120" width="100%" height="100%">
    <path d="M58 6l2.6 5.6 6.1.6-4.6 4 1.4 6L58 24l-5.5 3.2 1.4-6-4.6-4 6.1-.6z" fill="${p.star}"/>
    <path d="M28 30 22 12l22 12z" fill="${p.face}"/><path d="M28 30 24 16l13 6z" fill="${p.ear}"/>
    <path d="M92 30 98 12 76 24z" fill="${p.face}"/><path d="M92 30 96 16 83 22z" fill="${p.ear}"/>
    <path d="M28 30c-4 16-2 31 9 41 6 6 14 9 23 9s17-3 23-9c11-10 13-25 9-41-9 7-20 9-32 9s-23-2-32-9z" fill="${p.face}"/>
    <path d="M44 60c5 5 11 7 16 7s11-2 16-7c-3 12-10 19-16 19s-13-7-16-19z" fill="${p.cheek}"/>
    <path d="M50 70h20l-10 9z" fill="${p.faceShade}"/>
    <circle cx="46" cy="56" r="4.2" fill="${p.eye}"/><circle cx="74" cy="56" r="4.2" fill="${p.eye}"/>
    <circle cx="47.4" cy="54.6" r="1.4" fill="#fff"/><circle cx="75.4" cy="54.6" r="1.4" fill="#fff"/>
  </svg>`;
};

// shared maths content
const Q = 'Differentiate  f(x) = 3x²·sin(x)';

/* ============================ DIRECTION A : PLAYFUL ====================== */
const A_today = `
<div class="scr a">
  <div class="topbar">
    <div class="brand">tnejjem</div>
    <div class="streak"><span class="fl">${icon('flame', { size: 18, fill: 'currentColor', sw: 0 })}</span>12</div>
  </div>
  <div class="hello">
    <div class="foxwrap">${fox('play')}</div>
    <div><div class="hi">Sbeh el khir, Nidhal!</div><div class="sub">Your brain is freshest right now.</div></div>
  </div>
  <div class="goalcard">
    <svg class="ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="rbg"/><circle cx="40" cy="40" r="34" class="rfg"/></svg>
    <div class="ringnum">3<span>/5</span></div>
    <div class="goaltxt"><b>Daily goal</b><div class="sub">2 to go — you've got this</div></div>
  </div>
  <div class="hero">
    <div class="chips"><span class="chip blue">Differentiation</span><span class="chip green">${icon('check',{size:13,sw:3})} curated</span></div>
    <div class="htitle">Today's question is ready</div>
    <div class="qprev">${Q}</div>
    <button class="btn">Start practice ${icon('chevR',{size:20,sw:3})}</button>
  </div>
  <div class="quickrow">
    <div class="qbtn"><span class="qic amber">${icon('zap',{size:20,fill:'currentColor',sw:0})}</span>Quick one</div>
    <div class="qbtn"><span class="qic plum">${icon('brain',{size:20})}</span>Deep dive</div>
  </div>
  <div class="lbl">Coming up</div>
  <div class="tl"><span class="tic blue">${icon('clock',{size:18})}</span><div><b>Next nudge ~ 18:30</b><div class="sub">Nejma decides whether to ping you</div></div></div>
</div>`;

const A_practice = `
<div class="scr a">
  <div class="pbar"><span class="chip blue">Differentiation</span><span class="chip green">${icon('check',{size:13,sw:3})} curated</span><span class="chip amber">from Nejma</span></div>
  <div class="qcard"><div class="qlabel">QUESTION</div><div class="qbig">Differentiate&nbsp; f(x) = 3x²·sin(x)&nbsp; with respect to x.</div></div>
  <div class="row tut"><div class="favatar">${fox('play')}</div><div class="bub tutb">Think product rule — which two functions are being multiplied here?</div></div>
  <div class="row stu"><div class="bub stub">u = 3x² and v = sin x</div></div>
  <div class="row tut"><div class="favatar">${fox('play')}</div><div class="bub tutb">Exactly. Now apply u′v + uv′ — what's u′?</div></div>
  <div class="composer">
    <div class="qreplies"><span class="qr">Hint</span><span class="qr">I'm stuck</span><span class="qr">Show me</span></div>
    <div class="inbar"><span class="ibtn">${icon('cam',{size:20})}</span><span class="ibtn">${icon('mic',{size:20})}</span><span class="ph">Type, talk, or snap a photo…</span><span class="send">${icon('arrowUp',{size:20,sw:3})}</span></div>
  </div>
</div>`;

/* ============================ DIRECTION B : CALM ======================== */
const B_today = `
<div class="scr b">
  <div class="topbar"><div class="brand">Tnejjem</div><div class="streak">${icon('flame',{size:16})}<span>12 days</span></div></div>
  <div class="hello"><div class="hi">Good morning, Nidhal</div><div class="sub">A calm two minutes. Nejma remembers the rest.</div></div>
  <div class="foxquiet">${fox('calm')}</div>
  <div class="hero">
    <div class="kicker">TODAY'S FOCUS</div>
    <div class="htitle">One question on<br>Differentiation</div>
    <div class="qprev">${Q}</div>
    <button class="btn">Begin <span class="ar">${icon('chevR',{size:18})}</span></button>
  </div>
  <div class="goalrow">
    <div class="gitem"><div class="gnum">3<span>/5</span></div><div class="glbl">today</div><div class="track"><i style="width:60%"></i></div></div>
    <div class="gitem"><div class="gnum">82<span>%</span></div><div class="glbl">mastery</div><div class="track"><i style="width:82%"></i></div></div>
  </div>
  <div class="softrow"><span class="sic">${icon('clock',{size:18})}</span><div><div class="srt">Next gentle nudge</div><div class="sub">around 18:30 this evening</div></div></div>
</div>`;

const B_practice = `
<div class="scr b">
  <div class="pbar"><span class="kicker">DIFFERENTIATION · CURATED</span></div>
  <div class="qcard"><div class="qbig">Differentiate&nbsp; f(x) = 3x²·sin(x)&nbsp; with respect to x.</div></div>
  <div class="row tut"><div class="favatar">${fox('calm')}</div><div class="bub tutb">Think of it as two functions multiplied together. Which two?</div></div>
  <div class="row stu"><div class="bub stub">u = 3x² and v = sin x</div></div>
  <div class="row tut"><div class="favatar">${fox('calm')}</div><div class="bub tutb">Lovely. The product rule says u′v + uv′. Take your time — what is u′?</div></div>
  <div class="composer">
    <div class="qreplies"><span class="qr">Hint</span><span class="qr">I'm stuck</span></div>
    <div class="inbar"><span class="ibtn">${icon('cam',{size:19})}</span><span class="ibtn">${icon('mic',{size:19})}</span><span class="ph">Type, talk, or snap…</span><span class="send">${icon('arrowUp',{size:18})}</span></div>
  </div>
</div>`;

/* ============================ DIRECTION C : EDITORIAL =================== */
const C_today = `
<div class="scr c">
  <div class="topbar"><div class="brand">TNEJJEM</div><div class="streak">${icon('flame',{size:15})} 12</div></div>
  <div class="hero">
    <div class="kicker">SBEH EL KHIR, NIDHAL</div>
    <div class="htitle">Today's<br>question.</div>
    <div class="qprev">${Q}</div>
    <button class="btn">Start practice ${icon('arrowUp',{size:18,sw:2.4})}</button>
  </div>
  <div class="bento">
    <div class="bcell big"><div class="bnum">12</div><div class="blbl">${icon('flame',{size:15})} day streak</div></div>
    <div class="bcell"><div class="bnum">3<span>/5</span></div><div class="blbl">goal</div></div>
    <div class="bcell"><div class="bnum">82<span>%</span></div><div class="blbl">mastery</div></div>
  </div>
  <div class="modes">
    <div class="mode"><span class="mic2">${icon('zap',{size:18})}</span><div><b>Quick</b><span>~2 min</span></div></div>
    <div class="mode"><span class="mic2">${icon('brain',{size:18})}</span><div><b>Deep dive</b><span>~8 min</span></div></div>
  </div>
  <div class="nextline">${icon('clock',{size:16})}<span>NEXT NUDGE</span><b>18:30</b></div>
</div>`;

const C_practice = `
<div class="scr c">
  <div class="pbar"><span class="tagc">DIFFERENTIATION</span><span class="tagc ghost">CURATED</span></div>
  <div class="qcard"><div class="qlabel">Q.</div><div class="qbig">Differentiate f(x) = 3x²·sin(x) with respect to x.</div></div>
  <div class="row tut"><div class="favatar">${fox('edit')}</div><div class="bub tutb">Two functions are multiplied. Name them, then reach for the product rule.</div></div>
  <div class="row stu"><div class="bub stub">u = 3x², v = sin x</div></div>
  <div class="row tut"><div class="favatar">${fox('edit')}</div><div class="bub tutb">Right. u′v + uv′. Give me u′ first.</div></div>
  <div class="composer">
    <div class="qreplies"><span class="qr">Hint</span><span class="qr">I'm stuck</span><span class="qr">Show me</span></div>
    <div class="inbar"><span class="ibtn">${icon('cam',{size:18})}</span><span class="ibtn">${icon('mic',{size:18})}</span><span class="ph">Type, talk, or snap…</span><span class="send">${icon('arrowUp',{size:18,sw:2.4})}</span></div>
  </div>
</div>`;

// --- styles ------------------------------------------------------------------
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{background:#e9e6df;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.page{padding:34px 30px 40px}
.h1{font:700 30px 'Space Grotesk',sans-serif;color:#1c1b22}
.h1 span{color:#8a8577;font-weight:500;font-size:18px}
.deck{display:flex;gap:26px;margin-top:24px}
.col{width:344px}
.cap{margin:0 2px 12px}
.cap .nm{font:700 17px 'Space Grotesk',sans-serif;color:#1c1b22}
.cap .nm b{display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:7px;background:#1c1b22;color:#fff;font-size:13px;margin-right:7px}
.cap .ds{font-size:12.5px;color:#736f64;margin-top:3px;line-height:1.45}
.phone{width:344px;height:732px;border-radius:42px;background:#0c0c11;padding:11px;box-shadow:0 22px 50px rgba(40,32,20,.22)}
.screen{width:100%;height:100%;border-radius:32px;overflow:hidden;position:relative}
.scr{height:100%;overflow:hidden;display:flex;flex-direction:column}
.sub{color:var(--sub);font-size:12.5px;line-height:1.45;margin-top:2px}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:16px 18px 4px}
.lbl{font:700 11px 'Inter';letter-spacing:1.4px;text-transform:uppercase;color:var(--sub);margin:16px 18px 8px}
.chips{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
.chip{font:700 11px 'Inter';padding:4px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:4px}
.hero .htitle{font-weight:700}
.qprev{font-size:13.5px;line-height:1.5}
.btn{border:0;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:6px}

/* rows / bubbles (shared structure) */
.row{display:flex;gap:8px;margin:0 16px 9px;align-items:flex-end}
.row.stu{justify-content:flex-end}
.favatar{width:34px;height:34px;border-radius:50%;flex:0 0 34px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.bub{max-width:78%;padding:11px 13px;font-size:13.5px;line-height:1.42}
.composer{margin-top:auto;padding:10px 12px 14px}
.qreplies{display:flex;gap:7px;margin-bottom:9px;flex-wrap:wrap}
.qr{font:700 12px 'Inter';padding:7px 12px;border-radius:999px}
.inbar{display:flex;align-items:center;gap:8px;padding:7px 8px 7px 12px;border-radius:24px}
.inbar .ph{flex:1;font-size:13px}
.ibtn{display:flex}.send{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:0 0 38px}
.qcard .qbig{font-weight:600}
.pbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:16px 16px 10px}

/* ============ A · PLAYFUL ============ */
.a{--sub:#8b8275;background:#FFFBF3;font-family:'Fredoka',sans-serif}
.a .brand{font:600 22px 'Fredoka';color:#F0613A;letter-spacing:.3px}
.a .streak{display:flex;align-items:center;gap:5px;background:#FFE7C2;color:#C9621A;font-weight:700;font-size:15px;padding:5px 12px;border-radius:999px}
.a .streak .fl{color:#F4920F;display:flex}
.a .hello{display:flex;align-items:center;gap:10px;padding:8px 18px 4px}
.a .foxwrap{width:62px;height:62px;flex:0 0 62px}
.a .hi{font-weight:600;font-size:19px;color:#33302A}
.a .goalcard{margin:12px 18px 4px;background:#fff;border-radius:22px;padding:14px;display:flex;align-items:center;gap:14px;box-shadow:0 6px 16px rgba(91,74,46,.08)}
.a .ring{width:58px;height:58px;transform:rotate(-90deg)}
.a .rbg{fill:none;stroke:#F1E7D6;stroke-width:8}
.a .rfg{fill:none;stroke:#F0613A;stroke-width:8;stroke-linecap:round;stroke-dasharray:213;stroke-dashoffset:85}
.a .goalcard{position:relative}
.a .ringnum{position:absolute;left:27px;top:50%;transform:transl(-50%,-50%);width:58px;text-align:center;font-weight:700;font-size:18px;color:#33302A;margin-top:-9px}
.a .ringnum span{font-size:11px;color:#B3AA9B}
.a .goaltxt b{font-size:15px;color:#33302A}
.a .hero{margin:14px 18px 0;background:#fff;border-radius:24px;padding:17px;box-shadow:0 8px 20px rgba(91,74,46,.10);border:1.5px solid #F2E7D4}
.a .chip.blue{background:#E2F1F5;color:#24788E}
.a .chip.green{background:#E4F3E5;color:#3f8a47}
.a .chip.amber{background:#FCEBCF;color:#C9621A}
.a .hero .htitle{font-size:21px;color:#33302A;margin:4px 0 6px}
.a .qprev{color:#5b5346;background:#FBF6EC;border-radius:14px;padding:11px 13px;font-size:14px;margin-bottom:14px;font-family:'Inter'}
.a .btn{background:#F0613A;color:#fff;font:700 16px 'Fredoka';padding:15px;border-radius:18px;border-bottom:4px solid #C4452020;box-shadow:0 4px 0 #C94A22}
.a .quickrow{display:flex;gap:10px;margin:12px 18px 0}
.a .qbtn{flex:1;background:#fff;border:1.5px solid #EFE4D1;border-radius:18px;padding:13px;display:flex;flex-direction:column;align-items:center;gap:5px;font-weight:600;color:#5b5346;font-size:13px}
.a .qic{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.a .qic.amber{background:#FCEBCF;color:#E0890F}.a .qic.plum{background:#EFE4F5;color:#7E549A}
.a .tl{display:flex;gap:10px;align-items:center;margin:0 18px}
.a .tic{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.a .tic.blue{background:#E2F1F5;color:#24788E}
.a .tl b{font-size:14px;color:#33302A}
/* A practice */
.a .qcard{margin:0 16px 12px;background:#fff;border-radius:18px;padding:14px;border-left:4px solid #2E8FA8;box-shadow:0 5px 14px rgba(91,74,46,.07)}
.a .qlabel{font:700 10px 'Inter';letter-spacing:1.4px;color:#24788E;margin-bottom:5px}
.a .qbig{font-size:16px;line-height:1.4;color:#33302A;font-family:'Inter'}
.a .favatar{background:#FFE7C2}
.a .tutb{background:#fff;border:1.5px solid #F0E6D4;border-bottom-left-radius:5px;border-radius:16px;color:#3d382f;font-family:'Inter'}
.a .stub{background:#2E8FA8;color:#fff;border-bottom-right-radius:5px;border-radius:16px;font-family:'Inter'}
.a .composer{background:#FFFBF3}
.a .qr{background:#fff;border:1.5px solid #EFE4D1;color:#5b5346;font-family:'Inter'}
.a .inbar{background:#fff;box-shadow:0 4px 14px rgba(91,74,46,.10)}
.a .inbar .ph,.a .ibtn{color:#B3AA9B}.a .inbar .ph{font-family:'Inter'}
.a .send{background:#F0613A;color:#fff}

/* ============ B · CALM ============ */
.b{--sub:#9a8f80;background:linear-gradient(180deg,#F7F1E8 0%,#EFE7DA 60%,#EAE0D0 100%);font-family:'Inter',sans-serif;color:#4a4338}
.b .brand{font:500 20px 'Fraunces',serif;color:#7a6a57;letter-spacing:.3px}
.b .streak{display:flex;align-items:center;gap:5px;color:#a9573f;font-size:12.5px;font-weight:600}
.b .hello{padding:14px 24px 2px}
.b .hi{font:500 26px 'Fraunces',serif;color:#4a4338}
.b .foxquiet{width:84px;height:84px;margin:10px auto 2px}
.b .hero{margin:8px 22px 0;text-align:center}
.b .kicker{font:700 10.5px 'Inter';letter-spacing:2.2px;color:#b09a82}
.b .hero .htitle{font:500 27px 'Fraunces',serif;color:#3f3930;line-height:1.18;margin:8px 0 10px}
.b .qprev{color:#7a7062;font-size:13.5px;margin-bottom:18px}
.b .btn{background:#B9694E;color:#fff;font:600 15px 'Inter';padding:15px;border-radius:16px;box-shadow:0 10px 24px rgba(160,90,60,.26);gap:8px;width:auto;padding-left:30px;padding-right:24px;margin:0 auto;display:inline-flex}
.b .hero{display:flex;flex-direction:column;align-items:center}
.b .ar{display:flex;opacity:.85}
.b .goalrow{display:flex;gap:14px;margin:26px 22px 0}
.b .gitem{flex:1}
.b .gnum{font:500 26px 'Fraunces',serif;color:#4a4338}.b .gnum span{font-size:14px;color:#b3a795}
.b .glbl{font-size:11.5px;color:#9a8f80;margin:0 0 8px}
.b .track{height:5px;border-radius:3px;background:#E0D5C4;overflow:hidden}
.b .track i{display:block;height:100%;background:#B9694E;border-radius:3px}
.b .softrow{display:flex;gap:12px;align-items:center;margin:26px 22px 0;padding-top:18px;border-top:1px solid #E3D9C9}
.b .sic{color:#b09a82}
.b .srt{font-size:13.5px;color:#4a4338;font-weight:600}
/* B practice */
.b .pbar{padding:18px 22px 12px}
.b .qcard{margin:0 22px 18px}
.b .qbig{font:500 19px 'Fraunces',serif;color:#3f3930;line-height:1.36}
.b .row{margin:0 20px 11px}
.b .favatar{background:#EADFCF}
.b .tutb{background:#FBF6EE;border-radius:18px;border-bottom-left-radius:5px;color:#574e42;box-shadow:0 3px 10px rgba(120,90,50,.06)}
.b .stub{background:#B9694E;color:#fff;border-radius:18px;border-bottom-right-radius:5px}
.b .qr{background:#FBF6EE;color:#8a7d6c;border:1px solid #E3D9C9}
.b .inbar{background:#FBF6EE;border:1px solid #E6DCCB}
.b .inbar .ph,.b .ibtn{color:#b3a795}
.b .send{background:#B9694E;color:#fff;width:34px;height:34px;flex-basis:34px}

/* ============ C · EDITORIAL ============ */
.c{--sub:#8e8aa0;background:#141320;font-family:'Inter',sans-serif;color:#ECEAF6}
.c .brand{font:700 16px 'Space Grotesk';letter-spacing:3px;color:#ECEAF6}
.c .streak{display:flex;align-items:center;gap:5px;color:#F5C24B;font-weight:700;font-size:13px}
.c .hero{margin:18px 20px 0}
.c .kicker{font:700 11px 'Space Grotesk';letter-spacing:2.6px;color:#7c7795}
.c .hero .htitle{font:700 40px 'Space Grotesk';line-height:.98;letter-spacing:-1px;margin:10px 0 12px;color:#fff}
.c .qprev{color:#b9b5cc;font-size:14px;font-family:'Space Grotesk';margin-bottom:16px;padding-left:12px;border-left:2px solid #F5C24B}
.c .btn{background:#F5C24B;color:#1b1830;font:700 15px 'Space Grotesk';padding:15px;border-radius:14px;gap:8px;letter-spacing:.3px}
.c .bento{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:10px;margin:16px 20px 0}
.c .bcell{background:#1E1C2E;border:1px solid #2b2840;border-radius:16px;padding:14px 13px}
.c .bcell.big{background:linear-gradient(150deg,#2a2540,#1E1C2E)}
.c .bnum{font:700 26px 'Space Grotesk';color:#fff}.c .bnum span{font-size:14px;color:#7c7795}
.c .blbl{font-size:10.5px;color:#9a96b0;margin-top:3px;display:flex;align-items:center;gap:4px;text-transform:uppercase;letter-spacing:.6px}
.c .bcell.big .blbl{color:#F5C24B}
.c .modes{display:flex;gap:10px;margin:12px 20px 0}
.c .mode{flex:1;background:#1E1C2E;border:1px solid #2b2840;border-radius:14px;padding:12px;display:flex;align-items:center;gap:9px}
.c .mic2{width:34px;height:34px;border-radius:10px;background:#2a2740;display:flex;align-items:center;justify-content:center;color:#F5C24B}
.c .mode b{font:600 14px 'Inter';display:block}.c .mode span{font-size:11px;color:#8e8aa0}
.c .nextline{display:flex;align-items:center;gap:8px;margin:18px 20px 0;color:#8e8aa0;font:700 11px 'Space Grotesk';letter-spacing:1.6px}
.c .nextline b{color:#fff;margin-left:auto}
/* C practice */
.c .pbar{padding:18px 20px 12px}
.c .tagc{font:700 10.5px 'Space Grotesk';letter-spacing:1.6px;padding:5px 10px;border-radius:7px;background:#F5C24B;color:#1b1830}
.c .tagc.ghost{background:transparent;border:1px solid #36324e;color:#9a96b0}
.c .qcard{margin:0 20px 16px;display:flex;gap:10px}
.c .qlabel{font:700 18px 'Space Grotesk';color:#F5C24B}
.c .qbig{font:600 18px 'Space Grotesk';color:#fff;line-height:1.32}
.c .favatar{background:#221f33;color:#F5C24B;padding:5px}
.c .tutb{background:#1E1C2E;border:1px solid #2b2840;border-radius:14px;border-bottom-left-radius:4px;color:#d9d6e8}
.c .stub{background:#F5C24B;color:#1b1830;border-radius:14px;border-bottom-right-radius:4px;font-weight:600}
.c .qr{background:#1E1C2E;border:1px solid #2b2840;color:#b9b5cc}
.c .inbar{background:#1E1C2E;border:1px solid #2b2840}
.c .inbar .ph,.c .ibtn{color:#7c7795}
.c .send{background:#F5C24B;color:#1b1830}
`;

const phone = (inner) => `<div class="phone"><div class="screen">${inner}</div></div>`;
const col = (letter, name, desc, screen) => `<div class="col">
  <div class="cap"><div class="nm"><b>${letter}</b>${name}</div><div class="ds">${desc}</div></div>
  ${phone(screen)}</div>`;

const pageHTML = (title, sub, cols) => `<!doctype html><html><head><meta charset="utf8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body><div class="page"><div class="h1">${title} <span>· ${sub}</span></div><div class="deck">${cols.join('')}</div></div></body></html>`;

const descA = 'Loud, friendly, gamified. Rounded font, big mascot, progress ring, chunky buttons. Duolingo energy.';
const descB = 'Calm & premium. Serif headlines, airy spacing, muted clay palette, mascot small & quiet. Headspace / Oura.';
const descC = 'Bold & editorial. Big typographic headlines, dark surfaces, bento grid, line-art fox. Brilliant / Linear.';

const todayPage = pageHTML('Tnejjem — Home / “Today”', 'three directions, side by side', [
  col('A', 'Bold &amp; Playful', descA, A_today),
  col('B', 'Calm &amp; Premium', descB, B_today),
  col('C', 'Bold &amp; Editorial', descC, C_today),
]);
const practicePage = pageHTML('Tnejjem — Practice (one question)', 'three directions, side by side', [
  col('A', 'Bold &amp; Playful', descA, A_practice),
  col('B', 'Calm &amp; Premium', descB, B_practice),
  col('C', 'Bold &amp; Editorial', descC, C_practice),
]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 980 }, deviceScaleFactor: 2 });
for (const [name, html] of [['today', todayPage], ['practice', practicePage]]) {
  writeFileSync(`/home/user/proactive-tutor-agent/mockups/${name}.html`, html);
  await page.goto('file:///home/user/proactive-tutor-agent/mockups/' + name + '.html');
  await page.waitForTimeout(1500); // let webfonts settle
  const el = await page.$('.page');
  await el.screenshot({ path: `/home/user/proactive-tutor-agent/mockups/tnejjem-${name}.png` });
  console.log('wrote', name);
}
await browser.close();
