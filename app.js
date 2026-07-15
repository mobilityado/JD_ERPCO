const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const cfg=window.CONCILIA_CONFIG||{};
let selected=[], rows=[], currentUser=null, lastFound={}, quickFilter='all';
const fmt=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n||0);
const pct=n=>`${(n||0).toFixed(2)}%`;
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const normId=s=>String(s||'').replace(/\D/g,'').replace(/^0+/,'')||'0';

async function loadUsers(){
  const sel=$('#user'); sel.disabled=true; sel.innerHTML='<option value="">Cargando usuarios...</option>';
  try{
    const r=await fetch(`${cfg.AUTH_URL}?accion=usuarios&_=${Date.now()}`), d=await r.json();
    if(d.error===true) throw Error(d.mensaje||'No fue posible obtener los usuarios');
    const users=Array.isArray(d.usuarios)?d.usuarios:Array.isArray(d.data)?d.data:[];
    sel.innerHTML='<option value="">Selecciona tu usuario</option>'+users.map(u=>{const usuario=String(u.usuario||u.user||'').trim(),nombre=String(u.nombre||u.name||usuario).trim();return usuario?`<option value="${esc(usuario)}">${esc(nombre)}</option>`:''}).join('');
    if(!users.length) sel.innerHTML='<option value="">No hay usuarios activos</option>';
  }catch(e){sel.innerHTML='<option value="">No se pudieron cargar los usuarios</option>';$('#loginMsg').textContent='No pude cargar la lista de usuarios: '+e.message}
  finally{sel.disabled=false}
}
function csvLine(line){let a=[],v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){v+='"';i++}else q=!q}else if(c===','&&!q){a.push(v);v=''}else v+=c}a.push(v);return a}
function parseCSV(t){return t.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim()).map(csvLine)}
function num(v){const x=parseFloat(String(v||'').replace(/,/g,''));return Number.isFinite(x)?x:0}
function brandFrom(name,text){const n=(name+' '+text.slice(0,500)).toUpperCase();if(n.includes('TRT'))return'TRT';if(n.includes('SUR')||n.includes('AAO'))return'SUR';if(n.includes('ADO'))return'ADO';return'OTRO'}
async function login(){
  const u=$('#user').value.trim(),p=$('#pass').value;if(!u||!p)return $('#loginMsg').textContent='Selecciona usuario y escribe tu contraseña.';
  $('#loginMsg').textContent='Validando...';
  try{const r=await fetch(`${cfg.AUTH_URL}?accion=login&usuario=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`),d=await r.json();const ok=d.ok===true||d.success===true||d.error===false||d.acceso===true;if(!ok)throw Error(d.mensaje||'Credenciales incorrectas');currentUser={usuario:u,nombre:d.nombre||d.name||u,rango:d.rango||d.rol||''};openApp()}catch(e){$('#loginMsg').textContent='No pude validar el acceso: '+e.message}
}
function openApp(){localStorage.setItem('conciliiaUser',JSON.stringify(currentUser));$('#login').classList.add('hidden');$('#app').classList.remove('hidden');$('#hello').textContent=`👋 Hola ${currentUser.nombre}.`;$('#who').textContent=currentUser.rango?`${currentUser.nombre} · ${currentUser.rango}`:currentUser.nombre}
$('#loginBtn').onclick=login; loadUsers(); $('#pass').addEventListener('keydown',e=>e.key==='Enter'&&login()); $('#logout').onclick=()=>{localStorage.removeItem('conciliiaUser');location.reload()};
$$('nav button').forEach(b=>b.onclick=()=>{$$('nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(v=>v.classList.remove('active'));$('#'+b.dataset.view).classList.add('active')});

function inspectFiles(){
  const checks={}; selected.forEach(f=>{const n=f.name.toUpperCase();const b=n.includes('TRT')?'TRT':n.includes('SUR')||n.includes('AAO')?'SUR':n.includes('ADO')?'ADO':'OTRO';const t=n.includes('JDE')?'JDE':'Saldos';if(b!=='OTRO')checks[`${t} ${b}`]=true});
  $('#fileChecks').innerHTML=['JDE ADO','Saldos ADO','JDE SUR','Saldos SUR','JDE TRT','Saldos TRT'].map(x=>`<div class="file-check ${checks[x]?'ok':''}">${checks[x]?'✓':'○'} ${x}</div>`).join('');
}
$('#files').onchange=e=>{selected=[...e.target.files];$('#fileList').innerHTML=selected.map(f=>`<div>✓ ${esc(f.name)}</div>`).join('');inspectFiles()};

async function reconcile(){
  if(!selected.length)return setStatus('🤔 Todavía me faltan los archivos JDE y Saldos por Conductor para comenzar.');
  setStatus('Analizando archivos y conciliando información...');
  const files=[];for(const f of selected)files.push({name:f.name,text:await f.text()});
  const jde={},sal={},found={};
  for(const f of files){
    const data=parseCSV(f.text),b=brandFrom(f.name,f.text);if(b==='OTRO')continue;found[b]=found[b]||{jde:false,sal:false};
    const isJ=/^TIPO LM AUX/i.test((data[0]||[])[0]||'')||f.name.toUpperCase().includes('JDE');
    if(isJ){found[b].jde=true;const h=data[0].map(x=>x.trim()),idI=h.findIndex(x=>x.toLowerCase()==='lm aux'),nameI=h.findIndex(x=>x.toLowerCase().includes('descripción lm')),balI=h.findIndex(x=>x.toLowerCase().includes('importe real acumulado'));for(const r of data.slice(1)){const id=normId(r[idI]);if(id==='0')continue;jde[b+'|'+id]={brand:b,id,name:(r[nameI]||'').trim(),amount:num(r[balI])}}}
    else{found[b].sal=true;for(const r of data.slice(2)){if(!r[0]||/^total por empleado/i.test(r[0])||!/^[0-9]+$/.test(r[0].trim()))continue;const id=normId(r[0]),k=b+'|'+id;if(!sal[k])sal[k]={brand:b,id,name:[r[1],r[2],r[3]].filter(Boolean).join(' ').trim(),amount:0};sal[k].amount+=num(r[9])}}
  }
  const keys=new Set([...Object.keys(jde),...Object.keys(sal)]);
  rows=[...keys].map(k=>{const j=jde[k],s=sal[k],a=j?.amount||0,b=s?.amount||0,d=a-b;const state=!j?'Solo en Saldos':!s?'Solo en JDE':Math.abs(d)<=.01?'Cuadrado':'Diferencia de saldo';return{brand:(j||s).brand,id:(j||s).id,name:j?.name||s?.name||'',jde:a,saldos:b,diff:d,state}}).sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff));
  lastFound=found; render();
  const missing=[];for(const b of ['ADO','SUR','TRT']){if(!found[b]?.jde)missing.push(`JDE ${b}`);if(!found[b]?.sal)missing.push(`Saldos ${b}`)}
  const d=rows.filter(r=>r.state!=='Cuadrado').length;
  if(missing.length)setStatus('🤔 Pude conciliar parcialmente, pero todavía me falta: '+missing.join(', ')+'.');
  else if(d===0)setStatus('🎉 ¡Excelente trabajo!\nJDE y Saldos por Conductor quedaron conciliados correctamente.');
  else setStatus(`✅ Conciliación terminada.\nEncontré ${d} registros que requieren revisión. Consulta el Resumen Ejecutivo para conocer las principales causas.`);
  $('#sideState').textContent=d?'Conciliación con alertas':'Conciliación cuadrada'; show('resumen');
}
$('#run').onclick=reconcile;function setStatus(t){$('#status').textContent=t}function show(id){document.querySelector(`nav button[data-view="${id}"]`).click()}

function getStats(){
  const total=rows.length,diff=rows.filter(r=>r.state!=='Cuadrado').length,balanced=total-diff,percentage=total?balanced/total*100:0;
  const totalDebt=rows.reduce((s,r)=>s+r.saldos,0),net=rows.reduce((s,r)=>s+r.diff,0);
  const byState=Object.fromEntries(['Diferencia de saldo','Solo en JDE','Solo en Saldos','Cuadrado'].map(s=>[s,rows.filter(r=>r.state===s).length]));
  const brands=['ADO','SUR','TRT'].map(brand=>{const x=rows.filter(r=>r.brand===brand),d=x.filter(r=>r.state!=='Cuadrado');return{brand,total:x.length,diff:d.length,balanced:x.length-d.length,pct:x.length?(x.length-d.length)/x.length*100:0,debt:x.reduce((s,r)=>s+r.saldos,0),net:x.reduce((s,r)=>s+r.diff,0)}});
  return{total,diff,balanced,percentage,totalDebt,net,byState,brands};
}
function healthClass(p){return p>=98?'good':p>=90?'warn':'bad'}
function render(){
  const s=getStats();
  $('#kConductores').textContent=s.total;$('#kDif').textContent=s.diff;$('#kAdeudo').textContent=fmt(s.totalDebt);$('#kNeta').textContent=fmt(s.net);$('#kPct').textContent=pct(s.percentage);$('#gaugeValue').textContent=pct(s.percentage);
  const hc=healthClass(s.percentage),hs=$('#healthStrip');hs.className='health-strip '+hc;$('#healthTitle').textContent=s.diff===0?'Conciliación cuadrada':hc==='good'?'Conciliación estable':hc==='warn'?'Conciliación con observaciones':'Conciliación crítica';$('#healthText').textContent=s.diff===0?'No se detectaron diferencias entre JDE y Saldos.':`${s.diff} de ${s.total} conductores requieren revisión.`;
  const deg=Math.max(0,Math.min(360,s.percentage*3.6));$('.gauge').style.background=`conic-gradient(${hc==='good'?'#22c55e':hc==='warn'?'#f59e0b':'#ef4444'} ${deg}deg,#e5e7eb ${deg}deg)`;
  renderExecutive(s);renderBrands(s);renderTable();renderDebts(s);
}
function renderExecutive(s){
  const biggest=[...rows].filter(r=>r.state!=='Cuadrado').sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff))[0];
  const worst=[...s.brands].sort((a,b)=>b.diff-a.diff)[0];
  const cause=Object.entries(s.byState).filter(([k])=>k!=='Cuadrado').sort((a,b)=>b[1]-a[1])[0];
  let text='';
  if(!s.total)text='Carga los archivos para generar el diagnóstico ejecutivo.';
  else if(!s.diff)text=`Se analizaron <strong>${s.total} conductores</strong> y el <strong>100% quedó conciliado</strong>. No se detectaron diferencias entre JDE y Saldos por Conductor. La conciliación puede cerrarse con confianza.`;
  else text=`Se analizaron <strong>${s.total} conductores</strong>. <strong>${s.balanced}</strong> están cuadrados y <strong>${s.diff}</strong> requieren revisión, equivalente a un nivel de conciliación de <strong>${pct(s.percentage)}</strong>. ${worst?`La marca con más excepciones es <strong>${worst.brand}</strong> con ${worst.diff} registros.`:''} ${cause?`La causa más frecuente es <strong>${cause[0]}</strong> (${cause[1]} casos).`:''} ${biggest?`La mayor diferencia absoluta corresponde al conductor <strong>${esc(biggest.id)}</strong> por ${fmt(Math.abs(biggest.diff))}.`:''}`;
  $('#executiveNarrative').innerHTML=text;
  $('#insightChips').innerHTML=[`Cuadrados: <b>${s.balanced}</b>`,`Solo JDE: <b>${s.byState['Solo en JDE']}</b>`,`Solo Saldos: <b>${s.byState['Solo en Saldos']}</b>`,`Diferencia saldo: <b>${s.byState['Diferencia de saldo']}</b>`].map(x=>`<div class="insight-chip">${x}</div>`).join('');
}
function renderBrands(s){
  $('#brandCards').innerHTML=s.brands.map(x=>`<div class="brand-card"><div class="panel-head"><div><b>${x.brand}</b><h2>${pct(x.pct)}</h2></div><span class="badge ${x.pct>=98?'ok':x.pct>=90?'warn':'bad'}">${x.diff} diferencias</span></div><div class="progress"><i style="width:${Math.min(100,x.pct)}%"></i></div><div class="brand-metrics"><div class="metric"><span>Conductores</span><strong>${x.total}</strong></div><div class="metric"><span>Adeudo</span><strong>${fmt(x.debt)}</strong></div><div class="metric"><span>Dif. neta</span><strong>${fmt(x.net)}</strong></div></div></div>`).join('');
}
function filteredRows(){const q=$('#search').value.toLowerCase(),br=$('#brand').value,ty=$('#type').value;return rows.filter(r=>(!q||(r.id+' '+r.name+' '+r.brand).toLowerCase().includes(q))&&(!br||r.brand===br)&&(!ty||r.state===ty)&&(quickFilter==='all'||quickFilter==='critical'&&Math.abs(r.diff)>=1000||quickFilter==='jde'&&r.state==='Solo en JDE'||quickFilter==='saldos'&&r.state==='Solo en Saldos'||quickFilter==='balanced'&&r.state==='Cuadrado'))}
function renderTable(){const f=filteredRows();$('#diffBody').innerHTML=f.length?f.map(r=>`<tr><td>${esc(r.brand)}</td><td>${esc(r.id)}</td><td>${esc(r.name)}</td><td class="money">${fmt(r.jde)}</td><td class="money">${fmt(r.saldos)}</td><td class="money">${fmt(r.diff)}</td><td><span class="badge ${r.state==='Cuadrado'?'ok':r.state.includes('Solo')?'warn':'bad'}">${esc(r.state)}</span></td><td><button class="detail-btn" data-driver="${esc(r.brand+'|'+r.id)}">Ver 360°</button></td></tr>`).join(''):'<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:28px">No hay registros para los filtros seleccionados.</td></tr>';$$('.detail-btn').forEach(b=>b.onclick=()=>openDriver(b.dataset.driver))}
['search','brand','type'].forEach(id=>$('#'+id).addEventListener('input',renderTable));
$$('.quick-filters button').forEach(b=>b.onclick=()=>{$$('.quick-filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');quickFilter=b.dataset.quick;renderTable()});
function renderDebts(s){
  const debts=rows.filter(r=>r.saldos>0).sort((a,b)=>b.saldos-a.saldos).slice(0,20);$('#debtList').innerHTML=debts.length?debts.map((r,i)=>`<div class="debt"><div class="rank">${i<3?['🥇','🥈','🥉'][i]:i+1}</div><div><b>${esc(r.name||'Sin nombre')}</b><br><small>${esc(r.brand)} · ${esc(r.id)}</small></div><strong>${fmt(r.saldos)}</strong></div>`).join(''):'<div style="padding:20px;color:#9ca3af">No hay adeudos para mostrar.</div>';
  const max=Math.max(1,...s.brands.map(x=>x.debt));$('#debtByBrand').innerHTML=s.brands.map(x=>`<div class="bar-item"><div class="bar-head"><b>${x.brand}</b><span>${fmt(x.debt)}</span></div><div class="bar-track"><div class="bar-fill" style="width:${x.debt/max*100}%"></div></div></div>`).join('');
}
function diagnosis(r){if(r.state==='Cuadrado')return 'El conductor aparece en ambos reportes y los importes coinciden. No requiere acción.';if(r.state==='Solo en JDE')return 'El conductor tiene saldo registrado en JDE, pero no aparece en el reporte de Saldos por Conductor. Conviene validar si existe un movimiento pendiente de reflejar o una diferencia de fecha de corte.';if(r.state==='Solo en Saldos')return 'El conductor aparece en Saldos por Conductor, pero no tiene registro equivalente en JDE. Revisa el origen del saldo y la fecha de actualización.';return `El conductor aparece en ambos sistemas, pero existe una diferencia de ${fmt(Math.abs(r.diff))}. ${r.diff>0?'JDE presenta un importe mayor que Saldos.':'Saldos presenta un importe mayor que JDE.'}`}
function openDriver(key){const r=rows.find(x=>x.brand+'|'+x.id===key);if(!r)return;$('#driverDetail').innerHTML=`<div class="detail-hero"><div><span class="eyebrow">VISTA 360° DEL CONDUCTOR</span><h2>${esc(r.name||'Conductor '+r.id)}</h2><p>${esc(r.brand)} · Número de conductor ${esc(r.id)}</p></div><span class="badge ${r.state==='Cuadrado'?'ok':r.state.includes('Solo')?'warn':'bad'}">${esc(r.state)}</span></div><div class="detail-grid"><div class="detail-kpi"><span>Saldo JDE</span><strong>${fmt(r.jde)}</strong></div><div class="detail-kpi"><span>Saldos por Conductor</span><strong>${fmt(r.saldos)}</strong></div><div class="detail-kpi"><span>Diferencia</span><strong>${fmt(r.diff)}</strong></div></div><div class="diagnosis"><b>Diagnóstico automático</b><br>${diagnosis(r)}</div>`;$('#driverModal').classList.remove('hidden')}
$$('[data-close-modal]').forEach(x=>x.onclick=()=>$('#driverModal').classList.add('hidden'));

