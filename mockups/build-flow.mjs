import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'fs';

/* Recommended direction, fleshed out: "Bold & Editorial, warmed".
   Dark warm surface, confident Space-Grotesk headlines, amber accent,
   a refined fennec-fox mascot, and a celebration moment. 4-screen flow. */

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

// refined fennec fox — big ears, clever face, reaching toward a star.
const fox=({star=true,mood='calm',size='100%'}={})=>{
  const eye = mood==='happy'
    ? '<path d="M40 55q5 5 10 0" stroke="#1c1726" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M70 55q5 5 10 0" stroke="#1c1726" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
    : '<circle cx="45" cy="55" r="3.6" fill="#1c1726"/><circle cx="75" cy="55" r="3.6" fill="#1c1726"/><circle cx="46.2" cy="53.6" r="1.2" fill="#fff"/><circle cx="76.2" cy="53.6" r="1.2" fill="#fff"/>';
  return `<svg viewBox="0 0 120 130" width="${size}" height="${size}">
    ${star?'<path d="M96 16l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L96 33.4l-5.5 3.2 1.4-6.1-4.7-4.1 6.2-.6z" fill="#F5B73F"/>':''}
    <path d="M34 50C22 40 16 22 18 12c10 2 22 10 28 22z" fill="#E9863F"/>
    <path d="M30 40c-6-8-9-18-8-24 6 3 13 9 17 17z" fill="#3a2f3f"/>
    <path d="M86 50c12-10 18-28 16-38-10 2-22 10-28 22z" fill="#E9863F"/>
    <path d="M90 40c6-8 9-18 8-24-6 3-13 9-17 17z" fill="#3a2f3f"/>
    <path d="M60 30c-16 0-29 9-32 27-2 14 4 27 14 35 5 4 11 6 18 6s13-2 18-6c10-8 16-21 14-35-3-18-16-27-32-27z" fill="#F0934A"/>
    <path d="M44 64c5 4 11 6 16 6s11-2 16-6c-2 14-9 23-16 23s-14-9-16-23z" fill="#FBEFE0"/>
    <path d="M60 78l-7-6h14z" fill="#FBEFE0"/><path d="M60 84l-5-6h10z" fill="#2a2230"/>
    ${eye}
    <path d="M48 30c-6-3-13-3-18 0" stroke="#D9772F" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>
  </svg>`;
};

const T = {
  bg:'#17131d', card:'#221c2b', cardHi:'#2a2236', line:'#332b42', ink:'#F3EFEA', mut:'#9890a6',
  amber:'#F5B73F', amberInk:'#1c1726', coral:'#F0793F', good:'#5FD08A', blue:'#5FB6D0',
};

// ---------- screens ----------
const welcome = `
<div class="scr">
  <div class="wfox">${fox({size:'150px',mood:'happy'})}</div>
  <div class="wname">Tnejjem</div>
  <div class="wtag">You can.</div>
  <div class="wsub">A two-minute maths question a day,<br>picked for you. Nejma remembers the rest.</div>
  <button class="btn amber">Get started ${icon('arrowUp',{size:18,sw:2.4})}</button>
  <div class="wfoot">A-LEVEL MATHS · BUILT FOR YOUR EXAM</div>
</div>`;

const today = `
<div class="scr">
  <div class="topbar"><div class="brand">TNEJJEM</div><div class="streakpill">${icon('flame',{size:14})} 12</div></div>
  <div class="hero">
    <div class="kick">SBEH EL KHIR, NIDHAL</div>
    <div class="htitle">Today's<br>question.</div>
    <div class="qprev">Differentiate f(x) = 3x²·sin(x)</div>
    <button class="btn amber">Start practice ${icon('arrowUp',{size:17,sw:2.4})}</button>
  </div>
  <div class="bento">
    <div class="bcell big"><div class="bnum">12</div><div class="blbl amber">${icon('flame',{size:13})} DAY STREAK</div></div>
    <div class="bcell"><div class="bnum">3<span>/5</span></div><div class="blbl">TODAY</div></div>
    <div class="bcell"><div class="bnum">82<span>%</span></div><div class="blbl">MASTERY</div></div>
  </div>
  <div class="modes">
    <div class="mode"><span class="mic2">${icon('zap',{size:17})}</span><div><b>Quick</b><i>~2 min</i></div></div>
    <div class="mode"><span class="mic2">${icon('brain',{size:17})}</span><div><b>Deep dive</b><i>~8 min</i></div></div>
  </div>
  <div class="nextline">${icon('clock',{size:15})}<span>NEXT NUDGE</span><b>18:30</b></div>
  <div class="nav"><span class="ni on">${icon('home',{size:21})}</span><span class="ni">${icon('chart',{size:21})}</span><span class="ni">${icon('user',{size:21})}</span></div>
</div>`;

