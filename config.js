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
