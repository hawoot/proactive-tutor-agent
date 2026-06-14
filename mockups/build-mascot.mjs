import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'fs';

/* Labib — tiny cute fennec exploration. Chibi proportions: big ears, big
   sparkly eyes, little blush, soft round face. Several flavors to pick from. */

const P = {
  ear:'#F0A861', earIn:'#FAD9C2', face:'#FAE6CD', muzzle:'#FFF7EE',
  nose:'#3A2A33', eye:'#2C2230', blush:'#F4A0A6', tail:'#F0A861', star:'#F5B73F',
};

/* big sparkly eye */
const eyeOpen = (cx,cy,r=9)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${P.eye}"/>
  <circle cx="${cx-r*0.32}" cy="${cy-r*0.36}" r="${r*0.36}" fill="#fff"/>
  <circle cx="${cx+r*0.30}" cy="${cy+r*0.28}" r="${r*0.16}" fill="#fff" opacity=".85"/>`;
const eyeArc = (cx,cy,w=9)=>`<path d="M${cx-w} ${cy+2} Q${cx} ${cy-w*0.9} ${cx+w} ${cy+2}" stroke="${P.eye}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
const eyeSleepy = (cx,cy,w=8)=>`<path d="M${cx-w} ${cy-1} Q${cx} ${cy+w*0.8} ${cx+w} ${cy-1}" stroke="${P.eye}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;

/* cute fennec head. mood: idle|happy|wink|sleepy. */
function head(mood='idle', {size='100%', star=false}={}){
  const EL=[46,64], ER=[74,64];
  let eyes, mouth, blushAmt=0.5;
  if (mood==='happy'){ eyes=eyeArc(...EL)+eyeArc(...ER); mouth=`<path d="M54 78 Q60 86 66 78" stroke="${P.nose}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`; blushAmt=0.75; }
  else if (mood==='wink'){ eyes=eyeArc(...EL)+eyeOpen(...ER); mouth=`<path d="M56 78 Q61 84 67 79" stroke="${P.nose}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; blushAmt=0.7; }
  else if (mood==='sleepy'){ eyes=eyeSleepy(...EL)+eyeSleepy(...ER); mouth=`<path d="M57 79 Q60 81 63 79" stroke="${P.nose}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; blushAmt=0.6; }
  else { eyes=eyeOpen(...EL)+eyeOpen(...ER); mouth=`<path d="M60 79 v2 M60 81 q-3 2.5 -6 1 M60 81 q3 2.5 6 1" stroke="${P.nose}" stroke-width="2" fill="none" stroke-linecap="round"/>`; }
  return `<svg viewBox="0 0 120 122" width="${size}" height="${size}">
    ${star?`<path d="M98 16l2.2 4.6 5 .4-3.8 3.3 1.2 4.9L98 31l-4.6 2.6 1.2-4.9-3.8-3.3 5-.4z" fill="${P.star}"/>`:''}
    <!-- ears -->
    <path d="M40 56C28 36 18 16 22 8c14 4 28 22 32 46z" fill="${P.ear}"/>
    <path d="M39 50C30 35 23 20 26 13c10 4 20 19 24 36z" fill="${P.earIn}"/>
    <path d="M80 56c12-20 22-40 18-48-14 4-28 22-32 46z" fill="${P.ear}"/>
    <path d="M81 50c9-15 16-30 13-37-10 4-20 19-24 36z" fill="${P.earIn}"/>
    <!-- cheek tufts -->
    <path d="M28 70c-5 1-9 4-11 8 5-1 9-1 13 0zM92 70c5 1 9 4 11 8-5-1-9-1-13 0z" fill="${P.face}"/>
    <!-- head -->
    <path d="M60 30C38 30 27 48 27 69c0 22 15 35 33 35s33-13 33-35C93 48 82 30 60 30z" fill="${P.face}"/>
    <!-- muzzle -->
    <path d="M40 73c5 18 13 26 20 26s15-8 20-26c-8 7-13 9-20 9s-12-2-20-9z" fill="${P.muzzle}"/>
    <!-- blush -->
    <ellipse cx="37" cy="76" rx="6.5" ry="4" fill="${P.blush}" opacity="${blushAmt}"/>
    <ellipse cx="83" cy="76" rx="6.5" ry="4" fill="${P.blush}" opacity="${blushAmt}"/>
    <!-- nose -->
    <path d="M60 74c-3.4 0-5 2-5 3.4 0 1.6 2.4 2.6 5 2.6s5-1 5-2.6C65 76 63.4 74 60 74z" fill="${P.nose}"/>
    ${eyes}${mouth}
    ${mood==='happy'?`<g stroke="${P.ear}" stroke-width="2.2" stroke-linecap="round"><path d="M16 40l-5-2"/><path d="M104 40l5-2"/><path d="M20 28l-3-4"/><path d="M100 28l3-4"/></g>`:''}
  </svg>`;
}

