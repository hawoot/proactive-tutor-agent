import pw from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;

/* Generate Labib mascot PNG assets (transparent) for the 5 pose keys the app
   already uses: wave / think / celebrate / coach / sleep. Drop-in replacement
   for the old art — no native dependency, the Image-based Mascot keeps working. */

const FP={ear:'#F0A861',earIn:'#FAD9C2',face:'#FAE6CD',muzzle:'#FFF7EE',nose:'#3A2A33',eye:'#2C2230',blush:'#F4A0A6',star:'#F5B73F'};
const eO=(cx,cy,r=9)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FP.eye}"/><circle cx="${cx-r*0.32}" cy="${cy-r*0.36}" r="${r*0.36}" fill="#fff"/><circle cx="${cx+r*0.3}" cy="${cy+r*0.28}" r="${r*0.16}" fill="#fff" opacity=".85"/>`;
const eA=(cx,cy,w=9)=>`<path d="M${cx-w} ${cy+2} Q${cx} ${cy-w*0.9} ${cx+w} ${cy+2}" stroke="${FP.eye}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
const eS=(cx,cy,w=8)=>`<path d="M${cx-w} ${cy-1} Q${cx} ${cy+w*0.8} ${cx+w} ${cy-1}" stroke="${FP.eye}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;

function labib(mood){
  const EL=[46,64],ER=[74,64];let eyes,mouth,bl=0.5,extra='',star=false;
  if(mood==='celebrate'){star=true;bl=0.78;eyes=eA(...EL)+eA(...ER);
    mouth=`<path d="M54 78 Q60 87 66 78z" fill="${FP.nose}"/><path d="M55 79 Q60 84 65 79" fill="#E8607A"/>`;
    extra=`<g stroke="${FP.ear}" stroke-width="2.4" stroke-linecap="round" opacity=".9"><path d="M14 38l-6-3"/><path d="M18 24l-4-6"/><path d="M106 38l6-3"/><path d="M102 24l4-6"/></g>`;}
  else if(mood==='happy'){bl=0.72;eyes=eA(...EL)+eA(...ER);mouth=`<path d="M54 78 Q60 86 66 78" stroke="${FP.nose}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;}
  else if(mood==='think'){eyes=eO(...EL)+eO(...ER);mouth=`<path d="M57 79 Q60 81 63 79" stroke="${FP.nose}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    extra=`<text x="93" y="34" font-family="Space Grotesk,Arial" font-size="22" font-weight="700" fill="${FP.ear}">?</text>`;}
  else if(mood==='sleepy'){eyes=eS(...EL)+eS(...ER);mouth=`<path d="M57 79 Q60 81 63 79" stroke="${FP.nose}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    extra=`<text x="92" y="30" font-family="Space Grotesk,Arial" font-size="16" font-weight="700" fill="${FP.ear}">z</text><text x="100" y="20" font-family="Space Grotesk,Arial" font-size="11" font-weight="700" fill="${FP.ear}" opacity=".7">z</text>`;}
  else{eyes=eO(...EL)+eO(...ER);mouth=`<path d="M60 79 v2 M60 81 q-3 2.5 -6 1 M60 81 q3 2.5 6 1" stroke="${FP.nose}" stroke-width="2" fill="none" stroke-linecap="round"/>`;}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 122" width="460" height="460">
    ${star?`<path d="M98 16l2.2 4.6 5 .4-3.8 3.3 1.2 4.9L98 31l-4.6 2.6 1.2-4.9-3.8-3.3 5-.4z" fill="${FP.star}"/>`:''}
    <path d="M40 56C28 36 18 16 22 8c14 4 28 22 32 46z" fill="${FP.ear}"/><path d="M39 50C30 35 23 20 26 13c10 4 20 19 24 36z" fill="${FP.earIn}"/>
    <path d="M80 56c12-20 22-40 18-48-14 4-28 22-32 46z" fill="${FP.ear}"/><path d="M81 50c9-15 16-30 13-37-10 4-20 19-24 36z" fill="${FP.earIn}"/>
    <path d="M28 70c-5 1-9 4-11 8 5-1 9-1 13 0zM92 70c5 1 9 4 11 8-5-1-9-1-13 0z" fill="${FP.face}"/>
    <path d="M60 30C38 30 27 48 27 69c0 22 15 35 33 35s33-13 33-35C93 48 82 30 60 30z" fill="${FP.face}"/>
    <path d="M40 73c5 18 13 26 20 26s15-8 20-26c-8 7-13 9-20 9s-12-2-20-9z" fill="${FP.muzzle}"/>
    <ellipse cx="37" cy="76" rx="6.5" ry="4" fill="${FP.blush}" opacity="${bl}"/><ellipse cx="83" cy="76" rx="6.5" ry="4" fill="${FP.blush}" opacity="${bl}"/>
    <path d="M60 74c-3.4 0-5 2-5 3.4 0 1.6 2.4 2.6 5 2.6s5-1 5-2.6C65 76 63.4 74 60 74z" fill="${FP.nose}"/>
    ${eyes}${mouth}${extra}</svg>`;
}

// pose file -> expression
const MAP = { wave:'happy', think:'think', celebrate:'celebrate', coach:'idle', sleep:'sleepy' };
const dir = '/home/user/proactive-tutor-agent/mobile/assets/mascot';

const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:480,height:480},deviceScaleFactor:2});
for(const [pose,mood] of Object.entries(MAP)){
  const html=`<!doctype html><html><head><style>*{margin:0}body{background:transparent}#w{width:460px;height:460px;display:flex;align-items:center;justify-content:center}</style></head><body><div id="w">${labib(mood)}</div></body></html>`;
  await page.setContent(html);
  await page.waitForTimeout(250);
  const el=await page.$('#w');
  await el.screenshot({ path:`${dir}/${pose}.png`, omitBackground:true });
  console.log('wrote',pose,'->',mood);
}
await browser.close();