const practice = `
<div class="scr">
  <div class="pbar"><span class="tagc">DIFFERENTIATION</span><span class="tagc ghost">CURATED</span></div>
  <div class="qcard"><div class="ql">Q.</div><div class="qbig">Differentiate f(x) = 3x²·sin(x) with respect to x.</div></div>
  <div class="row tut"><div class="fav">${fox({size:'30px',star:false})}</div><div class="bub tutb">Two functions are multiplied here. Name them, then reach for the product rule.</div></div>
  <div class="row stu"><div class="bub stub">u = 3x², v = sin x</div></div>
  <div class="row tut"><div class="fav">${fox({size:'30px',star:false})}</div><div class="bub tutb">Right. The rule is u′v + uv′. Give me u′ first.</div></div>
  <div class="row stu"><div class="bub stub">u′ = 6x, v′ = cos x → 6x·sin x + 3x²·cos x</div></div>
  <div class="composer">
    <div class="qr-row"><span class="qr">Hint</span><span class="qr">I'm stuck</span><span class="qr">Show me</span></div>
    <div class="inbar"><span class="ib">${icon('cam',{size:18})}</span><span class="ib">${icon('mic',{size:18})}</span><span class="ph">Type, talk, or snap…</span><span class="send">${icon('arrowUp',{size:18,sw:2.4})}</span></div>
  </div>
</div>`;

const confetti = Array.from({length:26},(_, i)=>{
  const c=[T.amber,T.coral,T.good,T.blue,'#C68FE6'][i%5];
  const left=6+Math.random()*88, top=4+Math.random()*34, r=Math.random()*360, w=5+Math.random()*5;
  const round=i%3===0;
  return `<span class="cf" style="left:${left}%;top:${top}%;width:${w}px;height:${round?w:w*1.7}px;background:${c};border-radius:${round?'50%':'2px'};transform:rotate(${r}deg)"></span>`;
}).join('');

const result = `
<div class="scr result">
  ${confetti}
  <div class="rfox">${fox({size:'118px',mood:'happy'})}</div>
  <div class="rverdict">Correct!</div>
  <div class="rsub">Clean use of the product rule.</div>
  <div class="xpcard">
    <div class="xprow"><span>${icon('zap',{size:16})} XP earned</span><b class="amber">+15</b></div>
    <div class="xprow"><span>${icon('flame',{size:16})} Streak</span><b>12 → <span class="good">13</span></b></div>
    <div class="masteryrow"><div class="mlbl"><span>Differentiation mastery</span><b>78% → 82%</b></div><div class="mtrack"><i style="width:82%"></i><u style="left:78%"></u></div></div>
  </div>
  <button class="btn amber">Next question ${icon('chevR',{size:18,sw:2.6})}</button>
  <button class="btn ghost">Done for today</button>
</div>`;

