import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'fs';

/* The flow, made tangible:
   Image A — redesigned Practice as one continuous session (sticky Quick/Deep
     toggle, progress strip, two help buttons, inline next, no pop-ups).
   Image B — first run: onboarding ends INSIDE the first coached question. */

/* ---- cute Labib head (from mascot exploration) ---- */
const FP={ear:'#F0A861',earIn:'#FAD9C2',face:'#FAE6CD',muzzle:'#FFF7EE',nose:'#3A2A33',eye:'#2C2230',blush:'#F4A0A6',star:'#F5B73F'};
const eO=(cx,cy,r=9)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FP.eye}"/><circle cx="${cx-r*0.32}" cy="${cy-r*0.36}" r="${r*0.36}" fill="#fff"/><circle cx="${cx+r*0.3}" cy="${cy+r*0.28}" r="${r*0.16}" fill="#fff" opacity=".85"/>`;
const eA=(cx,cy,w=9)=>`<path d="M${cx-w} ${cy+2} Q${cx} ${cy-w*0.9} ${cx+w} ${cy+2}" stroke="${FP.eye}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
function labib(mood='idle',{size='100%',star=false}={}){
  const EL=[46,64],ER=[74,64];let eyes,mouth,bl=0.5;
  if(mood==='happy'){eyes=eA(...EL)+eA(...ER);mouth=`<path d="M54 78 Q60 86 66 78" stroke="${FP.nose}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;bl=0.75;}
  else if(mood==='think'){eyes=eO(...EL)+eO(...ER);mouth=`<path d="M57 79 Q60 81 63 79" stroke="${FP.nose}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;}
  else{eyes=eO(...EL)+eO(...ER);mouth=`<path d="M60 79 v2 M60 81 q-3 2.5 -6 1 M60 81 q3 2.5 6 1" stroke="${FP.nose}" stroke-width="2" fill="none" stroke-linecap="round"/>`;}
  return `<svg viewBox="0 0 120 122" width="${size}" height="${size}">
    ${star?`<path d="M98 16l2.2 4.6 5 .4-3.8 3.3 1.2 4.9L98 31l-4.6 2.6 1.2-4.9-3.8-3.3 5-.4z" fill="${FP.star}"/>`:''}
    <path d="M40 56C28 36 18 16 22 8c14 4 28 22 32 46z" fill="${FP.ear}"/><path d="M39 50C30 35 23 20 26 13c10 4 20 19 24 36z" fill="${FP.earIn}"/>
    <path d="M80 56c12-20 22-40 18-48-14 4-28 22-32 46z" fill="${FP.ear}"/><path d="M81 50c9-15 16-30 13-37-10 4-20 19-24 36z" fill="${FP.earIn}"/>
    <path d="M28 70c-5 1-9 4-11 8 5-1 9-1 13 0zM92 70c5 1 9 4 11 8-5-1-9-1-13 0z" fill="${FP.face}"/>
    <path d="M60 30C38 30 27 48 27 69c0 22 15 35 33 35s33-13 33-35C93 48 82 30 60 30z" fill="${FP.face}"/>
    <path d="M40 73c5 18 13 26 20 26s15-8 20-26c-8 7-13 9-20 9s-12-2-20-9z" fill="${FP.muzzle}"/>
    <ellipse cx="37" cy="76" rx="6.5" ry="4" fill="${FP.blush}" opacity="${bl}"/><ellipse cx="83" cy="76" rx="6.5" ry="4" fill="${FP.blush}" opacity="${bl}"/>
    <path d="M60 74c-3.4 0-5 2-5 3.4 0 1.6 2.4 2.6 5 2.6s5-1 5-2.6C65 76 63.4 74 60 74z" fill="${FP.nose}"/>
    ${eyes}${mouth}</svg>`;
}
const I={cam:'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z',mic:'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v1a7 7 0 0 1-14 0v-1 M12 18v4',arrowUp:'m5 12 7-7 7 7 M12 19V5',chevR:'m9 18 6-6-6-6',check:'M20 6 9 17l-5-5',flame:'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',compass:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M16.2 7.8l-2.9 5.4-5.4 2.9 2.9-5.4z',eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',skip:'M5 4l10 8-10 8z M19 5v14',back:'m15 18-6-6 6-6'};
const ic=(n,{size=18,sw=2}={})=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${I[n].split(' M').map((p,i)=>`<path d="${i?'M'+p:p}"/>`).join('')}</svg>`;

const VARS='--bg:#17131d;--card:#221c2b;--cardHi:#2a2236;--line:#332b42;--ink:#F3EFEA;--mut:#9890a6;--a:#F5B73F;--aInk:#1f1a10';

/* session header: back · progress · sticky quick/deep toggle */
const shead=(done,total,mode='quick')=>`
<div class="phead">
  <span class="hicon">${ic('back',{size:20})}</span>
  <div class="prog"><div class="ptrack"><i style="width:${done/total*100}%"></i></div><span>${done} / ${total}</span></div>
  <div class="mtoggle">
    <span class="seg ${mode==='quick'?'on':''}">⚡<i>Quick</i></span>
    <span class="seg ${mode==='deep'?'on':''}">🧠<i>Deep</i></span>
  </div>
</div>`;

const avatar=(mood='idle')=>`<div class="av">${labib(mood,{size:'30px'})}</div>`;

/* A1 — active guided session */
const sessionActive=`
${shead(2,5,'quick')}
<div class="chat">
  <div class="qcard"><div class="ql">QUESTION · DIFFERENTIATION</div><div class="qtext">Differentiate f(x) = 3x²·sin(x).</div></div>
  <div class="row tut">${avatar('think')}<div class="bub tutb">Two functions are multiplied here. Can you name them?</div></div>
  <div class="row stu"><div class="bub stub">u = 3x² and v = sin x</div></div>
  <div class="row tut">${avatar('idle')}<div class="bub tutb">Exactly. The product rule is <b>u′v + uv′</b>. Let's build it — what's u′?</div></div>
</div>
<div class="composer">
  <div class="helprow">
    <span class="hbtn primary">${ic('compass',{size:15})} Walk me through it</span>
    <span class="hbtn">${ic('eye',{size:15})} Show me the solution</span>
  </div>
  <div class="inbar"><span class="ib">${ic('cam')}</span><span class="ib">${ic('mic')}</span><span class="ph">Type, talk, or snap…</span><span class="send">${ic('arrowUp',{size:18,sw:2.4})}</span></div>
  <div class="skiprow"><span class="skip">${ic('skip',{size:13})} Skip — next one</span></div>
</div>`;

/* A2 — just answered: inline coached verdict + inline next (no pop-up) */
const sessionVerdict=`
${shead(3,5,'quick')}
<div class="chat">
  <div class="row stu"><div class="bub stub">f′(x) = 6x·sin x + 3x²·cos x</div></div>
  <div class="verdict">
    <div class="vfox">${labib('happy',{size:'70px',star:true})}</div>
    <div class="vtitle">Correct!</div>
    <div class="vsub">Clean use of the product rule — both terms right.</div>
    <div class="vmeta"><span>${ic('flame',{size:14})} 12-day streak</span><span class="dot">·</span><span>+15 XP</span><span class="dot">·</span><span>mastery 78→82%</span></div>
  </div>
  <div class="nextinline">
    <button class="btn acc">Next question ${ic('chevR',{size:17,sw:2.6})}</button>
    <div class="fuprow"><span class="fu">Explain more</span><span class="fu">A similar one</span></div>
  </div>
</div>
<div class="composer slim">
  <div class="inbar"><span class="ph">Any follow-up for Labib?</span><span class="send">${ic('arrowUp',{size:18,sw:2.4})}</span></div>
</div>`;

/* A3 — done for today finish */
const sessionDone=`
<div class="finish">
  <div class="ffox">${labib('happy',{size:'128px',star:true})}</div>
  <div class="ftitle">Done for today</div>
  <div class="fsub">5 of 5 — you said you couldn't. Labib disagreed.</div>
  <div class="fstats">
    <div class="fstat"><b>🔥 13</b><i>day streak</i></div>
    <div class="fstat"><b>+70</b><i>XP today</i></div>
    <div class="fstat"><b>4</b><i>skills up</i></div>
  </div>
  <button class="btn acc">One more? <span class="opt">optional</span></button>
  <button class="btn ghost">See you at 18:30 →</button>
</div>`;

/* B1 — onboarding: a single, light choice */
const onbGoal=`
<div class="onb">
  <div class="obrand">LABIB</div>
  <div class="ofox">${labib('idle',{size:'88px'})}</div>
  <div class="otitle">What are you<br>working toward?</div>
  <div class="osub">Labib builds your plan around it. You can change this later.</div>
  <div class="opts">
    <span class="opt2 on">Bac · Mathématiques <span class="okck">${ic('check',{size:15,sw:3})}</span></span>
    <span class="opt2">Bac · Sciences expérimentales</span>
    <span class="opt2">Bac · Technique</span>
    <span class="opt2">Just brushing up</span>
  </div>
  <button class="btn acc">Continue ${ic('chevR',{size:17,sw:2.6})}</button>
</div>`;

/* B2 — handoff: straight into doing, no dashboard detour */
const onbHandoff=`
<div class="handoff">
  <div class="hfox">${labib('happy',{size:'120px',star:true})}</div>
  <div class="htitle">You're all set, Nidhal.</div>
  <div class="hsub">No dashboard, no setup maze. Let's just do your first one together — relax, it's only between us.</div>
  <div class="hchips"><span class="hc">⚡ Quick to start</span><span class="hc">🧭 I'll guide you</span></div>
  <button class="btn acc big">Start my first question ${ic('arrowUp',{size:17,sw:2.4})}</button>
</div>`;

/* B3 — first question already in chat (same session UI, gentle first beat) */
const onbFirst=`
${shead(0,3,'quick')}
<div class="firsttag">YOUR FIRST ONE · NO PRESSURE</div>
<div class="chat">
  <div class="qcard"><div class="ql">QUESTION · DERIVATIVES</div><div class="qtext">Differentiate f(x) = x³.</div></div>
  <div class="row tut">${avatar('happy')}<div class="bub tutb">Hey, I'm Labib 🦊 Let's ease in. This one uses the power rule — want to try, or shall I walk you through it?</div></div>
</div>
<div class="composer">
  <div class="helprow">
    <span class="hbtn primary">${ic('compass',{size:15})} Walk me through it</span>
    <span class="hbtn">${ic('eye',{size:15})} Show me the solution</span>
  </div>
  <div class="inbar"><span class="ib">${ic('cam')}</span><span class="ib">${ic('mic')}</span><span class="ph">Type your answer…</span><span class="send">${ic('arrowUp',{size:18,sw:2.4})}</span></div>
</div>`;

const CSS=`*{margin:0;padding:0;box-sizing:border-box}
body{background:#e9e6df;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.page{padding:32px 34px 42px}
.h1{font:700 27px 'Space Grotesk';color:#1c1b22}.h1 span{color:#8a8577;font-weight:500;font-size:15px}
.note{margin-top:7px;font-size:13px;color:#6f6a60;max-width:920px;line-height:1.55}
.deck{display:flex;gap:24px;margin-top:24px;flex-wrap:wrap}
.col{width:300px}
.cap{font:700 13px 'Space Grotesk';color:#1c1b22;margin:0 4px 11px;display:flex;align-items:center;gap:7px}
.cap b{background:#1c1b22;color:#fff;font-size:10.5px;padding:2px 7px;border-radius:6px;letter-spacing:.4px}
.cap i{color:#9a948a;font-weight:500;font-style:normal}
.phone{width:300px;height:648px;border-radius:38px;background:#0c0c11;padding:9px;box-shadow:0 20px 46px rgba(40,32,20,.22)}
.screen{width:100%;height:100%;border-radius:30px;overflow:hidden}
.scr{height:100%;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;position:relative;overflow:hidden;${VARS}}
.btn{border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font:700 15px 'Space Grotesk';width:100%}
.btn.acc{background:var(--a);color:var(--aInk);padding:13px;border-radius:13px}
.btn.acc.big{padding:15px}
.btn.ghost{background:transparent;color:var(--mut);font-weight:600;font-family:'Inter';font-size:13.5px;padding:11px;margin-top:4px}
.opt{font:600 10px 'Inter';opacity:.6;margin-left:2px}
/* session header */
.phead{display:flex;align-items:center;gap:10px;padding:15px 15px 10px}
.hicon{color:var(--mut)}
.prog{flex:1;display:flex;align-items:center;gap:8px}
.ptrack{flex:1;height:6px;background:var(--cardHi);border-radius:4px;overflow:hidden}
.ptrack i{display:block;height:100%;background:var(--a);border-radius:4px}
.prog span{font:700 11px 'Space Grotesk';color:var(--mut)}
.mtoggle{display:flex;background:#120e18;border-radius:10px;padding:3px;gap:2px}
.seg{display:flex;align-items:center;gap:3px;padding:5px 7px;border-radius:8px;font-size:11px;color:var(--mut)}
.seg i{font-style:normal;font:700 10px 'Space Grotesk'}
.seg.on{background:var(--a);color:var(--aInk)}
/* chat */
.chat{flex:1;overflow:hidden;padding:4px 15px}
.qcard{background:var(--card);border-left:3px solid var(--a);border-radius:12px;padding:11px 13px;margin-bottom:13px}
.ql{font:700 9px 'Space Grotesk';letter-spacing:1.2px;color:var(--a);margin-bottom:5px}
.qtext{font:600 16px 'Space Grotesk';line-height:1.3}
.row{display:flex;gap:7px;margin-bottom:9px;align-items:flex-end}
.row.stu{justify-content:flex-end}
.av{width:30px;height:30px;border-radius:50%;background:var(--cardHi);flex:0 0 30px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.bub{max-width:78%;padding:10px 12px;font-size:12.5px;line-height:1.42}
.tutb{background:var(--card);border:1px solid var(--line);border-radius:14px;border-bottom-left-radius:4px}
.tutb b{color:var(--a)}
.stub{background:var(--a);color:var(--aInk);border-radius:14px;border-bottom-right-radius:4px;font-weight:600}
/* inline verdict */
.verdict{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;text-align:center;margin:6px 0 12px}
.vfox{margin:0 auto}
.vtitle{font:700 22px 'Space Grotesk';color:#46c186;margin-top:2px}
.vsub{font-size:12px;color:var(--mut);margin-top:3px}
.vmeta{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:9px;font:700 10.5px 'Space Grotesk';color:var(--ink)}
.vmeta span{display:flex;align-items:center;gap:4px}.vmeta .dot{color:var(--mut)}
.nextinline .fuprow{display:flex;gap:7px;justify-content:center;margin-top:9px}
.fu{font:600 11.5px 'Inter';padding:6px 12px;border-radius:999px;background:var(--card);border:1px solid var(--line);color:var(--mut)}
/* composer */
.composer{padding:9px 13px 13px}
.composer.slim{margin-top:auto}
.helprow{display:flex;gap:8px;margin-bottom:9px}
.hbtn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;font:700 12px 'Space Grotesk';padding:11px 8px;border-radius:12px;background:var(--card);border:1px solid var(--line);color:var(--ink);text-align:center}
.hbtn.primary{background:rgba(245,183,63,.13);border:1.5px solid var(--a);color:var(--a)}
.inbar{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 12px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
.ib{color:var(--mut)}.ph{flex:1;font-size:12px;color:var(--mut)}
.send{width:35px;height:35px;border-radius:50%;background:var(--a);color:var(--aInk);display:flex;align-items:center;justify-content:center;flex:0 0 35px}
.skiprow{display:flex;justify-content:center;margin-top:9px}
.skip{display:flex;align-items:center;gap:5px;font:600 11.5px 'Inter';color:var(--mut)}
/* finish */
.finish{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 26px;text-align:center}
.ffox{margin-bottom:4px}
.ftitle{font:700 28px 'Space Grotesk'}
.fsub{font-size:13px;color:var(--mut);margin-top:5px;line-height:1.45}
.fstats{display:flex;gap:10px;align-self:stretch;margin:22px 0}
.fstat{flex:1;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px 6px}
.fstat b{font:700 18px 'Space Grotesk';display:block}.fstat i{font-style:normal;font-size:10px;color:var(--mut)}
/* onboarding */
.onb{flex:1;padding:26px 22px;display:flex;flex-direction:column}
.obrand{font:700 13px 'Space Grotesk';letter-spacing:3px;color:var(--mut)}
.ofox{margin:14px 0 6px}
.otitle{font:700 30px 'Space Grotesk';line-height:1.02;letter-spacing:-.5px}
.osub{font-size:13px;color:var(--mut);margin:9px 0 20px;line-height:1.5}
.opts{display:flex;flex-direction:column;gap:9px;margin-bottom:auto}
.opt2{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;border-radius:13px;background:var(--card);border:1.5px solid var(--line);font:600 14px 'Inter'}
.opt2.on{border-color:var(--a);background:rgba(245,183,63,.1)}
.okck{color:var(--a)}
.handoff{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 28px}
.hfox{margin-bottom:6px}
.htitle{font:700 26px 'Space Grotesk'}
.hsub{font-size:13.5px;color:var(--mut);margin:9px 0 16px;line-height:1.5}
.hchips{display:flex;gap:8px;margin-bottom:24px}
.hc{font:700 11px 'Space Grotesk';padding:7px 11px;border-radius:999px;background:var(--card);border:1px solid var(--line);color:var(--ink)}
.firsttag{text-align:center;font:700 9px 'Space Grotesk';letter-spacing:1.6px;color:var(--a);padding:2px 0 9px}
`;

const phone=(inner)=>`<div class="phone"><div class="screen"><div class="scr">${inner}</div></div></div>`;
const col=(letter,name,sub,el)=>`<div class="col"><div class="cap"><b>${letter}</b>${name} <i>· ${sub}</i></div>${el}</div>`;
const head=(rel)=>`<!doctype html><html><head><meta charset="utf8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="page">${rel}</div></body></html>`;

const imgA=head(`
<div class="h1">Redesigned Practice — one continuous session <span>· sticky toggle · progress · two help buttons · no pop-ups</span></div>
<div class="note">The session has a top strip you can always read: <b>back · progress (2/5) · the sticky ⚡Quick/🧠Deep toggle</b> Labib pre-set. Help is two buttons — <b>Walk me through it</b> (guided, starts with a nudge) and <b>Show me the solution</b>. Answering shows the verdict <b>inline</b> and the next question flows right in. Skip is one tap. Nothing pops up.</div>
<div class="deck">
  ${col('A1','In a session','guided, mid-question', phone(sessionActive))}
  ${col('A2','Just answered','inline verdict + inline next', phone(sessionVerdict))}
  ${col('A3','Done for today','a real finish line', phone(sessionDone))}
</div>`);

const imgB=head(`
<div class="h1">First run — straight into doing <span>· onboarding ends inside the first question</span></div>
<div class="note">One light choice, a warm hand-off, and you're <b>solving within a tap</b> — no dashboard maze, no "go find a course." The first thing a new user feels is Labib coaching them through a gentle question, with the two help buttons right there to discover.</div>
<div class="deck">
  ${col('B1','One light choice','what are you working toward', phone(onbGoal))}
  ${col('B2','Warm hand-off','no setup maze', phone(onbHandoff))}
  ${col('B3','First question','already coaching, no pressure', phone(onbFirst))}
</div>`);

const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1100,height:900},deviceScaleFactor:2});
for(const [name,html] of [['session',imgA],['firstrun',imgB]]){
  writeFileSync(`/home/user/proactive-tutor-agent/mockups/labib-${name}.html`,html);
  await page.goto('file:///home/user/proactive-tutor-agent/mockups/labib-'+name+'.html');
  await page.waitForTimeout(1500);
  const el=await page.$('.page');
  await el.screenshot({path:`/home/user/proactive-tutor-agent/mockups/labib-${name}.png`});
  console.log('wrote',name);
}
await browser.close();
