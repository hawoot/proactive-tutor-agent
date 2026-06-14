import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'fs';

/* Polish pass for the chosen direction: "Bold & Editorial, warmed".
   (1) refined fennec fox with 3 expressions, (2) real spacing/type,
   (3) the two variations that matter: light vs dark, amber vs terracotta. */

const I = {
  flame:'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  zap:'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  brain:'M12 5a3 3 0 0 0-5.99-.14 3 3 0 0 0-2.01 5.3A3 3 0 0 0 5 16a3 3 0 0 0 6 .5V5z M12 5a3 3 0 0 1 5.99-.14 3 3 0 0 1 2.01 5.3A3 3 0 0 1 19 16a3 3 0 0 1-6 .5V5z',
  chevR:'m9 18 6-6-6-6', cam:'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z',
  mic:'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v1a7 7 0 0 1-14 0v-1 M12 18v4',
  arrowUp:'m5 12 7-7 7 7 M12 19V5', check:'M20 6 9 17l-5-5', clock:'M12 8v4l3 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  home:'m3 10 9-7 9 7 M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9', chart:'M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3', user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M6 21v-1a6 6 0 0 1 12 0v1',
};
const icon=(n,{size=24,sw=2,fill='none'}={})=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${I[n].split(' M').map((p,i)=>`<path d="${i?'M'+p:p}"/>`).join('')}</svg>`;

/* ---- refined fennec fox ----------------------------------------------------
   Big pointed ears, sandy face, cream muzzle, expressive eyes.
   moods: 'idle' | 'think' | 'celebrate'.  star = small brand star, optional. */
function fox(mood='idle', { size='100%', star=false, blush=null } = {}){
  const C = { ear:'#EC8B3E', earIn:'#8C4A3C', face:'#F2994E', cream:'#FBEFE0', nose:'#2A2230', eye:'#241C2E' };
  let eyes, mouth, extra='';
  if (mood==='celebrate'){
    eyes = `<path d="M40 56q5 6 10 0" /><path d="M70 56q5 6 10 0" />`.replace(/\/>/g,` stroke="${C.eye}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`);
    mouth = `<path d="M54 72q6 8 12 0z" fill="${C.eye}"/><path d="M55 73q5 5 10 0" fill="#E8607A"/>`;
    blush = blush ?? true;
    extra = `<g stroke="${C.face}" stroke-width="2.4" stroke-linecap="round" opacity=".9">
      <path d="M16 30l-7-4"/><path d="M18 20l-4-7"/><path d="M104 30l7-4"/><path d="M102 20l4-7"/></g>`;
  } else if (mood==='think'){
    eyes = `<circle cx="46" cy="55" r="4" fill="${C.eye}"/><circle cx="76" cy="55" r="4" fill="${C.eye}"/>
      <circle cx="47.6" cy="53.4" r="1.3" fill="#fff"/><circle cx="77.6" cy="53.4" r="1.3" fill="#fff"/>
      <path d="M40 47q6-3 12 0" stroke="${C.eye}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    mouth = `<path d="M60 74q5 3 9 1" stroke="${C.eye}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    extra = star ? '' : `<text x="92" y="34" font-family="Space Grotesk,sans-serif" font-size="20" font-weight="700" fill="${C.ear}">?</text>`;
  } else { // idle
    eyes = `<ellipse cx="46" cy="56" rx="4.2" ry="5" fill="${C.eye}"/><ellipse cx="76" cy="56" rx="4.2" ry="5" fill="${C.eye}"/>
      <circle cx="47.6" cy="54" r="1.5" fill="#fff"/><circle cx="77.6" cy="54" r="1.5" fill="#fff"/>`;
    mouth = `<path d="M60 73v4 M60 77q-4 3-8 1 M60 77q4 3 8 1" stroke="${C.eye}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  }
  const blushG = blush ? `<ellipse cx="38" cy="66" rx="6" ry="3.6" fill="#F0859A" opacity=".55"/><ellipse cx="82" cy="66" rx="6" ry="3.6" fill="#F0859A" opacity=".55"/>` : '';
  return `<svg viewBox="0 0 120 128" width="${size}" height="${size}">
    ${star?`<path d="M99 14l2.4 5.2 5.7.5-4.3 3.7 1.3 5.6L99 31.6l-5.1 2.9 1.3-5.6-4.3-3.7 5.7-.5z" fill="#F5B73F"/>`:''}
    <path d="M33 52C20 41 13 21 16 9c12 3 25 12 31 26z" fill="${C.ear}"/>
    <path d="M31 41c-7-8-10-19-9-25 7 3 15 10 19 19z" fill="${C.earIn}"/>
    <path d="M87 52c13-11 20-31 17-43-12 3-25 12-31 26z" fill="${C.ear}"/>
    <path d="M89 41c7-8 10-19 9-25-7 3-15 10-19 19z" fill="${C.earIn}"/>
    <path d="M60 28c-17 0-30 10-33 29-2 15 5 28 15 36 5 4 11 6 18 6s13-2 18-6c10-8 17-21 15-36-3-19-16-29-33-29z" fill="${C.face}"/>
    <path d="M42 62c6 5 12 7 18 7s12-2 18-7c-2 16-10 26-18 26s-16-10-18-26z" fill="${C.cream}"/>
    ${blushG}
    <path d="M60 70l-7-6h14z" fill="${C.nose}"/>
    ${eyes}${mouth}${extra}
  </svg>`;
}

/* ---- theme tokens for phone variants -------------------------------------- */
const themeVars = (mode, accent) => {
  const dark = { bg:'#17131d', card:'#221c2b', cardHi:'#2a2236', line:'#332b42', ink:'#F3EFEA', mut:'#9890a6', qbg:'#221c2b' };
  const light = { bg:'#FBF6EE', card:'#FFFFFF', cardHi:'#F4ECDF', line:'#ECE2D1', ink:'#2E2A24', mut:'#8C8475', qbg:'#FFFFFF' };
  const t = mode==='dark' ? dark : light;
  const acc = accent==='terracotta'
    ? { a:'#E8623C', aInk:'#FFFFFF', aSoft:'#E8623C' }
    : { a:'#F5B73F', aInk:'#1f1a10', aSoft:'#F5B73F' };
  return Object.entries({ ...t, ...acc }).map(([k,v])=>`--${k}:${v}`).join(';');
};

/* ---- screen templates (use CSS vars) -------------------------------------- */
const todayScreen = (mode) => `
<div class="topbar"><div class="brand">LABIB</div><div class="streakpill">${icon('flame',{size:14})} 12</div></div>
<div class="hero">
  <div class="kick">SBEH EL KHIR, NIDHAL</div>
  <div class="htitle">Today's<br>question.</div>
  <div class="qprev">Differentiate f(x) = 3x²·sin(x)</div>
  <button class="btn acc">Start practice ${icon('arrowUp',{size:17,sw:2.4})}</button>
</div>
<div class="bento">
  <div class="bcell big"><div class="bnum">12</div><div class="blbl acctx">${icon('flame',{size:13})} DAY STREAK</div></div>
  <div class="bcell"><div class="bnum">3<span>/5</span></div><div class="blbl">TODAY</div></div>
  <div class="bcell"><div class="bnum">82<span>%</span></div><div class="blbl">MASTERY</div></div>
</div>
<div class="modes">
  <div class="mode"><span class="mic2">${icon('zap',{size:17})}</span><div><b>Quick</b><i>~2 min</i></div></div>
  <div class="mode"><span class="mic2">${icon('brain',{size:17})}</span><div><b>Deep dive</b><i>~8 min</i></div></div>
</div>
<div class="nextline">${icon('clock',{size:15})}<span>NEXT NUDGE</span><b>18:30</b></div>
<div class="nav"><span class="ni on">${icon('home',{size:21})}</span><span class="ni">${icon('chart',{size:21})}</span><span class="ni">${icon('user',{size:21})}</span></div>`;

const practiceScreen = `
<div class="pbar"><span class="tagc">DIFFERENTIATION</span><span class="tagc ghost">CURATED</span></div>
<div class="qcard"><div class="ql">Q.</div><div class="qbig">Differentiate f(x) = 3x²·sin(x) with respect to x.</div></div>
<div class="row tut"><div class="fav">${fox('think',{size:'30px'})}</div><div class="bub tutb">Two functions are multiplied here. Name them, then reach for the product rule.</div></div>
<div class="row stu"><div class="bub stub">u = 3x², v = sin x</div></div>
<div class="row tut"><div class="fav">${fox('idle',{size:'30px'})}</div><div class="bub tutb">Right. The rule is u′v + uv′. Give me u′ first.</div></div>
<div class="composer">
  <div class="qr-row"><span class="qr">Hint</span><span class="qr">I'm stuck</span><span class="qr">Show me</span></div>
  <div class="inbar"><span class="ib">${icon('cam',{size:18})}</span><span class="ib">${icon('mic',{size:18})}</span><span class="ph">Type, talk, or snap…</span><span class="send">${icon('arrowUp',{size:18,sw:2.4})}</span></div>
</div>`;

const correctScreen = (() => {
  const cf = Array.from({length:22},(_,i)=>{
    const c=['var(--a)','#F0793F','#5FD08A','#5FB6D0','#C68FE6'][i%5];
    const left=8+Math.random()*84, top=3+Math.random()*22, r=Math.random()*360, w=5+Math.random()*4, round=i%3===0;
    return `<span class="cf" style="left:${left}%;top:${top}%;width:${w}px;height:${round?w:w*1.7}px;background:${c};border-radius:${round?'50%':'2px'};transform:rotate(${r}deg)"></span>`;
  }).join('');
  return `<div class="result">${cf}
    <div class="rfox">${fox('celebrate',{size:'112px',star:true})}</div>
    <div class="rverdict">Correct!</div>
    <div class="rsub">Clean use of the product rule.</div>
    <div class="xpcard">
      <div class="xprow"><span>${icon('zap',{size:16})} XP earned</span><b class="acctx">+15</b></div>
      <div class="xprow"><span>${icon('flame',{size:16})} Streak</span><b>12 → <span class="good">13</span></b></div>
      <div class="masteryrow"><div class="mlbl"><span>Differentiation mastery</span><b>78% → 82%</b></div><div class="mtrack"><i style="width:82%"></i><u style="left:78%"></u></div></div>
    </div>
    <button class="btn acc">Next question ${icon('chevR',{size:18,sw:2.6})}</button>
    <button class="btn ghost">Done for today</button>
  </div>`;
})();

const CSS=`
*{margin:0;padding:0;box-sizing:border-box}
body{background:#e9e6df;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.page{padding:34px 32px 42px}
.h1{font:700 29px 'Space Grotesk';color:#1c1b22}.h1 span{color:#8a8577;font-weight:500;font-size:16px}
.note{margin-top:7px;font-size:13px;color:#6f6a60;max-width:900px;line-height:1.55}
.deck{display:flex;gap:22px;margin-top:24px;flex-wrap:wrap}
.col{width:300px}
.cap{font:700 13px 'Space Grotesk';color:#1c1b22;margin:0 4px 11px;display:flex;align-items:center;gap:7px}
.cap b{padding:2px 7px;border-radius:6px;background:#1c1b22;color:#fff;font-size:10.5px;letter-spacing:.4px}
.cap i{color:#9a948a;font-weight:500;font-style:normal}
.phone{width:300px;height:648px;border-radius:38px;background:#0c0c11;padding:9px;box-shadow:0 20px 46px rgba(40,32,20,.22)}
.screen{width:100%;height:100%;border-radius:30px;overflow:hidden}
.scr{height:100%;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;position:relative;overflow:hidden}
.btn{border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:700 15px 'Space Grotesk'}
.btn.acc{background:var(--a);color:var(--aInk);padding:13px;border-radius:13px;width:100%}
.btn.ghost{background:transparent;color:var(--mut);font-weight:600;padding:10px;font-family:'Inter';font-size:13.5px}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:17px 19px 4px}
.brand{font:700 14px 'Space Grotesk';letter-spacing:3px}
.streakpill{display:flex;align-items:center;gap:5px;color:var(--a);font:700 13px 'Space Grotesk'}
.nav{margin-top:auto;display:flex;justify-content:space-around;padding:11px 0 16px;border-top:1px solid var(--line)}
.ni{color:var(--mut);opacity:.6}.ni.on{color:var(--a);opacity:1}
.hero{margin:15px 19px 0}
.kick{font:700 10px 'Space Grotesk';letter-spacing:2.4px;color:var(--mut)}
.htitle{font:700 36px 'Space Grotesk';line-height:.98;letter-spacing:-1px;margin:9px 0 11px}
.qprev{color:var(--mut);font:500 13px 'Space Grotesk';margin-bottom:14px;padding-left:11px;border-left:2px solid var(--a)}
.bento{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:9px;margin:15px 19px 0}
.bcell{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:12px 11px}
.bcell.big{background:var(--cardHi)}
.bnum{font:700 24px 'Space Grotesk'}.bnum span{font-size:12px;color:var(--mut)}
.blbl{font:700 8.5px 'Space Grotesk';letter-spacing:.8px;color:var(--mut);margin-top:4px;display:flex;align-items:center;gap:4px}
.blbl.acctx{color:var(--a)}
.modes{display:flex;gap:9px;margin:10px 19px 0}
.mode{flex:1;background:var(--card);border:1px solid var(--line);border-radius:13px;padding:10px;display:flex;align-items:center;gap:8px}
.mic2{width:31px;height:31px;border-radius:9px;background:var(--cardHi);display:flex;align-items:center;justify-content:center;color:var(--a)}
.mode b{font:600 13px 'Inter';display:block}.mode i{font-style:normal;font-size:10.5px;color:var(--mut)}
.nextline{display:flex;align-items:center;gap:7px;margin:14px 19px 5px;color:var(--mut);font:700 9.5px 'Space Grotesk';letter-spacing:1.4px}
.nextline b{color:var(--ink);margin-left:auto}
.pbar{display:flex;gap:6px;padding:17px 17px 11px}
.tagc{font:700 9.5px 'Space Grotesk';letter-spacing:1.4px;padding:5px 9px;border-radius:7px;background:var(--a);color:var(--aInk)}
.tagc.ghost{background:transparent;border:1px solid var(--line);color:var(--mut)}
.qcard{margin:0 17px 13px;display:flex;gap:9px}
.ql{font:700 16px 'Space Grotesk';color:var(--a)}
.qbig{font:600 16px 'Space Grotesk';line-height:1.3}
.row{display:flex;gap:7px;margin:0 15px 8px;align-items:flex-end}
.row.stu{justify-content:flex-end}
.fav{width:30px;height:30px;border-radius:50%;background:var(--cardHi);flex:0 0 30px;display:flex;align-items:center;justify-content:center}
.bub{max-width:80%;padding:10px 12px;font-size:12.5px;line-height:1.4}
.tutb{background:var(--card);border:1px solid var(--line);border-radius:13px;border-bottom-left-radius:4px}
.stub{background:var(--a);color:var(--aInk);border-radius:13px;border-bottom-right-radius:4px;font-weight:600}
.composer{margin-top:auto;padding:9px 11px 13px}
.qr-row{display:flex;gap:6px;margin-bottom:8px}
.qr{font:600 11.5px 'Inter';padding:6px 11px;border-radius:999px;background:var(--card);border:1px solid var(--line);color:var(--mut)}
.inbar{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 12px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.ib{color:var(--mut)}.ph{flex:1;font-size:12px;color:var(--mut)}
.send{width:35px;height:35px;border-radius:50%;background:var(--a);color:var(--aInk);display:flex;align-items:center;justify-content:center;flex:0 0 35px}
.result{height:100%;display:flex;flex-direction:column;align-items:center;padding:0 22px;position:relative;overflow:hidden}
.cf{position:absolute;z-index:0}
.rfox{margin:50px auto 2px;z-index:1}
.rverdict{font:700 32px 'Space Grotesk';color:#3FB873;z-index:1}
.rsub{color:var(--mut);font-size:13px;margin-top:3px;z-index:1}
.xpcard{align-self:stretch;background:var(--card);border:1px solid var(--line);border-radius:17px;padding:14px 15px;margin:20px 0 16px;z-index:1}
.xprow{display:flex;align-items:center;justify-content:space-between;font-size:13px;padding:5px 0}
.xprow span{display:flex;align-items:center;gap:7px;color:var(--mut)}
.xprow b{font:700 15px 'Space Grotesk'}.acctx{color:var(--a)}.good{color:#3FB873}
.masteryrow{margin-top:9px;padding-top:11px;border-top:1px solid var(--line)}
.mlbl{display:flex;justify-content:space-between;font-size:11px;color:var(--mut);margin-bottom:7px}.mlbl b{color:var(--ink);font-weight:600}
.mtrack{position:relative;height:7px;background:var(--cardHi);border-radius:4px}
.mtrack i{position:absolute;left:0;top:0;height:100%;background:#3FB873;border-radius:4px}
.mtrack u{position:absolute;top:-2px;width:2px;height:11px;background:var(--mut);border-radius:2px}
.result>.btn.acc{align-self:stretch}

/* ---- style tile ---- */
.tile{background:#fff;border-radius:22px;padding:28px;margin-top:22px;box-shadow:0 14px 40px rgba(40,32,20,.10);max-width:980px}
.sect{margin-bottom:26px}
.sect:last-child{margin-bottom:0}
.slbl{font:700 11px 'Space Grotesk';letter-spacing:2px;color:#9a948a;text-transform:uppercase;margin-bottom:14px;border-bottom:1px solid #eee;padding-bottom:8px}
.foxrow{display:flex;gap:18px}
.foxchip{width:150px;height:150px;border-radius:18px;background:#17131d;display:flex;align-items:center;justify-content:center;position:relative}
.foxchip.lite{background:#FBF6EE;border:1px solid #ECE2D1}
.foxchip cap,.fcap{position:absolute;bottom:8px;left:0;right:0;text-align:center;font:700 9.5px 'Space Grotesk';letter-spacing:1.4px;color:#fff8;}
.foxchip.lite .fcap{color:#a99}
.swatches{display:flex;gap:26px;flex-wrap:wrap}
.swgroup{}
.swgroup .gt{font:600 12px 'Inter';color:#6f6a60;margin-bottom:8px}
.swrow{display:flex;gap:8px}
.sw{width:54px;height:54px;border-radius:11px;border:1px solid #0001;display:flex;align-items:flex-end;justify-content:center;padding-bottom:4px;font:700 8px 'Inter';color:#fff;letter-spacing:.3px}
.sw.dark{color:#fff}.sw.litetx{color:#33302A}
.accpick{display:flex;gap:16px}
.acccard{border:2px solid #eee;border-radius:14px;padding:12px;width:200px}
.acccard.on{border-color:#1c1b22}
.acccard .ah{font:700 12px 'Space Grotesk';margin-bottom:9px;display:flex;justify-content:space-between;align-items:center}
.acccard .ah em{font-style:normal;font-size:9px;background:#1c1b22;color:#fff;padding:2px 7px;border-radius:5px}
.accbtn{padding:11px;border-radius:11px;text-align:center;font:700 13px 'Space Grotesk'}
.type-r{display:flex;align-items:baseline;gap:14px;margin-bottom:11px;border-bottom:1px dashed #eee;padding-bottom:11px}
.type-r .meta{font:600 10px 'Space Grotesk';color:#b3aa9b;width:150px;letter-spacing:.4px;flex:0 0 150px}
.comp{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.cbub{padding:10px 13px;font-size:13px;border-radius:13px;max-width:240px}
.cbub.t{background:#221c2b;color:#eee;border-bottom-left-radius:4px}
.cbub.s{background:#F5B73F;color:#1f1a10;border-bottom-right-radius:4px;font-weight:600}
.cchip{font:700 10px 'Space Grotesk';letter-spacing:1.2px;padding:5px 10px;border-radius:7px;background:#F5B73F;color:#1f1a10}
.cinbar{display:flex;align-items:center;gap:9px;padding:7px 8px 7px 13px;border-radius:22px;background:#221c2b;border:1px solid #332b42;color:#9890a6;width:280px;font-size:12px}
.cinbar .csend{width:34px;height:34px;border-radius:50%;background:#F5B73F;color:#1f1a10;display:flex;align-items:center;justify-content:center;margin-left:auto}
`;

const phone=(mode,accent,inner)=>`<div class="phone"><div class="screen"><div class="scr" style="${themeVars(mode,accent)}">${inner}</div></div></div>`;
const col=(letter,name,sub,el)=>`<div class="col"><div class="cap"><b>${letter}</b>${name} <i>· ${sub}</i></div>${el}</div>`;

const head=(rel)=>`<!doctype html><html><head><meta charset="utf8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="page">${rel}</div></body></html>`;

/* ---------- IMAGE 1: refined screens with variants ---------- */
const screensHTML = head(`
<div class="h1">Chosen direction, polished <span>· refined fox · real spacing · light/dark + accent variants</span></div>
<div class="note">Same direction in the two variants that actually matter: <b>night (dark) vs day (light)</b> — the app has both — and the <b>accent colour</b> (warm amber-gold vs your original terracotta). Pick one of each and the look is locked.</div>
<div class="deck">
  ${col('1','Today — Night','dark · amber  (recommended)', phone('dark','amber', todayScreen('dark')))}
  ${col('2','Today — Day','light · amber  (same direction, day mode)', phone('light','amber', todayScreen('light')))}
  ${col('3','Practice','dark · amber', phone('dark','amber', practiceScreen))}
  ${col('4','Correct!','dark · amber', phone('dark','amber', correctScreen))}
</div>
<div class="deck" style="margin-top:6px">
  ${col('5','Today — Terracotta','dark · terracotta accent (alt)', phone('dark','terracotta', todayScreen('dark')))}
  ${col('6','Today — Day · Terracotta','light · terracotta accent (alt)', phone('light','terracotta', todayScreen('light')))}
</div>`);

/* ---------- IMAGE 2: style tile ---------- */
const sw=(c,label,lite)=>`<div class="sw ${lite?'litetx':'dark'}" style="background:${c}">${label}</div>`;
const tileHTML = head(`
<div class="h1">The look, as a system <span>· “Bold &amp; Editorial, warmed”</span></div>
<div class="note">The building blocks behind those screens — so we're agreeing on a reusable design language, not one-off pictures.</div>
<div class="tile">
  <div class="sect"><div class="slbl">Labib the fennec fox · expressions</div>
    <div class="foxrow">
      <div class="foxchip">${fox('idle',{size:'104px'})}<div class="fcap">IDLE</div></div>
      <div class="foxchip">${fox('think',{size:'104px'})}<div class="fcap">COACHING</div></div>
      <div class="foxchip">${fox('celebrate',{size:'104px',star:true})}<div class="fcap">CELEBRATE</div></div>
      <div class="foxchip lite">${fox('idle',{size:'104px',star:true})}<div class="fcap">ON LIGHT</div></div>
    </div></div>
  <div class="sect"><div class="slbl">Palette</div>
    <div class="swatches">
      <div class="swgroup"><div class="gt">Night (dark)</div><div class="swrow">${sw('#17131d','BG')}${sw('#221c2b','CARD')}${sw('#332b42','LINE')}${sw('#F3EFEA','INK',true)}${sw('#9890a6','MUTED')}</div></div>
      <div class="swgroup"><div class="gt">Day (light)</div><div class="swrow">${sw('#FBF6EE','BG',true)}${sw('#FFFFFF','CARD',true)}${sw('#ECE2D1','LINE',true)}${sw('#2E2A24','INK')}${sw('#8C8475','MUTED')}</div></div>
      <div class="swgroup"><div class="gt">Support</div><div class="swrow">${sw('#3FB873','GOOD')}${sw('#5FB6D0','BLUE')}${sw('#C68FE6','PLUM')}</div></div>
    </div></div>
  <div class="sect"><div class="slbl">Accent — pick the action colour</div>
    <div class="accpick">
      <div class="acccard on"><div class="ah">Amber-gold <em>RECOMMENDED</em></div><div class="accbtn" style="background:#F5B73F;color:#1f1a10">Start practice</div></div>
      <div class="acccard"><div class="ah">Terracotta <span style="font-size:9px;color:#b3aa9b">your original</span></div><div class="accbtn" style="background:#E8623C;color:#fff">Start practice</div></div>
    </div></div>
  <div class="sect"><div class="slbl">Type — Space Grotesk (display) + Inter (text)</div>
    <div class="type-r"><div class="meta">DISPLAY · 36 · 700</div><div style="font:700 36px 'Space Grotesk';letter-spacing:-1px">Today's question.</div></div>
    <div class="type-r"><div class="meta">TITLE · 22 · 700</div><div style="font:700 22px 'Space Grotesk'">Correct! Nice work.</div></div>
    <div class="type-r"><div class="meta">KICKER · 11 · tracked</div><div style="font:700 11px 'Space Grotesk';letter-spacing:2.4px;color:#9a948a">SBEH EL KHIR, NIDHAL</div></div>
    <div class="type-r" style="border:0"><div class="meta">BODY · 15 · Inter</div><div style="font:400 15px 'Inter';color:#33302A">Two functions are multiplied — reach for the product rule.</div></div>
  </div>
  <div class="sect" style="margin-bottom:0"><div class="slbl">Components</div>
    <div class="comp">
      <span class="cchip">DIFFERENTIATION</span>
      <span class="cbub t">Give me u′ first.</span>
      <span class="cbub s">u = 3x², v = sin x</span>
      <span class="cinbar">${icon('cam',{size:17})} ${icon('mic',{size:17})} <span>Type, talk, or snap…</span><span class="csend">${icon('arrowUp',{size:17,sw:2.4})}</span></span>
    </div></div>
</div>`);

const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1380,height:900},deviceScaleFactor:2});
for (const [name,html] of [['refined-screens',screensHTML],['style-tile',tileHTML]]){
  writeFileSync(`/home/user/proactive-tutor-agent/mockups/polish-${name}.html`,html);
  await page.goto('file:///home/user/proactive-tutor-agent/mockups/polish-'+name+'.html');
  await page.waitForTimeout(1600);
  const el=await page.$('.page');
  await el.screenshot({path:`/home/user/proactive-tutor-agent/mockups/tnejjem-${name}.png`});
  console.log('wrote',name);
}
await browser.close();