const CSS=`
*{margin:0;padding:0;box-sizing:border-box}
body{background:#e9e6df;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.page{padding:34px 30px 40px}
.h1{font:700 30px 'Space Grotesk';color:#1c1b22}.h1 span{color:#8a8577;font-weight:500;font-size:17px}
.note{margin-top:6px;font-size:13px;color:#736f64;max-width:760px;line-height:1.5}
.deck{display:flex;gap:22px;margin-top:22px}
.col{width:312px}
.cap{font:700 13px 'Space Grotesk';color:#1c1b22;margin:0 4px 11px;display:flex;align-items:center;gap:7px}
.cap b{width:20px;height:20px;line-height:20px;text-align:center;border-radius:6px;background:#1c1b22;color:#fff;font-size:11px}
.cap i{color:#9a948a;font-weight:500;font-style:normal}
.phone{width:312px;height:672px;border-radius:40px;background:#0c0c11;padding:10px;box-shadow:0 22px 50px rgba(40,32,20,.22)}
.screen{width:100%;height:100%;border-radius:31px;overflow:hidden}
.scr{height:100%;background:${T.bg};color:${T.ink};display:flex;flex-direction:column;position:relative;overflow:hidden}
.btn{border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:700 15px 'Space Grotesk'}
.btn.amber{background:${T.amber};color:${T.amberInk};padding:14px;border-radius:13px;width:100%}
.btn.ghost{background:transparent;color:${T.mut};font-weight:600;padding:11px;font-family:'Inter';font-size:14px}

/* welcome */
.scr .wfox{margin:64px auto 6px;width:150px;height:163px}
.wname{text-align:center;font:700 34px 'Space Grotesk';letter-spacing:-.5px}
.wtag{text-align:center;font:700 15px 'Space Grotesk';letter-spacing:5px;color:${T.amber};margin-top:2px;text-transform:uppercase}
.wsub{text-align:center;color:${T.mut};font-size:13.5px;line-height:1.6;margin:18px 34px 0}
.scr .wfox~.btn{}
.welcome-pad{}
.scr>.btn.amber{margin:auto 30px 0}
.wfoot{text-align:center;font:700 9.5px 'Space Grotesk';letter-spacing:1.8px;color:#6c6680;margin:16px 0 24px}

/* topbar / nav */
.topbar{display:flex;justify-content:space-between;align-items:center;padding:18px 20px 4px}
.brand{font:700 15px 'Space Grotesk';letter-spacing:3px}
.streakpill{display:flex;align-items:center;gap:5px;color:${T.amber};font:700 13px 'Space Grotesk'}
.nav{margin-top:auto;display:flex;justify-content:space-around;padding:12px 0 18px;border-top:1px solid ${T.line}}
.ni{color:#5d5670}.ni.on{color:${T.amber}}

/* today */
.hero{margin:16px 20px 0}
.kick{font:700 10.5px 'Space Grotesk';letter-spacing:2.4px;color:#7c7795}
.htitle{font:700 37px 'Space Grotesk';line-height:.98;letter-spacing:-1px;margin:9px 0 11px}
.qprev{color:#bcb7cd;font:500 13.5px 'Space Grotesk';margin-bottom:15px;padding-left:11px;border-left:2px solid ${T.amber}}
.bento{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:9px;margin:16px 20px 0}
.bcell{background:${T.card};border:1px solid ${T.line};border-radius:15px;padding:13px 12px}
.bcell.big{background:linear-gradient(150deg,#2d2640,${T.card})}
.bnum{font:700 25px 'Space Grotesk'}.bnum span{font-size:13px;color:#7c7795}
.blbl{font:700 9px 'Space Grotesk';letter-spacing:.8px;color:#9a96b0;margin-top:4px;display:flex;align-items:center;gap:4px}
.blbl.amber{color:${T.amber}}
.modes{display:flex;gap:9px;margin:11px 20px 0}
.mode{flex:1;background:${T.card};border:1px solid ${T.line};border-radius:13px;padding:11px;display:flex;align-items:center;gap:9px}
.mic2{width:32px;height:32px;border-radius:9px;background:${T.cardHi};display:flex;align-items:center;justify-content:center;color:${T.amber}}
.mode b{font:600 13.5px 'Inter';display:block}.mode i{font-style:normal;font-size:11px;color:${T.mut}}
.nextline{display:flex;align-items:center;gap:7px;margin:15px 20px 6px;color:${T.mut};font:700 10px 'Space Grotesk';letter-spacing:1.4px}
.nextline b{color:${T.ink};margin-left:auto}

/* practice */
.pbar{display:flex;gap:6px;padding:18px 18px 11px}
.tagc{font:700 10px 'Space Grotesk';letter-spacing:1.4px;padding:5px 9px;border-radius:7px;background:${T.amber};color:${T.amberInk}}
.tagc.ghost{background:transparent;border:1px solid ${T.line};color:#9a96b0}
.qcard{margin:0 18px 14px;display:flex;gap:9px}
.ql{font:700 17px 'Space Grotesk';color:${T.amber}}
.qbig{font:600 16.5px 'Space Grotesk';line-height:1.3}
.row{display:flex;gap:7px;margin:0 16px 8px;align-items:flex-end}
.row.stu{justify-content:flex-end}
.fav{width:30px;height:30px;border-radius:50%;background:#2a2233;flex:0 0 30px;display:flex;align-items:center;justify-content:center}
.bub{max-width:80%;padding:10px 12px;font-size:13px;line-height:1.4}
.tutb{background:${T.card};border:1px solid ${T.line};border-radius:13px;border-bottom-left-radius:4px;color:#ddd9ea}
.stub{background:${T.amber};color:${T.amberInk};border-radius:13px;border-bottom-right-radius:4px;font-weight:600}
.composer{margin-top:auto;padding:9px 12px 14px}
.qr-row{display:flex;gap:6px;margin-bottom:8px}
.qr{font:600 12px 'Inter';padding:6px 11px;border-radius:999px;background:${T.card};border:1px solid ${T.line};color:#bcb7cd}
.inbar{display:flex;align-items:center;gap:8px;padding:7px 8px 7px 12px;border-radius:22px;background:${T.card};border:1px solid ${T.line}}
.ib{color:#7c7795}.ph{flex:1;font-size:12.5px;color:#7c7795}
.send{width:36px;height:36px;border-radius:50%;background:${T.amber};color:${T.amberInk};display:flex;align-items:center;justify-content:center;flex:0 0 36px}

/* result */
.result{align-items:center;padding:0 24px}
.cf{position:absolute;z-index:0}
.rfox{margin:54px auto 4px;z-index:1}
.rverdict{font:700 34px 'Space Grotesk';color:${T.good};z-index:1}
.rsub{color:${T.mut};font-size:13.5px;margin-top:4px;z-index:1}
.xpcard{align-self:stretch;background:${T.card};border:1px solid ${T.line};border-radius:18px;padding:15px 16px;margin:22px 0 18px;z-index:1}
.xprow{display:flex;align-items:center;justify-content:space-between;font-size:13.5px;color:#cfcadd;padding:5px 0}
.xprow span{display:flex;align-items:center;gap:7px}
.xprow b{font:700 16px 'Space Grotesk'}.xprow .amber{color:${T.amber}}.good{color:${T.good}}
.masteryrow{margin-top:10px;padding-top:12px;border-top:1px solid ${T.line}}
.mlbl{display:flex;justify-content:space-between;font-size:11.5px;color:${T.mut};margin-bottom:7px}.mlbl b{color:${T.ink};font-weight:600}
.mtrack{position:relative;height:7px;background:${T.cardHi};border-radius:4px}
.mtrack i{position:absolute;left:0;top:0;height:100%;background:${T.good};border-radius:4px}
.mtrack u{position:absolute;top:-2px;width:2px;height:11px;background:#fff5;border-radius:2px}
.result>.btn.amber{align-self:stretch}
`;

