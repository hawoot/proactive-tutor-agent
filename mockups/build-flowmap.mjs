import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'fs';

/* Flow map: current loop (friction) vs proposed loop (solve-first).
   Principle: spend energy solving, not deciding. Quick/Deep kept as a quiet
   sticky toggle, never a pop-up. */

const A='#F5B73F', INK='#1d1922', RED='#E0563B', GREEN='#39A06B', MUT='#8a8275';

const pill=(t,sub,{tone='n'}={})=>{
  const bg = tone==='bad' ? '#fff' : tone==='good' ? '#fff' : '#fff';
  const bd = tone==='bad' ? '#E7B6AC' : tone==='good' ? '#A9D9C0' : '#E3DACB';
  const dot = tone==='bad' ? RED : tone==='good' ? GREEN : '#C9BCA6';
  return `<div class="pill" style="border-color:${bd}">
    <span class="pdot" style="background:${dot}"></span>
    <div><b>${t}</b>${sub?`<i>${sub}</i>`:''}</div></div>`;
};
const arr=(tone='n')=>`<span class="arr" style="color:${tone==='bad'?RED:tone==='good'?GREEN:'#C2B6A0'}">→</span>`;
const stop=(t)=>`<div class="stop">⛔ ${t}</div>`;

const CSS=`*{margin:0;padding:0;box-sizing:border-box}
body{background:#efece4;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.page{padding:34px 38px 42px;width:1320px}
.h1{font:700 28px 'Space Grotesk';color:${INK}}
.h1 span{color:${MUT};font-weight:500;font-size:15px}
.principle{margin:14px 0 4px;background:${INK};color:#fff;border-radius:16px;padding:16px 22px;display:flex;align-items:center;gap:14px}
.principle .k{font:700 11px 'Space Grotesk';letter-spacing:2px;color:${A};white-space:nowrap}
.principle .v{font:700 20px 'Space Grotesk'}
.lane{margin-top:24px;border-radius:20px;padding:20px 22px}
.lane.now{background:#faf3ef;border:1px solid #EAD7CE}
.lane.new{background:#f6f8f3;border:1px solid #D8E8DD}
.lhead{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.tag{font:700 11px 'Space Grotesk';letter-spacing:1.6px;padding:5px 11px;border-radius:8px;color:#fff}
.lhead .desc{font-size:13px;color:${MUT}}
.flow{display:flex;align-items:stretch;flex-wrap:wrap;gap:9px}
.pill{background:#fff;border:1.5px solid #E3DACB;border-radius:14px;padding:11px 14px;display:flex;align-items:center;gap:10px;min-height:56px}
.pill b{font:700 14px 'Space Grotesk';color:${INK};display:block}
.pill i{font-style:normal;font-size:11.5px;color:${MUT};display:block;margin-top:2px}
.pdot{width:9px;height:9px;border-radius:50%;flex:0 0 9px}
.arr{font-size:22px;font-weight:700;align-self:center;padding:0 2px}
.stop{align-self:center;background:#fff;border:1.5px dashed ${RED};color:${RED};font:700 12px 'Space Grotesk';border-radius:11px;padding:9px 12px}
.badges{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}
.badge{font:600 12px 'Inter';padding:7px 12px;border-radius:9px;display:flex;align-items:center;gap:7px}
.badge.bad{background:#fbe9e3;color:#9c3a26}
.badge.good{background:#e6f3ec;color:#1f6e48}
.callout{margin-top:26px;display:flex;gap:22px;align-items:stretch}
.cocard{flex:1;background:#fff;border:1px solid #E3DACB;border-radius:18px;padding:20px 22px}
.cocard h3{font:700 15px 'Space Grotesk';color:${INK};margin-bottom:6px}
.cocard p{font-size:13px;color:#5f594e;line-height:1.55}
.toggle{display:inline-flex;background:#17131d;border-radius:13px;padding:5px;gap:4px;margin-top:14px}
.seg{padding:8px 16px;border-radius:9px;font:700 13px 'Space Grotesk';color:#9890a6;display:flex;align-items:center;gap:6px}
.seg.on{background:${A};color:#1f1a10}
.mini{display:flex;flex-direction:column;gap:8px;margin-top:13px}
.mrow{display:flex;align-items:center;gap:9px;font-size:12.5px;color:#5f594e}
.mrow b{color:${INK};font-weight:700}
.fk{font:700 11px 'Space Grotesk';letter-spacing:1.4px;color:${A}}
.map{margin-top:26px;background:#fff;border:1px solid #E3DACB;border-radius:18px;padding:8px 6px}
.map table{width:100%;border-collapse:collapse}
.map td{padding:13px 18px;vertical-align:top;border-bottom:1px solid #f0ebe0;font-size:13px}
.map tr:last-child td{border-bottom:0}
.map .ff{color:#9c3a26;font-weight:600;width:34%}
.map .fx{color:#1f6e48;font-weight:600}
.map .x{color:${GREEN};font-weight:800;margin-right:6px}`;