/* full sitting body — big head, tiny body, fluffy tail. */
function sitting({size='100%'}={}){
  return `<svg viewBox="0 0 130 150" width="${size}" height="${size}">
    <!-- tail -->
    <path d="M92 120c22 4 30-10 28-24-3 12-14 14-22 8 8 8 4 18-6 16z" fill="${P.tail}"/>
    <path d="M112 100c4 6 5 12 4 16-4-2-7-6-8-11z" fill="${P.muzzle}"/>
    <!-- body -->
    <path d="M65 96c-16 0-27 11-27 26 0 9 5 14 12 16 5 1.6 10 2 15 2s10-.4 15-2c7-2 12-7 12-16 0-15-11-26-27-26z" fill="${P.face}"/>
    <path d="M50 128c4 6 9 9 15 9s11-3 15-9c-4 4-9 6-15 6s-11-2-15-6z" fill="${P.muzzle}"/>
    <!-- front paws -->
    <ellipse cx="54" cy="139" rx="6" ry="4.5" fill="${P.muzzle}"/>
    <ellipse cx="76" cy="139" rx="6" ry="4.5" fill="${P.muzzle}"/>
    <!-- head group (scaled & shifted) -->
    <g transform="translate(7,-6) scale(0.95)">
      ${head('idle',{size:120}).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}
    </g>
  </svg>`;
}

const CSS=`*{margin:0;padding:0;box-sizing:border-box}
body{background:#e9e6df;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.page{padding:34px 36px 44px;max-width:1180px}
.h1{font:700 28px 'Space Grotesk';color:#1c1b22}.h1 span{color:#8a8577;font-weight:500;font-size:15px}
.note{margin-top:7px;font-size:13px;color:#6f6a60;max-width:860px;line-height:1.55}
.sec{margin-top:26px}
.sl{font:700 11px 'Space Grotesk';letter-spacing:2px;color:#9a948a;text-transform:uppercase;margin-bottom:14px}
.row{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}
.chip{width:158px;height:158px;border-radius:20px;display:flex;align-items:center;justify-content:center;position:relative}
.dk{background:#17131d}.lt{background:#FBF6EE;border:1px solid #ECE2D1}
.cap{position:absolute;bottom:9px;left:0;right:0;text-align:center;font:700 9.5px 'Space Grotesk';letter-spacing:1.4px}
.dk .cap{color:#fff7}.lt .cap{color:#b09a8a}
.tiny{display:flex;align-items:center;gap:14px;background:#17131d;border-radius:16px;padding:16px 20px}
.tiny .av{width:34px;height:34px;border-radius:50%;background:#241c2e;display:flex;align-items:center;justify-content:center}
.tiny .t{color:#cfc7d6;font-size:13px}.tiny b{color:#F5B73F}
.scaler{display:flex;align-items:flex-end;gap:20px;background:#fff;border-radius:16px;padding:18px 24px}
.scaler .s{display:flex;flex-direction:column;align-items:center;gap:7px}
.scaler .lbl{font:600 10px 'Space Grotesk';color:#b3aa9b}`;

const chip=(cls,inner,cap)=>`<div class="chip ${cls}">${inner}<div class="cap">${cap}</div></div>`;

const html=`<!doctype html><html><head><meta charset="utf8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body><div class="page">
<div class="h1">Labib — the tiny cute fennec <span>· cuddlier, big ears, big sparkly eyes</span></div>
<div class="note">Same fennec idea, dialed all the way to adorable: chibi proportions, oversized ears, big shiny eyes, little blush. Pick the expression set and the head-only vs little-body version, and that's our Labib.</div>

<div class="sec"><div class="sl">Expressions (head-only)</div>
<div class="row">
  ${chip('dk',head('idle',{size:'128px'}),'IDLE')}
  ${chip('dk',head('happy',{size:'128px',star:true}),'HAPPY')}
  ${chip('dk',head('wink',{size:'128px'}),'WINK')}
  ${chip('dk',head('sleepy',{size:'128px'}),'SLEEPY')}
</div></div>

<div class="sec"><div class="sl">On light + little-body version</div>
<div class="row">
  ${chip('lt',head('idle',{size:'128px'}),'ON LIGHT')}
  ${chip('lt',head('happy',{size:'128px'}),'HAPPY · LIGHT')}
  ${chip('dk',sitting({size:'140px'}),'SITTING')}
  ${chip('lt',sitting({size:'140px'}),'SITTING · LIGHT')}
</div></div>

<div class="sec"><div class="sl">Reads when tiny? (real in-app sizes)</div>
<div class="row" style="align-items:center">
  <div class="scaler">
    <div class="s">${head('happy',{size:'96px'})}<div class="lbl">96 px</div></div>
    <div class="s">${head('idle',{size:'48px'})}<div class="lbl">48 px</div></div>
    <div class="s">${head('idle',{size:'30px'})}<div class="lbl">30 px · chat avatar</div></div>
    <div class="s">${head('idle',{size:'20px'})}<div class="lbl">20 px · icon</div></div>
  </div>
  <div class="tiny"><div class="av">${head('idle',{size:'26px'})}</div><div class="t"><b>Labib</b> · Name u′ first, then we use the product rule.</div></div>
</div></div>
</div></body></html>`;

writeFileSync('/home/user/proactive-tutor-agent/mockups/labib-mascot.html',html);
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1260,height:900},deviceScaleFactor:2});
await page.goto('file:///home/user/proactive-tutor-agent/mockups/labib-mascot.html');
await page.waitForTimeout(1400);
const el=await page.$('.page');
await el.screenshot({path:'/home/user/proactive-tutor-agent/mockups/labib-mascot.png'});
await browser.close();
console.log('done');