const phone=(s)=>`<div class="phone"><div class="screen">${s}</div></div>`;
const col=(letter,name,sub,s)=>`<div class="col"><div class="cap"><b>${letter}</b>${name} <i>· ${sub}</i></div>${phone(s)}</div>`;
const html=`<!doctype html><html><head><meta charset="utf8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="page">
<div class="h1">Recommended direction, fleshed out <span>· “Bold &amp; Editorial, warmed” — the daily flow</span></div>
<div class="note">Refined fennec-fox mascot reaching for the star (keeps the Nejma story), confident headline type, warm amber accent on a dark surface, and — crucially — the <b>“you got it right” moment</b>, where streak, XP and mastery land with a little celebration. This is where the current app feels most like a web form. Still a mockup; if you'd rather see this energy in light/playful (A) or calm/premium (B), I'll re-skin it.</div>
<div class="deck">
${col('1','Welcome','first launch',welcome)}
${col('2','Today','the daily home',today)}
${col('3','Practice','coaching, not answers',practice)}
${col('4','Correct!','the reward moment',result)}
</div></div></body></html>`;

const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1420,height:840},deviceScaleFactor:2});
writeFileSync('/home/user/proactive-tutor-agent/mockups/flow-c.html',html);
await page.goto('file:///home/user/proactive-tutor-agent/mockups/flow-c.html');
await page.waitForTimeout(1600);
const el=await page.$('.page');
await el.screenshot({path:'/home/user/proactive-tutor-agent/mockups/tnejjem-flow-recommended.png'});
console.log('done');
await browser.close();