$('#export').onclick=()=>exportCSV(filteredRows(),'CONCILIA_JDE_vs_SALDOS.csv');
function exportCSV(data,name){const h=['Marca','Conductor','Nombre','JDE','Saldos','Diferencia','Estado'],csv=[h,...data.map(r=>[r.brand,r.id,r.name,r.jde,r.saldos,r.diff,r.state])].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv'}));a.download=name;a.click()}
$('#exportExecutive').onclick=exportExecutive;
function exportExecutive(){
  if(!rows.length)return alert('Primero ejecuta una conciliación.');
  if(typeof XLSX==='undefined'){exportCSV(rows,'CONCILIA_REPORTE_EJECUTIVO.csv');return alert('No fue posible cargar el generador de Excel. Se exportó un CSV como respaldo.')}
  const s=getStats(), wb=XLSX.utils.book_new();
  const resumen=[['CONCIL.IA · JDE vs Saldos por Conductor'],['Fecha',new Date().toLocaleString('es-MX')],['Usuario',currentUser?.nombre||''],[],['Indicador','Valor'],['Conductores analizados',s.total],['Conductores cuadrados',s.balanced],['Conductores con diferencia',s.diff],['Porcentaje conciliado',s.percentage/100],['Adeudo total en Saldos',s.totalDebt],['Diferencia neta',s.net],[],['Marca','Conductores','Diferencias','% Conciliado','Adeudo','Diferencia neta'],...s.brands.map(x=>[x.brand,x.total,x.diff,x.pct/100,x.debt,x.net])];
  const mapRows=data=>data.map(r=>({Marca:r.brand,Conductor:r.id,Nombre:r.name,JDE:r.jde,Saldos:r.saldos,Diferencia:r.diff,Estado:r.state}));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(resumen),'Resumen Ejecutivo');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(mapRows(rows)),'Conciliación');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(mapRows(rows.filter(r=>r.state!=='Cuadrado'))),'Diferencias');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(mapRows(rows.filter(r=>r.saldos>0).sort((a,b)=>b.saldos-a.saldos))),'Adeudos');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(mapRows(rows.filter(r=>r.state==='Solo en JDE'))),'Solo JDE');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(mapRows(rows.filter(r=>r.state==='Solo en Saldos'))),'Solo Saldos');XLSX.writeFile(wb,`CONCILIA_Reporte_Ejecutivo_${new Date().toISOString().slice(0,10)}.xlsx`)
}

