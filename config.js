window.CONCILIA_CONFIG = {
  APP_NAME: 'CONCIL.IA · JDE vs Saldos',
  AUTH_URL: 'https://script.google.com/macros/s/AKfycbwVT_L-lEbRVZe3_yncepS478H7xGM_m4Vw9v-bQKHhxo0COojqEEWViEnLDr0zLsk/exec'
};


/* =========================================================
   V6 · EXECUTIVE CONTROL
   Funciones visuales añadidas sin modificar el motor V5.
   ========================================================= */
(function(){
  function moneyV6(n){
    const v = Number(n || 0);
    return v.toLocaleString('es-MX',{style:'currency',currency:'MXN'});
  }

  function getRowsV6(){
    if (Array.isArray(window.results)) return window.results;
    if (Array.isArray(window.resultados)) return window.resultados;
    if (Array.isArray(window.conciliationRows)) return window.conciliationRows;
    if (Array.isArray(window.conciliacion)) return window.conciliacion;
    return [];
  }

  function normalizeRowV6(r){
    const brand = String(r.brand || r.marca || r.MARCA || 'ADO').toUpperCase();
    const name = r.name || r.nombre || r.NOMBRE || r.conductor || 'Sin nombre';
    const key = r.key || r.clave || r.CLAVE || r.employee || r.empleado || '';
    const diffRaw = r.diff ?? r.diferencia ?? r.DIFERENCIA ?? r.difference ?? 0;
    const diff = Number(String(diffRaw).replace(/[$,\s]/g,'')) || 0;
    const jdeRaw = r.jde ?? r.JDE ?? r.totalJde ?? r.total_jde ?? 0;
    const erpcoRaw = r.erpco ?? r.ERPCO ?? r.saldos ?? r.totalErpco ?? r.total_erpco ?? 0;
    const jde = Number(String(jdeRaw).replace(/[$,\s]/g,'')) || 0;
    const erpco = Number(String(erpcoRaw).replace(/[$,\s]/g,'')) || 0;
    const squared = Math.abs(diff) < 0.01 || /cuadr/i.test(String(r.status || r.estatus || ''));
    return {brand,name,key,diff,jde,erpco,squared};
  }

  function renderAttentionV6(){
    const list = document.getElementById('attentionList');
    const count = document.getElementById('attentionCount');
    if (!list || !count) return;

    const rows = getRowsV6().map(normalizeRowV6)
      .filter(r => !r.squared)
      .sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff));

    count.textContent = rows.length;
    if (!rows.length){
      list.innerHTML = '<div class="empty-attention">🎉 No hay conductores con diferencias pendientes.</div>';
      return;
    }

    list.innerHTML = rows.slice(0,6).map(r=>{
      const direction = r.diff > 0
        ? 'ERPCO presenta un importe mayor que JDE.'
        : 'JDE presenta un importe mayor que ERPCO.';
      return `
        <article class="attention-card">
          <div class="attention-head">
            <div>
              <strong>⚠️ ${r.name}</strong>
              <div class="attention-meta">${r.brand} · ${r.key}</div>
            </div>
            <div class="attention-diff">${moneyV6(Math.abs(r.diff))}</div>
          </div>
          <div class="attention-diagnosis">
            JDE: <b>${moneyV6(r.jde)}</b> · ERPCO: <b>${moneyV6(r.erpco)}</b><br>
            ${direction} Se recomienda revisar movimientos pendientes de aplicación.
          </div>
        </article>`;
    }).join('');
  }

  function renderBrandExecutiveV6(){
    const tbody = document.getElementById('brandExecutiveBody');
    if (!tbody) return;
    const rows = getRowsV6().map(normalizeRowV6);
    const brands = ['ADO','AAO','TRT'];
    const html = brands.map(brand=>{
      const b = rows.filter(r=>r.brand===brand);
      if (!b.length) return '';
      const total = b.length;
      const ok = b.filter(r=>r.squared).length;
      const bad = total-ok;
      const diff = b.reduce((s,r)=>s+Math.abs(r.diff),0);
      const pct = total ? (ok/total*100) : 0;
      const cls = pct>=98?'pct-good':pct>=90?'pct-warn':'pct-bad';
      return `<tr>
        <td class="brand-name">${brand}</td>
        <td>${total}</td>
        <td>${ok}</td>
        <td>${bad}</td>
        <td>${moneyV6(diff)}</td>
        <td class="${cls}">${pct.toFixed(2)}%</td>
      </tr>`;
    }).join('');
    tbody.innerHTML = html || '<tr><td colspan="6">Sin datos procesados.</td></tr>';
  }

  function refreshExecutiveV6(){
    renderAttentionV6();
    renderBrandExecutiveV6();
  }

  // Observe DOM/data refreshes and update executive widgets.
  const observer = new MutationObserver(()=>{
    clearTimeout(window.__v6RefreshTimer);
    window.__v6RefreshTimer = setTimeout(refreshExecutiveV6,120);
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const btn = document.getElementById('presentationModeBtn');
    if (btn){
      btn.addEventListener('click',()=>{
        document.body.classList.toggle('executive-mode');
      });
    }
    refreshExecutiveV6();
    observer.observe(document.body,{subtree:true,childList:true,characterData:false});
  });

  window.refreshExecutiveV6 = refreshExecutiveV6;
})();


