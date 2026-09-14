import { solve, calibrate, fromMap, parseCoordinates } from './math.mjs?v=2';
const $ = id => document.getElementById(id);
const canvas = $('plot'), ctx = canvas.getContext('2d');
let mode = 'coords', result = null, image = null, gun = null, target = null, mpp = null, stage = null, calPoints = [], calSpan = null, loadId = 0;
function message(text, error = false) { $('status').textContent = text; $('status').classList.toggle('error', error); }
function read(id) { const field = $(id); if (field.value.trim() === '' || !Number.isFinite(field.valueAsNumber)) throw new Error('Enter valid numbers in all fields.'); return field.valueAsNumber; }
function show(r) {
  result = r;
  $('distance').textContent = r ? r.distance.toFixed(2) : '—';
  $('bearing').textContent = r ? (r.bearing === null ? 'No bearing' : (Math.round(r.bearing * 100) / 100 % 360).toFixed(2) + '°') : '— °';
  $('direction').textContent = r?.direction || '';
  $('copy').disabled = !r;
  $('result-source').textContent = mode === 'map' ? 'MAP DISTANCE' : 'HORIZONTAL DISTANCE';
}
function calculate(quiet = false) {
  try { const g = parseCoordinates($('gun-coords').value), t = parseCoordinates($('target-coords').value); show(solve(g.x,g.y,t.x,t.y,read('scale'))); message(result.distance ? 'Calculated · Bearing runs clockwise from north.' : 'Same position · Bearing is undefined.'); }
  catch (e) { show(null); const missing = ['gun-coords','target-coords','scale'].some(id => $(id).value.trim() === ''); if (!quiet || !missing) message(e.message,true); else message('Paste both positions to calculate.'); }
  draw();
}
function setStage(next) {
  stage = next;
  for (const [id, s] of [['calibrate','calibrate'],['pick-gun','gun'],['pick-target','target']]) $(id).classList.toggle('active',s === next);
}
function setMode(next) {
  mode = next;
  $('coords-tab').setAttribute('aria-pressed',next === 'coords'); $('map-tab').setAttribute('aria-pressed',next === 'map');
  $('coords-controls').hidden = next !== 'coords'; $('map-controls').hidden = next !== 'map';
  $('view-label').textContent = next === 'map' ? 'MAP PICKER' : 'DIRECTION PREVIEW';
  if (next === 'coords') calculate(true);
  else { show(gun && target && mpp ? fromMap(gun,target,mpp) : null); message(!image ? 'Load or paste a north-up map screenshot.' : !mpp ? 'Calibrate the scale before picking positions.' : 'Pick a gun or target position on the map.'); }
  draw();
}
function drawPoint(p,label,color,size) {
  ctx.fillStyle=color;ctx.strokeStyle='#101a1d';ctx.lineWidth=size/3;
  ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.font=`600 ${size*1.8}px system-ui`;ctx.lineWidth=size/2;ctx.strokeText(label,p.x+size*1.8,p.y-size*1.7);ctx.fillText(label,p.x+size*1.8,p.y-size*1.7);
}
function drawLine(a,b,size) { ctx.strokeStyle='#b8e593';ctx.lineWidth=size;ctx.setLineDash([size*4,size*3]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]); }
function draw() {
  $('empty-map').hidden = mode !== 'map' || !!image;
  canvas.hidden = mode === 'map' && !image;
  canvas.classList.toggle('picking',mode === 'map' && !!image);
  if (mode === 'map' && image) {
    if(canvas.width !== image.naturalWidth || canvas.height !== image.naturalHeight) {canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;}
    ctx.drawImage(image,0,0);
    const s = Math.max(4,canvas.width/110);
    if(gun && target) drawLine(gun,target,s/3);
    if(gun) drawPoint(gun,'GUN','#b8e593',s);
    if(target) drawPoint(target,'TARGET','#f2b679',s);
    calPoints.forEach((p,i) => drawPoint(p,String(i+1),'#d9e9f4',s));
    if(calPoints.length===2) drawLine(calPoints[0],calPoints[1],s/3);
    $('visual-hint').textContent = stage === 'calibrate' ? `Calibration: click endpoint ${calPoints.length+1} of 2` : stage === 'gun' ? 'Click your gun position' : stage === 'target' ? 'Click a target · Gun position stays fixed' : 'North-up map · Calibrate the scale first';
    return;
  }
  canvas.width=900;canvas.height=680;
  ctx.fillStyle='#132024';ctx.fillRect(0,0,900,680);
  ctx.strokeStyle='#25373b';ctx.lineWidth=1;
  for(let x=50;x<900;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,680);ctx.stroke();}
  for(let y=40;y<680;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(900,y);ctx.stroke();}
  const center={x:450,y:350},radius=230;
  ctx.strokeStyle='#3b5155';ctx.setLineDash([3,7]);
  [100,230].forEach(r=>{ctx.beginPath();ctx.arc(center.x,center.y,r,0,Math.PI*2);ctx.stroke();});ctx.setLineDash([]);
  ctx.font='16px system-ui';ctx.textAlign='center';ctx.fillStyle='#90a7aa';
  for (const [label,x,y] of [['N',450,82],['E',725,357],['S',450,633],['W',175,357]])ctx.fillText(label,x,y);
  ctx.textAlign='left';
  if(result?.bearing !== null && result) {
    const rad=result.bearing*Math.PI/180;
    const end={x:center.x+Math.sin(rad)*radius,y:center.y-Math.cos(rad)*radius};
    drawLine(center,end,2);drawPoint(end,'TARGET','#f2b679',9);
  }
  drawPoint(center,'GUN','#b8e593',9);
  $('visual-hint').textContent='North up · Direction preview, not a game map';
}
$('coordinates').addEventListener('submit',e=>{e.preventDefault();calculate();});
$('coordinates').addEventListener('input',()=>calculate(true));
$('coords-tab').onclick=()=>setMode('coords');$('map-tab').onclick=()=>setMode('map');
$('example').onclick=()=>{$('gun-coords').value='x104.73, y64.35';$('target-coords').value='x100.35, y59.50';$('scale').value='100';calculate();};
$('clear').onclick=()=>{['gun-coords','target-coords'].forEach(id=>$(id).value='');calculate(true);$('gun-coords').focus();};
$('swap').onclick=()=>{const v=$('gun-coords').value;$('gun-coords').value=$('target-coords').value;$('target-coords').value=v;calculate(true);};
$('copy').onclick=async()=>{if(!result)return;const text=`WARDOGS · ${result.distance.toFixed(2)} m · ${$('bearing').textContent} ${result.direction}`.trim();try{await navigator.clipboard.writeText(text);message('Result copied.');}catch{message('Copy unavailable. Select and copy the displayed result instead.',true);}};
async function loadFile(file) {
  if(!file)return;
  const request=++loadId;
  if(!['image/png','image/jpeg','image/webp','image/bmp'].includes(file.type)){message('Choose a PNG, JPEG, WebP or BMP screenshot.',true);return;}
  if(file.size>25*1024*1024){message('Choose a screenshot smaller than 25 MB.',true);return;}
  const url=URL.createObjectURL(file), next=new Image();
  try {
    await new Promise((resolve,reject)=>{next.onload=resolve;next.onerror=reject;next.src=url;});
    if(request!==loadId)return;
    if(next.naturalWidth*next.naturalHeight>40000000)throw new Error('Image too large');
    image=next;gun=null;target=null;mpp=null;calPoints=[];setStage(null);
    $('calibrate').disabled=false;$('pick-gun').disabled=true;$('pick-target').disabled=true;
    $('calibration').textContent='Enter a known grid span, then click Calibrate.';
    setMode('map');message('Map loaded. Enter a known span and click Calibrate.');
  } catch { if(request===loadId)message('Could not load this image. Try a smaller PNG or JPEG.',true); }
  finally {URL.revokeObjectURL(url);$('image-file').value='';}
}
$('image-file').onchange=e=>loadFile(e.target.files[0]);
document.addEventListener('paste',e=>{const item=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(item){e.preventDefault();loadFile(item.getAsFile());}});
$('calibrate').onclick=()=>{
  try {calSpan=read('known');if(calSpan<=0)throw new Error('Known span must be positive.');}
  catch(e){message(e.message,true);return;}
  calPoints=[];mpp=null;show(null);$('pick-gun').disabled=true;$('pick-target').disabled=true;
  setStage('calibrate');message('Click both ends of the known span on the screenshot.');draw();
};
$('known').oninput=()=>{mpp=null;calPoints=[];setStage(null);show(null);$('pick-gun').disabled=true;$('pick-target').disabled=true;$('calibration').textContent='Span changed. Calibrate again before picking positions.';message('Span changed. Click Calibrate again.');draw();};
$('pick-gun').onclick=()=>{setStage('gun');message('Click the gun position on your screenshot.');draw();};
$('pick-target').onclick=()=>{setStage('target');message('Click the target position on your screenshot.');draw();};
canvas.addEventListener('click',e=>{
  if(mode!=='map'||!image)return;
  const r=canvas.getBoundingClientRect();
  // object-fit: contain may letterbox a tall screenshot inside the canvas element.
  const ratio=Math.min(r.width/canvas.width,r.height/canvas.height),w=canvas.width*ratio,h=canvas.height*ratio;
  const p={x:(e.clientX-r.left-(r.width-w)/2)/ratio,y:(e.clientY-r.top-(r.height-h)/2)/ratio};
  if(p.x<0||p.y<0||p.x>canvas.width||p.y>canvas.height)return;
  if(stage==='calibrate'){
    calPoints.push(p);
    if(calPoints.length===2){try{mpp=calibrate(calPoints[0],calPoints[1],calSpan);$('calibration').textContent=`Calibrated · ${mpp.toFixed(4)} metres / image pixel`;$('pick-gun').disabled=false;gun=null;target=null;setStage('gun');message('Scale set. Click the gun position.');}catch(e){calPoints=[];message(e.message,true);}}
    else message('Now click the other end of the known span.');
  } else if(stage==='gun'&&mpp){gun=p;target=null;calPoints=[];show(null);$('pick-target').disabled=false;setStage('target');message('Gun set. Click a target position.');}
  else if(stage==='target'&&gun&&mpp){target=p;try{show(fromMap(gun,target,mpp));message('Target set. Click another target to update the result.');}catch(e){show(null);message(e.message,true);}}
  else message('Click Calibrate to set the map scale first.');
  draw();
});
draw();