function answer(q){
  q=q.toLowerCase();if(!rows.length)return 'Primero necesito que cargues y concilies los archivos.';const s=getStats();
  if(q.includes('por qué')||q.includes('porque')||q.includes('no cuadra')){const parts=[];if(s.byState['Diferencia de saldo'])parts.push(`${s.byState['Diferencia de saldo']} tienen importes distintos`);if(s.byState['Solo en JDE'])parts.push(`${s.byState['Solo en JDE']} aparecen solo en JDE`);if(s.byState['Solo en Saldos'])parts.push(`${s.byState['Solo en Saldos']} aparecen solo en Saldos`);return `La conciliación no cuadra principalmente porque ${parts.join(', ')}. El porcentaje conciliado actual es ${pct(s.percentage)}.`}
  if(q.includes('marca')&&q.includes('difer')){const w=[...s.brands].sort((a,b)=>b.diff-a.diff)[0];return `${w.brand} es la marca con más registros por revisar: ${w.diff} diferencias de ${w.total} conductores analizados.`}
  if(q.includes('solo')&&q.includes('jde')){const x=rows.filter(r=>r.state==='Solo en JDE');return x.length?`Hay ${x.length} conductores que aparecen solo en JDE. Los primeros son: ${x.slice(0,5).map(r=>`${r.id} (${r.brand})`).join(', ')}.`:'No hay conductores que aparezcan únicamente en JDE.'}
  if(q.includes('solo')&&q.includes('saldo')){const x=rows.filter(r=>r.state==='Solo en Saldos');return x.length?`Hay ${x.length} conductores que aparecen solo en Saldos. Los primeros son: ${x.slice(0,5).map(r=>`${r.id} (${r.brand})`).join(', ')}.`:'No hay conductores que aparezcan únicamente en Saldos.'}
  if(q.includes('cuánt')||q.includes('diferencia'))return `Encontré ${s.diff} registros con diferencia de ${s.total} conductores analizados. ${s.balanced} están cuadrados (${pct(s.percentage)}).`;
  if(q.includes('mayor')||q.includes('adeudo')){const r=[...rows].sort((a,b)=>b.saldos-a.saldos)[0];return `El mayor adeudo en Saldos es ${fmt(r.saldos)} y corresponde a ${r.name||'conductor '+r.id} (${r.brand}, conductor ${r.id}).`}
  if(q.includes('falta')||q.includes('archivo')){const missing=[];for(const b of ['ADO','SUR','TRT']){if(!lastFound[b]?.jde)missing.push(`JDE ${b}`);if(!lastFound[b]?.sal)missing.push(`Saldos ${b}`)}return missing.length?`Todavía faltan: ${missing.join(', ')}.`:'Ya están cargados los seis reportes requeridos.'}
  if(q.includes('resumen')||q.includes('estado'))return `El nivel de conciliación es ${pct(s.percentage)}: ${s.balanced} conductores cuadrados y ${s.diff} con observaciones. La diferencia neta es ${fmt(s.net)}.`;
  return 'Puedo ayudarte con el estado general, explicar por qué no cuadra, identificar la marca con más diferencias, revisar registros solo JDE/Saldos y localizar el mayor adeudo.'
}
function ask(q){if(!q)return;$('#chatLog').insertAdjacentHTML('beforeend',`<div class="me">${esc(q)}</div><div class="bot">🤖 ${esc(answer(q))}</div>`);$('#question').value='';$('#chatLog').scrollTop=$('#chatLog').scrollHeight}
$('#ask').onclick=()=>ask($('#question').value);$('#question').addEventListener('keydown',e=>e.key==='Enter'&&ask(e.target.value));$$('.suggestions button').forEach(b=>b.onclick=()=>ask(b.textContent));

inspectFiles();
let saved=localStorage.getItem('conciliiaUser');if(saved){try{currentUser=JSON.parse(saved);openApp()}catch{}}