/* =========================================================
   V7 · CENTRO DE RESOLUCIÓN Y CIERRE
   Mantiene intacto el motor de conciliación.
   ========================================================= */
(function(){
  const STORAGE_KEY = 'concilia_v7_resolution';
  const CLOSURE_KEY = 'concilia_v7_closure';

  function getRowsV7(){
    if (typeof getRowsV6 === 'function') return getRowsV6();
    if (Array.isArray(window.results)) return window.results;
    if (Array.isArray(window.resultados)) return window.resultados;
    if (Array.isArray(window.conciliationRows)) return window.conciliationRows;
    if (Array.isArray(window.conciliacion)) return window.conciliacion;
    return [];
  }

  function normalizeV7(r){
    const brand = String(r.brand || r.marca || r.MARCA || 'ADO').toUpperCase();
    const name = r.name || r.nombre || r.NOMBRE || r.conductor || 'Sin nombre';
    const key = String(r.key || r.clave || r.CLAVE || r.employee || r.empleado || '');
    const diffRaw = r.diff ?? r.diferencia ?? r.DIFERENCIA ?? r.difference ?? 0;
    const diff = Number(String(diffRaw).replace(/[$,\s]/g,'')) || 0;
    const jdeRaw = r.jde ?? r.JDE ?? r.totalJde ?? r.total_jde ?? 0;
    const erpcoRaw = r.erpco ?? r.ERPCO ?? r.saldos ?? r.totalErpco ?? r.total_erpco ?? 0;
    const jde = Number(String(jdeRaw).replace(/[$,\s]/g,'')) || 0;
    const erpco = Number(String(erpcoRaw).replace(/[$,\s]/g,'')) || 0;
    const squared = Math.abs(diff) < 0.01 || /cuadr/i.test(String(r.status || r.estatus || ''));
    return {brand,name,key,diff,jde,erpco,squared};
  }

  function moneyV7(n){
    return Number(n||0).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
  }

  function loadResolution(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e){ return {}; }
  }

  function saveResolution(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function caseId(r){
    return [r.brand,r.key,r.name].join('|');
  }

  function renderResolutionV7(){
    const host = document.getElementById('resolutionCases');
    if (!host) return;
    const store = loadResolution();
    const rows = getRowsV7().map(normalizeV7).filter(r=>!r.squared);

    if (!rows.length){
      host.innerHTML = '<div class="empty-attention">🎉 No hay diferencias pendientes. La conciliación puede pasar a cierre.</div>';
      updateResolutionProgressV7([]);
      return;
    }

    host.innerHTML = rows.map(r=>{
      const id = caseId(r);
      const saved = store[id] || {status:'Pendiente',note:''};
      return `
        <article class="resolution-case" data-case-id="${id.replace(/"/g,'&quot;')}">
          <div class="resolution-case-head">
            <div class="resolution-case-title">
              <strong>⚠️ ${r.name}</strong>
              <small>${r.brand} · ${r.key}</small>
            </div>
            <div class="resolution-case-amount">Descuadre: ${moneyV7(Math.abs(r.diff))}</div>
          </div>
          <div class="resolution-case-body">
            <div>
              <div>JDE: <b>${moneyV7(r.jde)}</b></div>
              <div>ERPCO: <b>${moneyV7(r.erpco)}</b></div>
              <div style="margin-top:8px;color:var(--muted,#94a3b8);font-size:.82rem;">
                ${r.diff>0?'ERPCO presenta un saldo mayor que JDE.':'JDE presenta un saldo mayor que ERPCO.'}
              </div>
            </div>
            <div>
              <label style="display:block;font-size:.76rem;margin-bottom:5px;">Estatus de seguimiento</label>
              <select class="resolution-status">
                ${['Pendiente','En revisión','Justificada','Corregida'].map(s=>`<option ${saved.status===s?'selected':''}>${s}</option>`).join('')}
              </select>
              <label style="display:block;font-size:.76rem;margin:10px 0 5px;">Observación</label>
              <textarea class="resolution-note" placeholder="Ej. Movimiento pendiente de aplicación...">${saved.note||''}</textarea>
              <div class="resolution-actions">
                <button class="secondary resolution-save" type="button">💾 Guardar seguimiento</button>
              </div>
            </div>
          </div>
        </article>`;
    }).join('');

    host.querySelectorAll('.resolution-save').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const card = btn.closest('.resolution-case');
        const id = card.dataset.caseId;
        const status = card.querySelector('.resolution-status').value;
        const note = card.querySelector('.resolution-note').value.trim();
        const data = loadResolution();
        data[id] = {status,note,updatedAt:new Date().toISOString()};
        saveResolution(data);
        renderResolutionV7();
      });
    });

    updateResolutionProgressV7(rows);
  }

  function updateResolutionProgressV7(rows){
    const store = loadResolution();
    const counts = {Pendiente:0,'En revisión':0,Justificada:0,Corregida:0};
    rows.forEach(r=>{
      const item = store[caseId(r)] || {status:'Pendiente'};
      counts[item.status] = (counts[item.status]||0)+1;
    });

    const total = rows.length;
    const done = (counts.Justificada||0)+(counts.Corregida||0);
    const pct = total ? Math.round(done/total*100) : 100;

    const map = {
      resolutionPending:counts.Pendiente||0,
      resolutionReviewing:counts['En revisión']||0,
      resolutionJustified:counts.Justificada||0,
      resolutionCorrected:counts.Corregida||0
    };
    Object.entries(map).forEach(([id,val])=>{
      const el=document.getElementById(id); if(el) el.textContent=val;
    });
    const t=document.getElementById('resolutionProgressText'); if(t) t.textContent=pct+'%';
    const b=document.getElementById('resolutionProgressBar'); if(b) b.style.width=pct+'%';
  }

  function getBrandsV7(){
    return [...new Set(getRowsV7().map(normalizeV7).map(r=>r.brand))].filter(Boolean);
  }

  function getCurrentUserV7(){
    const candidates = [
      window.currentUserName,
      window.usuarioActual,
      window.currentUser,
      document.querySelector('[data-user-name]')?.textContent,
      document.querySelector('.user-name')?.textContent
    ].filter(Boolean);
    return String(candidates[0] || 'Usuario actual').trim();
  }

  function createFolioV7(){
    const brands = getBrandsV7();
    const brandPart = brands.length===1 ? brands[0] : 'MULTI';
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `CON-${brandPart}-${y}${m}${day}-${hh}${mm}`;
  }

  function closeConciliationV7(){
    const rows = getRowsV7().map(normalizeV7);
    if (!rows.length){
      alert('Primero procesa una conciliación antes de cerrarla.');
      return;
    }
    const differences = rows.filter(r=>!r.squared);
    const store = loadResolution();
    const unresolved = differences.filter(r=>{
      const st=(store[caseId(r)]||{status:'Pendiente'}).status;
      return !['Justificada','Corregida'].includes(st);
    });

    const warning = unresolved.length
      ? `Aún hay ${unresolved.length} diferencia(s) pendientes o en revisión. ¿Deseas cerrar de todos modos?`
      : 'Todos los casos están resueltos o justificados. ¿Deseas cerrar la conciliación?';

    if (!confirm(warning)) return;

    const closure = {
      folio:createFolioV7(),
      closedAt:new Date().toISOString(),
      user:getCurrentUserV7(),
      brands:getBrandsV7(),
      total:rows.length,
      squared:rows.filter(r=>r.squared).length,
      differences:differences.length,
      unresolved:unresolved.length,
      differenceAmount:differences.reduce((s,r)=>s+Math.abs(r.diff),0)
    };
    localStorage.setItem(CLOSURE_KEY, JSON.stringify(closure));
    renderClosureV7();
  }

  function renderClosureV7(){
    let closure=null;
    try{ closure=JSON.parse(localStorage.getItem(CLOSURE_KEY)||'null'); }catch(e){}
    const rows=getRowsV7().map(normalizeV7);

    const folio=document.getElementById('closureFolio');
    const user=document.getElementById('closureUser');
    const brands=document.getElementById('closureBrands');
    const finalStatus=document.getElementById('closureFinalStatus');
    const badge=document.getElementById('closureStatusBadge');
    const msg=document.getElementById('closureMessage');
    const download=document.getElementById('downloadClosureBtn');

    if (user) user.textContent=getCurrentUserV7();
    if (brands) brands.textContent=getBrandsV7().join(' · ') || '—';

    if (!closure){
      if (folio) folio.textContent='Pendiente';
      if (finalStatus) finalStatus.textContent=rows.length?'En proceso':'Sin conciliación';
      if (badge){badge.textContent='ABIERTA';badge.className='closure-status-badge open';}
      if (download) download.disabled=true;
      if (msg) msg.textContent='La conciliación permanecerá abierta hasta que decidas cerrarla.';
      return;
    }

    if (folio) folio.textContent=closure.folio;
    if (user) user.textContent=closure.user;
    if (brands) brands.textContent=(closure.brands||[]).join(' · ');
    if (finalStatus) finalStatus.textContent=closure.unresolved===0?'Cerrada y resuelta':'Cerrada con pendientes';
    if (badge){badge.textContent='CERRADA';badge.className='closure-status-badge closed';}
    if (download) download.disabled=false;
    if (msg){
      msg.innerHTML=`✅ Conciliación cerrada con folio <b>${closure.folio}</b>. 
      Conductores analizados: <b>${closure.total}</b> · Cuadrados: <b>${closure.squared}</b> · 
      Diferencias: <b>${closure.differences}</b> · Pendientes al cierre: <b>${closure.unresolved}</b>.`;
    }
  }

  function downloadClosureReportV7(){
    let closure=null;
    try{ closure=JSON.parse(localStorage.getItem(CLOSURE_KEY)||'null'); }catch(e){}
    if (!closure) return;

    const rows=getRowsV7().map(normalizeV7);
    const store=loadResolution();
    const lines=[];
    lines.push('CONCIL.IA - INFORME DE CIERRE');
    lines.push('');
    lines.push(`Folio: ${closure.folio}`);
    lines.push(`Responsable: ${closure.user}`);
    lines.push(`Fecha de cierre: ${new Date(closure.closedAt).toLocaleString('es-MX')}`);
    lines.push(`Marcas: ${(closure.brands||[]).join(', ')}`);
    lines.push('');
    lines.push(`Conductores analizados: ${closure.total}`);
    lines.push(`Cuadrados: ${closure.squared}`);
    lines.push(`Con diferencias: ${closure.differences}`);
    lines.push(`Pendientes al cierre: ${closure.unresolved}`);
    lines.push(`Monto total de diferencias: ${moneyV7(closure.differenceAmount)}`);
    lines.push('');
    lines.push('DETALLE DE DIFERENCIAS');
    rows.filter(r=>!r.squared).forEach(r=>{
      const s=store[caseId(r)]||{status:'Pendiente',note:''};
      lines.push(`${r.brand} | ${r.key} | ${r.name} | JDE ${moneyV7(r.jde)} | ERPCO ${moneyV7(r.erpco)} | DIF ${moneyV7(r.diff)} | ${s.status} | ${s.note||''}`);
    });

    const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`INFORME_CIERRE_${closure.folio}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function refreshV7(){
    renderResolutionV7();
    renderClosureV7();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('closeConciliationBtn')?.addEventListener('click',closeConciliationV7);
    document.getElementById('downloadClosureBtn')?.addEventListener('click',downloadClosureReportV7);
    refreshV7();

    const obs=new MutationObserver(()=>{
      clearTimeout(window.__v7Timer);
      window.__v7Timer=setTimeout(refreshV7,180);
    });
    obs.observe(document.body,{childList:true,subtree:true});
  });

  window.refreshV7=refreshV7;
})();


/* =========================================================
   V7.1 · EXECUTIVE LOGIN INTERACTIONS
   ========================================================= */
(function(){
  function initExecutiveLoginV71(){
    const userSelect =
      document.querySelector('#loginUser') ||
      document.querySelector('#usuario') ||
      document.querySelector('select[name="usuario"]') ||
      document.querySelector('select[name="user"]') ||
      document.querySelector('.login-card select');

    const greeting = document.getElementById('loginDynamicGreeting');

    if(userSelect && greeting){
      const updateGreeting = ()=>{
        const opt = userSelect.options[userSelect.selectedIndex];
        const txt = (opt && opt.textContent || '').trim();
        if(!userSelect.value || /selecciona/i.test(txt)){
          greeting.textContent = 'Selecciona tu usuario para continuar.';
        }else{
          const first = txt.split(/\s+/)[0];
          greeting.textContent = `👋 Hola ${first}, ingresa tu contraseña para continuar.`;
        }
      };
      userSelect.addEventListener('change',updateGreeting);
      updateGreeting();
    }

    const toggle = document.getElementById('toggleLoginPassword');
    if(toggle){
      const pwd =
        document.querySelector('.password-field-wrap input') ||
        document.querySelector('input[type="password"]');
      if(pwd){
        toggle.addEventListener('click',()=>{
          const visible = pwd.type === 'text';
          pwd.type = visible ? 'password' : 'text';
          toggle.textContent = visible ? '👁' : '🙈';
          toggle.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        });
      }
    }
  }

  document.addEventListener('DOMContentLoaded',initExecutiveLoginV71);
})();
