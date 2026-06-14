import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

/* App icon / adaptive icon / splash for Labib. */
const FP={ear:'#F0A861',earIn:'#FAD9C2',face:'#FAE6CD',muzzle:'#FFF7EE',nose:'#3A2A33',eye:'#2C2230',blush:'#F4A0A6',star:'#F5B73F'};
const eA=(cx,cy,w=9)=>`<path d="M${cx-w} ${cy+2} Q${cx} ${cy-w*0.9} ${cx+w} ${cy+2}" stroke="${FP.eye}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
function labibHappy(star){
  const EL=[46,64],ER=[74,64];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 122" width="100%" height="100%">
    ${star?`<path d="M99 15l2.4 5 5.4.4-4.1 3.6 1.3 5.3L99 31l-5 2.8 1.3-5.3-4.1-3.6 5.4-.4z" fill="${FP.star}"/>`:''}
    <path d="M40 56C28 36 18 16 22 8c14 4 28 22 32 46z" fill="${FP.ear}"/><path d="M39 50C30 35 23 20 26 13c10 4 20 19 24 36z" fill="${FP.earIn}"/>
    <path d="M80 56c12-20 22-40 18-48-14 4-28 22-32 46z" fill="${FP.ear}"/><path d="M81 50c9-15 16-30 13-37-10 4-20 19-24 36z" fill="${FP.earIn}"/>
    <path d="M28 70c-5 1-9 4-11 8 5-1 9-1 13 0zM92 70c5 1 9 4 11 8-5-1-9-1-13 0z" fill="${FP.face}"/>
    <path d="M60 30C38 30 27 48 27 69c0 22 15 35 33 35s33-13 33-35C93 48 82 30 60 30z" fill="${FP.face}"/>
    <path d="M40 73c5 18 13 26 20 26s15-8 20-26c-8 7-13 9-20 9s-12-2-20-9z" fill="${FP.muzzle}"/>
    <ellipse cx="37" cy="76" rx="6.5" ry="4" fill="${FP.blush}" opacity=".7"/><ellipse cx="83" cy="76" rx="6.5" ry="4" fill="${FP.blush}" opacity=".7"/>
    <path d="M60 74c-3.4 0-5 2-5 3.4 0 1.6 2.4 2.6 5 2.6s5-1 5-2.6C65 76 63.4 74 60 74z" fill="${FP.nose}"/>
    ${eA(...EL)}${eA(...ER)}
    <path d="M54 78 Q60 86 66 78" stroke="${FP.nose}" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`;
}
const page=(inner)=>`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:1024px;height:1024px}</style></head><body>${inner}</body></html>`;

const ICON = page(`<div style="width:1024px;height:1024px;background:radial-gradient(circle at 50% 38%, #2c2438, #17131d 72%);display:flex;align-items:center;justify-content:center">
  <div style="width:640px;height:640px;margin-top:-10px">${labibHappy(true)}</div></div>`);
const ADAPTIVE = page(`<div id="t" style="width:1024px;height:1024px;display:flex;align-items:center;justify-content:center">
  <div style="width:560px;height:560px">${labibHappy(true)}</div></div>`);
const SPLASH = page(`<div id="t" style="width:1024px;height:1024px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px">
  <div style="width:430px;height:430px">${labibHappy(true)}</div>
  <div style="font:700 92px 'Space Grotesk';letter-spacing:18px;color:#F3EFEA;padding-left:18px">LABIB</div></div>`);

const dir='/home/user/proactive-tutor-agent/mobile/assets';
const browser=await chromium.launch();
const pg=await browser.newPage({viewport:{width:1024,height:1024},deviceScaleFactor:1});
// opaque app icon
await pg.setContent(ICON); await pg.waitForTimeout(300);
await pg.screenshot({ path:`${dir}/icon.png`, clip:{x:0,y:0,width:1024,height:1024} });
// transparent adaptive foreground
await pg.setContent(ADAPTIVE); await pg.waitForTimeout(300);
await (await pg.$('#t')).screenshot({ path:`${dir}/adaptive-icon.png`, omitBackground:true });
// transparent splash (shown on #17131D bg)
await pg.setContent(SPLASH); await pg.waitForTimeout(500);
await (await pg.$('#t')).screenshot({ path:`${dir}/splash-icon.png`, omitBackground:true });
await browser.close();
console.log('icons written');