const html=`<!doctype html><html><head><meta charset="utf8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="page">

<div class="h1">The flow, rethought <span>· solve first, decide less</span></div>
<div class="principle"><span class="k">PRINCIPLE</span><span class="v">Spend your energy solving, not deciding.</span></div>

<div class="lane now">
  <div class="lhead"><span class="tag" style="background:${RED}">NOW</span><span class="desc">decisions front-loaded; the question is buried behind taps and pop-ups</span></div>
  <div class="flow">
    ${pill('Onboard')} ${arr('bad')}
    ${pill('Today','4 tabs · shifting hero')} ${arr('bad')}
    ${pill('Pick a course','new users')} ${arr('bad')}
    ${pill('Tap hero')} ${arr('bad')}
    ${pill('Practice','opens as a modal',{tone:'bad'})} ${arr('bad')}
    ${pill('Answer')} ${arr('bad')}
    ${pill('Verdict')} ${arr('bad')}
    ${stop('Pop-up: Quick or Deep?')} ${arr('bad')}
    ${pill('Next question')} ${arr('bad')}
    ${pill('Done','bounce out of modal',{tone:'bad'})}
  </div>
  <div class="badges">
    <span class="badge bad">😖 5+ taps before the first real question</span>
    <span class="badge bad">🔁 Quick/Deep asked again on every skip &amp; next</span>
    <span class="badge bad">⛔ off-theme pop-ups mid-flow</span>
    <span class="badge bad">📦 Practice is a pop-over you fall into &amp; bounce out of</span>
  </div>
</div>

<div class="lane new">
  <div class="lhead"><span class="tag" style="background:${GREEN}">PROPOSED</span><span class="desc">one continuous session; the agent decides, you just solve</span></div>
  <div class="flow">
    ${pill('Onboard','ends inside your first question',{tone:'good'})} ${arr('good')}
    ${pill('Solve','you\'re answering in 1 tap',{tone:'good'})} ${arr('good')}
    ${pill('Coached verdict','inline, themed — no pop-up',{tone:'good'})} ${arr('good')}
    ${pill('Next flows in','automatically, same session',{tone:'good'})} ${arr('good')}
    ${pill('…to daily goal','3 of 5',{tone:'good'})} ${arr('good')}
    ${pill('Done for today ✓','streak ticks, gentle “one more?”',{tone:'good'})} ${arr('good')}
    ${pill('Today reflects it',null,{tone:'good'})}
  </div>
  <div class="badges">
    <span class="badge good">⚡ 1 tap from nudge → solving</span>
    <span class="badge good">🦊 agent pre-picks Quick/Deep — you can flip anytime</span>
    <span class="badge good">✨ zero pop-ups in the normal loop</span>
    <span class="badge good">🎯 a clear daily target with a real finish line</span>
  </div>
</div>

<div class="callout">
  <div class="cocard">
    <div class="fk">KEEP THE FEATURE, DROP THE FRICTION</div>
    <h3>Quick vs Deep → a quiet, sticky toggle</h3>
    <p>The agent sets it from context (a 2-min nudge opens Quick; a study session opens Deep). It rides along in the session header — change it in one tap and it <b>stays</b> for the next questions. Never a pop-up, never asked twice.</p>
    <div class="toggle"><span class="seg on">⚡ Quick</span><span class="seg">🧠 Deep</span></div>
  </div>
  <div class="cocard">
    <div class="fk">THE SESSION, MADE TANGIBLE</div>
    <h3>You're always somewhere, with a finish line</h3>
    <div class="mini">
      <div class="mrow"><b>2 / 5</b> a slim progress strip at the top of the session</div>
      <div class="mrow">📷 🎤 ⌨️ <span>same answer-by-type/talk/snap, unchanged</span></div>
      <div class="mrow">⏭️ <b>Skip</b> = one tap, moves on — no “what kind?” prompt</div>
      <div class="mrow">🏁 <b>Done for today</b> returns you to a Today that shows what you just did</div>
    </div>
  </div>
</div>

<div class="map">
  <table>
    <tr><td class="ff"><span class="x">✓</span>Too many taps to practice</td><td class="fx">Onboarding ends <em>inside</em> the first coached question; the nudge and Today's one button drop you straight into solving.</td></tr>
    <tr><td class="ff"><span class="x">✓</span>Quick/Deep + the pop-ups</td><td class="fx">Kept as a sticky toggle the agent pre-sets. Skip & next never ask again — the off-theme pop-ups disappear entirely.</td></tr>
    <tr><td class="ff"><span class="x">✓</span>Unclear what “today” wants</td><td class="fx">One stable target (e.g. 3 of 5) and one consistent action. Reviews / exam countdowns move to a secondary line, not the main button.</td></tr>
    <tr><td class="ff"><span class="x">✓</span>Practice feels disconnected</td><td class="fx">Framed as a continuous session with progress + a finish line, returning you to a Today that reflects it — not a modal you bounce out of.</td></tr>
  </table>
</div>

</div></body></html>`;

writeFileSync('/home/user/proactive-tutor-agent/mockups/labib-flowmap.html',html);
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1340,height:900},deviceScaleFactor:2});
await page.goto('file:///home/user/proactive-tutor-agent/mockups/labib-flowmap.html');
await page.waitForTimeout(1400);
const el=await page.$('.page');
await el.screenshot({path:'/home/user/proactive-tutor-agent/mockups/labib-flowmap.png'});
await browser.close();
console.log('done');
